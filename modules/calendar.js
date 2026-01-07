// modules/calendar.js
// ============================
// КАЛЕНДАРЬ ДИАГНОСТИК - МОДУЛЬ
// ============================

// Структура хранения данных календаря
let calendarData = {
    diagnostics: [],
    currentView: 'month',
    currentDate: new Date(),
    schoolSchedule: {
        quarters: [
            { number: 1, start: '2024-09-01', end: '2024-10-25', name: 'I четверть' },
            { number: 2, start: '2024-11-05', end: '2024-12-27', name: 'II четверть' },
            { number: 3, start: '2025-01-09', end: '2025-03-22', name: 'III четверть' },
            { number: 4, start: '2025-03-31', end: '2025-05-30', name: 'IV четверть' }
        ],
        holidays: [
            { start: '2024-10-28', end: '2024-11-04', name: 'Осенние каникулы' },
            { start: '2024-12-28', end: '2025-01-08', name: 'Зимние каникулы' },
            { start: '2025-03-24', end: '2025-03-30', name: 'Весенние каникулы' },
            { start: '2025-06-01', end: '2025-08-31', name: 'Летние каникулы' }
        ]
    }
};

// Инициализация календаря
function initCalendar() {
    console.log('Инициализация календаря...');
    try {
        loadCalendarData();
        generateMonthCalendar();
        updateStats();
        loadUpcomingEvents();
        
        // Инициализируем график только если элемент существует
        const chartElement = document.getElementById('workloadChart');
        if (chartElement) {
            generateWorkloadChart();
        }
        
        // Устанавливаем активную кнопку вида
        setActiveViewButton('month');
        
        console.log('Календарь инициализирован успешно');
    } catch (error) {
        console.error('Ошибка инициализации календаря:', error);
    }
}

// Установка активной кнопки вида
function setActiveViewButton(view) {
    const buttons = {
        month: document.getElementById('viewMonth'),
        week: document.getElementById('viewWeek'),
        quarter: document.getElementById('viewQuarter'),
        year: document.getElementById('viewYear'),
        timeline: document.getElementById('viewTimeline')
    };
    
    // Сбрасываем все кнопки
    Object.values(buttons).forEach(btn => {
        if (btn) {
            btn.className = btn.className.replace('btn-primary', 'btn-outline');
            btn.className = btn.className.replace('btn-secondary', 'btn-outline');
            btn.classList.add('btn-outline');
        }
    });
    
    // Устанавливаем активную
    if (buttons[view]) {
        buttons[view].className = buttons[view].className.replace('btn-outline', 'btn-primary');
        buttons[view].classList.add('btn-primary');
    }
}

// Загрузка данных календаря
function loadCalendarData() {
    try {
        const saved = localStorage.getItem('calendarData');
        if (saved) {
            const parsed = JSON.parse(saved);
            
            // Восстанавливаем даты
            if (parsed.currentDate) {
                parsed.currentDate = new Date(parsed.currentDate);
            }
            
            // Восстанавливаем даты в диагностиках
            if (parsed.diagnostics && parsed.diagnostics.length > 0) {
                parsed.diagnostics.forEach(d => {
                    if (d.createdAt) d.createdAt = new Date(d.createdAt);
                });
            }
            
            calendarData = parsed;
            console.log('Данные календаря загружены:', calendarData.diagnostics.length, 'событий');
        } else {
            console.log('Созданы новые данные календаря');
            // Добавляем тестовые данные для демонстрации
            addSampleData();
        }
    } catch (e) {
        console.error('Ошибка загрузки календаря:', e);
        addSampleData();
    }
}

// Добавление тестовых данных
function addSampleData() {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    calendarData.diagnostics = [
        {
            id: 'sample1',
            title: 'Контрольная по математике',
            date: today.toISOString().split('T')[0],
            time: '09:00',
            type: 'current',
            subject: 'math',
            class: '7А',
            duration: 45,
            description: 'Тема: Дроби и проценты',
            status: 'planned',
            reminder: true,
            createdAt: new Date()
        },
        {
            id: 'sample2',
            title: 'ВПР по русскому языку',
            date: nextWeek.toISOString().split('T')[0],
            time: '10:30',
            type: 'vpr',
            subject: 'russian',
            class: '5Б',
            duration: 60,
            description: 'Всероссийская проверочная работа',
            status: 'planned',
            reminder: true,
            createdAt: new Date()
        }
    ];
    
    saveCalendarData();
}

// Сохранение данных календаря
function saveCalendarData() {
    try {
        localStorage.setItem('calendarData', JSON.stringify(calendarData));
        console.log('Данные календаря сохранены');
    } catch (e) {
        console.error('Ошибка сохранения календаря:', e);
    }
}

// Генерация месячного календаря
function generateMonthCalendar() {
    const container = document.getElementById('calendarDays');
    if (!container) {
        console.error('Контейнер calendarDays не найден');
        return;
    }
    
    const current = new Date(calendarData.currentDate);
    const year = current.getFullYear();
    const month = current.getMonth();
    
    // Обновляем заголовок
    const periodElement = document.getElementById('currentPeriod');
    if (periodElement) {
        periodElement.textContent = current.toLocaleDateString('ru-RU', { 
            month: 'long', 
            year: 'numeric' 
        }).replace(/^\w/, c => c.toUpperCase());
    }
    
    // Получаем первый день месяца и количество дней
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const firstDayIndex = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    
    // Очищаем контейнер
    container.innerHTML = '';
    
    // Добавляем пустые ячейки для дней предыдущего месяца
    const prevMonthLastDate = new Date(year, month, 0).getDate();
    for (let i = 0; i < firstDayIndex; i++) {
        const dayNumber = prevMonthLastDate - firstDayIndex + i + 1;
        const date = new Date(year, month - 1, dayNumber);
        container.appendChild(createDayElement(date, true));
    }
    
    // Добавляем дни текущего месяца
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dayElement = createDayElement(date, false);
        
        // Подсвечиваем сегодня
        if (date.getDate() === today.getDate() && 
            date.getMonth() === today.getMonth() && 
            date.getFullYear() === today.getFullYear()) {
            dayElement.classList.add('today');
        }
        
        container.appendChild(dayElement);
    }
    
    // Добавляем пустые ячейки для следующих дней
    const totalCells = 42; // 6 недель
    const filledCells = firstDayIndex + daysInMonth;
    for (let i = 1; i <= (totalCells - filledCells); i++) {
        const date = new Date(year, month + 1, i);
        container.appendChild(createDayElement(date, true));
    }
}

// Создание элемента дня
function createDayElement(date, isOtherMonth) {
    const dayDiv = document.createElement('div');
    dayDiv.className = 'calendar-day';
    if (isOtherMonth) {
        dayDiv.classList.add('other-month');
    }
    
    // Проверяем сегодняшний день
    const today = new Date();
    if (date.getDate() === today.getDate() && 
        date.getMonth() === today.getMonth() && 
        date.getFullYear() === today.getFullYear()) {
        dayDiv.classList.add('today');
    }
    
    // Номер дня
    const dayNumber = document.createElement('div');
    dayNumber.className = 'calendar-day-number';
    dayNumber.textContent = date.getDate();
    dayDiv.appendChild(dayNumber);
    
    // События в этот день
    const events = getEventsForDate(date);
    
    if (events.length > 0) {
        // Создаем контейнер для событий
        const eventsContainer = document.createElement('div');
        eventsContainer.className = 'day-events-container';
        
        // Показываем до 2 событий (для лучшего отображения)
        const eventsToShow = events.slice(0, 2);
        
        eventsToShow.forEach(event => {
            const eventDiv = document.createElement('div');
            eventDiv.className = `calendar-event event-type-${event.type}`;
            eventDiv.title = `${event.title} (${event.class}) - ${getTypeText(event.type)}`;
            
            // Сокращаем текст если слишком длинный
            let displayText = event.title;
            if (displayText.length > 15) {
                displayText = displayText.substring(0, 12) + '...';
            }
            
            eventDiv.textContent = displayText;
            eventDiv.onclick = (e) => {
                e.stopPropagation();
                showEventDetails(event.id);
            };
            
            eventsContainer.appendChild(eventDiv);
        });
        
        // Если есть еще события, показываем индикатор
        if (events.length > 2) {
            const moreDiv = document.createElement('div');
            moreDiv.className = 'calendar-event-more';
            moreDiv.textContent = `+${events.length - 2} еще`;
            moreDiv.onclick = (e) => {
                e.stopPropagation();
                showDayEvents(date, events);
            };
            eventsContainer.appendChild(moreDiv);
        }
        
        dayDiv.appendChild(eventsContainer);
    } else {
        // Показываем кнопку добавления если нет событий
        const addEventDiv = document.createElement('div');
        addEventDiv.className = 'add-event-btn';
        addEventDiv.innerHTML = '<i class="fas fa-plus"></i>';
        addEventDiv.title = 'Добавить событие';
        addEventDiv.onclick = (e) => {
            e.stopPropagation();
            addEventForDate(date);
        };
        dayDiv.appendChild(addEventDiv);
    }
    
    // Клик по дню для добавления события
    dayDiv.onclick = () => {
        addEventForDate(date);
    };
    
    return dayDiv;
}

