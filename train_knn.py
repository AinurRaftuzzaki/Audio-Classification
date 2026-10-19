import os
import json
import joblib
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split, GridSearchCV, StratifiedKFold
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, ConfusionMatrixDisplay, classification_report,
    roc_curve, auc
)
import warnings
warnings.filterwarnings('ignore')

# Set styling
plt.style.use('seaborn-v0_8-whitegrid' if 'seaborn-v0_8-whitegrid' in plt.style.available else 'default')

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_csv = os.path.join(base_dir, 'crawling', 'audio_features_16.csv')
    images_dir = os.path.join(base_dir, 'images')
    models_dir = os.path.join(base_dir, 'models')
    
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
        ax.text(bar.get_x() + bar.get_width()/2.0, yval + 1, f'{yval} ({yval/len(df)*100:.1f}%)', ha='center', va='bottom', fontweight='bold', fontsize=10)
    ax.set_title('Distribusi Kelas Audio (Berisik vs Non-Berisik)', fontsize=12, fontweight='bold')
    ax.set_ylabel('Jumlah Sampel', fontsize=11)
    ax.set_ylim(0, max(counts.values) + 15)
    plt.tight_layout()
    plt.savefig(os.path.join(images_dir, 'class_distribution.png'), dpi=200)
    plt.close()
    print(" - Saved: images/class_distribution.png")
    
    # b. Perbandingan Fitur Utama (RMS, Centroid, ZCR)
    fig, axes = plt.subplots(1, 3, figsize=(14, 4.2))
    key_features = [('rms', 'RMS Energy'), ('centroid', 'Spectral Centroid (Hz)'), ('zcr', 'Zero Crossing Rate')]
    for idx, (col, title) in enumerate(key_features):
        sns.boxplot(x='label', y=col, hue='label', data=df, ax=axes[idx], palette={'berisik': '#e74c3c', 'non_berisik': '#2ecc71'}, legend=False)
        axes[idx].set_title(title, fontweight='bold')
        axes[idx].set_xlabel('Kelas')
    plt.suptitle('Perbandingan Karakteristik Fitur Utama per Kategori Audio', fontsize=13, fontweight='bold', y=1.03)
    plt.tight_layout()
    plt.savefig(os.path.join(images_dir, 'feature_distribution.png'), dpi=200)
    plt.close()
    print(" - Saved: images/feature_distribution.png")

    # c. Correlation Matrix
    fig, ax = plt.subplots(figsize=(11, 9))
    corr = df[feature_cols].corr()
    sns.heatmap(corr, annot=True, fmt='.2f', cmap='coolwarm', cbar=True, ax=ax, linewidths=0.5, annot_kws={"size": 7.5})
    ax.set_title('Matriks Korelasi Pearson Antar 16 Fitur Audio', fontsize=13, fontweight='bold')
    plt.tight_layout()
    plt.savefig(os.path.join(images_dir, 'correlation_matrix.png'), dpi=200)
    plt.close()
    print(" - Saved: images/correlation_matrix.png")
    
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
    
    # Split 80:20 stratified
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
    )
    print(f"Data Training : {X_train.shape[0]} sampel")
    print(f"Data Testing  : {X_test.shape[0]} sampel")
    
    # StandardScaler
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # -------------------------------------------------------------------------
    # 4. MODELING KNN & HYPERPARAMETER TUNING
    # -------------------------------------------------------------------------
    print("\n" + "="*60)
    print("4. PELATIHAN & TUNING HYPERPARAMETER KNN")
    print("="*60)
    
    k_range = list(range(1, 23, 2))  # k ganjil
    param_grid = {
        'n_neighbors': k_range,
        'weights': ['uniform', 'distance'],
        'metric': ['euclidean', 'manhattan']
    }
    
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    grid_search = GridSearchCV(
        KNeighborsClassifier(),
        param_grid,
        cv=cv,
        scoring='accuracy',
        return_train_score=True
    )
    grid_search.fit(X_train_scaled, y_train)
    
    best_params = grid_search.best_params_
    best_score = grid_search.best_score_
    print(f"Hyperparameter Terbaik:")
    print(f" - k (n_neighbors) : {best_params['n_neighbors']}")
    print(f" - weights         : {best_params['weights']}")
    print(f" - metric          : {best_params['metric']}")
    print(f" - CV Mean Accuracy: {best_score*100:.2f}%")
    
    # Visualisasi Tuning K Accuracy
    results_df = pd.DataFrame(grid_search.cv_results_)
    subset = results_df[(results_df['param_weights'] == best_params['weights']) & 
                        (results_df['param_metric'] == best_params['metric'])]
    
    fig, ax = plt.subplots(figsize=(8, 4.5))
    ax.plot(subset['param_n_neighbors'], subset['mean_test_score'] * 100, marker='o', color='#2980b9', linewidth=2, label='Cross-Validation Accuracy')
    ax.scatter([best_params['n_neighbors']], [best_score * 100], color='red', s=120, zorder=5, label=f"Best k={best_params['n_neighbors']} ({best_score*100:.1f}%)")
    ax.set_title(f"Akurasi 5-Fold CV vs Nilai K (Metric: {best_params['metric'].capitalize()}, Weights: {best_params['weights'].capitalize()})", fontsize=11, fontweight='bold')
    ax.set_xlabel('Nilai K (Jumlah Tetangga Terdekat)', fontsize=10)
    ax.set_ylabel('Mean CV Accuracy (%)', fontsize=10)
    ax.set_xticks(k_range)
    ax.legend(loc='lower right')
    plt.tight_layout()
    plt.savefig(os.path.join(images_dir, 'knn_k_accuracy.png'), dpi=200)
    plt.close()
    print(" - Saved: images/knn_k_accuracy.png")

    # Final best model
    best_knn = grid_search.best_estimator_
    y_pred = best_knn.predict(X_test_scaled)
    y_proba = best_knn.predict_proba(X_test_scaled)
    
    # -------------------------------------------------------------------------
    # 5. EVALUASI MODEL
    # -------------------------------------------------------------------------
    print("\n" + "="*60)
    print("5. EVALUASI MODEL PADA TEST SET")
    print("="*60)
    
    acc = accuracy_score(y_test, y_pred)
    # class 0 = berisik, class 1 = non_berisik (sesuai alphabetical)
    berisik_code = int(le.transform(['berisik'])[0])
    non_berisik_code = int(le.transform(['non_berisik'])[0])
    
    prec = precision_score(y_test, y_pred, pos_label=berisik_code)
    rec = recall_score(y_test, y_pred, pos_label=berisik_code)
    f1 = f1_score(y_test, y_pred, pos_label=berisik_code)
    
    print(f"Test Accuracy : {acc*100:.2f}%")
    print(f"Precision     : {prec*100:.2f}%")
    print(f"Recall        : {rec*100:.2f}%")
    print(f"F1-Score      : {f1*100:.2f}%")
    print("\nClassification Report:\n", classification_report(y_test, y_pred, target_names=le.classes_))
    
    # Confusion Matrix
    cm = confusion_matrix(y_test, y_pred)
    fig, ax = plt.subplots(figsize=(5.5, 4.5))
    disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=[c.replace('_', '-').title() for c in le.classes_])
    disp.plot(cmap='Blues', ax=ax, values_format='d')
    ax.set_title('Confusion Matrix KNN (Test Set)', fontsize=12, fontweight='bold')
    plt.tight_layout()
    plt.savefig(os.path.join(images_dir, 'confusion_matrix.png'), dpi=200)
    plt.close()
    print(" - Saved: images/confusion_matrix.png")
    
    # ROC Curve
    fpr, tpr, _ = roc_curve(y_test, y_proba[:, non_berisik_code], pos_label=non_berisik_code)
    roc_auc = auc(fpr, tpr)
    
    fig, ax = plt.subplots(figsize=(6, 4.5))
    ax.plot(fpr, tpr, color='#e67e22', lw=2.5, label=f'ROC Curve (AUC = {roc_auc:.3f})')
    ax.plot([0, 1], [0, 1], color='#7f8c8d', lw=1.5, linestyle='--', label='Random Chance')
    ax.set_xlim([0.0, 1.0])
    ax.set_ylim([0.0, 1.05])
    ax.set_xlabel('False Positive Rate', fontsize=10)
    ax.set_ylabel('True Positive Rate', fontsize=10)
    ax.set_title('Receiver Operating Characteristic (ROC) Curve', fontsize=11, fontweight='bold')
    ax.legend(loc="lower right")
    plt.tight_layout()
    plt.savefig(os.path.join(images_dir, 'roc_curve.png'), dpi=200)
    plt.close()
    print(" - Saved: images/roc_curve.png")
    
    # -------------------------------------------------------------------------
    # 6. SIMPAN MODEL & ARTIFAK
    # -------------------------------------------------------------------------
    print("\n" + "="*60)
    print("6. MENYIMPAN MODEL & SCALER")
    print("="*60)
    
    model_path = os.path.join(models_dir, 'knn_model.pkl')
    scaler_path = os.path.join(models_dir, 'scaler.pkl')
    encoder_path = os.path.join(models_dir, 'label_encoder.pkl')
    metadata_path = os.path.join(models_dir, 'model_metadata.json')
    
    joblib.dump(best_knn, model_path)
    joblib.dump(scaler, scaler_path)
    joblib.dump(le, encoder_path)
    
    metadata = {
        'model_name': 'K-Nearest Neighbors (KNN)',
        'best_hyperparameters': best_params,
        'cv_mean_accuracy': float(best_score),
        'test_metrics': {
            'accuracy': float(acc),
            'precision': float(prec),
            'recall': float(rec),
            'f1_score': float(f1),
            'roc_auc': float(roc_auc)
        },
        'feature_names': feature_cols,
        'classes': list(le.classes_),
        'train_samples': int(len(X_train)),
        'test_samples': int(len(X_test)),
        'total_samples': int(len(df))
    }
    
    with open(metadata_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=4)
        
    print(f"Model tersimpan   : {model_path}")
    print(f"Scaler tersimpan  : {scaler_path}")
    print(f"Encoder tersimpan : {encoder_path}")
    print(f"Metadata tersimpan: {metadata_path}")
    print("\nSEMUA PROSES SELESAI DENGAN SUKSES!")

if __name__ == '__main__':
    main()
