/**
 * ChartManager - Handles all dashboard chart rendering and updates
 */
export class ChartManager {
    constructor() {
        // Chart canvas elements
        this.typeChartCanvas = document.getElementById('type-chart');
        this.bstChartCanvas = document.getElementById('bst-chart');
        this.eggChartCanvas = document.getElementById('egg-chart');
        this.captureChartCanvas = document.getElementById('capture-chart');
        
        // Chart instances
        this.typeChart = null;
        this.bstChart = null;
        this.eggChart = null;
        this.captureChart = null;
        
        // Tooltip elements for box plot outliers
        this.captureTooltip = null;
        this.bstTooltip = null;
        
        // BST chart view mode: 'histogram' or 'boxplot'
        this.bstChartMode = 'histogram';
        
        // Store latest data for toggling
        this.bstDistribution = null;
        this.bstBoxPlotData = null;
        
        // Set up BST chart toggle
        this.setupBstChartToggle();
        
        // Type colors
        this.typeColors = {
            Normal: '#A8A77A',
            Fire: '#EE8130',
            Water: '#6390F0',
            Electric: '#F7D02C',
            Grass: '#7AC74C',
            Ice: '#96D9D6',
            Fighting: '#C22E28',
            Poison: '#A33EA1',
            Ground: '#E2BF65',
            Flying: '#A98FF3',
            Psychic: '#F95587',
            Bug: '#A6B91A',
            Rock: '#B6A136',
            Ghost: '#735797',
            Dragon: '#6F35FC',
            Dark: '#705746',
            Steel: '#B7B7CE',
            Fairy: '#D685AD'
        };
        
        // Egg group colors (from Bulbapedia)
        this.eggGroupColors = {
            Monster: '#97724C',
            'Water 1': '#6BD1F9',
            'Water 2': '#4B94ED',
            'Water 3': '#2271B4',
            Bug: '#AAC22A',
            Flying: '#90AFF1',
            Field: '#E5BA65',
            Fairy: '#FF9EB9',
            Grass: '#82D25A',
            'Human-Like': '#47B7AE',
            Mineral: '#979067',
            Amorphous: '#9F82CC',
            Ditto: '#B6AAD5',
            Dragon: '#5E57BF',
            'No Eggs': '#EFCF00',
            Indeterminate: '#0090C0'
        };
    }

    /**
     * Set up toggle between histogram and box plot for BST chart
     */
    setupBstChartToggle() {
        const toggle = document.getElementById('bst-chart-toggle');
        if (!toggle) return;
        
        toggle.addEventListener('click', () => {
            this.bstChartMode = this.bstChartMode === 'histogram' ? 'boxplot' : 'histogram';
            toggle.classList.toggle('boxplot-active', this.bstChartMode === 'boxplot');
            
            // Re-render the chart with current data
            if (this.bstChartMode === 'histogram' && this.bstDistribution) {
                this.renderBstHistogram(this.bstDistribution);
            } else if (this.bstChartMode === 'boxplot' && this.bstBoxPlotData) {
                this.renderBstBoxPlot(this.bstBoxPlotData);
            }
        });
    }

    /**
     * Update all charts with stats data
     */
    updateCharts(stats) {
        this.updateTypeChart(stats.typeCounts);
        this.updateBstChart(stats.bstDistribution, stats.bstBoxPlot);
        this.updateEggChart(stats.eggGroupCounts);
        this.updateCaptureChart(stats.captureRateBoxPlot);
    }

    /**
     * Update the Type Distribution pie chart
     */
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
                type: 'doughnut',
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

    /**
     * Update the BST Distribution chart (histogram or box plot)
     */
    updateBstChart(bstDistribution, bstBoxPlotData) {
        // Store data for toggle
        this.bstDistribution = bstDistribution;
        this.bstBoxPlotData = bstBoxPlotData;
        
        if (!bstDistribution) { return; }
        
        const data = Object.values(bstDistribution);
        const hasData = data.some(v => v > 0);
        
        if (!hasData) {
            if (this.bstChart) {
                this.bstChart.destroy();
                this.bstChart = null;
            }
            return;
        }
        
        // Render based on current mode
        if (this.bstChartMode === 'boxplot' && bstBoxPlotData) {
            this.renderBstBoxPlot(bstBoxPlotData);
        } else {
            this.renderBstHistogram(bstDistribution);
        }
    }

