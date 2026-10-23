# Audio Classification: Berisik vs Non-Berisik

Selamat datang di dokumentasi lengkap proyek **Audio Classification (Klasifikasi Suara Berisik vs Non-Berisik)**!

Proyek ini menyajikan alur kerja ilmu data menyeluruh (*end-to-end data science lifecycle*) mengacu pada metodologi standar CRISP-DM:
1. **Business Understanding**: Memahami urgensi identifikasi kebisingan akustik dan tujuan klasifikasi.
2. **Data Understanding**: Eksplorasi dataset audio 197 sampel mentah dari folder crawling (`File Audio Berisik.zip` dan `File Audio Non Berisik.zip`).
3. **Data Crawling & Extraction**: Proses pengumpulan dan ekstraksi arsip suara.
4. **Data Preprocessing**: Standarisasi format sinyal audio dan penskalaan fitur numerik (`StandardScaler`).
5. **Feature Extraction**: Ekstraksi 16 fitur audio utama, mencakup **RMS Energy**, **Spectral Centroid**, **Zero Crossing Rate (ZCR)**, dan **13 Koefisien MFCC**.
6. **Modeling (K-Nearest Neighbors)**: Pelatihan model KNN dan optimasi hyperparameter $k$, metrik jarak, dan bobot tetangga.
7. **Evaluation**: Evaluasi komprehensif pada data uji dengan akurasi **92.50%**, Precision **94.74%**, Recall **90.00%**, F1-Score **92.31%**, dan ROC AUC **0.992**.
8. **Deployment & Sistem Interaktif**: Pembangunan aplikasi web interaktif berbasis **Streamlit** untuk inferensi audio real-time.
9. **Conclusion**: Kesimpulan ilmiah dan rekomendasi pengembangan lanjutan.
