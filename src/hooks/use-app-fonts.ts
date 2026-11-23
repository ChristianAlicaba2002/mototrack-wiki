import { DMMono_400Regular } from '@expo-google-fonts/dm-mono/400Regular';
import { DMMono_500Medium } from '@expo-google-fonts/dm-mono/500Medium';
import { InstrumentSans_400Regular } from '@expo-google-fonts/instrument-sans/400Regular';
import { InstrumentSans_500Medium } from '@expo-google-fonts/instrument-sans/500Medium';
import { InstrumentSans_600SemiBold } from '@expo-google-fonts/instrument-sans/600SemiBold';
import { InstrumentSans_700Bold } from '@expo-google-fonts/instrument-sans/700Bold';
import { InstrumentSerif_400Regular } from '@expo-google-fonts/instrument-serif/400Regular';
import { InstrumentSerif_400Regular_Italic } from '@expo-google-fonts/instrument-serif/400Regular_Italic';
import { useFonts } from 'expo-font';

import { Fonts } from '@/constants/theme';

export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({
    [Fonts.display]: InstrumentSerif_400Regular,
    [Fonts.displayItalic]: InstrumentSerif_400Regular_Italic,
    [Fonts.sans]: InstrumentSans_400Regular,
    [Fonts.sansMedium]: InstrumentSans_500Medium,
    [Fonts.sansSemiBold]: InstrumentSans_600SemiBold,
    [Fonts.sansBold]: InstrumentSans_700Bold,
    [Fonts.mono]: DMMono_400Regular,
    [Fonts.monoMedium]: DMMono_500Medium,
  });

  return loaded || error !== null;
}
