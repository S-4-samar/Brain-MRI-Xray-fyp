"""Accept typical brain MRI / X-Ray; reject photos (portraits, pets, snapshots)."""

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
    dx = sobel(n, axis=0)
    dy = sobel(n, axis=1)
    return {
        "h": h,
        "w": w,
        "corner_mean": float(corners.mean()),
        "dark_frac": float((n < 0.08).mean()),
        "bright_frac": float((n > 0.85).mean()),
        "center_mean": float(n[inner].mean()) if inner.any() else 0.0,
        "tissue_frac": float((n[inner] > 0.12).mean()) if inner.any() else 0.0,
        "highfreq": highfreq,
        "edge_h": float(np.mean(np.abs(dx))),
        "edge_v": float(np.mean(np.abs(dy))),
    }


def is_brain_mri(image: np.ndarray) -> tuple[bool, str]:
    """
    True MRI: nearly grayscale + large black FOV + brighter oval tissue.
    Portraits (white bg, color) and pet photos (gray vignette, color/texture) fail.
    """
    if image is None or np.asarray(image).size == 0:
        return False, MRI_REQUIRED_MSG

    rgb, gray = _split(image)
    if min(gray.shape) < 48:
        return False, "Image resolution is too low for brain MRI analysis."

    # Color photos / ID shots / the cat mugshot (warm fur) vs true grayscale MRI.
    if _chroma(rgb) > 6.5 or _saturation(rgb) > 0.07:
        return False, MRI_REQUIRED_MSG

    f = _features(gray)
    # Real axial MRI has a black canvas; portraits are white; cat mugshot is gray.
    if f["dark_frac"] < 0.22:
        return False, MRI_REQUIRED_MSG
    if f["bright_frac"] > 0.18:
        return False, MRI_REQUIRED_MSG
    if f["corner_mean"] > 0.22:
        return False, MRI_REQUIRED_MSG
    if f["center_mean"] < 0.16 or f["tissue_frac"] < 0.20:
        return False, MRI_REQUIRED_MSG
    if f["center_mean"] < f["corner_mean"] * 1.35:
        return False, MRI_REQUIRED_MSG
    # Fur / hair / overlay text is much busier than an MRI slice.
    if f["highfreq"] > 0.078:
        return False, MRI_REQUIRED_MSG
    # Height-chart / ruler lines are strongly horizontal.
    if f["edge_h"] > f["edge_v"] * 1.35 and f["edge_h"] > 0.06:
        return False, MRI_REQUIRED_MSG
    return True, ""


def is_xray(image: np.ndarray) -> tuple[bool, str]:
    if image is None or np.asarray(image).size == 0:
        return False, XRAY_REQUIRED_MSG

    rgb, gray = _split(image)
    if min(gray.shape) < 48:
        return False, "Image resolution is too low for X-Ray analysis."

    if _chroma(rgb) > 6.5 or _saturation(rgb) > 0.07:
        return False, XRAY_REQUIRED_MSG

    f = _features(gray)
    # Portraits: white background. X-rays usually have dark collimation.
    if f["bright_frac"] > 0.28 and f["dark_frac"] < 0.10:
        return False, XRAY_REQUIRED_MSG
    if f["corner_mean"] > 0.45:
        return False, XRAY_REQUIRED_MSG
    if f["highfreq"] > 0.095:
        return False, XRAY_REQUIRED_MSG
    p1, p99 = np.percentile(gray, [1, 99])
    if float(p99 - p1) < 12:
        return False, XRAY_REQUIRED_MSG
    return True, ""


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
    if volume.ndim < 3:
        raise ValueError(MRI_REQUIRED_MSG)
    if volume.size == 0 or np.std(volume) < 1e-6:
        raise ValueError(MRI_REQUIRED_MSG)
    spatial = volume.shape[:3]
    if min(spatial) < 16:
        raise ValueError(MRI_REQUIRED_MSG)
    mid = spatial[2] // 2
    validate_brain_mri(volume[:, :, mid])
