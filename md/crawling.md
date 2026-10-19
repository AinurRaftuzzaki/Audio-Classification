# Crawling Data Audio

## Overview

Proses crawling dilakukan secara otomatis menggunakan Python. Notebook crawling tersedia di folder `crawling/`.

## Tools yang Digunakan

| Tool | Kegunaan |
|------|---------|
| `requests` | HTTP request untuk mengunduh audio |
| `beautifulsoup4` | Parsing HTML website sumber |
| `yt-dlp` | Download audio dari YouTube |
| `freesound` | API client FreeSound |
| `tqdm` | Progress bar saat download |

## Cara Menjalankan Crawling

### 1. Setup Environment

```bash
# Buat virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt
```

### 2. Jalankan Notebook

Buka Jupyter Notebook dan jalankan:

```
crawling/Crawling_Audio.ipynb
```

### 3. Hasil Crawling

Data hasil crawling akan tersimpan di:
```
data/raw/<nama_kelas>/
```

## Sumber Data yang Digunakan

### FreeSound API

FreeSound menyediakan ribuan file audio gratis dengan berbagai kategori.

```python
import freesound
client = freesound.FreesoundClient()
client.set_token("YOUR_API_KEY")

results = client.text_search(
    query="rain",
    fields="id,name,previews",
    page_size=150
)
```

> Daftarkan akun di [freesound.org](https://freesound.org) untuk mendapatkan API key.

### YouTube (via yt-dlp)

```bash
yt-dlp -x --audio-format wav -o "data/raw/%(title)s.%(ext)s" "URL_PLAYLIST"
```

### Dataset Publik

- **ESC-50**: [github.com/karolpiczak/ESC-50](https://github.com/karolpiczak/ESC-50)
- **UrbanSound8K**: [urbansounddataset.weebly.com](https://urbansounddataset.weebly.com/urbansound8k.html)
- **AudioSet**: [research.google.com/audioset](https://research.google.com/audioset)

## Catatan

> ⚠️ Pastikan data yang dikumpulkan bebas dari hak cipta atau memiliki lisensi yang sesuai untuk keperluan akademis.
