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
                minBst: 0,
                maxBst: 0,
                minCaptureRate: 0,
                avgCaptureRate: 0,
                maxCaptureRate: 0,
                hard5CaptureRate: [],
                easiest5CaptureRate: [],
                alerts: [],
                typeCounts: {},
                eggGroupCounts: {},
                bstDistribution: {
                    '< 300': 0,
                    '300-399': 0,
                    '400-499': 0,
                    '500-599': 0,
                    '600+': 0
                }
            };
        }

        const count = dex.length;
        const typeCounts = {};
        const eggGroupCounts = {};
        let totalBst = 0;
        let minBst = Infinity;
        let maxBst = -Infinity;
        let totalCaptureRate = 0;
        let minCaptureRate = Infinity;
        let maxCaptureRate = -Infinity;
        let pseudoCount = 0;
        let legendaryCount = 0;

        dex.forEach(p => {
            // Types
            p.types.forEach(t => {
                typeCounts[t] = (typeCounts[t] || 0) + 1;
            });
            
            // Egg Groups
            if (p.eggGroups) {
                p.eggGroups.forEach(eg => {
                    eggGroupCounts[eg] = (eggGroupCounts[eg] || 0) + 1;
                });
            }

            // BST
            totalBst += p.bst;
            if (p.bst < minBst) minBst = p.bst;
            if (p.bst > maxBst) maxBst = p.bst;
            
            // Capture Rate
            const cr = p.captureRate || 0;
            totalCaptureRate += cr;
            if (cr < minCaptureRate) minCaptureRate = cr;
            if (cr > maxCaptureRate) maxCaptureRate = cr;

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

        // BST Distribution buckets
        const bstBuckets = {
            '< 300': 0,
            '300-399': 0,
            '400-499': 0,
            '500-599': 0,
            '600+': 0
        };
        dex.forEach(p => {
            if (p.bst < 300) bstBuckets['< 300']++;
            else if (p.bst < 400) bstBuckets['300-399']++;
            else if (p.bst < 500) bstBuckets['400-499']++;
            else if (p.bst < 600) bstBuckets['500-599']++;
            else bstBuckets['600+']++;
        });

        // Hard 5 by capture rate (lowest = hardest to catch)
        const hard5CaptureRate = [...dex]
            .sort((a, b) => (a.captureRate || 0) - (b.captureRate || 0))
            .slice(0, 5)
            .map(p => ({ name: p.name, captureRate: p.captureRate || 0 }));
        
        // Easiest 5 by capture rate (highest = easiest to catch)
        const easiest5CaptureRate = [...dex]
            .sort((a, b) => (b.captureRate || 0) - (a.captureRate || 0))
            .slice(0, 5)
            .map(p => ({ name: p.name, captureRate: p.captureRate || 0 }));

        return {
            count,
            topType: `${topType} (${maxTypeCount})`,
            avgBst,
            minBst,
            maxBst,
            minCaptureRate: minCaptureRate === Infinity ? 0 : minCaptureRate,
            avgCaptureRate: Math.round(totalCaptureRate / count),
            maxCaptureRate: maxCaptureRate === -Infinity ? 0 : maxCaptureRate,
            hard5CaptureRate,
            easiest5CaptureRate,
            alerts: this.alerts,
            typeCounts,
            eggGroupCounts,
            bstDistribution: bstBuckets
        };
    }
}
