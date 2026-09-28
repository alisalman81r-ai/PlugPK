// src/components/calculator/ChargeResult.tsx
import { AlertCircle, Clock, Info, Zap } from '@/components/ui/icons'
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
 * A dark panel inside the white calculator, so the eye goes to it before it
 * goes to any control: the controls are how you ask, this is what you came
 * for. One figure in large type, the charge it describes directly under it,
 * then four supporting numbers a driver actually uses — and a single line
 * that says what capped the speed, because that is the part people get wrong.
 *
 * The panel keeps its shape when the inputs are invalid. The time becomes a
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
}

export function ChargeResult({
  result,
  mode,
  from,
  to,
  chargerKw,
  carName,
  makerDcMinutes,
  rangeAddedKm,
  rangeCycle,
  readyText,
  waiting,
}: ChargeResultProps) {
  const dc = mode === 'dc'

  return (
    <section
      aria-live="polite"
      aria-label="Estimated charging time"
      className="relative overflow-hidden rounded-2xl bg-plug-navy-950 p-6 text-white sm:p-7"
    >
      {/* One quiet pool of light, so the panel is a surface and not a hole. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-plug-cyan-500/15 blur-3xl"
      />

      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <span className="text-ui-xs font-semibold uppercase tracking-[0.16em] text-plug-cyan-300">
            Estimated charging time
          </span>
          {dc ? (
            <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-ui-xs font-medium text-white/70">
              DC · estimate
            </span>
          ) : null}
        </div>

        <p className="mt-3 text-[clamp(2.75rem,7vw,4rem)] font-bold leading-none tracking-[-0.02em] tabular-nums">
          {result.ok ? (dc ? '~' : '') + formatDuration(result.minutes) : '—'}
        </p>

        <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-ui text-white/70">
          <span className="font-semibold tabular-nums text-white">
            {from}% → {to}%
          </span>
          {result.ok ? (
            <span>
              · {dc ? 'DC' : 'AC'} at {formatKw(result.powerKw)}
            </span>
          ) : null}
        </p>

        {/* The same number, as a time on the clock — what a driver deciding
            whether to wait actually wants to know. */}
        {result.ok && readyText ? (
          <p className="mt-2 flex items-center gap-2 text-ui-sm text-white/70">
            <Clock size={16} className="shrink-0 text-plug-cyan-300" aria-hidden="true" />
            <span>
              Plug in now, {dc ? 'done' : 'ready'} around{' '}
              <strong className="font-semibold text-white">{readyText}</strong>
            </span>
          </p>
        ) : null}

        {result.ok ? (
          <>
            <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-white/10">
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
              <p className="mt-2 text-ui-xs leading-relaxed text-white/50">
                Range is a share of the maker&rsquo;s rated figure{rangeCycle ? ` (${rangeCycle})` : ''}. Real
                driving — speed, AC, hills — usually gives less.
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
              <p className="mt-3 flex gap-2 text-ui-sm leading-relaxed text-white/70">
                <Zap size={16} className="mt-0.5 shrink-0 text-plug-cyan-300" aria-hidden="true" />
                <span>
                  About {formatDuration(result.split.toEightyMin)} to reach 80%, then roughly{' '}
                  {formatDuration(result.split.pastEightyMin)} more for the rest — charging slows sharply
                  near full.
                </span>
              </p>
            ) : null}

            {dc && makerDcMinutes && carName ? (
              <p className="mt-3 text-ui-sm text-white/55">
                For reference, the maker quotes 10–80% in {makerDcMinutes} min on a charger fast enough to
                reach the car&rsquo;s peak.
              </p>
            ) : null}
          </>
        ) : waiting ? (
          <div className="mt-6 rounded-xl bg-white/[0.06] px-4 py-4 text-ui text-white/80">
            <p className="font-semibold text-white">Start with your car</p>
            <p className="mt-1 text-ui-sm leading-relaxed text-white/65">
              Pick it in step 1, or type its battery size if it isn&rsquo;t listed. Your time, range and cost
              appear here as you go.
            </p>
          </div>
        ) : (
          <p className="mt-6 flex items-start gap-2 rounded-xl bg-white/[0.06] px-4 py-3.5 text-ui text-white/80">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-300" aria-hidden="true" />
            {result.message}
          </p>
        )}
      </div>
    </section>
  )
}

function Figure({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="bg-plug-navy-950 px-4 py-3.5">
      <dt className="text-ui-xs text-white/55">{label}</dt>
      <dd
        className={cn(
          'mt-1 text-lg font-semibold tabular-nums',
          muted ? 'text-white/40' : 'text-white',
        )}
      >
        {value}
      </dd>
    </div>
  )
}

/**
 * Why the power is what it is. The single most useful line on the panel: a
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
  } else {
    text = `The charger is the limit here — your car can accept more than ${formatKw(powerKw)}.`
  }

  return (
    <p className="mt-4 flex gap-2 text-ui-sm leading-relaxed text-white/70">
      <Info size={16} className="mt-0.5 shrink-0 text-plug-cyan-300" aria-hidden="true" />
      <span>{text}</span>
    </p>
  )
}
