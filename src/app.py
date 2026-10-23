import os
import io
import sys
import json
import socket
import subprocess
import joblib
import numpy as np
import pandas as pd
import librosa
import streamlit as st
import streamlit.components.v1 as components
import matplotlib.pyplot as plt

# Konfigurasi Halaman Streamlit
st.set_page_config(
    page_title="Audio Classifier - Berisik vs Non-Berisik",
    page_icon="🎙️",
    layout="wide",
    initial_sidebar_state="expanded"
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, 'models')
DATA_CSV = os.path.join(BASE_DIR, 'crawling', 'audio_features_16.csv')
IMAGES_DIR = os.path.join(BASE_DIR, 'images')

# Pastikan Live Server (Flask Port 5000) Aktif di Latar Belakang
def is_port_in_use(port=5000):
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            return s.connect_ex(('127.0.0.1', port)) == 0
    except Exception:
        return False

def ensure_live_server():
    if not is_port_in_use(5000):
        server_script = os.path.join(BASE_DIR, 'live_server.py')
        creation_flags = 0x08000000 if os.name == 'nt' else 0
        try:
            subprocess.Popen(
                [sys.executable, server_script],
                cwd=BASE_DIR,
                creationflags=creation_flags
            )
        except Exception as e:
            print("Gagal menjalankan live_server otomatis:", e)

ensure_live_server()

# Kustomisasi CSS Modern & Responsif
st.markdown("""
<style>
    .main-header {
        font-size: 2.1rem;
        font-weight: 800;
        color: #0f172a;
        margin-bottom: 0.2rem;
    }
    .sub-header {
        font-size: 1.05rem;
        color: #475569;
        margin-bottom: 1.2rem;
    }
    .badge-card {
        padding: 1.3rem;
        border-radius: 14px;
        color: white;
        text-align: center;
        margin-bottom: 1.2rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    }
    .badge-noisy {
        background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
    }
    .badge-clean {
        background: linear-gradient(135deg, #10b981 0%, #047857 100%);
    }
    .metric-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 0.9rem;
        text-align: center;
    }
    .metric-val {
        font-size: 1.35rem;
        font-weight: 700;
        color: #0f172a;
    }
    .metric-lbl {
        font-size: 0.8rem;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-weight: 600;
        margin-top: 0.2rem;
    }
    .callout-box {
        background-color: #f1f5f9;
        border-left: 4px solid #3b82f6;
        padding: 1rem;
        border-radius: 0 8px 8px 0;
        margin-bottom: 1rem;
    }
</style>
""", unsafe_allow_html=True)

# Cache Model Loading
@st.cache_resource
def load_artifacts():
    model_path = os.path.join(MODELS_DIR, 'knn_model.pkl')
    scaler_path = os.path.join(MODELS_DIR, 'scaler.pkl')
    encoder_path = os.path.join(MODELS_DIR, 'label_encoder.pkl')
    metadata_path = os.path.join(MODELS_DIR, 'model_metadata.json')
    
    model = joblib.load(model_path)
    scaler = joblib.load(scaler_path)
    encoder = joblib.load(encoder_path)
    
    with open(metadata_path, 'r', encoding='utf-8') as f:
        metadata = json.load(f)
        
    return model, scaler, encoder, metadata

@st.cache_data
def load_dataset():
    if os.path.exists(DATA_CSV):
        return pd.read_csv(DATA_CSV)
    return None

def extract_16_features_from_audio(y, sr=22050):
    """Ekstraksi tepat 16 fitur audio (RMS, Centroid, ZCR, MFCC 1-13)."""
    rms = float(np.mean(librosa.feature.rms(y=y)))
    centroid = float(np.mean(librosa.feature.spectral_centroid(y=y, sr=sr)))
    zcr = float(np.mean(librosa.feature.zero_crossing_rate(y=y)))
    
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
    mfcc_means = [float(np.mean(c)) for c in mfcc]
    
    features = {
        'rms': rms,
        'centroid': centroid,
        'zcr': zcr,
    }
    for i, m_val in enumerate(mfcc_means, start=1):
        features[f'mfcc_{i}'] = m_val
        
    feature_order = ['rms', 'centroid', 'zcr'] + [f'mfcc_{i}' for i in range(1, 14)]
    feature_vector = np.array([features[k] for k in feature_order]).reshape(1, -1)
    
    return features, feature_vector, feature_order

# Load Model
try:
    knn_model, scaler, label_encoder, metadata = load_artifacts()
    df_data = load_dataset()
    artifacts_loaded = True
except Exception as e:
    artifacts_loaded = False
    load_error = str(e)

# Sidebar Navigasi
st.sidebar.image("https://cdn-icons-png.flaticon.com/512/3844/3844724.png", width=65)
st.sidebar.title("Audio Classifier")
st.sidebar.markdown("**Klasifikasi Langsung Suara Berisik vs Non-Berisik** menggunakan Model K-Nearest Neighbors (KNN).")

