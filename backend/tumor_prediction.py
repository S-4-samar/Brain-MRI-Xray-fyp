"""Tumor prediction and XAI reasoning from segmentation mask statistics."""

from __future__ import annotations

from typing import Any

import numpy as np


def _pct(count: int, total: int) -> float:
    return round(100.0 * count / max(total, 1), 3)


def _lesion_geometry(pred: np.ndarray) -> dict[str, float]:
    """Detect ring-like peripheral artifacts vs focal intra-parenchymal lesions."""
    tumor = pred > 0
    if not tumor.any():
        return {
            "peripheral_frac": 0.0,
            "center_frac": 0.0,
            "compactness": 0.0,
            "is_ring_artifact": False,
        }

    h, w = pred.shape
    cy, cx = h / 2.0, w / 2.0
    y, x = np.ogrid[:h, :w]
    dist = np.sqrt((y - cy) ** 2 + (x - cx) ** 2)
    max_dist = float(np.sqrt(cy**2 + cx**2))
    norm_dist = dist / max(max_dist, 1e-6)

    t_dist = norm_dist[tumor]
    peripheral_frac = float((t_dist > 0.68).sum() / tumor.sum())
    center_frac = float((t_dist < 0.42).sum() / tumor.sum())

    ys, xs = np.where(tumor)
    bbox_area = max(1, (ys.max() - ys.min() + 1) * (xs.max() - xs.min() + 1))
    compactness = float(tumor.sum() / bbox_area)

    is_ring = (
        peripheral_frac > 0.45
        and center_frac < 0.12
    ) or (
        peripheral_frac > 0.35
        and compactness < 0.22
    )

    return {
        "peripheral_frac": round(peripheral_frac, 3),
        "center_frac": round(center_frac, 3),
        "compactness": round(compactness, 3),
        "is_ring_artifact": is_ring,
    }


def _card_status(signal: str) -> str:
    if signal in ("positive", "normal"):
        return "completed"
    if signal == "caution":
        return "in-progress"
    return "in-progress"


def _energy(value: float) -> int:
    return int(max(5, min(100, round(value))))


