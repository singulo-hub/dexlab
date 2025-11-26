export class UI {
    constructor(dataManager, analytics) {
        this.dataManager = dataManager;
        this.analytics = analytics;

        // Elements
        this.pokemonListEl = document.getElementById('pokemon-list');
        
        // Dashboard Elements
        this.statCountEl = document.querySelector('#stat-count p');
        this.statTypesEl = document.querySelector('#stat-types p');
        this.statBstEl = document.querySelector('#stat-bst p');
        this.statMinBstEl = document.getElementById('min-bst-val');
        this.statMaxBstEl = document.getElementById('max-bst-val');
        this.statMinCrEl = document.getElementById('min-cr-val');
        this.statAvgCrEl = document.getElementById('avg-cr-val');
        this.statMaxCrEl = document.getElementById('max-cr-val');
        this.hardCrListEl = document.getElementById('hard-cr-list');
        this.easyCrListEl = document.getElementById('easy-cr-list');
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
        
        // BST Chart
        this.bstChartCanvas = document.getElementById('bst-chart');
        this.bstChart = null;
        
        // Egg Group Chart
        this.eggChartCanvas = document.getElementById('egg-chart');
        this.eggChart = null;
        
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
        
        // Egg group colors
        this.eggGroupColors = {
            Monster: '#D25064',
            'Water 1': '#6890F0',
            'Water 2': '#4A7ACA',
            'Water 3': '#3A6AB8',
            Bug: '#A8B820',
            Flying: '#A890F0',
            Ground: '#E0C068',
            Fairy: '#EE99AC',
            Plant: '#78C850',
            Humanshape: '#C03028',
            Mineral: '#B8A038',
            Amorphous: '#705898',
            Ditto: '#A040A0',
            Dragon: '#7038F8',
            Indeterminate: '#333333',
            'No Eggs': '#333333'
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
                `;
            }
            
            item.addEventListener('click', () => {
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
        this.statMinBstEl.textContent = stats.minBst || '-';
        this.statMaxBstEl.textContent = stats.maxBst || '-';
        this.statMinCrEl.textContent = stats.minCaptureRate || '-';
        this.statAvgCrEl.textContent = stats.avgCaptureRate || '-';
        this.statMaxCrEl.textContent = stats.maxCaptureRate || '-';
        
        this.hardCrListEl.innerHTML = '';
        stats.hard5CaptureRate.forEach(p => {
            const li = document.createElement('li');
            li.textContent = `${p.name} (${p.captureRate})`;
            this.hardCrListEl.appendChild(li);
        });
        
        this.easyCrListEl.innerHTML = '';
        stats.easiest5CaptureRate.forEach(p => {
            const li = document.createElement('li');
            li.textContent = `${p.name} (${p.captureRate})`;
            this.easyCrListEl.appendChild(li);
        });

        this.alertListEl.innerHTML = '';
        stats.alerts.forEach(alert => {
            const li = document.createElement('li');
            li.textContent = alert;
            this.alertListEl.appendChild(li);
        });
        
        // Update Type Chart
        this.updateTypeChart(stats.typeCounts);
        
        // Update BST Chart
        this.updateBstChart(stats.bstDistribution);
        
        // Update Egg Group Chart
        this.updateEggChart(stats.eggGroupCounts);
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
    
    updateBstChart(bstDistribution) {
        if (!bstDistribution) { return; }
        
        const labels = Object.keys(bstDistribution);
        const data = Object.values(bstDistribution);
        const hasData = data.some(v => v > 0);
        
        if (!hasData) {
            if (this.bstChart) {
                this.bstChart.destroy();
                this.bstChart = null;
            }
            return;
        }
        
        // Gradient colors from low BST (red) to high BST (purple)
        const bstColors = [
            '#f44336',  // < 300 - red
            '#ff9800',  // 300-399 - orange
            '#ffeb3b',  // 400-499 - yellow
            '#4caf50',  // 500-599 - green
            '#9c27b0'   // 600+ - purple
        ];
        
        if (this.bstChart) {
            this.bstChart.data.datasets[0].data = data;
            this.bstChart.update({ duration: 300 });
        } else {
            this.bstChart = new Chart(this.bstChartCanvas, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: bstColors,
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
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                color: '#888',
                                stepSize: 1
                            },
                            grid: {
                                color: '#3e3e42'
                            }
                        },
                        x: {
                            ticks: {
                                color: '#888',
                                font: {
                                    size: 9
                                }
                            },
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        }
    }
    
    updateEggChart(eggGroupCounts) {
        if (!eggGroupCounts) { return; }
        
        const labels = Object.keys(eggGroupCounts);
        const data = Object.values(eggGroupCounts);
        const backgroundColors = labels.map(eg => this.eggGroupColors[eg] || '#888888');
        
        if (labels.length === 0) {
            if (this.eggChart) {
                this.eggChart.destroy();
                this.eggChart = null;
            }
            return;
        }
        
        if (this.eggChart) {
            const currentLabels = [...this.eggChart.data.labels].sort();
            const newLabels = [...labels].sort();
            const labelsChanged = JSON.stringify(currentLabels) !== JSON.stringify(newLabels);
            
            if (labelsChanged) {
                this.eggChart.data.labels = labels;
                this.eggChart.data.datasets[0].data = data;
                this.eggChart.data.datasets[0].backgroundColor = backgroundColors;
                this.eggChart.update('none');
            } else {
                const existingLabels = this.eggChart.data.labels;
                const reorderedData = existingLabels.map(label => eggGroupCounts[label] || 0);
                const reorderedColors = existingLabels.map(label => this.eggGroupColors[label] || '#888888');
                this.eggChart.data.datasets[0].data = reorderedData;
                this.eggChart.data.datasets[0].backgroundColor = reorderedColors;
                this.eggChart.update({ duration: 300 });
            }
        } else {
            this.eggChart = new Chart(this.eggChartCanvas, {
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
        this.updateDashboard();
    }
}
