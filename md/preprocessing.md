# Preprocessing

## Overview

Preprocessing adalah tahap pembersihan dan transformasi data audio mentah agar siap untuk ekstraksi fitur dan pemodelan.

## Tahapan Preprocessing

### 1. Standarisasi Format Audio

Semua file audio dikonversi ke format standar:
- **Sample Rate**: 22050 Hz
- **Channel**: Mono (1 channel)
- **Format**: WAV (PCM 16-bit)

```python
import librosa
import soundfile as sf

def standardize_audio(input_path, output_path, sr=22050):
    """Konversi audio ke format standar."""
    audio, sample_rate = librosa.load(input_path, sr=sr, mono=True)
    sf.write(output_path, audio, sr)
    return audio, sr
```

### 2. Noise Reduction

Mengurangi noise latar belakang menggunakan spektral subtraction.

```python
import noisereduce as nr

def reduce_noise(audio, sr):
    """Kurangi noise dari sinyal audio."""
    reduced = nr.reduce_noise(y=audio, sr=sr)
    return reduced
```

### 3. Normalisasi Amplitudo

```python
import numpy as np

def normalize_audio(audio):
    """Normalisasi amplitudo audio ke range [-1, 1]."""
    max_val = np.max(np.abs(audio))
    if max_val > 0:
        return audio / max_val
    return audio
```

### 4. Trimming Silence

Menghilangkan keheningan di awal dan akhir audio.

```python
def trim_silence(audio, sr, top_db=20):
    """Hilangkan keheningan di awal dan akhir."""
    trimmed, _ = librosa.effects.trim(audio, top_db=top_db)
    return trimmed
```

### 5. Segmentasi (Windowing)

Membagi audio panjang menjadi segmen-segmen kecil.

```python
def segment_audio(audio, sr, duration=3.0, overlap=0.5):
    """Bagi audio menjadi segmen dengan overlap."""
    segment_len = int(duration * sr)
    hop_len = int(segment_len * (1 - overlap))
    segments = []
    for start in range(0, len(audio) - segment_len + 1, hop_len):
        segment = audio[start:start + segment_len]
        segments.append(segment)
    return segments
```

## Pipeline Preprocessing

```python
def preprocess_pipeline(input_path, output_dir, sr=22050):
    """Jalankan seluruh pipeline preprocessing."""
    # Load
    audio, _ = librosa.load(input_path, sr=sr, mono=True)
    # Reduce noise
    audio = reduce_noise(audio, sr)
    # Normalize
    audio = normalize_audio(audio)
    # Trim silence
    audio = trim_silence(audio, sr)
    # Save
    output_path = os.path.join(output_dir, os.path.basename(input_path))
    sf.write(output_path, audio, sr)
    return audio
```
