import React from 'react';
import { Minus, Square, X } from 'lucide-react';

interface ZenTitleBarProps {
  datasetName: string;
  onOpenStageNav?: () => void;
  onOpenDeconv?: () => void;
  onOpenSpectralUnmixing?: () => void;
  onOpenCellCounter?: () => void;
  onOpenColoc?: () => void;
}

export const ZenTitleBar: React.FC<ZenTitleBarProps> = ({
  datasetName,
  onOpenStageNav,
  onOpenDeconv,
  onOpenSpectralUnmixing,
  onOpenCellCounter,
  onOpenColoc
}) => {
  return (
    <div className="zen-titlebar">
      {/* Left: Zeiss Blue Brand Logo + Title + Menu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Official ZEISS Blue Square Logo */}
        <div className="zeiss-logo-badge">
          ZEISS
        </div>

        {/* Window Title */}
        <div className="zen-window-title">
          ZEN 2 (blue edition) - [{datasetName}]
        </div>
      </div>

      {/* Center: Classic Menu Bar */}
      <div className="zen-menu-bar">
        <span className="zen-menu-item">File</span>
        <span className="zen-menu-item">Edit</span>
        <span className="zen-menu-item">View</span>
        <span className="zen-menu-item" onClick={onOpenStageNav} title="Open Motorized Stage Navigator">Acquisition</span>
        <span className="zen-menu-item" onClick={onOpenDeconv} title="Open 3D Richardson-Lucy Deconvolution">Processing</span>
        <span className="zen-menu-item" onClick={onOpenCellCounter} title="Open Automated Cell Counter & Segmentation">Analysis</span>
        <span className="zen-menu-item" onClick={onOpenSpectralUnmixing} title="Open Spectral Linear Unmixing">Macro</span>
        <span className="zen-menu-item">Tools</span>
        <span className="zen-menu-item">Window</span>
        <span className="zen-menu-item">Help</span>
      </div>

      {/* Right: Window Controls */}
      <div className="zen-window-controls">
        <button className="zen-win-btn" title="Minimize">
          <Minus size={12} />
        </button>
        <button className="zen-win-btn" title="Maximize">
          <Square size={10} />
        </button>
        <button className="zen-win-btn close" title="Close">
          <X size={12} />
        </button>
      </div>
    </div>
  );
};
