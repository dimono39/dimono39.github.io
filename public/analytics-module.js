/**
 * ============================================================
 * МОДУЛЬ "АНАЛИТИКА МЕНЮ" v1.0
 * Подключаемый файл для PRO Редактора типового меню
 * ============================================================
 * 
 * Подключение в основном файле:
 * <script src="analytics-module.js"></script>
 * 
 * Затем вызовите:
 * AnalyticsModule.init();
 * ============================================================
 */

// ============================================================
// ДОПОЛНИТЕЛЬНЫЕ СТИЛИ ДЛЯ ДЕТАЛЬНОЙ СВОДКИ
// ============================================================
const DETAIL_STYLES = `
<style>
    .day-detail-enter {
        animation: dayDetailSlideIn 0.3s ease-out;
    }
    
    @keyframes dayDetailSlideIn {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .day-detail-card {
        transition: all 0.2s ease;
    }
    
    .day-detail-card:hover {
        transform: translateX(4px);
        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }
</style>
`;

// Добавляем стили при инициализации
function injectDetailStyles() {
    if (!document.getElementById('dayDetailStyles')) {
        const styleEl = document.createElement('style');
        styleEl.id = 'dayDetailStyles';
        styleEl.textContent = DETAIL_STYLES;
        document.head.appendChild(styleEl);
    }
}

// Вызываем в init()
injectDetailStyles();

