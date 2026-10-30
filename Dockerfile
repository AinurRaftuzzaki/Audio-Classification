# ==========================================
# Tahap 1: Build Frontend (React + Vite)
# ==========================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy dependencies manifest
COPY Frontend/vite-project/package*.json ./

# Install dependencies frontend
RUN npm install

# Copy source code frontend dan build
COPY Frontend/vite-project/ ./
RUN npm run build

# ==========================================
# Tahap 2: Backend (FastAPI) & Production Image
# ==========================================
FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

# Install dependencies sistem Linux untuk audio processing (libsndfile & ffmpeg)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install pustaka Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy folder backend dan model
COPY Backend/ ./Backend/
COPY models/ ./models/

# Salin hasil build static frontend dari Tahap 1 ke folder Backend/dist
COPY --from=frontend-builder /app/frontend/dist ./Backend/dist

# Expose port container
EXPOSE 8000

# Jalankan server FastAPI menggunakan uvicorn
CMD ["sh", "-c", "uvicorn Backend.main:app --host 0.0.0.0 --port ${PORT}"]
