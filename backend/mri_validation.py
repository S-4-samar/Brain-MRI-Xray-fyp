"""Light checks that uploaded slices are usable medical images (not blank/corrupt)."""

from __future__ import annotations

import numpy as np

MRI_REQUIRED_MSG = (
    "This image is not a brain MRI. Please upload a brain MRI scan "
    "(NIfTI .nii/.nii.gz or an axial brain MRI slice in PNG/JPG format)."
)


def _to_grayscale(image: np.ndarray) -> np.ndarray:
    if image.ndim == 3 and image.shape[2] >= 3:
        # Reject obvious color photos (MRI/X-Ray slices are grayscale)
        rgb = image[..., :3].astype(np.float64)
        if float(np.std(rgb, axis=2).mean()) > 18.0:
            raise ValueError(MRI_REQUIRED_MSG)
        return np.mean(rgb, axis=2)
    if image.ndim == 3:
        return image[..., 0].astype(np.float64)
    return image.astype(np.float64)


def is_brain_mri(image: np.ndarray) -> tuple[bool, str]:
    """
    Return (True, '') if the slice is usable for analysis.
    Kept intentionally light so real PNG/JPG MRI slices are not rejected in production.
    """
    if image.size == 0:
        return False, MRI_REQUIRED_MSG

    try:
        gray = _to_grayscale(image)
    except ValueError as exc:
        return False, str(exc)

    h, w = gray.shape
    if min(h, w) < 32:
        return False, "Image resolution is too low for brain MRI analysis."

    p1, p99 = np.percentile(gray, [1, 99])
    dynamic_range = float(p99 - p1)
    if dynamic_range < 1e-3:
        return False, MRI_REQUIRED_MSG

    # Reject nearly-blank images only
    norm = np.clip((gray - p1) / dynamic_range, 0, 1)
    if float(norm.std()) < 0.02:
        return False, MRI_REQUIRED_MSG

    return True, ""


def validate_brain_mri(image: np.ndarray) -> None:
    """Raise ValueError if the image does not look like a usable MRI slice."""
    ok, message = is_brain_mri(image)
    if not ok:
        raise ValueError(message)


def validate_brain_mri_volume(volume: np.ndarray) -> None:
    """Validate a 3D NIfTI volume using its middle axial slice."""
    if volume.ndim < 3:
        raise ValueError(MRI_REQUIRED_MSG)

    if volume.size == 0 or np.std(volume) < 1e-6:
        raise ValueError(MRI_REQUIRED_MSG)

    spatial = volume.shape[:3]
    if min(spatial) < 16:
        raise ValueError(MRI_REQUIRED_MSG)

    mid = spatial[2] // 2
    slice_2d = volume[:, :, mid]
    validate_brain_mri(slice_2d)
