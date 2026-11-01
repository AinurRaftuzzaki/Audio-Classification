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
      const wsHost = window.location.port !== '8000' ? '127.0.0.1:8000' : window.location.host;
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
          
          let displayLabel = 'non_berisik';
          let displayConfidence = 5;

          // 1. Filter mutlak untuk hening / kipas pelan
          if (rmsVal < 0.008) {
            noisyStreakRef.current = 0;
            displayLabel = 'non_berisik';
            displayConfidence = Math.round((rmsVal / 0.008) * 10);
          } 
          // 2. Jika model mendeteksi suara 'berisik'
          else if (rfLabel === 'berisik') {
            noisyStreakRef.current += 1;
            
            // Butuh 3 detik berturut-turut (streak >= 3) untuk memicu alarm bahaya MP3
            if (noisyStreakRef.current >= 3) {
              displayLabel = 'berisik_banget';
              displayConfidence = 85 + Math.min(15, noisyStreakRef.current * 2);
            } else {
              displayLabel = 'berisik_biasa';
              displayConfidence = 25 + (noisyStreakRef.current * 10);
            }
          } 
          // 3. Jika model mendeteksi 'non_berisik'
          else {
            noisyStreakRef.current = 0;
            displayLabel = 'non_berisik';
            displayConfidence = 15;
          }

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