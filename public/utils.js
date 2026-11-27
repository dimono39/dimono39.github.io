// ============================================================
// МОДУЛЬ ОКРУГЛЕНИЯ ПО ТР ТС 022/2011 «Пищевая продукция в части
// ее маркировки» (приложение — правила указания пищевой ценности)
// ============================================================
// Энергетическая ценность (ккал):
//   < 1 ккал            → 1
//   1–5 ккал            → до целого
//   6–100 ккал          → до 5
//   > 100 ккал          → до 10
// Белки, жиры, углеводы (г):
//   < 0,5 г             → до 0,1
//   0,5–10 г            → до 0,5
//   > 10 г              → до целого
// Масса порции (выход, г) указывается целым числом.
// ============================================================

const RoundingModule = (function() {
    'use strict';

    // Приводит вход к числу: пустые/некорректные значения → 0, отрицательные → 0
    function toNumber(value) {
        const n = parseFloat(String(value === undefined || value === null ? '' : value).replace(',', '.'));
        if (!isFinite(n) || n <= 0) return 0;
        return n;
    }

    /**
     * Округляет значение калорийности по правилам ТР ТС 022/2011.
     * @param {number} value - Значение в ккал.
     * @returns {number} Округленное значение (0 для пустого/нулевого).
     */
    function roundCalories(value) {
        const v = toNumber(value);
        if (v === 0) return 0;
        if (v < 1) return 1;
        if (v <= 5) return Math.round(v);
        if (v <= 100) {
            // Округление до ближайшего, кратного 5
            return Math.round(v / 5) * 5;
        }
        // Округление до ближайшего, кратного 10
        return Math.round(v / 10) * 10;
    }

    /**
     * Округляет значение БЖУ по правилам ТР ТС 022/2011.
     * @param {number} value - Значение в граммах.
     * @returns {number} Округленное значение (0 для пустого/нулевого).
     */
    function roundNutrient(value) {
        const v = toNumber(value);
        if (v === 0) return 0;
        if (v < 0.5) {
            // До одного знака после запятой
            return Math.round(v * 10) / 10;
        }
        if (v <= 10) {
            // Округление до ближайшего, кратного 0.5
            return Math.round(v / 0.5) * 0.5;
        }
        // Округление до ближайшего целого
        return Math.round(v);
    }

    /**
     * Округляет вес порции (выход блюда) — целые граммы.
     */
    function roundWeight(value) {
        return Math.round(toNumber(value));
    }

    /**
     * Применяет правила округления ко всем блюдам в структуре меню.
     * @param {Object} menuData - Объект меню (типовое или ежедневное).
     * @returns {Object} Новый объект меню с округленными значениями.
     */
    function applyRoundingToMenu(menuData) {
        // Глубокое копирование, чтобы не изменять исходные данные
        const roundedMenu = JSON.parse(JSON.stringify(menuData));
        const mealTypes = ['breakfast', 'breakfast2', 'lunch', 'afternoonSnack', 'dinner', 'dinner2'];

        for (const w in roundedMenu.weeks) {
            for (const d in roundedMenu.weeks[w]) {
                const day = roundedMenu.weeks[w][d];
                for (const mt of mealTypes) {
                    const meal = day[mt];
                    if (meal && meal.items) {
                        for (const item of meal.items) {
                            // Вес и калории
                            if (item.weight !== undefined) {
                                item.weight = roundWeight(item.weight);
                            }
                            if (item.calories !== undefined) {
                                item.calories = roundCalories(item.calories);
                            }
                            // БЖУ
                            if (item.proteins !== undefined) {
                                item.proteins = roundNutrient(item.proteins);
                            }
                            if (item.fats !== undefined) {
                                item.fats = roundNutrient(item.fats);
                            }
                            if (item.carbs !== undefined) {
                                item.carbs = roundNutrient(item.carbs);
                            }
                        }
                    }
                }
            }
        }
        return roundedMenu;
    }

    return {
        roundCalories: roundCalories,
        roundNutrient: roundNutrient,
        roundWeight: roundWeight,
        applyRoundingToMenu: applyRoundingToMenu
    };
})();

// Делаем модуль глобальным для использования в других частях
window.RoundingModule = RoundingModule;