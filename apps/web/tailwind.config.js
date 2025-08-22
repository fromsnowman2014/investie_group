/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Force light mode colors only - no dark mode support
        background: "#ffffff",
        foreground: "#0f172a",
        
        // Light theme color system
        primary: "#2563eb",
        secondary: "#7c3aed", 
        success: "#059669",
        warning: "#d97706",
        error: "#dc2626",
        
        // Text colors (light mode only)
        'text-primary': "#0f172a",
        'text-secondary': "#475569", 
        'text-tertiary': "#94a3b8",
        
        // Surface colors (light mode only)
        surface: "#ffffff",
        'surface-elevated': "#ffffff",
        border: "#e2e8f0",
        'border-light': "#f1f5f9",
      },
    },
  },
  // Disable dark mode completely
  darkMode: false,
  plugins: [],
}