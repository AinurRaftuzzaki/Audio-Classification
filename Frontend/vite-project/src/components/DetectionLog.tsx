"use client";

import React from 'react';
import type { DetectionLogItem } from '../types/audio';

interface DetectionLogProps {
  logs?: DetectionLogItem[];
  onClearLogs?: () => void;
}

export const DetectionLog: React.FC<DetectionLogProps> = ({
  logs = [],
  onClearLogs,
}) => {
  const hasLogs = logs.length > 0;

  const getBadgeStyle = (rawLabel: string) => {
    const label = rawLabel.toLowerCase();

    if (label.includes('banget')) {
      return {
        text: 'Sangat Berisik',
        color: '#B91C1C',
        bg: '#FEF2F2',
        border: '#FCA5A5',
      };
    }

    if (label.includes('berisik') && !label.includes('non')) {
      return {
        text: 'Berisik Biasa',
        color: '#B45309',
        bg: '#FFFBEB',
        border: '#FCD34D',
      };
    }

    return {
      text: 'Tenang (Aman)',
      color: '#047857',
      bg: '#ECFDF5',
      border: '#86EFAC',
    };
  };

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.titleWrapper}>
          <span style={styles.title}>Riwayat Aktivitas Deteksi</span>
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

      {!hasLogs ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <p style={styles.emptyTitle}>Belum Ada Aktivitas Terdeteksi</p>
          <p style={styles.emptySubtitle}>
            Riwayat klasifikasi suara akan otomatis dicatat secara kronologis di sini saat sistem aktif.
          </p>
        </div>
      ) : (
        <div style={styles.tableScrollWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeaderRow}>
                <th style={styles.th}>Waktu</th>
                <th style={styles.th}>Status Klasifikasi</th>
                <th style={styles.th}>Confidence</th>
                <th style={styles.th}>Nilai RMS</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((item) => {
                const badge = getBadgeStyle(item.label);
                const displayConf = item.confidence <= 1 ? item.confidence * 100 : item.confidence;

                return (
                  <tr key={item.id} style={styles.tableRow}>
                    <td style={styles.tdTime}>{item.timestamp}</td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.pillBadge,
                          color: badge.color,
                          backgroundColor: badge.bg,
                          border: `1.5px solid ${badge.border}`,
                        }}
                      >
                        {badge.text}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.confidenceText}>
                        {displayConf.toFixed(1)}%
                      </span>
                    </td>
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
    marginBottom: '16px',
  },
  titleWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  title: {
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.6px',
    color: '#334155',
    textTransform: 'uppercase',
  },
  counterBadge: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#1E293B',
    backgroundColor: '#F1F5F9',
    padding: '3px 10px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
  },
  clearButton: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#334155',
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    padding: '6px 14px',
    borderRadius: '8px',
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
    transition: 'background-color 0.15s ease, color 0.15s ease',
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
    color: '#64748B',
    marginBottom: '12px',
  },
  emptyTitle: {
    margin: '0 0 4px 0',
    fontSize: '15px',
    fontWeight: 700,
    color: '#0F172A',
  },
  emptySubtitle: {
    margin: 0,
    fontSize: '13px',
    fontWeight: 500,
    color: '#475569',
    maxWidth: '380px',
    lineHeight: '1.5',
  },
  tableScrollWrapper: {
    maxHeight: '300px',
    overflowY: 'auto',
    border: '1px solid #CBD5E1',
    borderRadius: '10px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  tableHeaderRow: {
    backgroundColor: '#F1F5F9',
    position: 'sticky',
    top: 0,
    zIndex: 1,
  },
  th: {
    padding: '12px 16px',
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.4px',
    color: '#1E293B',
    borderBottom: '1px solid #CBD5E1',
  },
  tableRow: {
    borderBottom: '1px solid #E2E8F0',
    transition: 'background-color 0.1s ease',
  },
  td: {
    padding: '12px 16px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#0F172A',
  },
  tdTime: {
    padding: '12px 16px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#334155',
    fontVariantNumeric: 'tabular-nums',
  },
  tdMono: {
    padding: '12px 16px',
    fontSize: '13px',
    color: '#0F172A',
    fontVariantNumeric: 'tabular-nums',
    fontWeight: 700,
  },
  pillBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 600,
  },
  confidenceText: {
    fontWeight: 700,
    color: '#0F172A',
    fontVariantNumeric: 'tabular-nums',
  },
};

export default DetectionLog;