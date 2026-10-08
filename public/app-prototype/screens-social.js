// plug.pk app prototype — the community as a social feed: stories, photo-first
// posts, double-tap to like, polls, and one Create sheet for all three.
'use strict'

const HOUR = 36e5
const SESSION_START = Date.now()
const hoursAgo = (h) => new Date(SESSION_START - h * HOUR).toISOString()

// ─── Stories ───────────────────────────────────────────────────────
// Example stories, built from the same drivers, stations and photos as the
// rest of the prototype. Every one is marked "Example" in the viewer, and a
// station tag says what a driver reported, never live availability.
const EXAMPLE_STORIES = [
  { id: 'st-ahmed', name: 'Ahmed Raza', car: 'BYD Atto 3', h: 2, slides: [
    { img: 'community/m2-trip-1.jpg', cap: 'M-2 northbound. Left Lahore at 92%', tag: { t: 'route', v: 'Lahore|Islamabad', l: 'Lahore → Islamabad' } },
    { img: 'community/m2-trip-2.jpg', cap: 'Bhera stop: 34% left after 265 km', tag: { t: 'route', v: 'Lahore|Islamabad', l: 'Lahore → Islamabad' } },
  ] },
  { id: 'st-club-lhr', name: 'Lahore EV Owners Club', club: 'club-001', h: 4, slides: [
    { img: 'stations/mall-road-ev-hub-2.jpg', cap: 'Sunday meetup at Mall Road, 10 am. Bring questions', tag: { t: 'club', v: 'club-001', l: 'Lahore EV Owners Club' } },
    { img: 'stations/mall-road-ev-hub-3.jpg', cap: 'Chargers on site for anyone who needs a top-up', tag: { t: 'station', v: 'stn-001', l: 'Mall Road EV Hub' } },
  ] },
  { id: 'st-fatima', name: 'Fatima Khan', car: 'MG ZS EV', h: 6, slides: [
    { img: 'community/zs-ev-costs-1.jpg', cap: 'Six months in. My charging bill is in the post', tag: { t: 'tool', v: 'calculator', l: 'Work out your cost' } },
  ] },
  { id: 'st-omar', name: 'Omar Faridi', car: 'Nissan Leaf e+', h: 9, slides: [
    { img: 'stations/dha-charging-hub-2.jpg', cap: 'Charging here this evening', tag: { t: 'station', v: 'stn-006', l: 'DHA Charging Hub' } },
    { img: 'stations/dha-charging-hub-3.jpg', cap: 'Café next door while it charges ☕', tag: { t: 'station', v: 'stn-006', l: 'DHA Charging Hub' } },
  ] },
  { id: 'st-ayesha', name: 'Ayesha Siddiqui', car: 'BYD Seal', h: 12, slides: [
    { car: 'byd-seal', cap: 'Picked it up today 🎉', tag: { t: 'car', v: 'byd-seal', l: 'BYD Seal' } },
  ] },
  { id: 'st-usman', name: 'Usman Tariq', car: 'KIA EV6', h: 16, slides: [
    { img: 'stations/f-10-charging-point-1.jpg', cap: 'Quick top-up before the drive to Murree', tag: { t: 'station', v: 'stn-002', l: 'F-10 Charging Point' } },
  ] },
  { id: 'st-nida', name: 'Nida Aslam', car: 'BYD Seal', h: 21, slides: [
    { img: 'stations/clifton-fast-charge-2.jpg', cap: 'Clifton after dark', tag: { t: 'station', v: 'stn-003', l: 'Clifton Fast Charge' } },
  ] },
]
const STORY_MS = 5000
const STORY_LIFE = 24 * HOUR

/** Your story (if any, still under 24 hours old) first, then unseen, then seen. */
function storyList() {
  const out = []
  const mine = (S.myStory || []).filter((x) => Date.now() - x.at < STORY_LIFE)
  if (mine.length && S.user) out.push({ id: 'me', name: S.user.name, car: myCar()?.name, mine: true, at: mine[mine.length - 1].at, slides: mine })
  const ex = EXAMPLE_STORIES.map((s) => ({ ...s, at: SESSION_START - s.h * HOUR, example: true }))
  return [...out, ...ex.filter((s) => !S.seenStories[s.id]), ...ex.filter((s) => S.seenStories[s.id])]
}
const storyOf = (name) => storyList().find((s) => s.name === name)