menu = st.sidebar.radio(
    "Navigasi Halaman:",
    [
        "⚡ Live Audio Classifier (Deteksi Langsung & Bunyi)",
        "📊 Eksplorasi Dataset 16 Fitur",
        "🧠 Kinerja & Evaluasi Model KNN",
        "📖 Metodologi & Alur CRISP-DM"
    ]
)

st.sidebar.markdown("---")
st.sidebar.markdown("### Status Sistem")
if artifacts_loaded:
    st.sidebar.success("✅ Model: KNN Aktif")
    st.sidebar.markdown(f"- **Akurasi Test Set**: `{metadata['test_metrics']['accuracy']*100:.1f}%`")
    st.sidebar.markdown(f"- **CV Akurasi (5-Fold)**: `{metadata['cv_mean_accuracy']*100:.1f}%`")
    st.sidebar.markdown(f"- **Nilai K Optimal**: `{metadata['best_hyperparameters']['n_neighbors']}`")
    st.sidebar.markdown(f"- **Metrik Jarak**: `{metadata['best_hyperparameters']['metric'].capitalize()}`")
    st.sidebar.markdown(f"- **Fitur Ekstraksi**: `16 Dimensi`")
    st.sidebar.markdown(f"- **Total Sampel Latih**: `{metadata['train_samples']} Data`")
else:
    st.sidebar.error("❌ Model gagal dimuat!")

st.sidebar.markdown("---")
st.sidebar.caption("Proyek Sains Data - Audio Classification System")

# ==============================================================================
# MENU 1: LIVE AUDIO STREAMING CLASSIFIER DENGAN SOUND ALARM
# ==============================================================================
if menu == "⚡ Live Audio Classifier (Deteksi Langsung & Bunyi)":
    st.markdown('<div class="main-header">⚡ Live Audio Detection & Alarm System</div>', unsafe_allow_html=True)
    st.markdown('<div class="sub-header">Mikrofon aktif mendengarkan secara langsung tanpa henti. Saat terjadi kebisingan selama jendela waktu yang ditentukan, <b>sistem langsung mendeteksi, mengklasifikasikan, dan membunyikan alarm suara!</b></div>', unsafe_allow_html=True)

    # Embed Live Interface langsung (tanpa tab, tanpa link tab baru)
    components.iframe("http://localhost:5000", height=760, scrolling=True)

# ==============================================================================
# MENU 2: EKSPLORASI DATASET 16 FITUR
# ==============================================================================
elif menu == "📊 Eksplorasi Dataset 16 Fitur":
    st.markdown('<div class="main-header">📊 Eksplorasi Dataset 16 Fitur Audio</div>', unsafe_allow_html=True)
    st.markdown('<div class="sub-header">Data hasil ekstraksi dari 197 file audio di folder <code>crawling/</code> dengan total 16 fitur akustik.</div>', unsafe_allow_html=True)
    
    if df_data is not None:
        c1, c2, c3, c4 = st.columns(4)
        c1.metric("Total Sampel Audio", f"{len(df_data)} file")
        c2.metric("Kelas Berisik", f"{(df_data['label'] == 'berisik').sum()} sampel")
        c3.metric("Kelas Non-Berisik", f"{(df_data['label'] == 'non_berisik').sum()} sampel")
        c4.metric("Jumlah Kolom Fitur", "16 fitur")
        
        tab_tabel, tab_visual, tab_stats = st.tabs(["📋 Tabel Data Lengkap", "📈 Visualisasi Fitur", "📐 Statistik Deskriptif"])
        
        with tab_tabel:
            st.markdown("Filter data berdasarkan kategori:")
            kategori_filter = st.multiselect("Pilih Kategori:", options=['berisik', 'non_berisik'], default=['berisik', 'non_berisik'])
            df_filtered = df_data[df_data['label'].isin(kategori_filter)]
            
            st.dataframe(df_filtered, width="stretch")
            
            csv_export = df_filtered.to_csv(index=False).encode('utf-8')
            st.download_button(
                label="📥 Unduh Data CSV (16 Fitur Audio)",
                data=csv_export,
                file_name="audio_features_16_dataset.csv",
                mime="text/csv"
            )
            
        with tab_visual:
            col_v1, col_v2 = st.columns(2)
            with col_v1:
                st.markdown("#### Distribusi Kelas")
                if os.path.exists(os.path.join(IMAGES_DIR, 'class_distribution.png')):
                    st.image(os.path.join(IMAGES_DIR, 'class_distribution.png'), width="stretch")
            with col_v2:
                st.markdown("#### Karakteristik Waveform & Spectrogram")
                if os.path.exists(os.path.join(IMAGES_DIR, 'audio_waveforms_sample.png')):
                    st.image(os.path.join(IMAGES_DIR, 'audio_waveforms_sample.png'), width="stretch")
                    
            st.markdown("#### Perbandingan Karakteristik Fitur Utama (RMS, Centroid, ZCR)")
            if os.path.exists(os.path.join(IMAGES_DIR, 'feature_distribution.png')):
                st.image(os.path.join(IMAGES_DIR, 'feature_distribution.png'), width="stretch")
                
            st.markdown("#### Matriks Korelasi Antar 16 Fitur")
            if os.path.exists(os.path.join(IMAGES_DIR, 'correlation_matrix.png')):
                st.image(os.path.join(IMAGES_DIR, 'correlation_matrix.png'), width="stretch")

        with tab_stats:
            st.markdown("#### Statistik Ringkasan per Kategori")
            group_stats = df_data.groupby('label').mean(numeric_only=True).T
            st.dataframe(group_stats, width="stretch")

