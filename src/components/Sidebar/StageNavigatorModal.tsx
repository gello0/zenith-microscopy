import React, { useState } from 'react';
import { Compass, X, Check, Target, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Navigation } from 'lucide-react';

interface StageNavigatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentX: number;
  currentY: number;
  onMoveStage: (x: number, y: number) => void;
}

export const StageNavigatorModal: React.FC<StageNavigatorModalProps> = ({
  isOpen,
  onClose,
  currentX,
  currentY,
  onMoveStage
}) => {
  const [carrierType, setCarrierType] = useState<'slide' | 'plate96' | 'plate384' | 'dish35'>('plate96');
  const [stepSizeMm, setStepSizeMm] = useState<number>(1.0);
  const [selectedWell, setSelectedWell] = useState<string>('D6');

  if (!isOpen) return null;

  const handleStep = (dx: number, dy: number) => {
    onMoveStage(Number((currentX + dx).toFixed(2)), Number((currentY + dy).toFixed(2)));
  };

  const handleWellClick = (row: string, col: number) => {
    setSelectedWell(`${row}${col}`);
    // Convert 96-well grid coordinates to stage mm (-40mm to +40mm)
    const rowIdx = row.charCodeAt(0) - 65; // 0 to 7 (A-H)
    const targetX = Number(((col - 6.5) * 9.0).toFixed(2));
    const targetY = Number(((3.5 - rowIdx) * 9.0).toFixed(2));
    onMoveStage(targetX, targetY);
  };

  return (
    <div className="modal-backdrop">
      <div
        className="modal-window"
        style={{
          width: '720px',
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
            <Compass size={16} color="var(--zen-blue)" />
            <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              ZEISS Motorized Stage Navigator (TileMatrixPlanner)
            </span>
          </div>
          <button className="hud-btn" style={{ width: '22px', height: '22px' }} onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '12px', display: 'grid', gridTemplateColumns: '1fr 240px', gap: '12px' }}>
          {/* Left: Carrier Map Canvas */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--zen-text-secondary)' }}>
                Sample Carrier Footprint:
              </span>
              <select
                className="zen-select"
                value={carrierType}
                onChange={e => setCarrierType(e.target.value as any)}
              >
                <option value="plate96">96-Well Microplate (8×12 Standard)</option>
                <option value="plate384">384-Well High-Content Plate</option>
                <option value="slide">Standard Glass Slide (75×25 mm)</option>
                <option value="dish35">35 mm Confocal Dish</option>
              </select>
            </div>

            {/* Interactive SVG Carrier */}
            <div
              style={{
                background: '#111112',
                border: '1px solid var(--zen-border-medium)',
                borderRadius: '3px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '260px'
              }}
            >
              {carrierType === 'plate96' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(row => (
                    <div key={row} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ width: '14px', fontSize: '10px', color: 'var(--zen-text-muted)', textAlign: 'right' }}>
                        {row}
                      </span>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(col => {
                        const wellName = `${row}${col}`;
                        const isCurrent = wellName === selectedWell;
                        return (
                          <div
                            key={col}
                            onClick={() => handleWellClick(row, col)}
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              background: isCurrent ? 'var(--zen-blue)' : 'rgba(255, 255, 255, 0.05)',
                              border: `1px solid ${isCurrent ? '#ffffff' : 'rgba(255, 255, 255, 0.15)'}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '8px',
                              color: isCurrent ? '#000000' : 'var(--zen-text-muted)',
                              fontWeight: isCurrent ? 700 : 400,
                              cursor: 'pointer',
                              transition: 'all 0.1s ease',
                              boxShadow: isCurrent ? '0 0 10px rgba(56, 189, 248, 0.6)' : 'none'
                            }}
                            title={`Well ${wellName}`}
                          >
                            {col}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    width: '320px',
                    height: '110px',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '4px',
                    position: 'relative',
                    background: 'rgba(255, 255, 255, 0.02)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onClick={e => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const rx = ((e.clientX - rect.left) / rect.width - 0.5) * 75;
                    const ry = ((e.clientY - rect.top) / rect.height - 0.5) * -25;
                    onMoveStage(Number(rx.toFixed(2)), Number(ry.toFixed(2)));
                  }}
                >
                  <div style={{ fontSize: '10px', color: 'var(--zen-text-muted)' }}>
                    Standard Glass Slide (Click to move stage)
                  </div>
                  {/* Position Crosshair */}
                  <div
                    style={{
                      position: 'absolute',
                      left: `${((currentX / 75) + 0.5) * 100}%`,
                      top: `${((-currentY / 25) + 0.5) * 100}%`,
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      background: 'rgba(56, 189, 248, 0.4)',
                      border: '2px solid #38bdf8',
                      transform: 'translate(-50%, -50%)',
                      boxShadow: '0 0 8px #38bdf8'
                    }}
                  />
                </div>
              )}
            </div>

            <div style={{ fontSize: '10px', color: 'var(--zen-text-muted)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Selected Well: <strong style={{ color: '#38bdf8' }}>{selectedWell}</strong></span>
              <span>Footprint Limit: ±50.0 mm</span>
            </div>
          </div>

          {/* Right: Motorized Coordinates & Virtual Joystick */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Live Readout Card */}
            <div
              style={{
                background: 'var(--zen-bg-darkest)',
                border: '1px solid var(--zen-border-medium)',
                borderRadius: '3px',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <span style={{ fontSize: '10px', color: 'var(--zen-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Motorized Stage Coordinates
              </span>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                <span style={{ color: 'var(--zen-text-muted)' }}>X:</span>
                <span style={{ color: '#ffffff', fontWeight: 600 }}>{currentX >= 0 ? `+${currentX.toFixed(2)}` : currentX.toFixed(2)} mm</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                <span style={{ color: 'var(--zen-text-muted)' }}>Y:</span>
                <span style={{ color: '#ffffff', fontWeight: 600 }}>{currentY >= 0 ? `+${currentY.toFixed(2)}` : currentY.toFixed(2)} mm</span>
              </div>
            </div>

            {/* Step Size Selector */}
            <div>
              <label style={{ fontSize: '10.5px', color: 'var(--zen-text-muted)' }}>Jog Step Distance</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '3px', marginTop: '3px' }}>
                {[0.1, 0.5, 1.0, 5.0].map(s => (
                  <button
                    key={s}
                    className={`zen-btn-mini ${stepSizeMm === s ? 'active' : ''}`}
                    style={{
                      justifyContent: 'center',
                      background: stepSizeMm === s ? 'var(--zen-blue)' : undefined,
                      color: stepSizeMm === s ? '#ffffff' : undefined,
                      fontSize: '10px'
                    }}
                    onClick={() => setStepSizeMm(s)}
                  >
                    {s >= 1 ? `${s}mm` : `${s * 1000}µm`}
                  </button>
                ))}
              </div>
            </div>

            {/* Virtual D-Pad / Stage Joystick */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', padding: '6px' }}>
              <button
                className="hud-btn"
                style={{ width: '32px', height: '32px' }}
                onClick={() => handleStep(0, stepSizeMm)}
                title="Move Stage North (+Y)"
              >
                <ChevronUp size={16} />
              </button>
              <div style={{ display: 'flex', gap: '16px' }}>
                <button
                  className="hud-btn"
                  style={{ width: '32px', height: '32px' }}
                  onClick={() => handleStep(-stepSizeMm, 0)}
                  title="Move Stage West (-X)"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  className="hud-btn"
                  style={{ width: '32px', height: '32px', color: 'var(--zen-blue)' }}
                  onClick={() => onMoveStage(0, 0)}
                  title="Center Stage (0, 0)"
                >
                  <Target size={14} />
                </button>
                <button
                  className="hud-btn"
                  style={{ width: '32px', height: '32px' }}
                  onClick={() => handleStep(stepSizeMm, 0)}
                  title="Move Stage East (+X)"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              <button
                className="hud-btn"
                style={{ width: '32px', height: '32px' }}
                onClick={() => handleStep(0, -stepSizeMm)}
                title="Move Stage South (-Y)"
              >
                <ChevronDown size={16} />
              </button>
            </div>

            {/* Quick Actions */}
            <button
              className="zen-btn-mini"
              style={{ width: '100%', height: '26px', justifyContent: 'center', gap: '6px' }}
              onClick={() => alert(`Position (${currentX}, ${currentY}) added to Tile Acquisition Queue.`)}
            >
              <Navigation size={12} />
              Add Position to Tiles
            </button>
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
          <button className="zen-btn-mini" style={{ height: '26px', padding: '0 16px' }} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
