"""Upload sanity checks — openable image/volume with non-empty content.

Strict “looks like brain MRI” heuristics were removed because they rejected
valid clinical PNG/JPG slices in production.
"""

from __future__ import annotations

import numpy as np

MRI_REQUIRED_MSG = (
    "Could not read this file as a medical image. "
    "Please upload a NIfTI (.nii / .nii.gz) or PNG/JPG slice."
)


def _to_grayscale(image: np.ndarray) -> np.ndarray:
    if image.ndim == 3 and image.shape[2] >= 3:
        return np.mean(image[..., :3].astype(np.float64), axis=2)
    if image.ndim == 3:
        return image[..., 0].astype(np.float64)
    return image.astype(np.float64)


def is_brain_mri(image: np.ndarray) -> tuple[bool, str]:
    """Return (True, '') if the array is a usable 2D image."""
    if image is None or image.size == 0:
        return False, MRI_REQUIRED_MSG

    try:
        gray = _to_grayscale(image)
    except Exception:
        return False, MRI_REQUIRED_MSG

    if gray.ndim != 2 or min(gray.shape) < 16:
        return False, "Image resolution is too low for analysis."

    if float(np.std(gray)) < 1e-6:
        return False, MRI_REQUIRED_MSG

    return True, ""


def validate_brain_mri(image: np.ndarray) -> None:
    ok, message = is_brain_mri(image)
    if not ok:
        raise ValueError(message)


def validate_brain_mri_volume(volume: np.ndarray) -> None:
    if volume is None or volume.size == 0:
        raise ValueError(MRI_REQUIRED_MSG)

    if volume.ndim < 3:
        # Allow a single 2D array wrapped as volume edge-case
        if volume.ndim == 2:
            validate_brain_mri(volume)
            return
        raise ValueError(MRI_REQUIRED_MSG)

    if float(np.std(volume)) < 1e-6:
        raise ValueError(MRI_REQUIRED_MSG)

    spatial = volume.shape[:3]
    mid = spatial[2] // 2
    validate_brain_mri(volume[:, :, mid])
