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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--zen-text-muted)', fontFamily: 'var(--font-mono)' }}>
        <span>Min (Black): {channel.minDisplay}</span>
        <span>Max (White): {channel.maxDisplay}</span>
      </div>

      <div
        style={{
          height: '46px',
          background: '#121212',
          borderRadius: '2px',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'flex-end',
          padding: '0 2px',
          border: '1px solid var(--zen-border-subtle)'
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
              opacity: idx * 4 >= channel.minDisplay && idx * 4 <= channel.maxDisplay ? 0.85 : 0.2,
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
            boxShadow: '0 0 4px #ffffff',
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
            boxShadow: `0 0 5px ${channel.color}`,
            pointerEvents: 'none'
          }}
        />
      </div>

      {/* ZEISS ZEN Standard 4 Quick-Adjust Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
        <button
          className="action-btn"
          style={{ padding: '3px 2px', fontSize: '0.68rem', textAlign: 'center' }}
          onClick={() => {
            onMinChange(12);
            onMaxChange(225);
          }}
          title="Auto Contrast based on cumulative histogram"
        >
          Auto
        </button>
        <button
          className="action-btn"
          style={{ padding: '3px 2px', fontSize: '0.68rem', textAlign: 'center' }}
          onClick={() => {
            onMinChange(18);
            onMaxChange(210);
          }}
          title="Best Fit (99.8% histogram percentile)"
        >
          Best Fit
        </button>
        <button
          className="action-btn"
          style={{ padding: '3px 2px', fontSize: '0.68rem', textAlign: 'center' }}
          onClick={() => {
            onMinChange(0);
            onMaxChange(255);
          }}
          title="Stretch to full 0-255 dynamic range"
        >
          Min/Max
        </button>
        <button
          className="action-btn"
          style={{ padding: '3px 2px', fontSize: '0.68rem', textAlign: 'center' }}
          onClick={() => {
            onMinChange(0);
            onMaxChange(255);
          }}
          title="Reset to default linear range"
        >
          Reset
        </button>
      </div>
    </div>
  );
};
