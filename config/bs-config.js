export default {
  proxy: "http://localhost:4321",
  files: [
    "src/**/*.{astro,js,ts,jsx,tsx,css}",
    "public/**/*",
    "dist/**/*"
  ],
  port: 3000,
  open: false,
  notify: false,
  reloadOnRestart: true,
  // Enable network access
  host: "0.0.0.0",
  listen: "0.0.0.0",
  // UI settings
  ui: {
    port: 3001,
    weinre: {
      port: 8080
    }
  },
  // Sync scrolling, clicks, and form inputs across devices
  ghostMode: {
    clicks: true,
    forms: true,
    scroll: true
  },
  // Log level
  logLevel: "info",
  // Log connections
  logConnections: true,
  // Log file changes
  logFileChanges: true
};

