import React, { useState } from 'react';
import { ViewMode, ActiveTool, Channel, DimensionState, DatasetMetadata } from './types/microscopy';
import { INITIAL_CHANNELS, INITIAL_METADATA } from './services/sampleData';
import { TopNav } from './components/Header/TopNav';
import { Viewport } from './components/Viewer/Viewport';
import { ToolBar } from './components/Viewer/ToolBar';
import { DimensionSliders } from './components/Viewer/DimensionSliders';
import { ChannelControls } from './components/Sidebar/ChannelControls';
import { AcquisitionPanel } from './components/Sidebar/AcquisitionPanel';
import { MetadataPanel } from './components/Sidebar/MetadataPanel';
import { Layers, Sliders, Info, Eye } from 'lucide-react';

export const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('composite');
  const [activeTool, setActiveTool] = useState<ActiveTool>('pan');
  const [channels, setChannels] = useState<Channel[]>(INITIAL_CHANNELS);
  const [metadata, setMetadata] = useState<DatasetMetadata>(INITIAL_METADATA);
  const [isAcquiring, setIsAcquiring] = useState(false);

  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const [leftTab, setLeftTab] = useState<'acquisition' | 'metadata'>('acquisition');
  const [useRealCzi, setUseRealCzi] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);

  // Check if Python Zeiss server is running on :8080
  React.useEffect(() => {
    fetch('http://localhost:8080/api/status')
      .then(res => res.json())
      .then(data => {
        if (data && data.status === 'ONLINE') {
          setBackendOnline(true);
        }
      })
      .catch(() => setBackendOnline(false));
  }, []);

  const [dimensions, setDimensions] = useState<DimensionState>({
    z: {
      current: 2, // Center slice
      total: useRealCzi ? 5 : 20,
      stepUm: 0.35
    },
    time: {
      current: 0,
      total: useRealCzi ? 3 : 12,
      intervalSec: 1.5,
      isPlaying: false
    },
    tile: {
      currentX: 0,
      currentY: 0,
      totalTilesX: 1,
      totalTilesY: 1
    }
  });

  return (
    <div className="app-container">
      {/* 1. Top Navigation & Action Header */}
      <TopNav
        viewMode={viewMode}
        setViewMode={setViewMode}
        datasetName={useRealCzi ? 'test_sample_4ch_zstack.czi' : metadata.name}
        isAcquiring={isAcquiring}
        setIsAcquiring={setIsAcquiring}
        useRealCzi={useRealCzi}
        setUseRealCzi={setUseRealCzi}
        backendOnline={backendOnline}
      />

      {/* 2. Main Workstation Area */}
      <main className="main-workspace">
        {/* Left Sidebar: Experiment Acquisition & Metadata */}
        <aside className="left-sidebar">
          <div className="sidebar-tabs">
            <button
              className={`sidebar-tab-btn ${leftTab === 'acquisition' ? 'active' : ''}`}
              onClick={() => setLeftTab('acquisition')}
            >
              Acquisition Setup
            </button>
            <button
              className={`sidebar-tab-btn ${leftTab === 'metadata' ? 'active' : ''}`}
              onClick={() => setLeftTab('metadata')}
            >
              Info & Calibration
            </button>
          </div>

          <div className="sidebar-content">
            {leftTab === 'acquisition' && (
              <AcquisitionPanel
                metadata={metadata}
                onUpdateMetadata={updates => setMetadata(prev => ({ ...prev, ...updates }))}
              />
            )}
            {leftTab === 'metadata' && <MetadataPanel metadata={metadata} />}
          </div>
        </aside>

        {/* Center Stage: Floating HUD Toolbar, Canvas Viewport & Dimension Sliders */}
        <section className="center-stage">
          {/* Floating Viewport HUD Toolbar */}
          <ToolBar
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            zoom={zoom}
            setZoom={setZoom}
            setPan={setPan}
          />

          {/* Interactive Multi-Channel Viewport */}
          <Viewport
            channels={channels}
            viewMode={viewMode}
            activeTool={activeTool}
            currentZ={dimensions.z.current}
            totalZ={dimensions.z.total}
            currentTime={dimensions.time.current}
            metadata={metadata}
            zoom={zoom}
            setZoom={setZoom}
            pan={pan}
            setPan={setPan}
            useRealCzi={useRealCzi}
          />

          {/* Bottom Dock: Z-Stack & Time-Series Timeline Sliders */}
          <DimensionSliders
            dimensions={dimensions}
            setDimensions={setDimensions}
          />
        </section>

        {/* Right Sidebar: Fluorescence Channels, LUT, Histogram & Intensity Range */}
        <aside className="right-sidebar">
          <div className="sidebar-tabs">
            <div className="sidebar-tab-btn active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Layers size={14} color="#38bdf8" />
              <span>Channels & Display Adjustments</span>
            </div>
          </div>

          <div className="sidebar-content">
            <ChannelControls channels={channels} setChannels={setChannels} />
          </div>
        </aside>
      </main>

      {/* 3. Bottom Status Bar */}
      <footer className="status-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="status-item">
            <div className="status-dot" />
            <span>Camera: Ready (Axiocam 702 mono)</span>
          </div>
          <div className="status-item">
            <span>Stage: Connected (X: 12.4mm, Y: -8.4mm, Z: 4.52mm)</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span>Objective: {metadata.objective.split(' ')[0]}</span>
          <span>GPU WebGL: Accelerated</span>
          <span style={{ color: '#22c55e' }}>60 FPS</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
