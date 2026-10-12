import React, { useState } from 'react';
import { Channel } from '../../types/microscopy';
import { Eye, EyeOff, Radio, Sliders, Palette, Zap } from 'lucide-react';
import { Histogram } from './Histogram';
import { SCIENTIFIC_PRESETS } from '../../services/lutEngine';
import { ZEISS_DYES } from '../../services/zeissDyes';

interface ChannelControlsProps {
  channels: Channel[];
  setChannels: React.Dispatch<React.SetStateAction<Channel[]>>;
}

export const ChannelControls: React.FC<ChannelControlsProps> = ({
  channels,
  setChannels
}) => {
  const [expandedId, setExpandedId] = useState<string>('ch-dapi');

  const updateChannel = (id: string, updates: Partial<Channel>) => {
    setChannels(prev =>
      prev.map(ch => (ch.id === id ? { ...ch, ...updates } : ch))
    );
  };

  const handleSolo = (id: string) => {
    setChannels(prev =>
      prev.map(ch => ({
        ...ch,
        visible: ch.id === id
      }))
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div className="section-title">
        <span>Fluorescence Channels ({channels.filter(c => c.visible).length}/{channels.length})</span>
        <button
          className="hud-btn"
          style={{ width: 'auto', fontSize: '0.7rem', padding: '0 6px', height: '22px' }}
          onClick={() => setChannels(prev => prev.map(c => ({ ...c, visible: true })))}
        >
          Show All
        </button>
      </div>

      {channels.map(ch => {
        const isExpanded = expandedId === ch.id;

        return (
          <div
            key={ch.id}
            className={`channel-card ${ch.visible ? 'active' : ''}`}
            style={{ '--channel-accent': ch.color } as React.CSSProperties}
          >
            {/* Header row */}
            <div className="channel-header">
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: 1 }}
                onClick={() => setExpandedId(isExpanded ? '' : ch.id)}
              >
                <div
                  className="channel-dot"
                  style={{
                    backgroundColor: ch.color,
                    color: ch.color,
                    boxShadow: ch.visible ? `0 0 10px ${ch.color}` : 'none',
                    opacity: ch.visible ? 1 : 0.4
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 600, color: ch.visible ? '#f8fafc' : '#64748b' }}>
                    {ch.name}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    {ch.target}
                  </span>
                </div>
              </div>

              {/* Action Buttons: Solo & Visibility */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  className="hud-btn"
                  style={{ width: '24px', height: '24px', fontSize: '0.68rem', fontWeight: 700 }}
                  onClick={() => handleSolo(ch.id)}
                  title="Solo this channel"
                >
                  <Radio size={13} color={ch.visible ? ch.color : undefined} />
                </button>
                <button
                  className="hud-btn"
                  style={{ width: '24px', height: '24px' }}
                  onClick={() => updateChannel(ch.id, { visible: !ch.visible })}
                  title={ch.visible ? 'Hide Channel' : 'Show Channel'}
                >
                  {ch.visible ? <Eye size={14} color="#f8fafc" /> : <EyeOff size={14} color="#64748b" />}
                </button>
              </div>
            </div>

            {/* Fluorophore Tag & Laser Indicator */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              <span>λ {ch.wavelengthEx}nm → {ch.wavelengthEm}nm</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#f59e0b' }}>
                <Zap size={11} /> {ch.laserPowerPercent}% ({ch.exposureMs}ms)
              </span>
            </div>

            {/* Expanded Detailed Settings: Histogram, Sliders, Color Palette */}
            {isExpanded && (
              <div
                style={{
                  marginTop: '0.4rem',
                  paddingTop: '0.6rem',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                {/* Histogram & Window/Level */}
                <Histogram
                  channel={ch}
                  onMinChange={minVal => updateChannel(ch.id, { minDisplay: minVal })}
                  onMaxChange={maxVal => updateChannel(ch.id, { maxDisplay: maxVal })}
                />

                {/* Authentic ZEISS Fluorophore Selector (from Dyes.xml) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', width: '68px' }}>Dye (ZEN):</span>
                  <select
                    value={ch.fluorophore}
                    onChange={e => {
                      const selected = ZEISS_DYES.find(d => d.name === e.target.value);
                      if (selected) {
                        updateChannel(ch.id, {
                          fluorophore: selected.name,
                          wavelengthEx: selected.excitationNm,
                          wavelengthEm: selected.emissionNm,
                          color: selected.defaultHex
                        });
                      }
                    }}
                    style={{
                      flex: 1,
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: '0.74rem',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      outline: 'none'
                    }}
                  >
                    {ZEISS_DYES.map(d => (
                      <option key={d.name} value={d.name} style={{ background: '#1e1e1e' }}>
                        {d.name} ({d.excitationNm}/{d.emissionNm} nm)
                      </option>
                    ))}
                  </select>
                </div>

                {/* LUT Preset Selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Palette size={14} color="var(--text-muted)" />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', width: '68px' }}>Color LUT:</span>
                  <select
                    value={ch.color}
                    onChange={e => updateChannel(ch.id, { color: e.target.value })}
                    style={{
                      flex: 1,
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: '0.74rem',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      outline: 'none'
                    }}
                  >
                    {SCIENTIFIC_PRESETS.map(preset => (
                      <option key={preset.hex} value={preset.hex} style={{ background: '#1e1e1e' }}>
                        {preset.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sliders: Min Cutoff, Max Cutoff, Gamma */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {/* Min Display Slider */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.7rem', width: '60px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      Black: {ch.minDisplay}
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={ch.maxDisplay - 1}
                      value={ch.minDisplay}
                      onChange={e => updateChannel(ch.id, { minDisplay: parseInt(e.target.value, 10) })}
                      className="dimension-slider"
                      style={{ height: '4px' }}
                    />
                  </div>

                  {/* Max Display Slider */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.7rem', width: '60px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      White: {ch.maxDisplay}
                    </span>
                    <input
                      type="range"
                      min={ch.minDisplay + 1}
                      max={255}
                      value={ch.maxDisplay}
                      onChange={e => updateChannel(ch.id, { maxDisplay: parseInt(e.target.value, 10) })}
                      className="dimension-slider"
                      style={{ height: '4px' }}
                    />
                  </div>

                  {/* Gamma Slider */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.7rem', width: '60px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      γ Gamma: {ch.gamma.toFixed(1)}
                    </span>
                    <input
                      type="range"
                      min={0.4}
                      max={2.5}
                      step={0.1}
                      value={ch.gamma}
                      onChange={e => updateChannel(ch.id, { gamma: parseFloat(e.target.value) })}
                      className="dimension-slider"
                      style={{ height: '4px' }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