function storyAvatar(s, size) {
  return s.club
    ? `<span class="avatar" style="width:${size}px;height:${size}px;background:linear-gradient(135deg,#26CDB2,#0F7A6A);color:#05241E">${ic('users', Math.round(size * 0.45))}</span>`
    : avatarFor(s.name, size)
}
function storiesRow() {
  const list = storyList()
  const hasMine = list[0]?.mine
  const add = S.user && !hasMine
    ? `<button class="sr-item" data-a="addStory"><span class="sr-ring add">${avatarFor(S.user.name, 62)}<i class="sr-plus">${ic('plus', 14, { sw: 3 })}</i></span><span class="sr-name">Your story</span></button>`
    : !S.user ? `<button class="sr-item" data-a="addStory"><span class="sr-ring add"><span class="avatar" style="width:62px;height:62px;background:var(--sunken);color:var(--muted)">${ic('user', 26)}</span><i class="sr-plus">${ic('plus', 14, { sw: 3 })}</i></span><span class="sr-name">Your story</span></button>` : ''
  return `<div class="stories" role="list" aria-label="Stories">${add}${list.map((s, i) => {
    const seen = !s.mine && S.seenStories[s.id]
    return `<button class="sr-item" role="listitem" data-a="openStory" data-v="${i}"><span class="sr-ring ${seen ? 'seen' : ''}">${storyAvatar(s, 62)}</span><span class="sr-name">${s.mine ? 'Your story' : esc(s.name.split(' ')[0])}</span></button>`
  }).join('')}</div>`
}

// The viewer is its own overlay rather than a screen: it runs a timer and
// must not re-render the feed underneath on every tick.
const SV = { list: [], i: 0, j: 0, t0: 0, paused: false, raf: 0, elapsed: 0 }
function openStory(i, j = 0) {
  SV.list = storyList()
  if (!SV.list[i]) return
  SV.i = i; SV.j = j; SV.elapsed = 0; SV.paused = false
  let el = $('#sv')
  if (!el) {
    el = document.createElement('div')
    el.id = 'sv'; el.className = 'sv'
    $('#app').appendChild(el)
    svGestures(el)
  }
  svDraw()
  cancelAnimationFrame(SV.raf)
  SV.t0 = performance.now()
  SV.raf = requestAnimationFrame(svTick)
}
function svDraw() {
  const s = SV.list[SV.i], sl = s.slides[SV.j]
  if (!s.mine) S.seenStories[s.id] = true
  save()
  const src = sl.src || img(sl.img)
  const tag = sl.tag ? `<button class="sv-tag" data-sv="tag">${ic({ station: 'bolt', route: 'route', car: 'car', club: 'users', tool: 'wallet' }[sl.tag.t] || 'pin', 15)}<span>${esc(sl.tag.l)}</span>${ic('chevR', 14)}</button>` : ''
  $('#sv').innerHTML = `
    <div class="sv-media ${sl.car ? 'car' : ''}">${sl.car ? `<img src="${img(carBySlug(sl.car)?.image)}" alt="">` : `<img src="${src}" alt="">`}</div>
    <div class="sv-shade"></div>
    <div class="sv-top">
      <div class="sv-bars">${s.slides.map((_, k) => `<i><b style="width:${k < SV.j ? 100 : 0}%"></b></i>`).join('')}</div>
      <div class="sv-head">${storyAvatar(s, 34)}
        <div class="grow" style="min-width:0"><b class="trunc">${esc(s.mine ? 'Your story' : s.name)}</b><span>${s.car ? `${esc(s.car)} · ` : ''}${ago(new Date(sl.at || s.at).toISOString()).replace(' ago', '')}</span></div>
        ${s.example ? '<span class="sv-ex">Example</span>' : ''}
        <button class="sv-x" data-sv="close" aria-label="Close">${ic('x', 24)}</button>
      </div>
    </div>
    <div class="sv-bottom">
      ${sl.cap ? `<p class="sv-cap">${esc(sl.cap)}</p>` : ''}
      ${tag}
      ${s.mine ? `<div class="sv-reply"><span class="sv-mine">${ic('eye', 16)} Seen by drivers in ${esc(S.city)}</span><button class="sv-ico" data-sv="delete" aria-label="Delete">${ic('trash', 20)}</button></div>`
        : `<form class="sv-reply" data-sv-form><input class="sv-input" placeholder="Reply to ${esc(s.name.split(' ')[0])}…" maxlength="200"><button type="button" class="sv-ico ${S.storyLikes[s.id] ? 'on' : ''}" data-sv="like" aria-label="Like">${ic('heart', 24, { fill: !!S.storyLikes[s.id] })}</button><button class="sv-ico" aria-label="Send">${ic('send', 22)}</button></form>`}
    </div>`
}
function svTick(now) {
  if (!$('#sv')) return
  if (!SV.paused) SV.elapsed += now - SV.t0
  SV.t0 = now
  const bar = $$('#sv .sv-bars b')[SV.j]
  if (bar) bar.style.width = `${Math.min(100, (SV.elapsed / STORY_MS) * 100)}%`
  if (SV.elapsed >= STORY_MS) return svStep(1)
  SV.raf = requestAnimationFrame(svTick)
}
function svStep(d) {
  const s = SV.list[SV.i]
  SV.j += d
  if (SV.j >= s.slides.length) { SV.i++; SV.j = 0 }
  else if (SV.j < 0) { SV.i--; SV.j = SV.i >= 0 ? SV.list[SV.i].slides.length - 1 : 0 }
  if (SV.i < 0) { SV.i = 0; SV.j = 0 }
  if (SV.i >= SV.list.length) return closeStory()
  SV.elapsed = 0; SV.t0 = performance.now()
  svDraw()
  cancelAnimationFrame(SV.raf)
  SV.raf = requestAnimationFrame(svTick)
}
function closeStory() {
  cancelAnimationFrame(SV.raf)
  const el = $('#sv')
  if (el) { el.classList.add('out'); setTimeout(() => el.remove(), 200) }
  if (cur().s === 'community') render()
}
function svGestures(el) {
  let x0 = 0, y0 = 0, t = 0, held = false, holdT = 0
  el.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button, input, form')) return
    x0 = e.clientX; y0 = e.clientY; t = Date.now(); held = false
    holdT = setTimeout(() => { held = true; SV.paused = true; el.classList.add('held') }, 220)
  })
  el.addEventListener('pointerup', (e) => {
    clearTimeout(holdT)
    if (e.target.closest('button, input, form')) return
    el.classList.remove('held')
    if (held) { SV.paused = false; return }
    const dy = e.clientY - y0
    if (dy > 70) return closeStory()
    if (Date.now() - t > 600) return
    const r = el.getBoundingClientRect()
    svStep(e.clientX - r.left < r.width / 3 ? -1 : 1)
  })
  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-sv]')
    if (!b) return
    const s = SV.list[SV.i], sl = s.slides[SV.j]
    const k = b.dataset.sv
    if (k === 'close') closeStory()
    else if (k === 'like') {
      S.storyLikes[s.id] ? delete S.storyLikes[s.id] : (S.storyLikes[s.id] = true); save()
      b.classList.toggle('on', !!S.storyLikes[s.id]); b.innerHTML = ic('heart', 24, { fill: !!S.storyLikes[s.id] })
    } else if (k === 'delete') {
      S.myStory = (S.myStory || []).filter((x) => x !== sl); save()
      toast('Removed from your story', 'trash')
      if (!S.myStory.length) return closeStory()
      SV.list = storyList(); SV.j = Math.min(SV.j, SV.list[0].slides.length - 1); svDraw()
    } else if (k === 'tag') {
      closeStory()
      const g = sl.tag
      if (g.t === 'station') go('station', { id: g.v })
      else if (g.t === 'car') go('car', { slug: g.v })
      else if (g.t === 'route') A.planPopular(g.v)
      else if (g.t === 'club') go('clubs')
      else if (g.t === 'tool') go(g.v)
    }
  })
  el.addEventListener('focusin', () => { SV.paused = true })
  el.addEventListener('focusout', () => { SV.paused = false })
  el.addEventListener('submit', (e) => {
    e.preventDefault()
    const inp = el.querySelector('.sv-input')
    if (!inp.value.trim()) return
    if (!S.user) { closeStory(); return needSignIn('Sign in to reply to stories.') }
    inp.value = ''; inp.blur()
    toast(`Reply sent to ${SV.list[SV.i].name.split(' ')[0]}`, 'send')
  })
}