const AnalyticsModule = (function() {
    'use strict';

    // ============================================================
    // СОСТОЯНИЕ МОДУЛЯ
    // ============================================================
    
    let state = {
        templateMenuData: null,
        schoolInfo: null,
        flatItems: [],
        allViolations: [],
        isSummerCamp: false,
        currentView: 'overview', // overview | days | meals | violations | bju
        filters: { week: 'all', meal: 'all', section: 'all', onlyViolations: false },
        comparePeriod: 'none', // none | prev-week | prev-period
        _sourceType: 'typical', // typical | daily
        _filteredFlat: [],
        _filteredStats: null
    };

    // ============================================================
    // ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
    // ============================================================
    
    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
    }

    function formatNumber(num) {
        if (num === undefined || num === null) return '0';
        return Number(num).toFixed(2);
    }

    function getColorByValue(value, min, max, reverse = false) {
        if (max === min) return '#10b981';
        const ratio = (value - min) / (max - min);
        const r = reverse ? Math.round(255 * ratio) : Math.round(255 * (1 - ratio));
        const g = reverse ? Math.round(255 * (1 - ratio)) : Math.round(255 * ratio);
        const b = 100;
        return `rgb(${r}, ${g}, ${b})`;
    }

    function getMealEmoji(mealType) {
        const map = {
            'breakfast': '🌅',
            'breakfast2': '🍎',
            'lunch': '🍲',
            'afternoonSnack': '🍪',
            'dinner': '🌙',
            'dinner2': '🥛'
        };
        return map[mealType] || '🍽️';
    }

    function getMealName(mealType) {
        const map = {
            'breakfast': 'Завтрак',
            'breakfast2': 'Второй завтрак',
            'lunch': 'Обед',
            'afternoonSnack': 'Полдник',
            'dinner': 'Ужин',
            'dinner2': 'Второй ужин'
        };
        return map[mealType] || mealType;
    }

    function getMealColor(mealType) {
        const map = {
            'breakfast': '#f59e0b',
            'breakfast2': '#f97316',
            'lunch': '#ef4444',
            'afternoonSnack': '#10b981',
            'dinner': '#8b5cf6',
            'dinner2': '#ec4899'
        };
        return map[mealType] || '#64748b';
    }

    function getWeekNumber(menuNumber) {
        if (menuNumber <= 5) return 1;
        if (menuNumber <= 10) return 2;
        return Math.ceil(menuNumber / 5);
    }

    function getDayInWeek(menuNumber) {
        const d = menuNumber % 5;
        return d === 0 ? 5 : d;
    }

    function normalizeSectionName(section) {
        if (!section) return '';
        const s = section.toLowerCase().trim();
        const map = {
            'горячее блюдо': 'гор.блюдо',
            'горячий напиток': 'гор.напиток',
            'первое блюдо': '1 блюдо',
            'второе блюдо': '2 блюдо',
            'хлеб белый': 'хлеб бел.',
            'хлеб черный': 'хлеб черн.',
            'булочные изделия': 'булочное',
            'кисломолочный напиток': 'кисломол.',
            'кисломолочные продукты': 'кисломол.',
            'свежие фрукты': 'фрукты',
            'фрукт свежий': 'фрукты',
            'фрукт': 'фрукты'
        };
        if (map[s]) return map[s];
        for (const [key, value] of Object.entries(map)) {
            if (s.includes(key)) return value;
        }
        return s;
    }

    function showStatus(msg, type = 'info') {
        if (window.showToast) { window.showToast(msg, type); return; }
        const el = document.getElementById('statusArea');
        if (el) {
            el.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i> ${msg}`;
            el.className = `status-message status-${type}`;
            el.style.display = 'flex';
            clearTimeout(el._timeout);
            el._timeout = setTimeout(() => { el.style.display = 'none'; }, 4000);
        }
    }

	// В analytics-module.js, обновим нормы

	const SANPIN_2026 = {
		// Возрастные категории по новому СанПиН
		ageGroups: {
			'7-11 лет': {
				name: 'Младший школьный возраст (7-11 лет)',
				meals: {
					breakfast: { weight: 470, calories: 470, proteins: 16, fats: 16, carbs: 63 },
					breakfast2: { weight: 180, calories: 180, proteins: 6, fats: 6, carbs: 24 },
					lunch: { weight: 660, calories: 660, proteins: 24, fats: 24, carbs: 88 },
					afternoonSnack: { weight: 280, calories: 240, proteins: 8, fats: 8, carbs: 32 },
					dinner: { weight: 470, calories: 470, proteins: 16, fats: 16, carbs: 63 },
					dinner2: { weight: 180, calories: 180, proteins: 6, fats: 6, carbs: 24 }
				}
			},
			'11-14 лет': {
				name: 'Средний школьный возраст (11-14 лет)',
				meals: {
					breakfast: { weight: 520, calories: 520, proteins: 18, fats: 18, carbs: 70 },
					breakfast2: { weight: 200, calories: 200, proteins: 7, fats: 7, carbs: 27 },
					lunch: { weight: 730, calories: 730, proteins: 27, fats: 27, carbs: 98 },
					afternoonSnack: { weight: 310, calories: 260, proteins: 9, fats: 9, carbs: 35 },
					dinner: { weight: 520, calories: 520, proteins: 18, fats: 18, carbs: 70 },
					dinner2: { weight: 200, calories: 200, proteins: 7, fats: 7, carbs: 27 }
				}
			},
			'14-18 лет': {
				name: 'Старший школьный возраст (14-18 лет)',
				meals: {
					breakfast: { weight: 570, calories: 570, proteins: 20, fats: 20, carbs: 76 },
					breakfast2: { weight: 220, calories: 220, proteins: 8, fats: 8, carbs: 29 },
					lunch: { weight: 800, calories: 800, proteins: 30, fats: 30, carbs: 107 },
					afternoonSnack: { weight: 340, calories: 280, proteins: 10, fats: 10, carbs: 37 },
					dinner: { weight: 570, calories: 570, proteins: 20, fats: 20, carbs: 76 },
					dinner2: { weight: 220, calories: 220, proteins: 8, fats: 8, carbs: 29 }
				}
			}
		}
	};

	// ============================================================
	// НОВЫЙ МОДУЛЬ: АНАЛИЗ СООТВЕТСТВИЯ САНПИН 2.3/2.4.4282-26
	// ============================================================

	function analyzeSanPinCompliance() {
		const data = state.templateMenuData;
		if (!data || !data.weeks) return null;

		const ageCategory = state.schoolInfo?.ageCategory || '7-11 лет';
		const norms = SANPIN_2026.ageGroups[ageCategory]?.meals || SANPIN_2026.ageGroups['7-11 лет'].meals;
		
		const results = {
			ageCategory: ageCategory,
			norms: norms,
			compliance: {},
			violations: [],
			recommendations: [],
			score: 100
		};

		const mealTypes = ['breakfast', 'breakfast2', 'lunch', 'afternoonSnack', 'dinner', 'dinner2'];
		let totalCompliance = 0;
		let totalMeals = 0;

		for (const mealType of mealTypes) {
			const norm = norms[mealType];
			if (!norm) continue;

			let mealData = [];
			let totalWeight = 0, totalCalories = 0, totalProteins = 0, totalFats = 0, totalCarbs = 0;
			let dayCount = 0;

			for (const w in data.weeks) {
				for (const d in data.weeks[w]) {
					const meal = data.weeks[w][d][mealType];
					if (meal && meal.items && meal.items.length > 0) {
						const dayWeight = meal.items.reduce((sum, i) => sum + (i.weight || 0), 0);
						const dayCalories = meal.items.reduce((sum, i) => sum + (i.calories || 0), 0);
						const dayProteins = meal.items.reduce((sum, i) => sum + (i.proteins || 0), 0);
						const dayFats = meal.items.reduce((sum, i) => sum + (i.fats || 0), 0);
						const dayCarbs = meal.items.reduce((sum, i) => sum + (i.carbs || 0), 0);

						mealData.push({ weight: dayWeight, calories: dayCalories, proteins: dayProteins, fats: dayFats, carbs: dayCarbs });
						totalWeight += dayWeight;
						totalCalories += dayCalories;
						totalProteins += dayProteins;
						totalFats += dayFats;
						totalCarbs += dayCarbs;
						dayCount++;
					}
				}
			}

			if (dayCount === 0) {
				results.compliance[mealType] = {
					status: 'missing',
					statusText: '❌ Отсутствует',
					days: 0
				};
				results.violations.push({
					meal: mealType,
					issue: 'Приём пищи отсутствует в меню',
					recommendation: `Добавьте ${getMealName(mealType)} в меню согласно СанПиН 2.3/2.4.4282-26`
				});
				continue;
			}

			const avgWeight = totalWeight / dayCount;
			const avgCalories = totalCalories / dayCount;
			const avgProteins = totalProteins / dayCount;
			const avgFats = totalFats / dayCount;
			const avgCarbs = totalCarbs / dayCount;

			// Проверка соответствия нормам
			const weightCompliant = avgWeight >= norm.weight;
			const caloriesCompliant = avgCalories >= norm.calories;
			const proteinsCompliant = avgProteins >= norm.proteins * 0.9; // допуск 10%
			const fatsCompliant = avgFats >= norm.fats * 0.9;
			const carbsCompliant = avgCarbs >= norm.carbs * 0.9;

			const complianceCount = [weightCompliant, caloriesCompliant, proteinsCompliant, fatsCompliant, carbsCompliant].filter(Boolean).length;
			const compliancePercent = Math.round((complianceCount / 5) * 100);

			let status, statusText, statusColor;
			if (compliancePercent >= 80) {
				status = 'good';
				statusText = '✅ Соответствует';
				statusColor = '#10b981';
			} else if (compliancePercent >= 50) {
				status = 'warning';
				statusText = '⚠️ Частично соответствует';
				statusColor = '#f59e0b';
			} else {
				status = 'bad';
				statusText = '❌ Не соответствует';
				statusColor = '#dc2626';
			}

			// Выявляем конкретные нарушения
			const violations = [];
			if (!weightCompliant) {
				const diff = norm.weight - avgWeight;
				violations.push(`Вес (${avgWeight.toFixed(0)}г < ${norm.weight}г, не хватает ${diff.toFixed(0)}г)`);
			}
			if (!caloriesCompliant) {
				const diff = norm.calories - avgCalories;
				violations.push(`Калорийность (${avgCalories.toFixed(0)}ккал < ${norm.calories}ккал, не хватает ${diff.toFixed(0)}ккал)`);
			}
			if (!proteinsCompliant) {
				violations.push(`Белки (${avgProteins.toFixed(1)}г < ${norm.proteins}г)`);
			}
			if (!fatsCompliant) {
				violations.push(`Жиры (${avgFats.toFixed(1)}г < ${norm.fats}г)`);
			}
			if (!carbsCompliant) {
				violations.push(`Углеводы (${avgCarbs.toFixed(1)}г < ${norm.carbs}г)`);
			}

			if (violations.length > 0) {
				results.violations.push({
					meal: mealType,
					issue: violations.join('; '),
					recommendation: generateRecommendation(mealType, violations, norm)
				});
			}

			results.compliance[mealType] = {
				status: status,
				statusText: statusText,
				statusColor: statusColor,
				avgWeight: avgWeight,
				avgCalories: avgCalories,
				avgProteins: avgProteins,
				avgFats: avgFats,
				avgCarbs: avgCarbs,
				norm: norm,
				days: dayCount,
				compliancePercent: compliancePercent,
				violations: violations,
				weightCompliant: weightCompliant,
				caloriesCompliant: caloriesCompliant
			};

			totalCompliance += compliancePercent;
			totalMeals++;
		}

		results.overallScore = totalMeals > 0 ? Math.round(totalCompliance / totalMeals) : 0;
		results.totalMeals = totalMeals;

		// Формируем общие рекомендации
		if (results.overallScore < 80) {
			results.recommendations.push({
				priority: 'high',
				text: 'Необходимо пересмотреть меню для соответствия новым нормам СанПиН 2.3/2.4.4282-26',
				details: 'Обратите внимание на весовые и калорийные нормы для каждого приёма пищи'
			});
		}

		return results;
	}

	function generateRecommendation(mealType, violations, norm) {
		const mealName = getMealName(mealType);
		const recommendations = [];
		
		for (const violation of violations) {
			if (violation.includes('Вес')) {
				recommendations.push(`увеличьте общий вес ${mealName} на 50-100г за счёт добавления гарнира или второго блюда`);
			}
			if (violation.includes('Калорийность')) {
				recommendations.push(`повысьте калорийность ${mealName} за счёт использования масла, сливок или более калорийных продуктов`);
			}
			if (violation.includes('Белки')) {
				recommendations.push(`добавьте белковые продукты в ${mealName} (мясо, рыба, яйца, бобовые)`);
			}
			if (violation.includes('Жиры')) {
				recommendations.push(`добавьте полезные жиры в ${mealName} (растительное масло, орехи, авокадо)`);
			}
			if (violation.includes('Углеводы')) {
				recommendations.push(`добавьте сложные углеводы в ${mealName} (крупы, макароны, хлеб)`);
			}
		}

		return recommendations.join('. ') + '.';
	}

    // ============================================================
    // АНАЛИТИЧЕСКИЕ ФУНКЦИИ
    // ============================================================

    function getMenuStatistics() {
        const data = state.templateMenuData;
        if (!data || !data.weeks) return null;

        const flat = state.flatItems;
        const violations = state.allViolations;

        // Общая статистика
        const totalWeeks = Object.keys(data.weeks).length;
        const totalDays = Object.keys(data.weeks).reduce((sum, w) => sum + Object.keys(data.weeks[w]).length, 0);
        const totalDishes = flat.length;
        const totalWeight = flat.reduce((s, i) => s + (i.weight || 0), 0);
        const totalCalories = flat.reduce((s, i) => s + (i.calories || 0), 0);
        const totalProteins = flat.reduce((s, i) => s + (i.proteins || 0), 0);
        const totalFats = flat.reduce((s, i) => s + (i.fats || 0), 0);
        const totalCarbs = flat.reduce((s, i) => s + (i.carbs || 0), 0);
        const totalPrice = flat.reduce((s, i) => s + (i.price || 0), 0);

        // Средние значения
        const avgWeightPerDay = totalDays > 0 ? totalWeight / totalDays : 0;
        const avgCaloriesPerDay = totalDays > 0 ? totalCalories / totalDays : 0;
        const avgProteinsPerDay = totalDays > 0 ? totalProteins / totalDays : 0;
        const avgFatsPerDay = totalDays > 0 ? totalFats / totalDays : 0;
        const avgCarbsPerDay = totalDays > 0 ? totalCarbs / totalDays : 0;
        const avgPricePerDay = totalDays > 0 ? totalPrice / totalDays : 0;

        // Статистика по приёмам пищи
        const mealsStats = {};
        const mealTypes = ['breakfast', 'breakfast2', 'lunch', 'afternoonSnack', 'dinner', 'dinner2'];
        
        for (const mt of mealTypes) {
            const items = flat.filter(i => i.meal === mt);
            const count = items.length;
            if (count === 0) continue;
            
            mealsStats[mt] = {
                count: count,
                weight: items.reduce((s, i) => s + (i.weight || 0), 0),
                calories: items.reduce((s, i) => s + (i.calories || 0), 0),
                proteins: items.reduce((s, i) => s + (i.proteins || 0), 0),
                fats: items.reduce((s, i) => s + (i.fats || 0), 0),
                carbs: items.reduce((s, i) => s + (i.carbs || 0), 0),
                price: items.reduce((s, i) => s + (i.price || 0), 0),
                avgWeight: items.reduce((s, i) => s + (i.weight || 0), 0) / count,
                avgCalories: items.reduce((s, i) => s + (i.calories || 0), 0) / count,
                daysWithMeal: 0
            };
        }

        // Количество дней с каждым приёмом пищи
        for (const w in data.weeks) {
            for (const d in data.weeks[w]) {
                for (const mt of mealTypes) {
                    const meal = data.weeks[w][d][mt];
                    if (meal && meal.items && meal.items.length > 0) {
                        if (mealsStats[mt]) {
                            mealsStats[mt].daysWithMeal++;
                        }
                    }
                }
            }
        }

        // Статистика по разделам
        const sectionsStats = {};
        for (const item of flat) {
            const section = normalizeSectionName(item.section) || 'Без раздела';
            if (!sectionsStats[section]) {
                sectionsStats[section] = {
                    count: 0,
                    weight: 0,
                    calories: 0,
                    proteins: 0,
                    fats: 0,
                    carbs: 0,
                    price: 0
                };
            }
            sectionsStats[section].count++;
            sectionsStats[section].weight += item.weight || 0;
            sectionsStats[section].calories += item.calories || 0;
            sectionsStats[section].proteins += item.proteins || 0;
            sectionsStats[section].fats += item.fats || 0;
            sectionsStats[section].carbs += item.carbs || 0;
            sectionsStats[section].price += item.price || 0;
        }

        // Статистика по дням
        const daysStats = {};
        for (const w in data.weeks) {
            for (const d in data.weeks[w]) {
                const key = `${w}_${d}`;
                daysStats[key] = {
                    week: parseInt(w),
                    day: parseInt(d),
                    weight: 0,
                    calories: 0,
                    proteins: 0,
                    fats: 0,
                    carbs: 0,
                    price: 0,
                    dishes: 0
                };
                for (const mt of mealTypes) {
                    const meal = data.weeks[w][d][mt];
                    if (meal && meal.items) {
                        for (const item of meal.items) {
                            daysStats[key].weight += item.weight || 0;
                            daysStats[key].calories += item.calories || 0;
                            daysStats[key].proteins += item.proteins || 0;
                            daysStats[key].fats += item.fats || 0;
                            daysStats[key].carbs += item.carbs || 0;
                            daysStats[key].price += item.price || 0;
                            daysStats[key].dishes++;
                        }
                    }
                }
            }
        }

        // Статистика нарушений
        const violationsStats = {
            total: violations.length,
            critical: violations.filter(v => v.code === 15).length,
            warnings: violations.filter(v => v.code !== 15 && v.code !== 17).length,
            duplicates: violations.filter(v => v.code === 17).length,
            byRule: {}
        };
        for (const v of violations) {
            const key = `Правило ${v.code}`;
            if (!violationsStats.byRule[key]) {
                violationsStats.byRule[key] = 0;
            }
            violationsStats.byRule[key]++;
        }

        // Соотношение БЖУ
        const totalBJU = totalProteins + totalFats + totalCarbs;
        const bjuRatio = totalBJU > 0 ? {
            proteins: (totalProteins / totalBJU) * 100,
            fats: (totalFats / totalBJU) * 100,
            carbs: (totalCarbs / totalBJU) * 100
        } : { proteins: 0, fats: 0, carbs: 0 };

        // Рекомендуемое соотношение БЖУ (1:1:4)
        const recommendedRatio = { proteins: 16.7, fats: 16.7, carbs: 66.6 };

        return {
            summary: {
                totalWeeks,
                totalDays,
                totalDishes,
                totalWeight,
                totalCalories,
                totalProteins,
                totalFats,
                totalCarbs,
                totalPrice,
                avgWeightPerDay,
                avgCaloriesPerDay,
                avgProteinsPerDay,
                avgFatsPerDay,
                avgCarbsPerDay,
                avgPricePerDay
            },
            meals: mealsStats,
            sections: sectionsStats,
            days: daysStats,
            violations: violationsStats,
            bju: {
                total: totalBJU,
                ratio: bjuRatio,
                recommended: recommendedRatio,
                proteins: totalProteins,
                fats: totalFats,
                carbs: totalCarbs
            }
        };
    }

    // ============================================================
    // ОТОБРАЖЕНИЕ АНАЛИТИКИ
    // ============================================================

	function renderAnalytics() {
		const container = document.getElementById('analyticsContent');
		if (!container) return;

		const data = state.templateMenuData;
		if (!data || !data.weeks || Object.keys(data.weeks).length === 0) {
			container.innerHTML = `
				<div style="padding: 60px 40px; text-align: center; color: #94a3b8;">
					<i class="fas fa-chart-pie fa-4x" style="margin-bottom: 16px; color: #cbd5e1;"></i>
					<h3 style="color: #0f172a; margin-bottom: 8px;">Нет данных для анализа</h3>
					<p style="font-size: 0.9rem;">Загрузите типовое меню на вкладке «Редактор меню»</p>
				</div>
			`;
			return;
		}

		// Пересчитываем dishes/violations ДО статистики: getMenuStatistics()
		// читает state.flatItems и state.allViolations, иначе сводка и таблица
		// БЖУ показывают устаревшие (нулевые) данные.
		state.flatItems = buildFlatFromTemplate(data);
		state.allViolations = runAllRules(data);

		const stats = getMenuStatistics();
		if (!stats) {
			container.innerHTML = '<p style="padding: 40px; text-align: center; color: #94a3b8;">Ошибка при анализе данных</p>';
			return;
		}
		let html = '';

		// ===== ШАПКА =====
		html += `
			<div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 24px;">
				<div style="display: flex; align-items: center; gap: 16px;">
					<div style="width: 48px; height: 48px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 16px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);">
						<i class="fas fa-chart-line" style="color: white; font-size: 20px;"></i>
					</div>
					<div>
						<h3 style="font-size: 1.2rem; font-weight: 700; color: #0f172a; margin: 0;">Аналитика меню</h3>
						<p style="font-size: 0.75rem; color: #64748b; margin: 0;">Детальный анализ типового меню</p>
					</div>
				</div>
				<div style="display: flex; gap: 8px; flex-wrap: wrap;">
					<button id="analyticsExportHTML" class="btn btn-primary" style="padding: 6px 16px; font-size: 0.75rem;">
						<i class="fas fa-file-code"></i> HTML
					</button>
					<button id="analyticsExportPDF" class="btn btn-danger" style="padding: 6px 16px; font-size: 0.75rem; background: linear-gradient(135deg, #dc2626, #ef4444);">
						<i class="fas fa-file-pdf"></i> PDF
					</button>
					<button id="analyticsExportExcel" class="btn btn-success" style="padding: 6px 16px; font-size: 0.75rem;">
						<i class="fas fa-file-excel"></i> Excel
					</button>
					<button id="analyticsExportCSV" class="btn btn-info" style="padding: 6px 16px; font-size: 0.75rem;">
						<i class="fas fa-file-csv"></i> CSV
					</button>
					<button id="analyticsShare" class="btn btn-purple" style="padding: 6px 16px; font-size: 0.75rem;">
						<i class="fas fa-share-alt"></i> Поделиться
					</button>
					<button id="analyticsRefresh" class="btn btn-secondary" style="padding: 6px 16px; font-size: 0.75rem;">
						<i class="fas fa-sync-alt"></i> Обновить
					</button>
				</div>
			</div>
		`;

		// ===== ПАНЕЛЬ ФИЛЬТРОВ =====
		html += renderFiltersBar(data);

	// ===== ВКЛАДКИ =====
		html += `
			<div style="display: flex; gap: 4px; background: #f1f5f9; border-radius: 12px; padding: 4px; margin-bottom: 20px; flex-wrap: wrap; overflow-x: auto;">
				<button class="analytics-tab active" data-tab="overview" style="padding: 8px 16px; border: none; border-radius: 8px; background: white; font-weight: 600; font-size: 0.8rem; cursor: pointer; color: #059669; box-shadow: 0 2px 8px rgba(0,0,0,0.06); white-space: nowrap;">
					<i class="fas fa-home"></i> Обзор
				</button>
				<button class="analytics-tab" data-tab="planfact" style="padding: 8px 16px; border: none; border-radius: 8px; background: transparent; font-weight: 600; font-size: 0.8rem; cursor: pointer; color: #64748b; white-space: nowrap;">
					<i class="fas fa-clipboard-check"></i> План/Факт
				</button>
				<button class="analytics-tab" data-tab="trends" style="padding: 8px 16px; border: none; border-radius: 8px; background: transparent; font-weight: 600; font-size: 0.8rem; cursor: pointer; color: #64748b; white-space: nowrap;">
					<i class="fas fa-chart-line"></i> Тренды
				</button>
				<button class="analytics-tab" data-tab="days" style="padding: 8px 16px; border: none; border-radius: 8px; background: transparent; font-weight: 600; font-size: 0.8rem; cursor: pointer; color: #64748b; white-space: nowrap;">
					<i class="fas fa-calendar-day"></i> По дням
				</button>
				<button class="analytics-tab" data-tab="heatmap" style="padding: 8px 16px; border: none; border-radius: 8px; background: transparent; font-weight: 600; font-size: 0.8rem; cursor: pointer; color: #64748b; white-space: nowrap;">
					<i class="fas fa-th"></i> Тепловая карта
				</button>
				<button class="analytics-tab" data-tab="meals" style="padding: 8px 16px; border: none; border-radius: 8px; background: transparent; font-weight: 600; font-size: 0.8rem; cursor: pointer; color: #64748b; white-space: nowrap;">
					<i class="fas fa-utensils"></i> Приёмы пищи
				</button>
				<button class="analytics-tab" data-tab="topdishes" style="padding: 8px 16px; border: none; border-radius: 8px; background: transparent; font-weight: 600; font-size: 0.8rem; cursor: pointer; color: #64748b; white-space: nowrap;">
					<i class="fas fa-star"></i> Топ блюд
				</button>
				<button class="analytics-tab" data-tab="violations" style="padding: 8px 16px; border: none; border-radius: 8px; background: transparent; font-weight: 600; font-size: 0.8rem; cursor: pointer; color: #64748b; white-space: nowrap;">
					<i class="fas fa-exclamation-triangle"></i> Нарушения
				</button>
				<button class="analytics-tab" data-tab="bju" style="padding: 8px 16px; border: none; border-radius: 8px; background: transparent; font-weight: 600; font-size: 0.8rem; cursor: pointer; color: #64748b; white-space: nowrap;">
					<i class="fas fa-balance-scale"></i> БЖУ
				</button>
				<button class="analytics-tab" data-tab="recommendations" style="padding: 8px 16px; border: none; border-radius: 8px; background: transparent; font-weight: 600; font-size: 0.8rem; cursor: pointer; color: #64748b; white-space: nowrap;">
					<i class="fas fa-lightbulb"></i> Рекомендации
				</button>
				<button class="analytics-tab" data-tab="menucompare" style="padding: 8px 16px; border: none; border-radius: 8px; background: transparent; font-weight: 600; font-size: 0.8rem; cursor: pointer; color: #64748b; white-space: nowrap;">
					<i class="fas fa-columns"></i> Сравнение меню
				</button>
			</div>
		`;

		// ===== КОНТЕНТ ВКЛАДОК =====
		html += `<div id="analyticsTabContent">`;
		html += renderOverviewTab(stats);
		html += renderPlanFactTab();
		html += renderTrendsTab(stats);
		html += renderDaysTab(stats);
		html += renderHeatmapTab(stats);
		html += renderMealsTab(stats);
		html += renderTopDishesTab(stats);
		html += renderViolationsTab(stats);
		html += renderBJUTab(stats);
		html += renderRecommendationsTab();
		html += renderMenuCompareTab(stats);
		html += `</div>`;

		container.innerHTML = html;

		// ===== ПОДКЛЮЧАЕМ СОБЫТИЯ =====
		attachAnalyticsEvents();
		
		// ✅ ДОБАВЛЯЕМ ПРИВЯЗКУ ОБРАБОТЧИКОВ ДЛЯ КАРТОЧЕК ДНЕЙ
		// Используем setTimeout, чтобы гарантировать, что DOM обновлён
		setTimeout(function() {
			attachDayCardEvents();
		}, 100);
		
		// Обновляем информацию о лагере
		updateCampInfo();
	}
    // ============================================================
    // РЕНДЕРИНГ ВКЛАДОК
    // ============================================================

	function renderOverviewTab(stats) {
		const s = stats.summary;
		const v = stats.violations;
		const bju = stats.bju;

		// Оценка качества меню
		let qualityScore = 100;
		let qualityLabel = 'Отлично';
		let qualityColor = '#10b981';

		if (v.total > 0) {
			qualityScore -= v.total * 2;
			if (v.critical > 0) qualityScore -= v.critical * 5;
		}

		if (qualityScore < 50) { qualityLabel = 'Требует доработки'; qualityColor = '#dc2626'; }
		else if (qualityScore < 70) { qualityLabel = 'Хорошо'; qualityColor = '#f59e0b'; }
		else if (qualityScore < 90) { qualityLabel = 'Отлично'; qualityColor = '#10b981'; }

		const scoreColor = qualityScore >= 90 ? '#10b981' : qualityScore >= 70 ? '#f59e0b' : '#dc2626';

		// ✅ ФОРМИРУЕМ HTML С КОРРЕКТНЫМ СОСТОЯНИЕМ КНОПОК
		const isDaily = state._sourceType === 'daily';
		const dailyLabel = state._dailyVariantName || 'Ежедневное меню';
		
		let html = `
			<div style="display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; align-items: center; background: #f8fafc; padding: 12px 16px; border-radius: 12px;">
				<span style="font-weight: 600; font-size: 0.85rem; color: #0f172a;">
					<i class="fas fa-database"></i> Источник данных:
				</span>
				<button id="analyticsSourceTypical" class="btn ${!isDaily ? 'btn-primary' : 'btn-secondary'}" style="padding: 4px 16px; font-size: 0.75rem;">
					<i class="fas fa-calendar-alt"></i> Типовое меню
				</button>
				<button id="analyticsSourceDaily" class="btn ${isDaily ? 'btn-primary' : 'btn-secondary'}" style="padding: 4px 16px; font-size: 0.75rem;">
					<i class="fas fa-calendar-day"></i> Ежедневное меню${isDaily && state._dailyMenuNumber ? ' #' + state._dailyMenuNumber : ''}
				</button>
				<select id="analyticsDailySelect" style="padding: 4px 12px; border-radius: 8px; border: 1px solid #e2e8f0; background: white; font-size: 0.75rem; ${!isDaily ? 'display:none;' : ''}">
					${getDailyMenuOptions()}
				</select>
				<span style="font-size: 0.7rem; color: #94a3b8; margin-left: auto;">
					${isDaily ? '📌 ' + escapeHtml(dailyLabel) : '📊 Анализ по всему типовому меню'}
				</span>
			</div>
			
			<div class="analytics-panel" data-tab="overview">
				<!-- Карточки с общей статистикой -->
				<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 24px;">
					<div style="background: #f8fafc; padding: 16px; border-radius: 16px; text-align: center; border: 1px solid #e2e8f0;">
						<div style="font-size: 1.8rem; font-weight: 800; color: #0f172a;">${s.totalDishes}</div>
						<div style="font-size: 0.7rem; color: #64748b;">🍽️ Всего блюд</div>
					</div>
					<div style="background: #f8fafc; padding: 16px; border-radius: 16px; text-align: center; border: 1px solid #e2e8f0;">
						<div style="font-size: 1.8rem; font-weight: 800; color: #0f172a;">${s.totalDays}</div>
						<div style="font-size: 0.7rem; color: #64748b;">📆 Дней</div>
					</div>
					<div style="background: #f8fafc; padding: 16px; border-radius: 16px; text-align: center; border: 1px solid #e2e8f0;">
						<div style="font-size: 1.8rem; font-weight: 800; color: #0f172a;">${s.totalWeeks}</div>
						<div style="font-size: 0.7rem; color: #64748b;">📅 Недель</div>
					</div>
					<div style="background: #f8fafc; padding: 16px; border-radius: 16px; text-align: center; border: 1px solid #e2e8f0;">
						<div style="font-size: 1.8rem; font-weight: 800; color: #0f172a;">${Math.round(s.avgWeightPerDay)}</div>
						<div style="font-size: 0.7rem; color: #64748b;">⚖️ Ср. вес/день (г)</div>
					</div>
					<div style="background: #f8fafc; padding: 16px; border-radius: 16px; text-align: center; border: 1px solid #e2e8f0;">
						<div style="font-size: 1.8rem; font-weight: 800; color: #0f172a;">${Math.round(s.avgCaloriesPerDay)}</div>
						<div style="font-size: 0.7rem; color: #64748b;">🔥 Ср. калорий/день</div>
					</div>
					<div style="background: #f8fafc; padding: 16px; border-radius: 16px; text-align: center; border: 1px solid #e2e8f0;">
						<div style="font-size: 1.8rem; font-weight: 800; color: #f59e0b;">${s.totalPrice.toFixed(2)} ₽</div>
						<div style="font-size: 0.7rem; color: #64748b;">💰 Общая стоимость</div>
					</div>
				</div>

				<!-- Качество меню -->
				<div style="background: white; border: 2px solid #e2e8f0; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
					<div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
						<div>
							<div style="font-weight: 600; color: #0f172a; font-size: 1rem;">📊 Качество меню</div>
							<div style="font-size: 0.75rem; color: #64748b;">${v.total === 0 ? '✅ Все правила соблюдены' : `⚠️ Найдено ${v.total} нарушений`}</div>
						</div>
						<div style="display: flex; align-items: center; gap: 16px;">
							<div style="font-size: 2rem; font-weight: 800; color: ${scoreColor};">${Math.max(0, qualityScore)}%</div>
							<div style="padding: 4px 16px; border-radius: 20px; background: ${qualityColor}; color: white; font-weight: 600; font-size: 0.8rem;">${qualityLabel}</div>
						</div>
					</div>
					<div style="margin-top: 12px; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
						<div style="height: 100%; width: ${Math.max(0, qualityScore)}%; background: ${scoreColor}; border-radius: 4px; transition: width 1s ease;"></div>
					</div>
				</div>

				<!-- Детали -->
				<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
					<div style="background: #f8fafc; border-radius: 16px; padding: 16px; border: 1px solid #e2e8f0;">
						<div style="font-weight: 600; color: #0f172a; margin-bottom: 12px;">🏋️ Общие показатели</div>
						<div style="display: flex; flex-direction: column; gap: 6px; font-size: 0.85rem;">
							<div style="display: flex; justify-content: space-between;"><span style="color: #64748b;">Общий вес:</span><span style="font-weight: 600;">${s.totalWeight.toFixed(0)} г</span></div>
							<div style="display: flex; justify-content: space-between;"><span style="color: #64748b;">Общая калорийность:</span><span style="font-weight: 600;">${s.totalCalories.toFixed(0)} ккал</span></div>
							<div style="display: flex; justify-content: space-between;"><span style="color: #64748b;">Белки:</span><span style="font-weight: 600;">${s.totalProteins.toFixed(1)} г</span></div>
							<div style="display: flex; justify-content: space-between;"><span style="color: #64748b;">Жиры:</span><span style="font-weight: 600;">${s.totalFats.toFixed(1)} г</span></div>
							<div style="display: flex; justify-content: space-between;"><span style="color: #64748b;">Углеводы:</span><span style="font-weight: 600;">${s.totalCarbs.toFixed(1)} г</span></div>
						</div>
					</div>
					<div style="background: #f8fafc; border-radius: 16px; padding: 16px; border: 1px solid #e2e8f0;">
						<div style="font-weight: 600; color: #0f172a; margin-bottom: 12px;">📋 Статистика нарушений</div>
						<div style="display: flex; flex-direction: column; gap: 6px; font-size: 0.85rem;">
							<div style="display: flex; justify-content: space-between;"><span style="color: #64748b;">Всего:</span><span style="font-weight: 600; color: ${v.total > 0 ? '#dc2626' : '#10b981'};">${v.total}</span></div>
							<div style="display: flex; justify-content: space-between;"><span style="color: #64748b;">Критических:</span><span style="font-weight: 600; color: ${v.critical > 0 ? '#dc2626' : '#10b981'};">${v.critical}</span></div>
							<div style="display: flex; justify-content: space-between;"><span style="color: #64748b;">Предупреждений:</span><span style="font-weight: 600; color: ${v.warnings > 0 ? '#f59e0b' : '#10b981'};">${v.warnings}</span></div>
							<div style="display: flex; justify-content: space-between;"><span style="color: #64748b;">Дубликатов:</span><span style="font-weight: 600; color: ${v.duplicates > 0 ? '#ec4899' : '#10b981'};">${v.duplicates}</span></div>
						</div>
					</div>
					<div style="background: #f8fafc; border-radius: 16px; padding: 16px; border: 1px solid #e2e8f0;">
						<div style="font-weight: 600; color: #0f172a; margin-bottom: 12px;">💰 Финансовые показатели</div>
						<div style="display: flex; flex-direction: column; gap: 6px; font-size: 0.85rem;">
							<div style="display: flex; justify-content: space-between;"><span style="color: #64748b;">Общая стоимость:</span><span style="font-weight: 600; color: #f59e0b;">${s.totalPrice.toFixed(2)} ₽</span></div>
							<div style="display: flex; justify-content: space-between;"><span style="color: #64748b;">Ср. стоимость дня:</span><span style="font-weight: 600;">${s.avgPricePerDay.toFixed(2)} ₽</span></div>
							<div style="display: flex; justify-content: space-between;"><span style="color: #64748b;">Ср. стоимость блюда:</span><span style="font-weight: 600;">${s.totalDishes > 0 ? (s.totalPrice / s.totalDishes).toFixed(2) : '0.00'} ₽</span></div>
						</div>
					</div>
				</div>

				<!-- Информация о школе -->
				<div style="margin-top: 16px; padding: 16px; background: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0; font-size: 0.85rem; display: flex; flex-wrap: wrap; gap: 16px;">
					<span><strong>🏫 Школа:</strong> ${escapeHtml(state.schoolInfo?.name || 'Не указана')}</span>
					<span><strong>📚 Возрастная категория:</strong> ${escapeHtml(state.schoolInfo?.ageCategory || 'Не указана')}</span>
					<span><strong>📅 Дата утверждения:</strong> ${escapeHtml(state.schoolInfo?.approval?.date || 'Не указана')}</span>
					${state.isSummerCamp ? '<span style="padding: 2px 12px; background: #fef3c7; border-radius: 12px; color: #d97706; font-weight: 600;">🌞 Летний лагерь (+10%)</span>' : ''}
				</div>
		`;

		// ===== ДОБАВЛЯЕМ БЛОК САНПИН =====
		const sanpinResults = analyzeSanPinCompliance();
		if (sanpinResults) {
			html += `
				<div style="margin-top: 24px; background: white; border: 2px solid ${sanpinResults.overallScore >= 80 ? '#10b981' : '#f59e0b'}; border-radius: 16px; padding: 20px;">
					<div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
						<div>
							<div style="font-weight: 700; color: #0f172a; font-size: 1.1rem;">
								<i class="fas fa-clipboard-check" style="color: ${sanpinResults.overallScore >= 80 ? '#10b981' : '#f59e0b'};"></i>
								Соответствие СанПиН 2.3/2.4.4282-26
							</div>
							<div style="font-size: 0.75rem; color: #64748b;">
								Возрастная категория: ${sanpinResults.ageCategory}
							</div>
						</div>
						<div style="display: flex; align-items: center; gap: 12px;">
							<div style="font-size: 1.8rem; font-weight: 800; color: ${sanpinResults.overallScore >= 80 ? '#10b981' : sanpinResults.overallScore >= 50 ? '#f59e0b' : '#dc2626'};">
								${sanpinResults.overallScore}%
							</div>
							<div style="padding: 4px 16px; border-radius: 20px; background: ${sanpinResults.overallScore >= 80 ? '#dcfce7' : sanpinResults.overallScore >= 50 ? '#fef3c7' : '#fee2e2'}; color: ${sanpinResults.overallScore >= 80 ? '#16a34a' : sanpinResults.overallScore >= 50 ? '#d97706' : '#dc2626'}; font-weight: 600; font-size: 0.8rem;">
								${sanpinResults.overallScore >= 80 ? '✅ Соответствует' : sanpinResults.overallScore >= 50 ? '⚠️ Частично' : '❌ Требует доработки'}
							</div>
						</div>
					</div>
					
					<!-- Детали по приёмам пищи -->
					<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
						${Object.entries(sanpinResults.compliance).map(([mealType, data]) => `
							<div style="background: #f8fafc; border-radius: 12px; padding: 12px; border-left: 4px solid ${data.statusColor};">
								<div style="font-weight: 600; font-size: 0.85rem; color: #0f172a;">${getMealEmoji(mealType)} ${getMealName(mealType)}</div>
								<div style="font-size: 0.75rem; color: ${data.statusColor}; margin-top: 4px;">${data.statusText}</div>
								${data.days ? `
									<div style="font-size: 0.7rem; color: #64748b; margin-top: 4px;">
										${data.avgWeight ? `${data.avgWeight.toFixed(0)}г / ${data.norm.weight}г` : ''}
										${data.avgCalories ? ` • ${data.avgCalories.toFixed(0)}ккал / ${data.norm.calories}ккал` : ''}
									</div>
									<div style="margin-top: 6px; height: 4px; background: #e2e8f0; border-radius: 2px; overflow: hidden;">
										<div style="height: 100%; width: ${data.compliancePercent || 0}%; background: ${data.statusColor}; border-radius: 2px;"></div>
									</div>
								` : `
									<div style="font-size: 0.7rem; color: #94a3b8; margin-top: 4px;">❌ Отсутствует в меню</div>
								`}
							</div>
						`).join('')}
					</div>
					
					<!-- Нарушения и рекомендации -->
					${sanpinResults.violations.length > 0 ? `
						<div style="margin-top: 16px; padding: 12px 16px; background: #fffbeb; border-radius: 12px; border-left: 4px solid #f59e0b;">
							<div style="font-weight: 600; color: #d97706; font-size: 0.85rem;">
								<i class="fas fa-exclamation-triangle"></i> Выявлены нарушения (${sanpinResults.violations.length})
							</div>
							<div style="font-size: 0.8rem; color: #92400e; margin-top: 4px;">
								${sanpinResults.violations.slice(0, 3).map(v => 
									`${getMealEmoji(v.meal)} ${getMealName(v.meal)}: ${v.issue}`
								).join('; ')}
								${sanpinResults.violations.length > 3 ? ` и ещё ${sanpinResults.violations.length - 3} нарушений` : ''}
							</div>
							<button onclick="window.showDetailedSanPinReport()" style="margin-top: 8px; padding: 4px 16px; border: none; border-radius: 16px; background: #f59e0b; color: white; cursor: pointer; font-size: 0.75rem;">
								<i class="fas fa-arrow-right"></i> Подробный отчёт по СанПиН
							</button>
						</div>
					` : `
						<div style="margin-top: 16px; padding: 12px 16px; background: #dcfce7; border-radius: 12px; border-left: 4px solid #10b981;">
							<div style="font-weight: 600; color: #16a34a; font-size: 0.85rem;">
								<i class="fas fa-check-circle"></i> Все приёмы пищи соответствуют нормам СанПиН 2.3/2.4.4282-26
							</div>
						</div>
					`}
				</div>
			`;
		}

		// ===== СРАВНЕНИЕ С ПРЕДЫДУЩИМ ПЕРИОДОМ (4.7) =====
		const periodCmp = getPreviousPeriodStats();
		if (periodCmp) {
			const c = periodCmp.current, p = periodCmp.previous;
			const delta = (cur, prev) => {
				const d = cur - prev;
				const pct = prev > 0 ? (d / prev) * 100 : 0;
				const sign = d >= 0 ? '+' : '';
				const color = d >= 0 ? '#16a34a' : '#dc2626';
				return `<span style="color: ${color}; font-weight: 600;">${sign}${d.toFixed(0)} (${sign}${pct.toFixed(1)}%)</span>`;
			};
			html += `
				<div style="margin-top: 16px; background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px;">
					<div style="font-weight: 600; color: #0f172a; margin-bottom: 4px;">
						<i class="fas fa-exchange-alt" style="color: #3b82f6;"></i> Сравнение с предыдущим периодом
					</div>
					<div style="font-size: 0.75rem; color: #64748b; margin-bottom: 12px;">
						${escapeHtml(periodCmp.prevLabel)} → ${escapeHtml(periodCmp.currentLabel)} (средние значения за день)
					</div>
					<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px;">
						<div style="background: #f8fafc; padding: 12px; border-radius: 10px; text-align: center;">
							<div style="font-size: 0.7rem; color: #64748b;">Калории/день</div>
							<div style="font-weight: 700; color: #0f172a;">${c.calories.toFixed(0)} <span style="font-size: 0.7rem; font-weight: 400; color: #94a3b8;">← ${p.calories.toFixed(0)}</span></div>
							<div style="font-size: 0.7rem;">${delta(c.calories, p.calories)}</div>
						</div>
						<div style="background: #f8fafc; padding: 12px; border-radius: 10px; text-align: center;">
							<div style="font-size: 0.7rem; color: #64748b;">Вес/день (г)</div>
							<div style="font-weight: 700; color: #0f172a;">${c.weight.toFixed(0)} <span style="font-size: 0.7rem; font-weight: 400; color: #94a3b8;">← ${p.weight.toFixed(0)}</span></div>
							<div style="font-size: 0.7rem;">${delta(c.weight, p.weight)}</div>
						</div>
						<div style="background: #f8fafc; padding: 12px; border-radius: 10px; text-align: center;">
							<div style="font-size: 0.7rem; color: #64748b;">Белки/день</div>
							<div style="font-weight: 700; color: #0f172a;">${c.proteins.toFixed(1)} <span style="font-size: 0.7rem; font-weight: 400; color: #94a3b8;">← ${p.proteins.toFixed(1)}</span></div>
							<div style="font-size: 0.7rem;">${delta(c.proteins, p.proteins)}</div>
						</div>
						<div style="background: #f8fafc; padding: 12px; border-radius: 10px; text-align: center;">
							<div style="font-size: 0.7rem; color: #64748b;">Жиры/день</div>
							<div style="font-weight: 700; color: #0f172a;">${c.fats.toFixed(1)} <span style="font-size: 0.7rem; font-weight: 400; color: #94a3b8;">← ${p.fats.toFixed(1)}</span></div>
							<div style="font-size: 0.7rem;">${delta(c.fats, p.fats)}</div>
						</div>
						<div style="background: #f8fafc; padding: 12px; border-radius: 10px; text-align: center;">
							<div style="font-size: 0.7rem; color: #64748b;">Углеводы/день</div>
							<div style="font-weight: 700; color: #0f172a;">${c.carbs.toFixed(1)} <span style="font-size: 0.7rem; font-weight: 400; color: #94a3b8;">← ${p.carbs.toFixed(1)}</span></div>
							<div style="font-size: 0.7rem;">${delta(c.carbs, p.carbs)}</div>
						</div>
					</div>
				</div>
			`;
		}

		html += `</div>`; // Закрываем .analytics-panel
		return html;
	}

	// ============================================================
	// ВЫБОР ИСТОЧНИКА ДАННЫХ ДЛЯ АНАЛИТИКИ
	// «Ежедневное меню» — это один день из типового меню (Меню 1, 2, 3…)
	// ============================================================

	// Полное типовое меню (даже когда в аналитике открыт один день)
	function getTypicalSourceData() {
		return state._originalTemplateData || window.templateMenuData || state.templateMenuData || null;
	}

	// Список дней типового меню в порядке «Меню 1, 2, 3…»
	function listTemplateDays() {
		const data = getTypicalSourceData();
		if (!data || !data.weeks) return [];
		const mealTypes = ['breakfast', 'breakfast2', 'lunch', 'afternoonSnack', 'dinner', 'dinner2'];
		const list = [];
		const weeks = Object.keys(data.weeks).map(w => parseInt(w, 10)).sort((a, b) => a - b);

		for (const w of weeks) {
			const days = Object.keys(data.weeks[w] || {}).map(d => parseInt(d, 10)).sort((a, b) => a - b);
			for (const d of days) {
				const dayData = data.weeks[w][d] || {};
				let dishes = 0;
				mealTypes.forEach(mt => { dishes += (dayData[mt] && dayData[mt].items) ? dayData[mt].items.length : 0; });
				list.push({ week: w, day: d, key: `${w}_${d}`, number: list.length + 1, dishes: dishes });
			}
		}
		return list;
	}

	function getDailyMenuOptions() {
		const days = listTemplateDays();
		if (!days.length) {
			return '<option value="">Нет дней в типовом меню</option>';
		}
		const selected = state._dailyDayKey || '';
		return days.map(d =>
			`<option value="${d.key}"${d.key === selected ? ' selected' : ''}>Меню ${d.number} — Неделя ${d.week}, День ${d.day}${d.dishes ? '' : ' (пусто)'}</option>`
		).join('');
	}

	// Подменяет данные аналитики на один день типового меню.
	// dayKey: "1_3" (неделя_день) или порядковый номер дня в списке.
	function loadDailyMenuForAnalytics(dayKey) {
		const source = getTypicalSourceData();
		if (!source || !source.weeks) return null;

		const days = listTemplateDays();
		if (!days.length) return null;

		let entry = days.find(d => d.key === String(dayKey));
		if (!entry && typeof dayKey === 'number') entry = days[dayKey];
		if (!entry) return null;

		const dayData = source.weeks[entry.week] && source.weeks[entry.week][entry.day];
		if (!dayData) return null;

		const cloneMeal = (meal) => ({ items: JSON.parse(JSON.stringify((meal && meal.items) || [])) });
		const data = { weeks: {} };
		data.weeks[entry.week] = {};
		data.weeks[entry.week][entry.day] = {
			breakfast: cloneMeal(dayData.breakfast),
			breakfast2: cloneMeal(dayData.breakfast2),
			lunch: cloneMeal(dayData.lunch),
			afternoonSnack: cloneMeal(dayData.afternoonSnack),
			dinner: cloneMeal(dayData.dinner),
			dinner2: cloneMeal(dayData.dinner2)
		};

		state._dailyDayKey = entry.key;
		state._dailyMenuNumber = entry.number;
		state._dailyVariantName = `Меню ${entry.number} (Неделя ${entry.week}, День ${entry.day})`;

		return data;
	}

	// ============================================================
	// ПОДРОБНЫЙ ОТЧЁТ ПО САНПИН
	// ============================================================

	function showDetailedSanPinReport() {
		const results = analyzeSanPinCompliance();
		if (!results) {
			showStatus('Нет данных для анализа', 'error');
			return;
		}

		// Удаляем старую модалку, если есть
		const oldModal = document.querySelector('.sanpin-modal');
		if (oldModal) oldModal.remove();

		const modal = document.createElement('div');
		modal.className = 'sanpin-modal'; // Добавляем класс для идентификации
		modal.style.cssText = `
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: rgba(0,0,0,0.7);
			backdrop-filter: blur(8px);
			z-index: 20000;
			display: flex;
			justify-content: center;
			align-items: center;
		`;

		let html = `
			<div style="background: white; border-radius: 24px; padding: 32px; max-width: 900px; width: 95%; max-height: 85vh; overflow-y: auto; position: relative;">
				<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
					<div>
						<h2 style="color: #0f172a; font-size: 1.3rem;">
							<i class="fas fa-clipboard-check" style="color: #059669;"></i>
							Отчёт по СанПиН 2.3/2.4.4282-26
						</h2>
						<p style="color: #64748b; font-size: 0.85rem;">
							Возрастная категория: ${results.ageCategory}
						</p>
					</div>
					<button onclick="window.closeSanPinModal()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #94a3b8; padding: 4px 8px;">&times;</button>
				</div>

				<div style="margin-bottom: 24px; padding: 16px; background: ${results.overallScore >= 80 ? '#dcfce7' : results.overallScore >= 50 ? '#fef3c7' : '#fee2e2'}; border-radius: 16px;">
					<div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
						<div>
							<div style="font-weight: 600; color: ${results.overallScore >= 80 ? '#16a34a' : results.overallScore >= 50 ? '#d97706' : '#dc2626'};">
								${results.overallScore >= 80 ? '✅ Соответствует требованиям' : results.overallScore >= 50 ? '⚠️ Частичное соответствие' : '❌ Не соответствует требованиям'}
							</div>
							<div style="font-size: 0.85rem; color: #64748b;">
								Общий уровень соответствия: ${results.overallScore}%
							</div>
						</div>
						<div style="font-size: 2rem; font-weight: 800; color: ${results.overallScore >= 80 ? '#10b981' : results.overallScore >= 50 ? '#f59e0b' : '#dc2626'};">
							${results.overallScore}%
						</div>
					</div>
				</div>

				<!-- Таблица по приёмам пищи -->
				<div style="overflow-x: auto; margin-bottom: 24px;">
					<table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
						<thead>
							<tr style="background: #f1f5f9;">
								<th style="padding: 10px; border: 1px solid #e2e8f0; text-align: left;">Приём пищи</th>
								<th style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">Вес (г)</th>
								<th style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">Норма</th>
								<th style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">Ккал</th>
								<th style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">Норма</th>
								<th style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">Б/Ж/У</th>
								<th style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">Статус</th>
							</tr>
						</thead>
						<tbody>
							${Object.entries(results.compliance).map(([mealType, data]) => {
								if (data.status === 'missing') {
									return `
										<tr>
											<td style="padding: 8px 10px; border: 1px solid #e2e8f0; font-weight: 600;">${getMealEmoji(mealType)} ${getMealName(mealType)}</td>
											<td colspan="6" style="padding: 8px 10px; border: 1px solid #e2e8f0; color: #94a3b8; text-align: center;">❌ Отсутствует в меню</td>
										</tr>
									`;
								}
								return `
									<tr style="${data.status === 'bad' ? 'background: #fef2f2;' : data.status === 'warning' ? 'background: #fffbeb;' : ''}">
										<td style="padding: 8px 10px; border: 1px solid #e2e8f0; font-weight: 600;">${getMealEmoji(mealType)} ${getMealName(mealType)}</td>
										<td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: center; ${data.weightCompliant ? 'color: #10b981;' : 'color: #dc2626; font-weight: bold;'}">${data.avgWeight.toFixed(0)}</td>
										<td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: center; color: #64748b;">≥${data.norm.weight}</td>
										<td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: center; ${data.caloriesCompliant ? 'color: #10b981;' : 'color: #dc2626; font-weight: bold;'}">${data.avgCalories.toFixed(0)}</td>
										<td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: center; color: #64748b;">≥${data.norm.calories}</td>
										<td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: center;">${data.avgProteins.toFixed(1)}/${data.avgFats.toFixed(1)}/${data.avgCarbs.toFixed(1)}</td>
										<td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: center; color: ${data.statusColor};">${data.statusText}</td>
									</tr>
								`;
							}).join('')}
						</tbody>
					</table>
				</div>

				<!-- Нарушения и рекомендации -->
				${results.violations.length > 0 ? `
					<div style="background: #fffbeb; border-radius: 12px; padding: 16px; border-left: 4px solid #f59e0b; margin-bottom: 16px;">
						<div style="font-weight: 700; color: #d97706; margin-bottom: 12px;">
							<i class="fas fa-exclamation-triangle"></i> Выявленные нарушения (${results.violations.length})
						</div>
						${results.violations.map(v => `
							<div style="padding: 8px 12px; margin-bottom: 8px; background: white; border-radius: 8px; border: 1px solid #fef3c7;">
								<div style="font-weight: 600; color: #0f172a;">${getMealEmoji(v.meal)} ${getMealName(v.meal)}</div>
								<div style="font-size: 0.85rem; color: #92400e;">${v.issue}</div>
								<div style="font-size: 0.8rem; color: #059669; margin-top: 4px;">
									<i class="fas fa-lightbulb"></i> Рекомендация: ${v.recommendation}
								</div>
							</div>
						`).join('')}
					</div>
				` : ''}

				<!-- Кнопки -->
				<div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px; flex-wrap: wrap;">
					<button onclick="window.closeSanPinModal()" class="btn btn-secondary">Закрыть</button>
					<button onclick="window.exportSanPinReport()" class="btn btn-primary">
						<i class="fas fa-download"></i> Экспортировать отчёт
					</button>
				</div>
			</div>
		`;

		modal.innerHTML = html;
		document.body.appendChild(modal);
		
		// Закрытие по клику на фон
		modal.addEventListener('click', function(e) {
			if (e.target === this) {
				this.remove();
			}
		});
	}

	function renderDaysTab(stats) {
		const days = Object.values(stats.days).sort((a, b) => a.week - b.week || a.day - a.day);
		
		if (days.length === 0) {
			return `<div class="analytics-panel" data-tab="days" style="display: none;">
				<p style="padding: 20px; text-align: center; color: #94a3b8;">Нет данных по дням</p>
			</div>`;
		}

		// Находим min/max для цветовой шкалы
		const weights = days.map(d => d.weight);
		const maxWeight = Math.max(...weights, 1);
		const minWeight = Math.min(...weights);

		let html = `<div class="analytics-panel" data-tab="days" style="display: none;">`;
		html += `<div style="margin-bottom: 12px; font-size: 0.85rem; color: #64748b;">
			<i class="fas fa-info-circle"></i> 
			Кликните по дню для просмотра подробной сводки и рекомендаций
		</div>`;
		html += `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px;">`;

		for (const day of days) {
			const color = getColorByValue(day.weight, minWeight, maxWeight);
			const violations = state.allViolations.filter(v => v.week === day.week && v.day === day.day);
			const hasViolations = violations.length > 0;
			const hasCritical = violations.some(v => v.code === 15);

			html += `
				<div class="day-card" data-week="${day.week}" data-day="${day.day}" 
					 style="background: white; border-radius: 16px; padding: 16px; border: 2px solid ${hasCritical ? '#dc2626' : hasViolations ? '#f59e0b' : '#e2e8f0'}; transition: all 0.3s; box-shadow: 0 1px 3px rgba(0,0,0,0.02); cursor: pointer;">
					<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
						<div style="font-weight: 700; color: #0f172a;">Неделя ${day.week}, День ${day.day}</div>
						${hasCritical ? '<span style="font-size: 0.6rem; background: #fee2e2; color: #dc2626; padding: 2px 8px; border-radius: 10px;">❌ Критично</span>' : 
						 hasViolations ? '<span style="font-size: 0.6rem; background: #fef3c7; color: #d97706; padding: 2px 8px; border-radius: 10px;">⚠️</span>' :
						 '<span style="font-size: 0.6rem; background: #dcfce7; color: #16a34a; padding: 2px 8px; border-radius: 10px;">✅</span>'}
					</div>
					<div style="font-size: 0.85rem; color: #64748b;">
						<div style="display: flex; justify-content: space-between;"><span>🍽️ Блюд:</span><span style="font-weight: 600; color: #0f172a;">${day.dishes}</span></div>
						<div style="display: flex; justify-content: space-between;"><span>⚖️ Вес:</span><span style="font-weight: 600; color: #0f172a;">${day.weight.toFixed(0)} г</span></div>
						<div style="display: flex; justify-content: space-between;"><span>🔥 Ккал:</span><span style="font-weight: 600; color: #0f172a;">${day.calories.toFixed(0)}</span></div>
						<div style="display: flex; justify-content: space-between;"><span>💰 Цена:</span><span style="font-weight: 600; color: #f59e0b;">${day.price.toFixed(2)} ₽</span></div>
					</div>
					<div style="margin-top: 8px; height: 4px; background: #e2e8f0; border-radius: 2px; overflow: hidden;">
						<div style="height: 100%; width: ${(day.weight / maxWeight * 100).toFixed(0)}%; background: ${color}; border-radius: 2px;"></div>
					</div>
					<div style="font-size: 0.6rem; color: #94a3b8; margin-top: 4px;">${violations.length > 0 ? `Нарушений: ${violations.length}` : 'Без нарушений'}</div>
					${violations.length > 0 ? `<div style="margin-top: 6px; font-size: 0.65rem; color: #d97706;"><i class="fas fa-arrow-right"></i> Кликните для деталей</div>` : ''}
				</div>
			`;
		}

		html += `</div>`;

		// Контейнер для детальной информации о дне
		html += `
			<div id="dayDetailContainer" style="margin-top: 20px; display: none;">
				<div style="background: #f8fafc; border-radius: 16px; padding: 20px; border: 2px solid #e2e8f0;">
					<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
						<h4 id="dayDetailTitle" style="margin: 0; color: #0f172a;">📋 Детальная сводка</h4>
						<button id="closeDayDetail" style="background: none; border: none; font-size: 20px; cursor: pointer; color: #94a3b8;">&times;</button>
					</div>
					<div id="dayDetailContent"></div>
				</div>
			</div>
		`;

		html += `</div>`;
		
		// ✅ ВОЗВРАЩАЕМ HTML, НО НЕ ДОБАВЛЯЕМ ОБРАБОТЧИКИ ЗДЕСЬ
		// Они будут добавлены после вставки HTML в DOM
		return html;
	}
	// ============================================================
	// ДЕТАЛЬНАЯ СВОДКА ПО ДНЮ
	// ============================================================

	function getDayRecommendations(day, violations) {
		const recommendations = [];
		
		// Проверяем общий вес
		if (day.weight > 0 && day.weight < 500) {
			recommendations.push({
				type: 'weight',
				severity: 'warning',
				text: `Общий вес дня (${day.weight.toFixed(0)}г) ниже рекомендуемого минимума (500г). Рекомендуется увеличить порции или добавить блюда.`
			});
		}
		
		// Проверяем калорийность
		if (day.calories > 0 && day.calories < 1175) { // 470+705 = 1175 (завтрак + обед)
			recommendations.push({
				type: 'calories',
				severity: 'warning',
				text: `Калорийность дня (${day.calories.toFixed(0)}ккал) ниже рекомендуемой. Добавьте более калорийные продукты или увеличьте порции.`
			});
		}
		
		// Проверяем БЖУ
		const dayItems = state.flatItems.filter(i => i.week === day.week && i.day === day.day);
		let totalProteins = 0, totalFats = 0, totalCarbs = 0;
		for (const item of dayItems) {
			totalProteins += item.proteins || 0;
			totalFats += item.fats || 0;
			totalCarbs += item.carbs || 0;
		}
		const totalBJU = totalProteins + totalFats + totalCarbs;
		if (totalBJU > 0 && totalBJU > day.weight * 0.7) {
			recommendations.push({
				type: 'bju',
				severity: 'error',
				text: `Сумма БЖУ (${totalBJU.toFixed(1)}г) составляет ${(totalBJU / day.weight * 100).toFixed(0)}% от веса дня. Рекомендуется снизить БЖУ или увеличить вес блюд (правило 15).`
			});
		}
		
		// Добавляем нарушения из правил
		for (const v of violations) {
			if (v.code === 15) {
				recommendations.push({
					type: 'rule15',
					severity: 'critical',
					text: `Критическая ошибка: ${v.details}`
				});
			} else if (v.code === 17) {
				recommendations.push({
					type: 'duplicate',
					severity: 'warning',
					text: `Обнаружен дубликат блюда: ${v.details}`
				});
			} else if (v.code <= 14) {
				const mealName = v.meal ? getMealName(v.meal) : '';
				recommendations.push({
					type: 'weight',
					severity: 'warning',
					text: `${mealName ? mealName + ': ' : ''}${v.details}`
				});
			}
		}
		
		// Если нет рекомендаций, добавляем положительную
		if (recommendations.length === 0) {
			recommendations.push({
				type: 'ok',
				severity: 'ok',
				text: '✅ Все показатели в норме. Меню сбалансировано и соответствует требованиям.'
			});
		}
		
		return recommendations;
	}

	function getDayDetailedInfo(week, day) {
		// Находим данные по дню
		const dayData = state.daysStats ? Object.values(state.daysStats).find(d => d.week === week && d.day === day) : null;
		if (!dayData) return null;
		
		// Находим блюда этого дня
		const dayItems = state.flatItems.filter(i => i.week === week && i.day === day);
		const violations = state.allViolations.filter(v => v.week === week && v.day === day);
		const recommendations = getDayRecommendations(dayData, violations);
		
		// Группируем блюда по приёмам пищи
		const meals = {};
		for (const item of dayItems) {
			if (!meals[item.meal]) meals[item.meal] = [];
			meals[item.meal].push(item);
		}
		
		return {
			dayData: dayData,
			items: dayItems,
			meals: meals,
			violations: violations,
			recommendations: recommendations
		};
	}

	function renderDayDetail(week, day) {
		console.log(`📊 Рендеринг деталей для Неделя ${week}, День ${day}`);
		
		// Проверяем, что daysStats существует
		if (!state.daysStats || Object.keys(state.daysStats).length === 0) {
			const stats = getMenuStatistics();
			if (stats) {
				state.daysStats = stats.days;
			}
		}
		
		const detail = getDayDetailedInfo(week, day);
		if (!detail) {
			document.getElementById('dayDetailContent').innerHTML = '<p style="color: #94a3b8;">Данные не найдены</p>';
			return;
		}
		
		const container = document.getElementById('dayDetailContainer');
		const content = document.getElementById('dayDetailContent');
		const title = document.getElementById('dayDetailTitle');
		
		if (!container || !content || !title) {
			console.error('❌ Не найдены элементы для деталей дня');
			return;
		}
		
		// Определяем статус дня
		const hasCritical = detail.violations.some(v => v.code === 15);
		const hasWarnings = detail.violations.some(v => v.code !== 15 && v.code !== 17);
		const hasDuplicates = detail.violations.some(v => v.code === 17);
		
		let statusColor = '#10b981';
		let statusIcon = '✅';
		let statusText = 'Все в норме';
		
		if (hasCritical) {
			statusColor = '#dc2626';
			statusIcon = '❌';
			statusText = 'Критические ошибки';
		} else if (hasWarnings || hasDuplicates) {
			statusColor = '#f59e0b';
			statusIcon = '⚠️';
			statusText = 'Есть нарушения';
		}
		
		title.textContent = `📋 Детальная сводка: Неделя ${week}, День ${day}`;
		container.style.display = 'block';
		
		const mealNames = {
			'breakfast': '🌅 Завтрак',
			'breakfast2': '🍎 Второй завтрак',
			'lunch': '🍲 Обед',
			'afternoonSnack': '🍪 Полдник',
			'dinner': '🌙 Ужин',
			'dinner2': '🥛 Второй ужин'
		};
		
		const mealColors = {
			'breakfast': '#f59e0b',
			'breakfast2': '#f97316',
			'lunch': '#ef4444',
			'afternoonSnack': '#10b981',
			'dinner': '#8b5cf6',
			'dinner2': '#ec4899'
		};
		
		// --- ШАПКА СВОДКИ ---
		let html = `
			<div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; padding: 16px 20px; background: linear-gradient(135deg, ${statusColor}10, ${statusColor}05); border-radius: 16px; border: 1px solid ${statusColor}30;">
				<div>
					<div style="font-size: 1.1rem; font-weight: 700; color: #0f172a;">
						${statusIcon} Статус: <span style="color: ${statusColor};">${statusText}</span>
					</div>
					<div style="font-size: 0.85rem; color: #64748b; margin-top: 4px;">
						${detail.dayData.dishes} блюд • ${detail.dayData.weight.toFixed(0)} г • ${detail.dayData.calories.toFixed(0)} ккал
					</div>
				</div>
				<div style="display: flex; gap: 12px; flex-wrap: wrap;">
					${hasCritical ? `<span style="padding: 4px 14px; background: #fef2f2; color: #dc2626; border-radius: 20px; font-size: 0.75rem; font-weight: 600;">🔴 Критических: ${detail.violations.filter(v => v.code === 15).length}</span>` : ''}
					${hasWarnings ? `<span style="padding: 4px 14px; background: #fffbeb; color: #d97706; border-radius: 20px; font-size: 0.75rem; font-weight: 600;">🟡 Предупреждений: ${detail.violations.filter(v => v.code !== 15 && v.code !== 17).length}</span>` : ''}
					${hasDuplicates ? `<span style="padding: 4px 14px; background: #fdf2f8; color: #ec4899; border-radius: 20px; font-size: 0.75rem; font-weight: 600;">🔄 Дубликатов: ${detail.violations.filter(v => v.code === 17).length}</span>` : ''}
					${!hasCritical && !hasWarnings && !hasDuplicates ? `<span style="padding: 4px 14px; background: #dcfce7; color: #16a34a; border-radius: 20px; font-size: 0.75rem; font-weight: 600;">✅ Все правила выполнены</span>` : ''}
				</div>
			</div>
		`;

		// --- СТАТИСТИКА ДНЯ (КАРТОЧКИ) ---
		html += `
			<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 20px;">
				<div style="background: linear-gradient(135deg, #f8fafc, #f1f5f9); padding: 14px; border-radius: 14px; text-align: center; border: 1px solid #e2e8f0;">
					<div style="font-size: 1.6rem; font-weight: 800; color: #0f172a;">${detail.dayData.dishes}</div>
					<div style="font-size: 0.7rem; color: #64748b;">🍽️ Блюд</div>
				</div>
				<div style="background: linear-gradient(135deg, #f8fafc, #f1f5f9); padding: 14px; border-radius: 14px; text-align: center; border: 1px solid #e2e8f0;">
					<div style="font-size: 1.6rem; font-weight: 800; color: #0f172a;">${detail.dayData.weight.toFixed(0)}</div>
					<div style="font-size: 0.7rem; color: #64748b;">⚖️ Вес (г)</div>
				</div>
				<div style="background: linear-gradient(135deg, #f8fafc, #f1f5f9); padding: 14px; border-radius: 14px; text-align: center; border: 1px solid #e2e8f0;">
					<div style="font-size: 1.6rem; font-weight: 800; color: #0f172a;">${detail.dayData.calories.toFixed(0)}</div>
					<div style="font-size: 0.7rem; color: #64748b;">🔥 Калории</div>
				</div>
				<div style="background: linear-gradient(135deg, #f8fafc, #f1f5f9); padding: 14px; border-radius: 14px; text-align: center; border: 1px solid #e2e8f0;">
					<div style="font-size: 1.6rem; font-weight: 800; color: #f59e0b;">${detail.dayData.price.toFixed(2)} ₽</div>
					<div style="font-size: 0.7rem; color: #64748b;">💰 Стоимость</div>
				</div>
			</div>
		`;

		// --- БЛЮДА ПО ПРИЁМАМ ПИЩИ ---
		html += `
			<div style="margin-bottom: 16px; display: flex; align-items: center; gap: 10px;">
				<span style="font-weight: 700; font-size: 1rem; color: #0f172a;">📋 Состав дня</span>
				<span style="font-size: 0.75rem; color: #94a3b8;">${Object.values(detail.meals).reduce((sum, items) => sum + items.length, 0)} блюд</span>
			</div>
			<div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px;">
		`;
		
		// Сортируем приёмы пищи в правильном порядке
		const mealOrder = ['breakfast', 'breakfast2', 'lunch', 'afternoonSnack', 'dinner', 'dinner2'];
		const sortedMeals = {};
		for (const mt of mealOrder) {
			if (detail.meals[mt]) {
				sortedMeals[mt] = detail.meals[mt];
			}
		}
		
		for (const [mealType, items] of Object.entries(sortedMeals)) {
			const color = mealColors[mealType] || '#64748b';
			const mealName = mealNames[mealType] || mealType;
			
			html += `
				<div style="background: white; border-radius: 14px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
					<div style="padding: 10px 16px; background: linear-gradient(135deg, ${color}15, ${color}05); border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
						<span style="font-weight: 600; color: #0f172a; font-size: 0.9rem;">
							<span style="color: ${color};">${mealName}</span>
							<span style="font-size: 0.7rem; color: #94a3b8; font-weight: 400;">(${items.length} блюд)</span>
						</span>
						<span style="font-size: 0.7rem; color: #64748b;">
							${items.reduce((sum, i) => sum + (i.weight || 0), 0).toFixed(0)} г • 
							${items.reduce((sum, i) => sum + (i.calories || 0), 0).toFixed(0)} ккал
						</span>
					</div>
					<div style="display: grid; grid-template-columns: 1fr; gap: 4px; padding: 8px 12px;">
			`;
			
			for (const item of items) {
				// Проверяем, есть ли у блюда ошибка
				const hasError = detail.violations.some(v => 
					v.meal === mealType && v.itemIndex === detail.items.indexOf(item) && v.code === 15
				);
				const hasWarning = detail.violations.some(v => 
					v.meal === mealType && v.itemIndex === detail.items.indexOf(item) && v.code !== 15 && v.code !== 17
				);
				
				const borderColor = hasError ? '#dc2626' : hasWarning ? '#f59e0b' : '#e2e8f0';
				const bgColor = hasError ? '#fef2f2' : hasWarning ? '#fffbeb' : 'white';
				
				html += `
					<div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 12px; background: ${bgColor}; border-radius: 8px; border-left: 3px solid ${borderColor}; transition: all 0.2s; font-size: 0.85rem;">
						<div style="display: flex; align-items: center; gap: 10px; overflow: hidden; flex: 1;">
							<span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: ${borderColor}; flex-shrink: 0;"></span>
							<span style="font-weight: 500; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
								${escapeHtml(item.name || 'Без названия')}
								${hasError ? '<span style="color: #dc2626; font-size: 0.65rem; margin-left: 6px;">⚠️ БЖУ > вес</span>' : ''}
								${hasWarning ? '<span style="color: #f59e0b; font-size: 0.65rem; margin-left: 6px;">⚠️</span>' : ''}
							</span>
							<span style="font-size: 0.65rem; color: #94a3b8; white-space: nowrap;">${escapeHtml(item.section || '—')}</span>
						</div>
						<div style="display: flex; align-items: center; gap: 12px; font-size: 0.75rem; color: #64748b; flex-shrink: 0;">
							${item.weight ? `<span>⚖️ ${item.weight}г</span>` : ''}
							${item.calories ? `<span>🔥 ${item.calories}</span>` : ''}
							${item.price ? `<span style="color: #f59e0b;">💰 ${item.price.toFixed(2)}</span>` : ''}
						</div>
					</div>
				`;
			}
			
			html += `
					</div>
				</div>
			`;
		}
		
		html += `</div>`;

		// --- РЕКОМЕНДАЦИИ ---
		const hasRecommendations = detail.recommendations.some(r => r.severity !== 'ok');
		
		if (hasRecommendations) {
			html += `
				<div style="margin-top: 16px;">
					<div style="font-weight: 700; font-size: 1rem; color: #0f172a; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
						<i class="fas fa-lightbulb" style="color: #f59e0b;"></i>
						Рекомендации по исправлению
						<span style="font-size: 0.7rem; color: #94a3b8; font-weight: 400;">(${detail.recommendations.filter(r => r.severity !== 'ok').length})</span>
					</div>
					<div style="display: flex; flex-direction: column; gap: 8px;">
			`;
			
			for (const rec of detail.recommendations) {
				if (rec.severity === 'ok') continue;
				
				const severityConfig = {
					critical: { bg: '#fef2f2', border: '#dc2626', icon: '🔴' },
					error: { bg: '#fef2f2', border: '#dc2626', icon: '❌' },
					warning: { bg: '#fffbeb', border: '#f59e0b', icon: '⚠️' }
				};
				
				const config = severityConfig[rec.severity] || severityConfig.warning;
				
				html += `
					<div style="padding: 12px 16px; background: ${config.bg}; border-left: 4px solid ${config.border}; border-radius: 10px; font-size: 0.85rem; display: flex; align-items: flex-start; gap: 10px;">
						<span style="font-size: 1.1rem; flex-shrink: 0;">${config.icon}</span>
						<span style="color: #1e293b; line-height: 1.5;">${rec.text}</span>
					</div>
				`;
			}
			
			html += `
					</div>
				</div>
			`;
		} else {
			html += `
				<div style="margin-top: 16px; padding: 16px 20px; background: #f0fdf4; border-radius: 12px; border: 1px solid #bbf7d0; text-align: center;">
					<span style="color: #16a34a; font-weight: 600;">✅ Все показатели в норме! Меню сбалансировано.</span>
				</div>
			`;
		}

		// --- ПОДВАЛ С КНОПКАМИ ---
		html += `
			<div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 10px; flex-wrap: wrap;">
				<button onclick="document.getElementById('dayDetailContainer').style.display='none'" style="padding: 6px 18px; border: 1px solid #e2e8f0; border-radius: 20px; background: white; cursor: pointer; font-size: 0.8rem; color: #64748b; transition: all 0.2s;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='white'">
					<i class="fas fa-times"></i> Закрыть
				</button>
				<button onclick="window.scrollToDayViolations(${week}, ${day})" style="padding: 6px 18px; border: none; border-radius: 20px; background: #3b82f6; cursor: pointer; font-size: 0.8rem; color: white; transition: all 0.2s;" onmouseover="this.style.background='#2563eb'" onmouseout="this.style.background='#3b82f6'">
					<i class="fas fa-arrow-right"></i> Перейти к нарушениям
				</button>
			</div>
		`;

		content.innerHTML = html;
		
		// Прокручиваем к деталям
		setTimeout(() => {
			container.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}, 100);
	}

	function attachDayCardEvents() {
		console.log('🔄 Привязка обработчиков для day-card...');
		
		const cards = document.querySelectorAll('.day-card');
		console.log(`📋 Найдено карточек: ${cards.length}`);
		
		if (cards.length === 0) {
			// Если карточек нет, пробуем ещё раз через 500ms
			setTimeout(attachDayCardEvents, 500);
			return;
		}
		
		cards.forEach(card => {
			// Удаляем старый обработчик, чтобы не было дублирования
			card.removeEventListener('click', handleDayCardClick);
			card.addEventListener('click', handleDayCardClick);
		});
		
		// Закрытие деталей
		const closeBtn = document.getElementById('closeDayDetail');
		if (closeBtn) {
			closeBtn.removeEventListener('click', closeDayDetailHandler);
			closeBtn.addEventListener('click', closeDayDetailHandler);
		}
		
		console.log('✅ Обработчики для day-card привязаны');
	}

	function handleDayCardClick(e) {
		const card = e.currentTarget;
		const week = parseInt(card.dataset.week);
		const day = parseInt(card.dataset.day);
		console.log(`🖱️ Клик по дню: Неделя ${week}, День ${day}`);
		renderDayDetail(week, day);
	}

	function closeDayDetailHandler() {
		document.getElementById('dayDetailContainer').style.display = 'none';
	}

	// ============================================================
	// ОБНОВЛЕНИЕ ПРИ СМЕНЕ ИСТОЧНИКА
	// ============================================================

	// Переключение источника данных аналитики: 'typical' | 'daily'.
	// dayKey для 'daily': "1_3" (неделя_день) из списка дней типового меню.
	// Возвращает true, если данные действительно подменились.
	function setAnalyticsSource(sourceType, dayKey) {
		const typicalSource = getTypicalSourceData();

		if (sourceType === 'daily') {
			const key = (dayKey === undefined || dayKey === null || dayKey === '') ? state._dailyDayKey : dayKey;
			if (key === undefined || key === null || key === '') return false;

			const dailyData = loadDailyMenuForAnalytics(key);
			if (!dailyData) return false;

			// Запоминаем типовое меню только один раз, чтобы повторное
			// переключение не «запоминало» один день как типовое.
			if (!state._originalTemplateData && state.templateMenuData) {
				state._originalTemplateData = state.templateMenuData;
			}
			state._sourceType = 'daily';
			state.templateMenuData = dailyData;
		} else {
			if (state._originalTemplateData) {
				state.templateMenuData = state._originalTemplateData;
				state._originalTemplateData = null;
			} else if (typicalSource) {
				state.templateMenuData = typicalSource;
			}
			state._sourceType = 'typical';
			state._dailyMenuNumber = null;
			state._dailyDayKey = null;
			state._dailyVariantName = null;
		}

		state.flatItems = buildFlatFromTemplate(state.templateMenuData);
		state.allViolations = runAllRules(state.templateMenuData);
		renderAnalytics();
		return true;
	}

	// Обратная совместимость с прежним названием
	function updateAnalyticsSource(sourceType, dailyIndex) {
		return setAnalyticsSource(sourceType, dailyIndex);
	}

	function exportSanPinReport() {
		const results = analyzeSanPinCompliance();
		if (!results) {
			if (typeof showStatus === 'function') {
				showStatus('Нет данных для экспорта', 'error');
			} else {
				console.error('Нет данных для экспорта');
			}
			return;
		}

		const now = new Date();
		const lines = [
			'='.repeat(80),
			`ОТЧЁТ ПО СООТВЕТСТВИЮ САНПИН 2.3/2.4.4282-26`,
			`Дата: ${now.toLocaleDateString('ru-RU')}`,
			`Возрастная категория: ${results.ageCategory}`,
			`Общий уровень соответствия: ${results.overallScore}%`,
			'='.repeat(80),
			'',
			'ПРИЁМЫ ПИЩИ:',
			''
		];

		for (const [mealType, data] of Object.entries(results.compliance)) {
			if (data.status === 'missing') {
				lines.push(`❌ ${getMealName(mealType)}: Отсутствует в меню`);
			} else {
				lines.push(`${data.statusText} ${getMealName(mealType)}:`);
				lines.push(`  Вес: ${data.avgWeight.toFixed(0)}г (норма ≥${data.norm.weight}г) ${data.weightCompliant ? '✅' : '❌'}`);
				lines.push(`  Калории: ${data.avgCalories.toFixed(0)}ккал (норма ≥${data.norm.calories}ккал) ${data.caloriesCompliant ? '✅' : '❌'}`);
				lines.push(`  БЖУ: ${data.avgProteins.toFixed(1)}/${data.avgFats.toFixed(1)}/${data.avgCarbs.toFixed(1)}г`);
				lines.push('');
			}
		}

		if (results.violations.length > 0) {
			lines.push('='.repeat(80));
			lines.push('ВЫЯВЛЕННЫЕ НАРУШЕНИЯ:');
			lines.push('');
			for (const v of results.violations) {
				lines.push(`[${getMealName(v.meal)}] ${v.issue}`);
				lines.push(`Рекомендация: ${v.recommendation}`);
				lines.push('');
			}
		}

		lines.push('='.repeat(80));
		lines.push(`Отчёт сгенерирован автоматически`);

		try {
			const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `sanpin_report_${now.toISOString().slice(0,10)}.txt`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);

			if (typeof showStatus === 'function') {
				showStatus('📄 Отчёт по СанПиН экспортирован', 'success');
			}
		} catch (e) {
			console.error('Ошибка экспорта:', e);
			if (typeof showStatus === 'function') {
				showStatus('Ошибка экспорта отчёта', 'error');
			}
		}
	}


    function renderMealsTab(stats) {
        const meals = stats.meals;
        const mealTypes = ['breakfast', 'breakfast2', 'lunch', 'afternoonSnack', 'dinner', 'dinner2'];

        let html = `<div class="analytics-panel" data-tab="meals" style="display: none;">`;
        html += `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">`;

        for (const mt of mealTypes) {
            const meal = meals[mt];
            if (!meal) {
                html += `
                    <div style="background: #f8fafc; border-radius: 16px; padding: 16px; border: 1px solid #e2e8f0; opacity: 0.5;">
                        <div style="font-weight: 600; color: #64748b;">${getMealEmoji(mt)} ${getMealName(mt)}</div>
                        <div style="font-size: 0.85rem; color: #94a3b8; margin-top: 8px;">✖️ Не представлен в меню</div>
                    </div>
                `;
                continue;
            }

            const color = getMealColor(mt);

            html += `
                <div style="background: white; border-radius: 16px; padding: 16px; border-left: 4px solid ${color}; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                    <div style="font-weight: 700; color: #0f172a; font-size: 1rem; display: flex; justify-content: space-between; align-items: center;">
                        <span>${getMealEmoji(mt)} ${getMealName(mt)}</span>
                        <span style="font-size: 0.7rem; color: #64748b; font-weight: 400;">${meal.count} блюд</span>
                    </div>
                    <div style="margin-top: 8px; font-size: 0.85rem; color: #64748b;">
                        <div style="display: flex; justify-content: space-between;"><span>Дней с приёмом:</span><span style="font-weight: 600; color: #0f172a;">${meal.daysWithMeal}</span></div>
                        <div style="display: flex; justify-content: space-between;"><span>Ср. вес:</span><span style="font-weight: 600; color: #0f172a;">${meal.avgWeight.toFixed(0)} г</span></div>
                        <div style="display: flex; justify-content: space-between;"><span>Ср. калории:</span><span style="font-weight: 600; color: #0f172a;">${meal.avgCalories.toFixed(0)} ккал</span></div>
                        <div style="display: flex; justify-content: space-between;"><span>Б/Ж/У:</span><span style="font-weight: 600; color: #0f172a;">${meal.proteins.toFixed(1)}/${meal.fats.toFixed(1)}/${meal.carbs.toFixed(1)} г</span></div>
                        <div style="display: flex; justify-content: space-between;"><span>💰 Стоимость:</span><span style="font-weight: 600; color: #f59e0b;">${meal.price.toFixed(2)} ₽</span></div>
                    </div>
                </div>
            `;
        }

        html += `</div>`;

        // Сводная таблица по приёмам
        html += `
            <div style="margin-top: 20px; background: #f8fafc; border-radius: 16px; padding: 16px; border: 1px solid #e2e8f0; overflow-x: auto;">
                <div style="font-weight: 600; color: #0f172a; margin-bottom: 12px;">📊 Сравнительная таблица</div>
                <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem;">
                    <thead>
                        <tr style="background: #f1f5f9;">
                            <th style="padding: 8px 12px; text-align: left; border: 1px solid #e2e8f0;">Приём пищи</th>
                            <th style="padding: 8px 12px; text-align: center; border: 1px solid #e2e8f0;">Блюд</th>
                            <th style="padding: 8px 12px; text-align: center; border: 1px solid #e2e8f0;">Дней</th>
                            <th style="padding: 8px 12px; text-align: center; border: 1px solid #e2e8f0;">Ср. вес (г)</th>
                            <th style="padding: 8px 12px; text-align: center; border: 1px solid #e2e8f0;">Ср. ккал</th>
                            <th style="padding: 8px 12px; text-align: center; border: 1px solid #e2e8f0;">Цена (₽)</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        for (const mt of mealTypes) {
            const meal = meals[mt];
            if (!meal) {
                html += `
                    <tr style="opacity: 0.5;">
                        <td style="padding: 6px 12px; border: 1px solid #e2e8f0;">${getMealEmoji(mt)} ${getMealName(mt)}</td>
                        <td style="padding: 6px 12px; text-align: center; border: 1px solid #e2e8f0;">—</td>
                        <td style="padding: 6px 12px; text-align: center; border: 1px solid #e2e8f0;">—</td>
                        <td style="padding: 6px 12px; text-align: center; border: 1px solid #e2e8f0;">—</td>
                        <td style="padding: 6px 12px; text-align: center; border: 1px solid #e2e8f0;">—</td>
                        <td style="padding: 6px 12px; text-align: center; border: 1px solid #e2e8f0;">—</td>
                    </tr>
                `;
                continue;
            }
            html += `
                <tr>
                    <td style="padding: 6px 12px; border: 1px solid #e2e8f0; font-weight: 600;">${getMealEmoji(mt)} ${getMealName(mt)}</td>
                    <td style="padding: 6px 12px; text-align: center; border: 1px solid #e2e8f0;">${meal.count}</td>
                    <td style="padding: 6px 12px; text-align: center; border: 1px solid #e2e8f0;">${meal.daysWithMeal}</td>
                    <td style="padding: 6px 12px; text-align: center; border: 1px solid #e2e8f0;">${meal.avgWeight.toFixed(0)}</td>
                    <td style="padding: 6px 12px; text-align: center; border: 1px solid #e2e8f0;">${meal.avgCalories.toFixed(0)}</td>
                    <td style="padding: 6px 12px; text-align: center; border: 1px solid #e2e8f0;">${meal.price.toFixed(2)}</td>
                </tr>
            `;
        }

        html += `
                    </tbody>
                </table>
            </div>
        </div>`;

        return html;
    }

    function renderViolationsTab(stats) {
        const v = stats.violations;
        const violations = state.allViolations;

        let html = `<div class="analytics-panel" data-tab="violations" style="display: none;">`;

        // Сводка нарушений
        html += `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 20px;">
                <div style="background: #fef2f2; padding: 16px; border-radius: 16px; border-left: 4px solid #dc2626;">
                    <div style="font-size: 1.6rem; font-weight: 800; color: #dc2626;">${v.total}</div>
                    <div style="font-size: 0.7rem; color: #64748b;">Всего нарушений</div>
                </div>
                <div style="background: #fef2f2; padding: 16px; border-radius: 16px; border-left: 4px solid #dc2626;">
                    <div style="font-size: 1.6rem; font-weight: 800; color: #dc2626;">${v.critical}</div>
                    <div style="font-size: 0.7rem; color: #64748b;">❌ Критических</div>
                </div>
                <div style="background: #fffbeb; padding: 16px; border-radius: 16px; border-left: 4px solid #f59e0b;">
                    <div style="font-size: 1.6rem; font-weight: 800; color: #d97706;">${v.warnings}</div>
                    <div style="font-size: 0.7rem; color: #64748b;">⚠️ Предупреждений</div>
                </div>
                <div style="background: #fdf2f8; padding: 16px; border-radius: 16px; border-left: 4px solid #ec4899;">
                    <div style="font-size: 1.6rem; font-weight: 800; color: #ec4899;">${v.duplicates}</div>
                    <div style="font-size: 0.7rem; color: #64748b;">🔄 Дубликатов</div>
                </div>
            </div>
        `;

        // Таблица нарушений по правилам
        if (Object.keys(v.byRule).length > 0) {
            html += `
                <div style="background: #f8fafc; border-radius: 16px; padding: 16px; border: 1px solid #e2e8f0; margin-bottom: 20px; overflow-x: auto;">
                    <div style="font-weight: 600; color: #0f172a; margin-bottom: 12px;">📋 Распределение по правилам</div>
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem;">
                        <thead>
                            <tr style="background: #f1f5f9;">
                                <th style="padding: 8px 12px; text-align: left; border: 1px solid #e2e8f0;">Правило</th>
                                <th style="padding: 8px 12px; text-align: center; border: 1px solid #e2e8f0;">Количество</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            for (const [rule, count] of Object.entries(v.byRule)) {
                const isCritical = rule.includes('15');
                html += `
                    <tr>
                        <td style="padding: 6px 12px; border: 1px solid #e2e8f0; ${isCritical ? 'font-weight: 600; color: #dc2626;' : ''}">${rule}</td>
                        <td style="padding: 6px 12px; text-align: center; border: 1px solid #e2e8f0; font-weight: 600;">${count}</td>
                    </tr>
                `;
            }
            html += `</tbody></table></div>`;
        }

        // Детальный список нарушений
        if (violations.length > 0) {
            html += `
                <div style="background: #f8fafc; border-radius: 16px; padding: 16px; border: 1px solid #e2e8f0; overflow-x: auto;">
                    <div style="font-weight: 600; color: #0f172a; margin-bottom: 12px;">📋 Детальный список</div>
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.75rem;">
                        <thead>
                            <tr style="background: #f1f5f9;">
                                <th style="padding: 6px 10px; text-align: left; border: 1px solid #e2e8f0;">День</th>
                                <th style="padding: 6px 10px; text-align: left; border: 1px solid #e2e8f0;">Приём</th>
                                <th style="padding: 6px 10px; text-align: left; border: 1px solid #e2e8f0;">Описание</th>
                                <th style="padding: 6px 10px; text-align: center; border: 1px solid #e2e8f0;">Тип</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            for (const v of violations.slice(0, 50)) {
                const mealName = v.meal ? getMealName(v.meal) : '—';
                const isCritical = v.code === 15;
                const type = isCritical ? '❌ Критично' : (v.code === 17 ? '🔄 Дубликат' : '⚠️ Предупреждение');
                html += `
                    <tr style="${isCritical ? 'background: #fef2f2;' : ''}">
                        <td style="padding: 4px 10px; border: 1px solid #e2e8f0;">Неделя ${v.week}, День ${v.day}</td>
                        <td style="padding: 4px 10px; border: 1px solid #e2e8f0;">${mealName}</td>
                        <td style="padding: 4px 10px; border: 1px solid #e2e8f0;">${escapeHtml(v.details || '—')}</td>
                        <td style="padding: 4px 10px; text-align: center; border: 1px solid #e2e8f0;">${type}</td>
                    </tr>
                `;
            }
            if (violations.length > 50) {
                html += `<tr><td colspan="4" style="padding: 8px; text-align: center; color: #64748b;">... и ещё ${violations.length - 50} нарушений</td></tr>`;
            }
            html += `</tbody></table></div>`;
        }

        html += `</div>`;
        return html;
    }

    // ============================================================
    // БАЛАНС БЖУ: граммы, доли, норма 1:1:4 и отклонения
    // Одна функция для диаграмм, таблицы и вердикта — чтобы цифры
    // в разных блоках вкладки не расходились между собой.
    // ============================================================
    function computeBjuBalance(proteins, fats, carbs) {
        const grams = {
            proteins: Math.max(0, parseFloat(proteins) || 0),
            fats: Math.max(0, parseFloat(fats) || 0),
            carbs: Math.max(0, parseFloat(carbs) || 0)
        };
        const total = grams.proteins + grams.fats + grams.carbs;

        // Доли в процентах с округлением до 0.1 так, чтобы сумма была ровно 100%
        function sharePercents(values) {
            const sum = values.reduce((a, b) => a + b, 0);
            if (sum <= 0) return values.map(() => 0);
            const pct = values.map(v => Math.round((v / sum) * 1000) / 10);
            const rest = Math.round((100 - pct.reduce((a, b) => a + b, 0)) * 10) / 10;
            if (rest !== 0) {
                let idx = 0;
                pct.forEach((v, i) => { if (v > pct[idx]) idx = i; });
                pct[idx] = Math.round((pct[idx] + rest) * 10) / 10;
            }
            return pct;
        }

        // Норма 1:1:4 — это доли 1/6, 1/6, 4/6, то есть 16.7 / 16.7 / 66.6%
        const gramsArr = [grams.proteins, grams.fats, grams.carbs];
        const normArr = [1, 1, 4];
        const pctArr = sharePercents(gramsArr);
        const normPctArr = sharePercents(normArr);

        const shares = { proteins: pctArr[0], fats: pctArr[1], carbs: pctArr[2] };
        const normShare = { proteins: normPctArr[0], fats: normPctArr[1], carbs: normPctArr[2] };

        // Норма 1:1:4 в граммах: «1 часть» = масса белков
        const part = grams.proteins;
        const normGrams = { proteins: part, fats: part, carbs: part * 4 };

        const labels = { proteins: 'Белки', fats: 'Жиры', carbs: 'Углеводы' };
        const colors = { proteins: '#3b82f6', fats: '#ef4444', carbs: '#f59e0b' };

        const rows = ['proteins', 'fats', 'carbs'].map(k => {
            const share = shares[k];
            const deviationPp = Math.round((share - normShare[k]) * 10) / 10;
            const deviationGrams = Math.round((grams[k] - normGrams[k]) * 10) / 10;
            const abs = Math.abs(deviationPp);
            const level = total <= 0 ? 'none' : abs <= 3 ? 'ok' : abs <= 8 ? 'warning' : 'bad';
            return {
                key: k,
                label: labels[k],
                color: colors[k],
                grams: Math.round(grams[k] * 10) / 10,
                share: share,
                normShare: normShare[k],
                normGrams: Math.round(normGrams[k] * 10) / 10,
                deviationPp: deviationPp,
                deviationGrams: deviationGrams,
                level: level
            };
        });

        const maxRow = rows.reduce((a, b) => (Math.abs(b.deviationPp) > Math.abs(a.deviationPp) ? b : a), rows[0]);
        const maxDeviation = Math.abs(maxRow.deviationPp);
        const status = total <= 0 ? 'none' : maxDeviation <= 3 ? 'good' : maxDeviation <= 8 ? 'warning' : 'bad';

        // Фактическое соотношение, приведённое к одной части белка
        const ratioParts = grams.proteins > 0
            ? [
                1,
                Math.round((grams.fats / grams.proteins) * 10) / 10,
                Math.round((grams.carbs / grams.proteins) * 10) / 10
            ]
            : null;

        return {
            grams: grams,
            total: Math.round(total * 10) / 10,
            normTotal: Math.round(part * 6 * 10) / 10,
            shares: shares,
            normShares: normShare,
            rows: rows,
            maxRow: maxRow,
            maxDeviation: maxDeviation,
            ratioParts: ratioParts,
            status: status
        };
    }

    function renderBJUTab(stats) {
        const bju = stats.bju;
        const balance = computeBjuBalance(bju.proteins, bju.fats, bju.carbs);
        const hasData = balance.total > 0;

        const statusMeta = {
            good: { text: '✅ Соотношение соответствует норме 1:1:4', color: '#10b981', mark: '✅' },
            warning: { text: '⚠️ Соотношение отличается от рекомендуемого', color: '#f59e0b', mark: '⚠️' },
            bad: { text: '❌ Соотношение далеко от нормы', color: '#dc2626', mark: '❌' },
            none: { text: 'Нет данных о БЖУ для анализа', color: '#94a3b8', mark: '—' }
        }[balance.status];

        const levelMeta = {
            ok: { text: 'в норме', color: '#10b981', mark: '✅' },
            warning: { text: 'умеренное', color: '#f59e0b', mark: '⚠️' },
            bad: { text: 'сильное', color: '#dc2626', mark: '❌' },
            none: { text: 'нет данных', color: '#94a3b8', mark: '—' }
        };

        const fmtGrams = v => (v > 0 ? '+' : '') + v.toFixed(1);
        const fmtPp = v => (v > 0 ? '+' : '') + v.toFixed(1);

        let html = `<div class="analytics-panel" data-tab="bju" style="display: none;">`;

        if (!hasData) {
            html += `
                <div style="padding: 50px 30px; text-align: center; color: #94a3b8;">
                    <i class="fas fa-balance-scale fa-3x" style="color: #cbd5e1; margin-bottom: 14px;"></i>
                    <h3 style="color: #0f172a; margin-bottom: 8px;">Нет данных о БЖУ</h3>
                    <p style="font-size: 0.9rem;">Заполните белки, жиры и углеводы блюд на вкладке «Редактор меню» — таблица и отклонения от 1:1:4 появятся автоматически.</p>
                </div>
            </div>`;
            return html;
        }

        // Круговые диаграммы
        html += `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; margin-bottom: 24px;">
                <div style="background: white; border-radius: 16px; padding: 20px; border: 1px solid #e2e8f0; text-align: center;">
                    <div style="font-weight: 600; color: #0f172a; margin-bottom: 12px;">📊 Фактическое соотношение БЖУ</div>
                    <div style="display: flex; justify-content: center; gap: 20px; flex-wrap: wrap;">
                        <div style="text-align: center;">
                            <div style="width: 80px; height: 80px; border-radius: 50%; background: conic-gradient(
                                #3b82f6 0% ${balance.shares.proteins}%,
                                #ef4444 ${balance.shares.proteins}% ${balance.shares.proteins + balance.shares.fats}%,
                                #f59e0b ${balance.shares.proteins + balance.shares.fats}% 100%
                            ); margin: 0 auto 8px;"></div>
                            <div style="font-size: 0.75rem; color: #64748b;">
                                <span style="color: #3b82f6;">● Б</span> ${balance.shares.proteins.toFixed(1)}% 
                                <span style="color: #ef4444;">● Ж</span> ${balance.shares.fats.toFixed(1)}% 
                                <span style="color: #f59e0b;">● У</span> ${balance.shares.carbs.toFixed(1)}%
                            </div>
                        </div>
                        <div style="text-align: left; font-size: 0.85rem; padding: 12px 0;">
                            <div><span style="color: #3b82f6;">●</span> Белки: <strong>${balance.grams.proteins.toFixed(1)} г</strong></div>
                            <div><span style="color: #ef4444;">●</span> Жиры: <strong>${balance.grams.fats.toFixed(1)} г</strong></div>
                            <div><span style="color: #f59e0b;">●</span> Углеводы: <strong>${balance.grams.carbs.toFixed(1)} г</strong></div>
                            <div style="margin-top: 4px; color: #94a3b8; font-size: 0.75rem;">Всего БЖУ: ${balance.total.toFixed(1)} г</div>
                        </div>
                    </div>
                </div>
                <div style="background: white; border-radius: 16px; padding: 20px; border: 1px solid #e2e8f0; text-align: center;">
                    <div style="font-weight: 600; color: #0f172a; margin-bottom: 12px;">🎯 Рекомендуемое соотношение (1:1:4)</div>
                    <div style="display: flex; justify-content: center; gap: 20px; flex-wrap: wrap;">
                        <div style="text-align: center;">
                            <div style="width: 80px; height: 80px; border-radius: 50%; background: conic-gradient(
                                #3b82f6 0% ${balance.normShares.proteins}%,
                                #ef4444 ${balance.normShares.proteins}% ${balance.normShares.proteins + balance.normShares.fats}%,
                                #f59e0b ${balance.normShares.proteins + balance.normShares.fats}% 100%
                            ); margin: 0 auto 8px;"></div>
                            <div style="font-size: 0.75rem; color: #64748b;">
                                <span style="color: #3b82f6;">● Б</span> ${balance.normShares.proteins.toFixed(1)}% 
                                <span style="color: #ef4444;">● Ж</span> ${balance.normShares.fats.toFixed(1)}% 
                                <span style="color: #f59e0b;">● У</span> ${balance.normShares.carbs.toFixed(1)}%
                            </div>
                        </div>
                        <div style="text-align: left; font-size: 0.85rem; padding: 12px 0;">
                            <div><span style="color: #3b82f6;">●</span> Белки: <strong>1 часть</strong></div>
                            <div><span style="color: #ef4444;">●</span> Жиры: <strong>1 часть</strong></div>
                            <div><span style="color: #f59e0b;">●</span> Углеводы: <strong>4 части</strong></div>
                            <div style="margin-top: 4px; color: #94a3b8; font-size: 0.75rem;">Соотношение Б:Ж:У = 1:1:4</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // ===== ТАБЛИЦА БЖУ =====
        const totalDeviationGrams = Math.round((balance.total - balance.normTotal) * 10) / 10;

        html += `
            <div style="background: white; border-radius: 16px; padding: 20px; border: 1px solid #e2e8f0; margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 14px;">
                    <div style="font-weight: 600; color: #0f172a;">
                        🧮 Таблица БЖУ и отклонения от соотношения 1:1:4
                    </div>
                    <div style="font-size: 0.75rem; color: #64748b;">
                        Фактически: <strong style="color: ${statusMeta.color};">${balance.ratioParts ? balance.ratioParts.join(' : ') : '—'}</strong>
                        &nbsp;·&nbsp; Норма: <strong>1 : 1 : 4</strong>
                    </div>
                </div>
                <div style="overflow-x: auto;">
                    <table class="bju-balance-table" style="width: 100%; border-collapse: collapse; font-size: 0.8rem; min-width: 720px;">
                        <thead>
                            <tr style="background: #f1f5f9;">
                                <th style="padding: 10px 12px; text-align: left; font-size: 0.7rem; color: #475569; text-transform: uppercase;">Показатель</th>
                                <th style="padding: 10px 12px; text-align: right; font-size: 0.7rem; color: #475569; text-transform: uppercase;">Факт, г</th>
                                <th style="padding: 10px 12px; text-align: right; font-size: 0.7rem; color: #475569; text-transform: uppercase;">Доля, %</th>
                                <th style="padding: 10px 12px; text-align: right; font-size: 0.7rem; color: #475569; text-transform: uppercase;">Норма 1:1:4, г</th>
                                <th style="padding: 10px 12px; text-align: right; font-size: 0.7rem; color: #475569; text-transform: uppercase;">Норма, %</th>
                                <th style="padding: 10px 12px; text-align: right; font-size: 0.7rem; color: #475569; text-transform: uppercase;">Отклонение, г</th>
                                <th style="padding: 10px 12px; text-align: right; font-size: 0.7rem; color: #475569; text-transform: uppercase;">Отклонение, п.п.</th>
                                <th style="padding: 10px 12px; text-align: center; font-size: 0.7rem; color: #475569; text-transform: uppercase;">Оценка</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${balance.rows.map(r => {
                                const lm = levelMeta[r.level];
                                return `
                                <tr style="border-bottom: 1px solid #f1f5f9;">
                                    <td style="padding: 10px 12px; font-weight: 600; color: #0f172a;">
                                        <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${r.color}; margin-right: 8px;"></span>${r.label}
                                    </td>
                                    <td style="padding: 10px 12px; text-align: right; font-weight: 600;">${r.grams.toFixed(1)}</td>
                                    <td style="padding: 10px 12px; text-align: right;">${r.share.toFixed(1)}</td>
                                    <td style="padding: 10px 12px; text-align: right; color: #64748b;">${hasData ? r.normGrams.toFixed(1) : '—'}</td>
                                    <td style="padding: 10px 12px; text-align: right; color: #64748b;">${r.normShare.toFixed(1)}</td>
                                    <td style="padding: 10px 12px; text-align: right; color: ${Math.abs(r.deviationGrams) <= r.normGrams * 0.15 ? '#10b981' : '#dc2626'}; font-weight: 600;">
                                        ${hasData ? fmtGrams(r.deviationGrams) : '—'}
                                    </td>
                                    <td style="padding: 10px 12px; text-align: right; color: ${lm.color}; font-weight: 700;">
                                        ${hasData ? fmtPp(r.deviationPp) : '—'}
                                    </td>
                                    <td style="padding: 10px 12px; text-align: center; color: ${lm.color}; font-weight: 600; white-space: nowrap;">
                                        ${lm.mark} ${lm.text}
                                    </td>
                                </tr>`;
                            }).join('')}
                            <tr style="background: #f8fafc; border-top: 2px solid #e2e8f0;">
                                <td style="padding: 10px 12px; font-weight: 700; color: #0f172a;">Итого БЖУ</td>
                                <td style="padding: 10px 12px; text-align: right; font-weight: 700;">${balance.total.toFixed(1)}</td>
                                <td style="padding: 10px 12px; text-align: right; font-weight: 700;">100.0</td>
                                <td style="padding: 10px 12px; text-align: right; color: #64748b;">${hasData ? balance.normTotal.toFixed(1) : '—'}</td>
                                <td style="padding: 10px 12px; text-align: right; color: #64748b;">100.0</td>
                                <td style="padding: 10px 12px; text-align: right; font-weight: 600; color: ${statusMeta.color};">
                                    ${hasData ? fmtGrams(totalDeviationGrams) : '—'}
                                </td>
                                <td style="padding: 10px 12px; text-align: right; color: #94a3b8;">—</td>
                                <td style="padding: 10px 12px; text-align: center; color: ${statusMeta.color}; font-weight: 700; white-space: nowrap;">
                                    ${statusMeta.mark} ${balance.status === 'good' ? 'норма' : balance.status === 'warning' ? 'отклонение' : balance.status === 'bad' ? 'не соответствует' : '—'}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div style="margin-top: 10px; font-size: 0.7rem; color: #94a3b8; line-height: 1.6;">
                    Норма в граммах взята от 1 части = массе белков (Б : Ж : У = 1× : 1× : 4×).
                    Отклонение в п.п. — разница между фактической и рекомендуемой долями в процентных пунктах.
                    Допустимое отклонение доли — до ±3 п.п., умеренное — до ±8 п.п.
                </div>
            </div>
        `;

        // ===== ОЦЕНКА СБАЛАНСИРОВАННОСТИ =====
        html += `
            <div style="background: ${statusMeta.color}10; border-radius: 16px; padding: 16px; border: 2px solid ${statusMeta.color}; margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                    <div>
                        <div style="font-weight: 600; color: #0f172a;">📈 Оценка сбалансированности</div>
                        <div style="font-size: 0.85rem; color: ${statusMeta.color};">${statusMeta.text}</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="font-size: 0.75rem; color: #64748b;">
                            Макс. отклонение: ${hasData ? balance.maxDeviation.toFixed(1) + ' п.п. (' + balance.maxRow.label.toLowerCase() + ')' : '—'}
                        </div>
                        <div style="padding: 4px 16px; border-radius: 20px; background: ${statusMeta.color}; color: white; font-weight: 600; font-size: 0.8rem;">
                            ${statusMeta.mark}
                        </div>
                    </div>
                </div>
                <div style="margin-top: 12px; display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px;">
                    ${balance.rows.map(r => {
                        const lm = levelMeta[r.level];
                        return `
                        <div style="background: white; border-radius: 8px; padding: 8px 12px; text-align: center; border: 1px solid #e2e8f0;">
                            <div style="font-size: 0.6rem; color: #94a3b8;">${r.label}: отклонение</div>
                            <div style="font-weight: 700; color: ${lm.color};">${hasData ? fmtPp(r.deviationPp) + ' п.п.' : '—'}</div>
                        </div>`;
                    }).join('')}
                </div>
            </div>
        `;

        // ===== РЕКОМЕНДАЦИИ =====
        const recommendations = [];
        const byKey = {};
        balance.rows.forEach(r => { byKey[r.key] = r; });

        if (hasData) {
            if (byKey.proteins.deviationPp < -5) {
                recommendations.push('🔹 Увеличьте долю белковых продуктов (мясо, рыба, яйца, бобовые)');
            } else if (byKey.proteins.deviationPp > 5) {
                recommendations.push('🔹 Уменьшите долю белковых продуктов, добавьте больше углеводов');
            }

            if (byKey.fats.deviationPp < -5) {
                recommendations.push('🔹 Добавьте полезные жиры (растительное масло, орехи, рыбу)');
            } else if (byKey.fats.deviationPp > 5) {
                recommendations.push('🔹 Уменьшите долю жирных продуктов');
            }

            if (byKey.carbs.deviationPp < -5) {
                recommendations.push('🔹 Добавьте больше сложных углеводов (крупы, овощи, хлеб)');
            } else if (byKey.carbs.deviationPp > 5) {
                recommendations.push('🔹 Уменьшите долю углеводов, особенно простых сахаров');
            }
        }

        if (recommendations.length > 0) {
            html += `
                <div style="background: #f0f9ff; border-radius: 16px; padding: 16px; border: 1px solid #bae6fd;">
                    <div style="font-weight: 600; color: #0369a1; margin-bottom: 8px;">💡 Рекомендации по улучшению БЖУ</div>
                    <ul style="margin-left: 20px; font-size: 0.85rem; color: #0c4a6e; line-height: 1.8;">
                        ${recommendations.map(r => `<li>${r}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        html += `</div>`;
        return html;
    }

    // ============================================================
    // ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ АНАЛИТИКИ
    // ============================================================

    function buildFlatFromTemplate(template) {
        if (!template || !template.weeks) return [];
        const flat = [];
        const mealTypes = ['breakfast', 'breakfast2', 'lunch', 'afternoonSnack', 'dinner', 'dinner2'];

        for (const w in template.weeks) {
            for (const d in template.weeks[w]) {
                for (const mt of mealTypes) {
                    const meal = template.weeks[w][d][mt];
                    if (meal && meal.items) {
                        for (let idx = 0; idx < meal.items.length; idx++) {
                            const item = meal.items[idx];
                            flat.push({
                                id: `${w}_${d}_${mt}_${idx}`,
                                week: parseInt(w),
                                day: parseInt(d),
                                meal: mt,
                                section: item.section || '',
                                name: item.name || '',
                                weight: item.weight || 0,
                                calories: item.calories || 0,
                                proteins: item.proteins || 0,
                                fats: item.fats || 0,
                                carbs: item.carbs || 0,
                                recipeId: item.recipeId || '',
                                price: item.price || 0
                            });
                        }
                    }
                }
            }
        }
        return flat;
    }

    function runAllRules(template) {
        if (!template || !template.weeks) return [];
        const violations = [];
        const mealTypes = ['breakfast', 'breakfast2', 'lunch', 'afternoonSnack', 'dinner', 'dinner2'];

        for (const w in template.weeks) {
            for (const d in template.weeks[w]) {
                const day = template.weeks[w][d];
                let dayFruitWeight = 0;

                for (const mt of mealTypes) {
                    const meal = day[mt];
                    if (!meal || !meal.items || !meal.items.length) continue;

                    const items = meal.items;
                    const totalWeight = items.reduce((sum, i) => sum + (parseFloat(i.weight) || 0), 0);
                    const totalCalories = items.reduce((sum, i) => sum + (parseFloat(i.calories) || 0), 0);
                    const hotWeight = items.filter(i => normalizeSectionName(i.section) === 'гор.блюдо').reduce((sum, i) => sum + (parseFloat(i.weight) || 0), 0);
                    const zakuskaWeight = items.filter(i => normalizeSectionName(i.section) === 'закуска').reduce((sum, i) => sum + (parseFloat(i.weight) || 0), 0);
                    const firstWeight = items.filter(i => normalizeSectionName(i.section) === '1 блюдо').reduce((sum, i) => sum + (parseFloat(i.weight) || 0), 0);
                    const secondWeight = items.filter(i => normalizeSectionName(i.section) === '2 блюдо').reduce((sum, i) => sum + (parseFloat(i.weight) || 0), 0);
                    const garnishWeight = items.filter(i => normalizeSectionName(i.section) === 'гарнир').reduce((sum, i) => sum + (parseFloat(i.weight) || 0), 0);
                    const fruitWeight = items.filter(i => normalizeSectionName(i.section) === 'фрукты').reduce((sum, i) => sum + (parseFloat(i.weight) || 0), 0);
                    dayFruitWeight += fruitWeight;

                    // Правила
                    if (mt === 'breakfast' && totalWeight > 0 && totalWeight < 500) {
                        violations.push({ rule: 1, code: 1, week: parseInt(w), day: parseInt(d), meal: mt, itemIndex: 0, details: `Завтрак: ${totalWeight}г < 500г` });
                    }
                    if (mt === 'lunch' && totalWeight > 0 && totalWeight < 700) {
                        violations.push({ rule: 2, code: 2, week: parseInt(w), day: parseInt(d), meal: mt, itemIndex: 0, details: `Обед: ${totalWeight}г < 700г` });
                    }
                    if (mt === 'breakfast' && hotWeight > 0 && hotWeight < 150) {
                        violations.push({ rule: 3, code: 3, week: parseInt(w), day: parseInt(d), meal: mt, itemIndex: 0, details: `гор.блюдо: ${hotWeight}г < 150г` });
                    }
                    if (mt === 'lunch' && zakuskaWeight > 0 && zakuskaWeight < 60) {
                        violations.push({ rule: 4, code: 4, week: parseInt(w), day: parseInt(d), meal: mt, itemIndex: 0, details: `закуска: ${zakuskaWeight}г < 60г` });
                    }
                    if (mt === 'lunch' && firstWeight > 0 && firstWeight < 200) {
                        violations.push({ rule: 5, code: 5, week: parseInt(w), day: parseInt(d), meal: mt, itemIndex: 0, details: `1 блюдо: ${firstWeight}г < 200г` });
                    }
                    if (mt === 'lunch' && secondWeight > 0 && secondWeight < 90) {
                        violations.push({ rule: 6, code: 6, week: parseInt(w), day: parseInt(d), meal: mt, itemIndex: 0, details: `2 блюдо: ${secondWeight}г < 90г` });
                    }
                    if (mt === 'lunch' && garnishWeight > 0 && garnishWeight < 150) {
                        violations.push({ rule: 8, code: 8, week: parseInt(w), day: parseInt(d), meal: mt, itemIndex: 0, details: `гарнир: ${garnishWeight}г < 150г` });
                    }
                    if (mt === 'breakfast2' && totalWeight > 0 && totalWeight < 200) {
                        violations.push({ rule: 9, code: 9, week: parseInt(w), day: parseInt(d), meal: mt, itemIndex: 0, details: `2 завтрак: ${totalWeight}г < 200г` });
                    }
                    if (mt === 'afternoonSnack' && totalWeight > 0 && totalWeight < 300) {
                        violations.push({ rule: 10, code: 10, week: parseInt(w), day: parseInt(d), meal: mt, itemIndex: 0, details: `Полдник: ${totalWeight}г < 300г` });
                    }
                    if (mt === 'dinner' && totalWeight > 0 && totalWeight < 500) {
                        violations.push({ rule: 11, code: 11, week: parseInt(w), day: parseInt(d), meal: mt, itemIndex: 0, details: `Ужин: ${totalWeight}г < 500г` });
                    }
                    if (mt === 'dinner2' && totalWeight > 0 && totalWeight < 200) {
                        violations.push({ rule: 12, code: 12, week: parseInt(w), day: parseInt(d), meal: mt, itemIndex: 0, details: `2 ужин: ${totalWeight}г < 200г` });
                    }

                    // Калории с учётом лагеря
                    const breakfastNorm = state.isSummerCamp ? 517 : 470;
                    const lunchNorm = state.isSummerCamp ? 776 : 705;

                    if (mt === 'breakfast' && totalCalories > 0 && totalCalories < breakfastNorm) {
                        violations.push({ rule: 13, code: 13, week: parseInt(w), day: parseInt(d), meal: mt, itemIndex: 0, details: `Калории завтрака: ${totalCalories}ккал < ${breakfastNorm}ккал${state.isSummerCamp ? ' (летний период)' : ''}` });
                    }
                    if (mt === 'lunch' && totalCalories > 0 && totalCalories < lunchNorm) {
                        violations.push({ rule: 14, code: 14, week: parseInt(w), day: parseInt(d), meal: mt, itemIndex: 0, details: `Калории обеда: ${totalCalories}ккал < ${lunchNorm}ккал${state.isSummerCamp ? ' (летний период)' : ''}` });
                    }

                    // БЖУ
                    for (let idx = 0; idx < items.length; idx++) {
                        const item = items[idx];
                        const bju = (parseFloat(item.proteins) || 0) + (parseFloat(item.fats) || 0) + (parseFloat(item.carbs) || 0);
                        const weight = parseFloat(item.weight) || 0;
                        if (bju > weight && weight > 0) {
                            violations.push({ rule: 15, code: 15, week: parseInt(w), day: parseInt(d), meal: mt, itemIndex: idx, details: `"${item.name}": БЖУ=${bju}г > вес=${weight}г` });
                        }
                    }
                }

                if (dayFruitWeight > 0 && dayFruitWeight < 100) {
                    violations.push({ rule: 16, code: 16, week: parseInt(w), day: parseInt(d), itemIndex: 0, details: `Фруктов за день: ${dayFruitWeight}г < 100г` });
                }
            }
        }

        // Дубликаты
        const duplicates = checkDuplicateDishes(template);
        for (const d of duplicates) {
            violations.push({ rule: 17, code: 17, week: d.week, day: d.day, itemIndex: 0, details: `Повтор блюда: "${d.dishName}"` });
        }

        return violations;
    }

    function checkDuplicateDishes(template) {
        if (!template || !template.weeks) return [];
        const duplicates = [];
        const mealTypes = ['breakfast', 'breakfast2', 'lunch', 'afternoonSnack', 'dinner', 'dinner2'];

        for (const w in template.weeks) {
            for (const d in template.weeks[w]) {
                const allDishNames = [];
                for (const mt of mealTypes) {
                    const meal = template.weeks[w][d][mt];
                    if (meal && meal.items) {
                        for (const item of meal.items) {
                            if (item.name && item.name.trim() &&
                                !item.name.toLowerCase().includes('булоч') &&
                                !item.name.toLowerCase().includes('напиток') &&
                                !item.name.toLowerCase().includes('хлеб')) {
                                if (allDishNames.includes(item.name) &&
                                    !item.name.includes('чай') &&
                                    !item.name.includes('компот')) {
                                    duplicates.push({ week: parseInt(w), day: parseInt(d), dishName: item.name });
                                }
                                allDishNames.push(item.name);
                            }
                        }
                    }
                }
            }
        }
        return duplicates;
    }

    function updateCampInfo() {
        const campCheckbox = document.getElementById('summerCampCheckbox');
        if (campCheckbox) {
            state.isSummerCamp = campCheckbox.checked;
        }
    }

    // ============================================================
    // ФИЛЬТРЫ И ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ (4.1)
    // ============================================================

	function renderFiltersBar(data) {
		const weeks = data && data.weeks ? Object.keys(data.weeks).sort((a,b) => a-b) : [];
		const mealTypes = ['breakfast', 'breakfast2', 'lunch', 'afternoonSnack', 'dinner', 'dinner2'];
		const sections = [...new Set(state.flatItems.map(i => normalizeSectionName(i.section) || 'Без раздела'))].sort();

		const f = state.filters;
		const activeCount = [f.week !== 'all', f.meal !== 'all', f.section !== 'all', f.onlyViolations].filter(Boolean).length;

		return `
			<div id="analyticsFilters" style="display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; align-items: center; background: #f8fafc; padding: 12px 16px; border-radius: 12px; border: 1px solid #e2e8f0;">
				<span style="font-weight: 600; font-size: 0.8rem; color: #0f172a;">
					<i class="fas fa-filter"></i> Фильтры:
				</span>
				<select id="filterWeek" style="padding: 5px 12px; border-radius: 8px; border: 1px solid #e2e8f0; background: white; font-size: 0.75rem;">
					<option value="all" ${f.week==='all'?'selected':''}>Все недели</option>
					${weeks.map(w => `<option value="${w}" ${f.week===w?'selected':''}>Неделя ${w}</option>`).join('')}
				</select>
				<select id="filterMeal" style="padding: 5px 12px; border-radius: 8px; border: 1px solid #e2e8f0; background: white; font-size: 0.75rem;">
					<option value="all" ${f.meal==='all'?'selected':''}>Все приёмы</option>
					${mealTypes.map(mt => `<option value="${mt}" ${f.meal===mt?'selected':''}>${getMealName(mt)}</option>`).join('')}
				</select>
				<select id="filterSection" style="padding: 5px 12px; border-radius: 8px; border: 1px solid #e2e8f0; background: white; font-size: 0.75rem; max-width: 180px;">
					<option value="all" ${f.section==='all'?'selected':''}>Все разделы</option>
					${sections.map(s => `<option value="${escapeHtml(s)}" ${f.section===s?'selected':''}>${escapeHtml(s)}</option>`).join('')}
				</select>
				<label style="display: flex; align-items: center; gap: 6px; font-size: 0.75rem; color: #475569; cursor: pointer;">
					<input type="checkbox" id="filterOnlyViolations" ${f.onlyViolations?'checked':''} style="cursor: pointer;">
					Только с нарушениями
				</label>
				${activeCount > 0 ? `<button id="filterReset" class="btn btn-secondary" style="padding: 4px 12px; font-size: 0.7rem;">
					<i class="fas fa-times"></i> Сбросить (${activeCount})
				</button>` : ''}
				<span style="font-size: 0.7rem; color: #94a3b8; margin-left: auto;">
					${activeCount > 0 ? '📌 Фильтры активны' : 'Показаны все данные'}
				</span>
			</div>
		`;
	}

	function applyFilters() {
		const f = state.filters;
		let filtered = [...state.flatItems];

		if (f.week !== 'all') {
			filtered = filtered.filter(i => String(i.week) === f.week);
		}
		if (f.meal !== 'all') {
			filtered = filtered.filter(i => i.meal === f.meal);
		}
		if (f.section !== 'all') {
			filtered = filtered.filter(i => normalizeSectionName(i.section) === f.section);
		}
		if (f.onlyViolations) {
			const violationKeys = new Set();
			for (const v of state.allViolations) {
				violationKeys.add(`${v.week}_${v.day}_${v.meal || ''}`);
			}
			filtered = filtered.filter(i => violationKeys.has(`${i.week}_${i.day}_${i.meal || ''}`));
		}

		state._filteredFlat = filtered;
		return filtered;
	}

	function getFilteredStats() {
		const flat = applyFilters();
		const totalWeight = flat.reduce((s, i) => s + (i.weight || 0), 0);
		const totalCalories = flat.reduce((s, i) => s + (i.calories || 0), 0);
		const totalProteins = flat.reduce((s, i) => s + (i.proteins || 0), 0);
		const totalFats = flat.reduce((s, i) => s + (i.fats || 0), 0);
		const totalCarbs = flat.reduce((s, i) => s + (i.carbs || 0), 0);
		const totalPrice = flat.reduce((s, i) => s + (i.price || 0), 0);
		const totalDishes = flat.length;
		const daysSet = new Set(flat.map(i => `${i.week}_${i.day}`));
		const totalDays = daysSet.size || 1;

		return {
			totalDishes, totalWeight, totalCalories, totalProteins, totalFats, totalCarbs, totalPrice,
			avgWeightPerDay: totalWeight / totalDays,
			avgCaloriesPerDay: totalCalories / totalDays,
			avgProteinsPerDay: totalProteins / totalDays,
			avgFatsPerDay: totalFats / totalDays,
			avgCarbsPerDay: totalCarbs / totalDays,
			avgPricePerDay: totalPrice / totalDays,
			totalDays,
			items: flat
		};
	}

	// ============================================================
    // ПЛАН VS ФАКТ (4.2)
    // ============================================================

	function renderPlanFactTab() {
		const compliance = analyzeSanPinCompliance();
		if (!compliance) {
			return `<div class="analytics-panel" data-tab="planfact" style="display: none;"><p style="padding: 40px; text-align: center; color: #94a3b8;">Нет данных для анализа</p></div>`;
		}

		const mealTypes = ['breakfast', 'breakfast2', 'lunch', 'afternoonSnack', 'dinner', 'dinner2'];
		const norms = compliance.norms;

		let rows = '';
		for (const mt of mealTypes) {
			const norm = norms[mt];
			if (!norm) continue;
			const c = compliance.compliance[mt];
			if (!c || c.status === 'missing') {
				rows += `
					<tr style="background: #fef2f2;">
						<td style="padding: 10px 12px; font-weight: 600;">${getMealEmoji(mt)} ${getMealName(mt)}</td>
						<td colspan="8" style="padding: 10px 12px; color: #dc2626; text-align: center;">❌ Приём пищи отсутствует в меню</td>
					</tr>
				`;
				continue;
			}

			const dev = (actual, normVal) => {
				if (!normVal) return '—';
				const pct = ((actual - normVal) / normVal) * 100;
				const sign = pct >= 0 ? '+' : '';
				const color = pct >= 0 ? '#16a34a' : '#dc2626';
				return `<span style="color: ${color}; font-weight: 600;">${sign}${pct.toFixed(1)}%</span>`;
			};

			const cell = (actual, normVal) => {
				const ok = actual >= normVal * 0.9;
				return `<td style="padding: 8px 10px; text-align: center; background: ${ok ? '#f0fdf4' : '#fef2f2'};">
					<div style="font-weight: 600; color: #0f172a;">${actual.toFixed(0)}</div>
					<div style="font-size: 0.65rem; color: #94a3b8;">норма: ${normVal}</div>
					<div style="font-size: 0.65rem;">${dev(actual, normVal)}</div>
				</td>`;
			};

			rows += `
				<tr>
					<td style="padding: 10px 12px; font-weight: 600;">${getMealEmoji(mt)} ${getMealName(mt)}</td>
					${cell(c.avgWeight, norm.weight)}
					${cell(c.avgCalories, norm.calories)}
					${cell(c.avgProteins, norm.proteins)}
					${cell(c.avgFats, norm.fats)}
					${cell(c.avgCarbs, norm.carbs)}
					<td style="padding: 8px 10px; text-align: center;">
						<span style="padding: 4px 12px; border-radius: 20px; background: ${c.statusColor}; color: white; font-size: 0.7rem; font-weight: 600;">${c.compliancePercent}%</span>
					</td>
				</tr>
			`;
		}

		return `
			<div class="analytics-panel" data-tab="planfact" style="display: none;">
				<div style="background: white; border-radius: 16px; padding: 20px; border: 1px solid #e2e8f0; margin-bottom: 16px;">
					<div style="font-weight: 600; color: #0f172a; margin-bottom: 4px;">
						<i class="fas fa-clipboard-check" style="color: #059669;"></i> Сравнение плана и факта по нормам СанПиН
					</div>
					<div style="font-size: 0.75rem; color: #64748b; margin-bottom: 16px;">
						Возрастная категория: <b>${escapeHtml(compliance.ageCategory)}</b> · Общая оценка соответствия: <b style="color: ${compliance.overallScore >= 80 ? '#16a34a' : compliance.overallScore >= 50 ? '#f59e0b' : '#dc2626'};">${compliance.overallScore}%</b>
					</div>
					<div style="overflow-x: auto;">
						<table style="width: 100%; border-collapse: collapse; font-size: 0.8rem;">
							<thead>
								<tr style="background: #f1f5f9;">
									<th style="padding: 10px 12px; text-align: left; font-size: 0.7rem; color: #475569; text-transform: uppercase;">Приём пищи</th>
									<th style="padding: 8px 10px; font-size: 0.7rem; color: #475569; text-transform: uppercase;">Вес (г)</th>
									<th style="padding: 8px 10px; font-size: 0.7rem; color: #475569; text-transform: uppercase;">Калории</th>
									<th style="padding: 8px 10px; font-size: 0.7rem; color: #475569; text-transform: uppercase;">Белки (г)</th>
									<th style="padding: 8px 10px; font-size: 0.7rem; color: #475569; text-transform: uppercase;">Жиры (г)</th>
									<th style="padding: 8px 10px; font-size: 0.7rem; color: #475569; text-transform: uppercase;">Углеводы (г)</th>
									<th style="padding: 8px 10px; font-size: 0.7rem; color: #475569; text-transform: uppercase;">Соответствие</th>
								</tr>
							</thead>
							<tbody>${rows}</tbody>
						</table>
					</div>
					<div style="margin-top: 12px; font-size: 0.7rem; color: #94a3b8;">
						Зелёным выделены значения ≥ 90% от нормы, красным — ниже. Допуск 10%.
					</div>
				</div>
			</div>
		`;
	}

	// ============================================================
    // ГРАФИК ТРЕНДОВ ПО ДНЯМ (4.3)
    // ============================================================

	function renderTrendsTab(stats) {
		const data = state.templateMenuData;
		if (!data || !data.weeks) {
			return `<div class="analytics-panel" data-tab="trends" style="display: none;"><p style="padding: 40px; text-align: center; color: #94a3b8;">Нет данных</p></div>`;
		}

		const mealTypes = ['breakfast', 'breakfast2', 'lunch', 'afternoonSnack', 'dinner', 'dinner2'];
		const dayList = [];
		for (const w in data.weeks) {
			for (const d in data.weeks[w]) {
				const dayData = data.weeks[w][d];
				let calories = 0, weight = 0, proteins = 0, fats = 0, carbs = 0;
				for (const mt of mealTypes) {
					const meal = dayData[mt];
					if (meal && meal.items) {
						for (const item of meal.items) {
							calories += parseFloat(item.calories) || 0;
							weight += parseFloat(item.weight) || 0;
							proteins += parseFloat(item.proteins) || 0;
							fats += parseFloat(item.fats) || 0;
							carbs += parseFloat(item.carbs) || 0;
						}
					}
				}
				dayList.push({ week: parseInt(w), day: parseInt(d), calories, weight, proteins, fats, carbs });
			}
		}
		dayList.sort((a, b) => a.week - b.week || a.day - b.day);

		const ageCategory = state.schoolInfo?.ageCategory || '7-11 лет';
		const norms = SANPIN_2026.ageGroups[ageCategory]?.meals || SANPIN_2026.ageGroups['7-11 лет'].meals;
		const dailyNormMin = mealTypes.reduce((s, mt) => s + (norms[mt]?.calories || 0), 0);
		const dailyNormMax = dailyNormMin * 1.15;

		const values = dayList.map(d => d.calories);
		const maxVal = Math.max(...values, dailyNormMax) * 1.1;
		const minVal = Math.min(...values, dailyNormMin) * 0.85;
		const range = maxVal - minVal || 1;

		const chartW = 800;
		const chartH = 300;
		const padL = 60, padR = 20, padT = 20, padB = 40;
		const plotW = chartW - padL - padR;
		const plotH = chartH - padT - padB;
		const n = dayList.length || 1;

		const xScale = (i) => padL + (i / Math.max(n - 1, 1)) * plotW;
		const yScale = (v) => padT + plotH - ((v - minVal) / range) * plotH;

		const linePath = dayList.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i).toFixed(1)} ${yScale(d.calories).toFixed(1)}`).join(' ');
		const areaPath = linePath + ` L ${xScale(n-1).toFixed(1)} ${yScale(minVal).toFixed(1)} L ${xScale(0).toFixed(1)} ${yScale(minVal).toFixed(1)} Z`;

		const normY1 = yScale(dailyNormMin);
		const normY2 = yScale(dailyNormMax);

		const dots = dayList.map((d, i) => {
			const cx = xScale(i);
			const cy = yScale(d.calories);
			const inNorm = d.calories >= dailyNormMin && d.calories <= dailyNormMax;
			return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="4" fill="${inNorm ? '#10b981' : d.calories < dailyNormMin ? '#ef4444' : '#f59e0b'}" stroke="white" stroke-width="1.5"><title>День ${i+1}: ${d.calories.toFixed(0)} ккал</title></circle>`;
		}).join('');

		const xLabels = dayList.map((d, i) => {
			if (n > 20 && i % Math.ceil(n / 15) !== 0) return '';
			return `<text x="${xScale(i).toFixed(1)}" y="${chartH - 10}" text-anchor="middle" font-size="9" fill="#94a3b8">${i + 1}</text>`;
		}).join('');

		const yTicks = [];
		for (let t = 0; t <= 4; t++) {
			const v = minVal + (range * t / 4);
			const y = yScale(v);
			yTicks.push(`<line x1="${padL}" y1="${y.toFixed(1)}" x2="${chartW - padR}" y2="${y.toFixed(1)}" stroke="#f1f5f9" stroke-width="1"/><text x="${padL - 8}" y="${(y + 3).toFixed(1)}" text-anchor="end" font-size="9" fill="#94a3b8">${v.toFixed(0)}</text>`);
		}

		const avgCal = values.reduce((a, b) => a + b, 0) / (n || 1);
		const avgY = yScale(avgCal);
		const belowNorm = dayList.filter(d => d.calories < dailyNormMin).length;
		const aboveNorm = dayList.filter(d => d.calories > dailyNormMax).length;
		const inNorm = dayList.filter(d => d.calories >= dailyNormMin && d.calories <= dailyNormMax).length;

		return `
			<div class="analytics-panel" data-tab="trends" style="display: none;">
				<div style="background: white; border-radius: 16px; padding: 20px; border: 1px solid #e2e8f0; margin-bottom: 16px;">
					<div style="font-weight: 600; color: #0f172a; margin-bottom: 4px;">
						<i class="fas fa-chart-line" style="color: #059669;"></i> Тренд калорийности по дням
					</div>
					<div style="font-size: 0.75rem; color: #64748b; margin-bottom: 16px;">
						Зелёная зона — норма (${dailyNormMin.toFixed(0)}–${dailyNormMax.toFixed(0)} ккал/день) · Среднее: <b>${avgCal.toFixed(0)} ккал</b>
					</div>
					<div style="overflow-x: auto;">
						<svg width="${chartW}" height="${chartH}" viewBox="0 0 ${chartW} ${chartH}" style="max-width: 100%;">
							${yTicks.join('')}
							<rect x="${padL}" y="${Math.min(normY1, normY2).toFixed(1)}" width="${plotW}" height="${Math.abs(normY2 - normY1).toFixed(1)}" fill="#10b981" opacity="0.12"/>
							<line x1="${padL}" y1="${normY1.toFixed(1)}" x2="${chartW - padR}" y2="${normY1.toFixed(1)}" stroke="#10b981" stroke-width="1.5" stroke-dasharray="4 3"/>
							<line x1="${padL}" y1="${normY2.toFixed(1)}" x2="${chartW - padR}" y2="${normY2.toFixed(1)}" stroke="#10b981" stroke-width="1" stroke-dasharray="3 3" opacity="0.5"/>
							<line x1="${padL}" y1="${avgY.toFixed(1)}" x2="${chartW - padR}" y2="${avgY.toFixed(1)}" stroke="#3b82f6" stroke-width="1" stroke-dasharray="6 3"/>
							<text x="${chartW - padR - 5}" y="${(avgY - 4).toFixed(1)}" text-anchor="end" font-size="9" fill="#3b82f6">среднее ${avgCal.toFixed(0)}</text>
							<path d="${areaPath}" fill="#3b82f6" opacity="0.08"/>
							<path d="${linePath}" fill="none" stroke="#3b82f6" stroke-width="2"/>
							${dots}
							${xLabels}
							<text x="${padL}" y="${chartH - 22}" font-size="9" fill="#64748b">День меню →</text>
						</svg>
					</div>
					<div style="display: flex; gap: 16px; margin-top: 16px; flex-wrap: wrap;">
						<div style="background: #f0fdf4; padding: 10px 16px; border-radius: 12px; border: 1px solid #bbf7d0;">
							<div style="font-size: 1.4rem; font-weight: 800; color: #16a34a;">${inNorm}</div>
							<div style="font-size: 0.7rem; color: #64748b;">🟢 В норме</div>
						</div>
						<div style="background: #fef2f2; padding: 10px 16px; border-radius: 12px; border: 1px solid #fecaca;">
							<div style="font-size: 1.4rem; font-weight: 800; color: #dc2626;">${belowNorm}</div>
							<div style="font-size: 0.7rem; color: #64748b;">🔴 Ниже нормы</div>
						</div>
						<div style="background: #fffbeb; padding: 10px 16px; border-radius: 12px; border: 1px solid #fde68a;">
							<div style="font-size: 1.4rem; font-weight: 800; color: #d97706;">${aboveNorm}</div>
							<div style="font-size: 0.7rem; color: #64748b;">🟡 Выше нормы</div>
						</div>
					</div>
				</div>
			</div>
		`;
	}

	// ============================================================
    // ТЕПЛОВАЯ КАРТА НАРУШЕНИЙ (4.4)
    // ============================================================

	function renderHeatmapTab(stats) {
		const data = state.templateMenuData;
		if (!data || !data.weeks) {
			return `<div class="analytics-panel" data-tab="heatmap" style="display: none;"><p style="padding: 40px; text-align: center; color: #94a3b8;">Нет данных</p></div>`;
		}

		const mealTypes = ['breakfast', 'breakfast2', 'lunch', 'afternoonSnack', 'dinner', 'dinner2'];
		const violations = state.allViolations;

		const dayList = [];
		for (const w in data.weeks) {
			for (const d in data.weeks[w]) {
				dayList.push({ week: parseInt(w), day: parseInt(d) });
			}
		}
		dayList.sort((a, b) => a.week - b.week || a.day - b.day);

		const violationMap = {};
		for (const v of violations) {
			const key = `${v.week}_${v.day}_${v.meal || ''}`;
			violationMap[key] = (violationMap[key] || 0) + 1;
		}

		const dayHasData = {};
		for (const w in data.weeks) {
			for (const d in data.weeks[w]) {
				for (const mt of mealTypes) {
					const meal = data.weeks[w][d][mt];
					if (meal && meal.items && meal.items.length > 0) {
						dayHasData[`${w}_${d}_${mt}`] = true;
					}
				}
			}
		}

		const getCell = (week, day, meal) => {
			const key = `${week}_${day}_${meal}`;
			const count = violationMap[key] || 0;
			const has = dayHasData[key];
			if (!has) return { emoji: '⚪', bg: '#f8fafc', title: 'Нет данных' };
			if (count === 0) return { emoji: '🟢', bg: '#dcfce7', title: 'Нарушений нет' };
			if (count <= 2) return { emoji: '🟡', bg: '#fef9c3', title: `${count} наруш.` };
			return { emoji: '🔴', bg: '#fee2e2', title: `${count} наруш.` };
		};

		const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

		let headerCells = mealTypes.map(mt => `<th style="padding: 8px 6px; font-size: 0.65rem; color: #475569; font-weight: 600;">${getMealEmoji(mt)}<br>${getMealName(mt)}</th>`).join('');

		let bodyRows = '';
		for (let i = 0; i < dayList.length; i++) {
			const { week, day } = dayList[i];
			const dayLabel = `#${i + 1}`;
			const dayName = dayNames[(day - 1) % 6] || `Д${day}`;
			const cells = mealTypes.map(mt => {
				const c = getCell(week, day, mt);
				return `<td style="padding: 6px; text-align: center; background: ${c.bg}; border-radius: 6px; font-size: 0.9rem;" title="${c.title}">${c.emoji}</td>`;
			}).join('');
			bodyRows += `<tr><td style="padding: 6px 8px; font-weight: 600; font-size: 0.7rem; color: #475569;">${dayName} ${dayLabel}</td>${cells}</tr>`;
		}

		return `
			<div class="analytics-panel" data-tab="heatmap" style="display: none;">
				<div style="background: white; border-radius: 16px; padding: 20px; border: 1px solid #e2e8f0; margin-bottom: 16px;">
					<div style="font-weight: 600; color: #0f172a; margin-bottom: 4px;">
						<i class="fas fa-th" style="color: #059669;"></i> Тепловая карта нарушений по дням и приёмам пищи
					</div>
					<div style="font-size: 0.75rem; color: #64748b; margin-bottom: 16px;">
						Каждая ячейка показывает статус приёма пищи в конкретный день меню
					</div>
					<div style="overflow-x: auto;">
						<table style="border-collapse: separate; border-spacing: 4px; font-size: 0.8rem;">
							<thead>
								<tr><th style="padding: 8px 6px; font-size: 0.65rem; color: #475569;">День</th>${headerCells}</tr>
							</thead>
							<tbody>${bodyRows}</tbody>
						</table>
					</div>
					<div style="display: flex; gap: 16px; margin-top: 16px; font-size: 0.75rem; color: #64748b;">
						<span>⚪ — нет данных</span>
						<span>🟢 — нарушений нет</span>
						<span>🟡 — 1–2 нарушения</span>
						<span>🔴 — 3 и более нарушений</span>
					</div>
				</div>
			</div>
		`;
	}

	// ============================================================
    // ТОП БЛЮД (4.5)
    // ============================================================

	function renderTopDishesTab(stats) {
		const flat = state.flatItems;
		if (!flat || flat.length === 0) {
			return `<div class="analytics-panel" data-tab="topdishes" style="display: none;"><p style="padding: 40px; text-align: center; color: #94a3b8;">Нет данных</p></div>`;
		}

		const dishMap = {};
		for (const item of flat) {
			if (!item.name || item.name.trim() === '') continue;
			const key = item.name.trim();
			if (!dishMap[key]) {
				dishMap[key] = { name: key, count: 0, totalCalories: 0, totalWeight: 0, meals: new Set() };
			}
			dishMap[key].count++;
			dishMap[key].totalCalories += parseFloat(item.calories) || 0;
			dishMap[key].totalWeight += parseFloat(item.weight) || 0;
			dishMap[key].meals.add(item.meal);
		}

		const dishes = Object.values(dishMap);
		const byFreq = [...dishes].sort((a, b) => b.count - a.count).slice(0, 10);
		const byCal = [...dishes].sort((a, b) => b.totalCalories - a.totalCalories).slice(0, 10);
		const rareDishes = dishes.filter(d => d.count === 1).sort((a, b) => b.totalCalories - a.totalCalories).slice(0, 10);

		const renderDishRow = (d, i, showCal = true) => `
			<div style="display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: ${i % 2 ? '#f8fafc' : 'white'}; border-radius: 10px;">
				<div style="width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.75rem; flex-shrink: 0;">${i + 1}</div>
				<div style="flex: 1; min-width: 0;">
					<div style="font-weight: 600; color: #0f172a; font-size: 0.85rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(d.name)}</div>
					<div style="font-size: 0.7rem; color: #94a3b8;">${d.count} раз · ${d.meals.size} приём(ов) · ${d.totalWeight.toFixed(0)} г</div>
				</div>
				${showCal ? `<div style="text-align: right; flex-shrink: 0;"><div style="font-weight: 700; color: #f59e0b;">${d.totalCalories.toFixed(0)}</div><div style="font-size: 0.6rem; color: #94a3b8;">ккал</div></div>` : ''}
			</div>
		`;

		return `
			<div class="analytics-panel" data-tab="topdishes" style="display: none;">
				<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px;">
					<div style="background: white; border-radius: 16px; padding: 20px; border: 1px solid #e2e8f0;">
						<div style="font-weight: 600; color: #0f172a; margin-bottom: 12px;">
							<i class="fas fa-star" style="color: #f59e0b;"></i> Топ-10 по частоте
						</div>
						<div style="display: flex; flex-direction: column; gap: 4px;">
							${byFreq.map((d, i) => renderDishRow(d, i, true)).join('')}
						</div>
					</div>
					<div style="background: white; border-radius: 16px; padding: 20px; border: 1px solid #e2e8f0;">
						<div style="font-weight: 600; color: #0f172a; margin-bottom: 12px;">
							<i class="fas fa-fire" style="color: #ef4444;"></i> Топ-10 по калорийности
						</div>
						<div style="display: flex; flex-direction: column; gap: 4px;">
							${byCal.map((d, i) => renderDishRow(d, i, true)).join('')}
						</div>
					</div>
					<div style="background: white; border-radius: 16px; padding: 20px; border: 1px solid #e2e8f0;">
						<div style="font-weight: 600; color: #0f172a; margin-bottom: 12px;">
							<i class="fas fa-leaf" style="color: #10b981;"></i> Редкие блюда (1 раз)
						</div>
						<div style="display: flex; flex-direction: column; gap: 4px;">
							${rareDishes.length > 0 ? rareDishes.map((d, i) => renderDishRow(d, i, true)).join('') : '<p style="color: #94a3b8; font-size: 0.85rem; padding: 20px; text-align: center;">Все блюда встречаются более одного раза</p>'}
						</div>
					</div>
				</div>
			</div>
		`;
	}

	// ============================================================
    // РЕКОМЕНДАЦИИ (4.9)
    // ============================================================

	function renderRecommendationsTab() {
		const compliance = analyzeSanPinCompliance();
		if (!compliance) {
			return `<div class="analytics-panel" data-tab="recommendations" style="display: none;"><p style="padding: 40px; text-align: center; color: #94a3b8;">Нет данных</p></div>`;
		}

		const recs = compliance.recommendations || [];
		const violations = compliance.violations || [];
		const mealRecs = violations.filter(v => v.recommendation);

		const priorityBadge = (p) => {
			if (p === 'high') return `<span style="padding: 3px 10px; border-radius: 20px; background: #fee2e2; color: #dc2626; font-size: 0.65rem; font-weight: 600;">Высокий приоритет</span>`;
			if (p === 'medium') return `<span style="padding: 3px 10px; border-radius: 20px; background: #fef9c3; color: #d97706; font-size: 0.65rem; font-weight: 600;">Средний</span>`;
			return `<span style="padding: 3px 10px; border-radius: 20px; background: #dcfce7; color: #16a34a; font-size: 0.65rem; font-weight: 600;">Низкий</span>`;
		};

		let generalHtml = recs.length > 0 ? recs.map(r => `
			<div style="padding: 14px 16px; background: #fef2f2; border-radius: 12px; border-left: 4px solid #dc2626; margin-bottom: 8px;">
				<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
					${priorityBadge(r.priority)}
				</div>
				<div style="font-weight: 600; color: #0f172a; font-size: 0.85rem;">${escapeHtml(r.text)}</div>
				${r.details ? `<div style="font-size: 0.75rem; color: #64748b; margin-top: 4px;">${escapeHtml(r.details)}</div>` : ''}
			</div>
		`).join('') : `<div style="padding: 20px; background: #f0fdf4; border-radius: 12px; border-left: 4px solid #10b981; color: #16a34a; font-weight: 600;">✅ Общих рекомендаций нет — меню соответствует нормам</div>`;

		let mealHtml = mealRecs.length > 0 ? mealRecs.map(v => `
			<div style="padding: 14px 16px; background: #fffbeb; border-radius: 12px; border-left: 4px solid #f59e0b; margin-bottom: 8px;">
				<div style="font-weight: 600; color: #0f172a; font-size: 0.85rem; margin-bottom: 4px;">
					${getMealEmoji(v.meal)} ${getMealName(v.meal)}
				</div>
				<div style="font-size: 0.8rem; color: #dc2626; margin-bottom: 6px;">⚠️ ${escapeHtml(v.issue)}</div>
				<div style="font-size: 0.8rem; color: #059669;">💡 ${escapeHtml(v.recommendation)}</div>
			</div>
		`).join('') : '';

		return `
			<div class="analytics-panel" data-tab="recommendations" style="display: none;">
				<div style="background: white; border-radius: 16px; padding: 20px; border: 1px solid #e2e8f0; margin-bottom: 16px;">
					<div style="font-weight: 600; color: #0f172a; margin-bottom: 4px;">
						<i class="fas fa-lightbulb" style="color: #f59e0b;"></i> Общие рекомендации
					</div>
					<div style="font-size: 0.75rem; color: #64748b; margin-bottom: 16px;">
						Оценка соответствия: <b style="color: ${compliance.overallScore >= 80 ? '#16a34a' : compliance.overallScore >= 50 ? '#f59e0b' : '#dc2626'};">${compliance.overallScore}%</b> · Возраст: ${escapeHtml(compliance.ageCategory)}
					</div>
					${generalHtml}
				</div>
				${mealRecs.length > 0 ? `
				<div style="background: white; border-radius: 16px; padding: 20px; border: 1px solid #e2e8f0;">
					<div style="font-weight: 600; color: #0f172a; margin-bottom: 16px;">
						<i class="fas fa-utensils" style="color: #f59e0b;"></i> Рекомендации по приёмам пищи
					</div>
					${mealHtml}
				</div>
				` : ''}
			</div>
		`;
	}

	// ============================================================
    // СРАВНЕНИЕ МЕНЮ ПО НОМЕРАМ (4.10)
    // ============================================================

	function renderMenuCompareTab(stats) {
		const data = state.templateMenuData;
		if (!data || !data.weeks) {
			return `<div class="analytics-panel" data-tab="menucompare" style="display: none;"><p style="padding: 40px; text-align: center; color: #94a3b8;">Нет данных</p></div>`;
		}

		const mealTypes = ['breakfast', 'breakfast2', 'lunch', 'afternoonSnack', 'dinner', 'dinner2'];
		const dayList = [];
		for (const w in data.weeks) {
			for (const d in data.weeks[w]) {
				dayList.push({ week: parseInt(w), day: parseInt(d), data: data.weeks[w][d] });
			}
		}
		dayList.sort((a, b) => a.week - b.week || a.day - b.day);

		const ageCategory = state.schoolInfo?.ageCategory || '7-11 лет';
		const norms = SANPIN_2026.ageGroups[ageCategory]?.meals || SANPIN_2026.ageGroups['7-11 лет'].meals;
		const maxMenus = Math.min(dayList.length, 10);

		const getMenuStats = (dayData) => {
			const result = {};
			let totalCal = 0, totalWeight = 0;
			for (const mt of mealTypes) {
				const meal = dayData[mt];
				let cal = 0, w = 0;
				if (meal && meal.items) {
					for (const item of meal.items) {
						cal += parseFloat(item.calories) || 0;
						w += parseFloat(item.weight) || 0;
					}
				}
				result[mt] = { calories: cal, weight: w };
				totalCal += cal;
				totalWeight += w;
			}
			result._total = { calories: totalCal, weight: totalWeight };
			return result;
		};

		const menuStats = dayList.map(d => getMenuStats(d.data));
		const dailyNorm = mealTypes.reduce((s, mt) => s + (norms[mt]?.calories || 0), 0);

		const cellColor = (cal, norm) => {
			if (cal === 0) return '#f8fafc';
			if (norm && cal < norm * 0.9) return '#fee2e2';
			if (norm && cal > norm * 1.15) return '#fef9c3';
			return '#dcfce7';
		};

		let header = '<tr style="background: #f1f5f9;"><th style="padding: 8px 10px; font-size: 0.7rem; color: #475569; text-align: left;">Приём</th>';
		for (let i = 0; i < maxMenus; i++) {
			header += `<th style="padding: 8px 6px; font-size: 0.7rem; color: #475569; text-align: center;">Меню ${i + 1}</th>`;
		}
		header += '</tr>';

		let body = '';
		for (const mt of mealTypes) {
			const norm = norms[mt]?.calories || 0;
			let row = `<tr><td style="padding: 8px 10px; font-weight: 600; font-size: 0.8rem;">${getMealEmoji(mt)} ${getMealName(mt)}</td>`;
			for (let i = 0; i < maxMenus; i++) {
				const cal = menuStats[i]?.[mt]?.calories || 0;
				row += `<td style="padding: 6px; text-align: center; background: ${cellColor(cal, norm)}; font-size: 0.75rem; font-weight: 600; color: ${cal === 0 ? '#cbd5e1' : '#0f172a'};">${cal > 0 ? cal.toFixed(0) : '—'}</td>`;
			}
			row += '</tr>';
			body += row;
		}

		let totalRow = `<tr style="background: #f8fafc; font-weight: 700;"><td style="padding: 8px 10px; font-size: 0.8rem;">Σ Итого</td>`;
		for (let i = 0; i < maxMenus; i++) {
			const cal = menuStats[i]?._total?.calories || 0;
			totalRow += `<td style="padding: 6px; text-align: center; background: ${cellColor(cal, dailyNorm)}; font-size: 0.75rem; font-weight: 700;">${cal.toFixed(0)}</td>`;
		}
		totalRow += '</tr>';

		return `
			<div class="analytics-panel" data-tab="menucompare" style="display: none;">
				<div style="background: white; border-radius: 16px; padding: 20px; border: 1px solid #e2e8f0; margin-bottom: 16px;">
					<div style="font-weight: 600; color: #0f172a; margin-bottom: 4px;">
						<i class="fas fa-columns" style="color: #059669;"></i> Сравнение меню по номерам (калорийность)
					</div>
					<div style="font-size: 0.75rem; color: #64748b; margin-bottom: 16px;">
						Дневная норма: ${dailyNorm.toFixed(0)} ккал · Зелёный — в норме, жёлтый — выше, красный — ниже
					</div>
					<div style="overflow-x: auto;">
						<table style="width: 100%; border-collapse: collapse; font-size: 0.8rem;">
							<thead>${header}</thead>
							<tbody>${body}${totalRow}</tbody>
						</table>
					</div>
				</div>
			</div>
		`;
	}

	// ============================================================
    // ЭКСПОРТ EXCEL / CSV / SHARE (4.6)
    // ============================================================

	function exportAnalyticsExcel() {
		const stats = getMenuStatistics();
		if (!stats) { showStatus('Нет данных для экспорта', 'error'); return; }

		try {
			if (typeof XLSX === 'undefined') { showStatus('Библиотека Excel не загружена', 'error'); return; }

			const wb = XLSX.utils.book_new();
			const s = stats.summary;

			const summaryData = [
				['Показатель', 'Значение'],
				['Всего блюд', s.totalDishes],
				['Дней', s.totalDays],
				['Недель', s.totalWeeks],
				['Общий вес (г)', s.totalWeight.toFixed(0)],
				['Общая калорийность', s.totalCalories.toFixed(0)],
				['Белки (г)', s.totalProteins.toFixed(1)],
				['Жиры (г)', s.totalFats.toFixed(1)],
				['Углеводы (г)', s.totalCarbs.toFixed(1)],
				['Стоимость (₽)', s.totalPrice.toFixed(2)],
				['Ср. калорий/день', s.avgCaloriesPerDay.toFixed(0)],
				['Нарушений всего', stats.violations.total],
			];
			const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
			XLSX.utils.book_append_sheet(wb, ws1, 'Сводка');

			const mealTypes = ['breakfast', 'breakfast2', 'lunch', 'afternoonSnack', 'dinner', 'dinner2'];
			const mealRows = [['Приём', 'Блюд', 'Вес (г)', 'Калории', 'Белки', 'Жиры', 'Углеводы', 'Цена']];
			for (const mt of mealTypes) {
				const m = stats.meals[mt];
				if (m) mealRows.push([getMealName(mt), m.count, m.weight.toFixed(0), m.calories.toFixed(0), m.proteins.toFixed(1), m.fats.toFixed(1), m.carbs.toFixed(1), m.price.toFixed(2)]);
			}
			const ws2 = XLSX.utils.aoa_to_sheet(mealRows);
			XLSX.utils.book_append_sheet(wb, ws2, 'По приёмам');

			const itemRows = [['Неделя', 'День', 'Приём', 'Раздел', 'Блюдо', 'Вес', 'Калории', 'Белки', 'Жиры', 'Углеводы', 'Цена']];
			for (const item of state.flatItems) {
				itemRows.push([item.week, item.day, getMealName(item.meal), item.section || '', item.name || '', item.weight || 0, item.calories || 0, item.proteins || 0, item.fats || 0, item.carbs || 0, item.price || 0]);
			}
			const ws3 = XLSX.utils.aoa_to_sheet(itemRows);
			XLSX.utils.book_append_sheet(wb, ws3, 'Блюда');

			XLSX.writeFile(wb, `analytics_menu_${new Date().toISOString().slice(0,10)}.xlsx`);
			showStatus('📊 Аналитика экспортирована в Excel', 'success');
		} catch(e) {
			console.error('Excel export error:', e);
			showStatus('Ошибка экспорта в Excel: ' + e.message, 'error');
		}
	}

	function exportAnalyticsCSV() {
		const flat = state.flatItems;
		if (!flat || flat.length === 0) { showStatus('Нет данных для экспорта', 'error'); return; }

		const headers = ['Неделя', 'День', 'Приём', 'Раздел', 'Блюдо', 'Вес', 'Калории', 'Белки', 'Жиры', 'Углеводы', 'Цена'];
		const rows = [headers.join(';')];
		for (const item of flat) {
			const vals = [item.week, item.day, getMealName(item.meal), (item.section || '').replace(/;/g, ','), (item.name || '').replace(/;/g, ','), item.weight || 0, item.calories || 0, item.proteins || 0, item.fats || 0, item.carbs || 0, item.price || 0];
			rows.push(vals.join(';'));
		}

		const csv = '\uFEFF' + rows.join('\n');
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `analytics_menu_${new Date().toISOString().slice(0,10)}.csv`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		showStatus('📄 Аналитика экспортирована в CSV', 'success');
	}

	function shareAnalytics() {
		const stats = getMenuStatistics();
		if (!stats) { showStatus('Нет данных', 'error'); return; }
		const s = stats.summary;
		const text = `📊 Аналитика меню\n\n` +
			`• Блюд: ${s.totalDishes}\n` +
			`• Дней: ${s.totalDays}\n` +
			`• Ср. калорий/день: ${s.avgCaloriesPerDay.toFixed(0)}\n` +
			`• Белки/Жиры/Углеводы: ${s.totalProteins.toFixed(0)}/${s.totalFats.toFixed(0)}/${s.totalCarbs.toFixed(0)} г\n` +
			`• Нарушений: ${stats.violations.total}\n` +
			`• Стоимость: ${s.totalPrice.toFixed(2)} ₽`;

		if (navigator.share) {
			navigator.share({ title: 'Аналитика меню', text: text }).then(
				() => showStatus('✅ Данные отправлены', 'success'),
				() => {}
			);
		} else if (navigator.clipboard) {
			navigator.clipboard.writeText(text).then(
				() => showStatus('📋 Сводка скопирована в буфер обмена', 'success'),
				() => showStatus('Не удалось скопировать', 'error')
			);
		} else {
			showStatus('Отправка не поддерживается в этом браузере', 'error');
		}
	}

	// ============================================================
    // СРАВНЕНИЕ С ПРЕДЫДУЩИМ ПЕРИОДОМ (4.7)
    // ============================================================

	function getPreviousPeriodStats() {
		const data = state.templateMenuData;
		if (!data || !data.weeks) return null;

		const weeks = Object.keys(data.weeks).sort((a, b) => a - b);
		if (weeks.length < 2) return null;

		const currentWeek = weeks[weeks.length - 1];
		const prevWeek = weeks[weeks.length - 2];
		const mealTypes = ['breakfast', 'breakfast2', 'lunch', 'afternoonSnack', 'dinner', 'dinner2'];

		const calcWeek = (weekKey) => {
			const weekData = data.weeks[weekKey];
			let cal = 0, weight = 0, proteins = 0, fats = 0, carbs = 0, dishes = 0;
			const days = Object.keys(weekData).length || 1;
			for (const d in weekData) {
				for (const mt of mealTypes) {
					const meal = weekData[d][mt];
					if (meal && meal.items) {
						for (const item of meal.items) {
							cal += parseFloat(item.calories) || 0;
							weight += parseFloat(item.weight) || 0;
							proteins += parseFloat(item.proteins) || 0;
							fats += parseFloat(item.fats) || 0;
							carbs += parseFloat(item.carbs) || 0;
							dishes++;
						}
					}
				}
			}
			return { calories: cal / days, weight: weight / days, proteins: proteins / days, fats: fats / days, carbs: carbs / days, dishes, days };
		};

		return { current: calcWeek(currentWeek), previous: calcWeek(prevWeek), currentLabel: `Неделя ${currentWeek}`, prevLabel: `Неделя ${prevWeek}` };
	}

    // ============================================================
    // СОБЫТИЯ
    // ============================================================

	function attachAnalyticsEvents() {
		// Переключение вкладок
		document.querySelectorAll('.analytics-tab').forEach(tab => {
			tab.addEventListener('click', function() {
				const tabName = this.dataset.tab;
				
				document.querySelectorAll('.analytics-tab').forEach(t => {
					t.classList.remove('active');
					t.style.background = 'transparent';
					t.style.color = '#64748b';
					t.style.boxShadow = 'none';
				});
				this.classList.add('active');
				this.style.background = 'white';
				this.style.color = '#059669';
				this.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';

				document.querySelectorAll('.analytics-panel').forEach(p => {
					p.style.display = 'none';
				});
				const target = document.querySelector(`.analytics-panel[data-tab="${tabName}"]`);
				if (target) {
					target.style.display = 'block';
				}
			});
		});

		// Кнопка обновления
		document.getElementById('analyticsRefresh')?.addEventListener('click', function() {
			renderAnalytics();
			showStatus('✅ Аналитика обновлена', 'success');
		});

		// Кнопка экспорта HTML
		document.getElementById('analyticsExportHTML')?.addEventListener('click', function() {
			exportAnalyticsHTML();
		});

		// Кнопка экспорта PDF
		document.getElementById('analyticsExportPDF')?.addEventListener('click', function() {
			exportAnalyticsPDF();
		});

		// ✅ ДОБАВЛЯЕМ ОБРАБОТЧИКИ ДЛЯ ВЫБОРА ИСТОЧНИКА
		const sourceTypicalBtn = document.getElementById('analyticsSourceTypical');
		const sourceDailyBtn = document.getElementById('analyticsSourceDaily');
		const dailySelect = document.getElementById('analyticsDailySelect');

		if (sourceTypicalBtn) {
			sourceTypicalBtn.addEventListener('click', function() {
				// Переключаем ДАННЫЕ (а не только вид кнопок) и перерисовываем
				const ok = setAnalyticsSource('typical');
				if (ok) {
					showStatus('📊 Переключено на анализ типового меню', 'success');
				} else {
					showStatus('⚠️ Не удалось вернуться к типовому меню', 'warning');
				}
			});
		}

		if (sourceDailyBtn && dailySelect) {
			sourceDailyBtn.addEventListener('click', function() {
				const dayKey = dailySelect.value;
				const ok = setAnalyticsSource('daily', dayKey);
				if (ok) {
					dailySelect.style.display = 'inline-block';
					showStatus(`📊 ${state._dailyVariantName || 'День типового меню'}`, 'success');
				} else {
					showStatus('⚠️ В типовом меню нет дней для выбора', 'warning');
				}
			});
		}

		if (dailySelect) {
			dailySelect.addEventListener('change', function() {
				const dayKey = this.value;
				if (!dayKey) return;
				if (state._sourceType === 'daily') {
					if (setAnalyticsSource('daily', dayKey)) {
						showStatus(`📊 ${state._dailyVariantName || 'День типового меню'}`, 'success');
					}
				}
			});
		}

		// Обновление при изменении чекбокса лагеря
		document.getElementById('summerCampCheckbox')?.addEventListener('change', function() {
			state.isSummerCamp = this.checked;
			if (document.getElementById('tabAnalytics').style.display !== 'none') {
				renderAnalytics();
			}
		});
		
		document.querySelectorAll('.analytics-tab').forEach(tab => {
			tab.addEventListener('click', function() {
				const tabName = this.dataset.tab;

				// ✅ Если переключились на вкладку "days", привязываем обработчики
				if (tabName === 'days') {
					setTimeout(attachDayCardEvents, 200);
				}
			});
		});

		// ✅ ФИЛЬТРЫ АНАЛИТИКИ (4.1)
		document.getElementById('filterWeek')?.addEventListener('change', function() {
			state.filters.week = this.value;
			renderAnalytics();
		});
		document.getElementById('filterMeal')?.addEventListener('change', function() {
			state.filters.meal = this.value;
			renderAnalytics();
		});
		document.getElementById('filterSection')?.addEventListener('change', function() {
			state.filters.section = this.value;
			renderAnalytics();
		});
		document.getElementById('filterOnlyViolations')?.addEventListener('change', function() {
			state.filters.onlyViolations = this.checked;
			renderAnalytics();
		});
		document.getElementById('filterReset')?.addEventListener('click', function() {
			state.filters = { week: 'all', meal: 'all', section: 'all', onlyViolations: false };
			renderAnalytics();
		});

		// ✅ ЭКСПОРТ EXCEL / CSV / SHARE (4.6)
		document.getElementById('analyticsExportExcel')?.addEventListener('click', exportAnalyticsExcel);
		document.getElementById('analyticsExportCSV')?.addEventListener('click', exportAnalyticsCSV);
		document.getElementById('analyticsShare')?.addEventListener('click', shareAnalytics);
	}

    // ============================================================
    // ЭКСПОРТ
    // ============================================================

    function exportAnalyticsHTML() {
        const content = document.getElementById('analyticsContent');
        if (!content) return;

        const styles = document.querySelector('style').innerHTML;
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Аналитика меню</title>
                <style>${styles}</style>
                <style>
                    body { padding: 30px; background: white; }
                    .no-print { display: none; }
                    .analytics-tab { display: none !important; }
                    .analytics-panel { display: block !important; }
                </style>
            </head>
            <body>
                <div style="max-width: 1400px; margin: 0 auto;">
                    ${content.innerHTML}
                </div>
                <script>
                    window.print();
                <\/script>
            </body>
            </html>
        `;

        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics_menu_${new Date().toISOString().slice(0,10)}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showStatus('📄 Аналитика экспортирована в HTML', 'success');
    }

    function exportAnalyticsPDF() {
        const content = document.getElementById('analyticsContent');
        if (!content) return;

        // Показываем модалку с предпросмотром для PDF
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            backdrop-filter: blur(8px);
            z-index: 3000;
            display: flex;
            justify-content: center;
            align-items: center;
        `;
        
        modal.innerHTML = `
            <div style="background: white; border-radius: 24px; padding: 24px; max-width: 600px; width: 90%;">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
                    <i class="fas fa-file-pdf" style="font-size: 28px; color: #dc2626;"></i>
                    <h3 style="color: #0f172a;">Экспорт PDF</h3>
                </div>
                <p style="color: #64748b; margin-bottom: 16px;">Для создания PDF файла нажмите кнопку ниже. Откроется окно печати, выберите "Сохранить как PDF".</p>
                <div style="display: flex; gap: 12px; justify-content: flex-end;">
                    <button id="pdfCancelBtn" class="btn btn-secondary">Отмена</button>
                    <button id="pdfPrintBtn" class="btn btn-primary" style="background: linear-gradient(135deg, #dc2626, #ef4444);">
                        <i class="fas fa-print"></i> Создать PDF
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);

        modal.querySelector('#pdfCancelBtn').addEventListener('click', () => modal.remove());
        modal.querySelector('#pdfPrintBtn').addEventListener('click', () => {
            modal.remove();
            // Открываем окно печати
            const printWindow = window.open('', '_blank', 'width=1200,height=800');
            if (!printWindow) {
                showStatus('Пожалуйста, разрешите всплывающие окна для PDF', 'error');
                return;
            }

            const styles = document.querySelector('style').innerHTML;
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Аналитика меню</title>
                    <style>${styles}</style>
                    <style>
                        body { padding: 30px; background: white; max-width: 1400px; margin: 0 auto; }
                        .no-print { display: none; }
                        .analytics-tab { display: none !important; }
                        .analytics-panel { display: block !important; }
                        .tab-navigation, .btn, .actions-grid-premium, .floating-btn { display: none !important; }
                    </style>
                </head>
                <body>
                    ${content.innerHTML}
                    <script>
                        window.onload = function() {
                            setTimeout(function() {
                                window.print();
                                setTimeout(function() { window.close(); }, 1000);
                            }, 500);
                        };
                    <\/script>
                </body>
                </html>
            `);
            printWindow.document.close();
            
            showStatus('📄 Открыто окно печати для сохранения PDF', 'info');
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    // ============================================================
    // ИНИЦИАЛИЗАЦИЯ
    // ============================================================

	function init() {
		// При входе в аналитику всегда начинаем с типового меню, чтобы
		// подписи кнопок источника и реально загруженные данные не расходились.
		state._sourceType = 'typical';
		state._dailyMenuNumber = null;
		state._dailyDayKey = null;
		state._dailyVariantName = null;
		state._originalTemplateData = null;

		// Получаем данные из глобальной области
		state.templateMenuData = window.templateMenuData || null;
		state.schoolInfo = window.schoolInfo || null;
		
		// Проверяем чекбокс лагеря
		const campCheckbox = document.getElementById('summerCampCheckbox');
		if (campCheckbox) {
			state.isSummerCamp = campCheckbox.checked;
		}

		// Заполняем данные
		if (state.templateMenuData) {
			state.flatItems = buildFlatFromTemplate(state.templateMenuData);
			state.allViolations = runAllRules(state.templateMenuData);
			renderAnalytics();
			console.log('✅ Аналитика инициализирована с данными!', {
				weeks: Object.keys(state.templateMenuData.weeks).length,
				dishes: state.flatItems.length
			});
		} else {
			// Если данных нет, показываем плейсхолдер
			renderAnalytics();
			console.log('⚠️ Аналитика инициализирована без данных (ожидаем загрузку)');
		}

		// ✅ АВТООБНОВЛЕНИЕ ПРИ ИЗМЕНЕНИИ МЕНЮ (4.8)
		if (!state._menuDataChangedBound) {
			state._menuDataChangedBound = true;
			window.addEventListener('menuDataChanged', function() {
				state.templateMenuData = window.templateMenuData || state.templateMenuData;
				if (state.templateMenuData) {
					state.flatItems = buildFlatFromTemplate(state.templateMenuData);
					state.allViolations = runAllRules(state.templateMenuData);
				}
				const tab = document.getElementById('tabAnalytics');
				if (tab && tab.style.display !== 'none') {
					renderAnalytics();
					console.log('✅ Аналитика автообновлена по событию menuDataChanged');
				}
			});
		}
	}

    // ============================================================
    // ПУБЛИЧНОЕ API
    // ============================================================
    
    return {
		init: init,
		render: renderAnalytics,
		getState: function() { return state; },
		getStatistics: getMenuStatistics,
		reload: init,
		analyzeSanPinCompliance: analyzeSanPinCompliance,
		showDetailedSanPinReport: showDetailedSanPinReport,
		exportSanPinReport: exportSanPinReport,
		exportExcel: exportAnalyticsExcel,
		exportCSV: exportAnalyticsCSV,
		share: shareAnalytics,
		getPreviousPeriodStats: getPreviousPeriodStats,
		applyFilters: applyFilters,
		setFilter: function(key, value) { state.filters[key] = value; renderAnalytics(); },
		resetFilters: function() { state.filters = { week: 'all', meal: 'all', section: 'all', onlyViolations: false }; renderAnalytics(); }
    };

})();

