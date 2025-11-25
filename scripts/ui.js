export class UI {
    constructor(dataManager, analytics) {
        this.dataManager = dataManager;
        this.analytics = analytics;

        // Elements
        this.sourceListEl = document.getElementById('source-list');
        this.customDexEl = document.getElementById('custom-dex');
        this.dexCountEl = document.getElementById('dex-count');
        
        // Dashboard Elements
        this.statCountEl = document.querySelector('#stat-count p');
        this.statTypesEl = document.querySelector('#stat-types p');
        this.statBstEl = document.querySelector('#stat-bst p');
        this.alertListEl = document.getElementById('alert-list');

        // Modal
        this.modal = document.getElementById('template-modal');
        this.templateListEl = document.getElementById('template-list');
    }

    init() {
        this.renderTemplates();
    }

    renderTemplates() {
        this.templateListEl.innerHTML = '';
        this.dataManager.templates.forEach(template => {
            const card = document.createElement('div');
            card.className = 'template-card';
            card.innerHTML = `
                <h3>${template.name}</h3>
                <p>${template.description}</p>
            `;
            card.addEventListener('click', () => {
                this.dataManager.loadTemplate(template.name);
                this.closeModal();
                this.updateAll();
            });
            this.templateListEl.appendChild(card);
        });
    }

    showModal() {
        this.modal.classList.remove('hidden');
    }

    closeModal() {
        this.modal.classList.add('hidden');
    }

    renderSourceList(pokemonList) {
        this.sourceListEl.innerHTML = '';
        pokemonList.forEach(p => {
            const isAdded = this.dataManager.customDex.some(d => d.id === p.id);
            const item = document.createElement('div');
            item.className = `pokemon-item ${isAdded ? 'added' : ''}`;
            item.innerHTML = `
                <div class="pokemon-info">
                    <span class="pokemon-id">#${p.id}</span>
                    <span class="pokemon-name">${p.name}</span>
                    <div class="pokemon-types">
                        ${p.types.map(t => `<span>${t}</span>`).join('')}
                    </div>
                </div>
                ${!isAdded ? '<button class="action-btn add-btn">+</button>' : ''}
            `;
            
            if (!isAdded) {
                item.querySelector('.add-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.dataManager.addToDex(p.id);
                    this.updateAll();
                });
            }
            
            this.sourceListEl.appendChild(item);
        });
    }

    renderCustomDex() {
        this.customDexEl.innerHTML = '';
        this.dataManager.customDex.forEach(p => {
            const item = document.createElement('div');
            item.className = 'pokemon-item';
            item.innerHTML = `
                <div class="pokemon-info">
                    <span class="pokemon-id">#${p.id}</span>
                    <span class="pokemon-name">${p.name}</span>
                    <div class="pokemon-types">
                        ${p.types.map(t => `<span>${t}</span>`).join('')}
                    </div>
                </div>
                <button class="action-btn remove-btn">-</button>
            `;
            
            item.querySelector('.remove-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.dataManager.removeFromDex(p.id);
                this.updateAll();
            });
            
            this.customDexEl.appendChild(item);
        });
        this.dexCountEl.textContent = `${this.dataManager.customDex.length} Pokémon`;
    }

    updateDashboard() {
        const stats = this.analytics.analyze(this.dataManager.customDex);
        this.statCountEl.textContent = stats.count;
        this.statTypesEl.textContent = stats.topType;
        this.statBstEl.textContent = stats.avgBst;

        this.alertListEl.innerHTML = '';
        stats.alerts.forEach(alert => {
            const li = document.createElement('li');
            li.textContent = alert;
            this.alertListEl.appendChild(li);
        });
    }

    updateAll() {
        // Re-render source list to update "added" status
        // Note: In a real app with large lists, we'd want to optimize this
        // by only re-rendering the changed item or using a virtual list.
        // For now, we'll just re-filter the current view.
        const searchVal = document.getElementById('search-input').value;
        const typeVal = document.getElementById('type-filter').value;
        const genVal = document.getElementById('gen-filter').value;
        
        // Trigger a filter update which will call renderSourceList
        const event = new CustomEvent('filter-update', { 
            detail: { search: searchVal, type: typeVal, gen: genVal } 
        });
        document.dispatchEvent(event);

        this.renderCustomDex();
        this.updateDashboard();
    }
}
