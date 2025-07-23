# Crystal Theme Design System

This document outlines the Crystal theme design system used throughout the Archon application. The theme provides a consistent, modern, and accessible user interface with a crystalline aesthetic.

## Color Palette

### Primary Colors
- **Electric Blue** (`--crystal-electric`): Primary accent color for buttons, links, and highlights
- **Surface** (`--crystal-surface`): Background color for cards and elevated elements
- **Background** (`--crystal-background`): Main background color

### Text Colors
- **Primary Text** (`--crystal-text-primary`): Main text color
- **Secondary Text** (`--crystal-text-secondary`): Muted text for descriptions and labels

### Status Colors
- **Success** (`--crystal-ok`): Green for success states
- **Warning** (`--crystal-high`): Orange/yellow for warnings
- **Critical** (`--crystal-critical`): Red for errors and critical states
- **Danger** (`--crystal-danger`): Alternative red for dangerous actions

### Utility Colors
- **Border** (`--crystal-border`): Default border color
- **Muted** (`--crystal-muted`): Very subtle background color

## Typography

### Font Families
- **Primary**: Inter (system fallback: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto)
- **Monospace**: "Fira Code", Consolas, "Courier New", monospace

### Font Weights
- **Normal**: 400
- **Medium**: 500
- **Semibold**: 600
- **Bold**: 700

## Component Classes

### Buttons

#### Primary Button
```css
.crystal-btn-primary
```
- Electric blue background with hover effects
- White text
- Subtle glow on hover
- Slight lift animation

#### Secondary Button
```css
.crystal-btn-secondary
```
- Surface background with border
- Primary text color
- Hover state with border highlight

#### Danger Button
```css
.crystal-btn-danger
```
- Critical red background
- White text
- Hover effects similar to primary

### Cards

#### Standard Card
```css
.crystal-card
```
- Semi-transparent surface background
- Backdrop blur effect
- Subtle border
- Hover animation with lift and glow

#### Glass Effect
```css
.crystal-glass
```
- Enhanced transparency
- Stronger backdrop blur
- Minimal border

### Text Utilities

#### Text Colors
- `.crystal-text-primary` - Primary text color
- `.crystal-text-secondary` - Secondary text color
- `.crystal-text-electric` - Electric blue text
- `.crystal-text-critical` - Critical red text
- `.crystal-text-warning` - Warning orange text
- `.crystal-text-success` - Success green text

#### Background Colors
- `.crystal-bg-electric` - Electric blue background
- `.crystal-bg-critical` - Critical red background
- `.crystal-bg-warning` - Warning orange background
- `.crystal-bg-success` - Success green background

#### Border Colors
- `.crystal-border-electric` - Electric blue border
- `.crystal-border-critical` - Critical red border
- `.crystal-border-warning` - Warning orange border
- `.crystal-border-success` - Success green border

### Badges

#### Status Badges
- `.crystal-badge-electric` - Electric blue badge
- `.crystal-badge-success` - Success green badge
- `.crystal-badge-warning` - Warning orange badge
- `.crystal-badge-critical` - Critical red badge

### Form Elements

#### Input Fields
```css
.crystal-input
```
- Surface background
- Border with focus states
- Electric blue focus ring
- Placeholder text styling

### Interactive Elements

#### Upload Zone
```css
.crystal-upload-zone
```
- Dashed border
- Hover and drag-over states
- Smooth transitions

#### Progress Bar
```css
.crystal-progress
.crystal-progress-bar
```
- Surface background container
- Electric blue gradient fill
- Smooth width transitions

#### Tabs
```css
.crystal-tabs
.crystal-tab
```
- Surface background container
- Active state with electric blue
- Smooth transitions

### Loading States

#### Spinner
```css
.crystal-spinner
```
- Rotating border animation
- Electric blue accent

#### Loading Animation
```css
.crystal-loading
```
- Pulsing opacity animation

### Responsive Design

#### Mobile Utilities
- `.crystal-mobile-stack` - Stack elements vertically on mobile
- `.crystal-mobile-full` - Full width on mobile
- `.crystal-mobile-text-sm` - Smaller text on mobile

## Usage Guidelines

### Color Usage
1. **Electric Blue**: Use for primary actions, active states, and key highlights
2. **Success Green**: Use for completed actions, success messages, and positive indicators
3. **Warning Orange**: Use for cautions, non-critical warnings, and attention-needed states
4. **Critical Red**: Use for errors, destructive actions, and critical warnings

### Spacing
- Use consistent spacing scale: 0.25rem, 0.5rem, 1rem, 1.5rem, 2rem, 3rem, 4rem
- Maintain consistent padding and margins across components
- Use space-y-* and space-x-* utilities for consistent spacing

### Animations
- Keep animations subtle and purposeful
- Use consistent timing: 0.2s for quick interactions, 0.3s for state changes
- Prefer ease-out timing for natural feel
- Use transform animations for performance

### Accessibility
- Maintain sufficient color contrast (WCAG AA compliance)
- Ensure focus states are clearly visible
- Use semantic HTML elements
- Provide alternative text for icons and images

## Component Examples

### File Upload Zone
```tsx
<div className="crystal-upload-zone">
  <div className="crystal-text-primary">Upload files here</div>
  <Button className="crystal-btn-secondary">Choose Files</Button>
</div>
```

### Status Card
```tsx
<Card className="crystal-card">
  <CardContent>
    <Badge className="crystal-badge-success">Success</Badge>
    <h3 className="crystal-text-primary">Upload Complete</h3>
    <p className="crystal-text-secondary">Files processed successfully</p>
  </CardContent>
</Card>
```

### Progress Indicator
```tsx
<div className="crystal-progress">
  <div 
    className="crystal-progress-bar" 
    style={{ width: '75%' }}
  />
</div>
```

## Dark Mode Support

The Crystal theme is designed with dark mode as the primary interface. All colors and components are optimized for dark backgrounds with light text and electric blue accents.

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Fallbacks are provided for older browsers, though some visual effects may be reduced.

## Performance Considerations

- CSS custom properties enable efficient theme switching
- Backdrop filters are used judiciously for performance
- Animations use transform and opacity for GPU acceleration
- Critical CSS is inlined for faster initial render
