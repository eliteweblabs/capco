module.exports = {
  proxy: "http://localhost:4321",
  files: [
    "src/**/*.{astro,js,ts,jsx,tsx,css}",
    "public/**/*",
    "dist/**/*"
  ],
  port: 3000,
  open: false,
  notify: true,
  reloadOnRestart: true,
  // Enable network access
  host: "0.0.0.0",
  listen: "0.0.0.0",
  // Inject BrowserSync script into pages
  injectChanges: true,
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
  // Socket configuration for syncing
  socket: {
    clients: {
      heartbeatTimeout: 10000
    }
  },
  // Log level
  logLevel: "info",
  // Log connections
  logConnections: true,
  // Log file changes
  logFileChanges: true,
  // Middleware to ensure script injection
  middleware: function (req, res, next) {
    next();
  }
};

