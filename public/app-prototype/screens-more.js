// plug.pk app prototype — community, clubs, services, tools, profile, settings, partners.
'use strict'

function needSignIn(why) {
  U.authErr = null
  openSheet('signin', { why })
}

// ─── Community ─────────────────────────────────────────────────────
function allPosts() {
  return [...S.myPosts, ...D.posts].map((p) => ({
    ...p,
    likes: p.likes + (S.liked[p.id] ? 1 : 0),
    comments: [...p.comments, ...(S.myComments[p.id] || [])],
  }))
}
const postById = (id) => allPosts().find((p) => p.id === id)
const catTag = (c) => `<span class="badge ${CAT[c]?.[1] || 'b-slate'}">${CAT[c]?.[0] || c}</span>`

function postRow(p) {
  return `<button class="card press row" style="padding:14px;gap:12px;text-align:left;align-items:flex-start" data-a="go" data-v="post" data-id="${p.id}">
    ${p.photos[0] ? `<img src="${img(p.photos[0])}" alt="" style="width:72px;height:72px;border-radius:12px;object-fit:cover;flex:none">` : `<span style="width:72px;height:72px;border-radius:12px;flex:none;display:grid;place-items:center;background:var(--tint);color:var(--accent)">${ic('bolt', 28, { sw: 1.4 })}</span>`}
    <span class="grow" style="min-width:0">${catTag(p.category)}<b class="t15 clamp2 mt-4" style="line-height:1.35">${esc(p.title)}</b>
    <span class="t12 faint row mt-4" style="gap:10px">${esc(p.name)} · ${ago(p.date)}<span class="row" style="gap:3px">${ic('heart', 12)}${p.likes}</span><span class="row" style="gap:3px">${ic('chat', 12)}${p.comments.length}</span></span></span>
  </button>`
}
function postCard(p) {
  const liked = !!S.liked[p.id]
  return `<article class="frame post-card"><div class="face" style="padding:0;overflow:hidden">
    <button data-a="go" data-v="post" data-id="${p.id}" style="display:block;width:100%;text-align:left">
      ${p.photos[0] ? `<div class="cover"><img src="${img(p.photos[0])}" alt="" loading="lazy"></div>` : ''}
      <div class="bd">
        <div class="row" style="gap:10px"><span class="avatar">${initial(p.name)}</span><span class="grow" style="min-width:0"><b class="t14">${esc(p.name)}</b>${p.mine ? ' <span class="badge b-teal">You</span>' : ''}<br><span class="t12 faint">${p.car ? `${ic('car', 12).replace('class="i"', 'class="i" style="display:inline;vertical-align:-2px"')} ${esc(p.car)}` : 'EV driver'}</span></span>${catTag(p.category)}</div>
        <h3 class="t17 clamp2 mt-12" style="line-height:1.3">${esc(p.title)}</h3>
        <p class="t14 muted clamp3 mt-4">${esc(p.body)}</p>
      </div>
    </button>
    <div class="row" style="padding:0 8px 8px 16px;gap:4px">
      <span class="t13 faint row grow" style="gap:6px">${ic('clock', 14)}${ago(p.date)}</span>
      <button class="btn btn-sm btn-ghost" style="${liked ? 'color:var(--heart)' : ''}" data-a="like" data-v="${p.id}" aria-pressed="${liked}">${ic('heart', 16, { fill: liked })}<span class="mono">${p.likes}</span></button>
      <button class="btn btn-sm btn-ghost" data-a="go" data-v="post" data-id="${p.id}">${ic('chat', 16)}<span class="mono">${p.comments.length}</span></button>
      <button class="btn btn-sm btn-ghost btn-icon" style="width:36px" data-a="sharePost" data-v="${p.id}" aria-label="Share">${ic('share', 16)}</button>
    </div>
  </div></article>`
}

SCREENS.community = () => {
  const c = U.comm
  let posts = allPosts().filter((p) => c.cat === 'all' || p.category === c.cat)
  posts = c.sort === 'latest' ? posts.sort((a, b) => new Date(b.date) - new Date(a.date)) : c.sort === 'liked' ? posts.sort((a, b) => b.likes - a.likes) : posts.sort((a, b) => b.comments.length - a.comments.length)
  const all = allPosts()
  const cities = new Set(D.clubs.map((x) => x.city)).size
  return {
    sb: 'light', tabs: true,
    html: `<div class="scroll">
      <header class="band lift">
        <div class="eyebrow" style="position:relative">${ic('users', 13)} Community</div>
        <h1 class="band-title mt-8" style="position:relative">Ask drivers who’ve <span class="hl">done the drive</span></h1>
        <div class="stat-rail" style="position:relative">
          <div><div class="fig hi">${ic('chat', 14)}${all.length}</div><div class="lbl">Posts</div></div>
          <div><div class="fig">${ic('users', 14)}${D.clubs.length}</div><div class="lbl">Clubs</div></div>
          <div><div class="fig">${ic('pin', 14)}${cities}</div><div class="lbl">Cities</div></div>
        </div>
      </header>
      <div class="pad lifted">
        <div class="sheet-card" style="overflow:hidden">
          <div style="padding:16px 20px;background:linear-gradient(90deg,var(--surface-2),var(--surface));border-bottom:1px solid var(--line)">
            <div class="eyebrow">${ic('sort', 13)} Browse</div>
            <div class="row between mt-4"><h2 class="t24">Discussions</h2><span class="t13 muted">Showing <b class="mono" style="color:var(--fg)">${posts.length}</b> of ${all.length}</span></div>
          </div>
          <div style="padding:12px">
            <div class="seg">${[['latest', 'Latest', 'newest first'], ['liked', 'Popular', 'most liked'], ['discussed', 'Active', 'most replies']].map(([k, l, s]) => `<button class="${c.sort === k ? 'on' : ''}" data-a="commSort" data-v="${k}">${l}<small>${s}</small></button>`).join('')}</div>
          </div>
        </div>
      </div>
      <div class="chips mt-16">${[['all', 'All'], ...Object.entries(CAT).map(([k, [l]]) => [k, l])].map(([k, l]) => `<button class="chip solid ${c.cat === k ? 'on' : ''}" data-a="commCat" data-v="${k}">${l}<span class="cnt">${k === 'all' ? all.length : all.filter((p) => p.category === k).length}</span></button>`).join('')}</div>
      <div class="pad mt-16">
        <button class="card press row" style="padding:14px 16px;gap:14px;width:100%;text-align:left" data-a="go" data-v="clubs">
          <span class="row" style="gap:0">${D.clubs.slice(0, 3).map((x, i) => `<span class="avatar" style="width:36px;height:36px;font-size:13px;margin-left:${i ? -10 : 0}px;box-shadow:0 0 0 2px var(--surface)">${esc(x.city.slice(0, 2))}</span>`).join('')}</span>
          <span class="grow"><b class="t15">EV clubs in ${cities} cities</b><br><span class="t13 muted">Meetups, convoys and local advice</span></span>${ic('chevR', 18)}</button>
      </div>
      <div class="pad stack gap-16 mt-16">${posts.map(postCard).join('') || '<div class="empty">No posts in this topic yet. Start the conversation.</div>'}</div>
    </div>
    <button class="fab" data-a="newPost">${ic('pencil', 20)}New post</button>`,
  }
}
Object.assign(A, {
  commCat: (v) => { U.comm.cat = v; render() },
  commSort: (v) => { U.comm.sort = v; render() },
  like: (id) => {
    if (!S.user) return needSignIn('Sign in to like posts and reply to drivers.')
    S.liked[id] ? delete S.liked[id] : (S.liked[id] = true)
    save(); render()
  },
  sharePost: (id) => { const p = postById(id); copyText(`${p.title} — https://plug.pk/community/post/${p.slug}`, 'Link copied') },
  newPost: () => {
    if (!S.user) return needSignIn('Sign in to post. Your name and car show on the post.')
    U.draft = { title: '', body: '', cat: 'general' }
    openSheet('newPost')
  },
  draftCat: (v) => { U.draft.cat = v; U.draft.title = $('#np-title')?.value ?? U.draft.title; U.draft.body = $('#np-body')?.value ?? U.draft.body; renderSheet() },
  publishPost: () => {
    const d = U.draft
    d.title = $('#np-title').value.trim(); d.body = $('#np-body').value.trim()
    d.err = d.title.length < 8 ? 'Give your post a title of at least 8 characters.' : d.body.length < 20 ? 'Add a bit more detail — at least 20 characters.' : null
    if (d.err) return renderSheet()
    const id = 'my-post-' + Date.now()
    S.myPosts.unshift({ id, slug: id, name: S.user.name, car: myCar()?.name, title: d.title, body: d.body, category: d.cat, photos: [], likes: 0, date: new Date().toISOString(), comments: [], mine: true })
    save(); closeSheet(); U.comm.cat = 'all'; U.comm.sort = 'latest'
    if (cur().s !== 'community') tab('community'); else render()
    toast('Posted to the community', 'chat')
  },
})
SHEETS.newPost = () => {
  const d = U.draft
  return {
    title: 'New post', full: true,
    body: `<p class="label">Topic</p>
      <div class="row wrap">${Object.entries(CAT).map(([k, [l]]) => `<button class="chip ${d.cat === k ? 'on' : ''}" data-a="draftCat" data-v="${k}">${d.cat === k ? ic('check', 14, { sw: 2.4 }) : ''}${l}</button>`).join('')}</div>
      <label class="label mt-20" for="np-title">Title</label>
      <input class="input" id="np-title" maxlength="120" placeholder="e.g. Lahore to Islamabad in a ZS EV — how many stops?" value="${esc(d.title)}">
      <label class="label mt-16" for="np-body">What do you want to say?</label>
      <textarea class="textarea" id="np-body" maxlength="2000" style="min-height:180px" placeholder="Share the details other drivers need: car, route, charger, speed, cost.">${esc(d.body)}</textarea>
      ${d.err ? `<p class="err-msg">${ic('info', 15)}${d.err}</p>` : `<p class="hint">Posting as ${esc(S.user?.name)}${myCar() ? ` · ${esc(myCar().name)}` : ''}</p>`}`,
    foot: `<button class="btn btn-ghost" data-a="closeSheet">Cancel</button><button class="btn btn-primary grow" data-a="publishPost">Post</button>`,
  }
}

