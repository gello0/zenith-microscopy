import React, { useState, useEffect } from 'react';
import {
  ViewMode,
  ActiveTool,
  Channel,
  DimensionState,
  DatasetMetadata,
  LineProfilePoint,
  RoiItem,
  MeasurementRecord,
  ProjectionMode,
  ProcessingFilter
} from './types/microscopy';
import { INITIAL_CHANNELS, INITIAL_METADATA } from './services/sampleData';
import { TopNav } from './components/Header/TopNav';
import { Viewport } from './components/Viewer/Viewport';
import { ToolBar } from './components/Viewer/ToolBar';
import { DimensionSliders } from './components/Viewer/DimensionSliders';
import { ChannelControls } from './components/Sidebar/ChannelControls';
import { AcquisitionPanel } from './components/Sidebar/AcquisitionPanel';
import { MetadataPanel } from './components/Sidebar/MetadataPanel';
import { TilesPanel } from './components/Sidebar/TilesPanel';
import { ProcessingPanel } from './components/Sidebar/ProcessingPanel';
import { LineProfileDock } from './components/Analysis/LineProfileDock';
import { CellCounterModal } from './components/Analysis/CellCounterModal';
import { ColocalizationModal } from './components/Analysis/ColocalizationModal';
import { MeasurementsTableDock } from './components/Analysis/MeasurementsTableDock';
import { Layers } from 'lucide-react';

