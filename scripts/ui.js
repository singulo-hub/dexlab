import { ChartManager } from './chartManager.js';

export class UI {
    constructor(dataManager, analytics) {
        this.dataManager = dataManager;
        this.analytics = analytics;
        
        // Chart manager for all dashboard charts
        this.chartManager = new ChartManager();

        // Elements
        this.pokemonListEl = document.getElementById('pokemon-list');
        this.dexNameEl = document.getElementById('dex-name');
        
        // Dashboard Elements
        this.statCountEl = document.getElementById('stat-total-count');
        this.stat1StageEl = document.getElementById('stat-1stage');
        this.stat2StageEl = document.getElementById('stat-2stage');
        this.stat3StageEl = document.getElementById('stat-3stage');
        this.statLegendaryEl = document.getElementById('stat-legendary');
        this.statMythicalEl = document.getElementById('stat-mythical');
        this.statPseudoEl = document.getElementById('stat-pseudo');
        this.statSpecialTotalEl = document.getElementById('stat-special-total');
        this.statLateEvoEl = document.getElementById('stat-late-evo');
        this.rareTypeEl = document.getElementById('rare-type-val');
        this.commonTypeEl = document.getElementById('common-type-val');
        this.statMedianBstEl = document.getElementById('median-bst-val');
        this.statMinBstEl = document.getElementById('min-bst-val');
        this.statMaxBstEl = document.getElementById('max-bst-val');
        this.statQ1BstEl = document.getElementById('q1-bst-val');
        this.statQ3BstEl = document.getElementById('q3-bst-val');
        this.statMinCrEl = document.getElementById('min-cr-val');
        this.statQ1CrEl = document.getElementById('q1-cr-val');
        this.statMedianCrEl = document.getElementById('median-cr-val');
        this.statQ3CrEl = document.getElementById('q3-cr-val');
        this.statMaxCrEl = document.getElementById('max-cr-val');
        this.alertListEl = document.getElementById('alert-list');

        // Modal
        this.modal = document.getElementById('template-modal');
        this.modalSteps = {
            menu: document.getElementById('modal-step-menu'),
            new: document.getElementById('modal-step-new'),
            edit: document.getElementById('modal-step-edit'),
            load: document.getElementById('modal-step-load'),
            region: document.getElementById('modal-step-region')
        };
        this.savedDexListEl = document.getElementById('saved-dex-list');
        this.regionListEl = document.getElementById('region-list');
        
        // Flyout Panel
        this.flyoutPanel = document.getElementById('pokemon-flyout');
        this.flyoutOverlay = document.getElementById('flyout-overlay');
        this.addPokemonBtn = document.getElementById('add-pokemon-btn');
        this.closeFlyoutBtn = document.getElementById('close-flyout-btn');
        
        this.addPokemonBtn.addEventListener('click', () => this.openFlyout());
        this.closeFlyoutBtn.addEventListener('click', () => this.closeFlyout());
        this.flyoutOverlay.addEventListener('click', () => this.closeFlyout());
        
        // Close flyout on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.flyoutPanel.classList.contains('open')) {
                this.closeFlyout();
            }
        });
        
        this.isGridView = false;
        this.viewToggle = document.getElementById('view-toggle');
        
        this.viewToggle.addEventListener('click', () => {
            this.isGridView = !this.isGridView;
            this.viewToggle.classList.toggle('grid-active', this.isGridView);
            this.pokemonListEl.classList.toggle('grid-view', this.isGridView);
            // Re-trigger render
            const event = new CustomEvent('filter-update');
            document.dispatchEvent(event);
        });
        
        // Drag selection state for list view
        this.isDragging = false;
        this.dragAction = null; // 'add' or 'remove' - determined by first item's state
        this.draggedIds = new Set(); // Track which IDs have been toggled this drag
        
        // Global mouseup listener to end drag
        document.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.dragAction = null;
                this.draggedIds.clear();
            }
        });
        
        // Setup modal navigation
        this.setupModalNavigation();
    }

    setupModalNavigation() {
        // Close button
        document.getElementById('modal-close-btn').addEventListener('click', () => {
            this.closeModal();
        });
        
        // Main menu buttons
        document.getElementById('menu-new-btn').addEventListener('click', () => {
            this.showModalStep('new');
            document.getElementById('new-dex-name').value = '';
            document.getElementById('new-dex-desc').value = '';
            document.getElementById('new-dex-name').focus();
        });
        
        document.getElementById('menu-load-btn').addEventListener('click', () => {
            this.renderSavedDexList();
            this.showModalStep('load');
        });
        
        document.getElementById('menu-region-btn').addEventListener('click', () => {
            this.renderRegionList();
            this.showModalStep('region');
        });
        
        document.getElementById('menu-import-btn').addEventListener('click', () => {
            document.getElementById('file-input').click();
        });
        
        // Edit button - prefill with current dex data
        document.getElementById('menu-edit-btn').addEventListener('click', () => {
            document.getElementById('edit-dex-name').value = this.dataManager.currentDexName;
            document.getElementById('edit-dex-desc').value = this.dataManager.currentDexDesc || '';
            // Update character counters
            document.getElementById('edit-name-char-count').textContent = this.dataManager.currentDexName.length;
            document.getElementById('edit-desc-char-count').textContent = (this.dataManager.currentDexDesc || '').length;
            this.showModalStep('edit');
            document.getElementById('edit-dex-name').focus();
        });
        
        // Back buttons
        document.getElementById('new-back-btn').addEventListener('click', () => {
            this.showModalStep('menu');
        });
        
        document.getElementById('edit-back-btn').addEventListener('click', () => {
            this.showModalStep('menu');
        });
        
        document.getElementById('load-back-btn').addEventListener('click', () => {
            this.showModalStep('menu');
        });
        
        document.getElementById('region-back-btn').addEventListener('click', () => {
            this.showModalStep('menu');
        });
        
        // New dex start button
        document.getElementById('new-start-btn').addEventListener('click', () => {
            const name = document.getElementById('new-dex-name').value.trim() || 'Untitled Dex';
            const desc = document.getElementById('new-dex-desc').value.trim();
            
            this.dataManager.createNewDex(name, desc);
            this.closeModal();
            this.updateAll();
            this.updateDexTitle();
        });
        
        // Edit dex save button
        document.getElementById('edit-save-btn').addEventListener('click', () => {
            const name = document.getElementById('edit-dex-name').value.trim() || 'Untitled Dex';
            const desc = document.getElementById('edit-dex-desc').value.trim();
            
            this.dataManager.updateDexMeta(name, desc);
            this.closeModal();
            this.updateDexTitle();
        });
        
        // Enter key on name input starts the dex
        document.getElementById('new-dex-name').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('new-start-btn').click();
            }
        });
        
        // Enter key on edit name input saves
        document.getElementById('edit-dex-name').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('edit-save-btn').click();
            }
        });
        
        // Character counter for name
        const nameInput = document.getElementById('new-dex-name');
        const nameCharCounter = document.getElementById('name-char-count');
        const nameCounterContainer = nameCharCounter.parentElement;
        
        nameInput.addEventListener('input', () => {
            const count = nameInput.value.length;
            nameCharCounter.textContent = count;
            
            // Update styling based on count
            nameCounterContainer.classList.remove('near-limit', 'at-limit');
            if (count >= 50) {
                nameCounterContainer.classList.add('at-limit');
            } else if (count >= 40) {
                nameCounterContainer.classList.add('near-limit');
            }
        });
        
        // Character counter for description
        const descTextarea = document.getElementById('new-dex-desc');
        const descCharCounter = document.getElementById('desc-char-count');
        const descCounterContainer = descCharCounter.parentElement;
        
        descTextarea.addEventListener('input', () => {
            const count = descTextarea.value.length;
            descCharCounter.textContent = count;
            
            // Update styling based on count
            descCounterContainer.classList.remove('near-limit', 'at-limit');
            if (count >= 100) {
                descCounterContainer.classList.add('at-limit');
            } else if (count >= 80) {
                descCounterContainer.classList.add('near-limit');
            }
        });
        
        // Character counter for edit name
        const editNameInput = document.getElementById('edit-dex-name');
        const editNameCharCounter = document.getElementById('edit-name-char-count');
        const editNameCounterContainer = editNameCharCounter.parentElement;
        
        editNameInput.addEventListener('input', () => {
            const count = editNameInput.value.length;
            editNameCharCounter.textContent = count;
            
            editNameCounterContainer.classList.remove('near-limit', 'at-limit');
            if (count >= 50) {
                editNameCounterContainer.classList.add('at-limit');
            } else if (count >= 40) {
                editNameCounterContainer.classList.add('near-limit');
            }
        });
        
        // Character counter for edit description
        const editDescTextarea = document.getElementById('edit-dex-desc');
        const editDescCharCounter = document.getElementById('edit-desc-char-count');
        const editDescCounterContainer = editDescCharCounter.parentElement;
        
        editDescTextarea.addEventListener('input', () => {
            const count = editDescTextarea.value.length;
            editDescCharCounter.textContent = count;
            
            editDescCounterContainer.classList.remove('near-limit', 'at-limit');
            if (count >= 100) {
                editDescCounterContainer.classList.add('at-limit');
            } else if (count >= 80) {
                editDescCounterContainer.classList.add('near-limit');
            }
        });
    }

    showModalStep(stepName) {
        Object.values(this.modalSteps).forEach(step => {
            step.classList.add('hidden');
        });
        this.modalSteps[stepName].classList.remove('hidden');
    }

    showModal() {
        this.modal.classList.remove('hidden');
        this.showModalStep('menu');
        
        // Show close button if a dex is already loaded
        const closeBtn = document.getElementById('modal-close-btn');
        if (this.dataManager.currentDexId) {
            closeBtn.classList.remove('hidden');
        } else {
            closeBtn.classList.add('hidden');
        }
    }

    init() {
        this.showModalStep('menu');
    }

    renderSavedDexList() {
        const saves = this.dataManager.getSavesList();
        
        if (saves.length === 0) {
            this.savedDexListEl.innerHTML = `
                <div class="saved-dex-empty">
                    <i class="fas fa-folder-open"></i>
                    <p>No saved Pokédexes yet</p>
                </div>
            `;
            return;
        }
        
        this.savedDexListEl.innerHTML = '';
        saves.forEach(save => {
            const item = document.createElement('div');
            item.className = 'saved-dex-item';
            item.innerHTML = `
                <div class="saved-dex-info">
                    <div class="saved-dex-name">${this.escapeHtml(save.name)}</div>
                    <div class="saved-dex-meta">
                        ${save.count} Pokémon${save.description ? ' • ' + this.escapeHtml(save.description) : ''}
                    </div>
                </div>
                <div class="saved-dex-actions">
                    <button class="delete-btn" data-id="${save.id}" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            // Click to load
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.delete-btn')) {
                    this.dataManager.loadDex(save.id);
                    this.closeModal();
                    this.updateAll();
                    this.updateDexTitle();
                }
            });
            
            // Delete button
            const deleteBtn = item.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`Delete "${save.name}"?`)) {
                    this.dataManager.deleteDex(save.id);
                    this.renderSavedDexList();
                }
            });
            
            this.savedDexListEl.appendChild(item);
        });
    }

    renderRegionList() {
        this.regionListEl.innerHTML = '';
        
        // Filter templates to only show regional ones (exclude "Empty")
        const regions = this.dataManager.templates.filter(t => t.name !== 'Empty');
        
        regions.forEach(template => {
            const item = document.createElement('div');
            item.className = 'saved-dex-item region-item';
            item.innerHTML = `
                <div class="saved-dex-info">
                    <div class="saved-dex-name">${template.name}</div>
                    <div class="saved-dex-meta">
                        ${template.pokemonIds.length} Pokémon • ${template.description}
                    </div>
                </div>
                <div class="saved-dex-actions">
                    <button class="load-btn">
                        <i class="fas fa-download"></i> Use
                    </button>
                </div>
            `;
            
            item.addEventListener('click', () => {
                // Create a new dex with the region name
                this.dataManager.createNewDex(template.name, template.description);
                this.dataManager.loadTemplate(template.name);
                this.closeModal();
                this.updateAll();
                this.updateDexTitle();
            });
            
            this.regionListEl.appendChild(item);
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    updateDexTitle() {
        this.dexNameEl.textContent = this.dataManager.currentDexName;
    }

    closeModal() {
        this.modal.classList.add('hidden');
    }

    openFlyout() {
        this.flyoutPanel.classList.add('open');
        this.flyoutOverlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    closeFlyout() {
        this.flyoutPanel.classList.remove('open');
        this.flyoutOverlay.classList.remove('open');
        document.body.style.overflow = '';
    }

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
                    </div>
                `;
                
                // Grid view: simple click toggle
                item.addEventListener('click', () => {
                    if (isAdded) {
                        this.dataManager.removeFromDex(p.id);
                    } else {
                        this.dataManager.addToDex(p.id);
                    }
                    this.updateAll();
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
    
    togglePokemonDrag(pokemonId) {
        this.draggedIds.add(pokemonId);
        
        if (this.dragAction === 'add') {
            this.dataManager.addToDex(pokemonId);
        } else {
            this.dataManager.removeFromDex(pokemonId);
        }
        
        this.updateAll();
    }

    updateDashboard() {
        const stats = this.analytics.analyze(this.dataManager.customDex);
        this.statCountEl.textContent = stats.count;
        
        // Evolution stages with percentages
        const stage1 = stats.evolutionDepthCounts[1] || 0;
        const stage2 = stats.evolutionDepthCounts[2] || 0;
        const stage3 = stats.evolutionDepthCounts[3] || 0;
        const stage1Pct = stats.count > 0 ? Math.round((stage1 / stats.count) * 100) : 0;
        const stage2Pct = stats.count > 0 ? Math.round((stage2 / stats.count) * 100) : 0;
        const stage3Pct = stats.count > 0 ? Math.round((stage3 / stats.count) * 100) : 0;
        this.stat1StageEl.textContent = `${stage1} (${stage1Pct}%)`;
        this.stat2StageEl.textContent = `${stage2} (${stage2Pct}%)`;
        this.stat3StageEl.textContent = `${stage3} (${stage3Pct}%)`;
        
        this.statLegendaryEl.textContent = stats.legendaryCount || 0;
        this.statMythicalEl.textContent = stats.mythicalCount || 0;
        this.statPseudoEl.textContent = stats.pseudoCount || 0;
        
        // Special total (legendary + mythical + pseudo) with percentage
        const specialTotal = (stats.legendaryCount || 0) + (stats.mythicalCount || 0) + (stats.pseudoCount || 0);
        const specialPct = stats.count > 0 ? Math.round((specialTotal / stats.count) * 100) : 0;
        this.statSpecialTotalEl.textContent = `${specialTotal} (${specialPct}%)`;
        
        // Late evo with percentage
        const lateEvoCount = stats.lateEvolutionCount || 0;
        const lateEvoPercent = stats.count > 0 ? Math.round((lateEvoCount / stats.count) * 100) : 0;
        this.statLateEvoEl.textContent = `${lateEvoCount} (${lateEvoPercent}%)`;
        this.rareTypeEl.textContent = stats.rareType;
        this.commonTypeEl.textContent = stats.commonType;
        this.statMinBstEl.textContent = stats.minBst || '-';
        this.statQ1BstEl.textContent = stats.q1Bst || '-';
        this.statMedianBstEl.textContent = stats.medianBst || '-';
        this.statQ3BstEl.textContent = stats.q3Bst || '-';
        this.statMaxBstEl.textContent = stats.maxBst || '-';
        this.statMinCrEl.textContent = stats.minCaptureRate || '-';
        this.statQ1CrEl.textContent = stats.q1CaptureRate || '-';
        this.statMedianCrEl.textContent = stats.medianCaptureRate || '-';
        this.statQ3CrEl.textContent = stats.q3CaptureRate || '-';
        this.statMaxCrEl.textContent = stats.maxCaptureRate || '-';

        this.alertListEl.innerHTML = '';
        stats.alerts.forEach(alert => {
            const li = document.createElement('li');
            li.textContent = alert;
            this.alertListEl.appendChild(li);
        });
        
        // Update all charts via chart manager
        this.chartManager.updateCharts(stats);
    }

    updateAll() {
        // Update dex title
        this.updateDexTitle();
        
        // Trigger a filter update which will call filterAndRender in app.js
        const event = new CustomEvent('filter-update');
        document.dispatchEvent(event);

        // Update selected count
        this.updateDashboard();
    }
}
