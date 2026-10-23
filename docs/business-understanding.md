# Business Understanding

## 1. Latar Belakang

Kebisingan lingkungan (*environmental noise*) merupakan salah satu faktor pengganggu kualitas kenyamanan, konsentrasi, serta kesehatan pendengaran di ruang publik, perkantoran, dan industri. Identifikasi kebisingan suara (*noise detection*) yang dilakukan secara manual membutuhkan kehadiran manusia dan pemantauan terus-menerus yang tidak efisien.

Seiring perkembangan teknologi pemrosesan sinyal digital (*Digital Signal Processing*) dan *Machine Learning*, proses pengenalan karakteristik akustik dapat diotomatisasi secara cerdas. Dengan mengekstrak representasi fitur fisik dan psikoakustik sinyal audio, komputer dapat membedakan suara berisik (*noisy*) dari suara bersih/tenang (*clean / non-berisik*) secara cepat dan akurat.

## 2. Rumusan Masalah

1. Bagaimana mengekstrak representasi fitur akustik yang tepat (RMS, Spectral Centroid, ZCR, dan MFCC 13 koefisien) dari sinyal audio mentah?
2. Bagaimana membangun model *K-Nearest Neighbors* (KNN) yang optimal untuk membedakan kategori suara Berisik dan Non-Berisik?
3. Bagaimana mengimplementasikan model tersebut ke dalam sebuah sistem aplikasi yang interaktif dan dapat digunakan langsung oleh pengguna (*deployment*)?

## 3. Tujuan Proyek

- **Ekstraksi Fitur**: Mengekstrak 16 atribut numerik yang merepresentasikan energi sinyal, distribusi frekuensi spektral, dinamika transisi tanda, dan tekstur timbre suara.
- **Pengembangan Model**: Melatih model *K-Nearest Neighbors* (KNN) dengan tuning hyperparameter $k$, fungsi jarak, dan skema pembobotan.
- **Validasi Kinerja**: Mengevaluasi model menggunakan metrik *Accuracy*, *Precision*, *Recall*, *F1-Score*, *Confusion Matrix*, dan *ROC Curve*.
- **Deployment Sistem**: Mengembangkan antarmuka aplikasi web berbasis *Streamlit* yang siap pakai untuk mengunggah audio, menganalisis fitur secara instan, dan menampilkan hasil prediksi.

## 4. Manfaat

| Aspek | Manfaat Konkret |
|---|---|
| **Sistem Otomasi** | Mendeteksi polusi suara dan kondisi lingkungan bising secara otomatis tanpa operator manusia. |
| **Kualitas Komunikasi** | Menjadi subsistem pendukung untuk *noise suppression* atau penanda kualitas rekaman audio. |
| **Akademis & Sains Data** | Memberikan pemahaman praktis implementasi alur CRISP-DM pada pemrosesan sinyal suara. |

## 5. Batasan Masalah

- Dataset difokuskan pada klasifikasi biner dua kelas: **Berisik** dan **Non-Berisik**.
- Ekstraksi fitur menggunakan tepat 16 atribut numerik (RMS, Spectral Centroid, ZCR, dan 13 koefisien MFCC).
- Algoritma pembelajaran utama yang digunakan adalah *K-Nearest Neighbors* (KNN).
- Sistem aplikasi diimplementasikan menggunakan Python dan *Streamlit*.
