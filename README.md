# Zenith Microscopy (OpenZEN) 🔬

> **Next-Generation Open-Source Bio-Imaging & Microscope Acquisition Platform**  
> Designed as a modern, high-performance, GPU-accelerated alternative to legacy tools and proprietary platforms like ZEISS ZEN and Micro-Manager.

---

## 🌟 Overview

**Zenith Microscopy** combines a sleek, modern dark-mode interface with scientific-grade multi-dimensional acquisition tools. Built with a **React 19 + TypeScript** frontend, GPU canvas compositing, and a native **Zeiss pylibCZIrw Python** scientific imaging engine, Zenith brings modern design to advanced light and confocal microscopy workflows.

---

## 🚀 Key Features

### 1. Multi-Dimensional Viewer (XYZCT)
- **Multi-Channel Compositing**: Additive screen-mode blending for 4+ fluorescence channels (DAPI, Alexa 488, mCherry, Cy5).
- **Z-Stack Slicing & Projections**: Smooth axial depth navigation with calibrated physical step sizes (µm).
  - **Single Slice**: Interactive focal navigation.
  - **MIP (Maximum Intensity Projection)**: Compresses entire 3D volume into maximum contrast.
  - **Average Intensity Projection**: Noise-reduced volume integration.
- **Time-Lapse Timeline**: Frame-by-frame scrubbing and live playback loop with adjustable frame rates.
- **View Modes**:
  - **Composite**: Unified multi-fluorophore overlay.
  - **Split Channels**: 2x2 synchronized grid isolating each fluorophore.
  - **3D Ortho**: Orthogonal axial projections across XY, XZ, and YZ planes.

### 2. Scientific Morphometry & Interactive Analysis Suite
- **Interactive Line Intensity Profiling (`ScaledProfileMeasurer`)**:
  - Draw arbitrary vectors across cellular structures.
  - Live SVG multi-channel intensity curve plot with distance in micrometers (µm).
  - Peak intensity detection, Full Width at Half Maximum (FWHM) estimation, and CSV export.
- **Automated Cell Counter & Nuclei Segmentation**:
  - Algorithmic segmentation methods: **Otsu**, **Triangle**, and **3-Sigma** thresholding.
  - Filter cells by minimum/maximum area (µm²) and circularity.
  - Live visual ROI overlays and summary density statistics.
- **Quantitative Colocalization Analysis**:
  - Dual-channel fluorophore comparison (e.g. Alexa 488 vs mCherry).
  - 2D intensity scattergram heatmap with adjustable threshold cutoffs.
  - Quantitative metrics: **Pearson's Correlation Coefficient ($r$)** and **Manders Overlap Coefficients ($M_1, M_2$)**.
- **Interactive Measurement Data Dock**:
  - Calibrated Caliper Lines, Rectangle ROIs, and Circle ROIs.
  - Floating morphometry dock calculating length (µm), area (µm²), and mean digital numbers (DN) per channel.
  - One-click CSV export and clear capabilities.

### 3. Image Processing & Spatial Convolutions
- **Spatial Filters**:
  - Gaussian Blur (noise reduction).
  - Unsharp Mask (filament & structural sharpening).
  - Median Despeckle (detector noise reduction).
  - Sobel Gradient (edge detection & membrane segmentation).
- **Zeiss Range Indicator LUT**:
  - Visual clipping feedback: **Blue** highlights underexposed pixels (0 DN), **Red** highlights saturated pixels (255 DN).

### 4. Tile Region & Mosaic Scanning (ZEN Tiles)
- **2D Mosaic Planning Grid**:
  - Matrix configuration (e.g., 3×3, 4×4, 5×5 fields of view).
  - Snake-by-row and Comb acquisition trajectories.
  - Adjustable tile overlap percentage (1% to 25%) for seamless stitching.
  - Real-time specimen footprint calculation in millimeters (mm).

### 5. Native ZEISS CZI Engine (`pylibCZIrw`)
- Full native `.czi` read/write support powered by Carl Zeiss C++ Python wheels.
- Seamless toggling between simulated mitotic cells and authentic Zeiss 4-channel 16-bit CZI files.
- Full microscope hardware metadata tree inspection (Plan-Apochromat 63x/1.40 Oil, Axiocam 702 sCMOS, laser power, bit depth).

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Vanilla CSS (Glassmorphism design system), Lucide icons.
- **Rendering**: Canvas 2D / WebGL multi-channel additive shader blending.
- **Backend / HAL**: Python 3.14, `pylibCZIrw` (Carl Zeiss official SDK), NumPy, SciPy.

---

## 🏃 Getting Started

### 1. Run the Web Workstation
```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Workstation opens at `http://localhost:5173/`.

### 2. Run the Zeiss CZI Python Engine (Optional)
```bash
python backend/engine.py
```
HAL API runs at `http://localhost:8080/`.

---

## 📜 License
MIT License. Open-source bio-imaging software for researchers, microscopists, and developers worldwide.
