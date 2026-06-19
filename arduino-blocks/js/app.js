// app.js - Главный файл приложения, инициализация и UI

class ArduinoBlocksApp {
    constructor() {
        this.workspace = null;
        this.selectedBoard = null;
        this.generatedCode = '';
        this.init();
    }

    async init() {
        console.log('🚀 Arduino Blocks инициализируется...');
        
        // Сначала загружаем платы
        await boardsManager.loadBoards();
        
        // Инициализируем блоки
        blocksManager.initBlocks();
        
        // Создаем workspace
        this.createWorkspace();
        
        // Заполняем селектор плат
        this.populateBoardSelector();
        
        // Привязываем события
        this.bindEvents();
        
        // Восстанавливаем автосохранение
        this.restoreAutoSave();
        
        console.log('✅ Arduino Blocks готов к работе');
    }

    // Создание Blockly workspace с исправленной конфигурацией
    createWorkspace() {
        // Получаем конфигурацию тулбокса
        const toolboxConfig = this.getEnhancedToolboxConfig();
        
        // Создаем workspace
        this.workspace = Blockly.inject('blockly-workspace', {
            toolbox: toolboxConfig,
            scrollbars: true,
            trashcan: true,
            zoom: {
                controls: true,
                wheel: true,
                startScale: 1.0,
                maxScale: 2,
                minScale: 0.3,
                scaleSpeed: 1.2,
                pinch: true
            },
            grid: {
                spacing: 20,
                length: 3,
                colour: '#404060',
                snap: true
            },
            theme: Blockly.Theme.defineTheme('arduino-dark', {
                'base': Blockly.Themes.Classic,
                'componentStyles': {
                    'workspaceBackgroundColour': '#1e1e2e',
                    'toolboxBackgroundColour': '#282840',
                    'toolboxForegroundColour': '#e0e0e0',
                    'flyoutBackgroundColour': '#313150',
                    'flyoutForegroundColour': '#e0e0e0',
                    'flyoutOpacity': 0.95,
                    'scrollbarColour': '#606080',
                    'scrollbarOpacity': 0.5,
                    'insertionMarkerColour': '#6c5ce7',
                }
            }),
            renderer: 'zelos',
            move: {
                scrollbars: true,
                drag: true,
                wheel: true
            }
        });

        // Добавляем слушатель изменений
        this.workspace.addChangeListener((event) => {
            this.onWorkspaceChange(event);
        });

        // Установка размера
        this.resizeWorkspace();
        window.addEventListener('resize', () => this.resizeWorkspace());
    }

