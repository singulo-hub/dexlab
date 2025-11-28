export class DataManager {
    constructor() {
        this.allPokemon = [];
        this.templates = [];
        this.customDex = [];
        this.currentDexId = null;
        this.currentDexName = 'Untitled Dex';
        this.currentDexDesc = '';
        this.STORAGE_KEY = 'dexlab_saves';
        this.CURRENT_DEX_KEY = 'dexlab_current_dex_id';
    }

    async loadData() {
        try {
            const [pokemonRes, templatesRes] = await Promise.all([
                fetch('data/all-pokemon.json'),
                fetch('data/templates.json')
            ]);
            this.allPokemon = await pokemonRes.json();
            this.templates = await templatesRes.json();
            return true;
        } catch (error) {
            console.error('Error loading data:', error);
            return false;
        }
    }

    getPokemonById(id) {
        return this.allPokemon.find(p => p.id === id);
    }

    addToDex(pokemonId) {
        if (this.customDex.some(p => p.id === pokemonId)) return false;
        const pokemon = this.getPokemonById(pokemonId);
        if (pokemon) {
            this.customDex.push(pokemon);
            this.saveToStorage();
            return true;
        }
        return false;
    }

    removeFromDex(pokemonId) {
        const initialLength = this.customDex.length;
        this.customDex = this.customDex.filter(p => p.id !== pokemonId);
        if (this.customDex.length !== initialLength) {
            this.saveToStorage();
            return true;
        }
        return false;
    }

    loadTemplate(templateName) {
        const template = this.templates.find(t => t.name === templateName);
        if (!template) return;

        this.customDex = [];
        template.pokemonIds.forEach(id => {
            const pokemon = this.getPokemonById(id);
            if (pokemon) {
                this.customDex.push(pokemon);
            }
        });
        this.saveToStorage();
    }

    // ==========================================
    // Multi-Dex Storage System
    // ==========================================

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    getAllSaves() {
        const saves = localStorage.getItem(this.STORAGE_KEY);
        return saves ? JSON.parse(saves) : {};
    }

    getSavesList() {
        const saves = this.getAllSaves();
        return Object.entries(saves).map(([id, data]) => ({
            id,
            name: data.name,
            description: data.description || '',
            count: data.pokemonIds.length,
            updatedAt: data.updatedAt
        })).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }

    createNewDex(name, description = '') {
        const id = this.generateId();
        this.currentDexId = id;
        this.currentDexName = name || 'Untitled Dex';
        this.currentDexDesc = description;
        this.customDex = [];
        
        this.saveToStorage();
        localStorage.setItem(this.CURRENT_DEX_KEY, id);
        
        return id;
    }

    loadDex(dexId) {
        const saves = this.getAllSaves();
        const save = saves[dexId];
        
        if (!save) return false;
        
        this.currentDexId = dexId;
        this.currentDexName = save.name;
        this.currentDexDesc = save.description || '';
        this.customDex = save.pokemonIds
            .map(id => this.getPokemonById(id))
            .filter(p => p);
        
        localStorage.setItem(this.CURRENT_DEX_KEY, dexId);
        return true;
    }

    deleteDex(dexId) {
        const saves = this.getAllSaves();
        if (saves[dexId]) {
            delete saves[dexId];
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(saves));
            
            // If we deleted the current dex, clear current
            if (this.currentDexId === dexId) {
                this.currentDexId = null;
                this.currentDexName = 'Untitled Dex';
                this.currentDexDesc = '';
                this.customDex = [];
                localStorage.removeItem(this.CURRENT_DEX_KEY);
            }
            return true;
        }
        return false;
    }

    saveToStorage() {
        // If no current dex ID, create one
        if (!this.currentDexId) {
            this.currentDexId = this.generateId();
        }
        
        const saves = this.getAllSaves();
        saves[this.currentDexId] = {
            name: this.currentDexName,
            description: this.currentDexDesc,
            pokemonIds: this.customDex.map(p => p.id),
            updatedAt: new Date().toISOString()
        };
        
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(saves));
        localStorage.setItem(this.CURRENT_DEX_KEY, this.currentDexId);
    }

    loadFromStorage() {
        // Try to load the last opened dex
        const lastDexId = localStorage.getItem(this.CURRENT_DEX_KEY);
        if (lastDexId) {
            return this.loadDex(lastDexId);
        }
        return false;
    }

    updateDexMeta(name, description) {
        this.currentDexName = name || 'Untitled Dex';
        this.currentDexDesc = description || '';
        this.saveToStorage();
    }

    exportJSON() {
        const exportData = {
            name: this.currentDexName,
            description: this.currentDexDesc,
            pokemon: this.customDex
        };
        const dataStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.currentDexName.replace(/[^a-z0-9]/gi, '_')}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    async importJSON(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const imported = JSON.parse(e.target.result);
                    
                    // Handle both old format (array) and new format (object with metadata)
                    if (Array.isArray(imported)) {
                        // Old format: just an array of pokemon
                        this.currentDexId = this.generateId();
                        this.currentDexName = 'Imported Dex';
                        this.currentDexDesc = '';
                        this.customDex = imported.map(p => this.getPokemonById(p.id)).filter(p => p);
                    } else if (imported.pokemon && Array.isArray(imported.pokemon)) {
                        // New format: object with metadata
                        this.currentDexId = this.generateId();
                        this.currentDexName = imported.name || 'Imported Dex';
                        this.currentDexDesc = imported.description || '';
                        this.customDex = imported.pokemon.map(p => this.getPokemonById(p.id)).filter(p => p);
                    } else {
                        reject("Invalid JSON format.");
                        return;
                    }
                    
                    this.saveToStorage();
                    resolve(true);
                } catch (err) {
                    reject("Error parsing JSON.");
                }
            };
            reader.readAsText(file);
        });
    }

    reset() {
        this.currentDexId = null;
        this.currentDexName = 'Untitled Dex';
        this.currentDexDesc = '';
        this.customDex = [];
        localStorage.removeItem(this.CURRENT_DEX_KEY);
    }
}
