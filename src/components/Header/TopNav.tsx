import React from 'react';
import { ViewMode } from '../../types/microscopy';
import { Layers, Grid, Box, Play, Camera, Disc, Eye, Activity, Database, CheckCircle2 } from 'lucide-react';

interface TopNavProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  datasetName: string;
  isAcquiring: boolean;
  setIsAcquiring: (val: boolean) => void;
  useRealCzi: boolean;
  setUseRealCzi: (val: boolean) => void;
  backendOnline: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  viewMode,
  setViewMode,
  datasetName,
  isAcquiring,
  setIsAcquiring,
  useRealCzi,
  setUseRealCzi,
  backendOnline
}) => {
  return (
    <header className="top-header">
      {/* Brand & Dataset Identity */}
      <div className="brand-section">
        <div className="brand-icon-wrapper">
          <Eye size={18} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="brand-title">ZENITH</span>
            <span className="brand-badge">BIO-IMAGING</span>
          </div>
        </div>
        <div style={{ width: '1px', height: '22px', background: 'var(--border-subtle)', margin: '0 8px' }} />

        {/* Dataset Switcher: Simulated vs Real Zeiss CZI Engine */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            value={useRealCzi ? 'real' : 'sim'}
            onChange={e => setUseRealCzi(e.target.value === 'real')}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border-medium)',
              color: 'var(--text-primary)',
              fontSize: '0.78rem',
              padding: '4px 10px',
              borderRadius: '6px',
              fontFamily: 'var(--font-mono)',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="sim" style={{ background: '#0b0f17' }}>HeLa_Mitosis_4Color_ZStack.czi (Simulation)</option>
            <option value="real" style={{ background: '#0b0f17' }}>test_sample_4ch_zstack.czi (Zeiss pylibCZIrw)</option>
          </select>

          {/* Backend Status Badge */}
          {backendOnline && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '2px 8px',
                borderRadius: '12px',
                background: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                fontSize: '0.68rem',
                color: '#22c55e',
                fontFamily: 'var(--font-mono)'
              }}
              title="Connected to Zeiss pylibCZIrw native engine on :8080"
            >
              <CheckCircle2 size={12} />
              <span>Zeiss CZI Engine Active</span>
            </div>
          )}
        </div>
      </div>

      {/* View Mode Selectors */}
      <div className="nav-actions">
        <div className="view-mode-pill">
          <button
            className={`mode-btn ${viewMode === 'composite' ? 'active' : ''}`}
            onClick={() => setViewMode('composite')}
            title="Composite Multi-Channel Overlay"
          >
            <Layers size={14} />
            Composite
          </button>
          <button
            className={`mode-btn ${viewMode === 'split' ? 'active' : ''}`}
            onClick={() => setViewMode('split')}
            title="Split Individual Channels"
          >
            <Grid size={14} />
            Split Channels
          </button>
          <button
            className={`mode-btn ${viewMode === 'ortho3d' ? 'active' : ''}`}
            onClick={() => setViewMode('ortho3d')}
            title="3D Orthogonal Projection (XY, XZ, YZ)"
          >
            <Box size={14} />
            3D Ortho
          </button>
        </div>

        {/* Experiment Acquisition Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px' }}>
          <button
            className="icon-btn"
            title="Snap Single Image"
            onClick={() => alert('Snapshot captured and saved to experiment buffer')}
          >
            <Camera size={16} />
          </button>
          <button
            className="icon-btn"
            title="Live Camera Stream"
            style={{ color: '#22c55e' }}
          >
            <Activity size={16} />
          </button>
          <button
            className="btn-primary"
            onClick={() => setIsAcquiring(!isAcquiring)}
            style={{
              background: isAcquiring ? 'linear-gradient(135deg, #e11d48, #be123c)' : undefined
            }}
          >
            {isAcquiring ? <Disc size={15} className="pulse" /> : <Play size={15} />}
            {isAcquiring ? 'Stop Acquisition' : 'Start Experiment'}
          </button>
        </div>
      </div>
    </header>
  );
};
