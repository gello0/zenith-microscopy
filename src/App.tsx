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
import { ZenTitleBar } from './components/Header/ZenTitleBar';
import { TopNav } from './components/Header/TopNav';
import { Viewport } from './components/Viewer/Viewport';
import { ToolBar } from './components/Viewer/ToolBar';
import { DimensionSliders } from './components/Viewer/DimensionSliders';
import { ChannelControls } from './components/Sidebar/ChannelControls';
import { ZenToolTree } from './components/Sidebar/ZenToolTree';
import { AcquisitionPanel } from './components/Sidebar/AcquisitionPanel';
import { MetadataPanel } from './components/Sidebar/MetadataPanel';
import { TilesPanel } from './components/Sidebar/TilesPanel';
import { ProcessingPanel } from './components/Sidebar/ProcessingPanel';
import { LineProfileDock } from './components/Analysis/LineProfileDock';
import { CellCounterModal } from './components/Analysis/CellCounterModal';
import { ColocalizationModal } from './components/Analysis/ColocalizationModal';
import { MeasurementsTableDock } from './components/Analysis/MeasurementsTableDock';
import { DeconvolutionModal } from './components/Analysis/DeconvolutionModal';
import { SpectralUnmixingModal } from './components/Analysis/SpectralUnmixingModal';
import { StageNavigatorModal } from './components/Sidebar/StageNavigatorModal';
import { Layers, CheckCircle2 } from 'lucide-react';

