import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        display: ["Inter", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          hover: "hsl(var(--primary-hover))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        heading: "hsl(var(--heading))",
        body: "hsl(var(--text-body))",
        subdued: "hsl(var(--text-secondary))",
        faint: "hsl(var(--text-faint))",
        divider: "hsl(var(--divider))",
        skeleton: "hsl(var(--skeleton))",
        banner: "hsl(var(--banner))",
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
          bg: "hsl(var(--success-bg))",
          border: "hsl(var(--success-border))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
          bg: "hsl(var(--warning-bg))",
          border: "hsl(var(--warning-border))",
        },
        attention: {
          DEFAULT: "hsl(var(--attention))",
          bg: "hsl(var(--attention-bg))",
          border: "hsl(var(--attention-border))",
        },
        danger: {
          DEFAULT: "hsl(var(--destructive))",
          bg: "hsl(var(--danger-bg))",
          border: "hsl(var(--danger-border))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          bg: "hsl(var(--info-bg))",
          border: "hsl(var(--info-border))",
        },
        neutral: {
          DEFAULT: "hsl(var(--neutral))",
          bg: "hsl(var(--neutral-bg))",
          border: "hsl(var(--neutral-border))",
        },
      },
      fontSize: {
        // Page titles (28/36 bold); everything else uses Tailwind's 12/14/16/20 steps.
        title: ["1.75rem", { lineHeight: "2.25rem", fontWeight: "700" }],
      },
      borderRadius: {
        sm: "0.25rem",   // badges, small elements
        md: "0.375rem",  // the default: buttons, inputs, nav items
        lg: "0.5rem",    // cards, popovers, search
        xl: "0.75rem",   // large panels (rare)
        "2xl": "0.75rem",
      },
      boxShadow: {
        // Flat at rest: a 1px hairline drawn as a shadow so states never shift layout.
        edge: "0 0 0 1px hsl(var(--border))",
        "edge-strong": "0 0 0 1px hsl(var(--text-secondary))",
        // Only things that float (menus, popovers, dialogs) get elevation.
        float: "0 5px 15px rgba(0,0,0,0.12), 0 15px 35px rgba(48,49,61,0.08)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "stagger-fade-in": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          from: { opacity: "0", transform: "translateX(-10px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.2s ease-out both",
        "stagger-fade-in": "stagger-fade-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
        "slide-in": "slide-in 0.3s ease-out",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [animate],
} satisfies Config;
