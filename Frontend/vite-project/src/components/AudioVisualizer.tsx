"use client";

import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  audioData?: Uint8Array | number[];
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

    const updateCanvasSize = () => {
      canvas.width = container.clientWidth;
      canvas.height = 130;
      draw();
    };

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;

      // 1. Bersihkan kanvas dengan warna latar soft slate
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(0, 0, width, height);

      // 2. Garis tengah halus
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      const hasAudio = audioData && audioData.length > 0 && isMonitoring;

      // 3. Tampilan pesan jika belum ada data suara
      if (!hasAudio) {
        ctx.fillStyle = '#475569';
        ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          isMonitoring ? 'Mendengarkan sinyal mikrofon...' : 'Menunggu sinyal audio (Sistem standby)',
          width / 2,
          height / 2 - 14
        );
        return;
      }

      // 4. Gambar kurva gelombang audio real-time
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#1D4ED8';
      ctx.beginPath();

      const sliceWidth = width / audioData.length;
      let x = 0;

      for (let i = 0; i < audioData.length; i++) {
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

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [audioData, isMonitoring]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>Gelombang Audio (Live Waveform)</span>
        <span style={styles.badge}>
          {isMonitoring && audioData && audioData.length > 0 ? (
            <span style={{ color: '#047857', fontWeight: 600 }}>● Sinyal Aktif</span>
          ) : (
            <span style={{ color: '#475569', fontWeight: 600 }}>○ Standby</span>
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
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    borderRadius: '14px',
    padding: '22px 26px',
    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.07), 0 1px 3px rgba(15, 23, 42, 0.04)',
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
    letterSpacing: '0.6px',
    color: '#334155',
    textTransform: 'uppercase',
  },
  badge: {
    fontSize: '13px',
  },
  canvasWrapper: {
    width: '100%',
    borderRadius: '10px',
    overflow: 'hidden',
    border: '1px solid #CBD5E1',
    backgroundColor: '#F8FAFC',
    boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.04)',
  },
  canvas: {
    display: 'block',
    width: '100%',
    height: '130px',
  },
};

export default AudioVisualizer;
