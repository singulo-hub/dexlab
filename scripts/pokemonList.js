/**
 * PokemonListManager - Handles Pokemon list rendering, searching, and filtering
 */

export class PokemonListManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.renderCallback = null;
        
        // Filter State
        this.activeFilters = {
            types: [],
            gens: [],
            evos: [],
            inDex: false
        };
        
        // DOM Elements
        this.searchInput = document.getElementById('search-input');
        this.typeSelect = document.getElementById('type-select');
        this.genSelect = document.getElementById('gen-select');
        this.evoSelect = document.getElementById('evo-select');
        this.inDexFilter = document.getElementById('in-dex-filter');
        this.filterChipsContainer = document.getElementById('filter-chips');
        this.filterBtn = document.getElementById('filter-btn');
        this.filterDropdown = document.getElementById('filter-dropdown');
        
        this.setupEventListeners();
    }

    /**
     * Set the callback function to render the filtered list
     */
    setRenderCallback(callback) {
        this.renderCallback = callback;
    }

    /**
     * Populate filter dropdowns with available options
     */
    populateFilters() {
        const types = new Set();
        const gens = new Set();

        this.dataManager.allPokemon.forEach(p => {
            p.types.forEach(t => types.add(t));
            gens.add(p.gen);
        });

        Array.from(types).sort().forEach(t => {
            const opt = document.createElement('option');
            opt.value = t;
            opt.textContent = t;
            this.typeSelect.appendChild(opt);
        });

        Array.from(gens).sort((a, b) => a - b).forEach(g => {
            const opt = document.createElement('option');
            opt.value = g;
            opt.textContent = `Gen ${g}`;
            this.genSelect.appendChild(opt);
        });
    }

    /**
     * Add a filter
     */
    addFilter(type, value) {
        if (type === 'type' && !this.activeFilters.types.includes(value)) {
            this.activeFilters.types.push(value);
        } else if (type === 'gen' && !this.activeFilters.gens.includes(value)) {
            this.activeFilters.gens.push(value);
        } else if (type === 'evo' && !this.activeFilters.evos.includes(value)) {
            this.activeFilters.evos.push(value);
        } else {
            return; // No change needed
        }
        
        this.updateFilterDropdowns();
        this.renderFilterChips();
        this.filterAndRender();
    }

    /**
     * Remove a filter
     */
    removeFilter(type, value) {
        if (type === 'type') {
            this.activeFilters.types = this.activeFilters.types.filter(t => t !== value);
        } else if (type === 'gen') {
            this.activeFilters.gens = this.activeFilters.gens.filter(g => g !== value);
        } else if (type === 'evo') {
            this.activeFilters.evos = this.activeFilters.evos.filter(e => e !== value);
        } else if (type === 'inDex') {
            this.activeFilters.inDex = false;
            this.inDexFilter.checked = false;
        }
        
        this.updateFilterDropdowns();
        this.renderFilterChips();
        this.filterAndRender();
    }

    /**
     * Set filters programmatically (used by chart click)
     */
    setFilters(filters) {
        if (filters.types !== undefined) {
            this.activeFilters.types = filters.types;
        }
        if (filters.gens !== undefined) {
            this.activeFilters.gens = filters.gens;
        }
        if (filters.evos !== undefined) {
            this.activeFilters.evos = filters.evos;
        }
        if (filters.inDex !== undefined) {
            this.activeFilters.inDex = filters.inDex;
            this.inDexFilter.checked = filters.inDex;
        }
        
        this.updateFilterDropdowns();
        this.renderFilterChips();
        this.filterAndRender();
    }

    /**
     * Update dropdown options visibility based on active filters
     */
    updateFilterDropdowns() {
        // Hide/show type options based on active filters
        Array.from(this.typeSelect.options).forEach(opt => {
            if (opt.value === '') return; // Skip placeholder
            opt.hidden = this.activeFilters.types.includes(opt.value);
        });
        
        // Hide/show gen options based on active filters
        Array.from(this.genSelect.options).forEach(opt => {
            if (opt.value === '') return; // Skip placeholder
            opt.hidden = this.activeFilters.gens.includes(opt.value);
        });
        
        // Hide/show evo options based on active filters
        Array.from(this.evoSelect.options).forEach(opt => {
            if (opt.value === '') return; // Skip placeholder
            opt.hidden = this.activeFilters.evos.includes(opt.value);
        });
    }

    /**
     * Render filter chips showing active filters
     */
    renderFilterChips() {
        this.filterChipsContainer.innerHTML = '';
        
        // In Dex chip
        if (this.activeFilters.inDex) {
            const chip = document.createElement('span');
            chip.className = 'filter-chip';
            chip.innerHTML = `In Dex <span class="chip-remove" data-type="inDex" data-value="true"><i class="fas fa-times"></i></span>`;
            this.filterChipsContainer.appendChild(chip);
        }
        
        this.activeFilters.types.forEach(type => {
            const chip = document.createElement('span');
            chip.className = 'filter-chip';
            chip.innerHTML = `${type} <span class="chip-remove" data-type="type" data-value="${type}"><i class="fas fa-times"></i></span>`;
            this.filterChipsContainer.appendChild(chip);
        });
        
        this.activeFilters.gens.forEach(gen => {
            const chip = document.createElement('span');
            chip.className = 'filter-chip';
            chip.innerHTML = `Gen ${gen} <span class="chip-remove" data-type="gen" data-value="${gen}"><i class="fas fa-times"></i></span>`;
            this.filterChipsContainer.appendChild(chip);
        });
        
        this.activeFilters.evos.forEach(evo => {
            const chip = document.createElement('span');
            chip.className = 'filter-chip';
            chip.innerHTML = `${evo}-Stage <span class="chip-remove" data-type="evo" data-value="${evo}"><i class="fas fa-times"></i></span>`;
            this.filterChipsContainer.appendChild(chip);
        });
    }

    /**
     * Filter the Pokemon list and trigger render
     */
    filterAndRender() {
        const searchVal = this.searchInput.value.toLowerCase();

        const filtered = this.dataManager.allPokemon.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchVal);
            // Must match ALL selected types (AND logic)
            const matchesTypes = this.activeFilters.types.length === 0 || 
                this.activeFilters.types.every(t => p.types.includes(t));
            // Must match ANY selected gen (OR logic for gens)
            const matchesGen = this.activeFilters.gens.length === 0 || 
                this.activeFilters.gens.includes(String(p.gen));
            // Must match ANY selected evolution stage (OR logic)
            const matchesEvo = this.activeFilters.evos.length === 0 || 
                this.activeFilters.evos.includes(String(p.evolutionDepth));
            // If inDex filter is active, only show Pokemon in current dex
            const matchesInDex = !this.activeFilters.inDex || 
                this.dataManager.customDex.some(d => d.id === p.id);
            return matchesSearch && matchesTypes && matchesGen && matchesEvo && matchesInDex;
        });

        if (this.renderCallback) {
            this.renderCallback(filtered);
        }
    }

    /**
     * Set up all event listeners for filtering
     */
    setupEventListeners() {
        // Filter dropdown toggle
        this.filterBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.filterDropdown.classList.toggle('open');
        });

        document.addEventListener('click', (e) => {
            if (!this.filterDropdown.contains(e.target) && e.target !== this.filterBtn) {
                this.filterDropdown.classList.remove('open');
            }
        });

        // Type select
        this.typeSelect.addEventListener('change', (e) => {
            if (e.target.value) {
                this.addFilter('type', e.target.value);
                e.target.value = '';
            }
        });

        // Gen select
        this.genSelect.addEventListener('change', (e) => {
            if (e.target.value) {
                this.addFilter('gen', e.target.value);
                e.target.value = '';
            }
        });

        // Evo select
        this.evoSelect.addEventListener('change', (e) => {
            if (e.target.value) {
                this.addFilter('evo', e.target.value);
                e.target.value = '';
            }
        });

        // In Dex checkbox
        this.inDexFilter.addEventListener('change', (e) => {
            this.activeFilters.inDex = e.target.checked;
            this.renderFilterChips();
            this.filterAndRender();
        });

        // Filter chips remove buttons
        this.filterChipsContainer.addEventListener('click', (e) => {
            const removeBtn = e.target.closest('.chip-remove');
            if (removeBtn) {
                this.removeFilter(removeBtn.dataset.type, removeBtn.dataset.value);
            }
        });

        // Search input
        this.searchInput.addEventListener('input', () => this.filterAndRender());

        // Listen for external filter updates
        document.addEventListener('filter-update', () => {
            this.filterAndRender();
        });

        // Handle type chart click - filter by type and "In Dex"
        document.addEventListener('chart-type-click', (e) => {
            const typeName = e.detail.type;
            
            // Set filters and trigger render
            this.setFilters({
                types: [typeName],
                inDex: true
            });
            
            // Dispatch event to open flyout (handled in app.js or ui.js)
            document.dispatchEvent(new CustomEvent('open-flyout'));
        });
    }
}