// Получение событий для даты
function getEventsForDate(date) {
    const dateStr = date.toISOString().split('T')[0];
    return calendarData.diagnostics.filter(event => {
        return event.date === dateStr;
    });
}

// Показать все события дня
function showDayEvents(date, events) {
    const dateStr = formatDate(date);
    let html = `<h4>События на ${dateStr}</h4>`;
    
    events.forEach(event => {
        html += `
            <div class="day-event-detail" onclick="showEventDetails('${event.id}')">
                <strong>${event.title}</strong>
                <div>${event.class} • ${getTypeText(event.type)}</div>
                ${event.time ? `<div>⏰ ${event.time}</div>` : ''}
            </div>
        `;
    });
    
    showModal(`События на ${dateStr}`, html, 'Закрыть');
}

// Добавление события на конкретную дату
function addEventForDate(date) {
    const dateStr = date.toISOString().split('T')[0];
    console.log('Добавление события на дату:', dateStr);
    
    // Показываем модальное окно с предзаполненной датой
    showModal('Добавить диагностическую работу', `
        <div class="form-group">
            <label class="required">Название работы</label>
            <input type="text" id="diagnosticTitle" class="form-input" placeholder="Контрольная работа">
        </div>
        <div class="form-row">
            <div class="form-group">
                <label class="required">Дата проведения</label>
                <input type="date" id="diagnosticDate" class="form-input" value="${dateStr}" readonly>
            </div>
            <div class="form-group">
                <label>Время</label>
                <input type="time" id="diagnosticTime" class="form-input" value="09:00">
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label class="required">Тип работы</label>
                <select id="diagnosticType" class="form-select">
                    <option value="current">Текущая контрольная</option>
                    <option value="milestone">Рубежная</option>
                    <option value="final">Итоговая</option>
                    <option value="oge">ОГЭ</option>
                    <option value="ege">ЕГЭ</option>
                    <option value="vpr">ВПР</option>
                    <option value="literacy">Функциональная грамотность</option>
                    <option value="diagnostic">Диагностическая</option>
                </select>
            </div>
            <div class="form-group">
                <label class="required">Предмет</label>
                <select id="diagnosticSubject" class="form-select">
                    <option value="math">Математика</option>
                    <option value="russian">Русский язык</option>
                    <option value="literature">Литература</option>
                    <option value="physics">Физика</option>
                    <option value="chemistry">Химия</option>
                    <option value="biology">Биология</option>
                    <option value="history">История</option>
                    <option value="english">Английский язык</option>
                    <option value="other">Другой</option>
                </select>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label class="required">Класс</label>
                <input type="text" id="diagnosticClass" class="form-input" placeholder="7А">
            </div>
            <div class="form-group">
                <label>Продолжительность (мин)</label>
                <input type="number" id="diagnosticDuration" class="form-input" value="45" min="1">
            </div>
        </div>
    `, saveNewDiagnostic, 'Отмена');
}

// Смена вида календаря
function changeCalendarView(view) {
    console.log('Смена вида на:', view);
    
    calendarData.currentView = view;
    
    // Скрываем все виды
    const views = ['month', 'week', 'quarter', 'year', 'timeline'];
    views.forEach(v => {
        const element = document.getElementById(`${v}Calendar`);
        if (element) {
            element.style.display = 'none';
        }
    });
    
    // Устанавливаем активную кнопку
    setActiveViewButton(view);
    
    // Показываем выбранный вид и генерируем контент
    const targetElement = document.getElementById(`${view}Calendar`);
    if (targetElement) {
        targetElement.style.display = 'block';
        
        switch(view) {
            case 'week':
                generateWeekView();
                break;
            case 'quarter':
                generateQuarterView();
                break;
            case 'year':
                generateYearView();
                break;
            case 'timeline':
                generateTimelineView();
                break;
        }
    }
}

// Добавление новой диагностики
function addNewDiagnostic(prefilledDate = null) {
    // Используем существующую функцию showModal из системы
    showModal('Добавить диагностическую работу', `
        <div class="form-group">
            <label class="required">Название работы</label>
            <input type="text" id="diagnosticTitle" class="form-input" placeholder="Контрольная работа по алгебре">
        </div>
        <div class="form-row">
            <div class="form-group">
                <label class="required">Дата проведения</label>
                <input type="date" id="diagnosticDate" class="form-input" value="${prefilledDate || new Date().toISOString().split('T')[0]}">
            </div>
            <div class="form-group">
                <label>Время</label>
                <input type="time" id="diagnosticTime" class="form-input" value="09:00">
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label class="required">Тип работы</label>
                <select id="diagnosticType" class="form-select">
                    <option value="current">Текущая контрольная</option>
                    <option value="milestone">Рубежная</option>
                    <option value="final">Итоговая</option>
                    <option value="oge">ОГЭ</option>
                    <option value="ege">ЕГЭ</option>
                    <option value="vpr">ВПР</option>
                    <option value="literacy">Функциональная грамотность</option>
                    <option value="diagnostic">Диагностическая</option>
                </select>
            </div>
            <div class="form-group">
                <label class="required">Предмет</label>
                <select id="diagnosticSubject" class="form-select">
                    <option value="math">Математика</option>
                    <option value="russian">Русский язык</option>
                    <option value="literature">Литература</option>
                    <option value="physics">Физика</option>
                    <option value="chemistry">Химия</option>
                    <option value="biology">Биология</option>
                    <option value="history">История</option>
                    <option value="english">Английский язык</option>
                    <option value="other">Другой</option>
                </select>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label class="required">Класс</label>
                <input type="text" id="diagnosticClass" class="form-input" placeholder="7А">
            </div>
            <div class="form-group">
                <label>Продолжительность (мин)</label>
                <input type="number" id="diagnosticDuration" class="form-input" value="45" min="1">
            </div>
        </div>
        <div class="form-group">
            <label>Описание</label>
            <textarea id="diagnosticDescription" class="form-textarea" rows="3" placeholder="Тема, цели работы, комментарии..."></textarea>
        </div>
        <div class="form-group">
            <label>Статус</label>
            <select id="diagnosticStatus" class="form-select">
                <option value="planned">Запланировано</option>
                <option value="completed">Проведено</option>
                <option value="analyzed">Проанализировано</option>
                <option value="pending">Ожидает анализа</option>
            </select>
        </div>
        <div class="form-group">
            <label>
                <input type="checkbox" id="diagnosticReminder" checked> 
                Напомнить за день до проведения
            </label>
        </div>
        <div class="form-group">
            <label>
                <input type="checkbox" id="diagnosticRepeat"> 
                Повторять ежегодно
            </label>
        </div>
    `, saveNewDiagnostic, 'Отмена');
}

