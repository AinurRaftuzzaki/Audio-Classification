# Evaluasi Model

## Overview

> **Catatan:** Bagian ini akan diperbarui setelah eksperimen selesai.

## Metrik Evaluasi

### Accuracy

Persentase prediksi yang benar dari total prediksi.

$$\text{Accuracy} = \frac{TP + TN}{TP + TN + FP + FN}$$

### Precision

Dari semua yang diprediksi positif, berapa yang benar-benar positif.

$$\text{Precision} = \frac{TP}{TP + FP}$$

### Recall (Sensitivity)

Dari semua yang benar-benar positif, berapa yang berhasil diprediksi.

$$\text{Recall} = \frac{TP}{TP + FN}$$

### F1-Score

Harmonic mean dari Precision dan Recall.

$$\text{F1} = 2 \times \frac{\text{Precision} \times \text{Recall}}{\text{Precision} + \text{Recall}}$$

## Confusion Matrix

```python
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay
import matplotlib.pyplot as plt

cm = confusion_matrix(y_test, y_pred)
disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=class_names)
disp.plot(cmap='Blues')
plt.title('Confusion Matrix')
plt.tight_layout()
plt.savefig('../images/confusion_matrix.png', dpi=150)
plt.show()
```

## Hasil Evaluasi

*Akan diisi setelah eksperimen selesai.*

| Model | Accuracy | Precision | Recall | F1-Score |
|-------|----------|-----------|--------|----------|
| KNN | *TBD* | *TBD* | *TBD* | *TBD* |
| SVM | *TBD* | *TBD* | *TBD* | *TBD* |
| Random Forest | *TBD* | *TBD* | *TBD* | *TBD* |
| CNN | *TBD* | *TBD* | *TBD* | *TBD* |

## Cross-Validation

```python
from sklearn.model_selection import cross_val_score

scores = cross_val_score(model, X, y, cv=5, scoring='f1_macro')
print(f"CV F1-Score: {scores.mean():.4f} ± {scores.std():.4f}")
```
