# DexLab - Copilot Instructions

## Project Overview
DexLab is a client-side Pokédex builder web app. No build system or server required - open `index.html` directly in a browser. Data persists to localStorage.

## Architecture

### Manager Pattern
Core logic is organized into manager classes in `scripts/managers/`:
- **DataManager** - Pokemon data, dex state, localStorage persistence
- **PokemonListManager** - Flyout panel, filtering, search, list/grid rendering
- **ChartManager** - Chart.js charts (type, egg group, BST, capture rate distributions)
- **ModalManager** - Modal dialogs (new/load/edit dex, export options)

Entry point: `scripts/app.js` instantiates managers and wires up global event listeners.

### Event-Driven Communication
Components communicate via custom DOM events:
```javascript
// Dispatch from anywhere
document.dispatchEvent(new CustomEvent('chart-click', { detail: { type: 'Fire' } }));

// Listen in pokemonList.js
document.addEventListener('chart-click', (e) => { /* filter by e.detail */ });
```

Key events: `chart-click`, `filter-update`, `generate-grid`

### Data Flow
1. `DataManager.loadData()` fetches `data/all-pokemon.json` and `data/templates.json`
2. `customDex` array holds current dex (full Pokemon objects, not just IDs)
3. `Analytics.analyze(dex)` computes stats, distributions, alerts
4. `UI.updateDashboard()` pushes stats to DOM and `ChartManager`

## Key Conventions

### CSS Organization
Styles split by component in `styles/`:
- `main.css` - CSS variables, theme colors, base elements, icon toggles
- `dashboard.css` - Grid layout, stat cards, chart containers
- `flyout.css` - Pokemon list flyout, filters, range sliders
- `pokemon.css` - Pokemon items, type/egg badges, stat badges
- `modal.css` - Modal dialogs

Theme support via CSS variables: `--bg-color`, `--panel-bg`, `--text-color`, `--accent-color`, etc.

### Icons
Font Awesome icons are used throughout. Vendored in `libs/fontawesome/`.
```html
<i class="fas fa-edit"></i>     <!-- Solid icons -->
<i class="far fa-circle"></i>   <!-- Regular icons -->
```

### Toggle Buttons
Use `.icon-toggle` class with specific state classes:
- `.active` - Single-icon toggles (egg, stats visibility)
- `.grid-active` - View toggle (list/grid)
- `.boxplot-active` - Chart view toggles (histogram/boxplot)
- `.disabled` - Prevents interaction when filter forces visibility

### Chart Click → Filter Pattern
When implementing clickable charts:
1. Add `onClick` handler in chart options
2. Dispatch `chart-click` event with filter details
3. Add `onHover` handler for pointer cursor on clickable elements only

### Sprite Sheet
Pokemon sprites use a sprite sheet at `data/spritesheet.png`. Each sprite is 96x96px.
```javascript
// In rendering code
style="background-position: ${-p.spriteX * 96}px ${-p.spriteY * 96}px;"
```

### Filter State Management
Filters in `PokemonListManager.activeFilters`. When forcing toggles on:
1. Set visibility state and update toggle classes
2. Add `disabled` class to prevent user toggling while filter active
3. Remove `disabled` when filter is cleared

## File Reference
- `index.html` - All HTML structure, no templates
- `data/all-pokemon.json` - Pokemon data with spriteX/spriteY coords
- `data/templates.json` - Regional dex templates
- `libs/chart.js/` - Vendored Chart.js (no npm)
