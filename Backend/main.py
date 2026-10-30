import os
os.environ["NUMBA_DISABLE_INTEL_SVML"] = "1"
import joblib
import numpy as np
import librosa
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# 1. Inisialisasi Aplikasi FastAPI
app = FastAPI(title="Audio Surveillance API")

# 2. Konfigurasi CORS agar frontend React (Vite) diizinkan mengakses API ini
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Izinkan semua domain saat fase development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Konfigurasi Path Model
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, 'models')
if not os.path.exists(os.path.join(MODELS_DIR, 'rf_model.pkl')):
    ROOT_MODELS = os.path.join(BASE_DIR, '..', 'models')
    if os.path.exists(os.path.join(ROOT_MODELS, 'rf_model.pkl')):
        MODELS_DIR = ROOT_MODELS

# 4. Memuat Model, Scaler, dan Label Encoder
print("[INFO] Memuat model Random Forest...")
try:
    rf_model = joblib.load(os.path.join(MODELS_DIR, 'rf_model.pkl'))
    scaler = joblib.load(os.path.join(MODELS_DIR, 'scaler.pkl'))
    label_encoder = joblib.load(os.path.join(MODELS_DIR, 'label_encoder.pkl'))
except FileNotFoundError as e:
    print(f"[ERROR] File model tidak ditemukan. Pastikan folder models/ sudah dipindahkan ke backend. Detail: {e}")

# 5. Warm-up Librosa agar inferensi pertama tidak lag
print("[INFO] Melakukan warm-up fungsi ekstraksi audio...")
dummy_audio = np.random.randn(22050 * 3).astype(np.float32) * 0.05
_ = librosa.feature.mfcc(y=dummy_audio, sr=22050, n_mfcc=13)
print("[INFO] Server siap untuk inferensi real-time!")

# 6. Endpoint WebSocket untuk streaming audio real-time
@app.websocket("/ws/audio")
async def websocket_audio_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("[INFO] Client terhubung ke WebSocket.")
    try:
        while True:
            # Menerima data biner (PCM Float32) dari frontend 
            data = await websocket.receive_bytes()
            
            # Konversi byte ke NumPy array
            audio_array = np.frombuffer(data, dtype=np.float32)
            
            if len(audio_array) < 1024:
                await websocket.send_json({"error": "Data audio terlalu pendek"})
                continue
            
            # Ekstraksi 16 Fitur Audio
            sr = 22050
            rms = float(np.mean(librosa.feature.rms(y=audio_array)))
            centroid = float(np.mean(librosa.feature.spectral_centroid(y=audio_array, sr=sr)))
            zcr = float(np.mean(librosa.feature.zero_crossing_rate(y=audio_array)))
            mfcc = librosa.feature.mfcc(y=audio_array, sr=sr, n_mfcc=13)
            mfcc_means = [float(np.mean(c)) for c in mfcc]
            
            # Gabungkan fitur dan terapkan StandardScaler
            feature_vector = [rms, centroid, zcr] + mfcc_means
            scaled_features = scaler.transform(np.array(feature_vector).reshape(1, -1))
            
            # Inferensi Model Random Forest
            pred_code = int(rf_model.predict(scaled_features)[0])
            pred_label = label_encoder.inverse_transform([pred_code])[0]
            pred_proba = rf_model.predict_proba(scaled_features)[0]
            confidence = float(pred_proba[pred_code] * 100)
            
            # Kirim respons ke frontend
            await websocket.send_json({
                "label": pred_label,
                "confidence": confidence,
                "features": {
                    "rms": rms,
                    "centroid": centroid,
                    "zcr": zcr
                }
            })
    except WebSocketDisconnect:
        print("[INFO] Client terputus dari WebSocket.")
    except Exception as e:
        print(f"[ERROR] Terjadi kesalahan: {e}")

# 7. Serve Static Files Frontend (Production Build)
DIST_DIR = os.path.join(BASE_DIR, 'dist')
if not os.path.exists(DIST_DIR):
    DEV_DIST = os.path.join(BASE_DIR, '..', 'Frontend', 'vite-project', 'dist')
    if os.path.exists(DEV_DIST):
        DIST_DIR = DEV_DIST

if os.path.exists(DIST_DIR):
    print(f"[INFO] Frontend production build terdeteksi di: {DIST_DIR}")
    app.mount("/", StaticFiles(directory=DIST_DIR, html=True), name="frontend")