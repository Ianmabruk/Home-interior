/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Luxury interior design palette
        primary: '#FFF8F0',
        secondary: '#F5EBDD',
        sidebar: '#6B4E3D',
        darkBrown: '#3E2F25',
        lightBeige: '#F7F0E7',
        cream: '#FFF7EE',
        accentOrange: '#FF8A3D',
        softOrange: '#FFC28A',
        border: '#E7D7C8',
        textPrimary: '#2D241E',
        textSecondary: '#6B625C',
        success: '#2E7D32',
        warning: '#FF8A3D',
        error: '#D32F2F',
        // Backward-compatible aliases
        creamWhite: '#FFF8F0',
        softBeige: '#F5EBDD',
        linen: '#F7F0E7',
        sand: '#E7D7C8',
        stone: '#B5A99A',
        clay: '#C4A882',
        warm: '#8B7355',
        warmBrown: '#6B4E3D',
        elegantOrange: '#FF8A3D',
        orange: '#D97706',
        inkPrimary: '#2D241E',
        inkSecondary: '#6B625C',
        ink: '#2D241E',
        charcoal: '#3E2F25',
        borderBeige: '#E7D7C8',
        white: '#FFFFFF',
        luxuryBeige: '#F5EBDD',
        luxuryBeigeLight: '#F7F0E7',
        luxuryBeigeSoft: '#FFF7EE',
        warmBeige: '#F5EBDD',
        warmBeigeLight: '#F7F0E7',
        warmBeigeSoft: '#FFF7EE',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', '"Cormorant Garamond Fallback"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', '"DM Sans Fallback"', '"Source Sans 3"', 'system-ui', 'sans-serif'],
        body: ['"DM Sans"', '"DM Sans Fallback"', '"Source Sans 3"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
        '3xs': ['0.6rem', { lineHeight: '0.9rem' }],
      },
      letterSpacing: {
        widest: '0.25em',
        wider: '0.18em',
        wide: '0.12em',
      },
      boxShadow: {
        soft: '0 4px 24px rgba(46,40,35,0.07)',
        card: '0 2px 16px rgba(46,40,35,0.06)',
        lift: '0 12px 40px rgba(46,40,35,0.12)',
        innerSoft: 'inset 0 2px 8px rgba(46,40,35,0.04)',
        glow: '0 0 20px rgba(255,138,61,0.15)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
        '3xl': '1.5rem',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
        luxury: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        fadeUp: 'fadeUp 0.5s ease-out forwards',
        shimmer: 'shimmer 1.8s infinite linear',
        fadeIn: 'fadeIn 0.25s ease-out forwards',
        scaleIn: 'scaleIn 0.25s ease-out forwards',
        slideInRight: 'slideInRight 0.3s ease-out forwards',
      },
      backgroundImage: {
        'luxury-gradient': 'linear-gradient(135deg, #FFF8F0 0%, #F5EBDD 100%)',
        'sidebar-gradient': 'linear-gradient(180deg, #6B4E3D 0%, #5A4132 100%)',
        'card-gradient': 'linear-gradient(180deg, #FFFFFF 0%, #FFF7EE 100%)',
      },
    },
  },
  plugins: [],
}
