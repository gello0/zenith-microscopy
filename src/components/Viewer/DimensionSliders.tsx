import React, { useEffect } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight, RotateCcw, Clock, Layers } from 'lucide-react';
import { DimensionState } from '../../types/microscopy';

interface DimensionSlidersProps {
  dimensions: DimensionState;
  setDimensions: React.Dispatch<React.SetStateAction<DimensionState>>;
}

export const DimensionSliders: React.FC<DimensionSlidersProps> = ({
  dimensions,
  setDimensions
}) => {
  const { z, time } = dimensions;

  // Auto-play time-lapse loop
  useEffect(() => {
    if (!time.isPlaying) return;

    const timer = setInterval(() => {
      setDimensions(prev => ({
        ...prev,
        time: {
          ...prev.time,
          current: (prev.time.current + 1) % prev.time.total
        }
      }));
    }, 400);

    return () => clearInterval(timer);
  }, [time.isPlaying, time.total, setDimensions]);

  const handleZChange = (newVal: number) => {
    setDimensions(prev => ({
      ...prev,
      z: { ...prev.z, current: newVal }
    }));
  };

  const handleTimeChange = (newVal: number) => {
    setDimensions(prev => ({
      ...prev,
      time: { ...prev.time, current: newVal }
    }));
  };

  const currentZUm = ((z.current - z.total / 2) * z.stepUm).toFixed(2);
  const currentTimeSec = (time.current * time.intervalSec).toFixed(1);

  return (
    <div className="dimension-dock">
      {/* Z-Stack Depth Slider Row */}
      <div className="dimension-row">
        <div className="dimension-label">
          <Layers size={14} color="#38bdf8" />
          <span>Z-STACK</span>
        </div>

        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <button
            className="hud-btn"
            style={{ width: '24px', height: '24px' }}
            onClick={() => handleZChange(Math.max(0, z.current - 1))}
            title="Previous Z Slice"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            className="hud-btn"
            style={{ width: '24px', height: '24px' }}
            onClick={() => handleZChange(Math.min(z.total - 1, z.current + 1))}
            title="Next Z Slice"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        <input
          type="range"
          min={0}
          max={z.total - 1}
          value={z.current}
          onChange={e => handleZChange(parseInt(e.target.value, 10))}
          className="dimension-slider"
          style={{
            background: `linear-gradient(90deg, #0284c7 ${(z.current / (z.total - 1)) * 100}%, rgba(255,255,255,0.1) 0%)`
          }}
        />

        <div className="dimension-val" title={`Slice ${z.current + 1} of ${z.total}`}>
          <span style={{ color: '#38bdf8' }}>{currentZUm}</span> µm
        </div>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          [{z.current + 1}/{z.total}]
        </span>
      </div>

      {/* Time-Series Timeline Slider Row */}
      <div className="dimension-row">
        <div className="dimension-label">
          <Clock size={14} color="#f59e0b" />
          <span>TIME (T)</span>
        </div>

        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <button
            className="hud-btn"
            style={{
              width: '24px',
              height: '24px',
              color: time.isPlaying ? '#22c55e' : undefined
            }}
            onClick={() =>
              setDimensions(prev => ({
                ...prev,
                time: { ...prev.time, isPlaying: !prev.time.isPlaying }
              }))
            }
            title={time.isPlaying ? 'Pause Time Series' : 'Play Time Series'}
          >
            {time.isPlaying ? <Pause size={13} /> : <Play size={13} />}
          </button>
          <button
            className="hud-btn"
            style={{ width: '24px', height: '24px' }}
            onClick={() => handleTimeChange(0)}
            title="Rewind to t=0"
          >
            <RotateCcw size={12} />
          </button>
        </div>

        <input
          type="range"
          min={0}
          max={time.total - 1}
          value={time.current}
          onChange={e => handleTimeChange(parseInt(e.target.value, 10))}
          className="dimension-slider"
          style={{
            background: `linear-gradient(90deg, #d97706 ${(time.current / (time.total - 1)) * 100}%, rgba(255,255,255,0.1) 0%)`
          }}
        />

        <div className="dimension-val" title={`Frame ${time.current + 1} of ${time.total}`}>
          <span style={{ color: '#f59e0b' }}>{currentTimeSec}</span> s
        </div>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          [{time.current + 1}/{time.total}]
        </span>
      </div>
    </div>
  );
};
