# 03 - Activity Diagram (Alur Proses Sistem)

Dokumen ini memodelkan alur kerja (*workflow*) dan logika operasional dari sistem **Audio Classification**. Sesuai implementasi aslinya, aktivitas sistem terbagi menjadi dua alur utama:
1. **Alur 1: Pipeline Pembelajaran Mesin Offline (*Offline Data Processing & Training Pipeline*)**.
2. **Alur 2: Klasifikasi Audio Real-Time & Pemicuan Alarm (*Online Real-Time Surveillance & Alarm Pipeline*)**.

---

## 1. Activity Diagram 1: Pipeline Offline (Ekstraksi Fitur & Pelatihan KNN)

Diagram berikut menggambarkan alur kerja pipeline offline yang dijalankan oleh skrip `extract_features.py` dan `train_knn.py`.

![Activity Diagram 1: Pipeline Offline](images/03-activity-diagram.png)

---

## 3. Penjelasan Logika & Mekanisme Kritis

### A. Mekanisme Jendela Geser & Akumulasi Audio (*Buffer Chunking*)
Pada peramban klien, perekaman suara tidak mengirimkan data setiap kali mikrofon menangkap sinyal (karena akan membebani jaringan dengan jutaan panggilan per detik). Sebaliknya, sistem menggunakan event `onaudioprocess` dengan ukuran penyangga kecil (4096 sampel):
- Setiap cuplikan disisipkan ke dalam array penampung `bufferChunk`.
- Sistem memeriksa akumulasi sampel terhadap formula:
  $$\text{CHUNK\_SIZE} = \text{SAMPLE\_RATE} \times \text{durationSeconds} = 22050 \times 3.0 = 66150 \text{ titik}$$
- Begitu ambang batas terpenuhi, array Float32 digabungkan secara utuh dan dikirimkan sebagai satu kesatuan jendela waktu representatif.

### B. Mekanisme Alarm Buzzer Instan (*Sub-Second Latency*)
- Fungsi `playAlarmSound()` menggunakan **Web Audio API OscillatorNode** bertipe `sawtooth`.
- Sintesis audio dilakukan langsung pada perangkat keras audio lokal tanpa jeda jaringan (*zero network latency*).
- Dilengkapi sistem pembatas frekuensi bunyi (*throttling*) minimal 1.000 ms agar bunyi alarm tidak menumpuk (*overlapping distortion*) jika interval inferensi sangat cepat.
