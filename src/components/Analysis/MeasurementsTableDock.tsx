import React from 'react';
import { MeasurementRecord } from '../../types/microscopy';
import { Table, Download, Trash2, X } from 'lucide-react';

interface MeasurementsTableDockProps {
  measurements: MeasurementRecord[];
  onDeleteMeasurement: (id: string) => void;
  onClearAll: () => void;
  onClose: () => void;
}

export const MeasurementsTableDock: React.FC<MeasurementsTableDockProps> = ({
  measurements,
  onDeleteMeasurement,
  onClearAll,
  onClose
}) => {
  if (measurements.length === 0) return null;

  const handleExportCSV = () => {
    let csv = 'ID,Type,Label,Length_um,Area_um2,Mean_Intensity,Timestamp\n';
    measurements.forEach(m => {
      csv += `${m.id},${m.type},"${m.label}",${m.lengthUm ?? ''},${m.areaUm2 ?? ''},${m.meanIntensity},${m.timestamp}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'zenith_measurements.csv';
    a.click();
  };

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 75,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(11, 15, 23, 0.94)',
        backdropFilter: 'blur(16px)',
        border: '1px solid var(--border-medium)',
        borderRadius: '12px',
        padding: '12px 16px',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.8)',
        zIndex: 45,
        width: '680px',
        maxHeight: '260px',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Table size={15} color="#38bdf8" />
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f8fafc' }}>
            Interactive Morphometry & Measurement Data ({measurements.length} items)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="hud-btn"
            style={{ width: 'auto', padding: '2px 8px', height: '24px', fontSize: '0.7rem' }}
            onClick={handleExportCSV}
            title="Export Table as CSV"
          >
            <Download size={13} style={{ marginRight: '4px' }} />
            Export CSV
          </button>
          <button
            className="hud-btn"
            style={{ width: 'auto', padding: '2px 8px', height: '24px', fontSize: '0.7rem', color: '#f87171' }}
            onClick={onClearAll}
            title="Clear all measurements"
          >
            <Trash2 size={13} style={{ marginRight: '4px' }} />
            Clear
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

      {/* Table */}
      <div style={{ overflowY: 'auto', maxHeight: '180px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.73rem', fontFamily: 'var(--font-mono)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left' }}>
              <th style={{ padding: '6px 8px' }}>#</th>
              <th style={{ padding: '6px 8px' }}>Type</th>
              <th style={{ padding: '6px 8px' }}>Label</th>
              <th style={{ padding: '6px 8px' }}>Length (µm)</th>
              <th style={{ padding: '6px 8px' }}>Area (µm²)</th>
              <th style={{ padding: '6px 8px' }}>Mean DN</th>
              <th style={{ padding: '6px 8px', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {measurements.map((m, idx) => (
              <tr key={m.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                <td style={{ padding: '6px 8px', color: 'var(--text-secondary)' }}>{idx + 1}</td>
                <td style={{ padding: '6px 8px', textTransform: 'capitalize', color: '#38bdf8' }}>{m.type}</td>
                <td style={{ padding: '6px 8px', color: '#f8fafc' }}>{m.label}</td>
                <td style={{ padding: '6px 8px' }}>{m.lengthUm ? `${m.lengthUm.toFixed(2)} µm` : '-'}</td>
                <td style={{ padding: '6px 8px' }}>{m.areaUm2 ? `${m.areaUm2.toFixed(1)} µm²` : '-'}</td>
                <td style={{ padding: '6px 8px', color: '#facc15' }}>{m.meanIntensity} DN</td>
                <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                  <button
                    onClick={() => onDeleteMeasurement(m.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '2px 4px'
                    }}
                    title="Delete item"
                  >
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