# ==============================================================================
# MENU 3: KINERJA MODEL KNN
# ==============================================================================
elif menu == "🧠 Kinerja & Evaluasi Model KNN":
    st.markdown('<div class="main-header">🧠 Kinerja & Evaluasi Model KNN</div>', unsafe_allow_html=True)
    st.markdown('<div class="sub-header">Hasil pelatihan model K-Nearest Neighbors pada data training dan pengujian pada test set (80:20).</div>', unsafe_allow_html=True)
    
    if artifacts_loaded:
        st.markdown("#### 🔬 Metrik Evaluasi Test Set (Data Uji 20% — 40 Sampel)")
        m1, m2, m3, m4, m5 = st.columns(5)
        m1.metric("Akurasi Test Set", f"{metadata['test_metrics']['accuracy']*100:.1f}%")
        m2.metric("Precision", f"{metadata['test_metrics']['precision']*100:.1f}%")
        m3.metric("Recall", f"{metadata['test_metrics']['recall']*100:.1f}%")
        m4.metric("F1-Score", f"{metadata['test_metrics']['f1_score']*100:.1f}%")
        m5.metric("ROC AUC", f"{metadata['test_metrics']['roc_auc']:.3f}")

        st.info(
            f"\u2139\ufe0f **Catatan Penting \u2014 Dua Nilai Akurasi yang Berbeda:**\n\n"
            f"- **Akurasi Test Set = {metadata['test_metrics']['accuracy']*100:.1f}%** \u2192 Performa akhir model pada **40 data uji yang belum pernah dilihat** (held-out test set). Ini adalah ukuran performa sesungguhnya.\n\n"
            f"- **CV Accuracy (5-Fold) = {metadata['cv_mean_accuracy']*100:.1f}%** \u2192 Rata-rata akurasi dari **5-Fold Cross-Validation pada data latih** selama proses tuning hyperparameter K. Nilai ini dipakai untuk memilih nilai K terbaik, bukan sebagai akurasi akhir.\n\n"
            f"Kedua nilai ini **wajar berbeda** karena mengukur hal yang berbeda. CV accuracy cenderung lebih konservatif karena setiap fold menggunakan data yang lebih sedikit untuk latih."
        )

        st.markdown("---")
        
        col_m1, col_m2 = st.columns(2)
        with col_m1:
            st.markdown("#### Confusion Matrix")
            if os.path.exists(os.path.join(IMAGES_DIR, 'confusion_matrix.png')):
                st.image(os.path.join(IMAGES_DIR, 'confusion_matrix.png'), use_container_width=True)
                st.caption("Matriks konfusi menunjukkan hanya 3 misklasifikasi dari total 40 sampel uji.")
                
        with col_m2:
            st.markdown("#### Receiver Operating Characteristic (ROC) Curve")
            if os.path.exists(os.path.join(IMAGES_DIR, 'roc_curve.png')):
                st.image(os.path.join(IMAGES_DIR, 'roc_curve.png'), use_container_width=True)
                st.caption(f"Kurva ROC dengan area under curve (AUC) sebesar {metadata['test_metrics']['roc_auc']:.3f}, membuktikan daya pisah kelas yang sangat prima.")
                
        st.markdown("#### Tuning Hyperparameter K \u2014 5-Fold Cross-Validation Accuracy")
        if os.path.exists(os.path.join(IMAGES_DIR, 'knn_k_accuracy.png')):
            st.image(os.path.join(IMAGES_DIR, 'knn_k_accuracy.png'), use_container_width=True)
            st.caption(
                f"Grafik ini menampilkan akurasi rata-rata 5-Fold Cross-Validation **pada data latih** (157 sampel) "
                f"untuk setiap nilai K. K=1 menghasilkan CV accuracy tertinggi sebesar "
                f"{metadata['cv_mean_accuracy']*100:.1f}% dan dipilih sebagai hyperparameter optimal. "
                f"Setelah model akhir (K=1) diuji pada **test set terpisah (40 sampel)**, "
                f"diperoleh akurasi test set sebesar **{metadata['test_metrics']['accuracy']*100:.1f}%** \u2014 "
                f"nilai ini yang mencerminkan performa sesungguhnya model pada data baru."
            )

