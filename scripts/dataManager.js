export class DataManager {
    constructor() {
        this.allPokemon = [];
        this.templates = [];
        this.customDex = [];
        this.STORAGE_KEY = 'dexlab_custom_dex';
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

    saveToStorage() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.customDex));
    }

    loadFromStorage() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            const storedDex = JSON.parse(stored);
            // Refresh Pokemon data from allPokemon to get latest fields
            this.customDex = storedDex.map(p => this.getPokemonById(p.id)).filter(p => p);
            return true;
        }
        return false;
    }

    exportJSON() {
        const dataStr = JSON.stringify(this.customDex, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "custom_dex.json";
        a.click();
        URL.revokeObjectURL(url);
    }

    async importJSON(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const imported = JSON.parse(e.target.result);
                    if (Array.isArray(imported)) {
                        this.customDex = imported;
                        this.saveToStorage();
                        resolve(true);
                    } else {
                        reject("Invalid JSON format: Expected an array.");
                    }
                } catch (err) {
                    reject("Error parsing JSON.");
                }
            };
            reader.readAsText(file);
        });
    }

    reset() {
        this.customDex = [];
        this.saveToStorage();
    }
}