// ─── Posts ─────────────────────────────────────────────────────────
/** A date halfway between the k-th and (k+1)-th newest posts, so polls sit among them in the feed. */
function betweenPosts(k) {
  const d = D.posts.map((p) => +new Date(p.date)).sort((a, b) => b - a)
  return new Date((d[k] + (d[k + 1] ?? d[k] - 864e5)) / 2).toISOString()
}
const EXAMPLE_POLLS = [
  { id: 'poll-001', slug: 'poll-seal-or-l07', name: 'Hassan Ali', car: 'MG ZS EV', category: 'buying-advice', example: true,
    title: 'Around PKR 1.5 Cr, which one would you buy?', body: '', photos: [], likes: 24, date: betweenPosts(1), comments: [],
    poll: { options: ['BYD Seal', 'Deepal L07', 'BYD Sealion 7', 'Wait for next year'], votes: [41, 18, 27, 9] } },
  { id: 'poll-002', slug: 'poll-home-charger', name: 'Saad Rehman', car: 'BYD Atto 3', category: 'charging-experience', example: true,
    title: 'Where do you charge most of the time?', body: '', photos: [], likes: 15, date: betweenPosts(4), comments: [],
    poll: { options: ['At home', 'At work', 'Public fast chargers', 'A mix'], votes: [63, 11, 9, 17] } },
]
function allPosts() {
  return [...S.myPosts, ...EXAMPLE_POLLS, ...D.posts].map((p) => ({
    ...p,
    photos: p.photos || [],
    likes: (p.likes || 0) + (S.liked[p.id] ? 1 : 0),
    comments: [...(p.comments || []), ...(S.myComments[p.id] || [])],
  }))
}

