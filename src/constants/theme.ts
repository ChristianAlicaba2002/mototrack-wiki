/**
 * MotoTrack design tokens. The look is a workshop logbook: warm paper, ink,
 * hairline rules, and instrument-style readouts for anything you'd read off
 * a dashboard (km, dates, costs, plates).
 */

import '@/global.css';

export const Colors = {
  light: {
    text: '#1A1814',
    /** Warm paper, so white panels read as sheets on a bench. */
    background: '#F4F1EA',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E8E3D9',
    textSecondary: '#6E675C',
    /** Hairline rules and panel borders. */
    line: '#DCD5C8',
    /** School colors. Blue = primary actions; red = brand marks and the active bike. */
    accent: '#1F3D8F',
    onAccent: '#FFFFFF',
    accentSoft: '#E3E8F4',
    brand: '#C8102E',
    onBrand: '#FFFFFF',
    brandSoft: '#F7E2E4',
    danger: '#B3261E',
    success: '#2F6B40',
  },
  dark: {
    text: '#ECE8E0',
    background: '#131211',
    backgroundElement: '#1C1B19',
    backgroundSelected: '#2A2824',
    textSecondary: '#A29C90',
    line: '#302E29',
    accent: '#93AAE6',
    onAccent: '#0D1530',
    accentSoft: '#1A2238',
    brand: '#E5484D',
    onBrand: '#FFFFFF',
    brandSoft: '#381618',
    danger: '#FF8A80',
    success: '#82C595',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = {
  display: 'InstrumentSerif_400Regular',
  displayItalic: 'InstrumentSerif_400Regular_Italic',
  sans: 'InstrumentSans_400Regular',
  sansMedium: 'InstrumentSans_500Medium',
  sansSemiBold: 'InstrumentSans_600SemiBold',
  sansBold: 'InstrumentSans_700Bold',
  mono: 'DMMono_400Regular',
  monoMedium: 'DMMono_500Medium',
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const MaxContentWidth = 800;
