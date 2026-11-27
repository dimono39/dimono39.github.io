// ============================================================
// МОДУЛЬ «ПРОВЕРКА ЕЖЕДНЕВНОГО МЕНЮ»
// Сравнивает загруженное фактическое меню с выбранным днём типового:
// приёмы пищи, разделы, наименования блюд и выход (вес).
// Дополнительно прогоняет правила контроля качества (СанПиН).
// ============================================================

const CheckModule = (function () {
    'use strict';

    const MEAL_TYPES = ['breakfast', 'breakfast2', 'lunch', 'afternoonSnack', 'dinner', 'dinner2'];
    const MEAL_NAMES = {
        breakfast: 'Завтрак',
        breakfast2: 'Второй завтрак',
        lunch: 'Обед',
        afternoonSnack: 'Полдник',
        dinner: 'Ужин',
        dinner2: 'Второй ужин'
    };

    const state = {
        fileName: null,
        fileDate: null,
        actualMeals: null,   // { breakfast: [{section,name,weight,...}], ... }
        templateDayKey: null,
        result: null
    };

    // ---------- утилиты ----------
    function norm(str) {
        return String(str === undefined || str === null ? '' : str).replace(/\u00a0/g, ' ').trim();
    }

    function toNumber(value) {
        if (typeof value === 'number') return isFinite(value) ? value : 0;
        const n = parseFloat(norm(value).replace(/\s/g, '').replace(',', '.'));
        return isFinite(n) ? n : 0;
    }

    // Разбирает значение ячейки/строки в дату (Date, «ДД.ММ.ГГГГ», «ГГГГ-ММ-ДД»)
    function parseDateValue(value) {
        if (value === undefined || value === null || value === '') return null;
        if (value instanceof Date && !isNaN(value.getTime())) {
            return new Date(value.getFullYear(), value.getMonth(), value.getDate());
        }
        const s = norm(value);
        let m = s.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})$/);
        if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
        m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
        if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
        return null;
    }

    function formatDate(date) {
        if (!date) return '';
        const dd = String(date.getDate()).padStart(2, '0');
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        return `${dd}.${mm}.${date.getFullYear()}`;
    }

    // Годовая дата из имени файла: ГГГГ-ММ-ДД-sm.xlsx
    function dateFromFileName(fileName) {
        const m = String(fileName || '').match(/(\d{4})-(\d{2})-(\d{2})/);
        if (!m) return null;
        return new Date(+m[1], +m[2] - 1, +m[3]);
    }

    // Приводит название раздела к единому виду
    function normalizeSection(section) {
        const s = norm(section).toLowerCase().replace(/ё/g, 'е').replace(/[.,]/g, ' ').replace(/\s+/g, ' ').trim();
        if (!s) return '';
        const map = {
            'гор блюдо': 'гор.блюдо', 'горячее блюдо': 'гор.блюдо', 'горячее': 'гор.блюдо',
            'гор напиток': 'гор.напиток', 'горячий напиток': 'гор.напиток',
            'хлеб': 'хлеб', 'хлеб белый': 'хлеб бел.', 'хлеб бел': 'хлеб бел.',
            'хлеб черный': 'хлеб черн.', 'хлеб черн': 'хлеб черн.',
            'фрукты': 'фрукты', 'фрукт': 'фрукты', 'свежие фрукты': 'фрукты', 'фрукт свежий': 'фрукты',
            'закуска': 'закуска', 'закуски': 'закуска',
            '1 блюдо': '1 блюдо', 'первое блюдо': '1 блюдо', '1-е блюдо': '1 блюдо', 'первое': '1 блюдо',
            '2 блюдо': '2 блюдо', 'второе блюдо': '2 блюдо', '2-е блюдо': '2 блюдо', 'второе': '2 блюдо',
            '3 блюдо': '3 блюдо', 'третье блюдо': '3 блюдо', '3-е блюдо': '3 блюдо',
            'гарнир': 'гарнир',
            'напиток': 'напиток', 'напитки': 'напиток',
            'булочное': 'булочное', 'булочные изделия': 'булочное', 'выпечка': 'булочное',
            'кисломол': 'кисломол.', 'кисломолочный напиток': 'кисломол.', 'кисломолочные продукты': 'кисломол.',
            'сладкое': 'сладкое', 'кондитерские изделия': 'сладкое'
        };
        return map[s] || s;
    }

    // Приводит название приёма пищи к ключу
    function normalizeMealName(name) {
        const s = norm(name).toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ');
        if (!s) return null;
        if (/^(завтрак\s*2|2\s*-?\s*й?\s*завтрак|второй завтрак)/.test(s)) return 'breakfast2';
        if (/^завтрак/.test(s)) return 'breakfast';
        if (/^обед/.test(s)) return 'lunch';
        if (/^полдник/.test(s)) return 'afternoonSnack';
        if (/^(ужин\s*2|2\s*-?\s*й?\s*ужин|второй ужин)/.test(s)) return 'dinner2';
        if (/^ужин/.test(s)) return 'dinner';
        return null;
    }

    // ---------- день типового меню ----------
    function getTemplateData() {
        return window.templateMenuData || window.currentTemplateData || null;
    }

    function listTemplateDays() {
        const data = getTemplateData();
        if (!data || !data.weeks) return [];
        const list = [];
        const weeks = Object.keys(data.weeks).map(Number).sort((a, b) => a - b);
        weeks.forEach(w => {
            Object.keys(data.weeks[w] || {}).map(Number).sort((a, b) => a - b).forEach(d => {
                const dayData = data.weeks[w][d] || {};
                let dishes = 0;
                MEAL_TYPES.forEach(mt => {
                    dishes += ((dayData[mt] && dayData[mt].items) || []).filter(i => norm(i.name)).length;
                });
                list.push({ week: w, day: d, key: `${w}_${d}`, number: list.length + 1, dishes: dishes });
            });
        });
        return list;
    }

    function getTemplateDay(dayKey) {
        const data = getTemplateData();
        if (!data || !data.weeks || !dayKey) return null;
        const [w, d] = String(dayKey).split('_');
        return data.weeks[w] && data.weeks[w][d] ? data.weeks[w][d] : null;
    }

    // ---------- разбор загруженного файла ----------
    function findHeaderRow(rows) {
        for (let i = 0; i < Math.min(rows.length, 15); i++) {
            const cells = (rows[i] || []).map(c => norm(c).toLowerCase());
            const hasMeal = cells.some(c => c.includes('прием') || c.includes('приём'));
            const hasDish = cells.some(c => c.includes('блюдо'));
            if (hasMeal && hasDish) return i;
        }
        for (let i = 0; i < Math.min(rows.length, 15); i++) {
            const cells = (rows[i] || []).map(c => norm(c).toLowerCase());
            if (cells.some(c => c.includes('раздел')) && cells.some(c => c.includes('блюдо'))) return i;
        }
        return -1;
    }

    function findColumn(header, variants) {
        for (const variant of variants) {
            const idx = header.findIndex(h => h.includes(variant));
            if (idx >= 0) return idx;
        }
        return -1;
    }

    function parseWorkbook(workbook) {
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        if (!sheet) return null;
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true, blankrows: false });
        if (!rows.length) return null;

        const headerIdx = findHeaderRow(rows);
        if (headerIdx < 0) return { error: 'Не найден заголовок таблицы (Прием пищи / Раздел / Блюдо / Выход)' };

        const header = (rows[headerIdx] || []).map(c => norm(c).toLowerCase());
        const cols = {
            meal: findColumn(header, ['прием', 'приём']),
            section: findColumn(header, ['раздел']),
            recipe: findColumn(header, ['рец']),
            name: findColumn(header, ['блюдо', 'наименование']),
            weight: findColumn(header, ['выход', 'вес']),
            price: findColumn(header, ['цена', 'стоим']),
            calories: findColumn(header, ['калор', 'ккал', 'энерг']),
            proteins: findColumn(header, ['белк', 'белки']),
            fats: findColumn(header, ['жир']),
            carbs: findColumn(header, ['углевод'])
        };
        if (cols.name < 0) return { error: 'В файле не найден столбец «Блюдо»' };

        const meals = {};
        MEAL_TYPES.forEach(mt => { meals[mt] = []; });
        let currentMeal = null;
        let schoolName = '';
        let fileDate = null;
        let dateSource = null;

        // ---- дата меню: ячейка J1 (или ячейка после слова «День») ----
        const headRows = rows.slice(0, Math.min(rows.length, 6));
        outer:
        for (let i = 0; i < headRows.length; i++) {
            const row = headRows[i] || [];
            for (let j = 0; j < row.length; j++) {
                const text = norm(row[j]).toLowerCase();
                if (text === 'день' || text === 'дата') {
                    for (let k = j + 1; k < Math.min(row.length, j + 4); k++) {
                        const parsed = parseDateValue(row[k]);
                        if (parsed) { fileDate = parsed; dateSource = 'J1'; break outer; }
                    }
                }
            }
        }

        // явно J1 = 10-я колонка (индекс 9)
        if (!fileDate) {
            const j1 = parseDateValue((rows[0] || [])[9]);
            if (j1) { fileDate = j1; dateSource = 'J1'; }
        }

        // шапка файла: школа
        for (let i = 0; i < headerIdx; i++) {
            const row = rows[i] || [];
            row.forEach((cell, j) => {
                const text = norm(cell);
                if (/^школ/i.test(text) && norm(row[j + 1])) schoolName = norm(row[j + 1]);
            });
        }

        for (let i = headerIdx + 1; i < rows.length; i++) {
            const row = rows[i] || [];
            const mealCell = cols.meal >= 0 ? norm(row[cols.meal]) : '';
            if (mealCell) {
                const key = normalizeMealName(mealCell);
                if (key) currentMeal = key;
            }
            const name = norm(row[cols.name]);
            if (!name || !currentMeal) continue;

            meals[currentMeal].push({
                section: normalizeSection(cols.section >= 0 ? row[cols.section] : ''),
                sectionRaw: norm(cols.section >= 0 ? row[cols.section] : ''),
                name: name,
                weight: toNumber(row[cols.weight]),
                price: toNumber(row[cols.price]),
                calories: toNumber(row[cols.calories]),
                proteins: toNumber(row[cols.proteins]),
                fats: toNumber(row[cols.fats]),
                carbs: toNumber(row[cols.carbs]),
                recipeId: norm(cols.recipe >= 0 ? row[cols.recipe] : '')
            });
        }

        const totalDishes = MEAL_TYPES.reduce((s, mt) => s + meals[mt].length, 0);
        if (!totalDishes) return { error: 'В файле не найдено ни одного блюда' };

        return { meals, schoolName, fileDate, dateSource };
    }

    // ---------- сравнение с типовым днём ----------
    function compareWithTemplate(actualMeals, templateDay) {
        const mealResults = [];
        const stats = {
            mealsExpected: 0, mealsFound: 0, mealsFullMatch: 0,
            expected: 0, actual: 0, matched: 0, weightDiff: 0, sectionDiff: 0, missing: 0, extra: 0
        };

        MEAL_TYPES.forEach(mt => {
            const expectedItems = ((templateDay[mt] && templateDay[mt].items) || []).filter(i => norm(i.name));
            const actualItems = (actualMeals[mt] || []).slice();
            stats.actual += actualItems.length;
            if (!expectedItems.length) {
                if (actualItems.length) {
                    stats.extra += actualItems.length;
                    mealResults.push({
                        meal: mt, expected: [], actual: actualItems, rows: actualItems.map(item => ({
                            expected: null, actual: item, status: 'extra', note: 'Лишнее блюдо (нет в типовом меню)'
                        })), matched: 0, total: 0, fullMatch: false
                    });
                }
                return;
            }

            stats.mealsExpected++;
            if (actualItems.length) stats.mealsFound++;

            const used = new Set();
            const rows = [];
            let matched = 0;

            expectedItems.forEach(exp => {
                const expName = norm(exp.name);
                const expSection = normalizeSection(exp.section);
                const expWeight = toNumber(exp.weight);
                stats.expected++;

                // 1) точное совпадение: раздел + наименование + вес
                let idx = actualItems.findIndex((a, i) =>
                    !used.has(i) && a.name === expName && a.section === expSection && Math.round(a.weight) === Math.round(expWeight));
                if (idx >= 0) {
                    used.add(idx);
                    matched++;
                    stats.matched++;
                    rows.push({ expected: exp, actual: actualItems[idx], status: 'ok', note: 'Совпадает' });
                    return;
                }

                // 2) совпало наименование, но отличается вес
                idx = actualItems.findIndex((a, i) => !used.has(i) && a.name === expName && a.section === expSection);
                if (idx >= 0) {
                    used.add(idx);
                    stats.weightDiff++;
                    rows.push({
                        expected: exp, actual: actualItems[idx], status: 'weight',
                        note: `Выход ${Math.round(actualItems[idx].weight)} г вместо ${Math.round(expWeight)} г`
                    });
                    return;
                }

                // 3) совпало наименование, но другой раздел
                idx = actualItems.findIndex((a, i) => !used.has(i) && a.name === expName);
                if (idx >= 0) {
                    used.add(idx);
                    stats.sectionDiff++;
                    rows.push({
                        expected: exp, actual: actualItems[idx], status: 'section',
                        note: `Раздел «${actualItems[idx].sectionRaw || '—'}» вместо «${exp.section || '—'}»`
                    });
                    return;
                }

                // 4) блюда нет
                stats.missing++;
                rows.push({ expected: exp, actual: null, status: 'missing', note: 'Блюдо отсутствует в фактическом меню' });
            });

            actualItems.forEach((item, i) => {
                if (used.has(i)) return;
                stats.extra++;
                rows.push({ expected: null, actual: item, status: 'extra', note: 'Лишнее блюдо (нет в типовом меню)' });
            });

            const fullMatch = rows.every(r => r.status === 'ok');
            if (fullMatch) stats.mealsFullMatch++;
            mealResults.push({
                meal: mt, expected: expectedItems, actual: actualItems, rows: rows,
                matched: matched, total: expectedItems.length, fullMatch: fullMatch
            });
        });

        // Соответствие = доля строк, в которых совпали раздел, наименование И выход.
        // Лишние блюда увеличивают знаменатель, поэтому 100% возможно только при
        // полном совпадении набора блюд (раздел + блюдо + выход).
        const rowsTotal = stats.expected;
        const rowsActual = stats.actual;
        const denominator = Math.max(rowsTotal, rowsActual);
        const overall = denominator > 0 ? Math.round(stats.matched / denominator * 100) : 0;
        const mealsPart = stats.mealsExpected ? Math.round(stats.mealsFullMatch / stats.mealsExpected * 100) : 100;

        return {
            mealResults, stats, overall,
            rowsPart: overall,
            mealPart: mealsPart,
            dishPart: overall,
            rowsTotal: rowsTotal,
            rowsActual: rowsActual
        };
    }

    // ---------- правила контроля качества ----------
    function buildDayStructure(meals) {
        const day = {};
        MEAL_TYPES.forEach(mt => {
            day[mt] = { items: (meals[mt] || []).map(item => ({
                section: item.section,
                name: item.name,
                weight: item.weight,
                calories: item.calories,
                proteins: item.proteins,
                fats: item.fats,
                carbs: item.carbs,
                recipeId: item.recipeId,
                price: item.price
            })) };
        });
        return { weeks: { 1: { 1: day } } };
    }

    function runRules(meals) {
        try {
            if (typeof window.runAllRules === 'function') {
                return window.runAllRules(buildDayStructure(meals)) || [];
            }
        } catch (e) {
            console.warn('Ошибка правил:', e);
        }
        return [];
    }

    // ---------- отрисовка ----------
    function bjuRatio(meals) {
        let p = 0, f = 0, c = 0;
        MEAL_TYPES.forEach(mt => (meals[mt] || []).forEach(i => { p += i.proteins; f += i.fats; c += i.carbs; }));
        if (p <= 0) return { text: '—', p, f, c, total: p + f + c };
        return {
            text: [1, Math.round(f / p * 10) / 10, Math.round(c / p * 10) / 10].join(' : '),
            p, f, c, total: p + f + c
        };
    }

    function statusChip(ok, textOk, textBad) {
        return ok
            ? `<span class="check-meal-status" style="background:#dcfce7;color:#15803d;">✅ ${textOk}</span>`
            : `<span class="check-meal-status" style="background:#fee2e2;color:#b91c1c;">❌ ${textBad}</span>`;
    }

    function renderResults() {
        const res = state.result;
        if (!res) return;

        const summaryEl = document.getElementById('checkSummary');
        const mealsEl = document.getElementById('checkMeals');
        const rulesEl = document.getElementById('checkRules');

        // Панель даты/календаря и вердикт «то или не то меню»
        renderDatePanel();
        renderCalendarBanner();

        const s = res.stats;
        const totals = bjuRatio(state.actualMeals);
        let weight = 0, kcal = 0, price = 0;
        MEAL_TYPES.forEach(mt => (state.actualMeals[mt] || []).forEach(i => {
            weight += i.weight; kcal += i.calories; price += i.price;
        }));

        const overallColor = res.overall >= 90 ? '#15803d' : res.overall >= 60 ? '#b45309' : '#b91c1c';
        const extraNote = s.extra > 0 ? ` · лишних: ${s.extra}` : '';
        summaryEl.innerHTML = `
            <div class="check-card">
                <div class="k">Соответствие типовому</div>
                <div class="v" style="color:${overallColor};">${res.overall}%</div>
                <div class="s">строки: ${s.matched} из ${Math.max(res.rowsTotal, res.rowsActual)}${extraNote}</div>
            </div>
            <div class="check-card">
                <div class="k">Приёмы пищи</div>
                <div class="v">${s.mealsFullMatch} / ${s.mealsExpected}</div>
                <div class="s">совпали полностью · найдено: ${s.mealsFound}</div>
            </div>
            <div class="check-card">
                <div class="k">Блюда (раздел + блюдо + выход)</div>
                <div class="v">${s.matched} / ${s.expected}</div>
                <div class="s">выход ≠: ${s.weightDiff} · раздел ≠: ${s.sectionDiff} · нет: ${s.missing}${extraNote}</div>
            </div>
            <div class="check-card">
                <div class="k">День по факту</div>
                <div class="v">${Math.round(kcal)} ккал</div>
                <div class="s">${Math.round(weight)} г · ${price.toFixed(2)} ₽ · БЖУ ${totals.text}</div>
            </div>
        `;

        let mealsHtml = '';
        res.mealResults.forEach(m => {
            const title = MEAL_NAMES[m.meal] || m.meal;
            const status = m.total === 0
                ? '<span class="check-meal-status" style="background:#e2e8f0;color:#475569;">нет в типовом меню</span>'
                : statusChip(m.fullMatch, 'совпадает полностью', `совпало ${m.matched} из ${m.total}`);

            let rowsHtml = '';
            m.rows.forEach(r => {
                const exp = r.expected;
                const act = r.actual;
                const markClass = r.status === 'ok' ? 'ok' : r.status === 'weight' || r.status === 'section' ? 'warn' : 'bad';
                const markText = r.status === 'ok' ? '✅' : r.status === 'weight' || r.status === 'section' ? '⚠️' : '❌';
                rowsHtml += `<tr>
                    <td>${exp ? (exp.section || '—') : '—'}</td>
                    <td>${exp ? escapeHtml(exp.name) : '—'}</td>
                    <td style="text-align:right;">${exp ? Math.round(exp.weight) : '—'}</td>
                    <td>${act ? (act.sectionRaw || act.section || '—') : '—'}</td>
                    <td>${act ? escapeHtml(act.name) : '—'}</td>
                    <td style="text-align:right;">${act ? Math.round(act.weight) : '—'}</td>
                    <td><span class="check-mark ${markClass}">${markText}</span> ${escapeHtml(r.note)}</td>
                </tr>`;
            });

            mealsHtml += `<section class="check-meal">
                <header>
                    <span class="check-meal-title">${title} <span style="font-size:0.72rem;font-weight:500;color:#94a3b8;">в типовом: ${m.total} · по факту: ${m.actual.length}</span></span>
                    ${status}
                </header>
                <table class="check-meal-table">
                    <thead>
                        <tr>
                            <th>Раздел (типовое)</th><th>Блюдо (типовое)</th><th style="text-align:right;">Выход, г</th>
                            <th>Раздел (факт)</th><th>Блюдо (факт)</th><th style="text-align:right;">Выход, г</th>
                            <th>Результат</th>
                        </tr>
                    </thead>
                    <tbody>${rowsHtml || '<tr><td colspan="7" style="color:#94a3b8;font-style:italic;">Нет данных</td></tr>'}</tbody>
                </table>
            </section>`;
        });
        mealsEl.innerHTML = mealsHtml;

        const violations = runRules(state.actualMeals);
        if (violations.length) {
            const items = violations.slice(0, 40).map(v => {
                const meal = v.meal ? (MEAL_NAMES[v.meal] || v.meal) : 'День';
                const critical = v.code === 15;
                return `<div class="check-rule-item">
                    <span class="check-mark ${critical ? 'bad' : 'warn'}">${critical ? '❌' : '⚠️'}</span>
                    <span><strong>${meal}:</strong> ${escapeHtml(v.details || '')}</span>
                </div>`;
            }).join('');
            rulesEl.innerHTML = `<div class="check-rules">
                <h4><i class="fas fa-list-check" style="color:#0284c7;"></i> Аналитика по правилам (${violations.length})</h4>
                ${items}
                ${violations.length > 40 ? `<div class="check-rule-item" style="color:#94a3b8;">…и ещё ${violations.length - 40}</div>` : ''}
            </div>`;
        } else {
            rulesEl.innerHTML = `<div class="check-rules">
                <h4><i class="fas fa-circle-check" style="color:#15803d;"></i> Аналитика по правилам</h4>
                <div class="check-rule-item"><span class="check-mark ok">✅</span> Нарушений правил не найдено</div>
            </div>`;
        }
    }

    function escapeHtml(str) {
        return String(str === undefined || str === null ? '' : str)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    // ---------- состояние UI ----------
    function refreshDayList() {
        const select = document.getElementById('checkTemplateDay');
        if (!select) return;
        const days = listTemplateDays();
        if (!days.length) {
            select.innerHTML = '<option value="">Типовое меню не загружено</option>';
            return;
        }
        const selected = state.templateDayKey || days[0].key;
        select.innerHTML = days.map(d =>
            `<option value="${d.key}" ${d.key === selected ? 'selected' : ''}>Меню ${d.number} — Неделя ${d.week}, День ${d.day} · ${d.dishes} блюд</option>`
        ).join('');
        state.templateDayKey = select.value;
    }

    function setFileInfo(text) {
        const el = document.getElementById('checkFileInfo');
        if (!el) return;
        if (!text) { el.style.display = 'none'; el.innerHTML = ''; return; }
        el.style.display = 'block';
        el.innerHTML = text;
    }

    function showEmpty() {
        const empty = document.getElementById('checkEmpty');
        const results = document.getElementById('checkResults');
        if (empty) empty.style.display = '';
        if (results) results.style.display = 'none';
    }

    function showResults() {
        const empty = document.getElementById('checkEmpty');
        const results = document.getElementById('checkResults');
        if (empty) empty.style.display = 'none';
        if (results) results.style.display = '';
    }

    function recompute() {
        renderDatePanel();
        if (!state.actualMeals) { showEmpty(); return; }
        const templateDay = getTemplateDay(state.templateDayKey);
        if (!templateDay) {
            showEmpty();
            return;
        }
        state.result = compareWithTemplate(state.actualMeals, templateDay);
        showResults();
        renderResults();
    }

    // ---------- работа с файлом ----------
    function handleFile(file) {
        if (!file) return;
        if (typeof XLSX === 'undefined') {
            setFileInfo('<span style="color:#b91c1c;">Библиотека XLSX не загружена — проверьте интернет.</span>');
            return;
        }
        state.fileName = file.name;
        setFileInfo(`<i class="fas fa-file-excel" style="color:#15803d;"></i> <strong>${escapeHtml(file.name)}</strong> — читаем…`);

        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const workbook = XLSX.read(new Uint8Array(e.target.result), { type: 'array', cellDates: true });
                const parsed = parseWorkbook(workbook);
                if (!parsed || parsed.error) {
                    setFileInfo(`<span style="color:#b91c1c;">${escapeHtml((parsed && parsed.error) || 'Не удалось прочитать файл')}</span>`);
                    return;
                }
                state.actualMeals = parsed.meals;

                // Дата: сначала ячейка J1/«День», затем имя файла
                if (parsed.fileDate) {
                    state.fileDate = parsed.fileDate;
                    state.dateSource = parsed.dateSource || 'J1';
                } else {
                    const fromName = dateFromFileName(file.name);
                    state.fileDate = fromName || null;
                    state.dateSource = fromName ? 'name' : null;
                }

                const totalDishes = MEAL_TYPES.reduce((s, mt) => s + parsed.meals[mt].length, 0);
                const mealsWithItems = MEAL_TYPES.filter(mt => parsed.meals[mt].length).length;
                const dateLabel = state.fileDate ? formatDate(state.fileDate) : 'не найдена';
                const dateSourceLabel = state.dateSource === 'J1' ? 'ячейка J1' : state.dateSource === 'name' ? 'имя файла' : '—';

                setFileInfo(`<i class="fas fa-file-excel" style="color:#15803d;"></i> <strong>${escapeHtml(file.name)}</strong><br>
                    дата меню: <strong>${dateLabel}</strong> <span style="color:#94a3b8;">(${dateSourceLabel})</span> ·
                    приёмов пищи: <strong>${mealsWithItems}</strong> · блюд: <strong>${totalDishes}</strong>
                    ${parsed.schoolName ? `<br>школа: ${escapeHtml(parsed.schoolName)}` : ''}`);

                applyCalendarSelection();
                state.manualSelected = false;
                recompute();
            } catch (err) {
                console.error(err);
                setFileInfo(`<span style="color:#b91c1c;">Ошибка чтения файла: ${escapeHtml(err.message || err)}</span>`);
            }
        };
        reader.onerror = function () {
            setFileInfo('<span style="color:#b91c1c;">Не удалось прочитать файл</span>');
        };
        reader.readAsArrayBuffer(file);
    }

    // ---------- календарь питания: какое меню назначено на дату ----------
    const MONTH_NAMES = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];

    function resolveCalendarByDate(date) {
        if (!date) return { status: 'no-date' };
        const calModule = window.CalendarModule;
        const cal = calModule && calModule.getState ? calModule.getState() : null;
        if (!cal || !cal.calendarData || !Object.keys(cal.calendarData).length) {
            return { status: 'no-calendar' };
        }

        const monthName = MONTH_NAMES[date.getMonth()];
        const monthKey = Object.keys(cal.calendarData).find(k => String(k).toLowerCase() === monthName);
        if (!monthKey) return { status: 'no-month', dateLabel: formatDate(date) };

        const entry = (cal.calendarData[monthKey] || []).find(e => Number(e.day) === date.getDate());
        if (!entry) return { status: 'no-day', dateLabel: formatDate(date), monthKey };

        const value = entry.value;
        if (value === null || value === undefined || value === '' || Number(value) === 0) {
            return { status: 'no-menu', dateLabel: formatDate(date), monthKey, day: date.getDate() };
        }

        const menuNumber = Number(value);
        const days = listTemplateDays();
        const target = days.find(d => d.number === menuNumber) || null;

        return {
            status: 'ok',
            dateLabel: formatDate(date),
            monthKey,
            day: date.getDate(),
            menuNumber: menuNumber,
            dayKey: target ? target.key : null,
            week: target ? target.week : null,
            dayInWeek: target ? target.day : null,
            exists: !!target
        };
    }

    // Подставляет день типового меню по календарю (если он есть)
    function applyCalendarSelection() {
        state.calendar = resolveCalendarByDate(state.fileDate);
        if (state.calendar.status === 'ok' && state.calendar.dayKey) {
            state.templateDayKey = state.calendar.dayKey;
            state.calendarApplied = true;
            const select = document.getElementById('checkTemplateDay');
            if (select) select.value = state.calendar.dayKey;
        } else {
            state.calendarApplied = false;
        }
    }

    // ---------- панель «Дата и календарь» ----------
    function renderDatePanel() {
        const el = document.getElementById('checkDatePanel');
        if (!el) return;

        if (!state.fileDate) {
            el.innerHTML = `<div class="check-date-empty">
                <i class="fas fa-calendar-xmark"></i>
                <div>Дата не найдена ни в ячейке J1, ни в имени файла.<br>
                Выберите день типового меню вручную.</div>
            </div>`;
            return;
        }

        const srcLabel = state.dateSource === 'J1' ? 'ячейка J1' : state.dateSource === 'name' ? 'из имени файла' : '';
        const cal = state.calendar || { status: 'no-calendar' };
        let calHtml = '';

        if (cal.status === 'ok') {
            const matchesManual = state.templateDayKey === cal.dayKey;
            calHtml = `
                <div class="check-cal-row ok">
                    <i class="fas fa-circle-check"></i>
                    <div>
                        <div><strong>Меню #${cal.menuNumber}</strong> — Неделя ${cal.week}, День ${cal.dayInWeek}</div>
                        <div class="check-cal-note">назначено по календарю питания${matchesManual ? ' · выбрано для сравнения' : ''}</div>
                    </div>
                </div>
                ${!matchesManual ? `<div class="check-cal-row warn">
                    <i class="fas fa-triangle-exclamation"></i>
                    <div>Для сравнения выбран другой день. <a href="#" id="checkUseCalendarDay">Взять день из календаря</a></div>
                </div>` : ''}`;
        } else if (cal.status === 'no-menu') {
            calHtml = `<div class="check-cal-row warn">
                <i class="fas fa-triangle-exclamation"></i>
                <div>По календарю на эту дату <strong>меню не назначено</strong> (выходной или пустая ячейка).</div>
            </div>`;
        } else if (cal.status === 'no-calendar') {
            calHtml = `<div class="check-cal-row info">
                <i class="fas fa-circle-info"></i>
                <div>Календарь питания не загружен — сравнение идёт с днём, выбранным вручную.</div>
            </div>`;
        } else if (cal.status === 'no-day' || cal.status === 'no-month') {
            calHtml = `<div class="check-cal-row warn">
                <i class="fas fa-triangle-exclamation"></i>
                <div>Этой даты нет в календаре питания.</div>
            </div>`;
        }

        el.innerHTML = `
            <div class="check-date-value">
                <i class="fas fa-calendar-day"></i>
                <span>${formatDate(state.fileDate)}</span>
                ${srcLabel ? `<span class="check-date-source">${srcLabel}</span>` : ''}
            </div>
            ${calHtml}
        `;

        const useCalBtn = el.querySelector('#checkUseCalendarDay');
        if (useCalBtn) {
            useCalBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (state.calendar && state.calendar.dayKey) {
                    state.templateDayKey = state.calendar.dayKey;
                    state.manualSelected = false;
                    const select = document.getElementById('checkTemplateDay');
                    if (select) select.value = state.calendar.dayKey;
                    recompute();
                }
            });
        }
    }

    // ---------- баннер-вердикт по календарю ----------
    function renderCalendarBanner() {
        const el = document.getElementById('checkCalendarBanner');
        if (!el) return;
        if (!state.fileDate) {
            el.innerHTML = '';
            return;
        }

        const cal = state.calendar || { status: 'no-calendar' };
        const percent = state.result ? state.result.overall : null;
        const compliant = percent !== null && percent >= 100;

        if (cal.status === 'ok') {
            const manualDiffers = state.templateDayKey !== cal.dayKey;
            if (manualDiffers) {
                const days = listTemplateDays();
                const manual = days.find(d => d.key === state.templateDayKey);
                el.innerHTML = `<div class="check-banner warn">
                    <i class="fas fa-triangle-exclamation"></i>
                    <div>
                        <strong>По календарю питания на ${cal.dateLabel} назначено меню #${cal.menuNumber}</strong>
                        (Неделя ${cal.week}, День ${cal.dayInWeek}), а для сравнения выбран
                        ${manual ? `Меню ${manual.number} (Неделя ${manual.week}, День ${manual.day})` : 'другой день'}.
                        Результат ниже относится к выбранному дню.
                    </div>
                </div>`;
            } else {
                const res = state.result;
                const rowsInfo = res ? ` · строки: ${res.stats.matched} из ${Math.max(res.rowsTotal, res.rowsActual)}` : '';
                el.innerHTML = `<div class="check-banner ${compliant ? 'ok' : 'bad'}">
                    <i class="fas fa-${compliant ? 'circle-check' : 'circle-xmark'}"></i>
                    <div>
                        <strong>${compliant ? 'Меню соответствует' : 'Меню не соответствует'} календарю питания</strong><br>
                        На ${cal.dateLabel} по календарю назначено меню #${cal.menuNumber}
                        (Неделя ${cal.week}, День ${cal.dayInWeek}) · соответствие типовому: <strong>${percent}%</strong>${rowsInfo}
                    </div>
                </div>`;
            }
        } else if (cal.status === 'no-menu') {
            el.innerHTML = `<div class="check-banner warn">
                <i class="fas fa-triangle-exclamation"></i>
                <div><strong>По календарю питания на ${cal.dateLabel} меню не назначено.</strong><br>
                Проверять соответствие нечему: день в календаре пустой или помечен как выходной.</div>
            </div>`;
        } else if (cal.status === 'no-calendar') {
            el.innerHTML = `<div class="check-banner info">
                <i class="fas fa-circle-info"></i>
                <div><strong>Календарь питания не загружен.</strong> Невозможно проверить, то ли меню загружено на ${cal.dateLabel || formatDate(state.fileDate)} —
                сравнение идёт с днём типового меню, выбранным вручную. Загрузите календарь на вкладке «Календарь».</div>
            </div>`;
        } else {
            el.innerHTML = `<div class="check-banner warn">
                <i class="fas fa-triangle-exclamation"></i>
                <div><strong>Даты ${formatDate(state.fileDate)} нет в календаре питания.</strong>
                Сравнение идёт с днём, выбранным вручную.</div>
            </div>`;
        }
    }

    // ---------- инициализация ----------
    function init() {
        refreshDayList();

        const input = document.getElementById('checkFileInput');
        const dropzone = document.getElementById('checkDropzone');
        const select = document.getElementById('checkTemplateDay');

        if (input) {
            input.addEventListener('change', function () {
                if (this.files && this.files[0]) handleFile(this.files[0]);
            });
        }

        if (dropzone) {
            ['dragenter', 'dragover'].forEach(evt => dropzone.addEventListener(evt, e => {
                e.preventDefault();
                dropzone.classList.add('dragover');
            }));
            ['dragleave', 'drop'].forEach(evt => dropzone.addEventListener(evt, e => {
                e.preventDefault();
                dropzone.classList.remove('dragover');
            }));
            dropzone.addEventListener('drop', e => {
                const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
                if (file) handleFile(file);
            });
        }

        if (select) {
            select.addEventListener('change', function () {
                state.templateDayKey = this.value;
                state.manualSelected = true;
                recompute();
            });
        }
    }

    function onTabShow() {
        refreshDayList();
        // Календарь могли загрузить после файла: подставляем день, если пользователь
        // не выбрал день вручную
        if (state.fileDate && !state.manualSelected) {
            applyCalendarSelection();
        }
        renderDatePanel();
        if (state.actualMeals) recompute();
    }

    return {
        init: init,
        onTabShow: onTabShow,
        refreshDayList: refreshDayList,
        getState: function () { return state; }
    };
})();

// Делаем модуль доступным глобально (const не попадает в window сам по себе)
window.CheckModule = CheckModule;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { CheckModule.init(); });
} else {
    CheckModule.init();
}
