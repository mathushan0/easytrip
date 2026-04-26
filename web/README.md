# EasyTrip Web App

Responsive web application for trip planning built with Next.js, React, Tailwind CSS, and TypeScript.

## Project Structure

```
web/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── layout/         # Layout components (Header, Sidebar, etc.)
│   │   ├── Button.tsx      # Button variants
│   │   ├── Card.tsx        # Card container
│   │   ├── Input.tsx       # Form inputs
│   │   ├── Chip.tsx        # Pill badges
│   │   ├── Badge.tsx       # LIK badges
│   │   ├── Modal.tsx       # Modal dialog
│   │   ├── Carousel.tsx    # Image carousel
│   │   ├── ProgressBar.tsx # Progress indicator
│   │   └── index.ts        # Component exports
│   ├── contexts/           # React contexts
│   │   └── ThemeContext.tsx # Theme switching
│   ├── pages/              # Page components
│   │   ├── HomePage.tsx    # Home page
│   │   └── SettingsPage.tsx # Settings page
│   ├── lib/                # Utilities
│   │   └── animations.ts   # Animation helpers
│   ├── styles/             # Global styles
│   │   └── globals.css     # CSS variables, theme colors
│   └── hooks/              # Custom React hooks (TBD)
├── tailwind.config.ts      # Tailwind configuration
├── tsconfig.json           # TypeScript configuration
├── postcss.config.js       # PostCSS configuration
├── next.config.js          # Next.js configuration
└── package.json
```

## Design System

### Colors

Four theme variants with CSS variables:

- **Bubbly** (Default): Bright, playful colors
  - Primary: `#FFD93D` (Yellow)
  - Accent: `#FF6B6B` (Red)
  - Secondary: `#4DABF7` (Blue)
  - Tertiary: `#63E6BE` (Teal)
  - Quaternary: `#DA77F2` (Purple)
  - Quinary: `#FFA94D` (Orange)

- **Aurora**: Dark theme with purple/pink gradients
- **Warm Sand**: Earthy browns and oranges
- **Electric**: Neon cyan and pink

### Typography

- **Display**: Fredoka (500/600/700)
  - Sizes: 24px, 28px, 32px, 40px, 48px
  
- **Body**: Nunito (600/700/800/900)
  - Sizes: 12px, 14px, 16px, 18px, 20px

### Components

#### Button
```tsx
<Button variant="primary" size="md">
  Click me
</Button>
```
Variants: `primary`, `secondary`, `danger`, `ghost`
Sizes: `sm`, `md`, `lg`

#### Card
```tsx
<Card hover variant="default" padding="md">
  Content here
</Card>
```
Variants: `default`, `glass`, `raised`
Padding: `sm`, `md`, `lg`

#### Input
```tsx
<Input
  label="Name"
  error={error}
  fullWidth
/>
```

#### Chip
```tsx
<Chip
  label="Food"
  color="food"
  variant="filled"
  onRemove={() => {}}
/>
```
Colors: `food`, `landmark`, `transport`, `culture`, `budget`, `accommodation`, `general`

#### Badge
```tsx
<Badge size="md" theme="bubbly">
  ⭐
</Badge>
```
Sizes: `sm`, `md`, `lg`
Themes: `bubbly`, `aurora`, `warm_sand`, `electric`

### Shadows

- **Flat**: `shadow-flat-sm`, `shadow-flat-md`, `shadow-flat-lg`
- **Lift**: `shadow-lift-sm`, `shadow-lift-md`, `shadow-lift-lg`

### Spacing

- `space-xs`: 4px
- `space-sm`: 8px
- `space-md`: 16px
- `space-lg`: 24px
- `space-xl`: 32px
- `space-2xl`: 48px
- `space-3xl`: 64px

### Animations

- **Card Hover**: `animate-card-lift`
- **Tab Bounce**: `animate-tab-bounce`
- **Pulse**: `animate-pulse-soft`
- **Wobble**: `animate-wobble`
- **Fade In**: `animate-in fade-in`
- **Slide Up**: `animate-in slide-in-from-bottom`

Spring timing: `cubic-bezier(0.34, 1.56, 0.64, 1)`

### Border Radius

- `rounded-xs`: 8px
- `rounded-sm`: 12px
- `rounded-md`: 16px
- `rounded-lg`: 20px
- `rounded-xl`: 24px

## Responsive Design

### Breakpoints

- **Mobile**: 320px - 768px
  - Single column layouts
  - Full-width inputs/buttons
  - Hamburger menu
  - Bottom-sticky floating buttons
  
- **Tablet**: 768px - 1024px
  - 2-column layouts
  - Hamburger menu (side panel)
  - Side sidebar hidden by default
  
- **Desktop**: 1024px+
  - Multi-column grids
  - Always-visible sidebar (200px)
  - Full navigation

### Layout Components

#### RootLayout
Main layout with header, sidebar, and content area.

```tsx
<RootLayout currentPath="/home">
  <YourPageContent />
</RootLayout>
```

#### AuthLayout
Centered form layout for login/signup pages.

```tsx
<AuthLayout title="Sign In">
  <form>{/* Form content */}</form>
</AuthLayout>
```

## Theme Switching

Use the `useTheme` hook to access theme context:

```tsx
const { theme, setTheme, isDarkMode, setIsDarkMode } = useTheme();

// Change theme
setTheme('aurora');

// Toggle dark mode
setIsDarkMode(!isDarkMode);
```

Themes are persisted to localStorage automatically.

## Dark Mode

Dark mode is supported via:
- Tailwind's `dark:` prefix
- CSS variables that change per theme
- Respects `prefers-color-scheme` system preference

## Mobile Optimization

- 44px minimum tap targets
- No text zoom on input focus (iOS)
- Viewport meta tags configured
- No horizontal scroll
- Fast transitions (200ms)
- Respects `prefers-reduced-motion`

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run type-check
```

Visit `http://localhost:3000` in your browser.

## Customization

### Add Custom Colors

Edit `tailwind.config.ts`:

```ts
colors: {
  custom: {
    primary: '#color',
    secondary: '#color',
  },
}
```

### Add Custom Animations

Edit `tailwind.config.ts` and `src/styles/globals.css`:

```ts
keyframes: {
  'my-animation': {
    '0%': { /* ... */ },
    '100%': { /* ... */ },
  },
}
```

### Create New Components

1. Create file in `src/components/`
2. Export in `src/components/index.ts`
3. Use in pages

Example:

```tsx
import { Button, Card } from '@/components';
```

## Performance

- Tree-shaking enabled
- Image optimization via Next.js
- CSS minification
- Component code splitting
- Lazy loading for pages

## Accessibility

- Semantic HTML
- ARIA labels
- Keyboard navigation
- Focus states
- Color contrast compliance
- Screen reader support

## Browser Support

- Chrome/Edge 144+
- Firefox 128+
- Safari 17+
- Mobile browsers (iOS Safari, Chrome Android)

## Next Steps

1. Integrate with backend API at `/api` routes
2. Add page-specific layouts (TripCreator, Itinerary, DailyPlanner, etc.)
3. Implement form validation
4. Add state management (Zustand stores)
5. Create custom hooks for API calls
6. Add comprehensive testing (Jest, React Testing Library)

## Notes

- All components are responsive by default
- CSS variables handle theming and dark mode
- Animations use CSS over JS for better performance
- Touch-friendly on all device sizes
- Supports reduced motion preferences
