import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Channel, ViewMode, ActiveTool, DatasetMetadata } from '../../types/microscopy';
import { generateLutTable } from '../../services/lutEngine';
import { BiologicalImageGenerator } from '../../services/sampleData';

interface ViewportProps {
  channels: Channel[];
  viewMode: ViewMode;
  activeTool: ActiveTool;
  currentZ: number;
  totalZ: number;
  currentTime: number;
  metadata: DatasetMetadata;
  zoom: number;
  setZoom: (z: number) => void;
  pan: { x: number; y: number };
  setPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
}

export const Viewport: React.FC<ViewportProps> = ({
  channels,
  viewMode,
  activeTool,
  currentZ,
  totalZ,
  currentTime,
  metadata,
  zoom,
  setZoom,
  pan,
  setPan
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [pixelValues, setPixelValues] = useState<{ [chId: string]: number }>({});
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Measurement line tool state
  const [measureLine, setMeasureLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);

  const width = metadata.dimensionsXYZCT.width;
  const height = metadata.dimensionsXYZCT.height;

  const generator = useMemo(() => new BiologicalImageGenerator(width, height), [width, height]);

  // Pre-generate raw slice buffers for current Z & T
  const rawBuffers = useMemo(() => {
    const buffers: { [chId: string]: Uint8Array } = {};
    channels.forEach(ch => {
      buffers[ch.id] = generator.generateChannelSlice(ch.id, currentZ, totalZ, currentTime);
    });
    return buffers;
  }, [generator, channels, currentZ, totalZ, currentTime]);

  // Main Canvas Compositing
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

    ctx.putImageData(imgData, 0, 0);
  }, [channels, rawBuffers, width, height]);

  // Mouse Handlers for Pan, Zoom, and Pixel Inspector
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      if (activeTool === 'pan' || e.shiftKey) {
        setIsDragging(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      } else if (activeTool === 'measure') {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const imgX = Math.round((e.clientX - rect.left) / zoom);
          const imgY = Math.round((e.clientY - rect.top) / zoom);
          setMeasureLine({ x1: imgX, y1: imgY, x2: imgX, y2: imgY });
        }
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
      return;
    }

    if (activeTool === 'measure' && measureLine) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const imgX = Math.round((e.clientX - rect.left) / zoom);
        const imgY = Math.round((e.clientY - rect.top) / zoom);
        setMeasureLine(prev => prev ? { ...prev, x2: imgX, y2: imgY } : null);
      }
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
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(Math.max(0.2, Math.min(8.0, zoom * zoomDelta)));
  };

  // Physical Scale bar calculation (in micrometers)
  const pixelSizeUm = metadata.voxelSizeUm.x; // e.g. 0.098 µm/pixel
  const scaleBarTargetPixels = 120; // nominal on-screen length in px
  const targetUm = (scaleBarTargetPixels / zoom) * pixelSizeUm;
  // Round to nice round number (e.g. 10, 20, 50, 100 µm)
  const roundedUm = targetUm > 50 ? 50 : targetUm > 20 ? 20 : targetUm > 10 ? 10 : 5;
  const scaleBarScreenPixels = (roundedUm / pixelSizeUm) * zoom;

  // Measurement distance calculation
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

            {/* Measurement Line Overlay */}
            {measureLine && (
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
              </svg>
            )}
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
