# Zenith Microscopy (OpenZEN) 🔬

> **Next-Generation Open-Source Bio-Imaging & Microscope Acquisition Platform**  
> Designed as a modern, high-performance, GPU-accelerated alternative to legacy tools and proprietary platforms like ZEISS ZEN and Micro-Manager.

---

## 🌟 Overview

**Zenith Microscopy** combines a sleek, modern dark-mode interface with scientific-grade multi-dimensional acquisition tools. Built with a **React 19 + TypeScript** frontend, GPU canvas compositing, and a **Python 3.14** scientific imaging engine, Zenith brings intuitive modern design to advanced light and confocal microscopy.

---

## 🚀 Key Features

### 1. Multi-Dimensional Viewer (XYZCT)
- **Multi-Channel Compositing**: Additive screen-mode blending for 4+ fluorescence channels (DAPI, Alexa 488, mCherry, Cy5, Far-Red).
- **Z-Stack Slicing**: Smooth axial depth navigation with calibrated physical step sizes (µm) and defocus simulation.
- **Time-Lapse Timeline**: Frame-by-frame scrubbing and live playback loop with adjustable frame rates.
- **View Modes**:
  - **Composite**: Unified multi-fluorophore overlay.
  - **Split Channels**: 2x2 synchronized grid isolating each fluorophore.
  - **3D Ortho**: Orthogonal axial projections across XY, XZ, and YZ planes.

### 2. Scientific Display & LUT Controls
- **Live Histograms**: Real-time intensity distributions with interactive black/white windowing and auto-contrast.
- **LUT Color Mapping**: Scientific presets (DAPI Blue, Alexa488 Green, mCherry Red, Cy5 Magenta, CFP, YFP, Fire, Grayscale).
- **Gamma & Opacity**: Non-linear transfer curve adjustments per channel.
- **Channel Solo & Mute**: Instant isolation of individual staining targets.

### 3. Precision Measurement & Optics HUD
- **Dynamic Scale Bar**: Automatically calibrated based on objective magnification (63x/1.40 NA Oil, 40x Water, 20x Air) and zoom scale.
- **Live Pixel Inspector**: Real-time digital number (DN / Gray level) readouts for every channel under the mouse cursor.
- **Ruler Tool**: Interactive calibrated distance measurements in micrometers (µm).

### 4. Experiment Acquisition Designer
- **Dimensions Setup**: Define Z-stack limits (First, Last, Nyquist-matched step size), time-lapse intervals, and tile grids.
- **Hardware Abstraction Layer (HAL)**: Python driver interfaces for motorized stages, laser combiners (405, 488, 561, 640 nm), and sCMOS detectors.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Vanilla CSS (Glassmorphism design system), Lucide icons.
- **Rendering**: Canvas 2D / WebGL multi-channel additive shader blending.
- **Backend / HAL**: Python 3.14, NumPy, SciPy, Bioformats / CZI hooks.

---

## 🏃 Getting Started

### Prerequisites
- **Node.js** 20+ (tested on Node v24)
- **Python** 3.10+ (tested on Python 3.14)

### 1. Run the Web Workstation
```bash
# Install dependencies
npm install

# Start local development server
npm run dev
```

Navigate to `http://localhost:5173` in your browser.

### 2. Python Backend & Hardware Engine
```bash
cd backend
pip install -r requirements.txt
python engine.py
```

---

## 🗺️ Roadmap

- [x] **Milestone 1: Multi-Dimensional Bio-Imaging Viewer** (Sleek dark UI, live LUTs, Z-stack depth, time timeline, pixel inspector).
- [ ] **Milestone 2: Native CZI & OME-TIFF File Drag & Drop** (Direct browser and Python decoding of Zeiss `.czi` subblocks).
- [ ] **Milestone 3: Camera & Stage Drivers** (GenICam / USB3 Vision cameras and serial stage control).
- [ ] **Milestone 4: GPU 3D Volume Rendering** (Raymarching volume visualization and 3D Richardson-Lucy deconvolution).

---

## 📄 License
MIT License. Open-source for the scientific and microscopy community.
