"use client";

import React from 'react';
import type { ConnectionStatus } from '../types/audio';

interface HeaderProps {
  status?: ConnectionStatus;
  isMonitoring?: boolean;
  onToggleMonitoring?: () => void;
  isTestingAlarm?: boolean;
  onTestAlarm?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  status = 'disconnected',
  isMonitoring = false,
  onToggleMonitoring,
  isTestingAlarm = false,
  onTestAlarm,
}) => {
  const getStatusBadge = () => {
    switch (status) {
      case 'connected':
        return {
          bg: '#ECFDF5',
          border: '#86EFAC',
          color: '#047857',
          dot: '#10B981',
          text: 'Live Monitoring'
        };
      case 'connecting':
        return {
          bg: '#EFF6FF',
          border: '#93C5FD',
          color: '#1D4ED8',
          dot: '#2563EB',
          text: 'Menghubungkan...'
        };
      case 'error':
        return {
          bg: '#FEF2F2',
          border: '#FCA5A5',
          color: '#B91C1C',
          dot: '#EF4444',
          text: 'Koneksi Terputus'
        };
      case 'disconnected':
      default:
        return {
          bg: '#F8FAFC',
          border: '#CBD5E1',
          color: '#334155',
          dot: '#64748B',
          text: 'Standby'
        };
    }
  };

  const badge = getStatusBadge();

  return (
    <header style={styles.headerContainer}>
      <div style={styles.branding}>
        <div style={styles.iconWrapper}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M17 5v14M7 8v8M2 11v2M22 11v2" />
          </svg>
        </div>
        <div>
          <h1 style={styles.title}>Audio Surveillance System</h1>
          <p style={styles.subtitle}>Sistem Pemantauan Akustik & Deteksi Kebisingan Real-Time</p>
        </div>
      </div>

      <div style={styles.actions}>
        {onTestAlarm && (
          <button
            type="button"
            onClick={onTestAlarm}
            style={{
              ...styles.testButton,
              backgroundColor: isTestingAlarm ? '#FEE2E2' : '#F1F5F9',
              color: isTestingAlarm ? '#B91C1C' : '#334155',
              border: `1px solid ${isTestingAlarm ? '#FCA5A5' : '#CBD5E1'}`,
            }}
            title="Tes Suara Alarm Jangan Berisik"
          >
            {isTestingAlarm ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                </svg>
                <span>Hentikan Suara</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
                <span>Tes Alarm Suara</span>
              </>
            )}
          </button>
        )}

        <div
          style={{
            ...styles.statusBadge,
            backgroundColor: badge.bg,
            border: `1px solid ${badge.border}`,
          }}
        >
          <span
            style={{
              ...styles.statusDot,
              backgroundColor: badge.dot,
            }}
          />
          <span style={{ ...styles.statusText, color: badge.color }}>{badge.text}</span>
        </div>

        <button
          type="button"
          onClick={onToggleMonitoring}
          style={{
            ...styles.button,
            backgroundColor: isMonitoring ? '#DC2626' : '#0F172A',
          }}
        >
          {isMonitoring ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <rect x="4" y="4" width="16" height="16" rx="2" />
              </svg>
              <span>Stop Monitoring</span>
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>Start Monitoring</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  headerContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '18px 26px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    borderRadius: '14px',
    marginBottom: '24px',
    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.07), 0 1px 3px rgba(15, 23, 42, 0.04)',
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
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    backgroundColor: '#EFF6FF',
    color: '#1D4ED8',
    border: '1px solid #BFDBFE',
  },
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 700,
    color: '#0F172A',
    letterSpacing: '-0.4px',
  },
  subtitle: {
    margin: '3px 0 0 0',
    fontSize: '13px',
    fontWeight: 500,
    color: '#334155',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '7px 15px',
    borderRadius: '999px',
    transition: 'all 0.2s ease',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  statusText: {
    fontSize: '13px',
    fontWeight: 600,
  },
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '9px 18px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    transition: 'background-color 0.15s ease, transform 0.1s ease',
  },
  testButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 600,
    borderRadius: '8px',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
    transition: 'all 0.15s ease',
  },
};

export default Header;
