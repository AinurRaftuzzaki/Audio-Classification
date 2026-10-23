import { useState } from 'react';
import type { ConnectionStatus, AudioFeatures, DetectionLogItem } from './types/audio';
import { Header } from './components/Header';
import { StatusCard } from './components/StatusCard';
import { MetricsCard } from './components/MetricsCard';
import { AudioVisualizer } from './components/AudioVisualizer';
import { DetectionLog } from './components/DetectionLog';
import './App.css';

export function App() {
  // 1. State Awal Sistem (100% Jujur: Tidak Ada Data Palsu)
  const [isMonitoring, setIsMonitoring] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');

  // State data hasil prediksi & fitur akustik (kosong saat belum ada audio)
  const [currentLabel, setCurrentLabel] = useState<string | undefined>(undefined);
  const [currentConfidence, setCurrentConfidence] = useState<number | undefined>(undefined);
  const [currentFeatures, setCurrentFeatures] = useState<AudioFeatures | undefined>(undefined);

  // State data gelombang visualizer (kosong saat belum ada audio)
  const [audioData, setAudioData] = useState<Uint8Array | undefined>(undefined);

  // State daftar riwayat log deteksi
  const [logs, setLogs] = useState<DetectionLogItem[]>([]);

  // 2. Handler Tombol Kontrol (Mode Pratinjau UI)
  const handleToggleMonitoring = () => {
    setIsMonitoring((prev) => {
      const nextState = !prev;

      if (nextState) {
        // Mengubah status UI ke 'connecting' (menunggu sambungan data nyata)
        setConnectionStatus('connecting');
      } else {
        // Mengembalikan status UI ke keadaan standby
        setConnectionStatus('disconnected');
        setCurrentLabel(undefined);
        setCurrentConfidence(undefined);
        setCurrentFeatures(undefined);
        setAudioData(undefined);
      }

      return nextState;
    });
  };

  // 3. Handler Bersihkan Log
  const handleClearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="dashboard-container">
      {/* 1. Komponen Header: Identitas Sistem, Status Koneksi, & Tombol Kontrol */}
      <Header
        status={connectionStatus}
        isMonitoring={isMonitoring}
        onToggleMonitoring={handleToggleMonitoring}
      />

      {/* 2. Banner Informasi Keterbatasan Mode Pratinjau UI */}
      <div className="system-notice-banner">
        <div className="notice-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </div>
        <p className="notice-text">
          <strong>Mode Desain Frontend:</strong> Antarmuka dashboard telah siap sepenuhnya. Perekaman audio nyata (Web Audio API) dan koneksi WebSocket server akan dihubungkan pada tahap integrasi berikutnya bersama Zaki dan Izzul.
        </p>
      </div>

      {/* 3. Grid Utama Dashboard (2 Kolom Responsif) */}
      <main className="dashboard-main-grid">
        {/* Kolom Kiri: Status Klasifikasi Utama & Visualizer Gelombang Suara */}
        <section className="dashboard-left-col">
          <StatusCard
            label={currentLabel}
            confidence={currentConfidence}
            isMonitoring={isMonitoring}
          />

          <AudioVisualizer
            audioData={audioData}
            isMonitoring={isMonitoring}
          />
        </section>

        {/* Kolom Kanan: 3 Fitur Akustik Real-Time & Riwayat Log Aktivitas */}
        <section className="dashboard-right-col">
          <MetricsCard
            features={currentFeatures}
          />

          <DetectionLog
            logs={logs}
            onClearLogs={handleClearLogs}
          />
        </section>
      </main>

      {/* 4. Footer Status Dashboard */}
      <footer className="dashboard-footer">
        <div className="footer-left">
          <span>Audio Surveillance System &bull; Frontend Client v1.0.0</span>
        </div>
        <div className="footer-right">
          <span>Arsitektur: React + TypeScript + Web Audio API + WebSockets</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
