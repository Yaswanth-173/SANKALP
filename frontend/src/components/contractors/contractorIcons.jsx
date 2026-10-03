const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export const HouseIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M4 11.5 12 4l8 7.5" />
    <path d="M6 10v10h12V10" />
    <path d="M10 20v-6h4v6" />
  </svg>
)

export const WallIcon = (p) => (
  <svg {...base} {...p}>
    <rect x="3.5" y="4" width="17" height="16" rx="1" />
    <path d="M3.5 9.3h17M3.5 14.6h17M8.5 4v5.3M15.5 9.3v5.3M8.5 14.6V20" />
  </svg>
)

export const BoltIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
  </svg>
)

export const WrenchIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M14.7 6.3a4 4 0 0 0-5.4 5l-6 6 2.4 2.4 6-6a4 4 0 0 0 5-5.4l-2.7 2.7-2.4-2.4 2.7-2.7Z" />
  </svg>
)

export const BrickIcon = (p) => (
  <svg {...base} {...p} fill="none">
    <rect x="3" y="4.5" width="7" height="4" rx="0.6" fill="currentColor" stroke="none" />
    <rect x="12.5" y="4.5" width="8.5" height="4" rx="0.6" fill="currentColor" stroke="none" />
    <rect x="3" y="10.2" width="4" height="4" rx="0.6" fill="currentColor" stroke="none" />
    <rect x="8.7" y="10.2" width="8" height="4" rx="0.6" fill="currentColor" stroke="none" />
    <rect x="18.4" y="10.2" width="2.6" height="4" rx="0.6" fill="currentColor" stroke="none" />
    <rect x="3" y="15.9" width="7" height="4" rx="0.6" fill="currentColor" stroke="none" />
    <rect x="12.5" y="15.9" width="8.5" height="4" rx="0.6" fill="currentColor" stroke="none" />
  </svg>
)

export const HammerIcon = (p) => (
  <svg {...base} {...p} fill="none">
    <rect x="10.4" y="9" width="3.2" height="12" rx="1.4" fill="currentColor" stroke="none" />
    <rect x="4.5" y="3.5" width="15" height="6" rx="1.8" fill="currentColor" stroke="none" />
  </svg>
)

export const RollerIcon = (p) => (
  <svg {...base} {...p}>
    <rect x="4" y="4" width="14" height="6" rx="1.5" />
    <path d="M9 10v4a2 2 0 0 0 2 2h1v5" />
    <path d="M10 21h4" />
  </svg>
)

export const LayersIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M12 3 3 8l9 5 9-5-9-5Z" />
    <path d="M3 13l9 5 9-5M3 18l9 5 9-5" />
  </svg>
)

export const RoofIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M2 13 12 5l10 8" />
    <path d="M4.5 11.2v2M8.7 7.9v2M15.3 7.9v2M19.5 11.2v2" />
    <path d="M3 15.5h18M3 19h18" />
  </svg>
)

export const DoorIcon = (p) => (
  <svg {...base} {...p}>
    <rect x="6" y="3" width="12" height="18" rx="1" />
    <path d="M14.5 12h.01" />
  </svg>
)

export const BeamIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M5 4h14M5 20h14M12 4v16" />
    <path d="M9 4v3M15 4v3M9 17v3M15 17v3" />
  </svg>
)

export const TrussIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M2 18h20M2 18 12 5l10 13M6.5 18l5.5-8 5.5 8" />
    <path d="M9 18l3-4.5 3 4.5" />
  </svg>
)

export const SnowflakeIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M12 2v20M4.5 6.5l15 11M19.5 6.5l-15 11" />
    <path d="M8 4l4 3 4-3M8 20l4-3 4 3M4 9l1 4-3 3M20 9l-1 4 3 3M4 15l1-4-3-3M20 15l-1-4 3-3" />
  </svg>
)

export const ElevatorIcon = (p) => (
  <svg {...base} {...p}>
    <rect x="5" y="3" width="14" height="18" rx="1.5" />
    <path d="M10 8l1.5-2L13 8M10 16l1.5 2 1.5-2" />
  </svg>
)

