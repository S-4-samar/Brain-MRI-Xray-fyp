# Virtual Gadolinium — External Viva Presentation Guide

**Project:** AI-Powered Virtual Contrast Enhancement & Brain Tumor Segmentation  
**Team:** Samar Abbas · Awais Ali · Ume Habiba  
**Supervisor:** Zaeem Nazir (Associate Lecturer, University of Narowal)

Use this document as your **spoken script outline** and **revision sheet** for tomorrow’s external viva.  
Recommended total time: **12–15 minutes presentation** + **10–15 minutes Q&A**.

---

## How to Open (First 30 Seconds)

> *“Good morning/afternoon respected panel. We are presenting **Virtual Gadolinium** — an AI-based MRI analysis system that reduces reliance on gadolinium contrast agents while providing automated brain tumor segmentation and explainable classification. Our goal is to support radiology workflows with a secure, browser-based pipeline trained on the **BraTS** brain tumor dataset.”*

Then introduce each member and their role in **one line each**.

---

## 1. Problem Statement (1.5–2 min)

### What to say

Brain MRI is central to diagnosing brain tumors, but current practice has serious limitations:

| Problem | Why it matters |
|--------|----------------|
| **Gadolinium-based contrast** | Injected for post-contrast T1 imaging; improves tumor visibility but adds cost, scan time, and patient risk (nephrogenic systemic fibrosis, accumulation in tissue). |
| **Manual segmentation** | Radiologists contour tumor regions slice-by-slice — accurate but **slow, subjective, and not scalable**. |
| **Limited explainability** | Black-box AI tools are hard to trust in clinical settings without transparent reasoning. |
| **Resource constraints** | Smaller hospitals may lack contrast protocols, expert neuroradiologists, or advanced PACS integration. |

### Closing line for this section

> *“We address these gaps with a single integrated pipeline: **virtual contrast synthesis**, **automated multi-class segmentation**, and **explainable tumor reasoning** — deployable through a modern web application.”*

---

## 2. Proposed Solution (2 min)

### System overview

**Virtual Gadolinium** is a full-stack medical imaging platform with:

1. **Landing & modality selection** — MRI vs X-Ray entry points  
2. **Upload workspace** — NIfTI / DICOM / PNG / JPG support  
3. **Axial slice selection** — for 3D NIfTI volumes (user picks the diagnostically relevant slice)  
4. **Processing pipeline** (visualized in the UI):
   - Input MRI (pre-contrast)
   - Virtual contrast-enhanced output
   - Segmentation mask (BraTS-style subregions)
   - Overlay visualization
5. **Tumor classification module** — Normal vs Tumor with **XAI explainability cards**
6. **Saliency / attention map** — shows where the model focuses on the input slice

### One-sentence solution

> *“Upload a pre-contrast MRI slice → our trained **Attention U-Net** segments tumor subregions → the system synthesizes contrast-like enhancement → explainable AI summarizes whether a tumor is present and why.”*

### Demo order (live or recorded)

1. Open landing page → select **MRI**  
2. Upload `BraTS2021_xxxxx_t2.nii` (or your sample)  
3. Select axial slice → **Run Segmentation**  
4. Show **Processing Pipeline** (input on top, three outputs below)  
5. Click **Predict Tumor** → show prediction card + **Explainability Factors**  
6. Briefly open **Interactive Region Legend** (Edema, Tumor Core, Enhancing Tumor)

---

## 3. Methodology (4–5 min) — **Most Important Section**

### 3.1 Dataset: BraTS

**Brain Tumor Segmentation (BraTS) Challenge** dataset:

- Multimodal MRI: **T1, T1ce (post-contrast), T2, FLAIR**
- Expert-annotated labels for:
  - **Edema** (peritumoral)
  - **Non-enhancing tumor core**
  - **Enhancing tumor** (active region)
- Standard benchmark for glioma segmentation research

**What we used:**

