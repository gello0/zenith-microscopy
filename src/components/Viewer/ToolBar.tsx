import React from 'react';
import { ActiveTool } from '../../types/microscopy';
import { ZoomIn, ZoomOut, Move, Crosshair, Ruler, Maximize2, RotateCcw } from 'lucide-react';

interface ToolBarProps {
  activeTool: ActiveTool;
  setActiveTool: (tool: ActiveTool) => void;
  zoom: number;
  setZoom: (z: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
}

export const ToolBar: React.FC<ToolBarProps> = ({
  activeTool,
  setActiveTool,
  zoom,
  setZoom,
  setPan
}) => {
  const handleReset = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="viewport-hud">
      <button
        className={`hud-btn ${activeTool === 'pan' ? 'active' : ''}`}
        onClick={() => setActiveTool('pan')}
        title="Pan Tool (or Shift+Drag)"
      >
        <Move size={16} />
      </button>

      <button
        className={`hud-btn ${activeTool === 'crosshair' ? 'active' : ''}`}
        onClick={() => setActiveTool(activeTool === 'crosshair' ? 'pan' : 'crosshair')}
        title="Crosshair & Coordinates"
      >
        <Crosshair size={16} />
      </button>

      <button
        className={`hud-btn ${activeTool === 'measure' ? 'active' : ''}`}
        onClick={() => setActiveTool(activeTool === 'measure' ? 'pan' : 'measure')}
        title="Line Measurement (µm)"
      >
        <Ruler size={16} />
      </button>

      <div className="hud-divider" />

      <button
        className="hud-btn"
        onClick={() => setZoom(Math.min(8.0, zoom * 1.25))}
        title="Zoom In"
      >
        <ZoomIn size={16} />
      </button>

      <button
        className="hud-btn"
        onClick={() => setZoom(Math.max(0.2, zoom * 0.8))}
        title="Zoom Out"
      >
        <ZoomOut size={16} />
      </button>

      <button
        className="hud-btn"
        onClick={handleReset}
        title="Fit to Window (100%)"
        style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', width: 'auto', padding: '0 6px' }}
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
        <Maximize2 size={15} />
      </button>
    </div>
  );
};
