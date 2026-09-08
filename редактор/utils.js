// ============================================================
// МОДУЛЬ ОКРУГЛЕНИЯ ПО ТР ТС 022/2011
// ============================================================

const RoundingModule = (function() {
    'use strict';

    /**
     * Округляет значение калорийности по правилам ТР ТС 022/2011.
     * @param {number} value - Значение в ккал.
     * @returns {number} Округленное значение.
     */
    function roundCalories(value) {
        if (value < 1) return 1;
        if (value <= 5) return Math.round(value);
        if (value <= 100) {
            // Округление до ближайшего, кратного 5
            return Math.round(value / 5) * 5;
        }
        // Округление до ближайшего, кратного 10
        return Math.round(value / 10) * 10;
    }

    /**
     * Округляет значение БЖУ по правилам ТР ТС 022/2011.
     * @param {number} value - Значение в граммах.
     * @returns {number} Округленное значение.
     */
    function roundNutrient(value) {
        if (value < 0.5) {
            // До одного знака после запятой
            return Math.round(value * 10) / 10;
        }
        if (value <= 10) {
            // Округление до ближайшего, кратного 0.5
            return Math.round(value / 0.5) * 0.5;
        }
        // Округление до ближайшего целого
        return Math.round(value);
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
                            // Округляем калории
                            if (item.calories !== undefined) {
                                item.calories = roundCalories(item.calories);
                            }
                            // Округляем БЖУ
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
        applyRoundingToMenu: applyRoundingToMenu
    };
})();

// Делаем модуль глобальным для использования в других частях
window.RoundingModule = RoundingModule;