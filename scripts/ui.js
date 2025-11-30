import { ChartManager } from './managers/chartManager.js';
import { ModalManager } from './managers/modalManager.js';

export class UI {
    constructor(dataManager, analytics) {
        this.dataManager = dataManager;
        this.analytics = analytics;
        
        // Chart manager for all dashboard charts
        this.chartManager = new ChartManager();
        
        // Modal manager - pass callback for when dex changes
        this.modalManager = new ModalManager(dataManager, () => this.updateAll());

        // Elements
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
    }

    /**
     * Show the main modal menu
     */
    showModal() {
        this.modalManager.show();
    }

    /**
     * Show the export modal
     */
    showExportModal() {
        this.modalManager.showExport();
    }

    /**
     * Close the modal
     */
    closeModal() {
        this.modalManager.close();
    }

    /**
     * Initialize UI
     */
    init() {
        this.modalManager.init();
    }

    /**
     * Update the dex title in the header
     */
    updateDexTitle() {
        this.dexNameEl.textContent = this.dataManager.currentDexName;
    }

    /**
     * Update the dashboard with current stats
     */
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

    /**
     * Update all UI components
     */
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
