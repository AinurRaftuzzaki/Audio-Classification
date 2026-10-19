# Kesimpulan & Pengembangan Lanjutan

## 1. Kesimpulan Proyek

Dari seluruh rangkaian tahapan *data science lifecycle* yang telah diselesaikan, dapat diambil kesimpulan utama sebagai berikut:

1. **Ekstraksi Fitur Akustik Efektif**:
   Kombinasi 16 fitur audio—terdiri atas **RMS Energy**, **Spectral Centroid**, **Zero Crossing Rate (ZCR)**, dan **13 Koefisien MFCC**—terbukti sangat efektif merepresentasikan karakteristik pembeda antara audio bising (*berisik*) dan audio hening (*non-berisik*).
2. **Kinerja Model KNN Sangat Baik**:
   Model *K-Nearest Neighbors* (KNN) yang dilatih dengan penskalaan *StandardScaler* dan hyperparameter optimal ($k=1$, metrik jarak Euclidean) berhasil mencapai performa luar biasa pada data pengujian:
   - **Akurasi Pengujian**: **92.50%**
   - **Precision**: **94.74%**
   - **Recall**: **90.00%**
   - **F1-Score**: **92.31%**
   - **ROC AUC**: **0.992**
3. **Deployment Fungsional & Siap Pakai**:
   Sistem aplikasi web interaktif berbasis **Streamlit** telah berhasil dibangun dan dideploy secara lokal (`app.py`), menyediakan alur kerja terintegrasi dari pengunggahan audio, pemutaran suara, ekstraksi 16 fitur secara otomatis, hingga penyajian hasil inferensi klasifikasi secara instan dan visual.

---

## 2. Saran & Pengembangan Lanjutan

Untuk pengembangan sistem di masa mendatang:
- **Pengembangan Multi-Kelas**: Mengembangkan kategori kebisingan yang lebih spesifik (misalnya: bising lalu lintas, bising konstruksi, suara tangis, atau bising mesin pabrik).
- **Segmentasi Waktu (Windowing Streaming)**: Menambahkan modul pendeteksian kontinu (*continuous real-time streaming audio*) dengan *sliding window* per 1-3 detik melalui mikrofon langsung.
- **Eksplorasi Algoritma Lanjutan**: Melakukan *benchmarking* terhadap model ensemble (*Random Forest*, *XGBoost*) atau arsitektur *Deep Learning* (*Convolutional Neural Network* pada Mel Spectrogram) untuk menangani dataset audio berukuran jauh lebih masif.
