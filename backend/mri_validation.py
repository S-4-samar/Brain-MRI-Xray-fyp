"""Accept medical MRI/X-Ray (including NIfTI and false-color scans); reject snapshots."""

from __future__ import annotations

import numpy as np
from scipy.ndimage import gaussian_filter, sobel, zoom

MRI_REQUIRED_MSG = (
    "This image is not a brain MRI. Please upload a brain MRI scan "
    "(NIfTI .nii/.nii.gz or an axial brain MRI slice in PNG/JPG format)."
)
XRAY_REQUIRED_MSG = (
    "This image is not an X-Ray. Please upload a medical X-Ray "
    "(grayscale or clinical PNG/JPG)."
)


def _split(image: np.ndarray) -> tuple[np.ndarray | None, np.ndarray]:
    arr = np.asarray(image)
    if arr.ndim == 3 and arr.shape[2] >= 3:
        rgb = arr[..., :3].astype(np.float64)
        gray = np.mean(rgb, axis=2)
        return rgb, gray
    if arr.ndim == 3:
        return None, arr[..., 0].astype(np.float64)
    return None, arr.astype(np.float64)


def _resize(gray: np.ndarray, max_side: int = 256) -> np.ndarray:
    h, w = gray.shape[:2]
    m = max(h, w)
    if m <= max_side:
        return gray.astype(np.float64)
    return zoom(gray.astype(np.float64), max_side / m, order=1)


def _chroma(rgb: np.ndarray | None) -> float:
    if rgb is None:
        return 0.0
    return float(np.std(rgb, axis=2).mean())


def _saturation(rgb: np.ndarray | None) -> float:
    if rgb is None:
        return 0.0
    mx = np.max(rgb, axis=2)
    mn = np.min(rgb, axis=2)
    return float(((mx - mn) / np.maximum(mx, 1.0)).mean())


def _norm(gray: np.ndarray) -> np.ndarray:
    p1, p99 = np.percentile(gray, [1, 99])
    span = float(p99 - p1)
    if span < 1e-6:
        return np.zeros_like(gray, dtype=np.float64)
    return np.clip((gray - p1) / span, 0, 1)


def _features(gray: np.ndarray) -> dict:
    g = _resize(gray)
    n = _norm(g)
    h, w = n.shape
    c = max(6, int(min(h, w) * 0.12))
    corners = np.concatenate(
        [
            n[:c, :c].ravel(),
            n[:c, -c:].ravel(),
            n[-c:, :c].ravel(),
            n[-c:, -c:].ravel(),
        ]
    )
    cy, cx = h / 2.0, w / 2.0
    y, x = np.ogrid[:h, :w]
    inner = ((y - cy) / (h * 0.40)) ** 2 + ((x - cx) / (w * 0.40)) ** 2 <= 1.0
    blur = gaussian_filter(n, 1.1)
    highfreq = float(np.mean(np.abs(n - blur)))
    return {
        "corner_mean": float(corners.mean()),
        "dark_frac": float((n < 0.08).mean()),
        "bright_frac": float((n > 0.85).mean()),
        "center_mean": float(n[inner].mean()) if inner.any() else 0.0,
        "tissue_frac": float((n[inner] > 0.12).mean()) if inner.any() else 0.0,
        "highfreq": highfreq,
    }


def _has_medical_fov(f: dict) -> bool:
    """Black/dark canvas + brighter anatomy in the middle (MRI, CT, clinical X-ray)."""
    return (
        f["dark_frac"] >= 0.18
        and f["corner_mean"] <= 0.24
        and f["bright_frac"] <= 0.22
        and f["center_mean"] >= 0.14
        and f["tissue_frac"] >= 0.18
        and f["center_mean"] >= f["corner_mean"] * 1.25
    )


def _is_snapshot(rgb, f: dict) -> bool:
    """Portraits, pets, memes — not clinical."""
    colorful = _chroma(rgb) > 6.5 or _saturation(rgb) > 0.07
    white_studio = f["bright_frac"] > 0.25 and f["dark_frac"] < 0.14
    gray_vignette = f["corner_mean"] > 0.28 and f["dark_frac"] < 0.16
    if white_studio:
        return True
    if gray_vignette:
        return True
    if colorful and not _has_medical_fov(f):
        return True
    return False


def is_brain_mri(image: np.ndarray) -> tuple[bool, str]:
    if image is None or np.asarray(image).size == 0:
        return False, MRI_REQUIRED_MSG

    rgb, gray = _split(image)
    if min(gray.shape) < 48:
        return False, "Image resolution is too low for brain MRI analysis."

    f = _features(gray)
    if _is_snapshot(rgb, f):
        return False, MRI_REQUIRED_MSG
    if not _has_medical_fov(f):
        return False, MRI_REQUIRED_MSG
    return True, ""


def is_xray(image: np.ndarray) -> tuple[bool, str]:
    """
    Accept grayscale radiographs AND false-color clinical images (e.g. blue LUT).
    Reject portraits / pet photos.
    """
    if image is None or np.asarray(image).size == 0:
        return False, XRAY_REQUIRED_MSG

    rgb, gray = _split(image)
    if min(gray.shape) < 48:
        return False, "Image resolution is too low for X-Ray analysis."

    f = _features(gray)
    if _is_snapshot(rgb, f):
        return False, XRAY_REQUIRED_MSG
    if _has_medical_fov(f):
        return True, ""

    p1, p99 = np.percentile(gray, [1, 99])
    grayscale = _chroma(rgb) <= 6.5 and _saturation(rgb) <= 0.08
    if grayscale and float(p99 - p1) >= 12 and f["highfreq"] < 0.10 and f["corner_mean"] <= 0.42:
        return True, ""
    return False, XRAY_REQUIRED_MSG


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
    """NIfTI is a medical volume format — require a real 3D scan, not 2D photo heuristics."""
    if volume is None or volume.size == 0:
        raise ValueError(MRI_REQUIRED_MSG)
    if volume.ndim < 3:
        raise ValueError(MRI_REQUIRED_MSG)
    if float(np.std(volume)) < 1e-6:
        raise ValueError(MRI_REQUIRED_MSG)
    spatial = volume.shape[:3]
    if min(spatial) < 16:
        raise ValueError(MRI_REQUIRED_MSG)
