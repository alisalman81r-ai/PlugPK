# Plug.pk — Design System

The design language of plug.pk, written down so the mobile app looks and behaves like the
website. Every value here is taken from the website's code (`tailwind.config.ts`,
`src/app/globals.css`, `src/components/ui/*`, `src/components/shared/frame.ts` and the
screens themselves). If the app and this document disagree, the website wins. Check the
source file named in each section and update this document.

> **How to read this.** Values are given in px (1rem = 16px). Tailwind class names from
> the website are shown in `code` so a developer can trace each value back to the code. Notes
> marked **App** are adaptations for a native app. They follow the website's rules and are
> not separate decisions.

---

## 1. Principles

1. **Forest, not black. Mist, not white.** Body type is deep forest `#0B332C` and page
   grounds are mist greys. That green tint across every neutral is most of what makes the
   brand recognisable.
2. **Turquoise is a highlight, not a fill.** `#26CDB2` marks hover and press states,
   focus, the active item and one highlighted phrase per headline. It is never body text
   on a light background and never carries white text.
3. **Prominence comes from edge, depth and space.** It never comes from painting a card.
   Cards are white faces with a hairline graded edge and a soft pine-tinted shadow.
4. **Dark bands, light pages.** Each section opens with a pine hero band whose bottom
   corners are rounded. The page's first white card is lifted up into that band.
5. **Honest data.** Never show a number, status or claim the data can't back up. Show an
   em dash (`—`) where a figure will go, write "Example listing" on sample data, and use
   a sentence instead of a stat when the count is zero. This is a design rule, not just a
   copy rule: it decides what a component may show.
6. **Touch first.** Every tappable thing is at least **44 × 44px**. Nothing is set
   smaller than **12px** type.
7. **Motion confirms, it doesn't perform.** Use short travel (10–14px), compositor-only
   properties (opacity, transform), and always respect reduced motion.

---

## 2. Color

### 2.1 Core palette (the ten brand colors)

| Name | Hex | Role |
|---|---|---|
| Mist | `#E9EEEC` | Page ground (alt), quiet fills, scrollbar track |
| Deep Forest | `#0B332C` | Headings, body type, **primary buttons**, links |
| Ink | `#0D1817` | Darkest surface (`dark.base`) |
| Pine | `#05241E` | Navbar, hero bands, menus, modals on dark |
| Cool Gray | `#989FA1` | Placeholders, decorative icons |
| Slate | `#727C7A` | Visible borders, large muted type only (4.3:1 on white) |
| Silver Sage | `#BAC2C0` | Borders, dividers, disabled, outline numerals |
| Mineral | `#345A53` | Secondary type, borders on dark, gradient end |
| Aero Mint | `#C4F8EC` | Tinted badges and chips, text selection |
| Turquoise | `#26CDB2` | **The accent** |

### 2.2 Neutral scale (`slate-*`)

Green-tinted. The dark end runs into the brand greens on purpose.

| Step | Hex | Typical use |
|---|---|---|
| 0 | `#FFFFFF` | Card faces, inputs |
| 25 | `#FAFBFA` | |
| 50 | `#F1F4F3` | **App background** (`--color-bg`), disabled field fill, subtle row fill |
| 100 | `#E9EEEC` | Mist: alt ground, skeleton base, segmented-control track |
| 200 | `#DCE3E0` | **Default border** (`--color-border`), card hairline, empty meter segment |
| 300 | `#BAC2C0` | Secondary-button border, stronger divider |
| 400 | `#989FA1` | Placeholder text, inactive icon, meta text |
| 450 | `#727C7A` | Large muted type and borders only |
| 500 | `#626D6B` | **Muted body text** (5.4:1 on white), inactive tab label |
| 600 | `#4A5A57` | Secondary text, disabled-button label |
| 700 | `#345A53` | Strong secondary text, form labels |
| 800 | `#1A3F38` | Hover on dark bands |
| 900 | `#0B332C` | **Primary text** (= Deep Forest) |
| 950 | `#05241E` | Pine |

### 2.3 Action scale (`plug-blue-*`)

Despite the name, this scale is forest-and-mint, not blue.

| Step | Hex | Use |
|---|---|---|
| 50 | `#EDFCF8` | Active tab pill, selected row/chip fill, CCS2 badge fill |
| 100 | `#C4F8EC` | Mint tint |
| 200 | `#A3EBDB` | Selected chip border, card hover border |
| 300 | `#6FDCC6` | Selected amenity border, headline gradient start |
| 400 | `#3FD4BC` | Selected filter-chip border, headline gradient end |
| 500 | `#26CDB2` | **Focus ring**, accent borders |
| 600 | `#0B332C` | **Primary button / link / active icon** |
| 700 | `#05241E` | Pressed primary, selected chip text |
| 800–950 | `#041C17` `#03140F` `#020D0B` | Rare deep tones |

### 2.4 Accent scale (`plug-cyan-*`)

| Step | Hex | Use |
|---|---|---|
| 50 | `#EDFCF8` | |
| 100 | `#D8FBF2` | |
| 200 | `#C4F8EC` | Type 2 badge border |
| 300 | `#8EEEDA` | Headline gradient start (`from-plug-cyan-300`) |
| 400 | `#4FDCC4` | Navbar CTA fill, check icons on dark |
| 500 | `#26CDB2` | Turquoise: button hover fill |
| 600 | `#159E89` | Accent as text on white (large only), light-tone logo accent |
| 700 | `#0F7A6A` | **Accent as text on white** (5.2:1): eyebrows, Type 2 text |
| 800 | `#345A53` | |
| 900 | `#0B332C` | |

### 2.5 Dark grounds

| Token | Hex | Use |
|---|---|---|
| `plug-navy-950` | `#05241E` | Navbar, hero bands, mobile menu, footer panel uses `#031914` |
| `plug-navy-900` | `#0B332C` | Dark card |
| `plug-navy-800` | `#1A3F38` | Hover on dark |
| `plug-navy-700` | `#345A53` | Borders on dark |
| `dark.base` | `#0D1817` | Deepest surface |
| Footer panel | `#031914` | Footer "curtain" panel |
| Footer reveal | `#10362C` | Layer under the footer panel |

Text on dark grounds uses white at fixed opacities:

| Opacity | Use |
|---|---|
| `white` 100% | Headlines, figures, primary labels |
| `white/70` | Body copy on dark (min. for real sentences) |
| `white/65` | Hero subtitle |
| `white/55` | Stat labels (5.6:1; **never lower for 12px text**) |
| `white/40` | Section labels in the menu, footnotes |
| `white/10` | Dividers, hover fill |
| `white/[0.06]` | Account card in the menu |
| `white/[0.08]` | Navbar bottom border, dark card border |

### 2.6 Semantic colors

| Meaning | Text | Fill | Border | Dot |
|---|---|---|---|---|
| Success / Available | `#15803D` green-700 | `#F0FDF4` green-50 | `#BBF7D0` green-200 | `#22C55E` |
| Warning / Limited | `#B45309` amber-700 | `#FFFBEB` amber-50 | `#FDE68A` amber-200 | `#F59E0B` |
| Error / Offline | `#B91C1C` red-700 | `#FEF2F2` red-50 | `#FECACA` red-200 | `#EF4444` |
| Unknown | slate-600 | slate-50 | slate-200 | `#989FA1` |
| Destructive button | white on `#DC2626` red-600, hover `#B91C1C` | | | |
| Error field | `#EF4444` border, `#DC2626` message | | | |
| Rating stars | `#FBBF24` amber-400 filled, slate-200 empty | | | |

