import type { ConnectionStatus } from '../types/audio';

/**
 * Properti (Props) untuk komponen Header
 * Dibuat fleksibel agar memudahkan Zaki menghubungkan WebSocket nanti
 */
interface HeaderProps {
  /** Status koneksi ke server/mikrofon (default: 'disconnected') */
  status?: ConnectionStatus;
  /** Status apakah perekaman live sedang aktif */
  isMonitoring?: boolean;
  /** Fungsi callback ketika tombol aksi diklik */
  onToggleMonitoring?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  status = 'disconnected',
  isMonitoring = false,
  onToggleMonitoring,
}) => {
  // Menentukan warna dan label badge berdasarkan status koneksi
  const getStatusBadge = () => {
    switch (status) {
      case 'connected':
        return { color: 'var(--status-safe)', text: 'Live Monitoring' };
      case 'connecting':
        return { color: 'var(--color-accent)', text: 'Menghubungkan...' };
      case 'error':
        return { color: 'var(--status-danger)', text: 'Koneksi Terputus' };
      case 'disconnected':
      default:
        return { color: 'var(--text-secondary)', text: 'Disconnected' };
    }
  };

  const badgeInfo = getStatusBadge();

  return (
    <header style={styles.headerContainer}>
      {/* 1. Bagian Kiri: Judul dan Deskripsi Sistem */}
      <div style={styles.branding}>
        <div style={styles.iconWrapper}>
          {/* Ikon Audio Wave Sederhana (SVG Native) */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M17 5v14M7 8v8M2 11v2M22 11v2" />
          </svg>
        </div>
        <div>
          <h1 style={styles.title}>Audio Surveillance System</h1>
          <p style={styles.subtitle}>Real-Time Audio Monitoring</p>
        </div>
      </div>

      {/* 2. Bagian Kanan: Indikator Status & Tombol Kontrol */}
      <div style={styles.actions}>
        {/* Indikator Status Koneksi */}
        <div style={styles.statusBadge}>
          <span
            style={{
              ...styles.statusDot,
              backgroundColor: badgeInfo.color,
              boxShadow: status === 'connected' ? `0 0 8px ${badgeInfo.color}` : 'none',
            }}
          />
          <span style={styles.statusText}>{badgeInfo.text}</span>
        </div>

        {/* Tombol Start / Stop Monitoring */}
        <button
          type="button"
          onClick={onToggleMonitoring}
          style={{
            ...styles.button,
            backgroundColor: isMonitoring ? 'var(--status-danger)' : 'var(--color-accent)',
          }}
        >
          {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
        </button>
      </div>
    </header>
  );
};

// Objek Styling dengan Palet Warna Dark Modern
const styles: { [key: string]: React.CSSProperties } = {
  headerContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-card)',
    borderRadius: '12px',
    marginBottom: '24px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
  },
  branding: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  iconWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    backgroundColor: 'rgba(59, 130, 246, 0.15)', // Biru aksen transparan
    color: 'var(--color-accent)',
  },
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    letterSpacing: '-0.3px',
  },
  subtitle: {
    margin: '3px 0 0 0',
    fontSize: '13px',
    color: 'var(--text-secondary)',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px',
    borderRadius: '20px',
    backgroundColor: 'rgba(15, 23, 42, 0.6)', // Latar Midnight Navy halus
    border: '1px solid var(--border-card)',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    transition: 'background-color 0.3s ease',
  },
  statusText: {
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--text-primary)',
  },
  button: {
    padding: '9px 18px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#F8FAFC',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'opacity 0.2s ease, transform 0.1s ease',
  },
};

export default Header;
