import React from 'react';

/**
 * Properti untuk StatusCard
 */
interface StatusCardProps {
  /** Hasil klasifikasi ('berisik_biasa', 'berisik_banget', atau 'non_berisik') */
  label?: string;
  /** Persentase tingkat keyakinan model (0 - 100 atau 0.0 - 1.0) */
  confidence?: number;
  /** Status apakah pemantauan audio sedang berjalan */
  isMonitoring?: boolean;
}

export const StatusCard: React.FC<StatusCardProps> = ({
  label,
  confidence,
  isMonitoring = false,
}) => {
  const normalizedLabel = label?.toLowerCase() || '';

  // Evaluasi 3 tingkat status kebisingan (kompatibel dengan '_' maupun '-')
  const isQuiet = normalizedLabel.includes('non_berisik') || normalizedLabel.includes('non-berisik') || normalizedLabel.includes('aman');
  const isVeryNoisy = normalizedLabel.includes('banget');
  const isModerateNoisy = !isQuiet && !isVeryNoisy && normalizedLabel.includes('berisik');
  
  const hasResult = (isQuiet || isVeryNoisy || isModerateNoisy) && confidence !== undefined;

  // Normalisasi persentase confidence (jika dari backend bernilai 0.0 - 1.0, kalikan 100)
  const displayConfidence = confidence !== undefined 
    ? (confidence <= 1 ? confidence * 100 : confidence) 
    : 0;

  // Konfigurasi visual berdasarkan state saat ini
  const getThemeConfig = () => {
    if (!isMonitoring) {
      return {
        title: 'SISTEM STANDBY',
        subtitle: 'Sistem tidak aktif. Silakan klik "Start Monitoring" untuk memulai.',
        badgeColor: 'var(--text-secondary)',
        bgColor: 'rgba(148, 163, 184, 0.08)',
        borderColor: 'var(--border-card)',
        glow: 'none',
        icon: (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        ),
      };
    }

    if (!hasResult) {
      return {
        title: 'MENDENGARKAN SUARA...',
        subtitle: 'Mengumpulkan sampel audio jendela 1 detik untuk dianalisis oleh server...',
        badgeColor: 'var(--color-accent)',
        bgColor: 'rgba(56, 189, 248, 0.1)',
        borderColor: 'rgba(56, 189, 248, 0.3)',
        glow: 'none',
        icon: (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="22" />
          </svg>
        ),
      };
    }

    // LEVEL 2: SANGAT BERISIK (Merah Menyala + Sirine MP3)
    if (isVeryNoisy) {
      return {
        title: 'SANGAT BERISIK (BAHAYA)',
        subtitle: 'Peringatan Keras: Kebisingan ekstrem terdeteksi! Alarm sirine diaktifkan.',
        badgeColor: '#ef4444',
        bgColor: 'rgba(239, 68, 68, 0.16)',
        borderColor: 'rgba(239, 68, 68, 0.5)',
        glow: '0 0 20px rgba(239, 68, 68, 0.25)',
        icon: (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        ),
      };
    }

    // LEVEL 1: BERISIK BIASA (Kuning Oranye + Beep Peringatan)
    if (isModerateNoisy) {
      return {
        title: 'BERISIK BIASA (WARNING)',
        subtitle: 'Perhatian: Terdeteksi suara bising sedang di sekitar ruangan.',
        badgeColor: '#f59e0b',
        bgColor: 'rgba(245, 158, 11, 0.14)',
        borderColor: 'rgba(245, 158, 11, 0.45)',
        glow: 'none',
        icon: (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        ),
      };
    }

    // LEVEL 0: AMAN / TENANG (Hijau)
    return {
      title: 'AMAN (TENANG)',
      subtitle: 'Kondisi suara lingkungan terpantau tenang dan dalam batas wajar.',
      badgeColor: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.12)',
      borderColor: 'rgba(16, 185, 129, 0.35)',
      glow: 'none',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      ),
    };
  };

  const theme = getThemeConfig();

  return (
    <div
      style={{
        ...styles.card,
        borderColor: theme.borderColor,
        boxShadow: theme.glow,
      }}
    >
      <div style={styles.cardHeader}>
        <span style={styles.cardSectionTitle}>STATUS DETEKSI LINGKUNGAN</span>
        {hasResult && (
          <span style={styles.confidenceBadge}>
            Confidence: <strong>{displayConfidence.toFixed(1)}%</strong>
          </span>
        )}
      </div>

      <div style={{ ...styles.contentWrapper, backgroundColor: theme.bgColor }}>
        <div style={{ ...styles.iconContainer, color: theme.badgeColor }}>
          {theme.icon}
        </div>
        <div style={styles.textContainer}>
          <h2 style={{ ...styles.statusTitle, color: theme.badgeColor }}>
            {theme.title}
          </h2>
          <p style={styles.statusSubtitle}>{theme.subtitle}</p>
        </div>
      </div>

      {/* Progress Bar Confidence */}
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
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-card)',
    borderRadius: '16px',
    padding: '24px',
    transition: 'all 0.3s ease',
    marginBottom: '0px',
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
    letterSpacing: '1px',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
  },
  confidenceBadge: {
    fontSize: '12px',
    color: 'var(--text-primary)',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    padding: '4px 10px',
    borderRadius: '12px',
    border: '1px solid var(--border-card)',
  },
  contentWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    padding: '20px',
    borderRadius: '12px',
    transition: 'background-color 0.3s ease',
  },
  iconContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '64px',
    height: '64px',
    borderRadius: '12px',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    flexShrink: 0,
  },
  textContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  statusTitle: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 800,
    letterSpacing: '-0.5px',
  },
  statusSubtitle: {
    margin: 0,
    fontSize: '14px',
    color: 'var(--text-secondary)',
    lineHeight: '1.4',
  },
  confidenceBarWrapper: {
    marginTop: '16px',
  },
  confidenceBarTrack: {
    width: '100%',
    height: '6px',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  confidenceBarFill: {
    height: '100%',
    transition: 'width 0.4s ease, background-color 0.3s ease',
  },
};

export default StatusCard;