Tailwind's own `blue` is **left as stock blue**. It is reserved for the admin "limited"
station status, because a status must never share a hue with the brand.

### 2.7 Gradients

| Token | Value | Rule |
|---|---|---|
| `gradient-brand` | `linear-gradient(90deg, #0B332C, #345A53)` | Carries white text (avatars, Navigate button) |
| `gradient-accent` | `linear-gradient(90deg, #0B332C, #26CDB2)` | Fills with **no text**: progress bars, rules |
| `gradient-hero` | `linear-gradient(135deg, #0D1817 0%, #05241E 55%, #0B332C 100%)` | Dark hero grounds |
| `gradient-dark` | `linear-gradient(135deg, #0D1817, #05241E)` | |
| `gradient-card` | `linear-gradient(180deg, #FFFFFF, #F1F4F3)` | |
| Headline highlight | `linear-gradient(90deg, #8EEEDA, #3FD4BC)` clipped to text | **The last phrase** of a hero headline only |
| Featured card edge | `linear-gradient(to bottom, #0B332C, #26CDB2, #C4F8EC)` | The one "already chosen" card |

### 2.8 Contrast rules (non-negotiable)

- Turquoise on white is **2.0:1**, so never use it as text on light grounds.
- White on turquoise is **2.0:1**, so a turquoise fill takes **forest text** (6.9:1).
- Turquoise text is fine **on forest or pine** (6.9:1 / 8.2:1).
- Muted text is **slate-500** (`#626D6B`), never slate-450 or 400, at body size.
- Uppercase 12px labels on dark: **white/55 minimum**.
- Selection highlight: mint `#C4F8EC` background with forest `#0B332C` text.

### 2.9 Theme

The product is **light-first with dark bands**, not a light/dark pair. There's no
user-facing dark mode. **App:** ship light only, keep the pine bands, and match the
status bar to the band under it (light content over pine, dark content over mist).

---

## 3. Typography

### 3.1 Families

| Role | Family | Weights shipped | Fallback |
|---|---|---|---|
| Everything (UI, body, headings) | **Figtree** | 400, 500, 600, 700 | system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial |
| Figures and technical text | **JetBrains Mono** | 400, 500, 600, 700 | ui-monospace, SFMono-Regular, Menlo |

The font files are in `src/app/fonts/*.woff2`. **App:** bundle the same eight files.

- There is **no weight above 700**. `font-black` and `font-extrabold` both resolve to 700.
- Headings get `letter-spacing: -0.012em` and balanced wrapping by default.
- **Use mono for:** kW figures, port counts ("2/4 free"), distances, stat-rail numbers,
  times ("~2h 15m"), dates in route cards, slugs, sort captions ("newest first"), and
  connector codes in spec tiles ("DC", "AC").
- **Don't use mono for:** big outline numerals (JetBrains' dotted zero reads as a bullet), prices
  (sans bold), or headings.

### 3.2 UI scale (dense product UI)

| Token | Size / line height | Use |
|---|---|---|
| `ui-xs` | **12 / 18** | Badge text, table meta, eyebrows, tab labels. **The floor.** |
| `ui-sm` | 13 / 20 | Secondary lines, captions, distances, small buttons |
| `ui` | **15 / 24** | **Default body size** in product UI, inputs, md buttons |
| `ui-lg` | 17 / 26 | Card titles |
| `base` | 16 / 24 | lg buttons, prose |
| `lg` | 18 / 28 | Section subtitles, logo in sheets |
| `xl` | 20 / 28 | Feature card titles (bold) |
| `2xl` | 24 / 32 | Page titles in dashboards, card-section headers |

### 3.3 Display scale

All are semibold (600) with tight leading and negative tracking.

| Token | Size | Line height | Tracking |
|---|---|---|---|
| `display-2xl` | 72 | 1.02 | -0.035em |
| `display-xl` | 60 | 1.05 | -0.03em |
| `display-lg` | 48 | 1.10 | -0.025em |
| `display-md` | 36 | 1.15 | -0.02em |
| `display-sm` | 30 | 1.20 | -0.015em |

### 3.4 Type recipes (use these exact combinations)

| Element | Recipe |
|---|---|
| **Hero headline** (on pine) | `clamp(32px → 52px)`, **bold 700**, leading 1.08, tracking tight (-0.025em), white, centered, balanced. On phones: **32px**. Last phrase in the headline gradient (§2.7). |
| Hero subtitle | 15px (16px from 640px), leading relaxed (1.625), white/65, max ~42rem, centered |
| Section title | 28px bold, leading tight → `display-md` (36) on tablet+. Forest. |
| Section subtitle | 18px, leading relaxed, slate-500 |
| **Eyebrow (light)** | 12px **bold uppercase**, tracking **0.14em**, forest `plug-blue-600`, often with a 13px icon, 8px gap, 6px below |
| Eyebrow (centered section) | 12–13px bold uppercase, tracking 0.16–0.18em, `plug-cyan-700` (`#0F7A6A`), icon before |
| Card title | 17px (`ui-lg`) or 20px bold, tracking tight |
| Body | 15px regular, slate-500 for secondary copy, forest for primary |
| Form label | 14px medium, slate-700, 6px above the field |
| Field hint / error | 14px; hint slate-500, error red-600 with a 15px alert icon |
| Stat figure (on dark) | Mono 18px bold white, with a 14px icon before it (turquoise for the highlighted stat, white/40 for the others) |
| Stat label (on dark) | 12px uppercase, tracking 0.12em, white/55, 2px below the figure |
| Price | Sans bold. On car cards 15px on phones (allowed to wrap); 17–20px on wider cards |
| Brand line on a car card | 12px bold uppercase tracking 0.12em, slate-400 |
| Outline numeral (step cards) | Sans 72px, 700, tracking -0.04em, transparent fill, **2px stroke `#BAC2C0`** → `#26CDB2` on hover |

---

## 4. Spacing, layout and grid

### 4.1 Base unit

Everything is on a **4px grid** (Tailwind spacing). The extra steps used are `13` = 52px
(lg button / search height), `18` = 72px, `22` = 88px, `26` = 104px, `30` = 120px.

### 4.2 Containers and gutters

| | Phone (<640) | Tablet (640–1023) | Desktop (≥1024) |
|---|---|---|---|
| `container-plug` side padding | **16px** | 32px | 80px |
| `STAGE` (map, community) | 16px | 24px | 40px |
| Max content width | — | — | 1280px (container) / 1400px (stage) / 1600px (navbar) |
| Section vertical padding | 80px top & bottom | 80px | 120px |

**App:** 16px screen gutters everywhere. Section rhythm 48–80px on long scrolling screens.

### 4.3 Breakpoints (for tablet support)

`xs` 375 · `sm` 640 · `md` 768 · `lg` 1024 · `xl` 1280. Below `lg` the website **is** the
mobile app: it shows the bottom tab bar, the hamburger menu and bottom sheets.

### 4.4 Fixed chrome heights

| Element | Height |
|---|---|
| Top navbar | **72px** (`--nav-h`) |
| Bottom tab bar | **64px** + bottom safe-area inset |
| Station action bar (above tab bar) | 44px button + 10px padding top & bottom ≈ 64px |
| Admin top bar | 56px |
| Business header | ~64px |

Content scrolls under the fixed bars. The page clears them with `padding-top: 72px` and
~96px of bottom padding (`pb-24`) on tab-bar screens.

### 4.5 Common internal spacing

