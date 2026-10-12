/**
 * Authentic Zeiss Fluorophore and Dye Database
 * Reverse engineered directly from Carl Zeiss ZEN (blue edition):
 * `ZEN\Resources\DyeDataBase\Dyes.xml`
 */

export interface ZeissFluorophore {
  name: string;
  excitationNm: number;
  emissionNm: number;
  defaultHex: string;
  category: 'UV/Blue' | 'Green' | 'Orange/Red' | 'Far-Red' | 'Fluorescent Proteins';
}

export const ZEISS_DYES: ZeissFluorophore[] = [
  // UV / Blue Emitters
  { name: 'DAPI', excitationNm: 358, emissionNm: 463, defaultHex: '#38bdf8', category: 'UV/Blue' },
  { name: 'Hoechst 33342', excitationNm: 352, emissionNm: 455, defaultHex: '#0284c7', category: 'UV/Blue' },
  { name: 'Alexa Fluor 350', excitationNm: 346, emissionNm: 442, defaultHex: '#60a5fa', category: 'UV/Blue' },
  { name: 'Pacific Blue', excitationNm: 410, emissionNm: 455, defaultHex: '#38bdf8', category: 'UV/Blue' },
  
  // Green Emitters
  { name: 'Alexa Fluor 488', excitationNm: 499, emissionNm: 520, defaultHex: '#22c55e', category: 'Green' },
  { name: 'FITC', excitationNm: 494, emissionNm: 518, defaultHex: '#4ade80', category: 'Green' },
  { name: 'eGFP', excitationNm: 488, emissionNm: 509, defaultHex: '#10b981', category: 'Fluorescent Proteins' },
  { name: 'Calcein', excitationNm: 495, emissionNm: 515, defaultHex: '#22c55e', category: 'Green' },
  { name: 'SYBR Green I', excitationNm: 497, emissionNm: 520, defaultHex: '#84cc16', category: 'Green' },

  // Orange / Red Emitters
  { name: 'Alexa Fluor 568', excitationNm: 579, emissionNm: 603, defaultHex: '#f97316', category: 'Orange/Red' },
  { name: 'Alexa Fluor 594', excitationNm: 590, emissionNm: 617, defaultHex: '#ef4444', category: 'Orange/Red' },
  { name: 'mCherry', excitationNm: 587, emissionNm: 610, defaultHex: '#e11d48', category: 'Fluorescent Proteins' },
  { name: 'Texas Red', excitationNm: 596, emissionNm: 620, defaultHex: '#dc2626', category: 'Orange/Red' },
  { name: 'Cy3', excitationNm: 554, emissionNm: 568, defaultHex: '#fb923c', category: 'Orange/Red' },
  { name: 'TRITC', excitationNm: 557, emissionNm: 576, defaultHex: '#f43f5e', category: 'Orange/Red' },
  { name: 'tdTomato', excitationNm: 554, emissionNm: 581, defaultHex: '#f97316', category: 'Fluorescent Proteins' },

  // Far-Red / Near-IR Emitters
  { name: 'Alexa Fluor 647', excitationNm: 653, emissionNm: 668, defaultHex: '#c084fc', category: 'Far-Red' },
  { name: 'Cy5', excitationNm: 649, emissionNm: 670, defaultHex: '#a855f7', category: 'Far-Red' },
  { name: 'DRAQ5', excitationNm: 647, emissionNm: 681, defaultHex: '#9333ea', category: 'Far-Red' },
  { name: 'Alexa Fluor 700', excitationNm: 702, emissionNm: 723, defaultHex: '#7e22ce', category: 'Far-Red' },
  { name: 'Cy7', excitationNm: 743, emissionNm: 767, defaultHex: '#581c87', category: 'Far-Red' }
];

/**
 * Optical constants for immersion and coverslips from `IpFunctionData.xml`
 */
export const ZEISS_OPTICAL_MEDIA = {
  coverslips: [
    { name: 'Standard Borosilicate Glass (Type 1.5, 170 µm)', refractiveIndex: 1.515, thicknessUm: 170 },
    { name: 'Glass Type 1 (145 µm)', refractiveIndex: 1.515, thicknessUm: 145 },
    { name: 'Glass Type 0 (110 µm)', refractiveIndex: 1.515, thicknessUm: 110 },
    { name: 'Zeiss High-Index CGHI', refractiveIndex: 1.622, thicknessUm: 170 },
    { name: 'Sapphire Coverslip', refractiveIndex: 1.757, thicknessUm: 150 }
  ],
  immersionMedia: [
    { name: 'Zeiss Immersol 518 F (Standard Confocal Oil)', refractiveIndex: 1.518 },
    { name: 'Water (Living Cell Imaging @ 24°C)', refractiveIndex: 1.333 },
    { name: 'Glycerol 85% (Tissue Clearing)', refractiveIndex: 1.450 },
    { name: 'Vectashield Antifade Mounting Medium', refractiveIndex: 1.440 },
    { name: 'Air (Dry Objective)', refractiveIndex: 1.000 }
  ]
};
