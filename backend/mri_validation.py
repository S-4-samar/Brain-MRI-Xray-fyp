"""Reject everyday photos while accepting typical MRI slices and X-rays."""

from __future__ import annotations

import numpy as np
from scipy.ndimage import sobel

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


def _is_color_photo(rgb: np.ndarray | None) -> bool:
    """True for snapshots/selfies; MRI and X-ray are nearly grayscale."""
    if rgb is None:
        return False
    return float(np.std(rgb, axis=2).mean()) > 18.0


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

    h, w = gray.shape
    if min(h, w) < 64:
        return False, "Image resolution is too low for analysis."

    aspect = max(h, w) / max(min(h, w), 1)
    if aspect > 3.2:
        return False, fail

    p1, p99 = np.percentile(gray, [1, 99])
    if float(p99 - p1) < 8:
        return False, fail

    norm = _normalized(gray)
    if float(norm.std()) < 0.08:
        return False, fail

    corner = max(4, int(min(h, w) * 0.10))
    corners = np.concatenate(
        [
            norm[:corner, :corner].ravel(),
            norm[:corner, -corner:].ravel(),
            norm[-corner:, :corner].ravel(),
            norm[-corner:, -corner:].ravel(),
        ]
    )
    corner_mean = float(corners.mean())

    cy, cx = h / 2.0, w / 2.0
    y, x = np.ogrid[:h, :w]
    inner = ((y - cy) / (h * 0.42)) ** 2 + ((x - cx) / (w * 0.42)) ** 2 <= 1.0
    center_vals = norm[inner]
    if center_vals.size == 0:
        return False, fail

    center_mean = float(center_vals.mean())
    tissue_frac = float((center_vals > 0.10).sum() / center_vals.size)

    dx = sobel(norm, axis=0)
    dy = sobel(norm, axis=1)
    edge = np.hypot(dx, dy)
    edge_mean = float(edge.mean())

    if kind == "mri":
        # Brain MRI: dark FOV, brighter central tissue, not a busy photo/screenshot.
        if tissue_frac < 0.18 or center_mean < 0.10:
            return False, fail
        if corner_mean > 0.55:
            return False, fail
        if center_mean < corner_mean * 0.85 and corner_mean > 0.28:
            return False, fail
        if edge_mean > 0.28:
            return False, fail
        return True, ""

    # X-ray: high contrast grayscale, not a color/scene photo.
    if tissue_frac < 0.12:
        return False, fail
    if edge_mean > 0.32:
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
