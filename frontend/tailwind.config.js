/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        'page-bg': 'var(--color-page-bg)',
        'input-bg': 'var(--color-input-bg)',
        'card-bg': 'var(--color-card-bg)',
        'active-bg': 'var(--color-active-bg)',
        'file-bg': 'var(--color-file-bg)',
        'border-line': 'var(--color-border-line)',
        'table-head': 'var(--color-table-head)',
      },
      fontFamily: {
        mono: ['ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
