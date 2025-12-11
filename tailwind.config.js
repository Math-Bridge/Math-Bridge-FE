/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF6B35',   // Orange from reference design
          dark: '#512f12',       // Dark brown from reference footer
          light: '#FF8C5A',     // Lighter Orange
          lighter: '#FFA87D',   // Even lighter Orange
        },
        accent: {
          red: '#F20231',        // Bright Red
          orange: '#FF6B35',     // Primary Orange
          yellow: '#FFD700',     // Gold for achievements
          green: '#10B981',      // Success/Progress
          purple: '#8B5CF6',     // Advanced topics
        },
        background: {
          cream: '#FEF9F3',      // Light beige/off-white from reference
          light: '#FFFBF5',      // Very light beige
        },
        math: {
          blue: '#3B82F6',       // Math symbols blue
          indigo: '#6366F1',     // Equations indigo
          teal: '#14B8A6',       // Geometry teal
          amber: '#F59E0B',      // Algebra amber
        },
        footer: {
          brown: '#512f12',      // Dark brown footer background
        },
      },
      boxShadow: {
        'math': '0 10px 40px -10px rgba(255, 107, 53, 0.3)',
        'math-lg': '0 20px 60px -15px rgba(255, 107, 53, 0.4)',
        'card': '0 4px 20px rgba(0, 0, 0, 0.1)',
      },
      backgroundImage: {
        'math-gradient': 'linear-gradient(135deg, #FF6B35 0%, #FF8C5A 100%)',
        'math-gradient-light': 'linear-gradient(135deg, #FEF9F3 0%, #FFFBF5 100%)',
        'orange-gradient': 'linear-gradient(to right, #FF6B35, #FF4500)',
      },
    },
  },
  plugins: [],
};
