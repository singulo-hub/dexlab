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
        
        // Tooltip element for capture chart outliers
        this.captureTooltip = null;
        
        // Type colors
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

    /**
     * Update all charts with stats data
     */
    updateCharts(stats) {
        this.updateTypeChart(stats.typeCounts);
        this.updateBstChart(stats.bstDistribution);
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
     * Update the BST Distribution bar chart
     */
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
                                stepSize: 1
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
