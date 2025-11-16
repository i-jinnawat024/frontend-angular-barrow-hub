const { execSync } = require('node:child_process');

const env = process.env.NODE_ENV || 'production';

const configByEnv = {
  production: 'build:prod',
  preview: 'build:dev',
  development: 'build:local',
};

const script = configByEnv[env] || 'build:local';

console.log(`Detected NODE_ENV=${env}. Running npm run ${script}.`);

execSync(`npm run ${script}`, {
  stdio: 'inherit',
  env: process.env,
});
