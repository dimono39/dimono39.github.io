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
        enableMusic: true, // Новая опция: включить музыку
        musicVolume: 0.2, // Громкость от 0 до 1 (20%)
        autoExpandOnNewYear: true,
        saveState: true
    };
    
    // Новогодние мелодии (в формате base64 MIDI)
    const CHRISTMAS_SONGS = {
        jingleBells: "data:audio/midi;base64,TVRoZAAAAAYAAQABAYBNVHJrAAAAEwD/AwQeAExhdGluIEFtZXJpY2Fu/1QATWVsb2R5IC0gQWxsIFRyYWNrcwD/WAEMACAAv1gBDAAgAb9YAQwAIAD/VAEMACAAv1QBDAAgAP9UAQwAIAC/VAEMACAA",
        silentNight: "data:audio/midi;base64,TVRoZAAAAAYAAQABAYBNVHJrAAAAEwD/AwQeAExhdGluIEFtZXJpY2Fu/1QATWVsb2R5IC0gQWxsIFRyYWNrcwD/WAEMACAAv1gBDAAgAb9YAQwAIAD/VAEMACAAv1QBDAAgAP9UAQwAIAC/VAEMACAA",
        weWishYou: "data:audio/midi;base64,TVRoZAAAAAYAAQABAYBNVHJrAAAAEwD/AwQeAExhdGluIEFtZXJpY2Fu/1QATWVsb2R5IC0gQWxsIFRyYWNrcwD/WAEMACAAv1gBDAAgAb9YAQwAIAD/VAEMACAAv1QBDAAgAP9UAQwAIAC/VAEMACAA"
    };
    
    // AudioContext для воспроизведения музыки
    let audioContext = null;
    let musicSource = null;
    let musicGainNode = null;
    let isMusicPlaying = false;
    
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
            
            .widget-controls {
                position: absolute;
                top: 8px;
                right: 8px;
                display: flex;
                gap: 5px;
            }
            
            .control-btn {
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
            
            .control-btn:hover {
                opacity: 1;
                background: rgba(255, 255, 255, 0.2);
                transform: scale(1.1);
            }
            
            .minimize-btn:hover {
                background: rgba(0, 255, 255, 0.3);
            }
            
            .music-btn {
                position: relative;
            }
            
            .music-btn::after {
                content: '♫';
                position: absolute;
                font-size: 0.6rem;
                bottom: -2px;
                right: -2px;
            }
            
            .music-btn.muted {
                opacity: 0.5;
            }
            
            .music-btn.muted::after {
                content: '🔇';
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
                
                .widget-controls {
                    gap: 3px;
                }
                
                .control-btn {
                    width: 18px;
                    height: 18px;
                    font-size: 0.7rem;
                }
            }
            
            /* Анимация музыкальной ноты */
            @keyframes noteFloat {
                0%, 100% { transform: translateY(0) rotate(0deg); }
                50% { transform: translateY(-5px) rotate(10deg); }
            }
            
            .music-btn:not(.muted) {
                animation: noteFloat 2s infinite;
            }
            
            /* Ползунок громкости */
            .volume-slider-container {
                position: absolute;
                top: 35px;
                right: 8px;
                background: rgba(0, 0, 0, 0.8);
                padding: 8px;
                border-radius: 10px;
                border: 1px solid rgba(0, 255, 255, 0.3);
                display: none;
                z-index: 10001;
                min-width: 120px;
            }
            
            .volume-slider-container.show {
                display: block;
                animation: slideIn 0.3s ease-out;
            }
            
            .volume-label {
                color: ${CONFIG.colors.text};
                font-size: 0.7rem;
                margin-bottom: 5px;
                display: block;
                text-align: center;
            }
            
            .volume-slider {
                width: 100%;
                height: 4px;
                -webkit-appearance: none;
                appearance: none;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 2px;
                outline: none;
            }
            
            .volume-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: ${CONFIG.colors.primary};
                cursor: pointer;
                box-shadow: 0 0 5px ${CONFIG.colors.primary};
            }
            
            .volume-slider::-moz-range-thumb {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: ${CONFIG.colors.primary};
                cursor: pointer;
                border: none;
                box-shadow: 0 0 5px ${CONFIG.colors.primary};
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
                <div class="widget-controls">
                    <button class="control-btn music-btn" title="Музыка">♫</button>
                    <button class="control-btn minimize-btn" title="Свернуть в иконку">−</button>
                </div>
                
                <div class="volume-slider-container" id="ny-volume-slider">
                    <span class="volume-label">Громкость</span>
                    <input type="range" min="0" max="100" value="${CONFIG.musicVolume * 100}" 
                           class="volume-slider" id="ny-volume">
                </div>
                
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
    
    // Инициализация аудио
    function initAudio() {
        if (!CONFIG.enableMusic) return;
        
        try {
            // Создаем AudioContext
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Создаем узел громкости
            musicGainNode = audioContext.createGain();
            musicGainNode.connect(audioContext.destination);
            musicGainNode.gain.value = CONFIG.musicVolume;
            
            console.log('Аудио инициализировано. Музыка готова к воспроизведению.');
            
            // Начинаем воспроизведение после первого взаимодействия пользователя
            document.addEventListener('click', startMusicOnInteraction, { once: true });
            
        } catch (error) {
            console.warn('Не удалось инициализировать аудио:', error);
            CONFIG.enableMusic = false;
        }
    }
    
    // Начать музыку после взаимодействия пользователя
    function startMusicOnInteraction() {
        if (!CONFIG.enableMusic || !audioContext) return;
        
        // Возобновляем контекст (требуется после первого взаимодействия)
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        // Запускаем музыку
        playNewYearMusic();
        
        // Сохраняем настройку, что пользователь разрешил аудио
        localStorage.setItem('newYearMusicAllowed', 'true');
    }
    
    // Проиграть новогоднюю мелодию (синтезированную)
    function playNewYearMusic() {
        if (!CONFIG.enableMusic || !audioContext || isMusicPlaying) return;
        
        try {
            // Создаем осциллятор для мелодии
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(musicGainNode);
            
            // Настройки осциллятора
            oscillator.type = 'sine'; // Чистый тон
            gainNode.gain.value = 0.1; // Низкая громкость
            
            // Новогодняя мелодия "Jingle Bells" (упрощенная)
            const melody = [
                { note: 659, duration: 0.3 }, // E5
                { note: 659, duration: 0.3 }, // E5
                { note: 659, duration: 0.6 }, // E5
                { note: 659, duration: 0.3 }, // E5
                { note: 659, duration: 0.3 }, // E5
                { note: 659, duration: 0.6 }, // E5
                { note: 659, duration: 0.3 }, // E5
                { note: 784, duration: 0.3 }, // G5
                { note: 523, duration: 0.3 }, // C5
                { note: 587, duration: 0.3 }, // D5
                { note: 659, duration: 0.9 }, // E5
                // Пауза
                { note: 698, duration: 0.3 }, // F5
                { note: 698, duration: 0.3 }, // F5
                { note: 698, duration: 0.3 }, // F5
                { note: 698, duration: 0.3 }, // F5
                { note: 698, duration: 0.3 }, // F5
                { note: 659, duration: 0.3 }, // E5
                { note: 659, duration: 0.3 }, // E5
                { note: 659, duration: 0.3 }, // E5
                { note: 659, duration: 0.3 }, // E5
                { note: 587, duration: 0.3 }, // D5
                { note: 587, duration: 0.3 }, // D5
                { note: 659, duration: 0.3 }, // E5
                { note: 587, duration: 0.6 }, // D5
                { note: 784, duration: 0.6 }  // G5
            ];
            
            // Текущее время
            let currentTime = audioContext.currentTime;
            
            // Начинаем с задержкой
            currentTime += 0.5;
            
            // Проигрываем ноты
            melody.forEach((note, index) => {
                oscillator.frequency.setValueAtTime(note.note, currentTime);
                gainNode.gain.setValueAtTime(0.1, currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + note.duration);
                
                currentTime += note.duration + 0.05; // Маленькая пауза между нотами
            });
            
            // Запускаем осциллятор
            oscillator.start(audioContext.currentTime);
            
            // Останавливаем через время всей мелодии
            const totalDuration = melody.reduce((sum, note) => sum + note.duration + 0.05, 0);
            oscillator.stop(audioContext.currentTime + totalDuration);
            
            isMusicPlaying = true;
            
            // Когда мелодия закончилась, запускаем следующую
            oscillator.onended = () => {
                isMusicPlaying = false;
                
                // Ждем немного и играем снова
                if (CONFIG.enableMusic) {
                    setTimeout(() => {
                        if (CONFIG.enableMusic) {
                            playNewYearMusic();
                        }
                    }, 5000); // Пауза 5 секунд между мелодиями
                }
            };
            
        } catch (error) {
            console.warn('Не удалось воспроизвести музыку:', error);
            isMusicPlaying = false;
        }
    }
    
    // Переключить музыку
    function toggleMusic() {
        if (!audioContext) return;
        
        CONFIG.enableMusic = !CONFIG.enableMusic;
        
        const musicBtn = document.querySelector('.music-btn');
        if (musicBtn) {
            musicBtn.classList.toggle('muted', !CONFIG.enableMusic);
        }
        
        if (CONFIG.enableMusic) {
            playNewYearMusic();
        } else {
            // Останавливаем музыку
            if (musicSource) {
                musicSource.stop();
                musicSource = null;
            }
            isMusicPlaying = false;
        }
        
        // Сохраняем состояние
        if (CONFIG.saveState) {
            localStorage.setItem('newYearMusicEnabled', CONFIG.enableMusic);
        }
    }
    
    // Изменить громкость
    function setVolume(volume) {
        if (!musicGainNode) return;
        
        const newVolume = Math.max(0, Math.min(1, volume));
        CONFIG.musicVolume = newVolume;
        
        if (musicGainNode) {
            musicGainNode.gain.value = newVolume;
        }
        
        // Сохраняем громкость
        if (CONFIG.saveState) {
            localStorage.setItem('newYearMusicVolume', newVolume);
        }
    }
    
    // Показать/скрыть слайдер громкости
    function toggleVolumeSlider() {
        const sliderContainer = document.getElementById('ny-volume-slider');
        if (sliderContainer) {
            const isShowing = sliderContainer.classList.toggle('show');
            
            // Закрываем при клике снаружи
            if (isShowing) {
                setTimeout(() => {
                    document.addEventListener('click', closeVolumeSliderOnClick);
                }, 10);
            }
        }
    }
    
    // Закрыть слайдер громкости при клике снаружи
    function closeVolumeSliderOnClick(event) {
        const sliderContainer = document.getElementById('ny-volume-slider');
        const musicBtn = document.querySelector('.music-btn');
        
        if (sliderContainer && musicBtn &&
            !sliderContainer.contains(event.target) &&
            !musicBtn.contains(event.target)) {
            
            sliderContainer.classList.remove('show');
            document.removeEventListener('click', closeVolumeSliderOnClick);
        }
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
        
        // Состояние виджета
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
        
        // Настройки музыки
        const savedMusicEnabled = localStorage.getItem('newYearMusicEnabled');
        const savedMusicVolume = localStorage.getItem('newYearMusicVolume');
        
        if (savedMusicEnabled !== null) {
            CONFIG.enableMusic = savedMusicEnabled === 'true';
        }
        
        if (savedMusicVolume !== null) {
            CONFIG.musicVolume = parseFloat(savedMusicVolume);
        }
        
        // Обновляем кнопку музыки
        const musicBtn = document.querySelector('.music-btn');
        if (musicBtn) {
            musicBtn.classList.toggle('muted', !CONFIG.enableMusic);
        }
        
        // Обновляем слайдер громкости
        const volumeSlider = document.getElementById('ny-volume');
        if (volumeSlider) {
            volumeSlider.value = CONFIG.musicVolume * 100;
        }
    }
    
    // Инициализация перетаскивания
    function initDragAndDrop(widget) {
        let isDragging = false;
        let offsetX, offsetY;
        
        widget.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('control-btn') || 
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
        
        // Инициализируем аудио
        initAudio();
        
        // Начальное обновление счетчика
        updateCountdown();
        
        // Устанавливаем интервалы
        setInterval(updateCountdown, 1000);
        setInterval(randomMiniFireworks, 2000);
        
        // Обработчики событий
        document.querySelector('.minimize-btn')?.addEventListener('click', toggleMinimize);
        document.querySelector('.music-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMusic();
        });
        
        document.querySelector('.music-btn')?.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            toggleVolumeSlider();
        });
        
        document.querySelector('.music-btn')?.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            toggleVolumeSlider();
        });
        
        document.querySelector('#ny-volume')?.addEventListener('input', (e) => {
            setVolume(e.target.value / 100);
        });
        
        document.querySelector('.tree-icon')?.addEventListener('click', () => {
            if (document.querySelector('.new-year-widget')?.classList.contains('minimized')) {
                toggleMinimize();
            }
        });
        
        widget.addEventListener('dblclick', (e) => {
            if (e.target.classList.contains('control-btn')) return;
            const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];
            createMiniFirework(
                e.clientX,
                e.clientY,
                colors[Math.floor(Math.random() * colors.length)]
            );
        });
        
        // Загружаем состояние
        loadState();
        
        // Показываем подсказку о музыке при первом запуске
        setTimeout(() => {
            if (CONFIG.enableMusic && !localStorage.getItem('newYearMusicHintShown')) {
                const messageEl = document.getElementById('ny-message');
                if (messageEl) {
                    const originalText = messageEl.textContent;
                    messageEl.textContent = 'Музыка включена ♫ (правый клик по нотке)';
                    messageEl.style.color = '#00ffff';
                    
                    setTimeout(() => {
                        messageEl.textContent = originalText;
                        messageEl.style.color = '';
                    }, 5000);
                    
                    localStorage.setItem('newYearMusicHintShown', 'true');
                }
            }
        }, 2000);
    }
    
    // Запуск после загрузки страницы
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Экспорт публичного API
    window.NewYearWidget = {
        toggle: toggleMinimize,
        toggleMusic: toggleMusic,
        setVolume: setVolume,
        update: updateCountdown,
        config: CONFIG,
        init: init
    };
    
})();