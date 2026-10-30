# Audio Surveillance & Classification System

Sistem pemantauan dan klasifikasi audio kebisingan lingkungan (*real-time audio surveillance system*) berbasis Machine Learning (Random Forest) dengan integrasi FastAPI (Backend) dan React Vite (Frontend).

---

## 👥 Informasi Kelompok
- **Kelompok:** 9
- **Port Layanan (Host):** `8009`
- **Port Layanan (Container):** `8000`

---

## 🚀 Panduan Menjalankan Aplikasi dengan Docker

Seluruh dependensi frontend dan backend telah digabungkan ke dalam satu image Docker multi-stage build.

### 1. Prasyarat
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) telah terpasang dan berjalan di sistem Anda.

### 2. Menjalankan Container
Buka terminal pada direktori root proyek ini, lalu jalankan perintah berikut:

```bash
docker compose up --build
```

Setelah proses build dan startup selesai, akses layanan pada peramban web:
- **Web Dashboard (Frontend)**: [http://localhost:8009](http://localhost:8009)
- **Dokumentasi Interaktif API (Swagger UI)**: [http://localhost:8009/docs](http://localhost:8009/docs)
- **Endpoint WebSocket**: `ws://localhost:8009/ws/audio`

### 3. Menghentikan Container
Untuk mematikan container:
```bash
docker compose down
```

---

## 🛠️ Struktur Berkas Utama

```text
├── Dockerfile              # Cetak biru multi-stage build (Node.js + Python FastAPI)
├── docker-compose.yml      # Konfigurasi orkestrasi Docker untuk Kelompok 9 (Port 8009:8000)
├── requirements.txt        # Dependensi Python backend & audio processing
├── .dockerignore           # Pengecualian berkas cache/node_modules pada Docker build
├── Backend/
│   ├── main.py             # Server FastAPI, WebSocket handler, & static file server
│   ├── models/             # File model Random Forest, Scaler, dan Label Encoder
│   └── data/               # Dataset & ekstraksi fitur audio
├── Frontend/
│   └── vite-project/       # Antarmuka pengguna berbasis React + TypeScript + Vite
```

---

## 💻 Menjalankan Secara Lokal (Opsional / Development)

Jika ingin menjalankan tanpa Docker:

1. **Jalankan Backend:**
   ```bash
   pip install -r requirements.txt
   cd Backend
   uvicorn main:app --reload --host 127.0.0.1 --port 8000
   ```

2. **Jalankan Frontend:**
   ```bash
   cd Frontend/vite-project
   npm install
   npm run dev
   ```
   Akses `http://localhost:5173`.
