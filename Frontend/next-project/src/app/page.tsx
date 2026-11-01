"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import type { ConnectionStatus, AudioFeatures, DetectionLogItem } from '../types/audio';
import { Header } from '../components/Header';
import { StatusCard } from '../components/StatusCard';
import { MetricsCard } from '../components/MetricsCard';
import { AudioVisualizer } from '../components/AudioVisualizer';
import { DetectionLog } from '../components/DetectionLog';

export default function Home() {
  const [isMonitoring, setIsMonitoring] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [currentLabel, setCurrentLabel] = useState<string | undefined>(undefined);
  const [currentConfidence, setCurrentConfidence] = useState<number | undefined>(undefined);
  const [currentFeatures, setCurrentFeatures] = useState<AudioFeatures | undefined>(undefined);
  const [audioData, setAudioData] = useState<Uint8Array | undefined>(undefined);
  const [logs, setLogs] = useState<DetectionLogItem[]>([]);
  const [isTestingAlarm, setIsTestingAlarm] = useState<boolean>(false);

  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);
  const isAlarmActiveRef = useRef<boolean>(false);
  const alarmCooldownUntilRef = useRef<number>(0);
  
  const bufferChunkRef = useRef<Float32Array[]>([]);
  const lastAlertTimeRef = useRef<number>(0);

  // Variabel untuk menjinakkan model Random Forest
  const noisyStreakRef = useRef<number>(0);

  const SAMPLE_RATE = 22050;
  const AUDIO_DURATION_SEC = 1; // Evaluasi per 1 detik
  const CHUNK_SIZE = SAMPLE_RATE * AUDIO_DURATION_SEC;

  const stopAlarmSound = useCallback((force = false) => {
    if (alarmAudioRef.current) {
      if (force) {
        alarmAudioRef.current.pause();
        alarmAudioRef.current.currentTime = 0;
        alarmAudioRef.current.loop = false;
        isAlarmActiveRef.current = false;
        setIsTestingAlarm(false);
        alarmCooldownUntilRef.current = 0;
      } else {
        alarmAudioRef.current.loop = false;
        isAlarmActiveRef.current = false;
      }
    }
  }, []);

  const playAlarm = useCallback((severity: 'biasa' | 'banget') => {
    const now = Date.now();

    try {
      if (severity === 'banget') {
        // Anti Infinite Loop: Jika masih dalam periode jeda/cooldown alarm, jangan bunyikan lagi
        if (now < alarmCooldownUntilRef.current) return;
        
        // Cooldown 6,5 detik (durasi suara 3,8 detik + 2,7 detik masa tenang untuk mencegah mic menangkap suara speaker)
        alarmCooldownUntilRef.current = now + 6500;

        if (!alarmAudioRef.current) {
          alarmAudioRef.current = new Audio('/alarm-jangan-berisik.mp3');
          alarmAudioRef.current.onended = () => {
            isAlarmActiveRef.current = false;
            setIsTestingAlarm(false);
          };
        }
        const audio = alarmAudioRef.current;
        audio.loop = false; // TIDAK BOLEH infinite loop!
        audio.volume = 0.35; // Volume lembut, tidak memekakkan telinga atau mengumpan balik ke mikrofon
        
        audio.currentTime = 0;
        audio.play().catch(console.warn);
        isAlarmActiveRef.current = true;
      } else {
        // Berisik Biasa: Beep pelan 1x (hanya jika tidak sedang cooldown)
        if (now < alarmCooldownUntilRef.current) return;
        if (now - lastAlertTimeRef.current < 2000) return;
        lastAlertTimeRef.current = now;

        const ctx = audioCtxRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle'; 
        osc.frequency.setValueAtTime(550, ctx.currentTime);
        osc.frequency.setValueAtTime(400, ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.12, ctx.currentTime); // Volume beep lebih lembut
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {
      console.warn("[Alarm] Error:", e);
    }
  }, []);

  const handleTestAlarm = useCallback(() => {
    if (isTestingAlarm) {
      stopAlarmSound(true);
    } else {
      if (!alarmAudioRef.current) {
        alarmAudioRef.current = new Audio('/alarm-jangan-berisik.mp3');
        alarmAudioRef.current.onended = () => {
          setIsTestingAlarm(false);
          isAlarmActiveRef.current = false;
        };
      }
      const audio = alarmAudioRef.current;
      audio.loop = false;
      audio.volume = 0.35;
      audio.currentTime = 0;
      audio.play().then(() => {
        setIsTestingAlarm(true);
      }).catch(console.warn);
    }
  }, [isTestingAlarm, stopAlarmSound]);

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
      noisyStreakRef.current = 0; // Reset streak
      
      const ws = new WebSocket('ws://127.0.0.1:8000/ws/audio');
      wsRef.current = ws;

      ws.onopen = () => setConnectionStatus('connected');
      ws.onerror = () => setConnectionStatus('error');
      ws.onclose = () => {
        setConnectionStatus('disconnected');
        stopMonitoring();
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.error) return;

          setCurrentFeatures(data.features);
          const rmsVal = data.features.rms || 0;
          const rfLabel = data.label; // 'berisik' atau 'non_berisik' dari backend
          const now = Date.now();
          const isCoolingDown = now < alarmCooldownUntilRef.current;
          
          let displayLabel = 'non_berisik';
          let displayConfidence = 5;

          // 1. Proteksi Anti Infinite Loop: Jika alarm sedang atau baru saja bersuara, jangan re-trigger suara sendiri
          if (isCoolingDown) {
             noisyStreakRef.current = 0;
             displayLabel = 'berisik_banget';
             displayConfidence = 90;
          }
          // 2. Filter mutlak untuk Hening / Suara Kipas Pelan
          else if (rmsVal < 0.008) {
             noisyStreakRef.current = 0; // Langsung potong antrean berisik
             displayLabel = 'non_berisik';
             displayConfidence = Math.round((rmsVal / 0.008) * 10);
          } 
          // 3. Jika Random Forest menebak 'berisik'
          else if (rfLabel === 'berisik') {
             noisyStreakRef.current += 1; // Tambah antrean
             
             // Pemicuan alarm suara: jika streak >= 2 (bising berkelanjutan) atau volume cukup tinggi
             if (noisyStreakRef.current >= 2 || rmsVal > 0.02) {
                 displayLabel = 'berisik_banget';
                 displayConfidence = 85 + Math.min(15, noisyStreakRef.current * 2);
             } else {
                 displayLabel = 'berisik_biasa';
                 displayConfidence = 35 + (noisyStreakRef.current * 10);
             }
          } 
          // 4. Jika Random Forest menebak 'non_berisik'
          else {
             noisyStreakRef.current = 0;
             displayLabel = 'non_berisik';
             displayConfidence = 15;
          }

          // --- EKSEKUSI UI & ALARM ---
          setCurrentLabel(displayLabel);
          setCurrentConfidence(displayConfidence);

          if (!isCoolingDown) {
            if (displayLabel === 'berisik_banget') {
               playAlarm('banget');
            } else if (displayLabel === 'berisik_biasa') {
               playAlarm('biasa');
            }
          }

          addLog(displayLabel, displayConfidence, rmsVal);

        } catch (parseError) {
          console.warn('[WebSocket] Gagal parse:', parseError);
        }
      };

      // Aktifkan echoCancellation agar suara speaker laptop tidak memantul masuk ke mic
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: false,
        },
        video: false,
      });
      streamRef.current = stream;
      
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: SAMPLE_RATE });
      audioCtxRef.current = audioCtx;
      if (audioCtx.state === 'suspended') await audioCtx.resume();
      
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
      setConnectionStatus('disconnected');
      setIsMonitoring(false);
    }
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    setConnectionStatus('disconnected');
    setCurrentLabel(undefined);
    setCurrentConfidence(undefined);
    noisyStreakRef.current = 0;
    stopAlarmSound(true); // Putus paksa dan reset posisi alarm saat pemantauan dihentikan

    if (wsRef.current) wsRef.current.close();
    if (processorRef.current) processorRef.current.disconnect();
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    
    // Perbaikan Error: Cek state sebelum di-close
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(console.warn);
    }
  };

  const handleToggleMonitoring = () => {
    isMonitoring ? stopMonitoring() : startMonitoring();
  };

  useEffect(() => {
    return () => stopMonitoring();
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