export const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('composite');
  const [activeTool, setActiveTool] = useState<ActiveTool>('pan');
  const [channels, setChannels] = useState<Channel[]>(INITIAL_CHANNELS);
  const [metadata, setMetadata] = useState<DatasetMetadata>(INITIAL_METADATA);
  const [isAcquiring, setIsAcquiring] = useState(false);

  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Sidebar navigation tab
  const [leftTab, setLeftTab] = useState<'acquisition' | 'tiles' | 'processing' | 'metadata'>('acquisition');
  const [useRealCzi, setUseRealCzi] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);

  // Analysis & Advanced Modals
  const [isCellCounterOpen, setIsCellCounterOpen] = useState(false);
  const [isColocOpen, setIsColocOpen] = useState(false);
  const [isMeasurementsTableOpen, setIsMeasurementsTableOpen] = useState(false);
  const [lineProfileData, setLineProfileData] = useState<LineProfilePoint[]>([]);
  const [lineProfileLengthUm, setLineProfileLengthUm] = useState<number>(0);
  const [rois, setRois] = useState<RoiItem[]>([]);
  const [measurements, setMeasurements] = useState<MeasurementRecord[]>([]);

  // Processing & Projections
  const [projectionMode, setProjectionMode] = useState<ProjectionMode>('single');
  const [processingFilter, setProcessingFilter] = useState<ProcessingFilter>('none');

  // Check if Python Zeiss server is running on :8080
  useEffect(() => {
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
      totalTilesX: 3,
      totalTilesY: 3
    }
  });

  // Time-Series Playback Loop
  useEffect(() => {
    if (!dimensions.time.isPlaying) return;

    const timer = setInterval(() => {
      setDimensions(prev => ({
        ...prev,
        time: {
          ...prev.time,
          current: (prev.time.current + 1) % prev.time.total
        }
      }));
    }, 1200);

    return () => clearInterval(timer);
  }, [dimensions.time.isPlaying]);

  // Publication Snapshot Export
  const handleExportSnapshot = () => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    // Draw main image
    ctx.drawImage(canvas, 0, 0);

    // Draw calibrated scale bar watermark
    const pixelSizeUm = metadata.voxelSizeUm.x;
    const barUm = 20;
    const barPx = Math.round(barUm / pixelSizeUm);
    const barX = 24;
    const barY = exportCanvas.height - 24;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(barX, barY - 4, barPx, 4);
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillText(`${barUm} µm`, barX + barPx / 2 - 16, barY - 10);

    // Draw scientific metadata stamp
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(exportCanvas.width - 240, exportCanvas.height - 36, 230, 28);
    ctx.fillStyle = '#38bdf8';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillText(`ZENITH BIO-IMAGING | ${metadata.objective.split(' ')[0]}`, exportCanvas.width - 230, exportCanvas.height - 18);

    const link = document.createElement('a');
    link.download = `zenith_${Date.now()}_publication.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  };

  const handleApplyRoisFromCellCounter = (newRois: RoiItem[]) => {
    setRois(newRois);
    // Convert segmented cells to measurement records
    const newRecords: MeasurementRecord[] = newRois.map(r => ({
      id: r.id,
      type: 'circle',
      label: r.label,
      areaUm2: r.areaUm2,
      meanIntensity: r.meanValues['ch-dapi'] || 160,
      timestamp: new Date().toLocaleTimeString()
    }));
    setMeasurements(prev => [...newRecords, ...prev]);
    setIsMeasurementsTableOpen(true);
  };

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
        {/* Left Sidebar: Experiment Acquisition, Tiles, Processing, & Metadata */}
        <aside className="left-sidebar">
          <div className="sidebar-tabs" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <button
              className={`sidebar-tab-btn ${leftTab === 'acquisition' ? 'active' : ''}`}
              onClick={() => setLeftTab('acquisition')}
              title="Acquisition Hardware Setup"
              style={{ padding: '8px 2px', fontSize: '0.7rem' }}
            >
              Acquire
            </button>
            <button
              className={`sidebar-tab-btn ${leftTab === 'tiles' ? 'active' : ''}`}
              onClick={() => setLeftTab('tiles')}
              title="Tile Region & Stage Mosaic"
              style={{ padding: '8px 2px', fontSize: '0.7rem' }}
            >
              Tiles
            </button>
            <button
              className={`sidebar-tab-btn ${leftTab === 'processing' ? 'active' : ''}`}
              onClick={() => setLeftTab('processing')}
              title="Z-Stack Projections & Convolutions"
              style={{ padding: '8px 2px', fontSize: '0.7rem' }}
            >
              Process
            </button>
            <button
              className={`sidebar-tab-btn ${leftTab === 'metadata' ? 'active' : ''}`}
              onClick={() => setLeftTab('metadata')}
              title="Microscope Hardware Calibration"
              style={{ padding: '8px 2px', fontSize: '0.7rem' }}
            >
              Info
            </button>
          </div>

          <div className="sidebar-content">
            {leftTab === 'acquisition' && (
              <AcquisitionPanel
                metadata={metadata}
                onUpdateMetadata={updates => setMetadata(prev => ({ ...prev, ...updates }))}
              />
            )}
            {leftTab === 'tiles' && <TilesPanel stageX={12.4} stageY={-8.4} />}
            {leftTab === 'processing' && (
              <ProcessingPanel
                projectionMode={projectionMode}
                setProjectionMode={setProjectionMode}
                processingFilter={processingFilter}
                setProcessingFilter={setProcessingFilter}
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
            onOpenCellCounter={() => setIsCellCounterOpen(true)}
            onOpenColocalization={() => setIsColocOpen(true)}
            onExportSnapshot={handleExportSnapshot}
            onToggleMeasurementsTable={() => setIsMeasurementsTableOpen(prev => !prev)}
            measurementsCount={measurements.length}
          />

          {/* Interactive Multi-Channel Viewport */}
          <Viewport
            channels={channels}
            viewMode={viewMode}
            activeTool={activeTool}
            projectionMode={projectionMode}
            processingFilter={processingFilter}
            currentZ={dimensions.z.current}
            totalZ={dimensions.z.total}
            currentTime={dimensions.time.current}
            metadata={metadata}
            zoom={zoom}
            setZoom={setZoom}
            pan={pan}
            setPan={setPan}
            useRealCzi={useRealCzi}
            onProfileDataUpdate={(data, len) => {
              setLineProfileData(data);
              setLineProfileLengthUm(len);
            }}
            rois={rois}
            onAddMeasurement={m => {
              setMeasurements(prev => [m, ...prev]);
              setIsMeasurementsTableOpen(true);
            }}
          />

          {/* Bottom Dock: Z-Stack & Time-Series Timeline Sliders */}
          <DimensionSliders
            dimensions={dimensions}
            setDimensions={setDimensions}
          />

          {/* Dockable Line Intensity Profile Window */}
          {lineProfileData.length > 0 && (
            <LineProfileDock
              data={lineProfileData}
              channels={channels}
              totalLengthUm={lineProfileLengthUm}
              bottomOffset={isMeasurementsTableOpen && measurements.length > 0 ? 330 : 80}
              onClose={() => setLineProfileData([])}
            />
          )}

          {/* Dockable Morphometry & Measurements Table */}
          {isMeasurementsTableOpen && measurements.length > 0 && (
            <MeasurementsTableDock
              measurements={measurements}
              onDeleteMeasurement={id => setMeasurements(prev => prev.filter(m => m.id !== id))}
              onClearAll={() => {
                setMeasurements([]);
                setRois([]);
              }}
              onClose={() => setIsMeasurementsTableOpen(false)}
            />
          )}
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
          <span style={{ color: projectionMode !== 'single' ? '#38bdf8' : 'inherit' }}>
            Z-Mode: {projectionMode.toUpperCase()}
          </span>
          <span style={{ color: processingFilter !== 'none' ? '#a855f7' : 'inherit' }}>
            Filter: {processingFilter.toUpperCase()}
          </span>
          <span>GPU WebGL: Accelerated</span>
          <span style={{ color: '#22c55e' }}>60 FPS</span>
        </div>
      </footer>

      {/* 4. Analysis Modals */}
      {isCellCounterOpen && (
        <CellCounterModal
          onClose={() => setIsCellCounterOpen(false)}
          onApplyRois={handleApplyRoisFromCellCounter}
          channels={channels}
          pixelSizeUm={metadata.voxelSizeUm.x}
        />
      )}

      {isColocOpen && (
        <ColocalizationModal
          onClose={() => setIsColocOpen(false)}
          channels={channels}
        />
      )}
    </div>
  );
};

export default App;
