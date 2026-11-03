// src/components/calculator/ChargeResult.tsx
import { AlertCircle, Info, Zap } from '@/components/ui/icons'
import {
  formatDuration,
  formatKw,
  formatKwh,
  formatRupees,
  type ChargeEstimate,
  type ChargeMode,
  type ChargeProblem,
} from '@/lib/charging-time'
import { cn } from '@/lib/utils'

/**
 * The answer, as the loudest thing on the page.
 *
 * An ink card beside the white steps (landing-v2's .res), so the eye goes to
 * it before it goes to any control: the controls are how you ask, this is
 * what you came for. One figure in large mono type, the charge it describes
 * directly under it, then the supporting numbers a driver actually uses — and
 * a single line that says what capped the speed, because that is the part
 * people get wrong.
 *
 * The card keeps its shape when the inputs are invalid. The time becomes a
 * dash and the reason sits where the details were, so fixing a field never
 * makes the layout jump.
 */

export interface ChargeResultProps {
  result: ChargeEstimate | ChargeProblem
  mode: ChargeMode
  from: number
  to: number
  chargerKw: number | null
  carName: string | null
  /** The maker's own 10–80% DC time, when the catalogue has one. */
  makerDcMinutes: number | null
  /** Where that time starts: 10, 20 or 30, always to 80%. */
  makerDcFromPct?: number
  /** Rated km this charge adds, already rounded. Null without a car's range. */
  rangeAddedKm: number | null
  /** The cycle that range was rated on, for the footnote. */
  rangeCycle: string | null
  /** "11:40 pm", when the charge would finish if started now. Client-only. */
  readyText: string | null
  /**
   * True when nothing has been entered yet. That is where every visit starts,
   * so it is shown as the first instruction, not as an error.
   */
  waiting: boolean
  /**
   * DC mode, a car is picked, and the catalogue has no DC figure for it. The
   * time is still worked out on the charger's power, but it may describe a
   * charge the car cannot take at all.
   */
  dcUnknown?: boolean
}

/** "1h 25m" with its units set small in volt, as the design's .res__time. */
function Duration({ text }: { text: string }) {
  if (!/\d/.test(text)) return <span className="text-[0.5em] tracking-normal">{text}</span>
  return (
    <>
      {text.split(/(\d+)/).map((part, i) =>
        /^\d+$/.test(part) ? (
          <span key={i}>{part}</span>
        ) : part.trim() ? (
          <small key={i} className="ml-[0.06em] mr-[0.22em] text-[0.42em] font-medium tracking-normal text-volt">
            {part.trim()}
          </small>
        ) : null,
      )}
    </>
  )
}

