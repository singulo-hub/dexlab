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
    } else {
        ui.init(); // Shows template modal
    }

    // Initial Render of Source List
    filterAndRender();
}

// Filter State
const activeFilters = {
    types: [],
    gens: []
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
        return matchesSearch && matchesTypes && matchesGen;
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
            ui.updateAll();
            e.target.value = ''; // Reset input
        } catch (err) {
            alert(err);
        }
    }
});

document.getElementById('reset-btn').addEventListener('click', () => {
    if (confirm('Are you sure you want to reset? This will clear your current custom dex.')) {
        dataManager.reset();
        ui.init();
        ui.showModal();
        ui.updateAll();
    }
});

// Start
init();