function pollBlock(p) {
  const mine = S.votes[p.id]
  const votes = p.poll.votes.map((v, k) => v + (mine === k ? 1 : 0))
  const total = votes.reduce((a, b) => a + b, 0)
  const top = Math.max(...votes)
  return `<div class="poll">${p.poll.options.map((o, k) => {
    const pct = total ? Math.round((votes[k] / total) * 100) : 0
    return mine == null
      ? `<button class="poll-opt" data-a="vote" data-v="${p.id}|${k}">${esc(o)}</button>`
      : `<div class="poll-res ${mine === k ? 'mine' : ''} ${votes[k] === top ? 'top' : ''}"><i style="width:${pct}%"></i><span>${esc(o)}${mine === k ? ` ${ic('check', 14, { sw: 3 })}` : ''}</span><b class="mono">${pct}%</b></div>`
  }).join('')}
    <p class="poll-meta"><span class="mono">${n0(total)}</span> votes${mine == null ? ' · Tap to vote' : ` · <button class="link" data-a="unvote" data-v="${p.id}">Change vote</button>`}</p></div>`
}

const CAT_TONE = { general: 'teal', 'charging-experience': 'green', 'trip-report': 'purple', 'vehicle-review': 'amber', 'buying-advice': 'mint', 'ev-news': 'red' }

function postCard(p) {
  const liked = !!S.liked[p.id], saved = S.savedPosts.includes(p.id)
  const st = storyOf(p.name)
  const av = st
    ? `<button class="sr-ring sm ${!st.mine && S.seenStories[st.id] ? 'seen' : ''}" data-a="openStory" data-v="${storyList().indexOf(st)}" aria-label="View ${esc(p.name)}’s story">${avatarFor(p.name, 34)}</button>`
    : `<span class="ig-av">${avatarFor(p.name, 34)}</span>`
  let media = ''
  if (p.photos.length) {
    media = `<div class="ig-media" data-dbl="${p.id}">
        <div class="ig-track">${p.photos.map((ph) => `<img src="${img(ph)}" alt="" loading="lazy">`).join('')}</div>
        ${p.photos.length > 1 ? `<span class="ig-count mono"><b>1</b>/${p.photos.length}</span>` : ''}
        <span class="ig-burst">${ic('heart', 96, { fill: true })}</span>
      </div>
      ${p.photos.length > 1 ? `<div class="ig-dots">${p.photos.map((_, k) => `<i class="${k ? '' : 'on'}"></i>`).join('')}</div>` : ''}`
  } else if (!p.poll) {
    media = `<div class="ig-media ig-text tone-${CAT_TONE[p.category] || 'teal'}" data-dbl="${p.id}">
        <span class="ig-text-cat">${CAT[p.category]?.[0] || ''}</span>
        <h3>${esc(p.title)}</h3>
        <span class="ig-text-by">${esc(p.name)}${p.car ? ` · ${esc(p.car)}` : ''}</span>
        <span class="ig-burst">${ic('heart', 96, { fill: true })}</span>
      </div>`
  }
  const caption = p.photos.length ? p.title : ''
  const body = (p.body || '').replace(/\s+/g, ' ').trim()
  return `<article class="ig-post">
    <header class="ig-head">${av}
      <div class="grow" style="min-width:0">
        <div class="row" style="gap:6px"><b class="t14 trunc">${esc(p.name)}</b>${p.mine ? '<span class="badge b-teal">You</span>' : ''}${p.example ? '<span class="badge b-slate">Example</span>' : ''}</div>
        <div class="t12 faint trunc">${p.car ? `${esc(p.car)} · ` : ''}${CAT[p.category]?.[0] || ''}</div>
      </div>
      <button class="icon-btn" data-a="postMenu" data-v="${p.id}" aria-label="More">${ic('dots', 22)}</button>
    </header>
    ${p.poll ? `<div class="ig-poll"><h3>${esc(p.title)}</h3>${pollBlock(p)}</div>` : media}
    <div class="ig-actions">
      <button class="${liked ? 'liked' : ''}" data-a="like" data-v="${p.id}" aria-pressed="${liked}" aria-label="Like">${ic('heart', 25, { fill: liked })}</button>
      <button data-a="go" data-v="post" data-id="${p.id}" aria-label="Comments">${ic('chat', 24)}</button>
      <button data-a="sharePost" data-v="${p.id}" aria-label="Share">${ic('send', 23)}</button>
      <span class="grow"></span>
      <button class="${saved ? 'saved' : ''}" data-a="savePost" data-v="${p.id}" aria-pressed="${saved}" aria-label="Save">${ic('bookmark', 24, { fill: saved })}</button>
    </div>
    <div class="ig-meta">
      <b class="t14">${n0(p.likes)} ${p.likes === 1 ? 'like' : 'likes'}</b>
      ${caption || body ? `<p class="ig-cap"><b>${esc(p.name)}</b> ${caption ? esc(caption) : ''}${body ? `${caption ? ' — ' : ''}<span class="faint-2">${esc(body.slice(0, 120))}</span>${body.length > 120 ? `… <button class="ig-more" data-a="go" data-v="post" data-id="${p.id}">more</button>` : ''}` : ''}</p>` : ''}
      ${p.comments.length ? `<button class="ig-comments" data-a="go" data-v="post" data-id="${p.id}">View ${p.comments.length === 1 ? 'the reply' : `all ${p.comments.length} replies`}</button>` : `<button class="ig-comments" data-a="go" data-v="post" data-id="${p.id}">Be the first to reply</button>`}
      <span class="ig-time">${ago(p.date)}</span>
    </div>
  </article>`
}

