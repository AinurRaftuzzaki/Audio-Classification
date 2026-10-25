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

# Konfigurasi Halaman Streamlit
st.set_page_config(
    page_title="Audio Classifier - Berisik vs Non-Berisik",
    page_icon="🎙️",
    layout="wide",
    initial_sidebar_state="expanded"
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__)) # Berada di src/
ROOT_DIR = os.path.dirname(BASE_DIR)                  # Mundur ke root (Audio-Classification/)

MODELS_DIR = os.path.join(ROOT_DIR, 'models')
DATA_CSV = os.path.join(ROOT_DIR, 'Backend', 'data', 'audio_features_16.csv')
IMAGES_DIR = os.path.join(ROOT_DIR, 'docs', 'images')

# Pastikan Live Server (Flask Port 5000) Aktif di Latar Belakang
def is_port_in_use(port=5000):
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            return s.connect_ex(('127.0.0.1', port)) == 0
    except Exception:
        return False


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
</style>
""", unsafe_allow_html=True)

# Cache Model Loading
# Ganti bagian load_artifacts di app.py menjadi seperti ini:
@st.cache_resource
def load_artifacts():
    model_path = os.path.join(MODELS_DIR, 'rf_model.pkl') # Pastikan rf_model.pkl
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
    # Coba beberapa kemungkinan jalur folder secara otomatis
    possible_paths = [
        os.path.join(ROOT_DIR, 'Backend', 'data', 'audio_features_16.csv'),
        os.path.join(ROOT_DIR, 'data', 'audio_features_16.csv'),
        os.path.join(BASE_DIR, 'data', 'audio_features_16.csv'),
        'audio_features_16.csv'
    ]
    for path in possible_paths:
        if os.path.exists(path):
            return pd.read_csv(path)
    return None

# Load Model
try:
    rf_model, scaler, label_encoder, metadata = load_artifacts()
    df_data = load_dataset()
    artifacts_loaded = True
except Exception as e:
    artifacts_loaded = False
    load_error = str(e)

# Sidebar Navigasi
st.sidebar.image("https://cdn-icons-png.flaticon.com/512/3844/3844724.png", width=65)
st.sidebar.title("Audio Classifier")
st.sidebar.markdown("**Klasifikasi Langsung Suara Berisik vs Non-Berisik** menggunakan Model Random Forest.")

menu = st.sidebar.radio(
    "Navigasi Halaman:",
    [
        "⚡ Live Audio Classifier (Deteksi Langsung & Bunyi)",
        "📊 Eksplorasi Dataset 16 Fitur",
        "🧠 Kinerja & Evaluasi Model RF",
    ]
)

st.sidebar.markdown("---")
st.sidebar.markdown("### Status Sistem")
if artifacts_loaded:
    st.sidebar.success("✅ Model: Random Forest Aktif")
    st.sidebar.markdown(f"- **Akurasi Test Set**: `{metadata['test_metrics']['accuracy']*100:.1f}%`")
    st.sidebar.markdown(f"- **Pohon Keputusan**: `100 Trees`")
    st.sidebar.markdown(f"- **Fitur Ekstraksi**: `16 Dimensi`")
else:
    st.sidebar.error("❌ Model gagal dimuat!")

st.sidebar.markdown("---")
st.sidebar.caption("Proyek Sains Data - Audio Classification System")

# ==============================================================================
# MENU 1: LIVE AUDIO STREAMING
# ==============================================================================
if menu == "⚡ Live Audio Classifier (Deteksi Langsung & Bunyi)":
    st.markdown('<div class="main-header">⚡ Live Audio Detection & Alarm System</div>', unsafe_allow_html=True)
    st.markdown('<div class="sub-header">Mikrofon aktif mendengarkan secara langsung tanpa henti. Saat terjadi kebisingan selama jendela waktu yang ditentukan, <b>sistem langsung mendeteksi, mengklasifikasikan, dan membunyikan alarm suara!</b></div>', unsafe_allow_html=True)
    components.iframe("http://localhost:5173", height=760, scrolling=True)

# ==============================================================================
# MENU 2: EKSPLORASI DATASET
# ==============================================================================
elif menu == "📊 Eksplorasi Dataset 16 Fitur":
    st.markdown('<div class="main-header">📊 Eksplorasi Dataset 16 Fitur Audio</div>', unsafe_allow_html=True)
    
    if df_data is not None:
        c1, c2, c3, c4 = st.columns(4)
        c1.metric("Total Sampel Audio", f"{len(df_data)} file")
        c2.metric("Kelas Berisik", f"{(df_data['label'] == 'berisik').sum()} sampel")
        c3.metric("Kelas Non-Berisik", f"{(df_data['label'] == 'non_berisik').sum()} sampel")
        c4.metric("Jumlah Kolom Fitur", "16 fitur")
        
        tab_tabel, tab_visual, tab_stats = st.tabs(["📋 Tabel Data Lengkap", "📈 Visualisasi Fitur", "📐 Statistik Deskriptif"])
        
        with tab_tabel:
            st.dataframe(df_data, width="stretch")
            
        with tab_visual:
            col_v1, col_v2 = st.columns(2)
            with col_v1:
                st.markdown("#### Distribusi Kelas")
                if os.path.exists(os.path.join(IMAGES_DIR, 'class_distribution.png')):
                    st.image(os.path.join(IMAGES_DIR, 'class_distribution.png'), width="stretch")
            with col_v2:
                st.markdown("#### Matriks Korelasi")
                if os.path.exists(os.path.join(IMAGES_DIR, 'correlation_matrix.png')):
                    st.image(os.path.join(IMAGES_DIR, 'correlation_matrix.png'), width="stretch")
            
            st.markdown("#### Perbandingan Karakteristik Fitur Utama")
            if os.path.exists(os.path.join(IMAGES_DIR, 'feature_distribution.png')):
                st.image(os.path.join(IMAGES_DIR, 'feature_distribution.png'), width="stretch")

        with tab_stats:
            st.markdown("#### Statistik Ringkasan per Kategori")
            group_stats = df_data.groupby('label').mean(numeric_only=True).T
            st.dataframe(group_stats, width="stretch")

# ==============================================================================
# MENU 3: KINERJA MODEL
# ==============================================================================
elif menu == "🧠 Kinerja & Evaluasi Model RF":
    st.markdown('<div class="main-header">🧠 Kinerja & Evaluasi Model Random Forest</div>', unsafe_allow_html=True)
    st.markdown('<div class="sub-header">Hasil pelatihan model Random Forest pada data training dan pengujian pada test set (80:20).</div>', unsafe_allow_html=True)
    
    if artifacts_loaded:
        m1, m2, m3, m4, m5 = st.columns(5)
        m1.metric("Akurasi Test Set", f"{metadata['test_metrics']['accuracy']*100:.1f}%")
        m2.metric("Precision", f"{metadata['test_metrics']['precision']*100:.1f}%")
        m3.metric("Recall", f"{metadata['test_metrics']['recall']*100:.1f}%")
        m4.metric("F1-Score", f"{metadata['test_metrics']['f1_score']*100:.1f}%")
        m5.metric("ROC AUC", f"{metadata['test_metrics']['roc_auc']:.3f}")

        st.markdown("---")
        col_m1, col_m2 = st.columns(2)
        with col_m1:
            st.markdown("#### Confusion Matrix")
            if os.path.exists(os.path.join(IMAGES_DIR, 'confusion_matrix.png')):
                st.image(os.path.join(IMAGES_DIR, 'confusion_matrix.png'), use_container_width=True)
                
        with col_m2:
            st.markdown("#### Receiver Operating Characteristic (ROC) Curve")
            if os.path.exists(os.path.join(IMAGES_DIR, 'roc_curve.png')):
                st.image(os.path.join(IMAGES_DIR, 'roc_curve.png'), use_container_width=True)

# ==============================================================================
# MENU 4: METODOLOGI
# ==============================================================================

elif menu == "📊 Eksplorasi Dataset 16 Fitur":
    st.markdown('<div class="main-header">📊 Eksplorasi Dataset 16 Fitur Audio</div>', unsafe_allow_html=True)

    if df_data is not None:
        c1, c2, c3, c4 = st.columns(4)
        c1.metric("Total Sampel Audio", f"{len(df_data)} file")
        c2.metric("Kelas Berisik", f"{(df_data['label'] == 'berisik').sum()} sampel")
        c3.metric("Kelas Non-Berisik", f"{(df_data['label'] == 'non_berisik').sum()} sampel")
        c4.metric("Jumlah Kolom Fitur", "16 fitur")

        tab_tabel, tab_visual, tab_stats = st.tabs(["📋 Tabel Data Lengkap", "📈 Visualisasi Fitur", "📐 Statistik Deskriptif"])

        with tab_tabel:
            st.dataframe(df_data, width="stretch")

        with tab_visual:
            col_v1, col_v2 = st.columns(2)
            with col_v1:
                st.markdown("#### Distribusi Kelas")
                if os.path.exists(os.path.join(IMAGES_DIR, 'class_distribution.png')):
                    st.image(os.path.join(IMAGES_DIR, 'class_distribution.png'), width="stretch")
            with col_v2:
                st.markdown("#### Matriks Korelasi")
                if os.path.exists(os.path.join(IMAGES_DIR, 'correlation_matrix.png')):
                    st.image(os.path.join(IMAGES_DIR, 'correlation_matrix.png'), width="stretch")

            st.markdown("#### Perbandingan Karakteristik Fitur Utama")
            if os.path.exists(os.path.join(IMAGES_DIR, 'feature_distribution.png')):
                st.image(os.path.join(IMAGES_DIR, 'feature_distribution.png'), width="stretch")

        with tab_stats:
            st.markdown("#### Statistik Ringkasan per Kategori")
            group_stats = df_data.groupby('label').mean(numeric_only=True).T
            st.dataframe(group_stats, width="stretch")
    else:
        st.error("❌ File dataset `audio_features_16.csv` tidak ditemukan di `Backend/data/`. Periksa kembali letak file CSV kamu.")