/**
 * Definisi Tipe Data Audio Surveillance System
 * Disesuaikan dengan payload JSON dari Backend FastAPI (Backend/main.py)
 */

/**
 * 3 Fitur akustik utama yang diekstrak oleh Librosa di sisi server:
 * - rms: Root Mean Square (tingkat energi/kenyaringan suara)
 * - centroid: Spectral Centroid (kecerahan suara / pusat massa frekuensi)
 * - zcr: Zero Crossing Rate (kecepatan sinyal audio berganti tanda)
 */
export interface AudioFeatures {
  rms: number;
  centroid: number;
  zcr: number;
}

/**
 * Format payload respons JSON yang dikirimkan oleh WebSocket Backend
 * @see Backend/main.py baris 75-83
 */
export interface AudioClassificationResponse {
  label: string;          // Label hasil prediksi model (contoh: 'Berisik' atau 'Non-Berisik')
  confidence: number;     // Tingkat keyakinan model dalam persen (contoh: 96.5)
  features: AudioFeatures;
  error?: string;         // Pesan error jika audio buffer tidak mencukupi
}

/**
 * Format data untuk riwayat log aktivitas deteksi pada tabel dashboard
 */
export interface DetectionLogItem {
  id: string;             // ID unik baris log (misal: timestamp acak)
  timestamp: string;      // Format jam:menit:detik (contoh: "23:45:12")
  label: string;          // 'Berisik' atau 'Non-Berisik'
  confidence: number;     // Persentase kepastian
  rms: number;            // Tingkat kebisingan (RMS)
}

/**
 * Status koneksi mikrofon & WebSocket audio
 */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
