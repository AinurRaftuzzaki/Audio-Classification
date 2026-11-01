import React from 'react';
import type { AudioFeatures } from '../types/audio';

/**
 * Properti untuk MetricsCard
 */
interface MetricsCardProps {
  /** Objek berisi 3 fitur akustik dari server (opsional jika belum ada audio) */
  features?: AudioFeatures;
}

export const MetricsCard: React.FC<MetricsCardProps> = ({ features }) => {
  const hasData = features !== undefined && features !== null;

  // Konfigurasi 3 metrik akustik
  const metricsList = [
    {
      id: 'rms',
      name: 'RMS (Energi Suara)',
      value: hasData ? features.rms.toFixed(4) : '—',
      unit: '',
      description: 'Amplitudo kenyaringan suara',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      ),
    },
    {
      id: 'centroid',
      name: 'Spectral Centroid',
      value: hasData ? `${features.centroid.toFixed(1)}` : '—',
      unit: hasData ? 'Hz' : '',
      description: 'Pusat massa frekuensi suara',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
    },
    {
      id: 'zcr',
      name: 'Zero Crossing Rate (ZCR)',
      value: hasData ? features.zcr.toFixed(4) : '—',
      unit: '',
      description: 'Frekuensi perubahan tanda sinyal',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12h5l3-7 4 14 3-7h5" />
        </svg>
      ),
    },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.sectionHeader}>
        <span style={styles.sectionTitle}>FITUR AKUSTIK REAL-TIME</span>
        <span style={styles.statusIndicator}>
          {hasData ? (
            <span style={{ color: 'var(--status-safe)' }}>● Data Live</span>
          ) : (
            <span style={{ color: 'var(--text-secondary)' }}>○ Menunggu Audio</span>
          )}
        </span>
      </div>

      <div style={styles.grid}>
        {metricsList.map((item) => (
          <div key={item.id} style={styles.metricCard}>
            <div style={styles.metricCardHeader}>
              <span style={styles.metricName}>{item.name}</span>
              <div style={styles.iconWrapper}>{item.icon}</div>
            </div>

            <div style={styles.valueRow}>
              <span style={styles.metricValue}>{item.value}</span>
              {item.unit && <span style={styles.metricUnit}>{item.unit}</span>}
            </div>

            <p style={styles.metricDesc}>{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    marginBottom: '24px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  sectionTitle: {
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '1px',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
  },
  statusIndicator: {
    fontSize: '12px',
    fontWeight: 500,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
  },
  metricCard: {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-card)',
    borderRadius: '12px',
    padding: '18px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    transition: 'border-color 0.2s ease, transform 0.2s ease',
  },
  metricCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricName: {
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--text-secondary)',
  },
  iconWrapper: {
    color: 'var(--color-accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '6px',
    margin: '4px 0',
  },
  metricValue: {
    fontSize: '24px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    fontFamily: 'var(--mono)',
    letterSpacing: '-0.5px',
  },
  metricUnit: {
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--text-secondary)',
  },
  metricDesc: {
    margin: 0,
    fontSize: '12px',
    color: 'var(--text-secondary)',
    opacity: 0.8,
  },
};

export default MetricsCard;