SCREENS.post = ({ id }) => {
  const p = postById(id)
  if (!p) return { sb: 'dark', html: `${topbar('Post')}<div class="scroll pad"><div class="empty">This post isn’t here any more.</div></div>` }
  const liked = !!S.liked[p.id]
  return {
    sb: 'dark',
    html: `${topbar('', `<button class="icon-btn" data-a="sharePost" data-v="${p.id}" aria-label="Share">${ic('share', 20)}</button>`)}
      <div class="scroll" style="padding-bottom:24px">
        <div class="pad">
          ${catTag(p.category)}
          <h1 class="t24 mt-12" style="line-height:1.25">${esc(p.title)}</h1>
          <div class="row mt-16" style="gap:10px"><span class="avatar">${initial(p.name)}</span><span class="grow"><b class="t14">${esc(p.name)}</b><br><span class="t12 faint">${p.car ? esc(p.car) + ' · ' : ''}${fmtDate(p.date)}</span></span></div>
        </div>
        ${p.photos.length ? `<div class="hscroll mt-16">${p.photos.map((ph) => `<img src="${img(ph)}" alt="" style="width:${p.photos.length > 1 ? '85%' : '100%'};aspect-ratio:16/10;object-fit:cover;border-radius:16px">`).join('')}</div>` : ''}
        <div class="pad stack gap-12 mt-16">${p.body.split(/\n\n+/).map((para) => `<p class="t15" style="color:var(--fg-2);line-height:1.7">${esc(para)}</p>`).join('')}</div>
        <div class="pad row mt-16" style="gap:8px">
          <button class="btn btn-secondary" style="${liked ? 'color:var(--heart);border-color:var(--heart)' : ''}" data-a="like" data-v="${p.id}" aria-pressed="${liked}">${ic('heart', 18, { fill: liked })}<span class="mono">${p.likes}</span> ${liked ? 'Liked' : 'Like'}</button>
          <button class="btn btn-secondary" data-a="sharePost" data-v="${p.id}">${ic('share', 18)}Share</button>
        </div>
        <section class="pad section">
          <h2 class="t20">Replies <span class="mono muted t15">${p.comments.length}</span></h2>
          <div class="mt-8">${p.comments.map((c) => `<div class="review"><div class="row" style="gap:10px"><span class="avatar" style="width:32px;height:32px;font-size:13px">${initial(c.name)}</span><b class="t14 grow">${esc(c.name)}${c.mine ? ' <span class="badge b-teal">You</span>' : ''}</b><span class="t12 faint">${ago(c.date)}</span></div><p class="t14 mt-8" style="color:var(--fg-2)">${esc(c.text)}</p>${c.likes ? `<p class="t12 faint mt-4">${c.likes} likes</p>` : ''}</div>`).join('') || '<div class="empty">No replies yet. Know the answer? Say so below.</div>'}</div>
        </section>
      </div>
      <form class="comment-bar" data-submit="comment">
        <label class="sr" for="cm-text">Reply</label>
        <input class="input grow" id="cm-text" placeholder="${S.user ? 'Write a reply' : 'Sign in to reply'}" maxlength="600" autocomplete="off">
        <button class="btn btn-primary btn-icon" style="border-radius:50%" type="submit" aria-label="Send reply">${ic('arrowUR', 20)}</button>
      </form>`,
  }
}
A.comment = () => {
  if (!S.user) return needSignIn('Sign in to reply. Your name shows on the reply.')
  const t = $('#cm-text').value.trim()
  if (t.length < 2) return toast('Write something first', 'info')
  const id = cur().id
  ;(S.myComments[id] ||= []).push({ id: 'c' + Date.now(), name: S.user.name, text: t, likes: 0, date: new Date().toISOString(), mine: true })
  save(); render()
  const sc = $('#screen .scroll'); if (sc) sc.scrollTop = sc.scrollHeight
  toast('Reply posted', 'chat')
}

