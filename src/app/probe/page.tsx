// src/app/__probe/page.tsx
'use client'

import { ArrowRight, MapPin } from 'lucide-react'
import * as React from 'react'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { CONNECTOR_TYPES } from '@/lib/constants'
import { MOCK_STATIONS } from '@/lib/mock-data'

const VARIANTS = ['primary', 'secondary', 'ghost', 'outline', 'destructive', 'gradient'] as const
const SIZES = ['sm', 'md', 'lg', 'xl'] as const
const PADDINGS = ['none', 'sm', 'md', 'lg', 'xl'] as const
const SHADOWS = ['none', 'sm', 'md', 'lg'] as const
const RADII = ['md', 'lg', 'xl', '2xl'] as const
const INPUT_SIZES = ['sm', 'md', 'lg'] as const
const INPUT_VARIANTS = ['default', 'search', 'filled'] as const

export default function ProbePage() {
  const [text, setText] = React.useState('Karachi')
  const buttonRef = React.useRef<HTMLButtonElement | HTMLAnchorElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [clicks, setClicks] = React.useState(0)

  return (
    <main className="container-plug space-y-8 py-10">
      <section className="space-y-3">
        {VARIANTS.map((v) => (
          <div key={v} className="flex flex-wrap items-center gap-3">
            {SIZES.map((s) => (
              <Button key={s} variant={v} size={s} ref={s === 'md' ? buttonRef : undefined}>
                {v}/{s}
              </Button>
            ))}
            <Button variant={v} isLoading>
              loading
            </Button>
            <Button variant={v} disabled>
              disabled
            </Button>
            <Button variant={v} leftIcon={<MapPin size={16} />} rightIcon={<ArrowRight size={16} />}>
              icons
            </Button>
            <Button variant={v} href="/map">
              link
            </Button>
            <Button variant={v} href="https://plug.pk" target="_blank">
              external
            </Button>
            <Button variant={v} href="/map" disabled>
              disabled link
            </Button>
          </div>
        ))}
        <Button fullWidth type="submit" ariaLabel="full width submit" onClick={() => setClicks((c) => c + 1)}>
          fullWidth clicks={clicks}
        </Button>
      </section>

      <section className="flex flex-wrap gap-2">
        {CONNECTOR_TYPES.map((c) => (
          <Badge key={c} variant="connector" connectorType={c} />
        ))}
        {CONNECTOR_TYPES.map((c) => (
          <Badge key={`${c}-sm`} variant="connector" connectorType={c} size="sm" />
        ))}
        {[3, 22, 60, 150, 350].map((kw) => (
          <Badge key={kw} variant="speed" speedKw={kw} />
        ))}
        {(['available', 'limited', 'offline', 'unknown'] as const).map((s) => (
          <Badge key={s} variant="status" status={s} />
        ))}
        {(['available', 'limited', 'offline', 'unknown'] as const).map((s) => (
          <Badge key={`${s}-sm`} variant="status" status={s} size="sm" showIcon={false} />
        ))}
        <Badge label="General" />
        <Badge variant="default" label="Verified" size="sm" />
        <Badge variant="status" label="no status prop" />
      </section>

      <section className="space-y-4">
        {INPUT_VARIANTS.map((v) =>
          INPUT_SIZES.map((s) => (
            <Input
              key={`${v}-${s}`}
              variant={v}
              inputSize={s}
              label={`${v} / ${s}`}
              placeholder="Search stations"
              hint="A hint"
            />
          )),
        )}
        <Input
          ref={inputRef}
          label="Controlled + clear"
          value={text}
          onChange={(e) => setText(e.target.value)}
          showClear
          onClear={() => setText('')}
          leftIcon={<MapPin size={18} />}
        />
        <Input label="Uncontrolled + clear" defaultValue="Lahore" showClear onClear={() => undefined} />
        <Input label="Error" error="Station name is required" defaultValue="x" />
        <Input label="Success" success="Looks good" defaultValue="x" />
        <Input label="Loading" isLoading placeholder="Locating…" />
        <Input label="Disabled" disabled placeholder="Unavailable" />
        <Input
          label="Right element"
          rightElement={
            <Button size="sm" variant="ghost">
              Go
            </Button>
          }
        />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {PADDINGS.map((p, i) => (
          <Card key={p} padding={p} animationDelay={i * 100} className="animate-fade-up">
            padding {p}
          </Card>
        ))}
        {SHADOWS.map((s) => (
          <Card key={s} shadow={s}>
            shadow {s}
          </Card>
        ))}
        {RADII.map((r) => (
          <Card key={r} radius={r} hover>
            radius {r}
          </Card>
        ))}
        <Card border={false} shadow="none">
          no border
        </Card>
        <Card clickable onClick={() => setClicks((c) => c + 1)} hover>
          clickable — {clicks}
        </Card>
        <Card padding="none">
          <div className="p-5">
            <Badge variant="status" status={MOCK_STATIONS[0]!.status} />
            <p className="mt-2 font-semibold">{MOCK_STATIONS[0]!.name}</p>
          </div>
        </Card>
      </section>
    </main>
  )
}
