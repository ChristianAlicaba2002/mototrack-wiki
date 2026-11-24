import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

type Props = {
  size?: number;
  /** Badge background. */
  color: string;
  /** Gauge strokes drawn on the badge. */
  foreground: string;
  /** Leave the needle out, so a launch animation can draw its own (see MotoTrackNeedle). */
  needle?: boolean;
};

/** MotoTrack app mark: a speedometer gauge on a rounded badge. */
export function MotoTrackLogo({ size = 64, color, foreground, needle = true }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" accessibilityElementsHidden importantForAccessibility="no">
      <Rect x={0} y={0} width={48} height={48} rx={9} fill={color} />
      {/* gauge arc */}
      <Path
        d="M11.5 31.5a13 13 0 1 1 25 0"
        stroke={foreground}
        strokeWidth={3.5}
        strokeLinecap="round"
        fill="none"
      />
      {/* tick marks */}
      <Line x1={24} y1={13.5} x2={24} y2={16.5} stroke={foreground} strokeWidth={2.5} strokeLinecap="round" />
      <Line x1={14.5} y1={18} x2={16.6} y2={20.1} stroke={foreground} strokeWidth={2.5} strokeLinecap="round" />
      <Line x1={33.5} y1={18} x2={31.4} y2={20.1} stroke={foreground} strokeWidth={2.5} strokeLinecap="round" />
      {/* needle */}
      {needle ? <Needle color={foreground} /> : null}
      {/* road line */}
      <Line x1={15} y1={37.5} x2={33} y2={37.5} stroke={foreground} strokeWidth={2.5} strokeLinecap="round" strokeDasharray="4 4" />
    </Svg>
  );
}

/**
 * The needle on its own, in the same 48×48 box as the logo. Its pivot is at
 * (24, 29), i.e. 50% across and NEEDLE_PIVOT_Y down, for rotating it.
 */
export function MotoTrackNeedle({ size = 64, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" accessibilityElementsHidden importantForAccessibility="no">
      <Needle color={color} />
    </Svg>
  );
}

export const NEEDLE_PIVOT_Y = `${(29 / 48) * 100}%`;

function Needle({ color }: { color: string }) {
  return (
    <>
      <Line x1={24} y1={29} x2={31} y2={21} stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Circle cx={24} cy={29} r={3.5} fill={color} />
    </>
  );
}
