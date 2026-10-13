"""Reject everyday photos while accepting typical MRI slices and X-rays."""

from __future__ import annotations

import numpy as np
from scipy.ndimage import gaussian_filter, sobel, zoom

MRI_REQUIRED_MSG = (
    "This image is not a brain MRI. Please upload a brain MRI scan "
    "(NIfTI .nii/.nii.gz or an axial brain MRI slice in PNG/JPG format)."
)
XRAY_REQUIRED_MSG = (
    "This image is not an X-Ray. Please upload a grayscale medical X-Ray "
    "(chest or planar radiograph in PNG/JPG format)."
)


def _to_rgb_and_gray(image: np.ndarray) -> tuple[np.ndarray | None, np.ndarray]:
    arr = np.asarray(image)
    if arr.ndim == 3 and arr.shape[2] >= 3:
        rgb = arr[..., :3].astype(np.float64)
        gray = np.mean(rgb, axis=2)
        return rgb, gray
    if arr.ndim == 3:
        gray = arr[..., 0].astype(np.float64)
        return None, gray
    return None, arr.astype(np.float64)


def _resize_max(gray: np.ndarray, max_side: int = 256) -> np.ndarray:
    h, w = gray.shape
    m = max(h, w)
    if m <= max_side:
        return gray
    scale = max_side / m
    return zoom(gray, scale, order=1)


def _is_color_photo(rgb: np.ndarray | None) -> bool:
    """MRI/X-ray are nearly grayscale; snapshots have color."""
    if rgb is None:
        return False
    chroma = np.std(rgb, axis=2)
    if float(chroma.mean()) > 10.0:
        return True
    channel_spread = float(np.max(np.std(rgb, axis=(0, 1))))
    if channel_spread > 28.0 and float(chroma.mean()) > 4.0:
        return True
    mx = np.max(rgb, axis=2)
    mn = np.min(rgb, axis=2)
    sat = (mx - mn) / np.maximum(mx, 1.0)
    return float(sat.mean()) > 0.12


def _normalized(gray: np.ndarray) -> np.ndarray:
    p1, p99 = np.percentile(gray, [1, 99])
    span = float(p99 - p1)
    if span < 1e-3:
        return np.zeros_like(gray, dtype=np.float64)
    return np.clip((gray - p1) / span, 0, 1)


def _looks_like_medical_grayscale(gray: np.ndarray, kind: str) -> tuple[bool, str]:
    fail = MRI_REQUIRED_MSG if kind == "mri" else XRAY_REQUIRED_MSG

    if gray.size == 0 or gray.ndim != 2:
        return False, fail

    h0, w0 = gray.shape
    if min(h0, w0) < 64:
        return False, "Image resolution is too low for analysis."

    aspect = max(h0, w0) / max(min(h0, w0), 1)
    if aspect > 2.6:
        return False, fail

    gray = _resize_max(gray)
    h, w = gray.shape

    p1, p99 = np.percentile(gray, [1, 99])
    if float(p99 - p1) < 12:
        return False, fail

    norm = _normalized(gray)
    gstd = float(norm.std())
    if gstd < 0.10:
        return False, fail

    corner = max(6, int(min(h, w) * 0.12))
    corners = np.concatenate(
        [
            norm[:corner, :corner].ravel(),
            norm[:corner, -corner:].ravel(),
            norm[-corner:, :corner].ravel(),
            norm[-corner:, -corner:].ravel(),
        ]
    )
    corner_mean = float(corners.mean())
    corner_bright = float((corners > 0.35).mean())

    cy, cx = h / 2.0, w / 2.0
    y, x = np.ogrid[:h, :w]
    inner = ((y - cy) / (h * 0.40)) ** 2 + ((x - cx) / (w * 0.40)) ** 2 <= 1.0
    rim = ~inner
    center_vals = norm[inner]
    if center_vals.size == 0:
        return False, fail

    center_mean = float(center_vals.mean())
    tissue_frac = float((center_vals > 0.12).sum() / center_vals.size)
    dark_frac = float((norm < 0.12).mean())

    dx = sobel(norm, axis=0)
    dy = sobel(norm, axis=1)
    edge = np.hypot(dx, dy)
    edge_mean = float(edge.mean())
    edge_center = float(edge[inner].mean()) if inner.any() else 0.0
    edge_rim = float(edge[rim].mean()) if rim.any() else 0.0

    blur = gaussian_filter(norm, sigma=1.2)
    highfreq = float(np.mean(np.abs(norm - blur)))

    hist, _ = np.histogram(norm, bins=24, range=(0, 1))
    hist = hist / max(float(hist.sum()), 1.0)
    nz = hist[hist > 0]
    entropy = float(-np.sum(nz * np.log2(nz)))

    if kind == "mri":
        # Axial brain MRI: dark FOV, oval tissue in the middle, little color/texture.
        if dark_frac < 0.22:
            return False, fail
        if tissue_frac < 0.22 or center_mean < 0.14:
            return False, fail
        if corner_mean > 0.30 or corner_bright > 0.35:
            return False, fail
        if center_mean < corner_mean * 1.25:
            return False, fail
        if edge_mean > 0.20 or highfreq > 0.085:
            return False, fail
        if edge_rim > edge_center * 1.35 and edge_rim > 0.12:
            return False, fail
        if entropy > 4.15:
            return False, fail
        return True, ""

    # X-ray: grayscale, high contrast, collimated / dark borders, not a scene photo.
    if corner_mean > 0.42 or corner_bright > 0.55:
        return False, fail
    if tissue_frac < 0.16:
        return False, fail
    if edge_mean > 0.22 or highfreq > 0.10:
        return False, fail
    if entropy > 4.25:
        return False, fail
    if dark_frac < 0.08 and corner_mean > 0.28:
        return False, fail
    return True, ""


def is_brain_mri(image: np.ndarray) -> tuple[bool, str]:
    rgb, gray = _to_rgb_and_gray(image)
    if _is_color_photo(rgb):
        return False, MRI_REQUIRED_MSG
    return _looks_like_medical_grayscale(gray, "mri")


def is_xray(image: np.ndarray) -> tuple[bool, str]:
    rgb, gray = _to_rgb_and_gray(image)
    if _is_color_photo(rgb):
        return False, XRAY_REQUIRED_MSG
    return _looks_like_medical_grayscale(gray, "xray")


def validate_brain_mri(image: np.ndarray) -> None:
    ok, message = is_brain_mri(image)
    if not ok:
        raise ValueError(message)


def validate_xray(image: np.ndarray) -> None:
    ok, message = is_xray(image)
    if not ok:
        raise ValueError(message)


def validate_for_modality(image: np.ndarray, modality: str | None) -> None:
    kind = (modality or "mri").lower()
    if kind == "xray":
        validate_xray(image)
        return
    validate_brain_mri(image)


def validate_brain_mri_volume(volume: np.ndarray) -> None:
    if volume is None or volume.size == 0:
        raise ValueError(MRI_REQUIRED_MSG)

    if volume.ndim < 3:
        if volume.ndim == 2:
            validate_brain_mri(volume)
            return
        raise ValueError(MRI_REQUIRED_MSG)

    if float(np.std(volume)) < 1e-6:
        raise ValueError(MRI_REQUIRED_MSG)

    spatial = volume.shape[:3]
    if min(spatial) < 16:
        raise ValueError(MRI_REQUIRED_MSG)

    mid = spatial[2] // 2
    validate_brain_mri(volume[:, :, mid])
