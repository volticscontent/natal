import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // Otimizações de performance
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
      },
      fontFamily: {
        'christmas': ['Comic Sans MS', 'cursive'],
        'fertigo': ['"Fertigo Pro"', 'Times', '"Times New Roman"', 'serif'],
        'sans': ['Calibri', 'Candara', 'Segoe', '"Segoe UI"', 'Optima', 'Arial', 'sans-serif'],
      },
      textShadow: {
        'sm': '0 1px 2px rgb(0 0 0 / 0.05)',
        'DEFAULT': '0 1px 3px rgb(0 0 0 / 0.1), 0 1px 2px rgb(0 0 0 / 0.06)',
        'md': '0 4px 6px rgb(0 0 0 / 0.07), 0 2px 4px rgb(0 0 0 / 0.06)',
        'lg': '0 10px 15px rgb(0 0 0 / 0.1), 0 4px 6px rgb(0 0 0 / 0.05)',
        'xl': '0 20px 25px rgb(0 0 0 / 0.1), 0 10px 10px rgb(0 0 0 / 0.04)',
        '2xl': '0 25px 50px rgb(0 0 0 / 0.25)',
        'none': 'none',
        'dark': '2px 2px 4px rgba(0, 0, 0, 0.8)',
        'strong': '2px 2px 8px rgba(0, 0, 0, 0.9)',
      },
    },
  },
  plugins: [
    function ({ matchUtilities, theme }: { matchUtilities: (utilities: Record<string, (value: string) => Record<string, string>>, options?: { values?: Record<string, string> }) => void; theme: (key: string) => Record<string, string> }) {
      matchUtilities(
        {
          'text-shadow': (value: string) => ({
            textShadow: value,
          }),
        },
        { values: theme('textShadow') }
      )
    },
  ],
} satisfies Config;