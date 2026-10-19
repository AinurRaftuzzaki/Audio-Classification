import os
import io
import zipfile
import numpy as np
import pandas as pd
import librosa


def extract_audio_features(file_obj, sr=22050):
    """
    Ekstraksi 16 fitur audio:
    1. RMS (Root Mean Square)
    2. Spectral Centroid
    3. ZCR (Zero Crossing Rate)
    4-16. MFCC 13 Koefisien
    """
    # Load audio
    y, sr = librosa.load(file_obj, sr=sr, mono=True)
    
    # 1. RMS Energy (mean)
    rms = float(np.mean(librosa.feature.rms(y=y)))
    
    # 2. Spectral Centroid (mean)
    centroid = float(np.mean(librosa.feature.spectral_centroid(y=y, sr=sr)))
    
    # 3. Zero Crossing Rate (mean)
    zcr = float(np.mean(librosa.feature.zero_crossing_rate(y=y)))
    
    # 4-16. MFCC 13 koefisien (mean per koefisien)
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

def process_all_data():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    crawling_dir = os.path.join(base_dir, 'crawling')
    raw_dir = os.path.join(base_dir, 'data', 'raw')
    processed_dir = os.path.join(base_dir, 'data', 'processed')
    
    os.makedirs(raw_dir, exist_ok=True)
    os.makedirs(processed_dir, exist_ok=True)
    
    categories = [
        ('File Audio Berisik.zip', 'berisik'),
        ('File Audio Non Berisik.zip', 'non_berisik')
    ]
    
    records = []
    durations = []
    
    for zip_name, label in categories:
        zip_path = os.path.join(crawling_dir, zip_name)
        class_raw_dir = os.path.join(raw_dir, label)
        os.makedirs(class_raw_dir, exist_ok=True)
        
        print(f"\n[INFO] Membuka dan mengekstrak {zip_name} (Label: {label})...")
        with zipfile.ZipFile(zip_path, 'r') as z:
            file_list = [f for f in z.namelist() if not f.endswith('/') and not f.startswith('__MACOSX')]
            print(f"Total file: {len(file_list)}")
            
            for idx, f_name in enumerate(file_list, 1):
                if idx % 20 == 0 or idx == len(file_list):
                    print(f"[{label}] Diproses: {idx}/{len(file_list)}")
                # Extract to raw folder for easy access and deployment
                clean_filename = os.path.basename(f_name)
                extracted_path = os.path.join(class_raw_dir, clean_filename)
                
                with z.open(f_name) as zf:
                    audio_content = zf.read()
                    
                with open(extracted_path, 'wb') as out_f:
                    out_f.write(audio_content)
                
                # Extract 16 features
                try:
                    features, dur = extract_audio_features(io.BytesIO(audio_content))
                    row = {
                        'filename': clean_filename,
                        'label': label,
                        **features
                    }
                    records.append(row)
                    durations.append(dur)
                except Exception as e:
                    print(f"Error processing {clean_filename}: {e}")

    df = pd.DataFrame(records)
    
    # Susun urutan kolom yang rapi:
    # 16 fitur utama: rms, centroid, zcr, mfcc_1 .. mfcc_13
    feature_cols = ['rms', 'centroid', 'zcr'] + [f'mfcc_{i}' for i in range(1, 14)]
    ordered_cols = ['filename', 'label'] + feature_cols
    df = df[ordered_cols]
    
    # Simpan ke folder crawling dan data/processed
    crawling_csv = os.path.join(crawling_dir, 'audio_features_16.csv')
    processed_csv = os.path.join(processed_dir, 'audio_features_16.csv')
    
    df.to_csv(crawling_csv, index=False)
    df.to_csv(processed_csv, index=False)
    
    print("\n" + "="*50)
    print("EKSTRAKSI FITUR SELESAI!")
    print("="*50)
    print(f"Total baris data : {len(df)}")
    print(f"Total kolom     : {len(df.columns)} (2 info + 16 fitur audio)")
    print(f"Kolom fitur (16): {feature_cols}")
    print(f"Distribusi label:\n{df['label'].value_counts()}")
    print(f"\nRata-rata durasi: {np.mean(durations):.2f} detik")
    print(f"File tersimpan di:")
    print(f" - {crawling_csv}")
    print(f" - {processed_csv}")

if __name__ == '__main__':
    process_all_data()