    /**
     * Render BST as histogram bar chart
     */
    renderBstHistogram(bstDistribution) {
        const labels = Object.keys(bstDistribution);
        const data = Object.values(bstDistribution);
        
        // Gradient colors from low BST (red) to high BST (purple)
        const bstColors = [
            '#f44336',  // < 300 - red
            '#ff9800',  // 300-399 - orange
            '#ffeb3b',  // 400-499 - yellow
            '#4caf50',  // 500-599 - green
            '#9c27b0'   // 600+ - purple
        ];
        
        if (this.bstChart) {
            this.bstChart.destroy();
            this.bstChart = null;
        }
        
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
                interaction: {
                    mode: 'index',
                    intersect: true
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: true,
                        callbacks: {
                            label: function(context) {
                                const count = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
                                return `${count} Pokémon (${percentage}%)`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#888',
                            stepSize: 5
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

    /**
     * Render BST as box and whisker plot
     */
    renderBstBoxPlot(boxPlotData) {
        if (!boxPlotData) return;
        
        const { min, q1, median, q3, max, outliers } = boxPlotData;
        
        if (this.bstChart) {
            this.bstChart.destroy();
            this.bstChart = null;
        }
        
        // Create a custom plugin for drawing box and whisker plot
        const boxWhiskerPlugin = {
            id: 'bstBoxWhisker',
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
                
                // Draw box (q1 to q3) - use gradient colors
                ctx.fillStyle = 'rgba(156, 39, 176, 0.6)'; // Purple to match BST theme
                ctx.strokeStyle = '#9c27b0';
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
                        const y = yScale.getPixelForValue(outlier.bst);
                        ctx.beginPath();
                        ctx.arc(centerX, y, 5, 0, Math.PI * 2);
                        ctx.fill();
                        // Store position for tooltip detection
                        chart.outlierPositions.push({
                            x: centerX,
                            y: y,
                            name: outlier.name,
                            bst: outlier.bst
                        });
                    });
                }
                
                ctx.restore();
            }
        };
        
        this.bstChart = new Chart(this.bstChartCanvas, {
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
                        min: 100,
                        max: 800,
                        ticks: {
                            color: '#888',
                            stepSize: 100
                        },
                        grid: {
                            color: '#3e3e42'
                        },
                        title: {
                            display: true,
                            text: 'BST',
                            color: '#888'
                        }
                    }
                }
            },
            plugins: [boxWhiskerPlugin]
        });
        
        // Add custom tooltip for outliers
        this.setupBstChartTooltip();
    }

    /**
     * Set up custom tooltip handling for BST chart outliers
     */
    setupBstChartTooltip() {
        // Create tooltip element if it doesn't exist
        if (!this.bstTooltip) {
            this.bstTooltip = document.createElement('div');
            this.bstTooltip.className = 'bst-chart-tooltip';
            this.bstTooltip.style.cssText = `
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
            document.body.appendChild(this.bstTooltip);
        }
        
        const canvas = this.bstChartCanvas;
        const tooltip = this.bstTooltip;
        const chart = this.bstChart;
        
        // Remove existing listeners
        canvas.removeEventListener('mousemove', canvas._bstTooltipHandler);
        canvas.removeEventListener('mouseleave', canvas._bstTooltipLeaveHandler);
        
        // Add mousemove handler
        canvas._bstTooltipHandler = (e) => {
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
                tooltip.innerHTML = `<strong>${foundOutlier.name}</strong><br>BST: ${foundOutlier.bst}`;
                tooltip.style.opacity = '1';
                tooltip.style.left = `${e.clientX + 10}px`;
                tooltip.style.top = `${e.clientY - 10}px`;
            } else {
                tooltip.style.opacity = '0';
            }
        };
        
        canvas._bstTooltipLeaveHandler = () => {
            tooltip.style.opacity = '0';
        };
        
        canvas.addEventListener('mousemove', canvas._bstTooltipHandler);
        canvas.addEventListener('mouseleave', canvas._bstTooltipLeaveHandler);
    }

    /**
     * Update the Egg Group Distribution horizontal bar chart
     */
    updateEggChart(eggGroupCounts) {
        if (!eggGroupCounts) { return; }
        
        // Sort by count descending for better visualization
        const sorted = Object.entries(eggGroupCounts).sort((a, b) => b[1] - a[1]);
        const labels = sorted.map(([label]) => label);
        const data = sorted.map(([, count]) => count);
        const backgroundColors = labels.map(eg => this.eggGroupColors[eg] || '#888888');
        
        if (labels.length === 0) {
            if (this.eggChart) {
                this.eggChart.destroy();
                this.eggChart = null;
            }
            return;
        }
        
        if (this.eggChart) {
            this.eggChart.data.labels = labels;
            this.eggChart.data.datasets[0].data = data;
            this.eggChart.data.datasets[0].backgroundColor = backgroundColors;
            this.eggChart.update({ duration: 300 });
        } else {
            this.eggChart = new Chart(this.eggChartCanvas, {
                type: 'bar',
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
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                        duration: 300
                    },
                    interaction: {
                        mode: 'y',
                        intersect: true
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            mode: 'y',
                            intersect: true,
                            callbacks: {
                                label: function(context) {
                                    const count = context.raw;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
                                    return `${count} Pokémon (${percentage}%)`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            beginAtZero: true,
                            ticks: {
                                color: '#888',
                                stepSize: 3
                            },
                            grid: {
                                color: '#3e3e42'
                            }
                        },
                        y: {
                            ticks: {
                                color: '#888',
                                font: {
                                    size: 10
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

    /**
     * Update the Capture Rate box and whisker plot
     */
    updateCaptureChart(boxPlotData) {
        if (!boxPlotData) {
            if (this.captureChart) {
                this.captureChart.destroy();
                this.captureChart = null;
            }
            return;
        }
        
        const { min, q1, median, q3, max, outliers } = boxPlotData;
        
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
                            stepSize: 25
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

    /**
     * Set up custom tooltip handling for capture chart outliers
     */
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
}
