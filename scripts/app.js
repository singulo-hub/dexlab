import { DataManager } from './dataManager.js';
import { UI } from './ui.js';
import { Analytics } from './analytics.js';

const dataManager = new DataManager();
const analytics = new Analytics();
const ui = new UI(dataManager, analytics);

// Initialize
async function init() {
    const loaded = await dataManager.loadData();
    if (!loaded) {
        alert('Failed to load Pokémon data.');
        return;
    }

    // Populate Filters
    populateFilters();

    // Check for saved data
    if (dataManager.loadFromStorage()) {
        ui.closeModal();
        ui.updateAll();
        ui.updateDexTitle();
    } else {
        ui.init(); // Shows template modal
    }

    // Initial Render of Source List
    filterAndRender();
}

// Filter State
const activeFilters = {
    types: [],
    gens: [],
    inDex: false
};

// Filter Logic
function populateFilters() {
    const typeSelect = document.getElementById('type-select');
    const genSelect = document.getElementById('gen-select');
    
    const types = new Set();
    const gens = new Set();

    dataManager.allPokemon.forEach(p => {
        p.types.forEach(t => types.add(t));
        gens.add(p.gen);
    });

    Array.from(types).sort().forEach(t => {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        typeSelect.appendChild(opt);
    });

    Array.from(gens).sort((a, b) => a - b).forEach(g => {
        const opt = document.createElement('option');
        opt.value = g;
        opt.textContent = `Gen ${g}`;
        genSelect.appendChild(opt);
    });
}

function addFilter(type, value, label) {
    if (type === 'type' && !activeFilters.types.includes(value)) {
        activeFilters.types.push(value);
        updateFilterDropdowns();
        renderFilterChips();
        filterAndRender();
    } else if (type === 'gen' && !activeFilters.gens.includes(value)) {
        activeFilters.gens.push(value);
        updateFilterDropdowns();
        renderFilterChips();
        filterAndRender();
    }
}

function removeFilter(type, value) {
    if (type === 'type') {
        activeFilters.types = activeFilters.types.filter(t => t !== value);
    } else if (type === 'gen') {
        activeFilters.gens = activeFilters.gens.filter(g => g !== value);
    } else if (type === 'inDex') {
        activeFilters.inDex = false;
        document.getElementById('in-dex-filter').checked = false;
    }
    updateFilterDropdowns();
    renderFilterChips();
    filterAndRender();
}

function updateFilterDropdowns() {
    const typeSelect = document.getElementById('type-select');
    const genSelect = document.getElementById('gen-select');
    
    // Hide/show type options based on active filters
    Array.from(typeSelect.options).forEach(opt => {
        if (opt.value === '') return; // Skip placeholder
        opt.hidden = activeFilters.types.includes(opt.value);
    });
    
    // Hide/show gen options based on active filters
    Array.from(genSelect.options).forEach(opt => {
        if (opt.value === '') return; // Skip placeholder
        opt.hidden = activeFilters.gens.includes(opt.value);
    });
}

function renderFilterChips() {
    const container = document.getElementById('filter-chips');
    container.innerHTML = '';
    
    // In Dex chip
    if (activeFilters.inDex) {
        const chip = document.createElement('span');
        chip.className = 'filter-chip';
        chip.innerHTML = `In Dex <span class="chip-remove" data-type="inDex" data-value="true"><i class="fas fa-times"></i></span>`;
        container.appendChild(chip);
    }
    
    activeFilters.types.forEach(type => {
        const chip = document.createElement('span');
        chip.className = 'filter-chip';
        chip.innerHTML = `${type} <span class="chip-remove" data-type="type" data-value="${type}"><i class="fas fa-times"></i></span>`;
        container.appendChild(chip);
    });
    
    activeFilters.gens.forEach(gen => {
        const chip = document.createElement('span');
        chip.className = 'filter-chip';
        chip.innerHTML = `Gen ${gen} <span class="chip-remove" data-type="gen" data-value="${gen}"><i class="fas fa-times"></i></span>`;
        container.appendChild(chip);
    });
}

function filterAndRender() {
    const searchVal = document.getElementById('search-input').value.toLowerCase();

    const filtered = dataManager.allPokemon.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchVal);
        // Must match ALL selected types (AND logic)
        const matchesTypes = activeFilters.types.length === 0 || 
            activeFilters.types.every(t => p.types.includes(t));
        // Must match ANY selected gen (OR logic for gens)
        const matchesGen = activeFilters.gens.length === 0 || 
            activeFilters.gens.includes(String(p.gen));
        // If inDex filter is active, only show Pokemon in current dex
        const matchesInDex = !activeFilters.inDex || 
            dataManager.customDex.some(d => d.id === p.id);
        return matchesSearch && matchesTypes && matchesGen && matchesInDex;
    });

    ui.renderPokemonList(filtered);
}

// Filter Event Listeners
const filterBtn = document.getElementById('filter-btn');
const filterDropdown = document.getElementById('filter-dropdown');

filterBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    filterDropdown.classList.toggle('open');
});

document.addEventListener('click', (e) => {
    if (!filterDropdown.contains(e.target) && e.target !== filterBtn) {
        filterDropdown.classList.remove('open');
    }
});

document.getElementById('type-select').addEventListener('change', (e) => {
    if (e.target.value) {
        addFilter('type', e.target.value);
        e.target.value = '';
    }
});

document.getElementById('gen-select').addEventListener('change', (e) => {
    if (e.target.value) {
        addFilter('gen', e.target.value);
        e.target.value = '';
    }
});

document.getElementById('in-dex-filter').addEventListener('change', (e) => {
    activeFilters.inDex = e.target.checked;
    renderFilterChips();
    filterAndRender();
});

document.getElementById('filter-chips').addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.chip-remove');
    if (removeBtn) {
        removeFilter(removeBtn.dataset.type, removeBtn.dataset.value);
    }
});

// Event Listeners
document.getElementById('search-input').addEventListener('input', filterAndRender);

document.addEventListener('filter-update', () => {
    filterAndRender();
});

document.getElementById('export-btn').addEventListener('click', () => {
    dataManager.exportJSON();
});

document.getElementById('import-btn').addEventListener('click', () => {
    document.getElementById('file-input').click();
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
