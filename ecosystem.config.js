module.exports = {
  apps: [{
    name: 'present-catch-bot',
    script: './index.js',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    }
  }]
}
