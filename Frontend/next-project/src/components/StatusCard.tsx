"use client";

import React from 'react';

interface StatusCardProps {
  label?: string;
  confidence?: number;
  isMonitoring?: boolean;
}

export const StatusCard: React.FC<StatusCardProps> = ({
  label,
  confidence,
  isMonitoring = false,
}) => {
  const normalizedLabel = label?.toLowerCase() || '';

  const isQuiet = normalizedLabel.includes('non_berisik') || normalizedLabel.includes('non-berisik') || normalizedLabel.includes('aman');
  const isVeryNoisy = normalizedLabel.includes('banget');
  const isModerateNoisy = !isQuiet && !isVeryNoisy && normalizedLabel.includes('berisik');
  
  const hasResult = (isQuiet || isVeryNoisy || isModerateNoisy) && confidence !== undefined;

  const displayConfidence = confidence !== undefined 
    ? (confidence <= 1 ? confidence * 100 : confidence) 
    : 0;

  const getThemeConfig = () => {
    if (!isMonitoring) {
      return {
        title: 'Sistem Standby',
        subtitle: 'Sistem pemantauan belum aktif. Silakan klik tombol "Start Monitoring" untuk memulai deteksi.',
        badgeColor: '#475569',
        bgColor: '#F8FAFC',
        borderColor: '#CBD5E1',
        iconBg: '#FFFFFF',
        icon: (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        ),
      };
    }

    if (!hasResult) {
      return {
        title: 'Mendengarkan Sinyal Audio...',
        subtitle: 'Mengumpulkan sampel audio jendela 1 detik untuk dianalisis oleh server...',
        badgeColor: '#1D4ED8',
        bgColor: '#EFF6FF',
        borderColor: '#93C5FD',
        iconBg: '#FFFFFF',
        icon: (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="22" />
          </svg>
        ),
      };
    }

    // LEVEL 2: SANGAT BERISIK (Merah)
    if (isVeryNoisy) {
      return {
        title: 'Kebisingan Tinggi (Bahaya)',
        subtitle: 'Peringatan: Tingkat kebisingan ekstrem terdeteksi di lingkungan. Alarm sirine aktif.',
        badgeColor: '#B91C1C',
        bgColor: '#FEF2F2',
        borderColor: '#FCA5A5',
        iconBg: '#FFFFFF',
        icon: (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        ),
      };
    }

    // LEVEL 1: BERISIK BIASA (Kuning / Oranye)
    if (isModerateNoisy) {
      return {
        title: 'Kebisingan Sedang (Perhatian)',
        subtitle: 'Perhatian: Terdeteksi suara bising moderat di sekitar ruangan.',
        badgeColor: '#B45309',
        bgColor: '#FFFBEB',
        borderColor: '#FCD34D',
        iconBg: '#FFFFFF',
        icon: (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        ),
      };
    }

    // LEVEL 0: AMAN / TENANG (Hijau)
    return {
      title: 'Kondisi Tenang (Aman)',
      subtitle: 'Kondisi suara lingkungan terpantau tenang dan berada dalam batas normal.',
      badgeColor: '#047857',
      bgColor: '#ECFDF5',
      borderColor: '#86EFAC',
      iconBg: '#FFFFFF',
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      ),
    };
  };

  const theme = getThemeConfig();

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <span style={styles.cardSectionTitle}>Status Deteksi Lingkungan</span>
        {hasResult && (
          <span style={styles.confidenceBadge}>
            Confidence: <strong>{displayConfidence.toFixed(1)}%</strong>
          </span>
        )}
      </div>

      <div
        style={{
          ...styles.contentWrapper,
          backgroundColor: theme.bgColor,
          border: `1.5px solid ${theme.borderColor}`,
        }}
      >
        <div style={{ ...styles.iconContainer, color: theme.badgeColor, backgroundColor: theme.iconBg }}>
          {theme.icon}
        </div>
        <div style={styles.textContainer}>
          <h2 style={{ ...styles.statusTitle, color: theme.badgeColor }}>
            {theme.title}
          </h2>
          <p style={styles.statusSubtitle}>{theme.subtitle}</p>
        </div>
      </div>

      {hasResult && (
        <div style={styles.confidenceBarWrapper}>
          <div style={styles.confidenceBarTrack}>
            <div
              style={{
                ...styles.confidenceBarFill,
                width: `${Math.min(Math.max(displayConfidence, 0), 100)}%`,
                backgroundColor: theme.badgeColor,
              }}
            />
          </div>
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
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  cardSectionTitle: {
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.6px',
    color: '#334155',
    textTransform: 'uppercase',
  },
  confidenceBadge: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#0F172A',
    backgroundColor: '#F1F5F9',
    padding: '5px 12px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    fontVariantNumeric: 'tabular-nums',
  },
  contentWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '18px',
    padding: '18px 20px',
    borderRadius: '10px',
    transition: 'all 0.2s ease',
  },
  iconContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '52px',
    height: '52px',
    borderRadius: '12px',
    border: '1px solid #CBD5E1',
    flexShrink: 0,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
  },
  textContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  statusTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 700,
    letterSpacing: '-0.3px',
  },
  statusSubtitle: {
    margin: 0,
    fontSize: '14px',
    fontWeight: 500,
    color: '#334155',
    lineHeight: '1.5',
  },
  confidenceBarWrapper: {
    marginTop: '16px',
  },
  confidenceBarTrack: {
    width: '100%',
    height: '6px',
    backgroundColor: '#E2E8F0',
    borderRadius: '999px',
    overflow: 'hidden',
  },
  confidenceBarFill: {
    height: '100%',
    transition: 'width 0.3s ease, background-color 0.2s ease',
    borderRadius: '999px',
  },
};

export default StatusCard;