/**
 * PM2 Ecosystem Configuration — LocalWheels Enterprise v1.0
 *
 * Usage:
 *   pm2 start deploy/ecosystem.config.js --env production
 *   pm2 save
 *   pm2 startup
 */

module.exports = {
  apps: [
    {
      name: 'localwheels-api',
      script: 'backend/src/index.js',
      cwd: '/var/www/localwheels',

      // Process settings
      instances: 1,           // Single instance; scale to 'max' after load testing
      exec_mode: 'fork',      // Use 'cluster' if scaling to multiple instances
      autorestart: true,
      watch: false,           // Never watch in production
      max_memory_restart: '512M',

      // Restart behavior
      min_uptime: '10s',      // Consider crashed if exits within 10s of start
      max_restarts: 10,       // Stop restarting after 10 crashes in a row
      restart_delay: 4000,    // 4s between restart attempts

      // Environment
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },

      // Logs
      out_file: '/var/log/localwheels/api-out.log',
      error_file: '/var/log/localwheels/api-err.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      log_type: 'json',

      // Graceful shutdown
      kill_timeout: 10000,    // 10s to finish in-flight requests before SIGKILL
      listen_timeout: 10000,  // 10s to start listening before marking as failed

      // Health / monitoring
      exp_backoff_restart_delay: 100,
    },
  ],
};
