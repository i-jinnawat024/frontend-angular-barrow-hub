const { execSync } = require('node:child_process');

// ใช้ตัวนี้!!  ไม่ใช่ NODE_ENV
const vercelEnv = process.env.VERCEL_ENV || 'production';

const configByEnv = {
  production: 'build:prod',
  preview: 'build:dev',
  development: 'build:local',
};

const script = configByEnv[vercelEnv] || 'build:prod';

console.log(`Detected VERCEL_ENV=${vercelEnv}. Running npm run ${script}.`);

execSync(`npm run ${script}`, {
  stdio: 'inherit',
  env: process.env,
});
