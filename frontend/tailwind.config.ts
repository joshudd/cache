import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			// Brand colors
  			'white': 'hsl(var(--white))',
  			'primary': 'hsl(var(--primary))',
  			'secondary': 'hsl(var(--secondary))',
  			'black': 'hsl(var(--black))',
  			'tertiary': 'hsl(var(--tertiary))',
  			'grey': 'hsl(var(--grey))',
  			'dark-grey': 'hsl(var(--dark-grey))',
  			'light-grey': 'hsl(var(--light-grey))',

  			// Semantic colors
  			background: 'var(--background)',
  			foreground: 'var(--foreground)',
  			
  			card: {
  				DEFAULT: 'var(--card)',
  				foreground: 'var(--card-foreground)'
  			},
  			popover: {
  				DEFAULT: 'var(--popover)',
  				foreground: 'var(--popover-foreground)'
  			},
  			muted: {
  				DEFAULT: 'var(--muted)',
  				foreground: 'var(--muted-foreground)'
  			},
  			accent: {
  				DEFAULT: 'var(--accent)',
  				foreground: 'var(--accent-foreground)'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',

  		},
  		fontFamily: {
  			sofia: [
  				'var(--font-sofia)'
  			]
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [
    require("tailwindcss-animate"),
    require("tailwind-scrollbar")
  ],
} satisfies Config;
