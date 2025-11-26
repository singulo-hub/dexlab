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

// Filter Logic
function populateFilters() {
    const typeFilter = document.getElementById('type-filter');
    const genFilter = document.getElementById('gen-filter');
    
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
        typeFilter.appendChild(opt);
    });

    Array.from(gens).sort((a, b) => a - b).forEach(g => {
        const opt = document.createElement('option');
        opt.value = g;
        opt.textContent = `Gen ${g}`;
        genFilter.appendChild(opt);
    });
}

function filterAndRender() {
    const searchVal = document.getElementById('search-input').value.toLowerCase();
    const typeVal = document.getElementById('type-filter').value;
    const genVal = document.getElementById('gen-filter').value;

    const filtered = dataManager.allPokemon.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchVal);
        const matchesType = typeVal === '' || p.types.includes(typeVal);
        const matchesGen = genVal === '' || p.gen === parseInt(genVal);
        return matchesSearch && matchesType && matchesGen;
    });

    ui.renderSourceList(filtered);
}

// Event Listeners
document.getElementById('search-input').addEventListener('input', filterAndRender);
document.getElementById('type-filter').addEventListener('change', filterAndRender);
document.getElementById('gen-filter').addEventListener('change', filterAndRender);

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
