"""Heuristic checks that uploaded slices look like brain MRI (not photos, X-Ray, etc.)."""

from __future__ import annotations

import numpy as np
from scipy.ndimage import sobel

MRI_REQUIRED_MSG = (
    "This image is not a brain MRI. Please upload a brain MRI scan "
    "(NIfTI .nii/.nii.gz or an axial brain MRI slice in PNG/JPG format)."
)


def _to_grayscale(image: np.ndarray) -> np.ndarray:
    if image.ndim == 3 and image.shape[2] >= 3:
        rgb = image[..., :3].astype(np.float64)
        if float(np.std(rgb, axis=2).mean()) > 12.0:
            raise ValueError(MRI_REQUIRED_MSG)
        return np.mean(rgb, axis=2)
    if image.ndim == 3:
        return image[..., 0].astype(np.float64)
    return image.astype(np.float64)


def is_brain_mri(image: np.ndarray) -> tuple[bool, str]:
    """Return (True, '') if the slice passes brain-MRI heuristics."""
    if image.size == 0:
        return False, MRI_REQUIRED_MSG

    try:
        gray = _to_grayscale(image)
    except ValueError as exc:
        return False, str(exc)

    h, w = gray.shape
    if min(h, w) < 48:
        return False, "Image resolution is too low for brain MRI analysis."

    p1, p99 = np.percentile(gray, [1, 99])
    dynamic_range = float(p99 - p1)
    if dynamic_range < 1e-3:
        return False, MRI_REQUIRED_MSG

    norm = np.clip((gray - p1) / dynamic_range, 0, 1)

    corner_size = max(4, int(min(h, w) * 0.12))
    corners = np.concatenate(
        [
            norm[:corner_size, :corner_size].ravel(),
            norm[:corner_size, -corner_size:].ravel(),
            norm[-corner_size:, :corner_size].ravel(),
            norm[-corner_size:, -corner_size:].ravel(),
        ]
    )
    corner_mean = float(corners.mean())

    cy, cx = h / 2.0, w / 2.0
    y, x = np.ogrid[:h, :w]
    ry, rx = h * 0.38, w * 0.38
    brain_mask = ((y - cy) / ry) ** 2 + ((x - cx) / rx) ** 2 <= 1.0
    center_vals = norm[brain_mask]
    center_mean = float(center_vals.mean())
    tissue_frac = float((center_vals > 0.08).sum() / max(center_vals.size, 1))

    if center_mean < 0.12 or tissue_frac < 0.22:
        return False, MRI_REQUIRED_MSG

    if corner_mean > 0.38 and center_mean < 0.22:
        return False, MRI_REQUIRED_MSG

    if corner_mean > center_mean * 0.9 and corner_mean > 0.22:
        return False, MRI_REQUIRED_MSG

    dx = sobel(norm, axis=0)
    dy = sobel(norm, axis=1)
    edge = np.hypot(dx, dy)
    edge_center = float(edge[brain_mask].mean())
    edge_global = float(edge.mean())
    if edge_global > 0.22 and edge_center / max(edge_global, 1e-6) < 1.05:
        if center_mean > 0.35 and corner_mean > 0.12:
            return False, MRI_REQUIRED_MSG

    hist, _ = np.histogram(center_vals, bins=20, range=(0, 1))
    hist = hist / max(hist.sum(), 1)
    nonzero = hist[hist > 0]
    entropy = float(-np.sum(nonzero * np.log2(nonzero)))
    if entropy < 1.4:
        return False, MRI_REQUIRED_MSG

    return True, ""


def validate_brain_mri(image: np.ndarray) -> None:
    """Raise ValueError if the image does not look like brain MRI."""
    ok, message = is_brain_mri(image)
    if not ok:
        raise ValueError(message)


XRAY_REQUIRED_MSG = (
    "This image is not an X-Ray. Please upload a grayscale medical X-Ray "
    "(chest or planar radiograph in PNG/JPG format)."
)


def validate_xray(image: np.ndarray) -> None:
    """Reject color snapshots; do not apply brain-MRI geometry rules."""
    arr = np.asarray(image)
    if arr.size == 0:
        raise ValueError(XRAY_REQUIRED_MSG)
    if arr.ndim == 3 and arr.shape[2] >= 3:
        rgb = arr[..., :3].astype(np.float64)
        if float(np.std(rgb, axis=2).mean()) > 12.0:
            raise ValueError(XRAY_REQUIRED_MSG)
        gray = np.mean(rgb, axis=2)
    elif arr.ndim == 3:
        gray = arr[..., 0].astype(np.float64)
    else:
        gray = arr.astype(np.float64)

    if min(gray.shape) < 48:
        raise ValueError("Image resolution is too low for X-Ray analysis.")
    p1, p99 = np.percentile(gray, [1, 99])
    if float(p99 - p1) < 1e-3:
        raise ValueError(XRAY_REQUIRED_MSG)


def validate_for_modality(image: np.ndarray, modality: str | None) -> None:
    kind = (modality or "mri").lower()
    if kind == "xray":
        validate_xray(image)
        return
    validate_brain_mri(image)


def validate_brain_mri_volume(volume: np.ndarray) -> None:
    """Validate a 3D NIfTI volume using its middle axial slice."""
    if volume.ndim < 3:
        raise ValueError(MRI_REQUIRED_MSG)

    if volume.size == 0 or np.std(volume) < 1e-6:
        raise ValueError(MRI_REQUIRED_MSG)

    # BraTS-style volumes are typically 3D; reject obvious tiny volumes
    spatial = volume.shape[:3]
    if min(spatial) < 16:
        raise ValueError(MRI_REQUIRED_MSG)

    mid = spatial[2] // 2
    slice_2d = volume[:, :, mid]
    validate_brain_mri(slice_2d)
