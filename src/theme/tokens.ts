// Theme tokens — ported from OHCA_THEMES in ohca-core.jsx. Dark is the default
// command-center presentation (FR-017).

export interface Theme {
  name: 'dark' | 'light';
  bg: string;
  bgGrad: string;
  surface: string;
  surface2: string;
  raised: string;
  line: string;
  lineStrong: string;
  text: string;
  textDim: string;
  textFaint: string;
  field: string;
  fieldLine: string;
  accent: string;
  shadow: string;
}

export const THEMES: Record<'dark' | 'light', Theme> = {
  dark: {
    name: 'dark',
    bg: '#0B0F14',
    bgGrad: 'radial-gradient(120% 80% at 50% -10%, #15202B 0%, #0B0F14 60%)',
    surface: '#121922',
    surface2: '#0E141B',
    raised: '#19222E',
    line: 'rgba(255,255,255,0.09)',
    lineStrong: 'rgba(255,255,255,0.16)',
    text: '#EAF1F8',
    textDim: '#8FA0B2',
    textFaint: '#5C6B7C',
    field: '#0C1218',
    fieldLine: 'rgba(255,255,255,0.14)',
    accent: '#3E63DD',
    shadow: '0 8px 30px rgba(0,0,0,0.45)',
  },
  light: {
    name: 'light',
    bg: '#EEF1F4',
    bgGrad: 'linear-gradient(180deg,#F6F8FA 0%,#E9EDF1 100%)',
    surface: '#FFFFFF',
    surface2: '#F4F6F8',
    raised: '#FFFFFF',
    line: 'rgba(15,30,50,0.10)',
    lineStrong: 'rgba(15,30,50,0.18)',
    text: '#121A24',
    textDim: '#5A6877',
    textFaint: '#94A1AE',
    field: '#FFFFFF',
    fieldLine: 'rgba(15,30,50,0.18)',
    accent: '#2D52D6',
    shadow: '0 6px 22px rgba(20,40,70,0.10)',
  },
};
