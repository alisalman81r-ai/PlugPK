# Hero background video

Drop the footage here as `hero.mp4` (and ideally `hero.webm` beside it), then
open `src/components/home/HeroBackdrop.tsx` and change:

```ts
const HERO_VIDEO: string | null = null
```

to:

```ts
const HERO_VIDEO: string | null = '/video/hero'
```

No other change is needed. Until that constant is set the hero renders the
photograph exactly as it does today, so the page is never waiting on a file
that does not exist.

## What the footage needs to be

**Six to ten seconds, looping cleanly.** The last frame has to be able to cut to
the first without a visible jump, because it will — every ten seconds, for as
long as somebody is on the page.

**No audio track at all.** Not muted: absent. A muted track is still bytes
downloaded on a phone connection to play nothing.

**Graded dark, subject placed high or to one side.** The headline and the search
field occupy the bottom third and the scrim is heavy there. Anything important
in that band will be lost underneath it.

**1920x1080 is enough.** This sits behind a scrim at reduced contrast; a 4K
master spends several megabytes on detail nobody can resolve.

**Aim for under 3 MB.** `-crf 30` in H.264 is usually about right for footage
this short. It is a background, not the content.

## What it must not be

Not a screen recording of the site itself. A UI inside a UI reads as a
screenshot someone forgot to remove, and the text sits directly on top of it.
Real footage — a car at a charger, a hand on a connector, a forecourt at dusk —
is what this frame is built for.

## Who is not allowed to shoot it

Nobody has to. If no footage arrives, the photograph stays and the page is
complete as it is. This is an enhancement, not a gap.