| Context | Value |
|---|---|
| Card padding | 16 (sm) · **20 (default)** · 24 · 32 (feature cards) |
| Sheet / panel header padding | 16–20px horizontal, 16px vertical |
| Gap between stacked cards | 12–24px (lists 12, feature grids 24) |
| Chip gaps | 6–8px |
| Icon to label | 6–8px |
| Label to field | 6px |
| Field to field | 16–20px |

---

## 5. Shape: corner radius

| Element | Radius |
|---|---|
| Buttons (all sizes), inputs, selects, icon tiles, tab active pill, filter rows | **12px** (`rounded-xl`) |
| Default card, info boxes, mockup inner cards | 16px (`rounded-2xl`) |
| **Feature / marketing card frame** | **24px** (`rounded-3xl`), face 22.5px |
| Car catalogue card | 14px |
| Hero "sheet" card lifted into the band | 32px (`rounded-[2rem]`) |
| Hero band, bottom corners only | **32px** phone / 40px tablet+ |
| Bottom sheet, top corners | 24px |
| Modal | 24px |
| Footer panel, bottom-right only | 80px phone / 128px desktop |
| Badges, chips, pills, avatars, status dots, toggles | full (9999px) |
| Map station pin | full pill |
| Photo thumbnail in lists | 12px |
| Spec tiles (station charger) | 12–16px |
| Focus outline | 4px |

---

## 6. Elevation (shadows)

All shadows are tinted **pine** (`rgba(5,36,30,…)`) or **forest** (`rgba(11,51,44,…)`),
never neutral grey.

| Token | Value | Use |
|---|---|---|
| `e1` | `0 1px 2px rgba(5,36,30,.04), 0 2px 8px rgba(5,36,30,.05)` | Resting card, active segment |
| `e2` | `0 8px 16px rgba(5,36,30,.06), 0 16px 32px rgba(5,36,30,.08)` | Raised card, map pin |
| `e3` | `0 8px 32px rgba(5,36,30,.12)` | Dropdown, popover, map overlay |
| `e4` | `0 24px 64px rgba(5,36,30,.20)` | Modal, sheet, hero card |
| `card` | `0 4px 6px rgba(5,36,30,.05), 0 2px 4px rgba(5,36,30,.04)` | `Card` default |
| `card-hover` | `0 20px 25px rgba(5,36,30,.08), 0 10px 10px rgba(5,36,30,.04)` | |
| `nav` | `0 1px 40px rgba(5,36,30,.08)` | |
| `modal` | `0 25px 50px rgba(5,36,30,.22)` | |
| Primary button (hover) | `0 8px 24px rgba(38,205,178,.28)` (turquoise glow) | |
| Forest button glow | `0 8px 24px rgba(11,51,44,.22)` / lg `0 16px 40px rgba(11,51,44,.30)` | Navigate, CTAs |
| **Feature frame (rest)** | `0 1px 2px rgba(5,36,30,.05), 0 16px 36px -20px rgba(5,36,30,.35)` | |
| Feature frame (hover) | `0 16px 34px -10px rgba(11,51,44,.24), 0 36px 72px -26px rgba(11,51,44,.42)` | |
| Bottom bar (station) | `0 -4px 20px rgba(0,0,0,.08)` | Shadow cast upward |
| Focus halo (inputs) | `0 0 0 3px rgba(38,205,178,.22)` | |

**App:** map these to platform elevation as closely as the platform allows. On Android
use a pine shadow color where supported, not the default black.

---

## 7. Iconography

- **Library: Phosphor Icons** (`@phosphor-icons/react`), **regular weight** by default.
  - `fill` weight for "on" states (a filled heart, a filled star, the lightning in pins and
    the logo row).
  - `light` for strokes ≤1.6, `bold` for ≥2.4.
- **Default size 24px.** Common sizes are 22 (tab bar), 20 (search, nav), 18 (buttons,
  tiles), 16 (chips, list rows), 14 (badges, inline meta), 12–13 (eyebrows, connector badges).
- Icon color follows the text beside it. Decorative icons use slate-400/500, and icons
  inside a card warm to forest when the card is hovered or pressed.

The website names icons by their Lucide names. Here are the Phosphor glyphs the app should use:

| Concept | Phosphor | Concept | Phosphor |
|---|---|---|---|
| Charging / brand | `Lightning` | Map | `MapPin` / `MapTrifold` |
| Routes | `Path` | Cars | `Car` |
| Community | `Users` | Profile | `UserCircle` / `User` |
| Search | `MagnifyingGlass` | Filters | `SlidersHorizontal` |
| Navigate | `NavigationArrow` | Locate me | `GpsFix` / `Crosshair` |
| Save | `BookmarkSimple` (fill when saved) | Share | `ShareNetwork` |
| Report | `Flag` | Like | `Heart` (fill when liked) |
| Comment | `Chat` | Rating | `Star` (fill) |
| Plug | `Plug` / `PlugCharging` | Cable | `PlugsConnected` |
| Battery | `BatteryFull` / `BatteryCharging` / `BatteryLow` | Speed | `Gauge` |
| Compare | `ArrowsLeftRight` | Grid / list | `GridFour` / `Rows` |
| Overview | `SquaresFour` | Settings | `Gear` |
| Business | `Buildings` / `Storefront` | Partner | `Handshake` |
| Verified | `SealCheck` / `ShieldCheck` | Info / help | `Info` / `Question` |
| Back / forward | `CaretLeft` / `CaretRight` / `ArrowLeft` | Dropdown | `CaretDown` |
| External | `ArrowSquareOut` / `ArrowUpRight` | Close | `X` |
| Loading | `CircleNotch` (spinning) | Clock / time | `Clock` / `Timer` |
| Amenities | `ForkKnife`, `Coffee`, `DoorOpen`, `WifiHigh`, `LetterCircleP`, `Star` (prayer), `ShoppingBag`, `Bed` | | |

### Logo

- **Mark:** a two-piece lightning bolt (SVG in `src/components/ui/Logo.tsx`, viewBox
  `4 6 160 160`).
- **Wordmark:** "plug" + ".pk" in Figtree 700, tracking -0.035em.
  - On dark: "plug" in white, ".pk" and the mark in **mint `#6FE8B6`**.
  - On light: "plug" in forest, ".pk" and the mark in **teal `#159E89`**.
- The mark is 1.18em tall, nudged down 0.04em, with a 0.22em gap to the wordmark.
- Optional tagline: "Powering Pakistan's EV Journey", ~0.36em (min 9.5px), medium, tracking 0.07em.
- **App icon:** the mint mark on a pine `#05241E` rounded square (as on the "Launching soon" card).

---

## 8. Components

States are given as **rest → hover/pressed → focus → disabled**. **App:** "hover" means the
pressed state.

### 8.1 Button

One component with four roles, plus two variants for dark bands. All buttons use a **12px
radius**, **semibold** text, an 8px icon gap and no wrapping (except where noted). A press
scales them to `0.98`.

| Size | Height | Horizontal padding | Text |
|---|---|---|---|
| `sm` | 36 | 14 | 13px |
| `md` (default) | **44** | 20 | 15px |
| `lg` | 52 | 28 | 16px |
| `icon` | 44 × 44 | 0 | — (needs an accessibility label) |

