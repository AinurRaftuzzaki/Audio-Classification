import React, { useEffect, useRef } from 'react';

/**
 * Properti untuk AudioVisualizer
 */
interface AudioVisualizerProps {
  /**
   * Data sinyal audio domain waktu (Time-domain data).
   * Biasanya bernilai 0 - 255 dari AnalyserNode.getByteTimeDomainData()
   */
  audioData?: Uint8Array | number[];
  /** Status apakah pemantauan audio sedang berjalan */
  isMonitoring?: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  audioData,
  isMonitoring = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Menyesuaikan resolusi kanvas dengan lebar wadah (agar tidak buram)
    const updateCanvasSize = () => {
      canvas.width = container.clientWidth;
      canvas.height = 130; // Tinggi tetap yang proporsional untuk visualizer
      draw();
    };

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;

      // 1. Bersihkan kanvas dengan warna latar kartu yang konsisten
      ctx.fillStyle = '#1E293B'; // var(--bg-card)
      ctx.fillRect(0, 0, width, height);

      // 2. Gambar garis kisi panduan halus di tengah
      ctx.strokeStyle = '#334155'; // var(--border-card)
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]); // Garis putus-putus
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      ctx.setLineDash([]); // Reset garis putus-putus

      const hasAudio = audioData && audioData.length > 0 && isMonitoring;

      // 3. Jika belum ada audio atau sistem mati, tampilkan garis datar & pesan status
      if (!hasAudio) {
        ctx.fillStyle = '#94A3B8'; // var(--text-secondary)
        ctx.font = '13px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          isMonitoring ? 'Mendengarkan sinyal audio...' : 'Menunggu audio (Sistem tidak aktif)',
          width / 2,
          height / 2 - 16
        );
        return;
      }

      // 4. Gambar gelombang audio real-time jika data audio tersedia
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#3B82F6'; // var(--color-accent) - Biru terang
      ctx.beginPath();

      const sliceWidth = width / audioData.length;
      let x = 0;

      for (let i = 0; i < audioData.length; i++) {
        // Normalisasi data dari rentang byte (0 - 255) ke posisi vertikal kanvas (0 - height)
        // Nilai 128 adalah titik tengah diam (silence)
        const v = audioData[i] / 128.0;
        const y = (v * height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(width, height / 2);
      ctx.stroke();
    };

    // Jalankan pertama kali dan daftarkan event resize browser
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    // Pembersihan (cleanup) saat komponen dilepas / unmount
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [audioData, isMonitoring]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>AUDIO WAVEFORM (LIVE INPUT)</span>
        <span style={styles.badge}>
          {isMonitoring && audioData && audioData.length > 0 ? (
            <span style={{ color: 'var(--color-accent)' }}>● Gelombang Aktif</span>
          ) : (
            <span style={{ color: 'var(--text-secondary)' }}>○ Standby</span>
          )}
        </span>
      </div>

      <div ref={containerRef} style={styles.canvasWrapper}>
        <canvas ref={canvasRef} style={styles.canvas} />
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-card)',
    borderRadius: '16px',
    padding: '20px 24px',
    marginBottom: '24px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
  },
  title: {
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '1px',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
  },
  badge: {
    fontSize: '12px',
    fontWeight: 500,
  },
  canvasWrapper: {
    width: '100%',
    borderRadius: '10px',
    overflow: 'hidden',
    border: '1px solid var(--border-card)',
    backgroundColor: '#1E293B',
  },
  canvas: {
    display: 'block',
    width: '100%',
    height: '130px',
  },
};

export default AudioVisualizer;
