import React, { useMemo } from 'react';
import { Channel } from '../../types/microscopy';

interface HistogramProps {
  channel: Channel;
  onMinChange: (val: number) => void;
  onMaxChange: (val: number) => void;
}

export const Histogram: React.FC<HistogramProps> = ({
  channel,
  onMinChange,
  onMaxChange
}) => {
  // Generate a realistic intensity distribution curve for the fluorophore
  const bins = useMemo(() => {
    const arr = new Array(64).fill(0);
    // Background noise peak around bin 2-6
    for (let i = 0; i < 8; i++) {
      arr[i] = Math.exp(-Math.pow(i - 3, 2) / 6) * 120;
    }
    // Biological signal distribution
    const signalCenter = 28;
    for (let i = 8; i < 64; i++) {
      const g = Math.exp(-Math.pow(i - signalCenter, 2) / 90) * 80;
      arr[i] = g + Math.random() * 8;
    }
    const maxVal = Math.max(...arr, 1);
    return arr.map(v => (v / maxVal) * 45); // Scale to fit 45px height
  }, [channel.id]);

  const minPct = (channel.minDisplay / 255) * 100;
  const maxPct = (channel.maxDisplay / 255) * 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
        <span>Min: {channel.minDisplay}</span>
        <span>Max: {channel.maxDisplay}</span>
      </div>

      <div
        style={{
          height: '48px',
          background: 'rgba(0, 0, 0, 0.4)',
          borderRadius: '6px',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'flex-end',
          padding: '0 2px',
          border: '1px solid var(--border-subtle)'
        }}
      >
        {/* Histogram Bins */}
        {bins.map((h, idx) => (
          <div
            key={idx}
            style={{
              flex: 1,
              height: `${h}px`,
              background: idx * 4 >= channel.minDisplay && idx * 4 <= channel.maxDisplay ? channel.color : 'rgba(255, 255, 255, 0.1)',
              opacity: idx * 4 >= channel.minDisplay && idx * 4 <= channel.maxDisplay ? 0.8 : 0.25,
              margin: '0 0.5px'
            }}
          />
        ))}

        {/* Min Marker Line */}
        <div
          style={{
            position: 'absolute',
            left: `${minPct}%`,
            top: 0,
            bottom: 0,
            width: '2px',
            background: '#ffffff',
            boxShadow: '0 0 6px #ffffff',
            pointerEvents: 'none'
          }}
        />

        {/* Max Marker Line */}
        <div
          style={{
            position: 'absolute',
            left: `${maxPct}%`,
            top: 0,
            bottom: 0,
            width: '2px',
            background: channel.color,
            boxShadow: `0 0 6px ${channel.color}`,
            pointerEvents: 'none'
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          className="hud-btn"
          style={{ flex: 1, height: '24px', fontSize: '0.7rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px' }}
          onClick={() => {
            onMinChange(10);
            onMaxChange(230);
          }}
        >
          Auto Contrast
        </button>
        <button
          className="hud-btn"
          style={{ flex: 1, height: '24px', fontSize: '0.7rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px' }}
          onClick={() => {
            onMinChange(0);
            onMaxChange(255);
          }}
        >
          Reset Range
        </button>
      </div>
    </div>
  );
};