export const DropletShieldIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M12 3 5 10.5C5 15 8 19 12 21c4-2 7-6 7-10.5L12 3Z" />
    <path d="M12 8.5c-1.5 2-2.5 3.3-2.5 4.7a2.5 2.5 0 0 0 5 0c0-1.4-1-2.7-2.5-4.7Z" />
  </svg>
)

export const GearIcon = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 13a7.97 7.97 0 0 0 0-2l2-1.5-2-3.4-2.4 1a8 8 0 0 0-1.7-1L14.8 3h-4l-.5 2.6a8 8 0 0 0-1.7 1l-2.4-1-2 3.4L6.2 11a7.97 7.97 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a8 8 0 0 0 1.7 1l.5 2.6h4l.5-2.6a8 8 0 0 0 1.7-1l2.4 1 2-3.4-2-1.5Z" />
  </svg>
)

export const FlameShieldIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M12 21c-3 0-5-2-5-4.8 0-2.4 1.6-3.6 2.3-5.5.4 1 1.2 1.6 1.9 1.2-.3-2 .5-4.3 2.3-5.4-.6 2 .2 3 1.2 3.8 1.6 1.3 2.3 3 2.3 5.1C17 19 15 21 12 21Z" />
  </svg>
)

export const PaletteIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M12 3a9 8 0 1 0 0 16c1.1 0 2-.8 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.2 0-.8.7-1.5 1.5-1.5H16a5 5 0 0 0 5-5c0-2.8-4-5-9-5Z" />
    <circle cx="7.5" cy="10.5" r="1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="7.5" r="1" fill="currentColor" stroke="none" />
    <circle cx="16" cy="9.5" r="1" fill="currentColor" stroke="none" />
  </svg>
)

export const TreeIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M12 2 7 10h3l-4 6h5v6h2v-6h5l-4-6h3L12 2Z" />
  </svg>
)

export const WreckingBallIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M5 3v9" />
    <circle cx="15" cy="16" r="5" />
    <path d="M5 12l10 4" />
  </svg>
)

export const CeilingGridIcon = (p) => (
  <svg {...base} {...p}>
    <rect x="3.5" y="5" width="17" height="11" rx="1" />
    <path d="M3.5 9h17M3.5 12.5h17M9 5v11M15 5v11" />
  </svg>
)

export const KitchenIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M5 11h14v6a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-6Z" />
    <path d="M3 11h2M19 11h2" />
    <path d="M9 4c0 1.2-1.5 1.2-1.5 2.4M13.5 4c0 1.2-1.5 1.2-1.5 2.4M17 5c0 1-1.2 1-1.2 2" />
  </svg>
)

export const BathIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M4 12h16v2a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-2Z" />
    <path d="M6 12V6a2 2 0 0 1 3.5-1.3" />
    <path d="M7 21v1M16 21v1" />
  </svg>
)

export const WindowGridIcon = (p) => (
  <svg {...base} {...p}>
    <rect x="4" y="4" width="16" height="16" rx="1" />
    <path d="M12 4v16M4 12h16" />
  </svg>
)

export const SofaIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M5 12V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4" />
    <path d="M3 12h18v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4Z" />
    <path d="M5 17v3M19 17v3" />
  </svg>
)

export const GlassPaneIcon = (p) => (
  <svg {...base} {...p}>
    <rect x="4" y="3" width="16" height="18" rx="1" />
    <path d="M4 9h16M8 3v18" />
  </svg>
)

export const CurtainIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M4 4h16" />
    <path d="M6 4c0 6-2 8-2 14M12 4c0 6 2 8 2 14M18 4c0 6-2 8-2 14" />
  </svg>
)

export const SoundwaveIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M4 12v0M8 9v6M12 5v14M16 9v6M20 12v0" />
  </svg>
)

export const SunPanelIcon = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="7" r="3" />
    <path d="M12 1v1.5M6 4l1 1M18 4l-1 1" />
    <rect x="4" y="13" width="16" height="8" rx="1" />
    <path d="M4 17h16M9.3 13v8M14.7 13v8" />
  </svg>
)