export function ChargeResult({
  result,
  mode,
  from,
  to,
  chargerKw,
  carName,
  makerDcMinutes,
  makerDcFromPct = 10,
  rangeAddedKm,
  rangeCycle,
  readyText,
  waiting,
  dcUnknown = false,
}: ChargeResultProps) {
  const dc = mode === 'dc'

  return (
    <section
      aria-live="polite"
      aria-label="Estimated charging time"
      data-theme="dark"
      className="relative isolate overflow-hidden rounded-[28px] bg-ink px-5 pb-6 pt-6 text-white shadow-[0_40px_80px_-40px_rgba(11,12,14,.7)] sm:px-7 sm:pb-7 sm:pt-[30px]"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-[220px] -top-[260px] -z-[1] h-[520px] w-[520px] rounded-full bg-[radial-gradient(closest-side,rgba(212,255,58,.16),transparent_70%)]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-[2] bg-[repeating-linear-gradient(-45deg,transparent_0_22px,rgba(255,255,255,.03)_22px_23px)]"
      />

      <p className="mb-5 font-mono text-xs font-semibold uppercase leading-none tracking-[0.16em] text-volt">
        Estimated charging time
      </p>

      <p className="min-h-[1em] whitespace-nowrap font-mono text-[clamp(44px,4.6vw,68px)] font-semibold leading-none tracking-[-0.04em] tabular-nums text-white">
        {result.ok ? (
          <>
            {dc ? <span className="text-white/45">~</span> : null}
            <Duration text={formatDuration(result.minutes)} />
          </>
        ) : (
          '—'
        )}
      </p>

      <p className="mt-3.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 font-mono text-[15px] font-semibold text-white/80">
        <span className="tabular-nums">
          {from}% → {to}%
        </span>
        {result.ok ? (
          <span className="font-medium text-white/55">
            · {dc ? 'DC' : 'AC'} at {formatKw(result.powerKw)}
          </span>
        ) : null}
        {dc ? (
          <span className="inline-flex h-[22px] items-center rounded-full border border-[#FFB020]/50 px-[9px] text-[10.5px] uppercase tracking-[0.12em] text-[#FFB020]">
            Estimate
          </span>
        ) : null}
      </p>

      <div aria-hidden="true" className="relative mb-[22px] mt-5 h-2.5 overflow-hidden rounded-full bg-ink-3">
        <i
          className="absolute inset-y-0 left-0 rounded-full bg-white/[0.22] transition-[width] duration-500 ease-out"
          style={{ width: `${from}%` }}
        />
        <i
          className="absolute inset-y-0 rounded-full bg-volt shadow-[0_0_12px_rgba(212,255,58,.7)] transition-[left,width] duration-500 ease-out"
          style={{ left: `${from}%`, width: `${to - from}%` }}
        />
      </div>

      {result.ok && dc && dcUnknown ? (
        <p
          role="note"
          className="mb-4 flex items-start gap-2.5 rounded-[18px] border border-[#FFB020]/40 bg-[#FFB020]/10 px-4 py-3 text-[13.5px] leading-[1.55] text-[#FFE3B0]"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-[#FFB020]" aria-hidden="true" />
          <span>
            No DC fast-charging figure is published for {carName ?? 'this car'}, so it may not support DC fast
            charging at all. This time assumes it does — check before planning around it.
          </span>
        </p>
      ) : null}

      {result.ok ? (
        <>
          <dl className="m-0 grid grid-cols-2 gap-px overflow-hidden rounded-[18px] border border-white/[0.09] bg-white/[0.09]">
            {readyText ? (
              <Figure wide label={`Plug in now, ${dc ? 'done' : 'ready'} around`} value={readyText} />
            ) : null}
            <Figure label="Energy added" value={formatKwh(result.energyKwh)} />
            <Figure
              label="Range added"
              value={rangeAddedKm != null ? `+${rangeAddedKm.toLocaleString('en-PK')} km` : carName ? 'Not listed' : 'Pick a car'}
              muted={rangeAddedKm == null}
            />
            <Figure label="Drawn from supply" value={formatKwh(result.gridKwh)} />
            <Figure
              label="Estimated cost"
              value={result.cost != null ? formatRupees(result.cost) : 'Add a rate'}
              muted={result.cost == null}
            />
          </dl>

          {rangeAddedKm != null ? (
            <p className="mt-2.5 text-xs leading-[1.5] text-fog">
              Range is a share of the maker&rsquo;s rated figure{rangeCycle ? ` (${rangeCycle})` : ''}. Real driving —
              speed, AC, hills — usually gives less.
            </p>
          ) : null}

          <LimitNote
            limitedBy={result.limitedBy}
            powerKw={result.powerKw}
            chargerKw={chargerKw}
            carName={carName}
            mode={mode}
          />

          {dc && result.split ? (
            <p className="mt-3 flex gap-2.5 text-[13.5px] leading-[1.55] text-fog">
              <Zap size={16} className="mt-0.5 shrink-0 text-volt" aria-hidden="true" />
              <span>
                About <b className="font-semibold text-white">{formatDuration(result.split.toEightyMin)}</b> to reach
                80%, then roughly <b className="font-semibold text-white">{formatDuration(result.split.pastEightyMin)}</b>{' '}
                more for the rest — charging slows sharply near full.
              </span>
            </p>
          ) : null}

          {dc && makerDcMinutes && carName ? (
            <p className="mt-3 text-[13.5px] leading-[1.55] text-white/55">
              For reference, the maker quotes {makerDcFromPct}–80% in {makerDcMinutes} min on a charger fast enough to
              reach the car&rsquo;s peak.
            </p>
          ) : null}
        </>
      ) : waiting ? (
        <div className="rounded-[18px] border border-white/[0.09] bg-white/[0.05] px-5 py-[18px]">
          <p className="text-base font-semibold text-white">Start with your car</p>
          <p className="mt-1.5 text-sm leading-[1.55] text-fog">
            Pick it in step 1, or type its battery size if it isn&rsquo;t listed. Your time, range and cost appear here
            as you go.
          </p>
        </div>
      ) : (
        <p className="flex items-start gap-2.5 rounded-[18px] border border-white/[0.09] bg-white/[0.05] px-5 py-4 text-[15px] leading-[1.55] text-white/85">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-[#FFB020]" aria-hidden="true" />
          {result.message}
        </p>
      )}
    </section>
  )
}

function Figure({ label, value, muted, wide }: { label: string; value: string; muted?: boolean; wide?: boolean }) {
  return (
    <div className={cn('bg-[#121418] px-4 py-[15px]', wide && 'col-span-2')}>
      <dt className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-fog">{label}</dt>
      <dd
        className={cn(
          'mt-2 font-mono text-[20px] font-semibold leading-[1.1] tracking-[-0.02em] tabular-nums',
          muted ? 'text-[15px] tracking-normal text-white/40' : 'text-white',
        )}
      >
        {value}
      </dd>
    </div>
  )
}

/**
 * Why the power is what it is. The single most useful line on the card: a
 * driver who bought a 22 kW wall box for a car that accepts 7 is about to find
 * out here rather than in the driveway.
 */
function LimitNote({
  limitedBy,
  powerKw,
  chargerKw,
  carName,
  mode,
}: {
  limitedBy: ChargeEstimate['limitedBy']
  powerKw: number
  chargerKw: number | null
  carName: string | null
  mode: ChargeMode
}) {
  let text: string
  if (limitedBy === 'car') {
    text =
      mode === 'ac'
        ? `Capped at ${formatKw(powerKw)} — the most ${carName ?? 'your car'}'s onboard charger accepts, even on a ${formatKw(chargerKw ?? powerKw)} charger.`
        : `Capped at ${formatKw(powerKw)} — ${carName ?? 'your car'}'s peak DC rate, so a faster charger won't help here.`
  } else if (limitedBy === 'car-unknown') {
    text = carName
      ? `We don't have ${carName}'s ${mode.toUpperCase()} limit, so this assumes the charger's full ${formatKw(powerKw)}. Your car may accept less.`
      : `Assumes your car can take the charger's full ${formatKw(powerKw)}. Pick your car to apply its own limit.`
  } else if (limitedBy === 'matched') {
    text = `${carName ?? 'Your car'} and the charger both top out at ${formatKw(powerKw)}, so neither is holding the other back.`
  } else {
    text = `The charger is the limit here — your car can accept more than ${formatKw(powerKw)}.`
  }

  return (
    <p className="mt-4 flex gap-2.5 text-[13.5px] leading-[1.55] text-fog">
      <Info size={16} className="mt-0.5 shrink-0 text-volt" aria-hidden="true" />
      <span>{text}</span>
    </p>
  )
}
