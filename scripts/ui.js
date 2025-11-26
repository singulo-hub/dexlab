export class UI {
    constructor(dataManager, analytics) {
        this.dataManager = dataManager;
        this.analytics = analytics;

        // Elements
        this.pokemonListEl = document.getElementById('pokemon-list');
        this.dexCountEl = document.getElementById('dex-count');
        
        // Dashboard Elements
        this.statCountEl = document.querySelector('#stat-count p');
        this.statTypesEl = document.querySelector('#stat-types p');
        this.statBstEl = document.querySelector('#stat-bst p');
        this.alertListEl = document.getElementById('alert-list');

        // Modal
        this.modal = document.getElementById('template-modal');
        this.templateListEl = document.getElementById('template-list');
        
        this.isGridView = false;
        this.viewToggleBtn = document.getElementById('view-toggle-btn');
        
        this.viewToggleBtn.addEventListener('click', () => {
            this.isGridView = !this.isGridView;
            this.viewToggleBtn.textContent = this.isGridView ? 'List View' : 'Grid View';
            this.pokemonListEl.classList.toggle('grid-view', this.isGridView);
            // Re-trigger render
            const event = new CustomEvent('filter-update');
            document.dispatchEvent(event);
        });
        
        // Type Chart
        this.typeChartCanvas = document.getElementById('type-chart');
        this.typeChart = null;
        
        // Type colors for the chart
        this.typeColors = {
            Normal: '#A8A878',
            Fire: '#F08030',
            Water: '#6890F0',
            Electric: '#F8D030',
            Grass: '#78C850',
            Ice: '#98D8D8',
            Fighting: '#C03028',
            Poison: '#A040A0',
            Ground: '#E0C068',
            Flying: '#A890F0',
            Psychic: '#F85888',
            Bug: '#A8B820',
            Rock: '#B8A038',
            Ghost: '#705898',
            Dragon: '#7038F8',
            Dark: '#705848',
            Steel: '#B8B8D0',
            Fairy: '#EE99AC'
        };
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

    renderPokemonList(pokemonList) {
        this.pokemonListEl.innerHTML = '';
        pokemonList.forEach(p => {
            const isAdded = this.dataManager.customDex.some(d => d.id === p.id);
            const item = document.createElement('div');
            const btnClass = isAdded ? 'remove-btn' : 'add-btn';
            const btnText = isAdded ? '-' : '+';
            
            if (this.isGridView) {
                item.className = `pokemon-card ${isAdded ? 'added' : ''}`;
                item.innerHTML = `
                    <div class="card-img-container">
                        <img src="${p.sprite || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'}" alt="${p.name}" loading="lazy">
                    </div>
                    <div class="card-info">
                        <span class="pokemon-id">#${p.id}</span>
                        <span class="pokemon-name">${p.name}</span>
                        <div class="pokemon-types">
                            ${p.types.map(t => `<span>${t}</span>`).join('')}
                        </div>
                    </div>
                    <button class="action-btn ${btnClass}">${btnText}</button>
                `;
            } else {
                item.className = `pokemon-item ${isAdded ? 'added' : ''}`;
                item.innerHTML = `
                    <div class="pokemon-info">
                        <span class="pokemon-id">#${p.id}</span>
                        <span class="pokemon-name">${p.name}</span>
                        <div class="pokemon-types">
                            ${p.types.map(t => `<span>${t}</span>`).join('')}
                        </div>
                    </div>
                    <button class="action-btn ${btnClass}">${btnText}</button>
                `;
            }
            
            item.querySelector('.action-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                if (isAdded) {
                    this.dataManager.removeFromDex(p.id);
                } else {
                    this.dataManager.addToDex(p.id);
                }
                this.updateAll();
            });
            
            this.pokemonListEl.appendChild(item);
        });
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
        
        // Update Type Chart
        this.updateTypeChart(stats.typeCounts);
    }
    
    updateTypeChart(typeCounts) {
        if (!typeCounts) { return; }

        const labels = Object.keys(typeCounts);
        const data = Object.values(typeCounts);
        const backgroundColors = labels.map(t => this.typeColors[t] || '#888888');
        
        if (labels.length === 0) {
            if (this.typeChart) {
                this.typeChart.destroy();
                this.typeChart = null;
            }
            return;
        }
        
        if (this.typeChart) {
            // Check if labels changed (new type added or type removed)
            const currentLabels = [...this.typeChart.data.labels].sort();
            const newLabels = [...labels].sort();
            const labelsChanged = JSON.stringify(currentLabels) !== JSON.stringify(newLabels);
            
            if (labelsChanged) {
                // Labels changed - rebuild chart without animation
                this.typeChart.data.labels = labels;
                this.typeChart.data.datasets[0].data = data;
                this.typeChart.data.datasets[0].backgroundColor = backgroundColors;
                this.typeChart.update('none');
            } else {
                // Same labels - update data in the same order as existing labels
                const existingLabels = this.typeChart.data.labels;
                const reorderedData = existingLabels.map(label => typeCounts[label] || 0);
                const reorderedColors = existingLabels.map(label => this.typeColors[label] || '#888888');
                this.typeChart.data.datasets[0].data = reorderedData;
                this.typeChart.data.datasets[0].backgroundColor = reorderedColors;
                this.typeChart.update({ duration: 300 });
            }
        } else {
            // Create new chart
            this.typeChart = new Chart(this.typeChartCanvas, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: backgroundColors,
                        borderColor: '#1e1e1e',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                        duration: 300
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.label}: ${context.raw}`;
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    updateAll() {
        // Re-render source list to update "added" status
        const searchVal = document.getElementById('search-input').value;
        const typeVal = document.getElementById('type-filter').value;
        const genVal = document.getElementById('gen-filter').value;
        
        // Trigger a filter update which will call renderSourceList
        const event = new CustomEvent('filter-update', { 
            detail: { search: searchVal, type: typeVal, gen: genVal } 
        });
        document.dispatchEvent(event);

        // Update selected count
        this.dexCountEl.textContent = `${this.dataManager.customDex.length} selected`;
        this.updateDashboard();
    }
}
