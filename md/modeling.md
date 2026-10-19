# Modeling

## Overview

> **Catatan:** Bagian ini akan diperbarui setelah eksperimen modeling selesai.

Proses modeling meliputi pemilihan algoritma, training, dan tuning hyperparameter.

## Algoritma yang Dipertimbangkan

### Machine Learning Klasik

| Algoritma | Kelebihan | Kekurangan |
|-----------|-----------|-----------|
| K-Nearest Neighbors (KNN) | Sederhana, tidak perlu training | Lambat saat prediksi, sensitif terhadap skala |
| Support Vector Machine (SVM) | Efektif di high-dimensional space | Lambat untuk dataset besar |
| Random Forest | Robust, menangani noise dengan baik | Kurang interpretable |
| Gradient Boosting | Akurasi tinggi | Perlu tuning yang banyak |

### Deep Learning

| Algoritma | Kelebihan | Kekurangan |
|-----------|-----------|-----------|
| CNN (Convolutional Neural Network) | Unggul untuk Mel Spectrogram | Butuh banyak data |
| LSTM / RNN | Baik untuk data sekuensial | Lambat training |
| CNN + LSTM | Gabungan keduanya | Kompleks |

## Template Kode Model

### KNN

```python
from sklearn.neighbors import KNeighborsClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Scaling
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)

# Model
model = KNeighborsClassifier(n_neighbors=5)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
print(classification_report(y_test, y_pred))
```

### SVM

```python
from sklearn.svm import SVC

model = SVC(kernel='rbf', C=10, gamma='scale', random_state=42)
model.fit(X_train, y_train)
y_pred = model.predict(X_test)
```

### CNN (untuk Mel Spectrogram)

```python
import tensorflow as tf
from tensorflow import keras

model = keras.Sequential([
    keras.layers.Conv2D(32, (3,3), activation='relu', input_shape=(128, 128, 1)),
    keras.layers.MaxPooling2D(2, 2),
    keras.layers.Conv2D(64, (3,3), activation='relu'),
    keras.layers.MaxPooling2D(2, 2),
    keras.layers.Flatten(),
    keras.layers.Dense(128, activation='relu'),
    keras.layers.Dropout(0.5),
    keras.layers.Dense(num_classes, activation='softmax')
])

model.compile(
    optimizer='adam',
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)
```

## Hasil Eksperimen

*Akan diisi setelah eksperimen modeling selesai.*
