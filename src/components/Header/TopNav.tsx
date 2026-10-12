import React from 'react';
import { Play, Camera, Disc, Activity, CheckCircle2, Save, ChevronDown } from 'lucide-react';

interface TopNavProps {
  datasetName: string;
  isAcquiring: boolean;
  setIsAcquiring: (val: boolean) => void;
  isLive: boolean;
  setIsLive: (val: boolean) => void;
  onSnap: () => void;
  useRealCzi: boolean;
  setUseRealCzi: (val: boolean) => void;
  backendOnline: boolean;
  activeWorkflow: 'locate' | 'acquisition' | 'processing';
  setActiveWorkflow: (w: 'locate' | 'acquisition' | 'processing') => void;
  cameraName?: string;
  onOpenCameraManager?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  datasetName,
  isAcquiring,
  setIsAcquiring,
  isLive,
  setIsLive,
  onSnap,
  useRealCzi,
  setUseRealCzi,
  backendOnline,
  activeWorkflow,
  setActiveWorkflow,
  cameraName,
  onOpenCameraManager
}) => {
  return (
    <div className="zen-action-bar">
      {/* 1. Left: ZEISS Signature Workflow Modes (Locate, Acquisition, Processing) */}
      <div className="zen-workflow-tabs">
        <button
          className={`zen-workflow-tab ${activeWorkflow === 'locate' ? 'active' : ''}`}
          onClick={() => setActiveWorkflow('locate')}
          title="Locate Mode (Visual eyepiece & rapid positioning)"
        >
          Locate
        </button>
        <button
          className={`zen-workflow-tab ${activeWorkflow === 'acquisition' ? 'active' : ''}`}
          onClick={() => setActiveWorkflow('acquisition')}
          title="Acquisition Mode (Active multi-channel confocal experiment)"
        >
          Acquisition
        </button>
        <button
          className={`zen-workflow-tab ${activeWorkflow === 'processing' ? 'active' : ''}`}
          onClick={() => setActiveWorkflow('processing')}
          title="Processing Mode (Post-acquisition analysis & 3D projection)"
        >
          Processing
        </button>
      </div>

      <div className="zen-vdivider" />

      {/* 2. Middle: Active Experiment Profile Selector & CZI Engine Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div className="zen-exp-selector" title="Active Experiment Profile (.czexp)">
          <span style={{ color: 'var(--zen-text-muted)', fontSize: '0.73rem' }}>Experiment:</span>
          <select
            value={useRealCzi ? 'real' : 'sim'}
            onChange={e => setUseRealCzi(e.target.value === 'real')}
            className="zen-select"
          >
            <option value="sim">HeLa_Confocal_4Ch_ZStack.czexp</option>
            <option value="real">test_sample_4ch_zstack.czi (Zeiss pylibCZIrw)</option>
          </select>
          <button className="zen-btn-mini" title="Save current experiment settings">
            <Save size={12} style={{ marginRight: '3px' }} />
            Save
          </button>
        </div>

        {backendOnline && (
          <div
            className="zen-badge-online"
            title="Native Carl Zeiss pylibCZIrw C++ Engine active on :8080"
          >
            <CheckCircle2 size={11} />
            <span>pylibCZIrw 3.5.2</span>
          </div>
        )}
      </div>

      {/* 3. Right: ZEISS Primary Hardware Acquisition Triggers */}
      <div className="zen-action-triggers">
        {/* Camera Device Selector / Setup Trigger */}
        <button
          className="zen-trigger-btn"
          onClick={onOpenCameraManager}
          title="Open Camera Device Manager (Connect USB Microscopes, GenICam, sCMOS)"
          style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px' }}
        >
          <Camera size={13} color="#007acc" />
          <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {cameraName || 'Axiocam 702 mono'}
          </span>
        </button>

        {/* Live Button (Exact Zeiss Live Button with green LED) */}
        <button
          className={`zen-trigger-btn live ${isLive ? 'active' : ''}`}
          onClick={() => setIsLive(!isLive)}
          title="Live Camera Stream (Axiocam 702 mono 30 FPS)"
        >
          <div className={`zen-led ${isLive ? 'green-on' : 'green-off'}`} />
          <Activity size={13} style={{ marginRight: '4px' }} />
          <span>Live</span>
        </button>

        {/* Continuous Button */}
        <button className="zen-trigger-btn" title="Continuous Free Run Acquisition">
          <span>Continuous</span>
        </button>

        {/* Snap Button */}
        <button
          className="zen-trigger-btn"
          onClick={onSnap}
          title="Snap Single Image into Memory Buffer"
        >
          <Camera size={13} style={{ marginRight: '4px' }} />
          <span>Snap</span>
        </button>

        {/* Start Experiment (Signature large ZEISS Blue Button) */}
        <button
          className={`zen-start-experiment-btn ${isAcquiring ? 'acquiring' : ''}`}
          onClick={() => setIsAcquiring(!isAcquiring)}
          title="Start Multi-Dimensional Experiment (Z-Stack, Time-Series, Channels)"
        >
          {isAcquiring ? (
            <>
              <Disc size={14} className="pulse" style={{ marginRight: '5px' }} />
              <span>Stop Acquisition</span>
            </>
          ) : (
            <>
              <Play size={14} fill="#ffffff" style={{ marginRight: '5px' }} />
              <span>Start Experiment</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
