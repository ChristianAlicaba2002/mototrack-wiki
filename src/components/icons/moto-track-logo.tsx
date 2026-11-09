import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

type Props = {
  size?: number;
  /** Badge background. */
  color: string;
  /** Gauge strokes drawn on the badge. */
  foreground: string;
};

/** MotoTrack app mark: a speedometer gauge on a rounded badge. */
export function MotoTrackLogo({ size = 64, color, foreground }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" accessibilityElementsHidden importantForAccessibility="no">
      <Rect x={0} y={0} width={48} height={48} rx={14} fill={color} />
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
      <Line x1={24} y1={29} x2={31} y2={21} stroke={foreground} strokeWidth={3} strokeLinecap="round" />
      <Circle cx={24} cy={29} r={3.5} fill={foreground} />
      {/* road line */}
      <Line x1={15} y1={37.5} x2={33} y2={37.5} stroke={foreground} strokeWidth={2.5} strokeLinecap="round" strokeDasharray="4 4" />
    </Svg>
  );
}
