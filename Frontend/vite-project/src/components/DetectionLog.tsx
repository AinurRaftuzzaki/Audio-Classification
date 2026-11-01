import React from 'react';
import type { DetectionLogItem } from '../types/audio';

/**
 * Properti untuk DetectionLog
 */
interface DetectionLogProps {
  /** Daftar riwayat deteksi audio */
  logs?: DetectionLogItem[];
  /** Callback opsional jika pengguna ingin mengosongkan riwayat log */
  onClearLogs?: () => void;
}

export const DetectionLog: React.FC<DetectionLogProps> = ({
  logs = [],
  onClearLogs,
}) => {
  const hasLogs = logs.length > 0;

  // Fungsi pembantu untuk menentukan warna dan label badge berdasarkan 3 level status
  const getBadgeStyle = (rawLabel: string) => {
    const label = rawLabel.toLowerCase();

    if (label.includes('banget')) {
      return {
        text: 'Sangat Berisik',
        color: '#ef4444', // Merah terang
        bg: 'rgba(239, 68, 68, 0.15)',
        border: 'rgba(239, 68, 68, 0.4)',
      };
    }

    if (label.includes('berisik') && !label.includes('non')) {
      return {
        text: 'Berisik Biasa',
        color: '#f59e0b', // Kuning-Oranye (Warning)
        bg: 'rgba(245, 158, 11, 0.15)',
        border: 'rgba(245, 158, 11, 0.4)',
      };
    }

    return {
      text: 'Tenang (Aman)',
      color: '#10b981', // Hijau (Safe)
      bg: 'rgba(16, 185, 129, 0.14)',
      border: 'rgba(16, 185, 129, 0.35)',
    };
  };

  return (
    <div style={styles.card}>
      {/* Header Log */}
      <div style={styles.header}>
        <div style={styles.titleWrapper}>
          <span style={styles.title}>LOG AKTIVITAS DETEKSI</span>
          <span style={styles.counterBadge}>{logs.length} Rekaman</span>
        </div>

        {hasLogs && onClearLogs && (
          <button
            type="button"
            onClick={onClearLogs}
            style={styles.clearButton}
          >
            Bersihkan Log
          </button>
        )}
      </div>

      {/* Konten Log: Tabel atau Status Kosong */}
      {!hasLogs ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <p style={styles.emptyTitle}>Belum ada aktivitas deteksi</p>
          <p style={styles.emptySubtitle}>
            Riwayat klasifikasi suara akan otomatis dicatat di sini saat sistem aktif.
          </p>
        </div>
      ) : (
        <div style={styles.tableScrollWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeaderRow}>
                <th style={styles.th}>WAKTU</th>
                <th style={styles.th}>STATUS KLASIFIKASI</th>
                <th style={styles.th}>CONFIDENCE</th>
                <th style={styles.th}>NILAI RMS</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((item) => {
                const badge = getBadgeStyle(item.label);
                const displayConf = item.confidence <= 1 ? item.confidence * 100 : item.confidence;

                return (
                  <tr key={item.id} style={styles.tableRow}>
                    {/* 1. Kolom Timestamp */}
                    <td style={styles.tdTime}>{item.timestamp}</td>

                    {/* 2. Kolom Status Badge */}
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.pillBadge,
                          color: badge.color,
                          backgroundColor: badge.bg,
                          border: `1px solid ${badge.border}`,
                        }}
                      >
                        {badge.text}
                      </span>
                    </td>

                    {/* 3. Kolom Confidence */}
                    <td style={styles.td}>
                      <span style={styles.confidenceText}>
                        {displayConf.toFixed(1)}%
                      </span>
                    </td>

                    {/* 4. Kolom Nilai RMS */}
                    <td style={styles.tdMono}>{item.rms.toFixed(4)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  card: {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-card)',
    borderRadius: '16px',
    padding: '20px 24px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  titleWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  title: {
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '1px',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
  },
  counterBadge: {
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    padding: '2px 8px',
    borderRadius: '10px',
    border: '1px solid var(--border-card)',
  },
  clearButton: {
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    backgroundColor: 'transparent',
    border: '1px solid var(--border-card)',
    padding: '4px 10px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'color 0.2s, border-color 0.2s',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    textAlign: 'center',
  },
  emptyIcon: {
    color: 'var(--text-secondary)',
    opacity: 0.5,
    marginBottom: '12px',
  },
  emptyTitle: {
    margin: '0 0 4px 0',
    fontSize: '15px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  emptySubtitle: {
    margin: 0,
    fontSize: '13px',
    color: 'var(--text-secondary)',
    maxWidth: '380px',
  },
  tableScrollWrapper: {
    maxHeight: '300px',
    overflowY: 'auto',
    border: '1px solid var(--border-card)',
    borderRadius: '8px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  tableHeaderRow: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    position: 'sticky',
    top: 0,
    zIndex: 1,
  },
  th: {
    padding: '12px 16px',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.5px',
    color: 'var(--text-secondary)',
    borderBottom: '1px solid var(--border-card)',
  },
  tableRow: {
    borderBottom: '1px solid rgba(51, 65, 85, 0.4)',
    transition: 'background-color 0.15s ease',
  },
  td: {
    padding: '12px 16px',
    fontSize: '13px',
    color: 'var(--text-primary)',
  },
  tdTime: {
    padding: '12px 16px',
    fontSize: '13px',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--mono)',
  },
  tdMono: {
    padding: '12px 16px',
    fontSize: '13px',
    color: 'var(--text-primary)',
    fontFamily: 'var(--mono)',
  },
  pillBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 600,
  },
  confidenceText: {
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
};

export default DetectionLog;