// src/components/ui/icons.tsx
import * as React from 'react'
import type { IconProps as PhosphorProps, IconWeight } from '@phosphor-icons/react'
import {
  ArrowBendUpRightIcon,
  ArrowClockwiseIcon,
  ArrowCounterClockwiseIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowSquareOutIcon,
  ArrowUUpLeftIcon,
  ArrowUpRightIcon,
  ArrowsClockwiseIcon,
  ArrowsDownUpIcon,
  ArrowsLeftRightIcon,
  ArrowsOutIcon,
  BatteryChargingIcon,
  BatteryFullIcon,
  BatteryLowIcon,
  BedIcon,
  BellIcon,
  BookmarkSimpleIcon,
  BuildingIcon,
  BuildingOfficeIcon,
  BuildingsIcon,
  CalendarCheckIcon,
  CalendarDotsIcon,
  CalendarIcon,
  CameraIcon,
  CarIcon,
  CaretDownIcon,
  CaretLeftIcon,
  CaretRightIcon,
  ChartBarIcon,
  ChatCircleIcon,
  ChatIcon,
  CheckCircleIcon,
  CheckIcon,
  CircleNotchIcon,
  ClockIcon,
  CoffeeIcon,
  CopyIcon,
  CrosshairIcon,
  DatabaseIcon,
  DeviceMobileIcon,
  DoorOpenIcon,
  EnvelopeIcon,
  EyeIcon,
  EyeSlashIcon,
  FileMagnifyingGlassIcon,
  FlagIcon,
  FlameIcon,
  FloppyDiskIcon,
  ForkKnifeIcon,
  FunnelIcon,
  FunnelSimpleIcon,
  GaugeIcon,
  GearIcon,
  GitDiffIcon,
  GlobeIcon,
  GpsFixIcon,
  GridFourIcon,
  HandshakeIcon,
  HeartIcon,
  HouseIcon,
  ImageBrokenIcon,
  ImageIcon,
  ImageSquareIcon,
  ImagesIcon,
  InfoIcon,
  LetterCirclePIcon,
  LifebuoyIcon,
  LightningIcon,
  LinkIcon,
  LinkSimpleIcon,
  ListIcon,
  LockIcon,
  MagnifyingGlassIcon,
  MagnifyingGlassMinusIcon,
  MapPinAreaIcon,
  MapPinIcon,
  MapTrifoldIcon,
  MinusIcon,
  MoneyIcon,
  NavigationArrowIcon,
  NewspaperIcon,
  NotePencilIcon,
  PackageIcon,
  PaperPlaneTiltIcon,
  PathIcon,
  PencilSimpleIcon,
  PhoneIcon,
  PlugChargingIcon,
  PlugIcon,
  PlugsConnectedIcon,
  PlusIcon,
  ProhibitIcon,
  PulseIcon,
  QuestionIcon,
  ReceiptIcon,
  RowsIcon,
  SealCheckIcon,
  ShareNetworkIcon,
  ShieldCheckIcon,
  ShieldIcon,
  ShieldWarningIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  SidebarIcon,
  SidebarSimpleIcon,
  SignOutIcon,
  SlidersHorizontalIcon,
  SquaresFourIcon,
  StackIcon,
  StarIcon,
  StorefrontIcon,
  TagIcon,
  ThumbsUpIcon,
  TimerIcon,
  TrashIcon,
  TrayIcon,
  TrendDownIcon,
  TrendUpIcon,
  TrophyIcon,
  UploadSimpleIcon,
  UserCircleIcon,
  UserIcon,
  UserPlusIcon,
  UsersIcon,
  WarningCircleIcon,
  WarningIcon,
  WifiHighIcon,
  WrenchIcon,
  XCircleIcon,
  XIcon,
  XLogoIcon,
} from '@phosphor-icons/react/dist/ssr'

