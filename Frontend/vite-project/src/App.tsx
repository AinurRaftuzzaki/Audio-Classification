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

  // Refs untuk menjaga instance API tetap hidup tanpa memicu re-render
  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  
  const bufferChunkRef = useRef<Float32Array[]>([]);
  const safeCountRef = useRef<number>(0);
  const lastAlertTimeRef = useRef<number>(0);

  const SAMPLE_RATE = 22050;
  const AUDIO_DURATION_SEC = 1; // Jendela waktu 1 detik
  const CHUNK_SIZE = SAMPLE_RATE * AUDIO_DURATION_SEC; // 22.050 sampel

  const playAlarm = useCallback((severity: 'biasa' | 'banget') => {
    const now = Date.now();

    try {
      if (severity === 'banget') {
        // ALARM LEVEL 2 (BERISIK BANGET): Sirine Sawtooth tajam (900Hz -> 450Hz)
        if (now - lastAlertTimeRef.current < 600) return;
        lastAlertTimeRef.current = now;

        const ctx = audioCtxRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(900, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(450, ctx.currentTime + 0.3);

        gain.gain.setValueAtTime(0.6, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } else {
        // ALARM LEVEL 1 (BERISIK BIASA): Jeda 1 detik (1000 ms)
        if (now - lastAlertTimeRef.current < 1000) return;
        lastAlertTimeRef.current = now;

        const ctx = audioCtxRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle'; 
        osc.frequency.setValueAtTime(650, ctx.currentTime);
        osc.frequency.setValueAtTime(480, ctx.currentTime + 0.2);

        gain.gain.setValueAtTime(0.35, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      }
    } catch (e) {
      console.error("[Buzzer] Terjadi kesalahan saat membunyikan alarm:", e);
    }
  }, []);

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
      
      // 1. Inisialisasi WebSocket dengan proteksi error & parsing
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsHost = window.location.port === '5173' ? '127.0.0.1:8000' : window.location.host;
      const ws = new WebSocket(`${wsProtocol}//${wsHost}/ws/audio`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WebSocket] Terhubung ke server audio.');
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

          if (data.label === 'berisik') {
            safeCountRef.current = 0; // Reset pendingin

            // Turunkan threshold RMS ke 0.035 (sesuai log mikrofonmu yang di kisaran 0.0267)
            // ATAU jika confidence model sangat yakin (>= 75%) dan RMS minimal 0.025
            const rmsVal = data.features.rms;
            const isVeryNoisy = rmsVal >= 0.035 || (data.confidence >= 0.75 && rmsVal >= 0.025);
            
            const severityLevel = isVeryNoisy ? 'banget' : 'biasa';
            const statusLabel = isVeryNoisy ? 'berisik_banget' : 'berisik_biasa';

            setCurrentLabel(statusLabel);
            setCurrentConfidence(data.confidence);
            playAlarm(severityLevel);
            addLog(statusLabel, data.confidence, rmsVal);
          } else {
            safeCountRef.current += 1;
            // Cooldown 1 detik: Langsung matikan alarm & ubah status setelah 1x respons aman
            if (safeCountRef.current >= 1) {
              setCurrentLabel('non_berisik');
              setCurrentConfidence(data.confidence);
              addLog('non_berisik', data.confidence, data.features.rms);
            }
          }
        } catch (parseError) {
          console.error('[WebSocket] Gagal mem-parse respon JSON:', parseError);
        }
      };

      // 2. Inisialisasi Mikrofon (Web Audio API)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;
      
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: SAMPLE_RATE });
      audioCtxRef.current = audioCtx;
      
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
        
        // Update Visualizer
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteTimeDomainData(dataArray);
        setAudioData(dataArray);

        // Kirim setiap 1 Detik (saat mencapai CHUNK_SIZE = 22.050 sampel)
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
      console.error("Gagal memulai monitoring:", error);
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
    safeCountRef.current = 0;

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
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
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
      stopMonitoring(); // Cleanup saat unmount
    };
  }, []);

  return (
    <div className="dashboard-container">
      <Header status={connectionStatus} isMonitoring={isMonitoring} onToggleMonitoring={handleToggleMonitoring} />
      
      <main className="dashboard-main-grid" style={{ marginTop: '24px', gap: '24px' }}>
        <section className="dashboard-left-col" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <StatusCard label={currentLabel} confidence={currentConfidence} isMonitoring={isMonitoring} />
          <AudioVisualizer audioData={audioData} isMonitoring={isMonitoring} />
        </section>
        <section className="dashboard-right-col" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <MetricsCard features={currentFeatures} />
          <DetectionLog logs={logs} onClearLogs={() => setLogs([])} />
        </section>
      </main>
    </div>
  );
}

export default App;