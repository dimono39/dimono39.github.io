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
        currentView: 'overview' // overview | days | meals | violations | bju
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

        const stats = getMenuStatistics();
        if (!stats) {
            container.innerHTML = '<p style="padding: 40px; text-align: center; color: #94a3b8;">Ошибка при анализе данных</p>';
            return;
        }

        // Обновляем глобальные переменные для отображения
        state.flatItems = buildFlatFromTemplate(data);
        state.allViolations = runAllRules(data);

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
                    <button id="analyticsRefresh" class="btn btn-secondary" style="padding: 6px 16px; font-size: 0.75rem;">
                        <i class="fas fa-sync-alt"></i> Обновить
                    </button>
                </div>
            </div>
        `;

        // ===== ВКЛАДКИ =====
        html += `
            <div style="display: flex; gap: 4px; background: #f1f5f9; border-radius: 12px; padding: 4px; margin-bottom: 20px; flex-wrap: wrap;">
                <button class="analytics-tab active" data-tab="overview" style="padding: 8px 16px; border: none; border-radius: 8px; background: white; font-weight: 600; font-size: 0.8rem; cursor: pointer; color: #059669; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
                    <i class="fas fa-home"></i> Обзор
                </button>
                <button class="analytics-tab" data-tab="days" style="padding: 8px 16px; border: none; border-radius: 8px; background: transparent; font-weight: 600; font-size: 0.8rem; cursor: pointer; color: #64748b;">
                    <i class="fas fa-calendar-day"></i> По дням
                </button>
                <button class="analytics-tab" data-tab="meals" style="padding: 8px 16px; border: none; border-radius: 8px; background: transparent; font-weight: 600; font-size: 0.8rem; cursor: pointer; color: #64748b;">
                    <i class="fas fa-utensils"></i> Приёмы пищи
                </button>
                <button class="analytics-tab" data-tab="violations" style="padding: 8px 16px; border: none; border-radius: 8px; background: transparent; font-weight: 600; font-size: 0.8rem; cursor: pointer; color: #64748b;">
                    <i class="fas fa-exclamation-triangle"></i> Нарушения
                </button>
                <button class="analytics-tab" data-tab="bju" style="padding: 8px 16px; border: none; border-radius: 8px; background: transparent; font-weight: 600; font-size: 0.8rem; cursor: pointer; color: #64748b;">
                    <i class="fas fa-balance-scale"></i> БЖУ
                </button>
            </div>
        `;

        // ===== КОНТЕНТ ВКЛАДОК =====
        html += `<div id="analyticsTabContent">`;
        html += renderOverviewTab(stats);
        html += renderDaysTab(stats);
        html += renderMealsTab(stats);
        html += renderViolationsTab(stats);
        html += renderBJUTab(stats);
        html += `</div>`;

        container.innerHTML = html;

        // ===== ПОДКЛЮЧАЕМ СОБЫТИЯ =====
        attachAnalyticsEvents();

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

		// Формируем HTML как строку, а не возвращаем сразу
		let html = `
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

		html += `</div>`; // Закрываем .analytics-panel
		return html;
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
            return `<div class="analytics-panel" data-tab="days"><p style="padding: 20px; text-align: center; color: #94a3b8;">Нет данных по дням</p></div>`;
        }

        // Находим min/max для цветовой шкалы
        const weights = days.map(d => d.weight);
        const maxWeight = Math.max(...weights, 1);
        const minWeight = Math.min(...weights);

        let html = `<div class="analytics-panel" data-tab="days" style="display: none;">`;
        html += `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px;">`;

        for (const day of days) {
            const color = getColorByValue(day.weight, minWeight, maxWeight);
            const violations = state.allViolations.filter(v => v.week === day.week && v.day === day.day);
            const hasViolations = violations.length > 0;
            const hasCritical = violations.some(v => v.code === 15);

            html += `
                <div style="background: white; border-radius: 16px; padding: 16px; border: 2px solid ${hasCritical ? '#dc2626' : hasViolations ? '#f59e0b' : '#e2e8f0'}; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
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
                </div>
            `;
        }

        html += `</div></div>`;
        return html;
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

    function renderBJUTab(stats) {
        const bju = stats.bju;

        let html = `<div class="analytics-panel" data-tab="bju" style="display: none;">`;

        // Круговые диаграммы
        html += `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; margin-bottom: 24px;">
                <div style="background: white; border-radius: 16px; padding: 20px; border: 1px solid #e2e8f0; text-align: center;">
                    <div style="font-weight: 600; color: #0f172a; margin-bottom: 12px;">📊 Фактическое соотношение БЖУ</div>
                    <div style="display: flex; justify-content: center; gap: 20px; flex-wrap: wrap;">
                        <div style="text-align: center;">
                            <div style="width: 80px; height: 80px; border-radius: 50%; background: conic-gradient(
                                #3b82f6 0% ${bju.ratio.proteins}%,
                                #ef4444 ${bju.ratio.proteins}% ${bju.ratio.proteins + bju.ratio.fats}%,
                                #f59e0b ${bju.ratio.proteins + bju.ratio.fats}% 100%
                            ); margin: 0 auto 8px;"></div>
                            <div style="font-size: 0.75rem; color: #64748b;">
                                <span style="color: #3b82f6;">● Б</span> ${bju.ratio.proteins.toFixed(1)}% 
                                <span style="color: #ef4444;">● Ж</span> ${bju.ratio.fats.toFixed(1)}% 
                                <span style="color: #f59e0b;">● У</span> ${bju.ratio.carbs.toFixed(1)}%
                            </div>
                        </div>
                        <div style="text-align: left; font-size: 0.85rem; padding: 12px 0;">
                            <div><span style="color: #3b82f6;">●</span> Белки: <strong>${bju.proteins.toFixed(1)} г</strong></div>
                            <div><span style="color: #ef4444;">●</span> Жиры: <strong>${bju.fats.toFixed(1)} г</strong></div>
                            <div><span style="color: #f59e0b;">●</span> Углеводы: <strong>${bju.carbs.toFixed(1)} г</strong></div>
                            <div style="margin-top: 4px; color: #94a3b8; font-size: 0.75rem;">Всего БЖУ: ${bju.total.toFixed(1)} г</div>
                        </div>
                    </div>
                </div>
                <div style="background: white; border-radius: 16px; padding: 20px; border: 1px solid #e2e8f0; text-align: center;">
                    <div style="font-weight: 600; color: #0f172a; margin-bottom: 12px;">🎯 Рекомендуемое соотношение (1:1:4)</div>
                    <div style="display: flex; justify-content: center; gap: 20px; flex-wrap: wrap;">
                        <div style="text-align: center;">
                            <div style="width: 80px; height: 80px; border-radius: 50%; background: conic-gradient(
                                #3b82f6 0% 16.7%,
                                #ef4444 16.7% 33.4%,
                                #f59e0b 33.4% 100%
                            ); margin: 0 auto 8px;"></div>
                            <div style="font-size: 0.75rem; color: #64748b;">
                                <span style="color: #3b82f6;">● Б</span> 16.7% 
                                <span style="color: #ef4444;">● Ж</span> 16.7% 
                                <span style="color: #f59e0b;">● У</span> 66.6%
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

        // Анализ соответствия
        const deviation = {
            proteins: Math.abs(bju.ratio.proteins - bju.recommended.proteins),
            fats: Math.abs(bju.ratio.fats - bju.recommended.fats),
            carbs: Math.abs(bju.ratio.carbs - bju.recommended.carbs)
        };
        const maxDeviation = Math.max(deviation.proteins, deviation.fats, deviation.carbs);
        let status = 'good';
        let statusText = '✅ Соотношение близко к норме';
        let statusColor = '#10b981';

        if (maxDeviation > 15) {
            status = 'bad';
            statusText = '❌ Соотношение далеко от нормы';
            statusColor = '#dc2626';
        } else if (maxDeviation > 8) {
            status = 'warning';
            statusText = '⚠️ Соотношение отличается от рекомендуемого';
            statusColor = '#f59e0b';
        }

        html += `
            <div style="background: ${statusColor}10; border-radius: 16px; padding: 16px; border: 2px solid ${statusColor}; margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                    <div>
                        <div style="font-weight: 600; color: #0f172a;">📈 Оценка сбалансированности</div>
                        <div style="font-size: 0.85rem; color: ${statusColor};">${statusText}</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="font-size: 0.75rem; color: #64748b;">
                            Отклонение: ${maxDeviation.toFixed(1)}%
                        </div>
                        <div style="padding: 4px 16px; border-radius: 20px; background: ${statusColor}; color: white; font-weight: 600; font-size: 0.8rem;">
                            ${status === 'good' ? '✅' : status === 'warning' ? '⚠️' : '❌'}
                        </div>
                    </div>
                </div>
                <div style="margin-top: 12px; display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px;">
                    <div style="background: white; border-radius: 8px; padding: 8px 12px; text-align: center;">
                        <div style="font-size: 0.6rem; color: #94a3b8;">Отклонение белков</div>
                        <div style="font-weight: 700; color: ${deviation.proteins > 10 ? '#dc2626' : '#10b981'};">${deviation.proteins.toFixed(1)}%</div>
                    </div>
                    <div style="background: white; border-radius: 8px; padding: 8px 12px; text-align: center;">
                        <div style="font-size: 0.6rem; color: #94a3b8;">Отклонение жиров</div>
                        <div style="font-weight: 700; color: ${deviation.fats > 10 ? '#dc2626' : '#10b981'};">${deviation.fats.toFixed(1)}%</div>
                    </div>
                    <div style="background: white; border-radius: 8px; padding: 8px 12px; text-align: center;">
                        <div style="font-size: 0.6rem; color: #94a3b8;">Отклонение углеводов</div>
                        <div style="font-weight: 700; color: ${deviation.carbs > 10 ? '#dc2626' : '#10b981'};">${deviation.carbs.toFixed(1)}%</div>
                    </div>
                </div>
            </div>
        `;

        // Рекомендации
        const recommendations = [];
        if (bju.ratio.proteins < bju.recommended.proteins - 5) {
            recommendations.push('🔹 Увеличьте долю белковых продуктов (мясо, рыба, яйца, бобовые)');
        } else if (bju.ratio.proteins > bju.recommended.proteins + 5) {
            recommendations.push('🔹 Уменьшите долю белковых продуктов, добавьте больше углеводов');
        }

        if (bju.ratio.fats < bju.recommended.fats - 5) {
            recommendations.push('🔹 Добавьте полезные жиры (растительное масло, орехи, рыбу)');
        } else if (bju.ratio.fats > bju.recommended.fats + 5) {
            recommendations.push('🔹 Уменьшите долю жирных продуктов');
        }

        if (bju.ratio.carbs < bju.recommended.carbs - 5) {
            recommendations.push('🔹 Добавьте больше сложных углеводов (крупы, овощи, хлеб)');
        } else if (bju.ratio.carbs > bju.recommended.carbs + 5) {
            recommendations.push('🔹 Уменьшите долю углеводов, особенно простых сахаров');
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
    // СОБЫТИЯ
    // ============================================================

    function attachAnalyticsEvents() {
        // Переключение вкладок
        document.querySelectorAll('.analytics-tab').forEach(tab => {
            tab.addEventListener('click', function() {
                const tabName = this.dataset.tab;
                
                // Обновляем активную вкладку
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

                // Показываем нужную панель
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

        // Обновление при изменении чекбокса лагеря
        document.getElementById('summerCampCheckbox')?.addEventListener('change', function() {
            state.isSummerCamp = this.checked;
            if (document.getElementById('tabAnalytics').style.display !== 'none') {
                renderAnalytics();
            }
        });
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
		exportSanPinReport: exportSanPinReport
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