| Variant | Rest | Hover / pressed | Disabled |
|---|---|---|---|
| **primary** | Forest `#0B332C` fill, white text | **Turquoise `#26CDB2` fill, forest text**, lifts 2px, turquoise glow | slate-200 fill, slate-600 text, no shadow |
| **secondary** | White fill, **1.5px slate-300** border, forest text | Border forest, fill slate-50 | slate-200 border, slate-50 fill, slate-500 text |
| **ghost** | Transparent, slate-700 text | slate-100 fill, slate-900 text | slate-500 text |
| **destructive** | red-600 fill, white text | red-700 | slate-200 / slate-600 |
| **inverse** (on dark) | White fill, forest text | Turquoise fill, lifts 2px | white/20 fill, white/70 text |
| **outline-white** (on dark) | 1px white/80 border, white text | white/10 fill | white/30 border, white/60 text |

- **Focus:** 2px ring with a 2px offset, turquoise (`plug-blue-500`). On dark the offset color is pine.
- **Disabled is never just "50% opacity".** It's an explicit flat fill with readable type
  (5.5:1), so the label still says what the button will do.
- A long label can wrap: set the height to auto, keep the minimum height at 44, add 10px
  vertical padding and center the text.
- **Pill CTA** (`PillButton`): `lg` button with an `ArrowUpRight` icon after the label.
- **Navbar CTA:** `plug-cyan-400` fill with pine text and a soft mint glow
  `0 6px 18px -8px rgba(111,232,182,.7)`. Hover: white fill.
- **Hero CTA pair (on dark):** a 56px-tall fully rounded gradient pill
  (`#4FDCC4 → #26CDB2`, left to right) with **pine `#05241E` bold text**, 28px padding,
  and the turquoise glow. When pressed it lifts 2px and brightens. It sits next to a 52px
  white `inverse` button with an `ArrowUpRight` icon.
- **Navigate (station):** 44px tall, `gradient-brand` fill, white semibold text, `NavigationArrow`
  18px after the label, shadow `0 8px 20px rgba(11,51,44,.30)`.

### 8.2 Text input

- Height **48px**, radius 12px, **1.5px slate-200 border**, white fill, 15px text in
  slate-900, placeholder slate-400, 16px horizontal padding.
- Leading icon: 16px from the left, slate-400, and the text indent becomes 44px. A trailing
  icon works the same way on the right.
- **Focus:** border turquoise `#26CDB2` with a **3px halo** `rgba(38,205,178,.22)`. No outline.
- **Error:** red-500 border, halo `rgba(239,68,68,.10)`, message below in red-600 at 14px
  with a 15px `WarningCircle`, 6px gap.
- **Success:** green-500 border, green-600 message with `CheckCircle`.
- **Disabled:** slate-50 fill, slate-400 text.
- **Loading:** a spinning `CircleNotch` 18px in the trailing slot.
- Label above: 14px medium, slate-700, 6px gap. Hint below: 14px slate-500.
- **Optional fields** show "optional" after the label in slate-400 regular. Required ones show a red `*`.
- Number fields with a unit ("kWh", "kW", "/ kWh", "km") put the unit **inside, right-aligned,
  slate-400**, with no spinner.
- Textareas show a counter at the bottom right ("0/600", 12px slate-400).

### 8.3 Search field

- Height **52px**, radius 12px, 1px slate-200 border, white, `shadow-lg`, 20px search icon
  at 16px from the left, text indented 48px.
- A clear button (`X`, 18px) appears once the field has text.
- **Hero search (on dark):** a white rounded-full pill containing a search icon, the
  placeholder "Search city or station" and a forest "Go" button (with a `MapPin`) inside the
  pill. On the services and cars heroes it's a frosted dark field
  (`rgba(255,255,255,.04)` fill, white/10 border) with a city `select` and a white "Search" button.

### 8.4 Select / dropdown

Same box as an input: 48px tall, 12px radius, 1.5px slate-200 border, `CaretDown` 16–18px
in slate-400 on the right. Sort selects in toolbars are 40–44px tall, fully rounded, white
with a slate-200 border ("Nearest first ⌄", "A to Z ⌄").

The **searchable picker** (`SearchSelect` / `CarPicker`, e.g. "Select your EV") opens as a
**bottom sheet on phones** (z above everything) with a search field at the top.

### 8.5 Filter chip (toggle)

- Height **34px**, fully rounded, **1.5px border**, 14px horizontal padding, 14px medium text.
- **Off:** white fill, slate-200 border, slate-600 text. Pressed: slate-300 border, slate-50 fill.
- **On:** `plug-blue-50` fill (`#EDFCF8`), `plug-blue-400` border (`#3FD4BC`),
  `plug-blue-700` text (`#05241E`), with a leading `Check` 14px.
- Used for connector types (CCS2, CHAdeMO, Type 2, GB/T, Type 1) and powertrain/brand
  filters. Rows of chips scroll horizontally with a fade at the edges and no scrollbar.

**Category tab chip (community / services):** a 40px pill. **Active:** forest fill, white
text, count badge in white/15. **Inactive:** white fill, slate-200 border, slate-700 text, with
a count bubble in slate-100. The row scrolls horizontally.

**Amenity toggle:** a 12px-radius tile with icon and label in a 2-column grid. On:
`plug-blue-50` fill, `plug-blue-300` border.

### 8.6 Radio list row (filter sheet)

A 40px row with 12px radius and 12px padding. A 20px circle radio sits on the left; when
selected its dot is 8px forest. The label is 14px slate-700, and the range ("50–150 kW") is
right-aligned at 12px slate-400. Pressed: slate-50 fill.

### 8.7 Segmented control

A track in slate-100 with 4px padding and a 16px radius. Segments have a 12px radius and
14px padding (8px on phones).

- **Selected:** white fill, `e1` shadow, label in `plug-blue-700`.
- **Unselected:** label slate-600. Pressed: white/60.
- Each segment can carry a mono caption under its label at 10–12px ("newest first",
  "most liked"), turquoise-deep when selected and slate-400 when not.
- **On phones the control spans the full width with equal segments.**
- Used for the community sort, the AC / DC fast switch, the range-standard picker
  (EPA / WLTP / NEDC / CLTC), and Grid / List.

### 8.8 Badges

Fully rounded, medium weight, 6px icon gap.

| Size | Padding | Text |
|---|---|---|
| sm | 8 × 2 | 12px |
| md | 10 × 4 | 12px |
| lg | 12 × 6 | 14px |

Tone pattern: a tint-50 fill, a tint-200 border and tint-700 text. The tones are green,
amber, red, purple, slate, cyan (accent) and blue (stock blue, admin only).

**Connector badge:**

| Connector | Fill | Border | Text | Meaning |
|---|---|---|---|---|
| CCS2 | `#EDFCF8` | `#A3EBDB` | `#05241E` | DC fast |
| CHAdeMO | amber-50 | amber-200 | amber-700 | DC fast |
| Type 2 | `#EDFCF8` | `#C4F8EC` | `#0F7A6A` | AC |
| GB/T | green-50 | green-200 | green-700 | DC/AC |
| Type 1 | slate-50 | slate-200 | slate-700 | AC |

A group shows at most 3 badges, then a "+N" badge in slate-50 / slate-200 / slate-600.

**Speed badge:** a `Lightning` 12px icon plus "150 kW".

| Tier | Range | Fill | Border | Text |
|---|---|---|---|---|
| Ultra Rapid | ≥150 kW | mint | `#A3EBDB` | `#05241E` |
| Rapid | 50–149 | amber-50 | amber-200 | amber-700 |
| Fast | 7–49 | green-50 | green-200 | green-700 |
| Slow | <7 | slate-50 | slate-200 | slate-600 |

**"Example listing" badge:** amber-50 fill, amber-200 border, amber-800 text, 12px
semibold, with an `Info` icon on detail pages. It's required on every sample record.

