export type ViewMode = 'composite' | 'split' | 'ortho3d' | 'gallery';
export type ActiveTool = 'pan' | 'zoom' | 'crosshair' | 'measure' | 'profile' | 'rect_roi' | 'circle_roi';
export type ProjectionMode = 'single' | 'mip' | 'average';
export type ProcessingFilter = 'none' | 'gaussian' | 'unsharp' | 'median' | 'sobel' | 'range_indicator';

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

export interface LineProfilePoint {
  distanceUm: number;
  intensities: { [chId: string]: number };
}

export interface RoiItem {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  areaUm2: number;
  meanValues: { [chId: string]: number };
}

export interface MeasurementRecord {
  id: string;
  type: 'line' | 'rect' | 'circle';
  label: string;
  lengthUm?: number;
  areaUm2?: number;
  perimeterUm?: number;
  meanIntensity: number;
  timestamp: string;
}

export interface TileConfig {
  rows: number;
  cols: number;
  overlapPercent: number;
  pattern: 'snake' | 'comb';
}