/** Double-tap a photo to like it, and keep each carousel's counter in step. */
function feedGestures() {
  const sc = $('#screen .scroll')
  if (!sc) return
  let last = 0, lastId = null
  sc.addEventListener('click', (e) => {
    const m = e.target.closest('[data-dbl]')
    if (!m) return
    const now = Date.now(), id = m.dataset.dbl
    if (now - last < 320 && lastId === id) {
      last = 0
      if (!S.user) return needSignIn('Sign in to like posts and reply to drivers.')
      const burst = m.querySelector('.ig-burst')
      burst.classList.remove('go'); void burst.offsetWidth; burst.classList.add('go')
      if (!S.liked[id]) { S.liked[id] = true; save(); setTimeout(render, 650) }
    } else { last = now; lastId = id }
  })
  $$('#screen .ig-track').forEach((t) => {
    const media = t.parentElement, dots = media.nextElementSibling
    t.addEventListener('scroll', () => {
      const k = Math.round(t.scrollLeft / t.clientWidth)
      const c = media.querySelector('.ig-count b')
      if (c) c.textContent = k + 1
      if (dots?.classList.contains('ig-dots')) [...dots.children].forEach((d, n) => d.classList.toggle('on', n === k))
    }, { passive: true })
  })
}

SCREENS.community = () => {
  const c = U.comm
  const all = allPosts()
  const q = (c.q || '').trim().toLowerCase()
  let posts = all.filter((p) => (c.cat === 'all' || p.category === c.cat) && (!q || `${p.title} ${p.body} ${p.name} ${p.car || ''}`.toLowerCase().includes(q)))
  posts = c.sort === 'latest' ? posts.sort((a, b) => new Date(b.date) - new Date(a.date)) : c.sort === 'liked' ? posts.sort((a, b) => b.likes - a.likes) : posts.sort((a, b) => b.comments.length - a.comments.length)
  const tabs = [['latest', 'Latest'], ['liked', 'Popular'], ['discussed', 'Most active']]
  const topics = [['all', 'All'], ...Object.entries(CAT).map(([k, [l]]) => [k, l])]
  const clubs = [...D.clubs].sort((a, b) => (a.city === S.city ? -1 : b.city === S.city ? 1 : b.members - a.members))
  const searching = c.search || q
  const clubStrip = `<section class="ig-suggest">
      <div class="row between" style="padding:0 16px"><b class="t15">EV clubs near you</b><button class="link" data-a="go" data-v="clubs">See all</button></div>
      <div class="hscroll mt-12">${clubs.map((x) => {
        const joined = S.clubs.includes(x.id)
        return `<div class="ig-club"><span class="avatar" style="width:56px;height:56px;background:linear-gradient(135deg,#26CDB2,#0F7A6A);color:#05241E">${ic('users', 24)}</span>
          <b class="t13 clamp2">${esc(x.name)}</b><span class="t12 faint">${esc(x.city)} · <span class="mono">${x.members + (joined ? 1 : 0)}</span></span>
          <button class="btn btn-sm ${joined ? 'btn-secondary' : 'btn-primary'} btn-block" data-a="joinClub" data-v="${x.id}">${joined ? 'Joined' : 'Join'}</button></div>`
      }).join('')}</div>
    </section>`
  const feed = posts.map((p, k) => postCard(p) + (k === 2 && !q && c.cat === 'all' ? clubStrip : '')).join('')
  return {
    sb: 'dark', tabs: true,
    html: `<header class="ig-top">
        <h1>Community</h1>
        <button class="icon-btn ${searching ? 'on' : ''}" data-a="commSearch" aria-label="Search">${ic('search', 22)}</button>
        <button class="icon-btn" data-a="newPost" aria-label="Create">${ic('plusSq', 24)}</button>
      </header>
      <div class="scroll">
        ${searching ? `<div class="pad" style="padding-top:4px;padding-bottom:8px"><div class="field"><span class="lead">${ic('search', 18)}</span><input class="input" id="cm-q" data-in="commQ" placeholder="Search posts, topics, people" value="${esc(c.q || '')}" autocomplete="off"></div></div>` : ''}
        ${!q ? storiesRow() : ''}
        <div class="ig-bar">
          <div class="cm-tabs" role="tablist">${tabs.map(([k, l]) => `<button role="tab" aria-selected="${c.sort === k}" class="${c.sort === k ? 'on' : ''}" data-a="commSort" data-v="${k}">${l}</button>`).join('')}</div>
          <div class="chips" style="padding-top:10px;padding-bottom:10px">${topics.map(([k, l]) => `<button class="chip ${c.cat === k ? 'solid on' : ''}" data-a="commCat" data-v="${k}">${l}</button>`).join('')}</div>
        </div>
        ${q ? `<p class="pad t13 muted" style="padding-top:12px"><b class="mono" style="color:var(--fg)">${posts.length}</b> result${posts.length === 1 ? '' : 's'} for “${esc(c.q.trim())}”</p>` : ''}
        <div class="ig-feed">${feed || `<div class="pad"><div class="empty mt-16">${q ? `Nothing matches “${esc(c.q.trim())}”. Try another word, or ask it yourself.` : 'No posts in this topic yet. Start the conversation.'}<button class="btn btn-sm btn-primary" data-a="newPost">${ic('pencil', 16)}New post</button></div></div>`}</div>
      </div>`,
    after: feedGestures,
  }
}