# ==============================================================================
# MENU 4: METODOLOGI & ALUR CRISP-DM
# ==============================================================================
elif menu == "📖 Metodologi & Alur CRISP-DM":
    st.markdown('<div class="main-header">📖 Metodologi & Alur Kerja CRISP-DM</div>', unsafe_allow_html=True)
    st.markdown('<div class="sub-header">Penjelasan menyeluruh dari Business Understanding hingga Deployment sesuai standar CRISP-DM.</div>', unsafe_allow_html=True)
    
    st.markdown("""
    ### 1. Business Understanding
    - **Latar Belakang**: Kebisingan lingkungan (*noise*) adalah polusi suara yang mengganggu kenyamanan dan aktivitas.
    - **Tujuan**: Membangun model machine learning cerdas yang dapat mengklasifikasikan audio menjadi kategori **Berisik (Noisy)** atau **Non-Berisik (Clean)** secara langsung dari suara mikrofon.
    
    ### 2. Data Understanding & Crawling
    - **Sumber Data**: Data audio mentah berada di folder `crawling/` (`File Audio Berisik.zip` dan `File Audio Non Berisik.zip`).
    - **Karakteristik**: Total 197 file audio valid (99 Berisik, 98 Non-Berisik), dengan rata-rata durasi ~30 detik per file pada sample rate 22050 Hz.
    
    ### 3. Preprocessing Data
    - **Standarisasi Audio**: Konversi mono, sample rate 22050 Hz.
    - **Feature Scaling**: Menggunakan `StandardScaler` ($\mu=0, \sigma=1$) untuk menyetarakan skala seluruh 16 fitur numerik agar perhitungan jarak Euclidean tidak didominasi fitur berskala besar (seperti Spectral Centroid).
    - **Train-Test Split**: Pembagian data 80% training (157 sampel) dan 20% testing (40 sampel) secara stratified.
    
    ### 4. Ekstraksi 16 Fitur Audio
    | No | Fitur | Simbol | Deskripsi & Kegunaan |
    |---|---|---|---|
    | 1 | **RMS (Root Mean Square)** | `rms` | Mengukur energi dan volume sinyal audio. Suara berisik cenderung memiliki energi rata-rata yang lebih tinggi. |
    | 2 | **Spectral Centroid** | `centroid` | Mengukur pusat massa spektrum frekuensi (kecerahan suara/brightness). |
    | 3 | **Zero Crossing Rate** | `zcr` | Mengukur frekuensi perubahan tanda sinyal per detik. Sangat sensitif terhadap noise desis/perkusif. |
    | 4-16 | **MFCC (13 Koefisien)** | `mfcc_1` s/d `mfcc_13` | Merepresentasikan amplop spektral suara berdasarkan persepsi pendengaran manusia pada skala Mel. |
    
    ### 5. Klasifikasi dengan K-Nearest Neighbors (KNN)
    Algoritma KNN menentukan kelas suatu sampel berdasarkan mayoritas kelas dari $k$ tetangga terdekat di ruang fitur menggunakan formula jarak Euclidean:
    $$d(p, q) = \sqrt{\sum_{i=1}^{16} (p_i - q_i)^2}$$
    Melalui GridSearchCV dengan 5-Fold Stratified Cross Validation pada **data latih**, diperoleh parameter terbaik:
    - $k = 1$
    - Metric = Euclidean
    - Weights = Uniform
    - **CV Accuracy (5-Fold, data latih) = 86.0%** *(digunakan untuk memilih K optimal)*
    - **Akurasi Test Set (data uji terpisah) = 92.5%** *(performa akhir model pada data baru)*

    > \u2139\ufe0f **Mengapa dua angka berbeda?** CV accuracy diukur pada data latih dengan validasi silang (setiap fold hanya melihat sebagian data), sedangkan akurasi test set diukur pada 40 sampel yang sama sekali tidak pernah digunakan saat pelatihan atau tuning. Keduanya adalah metrik yang sah dan saling melengkapi.
    
    ### 6. Deployment Sistem
    Sistem dideploy secara ganda:
    - **Live Streaming Audio Surveillance System** (`http://localhost:5000`) dengan fitur mikrofon kontinu, real-time audio visualizer, alarm suara buzzer instan, dan klasifikasi KNN setiap jendela waktu.
    - **Dashboard Analisis & Eksplorasi Streamlit** (`http://localhost:8501`).
    """)
