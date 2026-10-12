import React, { useState } from 'react';
import { Channel, LineProfilePoint } from '../../types/microscopy';
import { X, TrendingUp, Download, Eye } from 'lucide-react';

interface LineProfileDockProps {
  data: LineProfilePoint[];
  channels: Channel[];
  onClose: () => void;
  totalLengthUm: number;
  bottomOffset?: number;
}

export const LineProfileDock: React.FC<LineProfileDockProps> = ({
  data,
  channels,
  onClose,
  totalLengthUm,
  bottomOffset = 80
}) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (data.length === 0) return null;

  const width = 600;
  const height = 150;
  const padding = { top: 15, right: 20, bottom: 25, left: 40 };

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Max intensity is 255
  const maxIntensity = 255;

  // Generate SVG path for a channel
  const getPathForChannel = (chId: string) => {
    return data
      .map((p, idx) => {
        const x = padding.left + (idx / (data.length - 1)) * plotWidth;
        const val = p.intensities[chId] || 0;
        const y = padding.top + plotHeight - (val / maxIntensity) * plotHeight;
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const handleExportCSV = () => {
    let csv = `Distance_um,${channels.map(c => c.name).join(',')}\n`;
    data.forEach(p => {
      csv += `${p.distanceUm.toFixed(2)},${channels.map(c => p.intensities[c.id] || 0).join(',')}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'zenith_line_profile.csv';
    a.click();
  };

  const hoveredPoint = hoverIdx !== null ? data[hoverIdx] : null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: bottomOffset,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(11, 15, 23, 0.94)',
        backdropFilter: 'blur(16px)',
        border: '1px solid var(--border-medium)',
        borderRadius: '12px',
        padding: '12px 16px',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.75)',
        zIndex: 50,
        width: `${width + 40}px`
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={16} color="#38bdf8" />
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f8fafc' }}>
            Line Intensity Profile (ScaledProfileMeasurer)
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Length: {totalLengthUm.toFixed(2)} µm
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="hud-btn"
            style={{ width: 'auto', padding: '2px 8px', height: '24px', fontSize: '0.7rem' }}
            onClick={handleExportCSV}
            title="Export Profile as CSV"
          >
            <Download size={13} style={{ marginRight: '4px' }} />
            CSV
          </button>
          <button
            className="hud-btn"
            style={{ width: '24px', height: '24px' }}
            onClick={onClose}
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* SVG Chart */}
      <div style={{ position: 'relative' }}>
        <svg
          width={width}
          height={height}
          style={{ overflow: 'visible', display: 'block' }}
          onMouseMove={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = e.clientX - rect.left - padding.left;
            if (relX >= 0 && relX <= plotWidth) {
              const idx = Math.min(data.length - 1, Math.max(0, Math.round((relX / plotWidth) * (data.length - 1))));
              setHoverIdx(idx);
            }
          }}
          onMouseLeave={() => setHoverIdx(null)}
        >
          {/* Y-Axis Grid Lines */}
          {[0, 64, 128, 192, 255].map(val => {
            const y = padding.top + plotHeight - (val / maxIntensity) * plotHeight;
            return (
              <g key={val}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + plotWidth}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeDasharray="2 2"
                />
                <text
                  x={padding.left - 6}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="9"
                  fill="#64748b"
                  fontFamily="JetBrains Mono"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* X-Axis labels */}
          <line
            x1={padding.left}
            y1={padding.top + plotHeight}
            x2={padding.left + plotWidth}
            y2={padding.top + plotHeight}
            stroke="rgba(255, 255, 255, 0.2)"
          />
          <text
            x={padding.left}
            y={height - 5}
            fontSize="9"
            fill="#64748b"
            fontFamily="JetBrains Mono"
          >
            0 µm
          </text>
          <text
            x={padding.left + plotWidth}
            y={height - 5}
            textAnchor="end"
            fontSize="9"
            fill="#64748b"
            fontFamily="JetBrains Mono"
          >
            {totalLengthUm.toFixed(1)} µm
          </text>

          {/* Channel Curves */}
          {channels.map(ch => {
            if (!ch.visible) return null;
            return (
              <path
                key={ch.id}
                d={getPathForChannel(ch.id)}
                fill="none"
                stroke={ch.color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.9}
              />
            );
          })}

          {/* Hover Crosshair */}
          {hoverIdx !== null && (
            <line
              x1={padding.left + (hoverIdx / (data.length - 1)) * plotWidth}
              y1={padding.top}
              x2={padding.left + (hoverIdx / (data.length - 1)) * plotWidth}
              y2={padding.top + plotHeight}
              stroke="#f8fafc"
              strokeDasharray="3 3"
              strokeWidth="1.5"
            />
          )}
        </svg>

        {/* Hovered Values Tooltip */}
        {hoveredPoint && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 10,
              background: 'rgba(0, 0, 0, 0.85)',
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.68rem',
              display: 'flex',
              gap: '10px'
            }}
          >
            <span style={{ color: '#f8fafc' }}>{hoveredPoint.distanceUm.toFixed(2)} µm:</span>
            {channels.filter(c => c.visible).map(ch => (
              <span key={ch.id} style={{ color: ch.color, fontWeight: 600 }}>
                {ch.name}: {hoveredPoint.intensities[ch.id] ?? 0}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '14px', marginTop: '8px', justifyContent: 'center' }}>
        {channels.filter(c => c.visible).map(ch => (
          <div key={ch.id} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: ch.color }} />
            <span>{ch.name} ({ch.fluorophore})</span>
          </div>
        ))}
      </div>
    </div>
  );
};
