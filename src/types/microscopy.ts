export type ViewMode = 'composite' | 'split' | 'ortho3d' | 'gallery';
export type ActiveTool = 'pan' | 'zoom' | 'crosshair' | 'measure' | 'roi';

export interface Channel {
  id: string;
  name: string;
  fluorophore: string;
  target: string;
  color: string; // Hex color code
  wavelengthEx: number; // nm
  wavelengthEm: number; // nm
  visible: boolean;
  minDisplay: number; // 0-255 or 0-65535
  maxDisplay: number;
  gamma: number; // 0.1 to 3.0
  opacity: number; // 0 to 1
  exposureMs: number;
  laserPowerPercent: number;
}

export interface DimensionState {
  z: {
    current: number;
    total: number;
    stepUm: number;
  };
  time: {
    current: number;
    total: number;
    intervalSec: number;
    isPlaying: boolean;
  };
  tile: {
    currentX: number;
    currentY: number;
    totalTilesX: number;
    totalTilesY: number;
  };
}

export interface DatasetMetadata {
  name: string;
  format: 'CZI' | 'OME-TIFF' | 'ND2';
  objective: string;
  magnification: string;
  numericalAperture: number;
  immersion: 'Air' | 'Oil' | 'Water';
  detector: string;
  bitDepth: 8 | 12 | 16;
  dimensionsXYZCT: {
    width: number;
    height: number;
    zSlices: number;
    channels: number;
    timePoints: number;
  };
  voxelSizeUm: {
    x: number;
    y: number;
    z: number;
  };
  acquisitionDate: string;
}
