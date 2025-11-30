/**
 * PokemonListManager - Handles Pokemon list rendering, searching, and filtering
 */

export class PokemonListManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.updateDashboardCallback = null;
        
        // Filter State
        this.activeFilters = {
            types: [],
            gens: [],
            evos: [],
            eggGroups: [],
            bstMin: 180,
            bstMax: 780,
            inDex: false
        };
        
        // DOM Elements
        this.pokemonListEl = document.getElementById('pokemon-list');
        this.searchInput = document.getElementById('search-input');
        this.typeSelect = document.getElementById('type-select');
        this.genSelect = document.getElementById('gen-select');
        this.evoSelect = document.getElementById('evo-select');
        this.eggSelect = document.getElementById('egg-select');
        this.bstMinSlider = document.getElementById('bst-min');
        this.bstMaxSlider = document.getElementById('bst-max');
        this.bstMinVal = document.getElementById('bst-min-val');
        this.bstMaxVal = document.getElementById('bst-max-val');
        this.bstRangeSelected = document.getElementById('bst-range-selected');
        this.bstRangeLeft = document.getElementById('bst-range-left');
        this.bstRangeRight = document.getElementById('bst-range-right');
        this.inDexFilter = document.getElementById('in-dex-filter');
        this.filterChipsContainer = document.getElementById('filter-chips');
        this.filterBtn = document.getElementById('filter-btn');
        this.filterDropdown = document.getElementById('filter-dropdown');
        this.viewToggle = document.getElementById('view-toggle');
        
        // Flyout Panel Elements
        this.flyoutPanel = document.getElementById('pokemon-flyout');
        this.flyoutOverlay = document.getElementById('flyout-overlay');
        this.addPokemonBtn = document.getElementById('add-pokemon-btn');
        this.closeFlyoutBtn = document.getElementById('close-flyout-btn');
        
        // View state
        this.isGridView = false;
        
        // Drag selection state for list view
        this.isDragging = false;
        this.dragAction = null; // 'add' or 'remove' - determined by first item's state
        this.draggedIds = new Set(); // Track which IDs have been toggled this drag
        
        this.setupEventListeners();
    }

    /**
     * Set the callback function to update dashboard after changes
     */
    setUpdateDashboardCallback(callback) {
        this.updateDashboardCallback = callback;
    }

    /**
     * Populate filter dropdowns with available options
     */
    populateFilters() {
        const types = new Set();
        const gens = new Set();
        const eggGroups = new Set();

        this.dataManager.allPokemon.forEach(p => {
            p.types.forEach(t => types.add(t));
            gens.add(p.gen);
            if (p.eggGroups) {
                p.eggGroups.forEach(eg => eggGroups.add(eg));
            }
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

        Array.from(eggGroups).sort().forEach(eg => {
            const opt = document.createElement('option');
            opt.value = eg;
            opt.textContent = eg;
            this.eggSelect.appendChild(opt);
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
        } else if (type === 'egg' && !this.activeFilters.eggGroups.includes(value)) {
            this.activeFilters.eggGroups.push(value);
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
        } else if (type === 'egg') {
            this.activeFilters.eggGroups = this.activeFilters.eggGroups.filter(eg => eg !== value);
        } else if (type === 'bst') {
            // Reset BST to full range
            this.activeFilters.bstMin = 180;
            this.activeFilters.bstMax = 780;
            this.bstMinSlider.value = 180;
            this.bstMaxSlider.value = 780;
            this.bstMinVal.textContent = 180;
            this.bstMaxVal.textContent = 780;
            this.updateBstRangeTrack();
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
        if (filters.eggGroups !== undefined) {
            this.activeFilters.eggGroups = filters.eggGroups;
        }
        if (filters.bstMin !== undefined) {
            this.activeFilters.bstMin = filters.bstMin;
            this.bstMinSlider.value = filters.bstMin;
            this.bstMinVal.textContent = filters.bstMin;
        }
        if (filters.bstMax !== undefined) {
            this.activeFilters.bstMax = filters.bstMax;
            this.bstMaxSlider.value = filters.bstMax;
            this.bstMaxVal.textContent = filters.bstMax;
        }
        if (filters.inDex !== undefined) {
            this.activeFilters.inDex = filters.inDex;
            this.inDexFilter.checked = filters.inDex;
        }
        
        this.updateFilterDropdowns();
        this.updateBstRangeTrack();
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
        
        // Hide/show egg group options based on active filters
        Array.from(this.eggSelect.options).forEach(opt => {
            if (opt.value === '') return; // Skip placeholder
            opt.hidden = this.activeFilters.eggGroups.includes(opt.value);
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
            chip.dataset.type = 'inDex';
            chip.dataset.value = 'true';
            chip.innerHTML = `In Dex <i class="fas fa-times"></i>`;
            this.filterChipsContainer.appendChild(chip);
        }
        
        this.activeFilters.types.forEach(type => {
            const chip = document.createElement('span');
            chip.className = 'filter-chip';
            chip.dataset.type = 'type';
            chip.dataset.value = type;
            chip.innerHTML = `${type} <i class="fas fa-times"></i>`;
            this.filterChipsContainer.appendChild(chip);
        });
        
        this.activeFilters.gens.forEach(gen => {
            const chip = document.createElement('span');
            chip.className = 'filter-chip';
            chip.dataset.type = 'gen';
            chip.dataset.value = gen;
            chip.innerHTML = `Gen ${gen} <i class="fas fa-times"></i>`;
            this.filterChipsContainer.appendChild(chip);
        });
        
        this.activeFilters.evos.forEach(evo => {
            const chip = document.createElement('span');
            chip.className = 'filter-chip';
            chip.dataset.type = 'evo';
            chip.dataset.value = evo;
            chip.innerHTML = `${evo}-Stage <i class="fas fa-times"></i>`;
            this.filterChipsContainer.appendChild(chip);
        });
        
        this.activeFilters.eggGroups.forEach(egg => {
            const chip = document.createElement('span');
            chip.className = 'filter-chip';
            chip.dataset.type = 'egg';
            chip.dataset.value = egg;
            chip.innerHTML = `${egg} <i class="fas fa-times"></i>`;
            this.filterChipsContainer.appendChild(chip);
        });
        
        // BST range chip (only show if not at default full range)
        const bstMin = this.activeFilters.bstMin;
        const bstMax = this.activeFilters.bstMax;
        const isInverted = bstMin > bstMax;
        if (bstMin > 180 || bstMax < 780 || isInverted) {
            const chip = document.createElement('span');
            chip.className = 'filter-chip';
            chip.dataset.type = 'bst';
            chip.dataset.value = 'range';
            if (isInverted) {
                chip.innerHTML = `BST ≤${bstMax} or ≥${bstMin} <i class="fas fa-times"></i>`;
            } else if (bstMin === bstMax) {
                chip.innerHTML = `BST ${bstMin} <i class="fas fa-times"></i>`;
            } else {
                chip.innerHTML = `BST ${bstMin}-${bstMax} <i class="fas fa-times"></i>`;
            }
            this.filterChipsContainer.appendChild(chip);
        }
    }

    /**
     * Filter the Pokemon list and render
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
            // Must match ALL selected egg groups (AND logic)
            const matchesEgg = this.activeFilters.eggGroups.length === 0 || 
                this.activeFilters.eggGroups.every(eg => p.eggGroups && p.eggGroups.includes(eg));
            // BST range filter - inverted when min > max (excludes middle range)
            const bstMin = this.activeFilters.bstMin;
            const bstMax = this.activeFilters.bstMax;
            const matchesBst = bstMin <= bstMax 
                ? (p.bst >= bstMin && p.bst <= bstMax)  // Normal: inside range
                : (p.bst <= bstMax || p.bst >= bstMin); // Inverted: outside range
            // If inDex filter is active, only show Pokemon in current dex
            const matchesInDex = !this.activeFilters.inDex || 
                this.dataManager.customDex.some(d => d.id === p.id);
            return matchesSearch && matchesTypes && matchesGen && matchesEvo && matchesEgg && matchesBst && matchesInDex;
        });

        this.renderPokemonList(filtered);
    }

    /**
     * Render the Pokemon list
     */
    renderPokemonList(pokemonList) {
        this.pokemonListEl.innerHTML = '';
        pokemonList.forEach(p => {
            const isAdded = this.dataManager.customDex.some(d => d.id === p.id);
            const item = document.createElement('div');
            
            if (this.isGridView) {
                item.className = `pokemon-card ${isAdded ? 'added' : ''}`;
                item.innerHTML = `
                    <div class="card-img-container">
                        <div class="pokemon-sprite" style="background-position: ${-p.spriteX * 96}px ${-p.spriteY * 96}px;"></div>
                    </div>
                    <div class="card-info">
                        <span class="pokemon-id">#${p.id}</span>
                        <span class="pokemon-name">${p.name}</span>
                        <div class="pokemon-types">
                            ${p.types.map(t => `<span class="type-badge type-${t.toLowerCase()}">${t}</span>`).join('')}
                        </div>
                        <div class="egg-groups margin-top-5">
                            ${p.eggGroups.map(eg => `<span class="egg-badge egg-${this.getEggGroupClass(eg).toLowerCase()}">${eg}</span>`).join('')}
                        </div>
                    </div>
                `;
                
                // Grid view: simple click toggle
                item.addEventListener('click', () => {
                    if (isAdded) {
                        this.dataManager.removeFromDex(p.id);
                    } else {
                        this.dataManager.addToDex(p.id);
                    }
                    this.onPokemonToggled();
                });
            } else {
                item.className = `pokemon-item ${isAdded ? 'added' : ''}`;
                item.innerHTML = `
                    <div class="pokemon-info">
                        <span class="pokemon-id">#${p.id}</span>
                        <span class="pokemon-name">${p.name}</span>
                        <div class="pokemon-types">
                            ${p.types.map(t => `<span class="type-badge type-${t.toLowerCase()}">${t}</span>`).join('')}
                        </div>
                        <div class="egg-groups">
                            ${p.eggGroups.map(eg => `<span class="egg-badge egg-${this.getEggGroupClass(eg).toLowerCase()}">${eg}</span>`).join('')}
                        </div>
                    </div>
                `;
                
                // List view: drag selection support
                item.addEventListener('mousedown', (e) => {
                    e.preventDefault(); // Prevent text selection
                    this.isDragging = true;
                    this.draggedIds.clear();
                    
                    // Determine action based on first item's current state
                    const currentlyAdded = this.dataManager.customDex.some(d => d.id === p.id);
                    this.dragAction = currentlyAdded ? 'remove' : 'add';
                    
                    // Toggle this first item
                    this.togglePokemonDrag(p.id);
                });
                
                item.addEventListener('mouseenter', () => {
                    if (this.isDragging && !this.draggedIds.has(p.id)) {
                        this.togglePokemonDrag(p.id);
                    }
                });
            }
            
            this.pokemonListEl.appendChild(item);
        });
    }

    /**
     * Toggle Pokemon during drag operation
     */
    togglePokemonDrag(pokemonId) {
        this.draggedIds.add(pokemonId);
        
        if (this.dragAction === 'add') {
            this.dataManager.addToDex(pokemonId);
        } else {
            this.dataManager.removeFromDex(pokemonId);
        }
        
        this.onPokemonToggled();
    }

    /**
     * Called when a Pokemon is added or removed from the dex
     */
    onPokemonToggled() {
        // Re-render the list to update added/removed state
        this.filterAndRender();
        
        // Update dashboard via callback
        if (this.updateDashboardCallback) {
            this.updateDashboardCallback();
        }
    }

    /**
     * Set up all event listeners for filtering
     */
    setupEventListeners() {
        // View toggle (list/grid)
        this.viewToggle.addEventListener('click', () => {
            this.isGridView = !this.isGridView;
            this.viewToggle.classList.toggle('grid-active', this.isGridView);
            this.pokemonListEl.classList.toggle('grid-view', this.isGridView);
            this.filterAndRender();
        });

        // Global mouseup listener to end drag
        document.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.dragAction = null;
                this.draggedIds.clear();
            }
        });

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

        // Egg group select
        this.eggSelect.addEventListener('change', (e) => {
            if (e.target.value) {
                this.addFilter('egg', e.target.value);
                e.target.value = '';
            }
        });

        // In Dex checkbox
        this.inDexFilter.addEventListener('change', (e) => {
            this.activeFilters.inDex = e.target.checked;
            this.renderFilterChips();
            this.filterAndRender();
        });

        // BST range sliders - allow crossing for inverted range
        this.bstMinSlider.addEventListener('input', () => {
            const minVal = parseInt(this.bstMinSlider.value);
            
            this.activeFilters.bstMin = minVal;
            this.bstMinVal.textContent = minVal;
            this.updateBstRangeTrack();
            this.renderFilterChips();
            this.filterAndRender();
        });

        this.bstMaxSlider.addEventListener('input', () => {
            const maxVal = parseInt(this.bstMaxSlider.value);
            
            this.activeFilters.bstMax = maxVal;
            this.bstMaxVal.textContent = maxVal;
            this.updateBstRangeTrack();
            this.renderFilterChips();
            this.filterAndRender();
        });

        // Initialize BST range track
        this.updateBstRangeTrack();

        // Filter chips click to remove
        this.filterChipsContainer.addEventListener('click', (e) => {
            const chip = e.target.closest('.filter-chip');
            if (chip) {
                this.removeFilter(chip.dataset.type, chip.dataset.value);
            }
        });

        // Search input
        this.searchInput.addEventListener('input', () => this.filterAndRender());

        // Listen for external filter updates
        document.addEventListener('filter-update', () => {
            this.filterAndRender();
        });

        // Handle chart click - filter by type, egg group, or BST range and "In Dex"
        document.addEventListener('chart-click', (e) => {
            const typeName = e.detail.type;
            const eggGroupName = e.detail.eggGroup;
            const bstMin = e.detail.bstMin;
            const bstMax = e.detail.bstMax;
            
            // Clear search input
            this.searchInput.value = '';
            
            // Build filters - start with clean slate plus inDex
            const filters = {
                inDex: true,
                types: [],
                eggGroups: [],
                gens: [],
                evos: [],
                bstMin: 180,
                bstMax: 780
            };
            
            // Set the specific filter based on what was clicked
            if (typeName) {
                filters.types = [typeName];
            }
            if (eggGroupName) {
                filters.eggGroups = [eggGroupName];
            }
            if (bstMin !== undefined && bstMax !== undefined) {
                filters.bstMin = bstMin;
                filters.bstMax = bstMax;
            }
            
            // Set filters and trigger render
            this.setFilters(filters);
            
            // Open the flyout
            this.openFlyout();
        });

        // Flyout panel event listeners
        this.addPokemonBtn.addEventListener('click', () => this.openFlyout());
        this.closeFlyoutBtn.addEventListener('click', () => this.closeFlyout());
        this.flyoutOverlay.addEventListener('click', () => this.closeFlyout());

        // Escape key to close flyout
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.flyoutPanel.classList.contains('open')) {
                this.closeFlyout();
            }
        });
    }

    /**
     * Open the flyout panel
     */
    openFlyout() {
        this.flyoutPanel.classList.add('open');
        this.flyoutOverlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    /**
     * Close the flyout panel
     */
    closeFlyout() {
        this.flyoutPanel.classList.remove('open');
        this.flyoutOverlay.classList.remove('open');
        document.body.style.overflow = '';
    }

    /**
     * Convert egg group name to CSS class name
     */
    getEggGroupClass(eggGroup) {
        const classMap = {
            'Monster': 'monster',
            'Water 1': 'water1',
            'Water 2': 'water2',
            'Water 3': 'water3',
            'Bug': 'bug',
            'Flying': 'flying',
            'Field': 'field',
            'Fairy': 'fairy',
            'Grass': 'grass',
            'Human-Like': 'humanlike',
            'Mineral': 'mineral',
            'No Gender': 'nogender',
            'Dragon': 'dragon',
            'Ditto': 'ditto',
            'No Eggs': 'noeggs'
        };
        return classMap[eggGroup] || 'noeggs';
    }

    /**
     * Update BST range slider track visual
     */
    updateBstRangeTrack() {
        const min = parseInt(this.bstMinSlider.value);
        const max = parseInt(this.bstMaxSlider.value);
        const minPercent = ((min - 180) / (780 - 180)) * 100;
        const maxPercent = ((max - 180) / (780 - 180)) * 100;
        
        const isInverted = min > max;
        
        if (isInverted) {
            // Hide main selection, show left and right segments
            this.bstRangeSelected.style.display = 'none';
            this.bstRangeLeft.style.display = 'block';
            this.bstRangeRight.style.display = 'block';
            
            // Left segment: from 0 to max handle
            this.bstRangeLeft.style.left = '0%';
            this.bstRangeLeft.style.width = maxPercent + '%';
            
            // Right segment: from min handle to 100%
            this.bstRangeRight.style.left = minPercent + '%';
            this.bstRangeRight.style.width = (100 - minPercent) + '%';
        } else {
            // Normal range: show main selection, hide left/right
            this.bstRangeSelected.style.display = 'block';
            this.bstRangeLeft.style.display = 'none';
            this.bstRangeRight.style.display = 'none';
            
            this.bstRangeSelected.style.left = minPercent + '%';
            this.bstRangeSelected.style.width = (maxPercent - minPercent) + '%';
        }
    }
}
