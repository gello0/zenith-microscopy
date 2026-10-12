import React from 'react';
import { ProjectionMode, ProcessingFilter } from '../../types/microscopy';
import { Wand2, Layers, Sliders, Eye, Sparkles, AlertTriangle } from 'lucide-react';

interface ProcessingPanelProps {
  projectionMode: ProjectionMode;
  setProjectionMode: (mode: ProjectionMode) => void;
  processingFilter: ProcessingFilter;
  setProcessingFilter: (filter: ProcessingFilter) => void;
}

export const ProcessingPanel: React.FC<ProcessingPanelProps> = ({
  projectionMode,
  setProjectionMode,
  processingFilter,
  setProcessingFilter
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 1. Z-Stack Projections */}
      <div>
        <div className="section-title">
          <Layers size={14} color="#38bdf8" />
          <span>3D Z-Stack Projections (ZEN Processing)</span>
        </div>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
          Compress 3D focal slices into a single high-contrast projection.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
          <button
            className={`action-btn ${projectionMode === 'single' ? 'primary' : 'secondary'}`}
            style={{ padding: '6px 2px', fontSize: '0.7rem', textAlign: 'center' }}
            onClick={() => setProjectionMode('single')}
          >
            Slice
          </button>
          <button
            className={`action-btn ${projectionMode === 'mip' ? 'primary' : 'secondary'}`}
            style={{ padding: '6px 2px', fontSize: '0.7rem', textAlign: 'center' }}
            onClick={() => setProjectionMode('mip')}
            title="Maximum Intensity Projection - Compresses all Z slices keeping brightest pixels"
          >
            MIP
          </button>
          <button
            className={`action-btn ${projectionMode === 'average' ? 'primary' : 'secondary'}`}
            style={{ padding: '6px 2px', fontSize: '0.7rem', textAlign: 'center' }}
            onClick={() => setProjectionMode('average')}
            title="Average Intensity Projection"
          >
            Avg
          </button>
          <button
            className={`action-btn ${projectionMode === 'edof' ? 'primary' : 'secondary'}`}
            style={{ padding: '6px 2px', fontSize: '0.7rem', textAlign: 'center' }}
            onClick={() => setProjectionMode('edof')}
            title="Extended Depth of Field (Focus Stacking - sdedof.dll)"
          >
            EDOF
          </button>
        </div>
      </div>

      {/* 2. Optical Parameters & PSF Setup (ZEISS IpFunctionData.xml) */}
      <div>
        <div className="section-title">
          <Sliders size={14} color="#22c55e" />
          <span>Optical Medium & PSF (IpFunctionData.xml)</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div>
            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Immersion Medium</label>
            <select
              style={{
                width: '100%',
                background: 'var(--zen-input-bg)',
                color: 'var(--zen-text)',
                border: '1px solid var(--zen-border)',
                padding: '4px 6px',
                fontSize: '0.72rem',
                borderRadius: '3px',
                marginTop: '2px'
              }}
              defaultValue="oil"
            >
              <option value="oil">Zeiss Immersol 518F (n = 1.518)</option>
              <option value="water">Water / Live-Cell (n = 1.333)</option>
              <option value="glycerol">Glycerol 85% (n = 1.450)</option>
              <option value="air">Air / Dry (n = 1.000)</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Coverslip Material</label>
            <select
              style={{
                width: '100%',
                background: 'var(--zen-input-bg)',
                color: 'var(--zen-text)',
                border: '1px solid var(--zen-border)',
                padding: '4px 6px',
                fontSize: '0.72rem',
                borderRadius: '3px',
                marginTop: '2px'
              }}
              defaultValue="type15"
            >
              <option value="type15">Borosilicate #1.5 (170 µm, n = 1.515)</option>
              <option value="type1">Type 1 (145 µm, n = 1.515)</option>
              <option value="cghi">Zeiss High-Index CGHI (n = 1.622)</option>
              <option value="sapphire">Sapphire (n = 1.757)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Spatial Filtering & Deconvolution */}
      <div>
        <div className="section-title">
          <Wand2 size={14} color="#a855f7" />
          <span>Restoration, Filters & Deconvolution</span>
        </div>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
          Real-time 2D/3D convolution kernels & GPU PSF deconvolution.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[
            { id: 'none', label: 'Raw Optical Plane (No Filter)', desc: 'Standard confocal diffraction-limited image' },
            { id: 'richardson_lucy', label: 'Richardson-Lucy 3D Deconvolution', desc: 'GPU iterative restoration via calculated Airy PSF' },
            { id: 'unsharp', label: 'Unsharp Mask (Sharpening)', desc: 'Enhances fine cytoskeletal filaments & edges' },
            { id: 'gaussian', label: 'Gaussian Blur (σ=1.2)', desc: 'Suppresses high-frequency detector shot noise' },
            { id: 'median', label: 'Median Despeckle (3×3)', desc: 'Eliminates salt-and-pepper detector noise' },
            { id: 'sobel', label: 'Sobel Gradient (Edge Detection)', desc: 'Calculates membrane gradient magnitude' },
            { id: 'range_indicator', label: 'Range Indicator (Over/Under)', desc: 'Blue = 0 DN (Clipping), Red = 255 DN (Saturation)' }
          ].map(f => (
            <div
              key={f.id}
              onClick={() => setProcessingFilter(f.id as ProcessingFilter)}
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                border: `1px solid ${processingFilter === f.id ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                background: processingFilter === f.id ? 'rgba(56, 189, 248, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 600, color: processingFilter === f.id ? '#38bdf8' : '#f8fafc' }}>
                  {f.label}
                </span>
                {f.id === 'range_indicator' && <AlertTriangle size={12} color="#f59e0b" />}
                {f.id === 'richardson_lucy' && <Sparkles size={12} color="#38bdf8" />}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {f.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
