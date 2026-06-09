module.exports = {
  apps: [
    {
      name: "yourazz-license-bot",
      script: "dist/index.js",
      cwd: "C:/Users/KYLIAN/Desktop/yourazz-license-bot",
      interpreter: "node",
      restart_delay: 3000,
      max_restarts: 10,
      watch: false,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
