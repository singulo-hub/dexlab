export class UI {
    constructor(dataManager, analytics) {
        this.dataManager = dataManager;
        this.analytics = analytics;

        // Elements
        this.pokemonListEl = document.getElementById('pokemon-list');
        
        // Dashboard Elements
        this.statCountEl = document.querySelector('#stat-count p');
        this.rareTypeEl = document.getElementById('rare-type-val');
        this.commonTypeEl = document.getElementById('common-type-val');
        this.rareEggEl = document.getElementById('rare-egg-val');
        this.commonEggEl = document.getElementById('common-egg-val');
        this.statBstEl = document.getElementById('avg-bst-val');
        this.statMinBstEl = document.getElementById('min-bst-val');
        this.statMaxBstEl = document.getElementById('max-bst-val');
        this.statMinCrEl = document.getElementById('min-cr-val');
        this.statQ1CrEl = document.getElementById('q1-cr-val');
        this.statMedianCrEl = document.getElementById('median-cr-val');
        this.statQ3CrEl = document.getElementById('q3-cr-val');
        this.statMaxCrEl = document.getElementById('max-cr-val');
        this.alertListEl = document.getElementById('alert-list');

        // Modal
        this.modal = document.getElementById('template-modal');
        this.templateListEl = document.getElementById('template-list');
        
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
        
        // Capture Rate Chart
        this.captureChartCanvas = document.getElementById('capture-chart');
        this.captureChart = null;
        
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
        this.rareTypeEl.textContent = stats.rareType;
        this.commonTypeEl.textContent = stats.commonType;
        this.rareEggEl.textContent = stats.rareEggGroup;
        this.commonEggEl.textContent = stats.commonEggGroup;
        this.statBstEl.textContent = stats.avgBst;
        this.statMinBstEl.textContent = stats.minBst || '-';
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
        
        // Update Type Chart
        this.updateTypeChart(stats.typeCounts);
        
        // Update BST Chart
        this.updateBstChart(stats.bstDistribution);
        
        // Update Egg Group Chart
        this.updateEggChart(stats.eggGroupCounts);
        
        // Update Capture Rate Box Plot
        this.updateCaptureChart(stats.captureRateBoxPlot);
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
                    maintainAspectRatio: true,
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
                    maintainAspectRatio: true,
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
    
    updateCaptureChart(boxPlotData) {
        if (!boxPlotData) {
            if (this.captureChart) {
                this.captureChart.destroy();
                this.captureChart = null;
            }
            return;
        }
        
        const { min, q1, median, q3, max, outliers } = boxPlotData;
        
        // Draw box and whisker plot using a custom bar chart approach
        const ctx = this.captureChartCanvas.getContext('2d');
        
        if (this.captureChart) {
            this.captureChart.destroy();
        }
        
        // Create a custom plugin for drawing box and whisker plot
        const boxWhiskerPlugin = {
            id: 'boxWhisker',
            afterDatasetsDraw: (chart) => {
                const ctx = chart.ctx;
                const chartArea = chart.chartArea;
                const yScale = chart.scales.y;
                
                const centerX = (chartArea.left + chartArea.right) / 2;
                const boxWidth = Math.min(80, (chartArea.right - chartArea.left) * 0.4);
                
                // Get Y positions
                const minY = yScale.getPixelForValue(min);
                const q1Y = yScale.getPixelForValue(q1);
                const medianY = yScale.getPixelForValue(median);
                const q3Y = yScale.getPixelForValue(q3);
                const maxY = yScale.getPixelForValue(max);
                
                ctx.save();
                
                // Draw whisker lines (vertical lines from min to q1 and q3 to max)
                ctx.strokeStyle = '#888';
                ctx.lineWidth = 2;
                
                // Lower whisker (min to q1)
                ctx.beginPath();
                ctx.moveTo(centerX, minY);
                ctx.lineTo(centerX, q1Y);
                ctx.stroke();
                
                // Upper whisker (q3 to max)
                ctx.beginPath();
                ctx.moveTo(centerX, q3Y);
                ctx.lineTo(centerX, maxY);
                ctx.stroke();
                
                // Whisker caps
                const capWidth = boxWidth * 0.5;
                ctx.beginPath();
                ctx.moveTo(centerX - capWidth / 2, minY);
                ctx.lineTo(centerX + capWidth / 2, minY);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(centerX - capWidth / 2, maxY);
                ctx.lineTo(centerX + capWidth / 2, maxY);
                ctx.stroke();
                
                // Draw box (q1 to q3)
                ctx.fillStyle = 'rgba(0, 122, 204, 0.6)';
                ctx.strokeStyle = '#007acc';
                ctx.lineWidth = 2;
                ctx.fillRect(centerX - boxWidth / 2, q3Y, boxWidth, q1Y - q3Y);
                ctx.strokeRect(centerX - boxWidth / 2, q3Y, boxWidth, q1Y - q3Y);
                
                // Draw median line
                ctx.strokeStyle = '#4ec9b0';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(centerX - boxWidth / 2, medianY);
                ctx.lineTo(centerX + boxWidth / 2, medianY);
                ctx.stroke();
                
                // Draw outliers and store their positions for tooltips
                chart.outlierPositions = [];
                if (outliers && outliers.length > 0) {
                    ctx.fillStyle = '#f44336';
                    outliers.forEach(outlier => {
                        const y = yScale.getPixelForValue(outlier.captureRate);
                        ctx.beginPath();
                        ctx.arc(centerX, y, 5, 0, Math.PI * 2);
                        ctx.fill();
                        // Store position for tooltip detection
                        chart.outlierPositions.push({
                            x: centerX,
                            y: y,
                            name: outlier.name,
                            captureRate: outlier.captureRate
                        });
                    });
                }
                
                ctx.restore();
            }
        };
        
        this.captureChart = new Chart(this.captureChartCanvas, {
            type: 'scatter',
            data: {
                datasets: [{
                    data: [] // Empty data, we draw everything in plugin
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: false
                    }
                },
                scales: {
                    x: {
                        display: false,
                        min: 0,
                        max: 1
                    },
                    y: {
                        min: 0,
                        max: 255,
                        ticks: {
                            color: '#888',
                            stepSize: 50
                        },
                        grid: {
                            color: '#3e3e42'
                        },
                        title: {
                            display: true,
                            text: 'Rate',
                            color: '#888'
                        }
                    }
                }
            },
            plugins: [boxWhiskerPlugin]
        });
        
        // Add custom tooltip for outliers
        this.setupCaptureChartTooltip();
    }
    
    setupCaptureChartTooltip() {
        // Create tooltip element if it doesn't exist
        if (!this.captureTooltip) {
            this.captureTooltip = document.createElement('div');
            this.captureTooltip.className = 'capture-chart-tooltip';
            this.captureTooltip.style.cssText = `
                position: absolute;
                background: #252526;
                border: 1px solid #3e3e42;
                border-radius: 4px;
                padding: 6px 10px;
                font-size: 0.8rem;
                color: #d4d4d4;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.15s;
                z-index: 100;
                white-space: nowrap;
            `;
            document.body.appendChild(this.captureTooltip);
        }
        
        const canvas = this.captureChartCanvas;
        const tooltip = this.captureTooltip;
        const chart = this.captureChart;
        
        // Remove existing listeners
        canvas.removeEventListener('mousemove', canvas._tooltipHandler);
        canvas.removeEventListener('mouseleave', canvas._tooltipLeaveHandler);
        
        // Add mousemove handler
        canvas._tooltipHandler = (e) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            // Check if mouse is near any outlier
            const outlierPositions = chart.outlierPositions || [];
            let foundOutlier = null;
            
            for (const outlier of outlierPositions) {
                const distance = Math.sqrt(
                    Math.pow(mouseX - outlier.x, 2) + 
                    Math.pow(mouseY - outlier.y, 2)
                );
                if (distance <= 10) {
                    foundOutlier = outlier;
                    break;
                }
            }
            
            if (foundOutlier) {
                tooltip.innerHTML = `<strong>${foundOutlier.name}</strong><br>Capture Rate: ${foundOutlier.captureRate}`;
                tooltip.style.opacity = '1';
                tooltip.style.left = `${e.clientX + 10}px`;
                tooltip.style.top = `${e.clientY - 10}px`;
            } else {
                tooltip.style.opacity = '0';
            }
        };
        
        canvas._tooltipLeaveHandler = () => {
            tooltip.style.opacity = '0';
        };
        
        canvas.addEventListener('mousemove', canvas._tooltipHandler);
        canvas.addEventListener('mouseleave', canvas._tooltipLeaveHandler);
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