Object.assign(A, {
  commSearch: () => { U.comm.search = !U.comm.search; if (!U.comm.search) U.comm.q = ''; render(); if (U.comm.search) $('#cm-q')?.focus() },
  openStory: (v) => openStory(+v),
  savePost: (id) => {
    const on = S.savedPosts.includes(id)
    S.savedPosts = on ? S.savedPosts.filter((x) => x !== id) : [id, ...S.savedPosts]
    save(); render(); toast(on ? 'Removed from saved' : 'Saved', 'bookmark')
  },
  vote: (v) => {
    if (!S.user) return needSignIn('Sign in to vote in polls.')
    const [id, k] = v.split('|'); S.votes[id] = +k; save(); render()
  },
  unvote: (id) => { delete S.votes[id]; save(); render() },
  postMenu: (id) => openSheet('postMenu', { id }),
  reportPost: () => { closeSheet(); toast('Reported. A moderator will review it', 'flag') },
  addStory: () => {
    if (!S.user) return needSignIn('Sign in to share a story with drivers near you.')
    U.story = { src: null, cap: '', tag: null }
    openSheet('addStory')
  },
  storyPhoto: (v) => { U.story.src = v; U.story.cap = $('#sd-cap')?.value ?? U.story.cap; renderSheet() },
  storyTag: (v) => { U.story.tag = U.story.tag === v ? null : v; U.story.cap = $('#sd-cap')?.value ?? U.story.cap; renderSheet() },
  publishStory: () => {
    const d = U.story
    if (!d.src) return toast('Pick a photo first', 'image')
    d.cap = $('#sd-cap').value.trim()
    const [t, v] = (d.tag || '').split(':')
    const tag = t === 'station' ? { t, v, l: stById(v)?.name } : t === 'car' ? { t, v, l: carBySlug(v)?.name } : null
    S.myStory = [...(S.myStory || []).filter((x) => Date.now() - x.at < STORY_LIFE), { src: d.src, cap: d.cap, tag, at: Date.now() }].slice(-10)
    save(); closeSheet(); render()
    toast('Added to your story for 24 hours', 'check')
  },
})

SHEETS.postMenu = ({ id }) => {
  const p = postById(id)
  return {
    title: 'Post',
    body: `<div class="list" style="margin:0 -4px">
      <button class="list-row" data-a="sharePost" data-v="${id}"><span class="ico">${ic('link', 18)}</span><span class="grow">Copy link</span></button>
      <button class="list-row" data-a="savePost" data-v="${id}"><span class="ico">${ic('bookmark', 18)}</span><span class="grow">${S.savedPosts.includes(id) ? 'Remove from saved' : 'Save post'}</span></button>
      ${p && !p.mine ? `<button class="list-row" data-a="reportPost"><span class="ico" style="background:var(--danger-tint, #FDECEC);color:var(--danger, #C2410C)">${ic('flag', 18)}</span><span class="grow">Report post<br><span class="t12 faint">Spam, abuse or wrong charger information</span></span></button>` : ''}
    </div>`,
  }
}

