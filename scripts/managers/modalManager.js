/**
 * ModalManager - Handles all modal-related functionality
 * Including navigation, forms, saved dex list, and region list
 */
export class ModalManager {
    constructor(dataManager, onDexChange) {
        this.dataManager = dataManager;
        this.onDexChange = onDexChange; // Callback when dex is created/loaded/edited
        
        // Modal elements
        this.modal = document.getElementById('template-modal');
        this.modalSteps = {
            menu: document.getElementById('modal-step-menu'),
            new: document.getElementById('modal-step-new'),
            edit: document.getElementById('modal-step-edit'),
            load: document.getElementById('modal-step-load'),
            region: document.getElementById('modal-step-region'),
            export: document.getElementById('modal-step-export'),
            exportGrid: document.getElementById('modal-step-export-grid'),
            credits: document.getElementById('modal-step-credits')
        };
        this.savedDexListEl = document.getElementById('saved-dex-list');
        this.regionListEl = document.getElementById('region-list');
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Close button
        document.getElementById('modal-close-btn').addEventListener('click', () => {
            this.close();
        });
        
        // Main menu buttons
        document.getElementById('menu-new-btn').addEventListener('click', () => {
            this.showStep('new');
            document.getElementById('new-dex-name').value = '';
            document.getElementById('new-dex-desc').value = '';
            document.getElementById('name-char-count').textContent = '0';
            document.getElementById('desc-char-count').textContent = '0';
            document.getElementById('new-dex-name').focus();
        });
        
        document.getElementById('menu-load-btn').addEventListener('click', () => {
            this.renderSavedDexList();
            this.showStep('load');
        });
        
        document.getElementById('menu-region-btn').addEventListener('click', () => {
            this.renderRegionList();
            this.showStep('region');
        });
        
        document.getElementById('menu-import-btn').addEventListener('click', () => {
            document.getElementById('file-input').click();
        });
        
        // Edit button in header - opens edit modal directly
        document.getElementById('edit-dex-btn').addEventListener('click', () => {
            document.getElementById('edit-dex-name').value = this.dataManager.currentDexName;
            document.getElementById('edit-dex-desc').value = this.dataManager.currentDexDesc || '';
            // Update character counters
            document.getElementById('edit-name-char-count').textContent = this.dataManager.currentDexName.length;
            document.getElementById('edit-desc-char-count').textContent = (this.dataManager.currentDexDesc || '').length;
            this.modal.classList.remove('hidden');
            document.getElementById('modal-close-btn').classList.remove('hidden');
            this.showStep('edit');
            document.getElementById('edit-dex-name').focus();
        });
        
        // Credits button in actions dropdown
        document.getElementById('credits-btn').addEventListener('click', () => {
            this.showCredits();
        });
        
        // Back buttons
        document.getElementById('new-back-btn').addEventListener('click', () => {
            this.showStep('menu');
        });
        
        document.getElementById('edit-back-btn').addEventListener('click', () => {
            this.close();
        });
        
        document.getElementById('load-back-btn').addEventListener('click', () => {
            this.showStep('menu');
        });
        
        document.getElementById('region-back-btn').addEventListener('click', () => {
            this.showStep('menu');
        });
        
        // Export modal buttons
        document.getElementById('export-data-btn').addEventListener('click', () => {
            this.dataManager.exportJSON();
            this.close();
        });
        
        document.getElementById('export-grid-btn').addEventListener('click', () => {
            this.showStep('exportGrid');
        });
        
        document.getElementById('export-grid-back-btn').addEventListener('click', () => {
            this.showStep('export');
        });
        
        document.getElementById('export-grid-generate-btn').addEventListener('click', () => {
            const imageStyle = document.querySelector('input[name="grid-image-style"]:checked').value;
            const showNames = document.getElementById('grid-show-names').checked;
            
            // Dispatch event for app.js to handle
            document.dispatchEvent(new CustomEvent('generate-grid', {
                detail: { imageStyle, showNames }
            }));
            this.close();
        });

        // New dex start button
        document.getElementById('new-start-btn').addEventListener('click', () => {
            const name = document.getElementById('new-dex-name').value.trim() || 'Untitled Dex';
            const desc = document.getElementById('new-dex-desc').value.trim();
            
            this.dataManager.createNewDex(name, desc);
            this.close();
            this.onDexChange();
        });
        
        // Edit dex save button
        document.getElementById('edit-save-btn').addEventListener('click', () => {
            const name = document.getElementById('edit-dex-name').value.trim() || 'Untitled Dex';
            const desc = document.getElementById('edit-dex-desc').value.trim();
            
            this.dataManager.updateDexMeta(name, desc);
            this.close();
            this.onDexChange();
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
        
        // Character counters
        this.setupCharacterCounter('new-dex-name', 'name-char-count', 50, 40);
        this.setupCharacterCounter('new-dex-desc', 'desc-char-count', 100, 80);
        this.setupCharacterCounter('edit-dex-name', 'edit-name-char-count', 50, 40);
        this.setupCharacterCounter('edit-dex-desc', 'edit-desc-char-count', 100, 80);
    }

    /**
     * Setup character counter for an input/textarea
     */
    setupCharacterCounter(inputId, counterId, maxLength, warnLength) {
        const input = document.getElementById(inputId);
        const counter = document.getElementById(counterId);
        const container = counter.parentElement;
        
        input.addEventListener('input', () => {
            const count = input.value.length;
            counter.textContent = count;
            
            container.classList.remove('near-limit', 'at-limit');
            if (count >= maxLength) {
                container.classList.add('at-limit');
            } else if (count >= warnLength) {
                container.classList.add('near-limit');
            }
        });
    }

    /**
     * Show a specific modal step
     */
    showStep(stepName) {
        Object.values(this.modalSteps).forEach(step => {
            step.classList.add('hidden');
        });
        this.modalSteps[stepName].classList.remove('hidden');
    }

    /**
     * Show the main menu modal
     */
    show() {
        this.modal.classList.remove('hidden');
        this.showStep('menu');
        
        // Show close button if a dex is already loaded
        const closeBtn = document.getElementById('modal-close-btn');
        if (this.dataManager.currentDexId) {
            closeBtn.classList.remove('hidden');
        } else {
            closeBtn.classList.add('hidden');
        }
    }

    /**
     * Show the export modal
     */
    showExport() {
        this.modal.classList.remove('hidden');
        this.showStep('export');
        document.getElementById('modal-close-btn').classList.remove('hidden');
    }

    /**
     * Show the credits modal
     */
    showCredits() {
        this.modal.classList.remove('hidden');
        this.showStep('credits');
        document.getElementById('modal-close-btn').classList.remove('hidden');
    }

    /**
     * Close the modal
     */
    close() {
        this.modal.classList.add('hidden');
    }

    /**
     * Initialize modal (show menu step)
     */
    init() {
        this.showStep('menu');
    }

    /**
     * Render the saved dex list
     */
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
                    this.close();
                    this.onDexChange();
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

    /**
     * Render the region template list
     */
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
                this.close();
                this.onDexChange();
            });
            
            this.regionListEl.appendChild(item);
        });
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