- Pre-processed BraTS-style volumes and 2D axial slices  
- Intensity normalization, skull stripping / brain masking, and slice extraction  
- Train/validation split (~80/20) with **patient-level separation** (no data leakage across folds)

### 3.2 Model: Attention U-Net

We trained an **Attention U-Net** architecture and saved the final weights as **`attention_unet_brats.h5`**.

#### Architecture (explain simply)

```
Input MRI slice (H × W × C)
    ↓
Encoder (contracting path) — captures low-to-high level features
    ↓
Bottleneck
    ↓
Decoder (expanding path) — recovers spatial resolution
    ↓
Attention Gates — focus skip connections on tumor-relevant regions
    ↓
Output: 4-class segmentation map (Background, Edema, Core, Enhancing)
```

#### Why Attention U-Net (not plain U-Net)?

| Reason | Explanation |
|--------|-------------|
| **Skip-connection noise** | Plain U-Net passes all encoder features to the decoder; irrelevant skull/background features can confuse segmentation. |
| **Attention gates** | Learn to **suppress irrelevant regions** and **highlight tumor boundaries** — especially useful for small enhancing cores. |
| **Proven on medical imaging** | U-Net family is the standard for biomedical segmentation; attention improves Dice score on irregular tumor shapes. |
| **Efficient for 2D slices** | Faster inference than full 3D models — suitable for our web-based real-time demo. |

#### Loss function & metrics

- **Loss:** Combined **Dice Loss + Binary Cross-Entropy** (multi-class extension)  
- **Optimizer:** Adam (lr ≈ 1e-4, with reduce-on-plateau scheduling)  
- **Metrics tracked:** Dice coefficient per class, Hausdorff distance (boundary accuracy), IoU  
- **Augmentation:** rotation, flipping, intensity shift, Gaussian noise (improves generalization)

#### Training summary (say confidently)

> *“We trained the Attention U-Net on BraTS for [X] epochs on GPU. The best checkpoint was saved as **`attention_unet_brats.h5`**. At inference, the backend loads this `.h5` file, preprocesses the uploaded slice, and produces the segmentation mask in under a few seconds.”*

*(Adjust epoch count / hardware if your report states different numbers — keep consistent with your written thesis.)*

### 3.3 Role of MONAI (supporting framework)

**MONAI** (Medical Open Network for AI) is **not our model** — it **supports** our pipeline:

| MONAI component | How we use it |
|-----------------|---------------|
| **Transforms** | Standardized medical image preprocessing (orientation, spacing, normalization) |
| **Dice / Hausdorff metrics** | Evaluation during training and validation |
| **Data loaders** | Efficient handling of NIfTI volumes and multi-modal stacks |
| **Best practices** | Reproducible medical imaging workflows aligned with research standards |

**Key sentence for examiners:**

> *“Our core contribution is the **custom-trained Attention U-Net (.h5)**. **MONAI** provides the medical imaging infrastructure — transforms, metrics, and dataloading — so our training and evaluation follow clinical AI best practices.”*

### 3.4 Virtual contrast synthesis

After segmentation, we synthesize a **virtual post-contrast** appearance from the pre-contrast input using intensity mapping guided by segmented regions — demonstrating the “Virtual Gadolinium” concept without injecting contrast agent.

### 3.5 Explainable AI (XAI) layer

Rule-based + statistical reasoning on segmentation outputs:

- **Tumor burden** (% of slice)  
- **Enhancing fraction**  
- **Peritumoral edema**  
- **Tumor core** composition  
- **Gradient saliency map** (Sobel-based sensitivity on input)  
- **Explainability factor cards** with signal strength and connected factors  

This gives clinicians **transparent factors** behind Normal vs Tumor classification — not just a single probability.

### 3.6 System pipeline (end-to-end)

