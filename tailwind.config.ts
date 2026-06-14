import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        lakers: {
          purple: '#552583',
          'purple-light': '#6b35a3',
          'purple-dark': '#3d1a60',
          gold: '#FDB927',
          'gold-light': '#fec94d',
          'gold-dark': '#d99d10',
        },
        surface: {
          DEFAULT: '#0f0f14',
          1: '#16161e',
          2: '#1e1e2a',
          3: '#26263a',
          4: '#2e2e48',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}

export default config