// ============================================================
// АВТОМАТИЧЕСКАЯ ИНИЦИАЛИЗАЦИЯ
// ============================================================
// Убеждаемся, что модуль доступен глобально
window.AnalyticsModule = AnalyticsModule;

function initAnalyticsWithDelay() {
    let attempts = 0;
    const maxAttempts = 10;
    
    function tryInit() {
        attempts++;
        const hasData = window.templateMenuData && 
                        window.templateMenuData.weeks && 
                        Object.keys(window.templateMenuData.weeks).length > 0;
        
        if (hasData) {
            console.log('✅ Данные найдены, инициализируем аналитику');
            AnalyticsModule.init();
        } else if (attempts < maxAttempts) {
            console.log(`⏳ Ждём данные... попытка ${attempts}`);
            setTimeout(tryInit, 500);
        } else {
            console.log('⚠️ Данные не найдены, инициализируем с пустым состоянием');
            AnalyticsModule.init();
        }
    }
    
    setTimeout(tryInit, 500);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnalyticsWithDelay);
} else {
    initAnalyticsWithDelay();
}

// В конце файла, после initAnalyticsWithDelay, добавьте:

// ============================================================
// ПРИНУДИТЕЛЬНАЯ СИНХРОНИЗАЦИЯ ДАННЫХ
// ============================================================
window.forceSyncAnalytics = function() {
    console.log('🔄 Принудительная синхронизация аналитики');
    if (window.AnalyticsModule) {
        const state = window.AnalyticsModule.getState();
        state.templateMenuData = window.templateMenuData || currentTemplateData;
        state.schoolInfo = window.schoolInfo || schoolInfo;
        state.isSummerCamp = isSummerCamp || false;
        state.flatItems = buildFlatFromTemplate(state.templateMenuData);
        state.allViolations = runAllRules(state.templateMenuData);
        window.AnalyticsModule.reload();
        console.log('✅ Аналитика синхронизирована');
    }
};