    // Расширенная конфигурация тулбокса с блоками начала/конца
    getEnhancedToolboxConfig() {
        return {
            kind: 'categoryToolbox',
            contents: [
                {
                    kind: 'category',
                    name: '🚀 Программа',
                    colour: '#4CAF50',
                    contents: [
                        {
                            kind: 'block',
                            type: 'arduino_setup_loop',
                            fields: {
                                SETUP_COMMENT: 'Настройка',
                                LOOP_COMMENT: 'Основной цикл'
                            }
                        }
                    ]
                },
                {
                    kind: 'category',
                    name: '⚡ Управление',
                    colour: '#2196F3',
                    contents: [
                        { kind: 'block', type: 'controls_if' },
                        { kind: 'block', type: 'controls_ifelse' },
                        { kind: 'block', type: 'logic_compare' },
                        { kind: 'block', type: 'logic_operation' },
                        { kind: 'block', type: 'logic_negate' },
                        { kind: 'block', type: 'logic_boolean' },
                        { kind: 'sep' },
                        { kind: 'block', type: 'controls_repeat_ext' },
                        { kind: 'block', type: 'controls_whileUntil' },
                        { kind: 'block', type: 'controls_for' },
                        { kind: 'block', type: 'controls_forEach' },
                        { kind: 'sep' },
                        { kind: 'block', type: 'controls_flow_statements' },
                    ]
                },
                {
                    kind: 'category',
                    name: '🔌 Arduino Пины',
                    colour: '#FF9800',
                    contents: [
                        { kind: 'block', type: 'arduino_pin_mode' },
                        { kind: 'block', type: 'arduino_digital_write' },
                        { kind: 'block', type: 'arduino_digital_read' },
                        { kind: 'block', type: 'arduino_analog_write' },
                        { kind: 'block', type: 'arduino_analog_read' },
                        { kind: 'sep' },
                        { kind: 'block', type: 'arduino_tone' },
                        { kind: 'block', type: 'arduino_no_tone' },
                    ]
                },
                {
                    kind: 'category',
                    name: '⏱️ Время',
                    colour: '#9C27B0',
                    contents: [
                        { kind: 'block', type: 'arduino_delay' },
                        { kind: 'block', type: 'arduino_delay_microseconds' },
                        { kind: 'block', type: 'arduino_millis' },
                        { kind: 'block', type: 'arduino_micros' },
                    ]
                },
                {
                    kind: 'category',
                    name: '📡 Коммуникация',
                    colour: '#00BCD4',
                    contents: [
                        { kind: 'block', type: 'arduino_serial_begin' },
                        { kind: 'block', type: 'arduino_serial_print' },
                        { kind: 'block', type: 'arduino_serial_println' },
                        { kind: 'block', type: 'arduino_serial_read' },
                        { kind: 'block', type: 'arduino_serial_available' },
                    ]
                },
                {
                    kind: 'category',
                    name: '🌡️ Сенсоры',
                    colour: '#8BC34A',
                    contents: [
                        { kind: 'block', type: 'sensor_dht_read' },
                        { kind: 'block', type: 'sensor_ultrasonic' },
                        { kind: 'block', type: 'sensor_pir' },
                        { kind: 'block', type: 'sensor_ldr' },
                    ]
                },
                {
                    kind: 'category',
                    name: '🔧 Устройства',
                    colour: '#F44336',
                    contents: [
                        { kind: 'block', type: 'actuator_servo' },
                        { kind: 'block', type: 'actuator_servo_attach' },
                        { kind: 'block', type: 'output_led' },
                        { kind: 'block', type: 'output_rgb_led' },
                        { kind: 'block', type: 'output_buzzer' },
                        { kind: 'block', type: 'output_relay' },
                    ]
                },
                {
                    kind: 'category',
                    name: '📐 Математика',
                    colour: '#3F51B5',
                    contents: [
                        { kind: 'block', type: 'math_number' },
                        { kind: 'block', type: 'math_arithmetic' },
                        { kind: 'block', type: 'math_single' },
                        { kind: 'block', type: 'math_trig' },
                        { kind: 'block', type: 'math_constant' },
                        { kind: 'block', type: 'math_number_property' },
                        { kind: 'block', type: 'math_round' },
                        { kind: 'block', type: 'math_on_list' },
                        { kind: 'sep' },
                        { kind: 'block', type: 'arduino_map' },
                        { kind: 'block', type: 'arduino_constrain' },
                        { kind: 'block', type: 'arduino_random' },
                    ]
                },
                {
                    kind: 'category',
                    name: '📝 Текст',
                    colour: '#607D8B',
                    contents: [
                        { kind: 'block', type: 'text' },
                        { kind: 'block', type: 'text_join' },
                        { kind: 'block', type: 'text_append' },
                        { kind: 'block', type: 'text_length' },
                        { kind: 'block', type: 'text_isEmpty' },
                        { kind: 'block', type: 'text_indexOf' },
                        { kind: 'block', type: 'text_charAt' },
                        { kind: 'block', type: 'text_changeCase' },
                        { kind: 'block', type: 'text_trim' },
                        { kind: 'block', type: 'text_print' },
                    ]
                },
                {
                    kind: 'category',
                    name: '📦 Переменные',
                    custom: 'VARIABLE',
                    colour: '#FF5722',
                },
                {
                    kind: 'category',
                    name: '📋 Списки',
                    custom: 'LIST',
                    colour: '#795548',
                },
                {
                    kind: 'category',
                    name: '🔧 Функции',
                    custom: 'PROCEDURE',
                    colour: '#9E9E9E',
                }
            ]
        };
    }

    // Изменение размера workspace
    resizeWorkspace() {
        if (this.workspace) {
            const area = document.querySelector('.workspace-area');
            if (area) {
                const rect = area.getBoundingClientRect();
                document.getElementById('blockly-workspace').style.width = rect.width + 'px';
                document.getElementById('blockly-workspace').style.height = rect.height + 'px';
                Blockly.svgResize(this.workspace);
            }
        }
    }