/**
 * Every icon on the site, drawn by Phosphor.
 *
 * ── Why a registry, and why it keeps Lucide's names ───────────────────
 *
 * The site was drawn in Lucide and moved to Phosphor for its finer, more
 * even strokes and fuller shapes. 169 files used 137 Lucide icons, and a
 * find-and-replace across all of them would have meant renaming every call
 * site — `<Search />` to `<MagnifyingGlassIcon />`, `<Zap />` to
 * `<LightningIcon />` — in code other people are actively editing.
 *
 * Instead each file changes one import line and nothing else. The names here
 * are the ones the code already uses, each pointing at its Phosphor
 * counterpart, so this file is also the single place that decides which
 * Phosphor glyph stands for which idea. Swapping one icon site-wide is one
 * line below.
 *
 * ── The three Lucide habits it translates ─────────────────────────────
 *
 *   fill      A Lucide icon is strokes, so `className="fill-amber-400"`
 *             painted its inside and made a solid star. A Phosphor icon is
 *             already filled paths — the same class would only recolour the
 *             outline. So a `fill-*` class or a `fill` prop switches the
 *             icon to Phosphor's own `fill` weight. This reads the final
 *             className at render time, which is why a conditional fill — a
 *             heart that fills when liked — keeps working with no change at
 *             the call site.
 *
 *   stroke    `strokeWidth` means nothing to filled paths. It is mapped to
 *             a weight instead: 1.6 and under is `light`, 2.4 and over is
 *             `bold`, everything between is `regular`.
 *
 *   size      Lucide defaults to 24px; Phosphor defaults to 1em. Left alone,
 *             every icon without a size would have shrunk to the font size
 *             around it, so the default here is 24 — the size every icon was
 *             drawn at before.
 *
 * Server-safe: the SSR build of Phosphor carries no React context, and
 * nothing here uses a hook, so these render in server components too.
 */

export interface AppIconProps extends Omit<PhosphorProps, 'weight'> {
  weight?: IconWeight
  /** Lucide's stroke control, translated to a weight. */
  strokeWidth?: number | string
  /** Lucide-only. Accepted so old call sites type-check; has no effect. */
  absoluteStrokeWidth?: boolean
}

export type IconType = React.ForwardRefExoticComponent<
  AppIconProps & React.RefAttributes<SVGSVGElement>
>

/*
  Unprefixed only. `hover:fill-x` would mean "solid on hover", and forcing
  the fill weight for it would draw the icon solid at rest in its text colour.
  Nothing on the site uses a prefixed fill today; if one appears it renders
  as an outline, which is the safe way to be wrong.
*/
const SOLID_CLASS = /(?:^|\s)fill-(?!none\b)/

function weightFor(
  className: string | undefined,
  fill: string | undefined,
  strokeWidth: number | string | undefined,
): IconWeight {
  if ((fill && fill !== 'none') || SOLID_CLASS.test(className ?? '')) return 'fill'
  if (strokeWidth == null) return 'regular'
  const n = Number(strokeWidth)
  if (n <= 1.6) return 'light'
  if (n >= 2.4) return 'bold'
  return 'regular'
}

function adapt(Glyph: React.ElementType, name: string): IconType {
  const Adapted = React.forwardRef<SVGSVGElement, AppIconProps>(function Icon(
    { className, fill, strokeWidth, absoluteStrokeWidth: _absolute, weight, size = 24, ...rest },
    ref,
  ) {
    return (
      <Glyph
        ref={ref}
        size={size}
        className={className}
        weight={weight ?? weightFor(className, fill as string | undefined, strokeWidth)}
        {...rest}
      />
    )
  })
  Adapted.displayName = name
  return Adapted
}

