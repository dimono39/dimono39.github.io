(function() {
    'use strict';
    
    // Конфигурация
    const CONFIG = {
        position: { top: '20px', left: '20px' },
        colors: {
            primary: '#00ffff',
            secondary: '#ff00ff',
            background: 'rgba(0, 0, 0, 0.85)',
            text: '#ffffff'
        },
        snowflakes: 15,
        enableFireworks: true,
        autoExpandOnNewYear: true,
        saveState: true
    };
    
    // Создание стилей
    function createStyles() {
        const styles = `
            .new-year-widget {
                position: fixed;
                top: ${CONFIG.position.top};
                left: ${CONFIG.position.left};
                background: ${CONFIG.colors.background};
                border-radius: 15px;
                padding: 15px;
                min-width: 200px;
                box-shadow: 0 0 25px rgba(0, 255, 255, 0.4),
                            0 0 15px rgba(255, 0, 255, 0.3);
                border: 2px solid rgba(0, 255, 255, 0.3);
                backdrop-filter: blur(10px);
                z-index: 9999;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                transition: all 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55);
                transform-origin: top left;
            }
            
            .new-year-widget.minimized {
                min-width: 0;
                width: 50px;
                height: 50px;
                padding: 0;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                overflow: hidden;
            }
            
            .new-year-widget.minimized:hover {
                transform: scale(1.1) rotate(10deg);
                box-shadow: 0 0 30px rgba(0, 255, 255, 0.7),
                            0 0 20px rgba(255, 0, 255, 0.5);
            }
            
            .new-year-widget.minimized .widget-content {
                display: none;
            }
            
            .new-year-widget.minimized .tree-icon {
                display: block;
                font-size: 28px;
                animation: pulse 2s infinite;
            }
            
            .new-year-widget:not(.minimized) .tree-icon {
                display: none;
            }
            
            .new-year-widget:hover:not(.minimized) {
                transform: translateY(-5px);
                box-shadow: 0 0 30px rgba(0, 255, 255, 0.6),
                            0 0 20px rgba(255, 0, 255, 0.4);
            }
            
            .widget-content {
                transition: opacity 0.3s;
            }
            
            .widget-title {
                color: #fff;
                font-size: 1.2rem;
                text-align: center;
                margin-bottom: 12px;
                text-shadow: 0 0 10px ${CONFIG.colors.primary};
                background: linear-gradient(45deg, ${CONFIG.colors.primary}, ${CONFIG.colors.secondary});
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }
            
            .countdown {
                display: flex;
                justify-content: center;
                gap: 8px;
                margin-bottom: 10px;
            }
            
            .time-unit {
                background: rgba(0, 0, 0, 0.6);
                padding: 8px 5px;
                border-radius: 10px;
                min-width: 45px;
                border: 1px solid rgba(0, 255, 255, 0.2);
                transition: transform 0.2s;
            }
            
            .time-unit:hover {
                transform: translateY(-2px);
            }
            
            .number {
                font-size: 1.3rem;
                font-weight: bold;
                color: ${CONFIG.colors.primary};
                text-shadow: 0 0 8px ${CONFIG.colors.primary};
                display: block;
                text-align: center;
            }
            
            .label {
                color: ${CONFIG.colors.text};
                font-size: 0.7rem;
                text-align: center;
                display: block;
                margin-top: 3px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            .message {
                color: ${CONFIG.colors.text};
                font-size: 0.8rem;
                text-align: center;
                margin-top: 8px;
                padding-top: 8px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            @keyframes pulse {
                0% { transform: scale(1); text-shadow: 0 0 5px #00ff00; }
                50% { transform: scale(1.1); text-shadow: 0 0 15px #00ff00, 0 0 20px #00ff00; }
                100% { transform: scale(1); text-shadow: 0 0 5px #00ff00; }
            }
            
            .minimize-btn {
                position: absolute;
                top: 8px;
                right: 8px;
                background: rgba(255, 255, 255, 0.1);
                border: none;
                color: ${CONFIG.colors.text};
                width: 20px;
                height: 20px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 0.8rem;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s;
                opacity: 0.7;
            }
            
            .minimize-btn:hover {
                opacity: 1;
                background: rgba(0, 255, 255, 0.3);
                transform: scale(1.1);
            }
            
            .snowflakes-container {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 9998;
            }
            
            .snowflake {
                position: absolute;
                font-size: 20px;
                animation: fall linear infinite;
                opacity: 0;
                user-select: none;
                pointer-events: none;
            }
            
            @keyframes fall {
                0% {
                    transform: translateY(-50px) translateX(0) rotate(0deg);
                    opacity: 0;
                }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% {
                    transform: translateY(calc(100vh + 50px)) translateX(100px) rotate(360deg);
                    opacity: 0;
                }
            }
            
            .mini-firework {
                position: fixed;
                width: 3px;
                height: 3px;
                border-radius: 50%;
                pointer-events: none;
                z-index: 9997;
                animation: mini-explode 0.8s forwards;
            }
            
            @keyframes mini-explode {
                0% { transform: scale(1); opacity: 1; }
                100% { transform: scale(15); opacity: 0; }
            }
            
            @keyframes slideIn {
                from { transform: translateX(-100px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes minimizeAnimation {
                0% { transform: scale(1); border-radius: 15px; }
                50% { transform: scale(0.8); border-radius: 25px; }
                100% { transform: scale(1); border-radius: 50%; }
            }
            
            .new-year-widget {
                animation: slideIn 0.5s ease-out;
            }
            
            .tree-icon::after {
                content: attr(data-tooltip);
                position: absolute;
                bottom: -35px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 5px 10px;
                border-radius: 5px;
                font-size: 0.7rem;
                white-space: nowrap;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s;
                z-index: 10000;
                border: 1px solid rgba(0, 255, 255, 0.3);
            }
            
            .tree-icon:hover::after {
                opacity: 1;
            }
            
            .new-year-widget {
                display: block !important;
            }
            
            @media (max-width: 768px) {
                .new-year-widget:not(.minimized) {
                    top: 10px;
                    left: 10px;
                    padding: 12px;
                    min-width: 180px;
                }
                
                .new-year-widget.minimized {
                    width: 45px;
                    height: 45px;
                    top: 10px;
                    left: 10px;
                }
                
                .widget-title { font-size: 1rem; }
                .time-unit { min-width: 40px; padding: 6px 4px; }
                .number { font-size: 1.1rem; }
                .label { font-size: 0.6rem; }
                .snowflake { font-size: 16px; }
            }
        `;
        
        const styleElement = document.createElement('style');
        styleElement.textContent = styles;
        document.head.appendChild(styleElement);
    }
    
    // Создание HTML структуры
    function createWidget() {
        const widget = document.createElement('div');
        widget.className = 'new-year-widget';
        widget.innerHTML = `
            <div class="tree-icon" data-tooltip="Нажмите, чтобы развернуть">🎄</div>
            <div class="widget-content">
                <button class="minimize-btn" title="Свернуть в иконку">−</button>
                <div class="widget-title">
                    <span>🎄</span>
                    <span>До НГ</span>
                    <span>🎅</span>
                </div>
                <div class="countdown">
                    <div class="time-unit">
                        <span id="ny-days" class="number">00</span>
                        <span class="label">Дн</span>
                    </div>
                    <div class="time-unit">
                        <span id="ny-hours" class="number">00</span>
                        <span class="label">Час</span>
                    </div>
                    <div class="time-unit">
                        <span id="ny-minutes" class="number">00</span>
                        <span class="label">Мин</span>
                    </div>
                    <div class="time-unit">
                        <span id="ny-seconds" class="number">00</span>
                        <span class="label">Сек</span>
                    </div>
                </div>
                <div id="ny-message" class="message"></div>
            </div>
        `;
        
        const snowflakesContainer = document.createElement('div');
        snowflakesContainer.className = 'snowflakes-container';
        snowflakesContainer.id = 'ny-snowflakes';
        
        document.body.appendChild(widget);
        document.body.appendChild(snowflakesContainer);
        
        return widget;
    }
    
    // Снежинки
    function createSnowflakes() {
        const container = document.getElementById('ny-snowflakes');
        if (!container) return;
        
        const snowflakes = ['❄️', '❅', '❆', '＊', '·'];
        
        for (let i = 0; i < CONFIG.snowflakes; i++) {
            const snowflake = document.createElement('div');
            snowflake.innerHTML = snowflakes[Math.floor(Math.random() * snowflakes.length)];
            snowflake.className = 'snowflake';
            
            snowflake.style.left = `${Math.random() * 100}%`;
            snowflake.style.fontSize = `${12 + Math.random() * 16}px`;
            snowflake.style.animationDuration = `${5 + Math.random() * 10}s`;
            snowflake.style.animationDelay = `${Math.random() * 5}s`;
            snowflake.style.opacity = 0.3 + Math.random() * 0.7;
            
            container.appendChild(snowflake);
        }
    }
    
    // Фейерверки
    function createMiniFirework(x, y, color) {
        if (!CONFIG.enableFireworks) return;
        
        const firework = document.createElement('div');
        firework.className = 'mini-firework';
        firework.style.left = `${x}px`;
        firework.style.top = `${y}px`;
        firework.style.backgroundColor = color;
        
        document.body.appendChild(firework);
        
        setTimeout(() => firework.remove(), 800);
    }
    
    // Случайные фейерверки
    function randomMiniFireworks() {
        if (!CONFIG.enableFireworks) return;
        if (Math.random() > 0.8) {
            const widget = document.querySelector('.new-year-widget');
            if (!widget) return;
            
            const rect = widget.getBoundingClientRect();
            const colors = ['#00ffff', '#ff00ff', '#ffff00'];
            createMiniFirework(
                rect.left + Math.random() * rect.width,
                rect.top + Math.random() * rect.height,
                colors[Math.floor(Math.random() * colors.length)]
            );
        }
    }
    
    // Обновление подсказки
    function updateTreeTooltip(days, hours, minutes, seconds) {
        const treeIcon = document.querySelector('.tree-icon');
        if (!treeIcon) return;
        
        let tooltipText = 'Нажмите, чтобы развернуть';
        
        if (days === 0 && hours === 0 && minutes === 0 && seconds <= 10) {
            tooltipText = seconds === 0 ? 'С НОВЫМ ГОДОМ! 🎉' : `До НГ: ${seconds} сек!`;
        } else if (days === 0) {
            tooltipText = `Сегодня! ${hours}ч ${minutes}м`;
        } else if (days === 1) {
            tooltipText = `Завтра! +${hours}ч`;
        } else if (days < 10) {
            tooltipText = `До НГ: ${days} дн.`;
        } else {
            tooltipText = `До НГ: ${days} дней`;
        }
        
        treeIcon.setAttribute('data-tooltip', tooltipText);
    }
    
    // Основной отсчет
    function updateCountdown() {
        const now = new Date();
        const currentYear = now.getFullYear();
        const nextYear = currentYear + 1;
        const newYear = new Date(`January 1, ${nextYear} 00:00:00`);
        
        const diff = newYear - now;
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        // Обновление чисел
        const daysEl = document.getElementById('ny-days');
        const hoursEl = document.getElementById('ny-hours');
        const minutesEl = document.getElementById('ny-minutes');
        const secondsEl = document.getElementById('ny-seconds');
        
        if (daysEl) daysEl.textContent = days.toString().padStart(2, '0');
        if (hoursEl) hoursEl.textContent = hours.toString().padStart(2, '0');
        if (minutesEl) minutesEl.textContent = minutes.toString().padStart(2, '0');
        if (secondsEl) secondsEl.textContent = seconds.toString().padStart(2, '0');
        
        // Сообщение
        const messageEl = document.getElementById('ny-message');
        if (messageEl) {
            if (days === 0 && hours === 0 && minutes === 0 && seconds <= 10) {
                if (seconds === 0) {
                    messageEl.textContent = '🎉 С НГ! 🎉';
                    messageEl.style.color = '#ff0000';
                    messageEl.style.fontSize = '0.9rem';
                    
                    // Праздничные фейерверки
                    for(let i = 0; i < 10; i++) {
                        setTimeout(() => {
                            const widget = document.querySelector('.new-year-widget');
                            if (!widget) return;
                            const rect = widget.getBoundingClientRect();
                            const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00'];
                            createMiniFirework(
                                rect.left + Math.random() * rect.width,
                                rect.top + Math.random() * rect.height,
                                colors[Math.floor(Math.random() * colors.length)]
                            );
                        }, i * 100);
                    }
                    
                    // Автоматическое разворачивание на Новый год
                    if (CONFIG.autoExpandOnNewYear) {
                        const widget = document.querySelector('.new-year-widget');
                        if (widget && widget.classList.contains('minimized')) {
                            toggleMinimize();
                        }
                    }
                } else {
                    messageEl.textContent = `Через ${seconds} сек!`;
                    messageEl.style.color = '#ffff00';
                }
            } else if (days === 0) {
                messageEl.textContent = 'Сегодня! 🎁';
                messageEl.style.color = '#00ff00';
            } else if (days < 7) {
                messageEl.textContent = 'Скоро! ✨';
                messageEl.style.color = '#ff00ff';
            } else if (days < 30) {
                messageEl.textContent = 'Уже скоро!';
                messageEl.style.color = '#00ffff';
            } else {
                const messages = [
                    'Скоро праздник!',
                    'Новый год близко!',
                    'Готовимся! 🎄',
                    'Волшебство рядом!'
                ];
                messageEl.textContent = messages[Math.floor(Math.random() * messages.length)];
                messageEl.style.color = '#ffffff';
            }
        }
        
        updateTreeTooltip(days, hours, minutes, seconds);
    }
    
    // Свернуть/развернуть
    function toggleMinimize() {
        const widget = document.querySelector('.new-year-widget');
        if (!widget) return;
        
        const isMinimized = widget.classList.toggle('minimized');
        
        if (isMinimized) {
            widget.style.animation = 'minimizeAnimation 0.5s ease forwards';
        } else {
            widget.style.animation = 'slideIn 0.5s ease-out';
        }
        
        setTimeout(() => {
            widget.style.animation = '';
        }, 500);
        
        if (CONFIG.saveState) {
            localStorage.setItem('newYearWidgetMinimized', isMinimized);
        }
    }
    
    // Загрузка состояния
    function loadState() {
        if (!CONFIG.saveState) return;
        
        const widget = document.querySelector('.new-year-widget');
        if (!widget) return;
        
        const isMinimized = localStorage.getItem('newYearWidgetMinimized');
        const savedX = localStorage.getItem('widgetPosX');
        const savedY = localStorage.getItem('widgetPosY');
        
        if (isMinimized === 'true') {
            widget.classList.add('minimized');
        }
        
        if (savedX && savedY) {
            widget.style.left = `${savedX}px`;
            widget.style.top = `${savedY}px`;
        }
    }
    
    // Инициализация перетаскивания
    function initDragAndDrop(widget) {
        let isDragging = false;
        let offsetX, offsetY;
        
        widget.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('minimize-btn') || 
                e.target.classList.contains('tree-icon')) return;
            
            isDragging = true;
            offsetX = e.clientX - widget.getBoundingClientRect().left;
            offsetY = e.clientY - widget.getBoundingClientRect().top;
            widget.style.cursor = 'grabbing';
            widget.style.transition = 'none';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            widget.style.left = `${e.clientX - offsetX}px`;
            widget.style.top = `${e.clientY - offsetY}px`;
            widget.style.right = 'auto';
            widget.style.bottom = 'auto';
            
            if (CONFIG.saveState) {
                localStorage.setItem('widgetPosX', e.clientX - offsetX);
                localStorage.setItem('widgetPosY', e.clientY - offsetY);
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (!isDragging) return;
            isDragging = false;
            widget.style.cursor = '';
            widget.style.transition = 'all 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55)';
        });
    }
    
    // Инициализация
    function init() {
        // Проверяем, не инициализирован ли уже виджет
        if (document.querySelector('.new-year-widget')) {
            console.warn('Новогодний виджет уже инициализирован');
            return;
        }
        
        // Создаем стили
        createStyles();
        
        // Создаем виджет
        const widget = createWidget();
        
        // Инициализируем перетаскивание
        initDragAndDrop(widget);
        
        // Создаем снежинки
        createSnowflakes();
        
        // Начальное обновление счетчика
        updateCountdown();
        
        // Устанавливаем интервалы
        setInterval(updateCountdown, 1000);
        setInterval(randomMiniFireworks, 2000);
        
        // Обработчики событий
        document.querySelector('.minimize-btn')?.addEventListener('click', toggleMinimize);
        document.querySelector('.tree-icon')?.addEventListener('click', () => {
            if (document.querySelector('.new-year-widget')?.classList.contains('minimized')) {
                toggleMinimize();
            }
        });
        
        widget.addEventListener('dblclick', (e) => {
            if (e.target.classList.contains('minimize-btn')) return;
            const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];
            createMiniFirework(
                e.clientX,
                e.clientY,
                colors[Math.floor(Math.random() * colors.length)]
            );
        });
        
        // Загружаем состояние
        loadState();
    }
    
    // Запуск после загрузки страницы
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Экспорт публичного API (если нужно)
    window.NewYearWidget = {
        toggle: toggleMinimize,
        update: updateCountdown,
        config: CONFIG,
        init: init
    };
    
})();