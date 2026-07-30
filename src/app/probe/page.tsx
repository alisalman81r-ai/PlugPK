// src/app/probe/page.tsx
'use client'

import { ArrowRight, MapPin } from 'lucide-react'
import * as React from 'react'

import {
  Badge,
  Button,
  Card,
  ConnectorBadge,
  ConnectorBadgeGroup,
  Container,
  EyebrowBadge,
  Input,
  NavSkeleton,
  RatingStars,
  SearchInput,
  Section,
  SectionHeader,
  Skeleton,
  SpeedBadge,
  StationCardSkeleton,
  StatusBadge,
  StatusDot,
  Textarea,
  TextSkeleton,
  type BadgeVariant,
} from '@/components/ui'
import { CONNECTOR_TYPES } from '@/lib/constants'
import { MOCK_STATIONS } from '@/lib/mock-data'
import type { StationStatus } from '@/lib/types'

const BTN_VARIANTS = [
  'primary',
  'secondary',
  'ghost',
  'destructive',
  'gradient',
  'outline-white',
] as const
const BTN_SIZES = ['sm', 'md', 'lg', 'xl'] as const
const BADGE_VARIANTS: BadgeVariant[] = [
  'default',
  'blue',
  'cyan',
  'green',
  'amber',
  'red',
  'purple',
  'slate',
]
const STATUSES: StationStatus[] = ['available', 'limited', 'offline', 'unknown']
const CARD_VARIANTS = ['default', 'hoverable', 'flat', 'elevated', 'dark'] as const
const CARD_PADDINGS = ['none', 'sm', 'md', 'lg', 'xl'] as const

export default function ProbePage() {
  const [search, setSearch] = React.useState('Karachi')
  const [rated, setRated] = React.useState(0)
  const station = MOCK_STATIONS[0]!

  return (
    <>
      <Section background="dark">
        <Container>
          {BTN_VARIANTS.map((v) => (
            <div key={v} className="mb-3 flex flex-wrap items-center gap-3">
              {BTN_SIZES.map((s) => (
                <Button key={s} variant={v} size={s}>
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
              <Button variant={v} href="https://plug.pk" external>
                external
              </Button>
              <Button variant={v} href="/map" disabled>
                disabled link
              </Button>
            </div>
          ))}
          <Button fullWidth onClick={() => setRated((r) => r + 1)} id="fw" data-testid="fw">
            fullWidth {rated}
          </Button>
        </Container>
      </Section>

      <Section background="alt">
        <Container size="md">
          <SectionHeader
            eyebrow="Charging Network"
            eyebrowColor="cyan"
            title="Every charger in Pakistan"
            subtitle="Live availability and tariffs across 18 cities."
            action={
              <Button variant="ghost" rightIcon={<ArrowRight size={16} />} href="/map">
                View all
              </Button>
            }
          />
          <div className="mt-8">
            <SectionHeader align="center" titleGradient title="Centered gradient title" subtitle="Centered subtitle." />
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            {BADGE_VARIANTS.map((v) => (
              <Badge key={v} variant={v}>
                {v}
              </Badge>
            ))}
            {(['sm', 'md', 'lg'] as const).map((s) => (
              <Badge key={s} size={s} variant="blue" leftIcon={<MapPin size={12} />}>
                {s}
              </Badge>
            ))}
            {(['blue', 'cyan', 'green', 'amber'] as const).map((c) => (
              <EyebrowBadge key={c} color={c}>
                {c}
              </EyebrowBadge>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {STATUSES.map((s) => (
              <StatusDot key={s} status={s} showLabel />
            ))}
            {(['sm', 'md', 'lg'] as const).map((s) => (
              <StatusDot key={s} status="available" size={s} />
            ))}
            {STATUSES.map((s) => (
              <StatusBadge key={s} status={s} />
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-2">
            {CONNECTOR_TYPES.map((t) => (
              <ConnectorBadge key={t} type={t} showIcon />
            ))}
            {CONNECTOR_TYPES.map((t) => (
              <ConnectorBadge key={`${t}-sm`} type={t} size="sm" />
            ))}
            <ConnectorBadgeGroup connectors={station.connectors} max={2} />
            <ConnectorBadgeGroup connectors={station.connectors} max={9} size="sm" />
            {[3, 22, 60, 150, 350].map((kw) => (
              <SpeedBadge key={kw} speedKw={kw} />
            ))}
            <SpeedBadge speedKw={150} size="sm" />
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <RatingStars rating={4.8} reviewCount={142} showNumber showCount />
            <RatingStars rating={4.3} size="sm" showNumber />
            <RatingStars rating={3.5} size="lg" showNumber />
            <RatingStars rating={0} showNumber />
            <RatingStars rating={5} reviewCount={1} showCount />
            <RatingStars rating={4} interactive onRate={setRated} />
          </div>

          <div className="mt-8 space-y-4">
            <Input label="Name" placeholder="Station name" hint="Public label" />
            <Input label="With icons" leftIcon={<MapPin size={18} />} rightIcon={<ArrowRight size={18} />} />
            <Input label="Error" error="Name is required" />
            <Input label="Success" success="Looks good" />
            <Input label="Loading" isLoading />
            <Input label="Disabled" disabled />
            <SearchInput value={search} onChange={setSearch} />
            <SearchInput value="" onChange={setSearch} />
            <SearchInput value={search} onChange={setSearch} isLoading />
            <Textarea label="Description" hint="Markdown supported" placeholder="Describe it" />
            <Textarea label="Bad" error="Too short" />
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {CARD_VARIANTS.map((v) => (
              <Card key={v} variant={v}>
                <span className={v === 'dark' ? 'text-white' : undefined}>{v}</span>
              </Card>
            ))}
            {CARD_PADDINGS.map((p, i) => (
              <Card key={p} padding={p} animationDelay={i * 100} className="animate-fade-up">
                padding {p}
              </Card>
            ))}
            <Card variant="hoverable" onClick={() => setRated((r) => r + 1)}>
              clickable {rated}
            </Card>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <StationCardSkeleton />
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              {(['sm', 'md', 'lg', 'full'] as const).map((r) => (
                <Skeleton key={r} rounded={r} className="h-8 w-24" />
              ))}
              <TextSkeleton lines={4} lastLineWidth="1/2" />
              <TextSkeleton lines={2} lastLineWidth="full" />
              <TextSkeleton />
              <NavSkeleton />
            </div>
          </div>
        </Container>
      </Section>

      <Section background="gradient" id="grad">
        <Container size="sm">
          <Button variant="outline-white">On gradient</Button>
        </Container>
      </Section>
    </>
  )
}