// ============================================================
// ГЛОБАЛЬНЫЕ ФУНКЦИИ ДЛЯ КНОПОК
// ============================================================
window.showDetailedSanPinReport = function() {
    if (window.AnalyticsModule && window.AnalyticsModule.showDetailedSanPinReport) {
        window.AnalyticsModule.showDetailedSanPinReport();
    } else {
        console.error('❌ Модуль аналитики не загружен');
        showStatus('Модуль аналитики не загружен', 'error');
    }
};

window.exportSanPinReport = function() {
    if (window.AnalyticsModule && window.AnalyticsModule.exportSanPinReport) {
        window.AnalyticsModule.exportSanPinReport();
    } else {
        console.error('❌ Модуль аналитики не загружен');
        showStatus('Модуль аналитики не загружен', 'error');
    }
};

// Добавляем функцию для закрытия модалки
window.closeSanPinModal = function() {
    const modal = document.querySelector('.sanpin-modal');
    if (modal) modal.remove();
};

console.log('✅ Глобальные функции аналитики зарегистрированы');

// ============================================================
// ДОПОЛНИТЕЛЬНЫЕ ГЛОБАЛЬНЫЕ ФУНКЦИИ ДЛЯ СИНХРОНИЗАЦИИ
// ============================================================
// Эта функция нужна для forceSyncAnalytics
if (typeof buildFlatFromTemplate === 'undefined') {
    window.buildFlatFromTemplate = function(template) {
        if (!template || !template.weeks) return [];
        const flat = [];
        const mealTypes = ['breakfast', 'breakfast2', 'lunch', 'afternoonSnack', 'dinner', 'dinner2'];

        for (const w in template.weeks) {
            for (const d in template.weeks[w]) {
                for (const mt of mealTypes) {
                    const meal = template.weeks[w][d][mt];
                    if (meal && meal.items) {
                        for (let idx = 0; idx < meal.items.length; idx++) {
                            const item = meal.items[idx];
                            flat.push({
                                id: `${w}_${d}_${mt}_${idx}`,
                                week: parseInt(w),
                                day: parseInt(d),
                                meal: mt,
                                section: item.section || '',
                                name: item.name || '',
                                weight: item.weight || 0,
                                calories: item.calories || 0,
                                proteins: item.proteins || 0,
                                fats: item.fats || 0,
                                carbs: item.carbs || 0,
                                recipeId: item.recipeId || '',
                                price: item.price || 0
                            });
                        }
                    }
                }
            }
        }
        return flat;
    };
}

if (typeof runAllRules === 'undefined') {
    window.runAllRules = function(template) {
        // Используем функцию из модуля
        if (AnalyticsModule && AnalyticsModule.getState) {
            const state = AnalyticsModule.getState();
            // Временно подменяем state для выполнения
            const tempState = state;
            // ... здесь нужна функция runAllRules из модуля
        }
        return [];
    };
}


// Перехватываем загрузку данных в основном файле
console.log('🔌 Модуль аналитики загружен, ожидает данные...');