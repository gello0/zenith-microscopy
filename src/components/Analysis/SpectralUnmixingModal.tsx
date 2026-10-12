import React, { useState, useEffect, useRef } from 'react';
import { Layers, Sliders, X, Check, RefreshCw, Zap, AlertCircle } from 'lucide-react';
import { Channel } from '../../types/microscopy';

interface SpectralUnmixingModalProps {
  isOpen: boolean;
  onClose: () => void;
  channels: Channel[];
  onApplyUnmixing: (matrix: number[][]) => void;
}

export const SpectralUnmixingModal: React.FC<SpectralUnmixingModalProps> = ({
  isOpen,
  onClose,
  channels,
  onApplyUnmixing
}) => {
  // Crosstalk percentage matrix: row = emitter dye, col = detector channel
  // Default: Diagonal is 100%, adjacent channels have 12-25% bleedthrough
  const [matrix, setMatrix] = useState<number[][]>(() => {
    const n = channels.length;
    const m: number[][] = [];
    for (let i = 0; i < n; i++) {
      m[i] = [];
      for (let j = 0; j < n; j++) {
        if (i === j) m[i][j] = 100;
        else if (Math.abs(i - j) === 1) m[i][j] = 18; // 18% bleedthrough to neighbor
        else m[i][j] = 2;
      }
    }
    return m;
  });

  const [isComputing, setIsComputing] = useState(false);
  const spectrumCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Render spectral emission curves
  useEffect(() => {
    if (!isOpen) return;
    const canvas = spectrumCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.fillStyle = '#141416';
    ctx.fillRect(0, 0, width, height);

    // Draw wavelength grid (400 nm to 750 nm)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let nm = 400; nm <= 750; nm += 50) {
      const x = ((nm - 400) / 350) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height - 18);
      ctx.stroke();

      ctx.font = '9px Segoe UI, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillText(`${nm}`, x - 8, height - 5);
    }

    // Draw Gaussian emission curve for each channel
    channels.forEach((ch, idx) => {
      const peakNm = ch.wavelengthEm || (450 + idx * 70);
      const sigma = 28; // Emission spectral FWHM width

      ctx.beginPath();
      ctx.strokeStyle = ch.color;
      ctx.fillStyle = `${ch.color}22`;
      ctx.lineWidth = 2;

      let started = false;
      for (let nm = 400; nm <= 750; nm += 2) {
        const x = ((nm - 400) / 350) * width;
        const gaussian = Math.exp(-Math.pow(nm - peakNm, 2) / (2 * sigma * sigma));
        const y = (height - 25) - gaussian * (height - 45);

        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.lineTo(width, height - 25);
      ctx.lineTo(0, height - 25);
      ctx.closePath();
      ctx.fill();

      // Channel label
      const peakX = ((peakNm - 400) / 350) * width;
      ctx.fillStyle = ch.color;
      ctx.font = 'bold 10px Segoe UI, sans-serif';
      ctx.fillText(ch.name, Math.max(10, Math.min(width - 50, peakX - 15)), 20 + idx * 14);
    });
  }, [isOpen, channels]);

  if (!isOpen) return null;

  const updateMatrixVal = (row: number, col: number, val: number) => {
    setMatrix(prev => {
      const next = prev.map(r => [...r]);
      next[row][col] = Math.max(0, Math.min(100, val));
      return next;
    });
  };

  const handleApply = () => {
    setIsComputing(true);
    setTimeout(() => {
      setIsComputing(false);
      onApplyUnmixing(matrix);
      onClose();
    }, 600);
  };

  return (
    <div className="modal-backdrop">
      <div
        className="modal-window"
        style={{
          width: '680px',
          maxWidth: '95vw',
          background: 'var(--zen-bg-main)',
          border: '1px solid var(--zen-blue)',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.8)',
          borderRadius: '4px'
        }}
      >
        {/* Header */}
        <div
          className="modal-header"
          style={{
            background: 'var(--zen-bg-surface)',
            borderBottom: '1px solid var(--zen-border-medium)',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={16} color="var(--zen-blue)" />
            <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              ZEISS Spectral Linear Unmixing & Bleedthrough Correction
            </span>
          </div>
          <button className="hud-btn" style={{ width: '22px', height: '22px' }} onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Top: Emission Spectral Overlap Graph */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--zen-text-secondary)', marginBottom: '4px' }}>
              Emission Spectra Overlap (Airy Multi-Detector Simulation)
            </div>
            <canvas
              ref={spectrumCanvasRef}
              width={650}
              height={140}
              style={{
                width: '100%',
                height: '140px',
                borderRadius: '3px',
                border: '1px solid var(--zen-border-medium)',
                display: 'block'
              }}
            />
          </div>

          {/* Bottom: Crosstalk Matrix Grid */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--zen-text-secondary)' }}>
                Detector Bleedthrough Matrix (%) [CudaLsmx64.dll NMF Model]
              </span>
              <button
                className="zen-btn-mini"
                style={{ fontSize: '10px' }}
                onClick={() => {
                  const n = channels.length;
                  const m: number[][] = [];
                  for (let i = 0; i < n; i++) {
                    m[i] = [];
                    for (let j = 0; j < n; j++) {
                      m[i][j] = i === j ? 100 : (Math.abs(i - j) === 1 ? 18 : 2);
                    }
                  }
                  setMatrix(m);
                }}
              >
                Reset Defaults
              </button>
            </div>

            <div
              style={{
                background: 'var(--zen-bg-darkest)',
                border: '1px solid var(--zen-border-medium)',
                borderRadius: '3px',
                padding: '8px',
                overflowX: 'auto'
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '4px 6px', color: 'var(--zen-text-muted)', borderBottom: '1px solid var(--zen-border-subtle)' }}>
                      Emitter Dye
                    </th>
                    {channels.map(ch => (
                      <th
                        key={ch.id}
                        style={{
                          textAlign: 'center',
                          padding: '4px 6px',
                          color: ch.color,
                          borderBottom: '1px solid var(--zen-border-subtle)',
                          fontFamily: 'var(--font-mono)'
                        }}
                      >
                        {ch.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {channels.map((rowCh, rIdx) => (
                    <tr key={rowCh.id}>
                      <td style={{ padding: '6px', fontWeight: 600, color: rowCh.color }}>
                        {rowCh.name} ({rowCh.fluorophore})
                      </td>
                      {channels.map((colCh, cIdx) => (
                        <td key={colCh.id} style={{ textAlign: 'center', padding: '4px 6px' }}>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={matrix[rIdx]?.[cIdx] ?? 0}
                            onChange={e => updateMatrixVal(rIdx, cIdx, Number(e.target.value))}
                            style={{
                              width: '48px',
                              textAlign: 'center',
                              background: rIdx === cIdx ? 'rgba(56, 189, 248, 0.15)' : 'var(--zen-bg-input)',
                              border: `1px solid ${rIdx === cIdx ? '#38bdf8' : 'var(--zen-border-subtle)'}`,
                              color: '#ffffff',
                              fontSize: '11px',
                              padding: '2px 4px',
                              borderRadius: '2px',
                              fontWeight: rIdx === cIdx ? 700 : 400
                            }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ fontSize: '10px', color: 'var(--zen-text-muted)', marginTop: '6px' }}>
              Solving inverse system <code style={{ color: '#38bdf8' }}>C = (M^T · M)^-1 · M^T · I</code> to reconstruct unmixed multi-color channels free of fluorescence spectral crosstalk.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="modal-footer"
          style={{
            background: 'var(--zen-bg-surface)',
            borderTop: '1px solid var(--zen-border-medium)',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '8px'
          }}
        >
          <button className="zen-btn-mini" style={{ height: '26px', padding: '0 12px' }} onClick={onClose}>
            Cancel
          </button>
          <button
            className="zen-btn-mini"
            style={{
              height: '26px',
              padding: '0 16px',
              background: 'var(--zen-blue)',
              color: '#ffffff',
              fontWeight: 700,
              gap: '6px'
            }}
            onClick={handleApply}
            disabled={isComputing}
          >
            {isComputing ? (
              <>
                <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} />
                Unmixing Channels...
              </>
            ) : (
              <>
                <Check size={13} />
                Apply Linear Unmixing
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
