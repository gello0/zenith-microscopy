import React, { useState } from 'react';
import { TileConfig } from '../../types/microscopy';
import { Grid, Move, Play, RefreshCw, Compass } from 'lucide-react';

interface TilesPanelProps {
  stageX: number;
  stageY: number;
}

export const TilesPanel: React.FC<TilesPanelProps> = ({ stageX, stageY }) => {
  const [cols, setCols] = useState(3);
  const [rows, setRows] = useState(3);
  const [overlap, setOverlap] = useState(10);
  const [pattern, setPattern] = useState<'snake' | 'comb'>('snake');

  const tileWidthMm = 0.85; // based on 63x field of view
  const tileHeightMm = 0.85;
  const effectiveW = tileWidthMm * (1 - overlap / 100);
  const effectiveH = tileHeightMm * (1 - overlap / 100);

  const totalAreaWidthMm = (cols * effectiveW).toFixed(2);
  const totalAreaHeightMm = (rows * effectiveH).toFixed(2);
  const totalTiles = cols * rows;
  const estimatedTimeSec = totalTiles * 1.8; // ~1.8s per tile (4 channels + motion)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="section-title">
        <span>Tile Region & Mosaic Scanning (ZEN Tiles)</span>
      </div>

      {/* 2D Mosaic Stage Preview Grid */}
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.4)',
          borderRadius: '8px',
          border: '1px solid var(--border-medium)',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          Mosaic Footprint: {totalAreaWidthMm} × {totalAreaHeightMm} mm
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: '4px',
            width: '180px',
            height: '180px',
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '8px',
            borderRadius: '6px',
            border: '1px solid rgba(56, 189, 248, 0.2)'
          }}
        >
          {Array.from({ length: totalTiles }).map((_, idx) => (
            <div
              key={idx}
              style={{
                background: idx === 0 ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${idx === 0 ? '#38bdf8' : 'rgba(255, 255, 255, 0.1)'}`,
                borderRadius: '3px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.62rem',
                fontFamily: 'var(--font-mono)',
                color: idx === 0 ? '#fff' : 'var(--text-muted)',
                fontWeight: 600
              }}
            >
              {idx + 1}
            </div>
          ))}
        </div>

        <div style={{ fontSize: '0.68rem', color: '#22c55e', fontFamily: 'var(--font-mono)' }}>
          Snake-by-row trajectory ({overlap}% overlap)
        </div>
      </div>

      {/* Grid Configuration */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
        <div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Columns (X)</span>
          <input
            type="number"
            min="1"
            max="12"
            value={cols}
            onChange={e => setCols(Math.max(1, parseInt(e.target.value, 10) || 1))}
            style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.76rem', padding: '6px', borderRadius: '4px', marginTop: '4px' }}
          />
        </div>
        <div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Rows (Y)</span>
          <input
            type="number"
            min="1"
            max="12"
            value={rows}
            onChange={e => setRows(Math.max(1, parseInt(e.target.value, 10) || 1))}
            style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.76rem', padding: '6px', borderRadius: '4px', marginTop: '4px' }}
          />
        </div>
      </div>

      {/* Overlap & Stitching Slider */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
          <span>Tile Overlap (for Stitching)</span>
          <span style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>{overlap}%</span>
        </div>
        <input
          type="range"
          min="5"
          max="25"
          value={overlap}
          onChange={e => setOverlap(parseInt(e.target.value, 10))}
          className="dimension-slider"
          style={{ height: '4px', marginTop: '6px' }}
        />
      </div>

      {/* Live Stage Position Coordinates */}
      <div style={{ padding: '8px 10px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
          <Compass size={13} color="#f59e0b" />
          <span>Motorized Stage Position (MTB HAL)</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', marginTop: '4px', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
          <div>X: <span style={{ color: '#f8fafc' }}>{stageX.toFixed(1)}</span> µm</div>
          <div>Y: <span style={{ color: '#f8fafc' }}>{stageY.toFixed(1)}</span> µm</div>
          <div>Z: <span style={{ color: '#f8fafc' }}>452.0</span> µm</div>
        </div>
      </div>

      {/* Execution stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
        <span>Total Tiles: {totalTiles}</span>
        <span>Est. Time: {estimatedTimeSec.toFixed(0)}s</span>
      </div>
    </div>
  );
};
