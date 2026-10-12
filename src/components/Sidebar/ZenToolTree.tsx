import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Layers,
  Target,
  Wand2,
  Info,
  Compass,
  Sliders,
  Sparkles,
  Camera
} from 'lucide-react';
import { DatasetMetadata, ProjectionMode, ProcessingFilter } from '../../types/microscopy';
import { AcquisitionPanel } from './AcquisitionPanel';
import { FocusStrategyPanel } from './FocusStrategyPanel';
import { TilesPanel } from './TilesPanel';
import { ProcessingPanel } from './ProcessingPanel';
import { MetadataPanel } from './MetadataPanel';

interface ZenToolTreeProps {
  metadata: DatasetMetadata;
  onUpdateMetadata: (updates: Partial<DatasetMetadata>) => void;
  projectionMode: ProjectionMode;
  setProjectionMode: (mode: ProjectionMode) => void;
  processingFilter: ProcessingFilter;
  setProcessingFilter: (filter: ProcessingFilter) => void;
  stageX?: number;
  stageY?: number;
  onOpenNavigator?: () => void;
  onOpenDeconvolution?: () => void;
  onOpenSpectralUnmixing?: () => void;
  onOpenCameraManager?: () => void;
  activeFilterTab?: string;
}

export const ZenToolTree: React.FC<ZenToolTreeProps> = ({
  metadata,
  onUpdateMetadata,
  projectionMode,
  setProjectionMode,
  processingFilter,
  setProcessingFilter,
  stageX = 12.4,
  stageY = -8.4,
  onOpenNavigator,
  onOpenDeconvolution,
  onOpenSpectralUnmixing,
  onOpenCameraManager
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'acquire' | 'focus' | 'tiles' | 'process' | 'info'>('all');

  const [openSections, setOpenSections] = useState({
    acquisition: true,
    focus: false,
    tiles: false,
    processing: false,
    metadata: false
  });

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const setFilterTab = (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (tab === 'all') {
      setOpenSections({ acquisition: true, focus: false, tiles: false, processing: false, metadata: false });
    } else {
      setOpenSections({
        acquisition: tab === 'acquire',
        focus: tab === 'focus',
        tiles: tab === 'tiles',
        processing: tab === 'process',
        metadata: tab === 'info'
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Quick Filter Tab Bar */}
      <div className="sidebar-tabs" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <button
          className={`sidebar-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setFilterTab('all')}
          title="All ZEN Acquisition & Processing Tools"
        >
          All
        </button>
        <button
          className={`sidebar-tab-btn ${activeTab === 'acquire' ? 'active' : ''}`}
          onClick={() => setFilterTab('acquire')}
          title="Acquisition Sequencer & Dimensions"
        >
          Acq
        </button>
        <button
          className={`sidebar-tab-btn ${activeTab === 'focus' ? 'active' : ''}`}
          onClick={() => setFilterTab('focus')}
          title="Definite Focus & Autofocus"
        >
          Focus
        </button>
        <button
          className={`sidebar-tab-btn ${activeTab === 'tiles' ? 'active' : ''}`}
          onClick={() => setFilterTab('tiles')}
          title="Mosaic Scanning & Stage"
        >
          Tiles
        </button>
        <button
          className={`sidebar-tab-btn ${activeTab === 'process' ? 'active' : ''}`}
          onClick={() => setFilterTab('process')}
          title="EDOF, MIP & Deconvolution"
        >
          Process
        </button>
      </div>

      {/* Accordion Tool Tree Body */}
      <div className="sidebar-content">
        {/* 1. Experiment Acquisition Manager */}
        {(activeTab === 'all' || activeTab === 'acquire') && (
          <div className="zen-accordion-group">
            <div className="zen-accordion-header" onClick={() => toggleSection('acquisition')}>
              <div className="zen-accordion-title">
                {openSections.acquisition ? <ChevronDown size={14} color="#38bdf8" /> : <ChevronRight size={14} />}
                <Layers size={13} color="#38bdf8" />
                <span>Experiment Manager</span>
              </div>
              <span className="zen-accordion-badge">Active</span>
            </div>
            {openSections.acquisition && (
              <div className="zen-accordion-body">
                {onOpenCameraManager && (
                  <button
                    onClick={onOpenCameraManager}
                    style={{
                      width: '100%',
                      marginBottom: '8px',
                      padding: '6px 10px',
                      background: 'rgba(0, 122, 204, 0.15)',
                      border: '1px solid rgba(0, 122, 204, 0.4)',
                      color: '#38bdf8',
                      borderRadius: '3px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Camera size={13} />
                    Camera Device Manager (Plug & Play HAL)
                  </button>
                )}
                <AcquisitionPanel metadata={metadata} onUpdateMetadata={onUpdateMetadata} />
              </div>
            )}
          </div>
        )}

        {/* 2. Focus Strategy (Definite Focus) */}
        {(activeTab === 'all' || activeTab === 'focus') && (
          <div className="zen-accordion-group">
            <div className="zen-accordion-header" onClick={() => toggleSection('focus')}>
              <div className="zen-accordion-title">
                {openSections.focus ? <ChevronDown size={14} color="#22c55e" /> : <ChevronRight size={14} />}
                <Target size={13} color="#22c55e" />
                <span>Focus Strategy</span>
              </div>
              <span className="zen-accordion-badge" style={{ color: '#22c55e' }}>Definite Focus</span>
            </div>
            {openSections.focus && (
              <div className="zen-accordion-body">
                <FocusStrategyPanel />
              </div>
            )}
          </div>
        )}

        {/* 3. Tiles & Positions (Stage Mosaic Grid) */}
        {(activeTab === 'all' || activeTab === 'tiles') && (
          <div className="zen-accordion-group">
            <div className="zen-accordion-header" onClick={() => toggleSection('tiles')}>
              <div className="zen-accordion-title">
                {openSections.tiles ? <ChevronDown size={14} color="#a855f7" /> : <ChevronRight size={14} />}
                <Compass size={13} color="#a855f7" />
                <span>Tiles & Positions</span>
              </div>
              <span className="zen-accordion-badge">3×3 Mosaic</span>
            </div>
            {openSections.tiles && (
              <div className="zen-accordion-body">
                <TilesPanel stageX={stageX} stageY={stageY} onOpenNavigator={onOpenNavigator} />
              </div>
            )}
          </div>
        )}

        {/* 4. Processing & Deconvolution */}
        {(activeTab === 'all' || activeTab === 'process') && (
          <div className="zen-accordion-group">
            <div className="zen-accordion-header" onClick={() => toggleSection('processing')}>
              <div className="zen-accordion-title">
                {openSections.processing ? <ChevronDown size={14} color="#f59e0b" /> : <ChevronRight size={14} />}
                <Wand2 size={13} color="#f59e0b" />
                <span>Processing & Deconvolution</span>
              </div>
              <span className="zen-accordion-badge">
                {projectionMode.toUpperCase()}
              </span>
            </div>
            {openSections.processing && (
              <div className="zen-accordion-body">
                <ProcessingPanel
                  projectionMode={projectionMode}
                  setProjectionMode={setProjectionMode}
                  processingFilter={processingFilter}
                  setProcessingFilter={setProcessingFilter}
                  onOpenDeconvolution={onOpenDeconvolution}
                  onOpenSpectralUnmixing={onOpenSpectralUnmixing}
                />
              </div>
            )}
          </div>
        )}

        {/* 5. Microscope Hardware & Optical Metadata */}
        {(activeTab === 'all' || activeTab === 'info') && (
          <div className="zen-accordion-group">
            <div className="zen-accordion-header" onClick={() => toggleSection('metadata')}>
              <div className="zen-accordion-title">
                {openSections.metadata ? <ChevronDown size={14} color="#38bdf8" /> : <ChevronRight size={14} />}
                <Info size={13} color="#38bdf8" />
                <span>Microscope Calibration</span>
              </div>
              <span className="zen-accordion-badge">63x/1.40 Oil</span>
            </div>
            {openSections.metadata && (
              <div className="zen-accordion-body">
                <MetadataPanel metadata={metadata} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
