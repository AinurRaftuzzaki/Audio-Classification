# Crawling & Ekstraksi Data Audio

## 1. Sumber Data Mentah di Folder Crawling

Pada folder `crawling/`, data audio telah dihimpun ke dalam dua file kompresi:
- `crawling/File Audio Berisik.zip`
- `crawling/File Audio Non Berisik.zip`

Arsip ini berisi rekaman audio berdurasi rata-rata 30 detik yang mencakup berbagai kondisi lingkungan bising (keramaian lalu lintas, aktivitas bengkel, kebisingan kafe/kantin) dan non-bising (lingkungan kamar senyap, suasana hening, perpustakaan).

## 2. Proses Dekompresi dan Validasi

Data dari kedua file ZIP diekstrak ke dalam folder penyimpanan terstruktur `data/raw/` menggunakan skrip otomatisasi Python:

```python
import zipfile
import os

def extract_archive(zip_path, target_dir):
    os.makedirs(target_dir, exist_ok=True)
    with zipfile.ZipFile(zip_path, 'r') as zf:
        zf.extractall(target_dir)
```

Dari total 200 file arsip, 197 file berhasil divalidasi dan diuraikan integritas formatnya (*audio integrity validation*) menggunakan pustaka `librosa` dan `soundfile`. Tiga file yang terindikasi corrupt atau tidak memiliki header stream valid diabaikan dari dataset untuk menjaga kualitas pelatihan model.

## 3. Ekstraksi 16 Fitur Audio di Folder Crawling

Sesuai instruksi spesifikasi proyek, ekstraksi fitur audio dijalankan langsung terhadap berkas-berkas di folder `crawling/` dan menghasilkan dataset berstruktur 16 fitur audio yang disimpan di:
- `crawling/audio_features_16.csv`
- `data/processed/audio_features_16.csv`

### Struktur Berkas CSV Hasil Ekstraksi

```
Kolom (18 Total):
1.  filename  : Nama file rekaman audio
2.  label     : Kategori kelas ('berisik' atau 'non_berisik')
3.  rms       : Root Mean Square energy (mean)
4.  centroid  : Spectral Centroid (Hz) (mean)
5.  zcr       : Zero Crossing Rate (mean)
6.  mfcc_1    : Koefisien MFCC ke-1 (mean)
7.  mfcc_2    : Koefisien MFCC ke-2 (mean)
...
18. mfcc_13   : Koefisien MFCC ke-13 (mean)
```

Ketersediaan berkas CSV di folder `crawling/` mempermudah tahapan eksplorasi data lanjutan tanpa perlu mengulang komputasi transformasi sinyal audio mentah yang memakan waktu.