**Eyebrow badge:** a rounded-full outline badge, 12 × 4 padding, 12px medium **uppercase,
tracking widest**.

**Card photo chips** (car cards): mono 12px medium **uppercase**, tracking 0.1em, 6px radius,
6 × 4 padding, white/95 fill with a slate-300/80 border and blur. Examples: "INDICATIVE",
"EX-FACTORY", "HYBRID". They never wrap, and use short forms on phones ("NO PLUG").

**Community category tags** (outlined pills, 12px medium):

| Category | Tone |
|---|---|
| General EV Talk | mint / teal |
| Charging Experience | green |
| Trip Reports | purple |
| Vehicle Reviews | amber |
| Buying Advice | mint / cyan |
| EV News Pakistan | red |

### 8.9 Status

**StatusDot:** sm 6px, md 8px, lg 10px. Green, amber, red or slate-400. Only "available"
pulses: a ring that scales 1 → 2.5 while fading 0.8 → 0 over 2s, on loop.
**StatusBadge:** a pill with 12 × 6 padding, 14px medium text, an 8px dot and the tone colors from §2.6.

> Plug.pk has **no live charger data**, so the map pins are colored by **speed**, not by status.
> Don't show live availability anywhere in the app until there's a real feed behind it.

### 8.10 Port meter

Segmented bars, 4px (sm), 6px (md) or 8px (lg) tall, with 4px gaps, one segment per port
up to 8 ports. Above 8 it becomes a single bar.

- **Filled:** forest. Filled segments are amber when ≤34% of ports are free, and slate-300 when none are.
- **Empty:** slate-200 (white/20 on dark).
- Label to the right in mono semibold: "2/4 free".

### 8.11 Rating stars

Sizes are 12, 16 and 20px, with a 2px gap. Filled stars are amber-400, empty ones slate-200,
and half stars are supported.

- Number shown as "4.8" semibold slate-900, with "(5 reviews)" in slate-400.
- **Interactive:** stars scale to 1.1 when pressed, under a "Rate this station" label.
- **Rating summary:** a large "4.8" in 64px bold, stars below it, then "5 reviews". Five bar
  rows follow (★5…★1), each a 6px amber bar on a slate-100 track with the count right-aligned in slate-500.

### 8.12 Avatar

Circular, 40px by default, sizes 32–56. Without a photo it shows the first initial in
white bold at 42% of the size, on `gradient-brand`. On list rows the avatar is forest
(`#0B332C`) or mineral.

### 8.13 Cards

**a) Default card** (`Card`): 16px radius, 1px slate-200 border, white, `shadow-card`,
20px padding. Pressable version: lifts 4px, border becomes `plug-blue-200`, shadow becomes
`card-hover`, 250ms spring.

**b) Feature card (the signature card)** = Frame + Face:
- **Frame:** 24px radius with **1.5px padding**. That padding acts as the border: a
  vertical gradient `#DCE3E0 → #DCE3E0 → #E9EEEC`. Shadow per §6 "Feature frame".
- **Face:** white, radius 22.5px, 32px padding. When the card is pressed it lifts 2px.
- **Pressed/hover:** a turquoise light (radius 16rem) glows through the edge where the finger
  or pointer is: turquoise 95% → mint 60% → sage 35% → transparent. **App:** show this glow
  centered at the top edge on press.
- **Layout inside:** a 56 × 56 icon area (glyph only, no box) with a 24px icon in slate-500
  that turns forest on press. An outline numeral sits top-right ("1", "2", "3") per §3.4.
  Then the title (20px bold) 28–52px below, and the body (15px, slate-500, relaxed) 12px under it.
- **Featured** (the recommended plan, the selected item): the edge gradient becomes
  forest → turquoise → mint at rest, with a stronger shadow.

**c) Hero sheet card:** a white card lifted into the bottom of a pine band. It has a 32px
radius, a 1px white/20 border and the `e4` shadow, and is pulled up **80px** (96 on tablet,
112 on desktop). It opens with a **toolbar header**: a slate-50 → white horizontal gradient,
a slate-100 bottom border, 20 × 16 padding, an eyebrow (icon + "BROWSE"), a 24px bold title
("Discussions"), and a count line "Showing **14** of 14 posts" (the number in semibold slate-900).

**d) Station list card** (map results):
- A 68 × 68 photo with a 12px radius on the left, then the name (15px bold, 1 line) and the
  rating ("★ 4.8") on the top row.
- Below: a `MapPin` 14px with the area in 13px slate-500, then the distance in mono 12px slate-400 on the right.
- Then the "Example listing" badge, "5 ports installed" in mono 12px slate-500, and a chip
  row: connector badges, "+N", and a speed badge.
- Footer: a full-width **36px secondary "Navigate"** button with a `NavigationArrow`. When
  pressed it fills forest with white text and the arrow nudges 3px right.

**e) Car card** (catalogue, 2 columns on phones):
- 14px radius. A photo area with a white ground and the car cut out. Photo chips sit
  top-left and a round favourite button top-right: 44px, white/90, blurred, a 1px
  slate-900/6% ring, shadow `0 2px 10px rgba(5,36,30,.10)`, scaling to 0.95 when pressed.
  The `Heart` is slate-500, and **rose-500 `#F43F5E` filled** when favourited.
- Below: the brand line (12px uppercase), the model (17px bold, truncated), the variant line
  (mono 12px), and the powertrain line ("Fully electric · 4 seats", 13px slate-500).
- Then the price in bold with a qualifier caption underneath ("LAUNCH PRICE", mono 12px uppercase).
- After a hairline, a spec list: BATTERY / RANGE / POWER labels (mono 12px uppercase,
  slate-400) with values in mono (number bold, unit regular, standard like "CLTC" after it).
- A compare toggle sits bottom-right: a 44px square, 12px radius, with an `ArrowsLeftRight` icon.

**f) Service card:** a 16:10 photo on top with a category pill top-left (white, icon + label)
and a "Verified" pill top-right (forest, `ShieldCheck`). Then the name (17px bold), a `MapPin`
with the area, a 2-line clamped description, and "No reviews yet" in slate-400. The footer
has an outlined "Contact" button with a `Phone` icon, and "Details →" on the right.

**g) Community post card:** a 24px-radius frame with an optional 16:10 image, or a mint
placeholder with a turquoise `Lightning` outline. Then a header row: avatar (40px), name
(14px bold), car line ("🚗 BYD Atto 3", 12px slate-400), and the category tag on the right.
Then the title (17px bold, 2 lines) and the body (15px slate-500, 3-line clamp). The footer
row has a `Clock` with the date (13px slate-400) on the left, and like / comment counts and a share icon on the right.

**h) Club card:** an illustrated city-landmark header image with a city pill ("📍 Lahore",
glass), then the name (17px bold), "👥 0 members" (mono number), a 2-line description and a
full-width **"Join club" primary** button (shown as disabled sage while signed out).

**i) Route card** (popular routes): a 16px-radius card. Origin and destination are stacked
with a green dot and a red dot joined by a dashed line, and the distance sits right in mono
bold ("375 KM"). Below a hairline: "◷ ~2h 15m" in mono and "M-1 motorway" in slate-500, with a round 36px arrow button on the right.

**j) Spec tile** (station chargers): a white tile with a 12px radius and slate-200 border.
It has a small uppercase label ("MAX POWER") and a big mono figure ("150") with a light unit
("kW" / "installed"). A charger block starts with a 48px rounded square showing "DC" / "AC"
in mono, next to the connector badge and "#1" in slate-400. Its left border is accented turquoise.