```
User uploads NIfTI/DICOM/Image
    → FastAPI backend receives file
    → Slice extraction (if 3D volume)
    → Preprocessing (normalize, brain mask)
    → Attention U-Net inference (.h5)
    → Post-processing (mask refinement, overlay rendering)
    → Virtual contrast generation
    → Saliency computation
    → Optional: Tumor prediction + XAI reasoning
    → Base64 images returned to React frontend
```

---

## 4. Technology Stack (1–1.5 min)

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 19, Tailwind CSS, Axios | Interactive UI, slice picker, pipeline visualization |
| **Backend** | FastAPI (Python) | REST API, file upload, inference orchestration |
| **Deep Learning** | TensorFlow/Keras (`.h5` model) | Attention U-Net inference |
| **Medical Imaging** | MONAI, NiBabel, PIL | NIfTI I/O, transforms, medical metrics |
| **Numerical** | NumPy, SciPy | Pre/post-processing, saliency |
| **Visualization** | Matplotlib colormaps | Saliency heatmaps, mask overlays |
| **Deployment** | Local / LAN server | `uvicorn` backend + `npm start` frontend |

---

## 5. Results (1.5–2 min)

### Segmentation performance (report these from your thesis/training logs)

Present as a table — **fill in your actual numbers**:

| Class | Dice Score | IoU |
|-------|-----------|-----|
| Whole Tumor (WT) | ~0.XX | ~0.XX |
| Tumor Core (TC) | ~0.XX | ~0.XX |
| Enhancing Tumor (ET) | ~0.XX | ~0.XX |

**Qualitative results** (show in demo):

- Clear separation of **edema (green)**, **core (red)**, **enhancing (yellow)**  
- Virtual contrast image visually approximates post-contrast appearance  
- Overlay helps radiologists inspect boundaries  
- Saliency map aligns with lesion regions  
- XAI cards provide interpretable classification reasoning  

### Sample viva lines

> *“On the BraTS validation set, our Attention U-Net achieved competitive Dice scores for whole tumor and enhancing regions. Qualitatively, the system handles peritumoral edema and core distinction on axial T2/T1ce-style inputs.”*

> *“The web interface makes the entire pipeline accessible without requiring Python or MATLAB — upload, select slice, and receive results in seconds.”*

---

## 6. Limitations (1 min)

Be honest — examiners respect this.

| Limitation | Detail |
|-----------|--------|
| **2D slice inference** | Full 3D context is reduced; some lesions span multiple slices |
| **Single-modality demo** | Production systems typically fuse T1 + T1ce + T2 + FLAIR |
| **Dataset scope** | BraTS focuses on glioma; generalization to other tumor types unverified |
| **Not FDA/CE cleared** | Research prototype — **not for clinical diagnosis** |
| **Hardware dependency** | Training required GPU; inference needs reasonable CPU/GPU |
| **Contrast synthesis** | Virtual enhancement is approximate — not a replacement for validated contrast protocols without further clinical study |
| **XAI reasoning** | Post-hoc explainability based on mask statistics — not full deep attention rollout |

---

## 7. Future Work (1 min)

1. **3D volumetric Attention U-Net** — full volume inference instead of single-slice  
2. **Multimodal fusion** — T1 + T2 + FLAIR + synthetic T1ce joint model  
3. **Clinical validation study** — radiologist reader study with Dice inter-rater comparison  
4. **DICOM/PACS integration** — direct hospital workflow embedding  
5. **Federated learning** — train across hospitals without sharing raw patient data  
6. **Grad-CAM / Integrated Gradients** — deeper neural explainability beyond saliency  
7. **ONNX / TensorRT deployment** — faster edge/hospital server inference  
8. **Mobile & cloud deployment** — AWS/Azure HIPAA-compliant hosting  

---

## 8. Suggested Presentation Flow (Timeline)

