import os
import io
import json
import zipfile
import joblib
import warnings
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, ConfusionMatrixDisplay, classification_report,
    roc_curve, auc
)

warnings.filterwarnings('ignore')
plt.style.use('seaborn-v0_8-whitegrid' if 'seaborn-v0_8-whitegrid' in plt.style.available else 'default')

def extract_features_from_audio(file_obj, sr=22050):
    """Ekstraksi 16 fitur audio menggunakan Librosa."""
    import librosa
    y, sr = librosa.load(file_obj, sr=sr, mono=True)
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
        
    return features, len(y) / sr

def sync_crawling_data(root_dir):
    """
    Memeriksa dan menampilkan hasil crawling audio.
    Jika CSV belum ada, lakukan ekstraksi otomatis dari folder crawling/data.
    """
    crawling_dir = os.path.join(root_dir, 'crawling')
    raw_dir = os.path.join(root_dir, 'data', 'raw')
    backend_data_dir = os.path.join(root_dir, 'Backend', 'data')
    processed_dir = os.path.join(root_dir, 'data', 'processed')
    
    os.makedirs(backend_data_dir, exist_ok=True)
    os.makedirs(processed_dir, exist_ok=True)
    
    csv_candidates = [
        os.path.join(backend_data_dir, 'audio_features_16.csv'),
        os.path.join(processed_dir, 'audio_features_16.csv'),
        os.path.join(crawling_dir, 'audio_features_16.csv'),
    ]
    existing_csv = next((p for p in csv_candidates if os.path.exists(p)), None)
    
    print("\n" + "="*70)
    print("1. PEMERIKSAAN & RINGKASAN DATA CRAWLING AUDIO")
    print("="*70)
    
    # 1. Cek folder crawling (File ZIP)
    zip_categories = [
        ('File Audio Berisik.zip', 'berisik'),
        ('File Audio Non Berisik.zip', 'non_berisik')
    ]
    
    crawling_summary = {}
    sample_files = []
    
    for zip_name, label in zip_categories:
        zip_path = os.path.join(crawling_dir, zip_name)
        if os.path.exists(zip_path):
            with zipfile.ZipFile(zip_path, 'r') as zf:
                valid_files = [f for f in zf.namelist() if not f.endswith('/') and not f.startswith('__MACOSX')]
                crawling_summary[label] = len(valid_files)
                for f in valid_files[:3]:
                    sample_files.append((label, os.path.basename(f)))
        else:
            # Cek di folder raw
            class_dir = os.path.join(raw_dir, label)
            if os.path.exists(class_dir):
                files = [f for f in os.listdir(class_dir) if f.lower().endswith(('.mp3', '.wav'))]
                crawling_summary[label] = len(files)
                for f in files[:3]:
                    sample_files.append((label, f))
    
    total_crawled = sum(crawling_summary.values())
    print(f"Status Sumber Crawling : Ditemukan {total_crawled} file audio mentah di folder crawling.")
    for lbl, cnt in crawling_summary.items():
        print(f" - Kategori [{lbl.upper()}] : {cnt} file audio")
    
    print("\nContoh File Hasil Crawling:")
    for lbl, fname in sample_files:
        print(f"   * [{lbl}] {fname}")
        
    # Jika CSV belum ada, ekstrak fitur otomatis
    if not existing_csv:
        print("\n[INFO] File CSV fitur belum ditemukan. Mengekstrak 16 fitur audio sekarang...")
        records = []
        for zip_name, label in zip_categories:
            zip_path = os.path.join(crawling_dir, zip_name)
            if os.path.exists(zip_path):
                with zipfile.ZipFile(zip_path, 'r') as zf:
                    flist = [f for f in zf.namelist() if not f.endswith('/') and not f.startswith('__MACOSX')]
                    for f in flist:
                        clean_fname = os.path.basename(f)
                        with zf.open(f) as audio_f:
                            try:
                                feats, _ = extract_features_from_audio(io.BytesIO(audio_f.read()))
                                records.append({'filename': clean_fname, 'label': label, **feats})
                            except Exception as err:
                                print(f"Gagal proses {clean_fname}: {err}")
        
        feature_cols = ['rms', 'centroid', 'zcr'] + [f'mfcc_{i}' for i in range(1, 14)]
        ordered_cols = ['filename', 'label'] + feature_cols
        df = pd.DataFrame(records)[ordered_cols]
        target_csv = os.path.join(backend_data_dir, 'audio_features_16.csv')
        df.to_csv(target_csv, index=False)
        df.to_csv(os.path.join(processed_dir, 'audio_features_16.csv'), index=False)
        return target_csv, df
    else:
        df = pd.read_csv(existing_csv)
        return existing_csv, df

