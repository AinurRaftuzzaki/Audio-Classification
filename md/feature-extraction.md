# Feature Extraction

## Overview

Feature extraction adalah proses mengubah sinyal audio mentah menjadi representasi numerik yang dapat digunakan oleh model machine learning.

## Fitur-Fitur Audio

### 1. MFCC (Mel-Frequency Cepstral Coefficients)

MFCC adalah fitur paling umum dalam pemrosesan suara. Merepresentasikan karakteristik spektral jangka pendek dari suara.

```python
import librosa
import numpy as np

def extract_mfcc(audio, sr, n_mfcc=13):
    """Ekstrak MFCC dari audio."""
    mfcc = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=n_mfcc)
    # Statistik agregasi
    features = {
        'mfcc_mean': np.mean(mfcc, axis=1),
        'mfcc_std': np.std(mfcc, axis=1),
        'mfcc_max': np.max(mfcc, axis=1),
        'mfcc_min': np.min(mfcc, axis=1),
    }
    return features
```

### 2. Mel Spectrogram

Representasi visual dari spektrum frekuensi yang disesuaikan dengan skala Mel (skala persepsi manusia).

```python
def extract_mel_spectrogram(audio, sr, n_mels=128):
    """Ekstrak Mel Spectrogram dari audio."""
    mel_spec = librosa.feature.melspectrogram(y=audio, sr=sr, n_mels=n_mels)
    mel_spec_db = librosa.power_to_db(mel_spec, ref=np.max)
    return mel_spec_db
```

### 3. Zero Crossing Rate (ZCR)

Tingkat perubahan tanda sinyal — berguna untuk membedakan suara perkusif vs tonal.

```python
def extract_zcr(audio):
    """Ekstrak Zero Crossing Rate."""
    zcr = librosa.feature.zero_crossing_rate(audio)
    return {
        'zcr_mean': np.mean(zcr),
        'zcr_std': np.std(zcr),
    }
```

### 4. RMS Energy

Root Mean Square energy — representasi volume/energi audio.

```python
def extract_rms(audio):
    """Ekstrak RMS Energy."""
    rms = librosa.feature.rms(y=audio)
    return {
        'rms_mean': np.mean(rms),
        'rms_std': np.std(rms),
        'rms_max': np.max(rms),
    }
```

### 5. Chroma Features

Merepresentasikan energi pada 12 pitch class (nada musik).

```python
def extract_chroma(audio, sr):
    """Ekstrak Chroma features."""
    chroma = librosa.feature.chroma_stft(y=audio, sr=sr)
    return {
        'chroma_mean': np.mean(chroma, axis=1),
        'chroma_std': np.std(chroma, axis=1),
    }
```

### 6. Spectral Features

```python
def extract_spectral_features(audio, sr):
    """Ekstrak berbagai fitur spektral."""
    return {
        'spectral_centroid': np.mean(librosa.feature.spectral_centroid(y=audio, sr=sr)),
        'spectral_bandwidth': np.mean(librosa.feature.spectral_bandwidth(y=audio, sr=sr)),
        'spectral_rolloff': np.mean(librosa.feature.spectral_rolloff(y=audio, sr=sr)),
        'spectral_contrast': np.mean(librosa.feature.spectral_contrast(y=audio, sr=sr)),
    }
```

## Pipeline Feature Extraction

```python
def extract_all_features(audio_path, sr=22050):
    """Ekstrak semua fitur dari satu file audio."""
    audio, sr = librosa.load(audio_path, sr=sr)
    
    features = {}
    features.update(extract_mfcc(audio, sr))
    features.update(extract_zcr(audio))
    features.update(extract_rms(audio))
    features.update(extract_chroma(audio, sr))
    features.update(extract_spectral_features(audio, sr))
    
    return features
```

## Ringkasan Fitur

| Fitur | Dimensi | Kegunaan |
|-------|---------|---------|
| MFCC (13) | 13 × stats | Karakteristik timbral |
| Mel Spectrogram | n_mels | Pola spektral |
| ZCR | 2 | Karakteristik perkusif |
| RMS | 3 | Volume/energi |
| Chroma | 12 × stats | Pitch/harmoni |
| Spectral | 4 | Karakter frekuensi |