/** Photos people can pick in the prototype, besides one from their own device. */
const SAMPLE_PHOTOS = ['stations/gulberg-charging-station-1.jpg', 'stations/blue-area-ev-station-1.jpg', 'stations/mall-road-ev-hub-1.jpg', 'community/m2-trip-1.jpg', 'stations/dha-charging-hub-1.jpg', 'stations/clifton-fast-charge-1.jpg']
function photoPicker(action, chosen, multi) {
  const has = (p) => (multi ? chosen.includes(p) : chosen === p)
  return `<div class="pp">
      <label class="pp-up">${ic('image', 22)}<span>From phone</span><input type="file" accept="image/*" data-ch="${action}File" hidden></label>
      ${SAMPLE_PHOTOS.map((p) => `<button class="pp-item ${has(img(p)) ? 'on' : ''}" data-a="${action}" data-v="${img(p)}"><img src="${img(p)}" alt="">${has(img(p)) ? `<i>${ic('check', 14, { sw: 3 })}</i>` : ''}</button>`).join('')}
      ${(multi ? chosen : [chosen]).filter((x) => x && x.startsWith('data:')).map((p) => `<button class="pp-item on" data-a="${action}" data-v="${p}"><img src="${p}" alt=""><i>${ic('check', 14, { sw: 3 })}</i></button>`).join('')}
    </div>`
}
/** A phone photo, shrunk to 720 px so it fits in local storage. */
function readPhoto(file, done) {
  if (!file) return
  const r = new FileReader()
  r.onload = () => {
    const im = new Image()
    im.onload = () => {
      const k = Math.min(1, 720 / Math.max(im.width, im.height))
      const cv = document.createElement('canvas')
      cv.width = Math.round(im.width * k); cv.height = Math.round(im.height * k)
      cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height)
      done(cv.toDataURL('image/jpeg', 0.78))
    }
    im.src = r.result
  }
  r.readAsDataURL(file)
}
IN.storyPhotoFile = (_, el) => readPhoto(el.files[0], (u) => A.storyPhoto(u))
IN.draftPhotoFile = (_, el) => readPhoto(el.files[0], (u) => A.draftPhoto(u))

SHEETS.addStory = () => {
  const d = U.story
  const near = D.stations.filter((s) => s.city === S.city).concat(D.stations.filter((s) => s.city !== S.city)).slice(0, 4)
  const car = myCar()
  return {
    title: 'Add to your story', full: true,
    body: `${d.src ? `<div class="sd-preview"><img src="${d.src}" alt=""></div>` : ''}
      <p class="label ${d.src ? 'mt-16' : ''}">Photo</p>
      ${photoPicker('storyPhoto', d.src, false)}
      <label class="label mt-20" for="sd-cap">Caption</label>
      <input class="input" id="sd-cap" maxlength="90" placeholder="e.g. Charging before the motorway" value="${esc(d.cap)}">
      <p class="label mt-20">Tag it <span class="faint" style="font-weight:500">(optional)</span></p>
      <div class="row wrap">
        ${near.map((s) => `<button class="chip ${d.tag === `station:${s.id}` ? 'on' : ''}" data-a="storyTag" data-v="station:${s.id}">${ic('bolt', 14)}${esc(s.name)}</button>`).join('')}
        ${car ? `<button class="chip ${d.tag === `car:${car.slug}` ? 'on' : ''}" data-a="storyTag" data-v="car:${car.slug}">${ic('car', 14)}${esc(car.name)}</button>` : ''}
      </div>
      <p class="hint">Stories disappear after 24 hours. A station tag shows where you were, not whether its chargers are free now.</p>`,
    foot: `<button class="btn btn-ghost" data-a="closeSheet">Cancel</button><button class="btn btn-primary grow" data-a="publishStory">${ic('plus', 18)}Share to story</button>`,
  }
}

