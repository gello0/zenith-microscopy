export interface RGB {
  r: number;
  g: number;
  b: number;
}

export function hexToRgb(hex: string): RGB {
  const cleanHex = hex.replace('#', '');
  const bigint = parseInt(cleanHex, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255
  };
}

// Generate color lookup tables (0..255) mapping raw pixel intensity to RGB
export function generateLutTable(colorHex: string, minVal: number, maxVal: number, gamma: number): RGB[] {
  const baseColor = hexToRgb(colorHex);
  const table: RGB[] = new Array(256);
  const range = Math.max(1, maxVal - minVal);

  for (let i = 0; i < 256; i++) {
    let normalized = 0;
    if (i <= minVal) {
      normalized = 0;
    } else if (i >= maxVal) {
      normalized = 1;
    } else {
      normalized = (i - minVal) / range;
    }

    // Apply gamma correction: val^(1/gamma)
    if (gamma !== 1 && normalized > 0) {
      normalized = Math.pow(normalized, 1 / gamma);
    }

    table[i] = {
      r: Math.min(255, Math.round(baseColor.r * normalized)),
      g: Math.min(255, Math.round(baseColor.g * normalized)),
      b: Math.min(255, Math.round(baseColor.b * normalized))
    };
  }

  return table;
}

export const SCIENTIFIC_PRESETS = [
  { name: 'DAPI (Blue)', hex: '#38bdf8' },
  { name: 'Alexa 488 / GFP (Green)', hex: '#4ade80' },
  { name: 'mCherry / RFP (Red)', hex: '#fb7185' },
  { name: 'Cy5 / Far-Red (Magenta)', hex: '#e879f9' },
  { name: 'CFP (Cyan)', hex: '#06b6d4' },
  { name: 'YFP (Yellow)', hex: '#facc15' },
  { name: 'Grayscale', hex: '#ffffff' },
  { name: 'Heatmap / Fire', hex: '#f97316' }
];
