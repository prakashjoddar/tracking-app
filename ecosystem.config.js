module.exports = {
  apps: [
    {
      name: "progress-erp",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      instances: "max", // Utilises all available CPU cores
      exec_mode: "cluster", // Enables load balancing
      env: {
        PORT: 3000,
        NODE_ENV: "production",
      },
    },
  ],
};

// pm2 start ecosystem.config.js

// npm run build
// pm2 start node_modules/next/dist/bin/next --name "progress-erp" -- start
