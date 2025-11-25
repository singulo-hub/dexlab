export class Analytics {
    constructor() {
        this.alerts = [];
    }

    analyze(dex) {
        this.alerts = [];
        if (!dex || dex.length === 0) {
            return {
                count: 0,
                topType: '-',
                avgBst: 0,
                alerts: []
            };
        }

        const count = dex.length;
        const typeCounts = {};
        let totalBst = 0;
        let pseudoCount = 0;
        let legendaryCount = 0;

        dex.forEach(p => {
            // Types
            p.types.forEach(t => {
                typeCounts[t] = (typeCounts[t] || 0) + 1;
            });

            // BST
            totalBst += p.bst;

            // Balance checks
            if (p.isPseudo) pseudoCount++;
            if (p.isLegendary) legendaryCount++;
        });

        // Top Type
        let topType = '-';
        let maxTypeCount = 0;
        for (const [type, c] of Object.entries(typeCounts)) {
            if (c > maxTypeCount) {
                maxTypeCount = c;
                topType = type;
            }
        }

        // Avg BST
        const avgBst = Math.round(totalBst / count);

        // Alerts
        if (legendaryCount > count * 0.1 && count > 10) {
            this.alerts.push(`High Legendary count (${legendaryCount})`);
        }
        if (pseudoCount > count * 0.1 && count > 10) {
            this.alerts.push(`High Pseudo count (${pseudoCount})`);
        }
        if (maxTypeCount > count * 0.3 && count > 10) {
            this.alerts.push(`Type imbalance: ${topType}`);
        }
        if (avgBst > 550) {
            this.alerts.push(`High Avg BST (${avgBst})`);
        }

        return {
            count,
            topType: `${topType} (${maxTypeCount})`,
            avgBst,
            alerts: this.alerts
        };
    }
}
