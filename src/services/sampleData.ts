import { Channel, DatasetMetadata } from '../types/microscopy';

export const INITIAL_METADATA: DatasetMetadata = {
  name: 'HeLa_Mitosis_4Color_ZStack.czi',
  format: 'CZI',
  objective: 'Plan-Apochromat 63x/1.40 Oil DIC M27',
  magnification: '63x',
  numericalAperture: 1.40,
  immersion: 'Oil',
  detector: 'Axiocam 702 mono (sCMOS)',
  bitDepth: 16,
  dimensionsXYZCT: {
    width: 640,
    height: 640,
    zSlices: 20,
    channels: 4,
    timePoints: 12
  },
  voxelSizeUm: {
    x: 0.098,
    y: 0.098,
    z: 0.350
  },
  acquisitionDate: '2026-10-12 09:42:15 CET'
};

export const INITIAL_CHANNELS: Channel[] = [
  {
    id: 'ch-dapi',
    name: 'DAPI',
    fluorophore: 'DAPI',
    target: 'Cell Nuclei / DNA',
    color: '#38bdf8',
    wavelengthEx: 405,
    wavelengthEm: 450,
    visible: true,
    minDisplay: 12,
    maxDisplay: 220,
    gamma: 1.0,
    opacity: 1.0,
    exposureMs: 45,
    laserPowerPercent: 8.5
  },
  {
    id: 'ch-gfp',
    name: 'Alexa 488',
    fluorophore: 'Alexa Fluor 488',
    target: 'alpha-Tubulin (Microtubules)',
    color: '#4ade80',
    wavelengthEx: 488,
    wavelengthEm: 525,
    visible: true,
    minDisplay: 8,
    maxDisplay: 215,
    gamma: 1.0,
    opacity: 1.0,
    exposureMs: 120,
    laserPowerPercent: 14.0
  },
  {
    id: 'ch-rfp',
    name: 'mCherry',
    fluorophore: 'mCherry',
    target: 'F-Actin / Cytoskeleton',
    color: '#fb7185',
    wavelengthEx: 561,
    wavelengthEm: 610,
    visible: true,
    minDisplay: 15,
    maxDisplay: 235,
    gamma: 1.0,
    opacity: 1.0,
    exposureMs: 95,
    laserPowerPercent: 12.0
  },
  {
    id: 'ch-cy5',
    name: 'Cy5',
    fluorophore: 'Cyanine 5',
    target: 'Tom20 (Mitochondria)',
    color: '#e879f9',
    wavelengthEx: 633,
    wavelengthEm: 670,
    visible: true,
    minDisplay: 5,
    maxDisplay: 195,
    gamma: 1.0,
    opacity: 1.0,
    exposureMs: 150,
    laserPowerPercent: 18.0
  }
];

// Procedural cellular image generator
// Simulates realistic point-spread functions (PSF), z-depth defocusing, and dynamic cytoskeletal filaments
export class BiologicalImageGenerator {
  private width: number;
  private height: number;

  constructor(width: number = 640, height: number = 640) {
    this.width = width;
    this.height = height;
  }

  public generateChannelSlice(channelId: string, zIndex: number, totalZ: number, timeIndex: number): Uint8Array {
    const buffer = new Uint8Array(this.width * this.height);
    const midZ = totalZ / 2;
    const zDist = Math.abs(zIndex - midZ); // 0 at center, higher at edges
    const zBlur = Math.max(1, zDist * 0.9);

    const cx1 = 240 + Math.sin(timeIndex * 0.15) * 6;
    const cy1 = 280 + Math.cos(timeIndex * 0.15) * 4;
    const cx2 = 420 + Math.cos(timeIndex * 0.12) * 5;
    const cy2 = 360 + Math.sin(timeIndex * 0.12) * 6;

    switch (channelId) {
      case 'ch-dapi':
        this.renderNuclei(buffer, cx1, cy1, cx2, cy2, zDist, zBlur);
        break;
      case 'ch-gfp':
        this.renderMicrotubules(buffer, cx1, cy1, cx2, cy2, zDist, zBlur, timeIndex);
        break;
      case 'ch-rfp':
        this.renderActin(buffer, cx1, cy1, cx2, cy2, zDist, zBlur);
        break;
      case 'ch-cy5':
        this.renderMitochondria(buffer, cx1, cy1, cx2, cy2, zDist, zBlur, timeIndex);
        break;
      default:
        buffer.fill(10);
    }

    return buffer;
  }

  // DAPI: Smooth elliptical nuclei with granular heterochromatin
  private renderNuclei(buf: Uint8Array, x1: number, y1: number, x2: number, y2: number, zDist: number, zBlur: number) {
    if (zDist > 8) return; // Nucleus only spans mid z-stack
    const zFactor = Math.max(0, 1 - zDist / 8);

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const dx1 = (x - x1) / 55;
        const dy1 = (y - y1) / 75;
        const dist1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);

        const dx2 = (x - x2) / 65;
        const dy2 = (y - y2) / 50;
        const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

        let intensity = 0;
        if (dist1 < 1.0) {
          const edgeFalloff = 1 - dist1;
          const chromatinNoise = (Math.sin(x * 0.4) * Math.cos(y * 0.4) + 1) * 25;
          intensity = (170 * edgeFalloff + chromatinNoise) * zFactor;
        }