// ─── Create: a post, a photo post or a poll ───────────────────────
Object.assign(A, {
  newPost: () => {
    if (!S.user) return needSignIn('Sign in to post. Your name and car show on the post.')
    U.draft = { kind: 'photo', title: '', body: '', cat: 'general', photos: [], opts: ['', ''] }
    openSheet('newPost')
  },
  draftKeep: () => {
    const d = U.draft
    d.title = $('#np-title')?.value ?? d.title
    d.body = $('#np-body')?.value ?? d.body
    d.opts = d.opts.map((o, k) => $(`#np-opt-${k}`)?.value ?? o)
  },
  draftKind: (v) => { A.draftKeep(); U.draft.kind = v; U.draft.err = null; renderSheet() },
  draftCat: (v) => { A.draftKeep(); U.draft.cat = v; renderSheet() },
  draftPhoto: (v) => {
    A.draftKeep()
    const ph = U.draft.photos
    U.draft.photos = ph.includes(v) ? ph.filter((x) => x !== v) : [...ph, v].slice(0, 4)
    renderSheet()
  },
  draftOpt: () => { A.draftKeep(); if (U.draft.opts.length < 4) U.draft.opts.push(''); renderSheet() },
  publishPost: () => {
    A.draftKeep()
    const d = U.draft
    d.title = d.title.trim(); d.body = d.body.trim()
    const opts = d.opts.map((o) => o.trim()).filter(Boolean)
    d.err = d.kind === 'photo' && !d.photos.length ? 'Pick at least one photo.'
      : d.kind === 'poll' && d.title.length < 8 ? 'Write a question of at least 8 characters.'
      : d.kind === 'poll' && opts.length < 2 ? 'Give at least two options.'
      : d.kind !== 'poll' && d.title.length < 8 ? (d.kind === 'photo' ? 'Add a caption of at least 8 characters.' : 'Give your post a title of at least 8 characters.')
      : d.kind === 'text' && d.body.length < 20 ? 'Add a bit more detail, at least 20 characters.' : null
    if (d.err) return renderSheet()
    const id = 'my-post-' + Date.now()
    S.myPosts.unshift({
      id, slug: id, name: S.user.name, car: myCar()?.name, title: d.title, body: d.kind === 'poll' ? '' : d.body, category: d.cat,
      photos: d.kind === 'photo' ? d.photos : [], likes: 0, date: new Date().toISOString(), comments: [], mine: true,
      ...(d.kind === 'poll' ? { poll: { options: opts, votes: opts.map(() => 0) } } : {}),
    })
    try { save() } catch { /* storage full: still shown this session */ }
    closeSheet(); U.comm.cat = 'all'; U.comm.sort = 'latest'; U.comm.q = ''
    if (cur().s !== 'community') tab('community'); else render()
    $('#screen .scroll')?.scrollTo({ top: 0 })
    toast(d.kind === 'poll' ? 'Poll posted' : 'Posted to the community', 'check')
  },
})
SHEETS.newPost = () => {
  const d = U.draft
  const kinds = [['photo', 'image', 'Photo'], ['text', 'pencil', 'Question'], ['poll', 'chart', 'Poll']]
  return {
    title: 'Create', full: true,
    body: `<div class="seg" role="tablist" style="margin-bottom:18px">${kinds.map(([k, i, l]) => `<button role="tab" aria-selected="${d.kind === k}" class="${d.kind === k ? 'on' : ''}" data-a="draftKind" data-v="${k}">${ic(i, 16)}${l}</button>`).join('')}</div>
      ${d.kind === 'photo' ? `<p class="label">Photos <span class="faint" style="font-weight:500">(up to 4)</span></p>${photoPicker('draftPhoto', d.photos, true)}` : ''}
      <label class="label ${d.kind === 'photo' ? 'mt-20' : ''}" for="np-title">${d.kind === 'poll' ? 'Question' : d.kind === 'photo' ? 'Caption' : 'Title'}</label>
      <input class="input" id="np-title" maxlength="120" placeholder="${d.kind === 'poll' ? 'e.g. Which charger network do you trust most?' : d.kind === 'photo' ? 'e.g. First motorway run in the Seal' : 'e.g. Lahore to Islamabad in a ZS EV, how many stops?'}" value="${esc(d.title)}">
      ${d.kind === 'poll' ? `<p class="label mt-16">Options</p><div class="stack gap-8">${d.opts.map((o, k) => `<input class="input" id="np-opt-${k}" maxlength="40" placeholder="Option ${k + 1}" value="${esc(o)}">`).join('')}</div>
        ${d.opts.length < 4 ? `<button class="btn btn-sm btn-ghost mt-8" data-a="draftOpt">${ic('plus', 16)}Add option</button>` : ''}`
        : `<label class="label mt-16" for="np-body">${d.kind === 'photo' ? 'More detail' : 'What do you want to ask?'} ${d.kind === 'photo' ? '<span class="faint" style="font-weight:500">(optional)</span>' : ''}</label>
        <textarea class="textarea" id="np-body" maxlength="2000" style="min-height:${d.kind === 'photo' ? 96 : 160}px" placeholder="Car, route, charger, speed, cost: whatever helps other drivers.">${esc(d.body)}</textarea>`}
      <p class="label mt-20">Topic</p>
      <div class="row wrap">${Object.entries(CAT).map(([k, [l]]) => `<button class="chip ${d.cat === k ? 'on' : ''}" data-a="draftCat" data-v="${k}">${d.cat === k ? ic('check', 14, { sw: 2.4 }) : ''}${l}</button>`).join('')}</div>
      ${d.err ? `<p class="err-msg">${ic('info', 15)}${d.err}</p>` : `<p class="hint">Posting as ${esc(S.user?.name)}${myCar() ? ` · ${esc(myCar().name)}` : ''}</p>`}`,
    foot: `<button class="btn btn-ghost" data-a="closeSheet">Cancel</button><button class="btn btn-primary grow" data-a="publishPost">Share</button>`,
  }
}
