/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
      },
      colors: {
        'brand': {
          'dark-green': '#052D2A',
          'brown': '#673521',
          'gold': '#C7893B',
          'taupe': '#8E786B',
          'cream': '#F7F4F0',
          
        },
      },
      backgroundColor: {
        'primary': 'var(--color-bg-primary)',
        'secondary': 'var(--color-bg-secondary)',
      },
      textColor: {
        'primary': 'var(--color-text-primary)',
        'secondary': 'var(--color-text-secondary)',
      },
    },
  },
  plugins: [],
}