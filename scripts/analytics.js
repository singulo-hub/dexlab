export class Analytics {
    constructor() {
        this.alerts = [];
    }

    analyze(dex) {
        this.alerts = [];
        if (!dex || dex.length === 0) {
            return {
                count: 0,
                evolutionDepthCounts: { 1: 0, 2: 0, 3: 0 },
                legendaryCount: 0,
                mythicalCount: 0,
                pseudoCount: 0,
                lateEvolutionCount: 0,
                rareType: '-',
                commonType: '-',
                rareEggGroup: '-',
                commonEggGroup: '-',
                avgBst: 0,
                minBst: 0,
                maxBst: 0,
                minCaptureRate: 0,
                avgCaptureRate: 0,
                maxCaptureRate: 0,
                q1CaptureRate: 0,
                medianCaptureRate: 0,
                q3CaptureRate: 0,
                captureRateBoxPlot: null,
                alerts: [],
                typeCounts: {},
                eggGroupCounts: {},
                bstDistribution: {
                    '< 300': 0,
                    '300-399': 0,
                    '400-499': 0,
                    '500-599': 0,
                    '600+': 0
                },
                bstBoxPlot: null,
                medianBst: 0,
                q1Bst: 0,
                q3Bst: 0
            };
        }

        const count = dex.length;
        const typeCounts = {};
        const eggGroupCounts = {};
        const evolutionDepthCounts = { 1: 0, 2: 0, 3: 0 };
        const countedFamilies = new Set(); // Track which evolution families we've already counted
        let totalBst = 0;
        let minBst = Infinity;
        let maxBst = -Infinity;
        let totalCaptureRate = 0;
        let minCaptureRate = Infinity;
        let maxCaptureRate = -Infinity;
        let pseudoCount = 0;
        let legendaryCount = 0;
        let mythicalCount = 0;
        let lateEvolutionCount = 0;

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
            if (p.isMythical) mythicalCount++;
            if (p.isLateEvolution) lateEvolutionCount++;
            
            // Evolution depth - only count each family once
            // Use the family array as a key (sorted IDs joined)
            if (p.evolutionDepth >= 1 && p.evolutionDepth <= 3 && p.evolutionFamily) {
                const familyKey = p.evolutionFamily.join(',');
                if (!countedFamilies.has(familyKey)) {
                    countedFamilies.add(familyKey);
                    evolutionDepthCounts[p.evolutionDepth]++;
                }
            }
        });

        // Most Common Type (highest count)
        let commonType = '-';
        let maxTypeCount = 0;
        for (const [type, c] of Object.entries(typeCounts)) {
            if (c > maxTypeCount) {
                maxTypeCount = c;
                commonType = type;
            }
        }
        
        // Rare Type (lowest count)
        let rareType = '-';
        let minTypeCount = Infinity;
        for (const [type, c] of Object.entries(typeCounts)) {
            if (c < minTypeCount) {
                minTypeCount = c;
                rareType = type;
            }
        }
        
        // Most Common Egg Group (highest count)
        let commonEggGroup = '-';
        let maxEggCount = 0;
        for (const [egg, c] of Object.entries(eggGroupCounts)) {
            if (c > maxEggCount) {
                maxEggCount = c;
                commonEggGroup = egg;
            }
        }
        
        // Rare Egg Group (lowest count)
        let rareEggGroup = '-';
        let minEggCount = Infinity;
        for (const [egg, c] of Object.entries(eggGroupCounts)) {
            if (c < minEggCount) {
                minEggCount = c;
                rareEggGroup = egg;
            }
        }

        // Avg BST
        const avgBst = Math.round(totalBst / count);

        // Alerts
        if (legendaryCount > count * 0.08 && count > 15) {
            const pct = Math.round((legendaryCount / count) * 100);
            this.alerts.push(`High Legendary count (${legendaryCount}, ${pct}%)`);
        }
        if (pseudoCount > count * 0.1 && count > 15) {
            const pct = Math.round((pseudoCount / count) * 100);
            this.alerts.push(`High Pseudo count (${pseudoCount}, ${pct}%)`);
        }
        // Late evolution alert: if more than 25% of Pokemon require late-game evolution methods
        if (lateEvolutionCount > count * 0.25 && count > 15) {
            const pct = Math.round((lateEvolutionCount / count) * 100);
            this.alerts.push(`High late-game evolutions (${lateEvolutionCount}, ${pct}%)`);
        }
        const evenDistribution = 1 / Object.keys(typeCounts).length;
        if (maxTypeCount / count > evenDistribution * 1.75 && count > 15) {
            const pct = Math.round((maxTypeCount / count) * 100);
            this.alerts.push(`High ${commonType} type count (${maxTypeCount}, ${pct}%)`);
        }
        
        // Check for missing types (only if dex has more than 30 Pokemon)
        const allTypes = ['Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'];
        const missingTypes = allTypes.filter(t => !typeCounts[t]);
        if (missingTypes.length > 1 && count > 30) {
            this.alerts.push(`Missing types: ${missingTypes.join(', ')}`);
        }
        
        if (avgBst > 450) {
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

        // Helper function to calculate quartiles
        const getQuartile = (arr, q) => {
            const pos = (arr.length - 1) * q;
            const base = Math.floor(pos);
            const rest = pos - base;
            if (arr[base + 1] !== undefined) {
                return Math.round(arr[base] + rest * (arr[base + 1] - arr[base]));
            } else {
                return arr[base];
            }
        };

        // Calculate BST quartiles for box plot
        const sortedBst = [...dex]
            .map(p => p.bst)
            .sort((a, b) => a - b);
        
        const q1Bst = getQuartile(sortedBst, 0.25);
        const medianBst = getQuartile(sortedBst, 0.5);
        const q3Bst = getQuartile(sortedBst, 0.75);
        
        // Calculate BST outliers (values outside 1.5 * IQR)
        const bstIqr = q3Bst - q1Bst;
        const bstLowerFence = q1Bst - 1.5 * bstIqr;
        const bstUpperFence = q3Bst + 1.5 * bstIqr;
        
        // Get BST outliers with Pokemon names
        const bstOutlierPokemon = dex
            .filter(p => p.bst < bstLowerFence || p.bst > bstUpperFence)
            .map(p => ({ name: p.name, bst: p.bst }));
        
        const bstWhiskerMin = sortedBst.find(v => v >= bstLowerFence) || minBst;
        const bstWhiskerMax = [...sortedBst].reverse().find(v => v <= bstUpperFence) || maxBst;

        // Calculate quartiles for capture rate box plot
        const sortedCaptureRates = [...dex]
            .map(p => p.captureRate || 0)
            .sort((a, b) => a - b);
        
        const q1CaptureRate = getQuartile(sortedCaptureRates, 0.25);
        const medianCaptureRate = getQuartile(sortedCaptureRates, 0.5);
        const q3CaptureRate = getQuartile(sortedCaptureRates, 0.75);
        
        // Calculate outliers (values outside 1.5 * IQR)
        const iqr = q3CaptureRate - q1CaptureRate;
        const lowerFence = q1CaptureRate - 1.5 * iqr;
        const upperFence = q3CaptureRate + 1.5 * iqr;
        
        // Get outliers with Pokemon names
        const outlierPokemon = dex
            .filter(p => {
                const cr = p.captureRate || 0;
                return cr < lowerFence || cr > upperFence;
            })
            .map(p => ({ name: p.name, captureRate: p.captureRate || 0 }));
        
        const whiskerMin = sortedCaptureRates.find(v => v >= lowerFence) || minCaptureRate;
        const whiskerMax = [...sortedCaptureRates].reverse().find(v => v <= upperFence) || maxCaptureRate;

        return {
            count,
            evolutionDepthCounts,
            legendaryCount,
            mythicalCount,
            pseudoCount,
            lateEvolutionCount,
            rareType: `${rareType} (${minTypeCount === Infinity ? 0 : minTypeCount})`,
            commonType: `${commonType} (${maxTypeCount})`,
            rareEggGroup: `${rareEggGroup} (${minEggCount === Infinity ? 0 : minEggCount})`,
            commonEggGroup: `${commonEggGroup} (${maxEggCount})`,
            avgBst,
            minBst,
            maxBst,
            minCaptureRate: minCaptureRate === Infinity ? 0 : minCaptureRate,
            avgCaptureRate: Math.round(totalCaptureRate / count),
            maxCaptureRate: maxCaptureRate === -Infinity ? 0 : maxCaptureRate,
            q1CaptureRate,
            medianCaptureRate,
            q3CaptureRate,
            captureRateBoxPlot: {
                min: whiskerMin,
                q1: q1CaptureRate,
                median: medianCaptureRate,
                q3: q3CaptureRate,
                max: whiskerMax,
                outliers: outlierPokemon
            },
            alerts: this.alerts,
            typeCounts,
            eggGroupCounts,
            bstDistribution: bstBuckets,
            bstBoxPlot: {
                min: bstWhiskerMin,
                q1: q1Bst,
                median: medianBst,
                q3: q3Bst,
                max: bstWhiskerMax,
                outliers: bstOutlierPokemon
            },
            medianBst,
            q1Bst,
            q3Bst
        };
    }
}
