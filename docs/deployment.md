# Deployment & Pembuatan Sistem

## 1. Arsitektur Sistem Klasifikasi Audio Real-Time

Untuk memenuhi kebutuhan deteksi kebisingan secara langsung saat pengguna berbicara (*live continuous streaming audio*) dan memberikan peringatan suara seketika (*instant audible alarm*), sistem dirancang menggunakan arsitektur ganda terpadu:

```
[ Mikrofon Browser: Web Audio API (Live Stream) ]
                       ↓
  [ AnalyserNode: Visualisasi Waveform Canvas ]
                       ↓
 [ Chunking Float32Array Audio (Interval 3 detik per slice) ]
                       ↓
[ HTTP POST Binary Stream: http://localhost:5000/api/classify_pcm ]
                       ↓
[ Python Librosa: Ekstraksi 16 Fitur (RMS, Centroid, ZCR, MFCC 1-13) ]
                       ↓
      [ StandardScaler Normalisasi (scaler.pkl) ]
                       ↓
        [ Model Inferensi KNN (knn_model.pkl) ]
                       ↓
     [ Respon JSON: Label & Tingkat Keyakinan ]
                       ↓
[ Tindakan Seketika di Browser: ]
   ├── Status Merah: 🚨 BERISIK TERDETEKSI!
   ├── Alarm Suara: 🔊 Bunyi Buzzer Alarm Otomatis
   └── Status Hijau: 🌿 NON-BERISIK (TENANG)
```

---

## 2. Komponen Sistem yang Dibangun

### A. Live Audio Surveillance Server (`live_server.py`)
- Beroperasi pada port `http://localhost:5000`.
- Membuka mikrofon klien secara langsung tanpa jeda (*continuous listening*).
- Dilengkapi **HTML5 Canvas Oscilloscope** untuk memvisualisasikan gelombang suara yang sedang ditangkap.
- **Alarm Bunyi Buzzer Instan**: Menggunakan Web Audio API synthesizer (`AudioContext` oscillator sawtooth 900 Hz $\rightarrow$ 450 Hz) yang langsung berbunyi keras begitu suara terklasifikasi sebagai **BERISIK**.
- **Panel Metrik & Riwayat Log**: Memperbarui nilai RMS, Centroid, ZCR, latensi komputasi (rata-rata 40-50 ms), dan mencatat log kejadian bising secara kronologis dengan stempel waktu (*timestamp*).

### B. Dashboard Analisis & Monitoring Streamlit (`app.py`)
- Beroperasi pada port `http://localhost:8501`.
- Menyematkan (*embed*) antarmuka Live Audio Classifier pada tab utama.
- Menyediakan tab alternatif untuk pengujian rekaman manual dan sampel rekaman dataset.
- Dilengkapi halaman eksplorasi dataset 16 fitur audio dan laporan evaluasi model KNN lengkap.

---

## 3. Cara Menjalankan Sistem

### Metode 1: Menggunakan File Batch Runner (Otomatis)
Cukup klik ganda berkas:
```bash
run_app.bat
```
Skrip ini akan otomatis menyalakan server deteksi live di latar belakang dan membuka antarmuka aplikasi.

### Metode 2: Melalui Terminal

1. **Jalankan Live Audio Server:**
```bash
python live_server.py
```
Akses langsung di: `http://localhost:5000`

2. **Jalankan Dashboard Streamlit:**
```bash
streamlit run app.py
```
Akses di: `http://localhost:8501`

---

## 4. Cara Penggunaan Deteksi Live
1. Buka browser pada alamat `http://localhost:5000` (atau tab pertama di `http://localhost:8501`).
2. Klik tombol **"▶️ Mulai Deteksi Langsung"** dan izinkan akses mikrofon jika peramban meminta izin.
3. Mulailah berbicara dengan suara keras atau ciptakan suara bising di sekitar mikrofon:
   - **Sistem akan langsung mendeteksi seketika!**
   - **Kartu status langsung berkedip merah (🚨 BERISIK TERDETEKSI!)**
   - **Bunyi alarm (buzzer) akan langsung berbunyi!**
4. Saat Anda diam atau suasana tenang, status akan kembali hijau (**🌿 NON-BERISIK / TENANG**).
