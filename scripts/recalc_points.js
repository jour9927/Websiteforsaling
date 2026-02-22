const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function getBaseRange(generation) {
    switch (generation) {
        case 9: return { min: 500, max: 5000 };
        case 8: return { min: 5000, max: 10000 };
        case 7: return { min: 10000, max: 50000 };
        case 6: return { min: 50000, max: 120000 };
        case 5: return { min: 120000, max: 220000 };
        case 4: return { min: 250000, max: 460000 };
        case 3: return { min: 650000, max: 1200000 };
        default: return { min: 500, max: 5000 };
    }
}

function getLangScore(ot) {
    if (!ot) return 0.10;
    ot = String(ot);
    // Pure Korean
    if (/[가-힣]/.test(ot) && !/[ぁ-んァ-ヶー]/.test(ot) && !/[A-Za-z]/.test(ot)) return 0.30;
    // Mixed Korean
    if (/[가-힣]/.test(ot)) return 0.22;
    // Pure Japanese
    if (/[ァ-ヶー]/.test(ot) && !/[A-Za-z]/.test(ot)) return 0.18;
    // Mixed Japanese
    if (/[ァ-ヶー]/.test(ot)) return 0.14;
    // English
    if (/[A-Za-z]/.test(ot)) return 0.06;
    return 0.10;
}

function getMethodScore(method) {
    if (!method) return 0.03;
    method = String(method);
    if (method.includes('現場') || method.includes('活動')) return 0.12;
    if (method.includes('序號') || method.includes('序列')) return 0.08;
    if (method.includes('紅外線')) return 0.10;
    if (method.includes('HOME')) return 0.05;
    return 0.03;
}

function getAgeScore(periodStart) {
    if (!periodStart) return 0.08;
    const start = new Date(periodStart).getTime();
    const now = new Date().getTime();
    const diffYears = (now - start) / (1000 * 60 * 60 * 24 * 365.25);
    return Math.min(0.15, 0.15 * (diffYears / 20));
}

function getIdHashInt(id) {
    // Take first 8 chars of hex string with no hyphens
    const hex = String(id).split('-')[0].replace(/-/g, '').padStart(8, '0').slice(0, 8);
    return parseInt(hex, 16);
}

const fossilOverrides = ['冰雪龍', '寶寶暴龍', '鰓魚龍'];

async function main() {
    console.log("Fetching distributions...");
    let allDistributions = [];
    let from = 0;
    const step = 1000;
    while (true) {
        const { data, error } = await supabase.from('distributions').select('*').range(from, from + step - 1);
        if (error) {
            console.error(error);
            process.exit(1);
        }
        if (data.length === 0) break;
        allDistributions = allDistributions.concat(data);
        from += step;
    }
    console.log(`Fetched ${allDistributions.length} distributions.`);

    const updates = [];

    for (const dist of allDistributions) {
        let points = 0;

        // Override 1: Fossils
        if (fossilOverrides.includes(dist.pokemon_name)) {
            points = 900000 + (Math.abs(getIdHashInt(dist.id)) % 90000);
        }
        // Manual overrides
        else if (dist.pokemon_name?.includes('太陽岩') && dist.generation === 7) { points = 740068; }
        else if (dist.pokemon_name?.includes('炎武王')) { points = 990082; }
        else if (dist.pokemon_name?.includes('月石')) { points = 1230089; }
        else if (dist.pokemon_name?.includes('瑪夏多') && dist.original_trainer?.includes('天青')) { points = 960053; }
        else if (dist.pokemon_name?.includes('謝米') && dist.original_trainer?.includes('鶴山')) { points = 1650073; }
        else if (dist.pokemon_name?.includes('六尾')) { points = 570052; } // (Note: original logic applied this broadly)
        else if (dist.pokemon_name?.includes('大劍鬼')) { points = 1772883; }
        else if (dist.pokemon_name?.includes('君主蛇')) { points = 1532323; }
        else if (dist.pokemon_name?.includes('落托姆') && dist.original_trainer?.includes('LINE')) { points = 666382; }
        else if ((dist.pokemon_name?.includes('袋獸') || dist.pokemon_name?.includes('Kangaskhan')) &&
            (dist.original_trainer?.includes('2015 Spring') || dist.original_trainer?.includes('봄') ||
                (dist.distribution_period_start && dist.distribution_period_start.startsWith('2015-0') &&
                    ['2015-03', '2015-04', '2015-05'].some(m => dist.distribution_period_start.startsWith(m))))) {
            points = 330052;
        }
        else if ((dist.pokemon_name?.includes('蒂安希') || dist.pokemon_name?.includes('Diancie')) &&
            (dist.original_trainer?.includes('univers') || dist.original_trainer?.includes('Universe') || dist.original_trainer?.includes('ユニバース'))) {
            points = 280052;
        }
        else {
            // Standard calculation
            const { min, max } = getBaseRange(dist.generation);
            const langScore = getLangScore(dist.original_trainer);
            const shinyScore = dist.is_shiny ? 0.15 : 0.0;
            const methodScore = getMethodScore(dist.distribution_method);
            const ageScore = getAgeScore(dist.distribution_period_start);

            const idInt = getIdHashInt(dist.id);
            const idOffset = (idInt % 10000) / 40000.0;
            const tailOffset = (idInt % 800) + 13;

            let scoreCombo = 0.15 + langScore + shinyScore + methodScore + ageScore + idOffset;
            if (scoreCombo > 1.0) scoreCombo = 1.0;

            let rawPoints = min + (max - min) * scoreCombo;
            let finalPoints = Math.max(min, Math.min(max - tailOffset, rawPoints));
            points = Math.floor(finalPoints);
        }

        // Only add if points differ
        if (points !== dist.points) {
            if (dist.points % 1000 === 0) {
                console.log(`Fixing round number for ${dist.pokemon_name}: ${dist.points} -> ${points}`);
            }
            updates.push({ id: dist.id, points });
        }
    }

    console.log(`Need to update ${updates.length} records.`);

    if (updates.length > 0) {
        console.log("Updating points...");
        const chunkSize = 50;
        for (let i = 0; i < updates.length; i += chunkSize) {
            const chunk = updates.slice(i, i + chunkSize);
            await Promise.all(chunk.map(u => supabase.from('distributions').update({ points: u.points }).eq('id', u.id)));
            console.log(`Processed ${i + chunk.length} / ${updates.length}`);
        }
        console.log("Successfully updated points!");
    }
}

main().catch(console.error);
