// postcss.config.js
// CommonJS on purpose: Node's ESM loader rejects Windows drive-letter paths
// (ERR_UNSUPPORTED_ESM_URL_SCHEME), which breaks a `.mjs` PostCSS config here.

/** @type {import('postcss-load-config').Config} */
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
