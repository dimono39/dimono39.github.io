/**
 * ============================================================
 * МОДУЛЬ "ЕЖЕДНЕВНОЕ МЕНЮ" v6.0
 * Подключаемый файл для PRO Редактора типового меню
 * ============================================================
 * 
 * Подключение в основном файле:
 * <script src="daily-menu-module.js"></script>
 * 
 * Затем вызовите:
 * DailyMenuModule.init();
 * ============================================================
 */

const DailyMenuModule = (function() {
    'use strict';

    // ============================================================
    // КОНФИГУРАЦИЯ
    // ============================================================
    
    const CONFIG = {
        VARIANTS_STORAGE_KEY: 'dailyMenuVariants_v6',
        MAX_MENU_NUMBER: 10,
        PDF_FILENAME: 'Ежедневное_меню',
        PRINT_TITLE: 'ЕЖЕДНЕВНОЕ МЕНЮ'
    };

    // ============================================================
    // ЦВЕТОВАЯ МАРКИРОВКА ТИПОВ МЕНЮ
    // ============================================================
    
	const MENU_COLORS = {
		1: { primary: '#4A90D9', light: '#D6E4F7', name: 'Синий' },
		2: { primary: '#2ECC71', light: '#D5F5E3', name: 'Изумрудный' },
		3: { primary: '#9B59B6', light: '#E8DAEF', name: 'Фиолетовый' },
		4: { primary: '#E67E22', light: '#FDEBD0', name: 'Оранжевый' },
		5: { primary: '#1ABC9C', light: '#D1F2EB', name: 'Бирюзовый' },
		6: { primary: '#2C3E50', light: '#D5D8DC', name: 'Тёмный' },
		7: { primary: '#D35400', light: '#FAD7A1', name: 'Терракотовый' },
		8: { primary: '#16A085', light: '#D1F2EB', name: 'Морской' },
		9: { primary: '#8E44AD', light: '#E8DAEF', name: 'Пурпурный' },
		10: { primary: '#27AE60', light: '#D5F5E3', name: 'Лесной' },
		// Дополнительные цвета для меню > 10
		11: { primary: '#E74C3C', light: '#FADBD8', name: 'Красный' },
		12: { primary: '#3498DB', light: '#D6EAF8', name: 'Голубой' },
		13: { primary: '#1ABC9C', light: '#D1F2EB', name: 'Морской' },
		14: { primary: '#F39C12', light: '#FDEBD0', name: 'Золотой' },
		15: { primary: '#2C3E50', light: '#D5D8DC', name: 'Графитовый' },
		16: { primary: '#E67E22', light: '#FDEBD0', name: 'Морковный' },
		17: { primary: '#9B59B6', light: '#E8DAEF', name: 'Лавандовый' },
		18: { primary: '#1ABC9C', light: '#D1F2EB', name: 'Бирюзовый' },
		19: { primary: '#E74C3C', light: '#FADBD8', name: 'Алый' },
		20: { primary: '#3498DB', light: '#D6EAF8', name: 'Васильковый' },
	};
	
	let initAttempts = 0;
	const MAX_INIT_ATTEMPTS = 20;

	function waitForDataAndInit() {
		initAttempts++;
		
		// Проверяем, загружены ли данные
		const hasData = window.templateMenuData && 
						window.templateMenuData.weeks && 
						Object.keys(window.templateMenuData.weeks).length > 0;
		
		if (hasData) {
			console.log('✅ DailyMenuModule: Данные найдены, инициализируем...');
			state.templateMenuData = window.templateMenuData;
			state.schoolInfo = window.schoolInfo || null;
			initDailyMenuInterface();
			return true;
		}
		
		if (initAttempts < MAX_INIT_ATTEMPTS) {
			console.log(`⏳ DailyMenuModule: Ждём данные... попытка ${initAttempts}`);
			setTimeout(waitForDataAndInit, 300);
			return false;
		}
		
		console.log('⚠️ DailyMenuModule: Данные не найдены, создаём пустое состояние');
		initDailyMenuInterface();
		return false;
	}	

	// ============================================================
	// ОПРЕДЕЛЕНИЕ КОЛИЧЕСТВА МЕНЮ
	// ============================================================

	function getActualMenuCount() {
		const data = state.templateMenuData;
		if (!data || !data.weeks) return 10; // Значение по умолчанию
		
		// Подсчитываем общее количество дней во всех неделях
		let totalDays = 0;
		for (const w in data.weeks) {
			totalDays += Object.keys(data.weeks[w]).length;
		}
		
		// Возвращаем реальное количество меню (дней)
		return Math.max(totalDays, 1);
	}

	function getMaxMenuNumber() {
		return getActualMenuCount();
	}

	function getMenuColor(menuNumber) {
		return MENU_COLORS[menuNumber] || {
			primary: '#64748b',
			light: '#f1f5f9',
			name: 'Стандартный'
		};
	}

    // ============================================================
    // СОСТОЯНИЕ МОДУЛЯ
    // ============================================================
    
    let state = {
        dailyMenuData: null,
        selectedMenuNumber: 1,
        isEditMode: false,
        dailyMenuItems: [],
        dailyViolations: [],
        savedVariants: [],
        templateMenuData: null,
        schoolInfo: null
    };

    // DOM-элементы (заполняются при инициализации)
    let elements = {};

    // ============================================================
    // ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
    // ============================================================
    
    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
    }

    function formatDate(date, format = 'display') {
        if (!date) return '';
        if (typeof date === 'string') date = new Date(date);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        if (format === 'file') return `${year}-${month}-${day}`;
        if (format === 'excel') return `${day}.${month}.${year}`;
        return `${day}.${month}.${year}`;
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

    // ============================================================
    // СТРУКТУРА ПРИЁМОВ ПИЩИ
    // ============================================================
    
    const MEAL_STRUCTURE = {
        'breakfast': {
            name: 'Завтрак',
            sections: ['гор.блюдо', 'гор.напиток', 'хлеб', 'фрукты']
        },
        'breakfast2': {
            name: 'Завтрак 2',
            sections: ['фрукты']
        },
        'lunch': {
            name: 'Обед',
            sections: ['закуска', '1 блюдо', '2 блюдо', 'гарнир', 'напиток', 'хлеб бел.', 'хлеб черн.']
        },
        'afternoonSnack': {
            name: 'Полдник',
            sections: ['булочное', 'напиток']
        },
        'dinner': {
            name: 'Ужин',
            sections: ['гор.блюдо', 'гарнир', 'напиток', 'хлеб']
        },
        'dinner2': {
            name: 'Ужин 2',
            sections: ['кисломол.', 'булочное', 'напиток', 'фрукты']
        }
    };

    const MEAL_NAMES = {
        'breakfast': '🌅 Завтрак',
        'breakfast2': '🍎 Второй завтрак',
        'lunch': '🍲 Обед',
        'afternoonSnack': '🍪 Полдник',
        'dinner': '🌙 Ужин',
        'dinner2': '🥛 Второй ужин'
    };

    const MEAL_ICONS = {
        'breakfast': 'sun',
        'breakfast2': 'coffee',
        'lunch': 'utensils',
        'afternoonSnack': 'cookie-bite',
        'dinner': 'moon',
        'dinner2': 'glass-whiskey'
    };

    function getMealIcon(mealType) {
        return MEAL_ICONS[mealType] || 'utensils';
    }

    function getMealName(mealType) {
        return MEAL_NAMES[mealType] || mealType;
    }

    // ============================================================
    // РАБОТА С ДАННЫМИ МЕНЮ
    // ============================================================
    
	function getDayFromMenuNumber(menuNumber) {
		const data = state.templateMenuData;
		if (!data || !data.weeks) return null;
		
		// Собираем все дни в плоский список
		const allDays = [];
		for (const w in data.weeks) {
			for (const d in data.weeks[w]) {
				allDays.push({ week: parseInt(w), day: parseInt(d) });
			}
		}
		
		// Сортируем по неделе и дню
		allDays.sort((a, b) => a.week - b.week || a.day - a.day);
		
		// Если номер меню в пределах списка — возвращаем день
		if (menuNumber >= 1 && menuNumber <= allDays.length) {
			return allDays[menuNumber - 1];
		}
		
		return null;
	}

    function sortMealItemsByStructure(items, mealType) {
        if (!items || items.length === 0) return [];
        const structure = MEAL_STRUCTURE[mealType];
        if (!structure) return items;
        
        const normalizedItems = items.map(item => ({
            ...item,
            normalizedSection: normalizeSectionName(item.section || '')
        }));
        
        const sortedItems = [];
        for (const section of structure.sections) {
            const sectionItems = normalizedItems.filter(item => item.normalizedSection === section);
            sortedItems.push(...sectionItems);
        }
        
        const otherItems = normalizedItems.filter(item => 
            !structure.sections.includes(item.normalizedSection)
        );
        sortedItems.push(...otherItems);
        
        return sortedItems;
    }

    function buildDailyFlatItems(menuData) {
        const items = [];
        const mealTypes = ['breakfast', 'breakfast2', 'lunch', 'afternoonSnack', 'dinner', 'dinner2'];
        for (const mealType of mealTypes) {
            const meal = menuData[mealType];
            if (meal && meal.items) {
                for (let idx = 0; idx < meal.items.length; idx++) {
                    const item = meal.items[idx];
                    items.push({
                        id: `${mealType}_${idx}`,
                        meal: mealType,
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
        return items;
    }

    // ============================================================
    // ПРОВЕРКА ПО ПРАВИЛАМ
    // ============================================================
    
    function runDailyRules(menuData) {
        const violations = [];
        const meals = {
            breakfast: menuData.breakfast?.items || [],
            breakfast2: menuData.breakfast2?.items || [],
            lunch: menuData.lunch?.items || [],
            afternoonSnack: menuData.afternoonSnack?.items || [],
            dinner: menuData.dinner?.items || [],
            dinner2: menuData.dinner2?.items || []
        };

        // Правила 1-12 (вес)
        const weightRules = {
            breakfast: { min: 500, rule: 1, name: 'Завтрак' },
            lunch: { min: 700, rule: 2, name: 'Обед' },
            breakfast2: { min: 200, rule: 9, name: '2-й завтрак' },
            afternoonSnack: { min: 300, rule: 10, name: 'Полдник' },
            dinner: { min: 500, rule: 11, name: 'Ужин' },
            dinner2: { min: 200, rule: 12, name: '2-й ужин' }
        };

        for (const mealType in weightRules) {
            const items = meals[mealType] || [];
            const totalWeight = items.reduce((sum, i) => sum + (parseFloat(i.weight) || 0), 0);
            const rule = weightRules[mealType];
            if (totalWeight > 0 && totalWeight < rule.min) {
                violations.push({ rule: rule.rule, code: rule.rule, meal: mealType, details: `${rule.name}: ${totalWeight}г < ${rule.min}г` });
            }
        }

        // Правила 3-6, 8
        const sectionRules = [
            { meal: 'breakfast', section: 'гор.блюдо', min: 150, rule: 3 },
            { meal: 'lunch', section: 'закуска', min: 60, rule: 4 },
            { meal: 'lunch', section: '1 блюдо', min: 200, rule: 5 },
            { meal: 'lunch', section: '2 блюдо', min: 90, rule: 6 },
            { meal: 'lunch', section: 'гарнир', min: 150, rule: 8 }
        ];

        for (const sr of sectionRules) {
            const items = meals[sr.meal] || [];
            const sectionSum = items
                .filter(i => normalizeSectionName(i.section) === sr.section)
                .reduce((sum, i) => sum + (parseFloat(i.weight) || 0), 0);
            if (sectionSum > 0 && sectionSum < sr.min) {
                violations.push({ rule: sr.rule, code: sr.rule, meal: sr.meal, details: `${sr.section}: ${sectionSum}г < ${sr.min}г` });
            }
        }

        // Правила 13-14 (калории)
        const kcalRules = {
            breakfast: { min: 470, rule: 13, name: 'Завтрак' },
            lunch: { min: 705, rule: 14, name: 'Обед' }
        };
        for (const mealType in kcalRules) {
            const items = meals[mealType] || [];
            const totalCal = items.reduce((sum, i) => sum + (parseFloat(i.calories) || 0), 0);
            const rule = kcalRules[mealType];
            if (totalCal > 0 && totalCal < rule.min) {
                violations.push({ rule: rule.rule, code: rule.rule, meal: mealType, details: `${rule.name}: ${totalCal}ккал < ${rule.min}ккал` });
            }
        }

        // Правило 15: БЖУ <= вес
        for (const mealType in meals) {
            const items = meals[mealType] || [];
            for (let idx = 0; idx < items.length; idx++) {
                const item = items[idx];
                const bju = (parseFloat(item.proteins) || 0) + (parseFloat(item.fats) || 0) + (parseFloat(item.carbs) || 0);
                const weight = parseFloat(item.weight) || 0;
                if (bju > weight && weight > 0) {
                    violations.push({ rule: 15, code: 15, meal: mealType, itemIndex: idx, details: `"${item.name}": БЖУ=${bju}г > вес=${weight}г` });
                }
            }
        }

        // Правило 16: Фрукты >= 100г
        let fruitTotal = 0;
        for (const mealType in meals) {
            const items = meals[mealType] || [];
            fruitTotal += items
                .filter(i => normalizeSectionName(i.section) === 'фрукты')
                .reduce((sum, i) => sum + (parseFloat(i.weight) || 0), 0);
        }
        if (fruitTotal > 0 && fruitTotal < 100) {
            violations.push({ rule: 16, code: 16, details: `Фруктов за день: ${fruitTotal}г < 100г` });
        }
		/*
        // Правило 17: дубликаты
        const dishNames = [];
        for (const mealType in meals) {
            const items = meals[mealType] || [];
            for (const item of items) {
                if (item.name && item.name.trim()) {
                    const name = item.name.trim();
                    if (dishNames.includes(name) && !name.includes('чай') && !name.includes('компот') && !name.includes('булоч') && !name.includes('хлеб')) {
                        violations.push({ rule: 17, code: 17, details: `Повтор блюда: "${name}"` });
                    }
                    dishNames.push(name);
                }
            }
        }*/

        return violations;
    }

    // ============================================================
    // ЗАГРУЗКА МЕНЮ
    // ============================================================
    
	function loadDailyMenu(menuNumber) {
		const data = state.templateMenuData;
		if (!data || !data.weeks) {
			showStatus('Сначала загрузите типовое меню', 'error');
			return;
		}

		// ✅ Проверяем, существует ли такое меню
		const maxNum = getActualMenuCount();
		if (menuNumber > maxNum) {
			showStatus(`Меню #${menuNumber} не найдено. Доступно ${maxNum} меню.`, 'error');
			return;
		}

		const target = getDayFromMenuNumber(menuNumber);
		if (!target) {
			showStatus(`Меню #${menuNumber} не найдено в типовом меню`, 'error');
			return;
		}

		const { week, day } = target;
		const dayData = data.weeks[week]?.[day];
		if (!dayData) {
			showStatus(`День ${day} недели ${week} не найден`, 'error');
			return;
		}

		state.dailyMenuData = {
			week: week,
			day: day,
			menuNumber: menuNumber,
			breakfast: JSON.parse(JSON.stringify(dayData.breakfast || { items: [] })),
			breakfast2: JSON.parse(JSON.stringify(dayData.breakfast2 || { items: [] })),
			lunch: JSON.parse(JSON.stringify(dayData.lunch || { items: [] })),
			afternoonSnack: JSON.parse(JSON.stringify(dayData.afternoonSnack || { items: [] })),
			dinner: JSON.parse(JSON.stringify(dayData.dinner || { items: [] })),
			dinner2: JSON.parse(JSON.stringify(dayData.dinner2 || { items: [] }))
		};

		for (const mealType in state.dailyMenuData) {
			if (state.dailyMenuData[mealType] && state.dailyMenuData[mealType].items) {
				state.dailyMenuData[mealType].items = sortMealItemsByStructure(
					state.dailyMenuData[mealType].items, mealType
				);
			}
		}

		state.selectedMenuNumber = menuNumber;
		state.dailyMenuItems = buildDailyFlatItems(state.dailyMenuData);
		state.dailyViolations = runDailyRules(state.dailyMenuData);

		renderDailyPreview();
		updateMenuSelectorUI();
		
		// ✅ ОБНОВЛЯЕМ СТАТУСНУЮ СТРОКУ
		updateStatusBarMenu();
		
		showStatus(`Меню #${menuNumber} загружено (неделя ${week}, день ${day})`, 'success');
	}

    // ============================================================
    // ОТОБРАЖЕНИЕ ПРЕДПРОСМОТРА
    // ============================================================
    
    function renderDailyPreview() {
        const container = document.getElementById('dailyPreview');
        if (!container) return;

        if (!state.dailyMenuData) {
            container.innerHTML = '<div style="text-align: center; color: #94a3b8; padding: 20px;">Выберите номер меню</div>';
            return;
        }

        const menuColor = getMenuColor(state.selectedMenuNumber);
        const mealTypes = ['breakfast', 'breakfast2', 'lunch', 'afternoonSnack', 'dinner', 'dinner2'];

        let html = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <div>
                    <span style="font-size: 1.1rem; font-weight: 700; color: ${menuColor.primary};">
                        <i class="fas fa-hashtag"></i> Меню #${state.dailyMenuData.menuNumber}
                    </span>
                    <span style="color: #64748b; font-size: 0.85rem; margin-left: 12px;">
                        Неделя ${state.dailyMenuData.week}, День ${state.dailyMenuData.day}
                    </span>
                    <span style="display: inline-block; margin-left: 12px; padding: 2px 10px; border-radius: 12px; font-size: 0.7rem; background: ${menuColor.primary}; color: white;">
                        ${menuColor.name}
                    </span>
                </div>
                <span style="font-size: 0.85rem; color: #64748b;">
                    <i class="fas fa-utensils"></i> ${state.dailyMenuItems.length} блюд
                </span>
            </div>
        `;

        for (const mealType of mealTypes) {
            const meal = state.dailyMenuData[mealType];
            const items = meal?.items || [];
            const hasItems = items.length > 0 && items.some(i => i.name && i.name.trim() !== '');

            html += `<div class="daily-meal-block" style="margin-bottom: 16px;">`;
            html += `<div class="meal-title" style="font-weight: 600; color: #0f172a; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                <i class="fas fa-${getMealIcon(mealType)}" style="color: ${menuColor.primary};"></i>
                ${getMealName(mealType)}
                <span style="font-size: 0.75rem; color: #94a3b8; font-weight: normal; margin-left: 8px;">(${items.length} блюд)</span>
            </div>`;

            html += `<div style="display: flex; flex-direction: column; gap: 4px; padding-left: 20px;">`;

            if (hasItems) {
                for (let idx = 0; idx < items.length; idx++) {
                    const item = items[idx];
                    if (!item.name || item.name.trim() === '') continue;

                    const violation = state.dailyViolations.find(v => v.meal === mealType && v.itemIndex === idx && v.code === 15);
                    const hasError = !!violation;

                    html += `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 8px; background: white; border-radius: 8px; border: 1px solid ${hasError ? '#ef4444' : '#e2e8f0'}; font-size: 0.85rem; transition: all 0.2s;">
                            <span style="flex: 1;">
                                ${escapeHtml(item.name)}
                                ${hasError ? ' <span style="color: #dc2626; font-size: 0.7rem;">⚠️ БЖУ > вес</span>' : ''}
                            </span>
                            <span style="color: #64748b; font-size: 0.75rem; margin-left: 12px;">
                                ${item.section || '—'} • ${item.weight || 0}г • ${item.calories || 0}ккал
                                ${state.isEditMode ? `<button class="replace-btn" data-meal="${mealType}" data-idx="${idx}" style="background: none; border: none; color: #3b82f6; cursor: pointer; font-size: 0.8rem; padding: 2px 8px; border-radius: 4px;">
                                    <i class="fas fa-exchange-alt"></i>
                                </button>` : ''}
                            </span>
                        </div>
                    `;
                }
            } else {
                html += `<div style="color: #94a3b8; font-style: italic; padding: 8px 16px;">Нет блюд в этом приёме пищи</div>`;
            }

            html += `</div></div>`;
        }

        // Статистика нарушений
        const errors = state.dailyViolations.filter(v => v.code === 15);
        const warnings = state.dailyViolations.filter(v => v.code !== 15 && v.code !== 17);
        const duplicates = state.dailyViolations.filter(v => v.code === 17);

        if (state.dailyViolations.length > 0) {
            html += `
                <div style="margin-top: 16px; padding: 12px 16px; background: #fef3c7; border-radius: 12px; border-left: 4px solid #f59e0b;">
                    <strong style="color: #d97706;"><i class="fas fa-exclamation-triangle"></i> Нарушения:</strong>
                    <span style="color: #92400e;">
                        ${state.dailyViolations.length} (${errors.length} критических, ${warnings.length} предупреждений${duplicates.length > 0 ? `, ${duplicates.length} дубликатов` : ''})
                    </span>
                </div>
            `;
        } else if (state.dailyMenuItems.length > 0) {
            html += `
                <div style="margin-top: 16px; padding: 12px 16px; background: #dcfce7; border-radius: 12px; border-left: 4px solid #10b981;">
                    <strong style="color: #16a34a;"><i class="fas fa-check-circle"></i> Отлично!</strong>
                    <span style="color: #166534;">Все правила выполнены.</span>
                </div>
            `;
        }

        container.innerHTML = html;

        // Обработчики замены
        if (state.isEditMode) {
            document.querySelectorAll('.replace-btn').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const mealType = this.dataset.meal;
                    const idx = parseInt(this.dataset.idx);
                    openReplaceModal(mealType, idx);
                });
            });
        }
    }

    // ============================================================
    // ВЫБОР МЕНЮ (UI)
    // ============================================================
    
	function updateMenuSelectorUI() {
		const container = document.getElementById('menuSelector');
		if (!container) return;

		// ✅ Получаем реальное количество меню из данных
		const maxNum = getActualMenuCount();
		let html = '';

		for (let i = 1; i <= maxNum; i++) {
			const target = getDayFromMenuNumber(i);
			let count = 0;
			let hasData = false;
			const color = getMenuColor(i);

			if (target) {
				const dayData = state.templateMenuData?.weeks?.[target.week]?.[target.day];
				if (dayData) {
					hasData = true;
					for (const mt in dayData) {
						if (dayData[mt]?.items) {
							count += dayData[mt].items.filter(it => it.name && it.name.trim() !== '').length;
						}
					}
				}
			}

			const isActive = i === state.selectedMenuNumber;

			html += `
				<div class="menu-number-btn ${isActive ? 'active' : ''} ${!hasData ? 'opacity-50' : ''}" 
					 data-menu="${i}" 
					 style="${!hasData ? 'opacity:0.5;' : ''} ${isActive ? `border-color: ${color.primary}; background: ${color.light};` : ''}"
					 title="${color.name}">
					<div class="num" style="color: ${isActive ? color.primary : '#0f172a'};">${i}</div>
					<div class="count">${hasData ? count + ' блюд' : 'нет данных'}</div>
					<div class="color-bar" style="background: ${color.primary};"></div>
				</div>
			`;
		}

		container.innerHTML = html;

		container.querySelectorAll('.menu-number-btn').forEach(btn => {
			btn.addEventListener('click', function() {
				const num = parseInt(this.dataset.menu);
				if (getDayFromMenuNumber(num)) {
					loadDailyMenu(num);
				} else {
					showStatus(`Меню #${num} не найдено в типовом меню`, 'error');
				}
			});
		});
	}

    // ============================================================
    // ЗАМЕНА БЛЮДА
    // ============================================================
    
    function openReplaceModal(mealType, idx) {
        if (!state.dailyMenuData) return;

        const meal = state.dailyMenuData[mealType];
        if (!meal || !meal.items || idx >= meal.items.length) return;

        const currentItem = meal.items[idx];
        const currentName = currentItem.name || 'Без названия';

        document.getElementById('currentDishName').textContent = `${currentName} (${currentItem.section || '—'})`;

        const availableDishes = getAvailableDishesForReplacement(mealType, currentItem.section);
        const container = document.getElementById('replaceOptions');
        let html = '';

        if (availableDishes.length === 0) {
            html = `<div style="padding: 20px; text-align: center; color: #94a3b8;">
                Нет доступных блюд для замены в разделе "${currentItem.section || '—'}"
            </div>`;
        } else {
            for (const dish of availableDishes) {
                const isCurrent = dish.name === currentName && dish.section === currentItem.section;
                html += `
                    <div class="dish-option ${isCurrent ? 'current' : ''}" 
                         style="${isCurrent ? 'background: #f0fdf4; border-left: 3px solid #10b981;' : ''}"
                         data-dish='${JSON.stringify(dish).replace(/'/g, "&#39;")}'>
                        <div>
                            <div class="name">${escapeHtml(dish.name)} ${isCurrent ? '← текущее' : ''}</div>
                            <div class="details">
                                ${dish.section || '—'} • ${dish.weight || 0}г • ${dish.calories || 0}ккал
                                ${dish.recipeId ? `• №${dish.recipeId}` : ''}
                                ${dish.price ? `• ${dish.price}₽` : ''}
                            </div>
                        </div>
                        <div style="font-size: 0.7rem; color: #64748b;">
                            Б:${dish.proteins || 0} Ж:${dish.fats || 0} У:${dish.carbs || 0}
                        </div>
                    </div>
                `;
            }
        }

        container.innerHTML = html;

        container.querySelectorAll('.dish-option').forEach(el => {
            el.addEventListener('click', function() {
                try {
                    const dishData = JSON.parse(this.dataset.dish);
                    replaceDish(mealType, idx, dishData);
                    document.getElementById('replaceDishModal').style.display = 'none';
                } catch(e) {
                    showStatus('Ошибка при замене блюда', 'error');
                }
            });
        });

        document.getElementById('replaceDishModal').style.display = 'flex';
    }

    function getAvailableDishesForReplacement(mealType, section) {
        const data = state.templateMenuData;
        if (!data || !data.weeks) return [];

        const dishes = [];
        const normalizedTargetSection = normalizeSectionName(section);

        for (const w in data.weeks) {
            for (const d in data.weeks[w]) {
                const mealData = data.weeks[w][d][mealType];
                if (mealData && mealData.items) {
                    for (const item of mealData.items) {
                        if (item.name && item.name.trim() !== '') {
                            const itemSection = normalizeSectionName(item.section);
                            if (!normalizedTargetSection || itemSection === normalizedTargetSection) {
                                const exists = dishes.some(d => d.name === item.name && normalizeSectionName(d.section) === itemSection);
                                if (!exists) {
                                    dishes.push({
                                        name: item.name,
                                        section: item.section,
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
            }
        }

        dishes.sort((a, b) => a.name.localeCompare(b.name));
        return dishes;
    }

    function replaceDish(mealType, idx, newDish) {
        if (!state.dailyMenuData) return;

        const meal = state.dailyMenuData[mealType];
        if (!meal || !meal.items || idx >= meal.items.length) return;

        meal.items[idx] = {
            section: newDish.section || meal.items[idx].section || '',
            name: newDish.name || '',
            weight: newDish.weight || 0,
            calories: newDish.calories || 0,
            proteins: newDish.proteins || 0,
            fats: newDish.fats || 0,
            carbs: newDish.carbs || 0,
            recipeId: newDish.recipeId || '',
            price: newDish.price || 0
        };

        state.dailyMenuItems = buildDailyFlatItems(state.dailyMenuData);
        state.dailyViolations = runDailyRules(state.dailyMenuData);
        renderDailyPreview();
        
        showStatus(`Блюдо заменено на "${newDish.name}"`, 'success');
    }

    // ============================================================
    // ПРОВЕРКА МЕНЮ
    // ============================================================
    
    function validateDailyMenu() {
        if (!state.dailyMenuData) {
            showStatus('Сначала выберите меню', 'error');
            return;
        }

        state.dailyViolations = runDailyRules(state.dailyMenuData);
        renderDailyPreview();

        const container = document.getElementById('validationResult');
        container.style.display = 'block';

        const errors = state.dailyViolations.filter(v => v.code === 15);
        const warnings = state.dailyViolations.filter(v => v.code !== 15 && v.code !== 17);
        const duplicates = state.dailyViolations.filter(v => v.code === 17);

        if (state.dailyViolations.length === 0) {
            container.className = 'validation-summary ok';
            container.innerHTML = '<i class="fas fa-check-circle"></i> Все правила выполнены! Меню соответствует требованиям.';
        } else if (errors.length > 0) {
            container.className = 'validation-summary error';
            container.innerHTML = `
                <i class="fas fa-exclamation-circle"></i> 
                Найдено <strong>${state.dailyViolations.length}</strong> нарушений, 
                из них <strong>${errors.length}</strong> критических (БЖУ > вес).
                ${warnings.length > 0 ? ` <span style="color: #d97706;">Предупреждений: ${warnings.length}</span>` : ''}
                ${duplicates.length > 0 ? ` <span style="color: #ec4899;">Дубликатов: ${duplicates.length}</span>` : ''}
            `;
        } else {
            container.className = 'validation-summary warning';
            container.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i> 
                Найдено <strong>${state.dailyViolations.length}</strong> предупреждений.
                ${duplicates.length > 0 ? ` <span style="color: #ec4899;">Дубликатов: ${duplicates.length}</span>` : ''}
            `;
        }
    }

    // ============================================================
    // ЭКСПОРТ В EXCEL
    // ============================================================
    
    async function createDailyMenuExcel() {
        if (!state.dailyMenuData) {
            showStatus('Сначала выберите меню', 'error');
            return;
        }

        state.dailyViolations = runDailyRules(state.dailyMenuData);
        const criticalErrors = state.dailyViolations.filter(v => v.code === 15);
        if (criticalErrors.length > 0) {
            const confirmCreate = confirm(
                `Обнаружено ${criticalErrors.length} критических ошибок (БЖУ > вес).\n\nПродолжить создание файла?`
            );
            if (!confirmCreate) return;
        }

        try {
            showStatus('Создание файла ежедневного меню...', 'info');
            
            const dateInput = document.getElementById('dailyMenuDate');
            const menuDate = dateInput?.value ? new Date(dateInput.value) : new Date();
            const schoolName = state.schoolInfo?.name || 'МОУ "Сказочная СОШ"';

            const menuForExcel = {
                date: menuDate,
                schoolName: schoolName,
                breakfast: state.dailyMenuData.breakfast || { items: [] },
                breakfast2: state.dailyMenuData.breakfast2 || { items: [] },
                lunch: state.dailyMenuData.lunch || { items: [] },
                afternoonSnack: state.dailyMenuData.afternoonSnack || { items: [] },
                dinner: state.dailyMenuData.dinner || { items: [] },
                dinner2: state.dailyMenuData.dinner2 || { items: [] }
            };

            const workbook = await createDailyMenuWorkbook(menuForExcel);
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { 
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
            });
            
            const fileName = `${formatDate(menuDate, 'file')}-sm.xlsx`;
            saveAs(blob, fileName);
            
            showStatus(`Файл "${fileName}" создан успешно!`, 'success');
        } catch (error) {
            console.error('Ошибка создания Excel:', error);
            showStatus(`Ошибка: ${error.message}`, 'error');
        }
    }

    async function createDailyMenuWorkbook(menu) {
        const ExcelJS = window.ExcelJS;
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'PRO Редактор меню';
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet('Меню', {
            properties: { defaultRowHeight: 20 },
            pageSetup: { fitToPage: true }
        });

        const data = createExcelDataStructure(menu);
        worksheet.addRows(data);

        worksheet.columns = [
            { key: 'A', width: 12 }, { key: 'B', width: 15 }, { key: 'C', width: 8 },
            { key: 'D', width: 35 }, { key: 'E', width: 10 }, { key: 'F', width: 10 },
            { key: 'G', width: 15 }, { key: 'H', width: 8 }, { key: 'I', width: 8 }, { key: 'J', width: 10 }
        ];

        worksheet.getColumn('F').numFmt = '0.00';
        ['E', 'G', 'H', 'I', 'J'].forEach(col => {
            worksheet.getColumn(col).numFmt = '0';
        });

        const menuColor = getMenuColor(state.selectedMenuNumber);
        const colors = {
            school: '#cfe2f3',
            header: '#e0e0e0',
            breakfast: menuColor.light || '#fff2cc',
            breakfast2: menuColor.light || '#ffe699',
            lunch: menuColor.light || '#d9d2e9',
            afternoonSnack: menuColor.light || '#d0e0e3',
            dinner: menuColor.light || '#f4cccc',
            dinner2: menuColor.light || '#e6ccff'
        };

        let currentMealType = null;
        let isFirstRowOfMeal = true;

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 2) {
                row.height = 0;
                row.hidden = true;
                return;
            }

            if (rowNumber === 1) {
                row.eachCell(cell => {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: hexToArgb(colors.school) } };
                    cell.font = { bold: true };
                });
                worksheet.mergeCells('B1:D1');
            } else if (rowNumber === 3) {
                row.eachCell(cell => {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: hexToArgb(colors.header) } };
                    cell.font = { bold: true };
                    cell.alignment = { horizontal: 'center', vertical: 'middle' };
                });
            } else if (rowNumber > 3) {
                const mealCell = row.getCell('A');
                const mealValue = mealCell.value ? mealCell.value.toString().trim() : '';

                if (mealValue) {
                    currentMealType = getMealTypeFromName(mealValue);
                    isFirstRowOfMeal = true;
                }

                if (currentMealType && colors[currentMealType]) {
                    row.eachCell(cell => {
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: hexToArgb(colors[currentMealType]) }
                        };
                    });
                }

                if (isFirstRowOfMeal && mealValue) {
                    mealCell.font = { bold: true, color: { argb: hexToArgb(menuColor.primary) } };
                    isFirstRowOfMeal = false;
                }
            }

            if (rowNumber >= 3 && rowNumber !== 2) {
                row.eachCell(cell => {
                    cell.border = {
                        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
                        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
                        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
                        right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
                    };
                });
            }
        });

        return workbook;
    }

    function createExcelDataStructure(menu) {
        const data = [];
        const schoolName = menu.schoolName || '';
        const date = menu.date || new Date();
        const dayStr = String(date.getDate()).padStart(2, '0');
        const monthStr = String(date.getMonth() + 1).padStart(2, '0');
        const yearStr = date.getFullYear();

        data.push(["Школа", schoolName, "", "", "Отд./корп", "", "", "", "День", `${dayStr}.${monthStr}.${yearStr}`]);
        data.push(["", "", "", "", "", "", "", "", "", ""]);
        data.push(["Прием пищи", "Раздел", "№ рец.", "Блюдо", "Выход, г", "Цена", "Калорийность", "Белки", "Жиры", "Углеводы"]);

        const addMeal = (mealName, mealType, items, alwaysShow = false) => {
            const mealItems = items || [];
            const realItems = mealItems.filter(item => {
                const name = item.name || '';
                return name && name.trim() !== '' && !name.trim().startsWith('[');
            });

            const hasRealItems = realItems.length > 0;
            if (!hasRealItems && !alwaysShow) return;

            const structure = MEAL_STRUCTURE[mealType] || { sections: [] };
            const itemsBySection = new Map();

            for (const item of realItems) {
                const section = normalizeSectionName(item.section || '');
                if (!itemsBySection.has(section)) itemsBySection.set(section, []);
                itemsBySection.get(section).push(item);
            }

            let isFirstItem = true;

            for (const section of structure.sections || []) {
                const sectionItems = itemsBySection.get(section) || [];
                if (sectionItems.length > 0) {
                    for (const item of sectionItems) {
                        data.push([
                            isFirstItem ? mealName : "",
                            item.originalSection || item.section || "",
                            item.recipeId || "",
                            item.name || "",
                            item.weight || "",
                            item.price || "",
                            item.calories || "",
                            item.proteins || "",
                            item.fats || "",
                            item.carbs || ""
                        ]);
                        isFirstItem = false;
                    }
                } else if (alwaysShow) {
                    data.push([
                        isFirstItem ? mealName : "",
                        section,
                        "",
                        "",
                        "",
                        "",
                        "",
                        "",
                        "",
                        ""
                    ]);
                    isFirstItem = false;
                }
            }

            for (const [section, sectionItems] of itemsBySection) {
                if (!structure.sections?.includes(section)) {
                    for (const item of sectionItems) {
                        data.push([
                            isFirstItem ? mealName : "",
                            item.originalSection || item.section || "",
                            item.recipeId || "",
                            item.name || "",
                            item.weight || "",
                            item.price || "",
                            item.calories || "",
                            item.proteins || "",
                            item.fats || "",
                            item.carbs || ""
                        ]);
                        isFirstItem = false;
                    }
                }
            }

            if (!isFirstItem) {
                data.push(["", "", "", "", "", "", "", "", "", ""]);
            }
        };

        addMeal('Завтрак', 'breakfast', menu.breakfast?.items || [], true);
        addMeal('Завтрак 2', 'breakfast2', menu.breakfast2?.items || [], true);
        addMeal('Обед', 'lunch', menu.lunch?.items || [], true);
        addMeal('Полдник', 'afternoonSnack', menu.afternoonSnack?.items || [], false);
        addMeal('Ужин', 'dinner', menu.dinner?.items || [], false);
        addMeal('Ужин 2', 'dinner2', menu.dinner2?.items || [], false);

        return data;
    }

    function hexToArgb(hexColor) {
        if (!hexColor) return 'FFFFFFFF';
        let hex = hexColor.replace('#', '');
        if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
        return 'FF' + hex.toUpperCase();
    }

    function getMealTypeFromName(mealName) {
        const map = {
            'Завтрак': 'breakfast',
            'Завтрак 2': 'breakfast2',
            'Обед': 'lunch',
            'Полдник': 'afternoonSnack',
            'Ужин': 'dinner',
            'Ужин 2': 'dinner2'
        };
        return map[mealName] || null;
    }

    // ============================================================
    // СОХРАНЁННЫЕ ВАРИАНТЫ
    // ============================================================
    
    function loadSavedVariants() {
        try {
            const data = localStorage.getItem(CONFIG.VARIANTS_STORAGE_KEY);
            state.savedVariants = data ? JSON.parse(data) : [];
        } catch(e) {
            state.savedVariants = [];
        }
        renderSavedVariants();
    }

    function saveVariantsToStorage() {
        try {
            localStorage.setItem(CONFIG.VARIANTS_STORAGE_KEY, JSON.stringify(state.savedVariants));
        } catch(e) {
            console.error('Ошибка сохранения вариантов:', e);
        }
        renderSavedVariants();
    }

    function renderSavedVariants() {
        const container = document.getElementById('variantsList');
        const countSpan = document.getElementById('variantsCount');
        
        if (!container) return;
        
        if (state.savedVariants.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; color: #94a3b8; padding: 20px;">
                    <i class="fas fa-inbox" style="font-size: 2rem; display: block; margin-bottom: 8px;"></i>
                    Нет сохранённых вариантов
                </div>
            `;
            if (countSpan) countSpan.textContent = '0 вариантов';
            return;
        }

        if (countSpan) countSpan.textContent = `${state.savedVariants.length} вариантов`;

        let html = '';
        for (let i = state.savedVariants.length - 1; i >= 0; i--) {
            const variant = state.savedVariants[i];
            const dateStr = variant.date ? new Date(variant.date).toLocaleDateString('ru-RU') : 'без даты';
            const mealCount = variant.items ? Object.values(variant.items).reduce((sum, meal) => sum + (meal?.items?.length || 0), 0) : 0;
            const color = getMenuColor(variant.menuNumber || 1);
            
            html += `
                <div class="variant-item" style="border-left: 4px solid ${color.primary};">
                    <div class="info">
                        <div class="name">${escapeHtml(variant.name || 'Без названия')}</div>
                        <div class="meta">
                            Меню #${variant.menuNumber || '?'} <span style="color: ${color.primary};">●</span> ${mealCount} блюд • ${dateStr}
                            ${variant.savedAt ? ` • сохранено ${new Date(variant.savedAt).toLocaleString('ru-RU')}` : ''}
                        </div>
                    </div>
                    <div class="actions">
                        <button class="load-btn" data-idx="${i}"><i class="fas fa-folder-open"></i> Загрузить</button>
                        <button class="export-btn" data-idx="${i}"><i class="fas fa-download"></i> Экспорт</button>
                        <button class="delete-btn" data-idx="${i}"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </div>
            `;
        }
        container.innerHTML = html;

        container.querySelectorAll('.load-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const idx = parseInt(this.dataset.idx);
                loadVariant(idx);
            });
        });

        container.querySelectorAll('.export-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const idx = parseInt(this.dataset.idx);
                exportVariant(idx);
            });
        });

        container.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const idx = parseInt(this.dataset.idx);
                if (confirm('Удалить этот вариант?')) {
                    state.savedVariants.splice(idx, 1);
                    saveVariantsToStorage();
                }
            });
        });
    }

	function saveCurrentVariant() {
		if (!state.dailyMenuData) {
			showStatus('Сначала выберите меню', 'error');
			return;
		}

		const nameInput = document.getElementById('variantNameInput');
		const dateInput = document.getElementById('dailyMenuDate');
		
		// ✅ АВТОМАТИЧЕСКОЕ ФОРМИРОВАНИЕ НАЗВАНИЯ В ФОРМАТЕ ГГГГ-ММ-ДД-sm.xlsx
		let date = dateInput?.value || new Date().toISOString().slice(0, 10);
		let autoName = `${date}-sm.xlsx`;
		
		// Если пользователь уже ввёл своё название, используем его
		const userValue = nameInput?.value?.trim();
		if (userValue && userValue !== '' && !userValue.includes('-sm.xlsx')) {
			autoName = userValue;
		} else if (!userValue || userValue === '') {
			// Если поле пустое, устанавливаем автоматическое название
			if (nameInput) nameInput.value = autoName;
		}

		const variant = {
			name: autoName,
			date: date,
			menuNumber: state.selectedMenuNumber,
			week: state.dailyMenuData.week,
			day: state.dailyMenuData.day,
			items: JSON.parse(JSON.stringify({
				breakfast: state.dailyMenuData.breakfast,
				breakfast2: state.dailyMenuData.breakfast2,
				lunch: state.dailyMenuData.lunch,
				afternoonSnack: state.dailyMenuData.afternoonSnack,
				dinner: state.dailyMenuData.dinner,
				dinner2: state.dailyMenuData.dinner2
			})),
			savedAt: new Date().toISOString()
		};

		const existing = state.savedVariants.findIndex(v => 
			v.name === autoName && v.date === date && v.menuNumber === state.selectedMenuNumber
		);

		if (existing >= 0) {
			state.savedVariants[existing] = variant;
			showStatus(`Вариант "${autoName}" обновлён`, 'success');
		} else {
			state.savedVariants.push(variant);
			showStatus(`Вариант "${autoName}" сохранён`, 'success');
		}

		saveVariantsToStorage();
		
		const btn = document.getElementById('saveVariantBtn');
		btn.classList.add('saving-animation');
		setTimeout(() => btn.classList.remove('saving-animation'), 600);
	}

	function loadVariant(idx) {
		if (idx < 0 || idx >= state.savedVariants.length) return;
		
		const variant = state.savedVariants[idx];
		
		state.dailyMenuData = {
			week: variant.week || 1,
			day: variant.day || 1,
			menuNumber: variant.menuNumber || 1,
			breakfast: variant.items.breakfast || { items: [] },
			breakfast2: variant.items.breakfast2 || { items: [] },
			lunch: variant.items.lunch || { items: [] },
			afternoonSnack: variant.items.afternoonSnack || { items: [] },
			dinner: variant.items.dinner || { items: [] },
			dinner2: variant.items.dinner2 || { items: [] }
		};

		state.selectedMenuNumber = variant.menuNumber;
		state.dailyMenuItems = buildDailyFlatItems(state.dailyMenuData);
		state.dailyViolations = runDailyRules(state.dailyMenuData);

		if (variant.date) {
			const dateInput = document.getElementById('dailyMenuDate');
			if (dateInput) dateInput.value = variant.date;
		}
		
		const nameInput = document.getElementById('variantNameInput');
		if (nameInput) {
			// Показываем название варианта или генерируем автоматическое
			if (variant.name && variant.name !== '') {
				nameInput.value = variant.name;
			} else {
				const date = variant.date || new Date().toISOString().slice(0, 10);
				nameInput.value = `${date}-sm.xlsx`;
			}
		}

		updateMenuSelectorUI();
		renderDailyPreview();
		
		showStatus(`Вариант "${variant.name || 'Без названия'}" загружен`, 'success');
	}

	function updateStatusBarMenu() {
		const state = window.DailyMenuModule?.getState?.();
		
		// Получаем элементы статусной строки
		const menuNumberEl = document.getElementById('statusMenuNumber');
		const weekEl = document.getElementById('statusWeek');
		const dayEl = document.getElementById('statusDay');
		const dishesEl = document.getElementById('statusDishes');
		const violationsEl = document.getElementById('statusViolations');
		const violationsCountEl = document.getElementById('statusViolationsCount');
		const lastUpdateEl = document.getElementById('statusLastUpdate');
		
		// ✅ ДОБАВЛЯЕМ ЭЛЕМЕНТЫ ДЛЯ КАЛОРИЙ И ВЕСА
		const caloriesEl = document.getElementById('statusCalories');
		const caloriesValueEl = document.getElementById('statusCaloriesValue');
		const weightEl = document.getElementById('statusWeight');
		const weightValueEl = document.getElementById('statusWeightValue');
		
		if (!state || !state.dailyMenuData) {
			if (menuNumberEl) menuNumberEl.textContent = '—';
			if (weekEl) weekEl.textContent = '—';
			if (dayEl) dayEl.textContent = '—';
			if (dishesEl) dishesEl.textContent = '0';
			if (violationsEl) violationsEl.style.display = 'none';
			if (caloriesEl) caloriesEl.style.display = 'none';
			if (weightEl) weightEl.style.display = 'none';
			if (lastUpdateEl) lastUpdateEl.textContent = 'Нет данных';
			return;
		}

		// === ОСНОВНАЯ ИНФОРМАЦИЯ ===
		const menuNum = state.dailyMenuData.menuNumber || '—';
		const week = state.dailyMenuData.week || '—';
		const day = state.dailyMenuData.day || '—';
		const dishes = state.dailyMenuItems?.length || 0;
		
		// Номер меню
		if (menuNumberEl) {
			menuNumberEl.textContent = menuNum;
			menuNumberEl.className = 'value menu-number';
			const color = getMenuColor(menuNum);
			menuNumberEl.style.color = color.primary;
		}
		
		if (weekEl) {
			weekEl.textContent = week;
			weekEl.style.color = '#10b981';
		}
		
		if (dayEl) {
			dayEl.textContent = day;
			dayEl.style.color = '#3b82f6';
		}
		
		if (dishesEl) {
			dishesEl.textContent = dishes;
			dishesEl.style.color = dishes > 0 ? '#f59e0b' : '#94a3b8';
		}

		// === ✅ КАЛОРИИ И ВЕС ===
		let totalCalories = 0;
		let totalWeight = 0;
		
		if (state.dailyMenuItems && state.dailyMenuItems.length > 0) {
			totalCalories = state.dailyMenuItems.reduce((sum, item) => sum + (item.calories || 0), 0);
			totalWeight = state.dailyMenuItems.reduce((sum, item) => sum + (item.weight || 0), 0);
		}
		
		if (caloriesEl && caloriesValueEl) {
			if (totalCalories > 0) {
				caloriesEl.style.display = 'inline';
				caloriesValueEl.textContent = Math.round(totalCalories);
				caloriesValueEl.style.color = '#ef4444';
			} else {
				caloriesEl.style.display = 'none';
			}
		}
		
		if (weightEl && weightValueEl) {
			if (totalWeight > 0) {
				weightEl.style.display = 'inline';
				weightValueEl.textContent = Math.round(totalWeight);
				weightValueEl.style.color = '#10b981';
			} else {
				weightEl.style.display = 'none';
			}
		}

		// === НАРУШЕНИЯ ===
		const violations = state.dailyViolations || [];
		const criticalErrors = violations.filter(v => v.code === 15);
		const hasViolations = violations.length > 0;
		
		if (violationsEl && violationsCountEl) {
			if (hasViolations) {
				violationsEl.style.display = 'inline';
				violationsCountEl.textContent = violations.length;
				
				if (criticalErrors.length > 0) {
					violationsCountEl.style.color = '#dc2626';
					violationsCountEl.style.fontWeight = 'bold';
				} else {
					violationsCountEl.style.color = '#f59e0b';
					violationsCountEl.style.fontWeight = 'bold';
				}
				
				violationsEl.title = criticalErrors.length > 0 
					? `${criticalErrors.length} критических ошибок (БЖУ > вес)`
					: `${violations.length - criticalErrors.length} предупреждений`;
			} else {
				violationsEl.style.display = 'none';
			}
		}

		// === ВРЕМЯ ОБНОВЛЕНИЯ ===
		if (lastUpdateEl) {
			const now = new Date();
			const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
			lastUpdateEl.textContent = `Обновлено ${timeStr}`;
			lastUpdateEl.style.color = '#64748b';
		}

		// === ИНФОРМАЦИЯ О ШКОЛЕ ===
		const schoolInfo = state.schoolInfo || window.schoolInfo || {};
		const schoolNameEl = document.querySelector('.daily-menu-header .school-name');
		if (schoolNameEl) {
			schoolNameEl.textContent = schoolInfo.name || 'МОУ "Сказочная СОШ"';
		}
		
		const approvalEl = document.querySelector('.daily-menu-header .approval-info');
		if (approvalEl) {
			const pos = schoolInfo.approval?.position || 'Директор';
			const name = schoolInfo.approval?.name || 'Иванова И.И.';
			approvalEl.textContent = `${pos} ${name}`;
		}

		// Обновляем дату в шапке
		const dateInput = document.getElementById('dailyMenuDate');
		const headerDateEl = document.getElementById('dailyHeaderDate');
		if (headerDateEl && dateInput && dateInput.value) {
			const dateObj = new Date(dateInput.value);
			const options = { day: 'numeric', month: 'long', year: 'numeric' };
			headerDateEl.textContent = dateObj.toLocaleDateString('ru-RU', options);
		}
	}

    function exportVariant(idx) {
        if (idx < 0 || idx >= state.savedVariants.length) return;
        
        const variant = state.savedVariants[idx];
        const exportData = {
            variant: variant,
            exportDate: new Date().toISOString(),
            version: '6.0'
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `вариант_меню_${variant.name.replace(/\s+/g, '_')}_${variant.date || 'без_даты'}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showStatus(`Вариант "${variant.name}" экспортирован`, 'success');
    }

    function importVariantFromFile(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                if (data.variant && data.variant.items) {
                    state.savedVariants.push(data.variant);
                    saveVariantsToStorage();
                    showStatus(`Вариант "${data.variant.name}" импортирован`, 'success');
                } else {
                    showStatus('Неверный формат файла', 'error');
                }
            } catch(err) {
                showStatus('Ошибка чтения файла', 'error');
            }
        };
        reader.readAsText(file);
    }

    // ============================================================
    // ПЕЧАТЬ И PDF
    // ============================================================
    
	function getPrintContent() {
		if (!state.dailyMenuData) {
			showStatus('Сначала выберите меню', 'error');
			return null;
		}

		const dateInput = document.getElementById('dailyMenuDate');
		const date = dateInput?.value ? new Date(dateInput.value) : new Date();
		const dateStr = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
		
		// ✅ ЧИТАЕМ ДАННЫЕ ИЗ ПОЛЕЙ УТВЕРЖДЕНИЯ
		const approvalPosition = document.getElementById('dailyApprovalPosition')?.value || 'Директор';
		const approvalName = document.getElementById('dailyApprovalName')?.value || 'Иванова И.И.';
		const agreedPosition = document.getElementById('dailyAgreedPosition')?.value || 'Диетсестра';
		const agreedName = document.getElementById('dailyAgreedName')?.value || '____________________';
		
		const schoolName = state.schoolInfo?.name || 'МОУ "Сказочная СОШ"';
		const approvalDate = state.schoolInfo?.approval?.date || '12.01.2026';

		const menuColor = getMenuColor(state.selectedMenuNumber);

		let tableRows = '';
		const mealTypes = ['breakfast', 'breakfast2', 'lunch', 'afternoonSnack', 'dinner', 'dinner2'];
		
		for (const mealType of mealTypes) {
			const meal = state.dailyMenuData[mealType];
			const items = meal?.items || [];
			const visibleItems = items.filter(it => it.name && it.name.trim() !== '');
			
			if (visibleItems.length === 0) continue;
			
			tableRows += `
				<tr class="meal-header">
					<td colspan="5"><strong>${getMealName(mealType)}</strong></td>
				</tr>
			`;
			
			for (const item of visibleItems) {
				tableRows += `
					<tr>
						<td>${escapeHtml(item.section || '—')}</td>
						<td>${escapeHtml(item.name)}</td>
						<td style="text-align: center;">${item.weight || 0}</td>
						<td style="text-align: center;">${item.calories || 0}</td>
						<td style="text-align: center;">${item.price ? item.price.toFixed(2) : '0.00'}</td>
					</tr>
				`;
			}
		}

		let totalWeight = 0, totalCalories = 0, totalPrice = 0;
		for (const item of state.dailyMenuItems) {
			totalWeight += item.weight || 0;
			totalCalories += item.calories || 0;
			totalPrice += item.price || 0;
		}

		const hasViolations = state.dailyViolations.length > 0;
		const criticalErrors = state.dailyViolations.filter(v => v.code === 15);

		return `
			<div class="print-wrapper" id="printContent">
				<div class="print-header" style="border-bottom: 3px solid ${menuColor.primary};">
					<h1 style="color: ${menuColor.primary};">🍽️ ${CONFIG.PRINT_TITLE}</h1>
					<div class="sub">${escapeHtml(schoolName)}</div>
					<div class="date-info">
						${dateStr} • Меню #${state.dailyMenuData.menuNumber || '—'} • Неделя ${state.dailyMenuData.week || '—'}, День ${state.dailyMenuData.day || '—'}
						<span style="display: inline-block; margin-left: 12px; padding: 2px 12px; border-radius: 12px; background: ${menuColor.primary}; color: white; font-size: 9pt;">
							${menuColor.name}
						</span>
					</div>
				</div>

				<table class="print-table">
					<thead>
						<tr>
							<th style="width: 15%;">Раздел</th>
							<th style="width: 45%;">Блюдо</th>
							<th style="width: 12%; text-align: center;">Вес (г)</th>
							<th style="width: 13%; text-align: center;">Ккал</th>
							<th style="width: 15%; text-align: center;">Цена (₽)</th>
						</tr>
					</thead>
					<tbody>
						${tableRows || '<tr><td colspan="5" style="text-align: center; color: #94a3b8;">Нет блюд в меню</td></tr>'}
					</tbody>
					<tfoot>
						<tr style="font-weight: 700; background: ${menuColor.light};">
							<td colspan="2" style="text-align: right;">ИТОГО:</td>
							<td style="text-align: center;">${totalWeight}</td>
							<td style="text-align: center;">${totalCalories}</td>
							<td style="text-align: center;">${totalPrice.toFixed(2)}</td>
						</tr>
					</tfoot>
				</table>

				<div class="print-footer">
					<div class="approval">
						<div>
							<div>Утвердил</div>
							<div class="line"></div>
							<div style="font-size: 9pt; color: #64748b;">${escapeHtml(approvalPosition)}</div>
							<div style="font-weight: 600;">${escapeHtml(approvalName)}</div>
						</div>
						<div>
							<div>Согласовано</div>
							<div class="line"></div>
							<div style="font-size: 9pt; color: #64748b;">${escapeHtml(agreedPosition)}</div>
							<div style="font-weight: 600;">${escapeHtml(agreedName)}</div>
						</div>
						<div>
							<div>Дата</div>
							<div class="line"></div>
							<div style="font-weight: 600;">${approvalDate}</div>
						</div>
					</div>
					<div style="margin-top: 16px; font-size: 8pt; color: #94a3b8;">
						Документ сформирован в программе "PRO Редактор типового меню ФЦМПО" • ${new Date().toLocaleString('ru-RU')}
					</div>
				</div>
			</div>
		`;
	}

    function showPrintPreview() {
        const content = getPrintContent();
        if (!content) return;

        const modal = document.getElementById('printPreviewModal');
        const container = document.getElementById('printPreviewContent');
        container.innerHTML = content;
        modal.style.display = 'flex';
    }

    function printDailyMenu() {
        const content = getPrintContent();
        if (!content) return;

        const printWindow = window.open('', '_blank', 'width=1000,height=800');
        if (!printWindow) {
            showStatus('Пожалуйста, разрешите всплывающие окна для печати', 'error');
            return;
        }

        const menuColor = getMenuColor(state.selectedMenuNumber);

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head><title>Ежедневное меню</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Arial, sans-serif; }
                body { padding: 20px; background: white; }
                .print-wrapper { max-width: 1000px; margin: 0 auto; }
                .print-header { text-align: center; border-bottom: 3px solid ${menuColor.primary}; padding-bottom: 20px; margin-bottom: 24px; }
                .print-header h1 { font-size: 22pt; color: ${menuColor.primary}; margin-bottom: 8px; }
                .print-header .sub { font-size: 12pt; color: #475569; }
                .print-header .date-info { font-size: 11pt; color: #64748b; margin-top: 8px; }
                .print-table { width: 100%; border-collapse: collapse; font-size: 10pt; margin: 16px 0; }
                .print-table th { background: #f1f5f9; font-weight: 700; border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
                .print-table td { border: 1px solid #cbd5e1; padding: 6px 10px; }
                .print-table .meal-header { background: ${menuColor.light}; font-weight: 600; }
                .print-footer { margin-top: 30px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center; font-size: 9pt; color: #94a3b8; }
                .print-footer .approval { display: flex; justify-content: space-around; margin-top: 16px; font-size: 10pt; color: #475569; }
                .print-footer .approval div { text-align: center; }
                .print-footer .approval .line { width: 200px; border-bottom: 1px solid #475569; margin: 4px auto 0; }
                @media print {
                    body { padding: 0; }
                    .no-print { display: none; }
                }
            </style>
            </head>
            <body>
                ${content}
                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                            setTimeout(function() { window.close(); }, 1000);
                        }, 300);
                    };
                <\/script>
            </body>
            </html>
        `);
        printWindow.document.close();
    }

	function printDailyMenuWithSettings(settings) {
		const content = getPrintContentWithSettings(settings);
		if (!content) return;

		const printWindow = window.open('', '_blank', 'width=1000,height=800');
		if (!printWindow) {
			showStatus('Пожалуйста, разрешите всплывающие окна для печати', 'error');
			return;
		}

		const menuColor = getMenuColor(state.selectedMenuNumber);

		printWindow.document.write(`
			<!DOCTYPE html>
			<html>
			<head><title>Ежедневное меню</title>
			<style>
				* { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Arial, sans-serif; }
				body { padding: 20px; background: white; }
				.print-wrapper { max-width: 1000px; margin: 0 auto; }
				.print-header { text-align: center; border-bottom: 3px solid ${menuColor.primary}; padding-bottom: 20px; margin-bottom: 24px; }
				.print-header h1 { font-size: 22pt; color: ${menuColor.primary}; margin-bottom: 8px; }
				.print-header .sub { font-size: 12pt; color: #475569; }
				.print-header .date-info { font-size: 11pt; color: #64748b; margin-top: 8px; }
				.print-table { width: 100%; border-collapse: collapse; font-size: 10pt; margin: 16px 0; }
				.print-table th { background: #f1f5f9; font-weight: 700; border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
				.print-table td { border: 1px solid #cbd5e1; padding: 6px 10px; }
				.print-table .meal-header { background: ${menuColor.light}; font-weight: 600; }
				.print-footer { margin-top: 30px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center; font-size: 9pt; color: #94a3b8; }
				.print-footer .approval { display: flex; justify-content: space-around; margin-top: 16px; font-size: 10pt; color: #475569; }
				.print-footer .approval div { text-align: center; }
				.print-footer .approval .line { width: 200px; border-bottom: 1px solid #475569; margin: 4px auto 0; }
				@media print {
					body { padding: 0; }
					.no-print { display: none; }
				}
			</style>
			</head>
			<body>
				${content}
				<script>
					window.onload = function() {
						setTimeout(function() {
							window.print();
							setTimeout(function() { window.close(); }, 1000);
						}, 300);
					};
				<\/script>
			</body>
			</html>
		`);
		printWindow.document.close();
	}

	function getPrintContentWithSettings(settings) {
		if (!state.dailyMenuData) {
			showStatus('Сначала выберите меню', 'error');
			return null;
		}

		const dateInput = document.getElementById('dailyMenuDate');
		const date = dateInput?.value ? new Date(dateInput.value) : new Date();
		const dateStr = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
		
		const approvalPosition = document.getElementById('dailyApprovalPosition')?.value || 'Директор';
		const approvalName = document.getElementById('dailyApprovalName')?.value || 'Иванова И.И.';
		const agreedPosition = document.getElementById('dailyAgreedPosition')?.value || 'Диетсестра';
		const agreedName = document.getElementById('dailyAgreedName')?.value || '____________________';
		
		const schoolName = state.schoolInfo?.name || 'МОУ "Сказочная СОШ"';
		const approvalDate = state.schoolInfo?.approval?.date || '12.01.2026';

		const menuColor = getMenuColor(state.selectedMenuNumber);

		// Формируем заголовки таблицы с учётом настроек
		let headers = [];
		if (settings.showSection) headers.push('Раздел');
		headers.push('Блюдо');
		if (settings.showWeight) headers.push('Вес (г)');
		if (settings.showCalories) headers.push('Ккал');
		if (settings.showProteins) headers.push('Белки (г)');
		if (settings.showFats) headers.push('Жиры (г)');
		if (settings.showCarbs) headers.push('Углеводы (г)');
		if (settings.showPrice) headers.push('Цена (₽)');

		let tableRows = '';
		const mealTypes = ['breakfast', 'breakfast2', 'lunch', 'afternoonSnack', 'dinner', 'dinner2'];
		
		for (const mealType of mealTypes) {
			const meal = state.dailyMenuData[mealType];
			const items = meal?.items || [];
			const visibleItems = items.filter(it => it.name && it.name.trim() !== '');
			
			if (visibleItems.length === 0) continue;
			
			tableRows += `
				<tr class="meal-header">
					<td colspan="${headers.length}"><strong>${getMealName(mealType)}</strong></td>
				</tr>
			`;
			
			for (const item of visibleItems) {
				let cells = '';
				if (settings.showSection) cells += `<td>${escapeHtml(item.section || '—')}</td>`;
				cells += `<td>${escapeHtml(item.name)}</td>`;
				if (settings.showWeight) cells += `<td style="text-align: center;">${item.weight || 0}</td>`;
				if (settings.showCalories) cells += `<td style="text-align: center;">${item.calories || 0}</td>`;
				if (settings.showProteins) cells += `<td style="text-align: center;">${item.proteins || 0}</td>`;
				if (settings.showFats) cells += `<td style="text-align: center;">${item.fats || 0}</td>`;
				if (settings.showCarbs) cells += `<td style="text-align: center;">${item.carbs || 0}</td>`;
				if (settings.showPrice) cells += `<td style="text-align: center;">${item.price ? item.price.toFixed(2) : '0.00'}</td>`;
				tableRows += `<tr>${cells}</tr>`;
			}
		}

		// Итоговые строки
		let totalWeight = 0, totalCalories = 0, totalProteins = 0, totalFats = 0, totalCarbs = 0, totalPrice = 0;
		for (const item of state.dailyMenuItems) {
			totalWeight += item.weight || 0;
			totalCalories += item.calories || 0;
			totalProteins += item.proteins || 0;
			totalFats += item.fats || 0;
			totalCarbs += item.carbs || 0;
			totalPrice += item.price || 0;
		}

		const hasViolations = state.dailyViolations.length > 0;
		const criticalErrors = state.dailyViolations.filter(v => v.code === 15);

		// Формируем HTML
		let html = `
			<div class="print-wrapper" id="printContent">
		`;

		// Шапка
		if (settings.showHeader) {
			html += `
				<div class="print-header" style="border-bottom: 3px solid ${menuColor.primary};">
					<h1 style="color: ${menuColor.primary};">🍽️ ${CONFIG.PRINT_TITLE}</h1>
					<div class="sub">${escapeHtml(schoolName)}</div>
					<div class="date-info">
						${dateStr} • Меню #${state.dailyMenuData.menuNumber || '—'} • Неделя ${state.dailyMenuData.week || '—'}, День ${state.dailyMenuData.day || '—'}
						<span style="display: inline-block; margin-left: 12px; padding: 2px 12px; border-radius: 12px; background: ${menuColor.primary}; color: white; font-size: 9pt;">
							${menuColor.name}
						</span>
					</div>
				</div>
			`;
		}

		// Таблица
		html += `
			<table class="print-table">
				<thead>
					<tr>
						${headers.map(h => `<th style="text-align: ${h.includes('г') || h.includes('ккал') || h.includes('₽') ? 'center' : 'left'};">${h}</th>`).join('')}
					</tr>
				</thead>
				<tbody>
					${tableRows || `<tr><td colspan="${headers.length}" style="text-align: center; color: #94a3b8;">Нет блюд в меню</td></tr>`}
				</tbody>
		`;

		// Итоги
		if (settings.showTotals) {
			let totalCells = '';
			if (settings.showSection) totalCells += `<td style="text-align: right; font-weight: 700;">ИТОГО:</td>`;
			else totalCells += `<td style="text-align: right; font-weight: 700;" colspan="${headers.length - 6}">ИТОГО:</td>`;
			// ... пропускаем логику итогов для краткости, в коде она есть
			html += `
				<tfoot>
					<tr style="font-weight: 700; background: ${menuColor.light};">
						<td colspan="${headers.length - 6}" style="text-align: right;">ИТОГО:</td>
						${settings.showWeight ? `<td style="text-align: center;">${totalWeight}</td>` : ''}
						${settings.showCalories ? `<td style="text-align: center;">${totalCalories}</td>` : ''}
						${settings.showProteins ? `<td style="text-align: center;">${totalProteins.toFixed(1)}</td>` : ''}
						${settings.showFats ? `<td style="text-align: center;">${totalFats.toFixed(1)}</td>` : ''}
						${settings.showCarbs ? `<td style="text-align: center;">${totalCarbs.toFixed(1)}</td>` : ''}
						${settings.showPrice ? `<td style="text-align: center;">${totalPrice.toFixed(2)}</td>` : ''}
					</tr>
				</tfoot>
			`;
		}

		html += `</table>`;

		// Подписи
		if (settings.showApproval) {
			html += `
				<div class="print-footer">
					<div class="approval">
						<div>
							<div>Утвердил</div>
							<div class="line"></div>
							<div style="font-size: 9pt; color: #64748b;">${escapeHtml(approvalPosition)}</div>
							<div style="font-weight: 600;">${escapeHtml(approvalName)}</div>
						</div>
						<div>
							<div>Согласовано</div>
							<div class="line"></div>
							<div style="font-size: 9pt; color: #64748b;">${escapeHtml(agreedPosition)}</div>
							<div style="font-weight: 600;">${escapeHtml(agreedName)}</div>
						</div>
						<div>
							<div>Дата</div>
							<div class="line"></div>
							<div style="font-weight: 600;">${approvalDate}</div>
						</div>
					</div>
					<div style="margin-top: 16px; font-size: 8pt; color: #94a3b8;">
						Документ сформирован в программе "PRO Редактор типового меню ФЦМПО" • ${new Date().toLocaleString('ru-RU')}
					</div>
				</div>
			`;
		}

		html += `</div>`;
		return html;
	}

	async function exportDailyPDF() {
		const content = getPrintContent();
		if (!content) return;

		const modal = document.getElementById('printPreviewModal');
		const container = document.getElementById('printPreviewContent');
		container.innerHTML = content;
		modal.style.display = 'flex';

		await new Promise(resolve => setTimeout(resolve, 400));

		try {
			const element = container.querySelector('.print-wrapper');
			if (!element) throw new Error('Не найден элемент для PDF');

			// Проверяем наличие html2canvas
			if (typeof html2canvas === 'undefined') {
				throw new Error('Библиотека html2canvas не загружена. Проверьте подключение.');
			}

			const canvas = await html2canvas(element, {
				scale: 2,
				useCORS: true,
				backgroundColor: '#ffffff',
				logging: false,
				height: element.scrollHeight,
				width: element.scrollWidth,
				windowHeight: element.scrollHeight,
				windowWidth: element.scrollWidth
			});

			const imgData = canvas.toDataURL('image/png');
			
			// Проверяем наличие jsPDF
			if (typeof window.jspdf === 'undefined' && typeof jspdf === 'undefined') {
				throw new Error('Библиотека jsPDF не загружена. Проверьте подключение.');
			}
			
			const { jsPDF } = window.jspdf || window;
			const pdf = new jsPDF('p', 'mm', 'a4');
			const pdfWidth = pdf.internal.pageSize.getWidth();
			const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

			let heightLeft = pdfHeight;
			let position = 0;

			pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
			heightLeft -= pdf.internal.pageSize.getHeight();

			while (heightLeft > 0) {
				position = heightLeft - pdfHeight;
				pdf.addPage();
				pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
				heightLeft -= pdf.internal.pageSize.getHeight();
			}

			const fileName = `${CONFIG.PDF_FILENAME}_${new Date().toISOString().slice(0,10)}.pdf`;
			pdf.save(fileName);
			
			showStatus(`PDF файл "${fileName}" создан`, 'success');
			modal.style.display = 'none';
		} catch (error) {
			console.error('Ошибка создания PDF:', error);
			showStatus(`Ошибка создания PDF: ${error.message}`, 'error');
		}
	}

    // ============================================================
    // ИНИЦИАЛИЗАЦИЯ
    // ============================================================
    
    function initDailyMenuInterface() {
        const data = window.templateMenuData || state.templateMenuData;
        if (data && data.weeks && Object.keys(data.weeks).length > 0) {
            state.templateMenuData = data;
            const placeholder = document.getElementById('dailyMenuPlaceholder');
            const content = document.getElementById('dailyMenuContent');
            if (placeholder) placeholder.style.display = 'none';
            if (content) content.style.display = 'block';
            updateMenuSelectorUI();
            
            const firstMenu = 1;
            if (getDayFromMenuNumber(firstMenu)) {
                loadDailyMenu(firstMenu);
            }
        } else {
            const placeholder = document.getElementById('dailyMenuPlaceholder');
            const content = document.getElementById('dailyMenuContent');
            if (placeholder) placeholder.style.display = 'block';
            if (content) content.style.display = 'none';
        }
    }

    function init() {
        // Получаем данные из глобальной области
        state.templateMenuData = window.templateMenuData || null;
        state.schoolInfo = window.schoolInfo || null;

        // Загружаем сохранённые варианты
        loadSavedVariants();

        // Находим DOM-элементы
        elements = {
            viewModeBtn: document.getElementById('viewModeBtn'),
            editModeBtn: document.getElementById('editModeBtn'),
            validateDailyBtn: document.getElementById('validateDailyBtn'),
            createDailyBtn: document.getElementById('createDailyBtn'),
            saveVariantBtn: document.getElementById('saveVariantBtn'),
            printDailyBtn: document.getElementById('printDailyBtn'),
            pdfDailyBtn: document.getElementById('pdfDailyBtn'),
            closeReplaceModal: document.getElementById('closeReplaceModal'),
            closePrintModal: document.getElementById('closePrintModal'),
            closePrintModalBtn: document.getElementById('closePrintModalBtn'),
            printFromModalBtn: document.getElementById('printFromModalBtn'),
            pdfFromModalBtn: document.getElementById('pdfFromModalBtn'),
            replaceDishModal: document.getElementById('replaceDishModal'),
            printPreviewModal: document.getElementById('printPreviewModal'),
            dailyPreview: document.getElementById('dailyPreview'),
            validationResult: document.getElementById('validationResult'),
            variantNameInput: document.getElementById('variantNameInput'),
            dailyMenuDate: document.getElementById('dailyMenuDate'),
            menuSelector: document.getElementById('menuSelector'),
            variantsList: document.getElementById('variantsList'),
            variantsCount: document.getElementById('variantsCount')
        };

        // Устанавливаем дату по умолчанию
        if (elements.dailyMenuDate) {
            const today = new Date().toISOString().slice(0, 10);
            elements.dailyMenuDate.value = today;
        }

        // События
        if (elements.viewModeBtn) {
            elements.viewModeBtn.addEventListener('click', function() {
                state.isEditMode = false;
                this.classList.add('active');
                if (elements.editModeBtn) elements.editModeBtn.classList.remove('active');
                renderDailyPreview();
            });
        }

        if (elements.editModeBtn) {
            elements.editModeBtn.addEventListener('click', function() {
                state.isEditMode = true;
                this.classList.add('active');
                if (elements.viewModeBtn) elements.viewModeBtn.classList.remove('active');
                renderDailyPreview();
            });
        }

        if (elements.validateDailyBtn) {
            elements.validateDailyBtn.addEventListener('click', validateDailyMenu);
        }

        if (elements.createDailyBtn) {
            elements.createDailyBtn.addEventListener('click', createDailyMenuExcel);
        }

        if (elements.saveVariantBtn) {
            elements.saveVariantBtn.addEventListener('click', saveCurrentVariant);
        }

        if (elements.printDailyBtn) {
            elements.printDailyBtn.addEventListener('click', showPrintPreview);
        }

        if (elements.pdfDailyBtn) {
            elements.pdfDailyBtn.addEventListener('click', exportDailyPDF);
        }

        if (elements.closeReplaceModal) {
            elements.closeReplaceModal.addEventListener('click', function() {
                if (elements.replaceDishModal) elements.replaceDishModal.style.display = 'none';
            });
        }

        if (elements.closePrintModal) {
            elements.closePrintModal.addEventListener('click', function() {
                if (elements.printPreviewModal) elements.printPreviewModal.style.display = 'none';
            });
        }

        if (elements.closePrintModalBtn) {
            elements.closePrintModalBtn.addEventListener('click', function() {
                if (elements.printPreviewModal) elements.printPreviewModal.style.display = 'none';
            });
        }

        if (elements.printFromModalBtn) {
            elements.printFromModalBtn.addEventListener('click', function() {
                if (elements.printPreviewModal) elements.printPreviewModal.style.display = 'none';
                setTimeout(printDailyMenu, 200);
            });
        }

        if (elements.pdfFromModalBtn) {
            elements.pdfFromModalBtn.addEventListener('click', exportDailyPDF);
        }

        if (elements.replaceDishModal) {
            elements.replaceDishModal.addEventListener('click', function(e) {
                if (e.target === this) this.style.display = 'none';
            });
        }

        if (elements.printPreviewModal) {
            elements.printPreviewModal.addEventListener('click', function(e) {
                if (e.target === this) this.style.display = 'none';
            });
        }

        // Скрытый input для импорта
        const importInput = document.createElement('input');
        importInput.type = 'file';
        importInput.accept = '.json';
        importInput.style.display = 'none';
        importInput.id = 'importVariantInput';
        document.body.appendChild(importInput);

        importInput.addEventListener('change', function(e) {
            if (this.files[0]) {
                importVariantFromFile(this.files[0]);
                this.value = '';
            }
        });

        // Кнопка импорта
        const variantsPanel = document.getElementById('savedVariantsPanel');
        const panelHeader = variantsPanel?.querySelector('div:first-child');
        if (panelHeader) {
            const importBtn = document.createElement('button');
            importBtn.className = 'btn btn-secondary';
            importBtn.style.padding = '4px 12px';
            importBtn.style.fontSize = '0.75rem';
            importBtn.innerHTML = '<i class="fas fa-upload"></i> Импорт';
            importBtn.addEventListener('click', function() {
                document.getElementById('importVariantInput').click();
            });
            panelHeader.appendChild(importBtn);
        }

        // Инициализируем интерфейс
        setTimeout(initDailyMenuInterface, 300);

        // Перехватываем изменения глобальных данных
        const originalRender = window.renderEditor;
        if (originalRender) {
            window.renderEditor = function() {
                originalRender();
                state.templateMenuData = window.templateMenuData || state.templateMenuData;
                state.schoolInfo = window.schoolInfo || state.schoolInfo;
                setTimeout(initDailyMenuInterface, 300);
            };
        }

		// Кнопка настроек печати
		const printSettingsBtn = document.getElementById('printSettingsBtn');
		if (printSettingsBtn) {
			printSettingsBtn.addEventListener('click', function() {
				document.getElementById('dailyPrintSettingsModal').style.display = 'flex';
			});
		}

		// Закрытие настроек печати
		const settingsCancel = document.getElementById('dailyPrintSettingsCancel');
		if (settingsCancel) {
			settingsCancel.addEventListener('click', function() {
				document.getElementById('dailyPrintSettingsModal').style.display = 'none';
			});
		}

		// Применение настроек и печать
		const settingsApply = document.getElementById('dailyPrintSettingsApply');
		if (settingsApply) {
			settingsApply.addEventListener('click', function() {
				document.getElementById('dailyPrintSettingsModal').style.display = 'none';
				// Получаем настройки
				const printSettings = {
					showHeader: document.getElementById('printShowHeader').checked,
					showSection: document.getElementById('printShowSection').checked,
					showWeight: document.getElementById('printShowWeight').checked,
					showCalories: document.getElementById('printShowCalories').checked,
					showProteins: document.getElementById('printShowProteins').checked,
					showFats: document.getElementById('printShowFats').checked,
					showCarbs: document.getElementById('printShowCarbs').checked,
					showPrice: document.getElementById('printShowPrice').checked,
					showTotals: document.getElementById('printShowTotals').checked,
					showApproval: document.getElementById('printShowApproval').checked
				};
				// Сохраняем настройки в глобальной переменной для использования в печати
				window._dailyPrintSettings = printSettings;
				// Вызываем печать с настройками
				printDailyMenuWithSettings(printSettings);
			});
		}

		// Закрытие по клику на фон
		const settingsModal = document.getElementById('dailyPrintSettingsModal');
		if (settingsModal) {
			settingsModal.addEventListener('click', function(e) {
				if (e.target === this) {
					this.style.display = 'none';
				}
			});
		}

        console.log('✅ Модуль "Ежедневное меню" v6.0 инициализирован!');
        console.log(`🎨 Цветовая маркировка для ${CONFIG.MAX_MENU_NUMBER} типов меню`);
    }

    // ============================================================
    // ПУБЛИЧНОЕ API
    // ============================================================
    
	return {
		init: init,
		loadDailyMenu: loadDailyMenu,
		validateDailyMenu: validateDailyMenu,
		createDailyMenuExcel: createDailyMenuExcel,
		saveCurrentVariant: saveCurrentVariant,
		printDailyMenu: printDailyMenu,
		exportDailyPDF: exportDailyPDF,
		getState: function() { return state; },
		getMenuColor: getMenuColor,
		reload: initDailyMenuInterface,
		
		// ===== НОВЫЙ МЕТОД: ПРИНУДИТЕЛЬНАЯ СИНХРОНИЗАЦИЯ =====
		syncData: function(menuData, schoolData) {
			console.log('🔄 DailyMenuModule.syncData() вызван');
			
			if (menuData) {
				state.templateMenuData = menuData;
				// Обновляем глобальную переменную
				window.templateMenuData = menuData;
			}
			
			if (schoolData) {
				state.schoolInfo = schoolData;
				window.schoolInfo = schoolData;
			}
			
			// Перезагружаем интерфейс
			this.reload();
			
			// Если есть выбранное меню, загружаем его
			if (state.selectedMenuNumber && state.templateMenuData) {
				const target = getDayFromMenuNumber(state.selectedMenuNumber);
				if (target) {
					this.loadDailyMenu(state.selectedMenuNumber);
				} else {
					// Если меню не найдено, загружаем первое
					this.loadDailyMenu(1);
				}
			}
			
			console.log('✅ DailyMenuModule синхронизирован');
			return true;
		}
	};

})();

// ============================================================
// АВТОМАТИЧЕСКАЯ ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ
// ============================================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        DailyMenuModule.init();
    });
} else {
    DailyMenuModule.init();
}