// ─── Clubs ─────────────────────────────────────────────────────────
function landmark(city) {
  const lm = CITY[city]?.landmark
  const c = 'rgba(142,238,218,.35)'
  if (lm === 'minar') return `<path d="M190 96 L200 20 L210 96 Z M178 96 h44 v-8 h-44 z M196 20 l4-12 4 12z" fill="${c}"/>`
  if (lm === 'faisal') return `<path d="M150 96 L200 40 L250 96 Z" fill="${c}"/><path d="M138 96 V44 l3-8 3 8 V96 M256 96 V44 l3-8 3 8 V96" stroke="${c}" stroke-width="5" fill="none"/>`
  if (lm === 'quaid') return `<path d="M165 96 V66 h70 V96 Z M172 66 a28 28 0 0 1 56 0 Z" fill="${c}"/><path d="M200 30 v8" stroke="${c}" stroke-width="3"/>`
  const r = rng(city)
  let b = ''
  for (let x = 110; x < 300; x += 18 + r() * 10) { const h = 20 + r() * 50; b += `<rect x="${x}" y="${96 - h}" width="${12 + r() * 10}" height="${h}" rx="2" fill="${c}"/>` }
  return b
}
SCREENS.clubs = () => ({
  sb: 'dark',
  html: `${topbar('EV clubs')}
    <div class="scroll pad stack gap-16" style="padding-bottom:40px">
      <p class="t15 muted">Local groups for meetups, group charging trips and advice from people who drive what you drive.</p>
      ${D.clubs.map((c) => {
        const joined = S.clubs.includes(c.id)
        return `<div class="card" style="overflow:hidden">
          <div class="club-head" style="background:linear-gradient(135deg,#0D1817,#05241E 55%,#0B332C)">
            <svg viewBox="0 0 400 96" preserveAspectRatio="xMidYMax slice">${landmark(c.city)}<rect y="94" width="400" height="2" fill="rgba(142,238,218,.25)"/></svg>
            <span class="badge md" style="background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.2);color:#fff;backdrop-filter:blur(6px)">${ic('pin', 13)}${esc(c.city)}</span>
          </div>
          <div style="padding:16px">
            <div class="row between"><b class="t17">${esc(c.name)}</b><span class="t13 muted row" style="gap:4px">${ic('users', 14)}<span class="mono">${c.members + (joined ? 1 : 0)}</span></span></div>
            <p class="t14 muted clamp2 mt-4">${esc(c.description)}</p>
            <button class="btn ${joined ? 'btn-secondary' : 'btn-primary'} btn-block mt-12" data-a="joinClub" data-v="${c.id}">${joined ? `${ic('check', 18)}Joined` : 'Join club'}</button>
          </div>
        </div>`
      }).join('')}
    </div>`,
})
A.joinClub = (id) => {
  if (!S.user) return needSignIn('Sign in to join a club.')
  const on = S.clubs.includes(id)
  S.clubs = on ? S.clubs.filter((x) => x !== id) : [...S.clubs, id]
  save(); render(); toast(on ? 'You left the club' : 'Welcome to the club', 'users')
}