def main():
    # Kompatibilitas untuk script (.py) dan Jupyter Notebook
    try:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        root_dir = os.path.dirname(base_dir) # Mundur satu folder ke root
    except NameError:
        cwd = os.getcwd()
        if os.path.basename(cwd) in ['src', 'notebooks']:
            root_dir = os.path.dirname(cwd)
        else:
            root_dir = cwd
        base_dir = os.path.join(root_dir, 'src')
        
    images_dir = os.path.join(root_dir, 'docs', 'images') 
    models_dir = os.path.join(root_dir, 'models')
    backend_models_dir = os.path.join(root_dir, 'Backend', 'models')
    
    os.makedirs(images_dir, exist_ok=True)
    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(backend_models_dir, exist_ok=True)
    
    # 1. Sinkronisasi & Tampilkan Hasil Crawling
    csv_path, df = sync_crawling_data(root_dir)
    
    print("\n" + "="*70)
    print("2. DATASET 16 FITUR HASIL EKSTRAKSI")
    print("="*70)
    print(f"Lokasi File CSV       : {csv_path}")
    print(f"Total Sampel Dataset  : {df.shape[0]} baris")
    print(f"Jumlah Kolom Data     : {df.shape[1]} kolom (2 identitas + 16 fitur akustik)")
    print("\nSebaran Kelas Dataset:")
    counts = df['label'].value_counts()
    for lbl, c in counts.items():
        print(f" - {lbl:<12} : {c} sampel ({c/len(df)*100:.1f}%)")
        
    print("\nPratinjau Data (5 Baris Pertama):")
    feature_cols = ['rms', 'centroid', 'zcr'] + [f'mfcc_{i}' for i in range(1, 14)]
    print(df[['filename', 'label', 'rms', 'centroid', 'zcr', 'mfcc_1', 'mfcc_2']].head().to_string(index=False))

    # -------------------------------------------------------------------------
    # 2. EDA & VISUALISASI
    # -------------------------------------------------------------------------
    print("\n" + "="*70)
    print("3. MEMBUAT VISUALISASI EKSPLORASI DATA (EDA)")
    print("="*70)
    
    # a. Class Distribution
    fig, ax = plt.subplots(figsize=(6, 4))
    bars = ax.bar(counts.index, counts.values, color=['#e74c3c', '#2ecc71'], width=0.45, edgecolor='black', alpha=0.9)
    for bar in bars:
        yval = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2.0, yval + 1, f'{yval} ({yval/len(df)*100:.1f}%)', ha='center', va='bottom')
    ax.set_title('Distribusi Kelas Audio (Hasil Crawling)', fontsize=12)
    ax.set_ylabel('Jumlah Sampel', fontsize=11)
    ax.set_ylim(0, max(counts.values) + 15)
    plt.tight_layout()
    plt.savefig(os.path.join(images_dir, 'class_distribution.png'), dpi=200)
    plt.close()
    
    # b. Perbandingan Fitur Utama
    fig, axes = plt.subplots(1, 3, figsize=(14, 4.2))
    key_features = [('rms', 'RMS Energy'), ('centroid', 'Spectral Centroid (Hz)'), ('zcr', 'Zero Crossing Rate')]
    for idx, (col, title) in enumerate(key_features):
        sns.boxplot(x='label', y=col, hue='label', data=df, ax=axes[idx], legend=False)
        axes[idx].set_title(title)
    plt.suptitle('Perbandingan Karakteristik Fitur Utama per Kategori Audio', fontsize=13, y=1.03)
    plt.tight_layout()
    plt.savefig(os.path.join(images_dir, 'feature_distribution.png'), dpi=200)
    plt.close()

    # c. Correlation Matrix
    fig, ax = plt.subplots(figsize=(11, 9))
    corr = df[feature_cols].corr()
    sns.heatmap(corr, annot=True, fmt='.2f', cmap='coolwarm', cbar=True, ax=ax, linewidths=0.5, annot_kws={"size": 7.5})
    ax.set_title('Matriks Korelasi Pearson Antar 16 Fitur Audio', fontsize=13)
    plt.tight_layout()
    plt.savefig(os.path.join(images_dir, 'correlation_matrix.png'), dpi=200)
    plt.close()
    print("Grafik EDA berhasil diekspor ke folder docs/images/.")

    # -------------------------------------------------------------------------
    # 3. PREPROCESSING & SPLITTING
    # -------------------------------------------------------------------------
    print("\n" + "="*70)
    print("4. PREPROCESSING & PEMBAGIAN DATA (80% LATIH : 20% UJI)")
    print("="*70)
    
    X = df[feature_cols].values
    le = LabelEncoder()
    y_encoded = le.fit_transform(df['label'].values)
    mapping = dict(zip(le.classes_, [int(x) for x in le.transform(le.classes_)]))
    print(f"Mapping Label Kelas : {mapping}")
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.2, random_state=14, stratify=y_encoded
    )
    
    print(f"Jumlah Data Latih (Train Set) : {X_train.shape[0]} sampel (80%)")
    print(f"Jumlah Data Uji   (Test Set)  : {X_test.shape[0]} sampel (20%) -> 20 Berisik, 20 Non-Berisik")
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    print("Penskalaan fitur menggunakan StandardScaler selesai.")

    # -------------------------------------------------------------------------
    # 4. MODELING RANDOM FOREST
    # -------------------------------------------------------------------------
    print("\n" + "="*70)
    print("5. MELATIH MODEL RANDOM FOREST (100 DECISION TREES)")
    print("="*70)
    
    rf_model = RandomForestClassifier(n_estimators=100, criterion='entropy', random_state=42)
    rf_model.fit(X_train_scaled, y_train)
    print("Pelatihan model Random Forest selesai.")
    
    y_pred = rf_model.predict(X_test_scaled)
    y_proba = rf_model.predict_proba(X_test_scaled)
    
    # -------------------------------------------------------------------------
    # 5. EVALUASI MODEL PADA TEST SET
    # -------------------------------------------------------------------------
    print("\n" + "="*70)
    print("6. EVALUASI HASIL PREDIKSI PADA DATA UJI (TEST SET)")
    print("="*70)
    
    acc = accuracy_score(y_test, y_pred)
    berisik_code = int(le.transform(['berisik'])[0]) if 'berisik' in le.classes_ else 0
    non_berisik_code = int(le.transform(['non_berisik'])[0]) if 'non_berisik' in le.classes_ else 1
    
    prec = precision_score(y_test, y_pred, pos_label=berisik_code)
    rec = recall_score(y_test, y_pred, pos_label=berisik_code)
    f1 = f1_score(y_test, y_pred, pos_label=berisik_code)
    
    # ROC Curve & AUC
    fpr, tpr, _ = roc_curve(y_test, y_proba[:, non_berisik_code], pos_label=non_berisik_code)
    roc_auc = auc(fpr, tpr)
    
    # Confusion Matrix
    cm = confusion_matrix(y_test, y_pred)
    
    print(f"[*] AKURASI PENGUJIAN (Test Accuracy) : {acc*100:.2f}%")
    print(f"[*] Presisi Kelas Berisik              : {prec*100:.2f}%")
    print(f"[*] Recall Kelas Berisik               : {rec*100:.2f}%")
    print(f"[*] F1-Score Kelas Berisik             : {f1*100:.2f}%")
    print(f"[*] ROC-AUC Score                      : {roc_auc:.4f}")
    
    print("\nLaporan Klasifikasi Lengkap (Classification Report):")
    print(classification_report(y_test, y_pred, target_names=le.classes_))
    
    print("Confusion Matrix:")
    print(f" - Benar Berisik     (True Positive)  : {cm[0][0]} sampel")
    print(f" - Salah Ditebak     (False Negative) : {cm[0][1]} sampel")
    print(f" - Salah Berisik     (False Positive) : {cm[1][0]} sampel")
    print(f" - Benar Non-Berisik (True Negative)  : {cm[1][1]} sampel")
    
    # Simpan Gambar Confusion Matrix
    fig, ax = plt.subplots(figsize=(5.5, 4.5))
    disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=[c.replace('_', '-').title() for c in le.classes_])
    disp.plot(cmap='Blues', ax=ax, values_format='d')
    ax.set_title('Confusion Matrix RF (Test Set)', fontsize=12)
    plt.tight_layout()
    plt.savefig(os.path.join(images_dir, 'confusion_matrix.png'), dpi=200)
    plt.close()
    
    # Simpan Gambar ROC Curve
    fig, ax = plt.subplots(figsize=(6, 4.5))
    ax.plot(fpr, tpr, color='#e67e22', lw=2.5, label=f'ROC Curve (AUC = {roc_auc:.3f})')
    ax.plot([0, 1], [0, 1], color='#7f8c8d', lw=1.5, linestyle='--')
    ax.set_title('Receiver Operating Characteristic (ROC) Curve')
    ax.legend(loc="lower right")
    plt.tight_layout()
    plt.savefig(os.path.join(images_dir, 'roc_curve.png'), dpi=200)
    plt.close()

    # -------------------------------------------------------------------------
    # 6. SIMPAN MODEL & ARTIFAK
    # -------------------------------------------------------------------------
    print("\n" + "="*70)
    print("7. MENYIMPAN MODEL & ARTIFAK SERIALISASI")
    print("="*70)
    
    metadata = {
        'model_name': 'Random Forest',
        'test_metrics': {
            'accuracy': float(acc),
            'precision': float(prec),
            'recall': float(rec),
            'f1_score': float(f1),
            'roc_auc': float(roc_auc)
        },
        'feature_names': feature_cols,
        'classes': list(le.classes_)
    }
    
    for target_dir in [models_dir, backend_models_dir]:
        joblib.dump(rf_model, os.path.join(target_dir, 'rf_model.pkl'))
        joblib.dump(scaler, os.path.join(target_dir, 'scaler.pkl'))
        joblib.dump(le, os.path.join(target_dir, 'label_encoder.pkl'))
        with open(os.path.join(target_dir, 'model_metadata.json'), 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=4)
        print(f"Artifak tersimpan di: {target_dir}")
        
    print("\n>>> SEMUA PROSES PELATIHAN DAN PENYIMPANAN SELESAI DENGAN SUKSES! <<<")

if __name__ == '__main__':
    main()