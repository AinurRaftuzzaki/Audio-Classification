"use client";

import React from 'react';
import type { AudioFeatures } from '../types/audio';

interface MetricsCardProps {
  features?: AudioFeatures;
}

export const MetricsCard: React.FC<MetricsCardProps> = ({ features }) => {
  const hasData = features !== undefined && features !== null;

  const metricsList = [
    {
      id: 'rms',
      name: 'RMS (Energi Suara)',
      value: (hasData && features?.rms !== undefined) ? features.rms.toFixed(4) : '—',
      unit: '',
      description: 'Amplitudo kenyaringan gelombang suara',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      ),
    },
    {
      id: 'centroid',
      name: 'Spectral Centroid',
      value: (hasData && features?.centroid !== undefined) ? Math.round(features.centroid).toString() : '—',
      unit: hasData ? 'Hz' : '',
      description: 'Pusat massa frekuensi suara',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
    },
    {
      id: 'zcr',
      name: 'Zero Crossing Rate (ZCR)',
      value: (hasData && features?.zcr !== undefined) ? features.zcr.toFixed(4) : '—',
      unit: '',
      description: 'Frekuensi perubahan tanda sinyal',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12h5l3-7 4 14 3-7h5" />
        </svg>
      ),
    },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.sectionHeader}>
        <span style={styles.sectionTitle}>Fitur Akustik Real-Time</span>
        <span style={styles.statusIndicator}>
          {hasData ? (
            <span style={{ color: '#047857', fontWeight: 600 }}>● Data Live</span>
          ) : (
            <span style={{ color: '#475569', fontWeight: 600 }}>○ Menunggu Audio</span>
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
    marginBottom: '0px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
  },
  sectionTitle: {
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.6px',
    color: '#334155',
    textTransform: 'uppercase',
  },
  statusIndicator: {
    fontSize: '13px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    borderRadius: '12px',
    padding: '18px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    boxShadow: '0 4px 10px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.04)',
  },
  metricCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricName: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#1E293B',
  },
  iconWrapper: {
    color: '#1D4ED8',
    backgroundColor: '#EFF6FF',
    border: '1px solid #BFDBFE',
    width: '34px',
    height: '34px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '6px',
    margin: '3px 0',
  },
  metricValue: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#0F172A',
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '-0.4px',
  },
  metricUnit: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#475569',
  },
  metricDesc: {
    margin: 0,
    fontSize: '12px',
    fontWeight: 500,
    color: '#475569',
    lineHeight: '1.45',
  },
};

export default MetricsCard;