import { DataManager } from './managers/dataManager.js';
import { UI } from './ui.js';
import { Analytics } from './analytics.js';
import { PokemonListManager } from './managers/pokemonList.js';

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

document.getElementById('export-btn').addEventListener('click', () => {
    ui.showExportModal();
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

// Listen for grid generation event from export modal
document.addEventListener('generate-grid', (e) => {
    const { imageStyle, showNames } = e.detail;
    generatePrintGrid(dataManager.customDex, { imageStyle, showNames });
});

// Theme toggle
const themeToggle = document.getElementById('theme-toggle');
const THEME_KEY = 'dexlab_theme';

function initTheme() {
    // Check for saved preference, default to dark
    const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
    // Set toggle active state based on theme (light = active)
    if (themeToggle) {
        if (savedTheme === 'light') {
            themeToggle.classList.add('active');
        } else {
            themeToggle.classList.remove('active');
        }
    }
}

function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
    // Toggle active class (light = active)
    if (themeToggle) {
        if (newTheme === 'light') {
            themeToggle.classList.add('active');
        } else {
            themeToggle.classList.remove('active');
        }
    }
}

if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
}
initTheme();

// Toast notification helpers
const toast = document.getElementById('toast');
const toastIcon = document.getElementById('toast-icon');
const toastMessage = document.getElementById('toast-message');

function showToast(message, icon = 'fa-spinner fa-spin') {
    toastIcon.className = `fas ${icon}`;
    toastMessage.textContent = message;
    toast.classList.remove('hidden', 'hiding');
}

function updateToast(message, icon = 'fa-check') {
    toastIcon.className = `fas ${icon}`;
    toastMessage.textContent = message;
}

function hideToast(delay = 0) {
    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => {
            toast.classList.add('hidden');
            toast.classList.remove('hiding');
        }, 300);
    }, delay);
}

// Generate printable grid image
async function generatePrintGrid(dex, options = {}) {
    const { imageStyle = 'artwork', showNames = false } = options;
    
    if (!dex || dex.length === 0) {
        alert('No Pokémon in your dex to print!');
        return;
    }

    // Show generating toast
    showToast('Generating Pokémon grid image...', 'fa-spinner fa-spin');

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
    
    // Reserve space for names if enabled
    const nameHeight = showNames ? 40 : 0;
    
    // Try different column counts to find best fit
    let bestCols = 10;
    let bestSize = 0;
    
    for (let cols = 1; cols <= 15; cols++) {
        const rows = Math.ceil(totalPokemon / cols);
        const maxSpriteWidth = Math.floor((usableWidth - (spacing * (cols - 1))) / cols);
        const maxCellHeight = Math.floor((usableHeight - (spacing * (rows - 1))) / rows);
        const maxSpriteHeight = maxCellHeight - nameHeight;
        const spriteSize = Math.min(maxSpriteWidth, maxSpriteHeight, 475); // Cap at 475px
        
        if (spriteSize >= bestSize && spriteSize >= 48) { // Minimum 48px
            bestSize = spriteSize;
            bestCols = cols;
        }
    }
    
    const spriteSize = bestSize;
    const cols = bestCols;
    const rows = Math.ceil(totalPokemon / cols);
    const cellHeight = spriteSize + nameHeight;
    
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
    const gridHeight = (rows * cellHeight) + ((rows - 1) * spacing);
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
    
    // Load sprite sheet for sprite mode
    let spriteSheet = null;
    if (imageStyle === 'sprite') {
        spriteSheet = await loadImage('data/spritesheet.png');
    }
    
    // Sort dex by ID for consistent ordering
    const sortedDex = [...dex].sort((a, b) => a.id - b.id);
    
    // Setup font for names
    if (showNames) {
        ctx.font = 'bold 24px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#333333';
    }
    
    // Draw each Pokemon
    for (let i = 0; i < sortedDex.length; i++) {
        const pokemon = sortedDex[i];
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = startX + (col * (spriteSize + spacing));
        const y = startY + (row * (cellHeight + spacing));
        
        // Choose image source based on style preference
        if (imageStyle === 'sprite' && spriteSheet && pokemon.spriteX !== undefined && pokemon.spriteY !== undefined) {
            // Draw from sprite sheet
            const srcX = pokemon.spriteX * 96;
            const srcY = pokemon.spriteY * 96;
            const srcSize = 96;
            
            // Center in cell
            const drawX = x + (spriteSize - spriteSize) / 2;
            const drawY = y + (spriteSize - spriteSize) / 2;
            
            // Disable smoothing for pixel art
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(spriteSheet, srcX, srcY, srcSize, srcSize, x, y, spriteSize, spriteSize);
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
        } else {
            // Use artwork
            const imageSrc = pokemon.artwork;
            
            if (imageSrc) {
                const img = await loadImage(imageSrc);
                if (img) {
                    // Scale image to fit cell while maintaining aspect ratio
                    const scale = Math.min(spriteSize / img.width, spriteSize / img.height);
                    const drawWidth = img.width * scale;
                    const drawHeight = img.height * scale;
                    // Center in cell (sprite area only)
                    const drawX = x + (spriteSize - drawWidth) / 2;
                    const drawY = y + (spriteSize - drawHeight) / 2;
                    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
                }
            }
        }
        
        // Draw name if enabled
        if (showNames) {
            ctx.fillStyle = '#333333';
            const nameY = y + spriteSize + 28; // Position below sprite
            const nameX = x + spriteSize / 2; // Center horizontally
            ctx.fillText(pokemon.name, nameX, nameY);
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
        
        // Update toast to show success
        updateToast('Image created!', 'fa-check');
        hideToast(2000);
    }, 'image/png');
}

// Start
init();
