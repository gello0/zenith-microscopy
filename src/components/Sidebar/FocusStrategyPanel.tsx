import React, { useState } from 'react';
import { Target, Activity, RefreshCw, CheckCircle, ShieldCheck } from 'lucide-react';

export const FocusStrategyPanel: React.FC = () => {
  const [definiteFocusActive, setDefiniteFocusActive] = useState(true);
  const [focusMode, setFocusMode] = useState<'continuous' | 'per_tile' | 'manual'>('per_tile');
  const [searchRangeUm, setSearchRangeUm] = useState(25);
  const [calibrationStatus, setCalibrationStatus] = useState<'locked' | 'searching' | 'idle'>('locked');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {/* 1. ZEISS Definite Focus Hardware Lock */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 10px',
          background: definiteFocusActive ? 'rgba(34, 197, 94, 0.08)' : 'rgba(255, 255, 255, 0.02)',
          border: `1px solid ${definiteFocusActive ? '#22c55e' : 'var(--zen-border-medium)'}`,
          borderRadius: '3px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={16} color={definiteFocusActive ? '#22c55e' : '#64748b'} />
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#f8fafc' }}>
              Definite Focus.3 (Hardware)
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--zen-text-muted)' }}>
              850 nm IR Coverslip Lock
            </div>
          </div>
        </div>
        <button
          className="zen-btn-mini"
          style={{
            background: definiteFocusActive ? '#22c55e' : 'var(--zen-bg-surface-elevated)',
            color: definiteFocusActive ? '#000000' : 'var(--zen-text-secondary)',
            fontWeight: 700
          }}
          onClick={() => setDefiniteFocusActive(!definiteFocusActive)}
        >
          {definiteFocusActive ? 'LOCKED' : 'OFF'}
        </button>
      </div>

      {/* 2. Focus Strategy Mode */}
      <div>
        <label style={{ fontSize: '0.7rem', color: 'var(--zen-text-muted)' }}>Autofocus Trigger Strategy</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', marginTop: '3px' }}>
          <button
            className={`action-btn ${focusMode === 'per_tile' ? 'primary' : 'secondary'}`}
            style={{ padding: '5px 2px', fontSize: '0.7rem', textAlign: 'center' }}
            onClick={() => setFocusMode('per_tile')}
          >
            Per Tile
          </button>
          <button
            className={`action-btn ${focusMode === 'continuous' ? 'primary' : 'secondary'}`}
            style={{ padding: '5px 2px', fontSize: '0.7rem', textAlign: 'center' }}
            onClick={() => setFocusMode('continuous')}
          >
            Continuous
          </button>
          <button
            className={`action-btn ${focusMode === 'manual' ? 'primary' : 'secondary'}`}
            style={{ padding: '5px 2px', fontSize: '0.7rem', textAlign: 'center' }}
            onClick={() => setFocusMode('manual')}
          >
            Manual
          </button>
        </div>
      </div>

      {/* 3. Search Range & Piezo Z Parameters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
          <span style={{ color: 'var(--zen-text-muted)' }}>Z Search Range:</span>
          <span style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>±{searchRangeUm} µm</span>
        </div>
        <input
          type="range"
          min={5}
          max={60}
          value={searchRangeUm}
          onChange={e => setSearchRangeUm(Number(e.target.value))}
          className="dimension-slider"
          style={{ height: '4px' }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginTop: '4px' }}>
          <span style={{ color: 'var(--zen-text-muted)' }}>Piezo Z Settling Time:</span>
          <span style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>12.5 ms</span>
        </div>
      </div>

      {/* 4. Focal Plane Reference Reset */}
      <div style={{ display: 'flex', gap: '6px' }}>
        <button
          className="hud-btn"
          style={{ flex: 1, height: '26px', fontSize: '0.72rem', borderRadius: '3px' }}
          onClick={() => {
            setCalibrationStatus('searching');
            setTimeout(() => setCalibrationStatus('locked'), 700);
          }}
        >
          <RefreshCw size={12} style={{ animation: calibrationStatus === 'searching' ? 'spin 1s linear infinite' : 'none' }} />
          <span>Find Interface</span>
        </button>
        <button
          className="hud-btn"
          style={{ flex: 1, height: '26px', fontSize: '0.72rem', borderRadius: '3px', color: '#38bdf8' }}
          onClick={() => alert('Current Z position registered as Reference Focus Plane.')}
        >
          <Target size={12} />
          <span>Set Z=0 Ref</span>
        </button>
      </div>
    </div>
  );
};
