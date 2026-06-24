module.exports = {
  apps: [{
    name: 'ademola-xd',
    script: 'index.js',
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_restarts: 5,
    min_uptime: '10s',
    max_memory_restart: '512M',
    max_restart_delay: 300000,
    watch: false,
    ignore_watch: ['node_modules', 'logs']
  }]
};