// Функция сохранения новой диагностики
function saveNewDiagnostic() {
    try {
        const title = document.getElementById('diagnosticTitle')?.value.trim();
        const date = document.getElementById('diagnosticDate')?.value;
        const subject = document.getElementById('diagnosticSubject')?.value;
        const classValue = document.getElementById('diagnosticClass')?.value.trim();
        
        // Валидация
        const errors = [];
        if (!title) errors.push('Название работы');
        if (!date) errors.push('Дата проведения');
        if (!subject) errors.push('Предмет');
        if (!classValue) errors.push('Класс');
        
        if (errors.length > 0) {
            showNotification(`Заполните обязательные поля: ${errors.join(', ')}`, 'error');
            return false;
        }
        
        const diagnostic = {
            id: 'diag_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            title: title,
            date: date,
            time: document.getElementById('diagnosticTime')?.value || '09:00',
            type: document.getElementById('diagnosticType')?.value || 'current',
            subject: subject,
            class: classValue,
            duration: parseInt(document.getElementById('diagnosticDuration')?.value) || 45,
            description: document.getElementById('diagnosticDescription')?.value || '',
            status: document.getElementById('diagnosticStatus')?.value || 'planned',
            reminder: document.getElementById('diagnosticReminder')?.checked || false,
            repeatYearly: document.getElementById('diagnosticRepeat')?.checked || false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        console.log('Добавляем диагностику:', diagnostic);
        
        // Добавляем в массив
        calendarData.diagnostics.push(diagnostic);
        saveCalendarData();
        
        
        // Добавляем в массив
        calendarData.diagnostics.push(diagnostic);
        saveCalendarData();
        
        // Обновляем интерфейс с принудительным обновлением
        refreshCalendarDisplay(true);
        
        // Уведомление
        showNotification(`Диагностика "${diagnostic.title}" добавлена`, 'success');
		
        // Закрываем модальное окно
        hideModal();
		
        updateEntireCalendar();
		
        return true;
        
    } catch (error) {
        console.error('Ошибка сохранения диагностики:', error);
        showNotification('Ошибка при сохранении диагностики', 'error');
        return false;
    }
}

// Функция полного обновления отображения календаря
function refreshCalendarDisplay(forceRefresh = false) {
    console.log('Обновление отображения календаря...', calendarData.currentView);
    
    // Сохраняем текущий вид
    const currentView = calendarData.currentView;
    
    // Если forceRefresh - временно переключаем вид и обратно
    if (forceRefresh) {
        calendarData.currentView = 'force_refresh';
        setTimeout(() => {
            calendarData.currentView = currentView;
            updateView();
        }, 10);
    } else {
        updateView();
    }
    
    function updateView() {
        // Обновляем текущий вид
        switch(calendarData.currentView) {
            case 'month':
                generateMonthCalendar();
                break;
            case 'week':
                generateWeekView();
                break;
            case 'quarter':
                generateQuarterView();
                break;
            case 'year':
                generateYearView();
                break;
            case 'timeline':
                generateTimelineView();
                break;
            default:
                generateMonthCalendar();
        }
        
        // Обновляем предстоящие события
        loadUpcomingEvents();
        
        // Обновляем статистику
        updateStats();
        
        // Обновляем график загруженности
        setTimeout(updateWorkloadChart, 50);
    }
}

// Функция обновления графика загруженности
function updateWorkloadChart() {
    if (window.workloadChartInstance) {
        window.workloadChartInstance.destroy();
        window.workloadChartInstance = null;
    }
    
    // Небольшая задержка для гарантированного рендеринга DOM
    setTimeout(() => {
        generateWorkloadChart();
    }, 100);
}

// Функция обновления UI календаря
function updateCalendarUI() {
    switch(calendarData.currentView) {
        case 'month':
            generateMonthCalendar();
            break;
        case 'week':
            generateWeekView();
            break;
        case 'quarter':
            generateQuarterView();
            break;
        case 'year':
            generateYearView();
            break;
        case 'timeline':
            generateTimelineView();
            break;
    }
    
    loadUpcomingEvents();
    updateStats();
    
    // Обновляем график
    if (window.workloadChartInstance) {
        window.workloadChartInstance.destroy();
    }
    generateWorkloadChart();
}

// Функция отладки - проверка данных
function debugCalendarData() {
    console.log('=== DEBUG CALENDAR DATA ===');
    console.log('Всего событий:', calendarData.diagnostics.length);
    console.log('Текущий вид:', calendarData.currentView);
    console.log('Текущая дата:', calendarData.currentDate);
    console.log('События:', calendarData.diagnostics);
    
    // Проверяем отображение на текущий месяц
    const current = new Date(calendarData.currentDate);
    const year = current.getFullYear();
    const month = current.getMonth();
    
    console.log(`\nСобытия за ${month + 1}.${year}:`);
    calendarData.diagnostics.forEach(event => {
        const eventDate = new Date(event.date);
        if (eventDate.getFullYear() === year && eventDate.getMonth() === month) {
            console.log(`- ${event.date}: ${event.title} (${event.class})`);
        }
    });
    
    // Показываем уведомление
    showNotification(`В календаре ${calendarData.diagnostics.length} событий`, 'info');
}

// Показ деталей события
function showEventDetails(eventId) {
    const event = calendarData.diagnostics.find(d => d.id === eventId);
    if (!event) {
        showNotification('Событие не найдено', 'error');
        return;
    }
    
    const statusText = {
        planned: 'Запланировано',
        completed: 'Проведено',
        analyzed: 'Проанализировано',
        pending: 'Ожидает анализа'
    };
    
    const typeText = {
        current: 'Текущая контрольная',
        milestone: 'Рубежная работа',
        final: 'Итоговая работа',
        oge: 'ОГЭ',
        ege: 'ЕГЭ',
        vpr: 'ВПР',
        literacy: 'Функциональная грамотность',
        diagnostic: 'Диагностическая работа'
    };
    
    const subjectText = {
        math: 'Математика',
        russian: 'Русский язык',
        literature: 'Литература',
        physics: 'Физика',
        chemistry: 'Химия',
        biology: 'Биология',
        history: 'История',
        english: 'Английский язык',
        other: 'Другой'
    };
    
    const modal = showModal(event.title, `
        <div class="event-details">
            <div style="display: flex; gap: 20px; margin-bottom: 20px; flex-wrap: wrap;">
                <div style="flex: 1; min-width: 250px;">
                    <h4 style="color: #2c3e50; margin-bottom: 10px;">📅 Дата и время</h4>
                    <p><strong>${formatDate(event.date)}</strong> ${event.time ? 'в ' + event.time : ''}</p>
                    <p>Продолжительность: ${event.duration} минут</p>
                </div>
                <div style="flex: 1; min-width: 250px;">
                    <h4 style="color: #2c3e50; margin-bottom: 10px;">📚 Детали</h4>
                    <p>Тип: <span class="event-type-badge event-type-${event.type}">${typeText[event.type] || event.type}</span></p>
                    <p>Предмет: <strong>${subjectText[event.subject] || event.subject}</strong></p>
                    <p>Класс: <strong>${event.class}</strong></p>
                </div>
            </div>
            
            ${event.description ? `
            <div style="margin-bottom: 20px;">
                <h4 style="color: #2c3e50; margin-bottom: 10px;">📝 Описание</h4>
                <p style="white-space: pre-wrap;">${event.description}</p>
            </div>` : ''}
            
            <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 15px; border-top: 1px solid #eee; flex-wrap: wrap; gap: 10px;">
                <div>
                    <span class="status-badge status-${event.status}" style="padding: 5px 12px; border-radius: 15px; font-size: 12px; font-weight: bold;">
                        ${statusText[event.status] || event.status}
                    </span>
                    ${event.reminder ? '<span style="margin-left: 10px; color: #3498db;">🔔 Напоминание включено</span>' : ''}
                    ${event.repeatYearly ? '<span style="margin-left: 10px; color: #27ae60;">🔄 Ежегодное повторение</span>' : ''}
                </div>
                <div style="color: #7f8c8d; font-size: 12px;">
                    Добавлено: ${formatDate(event.createdAt, true)}
                </div>
            </div>
        </div>
        
        <style>
            .event-type-badge {
                padding: 3px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: bold;
            }
            .status-badge {
                padding: 3px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: bold;
            }
            .status-planned { background: #fff3cd; color: #f39c12; }
            .status-completed { background: #d4edda; color: #28a745; }
            .status-analyzed { background: #cce5ff; color: #004085; }
            .status-pending { background: #f8d7da; color: #721c24; }
        </style>
    `, 'Редактировать', 'Закрыть', 'Удалить');
    
    const editBtn = modal.querySelector('.btn-primary');
    const deleteBtn = modal.querySelector('.btn-danger');
    
    editBtn.onclick = function() {
        hideModal();
        editDiagnostic(event.id);
    };
    
    deleteBtn.onclick = function() {
        if (confirm(`Удалить диагностику "${event.title}"?`)) {
            calendarData.diagnostics = calendarData.diagnostics.filter(d => d.id !== event.id);
            saveCalendarData();
            
            // Обновляем отображение
            if (calendarData.currentView === 'month') {
                generateMonthCalendar();
            } else {
                changeCalendarView(calendarData.currentView);
            }
            
            loadUpcomingEvents();
            updateStats();
            
            // Обновляем график
            if (window.workloadChartInstance) {
                window.workloadChartInstance.destroy();
                generateWorkloadChart();
            }
            
            hideModal();
            showNotification('Диагностика удалена', 'success');
        }
    };
}

// Редактирование диагностики
// Улучшенная функция редактирования диагностики
function editDiagnostic(eventId) {
    const event = calendarData.diagnostics.find(d => d.id === eventId);
    if (!event) {
        showNotification('Событие не найдено', 'error');
        return;
    }
    
    // Создаем модальное окно редактирования
    showModal('Редактировать диагностику', `
        <div class="form-group">
            <label class="required">Название работы</label>
            <input type="text" id="editDiagnosticTitle" class="form-input" value="${escapeHtml(event.title)}" autofocus>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label class="required">Дата проведения</label>
                <input type="date" id="editDiagnosticDate" class="form-input" value="${event.date}">
            </div>
            <div class="form-group">
                <label>Время</label>
                <input type="time" id="editDiagnosticTime" class="form-input" value="${event.time || '09:00'}">
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label class="required">Тип работы</label>
                <select id="editDiagnosticType" class="form-select">
                    <option value="current" ${event.type === 'current' ? 'selected' : ''}>Текущая контрольная</option>
                    <option value="milestone" ${event.type === 'milestone' ? 'selected' : ''}>Рубежная</option>
                    <option value="final" ${event.type === 'final' ? 'selected' : ''}>Итоговая</option>
                    <option value="oge" ${event.type === 'oge' ? 'selected' : ''}>ОГЭ</option>
                    <option value="ege" ${event.type === 'ege' ? 'selected' : ''}>ЕГЭ</option>
                    <option value="vpr" ${event.type === 'vpr' ? 'selected' : ''}>ВПР</option>
                    <option value="literacy" ${event.type === 'literacy' ? 'selected' : ''}>Функциональная грамотность</option>
                    <option value="diagnostic" ${event.type === 'diagnostic' ? 'selected' : ''}>Диагностическая</option>
                </select>
            </div>
            <div class="form-group">
                <label class="required">Предмет</label>
                <select id="editDiagnosticSubject" class="form-select">
                    <option value="math" ${event.subject === 'math' ? 'selected' : ''}>Математика</option>
                    <option value="russian" ${event.subject === 'russian' ? 'selected' : ''}>Русский язык</option>
                    <option value="literature" ${event.subject === 'literature' ? 'selected' : ''}>Литература</option>
                    <option value="physics" ${event.subject === 'physics' ? 'selected' : ''}>Физика</option>
                    <option value="chemistry" ${event.subject === 'chemistry' ? 'selected' : ''}>Химия</option>
                    <option value="biology" ${event.subject === 'biology' ? 'selected' : ''}>Биология</option>
                    <option value="history" ${event.subject === 'history' ? 'selected' : ''}>История</option>
                    <option value="english" ${event.subject === 'english' ? 'selected' : ''}>Английский язык</option>
                    <option value="other" ${event.subject === 'other' ? 'selected' : ''}>Другой</option>
                </select>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label class="required">Класс</label>
                <input type="text" id="editDiagnosticClass" class="form-input" value="${escapeHtml(event.class)}">
            </div>
            <div class="form-group">
                <label>Продолжительность (мин)</label>
                <input type="number" id="editDiagnosticDuration" class="form-input" value="${event.duration || 45}" min="1">
            </div>
        </div>
        <div class="form-group">
            <label>Описание</label>
            <textarea id="editDiagnosticDescription" class="form-textarea" rows="3">${escapeHtml(event.description || '')}</textarea>
        </div>
        <div class="form-group">
            <label>Статус</label>
            <select id="editDiagnosticStatus" class="form-select">
                <option value="planned" ${event.status === 'planned' ? 'selected' : ''}>Запланировано</option>
                <option value="completed" ${event.status === 'completed' ? 'selected' : ''}>Проведено</option>
                <option value="analyzed" ${event.status === 'analyzed' ? 'selected' : ''}>Проанализировано</option>
                <option value="pending" ${event.status === 'pending' ? 'selected' : ''}>Ожидает анализа</option>
            </select>
        </div>
        <div class="form-group">
            <label>
                <input type="checkbox" id="editDiagnosticReminder" ${event.reminder ? 'checked' : ''}> 
                Напомнить за день до проведения
            </label>
        </div>
        <div class="form-group">
            <label>
                <input type="checkbox" id="editDiagnosticRepeat" ${event.repeatYearly ? 'checked' : ''}> 
                Повторять ежегодно
            </label>
        </div>
    `, saveEditedDiagnostic, 'Отмена');
    
    // Сохраняем ID события для функции сохранения
    const modal = document.querySelector('.modal-content');
    if (modal) {
        modal.dataset.eventId = eventId;
    }
}

// Универсальная функция обновления всего календаря
function updateEntireCalendar() {
    console.log('Полное обновление календаря...');
    
    // Обновляем заголовок периода
    const periodElement = document.getElementById('currentPeriod');
    if (periodElement) {
        const current = new Date(calendarData.currentDate);
        periodElement.textContent = current.toLocaleDateString('ru-RU', { 
            month: 'long', 
            year: 'numeric' 
        }).replace(/^\w/, c => c.toUpperCase());
    }
    
    // Принудительное обновление вида
    const view = calendarData.currentView || 'month';
    changeCalendarView(view);
    
    // Обновляем статистику
    updateStats();
    
    // Обновляем график
    setTimeout(() => {
        if (window.workloadChartInstance) {
            window.workloadChartInstance.destroy();
        }
        generateWorkloadChart();
    }, 100);
    
    console.log('Календарь обновлен');
}

// Функция сохранения изменений
function saveEditedDiagnostic() {
    try {
        const modal = document.querySelector('.modal-content');
        const eventId = modal?.dataset.eventId;
        
        if (!eventId) {
            showNotification('Ошибка: ID события не найден', 'error');
            return false;
        }
        
        const event = calendarData.diagnostics.find(d => d.id === eventId);
        if (!event) {
            showNotification('Событие не найдено', 'error');
            return false;
        }
        
        // Получаем значения из формы
        const title = document.getElementById('editDiagnosticTitle')?.value.trim();
        const date = document.getElementById('editDiagnosticDate')?.value;
        const subject = document.getElementById('editDiagnosticSubject')?.value;
        const classValue = document.getElementById('editDiagnosticClass')?.value.trim();
        
        // Валидация
        const errors = [];
        if (!title) errors.push('Название работы');
        if (!date) errors.push('Дата проведения');
        if (!subject) errors.push('Предмет');
        if (!classValue) errors.push('Класс');
        
        if (errors.length > 0) {
            showNotification(`Заполните обязательные поля: ${errors.join(', ')}`, 'error');
            return false;
        }
        
        // Обновляем событие
        event.title = title;
        event.date = date;
        event.time = document.getElementById('editDiagnosticTime')?.value || '09:00';
        event.type = document.getElementById('editDiagnosticType')?.value || 'current';
        event.subject = subject;
        event.class = classValue;
        event.duration = parseInt(document.getElementById('editDiagnosticDuration')?.value) || 45;
        event.description = document.getElementById('editDiagnosticDescription')?.value || '';
        event.status = document.getElementById('editDiagnosticStatus')?.value || 'planned';
        event.reminder = document.getElementById('editDiagnosticReminder')?.checked || false;
        event.repeatYearly = document.getElementById('editDiagnosticRepeat')?.checked || false;
        event.updatedAt = new Date().toISOString();
        
        console.log('Обновлено событие:', event);
        
        // Сохраняем данные
        saveCalendarData();
        
        // Обновляем интерфейс
        refreshCalendarDisplay(true);
        
        // Уведомление
        showNotification(`Диагностика "${title}" обновлена`, 'success');
        
        // Закрываем модальное окно
        hideModal();
		
        updateEntireCalendar();
		
        return true;
        
    } catch (error) {
        console.error('Ошибка сохранения изменений:', error);
        showNotification('Ошибка при сохранении изменений', 'error');
        return false;
    }
}

// Генерация недельного вида
function generateWeekView() {
    const container = document.getElementById('weekView');
    if (!container) return;
    
    const current = new Date(calendarData.currentDate);
    const weekStart = new Date(current);
    
    // Начинаем с понедельника
    const dayOfWeek = current.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    weekStart.setDate(current.getDate() - diff);
    
    let html = '<div class="week-grid" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px;">';
    
    for (let i = 0; i < 7; i++) {
        const day = new Date(weekStart);
        day.setDate(weekStart.getDate() + i);
        
        const isToday = day.toDateString() === new Date().toDateString();
        const events = getEventsForDate(day);
        
        html += `
            <div class="week-day" style="border: 1px solid #e9ecef; border-radius: 8px; padding: 10px; background: white; min-height: 200px;">
                <div class="week-day-header" style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #eee;">
                    <div class="week-day-name" style="font-size: 12px; color: #7f8c8d; text-transform: uppercase;">
                        ${day.toLocaleDateString('ru-RU', { weekday: 'short' })}
                    </div>
                    <div class="week-day-number ${isToday ? 'today' : ''}" 
                         style="font-size: 1.5em; font-weight: bold; color: ${isToday ? '#e74c3c' : '#2c3e50'};">
                        ${day.getDate()}
                    </div>
                    <div style="font-size: 12px; color: #95a5a6;">
                        ${day.toLocaleDateString('ru-RU', { month: 'short' })}
                    </div>
                </div>
                <div class="week-day-events">
                    ${events.map(event => `
                        <div class="week-event event-type-${event.type}" 
                             onclick="showEventDetails('${event.id}')"
                             style="padding: 5px; margin: 3px 0; border-radius: 4px; cursor: pointer; font-size: 11px;">
                            <strong>${event.time || ''}</strong>
                            <div>${event.title}</div>
                            <small>${event.class}</small>
                        </div>
                    `).join('')}
                    ${events.length === 0 ? 
                        '<div style="text-align: center; color: #bdc3c7; padding: 20px 0;">Нет событий</div>' : ''}
                </div>
            </div>
        `;
    }
    
    html += '</div>';
    container.innerHTML = html;
}

// Генерация вида по четвертям
function generateQuarterView() {
    const container = document.getElementById('quarterView');
    if (!container) return;
    
    let html = '<div class="quarter-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">';
    
    calendarData.schoolSchedule.quarters.forEach(quarter => {
        const quarterEvents = calendarData.diagnostics.filter(event => {
            return event.date >= quarter.start && event.date <= quarter.end;
        });
        
        html += `
            <div class="quarter-card" style="background: white; border: 2px solid #e9ecef; border-radius: 10px; padding: 15px;">
                <div class="quarter-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #f1f1f1;">
                    <div class="quarter-title" style="font-weight: bold; color: #2c3e50; font-size: 1.2em;">
                        ${quarter.name}
                    </div>
                    <div class="quarter-count" style="background: #3498db; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                        ${quarterEvents.length}
                    </div>
                </div>
                <div class="quarter-dates" style="color: #7f8c8d; margin-bottom: 15px; font-size: 14px;">
                    ${formatDate(quarter.start, true)} - ${formatDate(quarter.end, true)}
                </div>
                <div class="quarter-events">
                    ${quarterEvents.slice(0, 3).map(event => `
                        <div class="quarter-event" onclick="showEventDetails('${event.id}')"
                             style="padding: 10px; margin: 5px 0; background: #f8f9fa; border-radius: 6px; cursor: pointer;">
                            <div><strong>${formatDate(event.date, true)}</strong></div>
                            <div>${event.title}</div>
                            <small>${event.class}</small>
                        </div>
                    `).join('')}
                    ${quarterEvents.length > 3 ? 
                        `<div class="more-events" style="text-align: center; padding: 10px; color: #3498db; cursor: pointer;"
                              onclick="showQuarterEvents('${quarter.name}', '${quarter.start}', '${quarter.end}')">
                            +${quarterEvents.length - 3} ещё
                        </div>` : ''}
                    ${quarterEvents.length === 0 ? 
                        '<div style="text-align: center; padding: 20px; color: #bdc3c7;">Нет запланированных работ</div>' : ''}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// Показать все события четверти
function showQuarterEvents(quarterName, startDate, endDate) {
    const quarterEvents = calendarData.diagnostics.filter(event => {
        return event.date >= startDate && event.date <= endDate;
    });
    
    let html = `<h4>События в ${quarterName}</h4>`;
    html += `<p style="color: #7f8c8d;">${formatDate(startDate, true)} - ${formatDate(endDate, true)}</p>`;
    
    if (quarterEvents.length === 0) {
        html += '<p>Нет событий</p>';
    } else {
        html += '<div style="max-height: 400px; overflow-y: auto;">';
        quarterEvents.forEach(event => {
            html += `
                <div class="quarter-event-detail" onclick="showEventDetails('${event.id}')"
                     style="padding: 10px; margin: 5px 0; border: 1px solid #e9ecef; border-radius: 6px; cursor: pointer;">
                    <strong>${event.title}</strong>
                    <div>${formatDate(event.date, true)} • ${event.class} • ${getTypeText(event.type)}</div>
                </div>
            `;
        });
        html += '</div>';
    }
    
    showModal(`События в ${quarterName}`, html, 'Закрыть');
}

// Генерация годового вида
function generateYearView() {
    const container = document.getElementById('yearView');
    if (!container) return;
    
    const currentYear = calendarData.currentDate.getFullYear();
    let html = `<h4 style="text-align: center; margin-bottom: 20px; color: #2c3e50;">Учебный год ${currentYear}-${currentYear + 1}</h4>`;
    html += '<div class="year-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px;">';
    
    // Месяцы с сентября по декабрь текущего года
    for (let month = 8; month <= 11; month++) {
        const monthDate = new Date(currentYear, month, 1);
        html += generateYearMonth(monthDate);
    }
    
    // Месяцы с января по май следующего года
    for (let month = 0; month <= 4; month++) {
        const monthDate = new Date(currentYear + 1, month, 1);
        html += generateYearMonth(monthDate);
    }
    
    html += '</div>';
    container.innerHTML = html;
}

// Генерация месяца для годового вида
function generateYearMonth(date) {
    const monthEvents = calendarData.diagnostics.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.getFullYear() === date.getFullYear() && 
               eventDate.getMonth() === date.getMonth();
    });
    
    return `
        <div class="year-month" style="background: white; border: 1px solid #e9ecef; border-radius: 8px; padding: 15px;">
            <div class="year-month-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <div style="font-weight: bold; color: #2c3e50;">
                    ${date.toLocaleDateString('ru-RU', { month: 'long' })} ${date.getFullYear()}
                </div>
                <span class="year-month-count" style="background: #3498db; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">
                    ${monthEvents.length}
                </span>
            </div>
            <div class="year-month-events">
                ${monthEvents.slice(0, 3).map(event => `
                    <div class="year-event" onclick="showEventDetails('${event.id}')"
                         style="padding: 8px; margin: 5px 0; background: #f8f9fa; border-radius: 4px; cursor: pointer; font-size: 12px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div class="year-event-day" style="background: #3498db; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                                ${new Date(event.date).getDate()}
                            </div>
                            <div class="year-event-title" style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                ${event.title}
                            </div>
                        </div>
                    </div>
                `).join('')}
                ${monthEvents.length > 3 ? 
                    `<div class="more-events" style="text-align: center; padding: 5px; color: #7f8c8d; font-size: 12px;">
                        и еще ${monthEvents.length - 3} событий
                    </div>` : ''}
                ${monthEvents.length === 0 ? 
                    '<div style="text-align: center; padding: 10px; color: #bdc3c7; font-size: 12px;">Нет событий</div>' : ''}
            </div>
        </div>
    `;
}

// Генерация таймлайна
function generateTimelineView() {
    const container = document.getElementById('timelineContainer');
    if (!container) return;
    
    // Сортируем события по дате
    const sortedEvents = [...calendarData.diagnostics].sort((a, b) => 
        new Date(a.date) - new Date(b.date)
    );
    
    let html = '<div class="timeline" style="max-height: 500px; overflow-y: auto;">';
    
    if (sortedEvents.length === 0) {
        html += '<div style="text-align: center; padding: 40px; color: #bdc3c7;">Нет запланированных диагностик</div>';
    } else {
        sortedEvents.forEach((event, index) => {
            const eventDate = new Date(event.date);
            const isPast = eventDate < new Date();
            
            html += `
                <div class="timeline-event" style="display: flex; align-items: center; gap: 15px; padding: 15px; margin: 10px 0; background: white; border-left: 4px solid ${getEventColor(event.type)}; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); opacity: ${isPast ? 0.7 : 1};">
                    <div class="timeline-date" style="min-width: 100px; text-align: center;">
                        <div style="font-weight: bold; color: #3498db;">${formatDate(event.date, true)}</div>
                        ${event.time ? `<div style="font-size: 12px; color: #7f8c8d;">${event.time}</div>` : ''}
                    </div>
                    <div class="timeline-content" style="flex: 1;">
                        <h5 style="margin: 0 0 5px 0; color: #2c3e50;">${event.title}</h5>
                        <p style="margin: 0; color: #7f8c8d; font-size: 0.9em;">
                            ${event.class} • ${getTypeText(event.type)} • ${getStatusText(event.status)}
                        </p>
                    </div>
                    <div class="timeline-actions">
                        <button class="btn btn-sm btn-outline" onclick="showEventDetails('${event.id}')" style="padding: 5px 10px; font-size: 12px;">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
            `;
        });
    }
    
    html += '</div>';
    container.innerHTML = html;
}

// Получение цвета для типа события
function getEventColor(type) {
    const colors = {
        current: '#3498db',
        milestone: '#f39c12',
        final: '#2ecc71',
        oge: '#9b59b6',
        ege: '#e74c3c',
        vpr: '#1abc9c',
        literacy: '#34495e',
        diagnostic: '#d35400'
    };
    return colors[type] || '#95a5a6';
}

// Загрузка предстоящих событий
function loadUpcomingEvents() {
    const container = document.getElementById('upcomingEventsList');
    if (!container) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Фильтруем события на будущее (включая сегодня)
    const upcoming = calendarData.diagnostics
        .filter(event => new Date(event.date) >= today)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 5);
    
    if (upcoming.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: #bdc3c7;">
                <div style="font-size: 3em; margin-bottom: 15px;">📅</div>
                <h5 style="color: #95a5a6;">Нет предстоящих событий</h5>
                <p style="font-size: 0.9em;">Добавьте первую диагностику</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    upcoming.forEach(event => {
        const eventDate = new Date(event.date);
        const isToday = eventDate.toDateString() === today.toDateString();
        
        html += `
            <div class="upcoming-event-item" onclick="showEventDetails('${event.id}')"
                 style="display: flex; align-items: center; gap: 15px; padding: 12px; border-radius: 8px; margin-bottom: 8px; background: ${isToday ? '#e8f4fc' : '#f8f9fa'}; transition: all 0.2s; cursor: pointer;">
                <div class="upcoming-event-date" style="background: ${isToday ? '#e74c3c' : '#3498db'}; color: white; width: 50px; height: 50px; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">
                    <div class="day" style="font-size: 1.5em; line-height: 1;">${eventDate.getDate()}</div>
                    <div class="month" style="font-size: 0.8em; opacity: 0.9;">${eventDate.toLocaleDateString('ru-RU', { month: 'short' })}</div>
                </div>
                <div class="upcoming-event-info" style="flex: 1; overflow: hidden;">
                    <h5 style="margin: 0 0 5px 0; color: #2c3e50; font-size: 0.95em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${event.title}
                    </h5>
                    <p style="margin: 0; color: #7f8c8d; font-size: 0.85em;">
                        ${event.class} • ${getTypeText(event.type)}
                    </p>
                </div>
                <div class="upcoming-event-status status-${event.status}" 
                     style="padding: 3px 8px; border-radius: 12px; font-size: 0.75em; font-weight: bold; white-space: nowrap;">
                    ${getStatusText(event.status)}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Обновление статистики
function updateStats() {
    console.log('Обновление статистики...');
    
    const total = calendarData.diagnostics.length;
    
    // Общее количество работ
    const totalElement = document.getElementById('totalWorks');
    if (totalElement) {
        totalElement.textContent = total;
        totalElement.style.color = total > 0 ? '#27ae60' : '#7f8c8d';
    }
    
    // Работы в текущем месяце
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const monthCount = calendarData.diagnostics.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= monthStart && eventDate <= monthEnd;
    }).length;
    
    const monthElement = document.getElementById('monthWorks');
    if (monthElement) {
        monthElement.textContent = monthCount;
        monthElement.style.color = monthCount > 0 ? '#3498db' : '#7f8c8d';
    }
    
    // Следующее событие
    const upcoming = calendarData.diagnostics
        .filter(event => new Date(event.date) >= today)
        .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
    
    const nextElement = document.getElementById('nextWork');
    if (nextElement) {
        if (upcoming) {
            const nextDate = new Date(upcoming.date);
            const diffDays = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
            
            nextElement.textContent = `${formatDate(upcoming.date, true)} (через ${diffDays} дн.)`;
            nextElement.style.color = diffDays <= 1 ? '#e74c3c' : 
                                      diffDays <= 3 ? '#f39c12' : '#27ae60';
            nextElement.title = `${upcoming.title} - ${upcoming.class}`;
        } else {
            nextElement.textContent = 'нет запланированных';
            nextElement.style.color = '#7f8c8d';
            nextElement.title = '';
        }
    }
    
    // Загруженность (процент дней с событиями)
    const daysWithEvents = new Set(calendarData.diagnostics.map(d => d.date)).size;
    const totalDays = 365;
    const workloadPercent = Math.min(100, Math.round((daysWithEvents / totalDays) * 100));
    
    const bar = document.getElementById('workloadBar');
    if (bar) {
        bar.style.width = `${workloadPercent}%`;
        
        // Анимация
        bar.style.transition = 'width 0.5s ease, background-color 0.3s ease';
        
        // Цвет в зависимости от загруженности
        if (workloadPercent > 70) {
            bar.style.backgroundColor = '#e74c3c';
            bar.title = 'Высокая загруженность';
        } else if (workloadPercent > 40) {
            bar.style.backgroundColor = '#f39c12';
            bar.title = 'Средняя загруженность';
        } else if (workloadPercent > 10) {
            bar.style.backgroundColor = '#2ecc71';
            bar.title = 'Низкая загруженность';
        } else {
            bar.style.backgroundColor = '#95a5a6';
            bar.title = 'Минимальная загруженность';
        }
    }
    
    // Обновляем текст прогресса
    const progressText = document.getElementById('workloadText');
    if (progressText) {
        progressText.textContent = `${workloadPercent}% дней с событиями`;
    }
    
    console.log('Статистика обновлена:', { total, monthCount, workloadPercent });
}

// Генерация графика загруженности - ИСПРАВЛЕННАЯ ВЕРСИЯ
function generateWorkloadChart() {
    const canvas = document.getElementById('workloadChart');
    if (!canvas) {
        console.warn('Canvas элемент workloadChart не найден');
        return;
    }
    
    try {
        // Уничтожаем старый график
        if (window.workloadChartInstance) {
            window.workloadChartInstance.destroy();
            window.workloadChartInstance = null;
        }
        
        // Фиксируем размеры
        const container = canvas.parentElement;
        if (container) {
            container.style.height = '250px';
        }
        canvas.style.width = '100%';
        canvas.style.height = '200px';
        canvas.width = canvas.offsetWidth;
        canvas.height = 200;
        
        // Подготавливаем данные для последних 6 месяцев
        const now = new Date();
        const labels = [];
        const data = [];
        
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            
            // Правильное форматирование месяца на русском
            const monthName = date.toLocaleDateString('ru-RU', { 
                month: 'short',
                year: 'numeric'
            }).replace('.', '');
            
            labels.push(monthName);
            
            // Считаем события для этого месяца
            const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
            const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
            
            const monthEvents = calendarData.diagnostics.filter(event => {
                try {
                    const eventDate = new Date(event.date);
                    return eventDate >= monthStart && eventDate <= monthEnd;
                } catch (e) {
                    console.warn('Ошибка парсинга даты события:', event.date);
                    return false;
                }
            }).length;
            
            data.push(monthEvents);
        }
        
        // Если все данные нулевые, показываем заглушку
        const hasData = data.some(value => value > 0);
        
        if (!hasData) {
            canvas.style.display = 'none';
            
            const placeholderId = 'workloadChartPlaceholder';
            let placeholder = document.getElementById(placeholderId);
            
            if (!placeholder) {
                placeholder = document.createElement('div');
                placeholder.id = placeholderId;
                placeholder.innerHTML = `
                    <div style="height: 200px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #95a5a6; background: #f8f9fa; border-radius: 8px; margin-top: 10px;">
                        <div style="font-size: 3em; margin-bottom: 10px;">📊</div>
                        <div>Нет данных для графика</div>
                        <small>Добавьте диагностики, чтобы увидеть статистику</small>
                    </div>
                `;
                
                if (container) {
                    const oldPlaceholder = document.getElementById(placeholderId);
                    if (oldPlaceholder) oldPlaceholder.remove();
                    container.appendChild(placeholder);
                }
            }
            return;
        }
        
        // Убираем placeholder если есть
        const placeholder = document.getElementById('workloadChartPlaceholder');
        if (placeholder) {
            placeholder.remove();
        }
        canvas.style.display = 'block';
        
        // Создаем новый график
        window.workloadChartInstance = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Количество работ',
                    data: data,
                    backgroundColor: data.map(value => 
                        value >= 10 ? '#e74c3c' :
                        value >= 5 ? '#f39c12' :
                        value >= 2 ? '#3498db' : '#2ecc71'
                    ),
                    borderColor: '#2980b9',
                    borderWidth: 1,
                    borderRadius: 4,
                    maxBarThickness: 40
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const word = value === 1 ? 'работа' : 
                                           value >= 2 && value <= 4 ? 'работы' : 'работ';
                                return `${value} ${word}`;
                            },
                            title: function(context) {
                                return context[0].label;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            callback: function(value) {
                                return Number.isInteger(value) ? value : '';
                            }
                        },
                        grid: {
                            color: 'rgba(0,0,0,0.05)'
                        },
                        title: {
                            display: true,
                            text: 'Количество работ'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            maxRotation: 0
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        });
        
        console.log('График создан успешно');
        
    } catch (error) {
        console.error('Ошибка создания графика:', error);
        canvas.style.display = 'none';
        
        const container = canvas.parentElement;
        if (container) {
            const errorDiv = document.createElement('div');
            errorDiv.id = 'workloadChartError';
            errorDiv.innerHTML = `
                <div style="height: 200px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #e74c3c; background: #fdf2f2; border-radius: 8px;">
                    <div style="font-size: 2em; margin-bottom: 10px;">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div>Ошибка загрузки графика</div>
                </div>
            `;
            
            const oldError = document.getElementById('workloadChartError');
            if (oldError) oldError.remove();
            container.appendChild(errorDiv);
        }
    }
}