        if (dist2 < 1.0) {
          const edgeFalloff = 1 - dist2;
          const chromatinNoise = (Math.cos(x * 0.35) * Math.sin(y * 0.45) + 1) * 30;
          intensity = Math.max(intensity, (180 * edgeFalloff + chromatinNoise) * zFactor);
        }

        // Slight Poisson noise
        const noise = Math.random() * 4;
        buf[y * this.width + x] = Math.min(255, Math.floor(intensity + noise));
      }
    }
  }

  // GFP: Radial filamentous tubulin network
  private renderMicrotubules(buf: Uint8Array, x1: number, y1: number, x2: number, y2: number, zDist: number, zBlur: number, t: number) {
    const zFactor = Math.max(0.1, 1 - zDist / 12);

    for (let y = 0; y < this.height; y += 2) {
      for (let x = 0; x < this.width; x += 2) {
        const angle1 = Math.atan2(y - y1, x - x1);
        const dist1 = Math.hypot(x - x1, y - y1);

        const angle2 = Math.atan2(y - y2, x - x2);
        const dist2 = Math.hypot(x - x2, y - y2);

        let val = 0;
        if (dist1 < 190) {
          const filaments = Math.pow(Math.sin(angle1 * 18 + Math.sin(dist1 * 0.08)), 6);
          const radialFade = Math.exp(-dist1 / 90);
          val += filaments * 230 * radialFade;
        }

        if (dist2 < 210) {
          const filaments = Math.pow(Math.sin(angle2 * 22 + Math.cos(dist2 * 0.07)), 6);
          const radialFade = Math.exp(-dist2 / 100);
          val = Math.max(val, filaments * 210 * radialFade);
        }

        val *= zFactor;
        const pixelVal = Math.min(255, Math.floor(val + Math.random() * 6));
        
        // Write block
        buf[y * this.width + x] = pixelVal;
        if (x + 1 < this.width) buf[y * this.width + (x + 1)] = pixelVal;
        if (y + 1 < this.height) {
          buf[(y + 1) * this.width + x] = pixelVal;
          if (x + 1 < this.width) buf[(y + 1) * this.width + (x + 1)] = pixelVal;
        }
      }
    }
  }

  // RFP: Actin cortical filaments and stress fibers
  private renderActin(buf: Uint8Array, x1: number, y1: number, x2: number, y2: number, zDist: number, zBlur: number) {
    const zFactor = Math.max(0.15, 1 - zDist / 10);

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const d1 = Math.hypot((x - x1) / 1.3, (y - y1));
        const d2 = Math.hypot((x - x2), (y - y2) / 1.2);

        let val = 0;
        // Cortical boundary ring
        if (Math.abs(d1 - 130) < 14) {
          val += (1 - Math.abs(d1 - 130) / 14) * 140;
        }
        if (Math.abs(d2 - 145) < 16) {
          val = Math.max(val, (1 - Math.abs(d2 - 145) / 16) * 160);
        }

        // Stress fibers (parallel lines)
        if (d1 < 130) {
          const fibers = Math.pow(Math.sin((x + y * 1.5) * 0.15), 10);
          val += fibers * 90;
        }
        if (d2 < 145) {
          const fibers = Math.pow(Math.sin((x - y * 1.2) * 0.18), 10);
          val = Math.max(val, fibers * 100);
        }

        val *= zFactor;
        buf[y * this.width + x] = Math.min(255, Math.floor(val + Math.random() * 5));
      }
    }
  }

  // Cy5: Punctate mitochondrial network
  private renderMitochondria(buf: Uint8Array, x1: number, y1: number, x2: number, y2: number, zDist: number, zBlur: number, t: number) {
    const zFactor = Math.max(0.1, 1 - zDist / 11);

    for (let y = 0; y < this.height; y += 2) {
      for (let x = 0; x < this.width; x += 2) {
        const d1 = Math.hypot(x - x1, y - y1);
        const d2 = Math.hypot(x - x2, y - y2);

        let val = 0;
        if (d1 > 40 && d1 < 140) {
          const puncta = Math.sin(x * 0.28 + t * 0.1) * Math.cos(y * 0.28);
          if (puncta > 0.4) {
            val += Math.pow((puncta - 0.4) / 0.6, 2) * 190;
          }
        }

        if (d2 > 35 && d2 < 150) {
          const puncta = Math.cos(x * 0.26) * Math.sin(y * 0.26 + t * 0.1);
          if (puncta > 0.4) {
            val = Math.max(val, Math.pow((puncta - 0.4) / 0.6, 2) * 200);
          }
        }

        val *= zFactor;
        const pixelVal = Math.min(255, Math.floor(val + Math.random() * 4));

        buf[y * this.width + x] = pixelVal;
        if (x + 1 < this.width) buf[y * this.width + (x + 1)] = pixelVal;
        if (y + 1 < this.height) {
          buf[(y + 1) * this.width + x] = pixelVal;
          if (x + 1 < this.width) buf[(y + 1) * this.width + (x + 1)] = pixelVal;
        }
      }
    }
  }
}
