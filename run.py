import nibabel as nib
import numpy as np
import matplotlib.pyplot as plt
import os

# ===== PATH =====
DATA_PATH = "data/BraTS2021_00185"

def load_file(keyword):
    for f in os.listdir(DATA_PATH):
        if keyword in f:
            return nib.load(os.path.join(DATA_PATH, f)).get_fdata()
    raise Exception(f"{keyword} not found")

# Load MRI
t1 = load_file("t1")
t1ce = load_file("t1ce")
t2 = load_file("t2")
flair = load_file("flair")
seg = load_file("seg")

# ===== AUTO SLICE SELECTION (better than middle) =====
# Choose slice with highest tumor presence
slice_sums = [np.sum(seg[:, :, i]) for i in range(seg.shape[2])]
slice_idx = np.argmax(slice_sums)

flair_slice = flair[:, :, slice_idx]
gt_slice = seg[:, :, slice_idx]

# ===== NORMALIZATION (robust contrast) =====
flair_slice = flair_slice.astype(np.float32)

min_val = np.percentile(flair_slice, 1)
max_val = np.percentile(flair_slice, 99)

norm = np.clip((flair_slice - min_val) / (max_val - min_val + 1e-8), 0, 1)

# ===== IMPROVED SEGMENTATION =====
prediction = np.zeros_like(norm)

prediction[norm > 0.45] = 1   # edema
prediction[norm > 0.65] = 2   # tumor core
prediction[norm > 0.80] = 3   # enhancing tumor

# ===== REMOVE SMALL NOISE =====
# Keep only largest connected region (simple version)
mask = prediction > 0
if np.sum(mask) > 0:
    coords = np.argwhere(mask)
    y_min, x_min = coords.min(axis=0)
    y_max, x_max = coords.max(axis=0)
    clean_pred = np.zeros_like(prediction)
    clean_pred[y_min:y_max, x_min:x_max] = prediction[y_min:y_max, x_min:x_max]
    prediction = clean_pred

# ===== COLOR MAP =====
def color_map(mask):
    colored = np.zeros((mask.shape[0], mask.shape[1], 3))

    colored[mask == 1] = [0, 1, 0]   # green (edema)
    colored[mask == 2] = [1, 0, 0]   # red (core)
    colored[mask == 3] = [1, 1, 0]   # yellow (enhancing)

    return colored

gt_color = color_map(gt_slice)
pred_color = color_map(prediction)

# ===== OVERLAY (PROFESSIONAL LOOK) =====
overlay = np.stack([norm, norm, norm], axis=-1)

overlay[prediction == 1] = [0, 1, 0]
overlay[prediction == 2] = [1, 0, 0]
overlay[prediction == 3] = [1, 1, 0]

# ===== DISPLAY =====
plt.figure(figsize=(15,5))

plt.subplot(1,4,1)
plt.title("FLAIR")
plt.imshow(norm, cmap="gray")
plt.axis("off")

plt.subplot(1,4,2)
plt.title("Ground Truth")
plt.imshow(gt_color)
plt.axis("off")

plt.subplot(1,4,3)
plt.title("Prediction")
plt.imshow(pred_color)
plt.axis("off")

plt.subplot(1,4,4)
plt.title("Overlay")
plt.imshow(overlay)
plt.axis("off")

plt.tight_layout()
plt.show()
plt.close()