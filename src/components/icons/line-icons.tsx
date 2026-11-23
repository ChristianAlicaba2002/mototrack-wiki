import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type IconProps = { size?: number; color: string };

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

export function PlusIcon({ size, color }: IconProps) {
  return (
    <Icon size={size}>
      <Path d="M12 5v14M5 12h14" {...stroke(color)} />
    </Icon>
  );
}

export function CloseIcon({ size, color }: IconProps) {
  return (
    <Icon size={size}>
      <Path d="M6 6l12 12M18 6 6 18" {...stroke(color)} />
    </Icon>
  );
}

export function ChevronRightIcon({ size, color }: IconProps) {
  return (
    <Icon size={size}>
      <Path d="m9 6 6 6-6 6" {...stroke(color)} />
    </Icon>
  );
}

export function ChevronLeftIcon({ size, color }: IconProps) {
  return (
    <Icon size={size}>
      <Path d="m15 6-6 6 6 6" {...stroke(color)} />
    </Icon>
  );
}

export function TrashIcon({ size, color }: IconProps) {
  return (
    <Icon size={size}>
      <Path d="M4 7h16M10 11v6M14 11v6" {...stroke(color)} />
      <Path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" {...stroke(color)} />
      <Path d="M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7" {...stroke(color)} />
    </Icon>
  );
}

export function MotorcycleIcon({ size, color }: IconProps) {
  return (
    <Icon size={size}>
      <Circle cx={5.5} cy={16} r={3.5} {...stroke(color)} />
      <Circle cx={18.5} cy={16} r={3.5} {...stroke(color)} />
      <Path d="M5.5 16 9 10h6l3.5 6" {...stroke(color)} />
      <Path d="M15 10l-1.5-4H16M9 10l2.5 6H14" {...stroke(color)} />
    </Icon>
  );
}

export function GaugeIcon({ size, color }: IconProps) {
  return (
    <Icon size={size}>
      <Path d="M4.2 17.5a9 9 0 1 1 15.6 0" {...stroke(color)} />
      <Path d="m12 14 4-5" {...stroke(color)} />
      <Circle cx={12} cy={14} r={1.5} {...stroke(color)} />
    </Icon>
  );
}

export function EngineIcon({ size, color }: IconProps) {
  return (
    <Icon size={size}>
      <Path d="M13 3 5 14h6l-1 7 8-11h-6l1-7z" {...stroke(color)} />
    </Icon>
  );
}

export function CalendarIcon({ size, color }: IconProps) {
  return (
    <Icon size={size}>
      <Rect x={3.5} y={5} width={17} height={15.5} rx={2.5} {...stroke(color)} />
      <Path d="M3.5 10h17M8 3v4M16 3v4" {...stroke(color)} />
    </Icon>
  );
}

export function TagIcon({ size, color }: IconProps) {
  return (
    <Icon size={size}>
      <Rect x={2.5} y={6.5} width={19} height={11} rx={2.5} {...stroke(color)} />
      <Path d="M6.5 12h3M12.5 12h5" {...stroke(color)} />
    </Icon>
  );
}

export function SparkleIcon({ size, color }: IconProps) {
  return (
    <Icon size={size}>
      <Path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" {...stroke(color)} />
    </Icon>
  );
}

export function CheckIcon({ size, color }: IconProps) {
  return (
    <Icon size={size}>
      <Path d="m5 12.5 4.5 4.5L19 7.5" {...stroke(color)} />
    </Icon>
  );
}

export function WrenchIcon({ size, color }: IconProps) {
  return (
    <Icon size={size}>
      <Path
        d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.4-3.4a6 6 0 0 1-7.9 7.9l-6.6 6.6a2.1 2.1 0 0 1-3-3l6.6-6.6a6 6 0 0 1 7.9-7.9l-3.4 3.4z"
        {...stroke(color)}
      />
    </Icon>
  );
}

export function CoinIcon({ size, color }: IconProps) {
  return (
    <Icon size={size}>
      <Circle cx={12} cy={12} r={9} {...stroke(color)} />
      <Path d="M15 9.5c-.6-1-1.7-1.5-3-1.5-1.7 0-3 .9-3 2s1.2 1.7 3 2 3 .9 3 2-1.3 2-3 2c-1.3 0-2.4-.5-3-1.5M12 6v2M12 16v2" {...stroke(color)} />
    </Icon>
  );
}

export function NoteIcon({ size, color }: IconProps) {
  return (
    <Icon size={size}>
      <Rect x={4.5} y={3.5} width={15} height={17} rx={2.5} {...stroke(color)} />
      <Path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4" {...stroke(color)} />
    </Icon>
  );
}

export function HomeIcon({ size, color }: IconProps) {
  return (
    <Icon size={size}>
      <Path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5H15v-6H9v6H5.5A1.5 1.5 0 0 1 4 19z" {...stroke(color)} />
    </Icon>
  );
}

export function VaultIcon({ size, color }: IconProps) {
  return (
    <Icon size={size}>
      <Rect x={3.5} y={4} width={17} height={15} rx={2.5} {...stroke(color)} />
      <Circle cx={12} cy={11.5} r={3} {...stroke(color)} />
      <Path d="M12 8.5v1M7 19v1.5M17 19v1.5" {...stroke(color)} />
    </Icon>
  );
}

export function BookIcon({ size, color }: IconProps) {
  return (
    <Icon size={size}>
      <Path d="M12 6.5C10.5 5 8 4.5 4 4.5v14c4 0 6.5.5 8 2 1.5-1.5 4-2 8-2v-14c-4 0-6.5.5-8 2z" {...stroke(color)} />
      <Path d="M12 6.5v14" {...stroke(color)} />
    </Icon>
  );
}

export function SettingsIcon({ size, color }: IconProps) {
  return (
    <Icon size={size}>
      <Path
        d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
        {...stroke(color)}
      />
      <Circle cx={12} cy={12} r={3} {...stroke(color)} />
    </Icon>
  );
}

export function SignOutIcon({ size, color }: IconProps) {
  return (
    <Icon size={size}>
      <Path d="M9 20.5H6a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 6 3.5h3" {...stroke(color)} />
      <Path d="M10 12h10M16 8l4 4-4 4" {...stroke(color)} />
    </Icon>
  );
}