// Импорт школьного расписания
function importSchoolSchedule() {
    showModal('Импорт расписания', `
        <div class="form-group">
            <label>Выберите файл с расписанием (.json)</label>
            <input type="file" id="scheduleFile" class="form-input" accept=".json" onchange="handleScheduleFile(event)">
        </div>
        <div class="form-group">
            <label>Или введите вручную (JSON формат):</label>
            <textarea id="manualSchedule" class="form-textarea" rows="6" placeholder='{"quarters": [...], "holidays": [...]}'></textarea>
        </div>
        <div class="alert alert-info">
            <small>
                Формат JSON:<br>
                {
                    "quarters": [{"name": "I четверть", "start": "2024-09-01", "end": "2024-10-25"}],
                    "holidays": [{"name": "Каникулы", "start": "2024-10-28", "end": "2024-11-04"}]
                }
            </small>
        </div>
    `, 'Импортировать', 'Отмена');
    
    const modal = document.querySelector('.modal-content');
    const importBtn = modal.querySelector('.btn-primary');
    
    importBtn.onclick = function() {
        const manualInput = document.getElementById('manualSchedule').value.trim();
        
        try {
            let scheduleData;
            
            if (manualInput) {
                scheduleData = JSON.parse(manualInput);
            } else {
                showNotification('Введите данные или выберите файл', 'error');
                return;
            }
            
            if (scheduleData.quarters) {
                calendarData.schoolSchedule.quarters = scheduleData.quarters;
            }
            
            if (scheduleData.holidays) {
                calendarData.schoolSchedule.holidays = scheduleData.holidays;
            }
            
            saveCalendarData();
            hideModal();
            showNotification('Расписание импортировано', 'success');
            
            // Обновляем вид если активна четверть
            if (calendarData.currentView === 'quarter') {
                generateQuarterView();
            }
            
        } catch (e) {
            showNotification('Ошибка парсинга JSON: ' + e.message, 'error');
        }
    };
}

