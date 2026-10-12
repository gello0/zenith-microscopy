import React from 'react';
import { DatasetMetadata } from '../../types/microscopy';
import { Info, FileText, Compass, Clock } from 'lucide-react';

interface MetadataPanelProps {
  metadata: DatasetMetadata;
}

export const MetadataPanel: React.FC<MetadataPanelProps> = ({ metadata }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="section-title">
        <span>File & Calibration Info</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ padding: '8px 10px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
            <FileText size={13} />
            <span>Format & Dimensions</span>
          </div>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f8fafc', marginTop: '2px' }}>
            {metadata.format} ({metadata.dimensionsXYZCT.width} x {metadata.dimensionsXYZCT.height} px)
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            XYZCT: {metadata.dimensionsXYZCT.width} × {metadata.dimensionsXYZCT.height} × {metadata.dimensionsXYZCT.zSlices} × {metadata.dimensionsXYZCT.channels} × {metadata.dimensionsXYZCT.timePoints}
          </div>
        </div>

        <div style={{ padding: '8px 10px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
            <Compass size={13} />
            <span>Voxel Size (Scale Calibration)</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginTop: '4px', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
            <div><span style={{ color: 'var(--text-muted)' }}>Δx: </span>{(metadata.voxelSizeUm.x * 1000).toFixed(1)} nm</div>
            <div><span style={{ color: 'var(--text-muted)' }}>Δy: </span>{(metadata.voxelSizeUm.y * 1000).toFixed(1)} nm</div>
            <div><span style={{ color: 'var(--text-muted)' }}>Δz: </span>{(metadata.voxelSizeUm.z * 1000).toFixed(1)} nm</div>
          </div>
        </div>

        <div style={{ padding: '8px 10px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
            <Clock size={13} />
            <span>Acquisition Timestamp</span>
          </div>
          <div style={{ fontSize: '0.74rem', color: '#f8fafc', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
            {metadata.acquisitionDate}
          </div>
        </div>
      </div>
    </div>
  );
};
