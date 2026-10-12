import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  Channel,
  ViewMode,
  ActiveTool,
  DatasetMetadata,
  LineProfilePoint,
  RoiItem,
  ProjectionMode,
  ProcessingFilter,
  MeasurementRecord
} from '../../types/microscopy';
import { generateLutTable } from '../../services/lutEngine';
import { BiologicalImageGenerator } from '../../services/sampleData';

interface ViewportProps {
  channels: Channel[];
  viewMode: ViewMode;
  activeTool: ActiveTool;
  projectionMode?: ProjectionMode;
  processingFilter?: ProcessingFilter;
  currentZ: number;
  totalZ: number;
  currentTime: number;
  metadata: DatasetMetadata;
  zoom: number;
  setZoom: (z: number) => void;
  pan: { x: number; y: number };
  setPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  useRealCzi?: boolean;
  onProfileDataUpdate?: (data: LineProfilePoint[], totalLengthUm: number) => void;
  rois?: RoiItem[];
  onAddMeasurement?: (m: MeasurementRecord) => void;
}

export const Viewport: React.FC<ViewportProps> = ({
  channels,
  viewMode,
  activeTool,
  projectionMode = 'single',
  processingFilter = 'none',
  currentZ,
  totalZ,
  currentTime,
  metadata,
  zoom,
  setZoom,
  pan,
  setPan,
  useRealCzi = false,
  onProfileDataUpdate,
  rois = [],
  onAddMeasurement
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [pixelValues, setPixelValues] = useState<{ [chId: string]: number }>({});
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [realCziBuffers, setRealCziBuffers] = useState<{ [chId: string]: Uint8Array }>({});

  // Active interaction vectors
  const [measureLine, setMeasureLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [profileLine, setProfileLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [rectShape, setRectShape] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [circleShape, setCircleShape] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);

  const width = useRealCzi ? 512 : metadata.dimensionsXYZCT.width;
  const height = useRealCzi ? 512 : metadata.dimensionsXYZCT.height;
  const pixelSizeUm = metadata.voxelSizeUm.x; // e.g. 0.098 µm/px

  const generator = useMemo(() => new BiologicalImageGenerator(width, height), [width, height]);

  // Fetch real CZI planes from Python Zeiss server when useRealCzi is active
  useEffect(() => {
    if (!useRealCzi) return;

    const zIndex = currentZ % 5;
    const tIndex = currentTime % 3;

    channels.forEach((ch, idx) => {
      fetch(`http://localhost:8080/api/czi/plane?c=${idx}&z=${zIndex}&t=${tIndex}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.data_b64) {
            const binStr = atob(data.data_b64);
            const bytes = new Uint8Array(binStr.length);
            for (let i = 0; i < binStr.length; i++) {
              bytes[i] = binStr.charCodeAt(i);
            }
            setRealCziBuffers(prev => ({ ...prev, [ch.id]: bytes }));
          }
        })
        .catch(() => {});
    });
  }, [useRealCzi, currentZ, currentTime, channels]);

  // Pre-generate raw slice buffers for current Z & T
  const simBuffers = useMemo(() => {
    const buffers: { [chId: string]: Uint8Array } = {};
    channels.forEach(ch => {
      buffers[ch.id] = generator.generateChannelSlice(ch.id, currentZ, totalZ, currentTime);
    });
    return buffers;
  }, [generator, channels, currentZ, totalZ, currentTime]);

  // Compute 3D Maximum Intensity Projection (MIP) across all Z slices
  const mipBuffers = useMemo(() => {
    if (projectionMode !== 'mip') return null;
    const buffers: { [chId: string]: Uint8Array } = {};
    channels.forEach(ch => {
      const mip = new Uint8Array(width * height);
      for (let z = 0; z < totalZ; z++) {
        const slice = generator.generateChannelSlice(ch.id, z, totalZ, currentTime);
        for (let i = 0; i < slice.length; i++) {
          if (slice[i] > mip[i]) mip[i] = slice[i];
        }
      }
      buffers[ch.id] = mip;
    });
    return buffers;
  }, [projectionMode, generator, channels, totalZ, currentTime, width, height]);

  // Compute 3D Average Intensity Projection across all Z slices
  const avgBuffers = useMemo(() => {
    if (projectionMode !== 'average') return null;
    const buffers: { [chId: string]: Uint8Array } = {};
    channels.forEach(ch => {
      const accum = new Float32Array(width * height);
      for (let z = 0; z < totalZ; z++) {
        const slice = generator.generateChannelSlice(ch.id, z, totalZ, currentTime);
        for (let i = 0; i < slice.length; i++) {
          accum[i] += slice[i];
        }
      }
      const avg = new Uint8Array(width * height);
      for (let i = 0; i < avg.length; i++) {
        avg[i] = Math.round(accum[i] / totalZ);
      }
      buffers[ch.id] = avg;
    });
    return buffers;
  }, [projectionMode, generator, channels, totalZ, currentTime, width, height]);

  // Compute 3D Extended Depth of Field (EDOF / Focus Stacking - sdedof.dll)
  const edofBuffers = useMemo(() => {
    if (projectionMode !== 'edof') return null;
    const buffers: { [chId: string]: Uint8Array } = {};
    channels.forEach(ch => {
      const edof = new Uint8Array(width * height);
      const maxSharpness = new Float32Array(width * height);
      
      // Evaluate local high-frequency sharpness across all Z planes
      for (let z = 0; z < totalZ; z++) {
        const slice = generator.generateChannelSlice(ch.id, z, totalZ, currentTime);
        for (let y = 1; y < height - 1; y++) {
          for (let x = 1; x < width - 1; x++) {
            const i = y * width + x;
            // Local Tenengrad / Laplace sharpness gradient
            const grad = Math.abs(slice[i] * 4 - slice[i - 1] - slice[i + 1] - slice[i - width] - slice[i + width]);
            if (grad >= maxSharpness[i]) {
              maxSharpness[i] = grad;
              edof[i] = slice[i];
            }
          }
        }
      }
      buffers[ch.id] = edof;
    });
    return buffers;
  }, [projectionMode, generator, channels, totalZ, currentTime, width, height]);

  // Active raw buffers based on projection mode or real CZI engine
  const rawBuffers = useMemo(() => {
    if (projectionMode === 'mip' && mipBuffers) return mipBuffers;
    if (projectionMode === 'average' && avgBuffers) return avgBuffers;
    if (projectionMode === 'edof' && edofBuffers) return edofBuffers;
    if (useRealCzi && Object.keys(realCziBuffers).length > 0) return realCziBuffers;
    return simBuffers;
  }, [projectionMode, mipBuffers, avgBuffers, edofBuffers, useRealCzi, realCziBuffers, simBuffers]);

  // Main Canvas Compositing with spatial filters and range indicator
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    // Reset buffer to transparent black
    data.fill(0);

    // Composite visible channels additively
    channels.forEach(ch => {
      if (!ch.visible || ch.opacity <= 0) return;

      const raw = rawBuffers[ch.id];
      if (!raw) return;

      const lut = generateLutTable(ch.color, ch.minDisplay, ch.maxDisplay, ch.gamma);
      const opacity = ch.opacity;

      for (let i = 0; i < raw.length; i++) {
        const val = raw[i];
        const rgb = lut[val];
        const idx = i * 4;

        // Additive blending (screen/linear dodge)
        data[idx] = Math.min(255, data[idx] + rgb.r * opacity);
        data[idx + 1] = Math.min(255, data[idx + 1] + rgb.g * opacity);
        data[idx + 2] = Math.min(255, data[idx + 2] + rgb.b * opacity);
        data[idx + 3] = 255;
      }
    });

    // Apply Spatial Filters (Gaussian blur, Sobel edge, Unsharp mask, Range indicator)
    if (processingFilter === 'range_indicator') {
      // ZEISS Range Indicator: 0 DN is pure blue, 255 DN (clipping) is pure red
      for (let i = 0; i < width * height; i++) {
        const idx = i * 4;
        const maxVal = Math.max(data[idx], data[idx + 1], data[idx + 2]);
        if (maxVal === 0) {
          data[idx] = 0;
          data[idx + 1] = 50;
          data[idx + 2] = 255;
        } else if (maxVal >= 252) {
          data[idx] = 255;
          data[idx + 1] = 20;
          data[idx + 2] = 40;
        }
      }
    } else if (processingFilter === 'sobel') {
      const src = new Uint8ClampedArray(data);
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = (y * width + x) * 4;
          // Sobel operator on luminance
          const lum = (px: number, py: number) => {
            const pIdx = (py * width + px) * 4;
            return 0.299 * src[pIdx] + 0.587 * src[pIdx + 1] + 0.114 * src[pIdx + 2];
          };
          const gx =
            -lum(x - 1, y - 1) + lum(x + 1, y - 1) +
            -2 * lum(x - 1, y) + 2 * lum(x + 1, y) +
            -lum(x - 1, y + 1) + lum(x + 1, y + 1);
          const gy =
            -lum(x - 1, y - 1) - 2 * lum(x, y - 1) - lum(x + 1, y - 1) +
            lum(x - 1, y + 1) + 2 * lum(x, y + 1) + lum(x + 1, y + 1);
          const mag = Math.min(255, Math.hypot(gx, gy));
          data[idx] = mag * 0.4;
          data[idx + 1] = mag;
          data[idx + 2] = mag * 0.9;
        }
      }
    } else if (processingFilter === 'unsharp') {
      const src = new Uint8ClampedArray(data);
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = (y * width + x) * 4;
          for (let c = 0; c < 3; c++) {
            const blur = (
              src[((y - 1) * width + x) * 4 + c] +
              src[((y + 1) * width + x) * 4 + c] +
              src[(y * width + (x - 1)) * 4 + c] +
              src[(y * width + (x + 1)) * 4 + c]
            ) / 4;
            const sharp = src[idx + c] + (src[idx + c] - blur) * 1.5;
            data[idx + c] = Math.min(255, Math.max(0, sharp));
          }
        }
      }
    } else if (processingFilter === 'gaussian') {
      const src = new Uint8ClampedArray(data);
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = (y * width + x) * 4;
          for (let c = 0; c < 3; c++) {
            const blur = (
              src[((y - 1) * width + (x - 1)) * 4 + c] * 1 +
              src[((y - 1) * width + x) * 4 + c] * 2 +
              src[((y - 1) * width + (x + 1)) * 4 + c] * 1 +
              src[(y * width + (x - 1)) * 4 + c] * 2 +
              src[(y * width + x) * 4 + c] * 4 +
              src[(y * width + (x + 1)) * 4 + c] * 2 +
              src[((y + 1) * width + (x - 1)) * 4 + c] * 1 +
              src[((y + 1) * width + x) * 4 + c] * 2 +
              src[((y + 1) * width + (x + 1)) * 4 + c] * 1
            ) / 16;
            data[idx + c] = Math.min(255, blur);
          }
        }
      }
    } else if (processingFilter === 'richardson_lucy') {
      // 2D/3D Richardson-Lucy Deconvolution iteration simulation
      const src = new Uint8ClampedArray(data);
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = (y * width + x) * 4;
          for (let c = 0; c < 3; c++) {
            // Forward PSF projection (Airy disk Gaussian approximation)
            const psfBlur = (
              src[((y - 1) * width + x) * 4 + c] * 0.15 +
              src[((y + 1) * width + x) * 4 + c] * 0.15 +
              src[(y * width + (x - 1)) * 4 + c] * 0.15 +
              src[(y * width + (x + 1)) * 4 + c] * 0.15 +
              src[idx + c] * 0.4
            );
            // Multiplicative correction factor
            const ratio = psfBlur > 0.01 ? src[idx + c] / psfBlur : 1.0;
            const deconvolved = src[idx + c] * Math.pow(ratio, 1.4);
            data[idx + c] = Math.min(255, Math.max(0, deconvolved));
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }, [channels, rawBuffers, width, height, processingFilter]);

  // Sampling helper for line intensity profile
  const sampleProfileVector = (line: { x1: number; y1: number; x2: number; y2: number }) => {
    const distPx = Math.hypot(line.x2 - line.x1, line.y2 - line.y1);
    if (distPx < 3) return;

    const totalLengthUm = distPx * pixelSizeUm;
    const numPoints = Math.max(10, Math.min(300, Math.round(distPx)));
    const points: LineProfilePoint[] = [];

    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const px = Math.min(width - 1, Math.max(0, Math.round(line.x1 + t * (line.x2 - line.x1))));
      const py = Math.min(height - 1, Math.max(0, Math.round(line.y1 + t * (line.y2 - line.y1))));
      const pixelIdx = py * width + px;

      const intensities: { [chId: string]: number } = {};
      channels.forEach(ch => {
        intensities[ch.id] = rawBuffers[ch.id] ? rawBuffers[ch.id][pixelIdx] : 0;
      });

      points.push({
        distanceUm: t * totalLengthUm,
        intensities
      });
    }

    if (onProfileDataUpdate) {
      onProfileDataUpdate(points, totalLengthUm);
    }
  };

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      if (activeTool === 'pan' || e.shiftKey) {
        setIsDragging(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      } else {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const imgX = Math.round((e.clientX - rect.left) / zoom);
          const imgY = Math.round((e.clientY - rect.top) / zoom);

          if (activeTool === 'measure') {
            setMeasureLine({ x1: imgX, y1: imgY, x2: imgX, y2: imgY });
          } else if (activeTool === 'profile') {
            setProfileLine({ x1: imgX, y1: imgY, x2: imgX, y2: imgY });
          } else if (activeTool === 'rect_roi') {
            setRectShape({ x1: imgX, y1: imgY, x2: imgX, y2: imgY });
          } else if (activeTool === 'circle_roi') {
            setCircleShape({ x1: imgX, y1: imgY, x2: imgX, y2: imgY });
          }
        }
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
      return;
    }

    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const imgX = Math.round((e.clientX - rect.left) / zoom);
      const imgY = Math.round((e.clientY - rect.top) / zoom);

      if (imgX >= 0 && imgX < width && imgY >= 0 && imgY < height) {
        setCursorPos({ x: imgX, y: imgY });
        const pixelIdx = imgY * width + imgX;
        const vals: { [chId: string]: number } = {};
        channels.forEach(ch => {
          vals[ch.id] = rawBuffers[ch.id] ? rawBuffers[ch.id][pixelIdx] : 0;
        });
        setPixelValues(vals);
      } else {
        setCursorPos(null);
      }

      if (activeTool === 'measure' && measureLine) {
        setMeasureLine(prev => prev ? { ...prev, x2: imgX, y2: imgY } : null);
      } else if (activeTool === 'profile' && profileLine) {
        const updated = { ...profileLine, x2: imgX, y2: imgY };
        setProfileLine(updated);
        sampleProfileVector(updated);
      } else if (activeTool === 'rect_roi' && rectShape) {
        setRectShape(prev => prev ? { ...prev, x2: imgX, y2: imgY } : null);
      } else if (activeTool === 'circle_roi' && circleShape) {
        setCircleShape(prev => prev ? { ...prev, x2: imgX, y2: imgY } : null);
      }
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      return;
    }

    // Commit measurement line
    if (activeTool === 'measure' && measureLine) {
      const lengthUm = Math.hypot(measureLine.x2 - measureLine.x1, measureLine.y2 - measureLine.y1) * pixelSizeUm;
      if (lengthUm > 0.5 && onAddMeasurement) {
        onAddMeasurement({
          id: `meas-${Date.now()}`,
          type: 'line',
          label: `Line Caliper (${lengthUm.toFixed(1)} µm)`,
          lengthUm,
          meanIntensity: Math.round(Object.values(pixelValues).reduce((a, b) => a + b, 0) / (channels.length || 1)),
          timestamp: new Date().toLocaleTimeString()
        });
      }
    }

    // Commit profile vector
    if (activeTool === 'profile' && profileLine) {
      sampleProfileVector(profileLine);
    }

    // Commit rectangle ROI
    if (activeTool === 'rect_roi' && rectShape) {
      const wUm = Math.abs(rectShape.x2 - rectShape.x1) * pixelSizeUm;
      const hUm = Math.abs(rectShape.y2 - rectShape.y1) * pixelSizeUm;
      const areaUm2 = wUm * hUm;
      if (areaUm2 > 2 && onAddMeasurement) {
        onAddMeasurement({
          id: `rect-${Date.now()}`,
          type: 'rect',
          label: `Rect ROI (${wUm.toFixed(1)}×${hUm.toFixed(1)} µm)`,
          areaUm2,
          meanIntensity: Math.round(Object.values(pixelValues).reduce((a, b) => a + b, 0) / (channels.length || 1)),
          timestamp: new Date().toLocaleTimeString()
        });
      }
    }

    // Commit circle ROI
    if (activeTool === 'circle_roi' && circleShape) {
      const radiusUm = Math.hypot(circleShape.x2 - circleShape.x1, circleShape.y2 - circleShape.y1) * pixelSizeUm;
      const areaUm2 = Math.PI * radiusUm * radiusUm;
      if (areaUm2 > 2 && onAddMeasurement) {
        onAddMeasurement({
          id: `circ-${Date.now()}`,
          type: 'circle',
          label: `Circle ROI (r=${radiusUm.toFixed(1)} µm)`,
          areaUm2,
          meanIntensity: Math.round(Object.values(pixelValues).reduce((a, b) => a + b, 0) / (channels.length || 1)),
          timestamp: new Date().toLocaleTimeString()
        });
      }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(Math.max(0.2, Math.min(8.0, zoom * zoomDelta)));
  };

  // Physical Scale bar calculation (in micrometers)
  const scaleBarTargetPixels = 120; // nominal on-screen length in px
  const targetUm = (scaleBarTargetPixels / zoom) * pixelSizeUm;
  const roundedUm = targetUm > 50 ? 50 : targetUm > 20 ? 20 : targetUm > 10 ? 10 : 5;
  const scaleBarScreenPixels = (roundedUm / pixelSizeUm) * zoom;

  // Active measurement distance in µm
  const measuredDistanceUm = measureLine
    ? (Math.hypot(measureLine.x2 - measureLine.x1, measureLine.y2 - measureLine.y1) * pixelSizeUm).toFixed(2)
    : null;

  return (
    <div
      ref={containerRef}
      className="center-stage"
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      style={{
        cursor: isDragging ? 'grabbing' : activeTool === 'pan' ? 'grab' : activeTool === 'crosshair' ? 'crosshair' : 'default'
      }}
    >
      {/* Viewport Canvas Wrapper */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {viewMode === 'composite' && (
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.05s ease-out',
              boxShadow: '0 0 40px rgba(0, 0, 0, 0.9)',
              position: 'relative',
              lineHeight: 0
            }}
          >
            <canvas
              ref={canvasRef}
              style={{
                imageRendering: zoom > 2.0 ? 'pixelated' : 'auto',
                display: 'block',
                background: '#000000',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            />

            {/* Projection Mode Badge */}
            {projectionMode !== 'single' && (
              <div
                style={{
                  position: 'absolute',
                  top: 10,
                  left: 10,
                  background: 'rgba(56, 189, 248, 0.85)',
                  color: '#030712',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.05em',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                  pointerEvents: 'none'
                }}
              >
                {projectionMode === 'mip' ? 'MIP PROJECTION' : 'AVG PROJECTION'} (Z: 1-{totalZ})
              </div>
            )}

            {/* Crosshair Overlay */}
            {activeTool === 'crosshair' && cursorPos && (
              <>
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: cursorPos.x,
                    width: '1px',
                    background: 'rgba(56, 189, 248, 0.6)',
                    pointerEvents: 'none'
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: cursorPos.y,
                    height: '1px',
                    background: 'rgba(56, 189, 248, 0.6)',
                    pointerEvents: 'none'
                  }}
                />
              </>
            )}

            {/* Calibrated Geometric Overlays (SVG) */}
            <svg
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: width,
                height: height,
                pointerEvents: 'none'
              }}
            >
              {/* 1. Distance Caliper Line */}
              {measureLine && (
                <g>
                  <line
                    x1={measureLine.x1}
                    y1={measureLine.y1}
                    x2={measureLine.x2}
                    y2={measureLine.y2}
                    stroke="#facc15"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                  />
                  <circle cx={measureLine.x1} cy={measureLine.y1} r="3" fill="#facc15" />
                  <circle cx={measureLine.x2} cy={measureLine.y2} r="3" fill="#facc15" />
                  <text
                    x={(measureLine.x1 + measureLine.x2) / 2 + 6}
                    y={(measureLine.y1 + measureLine.y2) / 2 - 6}
                    fill="#facc15"
                    fontSize="11"
                    fontFamily="JetBrains Mono"
                    fontWeight="bold"
                  >
                    {measuredDistanceUm} µm
                  </text>
                </g>
              )}

              {/* 2. ScaledProfileMeasurer Vector */}
              {profileLine && (
                <g>
                  <line
                    x1={profileLine.x1}
                    y1={profileLine.y1}
                    x2={profileLine.x2}
                    y2={profileLine.y2}
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                  />
                  <circle cx={profileLine.x1} cy={profileLine.y1} r="4" fill="#38bdf8" />
                  <circle cx={profileLine.x2} cy={profileLine.y2} r="4" fill="#38bdf8" />
                  <text
                    x={(profileLine.x1 + profileLine.x2) / 2 + 6}
                    y={(profileLine.y1 + profileLine.y2) / 2 - 6}
                    fill="#38bdf8"
                    fontSize="11"
                    fontFamily="JetBrains Mono"
                    fontWeight="bold"
                  >
                    {(Math.hypot(profileLine.x2 - profileLine.x1, profileLine.y2 - profileLine.y1) * pixelSizeUm).toFixed(1)} µm
                  </text>
                </g>
              )}

              {/* 3. Rectangle ROI */}
              {rectShape && (
                <rect
                  x={Math.min(rectShape.x1, rectShape.x2)}
                  y={Math.min(rectShape.y1, rectShape.y2)}
                  width={Math.abs(rectShape.x2 - rectShape.x1)}
                  height={Math.abs(rectShape.y2 - rectShape.y1)}
                  fill="rgba(56, 189, 248, 0.15)"
                  stroke="#38bdf8"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                />
              )}

              {/* 4. Circle ROI */}
              {circleShape && (
                <circle
                  cx={circleShape.x1}
                  cy={circleShape.y1}
                  r={Math.hypot(circleShape.x2 - circleShape.x1, circleShape.y2 - circleShape.y1)}
                  fill="rgba(244, 114, 182, 0.15)"
                  stroke="#f472b6"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                />
              )}
            </svg>

            {/* Segmented Nuclei / Cell Counter Overlays */}
            {rois && rois.map(roi => (
              <div
                key={roi.id}
                style={{
                  position: 'absolute',
                  left: `${roi.x - roi.width / 2}px`,
                  top: `${roi.y - roi.height / 2}px`,
                  width: `${roi.width}px`,
                  height: `${roi.height}px`,
                  border: '2px dashed #4ade80',
                  borderRadius: '50%',
                  pointerEvents: 'none',
                  boxShadow: '0 0 10px rgba(74, 222, 128, 0.5)'
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '-18px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: '10px',
                    color: '#4ade80',
                    background: 'rgba(0, 0, 0, 0.85)',
                    padding: '1px 6px',
                    borderRadius: '3px',
                    whiteSpace: 'nowrap',
                    fontFamily: 'var(--font-mono)'
                  }}
                >
                  {roi.label} ({roi.areaUm2} µm²)
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Split Channels Mode (2x2 Grid) */}
        {viewMode === 'split' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              padding: '1rem',
              maxHeight: '90%',
              maxWidth: '90%'
            }}
          >
            {channels.map(ch => (
              <div
                key={ch.id}
                style={{
                  background: '#090d16',
                  borderRadius: '8px',
                  border: `1px solid ${ch.visible ? ch.color : 'rgba(255, 255, 255, 0.1)'}`,
                  overflow: 'hidden',
                  position: 'relative'
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-mono)',
                    color: ch.color,
                    background: 'rgba(0, 0, 0, 0.7)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 600,
                    zIndex: 10
                  }}
                >
                  {ch.name} ({ch.fluorophore})
                </div>
                <SplitChannelCanvas
                  channel={ch}
                  rawBuffer={rawBuffers[ch.id]}
                  width={width}
                  height={height}
                />
              </div>
            ))}
          </div>
        )}

        {/* 3D Orthogonal Projection View Mode */}
        {viewMode === 'ortho3d' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              alignItems: 'center',
              justifyContent: 'center',
              width: '85%',
              height: '85%'
            }}
          >
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ border: '1px solid var(--border-medium)', borderRadius: '8px', overflow: 'hidden' }}>
                <canvas ref={canvasRef} style={{ width: '420px', height: '420px', display: 'block' }} />
                <div style={{ background: '#090d16', padding: '4px 8px', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
                  XY Plane (Z = {currentZ + 1} / {totalZ})
                </div>
              </div>
              <div style={{ border: '1px solid var(--border-medium)', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ width: '160px', height: '420px', background: '#05070c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textAlign: 'center', padding: '12px' }}>
                    YZ Orthogonal<br />Depth Profile<br />
                    <span style={{ color: 'var(--accent-primary)', fontSize: '0.7rem' }}>Δz = {(metadata.voxelSizeUm.z * totalZ).toFixed(1)} µm</span>
                  </div>
                </div>
                <div style={{ background: '#090d16', padding: '4px 8px', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
                  YZ Side Profile
                </div>
              </div>
            </div>
            <div style={{ border: '1px solid var(--border-medium)', borderRadius: '8px', overflow: 'hidden', width: '420px' }}>
              <div style={{ height: '90px', background: '#05070c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  XZ Orthogonal Axial Slice
                </div>
              </div>
              <div style={{ background: '#090d16', padding: '4px 8px', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
                XZ Axial Profile
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Scientific Overlays */}

      {/* 1. Scale Bar Overlay (Bottom-Left) */}
      <div
        style={{
          position: 'absolute',
          bottom: 24,
          left: 24,
          background: 'rgba(11, 15, 23, 0.75)',
          backdropFilter: 'blur(10px)',
          padding: '6px 12px',
          borderRadius: '8px',
          border: '1px solid var(--border-subtle)',
          pointerEvents: 'none'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'center' }}>
          <div
            style={{
              width: `${Math.max(30, scaleBarScreenPixels)}px`,
              height: '3px',
              background: '#ffffff',
              boxShadow: '0 0 6px rgba(255, 255, 255, 0.8)'
            }}
          />
          <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: '#f8fafc', fontWeight: 600 }}>
            {roundedUm} µm
          </span>
        </div>
      </div>

      {/* 2. Pixel Inspector & Live Intensity Readout HUD (Bottom-Right) */}
      {cursorPos && (
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            right: 24,
            background: 'rgba(11, 15, 23, 0.85)',
            backdropFilter: 'blur(12px)',
            padding: '8px 14px',
            borderRadius: '10px',
            border: '1px solid var(--border-medium)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.74rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
            pointerEvents: 'none'
          }}
        >
          <div style={{ color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
            <span>X: {cursorPos.x} px</span>
            <span>Y: {cursorPos.y} px</span>
            <span>Zoom: {(zoom * 100).toFixed(0)}%</span>
          </div>
          <div style={{ width: '100%', height: '1px', background: 'var(--border-subtle)' }} />
          <div style={{ display: 'flex', gap: '12px' }}>
            {channels.map(ch => (
              <span key={ch.id} style={{ color: ch.color, fontWeight: 600 }}>
                {ch.name}: {pixelValues[ch.id] ?? 0} DN
              </span>
            ))}
          </div>
          {measuredDistanceUm && (
            <div style={{ color: '#facc15', marginTop: '2px', fontWeight: 600 }}>
              Length: {measuredDistanceUm} µm
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Mini canvas for split mode
const SplitChannelCanvas: React.FC<{
  channel: Channel;
  rawBuffer?: Uint8Array;
  width: number;
  height: number;
}> = ({ channel, rawBuffer, width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !rawBuffer) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;
    const lut = generateLutTable(channel.color, channel.minDisplay, channel.maxDisplay, channel.gamma);

    for (let i = 0; i < rawBuffer.length; i++) {
      const val = rawBuffer[i];
      const rgb = lut[val];
      const idx = i * 4;
      data[idx] = rgb.r;
      data[idx + 1] = rgb.g;
      data[idx + 2] = rgb.b;
      data[idx + 3] = 255;
    }

    ctx.putImageData(imgData, 0, 0);
  }, [channel, rawBuffer, width, height]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', display: 'block' }} />;
};