    // Заполнение выпадающего списка плат
    populateBoardSelector() {
        const selector = document.getElementById('board-selector');
        const boards = boardsManager.getBoardsList();
        
        boards.forEach(board => {
            const option = document.createElement('option');
            option.value = board.id;
            option.textContent = `${board.name} (${board.architecture})`;
            selector.appendChild(option);
        });
    }

    // Выбор платы
    selectBoard(boardId) {
        this.selectedBoard = boardsManager.selectBoard(boardId);
        
        if (this.selectedBoard) {
            document.getElementById('btn-generate').disabled = false;
            document.getElementById('board-info').textContent = 
                `${this.selectedBoard.name} - ${this.selectedBoard.specs.cpu}`;
            console.log('Выбрана плата:', this.selectedBoard.name);
        } else {
            document.getElementById('btn-generate').disabled = true;
            document.getElementById('board-info').textContent = '';
        }
    }

    // Привязка всех событий UI
    bindEvents() {
        // Выбор платы
        document.getElementById('board-selector').addEventListener('change', (e) => {
            this.selectBoard(e.target.value);
        });

        // Генерация кода
        document.getElementById('btn-generate').addEventListener('click', () => {
            this.generateCode();
        });

        // Копирование кода
        document.getElementById('btn-copy').addEventListener('click', () => {
            this.copyCode();
        });

        // Скачивание .ino файла
        document.getElementById('btn-download').addEventListener('click', () => {
            this.downloadCode();
        });

        // Проверка синтаксиса
        document.getElementById('btn-validate').addEventListener('click', () => {
            this.validateCode();
        });

        // Сохранение проекта
        document.getElementById('btn-save').addEventListener('click', () => {
            this.saveProject();
        });

        // Загрузка проекта
        document.getElementById('btn-load').addEventListener('click', () => {
            document.getElementById('file-input').click();
        });

        document.getElementById('file-input').addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.loadProject(e.target.files[0]);
            }
        });

        // Очистка
        document.getElementById('btn-clear').addEventListener('click', () => {
            this.clearWorkspace();
        });

        // Клавиатурные сокращения
        document.addEventListener('keydown', (e) => {
            // Ctrl+G - генерация
            if (e.ctrlKey && e.key === 'g') {
                e.preventDefault();
                this.generateCode();
            }
            // Ctrl+S - сохранение
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveProject();
            }
        });

        // Модальное окно для пользовательских блоков
        this.bindModalEvents();
    }

    // Генерация кода
    generateCode() {
        if (!this.selectedBoard) {
            alert('⚠️ Сначала выберите плату!');
            return;
        }

        try {
            this.generatedCode = arduinoGenerator.generate(this.workspace);
            const codeElement = document.getElementById('generated-code');
            codeElement.textContent = this.generatedCode;
            
            // Подсветка синтаксиса
            this.highlightCode(this.generatedCode);
            
            document.getElementById('btn-copy').disabled = false;
            document.getElementById('btn-download').disabled = false;
            document.getElementById('btn-validate').disabled = false;
            
            console.log('✅ Код успешно сгенерирован');
        } catch (error) {
            console.error('❌ Ошибка генерации кода:', error);
            document.getElementById('generated-code').textContent = 
                `// Ошибка генерации кода:\n// ${error.message}\n// Стек: ${error.stack}`;
        }
    }

    // Простая подсветка синтаксиса
    highlightCode(code) {
        const keywords = ['void', 'setup', 'loop', 'if', 'else', 'for', 'while',
            'int', 'float', 'long', 'char', 'String', 'bool', 'boolean',
            'digitalWrite', 'digitalRead', 'analogWrite', 'analogRead',
            'pinMode', 'delay', 'Serial', 'println', 'begin',
            'HIGH', 'LOW', 'INPUT', 'OUTPUT', 'INPUT_PULLUP'];
        
        let highlighted = code;
        
        // Подсветка комментариев
        highlighted = highlighted.replace(/(\/\/.*)/g, '<span style="color: #6a9955;">$1</span>');
        highlighted = highlighted.replace(/(\/\*[\s\S]*?\*\/)/g, '<span style="color: #6a9955;">$1</span>');
        
        // Подсветка строк
        highlighted = highlighted.replace(/(".*?")/g, '<span style="color: #ce9178;">$1</span>');
        
        // Подсветка чисел
        highlighted = highlighted.replace(/\b(\d+)\b/g, '<span style="color: #b5cea8;">$1</span>');
        
        // Подсветка ключевых слов
        keywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'g');
            highlighted = highlighted.replace(regex, `<span style="color: #569cd6;">${keyword}</span>`);
        });
        
        // Подсветка функций
        highlighted = highlighted.replace(/\b([a-zA-Z_]\w*)\s*\(/g, '<span style="color: #dcdcaa;">$1</span>(');
        
        document.getElementById('generated-code').innerHTML = highlighted;
    }

    // Копирование кода в буфер обмена
    async copyCode() {
        const code = this.generatedCode || document.getElementById('generated-code').textContent;
        try {
            await navigator.clipboard.writeText(code);
            this.showNotification('📋 Код скопирован в буфер обмена!', 'success');
        } catch (error) {
            console.error('Ошибка копирования:', error);
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = code;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            this.showNotification('📋 Код скопирован!', 'success');
        }
    }

    // Скачивание .ino файла
    downloadCode() {
        const code = this.generatedCode || document.getElementById('generated-code').textContent;
        const boardName = this.selectedBoard ? 
            this.selectedBoard.name.toLowerCase().replace(/\s+/g, '_') : 
            'arduino';
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `${boardName}_project_${timestamp}.ino`;
        
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification(`💾 Файл "${filename}" скачан!`, 'success');
    }

    // Проверка синтаксиса
    validateCode() {
        const code = this.generatedCode || document.getElementById('generated-code').textContent;
        const issues = arduinoGenerator.validate(code);
        
        if (issues.length === 0) {
            this.showNotification('✅ Синтаксических ошибок не найдено', 'success');
        } else {
            let message = '⚠️ Найдены проблемы:\n\n';
            issues.forEach(issue => {
                const emoji = issue.type === 'error' ? '❌' : '⚠️';
                message += `${emoji} ${issue.message}\n`;
            });
            alert(message);
        }
    }

    // Сохранение проекта в файл
    saveProject() {
        const xml = Blockly.Xml.workspaceToDom(this.workspace);
        const xmlText = Blockly.Xml.domToText(xml);
        
        const project = {
            name: 'Arduino Project',
            version: '1.0',
            date: new Date().toISOString(),
            board: this.selectedBoard ? this.selectedBoard.name : null,
            boardId: document.getElementById('board-selector').value,
            blockCount: this.workspace.getAllBlocks(false).length,
            xml: xmlText
        };
        
        // Сохраняем в localStorage
        localStorage.setItem('arduino_blocks_project', JSON.stringify(project));
        
        // Также предлагаем скачать файл
        const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `arduino_project_${new Date().toISOString().slice(0, 10)}.ablocks`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('💾 Проект сохранён!', 'success');
    }

    // Загрузка проекта из файла
    loadProject(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const project = JSON.parse(e.target.result);
                
                // Восстановление платы
                if (project.boardId) {
                    document.getElementById('board-selector').value = project.boardId;
                    this.selectBoard(project.boardId);
                }
                
                // Очистка и восстановление блоков
                this.workspace.clear();
                const xml = Blockly.utils.xml.textToDom(project.xml);
                Blockly.Xml.domToWorkspace(xml, this.workspace);
                
                // Восстановление пользовательских блоков если есть
                if (project.customBlocks) {
                    project.customBlocks.forEach(block => {
                        blocksManager.addCustomBlock(block);
                    });
                }
                
                this.showNotification(`📂 Проект "${project.name}" загружен! (${project.blockCount} блоков)`, 'success');
            } catch (error) {
                console.error('Ошибка загрузки:', error);
                alert('❌ Ошибка загрузки файла проекта: ' + error.message);
            }
        };
        
        reader.readAsText(file);
    }

    // Очистка workspace
    clearWorkspace() {
        if (confirm('🗑️ Вы уверены, что хотите очистить все блоки?\nЭто действие нельзя отменить.')) {
            this.workspace.clear();
            this.generatedCode = '';
            document.getElementById('generated-code').innerHTML = 
                '// Выберите плату и соберите программу из блоков\n// Затем нажмите "Сгенерировать код"';
            document.getElementById('btn-copy').disabled = true;
            document.getElementById('btn-download').disabled = true;
            document.getElementById('btn-validate').disabled = true;
            this.showNotification('🗑️ Рабочая область очищена', 'info');
        }
    }

    // Обновление информации при изменении workspace
    onWorkspaceChange(event) {
        const blockCount = this.workspace.getAllBlocks(false).length;
        document.getElementById('workspace-info').textContent = 
            `Блоков: ${blockCount} | Плата: ${this.selectedBoard ? this.selectedBoard.name : 'не выбрана'}`;
        
        // Автосохранение каждые 30 секунд бездействия
        clearTimeout(this.autoSaveTimeout);
        this.autoSaveTimeout = setTimeout(() => {
            this.autoSave();
        }, 30000);
    }

    // Автосохранение
    autoSave() {
        const xml = Blockly.Xml.workspaceToDom(this.workspace);
        const xmlText = Blockly.Xml.domToText(xml);
        localStorage.setItem('arduino_blocks_autosave', xmlText);
        localStorage.setItem('arduino_blocks_autosave_time', new Date().toISOString());
        console.log('💾 Автосохранение выполнено');
    }

    // Восстановление автосохранения
    restoreAutoSave() {
        const saved = localStorage.getItem('arduino_blocks_autosave');
        const savedTime = localStorage.getItem('arduino_blocks_autosave_time');
        
        if (saved && savedTime) {
            try {
                const xml = Blockly.utils.xml.textToDom(saved);
                Blockly.Xml.domToWorkspace(xml, this.workspace);
                this.showNotification(
                    `📂 Восстановлен проект от ${new Date(savedTime).toLocaleString()}`,
                    'info'
                );
            } catch (e) {
                console.log('Не удалось восстановить автосохранение:', e);
            }
        }
    }

    // Модальное окно для пользовательских блоков
    bindModalEvents() {
        const modal = document.getElementById('modal-custom-block');
        const closeBtn = modal.querySelector('.close');
        const form = document.getElementById('custom-block-form');
        
        // Добавляем кнопку в футер
        const addBlockBtn = document.createElement('button');
        addBlockBtn.className = 'btn btn-small';
        addBlockBtn.style.marginLeft = '8px';
        addBlockBtn.textContent = '➕ Свой блок';
        addBlockBtn.addEventListener('click', () => {
            modal.style.display = 'block';
        });
        document.querySelector('.footer-controls').appendChild(addBlockBtn);
        
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const blockData = {
                name: document.getElementById('custom-block-name').value,
                code: document.getElementById('custom-block-code').value,
                category: document.getElementById('custom-block-category').value
            };
            
            blocksManager.addCustomBlock(blockData);
            
            // Обновляем тулбокс
            this.workspace.updateToolbox(this.getEnhancedToolboxConfig());
            
            form.reset();
            modal.style.display = 'none';
            this.showNotification('✅ Пользовательский блок добавлен!', 'success');
        });
    }

    // Уведомления
    showNotification(message, type = 'info') {
        // Удаляем старое уведомление
        const oldNotification = document.querySelector('.app-notification');
        if (oldNotification) {
            oldNotification.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = `app-notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 1000;
            animation: slideInRight 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            font-size: 14px;
            max-width: 400px;
        `;
        
        switch(type) {
            case 'success':
                notification.style.background = '#2e7d32';
                notification.style.color = '#e8f5e9';
                notification.style.border = '1px solid #4caf50';
                break;
            case 'error':
                notification.style.background = '#c62828';
                notification.style.color = '#ffebee';
                notification.style.border = '1px solid #ef5350';
                break;
            case 'warning':
                notification.style.background = '#ef6c00';
                notification.style.color = '#fff3e0';
                notification.style.border = '1px solid #ff9800';
                break;
            default:
                notification.style.background = '#1565c0';
                notification.style.color = '#e3f2fd';
                notification.style.border = '1px solid #42a5f5';
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Добавляем CSS анимации
const animationStyles = document.createElement('style');
animationStyles.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(animationStyles);

// Инициализация приложения при загрузке страницы
window.addEventListener('DOMContentLoaded', () => {
    window.app = new ArduinoBlocksApp();
});

// Экспорт для доступа из консоли
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ArduinoBlocksApp;
}