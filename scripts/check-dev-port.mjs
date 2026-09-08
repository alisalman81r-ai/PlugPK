// scripts/check-dev-port.mjs
//
// Refuses to start a second dev server. Runs as `predev`.
//
// ── What this is stopping ─────────────────────────────────────────────
//
// `next dev` does not fail when its port is taken — it increments and starts
// on the next one. Both servers then share the same `.next`, because distDir
// comes from the config and neither run overrides it, so the two write build
// manifests over each other. The result is not a clean error: it is
// "Internal Server Error" on every route of the second server and, once the
// first one recompiles anything, 404s on the first as well.
//
// next.config.mjs already documents this hazard for a build racing a dev
// server, and the fix there was NEXT_DIST_DIR. Two dev servers are the same
// collision, and it happened twice in one afternoon — the second server is
// almost always somebody starting one without noticing another is running.
//
// So: check the port before Next gets a chance to be helpful about it. This
// exits non-zero, which stops `npm run dev` before anything is written.
//
// To genuinely run two at once, give the second its own output directory:
//
//   NEXT_DIST_DIR=.next-alt npx next dev -p 3005
//
// which this allows, because the collision it guards against is the shared
// directory rather than the port itself.

import { connect } from 'node:net'

const PORT = Number(process.env.PORT ?? 3000)

// An explicit dist dir means the caller has already opted out of the shared
// .next, so there is nothing to collide over.
if (process.env.NEXT_DIST_DIR) {
  process.exit(0)
}

/*
  Connect, do not bind.

  The obvious check is to listen on the port and treat EADDRINUSE as "taken".
  That does not work on Windows: Node sets SO_REUSEADDR, so a second bind to a
  port another process is already listening on succeeds, and the probe reports
  the port free. This guard was written that way first and let a second dev
  server straight through — the exact thing it exists to stop.

  Opening a connection cannot be fooled the same way. Something answers or
  nothing does.
*/
const inUse = await new Promise((resolve) => {
  const socket = connect({ port: PORT, host: '127.0.0.1' })
  const done = (result) => {
    socket.destroy()
    resolve(result)
  }
  socket.setTimeout(1500)
  socket.once('connect', () => done(true))
  socket.once('timeout', () => done(false))
  socket.once('error', () => done(false))
})

if (!inUse) {
  process.exit(0)
}

console.error('')
console.error(`  Port ${PORT} is already in use, and a dev server is probably on it.`)
console.error('')
console.error('  Not starting a second one: `next dev` would move to the next free')
console.error('  port and then share .next with the first, which corrupts both —')
console.error('  "Internal Server Error" on one and 404s on the other.')
console.error('')
console.error('  Use the server that is already running, or stop it first:')
console.error('')
console.error(`    npx kill-port ${PORT}`)
console.error(`    powershell "Get-NetTCPConnection -LocalPort ${PORT} | Select OwningProcess"`)
console.error('')
console.error('  To deliberately run a second one, give it its own output dir:')
console.error('')
console.error(`    NEXT_DIST_DIR=.next-alt npx next dev -p ${PORT + 5}`)
console.error('')
process.exit(1)
