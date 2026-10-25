# 05 - Class & Component Diagram (Struktur Modul & Objek)

Dokumen ini mendokumentasikan arsitektur modular (*Component Diagram*) dan struktur kelas/tipe data (*Class Diagram*) dari proyek **Audio Classification**. 

Meskipun sebagian besar skrip Python pada proyek sains data dibangun menggunakan paradigma modular-fungsional, pemodelan berbasis komponen dan struktur kelas (*Class/Structure Diagram*) di bawah ini merefleksikan abstraksi kelas dari pustaka *scikit-learn*, entitas data transfer (DTO), modul pengendali (*Controller*), serta objek *Web Audio API* di sisi klien.


## 1. Component Diagram (Diagram Komponen Modular)

Diagram komponen memetakan pembagian subsistem perangkat lunak menjadi unit-unit fungsional yang terpisah beserta antarmuka penghubungnya.

![Component Diagram](images/Component%20Diagram.png)

---

## 2. Class & Data Structure Diagram (Diagram Kelas & Struktur Data)

Diagram kelas berikut memodelkan entitas logika, fungsi pengendali, struktur data 16 fitur akustik, serta keterkaitannya dengan pustaka scikit-learn.

![Class Diagram](images/Class%20%26%20Data%20Structure%20Diagram.png)

---

## 3. Rincian Atribut & Metode Kelas Kunci

### A. Modul `LiveServerController` ([`live_server.py`](file:///d:/semester%205/psd/Audio%20Classification/Audio-Classification/live_server.py))
- **Atribut**:
  - `knn_model`: Objek estimator `KNeighborsClassifier` yang dimuat dari `knn_model.pkl`.
  - `scaler`: Objek `StandardScaler` yang dimuat dari `scaler.pkl`.
  - `label_encoder`: Objek `LabelEncoder` yang dimuat dari `label_encoder.pkl`.
- **Metode**:
  - `add_cors_headers(response)`: Menambahkan header CORS (`Access-Control-Allow-Origin: *`) agar API dapat diakses secara bebas oleh klien peramban.
  - `classify_pcm()`: Endpoint utama yang menerima `raw_bytes` dari `request.get_data()`, mengonversi ke `np.float32`, mengekstrak 16 fitur via `librosa`, melakukan normalisasi dengan `scaler.transform()`, dan mengembalikan objek `ClassificationResponseDTO`.

### B. Objek Data `AudioFeatureVector` (16 Fitur Akustik)
Objek representasi matematis yang terdiri dari tepat 16 dimensi numerik bertipe `float`:
1. `rms`: Rata-rata energi sinyal suara ($E_{RMS} = \sqrt{\frac{1}{N}\sum_{n=1}^N x[n]^2}$).
2. `centroid`: Titik berat spektral frekuensi ($\text{Centroid} = \frac{\sum f \cdot S(f)}{\sum S(f)}$).
3. `zcr`: Laju perubahan tanda amplitudo sinyal suara per detik.
4. `mfcc_1` s/d `mfcc_13`: Tiga belas nilai rata-rata koefisien Mel-Frequency Cepstral Coefficients (MFCC) yang menangkap amplop spektral suara.

### C. Modul `ClientAudioEngineJS` (Sisi Klien Peramban)
- **Atribut Kunci**:
  - `durationSeconds`: Float yang menentukan panjang jendela inferensi (pilihan: 2.0, 3.0, 5.0, 8.0, 10.0 detik).
  - `CHUNK_SIZE`: Integer hasil kalkulasi `Math.round(SAMPLE_RATE * durationSeconds)`.
- **Metode Kunci**:
  - `startLiveAudio()`: Memulai sesi penangkapan audio mikrofon dengan frekuensi cuplik 22.050 Hz.
  - `playAlarmSound()`: Membangkitkan nada peringatan seketika (*sawtooth waveform oscillator*) berfrekuensi 900 Hz yang menurun ke 450 Hz dalam durasi 0.25 detik jika kebisingan terdeteksi.
