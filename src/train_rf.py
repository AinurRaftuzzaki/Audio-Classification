import os
import json
import joblib
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
import warnings
warnings.filterwarnings('ignore')

plt.style.use('seaborn-v0_8-whitegrid' if 'seaborn-v0_8-whitegrid' in plt.style.available else 'default')

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.dirname(base_dir) # Mundur satu folder ke root (Audio-Classification)
    
    data_csv = os.path.join(root_dir, 'Backend', 'data', 'audio_features_16.csv')
    images_dir = os.path.join(root_dir, 'docs', 'images') 
    models_dir = os.path.join(root_dir, 'models')
    
    os.makedirs(images_dir, exist_ok=True)
    os.makedirs(models_dir, exist_ok=True)
    
    print("="*60)
    print("1. MEMUAT DATASET FITUR AUDIO")
    print("="*60)
    df = pd.read_csv(data_csv)
    print(f"Dataset berhasil dimuat: {df.shape[0]} baris, {df.shape[1]} kolom.")
    print(df['label'].value_counts())
    
    feature_cols = ['rms', 'centroid', 'zcr'] + [f'mfcc_{i}' for i in range(1, 14)]
    
    # -------------------------------------------------------------------------
    # 2. EDA & VISUALISASI
    # -------------------------------------------------------------------------
    print("\n" + "="*60)
    print("2. MEMBUAT VISUALISASI EDA")
    print("="*60)
    
    # a. Class Distribution
    fig, ax = plt.subplots(figsize=(6, 4))
    counts = df['label'].value_counts()
    bars = ax.bar(counts.index, counts.values, color=['#e74c3c', '#2ecc71'], width=0.45, edgecolor='black', alpha=0.9)
    for bar in bars:
        yval = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2.0, yval + 1, f'{yval} ({yval/len(df)*100:.1f}%)', ha='center', va='bottom')
    ax.set_title('Distribusi Kelas Audio', fontsize=12)
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
    
    # -------------------------------------------------------------------------
    # 3. PREPROCESSING & SPLITTING
    # -------------------------------------------------------------------------
    print("\n" + "="*60)
    print("3. PREPROCESSING & ENCODING")
    print("="*60)
    
    X = df[feature_cols].values
    
    le = LabelEncoder()
    y_encoded = le.fit_transform(df['label'].values)
    print(f"Mapping Label: {dict(zip(le.classes_, le.transform(le.classes_)))}")
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.2, random_state=14, stratify=y_encoded
    )
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # -------------------------------------------------------------------------
    # 4. MODELING RANDOM FOREST
    # -------------------------------------------------------------------------
    print("\n" + "="*60)
    print("4. PELATIHAN MODEL RANDOM FOREST")
    print("="*60)
    
    rf_model = RandomForestClassifier(n_estimators=100, criterion='entropy', random_state=42)
    rf_model.fit(X_train_scaled, y_train)
    
    y_pred = rf_model.predict(X_test_scaled)
    y_proba = rf_model.predict_proba(X_test_scaled)
    
    # -------------------------------------------------------------------------
    # 5. EVALUASI MODEL
    # -------------------------------------------------------------------------
    print("\n" + "="*60)
    print("5. EVALUASI MODEL PADA TEST SET")
    print("="*60)
    
    acc = accuracy_score(y_test, y_pred)
    berisik_code = int(le.transform(['berisik'])[0]) if 'berisik' in le.classes_ else 0
    non_berisik_code = int(le.transform(['non_berisik'])[0]) if 'non_berisik' in le.classes_ else 1
    
    prec = precision_score(y_test, y_pred, pos_label=berisik_code)
    rec = recall_score(y_test, y_pred, pos_label=berisik_code)
    f1 = f1_score(y_test, y_pred, pos_label=berisik_code)
    
    print(f"Test Accuracy : {acc*100:.2f}%")
    print("\nClassification Report:\n", classification_report(y_test, y_pred, target_names=le.classes_))
    
    # Confusion Matrix
    cm = confusion_matrix(y_test, y_pred)
    fig, ax = plt.subplots(figsize=(5.5, 4.5))
    disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=[c.replace('_', '-').title() for c in le.classes_])
    disp.plot(cmap='Blues', ax=ax, values_format='d')
    ax.set_title('Confusion Matrix RF (Test Set)', fontsize=12)
    plt.tight_layout()
    plt.savefig(os.path.join(images_dir, 'confusion_matrix.png'), dpi=200)
    plt.close()
    
    # ROC Curve
    fpr, tpr, _ = roc_curve(y_test, y_proba[:, non_berisik_code], pos_label=non_berisik_code)
    roc_auc = auc(fpr, tpr)
    
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
    print("\n" + "="*60)
    print("6. MENYIMPAN MODEL & SCALER")
    print("="*60)
    
    backend_models_dir = os.path.join(root_dir, 'Backend', 'models')
    os.makedirs(backend_models_dir, exist_ok=True)
    
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
        
    print("SEMUA PROSES SELESAI DENGAN SUKSES!")

if __name__ == '__main__':
    main()