// ─── Services ──────────────────────────────────────────────────────
const SVC_CAT = {
  dealership: ['Dealerships', 'car', 'Authorised EV dealers'],
  'service-center': ['Service centres', 'wrench', 'EV service and repair'],
  'home-charger-installer': ['Home charger install', 'plug', 'Wall boxes, fitted safely'],
  accessories: ['Accessories', 'package', 'Cables, adapters, kit'],
  insurance: ['Insurance', 'shield', 'Cover written for EVs'],
  'roadside-assistance': ['Roadside assistance', 'buoy', 'Help when you’re stuck'],
}
function serviceCard(s, width) {
  const h = hoursNow(s.hours)
  const [label, icon] = SVC_CAT[s.category]
  return `<button class="card press sv2" style="${width ? `width:${width}px` : 'width:100%'}" data-a="go" data-v="service" data-id="${s.id}">
    <div class="sv2-ph"><img src="${img(s.photo)}" alt="" loading="lazy"><span class="sv2-cat">${ic(icon, 14)}${label}</span></div>
    <div class="sv2-bd">
      <div class="row" style="gap:6px"><b class="sv2-name">${esc(s.name)}</b>${s.verified ? `<span class="sv2-ver" title="Verified business">${ic('shield', 16)}</span>` : ''}</div>
      <div class="sv2-meta">${ic('pin', 14)}<span class="trunc">${esc(s.area)}, ${esc(s.city)}</span></div>
      ${width ? '' : `<p class="t14 muted clamp2">${esc(s.description)}</p>`}
      <div class="sv2-foot"><span class="sv2-status ${h.open ? 'open' : ''}"><i></i>${h.text}</span><span class="sv2-more">Details${ic('chevR', 16)}</span></div>
    </div>
  </button>`
}
SCREENS.services = () => {
  const f = U.svc
  const list = D.services.filter((s) => (f.cat === 'all' || s.category === f.cat) && (f.city === 'all' || s.city === f.city))
  const cities = [...new Set(D.services.map((s) => s.city))]
  return {
    sb: 'light',
    html: `<div class="scroll">
      <header class="band">
        <button class="icon-btn" data-a="back" aria-label="Back" style="position:relative">${ic('arrowL', 22)}</button>
        <div class="eyebrow mt-12" style="position:relative">${ic('wrench', 13)} EV services</div>
        <h1 class="band-title mt-8" style="position:relative">Everything else <span class="hl">your EV needs</span></h1>
        <p class="t14 mt-8" style="color:rgba(255,255,255,.65);position:relative">Dealers, workshops, installers and insurers that work on electric cars.</p>
      </header>
      <div class="pad mt-20"><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">${Object.entries(SVC_CAT).map(([k, [l, i, d]]) => {
        const n = D.services.filter((s) => s.category === k).length
        return `<button class="card press cat-tile" style="${f.cat === k ? 'border-color:#3FD4BC;box-shadow:0 0 0 3px rgba(38,205,178,.2)' : ''}" data-a="svcCat" data-v="${k}"><span class="ico">${ic(i, 22)}</span><span><b class="t15">${l}</b><br><span class="t12 muted">${d}</span></span><span class="t12 mono faint">${n} listed</span></button>`
      }).join('')}</div></div>
      <div class="sec-head section" style="margin-top:28px"><h2>${f.cat === 'all' ? 'All services' : SVC_CAT[f.cat][0]}</h2>${f.cat !== 'all' ? '<button class="link" data-a="svcCat" data-v="all">Show all</button>' : `<span class="t13 muted mono">${list.length}</span>`}</div>
      <div class="chips">${['all', ...cities].map((c) => `<button class="chip ${f.city === c ? 'on' : ''}" data-a="svcCity" data-v="${c}">${f.city === c ? ic('check', 14, { sw: 2.4 }) : ''}${c === 'all' ? 'All cities' : c}</button>`).join('')}</div>
      <div class="pad stack gap-16 mt-12" style="padding-bottom:32px">${list.map((s) => serviceCard(s)).join('') || '<div class="empty">Nothing listed for this city yet. Try all cities.</div>'}
        <div class="card p20" style="text-align:center"><b class="t17">Run an EV business?</b><p class="t14 muted mt-4">Dealers, workshops and installers can list for free once checked.</p><button class="btn btn-secondary mt-12" data-a="go" data-v="partners">Get listed</button></div>
      </div>
    </div>`,
  }
}
Object.assign(A, {
  svcCat: (v) => { U.svc.cat = U.svc.cat === v ? 'all' : v; render() },
  svcCity: (v) => { U.svc.city = v; render() },
})
SCREENS.service = ({ id }) => {
  const s = D.services.find((x) => x.id === id)
  const h = hoursNow(s.hours)
  const week = s.hours && !s.hours.is24Hours ? ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((d) => [d[0].toUpperCase() + d.slice(1, 3), s.hours[d]]) : null
  return {
    sb: 'light',
    html: `<div class="scroll">
      <div class="gallery" style="height:260px"><div class="track"><img src="${img(s.photo)}" alt=""></div><div class="shade"></div></div>
      <div class="detail-body">
        <div class="row wrap" style="gap:6px"><span class="badge md b-teal">${ic(SVC_CAT[s.category][1], 13)}${SVC_CAT[s.category][0]}</span>${s.verified ? `<span class="badge md b-forest">${ic('shield', 13)}Verified</span>` : ''}<span class="badge md ${h.open ? 'b-green' : 'b-slate'}">${h.text}</span></div>
        <h1 class="detail-title mt-12">${esc(s.name)}</h1>
        <p class="t14 muted mt-4">${esc(s.street)}, ${esc(s.area)}, ${esc(s.city)}</p>
        <p class="t13 faint mt-4">No reviews yet</p>
        <p class="t15 mt-16" style="color:var(--fg-2)">${esc(s.description)}</p>
        <section class="section"><h2 class="t20">Contact</h2>
          <div class="list mt-12">
            <button class="list-row" data-a="copy" data-v="${esc(s.phone)}"><span class="ico">${ic('phone', 18)}</span><span class="grow"><span class="t12 faint">Phone</span><br><b class="mono t15">${esc(s.phone)}</b></span><span class="faint">${ic('copy', 18)}</span></button>
            ${s.email ? `<button class="list-row" data-a="copy" data-v="${esc(s.email)}"><span class="ico">${ic('mail', 18)}</span><span class="grow" style="min-width:0"><span class="t12 faint">Email</span><br><b class="t14 trunc" style="display:block">${esc(s.email)}</b></span><span class="faint">${ic('copy', 18)}</span></button>` : ''}
          </div>
        </section>
        ${week ? `<section class="section"><h2 class="t20">Opening hours</h2><div class="kv mt-8">${week.map(([d, v]) => `<div>${d}</div><div>${!v || v.isClosed ? 'Closed' : `${v.open}–${v.close}`}</div>`).join('')}</div></section>` : ''}
        <div style="height:24px"></div>
      </div>
    </div>
    <div class="float-bar"><button class="glass-btn" data-a="back" aria-label="Back">${ic('arrowL', 22)}</button></div>
    <div class="bottom-bar">
      <button class="btn btn-secondary" data-a="copy" data-v="${esc(s.phone)}">${ic('phone', 18)}Copy number</button>
      <a class="btn btn-nav grow" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s.street}, ${s.area}, ${s.city}`)}" target="_blank" rel="noopener">Directions ${ic('nav', 18)}</a>
    </div>`,
  }
}

// ─── Charging calculator ───────────────────────────────────────────
const AC_PRESETS = [[3.7, 'Home socket'], [7.4, 'Wall box'], [11, 'Three-phase'], [22, 'Three-phase 32A']]
const DC_PRESETS = [[30, 'Compact DC'], [60, 'Fast'], [120, 'Rapid'], [180, 'Ultra-rapid']]
function calcState() {
  const c = U.calc
  const car = carBySlug(c.slug || S.primary) || null
  const kw = c.custom.trim() ? parseFloat(c.custom) : c.kw
  const rate = parseFloat(c.rate)
  const est = car ? estimateCharge({ kwh: car.battery, from: c.from, to: c.to, mode: c.mode, chargerKw: kw, carKw: c.mode === 'dc' ? car.dc : car.ac, rate }) : { ok: false, msg: 'Choose a car to see a time.' }
  return { car, kw, rate, est }
}
SCREENS.calculator = () => {
  const c = U.calc
  const { car } = calcState()
  const presets = c.mode === 'ac' ? AC_PRESETS : DC_PRESETS
  return {
    sb: 'dark',
    html: `${topbar('Charge time')}
      <div class="scroll pad stack gap-20" style="padding-bottom:40px">
        <div data-part="result">${calcResult()}</div>
        <div><span class="label">Car</span>${carRowBtn(car && isPlugIn(car) ? car : null, 'sheet', 'carPicker" data-target="calc')}</div>
        <div>
          <span class="label">Charger type</span>
          <div class="seg">${[['ac', 'AC', 'wall box, slow'], ['dc', 'DC', 'fast charger']].map(([k, l, s]) => `<button class="${c.mode === k ? 'on' : ''}" data-a="calcMode" data-v="${k}" ${k === 'dc' && car && !car.dc ? 'disabled style="opacity:.5"' : ''}>${l}<small>${k === 'dc' && car && !car.dc ? 'not on this car' : s}</small></button>`).join('')}</div>
        </div>
        <div>
          <div class="row between"><span class="label" style="margin:0">Charge level</span><span class="mono b7 t15" data-part="socv">${c.from}% → ${c.to}%</span></div>
          <div class="soc mt-8" data-part="soc"><div class="have" style="width:${c.from}%"></div><div class="add" style="left:${c.from}%;width:${Math.max(0, c.to - c.from)}%"></div><div class="labels"><span>${c.from}%</span><span style="color:${c.to > 70 ? '#fff' : 'var(--fg)'}">${c.to}%</span></div></div>
          <div class="row mt-8" style="gap:16px">
            <div class="grow"><label class="t12 faint b6" for="calc-from">NOW</label><input type="range" id="calc-from" min="0" max="95" step="5" value="${c.from}" data-in="calcFrom" style="--p:${(c.from / 95) * 100}%"></div>
            <div class="grow"><label class="t12 faint b6" for="calc-to">CHARGE TO</label><input type="range" id="calc-to" min="5" max="100" step="5" value="${c.to}" data-in="calcTo" style="--p:${((c.to - 5) / 95) * 100}%"></div>
          </div>
        </div>
        <div>
          <span class="label">Charger power</span>
          <div class="row" style="gap:8px">${presets.map(([kw, n]) => `<button class="preset ${!c.custom && c.kw === kw ? 'on' : ''}" data-a="calcKw" data-v="${kw}"><div class="v">${kw}<span class="t12" style="font-weight:400"> kW</span></div><div class="n">${n}</div></button>`).join('')}</div>
          <div class="field mt-8"><label class="sr" for="calc-custom">Other power</label><input class="input" id="calc-custom" inputmode="decimal" placeholder="Other — the figure on the charger" value="${esc(c.custom)}" data-in="calcCustom"><span class="unit">kW</span></div>
        </div>
        <div>
          <label class="label" for="calc-rate">Electricity rate <span class="opt">only changes the cost</span></label>
          <div class="field"><span class="lead" style="font-size:14px;font-weight:600">Rs</span><input class="input" id="calc-rate" inputmode="decimal" value="${esc(c.rate)}" data-in="calcRate" style="padding-left:44px"><span class="unit">/ kWh</span></div>
          <p class="hint">Use the per-unit rate on your bill. Public DC chargers usually bill more per unit than a home connection.</p>
        </div>
        <div class="notice neutral">${ic('info', 18)}<span>DC slows as the battery fills, sharply past 80%. We walk the charge in half-percent steps on a curve fitted to published 10–80% times, so DC results are estimates.</span></div>
      </div>`,
  }
}
function calcResult() {
  const c = U.calc
  const { car, est } = calcState()
  if (!est.ok) return `<div class="result-hero"><div class="t14" style="color:rgba(255,255,255,.65);position:relative">Charge time</div><div class="big mt-4" style="position:relative">—</div><p class="t14 mt-8" style="color:rgba(255,255,255,.75);position:relative">${esc(est.msg)}</p></div>`
  const added = rangeAdded(carRange(car), c.from, c.to)
  const limit = { car: `Your car accepts up to ${fmtKw(est.kw)} kW here, below the charger’s power.`, charger: `The charger is the limit — your car can accept more.`, matched: `Car and charger both top out at ${fmtKw(est.kw)} kW.`, unknown: `We don’t have this car’s limit, so the charger’s power is assumed.` }[est.limitedBy]
  const pct = c.to
  const R = 54, L = 2 * Math.PI * R
  return `<div class="result-hero">
    <div class="row" style="gap:16px;position:relative;align-items:center">
      <div class="grow">
        <div class="t13" style="color:rgba(255,255,255,.65)">${c.mode.toUpperCase()} · ${fmtKw(est.kw)} kW${c.mode === 'dc' ? ' peak' : ''}</div>
        <div class="big mt-4">${fmtDur(est.minutes)}</div>
        <div class="t14 mt-4" style="color:#8EEEDA">Ready around ${readyAt(est.minutes)}</div>
      </div>
      <svg class="ring" viewBox="0 0 132 132" aria-hidden="true"><circle cx="66" cy="66" r="${R}" stroke="rgba(255,255,255,.1)" stroke-width="12" fill="none"/>
        <circle cx="66" cy="66" r="${R}" stroke="url(#rg)" stroke-width="12" fill="none" stroke-linecap="round" stroke-dasharray="${(L * pct) / 100} ${L}" transform="rotate(-90 66 66)"/>
        <circle cx="66" cy="66" r="${R}" stroke="rgba(255,255,255,.35)" stroke-width="12" fill="none" stroke-dasharray="1.5 ${L}" stroke-dashoffset="${-(L * c.from) / 100}" transform="rotate(-90 66 66)"/>
        <defs><linearGradient id="rg" x1="0" x2="1"><stop offset="0" stop-color="#4FDCC4"/><stop offset="1" stop-color="#26CDB2"/></linearGradient></defs>
        <text x="66" y="64" text-anchor="middle" fill="#fff" font-family="JetBrains Mono, monospace" font-weight="700" font-size="26">${pct}%</text>
        <text x="66" y="84" text-anchor="middle" fill="rgba(255,255,255,.55)" font-family="Figtree, sans-serif" font-size="12">target</text></svg>
    </div>
    <div class="garage-specs mt-16" style="position:relative">
      <div class="gspec"><div class="v">${fmtKwh(est.energy).replace(' kWh', '')}<small>kWh</small></div><div class="k">Added</div></div>
      <div class="gspec"><div class="v">${est.cost != null ? n0(est.cost) : '—'}<small>${est.cost != null ? 'Rs' : ''}</small></div><div class="k">Cost</div></div>
      <div class="gspec"><div class="v">${added ? `+${added}` : '—'}<small>${added ? 'km' : ''}</small></div><div class="k">Rated range</div></div>
    </div>
    ${est.split ? `<p class="t13 mt-12" style="color:rgba(255,255,255,.7);position:relative">${c.from}→80% takes <b class="mono">${fmtDur(est.split.to80)}</b>; the last stretch to ${c.to}% adds <b class="mono">${fmtDur(est.split.past80)}</b>.</p>` : ''}
    <p class="t13 mt-8" style="color:rgba(255,255,255,.6);position:relative">${limit} Meter reads about ${fmtKwh(est.grid)} with losses.</p>
  </div>`
}
Object.assign(A, {
  calcMode: (v) => { U.calc.mode = v; U.calc.kw = v === 'ac' ? 7.4 : 60; U.calc.custom = ''; render() },
  calcKw: (v) => { U.calc.kw = +v; U.calc.custom = ''; render() },
})
IN.calcFrom = (v, el) => {
  U.calc.from = +v
  if (U.calc.to <= U.calc.from) { U.calc.to = Math.min(100, U.calc.from + 5); const t = $('#calc-to'); t.value = U.calc.to; t.style.setProperty('--p', `${((U.calc.to - 5) / 95) * 100}%`) }
  el.style.setProperty('--p', `${(v / 95) * 100}%`)
  renderPart('soc', 'socv', 'result')
}
IN.calcTo = (v, el) => {
  U.calc.to = +v
  if (U.calc.from >= U.calc.to) { U.calc.from = Math.max(0, U.calc.to - 5); const f = $('#calc-from'); f.value = U.calc.from; f.style.setProperty('--p', `${(U.calc.from / 95) * 100}%`) }
  el.style.setProperty('--p', `${((v - 5) / 95) * 100}%`)
  renderPart('soc', 'socv', 'result')
}
IN.calcCustom = (v) => { U.calc.custom = v; renderPart('result'); document.querySelectorAll('.preset').forEach((p) => p.classList.toggle('on', !v.trim() && +p.dataset.v === U.calc.kw)) }
IN.calcRate = (v) => { U.calc.rate = v; renderPart('result') }

// ─── Range converter ───────────────────────────────────────────────
SCREENS.range = () => {
  const r = U.rng
  const car = myCar()
  return {
    sb: 'dark',
    html: `${topbar('Real range')}
      <div class="scroll pad stack gap-20" style="padding-bottom:40px">
        <p class="t15 muted">Brochures quote range on different tests. Turn any figure into the others, and into what it means on Pakistani roads.</p>
        <div class="card p16 stack gap-12">
          <div class="row" style="gap:10px">
            <div class="field grow"><label class="sr" for="rng-km">Quoted range</label><input class="input" id="rng-km" inputmode="numeric" value="${esc(r.km)}" data-in="rngKm" style="font:700 20px var(--mono);height:56px"><span class="unit">km</span></div>
          </div>
          <div class="seg">${STD_ORDER.map((k) => `<button class="${r.std === k ? 'on' : ''}" data-a="rngStd" data-v="${k}">${k}</button>`).join('')}</div>
          <p class="t13 muted">${esc(STD[r.std].gist)} <span class="faint">Used in: ${esc(STD[r.std].region)}.</span></p>
          ${car && carRange(car) && car.rangeStd ? `<button class="link" style="min-height:32px" data-a="rangeFor" data-v="${car.slug}">${ic('car', 16)}Use my ${esc(car.model)} (${carRange(car)} km ${car.rangeStd})</button>` : ''}
        </div>
        <div data-part="conv">${rangeResults()}</div>
        <div><h2 class="t20">The four tests</h2>
          <div class="list mt-12">${STD_ORDER.map((k) => `<div class="list-row" style="align-items:flex-start"><span class="ico mono" style="font-size:11px;font-weight:700">${k}</span><span class="grow"><b class="t14">${STD[k].name}</b><br><span class="t13 muted">${STD[k].gist}</span></span></div>`).join('')}</div>
        </div>
        <p class="t12 faint">Ratios come from published comparisons of a handful of cars, not a statistical model. Every answer is a band because each car reacts to each test differently.</p>
      </div>`,
  }
}
function rangeResults() {
  const r = U.rng
  const km = parseFloat(r.km)
  const conv = convertRange(km, r.std)
  if (!conv) return `<div class="empty">Enter a range of at least 20 km — the figure from the brochure.</div>`
  const road = roadEstimates(km, r.std)
  const max = Math.max(...road.map((x) => x.hi), ...conv.map((x) => x.hi))
  return `<h2 class="t20">On the other tests</h2>
    <div class="list mt-12">${conv.map((x) => `<div class="list-row"><b class="mono t14" style="width:48px">${x.std}</b><span class="grow t13 muted">${x.quoted ? 'As quoted' : `<span class="mono">${x.lo}–${x.hi} km</span> band`}</span><b class="mono t17 ${x.quoted ? '' : 'accent-text'}">${x.quoted ? '' : '~'}${x.t}<span class="t12 muted" style="font-weight:400"> km</span></b></div>`).join('')}</div>
    <h2 class="t20 mt-24">On Pakistani roads</h2>
    <div class="stack gap-12 mt-12">${road.map((x) => `<div class="card p16">
      <div class="row" style="gap:12px"><span class="list-row" style="padding:0;min-height:0;border:0;width:auto"><span class="ico">${ic(x.sc.icon, 18)}</span></span><span class="grow"><b class="t15">${x.sc.title}</b><br><span class="t12 muted">${x.sc.cond}</span></span><b class="mono t20">~${x.t}<span class="t12 muted" style="font-weight:400"> km</span></b></div>
      <div style="position:relative;height:10px;border-radius:5px;background:var(--sunken);margin-top:14px">
        <div style="position:absolute;left:${(x.lo / max) * 100}%;width:${((x.hi - x.lo) / max) * 100}%;top:0;bottom:0;border-radius:5px;background:linear-gradient(90deg,#0B332C,#26CDB2);opacity:.8"></div>
        <div style="position:absolute;left:${(x.t / max) * 100}%;top:-3px;width:4px;height:16px;margin-left:-2px;border-radius:2px;background:var(--fg)"></div>
      </div>
      <div class="row between t12 mono faint mt-4"><span>${x.lo} km</span><span>${x.hi} km</span></div>
      <p class="t12 faint mt-4">${x.sc.basis}</p></div>`).join('')}</div>`
}
A.rngStd = (v) => { U.rng.std = v; render() }
IN.rngKm = (v) => { U.rng.km = v.replace(/[^\d.]/g, ''); renderPart('conv') }

// ─── Profile & dashboard ───────────────────────────────────────────
function themePicker() {
  const t = [['light', 'Light', '#F1F4F3', '#FFFFFF'], ['dark', 'Dark', '#08110F', '#132522'], ['system', 'Auto', 'linear-gradient(90deg,#F1F4F3 50%,#08110F 50%)', 'linear-gradient(90deg,#FFFFFF 50%,#132522 50%)']]
  return `<div class="theme-pick">${t.map(([k, l, bg, card]) => `<button class="${S.theme === k ? 'on' : ''}" data-a="theme" data-v="${k}" aria-pressed="${S.theme === k}">
    <span class="mini"><span class="bd" style="background:${bg}"></span><span class="hd"></span><span class="c1" style="background:${card}"></span><span class="c2" style="background:${card}"></span><span class="tb"></span></span>
    <span class="row" style="gap:6px">${ic(k === 'light' ? 'sun' : k === 'dark' ? 'moon' : 'monitor', 16)}${l}</span></button>`).join('')}</div>`
}
SCREENS.profile = () => {
  const u = S.user
  const stats = [[S.saved.length, 'Saved', 'saved'], [S.routes.length, 'Routes', 'savedRoutes'], [S.myReviews.length, 'Reviews', 'myReviews'], [S.garage.length, 'Cars', 'vehicles']]
  return {
    sb: 'light',
    html: `<div class="scroll">
      <header class="band" style="padding-bottom:28px">
        <div class="row between" style="position:relative"><button class="icon-btn" data-a="back" aria-label="Back">${ic('arrowL', 22)}</button><button class="icon-btn" data-a="go" data-v="settings" aria-label="Settings">${ic('gear', 20)}</button></div>
        <div class="profile-card mt-16">
          <span class="avatar">${u ? initial(u.name) : ic('user', 28)}</span>
          <div class="grow" style="min-width:0"><h1 class="t24 trunc">${u ? esc(u.name) : 'Guest'}</h1><p class="t14 trunc" style="color:rgba(255,255,255,.6)">${u ? esc(u.email) : 'Sign in to keep your stations and routes'}</p></div>
        </div>
        ${!u ? `<div class="row mt-16" style="gap:8px;position:relative"><button class="btn btn-inverse grow" data-a="signInFull" data-v="signup">Create account</button><button class="btn btn-outline-white grow" data-a="signInFull" data-v="signin">Sign in</button></div>` : ''}
      </header>
      <div class="pad mt-16 stat-grid">${stats.map(([n, l, s]) => `<button data-a="go" data-v="${s}"><div class="n">${n}</div><div class="l">${l}</div></button>`).join('')}</div>
      <div class="pad">
        <p class="group-label">Your stuff</p>
        <div class="list">
          ${listRow('car', 'My garage', `${S.garage.length} car${S.garage.length === 1 ? '' : 's'}${myCar() ? ` · ${esc(myCar().model)} is main` : ''}`, 'vehicles')}
          ${listRow('bookmark', 'Saved stations', `${S.saved.length} saved`, 'saved')}
          ${listRow('route', 'Saved routes', `${S.routes.length} saved`, 'savedRoutes')}
          ${listRow('star', 'My reviews', `${S.myReviews.length} written`, 'myReviews')}
          ${listRow('heart', 'Favourite cars', `${S.fav.length} favourite${S.fav.length === 1 ? '' : 's'}`, 'favs')}
        </div>
        <p class="group-label">Appearance</p>
        ${themePicker()}
        <p class="group-label">Tools</p>
        <div class="list">
          ${listRow('timer', 'Charging calculator', 'How long and how much', 'calculator')}
          ${listRow('gauge', 'Range converter', 'EPA, WLTP, NEDC, CLTC', 'range')}
          ${listRow('wrench', 'EV services', 'Dealers, workshops, installers', 'services')}
        </div>
        <p class="group-label">plug.pk</p>
        <div class="list">
          ${listRow('handshake', 'Partner Up', 'List your charger or business', 'partners')}
          ${listRow('gear', 'Settings', 'Notifications, account, data', 'settings')}
          <button class="list-row" data-a="sheet" data-v="about"><span class="ico">${ic('help', 18)}</span><span class="grow"><b class="t15">About this prototype</b></span><span class="chev">${ic('chevR', 18)}</span></button>
        </div>
        ${u ? `<button class="btn btn-secondary btn-block mt-24" data-a="signOut">${ic('logout', 18)}Sign out</button>` : ''}
        <p class="t12 faint mt-16" style="text-align:center;padding-bottom:32px">plug.pk app prototype · data ${D.builtAt}</p>
      </div>
    </div>`,
  }
}
function listRow(icon, title, sub, screen) {
  return `<button class="list-row" data-a="go" data-v="${screen}"><span class="ico">${ic(icon, 18)}</span><span class="grow" style="min-width:0"><b class="t15">${title}</b><br><span class="t13 muted trunc" style="display:block">${sub}</span></span><span class="chev">${ic('chevR', 18)}</span></button>`
}
Object.assign(A, {
  signOut: () => { S.user = null; save(); render(); toast('Signed out', 'logout') },
  signInFull: (v) => { U.authMode = v; U.authErr = null; needSignIn(v === 'signup' ? 'Create an account to save stations, routes and reviews.' : 'Welcome back.') },
})
SHEETS.about = () => ({
  title: 'About this prototype',
  body: `<div class="stack gap-12 t15" style="color:var(--fg-2)">
    <p>This is a working prototype of the plug.pk app. It uses the website’s real catalogue of <b>${D.cars.length} cars</b>, its services and community posts, and the same charging, range and route maths.</p>
    <p>The <b>${D.stations.length} stations</b> are the website’s example listings. There’s no live availability yet, so nothing claims a charger is free.</p>
    <p>Anything you save, post or review stays in this browser. Nothing is sent anywhere.</p>
    <p>The map is drawn for the prototype. The real app would use a map provider and your location.</p>
  </div>`,
})

SCREENS.vehicles = () => ({
  sb: 'dark',
  html: `${topbar('My garage')}
    <div class="scroll pad stack gap-12" style="padding-bottom:40px">
      ${S.garage.map(carBySlug).filter(Boolean).map((c) => `<div class="card" style="overflow:hidden">
        <button class="row" style="gap:14px;padding:12px;width:100%;text-align:left" data-a="go" data-v="car" data-slug="${c.slug}">${carStage(c, '', 'width:110px;height:76px;border-radius:12px;flex:none')}
          <span class="grow" style="min-width:0">${S.primary === c.slug ? '<span class="badge b-mint">Main car</span>' : ''}<b class="t15 trunc mt-4" style="display:block">${esc(c.name)}</b><span class="t12 mono muted">${carRange(c) ?? '—'} km · ${c.battery ?? '—'} kWh · ${c.dc ? `${c.dc} kW DC` : 'AC only'}</span></span></button>
        <div class="row" style="gap:8px;padding:0 12px 12px">
          ${S.primary === c.slug ? '' : `<button class="btn btn-sm btn-secondary grow" data-a="setMyCar" data-v="${c.slug}">Make main car</button>`}
          <button class="btn btn-sm btn-ghost ${S.primary === c.slug ? 'grow' : ''}" data-a="removeCar" data-v="${c.slug}">${ic('trash', 16)}Remove</button>
        </div></div>`).join('') || '<div class="empty">No car in your garage yet. Add the one you drive and routes and charge times will use its figures.</div>'}
      <button class="btn btn-primary btn-lg" data-a="sheet" data-v="carPicker" data-target="garage">${ic('plus', 20)}Add a car</button>
    </div>`,
})
A.removeCar = (slug) => {
  S.garage = S.garage.filter((x) => x !== slug)
  if (S.primary === slug) S.primary = S.garage[0] || null
  save(); render(); toast('Removed from your garage', 'trash')
}
SCREENS.saved = () => {
  const list = S.saved.map(stById).filter(Boolean)
  return {
    sb: 'dark',
    html: `${topbar('Saved stations')}<div class="scroll pad stack gap-12" style="padding-bottom:40px">${list.map(stationRow).join('') || `<div class="empty">Nothing saved yet. Use the bookmark on any station to keep it here.<button class="btn btn-sm btn-secondary" data-a="tab" data-v="map">Find stations</button></div>`}</div>`,
  }
}
SCREENS.savedRoutes = () => ({
  sb: 'dark',
  html: `${topbar('Saved routes')}<div class="scroll pad stack gap-8" style="padding-bottom:40px">${S.routes.map(savedRouteRow).join('') || `<div class="empty">No saved routes. Plan a drive and tap Save to keep it here.<button class="btn btn-sm btn-secondary" data-a="tab" data-v="routes">Plan a route</button></div>`}</div>`,
})
SCREENS.myReviews = () => ({
  sb: 'dark',
  html: `${topbar('My reviews')}<div class="scroll pad stack gap-12" style="padding-bottom:40px">${S.myReviews.map((r) => `<div class="card p16"><button class="row between" style="width:100%" data-a="go" data-v="station" data-id="${r.stationId}"><b class="t15">${esc(stById(r.stationId)?.name)}</b>${ic('chevR', 18)}</button><div class="row mt-4" style="gap:8px">${stars(r.rating, 13)}<span class="t12 faint">${ago(r.date)}</span></div><p class="t14 mt-8" style="color:var(--fg-2)">${esc(r.text)}</p><button class="btn btn-sm btn-ghost mt-8" data-a="delReview" data-v="${r.id}">${ic('trash', 16)}Delete</button></div>`).join('') || `<div class="empty">You haven’t reviewed a station yet. After you charge somewhere, tell other drivers how it went.<button class="btn btn-sm btn-secondary" data-a="tab" data-v="map">Find a station</button></div>`}</div>`,
})
A.delReview = (id) => { S.myReviews = S.myReviews.filter((r) => r.id !== id); save(); render(); toast('Review deleted', 'trash') }
SCREENS.favs = () => ({
  sb: 'dark',
  html: `${topbar('Favourite cars')}<div class="scroll" style="padding-bottom:40px">${S.fav.length ? `<div class="car-grid">${S.fav.map(carBySlug).filter(Boolean).map(carCard).join('')}</div>` : `<div class="pad"><div class="empty">Tap the heart on any car to keep it here.<button class="btn btn-sm btn-secondary" data-a="tab" data-v="cars">Browse cars</button></div></div>`}</div>`,
})

SCREENS.settings = () => {
  const n = S.notif
  const toggle = (k, t, d) => `<button class="list-row" data-a="notif" data-v="${k}" role="switch" aria-checked="${!!n[k]}"><span class="grow"><b class="t15">${t}</b><br><span class="t13 muted">${d}</span></span><span class="switch ${n[k] ? 'on' : ''}"></span></button>`
  return {
    sb: 'dark',
    html: `${topbar('Settings')}
      <div class="scroll pad" style="padding-bottom:40px">
        <p class="group-label" style="margin-top:4px">Appearance</p>
        ${themePicker()}
        <p class="t13 muted mt-8">Auto follows your phone’s light or dark setting.</p>
        <p class="group-label">Notifications</p>
        <div class="list">
          ${toggle('routes', 'New chargers on my routes', 'When a charger is listed along a saved route')}
          ${toggle('community', 'Replies to my posts', 'When someone answers you in the community')}
          ${toggle('news', 'EV news in Pakistan', 'Policy, prices and launches')}
          ${toggle('offers', 'Offers from partners', 'Occasional deals from listed businesses')}
        </div>
        <p class="group-label">Preferences</p>
        <div class="list">
          <button class="list-row" data-a="sheet" data-v="city"><span class="ico">${ic('pin', 18)}</span><span class="grow"><b class="t15">Home city</b><br><span class="t13 muted">${S.city}</span></span><span class="chev">${ic('chevR', 18)}</span></button>
          <button class="list-row" data-a="go" data-v="vehicles"><span class="ico">${ic('car', 18)}</span><span class="grow"><b class="t15">Main car</b><br><span class="t13 muted">${myCar() ? esc(myCar().name) : 'None chosen'}</span></span><span class="chev">${ic('chevR', 18)}</span></button>
          <div class="list-row"><span class="ico">${ic('gauge', 18)}</span><span class="grow"><b class="t15">Units</b><br><span class="t13 muted">Kilometres, kWh, PKR</span></span></div>
        </div>
        <p class="group-label">Account</p>
        <div class="list">
          ${S.user ? `<div class="list-row"><span class="ico">${ic('user', 18)}</span><span class="grow" style="min-width:0"><b class="t15">${esc(S.user.name)}</b><br><span class="t13 muted trunc" style="display:block">${esc(S.user.email)}</span></span></div>` : `<button class="list-row" data-a="signInFull" data-v="signin"><span class="ico">${ic('user', 18)}</span><span class="grow"><b class="t15">Sign in</b></span><span class="chev">${ic('chevR', 18)}</span></button>`}
          <a class="list-row" href="https://plug.pk/privacy" target="_blank" rel="noopener"><span class="ico">${ic('lock', 18)}</span><span class="grow"><b class="t15">Privacy</b></span><span class="chev">${ic('ext', 18)}</span></a>
          <a class="list-row" href="https://plug.pk/terms" target="_blank" rel="noopener"><span class="ico">${ic('info', 18)}</span><span class="grow"><b class="t15">Terms</b></span><span class="chev">${ic('ext', 18)}</span></a>
        </div>
        <p class="group-label">Data on this device</p>
        ${U.confirmReset ? `<div class="notice amber">${ic('info', 18)}<div class="grow"><b>Clear everything?</b> Your saved stations, routes, reviews, posts and garage on this device go, and the app starts again from the welcome screens.<div class="row mt-12" style="gap:8px"><button class="btn btn-sm btn-danger" data-a="resetAll">Clear everything</button><button class="btn btn-sm btn-secondary" data-a="cancelReset">Keep my data</button></div></div></div>`
          : `<button class="btn btn-secondary btn-block" data-a="askReset">${ic('trash', 18)}Clear data and restart</button>`}
      </div>`,
  }
}
Object.assign(A, {
  notif: (k) => { S.notif[k] = !S.notif[k]; save(); render() },
  askReset: () => { U.confirmReset = true; render() },
  cancelReset: () => { U.confirmReset = false; render() },
  resetAll: () => {
    try { localStorage.removeItem(KEY) } catch { /* nothing stored */ }
    S = JSON.parse(JSON.stringify(DEFAULT))
    U.confirmReset = false; U.onbStep = 0; U.stack = [{ s: 'home' }]
    render()
  },
})

// ─── Partner Up ────────────────────────────────────────────────────
const VENUES = [['building', 'Hotels', 'Guests charge overnight'], ['fork', 'Restaurants', 'A charge over a meal'], ['bag', 'Malls', 'Parking that earns'], ['building', 'Offices', 'Staff and visitor parking'], ['car', 'Dealerships', 'Showroom and service bays'], ['wrench', 'Service centres', 'Charge while it’s worked on'], ['home', 'Homes', 'One unit on a driveway']]
SCREENS.partners = () => {
  const m = U.meeting || {}
  return {
    sb: 'light',
    html: `<div class="scroll">
      <header class="band lift">
        <button class="icon-btn" data-a="back" aria-label="Back" style="position:relative">${ic('arrowL', 22)}</button>
        <div class="eyebrow mt-12" style="position:relative">${ic('handshake', 13)} Partner Up</div>
        <h1 class="band-title mt-8" style="position:relative">Put your charger <span class="hl">on the map</span></h1>
        <p class="t14 mt-8" style="color:rgba(255,255,255,.65);position:relative">Drivers open plug.pk when they need a charge now. Be where they look.</p>
      </header>
      <div class="pad lifted stack gap-12">
        ${[['pin', 'List what you have', 'A hotel forecourt, an office car park or the one charger on your driveway. Same form, same few minutes.'], ['shield', 'We check the details', 'We confirm the address, the pin and the charger specs before publishing, so drivers who set off actually arrive.'], ['nav', 'Drivers find you', 'Your listing appears on the map and in search, filterable by plug and speed, with directions one tap away.']].map(([i, t, b], n) => `<div class="frame"><div class="face row" style="gap:14px;align-items:flex-start;padding:18px">
          <span style="font:700 40px/1 var(--font);color:transparent;-webkit-text-stroke:1.5px var(--line-strong);width:28px;flex:none">${n + 1}</span>
          <div class="grow"><div class="row" style="gap:8px"><span class="accent-text">${ic(i, 18)}</span><b class="t17">${t}</b></div><p class="t14 muted mt-4">${b}</p></div></div></div>`).join('')}
      </div>
      <section class="section"><div class="sec-head"><h2>Who lists with us</h2></div>
        <div class="chips">${VENUES.map(([i, l, d]) => `<span class="chip" style="height:auto;padding:10px 14px;border-radius:16px;flex-direction:column;align-items:flex-start;gap:2px"><span class="row" style="gap:6px"><span class="accent-text">${ic(i, 16)}</span><b>${l}</b></span><span class="t12 muted">${d}</span></span>`).join('')}</div>
      </section>
      <section class="section pad stack gap-12">
        <h2 class="t20">One price to list</h2>
        <div class="frame featured"><div class="face plan">
          <div class="row between"><b class="t17">Standard</b><span class="badge b-mint">Most chosen</span></div>
          <div class="mt-8"><span class="price">PKR 4,999</span> <span class="t14 muted">per month</span></div>
          <p class="t14 muted">Everything you need to be found.</p>
          <div class="stack gap-8 mt-16">${['Listed on the map and in Partner Up', 'Photos of your chargers', 'Reviews from drivers, with public replies', 'Views and directions dashboard'].map((f) => `<div class="feat"><span class="tick">${ic('check', 12, { sw: 2.6 })}</span>${f}</div>`).join('')}</div>
          <button class="btn btn-nav btn-block btn-lg mt-20" data-a="partnerSignup">List your charger ${ic('arrowR', 18)}</button>
        </div></div>
        <div class="frame"><div class="face plan">
          <b class="t17">Enterprise</b>
          <div class="mt-8"><span class="price">Let’s talk</span></div>
          <p class="t14 muted">Fleets, chains and multi-site operators.</p>
          <div class="stack gap-8 mt-16">${['Everything in Standard', 'Several sites under one account', 'Terms agreed for your sites', 'A meeting to set it up with us'].map((f) => `<div class="feat"><span class="tick">${ic('check', 12, { sw: 2.6 })}</span>${f}</div>`).join('')}</div>
        </div></div>
        <div class="notice neutral">${ic('info', 18)}<span>You set the price and you keep it. plug.pk doesn’t set your rates, take the payment or take a cut.</span></div>
      </section>
      <section class="section pad" style="padding-bottom:40px">
        <h2 class="t20">Arrange a meeting</h2>
        ${m.done ? `<div class="notice mint mt-12">${ic('check', 18)}<span><b>Thanks, ${esc(m.name)}.</b> In the live app this request goes straight to the partnerships team, who reply within two working days.</span></div>` : `
        <form class="stack gap-16 mt-12" data-submit="meeting" novalidate>
          <div><label class="label" for="mt-name">Your name</label><input class="input" id="mt-name" name="name" autocomplete="name" value="${esc(m.name)}"></div>
          <div><label class="label" for="mt-biz">Business</label><input class="input" id="mt-biz" name="biz" placeholder="e.g. Pearl Continental Lahore" value="${esc(m.biz)}"></div>
          <div><label class="label" for="mt-phone">Phone</label><input class="input" id="mt-phone" name="phone" inputmode="tel" placeholder="03xx xxxxxxx" value="${esc(m.phone)}"></div>
          <div><label class="label" for="mt-msg">What would you like to list? <span class="opt">optional</span></label><textarea class="textarea" id="mt-msg" name="msg" maxlength="600" placeholder="Number of sites, chargers, power">${esc(m.msg)}</textarea></div>
          ${m.err ? `<p class="err-msg">${ic('info', 15)}${m.err}</p>` : ''}
          <button class="btn btn-primary btn-lg" type="submit">Request a meeting</button>
        </form>`}
      </section>
    </div>`,
  }
}
A.meeting = (_, f) => {
  const v = Object.fromEntries(new FormData(f))
  const err = !v.name.trim() ? 'Enter your name.' : !v.biz.trim() ? 'Enter the business name.' : v.phone.replace(/\D/g, '').length < 10 ? 'Enter a phone number we can call, like 0300 1234567.' : null
  U.meeting = { ...v, err, done: !err }
  render()
}
A.partnerSignup = () => toast('Business sign-up opens on plug.pk/business/signup', 'building')
