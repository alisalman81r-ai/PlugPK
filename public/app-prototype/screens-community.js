// plug.pk app prototype — the community: a discussion feed with photos and polls,
// and one Create sheet for a question, a photo post or a poll.
'use strict'


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

/** Who replied last, so a busy thread reads as alive without opening it. */
function lastReply(p) {
  const c = [...p.comments].sort((a, b) => new Date(b.date) - new Date(a.date))[0]
  if (!c) return ''
  const others = [...new Set(p.comments.map((x) => x.name))].filter((n) => n !== c.name).slice(0, 2)
  return `<button class="cm-last" data-a="go" data-v="post" data-id="${p.id}">
      <span class="cm-stack">${[c.name, ...others].map((n) => avatarFor(n, 22)).join('')}</span>
      <span class="grow trunc">Last reply from <b>${esc(c.name.split(' ')[0])}</b> · ${ago(c.date)}</span>${ic('chevR', 16)}
    </button>`
}

function postCard(p) {
  const liked = !!S.liked[p.id], saved = S.savedPosts.includes(p.id)
  return `<article class="card cm-post">
    <div class="cm-author">
      ${avatarFor(p.name)}
      <div class="grow" style="min-width:0">
        <div class="row" style="gap:6px"><b class="t14 trunc">${esc(p.name)}</b>${p.mine ? '<span class="badge b-teal">You</span>' : ''}${p.example ? '<span class="badge b-slate">Example</span>' : ''}</div>
        <div class="t12 faint trunc">${p.car ? `${esc(p.car)} · ` : ''}${ago(p.date)}</div>
      </div>
      <button class="icon-btn cm-menu" data-a="postMenu" data-v="${p.id}" aria-label="More options">${ic('dots', 20)}</button>
    </div>
    <div class="cm-tags">${catTag(p.category)}${p.poll ? `<span class="badge b-slate">${ic('chart', 12)}Poll</span>` : ''}${p.photos.length ? `<span class="badge b-slate">${ic('image', 12)}${p.photos.length}</span>` : ''}</div>
    <button class="cm-content" data-a="go" data-v="post" data-id="${p.id}">
      <h3 class="cm-title">${esc(p.title)}</h3>
      ${p.body ? `<p class="cm-body">${esc(p.body)}</p>` : ''}
      ${p.photos[0] ? `<div class="cm-photo"><img src="${img(p.photos[0])}" alt="" loading="lazy">${p.photos.length > 1 ? `<span class="cm-more">${ic('image', 13)}+${p.photos.length - 1}</span>` : ''}</div>` : ''}
    </button>
    ${p.poll ? `<div class="cm-poll">${pollBlock(p)}</div>` : ''}
    ${lastReply(p)}
    <div class="cm-actions">
      <button class="${liked ? 'liked' : ''}" data-a="like" data-v="${p.id}" aria-pressed="${liked}">${ic('heart', 18, { fill: liked })}<span><span class="mono">${p.likes}</span> ${p.likes === 1 ? 'Like' : 'Likes'}</span></button>
      <button data-a="go" data-v="post" data-id="${p.id}">${ic('chat', 18)}<span><span class="mono">${p.comments.length}</span> ${p.comments.length === 1 ? 'Reply' : 'Replies'}</span></button>
      <button class="${saved ? 'saved' : ''}" data-a="savePost" data-v="${p.id}" aria-pressed="${saved}">${ic('bookmark', 18, { fill: saved })}<span>${saved ? 'Saved' : 'Save'}</span></button>
    </div>
  </article>`
}