// Обработка файла расписания
function handleScheduleFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const scheduleData = JSON.parse(e.target.result);
            document.getElementById('manualSchedule').value = JSON.stringify(scheduleData, null, 2);
        } catch (error) {
            showNotification('Ошибка чтения файла: ' + error.message, 'error');
        }
    };
    reader.readAsText(file);
}

// Экспорт календаря
function exportCalendar() {
    try {
        // Создаем данные для экспорта
        const exportData = {
            ...calendarData,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `календарь_диагностик_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showNotification('Календарь экспортирован в JSON', 'success');
    } catch (error) {
        showNotification('Ошибка экспорта: ' + error.message, 'error');
    }
}

// Печать календаря
// Улучшенная функция печати календаря
function printCalendar() {
    try {
        // Сохраняем текущее состояние
        const currentView = calendarData.currentView;
        const originalTitle = document.title;
        
        // Создаем оптимизированную версию для печати
        const printContent = generatePrintContent();
        
        // Открываем новое окно
        const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
        if (!printWindow) {
            showNotification('Разрешите всплывающие окна для печати', 'error');
            return;
        }
        
        // Записываем HTML в новое окно
        printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="ru">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Календарь диагностик - Печать</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                        font-family: 'Arial', sans-serif;
                    }
                    
                    body {
                        padding: 20px;
                        line-height: 1.4;
                        color: #000;
                        font-size: 12pt;
                    }
                    
                    .print-header {
                        text-align: center;
                        margin-bottom: 20px;
                        padding-bottom: 15px;
                        border-bottom: 2px solid #333;
                    }
                    
                    .print-header h1 {
                        font-size: 18pt;
                        margin-bottom: 10px;
                        color: #000;
                    }
                    
                    .print-info {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 15px;
                        font-size: 10pt;
                        color: #666;
                    }
                    
                    .calendar-print {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                    }
                    
                    .calendar-print th {
                        background: #f0f0f0;
                        border: 1px solid #ddd;
                        padding: 8px;
                        text-align: center;
                        font-weight: bold;
                    }
                    
                    .calendar-print td {
                        border: 1px solid #ddd;
                        padding: 5px;
                        vertical-align: top;
                        min-height: 80px;
                        height: 80px;
                    }
                    
                    .calendar-day-print {
                        font-weight: bold;
                        margin-bottom: 5px;
                        color: #000;
                    }
                    
                    .calendar-event-print {
                        font-size: 8pt;
                        margin: 2px 0;
                        padding: 2px 4px;
                        background: #f8f8f8;
                        border-left: 3px solid #3498db;
                        border-radius: 2px;
                        page-break-inside: avoid;
                    }
                    
                    .month-separator {
                        page-break-before: always;
                        margin-top: 30px;
                    }
                    
                    .no-print-events {
                        color: #999;
                        font-style: italic;
                        font-size: 9pt;
                    }
                    
                    .print-footer {
                        margin-top: 20px;
                        padding-top: 10px;
                        border-top: 1px solid #ddd;
                        font-size: 9pt;
                        color: #666;
                        text-align: center;
                    }
                    
                    @media print {
                        @page {
                            margin: 15mm;
                            size: A4;
                        }
                        
                        body {
                            font-size: 10pt;
                        }
                        
                        .page-break {
                            page-break-before: always;
                        }
                        
                        .avoid-break {
                            page-break-inside: avoid;
                        }
                    }
                </style>
            </head>
            <body>
                ${printContent}
                <script>
                    window.onload = function() {
                        // Автоматическая печать через секунду
                        setTimeout(() => {
                            window.print();
                        }, 1000);
                        
                        // Закрытие окна после печати/отмены
                        window.onafterprint = function() {
                            setTimeout(() => {
                                window.close();
                            }, 100);
                        };
                    };
                </script>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        
    } catch (error) {
        console.error('Ошибка печати:', error);
        showNotification('Ошибка при подготовке к печати', 'error');
        
        // Fallback - обычная печать текущей страницы
        setTimeout(() => {
            window.print();
        }, 500);
    }
}

// Генерация контента для печати
function generatePrintContent() {
    const now = new Date();
    const currentYear = now.getFullYear();
    
    let html = `
        <div class="print-header">
            <h1>📅 Календарь образовательных диагностик</h1>
            <div>Учебный год ${currentYear}-${currentYear + 1}</div>
            <div>Дата формирования: ${formatDate(new Date(), true)}</div>
        </div>
    `;
    
    // Создаем календарь на весь учебный год
    const months = [];
    
    // Сентябрь-Декабрь текущего года
    for (let month = 8; month <= 11; month++) {
        months.push(new Date(currentYear, month, 1));
    }
    
    // Январь-Май следующего года
    for (let month = 0; month <= 4; month++) {
        months.push(new Date(currentYear + 1, month, 1));
    }
    
    // Генерируем календарь для каждого месяца
    months.forEach((monthDate, index) => {
        if (index > 0) {
            html += '<div class="month-separator"></div>';
        }
        
        html += generateMonthForPrint(monthDate);
    });
    
    // Статистика
    html += generatePrintStats();
    
    // Футер
    html += `
        <div class="print-footer">
            <p>Сгенерировано системой анализа образовательных результатов</p>
            <p>© ${currentYear} Все права защищены</p>
        </div>
    `;
    
    return html;
}

// Генерация месяца для печати
function generateMonthForPrint(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const monthName = date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
    
    // Получаем дни месяца
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const firstDayIndex = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    
    // События месяца
    const monthEvents = {};
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        monthEvents[day] = calendarData.diagnostics.filter(event => event.date === dateStr);
    }
    
    let html = `
        <div class="print-month">
            <h2 style="margin-bottom: 15px; color: #2c3e50;">${monthName}</h2>
            <table class="calendar-print">
                <thead>
                    <tr>
                        <th>Пн</th><th>Вт</th><th>Ср</th><th>Чт</th><th>Пт</th><th style="color: #e74c3c;">Сб</th><th style="color: #3498db;">Вс</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    let dayCounter = 1;
    let weekHtml = '<tr>';
    
    // Пустые ячейки перед первым днем
    for (let i = 0; i < firstDayIndex; i++) {
        weekHtml += '<td style="background: #f9f9f9;"></td>';
    }
    
    // Дни месяца
    for (let day = 1; day <= daysInMonth; day++) {
        const events = monthEvents[day] || [];
        const isToday = new Date().getDate() === day && 
                       new Date().getMonth() === month && 
                       new Date().getFullYear() === year;
        
        weekHtml += `
            <td style="${isToday ? 'background: #f0f8ff;' : ''}">
                <div class="calendar-day-print" style="${isToday ? 'color: #e74c3c;' : ''}">
                    ${day}
                </div>
                <div class="calendar-events-container">
        `;
        
        if (events.length > 0) {
            events.slice(0, 2).forEach(event => {
                weekHtml += `
                    <div class="calendar-event-print avoid-break">
                        <strong>${event.time || ''}</strong> ${event.title}<br>
                        <small>${event.class}</small>
                    </div>
                `;
            });
            
            if (events.length > 2) {
                weekHtml += `<div class="no-print-events">+${events.length - 2} ещё</div>`;
            }
        } else {
            weekHtml += '<div class="no-print-events">—</div>';
        }
        
        weekHtml += '</div></td>';
        
        // Новая строка после воскресенья
        if ((firstDayIndex + day) % 7 === 0 && day !== daysInMonth) {
            weekHtml += '</tr><tr>';
        }
    }
    
    // Пустые ячейки после последнего дня
    const totalCells = Math.ceil((firstDayIndex + daysInMonth) / 7) * 7;
    const emptyCells = totalCells - (firstDayIndex + daysInMonth);
    for (let i = 0; i < emptyCells; i++) {
        weekHtml += '<td style="background: #f9f9f9;"></td>';
    }
    
    weekHtml += '</tr>';
    html += weekHtml + '</tbody></table></div>';
    
    return html;
}

// Генерация статистики для печати
function generatePrintStats() {
    const total = calendarData.diagnostics.length;
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const monthCount = calendarData.diagnostics.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= monthStart && eventDate <= monthEnd;
    }).length;
    
    const upcoming = calendarData.diagnostics
        .filter(event => new Date(event.date) >= today)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 3);
    
    let html = `
        <div class="print-stats" style="margin-top: 30px; padding: 15px; background: #f8f9fa; border-radius: 5px; page-break-inside: avoid;">
            <h3 style="margin-bottom: 15px;">📊 Статистика</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                <div>
                    <strong>Всего работ:</strong> ${total}
                </div>
                <div>
                    <strong>В этом месяце:</strong> ${monthCount}
                </div>
                <div>
                    <strong>Ближайшие события:</strong>
    `;
    
    if (upcoming.length > 0) {
        upcoming.forEach(event => {
            html += `<div>• ${formatDate(event.date, true)}: ${event.title} (${event.class})</div>`;
        });
    } else {
        html += '<div>Нет предстоящих событий</div>';
    }
    
    html += `
                </div>
            </div>
        </div>
    `;
    
    return html;
}

