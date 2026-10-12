import React from 'react';
import { ActiveTool } from '../../types/microscopy';
import {
  ZoomIn,
  ZoomOut,
  Move,
  Crosshair,
  Ruler,
  Maximize2,
  RotateCcw,
  TrendingUp,
  Sparkles,
  GitMerge,
  Download,
  Square,
  Circle,
  Table
} from 'lucide-react';

interface ToolBarProps {
  activeTool: ActiveTool;
  setActiveTool: (tool: ActiveTool) => void;
  zoom: number;
  setZoom: (z: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  onOpenCellCounter: () => void;
  onOpenColocalization: () => void;
  onExportSnapshot: () => void;
  onToggleMeasurementsTable: () => void;
  measurementsCount: number;
}

export const ToolBar: React.FC<ToolBarProps> = ({
  activeTool,
  setActiveTool,
  zoom,
  setZoom,
  setPan,
  onOpenCellCounter,
  onOpenColocalization,
  onExportSnapshot,
  onToggleMeasurementsTable,
  measurementsCount
}) => {
  const handleReset = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="viewport-hud">
      {/* Navigation Tools */}
      <button
        className={`hud-btn ${activeTool === 'pan' ? 'active' : ''}`}
        onClick={() => setActiveTool('pan')}
        title="Pan Viewport (or Shift+Drag)"
      >
        <Move size={15} />
      </button>

      <button
        className={`hud-btn ${activeTool === 'crosshair' ? 'active' : ''}`}
        onClick={() => setActiveTool(activeTool === 'crosshair' ? 'pan' : 'crosshair')}
        title="Interactive Crosshair & Pixel Coordinates"
      >
        <Crosshair size={15} />
      </button>

      <div className="hud-divider" />

      {/* Calibrated Geometric Measurement Tools */}
      <button
        className={`hud-btn ${activeTool === 'measure' ? 'active' : ''}`}
        onClick={() => setActiveTool(activeTool === 'measure' ? 'pan' : 'measure')}
        title="Calibrated Distance Caliper (µm)"
      >
        <Ruler size={15} />
      </button>

      <button
        className={`hud-btn ${activeTool === 'rect_roi' ? 'active' : ''}`}
        onClick={() => setActiveTool(activeTool === 'rect_roi' ? 'pan' : 'rect_roi')}
        title="Rectangle ROI Morphometry (Area µm²)"
      >
        <Square size={14} />
      </button>

      <button
        className={`hud-btn ${activeTool === 'circle_roi' ? 'active' : ''}`}
        onClick={() => setActiveTool(activeTool === 'circle_roi' ? 'pan' : 'circle_roi')}
        title="Circular ROI Morphometry (Area µm²)"
      >
        <Circle size={14} />
      </button>

      <button
        className={`hud-btn ${activeTool === 'profile' ? 'active' : ''}`}
        onClick={() => setActiveTool(activeTool === 'profile' ? 'pan' : 'profile')}
        title="Line Intensity Profile (ScaledProfileMeasurer)"
      >
        <TrendingUp size={15} color="#38bdf8" />
      </button>

      <div className="hud-divider" />

      {/* Advanced Scientific Analysis Tools */}
      <button
        className="hud-btn"
        onClick={onOpenCellCounter}
        title="Automated Segmentation & Cell Counter (Otsu/Triangle)"
      >
        <Sparkles size={15} color="#4ade80" />
      </button>

      <button
        className="hud-btn"
        onClick={onOpenColocalization}
        title="Colocalization Analysis (Pearson's r & Manders M1/M2)"
      >
        <GitMerge size={15} color="#c084fc" />
      </button>

      <button
        className="hud-btn"
        onClick={onToggleMeasurementsTable}
        title="Toggle Measurement & ROI Data Table"
        style={{ position: 'relative' }}
      >
        <Table size={15} color="#facc15" />
        {measurementsCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              background: '#facc15',
              color: '#000000',
              fontSize: '9px',
              fontWeight: 800,
              borderRadius: '50%',
              width: '12px',
              height: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1
            }}
          >
            {measurementsCount}
          </span>
        )}
      </button>

      <div className="hud-divider" />

      {/* Zoom & Fit */}
      <button
        className="hud-btn"
        onClick={() => setZoom(Math.min(8.0, zoom * 1.25))}
        title="Zoom In"
      >
        <ZoomIn size={15} />
      </button>

      <button
        className="hud-btn"
        onClick={() => setZoom(Math.max(0.2, zoom * 0.8))}
        title="Zoom Out"
      >
        <ZoomOut size={15} />
      </button>

      <button
        className="hud-btn"
        onClick={handleReset}
        title="Fit to Window (100%)"
        style={{ fontSize: '0.73rem', fontFamily: 'var(--font-mono)', width: 'auto', padding: '0 6px' }}
      >
        {(zoom * 100).toFixed(0)}%
      </button>

      <button
        className="hud-btn"
        onClick={handleReset}
        title="Reset Pan & Zoom"
      >
        <RotateCcw size={14} />
      </button>

      <div className="hud-divider" />

      {/* Export & Fullscreen */}
      <button
        className="hud-btn"
        onClick={onExportSnapshot}
        title="Export Publication-Ready Snapshot with Scale Bar"
      >
        <Download size={15} />
      </button>

      <button
        className="hud-btn"
        onClick={() => {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
          } else {
            document.exitFullscreen();
          }
        }}
        title="Toggle Fullscreen"
      >
        <Maximize2 size={14} />
      </button>
    </div>
  );
};
