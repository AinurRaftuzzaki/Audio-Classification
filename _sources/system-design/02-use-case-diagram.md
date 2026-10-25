# 02 - Use Case Diagram & Rincian Aktor

Dokumen ini mendefinisikan kasus penggunaan (*Use Cases*) dan batasan interaksi antarentitas pengguna dengan sistem **Audio Classification**. Seluruh *use case* yang dipetakan di bawah ini mengacu secara ketat pada fitur-fitur yang terimplementasi pada kode program.

---

## 1. Identifikasi Aktor Sistem

Sistem berinteraksi dengan tiga aktor utama:

1. **Operator Lingkungan / Pengguna Akhir (*End User*)**:
   - Pengguna yang mengakses sistem melalui peramban web (*Live Surveillance* di Port 5000 atau Dashboard Streamlit di Port 8501).
   - Mengoperasikan mikrofon, mengamati status kebisingan secara langsung, mendengarkan peringatan alarm bising, dan meninjau log aktivitas.
2. **Data Scientist / Pengembang (*Developer*)**:
   - Pengembang yang bertanggung jawab terhadap penyiapan data, pelatihan model machine learning, validasi performa, serta pemeliharaan skrip otomatisasi.
3. **Subsistem Audio Klien (*Browser Audio Engine / System Actor*)**:
   - Aktor sistem sekunder berbasis Web Audio API di peramban yang bertugas merekam sinyal mikrofon mentah, memecah *stream* ke dalam *buffer*, serta mensintesis bunyi alarm suara (*buzzer*) seketika.

---
## 2. Use Case Diagram

Berikut adalah diagram use case sistem Audio Classification yang menggambarkan interaksi antara aktor dan fitur-fitur sistem.

![Use Case Diagram Sistem Audio Classification](images/02-use-case-diagram.png)




---

## 3. Rincian Narasi Kasus Penggunaan (Use Case Specification)

### UC-01: Memulai Pemantauan Audio Langsung
- **Aktor Utama**: Operator Lingkungan.
- **Aktor Sekunder**: Subsistem Audio Klien (`Web Audio API`).
- **Prasyarat**: Peramban web memiliki izin (*permission*) untuk mengakses mikrofon fisik dan server Flask aktif pada port 5000.
- **Skenario Normal**:
  1. Pengguna mengklik tombol **"▶️ Mulai Deteksi Langsung"** pada antarmuka.
  2. Peramban meminta izin akses mikrofon jika belum diberikan sebelumnya (`navigator.mediaDevices.getUserMedia`).
  3. Sistem menginisialisasi objek `AudioContext`, menghubungkan `MediaStreamSource` ke `AnalyserNode` dan `ScriptProcessorNode`.
  4. Animasi visualisasi gelombang mulai berputar dan status mikrofon berubah menjadi hijau (*Aktif Mendengarkan*).

### UC-03: Mengatur Interval Jendela Deteksi
- **Aktor Utama**: Operator Lingkungan.
- **Deskripsi**: Pengguna dapat memilih durasi jendela akumulasi audio sebelum dikirim ke model untuk diklasifikasikan.
- **Pilihan Interval**: `2 Detik`, `3 Detik (Default/Rekomendasi)`, `5 Detik`, `8 Detik`, atau `10 Detik`.
- **Implementasi**: Fungsi JavaScript `changeDuration()` memperbarui variabel `durationSeconds`, mengalikan dengan frekuensi cuplik 22.050 Hz untuk menghasilkan nilai `CHUNK_SIZE` baru, mengosongkan *buffer*, dan mencatat perubahan pada log.

### UC-06 & UC-07: Klasifikasi Sinyal & Pemicuan Alarm Buzzer
- **Aktor**: Subsistem Audio Klien & Backend Server Flask.
- **Alur**:
  1. Ketika jumlah sampel audio dalam array `bufferChunk` mencapai ukuran `CHUNK_SIZE`, data digabungkan ke dalam `Float32Array`.
  2. Klien melakukan HTTP POST ke `/api/classify_pcm` dengan muatan *binary buffer*.
  3. Backend mengekstrak 16 fitur audio via `librosa`, melakukan normalisasi dengan `scaler.transform()`, dan memprediksi menggunakan `knn_model.predict()`.
  4. Backend mengembalikan respons JSON berupa label (`berisik` atau `non_berisik`), persentase keyakinan, dan 4 fitur utama.
  5. Jika hasil prediksi adalah **`berisik`**:
     - Status antarmuka berubah menjadi merah dengan animasi berkedip (*pulsing alert*).
     - Jika tombol *toggle* alarm aktif (`chkSoundAlert.checked == true`), fungsi `playAlarmSound()` mengeksekusi osilator Web Audio *sawtooth* 900 Hz $\rightarrow$ 450 Hz untuk membunyikan alarm *buzzer*.
  6. Jika hasil prediksi adalah **`non_berisik`**:
     - Status antarmuka berubah menjadi hijau tenang (*Kondisi Tenang*), dan alarm tidak dibunyikan.

### UC-09 & UC-10: Eksplorasi Dataset & Unduh Data CSV
- **Aktor**: Operator Lingkungan / Peneliti.
- **Lokasi**: Dashboard Streamlit, Menu *"📊 Eksplorasi Dataset 16 Fitur"*.
- **Deskripsi**: Pengguna dapat memfilter data berdasarkan kategori (`berisik`, `non_berisik`), meninjau tabel interaktif dari 197 rekaman audio, melihat distribusi statistik, dan mengunduh seluruh data dalam format CSV melalui tombol ekspor.

### UC-13 & UC-14: Ekstraksi Fitur Batch & Pelatihan Model KNN
- **Aktor**: Data Scientist / Pengembang.
- **Deskripsi**: Eksekusi melalui skrip konsol Python:
  - `python extract_features.py`: Mengekstrak berkas audio dari ZIP, memvalidasi sampel, dan menghitung nilai rata-rata 16 fitur.
  - `python train_knn.py`: Melakukan pembagian data latih/uji (80:20), melakukan tuning hyperparameter $K$ (1 sampai 21 ganjil), fungsi bobot, dan metrik jarak dengan 5-Fold Stratified Cross Validation, lalu menyimpan model terbaik.