export const CameraIcon = (p) => (
  <svg {...base} {...p}>
    <rect x="2.5" y="8" width="13" height="9" rx="1.5" />
    <circle cx="9" cy="12.5" r="2.6" />
    <path d="M15.5 11l5-2.5v8L15.5 14" />
  </svg>
)

export const SmartHomeIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M4 11.5 12 5l8 6.5" />
    <path d="M6 10.5V19h12v-8.5" />
    <path d="M9 5.2a8 8 0 0 1 6 0" />
  </svg>
)

export const BugIcon = (p) => (
  <svg {...base} {...p}>
    <ellipse cx="12" cy="13" rx="4.2" ry="6" />
    <path d="M12 7V4M10.2 5l-1.4-1.4M13.8 5l1.4-1.4" />
    <path d="M7.8 10.5H4M7.8 14.5H4M7.8 18l-2.3 2M16.2 10.5H20M16.2 14.5H20M16.2 18l2.3 2" />
    <path d="M12 9v8" />
  </svg>
)

export const TankIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M6 6a6 3 0 0 1 12 0v11a6 3 0 0 1-12 0V6Z" />
    <path d="M6 6a6 3 0 0 0 12 0" />
  </svg>
)

export const DrillIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M3 14l6-6 3 3-6 6-3-3Z" />
    <path d="M12 11l3-3 5 2-4 4-2-1" />
    <path d="M4 20l3-3" />
  </svg>
)

export const ShovelIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M17 3 8 12" />
    <path d="M4 20a3 3 0 0 0 4.2 0L14 14.2a3 3 0 0 0 0-4.2L12.5 8.5a3 3 0 0 0-4.2 0L2.5 14.3" />
  </svg>
)

export const RoadIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M8 3 4 21M16 3l4 18" />
    <path d="M12 4v2M11.4 9.5v2M10.8 15v2" />
  </svg>
)

export const InsulationIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M3 6c2 2 4-2 6 0s4-2 6 0 4-2 6 0" />
    <path d="M3 12c2 2 4-2 6 0s4-2 6 0 4-2 6 0" />
    <path d="M3 18c2 2 4-2 6 0s4-2 6 0 4-2 6 0" />
  </svg>
)

export const GeneratorIcon = (p) => (
  <svg {...base} {...p}>
    <rect x="3" y="7" width="18" height="10" rx="1.5" />
    <path d="M13 10l-2.5 3H13l-2.5 3" />
    <circle cx="18" cy="12" r="1.4" />
  </svg>
)

export const PoolIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M3 16c1.5 1.3 3 1.3 4.5 0s3-1.3 4.5 0 3 1.3 4.5 0 3-1.3 4.5 0" />
    <path d="M3 20c1.5 1.3 3 1.3 4.5 0s3-1.3 4.5 0 3 1.3 4.5 0 3-1.3 4.5 0" />
    <path d="M6 12V6a2 2 0 0 1 2-2h3v6M17 12V8" />
  </svg>
)

export const GasIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M9 3v4M9 3c-2 2-4 5-4 8a4 4 0 0 0 8 0c0-2-1-3.5-2-5" />
    <path d="M13 20h8M15 16h4M17 20v-8" />
  </svg>
)

export const PipeFlowIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M4 6h8a4 4 0 0 1 4 4v8" />
    <path d="M13 15l3 3 3-3" />
    <circle cx="4" cy="6" r="1.4" fill="currentColor" stroke="none" />
  </svg>
)

export const MixerIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M7 4h6l4 4-6 12H9L5 12l2-8Z" />
    <path d="M9 4l2 8-3 8M13 4l-1 8" />
    <circle cx="17" cy="19" r="1.5" />
    <circle cx="6" cy="19" r="1.5" />
  </svg>
)

export const RebarMeshIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M3 6h18M3 12h18M3 18h18" />
    <path d="M7 3v18M12 3v18M17 3v18" />
  </svg>
)

