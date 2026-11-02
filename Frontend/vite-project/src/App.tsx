import { useState, useRef, useEffect, useCallback } from 'react';
import type { ConnectionStatus, AudioFeatures, DetectionLogItem } from './types/audio';
import { Header } from './components/Header';
import { StatusCard } from './components/StatusCard';
import { MetricsCard } from './components/MetricsCard';
import { AudioVisualizer } from './components/AudioVisualizer';
import { DetectionLog } from './components/DetectionLog';
import './App.css';

export function App() {
  const [isMonitoring, setIsMonitoring] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [currentLabel, setCurrentLabel] = useState<string | undefined>(undefined);
  const [currentConfidence, setCurrentConfidence] = useState<number | undefined>(undefined);
  const [currentFeatures, setCurrentFeatures] = useState<AudioFeatures | undefined>(undefined);
  const [audioData, setAudioData] = useState<Uint8Array | undefined>(undefined);
  const [logs, setLogs] = useState<DetectionLogItem[]>([]);
  const [isTestingAlarm, setIsTestingAlarm] = useState<boolean>(false);

  // Refs untuk menjaga instance API tetap hidup tanpa memicu re-render
  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  
  const bufferChunkRef = useRef<Float32Array[]>([]);
  const lastAlertTimeRef = useRef<number>(0);
  const noisyStreakRef = useRef<number>(0);
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);

  const SAMPLE_RATE = 22050;
  const AUDIO_DURATION_SEC = 1; // Evaluasi per 1 detik
  const CHUNK_SIZE = SAMPLE_RATE * AUDIO_DURATION_SEC; // 22.050 sampel

  // Menghentikan audio alarm MP3 jika sedang berbunyi
  const stopAlarmSound = useCallback(() => {
    if (alarmAudioRef.current && !alarmAudioRef.current.paused) {
      alarmAudioRef.current.pause();
      alarmAudioRef.current.currentTime = 0;
    }
  }, []);

  // Memutar alarm berdasarkan tingkat keparahan
  const playAlarm = useCallback((severity: 'biasa' | 'banget') => {
    const now = Date.now();

    try {
      if (severity === 'banget') {
        // ALARM LEVEL 2 (BERISIK BANGET): Putar audio peringatan ringkas
        if (!alarmAudioRef.current) {
          alarmAudioRef.current = new Audio('/alarm-bahaya.mp3');
        }
        const audio = alarmAudioRef.current;
        audio.loop = false;
        if (audio.paused) {
          audio.currentTime = 0;
          audio.volume = 1.0;
          audio.play().catch(err => console.warn('[Alarm Audio Play Error]:', err));
        }
      } else {
        // ALARM LEVEL 1 (BERISIK BIASA): Beep lembut 1x via Web Audio oscillator
        if (now - lastAlertTimeRef.current < 1500) return;
        lastAlertTimeRef.current = now;

        const ctx = audioCtxRef.current || new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.setValueAtTime(400, ctx.currentTime + 0.2);

        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      console.warn('[Buzzer] Error:', e);
    }
  }, []);

  // Tombol tes alarm di Header
  const handleTestAlarm = () => {
    if (isTestingAlarm) {
      stopAlarmSound();
      setIsTestingAlarm(false);
    } else {
      if (!alarmAudioRef.current) {
        alarmAudioRef.current = new Audio('/alarm-bahaya.mp3');
      }
      const audio = alarmAudioRef.current;
      audio.loop = false;
      audio.currentTime = 0;
      audio.volume = 1.0;
      audio.onended = () => {
        setIsTestingAlarm(false);
      };
      audio.play().then(() => {
        setIsTestingAlarm(true);
      }).catch(err => {
        console.warn('[Alarm Test Error]:', err);
      });
    }
  };

  const addLog = useCallback((label: string, confidence: number, rms: number) => {
    const newLog: DetectionLogItem = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      label,
      confidence,
      rms
    };
    setLogs(prev => [newLog, ...prev].slice(0, 50));
  }, []);

  const startMonitoring = async () => {
    try {
      setConnectionStatus('connecting');
      noisyStreakRef.current = 0;
      
      // Inisialisasi koneksi WebSocket
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      // Jika di localhost dan bukan container FastAPI (8000/8009), sambungkan ke backend di 127.0.0.1:8000
      const isLocalDevServer = isLocal && window.location.port !== '8000' && window.location.port !== '8009';
      const wsHost = isLocalDevServer ? '127.0.0.1:8000' : window.location.host;
      const ws = new WebSocket(`${wsProtocol}//${wsHost}/ws/audio`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WebSocket] Terhubung ke server backend.');
        setConnectionStatus('connected');
      };

      ws.onerror = (err) => {
        console.error('[WebSocket] Kesalahan koneksi:', err);
        setConnectionStatus('error');
      };

      ws.onclose = (event) => {
        console.warn('[WebSocket] Koneksi ditutup. Kode:', event.code);
        setConnectionStatus('disconnected');
        stopMonitoring();
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.error) {
            console.warn('[Server Warning]:', data.error);
            return;
          }

          setCurrentFeatures(data.features);
          const rmsVal = data.features?.rms ?? 0;
          const rfLabel = data.label; // 'berisik' atau 'non_berisik' dari backend
          const modelConfidence = typeof data.confidence === 'number'
            ? Math.round(data.confidence)
            : 90;

          // 1. Probabilitas kebisingan dari Model Random Forest (0% - 100%)
          const modelNoisyProb = rfLabel === 'berisik' 
            ? modelConfidence 
            : Math.max(0, 100 - modelConfidence);

          // 2. Intensitas energi suara fisik dari mikrofon (RMS) diskalakan secara responsif (0% - 100%)
          const rmsScore = Math.min(100, Math.round((rmsVal / 0.045) * 80));

          // 3. Gabungkan sinyal model AI (55%) dan intensitas fisik RMS (45%) agar bergerak dinamis & responsif
          let noiseLevel: number;
          if (rmsVal < 0.005) {
            // Hening total: bergerak alami antara 2% - 12%
            noiseLevel = Math.max(2, Math.min(12, Math.round((rmsVal / 0.005) * 10)));
          } else {
            const blended = Math.round(0.55 * modelNoisyProb + 0.45 * rmsScore);
            noiseLevel = Math.max(5, Math.min(100, blended));
          }

          // 4. Klasifikasi Kategori & Alarm:
          let displayLabel = 'non_berisik';

          // TENANG / AMAN: < 25% dan RMS rendah
          if (noiseLevel < 25 && rmsVal < 0.015) {
            noisyStreakRef.current = 0;
            displayLabel = 'non_berisik';
          } 
          // BAHAYA / SANGAT BERISIK: >= 75% atau streak berisik >= 3 detik atau suara keras (RMS >= 0.04)
          else if (noiseLevel >= 75 || noisyStreakRef.current >= 3 || rmsVal >= 0.040) {
            noisyStreakRef.current += 1;
            displayLabel = 'berisik_banget';
          } 
          // KEBISINGAN SEDANG / PERHATIAN: 25% - 74%
          else {
            noisyStreakRef.current += 1;
            displayLabel = 'berisik_biasa';
          }

          const displayConfidence = noiseLevel;

          // Eksekusi status UI & Alarm
          setCurrentLabel(displayLabel);
          setCurrentConfidence(displayConfidence);

          if (displayLabel === 'berisik_banget') {
            playAlarm('banget');
          } else if (displayLabel === 'berisik_biasa') {
            stopAlarmSound();
            playAlarm('biasa');
          } else {
            stopAlarmSound();
          }

          addLog(displayLabel, displayConfidence, rmsVal);

        } catch (parseError) {
          console.warn('[WebSocket] Gagal parse data:', parseError);
        }
      };

      // Matikan autoGainControl agar suara lingkungan/kipas tidak diperkuat otomatis
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
        video: false,
      });
      streamRef.current = stream;
      
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)({ sampleRate: SAMPLE_RATE });
      audioCtxRef.current = audioCtx;
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      source.connect(analyser);

      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      source.connect(processor);
      processor.connect(audioCtx.destination);

      bufferChunkRef.current = [];

      processor.onaudioprocess = (e) => {
        if (ws.readyState !== WebSocket.OPEN) return;
        const inputData = e.inputBuffer.getChannelData(0);
        bufferChunkRef.current.push(new Float32Array(inputData));
        
        const totalLength = bufferChunkRef.current.reduce((acc, val) => acc + val.length, 0);
        
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteTimeDomainData(dataArray);
        setAudioData(dataArray);

        // Kirim saat mencapai 1 detik audio (CHUNK_SIZE = 22.050 sampel)
        if (totalLength >= CHUNK_SIZE) {
          const mergedBuffer = new Float32Array(totalLength);
          let offset = 0;
          for (const chunk of bufferChunkRef.current) {
            mergedBuffer.set(chunk, offset);
            offset += chunk.length;
          }
          ws.send(mergedBuffer.buffer);
          bufferChunkRef.current = [];
        }
      };

      setIsMonitoring(true);
    } catch (error) {
      console.error('Gagal memulai monitoring:', error);
      setConnectionStatus('disconnected');
      setIsMonitoring(false);
    }
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    setConnectionStatus('disconnected');
    setCurrentLabel(undefined);
    setCurrentConfidence(undefined);
    setCurrentFeatures(undefined);
    setAudioData(undefined);
    noisyStreakRef.current = 0;
    stopAlarmSound();
    setIsTestingAlarm(false);

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(console.warn);
      audioCtxRef.current = null;
    }
  };

  const handleToggleMonitoring = () => {
    if (isMonitoring) {
      stopMonitoring();
    } else {
      startMonitoring();
    }
  };

  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, []);

  return (
    <div className="dashboard-container">
      <Header
        status={connectionStatus}
        isMonitoring={isMonitoring}
        onToggleMonitoring={handleToggleMonitoring}
        isTestingAlarm={isTestingAlarm}
        onTestAlarm={handleTestAlarm}
      />
      
      <main className="dashboard-main-grid">
        <section className="dashboard-left-col">
          <StatusCard label={currentLabel} confidence={currentConfidence} isMonitoring={isMonitoring} />
          <AudioVisualizer audioData={audioData} isMonitoring={isMonitoring} />
        </section>
        <section className="dashboard-right-col">
          <MetricsCard features={currentFeatures} />
          <DetectionLog logs={logs} onClearLogs={() => setLogs([])} />
        </section>
      </main>
    </div>
  );
}

export default App;