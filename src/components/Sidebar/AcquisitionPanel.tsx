import React, { useState } from 'react';
import { Layers, Clock, Sliders, CheckSquare, Square, Target, Cpu } from 'lucide-react';
import { DatasetMetadata } from '../../types/microscopy';

interface AcquisitionPanelProps {
  metadata: DatasetMetadata;
  onUpdateMetadata: (updates: Partial<DatasetMetadata>) => void;
}

export const AcquisitionPanel: React.FC<AcquisitionPanelProps> = ({
  metadata,
  onUpdateMetadata
}) => {
  const [enableZ, setEnableZ] = useState(true);
  const [enableTime, setEnableTime] = useState(true);
  const [enableTiles, setEnableTiles] = useState(false);

  const [zRange, setZRange] = useState({ first: -3.5, last: 3.5, step: 0.35 });
  const [timeParams, setTimeParams] = useState({ interval: 1.0, count: 20 });

  const calculatedSlices = Math.round((zRange.last - zRange.first) / zRange.step) + 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Experiment Workflow Mode */}
      <div>
        <div className="section-title">
          <span>Experiment Dimensions</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Z-Stack Toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 10px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer'
            }}
            onClick={() => setEnableZ(!enableZ)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 600 }}>
              {enableZ ? <CheckSquare size={15} color="#38bdf8" /> : <Square size={15} color="#64748b" />}
              <Layers size={14} color="#38bdf8" />
              <span>Z-Stack (3D Slicing)</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {enableZ ? `${calculatedSlices} Slices` : 'Off'}
            </span>
          </div>

          {/* Time Series Toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 10px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer'
            }}
            onClick={() => setEnableTime(!enableTime)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 600 }}>
              {enableTime ? <CheckSquare size={15} color="#f59e0b" /> : <Square size={15} color="#64748b" />}
              <Clock size={14} color="#f59e0b" />
              <span>Time-Series (Time Lapse)</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {enableTime ? `${timeParams.count} Frames` : 'Off'}
            </span>
          </div>

          {/* Tiles & Positions Toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 10px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer'
            }}
            onClick={() => setEnableTiles(!enableTiles)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 600 }}>
              {enableTiles ? <CheckSquare size={15} color="#a855f7" /> : <Square size={15} color="#64748b" />}
              <Target size={14} color="#a855f7" />
              <span>Tiles & Positions (XY Matrix)</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {enableTiles ? '2x2 Mosaic' : 'Single Tile'}
            </span>
          </div>
        </div>
      </div>

      {/* Z-Stack Parameters (if active) */}
      {enableZ && (
        <div style={{ background: 'rgba(56, 189, 248, 0.04)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '8px', padding: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#38bdf8' }}>Z-Stack Configuration</span>
            <span style={{ fontSize: '0.68rem', color: '#22c55e', fontFamily: 'var(--font-mono)' }}>Nyquist Match</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>First (µm)</span>
              <input
                type="number"
                value={zRange.first}
                onChange={e => setZRange({ ...zRange, first: parseFloat(e.target.value) || 0 })}
                style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.75rem', padding: '4px', borderRadius: '4px' }}
              />
            </div>
            <div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Last (µm)</span>
              <input
                type="number"
                value={zRange.last}
                onChange={e => setZRange({ ...zRange, last: parseFloat(e.target.value) || 0 })}
                style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.75rem', padding: '4px', borderRadius: '4px' }}
              />
            </div>
            <div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Δz Step (µm)</span>
              <input
                type="number"
                step="0.05"
                value={zRange.step}
                onChange={e => setZRange({ ...zRange, step: parseFloat(e.target.value) || 0.1 })}
                style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.75rem', padding: '4px', borderRadius: '4px' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Microscope Optics & Hardware Settings */}
      <div>
        <div className="section-title">
          <span>Optics & Hardware</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Objective Lens</span>
            <select
              value={metadata.objective}
              onChange={e => onUpdateMetadata({ objective: e.target.value })}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: '0.76rem',
                padding: '6px 8px',
                borderRadius: '6px',
                marginTop: '4px'
              }}
            >
              <option value="Plan-Apochromat 63x/1.40 Oil DIC M27" style={{ background: '#0b0f17' }}>Plan-Apochromat 63x / 1.40 Oil DIC</option>
              <option value="C-Apochromat 40x/1.20 W Korr M27" style={{ background: '#0b0f17' }}>C-Apochromat 40x / 1.20 Water</option>
              <option value="Plan-Apochromat 20x/0.80 M27" style={{ background: '#0b0f17' }}>Plan-Apochromat 20x / 0.80 Air</option>
            </select>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Detector Camera</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', padding: '6px 8px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <Cpu size={14} color="#38bdf8" />
              <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>{metadata.detector}</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '4px' }}>
            <div style={{ padding: '6px 8px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Pixel Binning</span>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f8fafc' }}>1x1 (High Res)</div>
            </div>
            <div style={{ padding: '6px 8px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Dynamic Range</span>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f8fafc' }}>{metadata.bitDepth}-bit (65536 DN)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