**k) Stat tile (dashboard):** a white 16px card with a 44px mint-tinted rounded square icon
(the icon tinted by meaning: eye = forest, arrow = green, star = amber, chat = purple). Then a mono 30px bold figure and a 14px slate-500 label.

### 8.14 Stat rail (on dark heroes)

Three figures **in one row on phones** (a grid of equal columns) with white/10 dividers.
Each figure has a 14px icon, a mono 18px bold number and a 12px uppercase white/55 label.
Labels may wrap to two lines and stay top-aligned. If fewer than two figures are non-zero,
replace the rail with a sentence.

### 8.15 Empty state

A white box with a **1px dashed slate-300 border**, a 16px radius, 24px horizontal and
48–64px vertical padding, centered. Inside cards a smaller version is used: 12px radius,
24px padding. It
holds a 14px slate-500 sentence that explains what will appear and how ("Nothing saved yet.
Use the bookmark on any station to keep it here."), then one secondary sm button ("Find
stations"). There are no illustrations.

### 8.16 Skeleton

Blocks in slate-100 with a shimmer sweep (`#E9EEEC → #DCE3E0 → #E9EEEC`, 200% wide, 1.5s
loop). They take the radius of the thing they stand in for.

### 8.17 Notices

- **Info / sample notice:** amber-50 fill, amber-200 border, 16px radius, 16px padding,
  14px amber-900 text with a bold lead ("**Example listing.** This station is sample data…").
- **Neutral note:** slate-100 fill, 16px radius, 14px slate-600 text, an `Info` icon 16px in turquoise-deep.
- **Toast:** full width with a 16px inset from the screen edges and the bottom (bottom-right,
  max 384px wide, on tablet+). It sits above everything (z 60). 12px radius, 16 × 12
  padding, 13px text, shadow `0 12px 32px -12px rgba(5,36,30,.3)`.
  - **Success:** emerald-50 fill, emerald-200 border, emerald-900 text, an emerald-600 check icon.
  - **Error:** red-50 / red-200 / red-900, with a red-600 icon.
  - A small close `X` at 60% opacity sits on the right. It auto-dismisses.

### 8.18 Accordion (FAQ)

Each item uses the same **graded-edge** construction as the feature card, at a 16px
radius: 1.5px padding with a vertical slate-300 → slate-300 → slate-200 gradient around
a white face.

- **Question row:** 24 × 20 padding, 15–16px semibold forest, and a `CaretDown` in
  slate-400 on the right. When the item opens, the caret rotates 180° over 300ms and turns forest.
- **Answer:** below a slate-100 hairline (16px above the text), 15px slate-500 relaxed, 24px
  horizontal and 20px bottom padding.
- Items are stacked 12px apart, at most 768px wide.
- **Section intro:** a 13px bold uppercase "ⓘ FAQ" eyebrow (tracking widest, forest), then a
  centered title at 30px (36px on tablet+) bold, 48px above the list.

### 8.19 Toggle / checkbox

The checkbox is **18 × 18** with a 6px radius and a **2px** slate-300 border on white.
Checked: forest fill and border, with a white `Check` 12px. It changes over 150ms. It's
top-aligned to the first line of its label (2px nudge). The label sits 12px to the right
(14px slate-700) and inline links in it are forest. Give the label the 44px tap height, not
just the box.

### 8.20 Slider

- **Battery slider:** a 6px track, filled left of the thumb. The fill is green `#22C55E` when
  high, amber `#F59E0B` mid-range and red `#EF4444` when low. The empty part is slate-200.
  The thumb is 22px white with a 2px border in the fill color and a soft shadow, and scales to 1.15 when pressed.
- **Charge-range battery (calculator):** a battery drawing with two **24 × 44 grip thumbs**
  (white with a 3px forest border, shadow `0 2px 8px rgba(5,36,30,.28)`), with − / + buttons
  (40px circles, outlined) for each end and presets as chips ("Daily top-up 20→80").

---

## 9. Navigation and app shell

### 9.1 Top bar

- **72px, pine `#05241E`**, 1px white/[0.08] bottom border, fixed, no blur. On phones it
  holds the logo on the left (white "plug", mint ".pk") and a **44px menu button** with
  a white `List` icon on the right, which morphs into an `X`.
- **App:** use this bar as the root header on tab screens. On pushed screens show a back
  chevron with the title in white 17px semibold. Light status-bar content.

### 9.2 Bottom tab bar (main app)

- **64px plus the safe area.** White, 1px slate-200 top border, five equal columns.
- **Tabs:** `Map` (MapPin) · `Routes` (Path) · `Cars` (Car) · `Community` (Users) · `Profile`
  (UserCircle). Signed out, the last tab is `Sign in` (User) and opens login, then returns to where the user was.
- Each tab has a 22px icon over a label with a 4px gap. **Active:** a `plug-blue-50` pill
  (12px radius, 12 × 6 padding) behind the icon and label, with both in forest. **Inactive:**
  icon and label slate-500. The labels are 10–12px medium.
- Services, Partner Up and the tools aren't tabs. They sit in the menu.

### 9.3 Account tab bar (dashboard)

The same 64px bar at white/95 with a 20px blur, four tabs: **Overview** (SquaresFour),
**Vehicles** (Car), **Saved** (BookmarkSimple), **Settings** (Gear). Inactive icons are
slate-400. It replaces the main tab bar, and the two never stack.

### 9.4 Business tab bar

Five tabs: **Overview, Profile (Buildings), Chargers (Lightning), Reviews (Star), Analytics
(ChartBar)**, styled like §9.3. The business header is white with the logo, a "BUSINESS"
pill (slate-100, 12px bold uppercase) and "View Listing ↗" on the right.

### 9.5 Menu (full-screen sheet)

- Pine, sliding down from under the top bar (350ms decelerate), over a black/40 scrim.
- Rows are 52px: an icon in white/60, a 17px white label and a `CaretRight` in white/30.
  In order: Map, Routes, Cars, Services, Community, Partner Up.
- A "TOOLS" label follows (12px bold uppercase, tracking 0.16em, white/40), then Charging
  calculator and Range converter.
- At the bottom, separated by a white/10 line:
  - **Signed out:** a white "Sign In" button (48px, pine text) and an outlined "Create
    account" button (white/20 border), then the "Pakistan's EV Ecosystem Platform" line in white/40.
  - **Signed in:** an account card (white/[0.06], 16px radius) with the avatar, name and email,
    then "Sign out" (red-300 text, red-400/40 border).
- The tab bar stays visible under the menu.

### 9.6 Bottom sheet

White, with **24px top corners**, at most 85% of the screen height. A 40 × 4 slate-200 grab
handle sits 12px from the top. The header is sticky and white, with a slate-100 bottom
border: the title (18px bold) on the left, plus a count bubble (20px forest circle, white
12px bold) when filters are on. On the right are "Clear all" (14px medium forest link) and
**"Done"** (36px forest button). Sections are divided by slate-50 rules with 20 × 16
padding, and the footer clears the safe area (+32px).

**The sheet sits above the tab bar.** It uses a scrim of black/40.

### 9.7 Modal

Centered, with 16px of screen margin, a 24px radius, white, `shadow-modal`, 32px padding,
at most 90% of the screen height and scrollable. The scrim is black/50 with a 4px blur. It
sits above the tab bar. **App:** prefer a full-height sheet for forms like "Start a discussion".

### 9.8 Contextual action bar (station detail)

Fixed above the tab bar. White with a slate-100 top border and the upward shadow, 16 × 10
padding. **One row:** three 44px icon squares (**Save, Share, Report**: 12px radius, slate-200
border, slate-50 fill) and a **Navigate** button that fills the remaining width. Saved
state: mint fill, forest icon `BookmarkSimple` (fill). Share copied: a green check for 2s.

### 9.9 Compare tray (cars)

Fixed above the tab bar, white/95 with blur, a top and bottom border and an upward shadow.
It shows thumbnails of the picked cars and "Pick one more" or "Compare 2" (primary).

---

## 10. Screen patterns

### 10.1 The hero band (top of every main screen)

```
┌──────────────────────────────┐  pine #05241E, 72px top bar above
│        Headline in white,     │  32px bold, centered, balanced
│   last phrase in gradient     │  (mint→turquoise text gradient)
│  subtitle white/65, 15px      │
│  [ search pill / CTA pair ]   │  16–32px gaps
│   7 · CHARGING   4 · CITIES   │  stat rail, one row
╰──────────────────────────────╯  bottom corners 32px
     ┌────────────────────────┐   white sheet card, pulled up 80px
     │ ≡ BROWSE               │   toolbar header
     │ Discussions            │
```

The decoration inside the band, all of it purely visual:
- a dot grid of white 4% dots every 28px;
- a blurred forest pool (24rem × 42rem at 25% opacity, 130px blur) centered at the top;
- a turquoise pool (20rem at 20% opacity, 120px blur) at one bottom corner;
- **film grain** at **3.5%** opacity.

The band's bottom padding is 128px, so the lifted card has room to sit in it.

### 10.2 Screen inventory (what the app needs)

| Screen | Structure |
|---|---|
| **Home** | Hero ("Find EV chargers across **Pakistan.**", search pill, 3 stats, product mockup) → "Drive anywhere…" illustration → how-it-works story (phone mockup + "Step 1 of 4") → route planner promo (dark) → EV services grid (6 feature cards) → community teaser → partner promo (dark card) → app promo → footer |
| **Map** | Full-bleed map with a floating search field and a locate button (white 44px circle, `e3`) → hero band with stats → sheet card "Refine the map" (filter toolbar + "Filters" button) → results "7 stations on the map" with a sort select → station list cards → FAQ |
| **Station detail** | Breadcrumb → name (32px bold) → example badge → rating row → address · operator → connector chips → amber sample notice → photo gallery (16px radius, "Example photo" chip, full-screen lightbox) → About → Charger details (spec tiles) → Amenities (2-col tiles: icon in a tinted 48px rounded square, label, "Available" in green 12px; unavailable ones faded) → Reviews (summary + list + "Share your experience…" composer) → sticky action bar |
| **Routes** | Hero → "Popular routes" (6 corridor cards) → "Plan your route" card (From/To fields with colored dots and a swap button, EV picker, battery slider "80%", primary "Calculate Route") → result (stops timeline) → How it works → FAQ |
| **Cars** | Dark "showroom" hero with search + brand select + popular brand chips + stats → "Browse by brand" chip scroller → powertrain segment chips (All cars 104 / Electric 69 / Plug-in hybrid / …) → 2-column car grid → compare tray |
| **Car detail** | Breadcrumb → title card (brand eyebrow, model 36px bold, variant, description, spec chips, CTA stack: "Cost to charge" primary / "Plan a trip in this car" / "Find a dealer" secondary, "All cars" / "Compare" small outlined) → photo with plate → quick links grid (Charging, Routes, Compare, All cars) → price card → collapsible spec groups with key/value rows → similar cars → compare CTA |
| **Compare** | Back pill → title → side-by-side spec table, or the empty state "Nothing selected yet" + "Browse cars" |
| **Community** | Hero (search, "Start a discussion" gradient CTA, "Join the club" white) → sheet card (sort segmented control + category chips) → post cards → "Load more (4 left)" secondary full-width → FAQ |
| **Post detail** | Breadcrumb with category pill → card (category, title 30px bold, author row, body 16px relaxed, photos 16px radius) → likes / share bar → comments (sign-in prompt in a dashed box, comment list with "Report" link) |
| **Clubs** | Hero → "Find your club" sheet → club cards |
| **Services** | Hero (search + city select, 3-stat box) → sticky category chip scroller → filters (city select, sort, Grid/List segmented) → service cards; detail: dark photo hero, Get Directions / Call Now, contact rows (44px tinted icon squares), hours table (mono times), services list with check icons |
| **Tools** | Charging calculator (numbered step cards ①–④, result card on pine with "Estimated charging time"); Range converter (standard segmented control, big mono input "420 km", results list with tone pills REALISTIC / OPTIMISTIC / LEAST REALISTIC) |
| **Auth** | Mist background with a faint radial grid, logo top-left, "← Back to home" top-right, a centered white card (24px radius, 24–32px padding) with an eyebrow (SIGN IN / GET STARTED in turquoise-deep), title 28px bold, subtitle, fields with icons, a password eye toggle, a full-width 52px primary, "Don't have an account? **Create one**", a partner box (slate-50, "Become a partner" outlined mint), and a 🔒 reassurance line plus Terms · Privacy below |
| **Account** | White page header (back button 40px outlined square + title 24px bold + subtitle) → mist content area with white 16px cards: profile completion (ring meter + checklist rows, amber-tinted while to-do, green check when done), stats, saved stations, reviews; Settings: profile (avatar, upload), password, signed-in devices |
| **Business** | Overview (listing card: name, address, "Live on the map" green pill, map pin in mono, chargers list with approval pills), Profile form, Chargers editor (connector select, power, ports, photos with "Approved" pills), Reviews, Analytics (7/30/60-day chips, stat tiles, "Views per day" bar chart in forest) |
| **Partners** | Hero with CTA pair + stats → dashboard preview mockup → venue types list → how it works → benefits → plans (featured card) → partner directory → meeting form → FAQ |

---

## 11. Motion

| Token | Curve | Use |
|---|---|---|
| `decelerate` | `cubic-bezier(0, 0, 0.2, 1)` | Entering: sheets, menus, fade-up |
| `accelerate` | `cubic-bezier(0.4, 0, 1, 1)` | Leaving |
| `spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Small pops: pins, card lift, badges scale-in |
| Settle | `cubic-bezier(0.16, 1, 0.3, 1)` | Hero rise |
| Swap | `cubic-bezier(0.22, 1, 0.36, 1)` | Masthead and collection swaps |

| Pattern | Spec |
|---|---|
| Press feedback | 150–200ms; buttons scale to 0.98, primary lifts 2px |
| Card press | 250–300ms; lifts 2–4px, shadow deepens, edge glows turquoise |
| Sheet / menu open | **350ms decelerate**, translate from 100% |
| Hero entrance | Each block rises **12px** over **900ms**, staggered 60 / 160 / 280 / 400 / 500ms |
| Content swap | 260ms, 10px rise and fade |
| List reveal | `fade-up` 600ms, 20px, with 100ms stagger steps |
| Progress / rating bars | Grow from the left over 800ms decelerate |
| Pin select | Scales to 1.1 with a spring and a 2px turquoise/60 ring |
| Ambient float | 3–6px drift over 7.5–11.6s ease-in-out, never in step |
| Loading | `CircleNotch` spin; shimmer 1.5s |
| Pulse | Available-status ring 2s; user-location ping |

**Reduced motion:** remove every movement, but **always land on the visible end state**
(no content left at opacity 0). Decorative loops stop. The card edge glow stays, pinned to top center.

**App:** use haptics only where the website shows a state change: a light tick for save /
like toggles and segmented changes, and a success haptic when a route is calculated or a review is posted.

---

## 12. Map

- **Style:** OpenFreeMap (MapLibre) with English labels. The camera is framed to Pakistan
  on load, with a minimum zoom of 3.5 and a maximum of 18.
- **Station pin:** a pill with a 2px white border, `e2` shadow and a white filled
  `Lightning` 13px, plus "**150**kW" (mono 12px bold white, with "kW" at 9px and 80% opacity).
  A 6 × 2px stem below points at the coordinate.
  - **Fast (≥60 kW):** forest `#0B332C`. **Under 60 kW:** slate-500 `#626D6B`.
  - **Selected:** scales to 1.1 with a 2px `plug-blue-500/60` ring.
- **User location:** a 12px forest dot with a 2px white border inside a pulsing mint ring of 24px.
- **Controls:** zoom +/− bottom-right (no compass). The locate button is a 44px white circle
  at the top-right below the search field. Attribution starts collapsed to its (i) at the bottom-left.
- **App:** cluster pins that overlap at country zoom. The website doesn't cluster yet, and
  nearby Lahore stations overlap at that zoom.

---

## 13. Content and formatting

- **Voice:** plain, specific and honest. Say what something does and where the data comes
  from. Don't use hype or padded numbers.
- **Currency:** "PKR 12.45–13.95 Lakh", "PKR 1.05 Cr", "PKR 4,999 a month". Use an en dash
  for ranges, Lakh/Cr units, and `en-PK` grouping (`4,899,000`).
- **Units:** a space before the unit: "150 kW", "12.96 kWh", "263 km", "~2h 15m". Battery
  ranges use an arrow: "20% → 80%", "34→78%".
- **Distances:** under 1 km as "850m", otherwise "2.4km" (one decimal).
- **Ratings:** one decimal ("4.8"). Dates as "26 July 2026".
- **Counts:** "Showing **7** of 7 stations", "2 LISTED", "5 ports installed", "1 charger · 1 port".
- **Separators:** a middle dot with spaces (" · ") between meta items.
- **Placeholders:** use realistic local names ("Ahmed Khan", "ahmed@example.com", "Search city or station…").
- **Title case** for buttons that start a flow ("Create Your Account", "Sign In") and
  sentence case everywhere else. All-caps only through the eyebrow, label and chip styles, never typed in caps.
- **Em dashes** in copy (" — "). Make sure stored text keeps UTF-8 (`—`, `→`, `·`), because
  mis-encoded data shows up as "???".

---

## 14. Accessibility checklist

- Touch targets are **≥44 × 44** (tab items, icon buttons, list links, footer links).
- Text is **≥12px**. Body copy is 15px.
- Contrast meets AA for every text/background pair in §2.8.
- Every icon-only button has a label ("Navigate to Mall Road EV Hub", "Sign in to save …").
- Focus is visible on everything: a 2px turquoise ring with a 2px offset.
- State isn't carried by color alone (selected chips add a check, saved adds a filled icon,
  status adds a label).
