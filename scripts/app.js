import { DataManager } from './dataManager.js';
import { UI } from './ui.js';
import { Analytics } from './analytics.js';
import { PokemonListManager } from './pokemonList.js';

const dataManager = new DataManager();
const analytics = new Analytics();
const ui = new UI(dataManager, analytics);
let pokemonListManager = null;

// Initialize
async function init() {
    const loaded = await dataManager.loadData();
    if (!loaded) {
        alert('Failed to load Pokémon data.');
        return;
    }

    // Initialize Pokemon List Manager
    pokemonListManager = new PokemonListManager(dataManager);
    pokemonListManager.setUpdateDashboardCallback(() => ui.updateDashboard());
    pokemonListManager.populateFilters();

    // Check for saved data
    if (dataManager.loadFromStorage()) {
        ui.closeModal();
        ui.updateDashboard();
        ui.updateDexTitle();
    } else {
        ui.init(); // Shows template modal
    }

    // Initial Render of Source List
    pokemonListManager.filterAndRender();
}

// Actions Dropdown
const actionsBtn = document.getElementById('actions-btn');
const actionsDropdown = document.getElementById('actions-dropdown');

actionsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    actionsDropdown.classList.toggle('open');
});

document.addEventListener('click', (e) => {
    if (!actionsDropdown.contains(e.target) && e.target !== actionsBtn) {
        actionsDropdown.classList.remove('open');
    }
});

// Close actions dropdown when any action button is clicked
actionsDropdown.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
        actionsDropdown.classList.remove('open');
    });
});

// Handle open-flyout event from PokemonListManager
document.addEventListener('open-flyout', () => {
    ui.openFlyout();
});

document.getElementById('export-btn').addEventListener('click', () => {
    dataManager.exportJSON();
});

document.getElementById('file-input').addEventListener('change', async (e) => {
    if (e.target.files.length > 0) {
        try {
            await dataManager.importJSON(e.target.files[0]);
            ui.closeModal();
            ui.updateAll();
            ui.updateDexTitle();
            e.target.value = ''; // Reset input
        } catch (err) {
            alert(err);
        }
    }
});

document.getElementById('new-dex-btn').addEventListener('click', () => {
    ui.showModal();
});

document.getElementById('print-grid-btn').addEventListener('click', () => {
    generatePrintGrid(dataManager.customDex);
});

// Theme toggle
const themeToggle = document.getElementById('theme-toggle');
const THEME_KEY = 'dexlab_theme';

function initTheme() {
    // Check for saved preference, default to dark
    const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
}

themeToggle.addEventListener('click', toggleTheme);
initTheme();

// Generate printable grid image
async function generatePrintGrid(dex) {
    if (!dex || dex.length === 0) {
        alert('No Pokémon in your dex to print!');
        return;
    }

    // Letter size at 300 DPI for print quality: 2550 x 3300 pixels (8.5" x 11")
    const pageWidth = 2550;
    const pageHeight = 3300;
    const margin = 75;
    const spacing = 10;
    
    // Calculate grid dimensions
    const usableWidth = pageWidth - (margin * 2);
    const usableHeight = pageHeight - (margin * 2);
    
    // Determine optimal sprite size and grid
    const totalPokemon = dex.length;
    
    // Try different column counts to find best fit
    let bestCols = 10;
    let bestSize = 0;
    
    for (let cols = 1; cols <= 15; cols++) {
        const rows = Math.ceil(totalPokemon / cols);
        const maxSpriteWidth = Math.floor((usableWidth - (spacing * (cols - 1))) / cols);
        const maxSpriteHeight = Math.floor((usableHeight - (spacing * (rows - 1))) / rows);
        const spriteSize = Math.min(maxSpriteWidth, maxSpriteHeight, 475); // Cap at 475px
        
        if (spriteSize >= bestSize && spriteSize >= 48) { // Minimum 48px
            bestSize = spriteSize;
            bestCols = cols;
        }
    }
    
    const spriteSize = bestSize;
    const cols = bestCols;
    const rows = Math.ceil(totalPokemon / cols);
    
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = pageWidth;
    canvas.height = pageHeight;
    const ctx = canvas.getContext('2d');
    
    // Enable high-quality image smoothing for better downscaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Fill background with white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, pageWidth, pageHeight);

    // Calculate starting position to center the grid
    const gridWidth = (cols * spriteSize) + ((cols - 1) * spacing);
    const gridHeight = (rows * spriteSize) + ((rows - 1) * spacing);
    const startX = margin + (usableWidth - gridWidth) / 2;
    const startY = margin + (usableHeight - gridHeight) / 2;
    
    // Load and draw all sprites
    const loadImage = (src) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = src;
        });
    };
    
    // Sort dex by ID for consistent ordering
    const sortedDex = [...dex].sort((a, b) => a.id - b.id);
    
    // Draw each Pokemon
    for (let i = 0; i < sortedDex.length; i++) {
        const pokemon = sortedDex[i];
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = startX + (col * (spriteSize + spacing));
        const y = startY + (row * (spriteSize + spacing));
        
        // Load and draw artwork (fall back to sprite if no artwork)
        const imageSrc = pokemon.artwork || pokemon.sprite;
        if (imageSrc) {
            const img = await loadImage(imageSrc);
            if (img) {
                // Scale image to fit cell while maintaining aspect ratio
                const scale = Math.min(spriteSize / img.width, spriteSize / img.height);
                const drawWidth = img.width * scale;
                const drawHeight = img.height * scale;
                // Center in cell
                const drawX = x + (spriteSize - drawWidth) / 2;
                const drawY = y + (spriteSize - drawHeight) / 2;
                ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
            }
        }
    }
    
    // Convert to image and download
    canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pokedex-grid.png';
        a.click();
        URL.revokeObjectURL(url);
    }, 'image/png');
}

// Start
init();