SCREENS.community = () => {
  const c = U.comm
  const all = allPosts()
  const q = (c.q || '').trim().toLowerCase()
  let posts = all.filter((p) => (c.cat === 'all' || p.category === c.cat) && (!q || `${p.title} ${p.body} ${p.name} ${p.car || ''}`.toLowerCase().includes(q)))
  posts = c.sort === 'latest' ? posts.sort((a, b) => new Date(b.date) - new Date(a.date)) : c.sort === 'liked' ? posts.sort((a, b) => b.likes - a.likes) : posts.sort((a, b) => b.comments.length - a.comments.length)
  const drivers = new Set(all.flatMap((p) => [p.name, ...p.comments.map((x) => x.name)])).size
  const tabs = [['latest', 'Latest'], ['liked', 'Popular'], ['discussed', 'Most active']]
  const topics = [['all', 'All topics'], ...Object.entries(CAT).map(([k, [l]]) => [k, l])]
  const clubs = [...D.clubs].sort((a, b) => (a.city === S.city ? -1 : b.city === S.city ? 1 : b.members - a.members))
  const me = S.user ? avatarFor(S.user.name, 40) : `<span class="avatar" style="background:var(--sunken);color:var(--muted)">${ic('user', 18)}</span>`
  return {
    sb: 'light', tabs: true,
    html: `<div class="sb-scrim"></div><div class="scroll">
      <header class="band cm-head">
        <div class="eyebrow">${ic('users', 13)} Community</div>
        <h1 class="band-title mt-4">Ask drivers who’ve <span class="hl">done the drive</span></h1>
        <div class="cm-stats">
          <div><b class="mono">${all.length}</b><span>Discussions</span></div>
          <div><b class="mono">${drivers}</b><span>Drivers</span></div>
          <div><b class="mono">${D.clubs.length}</b><span>City clubs</span></div>
        </div>
        <div class="field mt-16"><span class="lead" style="color:rgba(255,255,255,.5)">${ic('search', 18)}</span><input class="input pk-search" id="cm-q" data-in="commQ" placeholder="Search posts, topics, people" value="${esc(c.q || '')}" autocomplete="off"></div>
      </header>

      <div class="cm-bar" data-stick>
        <div class="cm-tabs" role="tablist">${tabs.map(([k, l]) => `<button role="tab" aria-selected="${c.sort === k}" class="${c.sort === k ? 'on' : ''}" data-a="commSort" data-v="${k}">${l}</button>`).join('')}</div>
        <div class="chips" style="padding-top:10px;padding-bottom:10px">${topics.map(([k, l]) => `<button class="chip ${c.cat === k ? 'solid on' : ''}" data-a="commCat" data-v="${k}">${l}</button>`).join('')}</div>
      </div>

      <div class="pad mt-16">
        <div class="card cm-composer">
          <button class="cm-composer-top" data-a="newPost" data-v="text">${me}<span class="grow cm-compose-field">Ask other EV drivers…</span></button>
          <div class="cm-composer-acts">
            <button data-a="newPost" data-v="text">${ic('chat', 17)}Question</button>
            <button data-a="newPost" data-v="photo">${ic('image', 17)}Photo</button>
            <button data-a="newPost" data-v="poll">${ic('chart', 17)}Poll</button>
          </div>
        </div>
      </div>

      ${!q && c.cat === 'all' ? `<section class="mt-24">
        <div class="sec-head"><div><h2>EV clubs</h2><p class="sub">Meetups, convoys and local advice</p></div><button class="link" data-a="go" data-v="clubs">See all ${ic('arrowR', 14)}</button></div>
        <div class="hscroll">${clubs.map((x) => {
          const joined = S.clubs.includes(x.id)
          return `<div class="card cm-club">
            <div class="row between"><span class="badge b-teal">${ic('pin', 12)}${esc(x.city)}</span><span class="t12 mono muted row" style="gap:4px">${ic('users', 13)}${x.members + (joined ? 1 : 0)}</span></div>
            <b class="t15 clamp2 mt-8" style="line-height:1.3;min-height:39px">${esc(x.name)}</b>
            <button class="btn btn-sm ${joined ? 'btn-secondary' : 'btn-primary'} btn-block mt-12" data-a="joinClub" data-v="${x.id}">${joined ? `${ic('check', 16)}Joined` : 'Join'}</button>
          </div>`
        }).join('')}</div>
      </section>` : ''}

      <div class="pad row between mt-24" style="margin-bottom:12px">
        <h2 class="t20">${q ? 'Results' : c.cat === 'all' ? 'Discussions' : CAT[c.cat][0]}</h2>
        <span class="t13 muted"><b class="mono" style="color:var(--fg)">${posts.length}</b> post${posts.length === 1 ? '' : 's'}</span>
      </div>
      <div class="pad stack gap-12">${posts.map(postCard).join('') || `<div class="empty">${q ? `Nothing matches “${esc(c.q.trim())}”. Try another word, or ask it yourself.` : 'No posts in this topic yet. Start the conversation.'}<button class="btn btn-sm btn-primary" data-a="newPost">${ic('pencil', 16)}New post</button></div>`}</div>
    </div>`,
  }
}

Object.assign(A, {
  savePost: (id) => {
    if (!S.user) return needSignIn('Sign in to save posts for later.')
    const on = S.savedPosts.includes(id)
    S.savedPosts = on ? S.savedPosts.filter((x) => x !== id) : [id, ...S.savedPosts]
    save(); if (U.sheet) closeSheet(); render(); toast(on ? 'Removed from saved' : 'Saved for later', 'bookmark')
  },
  vote: (v) => {
    if (!S.user) return needSignIn('Sign in to vote in polls.')
    const [id, k] = v.split('|'); S.votes[id] = +k; save(); render()
  },
  unvote: (id) => { delete S.votes[id]; save(); render() },
  postMenu: (id) => openSheet('postMenu', { id }),
  reportPost: () => { closeSheet(); toast('Reported. A moderator will review it', 'flag') },
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
IN.draftPhotoFile = (_, el) => readPhoto(el.files[0], (u) => A.draftPhoto(u))

// ─── Create: a post, a photo post or a poll ───────────────────────
Object.assign(A, {
  newPost: (v) => {
    if (!S.user) return needSignIn('Sign in to post. Your name and car show on the post.')
    U.draft = { kind: ['text', 'photo', 'poll'].includes(v) ? v : 'text', title: '', body: '', cat: 'general', photos: [], opts: ['', ''] }
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
  const kinds = [['text', 'chat', 'Question'], ['photo', 'image', 'Photo'], ['poll', 'chart', 'Poll']]
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
