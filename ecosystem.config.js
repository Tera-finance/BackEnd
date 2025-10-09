module.exports = {
  apps: [{
    name: 'trustbridge-api',
    script: './dist/index.js',
    instances: 2,  // Use 2 instances or 'max' for all CPU cores
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '500M',
    watch: false,
    merge_logs: true,
    // Graceful shutdown
    kill_timeout: 5000,
    listen_timeout: 3000,
    // Environment-specific settings
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_staging: {
      NODE_ENV: 'staging',
      PORT: 3001
    }
  }]
};