// Общий доступ к календарю
function shareCalendar() {
    showModal('Поделиться календарем', `
        <div class="form-group">
            <label>Ссылка для доступа:</label>
            <div style="display: flex; gap: 5px;">
                <input type="text" id="shareLink" class="form-input" value="https://анализ-результатов.рф/calendar/${generateShareToken()}" readonly style="flex: 1;">
                <button class="btn btn-outline" onclick="copyShareLink()" style="white-space: nowrap;">
                    <i class="fas fa-copy"></i> Копировать
                </button>
            </div>
        </div>
        <div class="form-group">
            <label>Срок действия ссылки:</label>
            <select id="linkExpiry" class="form-select">
                <option value="1day">1 день</option>
                <option value="1week" selected>1 неделя</option>
                <option value="1month">1 месяц</option>
                <option value="forever">Бессрочно</option>
            </select>
        </div>
        <div class="form-group">
            <label>Права доступа:</label>
            <select id="linkPermissions" class="form-select">
                <option value="view">Только просмотр</option>
                <option value="comment">Просмотр и комментарии</option>
                <option value="edit">Полный доступ</option>
            </select>
        </div>
        <div class="alert alert-warning">
            <small><i class="fas fa-exclamation-triangle"></i> Функция "Общий доступ" требует серверной реализации</small>
        </div>
    `, 'Создать ссылку', 'Отмена');
}