export const Activity = adapt(PulseIcon, 'Activity')
export const AlertCircle = adapt(WarningCircleIcon, 'AlertCircle')
export const AlertTriangle = adapt(WarningIcon, 'AlertTriangle')
export const ArrowLeft = adapt(ArrowLeftIcon, 'ArrowLeft')
export const ArrowRight = adapt(ArrowRightIcon, 'ArrowRight')
export const ArrowUpDown = adapt(ArrowsDownUpIcon, 'ArrowUpDown')
export const ArrowUpRight = adapt(ArrowUpRightIcon, 'ArrowUpRight')
export const BadgeCheck = adapt(SealCheckIcon, 'BadgeCheck')
export const Banknote = adapt(MoneyIcon, 'Banknote')
export const BarChart2 = adapt(ChartBarIcon, 'BarChart2')
export const BarChart3 = adapt(ChartBarIcon, 'BarChart3')
export const Battery = adapt(BatteryFullIcon, 'Battery')
export const BatteryCharging = adapt(BatteryChargingIcon, 'BatteryCharging')
export const BatteryLow = adapt(BatteryLowIcon, 'BatteryLow')
export const Bed = adapt(BedIcon, 'Bed')
export const Bell = adapt(BellIcon, 'Bell')
export const Bookmark = adapt(BookmarkSimpleIcon, 'Bookmark')
export const BookmarkCheck = adapt(BookmarkSimpleIcon, 'BookmarkCheck')
export const Building = adapt(BuildingIcon, 'Building')
export const Building2 = adapt(BuildingsIcon, 'Building2')
export const Cable = adapt(PlugsConnectedIcon, 'Cable')
export const Calendar = adapt(CalendarIcon, 'Calendar')
export const CalendarCheck = adapt(CalendarCheckIcon, 'CalendarCheck')
export const CalendarClock = adapt(CalendarDotsIcon, 'CalendarClock')
export const Camera = adapt(CameraIcon, 'Camera')
export const Car = adapt(CarIcon, 'Car')
export const Check = adapt(CheckIcon, 'Check')
export const CheckCircle2 = adapt(CheckCircleIcon, 'CheckCircle2')
export const ChevronDown = adapt(CaretDownIcon, 'ChevronDown')
export const ChevronLeft = adapt(CaretLeftIcon, 'ChevronLeft')
export const ChevronRight = adapt(CaretRightIcon, 'ChevronRight')
export const CircleSlash = adapt(ProhibitIcon, 'CircleSlash')
export const Clock = adapt(ClockIcon, 'Clock')
export const Coffee = adapt(CoffeeIcon, 'Coffee')
export const Copy = adapt(CopyIcon, 'Copy')
export const CornerUpRight = adapt(ArrowBendUpRightIcon, 'CornerUpRight')
export const Crosshair = adapt(CrosshairIcon, 'Crosshair')
export const Database = adapt(DatabaseIcon, 'Database')
export const DoorOpen = adapt(DoorOpenIcon, 'DoorOpen')
export const ExternalLink = adapt(ArrowSquareOutIcon, 'ExternalLink')
export const Eye = adapt(EyeIcon, 'Eye')
export const EyeOff = adapt(EyeSlashIcon, 'EyeOff')
export const FileQuestion = adapt(FileMagnifyingGlassIcon, 'FileQuestion')
export const Filter = adapt(FunnelIcon, 'Filter')
export const Flag = adapt(FlagIcon, 'Flag')
export const Flame = adapt(FlameIcon, 'Flame')
export const Gauge = adapt(GaugeIcon, 'Gauge')
export const GitCompare = adapt(GitDiffIcon, 'GitCompare')
export const GitCompareArrows = adapt(ArrowsLeftRightIcon, 'GitCompareArrows')
export const Globe = adapt(GlobeIcon, 'Globe')
export const Handshake = adapt(HandshakeIcon, 'Handshake')
export const Heart = adapt(HeartIcon, 'Heart')
export const HelpCircle = adapt(QuestionIcon, 'HelpCircle')
export const Home = adapt(HouseIcon, 'Home')
export const Hotel = adapt(BuildingOfficeIcon, 'Hotel')
export const Image = adapt(ImageIcon, 'Image')
export const ImageOff = adapt(ImageBrokenIcon, 'ImageOff')
export const ImagePlus = adapt(ImageSquareIcon, 'ImagePlus')
export const Images = adapt(ImagesIcon, 'Images')
export const Inbox = adapt(TrayIcon, 'Inbox')
export const Info = adapt(InfoIcon, 'Info')
export const Layers = adapt(StackIcon, 'Layers')
export const LayoutDashboard = adapt(SquaresFourIcon, 'LayoutDashboard')
export const LayoutGrid = adapt(GridFourIcon, 'LayoutGrid')
export const LayoutList = adapt(RowsIcon, 'LayoutList')
export const LifeBuoy = adapt(LifebuoyIcon, 'LifeBuoy')
export const Link = adapt(LinkIcon, 'Link')
export const Link2 = adapt(LinkSimpleIcon, 'Link2')
export const List = adapt(ListIcon, 'List')
export const ListFilter = adapt(FunnelSimpleIcon, 'ListFilter')
export const Loader2 = adapt(CircleNotchIcon, 'Loader2')
export const LocateFixed = adapt(GpsFixIcon, 'LocateFixed')
export const Lock = adapt(LockIcon, 'Lock')
export const LogOut = adapt(SignOutIcon, 'LogOut')
export const Mail = adapt(EnvelopeIcon, 'Mail')
export const Map = adapt(MapTrifoldIcon, 'Map')
export const MapPin = adapt(MapPinIcon, 'MapPin')
export const MapPinned = adapt(MapPinAreaIcon, 'MapPinned')
export const Maximize2 = adapt(ArrowsOutIcon, 'Maximize2')
export const Menu = adapt(ListIcon, 'Menu')
export const MessageCircle = adapt(ChatCircleIcon, 'MessageCircle')
export const MessageSquare = adapt(ChatIcon, 'MessageSquare')
export const Minus = adapt(MinusIcon, 'Minus')
export const Navigation = adapt(NavigationArrowIcon, 'Navigation')
export const Navigation2 = adapt(NavigationArrowIcon, 'Navigation2')
export const Newspaper = adapt(NewspaperIcon, 'Newspaper')
export const Package = adapt(PackageIcon, 'Package')
export const PanelLeftClose = adapt(SidebarSimpleIcon, 'PanelLeftClose')
export const PanelLeftOpen = adapt(SidebarIcon, 'PanelLeftOpen')
export const ParkingSquare = adapt(LetterCirclePIcon, 'ParkingSquare')
export const PenSquare = adapt(NotePencilIcon, 'PenSquare')
export const Pencil = adapt(PencilSimpleIcon, 'Pencil')
export const Phone = adapt(PhoneIcon, 'Phone')
export const Plug = adapt(PlugIcon, 'Plug')
export const PlugZap = adapt(PlugChargingIcon, 'PlugZap')
export const Plus = adapt(PlusIcon, 'Plus')
export const Receipt = adapt(ReceiptIcon, 'Receipt')
export const RefreshCw = adapt(ArrowsClockwiseIcon, 'RefreshCw')
export const RotateCcw = adapt(ArrowCounterClockwiseIcon, 'RotateCcw')
export const RotateCw = adapt(ArrowClockwiseIcon, 'RotateCw')
export const Route = adapt(PathIcon, 'Route')
export const Save = adapt(FloppyDiskIcon, 'Save')
export const Search = adapt(MagnifyingGlassIcon, 'Search')
export const SearchX = adapt(MagnifyingGlassMinusIcon, 'SearchX')
export const Send = adapt(PaperPlaneTiltIcon, 'Send')
export const Settings = adapt(GearIcon, 'Settings')
export const Share2 = adapt(ShareNetworkIcon, 'Share2')
export const Shield = adapt(ShieldIcon, 'Shield')
export const ShieldAlert = adapt(ShieldWarningIcon, 'ShieldAlert')
export const ShieldCheck = adapt(ShieldCheckIcon, 'ShieldCheck')
export const ShoppingBag = adapt(ShoppingBagIcon, 'ShoppingBag')
export const ShoppingCart = adapt(ShoppingCartIcon, 'ShoppingCart')
export const SlidersHorizontal = adapt(SlidersHorizontalIcon, 'SlidersHorizontal')
export const Smartphone = adapt(DeviceMobileIcon, 'Smartphone')
export const Star = adapt(StarIcon, 'Star')
export const Store = adapt(StorefrontIcon, 'Store')
export const Tag = adapt(TagIcon, 'Tag')
export const ThumbsUp = adapt(ThumbsUpIcon, 'ThumbsUp')
export const Timer = adapt(TimerIcon, 'Timer')
export const Trash2 = adapt(TrashIcon, 'Trash2')
export const TrendingDown = adapt(TrendDownIcon, 'TrendingDown')
export const TrendingUp = adapt(TrendUpIcon, 'TrendingUp')
export const Trophy = adapt(TrophyIcon, 'Trophy')
export const Twitter = adapt(XLogoIcon, 'Twitter')
export const Undo2 = adapt(ArrowUUpLeftIcon, 'Undo2')
export const Upload = adapt(UploadSimpleIcon, 'Upload')
export const User = adapt(UserIcon, 'User')
export const UserCircle = adapt(UserCircleIcon, 'UserCircle')
export const UserPlus = adapt(UserPlusIcon, 'UserPlus')
export const Users = adapt(UsersIcon, 'Users')
export const Utensils = adapt(ForkKnifeIcon, 'Utensils')
export const UtensilsCrossed = adapt(ForkKnifeIcon, 'UtensilsCrossed')
export const Wifi = adapt(WifiHighIcon, 'Wifi')
export const Wrench = adapt(WrenchIcon, 'Wrench')
export const X = adapt(XIcon, 'X')
export const XCircle = adapt(XCircleIcon, 'XCircle')
export const Zap = adapt(LightningIcon, 'Zap')
