# Desain Sistem: Audio Classification System (Berisik vs Non-Berisik)

Dokumen ini berisi dokumentasi desain sistem perangkat lunak untuk proyek **Audio Classification** berbasis Machine Learning (K-Nearest Neighbors). Seluruh pemodelan sistem dirancang berdasarkan implementasi kode sumber riil (*as-built system design*) yang terdapat pada repositori proyek.

---

## 📌 Ringkasan Eksekutif Sistem

Sistem **Audio Classification** adalah aplikasi cerdas pemantauan kebisingan lingkungan (*environmental noise surveillance*) yang mampu mendeteksi dan mengklasifikasikan sinyal suara mikrofon secara langsung (*real-time*) menjadi dua kategori:
1. **Berisik (`berisik`)** — Mewakili kondisi polusi suara/lingkungan bising (aktivitas kendaraan, bengkel, keramaian kantin).
2. **Non-Berisik (`non_berisik`)** — Mewakili kondisi tenang/hening (kamar senyap, ruang belajar, perpustakaan).

Sistem dilengkapi dengan **arsitektur ganda (*dual-engine deployment*)**:
- **Live Audio Surveillance Engine (Port 5000)**: Server Flask mandiri yang melayani antarmuka berbasis Web Audio API untuk penangkapan audio kontinu, visualisasi gelombang (*oscilloscope*), ekstraksi 16 fitur akustik *on-the-fly*, klasifikasi instan via model KNN, dan alarm suara *buzzer* otomatis.
- **Analytics & Monitoring Dashboard (Port 8501)**: Aplikasi berbasis Streamlit yang mengontrol jalannya *live server*, mengintegrasikan modul live via iframe, menyajikan eksplorasi dataset 16 fitur audio, serta visualisasi metrik evaluasi model sesuai metodologi CRISP-DM.

---

## 🗂️ Daftar Berkas Desain Sistem

Folder `system-design/` ini berisi spesifikasi teknis dan diagram UML/arsitektur lengkap yang siap dirender menggunakan format **Mermaid**:

| No | Berkas | Deskripsi & Isi Dokumen |
|:---:|---|---|
| 1 | [`01-system-architecture.md`](file:///d:/semester%205/psd/Audio%20Classification/system-design/01-system-architecture.md) | **Arsitektur Sistem**: Memetakan arsitektur *dual-engine*, komponen klien (Web Audio API), server inferensi (Flask), dashboard pengontrol (Streamlit), serta *data & artifact store*. |
| 2 | [`02-use-case-diagram.md`](file:///d:/semester%205/psd/Audio%20Classification/system-design/02-use-case-diagram.md) | **Use Case Diagram**: Memetakan interaksi aktor (*Operator/Pengguna*, *Data Scientist/Pengembang*, dan *Client Audio Subsystem*) terhadap seluruh fungsi operasional sistem. |
| 3 | [`03-activity-diagram.md`](file:///d:/semester%205/psd/Audio%20Classification/system-design/03-activity-diagram.md) | **Activity Diagram**: Memodelkan dua alur aktivitas utama: Alur Pembelajaran Mesin Offline (*Data Pipeline & Model Training*) dan Alur Inferensi *Real-Time Streaming* beserta alarm kebisingan. |
| 4 | [`04-sequence-diagram.md`](file:///d:/semester%205/psd/Audio%20Classification/system-design/04-sequence-diagram.md) | **Sequence Diagram**: Memvisualisasikan urutan pesan antarkomponen secara kronologis (Browser $\rightarrow$ Web Audio API $\rightarrow$ Flask API $\rightarrow$ Librosa $\rightarrow$ Scaler $\rightarrow$ KNN $\rightarrow$ Audio Buzzer Synthesizer). |
| 5 | [`05-class-and-component-diagram.md`](file:///d:/semester%205/psd/Audio%20Classification/system-design/05-class-and-component-diagram.md) | **Component & Structural Diagram**: Memetakan dependensi komponen modularitas kode, struktur fungsi/modul, skema vektor 16 fitur audio, dan kontrak payload JSON API. |

---

## 🛠️ Ringkasan Parameter Teknis & Hasil Evaluasi Model

- **Algoritma**: K-Nearest Neighbors (`KNeighborsClassifier` dari `scikit-learn`)
- **Hyperparameter Terbaik (GridSearchCV 5-Fold Stratified)**:
  - $k$ (*n_neighbors*): `1`
  - *Metric*: `euclidean`
  - *Weights*: `uniform`
- **16 Fitur Akustik**:
  1. `rms` — Root Mean Square Energy
  2. `centroid` — Spectral Centroid (Hz)
  3. `zcr` — Zero Crossing Rate
  4. s/d 16. `mfcc_1` s/d `mfcc_13` — Mel-Frequency Cepstral Coefficients
- **Metrik Kinerja**:
  - Akurasi Data Uji (Test Set 20% / 40 Sampel): **92.50%**
  - Precision: **94.74%**
  - Recall: **90.00%**
  - F1-Score: **92.31%**
  - ROC-AUC: **0.925**
  - Mean CV Accuracy (5-Fold pada Data Latih): **85.99%**