// Генерация токена для общего доступа
function generateShareToken() {
    return Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
}

// Копирование ссылки
function copyShareLink() {
    const input = document.getElementById('shareLink');
    if (input) {
        input.select();
        input.setSelectionRange(0, 99999);
        document.execCommand('copy');
        showNotification('Ссылка скопирована в буфер обмена', 'success');
    }
}

// Навигация по календарю
function prevPeriod() {
    switch(calendarData.currentView) {
        case 'month':
            calendarData.currentDate.setMonth(calendarData.currentDate.getMonth() - 1);
            break;
        case 'week':
            calendarData.currentDate.setDate(calendarData.currentDate.getDate() - 7);
            break;
        case 'quarter':
            calendarData.currentDate.setMonth(calendarData.currentDate.getMonth() - 3);
            break;
        case 'year':
            calendarData.currentDate.setFullYear(calendarData.currentDate.getFullYear() - 1);
            break;
        case 'timeline':
            // Для таймлайна прокрутка не нужна
            return;
    }
    
    saveCalendarData();
    changeCalendarView(calendarData.currentView);
	initCalendar();
}

function nextPeriod() {
    switch(calendarData.currentView) {
        case 'month':
            calendarData.currentDate.setMonth(calendarData.currentDate.getMonth() + 1);
            break;
        case 'week':
            calendarData.currentDate.setDate(calendarData.currentDate.getDate() + 7);
            break;
        case 'quarter':
            calendarData.currentDate.setMonth(calendarData.currentDate.getMonth() + 3);
            break;
        case 'year':
            calendarData.currentDate.setFullYear(calendarData.currentDate.getFullYear() + 1);
            break;
        case 'timeline':
            // Для таймлайна прокрутка не нужна
            return;
    }
    
    saveCalendarData();
    changeCalendarView(calendarData.currentView);
	initCalendar();
}