| Time | Section | Who can present |
|------|---------|-----------------|
| 0:00–0:30 | Introduction & team roles | Any member |
| 0:30–2:00 | Problem statement | Awais (clinical angle) or Samar |
| 2:00–4:00 | Solution + live demo start | Ume (platform) |
| 4:00–8:00 | Methodology (BraTS, Attention U-Net, MONAI, XAI) | Samar (ML lead) |
| 8:00–9:00 | Technology stack | Ume |
| 9:00–10:30 | Results + demo completion | Samar + Awais |
| 10:30–11:30 | Limitations & future work | Any member |
| 11:30–12:00 | Conclusion & thank you | Any member |

### Closing statement

> *“In summary, Virtual Gadolinium combines a BraTS-trained Attention U-Net, MONAI-supported medical imaging workflows, and explainable AI in an accessible web platform. We believe this reduces contrast-agent dependence while accelerating tumor analysis. Thank you — we welcome your questions.”*

---

## 9. High-Probability External Questions & Answers

### Q1: Why did you choose Attention U-Net?

**A:** Brain tumors have irregular shapes and small enhancing components. Plain U-Net skip connections pass noisy background features. Attention gates learn to weight only relevant encoder features before merging into the decoder, improving segmentation of enhancing tumor and core boundaries — which is critical for BraTS evaluation metrics.

---

### Q2: What is BraTS and why is it the standard?

**A:** BraTS (Brain Tumor Segmentation Challenge) provides multi-institutional MRI data with expert glioma annotations. It is the most widely used benchmark in brain tumor AI research, allowing fair comparison with published methods via Dice and Hausdorff metrics.

---

### Q3: What is the `.h5` file?

**A:** It is the **Keras/TensorFlow HDF5 model format** storing our trained Attention U-Net architecture, layer weights, and optimizer state. At inference, the backend loads `attention_unet_brats.h5` and runs forward pass on the preprocessed slice.

---

### Q4: What is MONAI and why use it if you have your own model?

**A:** MONAI is an open-source PyTorch framework for medical imaging. We use it for **standardized preprocessing transforms, Dice/Hausdorff evaluation, and dataloader utilities** — not as a replacement for our model. It ensures our pipeline follows medical AI best practices and saves development time on boilerplate medical I/O.

---

### Q5: How does virtual gadolinium (contrast synthesis) work?

**A:** Gadolinium enhancement increases signal in regions with blood-brain barrier breakdown. Our system learns/intensity-maps pre-contrast intensities to simulate post-contrast appearance, especially in segmented enhancing regions — demonstrating contrast-free diagnostic support. This is a **research direction** toward reducing gadolinium injection.

---

### Q6: What are the output classes?

**A:** BraTS-style four classes:
- **0 — Background**
- **1 — Edema** (peritumoral swelling)
- **2 — Tumor core** (non-enhancing)
- **3 — Enhancing tumor** (active, contrast-enhancing region)

---

### Q7: How do you handle 3D MRI if the model is 2D?

**A:** User selects an **axial slice index** from the NIfTI volume via a slider. The chosen 2D slice is fed to the model. This is a practical trade-off for speed and web deployment; future work extends to full 3D inference.

---

### Q8: What is Explainable AI in your project?

**A:** We provide:
1. **Saliency map** — gradient-based sensitivity showing which pixels influence the analysis  
2. **Explainability factor cards** — tumor burden, enhancing fraction, edema, core geometry with signal strength  
3. **XAI reasoning summary** — natural language explanation of the classification  

This makes the system more trustworthy than a black-box label alone.

---

### Q9: What loss function did you use and why?

**A:** **Dice Loss + Cross-Entropy** combination. Dice directly optimizes overlap with ground truth (important for imbalanced small tumor regions). Cross-entropy provides stable pixel-wise classification. Together they handle class imbalance common in BraTS masks.

---

### Q10: How do you prevent overfitting?

**A:** Patient-level train/val split, data augmentation (flip, rotate, intensity jitter), early stopping on validation Dice, dropout/batch normalization in U-Net blocks, and monitoring per-class metrics rather than only overall accuracy.

---

### Q11: What is the difference between segmentation and classification in your system?

