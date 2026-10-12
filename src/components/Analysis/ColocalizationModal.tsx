import React, { useState, useEffect, useRef } from 'react';
import { Channel } from '../../types/microscopy';
import { X, GitMerge, RefreshCw, Info } from 'lucide-react';

interface ColocalizationModalProps {
  channels: Channel[];
  onClose: () => void;
}

export const ColocalizationModal: React.FC<ColocalizationModalProps> = ({
  channels,
  onClose
}) => {
  const [ch1Id, setCh1Id] = useState<string>(channels[1]?.id || channels[0]?.id || '');
  const [ch2Id, setCh2Id] = useState<string>(channels[2]?.id || channels[1]?.id || '');
  const [th1, setTh1] = useState<number>(45);
  const [th2, setTh2] = useState<number>(40);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const ch1 = channels.find(c => c.id === ch1Id);
  const ch2 = channels.find(c => c.id === ch2Id);

  // Simulated scattergram generation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 256;
    canvas.width = size;
    canvas.height = size;

    ctx.fillStyle = '#06090e';
    ctx.fillRect(0, 0, size, size);

    // Draw background grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    [64, 128, 192].forEach(v => {
      ctx.beginPath();
      ctx.moveTo(v, 0);
      ctx.lineTo(v, size);
      ctx.moveTo(0, size - v);
      ctx.lineTo(size, size - v);
      ctx.stroke();
    });

    // Draw scatter points
    ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
    for (let i = 0; i < 2400; i++) {
      const base = Math.random() * 200;
      // Correlated points along diagonal + random biological variation
      const x = Math.min(255, Math.max(0, base + (Math.random() - 0.5) * 60));
      const y = Math.min(255, Math.max(0, base * 0.85 + (Math.random() - 0.5) * 70));
      ctx.fillRect(x, size - y, 2, 2);
    }

    // Draw threshold boundary lines
    ctx.strokeStyle = '#facc15';
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    // Ch1 vertical threshold
    ctx.moveTo(th1, 0);
    ctx.lineTo(th1, size);
    // Ch2 horizontal threshold
    ctx.moveTo(0, size - th2);
    ctx.lineTo(size, size - th2);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [ch1Id, ch2Id, th1, th2]);

  // Pearson's correlation r (simulated based on thresholds)
  const pearsonR = (0.78 - (th1 + th2) * 0.0005).toFixed(3);
  const mandersM1 = (0.84 - th1 * 0.001).toFixed(2);
  const mandersM2 = (0.76 - th2 * 0.001).toFixed(2);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100
      }}
    >
      <div
        style={{
          width: '580px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-medium)',
          borderRadius: '14px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GitMerge size={18} color="#a855f7" />
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc' }}>
              Colocalization & Pearson Correlation
            </h3>
          </div>
          <button className="hud-btn" style={{ width: '28px', height: '28px' }} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.25rem', display: 'flex', gap: '1.25rem' }}>
          {/* Left: 2D Scattergram Canvas */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <div style={{ position: 'relative', border: '1px solid var(--border-medium)', borderRadius: '6px', overflow: 'hidden' }}>
              <canvas ref={canvasRef} style={{ width: '256px', height: '256px', display: 'block' }} />
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              2D Intensity Scattergram (256 × 256 DN)
            </div>
          </div>

          {/* Right: Channel Selectors & Metrics */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Channel 1 (X-Axis)</span>
              <select
                value={ch1Id}
                onChange={e => setCh1Id(e.target.value)}
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.76rem', padding: '6px', borderRadius: '4px', marginTop: '4px' }}
              >
                {channels.map(c => (
                  <option key={c.id} value={c.id} style={{ background: '#0b0f17' }}>{c.name} ({c.fluorophore})</option>
                ))}
              </select>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Channel 2 (Y-Axis)</span>
              <select
                value={ch2Id}
                onChange={e => setCh2Id(e.target.value)}
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.76rem', padding: '6px', borderRadius: '4px', marginTop: '4px' }}
              >
                {channels.map(c => (
                  <option key={c.id} value={c.id} style={{ background: '#0b0f17' }}>{c.name} ({c.fluorophore})</option>
                ))}
              </select>
            </div>

            {/* Threshold Sliders */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                <span>Ch1 Cutoff: {th1} DN</span>
                <span>Ch2 Cutoff: {th2} DN</span>
              </div>
              <input
                type="range"
                min="10"
                max="120"
                value={th1}
                onChange={e => setTh1(parseInt(e.target.value, 10))}
                className="dimension-slider"
                style={{ height: '4px', marginTop: '4px' }}
              />
            </div>

            {/* Statistical Coefficients */}
            <div style={{ background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '8px', padding: '10px' }}>
              <div style={{ fontSize: '0.72rem', color: '#c084fc', fontWeight: 600, marginBottom: '6px' }}>
                Colocalization Coefficients
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Pearson's Correlation (r):</span>
                  <span style={{ color: '#f8fafc', fontWeight: 700 }}>{pearsonR}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Manders' M1 (overlap):</span>
                  <span style={{ color: '#f8fafc' }}>{mandersM1}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Manders' M2 (overlap):</span>
                  <span style={{ color: '#f8fafc' }}>{mandersM2}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
