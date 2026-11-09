import Svg, { Circle, Path, Rect } from 'react-native-svg';

type IconProps = { size?: number; color: string };

const stroke = (color: string) =>
  ({
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    fill: 'none',
  }) as const;

function Icon({ size = 20, children }: { size?: number; children: React.ReactNode }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no">
      {children}
    </Svg>
  );
}

export function MailIcon({ size, color }: IconProps) {
  return (
    <Icon size={size}>
      <Rect x={3} y={5} width={18} height={14} rx={2.5} {...stroke(color)} />
      <Path d="m3.5 7 8.5 6 8.5-6" {...stroke(color)} />
    </Icon>
  );
}

export function LockIcon({ size, color }: IconProps) {
  return (
    <Icon size={size}>
      <Rect x={4.5} y={10.5} width={15} height={10} rx={2.5} {...stroke(color)} />
      <Path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" {...stroke(color)} />
    </Icon>
  );
}

export function EyeIcon({ size, color }: IconProps) {
  return (
    <Icon size={size}>
      <Path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" {...stroke(color)} />
      <Circle cx={12} cy={12} r={3} {...stroke(color)} />
    </Icon>
  );
}

export function EyeOffIcon({ size, color }: IconProps) {
  return (
    <Icon size={size}>
      <Path d="M10.6 5.1A10.9 10.9 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.1" {...stroke(color)} />
      <Path d="M6.6 6.6C3.9 8.4 2 12 2 12s3.6 7 10 7a10.6 10.6 0 0 0 5.4-1.6" {...stroke(color)} />
      <Path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" {...stroke(color)} />
      <Path d="m3 3 18 18" {...stroke(color)} />
    </Icon>
  );
}

export function ArrowRightIcon({ size, color }: IconProps) {
  return (
    <Icon size={size}>
      <Path d="M5 12h14M13 6l6 6-6 6" {...stroke(color)} />
    </Icon>
  );
}