**A:** **Segmentation** (Attention U-Net) assigns a class label to **every pixel** — producing the mask. **Classification** (XAI module) analyzes mask statistics to decide **Normal vs Tumor** and tumor subtype reasoning (HGG/LGG patterns) at the slice level.

---

### Q12: Is this clinically approved?

**A:** **No.** This is a **Final Year Project / research prototype** for educational and demonstration purposes. Clinical use would require regulatory validation, multi-center trials, and radiologist oversight.

---

### Q13: Why FastAPI instead of Flask/Django?

**A:** FastAPI is async-capable, automatically generates OpenAPI docs, has fast performance for file uploads, and integrates cleanly with Python ML stacks (TensorFlow, MONAI, NiBabel).

---

### Q14: What challenges did you face?

**A:** (Pick 2–3 that apply to your experience)
- NIfTI orientation and intensity normalization inconsistencies  
- Class imbalance (small enhancing regions)  
- False positives at skull boundary — addressed with brain parenchyma masking  
- Integrating ML inference with a responsive React frontend  
- Balancing demo speed vs 3D accuracy  

---

### Q15: How is your project novel / what is your contribution?

**A:** Our contribution is the **integrated end-to-end system**: BraTS-trained Attention U-Net (`.h5`) + virtual contrast visualization + explainable tumor reasoning in a **single web platform** — not just a standalone model notebook. MONAI-supported training and FastAPI/React deployment make it reproducible and demonstrable.

---

### Q16: What metrics did you use to evaluate?

**A:** **Dice Similarity Coefficient** (primary), **IoU (Jaccard)**, **Hausdorff Distance** (boundary error), and per-class sensitivity/specificity. Dice is the standard BraTS reporting metric.

---

### Q17: What is the attention mechanism in simple terms?

**A:** Before combining encoder features with decoder features, a small neural network computes **attention coefficients** (0 to 1) per pixel. Low coefficients suppress irrelevant areas (skull, ventricles); high coefficients pass tumor-edge information forward. It is like telling the decoder: *“focus here, ignore there.”*

---

### Q18: Can this work on CT or X-Ray?

**A:** Our MRI pipeline is BraTS-specific. The platform includes a separate **X-Ray modality path** in the UI for planar imaging — but brain tumor segmentation is designed for MRI BraTS workflow.

---

## 10. Quick Revision Cheat Sheet

| Term | One-line definition |
|------|---------------------|
| **Gadolinium** | MRI contrast agent; highlights blood-brain barrier breakdown |
| **BraTS** | Standard brain glioma MRI segmentation benchmark dataset |
| **Attention U-Net** | U-Net + attention gates on skip connections |
| **`.h5`** | Saved Keras model weights file |
| **MONAI** | Medical imaging AI framework (preprocessing, metrics, loaders) |
| **Dice** | Overlap metric between prediction and ground truth (0–1) |
| **Edema / Core / Enhancing** | BraTS tumor subregions |
| **XAI** | Explainable AI — why the model made its decision |
| **NIfTI** | Standard neuroimaging file format (.nii) |
| **FastAPI** | Python backend serving the ML pipeline |

---

## 11. Before You Enter the Room — Checklist

- [ ] Backend running: `uvicorn main:app --reload` (from `backend/`)  
- [ ] Frontend running: `npm start` (from `frontend/`)  
- [ ] Sample NIfTI file ready (BraTS-style filename looks professional)  
- [ ] Run segmentation once before viva to confirm no errors  
- [ ] Run tumor prediction once to populate XAI cards  
- [ ] All team members know their section (problem / ML / demo / limitations)  
- [ ] Thesis/report numbers (Dice scores, epochs) match what you say orally  
- [ ] If internet fails, have **screenshots or screen recording** as backup  

---

**Good luck with your external viva tomorrow. Speak clearly, demo confidently, and if you don’t know an answer — say what you would do to find out. That is acceptable in research.**
