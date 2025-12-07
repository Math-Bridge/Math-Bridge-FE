/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0A5E7B',   // Teal/Dark Cyan
          dark: '#11113C',       // Dark Navy Blue
          light: '#1A7A9A',     // Lighter Teal
          lighter: '#2B9BC4',   // Even lighter Teal
        },
        accent: {
          red: '#F20231',        // Bright Red
          orange: '#EFBF7F',     // Light Orange/Peach
          yellow: '#FFD700',     // Gold for achievements
          green: '#10B981',      // Success/Progress
          purple: '#8B5CF6',     // Advanced topics
        },
        background: {
          cream: '#FAE6DF',      // Very Light Cream/Off-white
          light: '#FFF2EF',      // Very light cream
        },
        math: {
          blue: '#3B82F6',       // Math symbols blue
          indigo: '#6366F1',     // Equations indigo
          teal: '#14B8A6',       // Geometry teal
          amber: '#F59E0B',      // Algebra amber
        },
      },
      boxShadow: {
        'math': '0 10px 40px -10px rgba(10, 94, 123, 0.3)',
        'math-lg': '0 20px 60px -15px rgba(10, 94, 123, 0.4)',
      },
      backgroundImage: {
        'math-gradient': 'linear-gradient(135deg, #0A5E7B 0%, #11113C 50%, #0A5E7B 100%)',
        'math-gradient-light': 'linear-gradient(135deg, #F8E5CB 0%, #EFBF7F 50%, #F8E5CB 100%)',
      },
    },
  },
  plugins: [],
};