- Live counts are announced politely ("Showing 7 of 7 stations").
- Reduced motion is respected per §11.
- Never let fixed chrome (tab bar, action bar) cover sheet or modal content, and give every
  bottom-anchored panel safe-area padding.

---

## 15. Token export (for the app)

```json
{
  "color": {
    "bg": "#F1F4F3", "bgAlt": "#E9EEEC", "surface": "#FFFFFF",
    "text": "#0B332C", "textMuted": "#626D6B", "textSubtle": "#989FA1",
    "border": "#DCE3E0", "borderStrong": "#BAC2C0",
    "primary": "#0B332C", "primaryPressed": "#05241E", "onPrimary": "#FFFFFF",
    "accent": "#26CDB2", "onAccent": "#0B332C", "accentText": "#0F7A6A",
    "mint": "#EDFCF8", "mintBorder": "#A3EBDB", "aero": "#C4F8EC",
    "pine": "#05241E", "ink": "#0D1817", "mineral": "#345A53", "footer": "#031914",
    "logoMintOnDark": "#6FE8B6", "logoTealOnLight": "#159E89",
    "success": "#22C55E", "successText": "#15803D", "successBg": "#F0FDF4", "successBorder": "#BBF7D0",
    "warning": "#F59E0B", "warningText": "#B45309", "warningBg": "#FFFBEB", "warningBorder": "#FDE68A",
    "danger": "#EF4444", "dangerText": "#B91C1C", "dangerBg": "#FEF2F2", "dangerBorder": "#FECACA",
    "dangerButton": "#DC2626", "star": "#FBBF24", "favourite": "#F43F5E"
  },
  "font": {
    "sans": "Figtree", "mono": "JetBrains Mono",
    "weights": { "regular": 400, "medium": 500, "semibold": 600, "bold": 700 }
  },
  "fontSize": {
    "uiXs": [12, 18], "uiSm": [13, 20], "ui": [15, 24], "uiLg": [17, 26],
    "base": [16, 24], "lg": [18, 28], "xl": [20, 28], "2xl": [24, 32],
    "heroPhone": [32, 34.5], "displaySm": [30, 36], "displayMd": [36, 41.4]
  },
  "radius": { "control": 12, "card": 16, "featureCard": 24, "sheetTop": 24, "modal": 24, "heroBand": 32, "pill": 9999 },
  "space": { "gutter": 16, "cardPad": 20, "featurePad": 32, "touch": 44 },
  "height": { "topBar": 72, "tabBar": 64, "buttonSm": 36, "buttonMd": 44, "buttonLg": 52, "input": 48, "search": 52, "chip": 34 },
  "shadow": {
    "e1": "0 1 2 rgba(5,36,30,.04), 0 2 8 rgba(5,36,30,.05)",
    "e2": "0 8 16 rgba(5,36,30,.06), 0 16 32 rgba(5,36,30,.08)",
    "e3": "0 8 32 rgba(5,36,30,.12)",
    "e4": "0 24 64 rgba(5,36,30,.20)",
    "focus": "0 0 0 3 rgba(38,205,178,.22)"
  },
  "motion": {
    "decelerate": [0, 0, 0.2, 1], "accelerate": [0.4, 0, 1, 1],
    "spring": [0.34, 1.56, 0.64, 1], "settle": [0.16, 1, 0.3, 1],
    "press": 150, "card": 300, "sheet": 350, "swap": 260, "heroRise": 900
  },
  "chargingTiers": { "fastPinKw": 60, "ultra": 150, "rapid": 50, "fast": 7 }
}
```

---

## 16. Source of truth

| Topic | File |
|---|---|
| Palette, type scale, shadows, motion tokens | `tailwind.config.ts` |
| Global styles, grain, card edge, hero motion, sliders | `src/app/globals.css` |
| Buttons | `src/components/ui/button-styles.ts` |
| Inputs, search | `src/components/ui/Input.tsx` |
| Badges, connectors, speed, status | `src/components/ui/Badge.tsx`, `ConnectorBadge.tsx`, `SpeedBadge.tsx`, `StatusDot.tsx`, `src/lib/utils.ts` |
| Feature card frame / face / numeral | `src/components/shared/frame.ts` |
| Logo | `src/components/ui/Logo.tsx` |
| Icons | `src/components/ui/icons/` (Phosphor) |
| App shell | `src/components/layout/Navbar.tsx`, `BottomTabBar.tsx`, `MobileMenu.tsx`, `Footer.tsx` |
| Map pins | `src/components/map/StationPin.tsx` |
| Nav items, cities | `src/lib/constants.ts` |