function goToToday() {
    calendarData.currentDate = new Date();
    saveCalendarData();
    changeCalendarView(calendarData.currentView);
    showNotification('Переход к текущей дате', 'info');
	initCalendar();
}

// Фильтрация календаря
function filterCalendar() {
    // Здесь будет логика фильтрации
    showNotification('Фильтры применены', 'info');
    
    // Обновляем отображение
    if (calendarData.currentView === 'month') {
        generateMonthCalendar();
    } else {
        changeCalendarView(calendarData.currentView);
    }
}

// Добавление диагностики из текущих данных теста
function addDiagnosticFromTestData() {
    if (!appData || !appData.test || !appData.test.testDate) return;
    
    const testData = appData.test;
    
    const diagnostic = {
        id: 'test_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        title: testData.theme || 'Контрольная работа',
        date: testData.testDate,
        time: '09:00',
        type: testData.workType || 'current',
        subject: testData.subject || '',
        class: testData.class || '',
        duration: testData.timeLimit || 45,
        description: testData.goals || '',
        status: 'completed',
        reminder: false,
        repeatYearly: false,
        createdAt: new Date().toISOString()
    };
    
    // Проверяем, нет ли уже такой диагностики
    const exists = calendarData.diagnostics.some(d => 
        d.date === diagnostic.date && 
        d.class === diagnostic.class && 
        d.title === diagnostic.title
    );
    
    if (!exists) {
        calendarData.diagnostics.push(diagnostic);
        saveCalendarData();
        console.log('Диагностика добавлена из данных теста');
    }
}

// Форматирование даты
function formatDate(dateStr, short = false) {
    if (!dateStr) return '';
    
    let date;
    if (typeof dateStr === 'string') {
        date = new Date(dateStr);
    } else if (dateStr instanceof Date) {
        date = dateStr;
    } else {
        return '';
    }
    
    if (isNaN(date.getTime())) return '';
    
    if (short) {
        return date.toLocaleDateString('ru-RU');
    }
    
    return date.toLocaleDateString('ru-RU', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

// Получение текста типа
function getTypeText(type) {
    const types = {
        current: 'Текущая',
        milestone: 'Рубежная',
        final: 'Итоговая',
        oge: 'ОГЭ',
        ege: 'ЕГЭ',
        vpr: 'ВПР',
        literacy: 'Грамотность',
        diagnostic: 'Диагностика'
    };
    return types[type] || type;
}

// Получение текста статуса
function getStatusText(status) {
    const statuses = {
        planned: 'Запланировано',
        completed: 'Проведено',
        analyzed: 'Проанализировано',
        pending: 'Ожидает анализа'
    };
    return statuses[status] || status;
}

// Экранирование HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Планирование напоминаний
function scheduleReminder(event) {
    const eventDate = new Date(event.date);
    const reminderDate = new Date(eventDate);
    reminderDate.setDate(reminderDate.getDate() - 1); // За день
    
    const now = new Date();
    const timeToReminder = reminderDate - now;
    
    if (timeToReminder > 0) {
        console.log(`Напоминание установлено на ${reminderDate} для события: ${event.title}`);
        
        setTimeout(() => {
            showNotification(`Напоминание: завтра ${event.title} (${event.class})`, 'warning');
            
            // Браузерные уведомления
            if (Notification.permission === 'granted') {
                new Notification('Напоминание о диагностике', {
                    body: `Завтра ${event.title} для ${event.class}`,
                    icon: '/favicon.ico',
                    tag: 'diagnostic-reminder'
                });
            }
        }, timeToReminder);
    }
}

// Альтернативная простая функция модального окна
function showCalendarModal(title, content, confirmText = 'Сохранить', cancelText = 'Отмена') {
    return new Promise((resolve, reject) => {
        const modalHtml = `
            <div class="modal-overlay" id="calendarModal" style="display: flex;">
                <div class="modal-content" style="max-width: 600px;">
                    <h3>${title}</h3>
                    <div class="modal-body">
                        ${content}
                    </div>
                    <div class="modal-actions" style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
                        <button class="btn" id="calendarModalCancel">${cancelText}</button>
                        <button class="btn btn-primary" id="calendarModalConfirm">${confirmText}</button>
                    </div>
                </div>
            </div>
        `;
        
        // Удаляем старые модальные окна
        const oldModal = document.getElementById('calendarModal');
        if (oldModal) oldModal.remove();
        
        // Добавляем новое
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Находим элементы
        const modal = document.getElementById('calendarModal');
        const confirmBtn = document.getElementById('calendarModalConfirm');
        const cancelBtn = document.getElementById('calendarModalCancel');
        
        // Обработчики
        confirmBtn.onclick = () => {
            modal.remove();
            resolve(true);
        };
        
        cancelBtn.onclick = () => {
            modal.remove();
            resolve(false);
        };
        
        // Закрытие по клику на оверлей
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.remove();
                resolve(false);
            }
        };
        
        // Закрытие по Escape
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', handleEscape);
                resolve(false);
            }
        };
        document.addEventListener('keydown', handleEscape);
    });
}

// Инициализация при загрузке вкладки
document.addEventListener('DOMContentLoaded', function() {
    console.log('Calendar module loaded');
    

    
    // Запрашиваем разрешение на уведомления при первом посещении
    if (localStorage.getItem('notificationPermissionAsked') !== 'true') {
        if (Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                localStorage.setItem('notificationPermissionAsked', 'true');
                console.log('Notification permission:', permission);
            });
        }
    }
});

// Сохранение при закрытии страницы
window.addEventListener('beforeunload', function() {
    saveCalendarData();
});

// Экспорт функций в глобальную область видимости
window.initCalendar = initCalendar;
window.changeCalendarView = changeCalendarView;
window.addNewDiagnostic = addNewDiagnostic;
window.showEventDetails = showEventDetails;
window.editDiagnostic = editDiagnostic;
window.prevPeriod = prevPeriod;
window.nextPeriod = nextPeriod;
window.goToToday = goToToday;
window.filterCalendar = filterCalendar;
window.exportCalendar = exportCalendar;
window.printCalendar = printCalendar;
window.shareCalendar = shareCalendar;
window.copyShareLink = copyShareLink;
window.importSchoolSchedule = importSchoolSchedule;
window.generateWorkloadChart = generateWorkloadChart;
window.showQuarterEvents = showQuarterEvents;
window.addEventForDate = addEventForDate;
window.showDayEvents = showDayEvents;

console.log('Calendar module v1.0 loaded successfully');