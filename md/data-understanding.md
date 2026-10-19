# Data Understanding

## Deskripsi Dataset

> **Catatan:** Bagian ini akan diperbarui setelah proses crawling data selesai.

Dataset yang akan digunakan dalam proyek ini terdiri dari file audio dalam format:
- `.wav` — format audio lossless berkualitas tinggi
- `.mp3` — format audio compressed
- `.flac` — format audio lossless

## Sumber Data

Dataset dikumpulkan dari:
- Crawling otomatis menggunakan notebook `crawling/Crawling_Audio.ipynb`
- Sumber publik yang tersedia secara bebas

## Struktur Data

```
data/
├── raw/              ← data mentah hasil crawling
│   ├── kelas_1/
│   ├── kelas_2/
│   └── ...
└── processed/        ← data hasil preprocessing
    ├── kelas_1/
    ├── kelas_2/
    └── ...
```

## Distribusi Data

*Akan diisi setelah proses pengumpulan data selesai.*

## Statistik Deskriptif

| Metrik | Nilai |
|--------|-------|
| Jumlah Total Sampel | *TBD* |
| Jumlah Kelas | *TBD* |
| Rata-rata Durasi Audio | *TBD* |
| Sample Rate | *TBD* |
| Durasi Total Dataset | *TBD* |
