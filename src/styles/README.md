# Styles Architecture

This directory contains the global styling system following Angular Material 20 and Material Design 3 best practices.

## Structure

```
styles/
├── _index.scss              # Central export (use this in components)
├── _variables.scss          # Design tokens (spacing, colors, etc.)
├── _mixins.scss            # Reusable style patterns
└── components/             # Global component styles
    ├── _material-overrides.scss
    ├── _navbar.scss
    ├── _sidenav.scss
    ├── _cards.scss
    ├── _buttons.scss
    ├── _typography.scss
    └── _layouts.scss
```

## Usage

### In Global Styles (`styles.scss`)
All files are already imported. Don't import again.

### In Component Styles (feature directories)
If you need variables or mixins in a component:

```scss
@use '/src/styles/index' as *;

:host {
  padding: $spacing-lg;
  @include card-base;
}
```

## Philosophy

1. **Global First**: Most styling is handled globally via `/styles/components/`
2. **Minimal Component Styles**: Component-specific `.scss` files should be < 50 lines
3. **Angular Material Does Heavy Lifting**: Rely on Material components
4. **Design Tokens**: Use variables (`$spacing-lg`) not magic numbers (`16px`)
5. **Sass Modules**: Use `@use` not `@import` (deprecated)

## Design Tokens

### Spacing
- `$spacing-xs` (4px) → `$spacing-3xl` (48px)

### Border Radius  
- `$radius-sm` (4px) → `$radius-pill` (100px)

### Transitions
- `$transition-fast` (0.15s)
- `$transition-base` (0.2s)
- `$transition-slow` (0.3s)

### Breakpoints
- `$breakpoint-sm` (600px)
- `$breakpoint-md` (960px)
- `$breakpoint-lg` (1280px)

See `_variables.scss` for complete list.

## Common Mixins

- `@include card-base` - Base card styling
- `@include card-elevated` - Elevated card variant
- `@include glass-surface` - Glassmorphism effect
- `@include flex-center` - Center content
- `@include respond-to('md')` - Responsive breakpoints
- `@include custom-scrollbar` - Styled scrollbars

See `_mixins.scss` for complete list.

## When to Create Component Styles

Only create component-specific styles for:

1. **Layout adjustments** unique to that component
2. **Positioning** that doesn't apply globally
3. **Component-specific overrides** that can't be global

**Examples of what should stay global:**
- Card styles → `/styles/components/_cards.scss`
- Button variants → `/styles/components/_buttons.scss`
- Typography → `/styles/components/_typography.scss`
- Grid layouts → `/styles/components/_layouts.scss`