export const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('composite');
  const [activeTool, setActiveTool] = useState<ActiveTool>('pan');
  const [channels, setChannels] = useState<Channel[]>(INITIAL_CHANNELS);
  const [metadata, setMetadata] = useState<DatasetMetadata>(INITIAL_METADATA);
  const [isAcquiring, setIsAcquiring] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // ZEISS Workflow Mode: Locate, Acquisition, Processing
  const [activeWorkflow, setActiveWorkflow] = useState<'locate' | 'acquisition' | 'processing'>('acquisition');

  // Sidebar navigation tab
  const [leftTab, setLeftTab] = useState<'acquisition' | 'tiles' | 'processing' | 'metadata'>('acquisition');
  const [useRealCzi, setUseRealCzi] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);

  // Analysis & Advanced Modals
  const [isCellCounterOpen, setIsCellCounterOpen] = useState(false);
  const [isColocOpen, setIsColocOpen] = useState(false);
  const [isMeasurementsTableOpen, setIsMeasurementsTableOpen] = useState(false);
  const [isDeconvOpen, setIsDeconvOpen] = useState(false);
  const [isSpectralUnmixingOpen, setIsSpectralUnmixingOpen] = useState(false);
  const [isStageNavOpen, setIsStageNavOpen] = useState(false);
  const [stagePos, setStagePos] = useState({ x: 12.4, y: -8.4 });

  const [lineProfileData, setLineProfileData] = useState<LineProfilePoint[]>([]);
  const [lineProfileLengthUm, setLineProfileLengthUm] = useState<number>(0);
  const [rois, setRois] = useState<RoiItem[]>([]);
  const [measurements, setMeasurements] = useState<MeasurementRecord[]>([]);

  // Processing & Projections
  const [projectionMode, setProjectionMode] = useState<ProjectionMode>('single');
  const [processingFilter, setProcessingFilter] = useState<ProcessingFilter>('none');

  // Synchronize workflow tab with sidebar
  const handleWorkflowChange = (w: 'locate' | 'acquisition' | 'processing') => {
    setActiveWorkflow(w);
    if (w === 'processing') {
      setLeftTab('processing');
    } else if (w === 'acquisition') {
      setLeftTab('acquisition');
    } else if (w === 'locate') {
      setIsLive(true);
      setLeftTab('acquisition');
    }
  };

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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Live Camera Stream loop
  useEffect(() => {
    if (!isLive) return;

    showToast('🔴 LIVE Stream Active (Axiocam 702 mono continuous 30 FPS)');
    const interval = setInterval(() => {
      setDimensions(prev => ({
        ...prev,
        z: { ...prev.z }
      }));
    }, 100);

    return () => clearInterval(interval);
  }, [isLive]);

  // Automated Multi-Dimensional Experiment Acquisition Sequencer (ZEN ExperimentApiManager)
  useEffect(() => {
    if (!isAcquiring) return;

    showToast(`🚀 Experiment Acquisition Started (${dimensions.z.total} Z-Slices, 4 Channels)`);
    let sliceIdx = 0;

    const timer = setInterval(() => {
      if (sliceIdx < dimensions.z.total) {
        setDimensions(prev => ({
          ...prev,
          z: { ...prev.z, current: sliceIdx }
        }));
        sliceIdx++;
      } else {
        clearInterval(timer);
        setIsAcquiring(false);
        showToast('✅ Multi-Dimensional Acquisition Completed! CZI container saved to cache.');
      }
    }, 500);

    return () => clearInterval(timer);
  }, [isAcquiring, dimensions.z.total]);

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

  // Snap Single Image handler
  const handleSnap = () => {
    showToast(`📸 Snapshot Captured: Plane [Z=${dimensions.z.current + 1}/${dimensions.z.total}, T=${dimensions.time.current + 1}, 4-Ch]`);
  };

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
    ctx.font = 'bold 12px "Segoe UI", Tahoma, sans-serif';
    ctx.fillText(`${barUm} µm`, barX + barPx / 2 - 16, barY - 10);

    // Draw scientific metadata stamp
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(exportCanvas.width - 260, exportCanvas.height - 36, 250, 28);
    ctx.fillStyle = '#007acc';
    ctx.font = 'bold 11px "Segoe UI", Tahoma, sans-serif';
    ctx.fillText(`ZEISS ZEN | ${metadata.objective.split(' ')[0]}`, exportCanvas.width - 245, exportCanvas.height - 18);

    const link = document.createElement('a');
    link.download = `zen_${Date.now()}_snapshot.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
    showToast('💾 Publication Figure Exported with Calibrated Scale Bar');
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
    showToast(`🔬 Applied ${newRois.length} Segmented Nuclei to Measurement Table`);
  };

  const currentDatasetName = useRealCzi ? 'test_sample_4ch_zstack.czi' : metadata.name;

  return (
    <div className="app-container">
      {/* 1. Official ZEISS Window Titlebar & Menu Bar */}
      <ZenTitleBar
        datasetName={currentDatasetName}
        onOpenStageNav={() => setIsStageNavOpen(true)}
        onOpenDeconv={() => setIsDeconvOpen(true)}
        onOpenSpectralUnmixing={() => setIsSpectralUnmixingOpen(true)}
        onOpenCellCounter={() => setIsCellCounterOpen(true)}
        onOpenColoc={() => setIsColocOpen(true)}
      />

      {/* 2. Official ZEISS Action Bar (Locate, Acquisition, Processing & Triggers) */}
      <TopNav
        datasetName={currentDatasetName}
        isAcquiring={isAcquiring}
        setIsAcquiring={setIsAcquiring}
        isLive={isLive}
        setIsLive={setIsLive}
        onSnap={handleSnap}
        useRealCzi={useRealCzi}
        setUseRealCzi={setUseRealCzi}
        backendOnline={backendOnline}
        activeWorkflow={activeWorkflow}
        setActiveWorkflow={handleWorkflowChange}
      />

      {/* Floating Scientific Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '76px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1e1e1e',
            border: '1px solid var(--zen-blue)',
            color: '#f8fafc',
            padding: '6px 16px',
            borderRadius: '3px',
            fontSize: '0.74rem',
            fontFamily: 'var(--font-zen)',
            fontWeight: 600,
            zIndex: 150,
            boxShadow: '0 6px 25px rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <CheckCircle2 size={13} color="#007acc" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 3. Main Three-Column Desktop Workstation */}
      <main className="main-workspace">
        {/* Left Sidebar: Tool Tree (Experiment Manager, Channels, Z-Stack, Tiles) */}
        <aside className="left-sidebar">
          <ZenToolTree
            metadata={metadata}
            onUpdateMetadata={updates => setMetadata(prev => ({ ...prev, ...updates }))}
            projectionMode={projectionMode}
            setProjectionMode={setProjectionMode}
            processingFilter={processingFilter}
            setProcessingFilter={setProcessingFilter}
            stageX={stagePos.x}
            stageY={stagePos.y}
            onOpenNavigator={() => setIsStageNavOpen(true)}
            onOpenDeconvolution={() => setIsDeconvOpen(true)}
            onOpenSpectralUnmixing={() => setIsSpectralUnmixingOpen(true)}
          />
        </aside>

        {/* Center Stage: Document Tabs, View Modes, Image Toolbar, Viewport & Dimensions */}
        <section className="center-stage">
          {/* Document Tab Bar */}
          <div className="zen-doc-tab-bar">
            <div className={`zen-doc-tab ${!useRealCzi ? 'active' : ''}`} onClick={() => setUseRealCzi(false)}>
              <span>📄 HeLa_Mitosis_4Color_ZStack.czi</span>
              <span style={{ fontSize: '10px', color: 'var(--zen-text-muted)' }}>[16-bit 512×512]</span>
            </div>
            <div className={`zen-doc-tab ${useRealCzi ? 'active' : ''}`} onClick={() => setUseRealCzi(true)}>
              <span>📄 test_sample_4ch_zstack.czi</span>
              <span style={{ fontSize: '10px', color: '#22c55e' }}>[Zeiss CZI]</span>
            </div>
          </div>

          {/* View Mode Bar */}
          <div className="zen-viewmode-bar">
            <div className="zen-viewmode-group">
              <button
                className={`zen-viewmode-btn ${viewMode === 'composite' ? 'active' : ''}`}
                onClick={() => setViewMode('composite')}
              >
                2D Composite
              </button>
              <button
                className={`zen-viewmode-btn ${viewMode === 'split' ? 'active' : ''}`}
                onClick={() => setViewMode('split')}
              >
                Split Channels
              </button>
              <button
                className={`zen-viewmode-btn ${viewMode === 'ortho3d' ? 'active' : ''}`}
                onClick={() => setViewMode('ortho3d')}
              >
                3D Ortho
              </button>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--zen-text-muted)', fontFamily: 'var(--font-mono)' }}>
              Zoom: {(zoom * 100).toFixed(0)}% | Voxel: {metadata.voxelSizeUm.x} µm/px
            </div>
          </div>

          {/* Image Toolbar Strip */}
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
              <Layers size={13} color="#007acc" />
              <span>Display & Channels</span>
            </div>
          </div>

          <div className="sidebar-content">
            <ChannelControls channels={channels} setChannels={setChannels} />
          </div>
        </aside>
      </main>

      {/* 4. Bottom Status Bar */}
      <footer className="status-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="status-item">
            <div className="status-dot" style={{ background: isLive ? '#22c55e' : undefined }} />
            <span>Camera: {isLive ? 'LIVE (30 FPS Stream)' : 'Ready (Axiocam 702 mono)'}</span>
          </div>
          <div className="status-item">
            <span>Stage: Connected (X: 12.4mm, Y: -8.4mm, Z: 4.52mm)</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span>Objective: {metadata.objective.split(' ')[0]}</span>
          <span style={{ color: projectionMode !== 'single' ? '#007acc' : 'inherit' }}>
            Z-Mode: {projectionMode.toUpperCase()}
          </span>
          <span style={{ color: processingFilter !== 'none' ? '#a855f7' : 'inherit' }}>
            Filter: {processingFilter.toUpperCase()}
          </span>
          <span>GPU WebGL: Accelerated</span>
          <span style={{ color: '#22c55e' }}>60 FPS</span>
        </div>
      </footer>

      {/* 5. Analysis & Processing Modals */}
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

      {isStageNavOpen && (
        <StageNavigatorModal
          isOpen={isStageNavOpen}
          onClose={() => setIsStageNavOpen(false)}
          currentX={stagePos.x}
          currentY={stagePos.y}
          onMoveStage={(x, y) => {
            setStagePos({ x, y });
            setToastMessage(`Stage Motor Stepped to X: ${x} mm, Y: ${y} mm`);
            setTimeout(() => setToastMessage(null), 3000);
          }}
        />
      )}

      {isDeconvOpen && (
        <DeconvolutionModal
          isOpen={isDeconvOpen}
          onClose={() => setIsDeconvOpen(false)}
          channels={channels}
          onApplyDeconvolution={(chId, iters) => {
            setProcessingFilter('richardson_lucy');
            setToastMessage(`Richardson-Lucy (${iters} iterations) applied to ${chId}`);
            setTimeout(() => setToastMessage(null), 3500);
          }}
        />
      )}

      {isSpectralUnmixingOpen && (
        <SpectralUnmixingModal
          isOpen={isSpectralUnmixingOpen}
          onClose={() => setIsSpectralUnmixingOpen(false)}
          channels={channels}
          onApplyUnmixing={matrix => {
            setToastMessage('Spectral Crosstalk Matrix Inverted — Channels Unmixed');
            setTimeout(() => setToastMessage(null), 3500);
          }}
        />
      )}
    </div>
  );
};

export default App;
