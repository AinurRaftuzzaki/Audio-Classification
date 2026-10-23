import zipfile
import librosa
import numpy as np
import pandas as pd
import io
import warnings

# Mengabaikan peringatan dari librosa saat membaca mp3
warnings.filterwarnings('ignore')

def ekstrak_fitur_dari_zip(zip_path, label):
    data = []
    # Membuka file ZIP
    with zipfile.ZipFile(zip_path, 'r') as z:
        for file_name in z.namelist():
            if file_name.lower().endswith(('.mp3', '.wav')):
                try:
                    # Membaca file audio langsung dari dalam zip tanpa diekstrak
                    with z.open(file_name) as f:
                        audio_bytes = f.read()
                        
                        # Load audio dengan librosa
                        y, sr = librosa.load(io.BytesIO(audio_bytes), sr=None)
                        
                        # Mengekstrak fitur audio (mengambil nilai rata-rata/mean)
                        rms = np.mean(librosa.feature.rms(y=y))
                        centroid = np.mean(librosa.feature.spectral_centroid(y=y, sr=sr))
                        zcr = np.mean(librosa.feature.zero_crossing_rate(y=y))
                        mfccs = np.mean(librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13), axis=1)
                        
                        # Menggabungkan semua fitur menjadi satu baris data
                        row = [file_name, label, rms, centroid, zcr] + list(mfccs)
                        data.append(row)
                        print(f"Berhasil memproses: {file_name}")
                except Exception as e:
                    print(f"Gagal memproses {file_name}: {e}")
    return data

print("Memproses data berisik...")
# Pastikan nama file zip sesuai dengan yang ada di foldermu
data_berisik = ekstrak_fitur_dari_zip('berisik.zip', 'berisik')

print("\nMemproses data non-berisik...")
data_non_berisik = ekstrak_fitur_dari_zip('non-berisik.zip', 'non_berisik')

# Menggabungkan kedua data
semua_data = data_berisik + data_non_berisik

# Menyiapkan nama kolom sesuai dengan format yang kamu inginkan
kolom = ['filename', 'label', 'rms', 'centroid', 'zcr'] + [f'mfcc_{i}' for i in range(1, 14)]

# Membuat DataFrame dan menyimpannya ke CSV
df = pd.DataFrame(semua_data, columns=kolom)
df.to_csv('audio_features_16_2.csv', index=False)

print("\nSelesai! Data berhasil digabungkan dan disimpan di audio_features_16_2.csv")