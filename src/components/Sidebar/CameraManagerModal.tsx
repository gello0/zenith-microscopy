import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Settings2,
  Sliders,
  CheckCircle2,
  RefreshCw,
  Video,
  Monitor,
  Zap,
  Layers,
  Sun,
  X,
  Play,
  Square,
  AlertTriangle,
  Info
} from 'lucide-react';

export interface CameraDeviceConfig {
  deviceId: string;
  label: string;
  type: 'uvc_usb' | 'genicam' | 'micromanager' | 'touptek' | 'virtual';
  resolution: { width: number; height: number };
  frameRate: number;
  exposureMs: number;
  gain: number;
  binning: '1x1' | '2x2' | '4x4';
  mode: 'color' | 'mono';
}

interface CameraManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeConfig: CameraDeviceConfig;
  onApplyConfig: (config: CameraDeviceConfig, stream: MediaStream | null) => void;
  isLive: boolean;
  setIsLive: (live: boolean) => void;
}

export const CameraManagerModal: React.FC<CameraManagerModalProps> = ({
  isOpen,
  onClose,
  activeConfig,
  onApplyConfig,
  isLive,
  setIsLive
}) => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(activeConfig.deviceId);
  const [cameraType, setCameraType] = useState<CameraDeviceConfig['type']>(activeConfig.type);
  const [selectedRes, setSelectedRes] = useState<'4k' | '1080p' | '720p' | 'native'>('1080p');
  const [frameRate, setFrameRate] = useState<number>(activeConfig.frameRate);
  const [exposureMs, setExposureMs] = useState<number>(activeConfig.exposureMs);
  const [gain, setGain] = useState<number>(activeConfig.gain);
  const [binning, setBinning] = useState<'1x1' | '2x2' | '4x4'>(activeConfig.binning);
  const [colorMode, setColorMode] = useState<'color' | 'mono'>(activeConfig.mode);

  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Enumerate hardware devices
  const scanDevices = async () => {
    setIsScanning(true);
    setPreviewError(null);
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        // Request temporary stream to unlock full device labels if necessary
        try {
          const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
          tempStream.getTracks().forEach(t => t.stop());
        } catch {
          // User might deny permission or no camera plugged in yet
        }

        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = allDevices.filter(d => d.kind === 'videoinput');
        setDevices(videoInputs);
      }
    } catch (err: any) {
      console.warn('Could not enumerate video devices:', err);
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      scanDevices();
    }
  }, [isOpen]);

  // Handle preview stream for selected physical camera
  useEffect(() => {
    if (!isOpen) {
      if (previewStream) {
        previewStream.getTracks().forEach(t => t.stop());
        setPreviewStream(null);
      }
      return;
    }

    if (selectedDeviceId === 'virtual-axiocam') {
      if (previewStream) {
        previewStream.getTracks().forEach(t => t.stop());
        setPreviewStream(null);
      }
      setPreviewError(null);
      return;
    }

    let isCancelled = false;

    const startPreview = async () => {
      setPreviewError(null);
      try {
        let width = 1920;
        let height = 1080;
        if (selectedRes === '4k') { width = 3840; height = 2160; }
        else if (selectedRes === '720p') { width = 1280; height = 720; }

        const constraints: MediaStreamConstraints = {
          video: {
            deviceId: { exact: selectedDeviceId },
            width: { ideal: width },
            height: { ideal: height },
            frameRate: { ideal: frameRate }
          }
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (isCancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        setPreviewStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        if (!isCancelled) {
          setPreviewError(err.message || 'Failed to connect to camera device.');
        }
      }
    };

    startPreview();

    return () => {
      isCancelled = true;
      if (previewStream) {
        previewStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [isOpen, selectedDeviceId, selectedRes, frameRate]);

  useEffect(() => {
    if (videoRef.current && previewStream) {
      videoRef.current.srcObject = previewStream;
    }
  }, [previewStream]);

  if (!isOpen) return null;

  const handleApply = () => {
    let res = { width: 1920, height: 1080 };
    if (selectedRes === '4k') res = { width: 3840, height: 2160 };
    if (selectedRes === '720p') res = { width: 1280, height: 720 };

    const selectedLabel =
      selectedDeviceId === 'virtual-axiocam'
        ? 'Axiocam 702 mono (Synthesized Reference)'
        : devices.find(d => d.deviceId === selectedDeviceId)?.label || 'External USB Camera';

    const newConfig: CameraDeviceConfig = {
      deviceId: selectedDeviceId,
      label: selectedLabel,
      type: cameraType,
      resolution: res,
      frameRate,
      exposureMs,
      gain,
      binning,
      mode: colorMode
    };

    onApplyConfig(newConfig, previewStream);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 250,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-zen)'
      }}
    >
      <div
        style={{
          width: '840px',
          maxHeight: '90vh',
          backgroundColor: '#1e1e1e',
          border: '1px solid #3f3f46',
          borderRadius: '4px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.9)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '10px 16px',
            backgroundColor: '#252526',
            borderBottom: '1px solid #333337',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Camera size={16} color="#007acc" />
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f8fafc', letterSpacing: '0.5px' }}>
              CAMERA DEVICE MANAGER & SENSOR SETUP
            </span>
            <span
              style={{
                fontSize: '0.68rem',
                backgroundColor: 'rgba(0, 122, 204, 0.2)',
                color: '#38bdf8',
                padding: '2px 8px',
                borderRadius: '3px',
                border: '1px solid rgba(0, 122, 204, 0.4)'
              }}
            >
              Universal Hardware HAL
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '4px'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', padding: '16px', gap: '16px', overflowY: 'auto' }}>
          {/* Left Column: Device Detection & Real Live Feed Preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Device Selector Card */}
            <div
              style={{
                background: '#252526',
                border: '1px solid #333337',
                borderRadius: '4px',
                padding: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#e2e8f0' }}>
                  Connected Video Devices ({devices.length + 1} Available)
                </span>
                <button
                  onClick={scanDevices}
                  disabled={isScanning}
                  style={{
                    background: '#333337',
                    border: '1px solid #444',
                    color: '#94a3b8',
                    padding: '2px 8px',
                    borderRadius: '3px',
                    fontSize: '0.68rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Rescan USB ports and video capture drivers"
                >
                  <RefreshCw size={10} className={isScanning ? 'animate-spin' : ''} />
                  Rescan
                </button>
              </div>

              <select
                value={selectedDeviceId}
                onChange={e => {
                  setSelectedDeviceId(e.target.value);
                  if (e.target.value === 'virtual-axiocam') {
                    setCameraType('virtual');
                  } else {
                    setCameraType('uvc_usb');
                  }
                }}
                style={{
                  width: '100%',
                  background: '#18181b',
                  border: '1px solid #3f3f46',
                  color: '#f8fafc',
                  padding: '6px 8px',
                  borderRadius: '3px',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-zen)'
                }}
              >
                <option value="virtual-axiocam">
                  🔬 ZEISS Axiocam 702 mono (High-Resolution Emulated Standard)
                </option>
                {devices.map((d, idx) => (
                  <option key={d.deviceId || idx} value={d.deviceId}>
                    📹 {d.label || `Physical USB Video Device ${idx + 1}`}
                  </option>
                ))}
              </select>

              {/* Hardware Interface Protocol Standard */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '10px' }}>
                <div>
                  <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', marginBottom: '3px' }}>
                    Driver Subsystem
                  </span>
                  <select
                    value={cameraType}
                    onChange={e => setCameraType(e.target.value as any)}
                    style={{
                      width: '100%',
                      background: '#18181b',
                      border: '1px solid #3f3f46',
                      color: '#cbd5e1',
                      padding: '4px',
                      borderRadius: '3px',
                      fontSize: '0.7rem'
                    }}
                  >
                    <option value="uvc_usb">DirectShow / UVC (Plug & Play)</option>
                    <option value="genicam">GenICam USB3 Vision (Industrial)</option>
                    <option value="micromanager">Micro-Manager (MMC_Core)</option>
                    <option value="touptek">ToupTek / AmScope SDK</option>
                    <option value="virtual">Virtual Reference Driver</option>
                  </select>
                </div>

                <div>
                  <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', marginBottom: '3px' }}>
                    Sensor Color Mode
                  </span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setColorMode('mono')}
                      style={{
                        flex: 1,
                        padding: '4px',
                        fontSize: '0.68rem',
                        borderRadius: '2px',
                        border: colorMode === 'mono' ? '1px solid #007acc' : '1px solid #3f3f46',
                        background: colorMode === 'mono' ? 'rgba(0, 122, 204, 0.25)' : '#18181b',
                        color: colorMode === 'mono' ? '#38bdf8' : '#94a3b8',
                        cursor: 'pointer'
                      }}
                    >
                      Monochrome
                    </button>
                    <button
                      type="button"
                      onClick={() => setColorMode('color')}
                      style={{
                        flex: 1,
                        padding: '4px',
                        fontSize: '0.68rem',
                        borderRadius: '2px',
                        border: colorMode === 'color' ? '1px solid #007acc' : '1px solid #3f3f46',
                        background: colorMode === 'color' ? 'rgba(0, 122, 204, 0.25)' : '#18181b',
                        color: colorMode === 'color' ? '#38bdf8' : '#94a3b8',
                        cursor: 'pointer'
                      }}
                    >
                      RGB Color
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Camera Viewfinder Monitor */}
            <div
              style={{
                background: '#09090b',
                border: '1px solid #333337',
                borderRadius: '4px',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Monitor size={11} color="#007acc" /> Live Viewfinder Monitor
                </span>
                <span
                  style={{
                    fontSize: '0.65rem',
                    color: previewStream ? '#22c55e' : '#f59e0b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: previewStream ? '#22c55e' : '#f59e0b'
                    }}
                  />
                  {previewStream ? `ACTIVE (${frameRate} FPS)` : selectedDeviceId === 'virtual-axiocam' ? 'VIRTUAL SYNTHETIC' : 'IDLE'}
                </span>
              </div>

              <div
                style={{
                  width: '100%',
                  height: '210px',
                  background: '#000',
                  borderRadius: '3px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  border: '1px solid #222'
                }}
              >
                {selectedDeviceId === 'virtual-axiocam' ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#94a3b8',
                      textAlign: 'center',
                      padding: '16px'
                    }}
                  >
                    <Zap size={28} color="#007acc" />
                    <span style={{ fontSize: '0.74rem', color: '#f8fafc', fontWeight: 600 }}>
                      Axiocam 702 mono Synthesizer Ready
                    </span>
                    <span style={{ fontSize: '0.68rem', maxWidth: '300px' }}>
                      Streaming calibrated 4-channel HeLa mitosis fluorescence dataset at 16-bit 512×512 resolution.
                    </span>
                  </div>
                ) : previewError ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      color: '#ef4444',
                      padding: '16px',
                      textAlign: 'center'
                    }}
                  >
                    <AlertTriangle size={24} />
                    <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>Camera Stream Error</span>
                    <span style={{ fontSize: '0.66rem', color: '#cbd5e1' }}>{previewError}</span>
                  </div>
                ) : (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      filter: colorMode === 'mono' ? 'grayscale(100%)' : 'none'
                    }}
                  />
                )}

                {/* Overlaid Live Reticle */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '30px',
                    height: '30px',
                    border: '1px dashed rgba(255, 255, 255, 0.3)',
                    borderRadius: '50%',
                    pointerEvents: 'none'
                  }}
                />
              </div>

              <div style={{ fontSize: '0.66rem', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                <span>Crosshair Center: 960 × 540</span>
                <span>Bit Depth: 12-bit Analog-to-Digital</span>
              </div>
            </div>
          </div>

          {/* Right Column: Sensor Timing, Resolution, Binning & Gain */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Format & Resolution Settings */}
            <div
              style={{
                background: '#252526',
                border: '1px solid #333337',
                borderRadius: '4px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sliders size={13} color="#007acc" />
                <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#e2e8f0' }}>
                  Acquisition Format & Geometry
                </span>
              </div>

              {/* Resolution Buttons */}
              <div>
                <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Frame Resolution
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                  {[
                    { id: '1080p', label: '1080p FHD (1920×1080)' },
                    { id: '4k', label: '4K UHD (3840×2160)' },
                    { id: '720p', label: '720p HD (1280×720)' },
                    { id: 'native', label: 'Sensor Native Full ROI' }
                  ].map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedRes(r.id as any)}
                      style={{
                        padding: '6px 4px',
                        borderRadius: '2px',
                        border: selectedRes === r.id ? '1px solid #007acc' : '1px solid #3f3f46',
                        background: selectedRes === r.id ? 'rgba(0, 122, 204, 0.25)' : '#18181b',
                        color: selectedRes === r.id ? '#38bdf8' : '#94a3b8',
                        fontSize: '0.66rem',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pixel Binning */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Hardware Pixel Binning</span>
                  <span style={{ fontSize: '0.68rem', color: '#38bdf8' }}>{binning}</span>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {(['1x1', '2x2', '4x4'] as const).map(b => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBinning(b)}
                      style={{
                        flex: 1,
                        padding: '4px',
                        fontSize: '0.68rem',
                        borderRadius: '2px',
                        border: binning === b ? '1px solid #007acc' : '1px solid #3f3f46',
                        background: binning === b ? 'rgba(0, 122, 204, 0.25)' : '#18181b',
                        color: binning === b ? '#38bdf8' : '#94a3b8',
                        cursor: 'pointer'
                      }}
                    >
                      {b} {b === '1x1' ? '(Full Res)' : b === '2x2' ? '(+4x SNR)' : '(+16x SNR)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Frame Rate */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Sensor Readout Rate</span>
                  <span style={{ fontSize: '0.68rem', color: '#cbd5e1' }}>{frameRate} FPS</span>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[60, 30, 15, 5].map(fps => (
                    <button
                      key={fps}
                      type="button"
                      onClick={() => setFrameRate(fps)}
                      style={{
                        flex: 1,
                        padding: '4px',
                        fontSize: '0.68rem',
                        borderRadius: '2px',
                        border: frameRate === fps ? '1px solid #007acc' : '1px solid #3f3f46',
                        background: frameRate === fps ? 'rgba(0, 122, 204, 0.25)' : '#18181b',
                        color: frameRate === fps ? '#38bdf8' : '#94a3b8',
                        cursor: 'pointer'
                      }}
                    >
                      {fps} FPS
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sensor Exposure & Analog Gain */}
            <div
              style={{
                background: '#252526',
                border: '1px solid #333337',
                borderRadius: '4px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sun size={13} color="#f59e0b" />
                <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#e2e8f0' }}>
                  Exposure Timing & Sensor Sensitivity
                </span>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Exposure Time</span>
                  <span style={{ fontSize: '0.68rem', color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                    {exposureMs} ms ({exposureMs < 50 ? 'Fast Scan' : exposureMs < 200 ? 'Standard' : 'Long Integrate'})
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="1000"
                  step="5"
                  value={exposureMs}
                  onChange={e => setExposureMs(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#007acc' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Analog Sensor Gain</span>
                  <span style={{ fontSize: '0.68rem', color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                    {gain.toFixed(1)}x (ISO {Math.round(gain * 100)})
                  </span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="16.0"
                  step="0.5"
                  value={gain}
                  onChange={e => setGain(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#007acc' }}
                />
              </div>
            </div>

            {/* Notice */}
            <div
              style={{
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                borderRadius: '3px',
                padding: '8px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px'
              }}
            >
              <Info size={14} color="#3b82f6" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ fontSize: '0.68rem', color: '#93c5fd', lineHeight: 1.4 }}>
                Plugging in any standard USB eyepiece, digital microscope, or HDMI capture device automatically routes frames through Windows DirectShow / WebRTC at full resolution.
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '10px 16px',
            backgroundColor: '#252526',
            borderTop: '1px solid #333337',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
              Target Pipeline: <b style={{ color: '#f8fafc' }}>{selectedDeviceId === 'virtual-axiocam' ? 'Axiocam 702 mono' : 'Physical Video Ingest'}</b>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '6px 14px',
                background: '#333337',
                border: '1px solid #444',
                color: '#cbd5e1',
                borderRadius: '3px',
                fontSize: '0.74rem',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              style={{
                padding: '6px 18px',
                background: '#007acc',
                border: '1px solid #0098ff',
                color: '#ffffff',
                borderRadius: '3px',
                fontSize: '0.74rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <CheckCircle2 size={13} />
              Connect & Apply Camera Setup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