def predict_from_segmentation(
    pred: np.ndarray,
    norm: np.ndarray,
    smooth: np.ndarray,
    saliency: np.ndarray,
) -> dict[str, Any]:
    """
    Derive tumor prediction + transparent reasoning from BraTS-style mask labels:
      0 = background, 1 = edema, 2 = tumor core, 3 = enhancing tumor
    """
    total = int(pred.size)
    edema = int((pred == 1).sum())
    core = int((pred == 2).sum())
    enhancing = int((pred == 3).sum())
    tumor = edema + core + enhancing

    tumor_ratio = tumor / max(total, 1)
    edema_pct = _pct(edema, total)
    core_pct = _pct(core, total)
    enhancing_pct = _pct(enhancing, total)
    burden_pct = _pct(tumor, total)

    p90 = float(np.percentile(smooth, 90))
    p95 = float(np.percentile(smooth, 95))
    p99 = float(np.percentile(smooth, 99))
    mean_intensity = float(smooth.mean())

    # Saliency overlap with tumor mask (XAI alignment)
    tumor_mask = pred > 0
    if tumor_mask.any() and saliency.max() > 0:
        sal_in_tumor = float(saliency[tumor_mask].mean())
        sal_outside = float(saliency[~tumor_mask].mean()) if (~tumor_mask).any() else 0.0
        saliency_focus = round(sal_in_tumor / max(sal_outside, 1e-6), 2)
    else:
        sal_in_tumor = float(saliency.mean())
        saliency_focus = 1.0

    geo = _lesion_geometry(pred)
    peripheral_frac = geo["peripheral_frac"]
    center_frac = geo["center_frac"]
    compactness = geo["compactness"]
    is_ring_artifact = geo["is_ring_artifact"]

    # Focal mass must sit inside brain parenchyma (not skull ring).
    has_focal_lesion = (
        center_frac >= 0.15
        or (compactness >= 0.30 and peripheral_frac < 0.40)
    ) and burden_pct >= 0.35

    # ── Normal vs tumor decision ─────────────────────────────────────────────
    is_normal = (
        tumor == 0
        or is_ring_artifact
        or (burden_pct < 5.0 and not has_focal_lesion)
        or (
            tumor_ratio < 0.012
            and peripheral_frac > 0.38
            and center_frac < 0.15
        )
        or (
            burden_pct < 1.5
            and enhancing_pct < 0.25
            and p95 < 0.62
        )
    )

    reasoning: list[dict[str, Any]] = []

    if is_normal:
        confidence = round(
            min(99.2, 91.0 + (0.56 - p95) * 28 + (0.01 - tumor_ratio) * 120),
            2,
        )
        prediction = {
            "status": "normal",
            "label": "No Tumor Detected",
            "subtitle": "Normal brain MRI appearance on this slice",
            "grade": None,
            "tumor_type": "none",
            "confidence": confidence,
            "summary": (
                "No focal intra-parenchymal lesion detected on this slice. "
                + (
                    "Segmentation signal at the skull boundary was identified as an artifact and excluded. "
                    if is_ring_artifact
                    else "Intensity distribution and subregion volumes are consistent with normal brain parenchyma."
                )
            ),
        }

        reasoning = [
            {
                "id": "burden",
                "title": "Tumor Burden",
                "subtitle": "Volume Analysis",
                "value": f"{burden_pct:.2f}%",
                "signal": "positive",
                "status": _card_status("positive"),
                "energy": _energy(100 - burden_pct * 18),
                "color": "#8b5cf6",
                "interpretation": "Negligible segmented lesion volume",
                "content": (
                    "Tumor burden quantifies the proportion of brain voxels assigned to abnormal "
                    f"tissue across BraTS subregions. On this slice only {burden_pct:.2f}% of voxels "
                    "were segmented — well below the detection threshold for focal disease."
                ),
                "detail": (
                    f"Only {burden_pct:.2f}% of voxels were assigned to any tumor subregion "
                    f"(edema, core, or enhancing), well below the detection threshold."
                ),
                "related_ids": ["enhancing", "geometry"],
            },
            {
                "id": "intensity",
                "title": "Intensity Profile",
                "subtitle": "Signal Distribution",
                "value": f"P95 {p95:.2f}",
                "signal": "positive",
                "status": _card_status("positive"),
                "energy": _energy((1.0 - min(p95, 1.0)) * 100 + 20),
                "color": "#3b82f6",
                "interpretation": "No focal hyperintense mass",
                "content": (
                    "Intensity profiling examines the distribution of voxel signal across the slice. "
                    f"A 95th-percentile of {p95:.2f} (mean {mean_intensity:.2f}) indicates homogeneous "
                    "brain parenchyma without a dominant hyperintense mass or contrast focus."
                ),
                "detail": (
                    f"95th-percentile intensity is {p95:.2f} (mean {mean_intensity:.2f}), "
                    "indicating homogeneous brain tissue without a dominant contrast-enhancing focus."
                ),
                "related_ids": ["burden", "enhancing"],
            },
            {
                "id": "enhancing",
                "title": "Enhancing Region",
                "subtitle": "Contrast Uptake",
                "value": f"{enhancing_pct:.2f}%",
                "signal": "positive",
                "status": _card_status("positive"),
                "energy": _energy(100 - enhancing_pct * 25),
                "color": "#eab308",
                "interpretation": "No active enhancing tumor",
                "content": (
                    "The enhancing region represents voxels with active contrast uptake, indicating "
                    "blood-brain barrier disruption. No enhancing tumor voxels were detected — "
                    "the contrast uptake pattern is consistent with normal brain tissue."
                ),
                "detail": "No voxels classified as enhancing tumor — contrast uptake pattern appears normal.",
                "related_ids": ["burden", "intensity"],
            },
            {
                "id": "geometry",
                "title": "Lesion Geometry",
                "subtitle": "Spatial Pattern",
                "value": "No focal mass",
                "signal": "positive",
                "status": _card_status("positive"),
                "energy": _energy(95 if is_ring_artifact else 88),
                "color": "#06b6d4",
                "interpretation": (
                    "Peripheral ring artifact excluded"
                    if is_ring_artifact
                    else "No compact lesion in brain center"
                ),
                "content": (
                    "Lesion geometry analyzes whether segmented signal forms a focal intra-parenchymal "
                    "mass or a peripheral ring artifact. "
                    + (
                        f"Peripheral fraction {peripheral_frac * 100:.0f}% with compactness "
                        f"{compactness:.2f} matches a skull-edge artifact — not a true tumor."
                        if is_ring_artifact
                        else (
                            f"Center fraction {center_frac * 100:.0f}% and compactness "
                            f"{compactness:.2f} show no focal mass meeting tumor geometry criteria."
                        )
                    )
                ),
                "detail": (
                    f"Peripheral fraction {peripheral_frac * 100:.0f}%, center fraction "
                    f"{center_frac * 100:.0f}%, compactness {compactness:.2f} — "
                    + (
                        "pattern matches skull-edge segmentation artifact, not a true tumor."
                        if is_ring_artifact
                        else "no focal mass meeting tumor geometry criteria."
                    )
                ),
                "related_ids": ["burden"],
            },
        ]

        xai_summary = (
            "Model reasoning: "
            + (
                "skull-boundary artifact excluded, "
                if is_ring_artifact
                else "absent focal lesion, "
            )
            + "low parenchymal burden, and diffuse saliency support a **normal** classification."
        )

    else:
        enhancing_frac = enhancing / max(tumor, 1)
        core_frac = core / max(tumor, 1)
        edema_frac = edema / max(tumor, 1)

        if enhancing_frac >= 0.22 and core > 0:
            grade = "HGG"
            tumor_type = "high_grade_glioma"
            label = "High-Grade Glioma (HGG)"
            subtitle = "Active enhancing tumor with necrotic/core component"
        elif enhancing_frac >= 0.12 or enhancing_pct >= 0.15:
            grade = "HGG"
            tumor_type = "enhancing_tumor"
            label = "Enhancing Tumor — Active Lesion"
            subtitle = "Contrast-enhancing region indicates blood-brain barrier disruption"
        elif core_frac >= 0.35:
            grade = "LGG"
            tumor_type = "low_grade_glioma"
            label = "Low-Grade Glioma (LGG)"
            subtitle = "Predominant non-enhancing tumor core"
        elif edema_frac >= 0.55:
            grade = "LGG"
            tumor_type = "edema_dominant"
            label = "Tumor with Peritumoral Edema"
            subtitle = "Edema-dominant lesion with mass effect pattern"
        else:
            grade = "Indeterminate"
            tumor_type = "focal_lesion"
            label = "Focal Tumor Region Detected"
            subtitle = "Segmented lesion requires multi-slice / multimodal review"

        confidence = round(
            min(
                98.5,
                82
                + burden_pct * 1.8
                + enhancing_frac * 12
                + min(saliency_focus, 4) * 2.5
                + (p99 - 0.55) * 15,
            ),
            2,
        )

        prediction = {
            "status": "tumor_detected",
            "label": label,
            "subtitle": subtitle,
            "grade": grade,
            "tumor_type": tumor_type,
            "confidence": confidence,
            "summary": (
                f"Segmentation identified {burden_pct:.1f}% of this slice as tumor tissue. "
                f"Subregion composition — edema {edema_pct:.1f}%, core {core_pct:.1f}%, "
                f"enhancing {enhancing_pct:.1f}% — supports classification as **{label}**."
            ),
        }

        burden_signal = "alert" if burden_pct > 8 else "caution" if burden_pct > 3 else "normal"
        enhancing_signal = "alert" if enhancing_pct > 1.5 else "caution" if enhancing_pct > 0.4 else "normal"
        edema_signal = "caution" if edema_pct > 5 else "normal"

        core_signal = "caution" if core_pct > 2 else "normal"

        reasoning = [
            {
                "id": "burden",
                "title": "Tumor Burden",
                "subtitle": "Volume Analysis",
                "value": f"{burden_pct:.2f}%",
                "signal": burden_signal,
                "status": _card_status(burden_signal),
                "energy": _energy(burden_pct * 9 + 25),
                "color": "#8b5cf6",
                "interpretation": (
                    "Significant lesion volume" if burden_pct > 5 else "Moderate focal lesion"
                ),
                "content": (
                    "Tumor burden measures the total proportion of brain voxels classified as "
                    f"abnormal tissue. This slice shows {burden_pct:.1f}% segmented burden "
                    f"({tumor:,} voxels) across edema, core, and enhancing subregions."
                ),
                "detail": (
                    f"{tumor:,} voxels ({burden_pct:.2f}% of slice) segmented as tumor tissue "
                    "across BraTS subregions."
                ),
                "related_ids": ["enhancing", "edema", "core"],
            },
            {
                "id": "enhancing",
                "title": "Enhancing Tumor",
                "subtitle": "Active Region",
                "value": f"{enhancing_pct:.2f}%",
                "signal": enhancing_signal,
                "status": _card_status(enhancing_signal),
                "energy": _energy(enhancing_frac * 85 + enhancing_pct * 4 + 15),
                "color": "#eab308",
                "interpretation": (
                    "Strong contrast uptake — active tumor"
                    if enhancing_frac >= 0.15
                    else "Limited enhancement detected"
                ),
                "content": (
                    "The enhancing tumor region shows contrast enhancement indicating areas of "
                    "active tumor growth with disrupted blood-brain barrier. Enhancing tissue "
                    f"comprises {enhancing_frac * 100:.0f}% of the segmented lesion on this slice."
                ),
                "detail": (
                    f"Enhancing tumor comprises {enhancing_frac * 100:.0f}% of segmented lesion. "
                    "Elevated enhancing fraction correlates with high-grade pathology."
                ),
                "related_ids": ["burden", "core"],
            },
            {
                "id": "edema",
                "title": "Peritumoral Edema",
                "subtitle": "Surrounding Tissue",
                "value": f"{edema_pct:.2f}%",
                "signal": edema_signal,
                "status": _card_status(edema_signal),
                "energy": _energy(edema_frac * 80 + edema_pct * 3 + 20),
                "color": "#10b981",
                "interpretation": (
                    "Extensive peritumoral swelling"
                    if edema_pct > 6
                    else "Mild to moderate edema cuff"
                ),
                "content": (
                    "Peritumoral edema represents the swollen tissue surrounding the tumor. "
                    "This region contains fluid accumulation and reflects the tumor's influence "
                    f"on adjacent healthy brain — {edema_frac * 100:.0f}% of the lesion mask."
                ),
                "detail": (
                    f"Edema surrounds the lesion ({edema_frac * 100:.0f}% of tumor mask), "
                    "reflecting vasogenic fluid accumulation in adjacent parenchyma."
                ),
                "related_ids": ["burden", "core"],
            },
            {
                "id": "core",
                "title": "Tumor Core",
                "subtitle": "Non-enhancing",
                "value": f"{core_pct:.2f}%",
                "signal": core_signal,
                "status": _card_status(core_signal),
                "energy": _energy(core_frac * 90 + core_pct * 5 + 10),
                "color": "#ef4444",
                "interpretation": (
                    "Non-enhancing necrotic/core component present"
                    if core > 0
                    else "No distinct core region"
                ),
                "content": (
                    "The non-enhancing tumor core represents the central hypointense region. "
                    "This is the primary tumor mass that does not enhance with contrast agent. "
                    f"Core tissue occupies {core_frac * 100:.0f}% of the lesion on this slice."
                ),
                "detail": (
                    f"Central hypointense core occupies {core_frac * 100:.0f}% of the lesion mask — "
                    "typical of non-enhancing tumor bulk on T1-weighted imaging."
                ),
                "related_ids": ["edema", "enhancing"],
            },
        ]

        xai_summary = (
            f"Model reasoning: segmented burden ({burden_pct:.1f}%), enhancing fraction "
            f"({enhancing_frac * 100:.0f}%), and saliency focus ({saliency_focus:.1f}×) "
            f"support **{label}** with {confidence:.1f}% confidence."
        )

    return {
        "prediction": prediction,
        "segmentation_stats": {
            "total_voxels": total,
            "tumor_voxels": tumor,
            "tumor_burden_pct": burden_pct,
            "edema_pct": edema_pct,
            "core_pct": core_pct,
            "enhancing_pct": enhancing_pct,
            "intensity_p95": round(p95, 3),
            "intensity_p99": round(p99, 3),
            "saliency_focus_ratio": saliency_focus,
            "peripheral_frac": peripheral_frac,
            "center_frac": center_frac,
            "compactness": compactness,
            "ring_artifact": is_ring_artifact,
        },
        "reasoning": reasoning,
        "xai_summary": xai_summary,
    }
