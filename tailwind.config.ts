import type { Config } from 'tailwindcss';
import flowbitePlugin from 'flowbite/plugin';

export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './src/**/*.{html,ts,scss}',
    './public/**/*.{html,js}',
    './node_modules/flowbite/**/*.js'
  ],
  theme: {
    extend: {}
  },
  plugins: [flowbitePlugin]
} satisfies Config;
