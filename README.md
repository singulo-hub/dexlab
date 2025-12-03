# DexLab

A client-side Pokédex builder web app. Create custom regional dexes, analyze type distributions, and export your creations—all without a server or build system.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## Features

- **Custom Dex Builder** - Create and manage custom Pokédex collections
- **Analytics Dashboard** - Visualize type distributions, egg groups, BST spreads, and capture rates
- **Interactive Charts** - Click charts to filter Pokémon by type, egg group, or stat ranges
- **Template Support** - Start from official regional dex templates
- **Export Options** - Export as PNG grid (artwork or sprites) or JSON data
- **Offline Ready** - Works entirely in-browser with localStorage persistence
- **Theme Support** - Light and dark themes via CSS variables

## Quick Start

1. Clone or download this repository
2. Open `index.html` in your browser
3. Click "New Dex" to create your first custom dex

No build tools, npm install, or server required.

## Usage

### Creating a Dex

1. Click **New Dex** in the header
2. Enter a name and optionally select a regional template
3. Use the flyout panel to search and add Pokémon
4. Your dex auto-saves to localStorage

### Filtering Pokémon

- **Search** - Filter by name or dex number
- **Type/Egg Group** - Click chart segments to filter
- **BST/Capture Rate** - Use range sliders for stat filtering
- **Toggles** - Show/hide egg groups and stats on Pokémon cards

### Exporting

- **Grid Export** - PNG image with artwork or sprite sheet styles
- **JSON Export** - Raw data for external tools

## Project Structure

```
dexlab/
├── index.html          # Main HTML (no templates)
├── data/
│   ├── all-pokemon.json    # Pokémon data with sprite coordinates
│   ├── templates.json      # Regional dex templates
│   └── spritesheet.png     # Sprite sheet (96x96 per sprite)
├── scripts/
│   ├── app.js              # Entry point, global events
│   ├── dataManager.js      # Data loading, localStorage
│   ├── analytics.js        # Stats computation
│   └── ui.js               # DOM updates
├── styles/
│   ├── main.css            # Variables, theme, base styles
│   ├── dashboard.css       # Grid layout, charts
│   ├── flyout.css          # Pokemon list panel
│   ├── pokemon.css         # Pokemon cards, badges
│   └── modal.css           # Dialog styling
└── libs/
    ├── chart.js/           # Vendored Chart.js
    └── fontawesome/        # Vendored Font Awesome icons
```

## Tech Stack

- **Vanilla JS** - No framework dependencies
- **CSS Grid & Flexbox** - Responsive layouts
- **Chart.js** - Data visualization
- **Font Awesome** - Icons
- **localStorage** - Client-side persistence

## Browser Support

Modern browsers with ES6+ support (Chrome, Firefox, Safari, Edge).

## Contributing

Submit an issue if you are having problems with the app and I will take a look, thanks!

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- Pokémon data and sprites are property of Nintendo/Game Freak/The Pokémon Company
- This is a fan project for personal use
