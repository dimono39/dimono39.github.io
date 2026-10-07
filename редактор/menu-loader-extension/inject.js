(async function() {
    'use strict';

    console.log('🍽️ Инициализация загрузчика типового меню (v3)...');

    // 1. Загрузка SheetJS
    function loadSheetJS() {
        return new Promise((resolve, reject) => {
            if (window.XLSX) return resolve(window.XLSX);
            const script = document.createElement('script');
            script.src = 'https://cdn.sheetjs.com/xlsx-0.20.0/package/dist/xlsx.full.min.js';
            script.onload = () => resolve(window.XLSX);
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // === Утилиты ===

    function setInputValue(el, value) {
        if (!el || value === undefined || value === null || value === '') return false;
        let strValue = String(value).trim();
        if (el.type === 'number') strValue = strValue.replace(',', '.');
        el.value = strValue;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.dispatchEvent(new Event('blur', { bubbles: true }));
        return true;
    }

    function waitFor(predicate, timeout = 2000, interval = 50) {
        return new Promise((resolve) => {
            const start = Date.now();
            const tick = () => {
                const result = predicate();
                if (result) return resolve(result);
                if (Date.now() - start > timeout) return resolve(null);
                setTimeout(tick, interval);
            };
            tick();
        });
    }

    function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

    // === Универсальный сеттер для селектов (ej-select + native) ===

	async function setSelectValue(selectWrapper, targetText) {
		if (!selectWrapper || !targetText) return false;

		const normalize = (s) => String(s || '')
			.replace(/\u00A0/g, ' ')
			.replace(/[\r\n\t]+/g, ' ')
			.replace(/\s+/g, ' ')
			.trim()
			.toLowerCase();

		const target = normalize(targetText);

		// ===== 1. Нативный <select> =====
		if (selectWrapper.tagName === 'SELECT') {
			const options = Array.from(selectWrapper.options || []);
			const opt = options.find(o => normalize(o.textContent) === target)
					 || options.find(o => normalize(o.textContent).includes(target));
			if (opt) {
				selectWrapper.value = opt.value;
				selectWrapper.dispatchEvent(new Event('change', { bubbles: true }));
				return true;
			}
			return false;
		}

		// ===== 2. ej-select =====

		// --- ШАГ 1: Принудительно закрываем все открытые поповеры ---
		await forceCloseAllSelectPopups();

		// --- ШАГ 2: Проверяем, не выбрано ли уже нужное ---
		const selectedText = getSelectedText(selectWrapper);
		if (selectedText === target) {
			console.log(`   ℹ️ Уже выбрано: "${targetText}"`);
			return true;
		}

		// --- ШАГ 3: Открываем наш селект ---
		const clickable = selectWrapper.querySelector('.ej-select__header')
					   || selectWrapper.querySelector('.ej-select__value')
					   || selectWrapper.querySelector('[role="combobox"]')
					   || selectWrapper;
		clickable.click();
		await sleep(280);

		// --- ШАГ 4: Ищем опцию (строго в поповере, который относится к нашему селекту) ---
		const findOption = () => {
			// Ищем ТОЛЬКО внутри открытого поповера, а не по всему документу
			const popups = Array.from(document.querySelectorAll(
				'.ej-select-popup, .ej-select-list, .dropdown__list, .popup__list, [role="listbox"]'
			));
			// Берём последний (только что открытый) поповер
			for (let i = popups.length - 1; i >= 0; i--) {
				const popup = popups[i];
				if (popup.offsetParent === null) continue; // пропускаем невидимые
				const items = popup.querySelectorAll(
					'.ej-select__option, .ej-select-list__item, [role="option"], li[role="option"], .popup__item'
				);
				const found = Array.from(items).find(el => normalize(el.textContent) === target)
						   || Array.from(items).find(el => normalize(el.textContent).includes(target));
				if (found) return found;
			}
			return null;
		};

		const opt = await waitFor(findOption, 1500, 80);

		if (opt) {
			// --- ШАГ 5: Обновляем НАТИВНЫЙ select внутри ej-select (самый надёжный способ) ---
			const nativeSelect = selectWrapper.querySelector('select');
			let updatedViaNative = false;

			if (nativeSelect) {
				const nativeOpt = Array.from(nativeSelect.options).find(o =>
					normalize(o.textContent) === target
				);
				if (nativeOpt) {
					nativeSelect.value = nativeOpt.value;
					nativeSelect.dispatchEvent(new Event('input', { bubbles: true }));
					nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
					updatedViaNative = true;
					console.log(`   ↳ нативный select обновлён: "${nativeOpt.textContent.trim()}"`);
				}
			}

			// --- ШАГ 6: Кликаем по опции в поповере ---
			opt.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
			opt.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
			opt.click();
			await sleep(200);

			// --- ШАГ 7: Принудительно закрываем поповер ---
			await forceCloseAllSelectPopups();

			// --- ШАГ 8: Проверяем результат ---
			const newSelectedText = getSelectedText(selectWrapper);
			if (newSelectedText === target || updatedViaNative) {
				return true;
			}
			console.warn(`   ⚠️ После клика выбрано "${newSelectedText}", ожидалось "${target}"`);
			return false;
		}

		// --- Если опция не найдена ---
		await forceCloseAllSelectPopups();
		console.warn(`   ⚠️ Опция "${targetText}" не найдена`);
		return false;
	}

	// Возвращает ТЕКУЩЕЕ выбранное значение из ej-select
	// (первое непустое значение до начала списка опций)
	function getSelectedText(selectWrapper) {
		const valueEl = selectWrapper.querySelector(
			'.ej-select__value, .ej-select__header .ej-select__value, .ej-select__selected'
		);
		if (valueEl) {
			return String(valueEl.textContent || '')
				.replace(/\u00A0/g, ' ')
				.replace(/[\r\n\t]+/g, ' ')
				.replace(/\s+/g, ' ')
				.trim()
				.toLowerCase();
		}
		return '';
	}

	// Жёстко закрывает все открытые поповеры селектов
	async function forceCloseAllSelectPopups() {
		// 1. Клик по body вне поповеров
		document.body.click();

		// 2. Escape
		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true }));

		// 3. Явно скрываем все известные поповеры
		const popupSelectors = [
			'.ej-select-popup',
			'.ej-select-list',
			'.dropdown__list',
			'.popup__list',
			'[role="listbox"]'
		];
		document.querySelectorAll(popupSelectors.join(',')).forEach(el => {
			// не удаляем, а помечаем скрытыми — Vue сам решит, что делать
			el.style.display = 'none';
			el.style.visibility = 'hidden';
			el.style.pointerEvents = 'none';
		});

		await sleep(120);

		// 4. Ещё раз клик по body, чтобы Vue точно зафиксировал закрытие
		document.body.click();
		await sleep(60);
	}

    // === Гибридный поиск поля внутри строки блюда ===
    // Индексы полей в строке (примерно):
    // 0 — Название блюда (input)
    // 1 — № рецептуры (input)
    // 2 — Вес (input number)
    // 3 — Ккал (input number)
    // 4 — Белки
    // 5 — Жиры
    // 6 — Углеводы
    // 7 — Цена
    // Селект «Раздел меню» — отдельно, через .ej-select

    function findField(row, hint) {
        const inputs = Array.from(row.querySelectorAll('input, textarea'))
            .filter(el => el.type !== 'checkbox' && el.type !== 'radio');

        // 1. По placeholder
        for (const el of inputs) {
            const ph = (el.placeholder || '').toLowerCase();
            if (hint.placeholders.some(h => ph.includes(h.toLowerCase()))) return el;
        }
        // 2. По name/id
        for (const el of inputs) {
            const name = (el.name || '').toLowerCase();
            const id = (el.id || '').toLowerCase();
            if (hint.names.some(n => name.includes(n) || id.includes(n))) return el;
        }
        // 3. По индексу
        if (typeof hint.index === 'number' && inputs[hint.index]) return inputs[hint.index];
        return null;
    }

    // === Модальное окно ===
    function showFilterModal() {
        return new Promise((resolve) => {
            const old = document.getElementById('__ym_filter_modal');
            if (old) old.remove();

            const modal = document.createElement('div');
            modal.id = '__ym_filter_modal';
            modal.innerHTML = `
                <div style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:10000;display:flex;align-items:center;justify-content:center;">
                    <div style="background:#fff;border-radius:12px;padding:24px;min-width:360px;box-shadow:0 10px 40px rgba(0,0,0,0.2);font-family:Lato,sans-serif;">
                        <h3 style="margin:0 0 16px 0;font-size:20px;font-weight:600;">Параметры загрузки</h3>

                        <label style="display:block;margin-bottom:12px;">
                            <span style="display:block;margin-bottom:4px;font-size:14px;color:#636770;">Неделя</span>
                            <select id="__ym_week" style="width:100%;padding:8px 12px;border:1px solid #e4eaf5;border-radius:6px;font-size:15px;">
                                <option value="1">1</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                                <option value="4">4</option>
                            </select>
                        </label>

                        <label style="display:block;margin-bottom:12px;">
                            <span style="display:block;margin-bottom:4px;font-size:14px;color:#636770;">День недели</span>
                            <select id="__ym_day" style="width:100%;padding:8px 12px;border:1px solid #e4eaf5;border-radius:6px;font-size:15px;">
                                <option value="1">Понедельник</option>
                                <option value="2">Вторник</option>
                                <option value="3">Среда</option>
                                <option value="4">Четверг</option>
                                <option value="5">Пятница</option>
                                <option value="6">Суббота</option>
                                <option value="7">Воскресенье</option>
                            </select>
                        </label>

                        <label style="display:block;margin-bottom:16px;">
                            <span style="display:block;margin-bottom:4px;font-size:14px;color:#636770;">Приём пищи</span>
                            <select id="__ym_meal" style="width:100%;padding:8px 12px;border:1px solid #e4eaf5;border-radius:6px;font-size:15px;">
                                <option value="Завтрак">Завтрак</option>
                                <option value="Завтрак 2">Завтрак 2</option>
                                <option value="Обед">Обед</option>
                                <option value="Полдник">Полдник</option>
                                <option value="Ужин">Ужин</option>
                                <option value="Прочее">Прочее</option>
                            </select>
                        </label>

                        <div style="display:flex;gap:8px;justify-content:flex-end;">
                            <button id="__ym_cancel" style="padding:8px 20px;border:1px solid #e4eaf5;background:#fff;border-radius:6px;cursor:pointer;font-size:14px;">Отмена</button>
                            <button id="__ym_ok" style="padding:8px 20px;border:none;background:#0d4cd3;color:#fff;border-radius:6px;cursor:pointer;font-size:14px;font-weight:500;">Загрузить</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            document.getElementById('__ym_ok').onclick = () => {
                const result = {
                    week: parseInt(document.getElementById('__ym_week').value, 10),
                    day: parseInt(document.getElementById('__ym_day').value, 10),
                    dayName: document.getElementById('__ym_day').selectedOptions[0].textContent,
                    meal: document.getElementById('__ym_meal').value
                };
                modal.remove();
                resolve(result);
            };
            document.getElementById('__ym_cancel').onclick = () => {
                modal.remove();
                resolve(null);
            };
        });
    }

    // === Запуск ===
    try {
        const XLSX = await loadSheetJS();
        console.log('✅ SheetJS загружена');

        // Кнопка
        const uploadButton = document.createElement('button');
        uploadButton.textContent = '📥 Загрузить из Excel';
        uploadButton.className = 'button button--blue button--big';
        uploadButton.style.cssText = 'margin-left:12px;margin-top:8px;font-size:14px;padding:8px 16px;cursor:pointer;';

        const addManualButton = Array.from(document.querySelectorAll('button')).find(btn =>
            btn.textContent.includes('Добавить вручную')
        );
        if (addManualButton && addManualButton.parentNode) {
            addManualButton.parentNode.insertBefore(uploadButton, addManualButton.nextSibling);
        } else {
            document.body.appendChild(uploadButton);
        }

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.xlsx, .xls';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);

        uploadButton.addEventListener('click', () => fileInput.click());

        // Обработка файла
        fileInput.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (!file) return;
            event.target.value = '';

            const params = await showFilterModal();
            if (!params) return;

            console.log(`Фильтр: неделя=${params.week}, день=${params.day} (${params.dayName}), приём=${params.meal}`);

            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                    const json = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

                    // Ищем заголовки
                    let headerRowIndex = -1;
                    for (let i = 0; i < json.length; i++) {
                        if (json[i].some(c => c && c.toString().includes('Блюда'))) {
                            headerRowIndex = i;
                            break;
                        }
                    }
                    if (headerRowIndex === -1) { alert('Не найдена строка с заголовками.'); return; }

                    const headers = json[headerRowIndex];
                    const findCol = (names) => {
                        for (const n of names) {
                            const idx = headers.findIndex(h => h && h.toString().toLowerCase().includes(n.toLowerCase()));
                            if (idx !== -1) return idx;
                        }
                        return -1;
                    };

                    const col = {
                        week: findCol(['Неделя']),
                        day: findCol(['День недели']),
                        meal: findCol(['Прием пищи', 'Приём пищи']),
                        name: findCol(['Блюда', 'Блюдо']),
                        section: findCol(['Раздел меню', 'Раздел']),
                        weight: findCol(['Вес блюда', 'Вес']),
                        calories: findCol(['Калорийность', 'Ккал']),
                        proteins: findCol(['Белки']),
                        fats: findCol(['Жиры']),
                        carbs: findCol(['Углеводы']),
                        recipe: findCol(['№ рецептуры', 'Рецептур']),
                        price: findCol(['Цена'])
                    };

                    console.log('Индексы колонок:', col);

                    // === 1. ЗАПОЛНЯЕМ НАЗВАНИЕ ТИПОВОГО МЕНЮ ===
                    const titleValue = `${params.meal} ${params.week} неделя ${params.day} день`;
                    console.log(`Устанавливаю название: "${titleValue}"`);

                    const titleInput = Array.from(document.querySelectorAll('input')).find(el => {
                        const ph = (el.placeholder || '').toLowerCase();
                        return (ph.includes('название') && !ph.includes('блюд'))
                            || ph.includes('завтрак')
                            || ph.includes('например');
                    });

                    if (titleInput) {
                        setInputValue(titleInput, titleValue);
                        console.log('✅ Название установлено');
                    } else {
                        console.warn('⚠️ Поле "Название" не найдено');
                    }

                    // === 2. УСТАНАВЛИВАЕМ ПРИЁМ ПИЩИ В ВЕРХНЕМ СЕЛЕКТЕ ===
                    // Ищем ej-select в верхней части страницы (не в строках блюд)
                    const allSelects = Array.from(document.querySelectorAll('.ej-select, select'));
                    let mealSelect = null;
                    for (const el of allSelects) {
                        const txt = (el.textContent || '').toLowerCase();
                        // Верхний селект содержит один из вариантов приёма пищи
                        if ((txt.includes('завтрак') || txt.includes('обед')) 
                            && !el.closest('tbody') // не внутри таблицы блюд
                            && !el.closest('tr')) {
                            mealSelect = el;
                            break;
                        }
                    }
                    if (mealSelect) {
                        console.log(`Устанавливаю приём пищи: "${params.meal}"`);
                        const ok = await setSelectValue(mealSelect, params.meal);
                        console.log(ok ? '✅ Приём пищи установлен' : '⚠️ Не удалось установить приём пищи');
                    } else {
                        console.warn('⚠️ Селект "Приём пищи" не найден');
                    }

                    await sleep(300);

                    // === 3. ДОБАВЛЯЕМ БЛЮДА ===
                    const addBtn = Array.from(document.querySelectorAll('button')).find(b =>
                        b.textContent.includes('Добавить вручную')
                    );
                    if (!addBtn) { alert('Не найдена кнопка "Добавить вручную".'); return; }
                    const panel = addBtn.closest('.ej-panel') || addBtn.closest('.panel') || addBtn.parentElement.parentElement;
                    if (!panel) { alert('Не найдена панель с блюдами.'); return; }

                    // Поиск строк блюд: ищем input'ы с placeholder «Название блюда»
                    const findRows = () => {
                        const nameInputs = panel.querySelectorAll(
                            'input[placeholder*="Название блюда"], input[placeholder*="Введите название"], input[placeholder*="блюдо"]'
                        );
                        const rows = [];
                        nameInputs.forEach(inp => {
                            let r = inp.parentElement;
                            while (r && r !== panel) {
                                if (r.querySelectorAll('input').length >= 3) {
                                    if (!rows.includes(r)) rows.push(r);
                                    break;
                                }
                                r = r.parentElement;
                            }
                        });
                        return rows;
                    };

                    // Сопоставление разделов
                    const sectionMap = {
                        'гор.блюдо': 'Горячее блюдо',
                        'горячее блюдо': 'Горячее блюдо',
                        'гор.напиток': 'Горячий напиток',
                        'горячий напиток': 'Горячий напиток',
                        '1 блюдо': '1 блюдо',
                        '2 блюдо': '2 блюдо',
                        'гарнир': 'Гарнир',
                        'напиток': 'Горячий напиток',
                        'фрукты': 'Фрукты'
                    };

                    const hints = {
                        name:     { placeholders: ['название блюда', 'введите название'], names: ['name', 'title'],  index: 0 },
                        recipe:   { placeholders: ['№', 'номер'],                         names: ['recipe', 'number'], index: 1 },
                        weight:   { placeholders: ['вес'],                                names: ['weight', 'ves'],    index: 2 },
                        calories: { placeholders: ['ккал', 'калорийность'],               names: ['calorie', 'kkal'],  index: 3 },
                        proteins: { placeholders: ['белки'],                              names: ['protein', 'belk'],  index: 4 },
                        fats:     { placeholders: ['жиры'],                               names: ['fat', 'zhir'],      index: 5 },
                        carbs:    { placeholders: ['углеводы'],                           names: ['carb', 'uglevod'],  index: 6 },
                        price:    { placeholders: ['цена', '₽'],                          names: ['price', 'cena'],    index: 7 }
                    };

                    let added = 0, skipped = 0, filtered = 0;
                    const dayMap = { 'понедельник': 1, 'вторник': 2, 'среда': 3, 'четверг': 4, 'пятница': 5, 'суббота': 6, 'воскресенье': 7 };

                    // КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: правильно обрабатываем структуру «блоков»
                    // Значения week/day/meal заполнены только в первой строке блока — 
                    // сохраняем текущие значения и не сбрасываем их.
                    let curWeek = null, curDay = null, curMeal = null;

                    for (let i = headerRowIndex + 1; i < json.length; i++) {
                        const row = json[i];

                        // --- Обновляем текущие значения из строки (если они там есть) ---
                        if (col.week !== -1) {
                            const w = parseInt(row[col.week], 10);
                            if (!isNaN(w) && w > 0) curWeek = w;
                        }
                        if (col.day !== -1) {
                            const rawDay = row[col.day];
                            if (rawDay !== '' && rawDay !== null && rawDay !== undefined) {
                                const dNum = parseInt(rawDay, 10);
                                if (!isNaN(dNum) && dNum > 0) {
                                    curDay = dNum;
                                } else {
                                    const dStr = String(rawDay).trim().toLowerCase();
                                    if (dayMap[dStr]) curDay = dayMap[dStr];
                                }
                            }
                        }
                        if (col.meal !== -1) {
                            const m = (row[col.meal] || '').toString().trim();
                            if (m) curMeal = m;
                        }

                        // --- Фильтрация ---
                        if (curWeek !== null && curWeek !== params.week) { filtered++; continue; }
                        if (curDay !== null && curDay !== params.day) { filtered++; continue; }
                        if (curMeal !== null) {
                            // Сравниваем мягко: «Завтрак» === «Завтрак», «Завтрак 2» === «Завтрак 2»
                            if (curMeal.toLowerCase() !== params.meal.toLowerCase()) { filtered++; continue; }
                        }

                        // --- Пропускаем служебные строки ---
                        const dishNameRaw = col.name !== -1 ? row[col.name] : '';
                        const dishName = String(dishNameRaw || '').trim();
                        if (!dishName
                            || dishName.toLowerCase().includes('итого')
                            || dishName.toLowerCase().includes('среднее')) {
                            skipped++;
                            continue;
                        }

                        console.log(`➕ [w${curWeek} d${curDay} ${curMeal}] ${dishName}`);

                        // --- Добавляем блюдо ---
                        addBtn.click();
                        await sleep(250);

                        const rows = findRows();
                        const lastRow = rows[rows.length - 1];
                        if (!lastRow) { console.warn('Строка не найдена'); continue; }

                        // Название
                        const nameEl = findField(lastRow, hints.name);
                        if (nameEl) setInputValue(nameEl, dishName);

						// Раздел меню (через клик по Vue-селекту)
						if (col.section !== -1) {
							const fileSection = row[col.section] ? String(row[col.section]).trim().toLowerCase() : '';
							const target = sectionMap[fileSection];
							console.log(`   🔍 раздел из файла: "${fileSection}" → target: "${target}"`);
							
							if (target) {
								// Ищем селект ВНУТРИ ЭТОЙ КОНКРЕТНОЙ СТРОКИ
								const sectionEl = lastRow.querySelector('.ej-select')
											  || lastRow.querySelector('select')
											  || lastRow.querySelector('[role="combobox"]');
								
								console.log(`   🔍 sectionEl найден:`, !!sectionEl, sectionEl?.className);
								
								if (sectionEl) {
									const before = sectionEl.textContent.trim().replace(/\s+/g, ' ');
									const ok = await setSelectValue(sectionEl, target);
									const after = sectionEl.textContent.trim().replace(/\s+/g, ' ');
									console.log(`   ↳ до: "${before}" → после: "${after}" | ok: ${ok}`);
								}
							}
						}

                        // Остальные поля
                        const setField = (hint, value, colIdx) => {
                            if (colIdx === -1 || value === undefined || value === null || value === '') return;
                            const el = findField(lastRow, hint);
                            if (el) setInputValue(el, value);
                        };
                        setField(hints.recipe,   row[col.recipe],   col.recipe);
                        setField(hints.weight,   row[col.weight],   col.weight);
                        setField(hints.calories, row[col.calories], col.calories);
                        setField(hints.proteins, row[col.proteins], col.proteins);
                        setField(hints.fats,     row[col.fats],     col.fats);
                        setField(hints.carbs,    row[col.carbs],    col.carbs);
                        setField(hints.price,    row[col.price],    col.price);

                        added++;
                        await sleep(100);
                    }

                    alert(
                        `Готово!\n` +
                        `Название: ${titleValue}\n` +
                        `Добавлено блюд: ${added}\n` +
                        `Пропущено строк: ${skipped}\n` +
                        `Отфильтровано: ${filtered}`
                    );
                } catch (err) {
                    console.error('Ошибка:', err);
                    alert('Ошибка: ' + err.message);
                }
            };
            reader.readAsArrayBuffer(file);
        });

        console.log('✅ Кнопка "Загрузить из Excel" добавлена');
    } catch (err) {
        console.error(err);
        alert('Не удалось загрузить SheetJS.');
    }
})();