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
  const CHUNK_SIZE = SAMPLE_RATE * 1; // 1 Detik

  // Generator Suara Buzzer
  const playAlarm = useCallback(() => {
    const now = Date.now();
    if (now - lastAlertTimeRef.current < 1000) return;
    lastAlertTimeRef.current = now;

    try {
      const ctx = audioCtxRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(900, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(450, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {
      console.error("Buzzer error:", e);
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
      
      // 1. Inisialisasi WebSocket
      const ws = new WebSocket('ws://127.0.0.1:8000/ws/audio');
      wsRef.current = ws;

      ws.onopen = () => setConnectionStatus('connected');
      ws.onclose = () => {
        setConnectionStatus('disconnected');
        stopMonitoring();
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.error) return;

        setCurrentFeatures(data.features);

        if (data.label === 'berisik') {
          safeCountRef.current = 0; // Reset pendingin
          setCurrentLabel('berisik');
          setCurrentConfidence(data.confidence);
          playAlarm();
          addLog('berisik', data.confidence, data.features.rms);
        } else {
          safeCountRef.current += 1;
          // Cooldown: Matikan alarm hanya jika 3 detik berturut-turut aman
          if (safeCountRef.current >= 3) {
            setCurrentLabel('non_berisik');
            setCurrentConfidence(data.confidence);
            addLog('non_berisik', data.confidence, data.features.rms);
          }
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

        // Kirim setiap 1 Detik
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
      <main className="dashboard-main-grid" style={{ marginTop: '20px' }}>
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