export const TrowelIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M15 3 21 9l-9 9-3-3" />
    <path d="M9 15 4 20l-1-3 4-5" />
  </svg>
)

export const ScaffoldIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M4 3v18M20 3v18M4 8h16M4 16h16M4 3l16 5M20 3 4 8M4 11l16 5M20 11 4 16" />
  </svg>
)

export const CompassIcon = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m15 9-2 6-6 2 2-6 6-2Z" />
  </svg>
)

export const SoilCoreIcon = (p) => (
  <svg {...base} {...p}>
    <rect x="9" y="2" width="6" height="20" rx="1" />
    <path d="M9 7h6M9 12h6M9 17h6" />
  </svg>
)

export const ExcavatorIcon = (p) => (
  <svg {...base} {...p}>
    <circle cx="7" cy="18" r="2.2" />
    <circle cx="15" cy="18" r="2.2" />
    <path d="M3 18h1M17.5 18h3.5v-3H9v3" />
    <path d="M9 15 6 6l9-1-4 6 5 1-5 4" />
  </svg>
)

export const BroomIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M14 3 6 19" />
    <path d="M13 5l6 3-9 3-5-2 5-2 3-2Z" />
    <path d="M9 14l-5 6M11 14l-4 6M13.5 13.5 10 20" />
  </svg>
)

export const TrashIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M4 7h16" />
    <path d="M9 7V4h6v3" />
    <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
    <path d="M10 11v6M14 11v6" />
  </svg>
)

export const SignpostIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M6 21V9" />
    <path d="M6 5v4h9l-2-2 2-2H6Z" />
  </svg>
)

export const CartIcon = (p) => (
  <svg {...base} {...p}>
    <circle cx="9" cy="20" r="1.3" />
    <circle cx="17" cy="20" r="1.3" />
    <path d="M2.5 3h2l2.4 12.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 7H6" />
  </svg>
)

export const CheckCircleIcon = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12.5 2.3 2.3L16 10" />
  </svg>
)

export const GridIcon = (p) => (
  <svg {...base} {...p}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.2" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.2" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.2" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.2" />
  </svg>
)

export const SearchIcon = (p) => (
  <svg {...base} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
)

export const ICON_MAP = {
  house: HouseIcon,
  wall: WallIcon,
  bolt: BoltIcon,
  wrench: WrenchIcon,
  brick: BrickIcon,
  hammer: HammerIcon,
  roller: RollerIcon,
  layers: LayersIcon,
  roof: RoofIcon,
  door: DoorIcon,
  beam: BeamIcon,
  truss: TrussIcon,
  snowflake: SnowflakeIcon,
  elevator: ElevatorIcon,
  dropletShield: DropletShieldIcon,
  gear: GearIcon,
  flameShield: FlameShieldIcon,
  palette: PaletteIcon,
  tree: TreeIcon,
  wreckingBall: WreckingBallIcon,
  ceilingGrid: CeilingGridIcon,
  kitchen: KitchenIcon,
  bath: BathIcon,
  windowGrid: WindowGridIcon,
  sofa: SofaIcon,
  glassPane: GlassPaneIcon,
  curtain: CurtainIcon,
  soundwave: SoundwaveIcon,
  sunPanel: SunPanelIcon,
  camera: CameraIcon,
  smartHome: SmartHomeIcon,
  bug: BugIcon,
  tank: TankIcon,
  drill: DrillIcon,
  shovel: ShovelIcon,
  road: RoadIcon,
  insulation: InsulationIcon,
  generator: GeneratorIcon,
  pool: PoolIcon,
  gas: GasIcon,
  pipeFlow: PipeFlowIcon,
  mixer: MixerIcon,
  rebarMesh: RebarMeshIcon,
  trowel: TrowelIcon,
  scaffold: ScaffoldIcon,
  compass: CompassIcon,
  soilCore: SoilCoreIcon,
  excavator: ExcavatorIcon,
  broom: BroomIcon,
  trash: TrashIcon,
  signpost: SignpostIcon,
}
