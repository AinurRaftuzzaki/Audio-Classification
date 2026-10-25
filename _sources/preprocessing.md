# Preprocessing

Tahapan preprocessing dilakukan pada dua tingkatan: pemrosesan sinyal audio mentah (*audio-level preprocessing*) dan prapemrosesan fitur numerik (*tabular feature preprocessing*).

## 1. Preprocessing Tingkat Sinyal Audio

### a. Resampling & Mono Conversion
Setiap file audio dikonversi menjadi sinyal mono dengan sample rate seragam $f_s = 22.050\text{ Hz}$. Langkah ini menjamin bahwa seluruh transformasi deret Fourier (*Short-Time Fourier Transform*) dan filter Mel beroperasi pada basis waktu dan resolusi frekuensi yang identik.

```python
import librosa

# Load dengan standarisasi sample rate dan channel mono
audio, sr = librosa.load(audio_path, sr=22050, mono=True)
```

### b. Normalisasi Amplitudo
Sebelum dihitung fiturnya, sinyal audio dapat dinormalisasi ke rentang $[-1, 1]$ agar variasi sensitivitas mikrofon rekaman tidak mendistorsi perbandingan energi relatif:
$$y_{\text{norm}}(t) = \frac{y(t)}{\max(|y(t)|) + \epsilon}$$

## 2. Preprocessing Tingkat Fitur Numerik

Setelah 16 fitur diekstrak ke dalam bentuk tabel data, diperlukan tahapan prapemrosesan penting sebelum diserahkan ke algoritma *K-Nearest Neighbors*:

### a. Encoding Label Target
Label kelas kategorikal dikonversi ke representasi numerik menggunakan `LabelEncoder`:
- `'berisik'` $\rightarrow 0$
- `'non_berisik'` $\rightarrow 1$

### b. Pembagian Data (Train-Test Split)
Dataset 197 baris dibagi menggunakan metode *Stratified Sampling* dengan rasio 80:20:
- **Data Pelatihan (Training Set)**: 157 sampel (79 berisik, 78 non-berisik)
- **Data Pengujian (Testing Set)**: 40 sampel (20 berisik, 20 non-berisik)

Stratifikasi memastikan rasio perbandingan kelas pada data uji dan latih tetap presisi seimbang.

### c. Feature Standardization (StandardScaler)
Algoritma KNN mengandalkan perhitungan jarak geometris (seperti jarak Euclidean). Karena fitur audio memiliki rentang skala yang sangat timpang—misalnya `centroid` bernilai ribuan Hz sedangkan `rms` bernilai desimal kecil ($0.01 - 0.1$)—maka tanpa penskalaan, fitur `centroid` akan mendominasi seluruh perhitungan jarak.

Penskalaan dilakukan dengan metode Z-Score Standardization:
$$z = \frac{x - \mu}{\sigma}$$
di mana $\mu$ adalah rata-rata fitur dan $\sigma$ adalah standar deviasi dari data pelatihan.

```python
from sklearn.preprocessing import StandardScaler

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)
```

> **Catatan Penting**: `scaler` di-fit hanya pada data pelatihan (*training set*) kemudian digunakan untuk mentransformasikan data uji (*testing set*) serta data inferensi baru, guna menghindari kebocoran data (*data leakage*).
