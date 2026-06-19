// app.js - Главный файл приложения Arduino Blocks Pro

class ArduinoBlocksApp {
    constructor() {
        this.workspace = null;
        this.selectedBoard = null;
        this.generatedCode = '';
        this.settings = this.loadSettings();
        this.autoSaveTimeout = null;
        this.init();
    }

    // Загрузка настроек из localStorage
    loadSettings() {
        const defaults = {
            theme: 'dark',
            fontSize: '14',
            autosave: true,
            grid: true
        };
        
        try {
            const saved = localStorage.getItem('arduino_blocks_settings');
            return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
        } catch {
            return defaults;
        }
    }

    // Сохранение настроек
    saveSettings() {
        localStorage.setItem('arduino_blocks_settings', JSON.stringify(this.settings));
    }

    // Инициализация приложения
	async init() {
		console.log('🚀 Arduino Blocks Pro инициализируется...');
		
		this.showLoading(true);
		
		try {
			// Инициализируем блоки
			blocksManager.initBlocks();
			
			// Загружаем платы
			await boardsManager.loadBoards();
			
			// Создаем workspace
			this.createWorkspace();
			
			// Заполняем UI
			this.populateBoardSelector();
			this.populateBlockCategories();
			
			// Привязываем события
			this.bindEvents();
			
			// Восстанавливаем автосохранение
			if (this.settings.autosave) {
				this.restoreAutoSave();
			}
			
			// Применяем настройки (с задержкой для уверенности)
			setTimeout(() => {
				try {
					this.applySettings();
				} catch (e) {
					console.warn('Ошибка применения настроек:', e);
				}
			}, 500);
			
			// Обновляем часы
			this.updateClock();
			setInterval(() => this.updateClock(), 1000);
			
			console.log('✅ Arduino Blocks Pro готов к работе');
		} catch (error) {
			console.error('❌ Ошибка инициализации:', error);
			this.showToast('Ошибка загрузки приложения: ' + error.message, 'error');
		}
		
		// Скрываем загрузочный экран
		setTimeout(() => this.showLoading(false), 800);
	}

    // Показать/скрыть загрузочный экран
    showLoading(show) {
        const loader = document.getElementById('loading-screen');
        const app = document.getElementById('app-container');
        
        if (show) {
            loader.style.display = 'flex';
            app.style.display = 'none';
        } else {
            loader.classList.add('hidden');
            app.style.display = 'flex';
            setTimeout(() => {
                loader.style.display = 'none';
            }, 500);
        }
    }

    // Создание Blockly workspace
	createWorkspace() {
		const toolboxConfig = blocksManager.getToolboxConfig();
		
		this.workspace = Blockly.inject('blockly-workspace', {
			toolbox: toolboxConfig,
			scrollbars: true,
			trashcan: true,
			zoom: {
				controls: false,
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
				colour: '#2a2a4a',
				snap: this.settings.grid
			},
			move: {
				scrollbars: true,
				drag: true,
				wheel: true
			},
			renderer: 'zelos'
		});

		// Применяем тему
		this.applyTheme();
		
		// Слушатель изменений
		this.workspace.addChangeListener((event) => this.onWorkspaceChange(event));
		
		// Установка размера
		this.resizeWorkspace();
		window.addEventListener('resize', () => this.resizeWorkspace());
	}
    // Применение темы Blockly
	applyTheme() {
		if (!this.workspace) return;
		
		try {
			const isDark = this.settings.theme === 'dark';
			
			// Упрощенная установка темы
			const workspaceColor = isDark ? '#0a0a1a' : '#f5f5f5';
			const toolboxColor = isDark ? '#12122a' : '#ffffff';
			const toolboxText = isDark ? '#e8e8f0' : '#333333';
			const flyoutColor = isDark ? '#1a1a3a' : '#ffffff';
			const flyoutText = isDark ? '#e8e8f0' : '#333333';
			
			// Создаем тему
			const theme = Blockly.Theme.defineTheme('custom-theme', {
				'base': Blockly.Themes.Classic,
				'componentStyles': {
					'workspaceBackgroundColour': workspaceColor,
					'toolboxBackgroundColour': toolboxColor,
					'toolboxForegroundColour': toolboxText,
					'flyoutBackgroundColour': flyoutColor,
					'flyoutForegroundColour': flyoutText,
					'flyoutOpacity': isDark ? 0.95 : 1,
					'scrollbarColour': isDark ? '#3a3a5a' : '#cccccc',
					'scrollbarOpacity': 0.5,
					'insertionMarkerColour': '#6c5ce7',
				}
			});
			
			this.workspace.setTheme(theme);
		} catch (error) {
			console.warn('Ошибка применения темы:', error);
		}
	}

    // Изменение размера workspace
    resizeWorkspace() {
        if (this.workspace) {
            const container = document.getElementById('workspace-container');
            if (container) {
                const rect = container.getBoundingClientRect();
                const workspaceDiv = document.getElementById('blockly-workspace');
                workspaceDiv.style.width = rect.width + 'px';
                workspaceDiv.style.height = rect.height + 'px';
                Blockly.svgResize(this.workspace);
            }
        }
    }

    // Заполнение селектора плат
    populateBoardSelector() {
        const selector = document.getElementById('board-selector');
        const boards = boardsManager.getBoardsList();
        
        // Сохраняем первый элемент (placeholder)
        selector.innerHTML = '<option value="">🔌 Выберите плату...</option>';
        
        boards.forEach(board => {
            const option = document.createElement('option');
            option.value = board.id;
            option.textContent = `${board.name} (${board.architecture})`;
            option.title = `${board.manufacturer}\nCPU: ${board.specs.cpu}\nClock: ${board.specs.clock}`;
            selector.appendChild(option);
        });
    }

    // Заполнение категорий блоков в левой панели
    populateBlockCategories() {
        const container = document.getElementById('blocks-categories');
        if (!container) return;
        
        container.innerHTML = '';
        
        blocksManager.blockCategories.forEach(category => {
            const catDiv = document.createElement('div');
            catDiv.className = 'block-category';
            catDiv.dataset.category = category.id;
            
            const header = document.createElement('div');
            header.className = 'block-category-header';
            header.innerHTML = `<i class="fas ${category.icon}"></i> ${category.name}`;
            
            const items = document.createElement('div');
            items.className = 'block-category-items';
            
            if (category.id === 'variables') {
                // Специальная обработка для переменных
                const item = document.createElement('div');
                item.className = 'block-item';
                item.textContent = 'Создать переменную...';
                item.onclick = () => {
                    Blockly.Variables.createVariableButtonHandler(this.workspace);
                };
                items.appendChild(item);
            } else if (category.id === 'functions') {
                const item = document.createElement('div');
                item.className = 'block-item';
                item.textContent = 'Создать функцию...';
                item.onclick = () => {
                    Blockly.Procedures.createProcedureButtonHandler(this.workspace);
                };
                items.appendChild(item);
            } else {
                category.blocks.forEach(blockType => {
                    const blockName = blocksManager.getBlockName(blockType);
                    if (blockName) {
                        const item = document.createElement('div');
                        item.className = 'block-item';
                        item.textContent = blockName;
                        item.title = blockName;
                        item.draggable = true;
                        item.dataset.blockType = blockType;
                        
                        // Drag & Drop на workspace
                        item.addEventListener('dragstart', (e) => {
                            e.dataTransfer.setData('blockType', blockType);
                            e.dataTransfer.effectAllowed = 'copy';
                        });
                        
                        items.appendChild(item);
                    }
                });
            }
            
            // Клик по заголовку раскрывает/скрывает категорию
            header.addEventListener('click', () => {
                catDiv.classList.toggle('open');
            });
            
            catDiv.appendChild(header);
            catDiv.appendChild(items);
            container.appendChild(catDiv);
            
            // Первая категория открыта по умолчанию
            if (category.id === 'program') {
                catDiv.classList.add('open');
            }
        });
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

        // Копирование
        document.getElementById('btn-copy').addEventListener('click', () => {
            this.copyCode();
        });

        // Скачивание
        document.getElementById('btn-download').addEventListener('click', () => {
            this.downloadCode();
        });

        // Валидация
        document.getElementById('btn-validate').addEventListener('click', () => {
            this.validateCode();
        });

        // Сохранение
        document.getElementById('btn-save').addEventListener('click', () => {
            this.saveProject();
        });

        // Загрузка
        document.getElementById('btn-load').addEventListener('click', () => {
            document.getElementById('file-input').click();
        });

        document.getElementById('file-input').addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.loadProject(e.target.files[0]);
                e.target.value = ''; // Сброс чтобы можно было загрузить тот же файл
            }
        });

        // Отмена/повтор
        document.getElementById('btn-undo').addEventListener('click', () => {
            this.workspace.undo(false);
        });

        document.getElementById('btn-redo').addEventListener('click', () => {
            this.workspace.undo(true);
        });

        // Зум
        document.getElementById('btn-zoom-in').addEventListener('click', () => {
            this.workspace.zoomCenter(1);
        });

        document.getElementById('btn-zoom-out').addEventListener('click', () => {
            this.workspace.zoomCenter(-1);
        });

        document.getElementById('btn-zoom-fit').addEventListener('click', () => {
            this.workspace.zoomToFit();
        });

        // Сворачивание боковой панели
        document.getElementById('btn-toggle-sidebar').addEventListener('click', () => {
            const sidebar = document.getElementById('sidebar-left');
            sidebar.classList.toggle('collapsed');
            const icon = document.querySelector('#btn-toggle-sidebar i');
            if (sidebar.classList.contains('collapsed')) {
                icon.className = 'fas fa-chevron-right';
            } else {
                icon.className = 'fas fa-chevron-left';
            }
            setTimeout(() => this.resizeWorkspace(), 300);
        });

        // Вкладки кода
        document.querySelectorAll('.code-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.code-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                const tabName = tab.dataset.tab;
                document.getElementById('generated-code').style.display = tabName === 'code' ? 'block' : 'none';
                document.getElementById('code-preview').style.display = tabName === 'preview' ? 'block' : 'none';
            });
        });

        // Кнопки модальных окон
        document.getElementById('btn-settings').addEventListener('click', () => {
            this.openSettings();
        });

        document.getElementById('btn-help').addEventListener('click', () => {
            this.openHelp();
        });

        document.getElementById('btn-add-custom-block').addEventListener('click', () => {
            this.openCustomBlockModal();
        });

        // Закрытие модальных окон
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.closest('.modal').classList.remove('show');
            });
        });

        // Закрытие по клику вне модала
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('show');
                }
            });
        });

        // Сохранение пользовательского блока
        document.getElementById('btn-save-custom').addEventListener('click', () => {
            this.saveCustomBlock();
        });

        document.getElementById('btn-cancel-custom').addEventListener('click', () => {
            document.getElementById('modal-custom-block').classList.remove('show');
        });

        // Настройки
        document.getElementById('btn-save-settings').addEventListener('click', () => {
            this.saveSettingsFromModal();
        });

        document.getElementById('btn-reset-settings').addEventListener('click', () => {
            this.resetSettings();
        });

        // Поиск блоков
        document.getElementById('block-search').addEventListener('input', (e) => {
            this.searchBlocks(e.target.value);
        });

        // Drag & Drop на workspace
        const workspaceDiv = document.getElementById('blockly-workspace');
        workspaceDiv.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });

        workspaceDiv.addEventListener('drop', (e) => {
            e.preventDefault();
            const blockType = e.dataTransfer.getData('blockType');
            if (blockType) {
                this.dropBlockOnWorkspace(blockType, e);
            }
        });

        // Горячие клавиши
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
            // Ctrl+Z - отмена
            if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.workspace.undo(false);
            }
            // Ctrl+Y или Ctrl+Shift+Z - повтор
            if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
                e.preventDefault();
                this.workspace.undo(true);
            }
            // Delete - удалить выделенный блок
            if (e.key === 'Delete' && document.activeElement === document.body) {
                const selected = Blockly.getSelected();
                if (selected && selected.isDeletable()) {
                    selected.dispose(true);
                }
            }
        });
    }

    // Выбор платы
    selectBoard(boardId) {
        if (!boardId) {
            this.selectedBoard = null;
            document.getElementById('btn-generate').disabled = true;
            document.getElementById('board-badge').style.display = 'none';
            document.getElementById('status-board').textContent = 'Не выбрана';
            return;
        }

        this.selectedBoard = boardsManager.selectBoard(boardId);
        
        if (this.selectedBoard) {
            document.getElementById('btn-generate').disabled = false;
            
            const badge = document.getElementById('board-badge');
            badge.style.display = 'inline-block';
            document.getElementById('board-badge-text').textContent = 
                `${this.selectedBoard.name} | ${this.selectedBoard.specs.cpu}`;
            
            document.getElementById('status-board').textContent = this.selectedBoard.name;
            
            this.showToast(
                `Плата выбрана: ${this.selectedBoard.name} (${this.selectedBoard.specs.cpu})`,
                'info'
            );
        }
    }

    // Бросок блока на workspace
    dropBlockOnWorkspace(blockType, event) {
        const workspaceDiv = document.getElementById('blockly-workspace');
        const rect = workspaceDiv.getBoundingClientRect();
        
        // Переводим координаты в координаты workspace
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Конвертируем в координаты Blockly
        const wsCoords = this.workspace.getMetrics();
        const blockX = x - wsCoords.viewLeft;
        const blockY = y - wsCoords.viewTop;
        
        // Создаем блок
        try {
            const block = this.workspace.newBlock(blockType);
            block.initSvg();
            block.render();
            
            // Позиционируем
            block.moveBy(blockX, blockY);
            
            this.showToast(`Блок добавлен: ${blocksManager.getBlockName(blockType)}`, 'success');
        } catch (error) {
            console.error('Ошибка создания блока:', error);
            this.showToast('Ошибка создания блока', 'error');
        }
    }

    // Поиск блоков
    searchBlocks(query) {
        const categories = document.querySelectorAll('.block-category');
        
        if (!query.trim()) {
            // Показываем все
            categories.forEach(cat => {
                cat.style.display = '';
                const items = cat.querySelectorAll('.block-item');
                items.forEach(item => item.style.display = '');
            });
            return;
        }
        
        const results = blocksManager.searchBlocks(query);
        
        categories.forEach(cat => {
            const catId = cat.dataset.category;
            const found = results.find(r => r.category.id === catId);
            
            if (found) {
                cat.style.display = '';
                cat.classList.add('open');
                
                const items = cat.querySelectorAll('.block-item');
                items.forEach(item => {
                    const blockName = item.textContent.toLowerCase();
                    if (blockName.includes(query.toLowerCase())) {
                        item.style.display = '';
                        item.style.background = 'rgba(108, 92, 231, 0.3)';
                    } else {
                        item.style.display = 'none';
                    }
                });
            } else {
                cat.style.display = 'none';
            }
        });
    }

    // Генерация кода
	generateCode() {
		if (!this.selectedBoard) {
			this.showToast('⚠️ Сначала выберите плату!', 'warning');
			return;
		}

		try {
			this.generatedCode = arduinoGenerator.generate(this.workspace);
			
			const codeElement = document.getElementById('generated-code');
			const codePreview = document.getElementById('code-preview');
			
			if (codeElement) {
				codeElement.style.display = 'block';
			}
			if (codePreview) {
				codePreview.style.display = 'none';
			}
			
			// Активируем вкладку "Код"
			document.querySelectorAll('.code-tab').forEach(t => t.classList.remove('active'));
			const codeTab = document.querySelector('.code-tab[data-tab="code"]');
			if (codeTab) {
				codeTab.classList.add('active');
			}
			
			// Вставляем код с подсветкой
			if (codeElement) {
				codeElement.innerHTML = this.highlightCode(this.generatedCode);
			}
			
			// Обновляем статистику
			this.updateCodeStats(this.generatedCode);
			
			// Активируем кнопки
			const btnCopy = document.getElementById('btn-copy');
			const btnDownload = document.getElementById('btn-download');
			const btnValidate = document.getElementById('btn-validate');
			
			if (btnCopy) btnCopy.disabled = false;
			if (btnDownload) btnDownload.disabled = false;
			if (btnValidate) btnValidate.disabled = false;
			
			// Скрываем ошибки
			const errorConsole = document.getElementById('error-console');
			if (errorConsole) {
				errorConsole.style.display = 'none';
			}
			
			this.showToast('✅ Код успешно сгенерирован!', 'success');
		} catch (error) {
			console.error('❌ Ошибка генерации:', error);
			
			// Показываем ошибку в консоли
			const errorConsole = document.getElementById('error-console');
			const errorList = document.getElementById('error-list');
			const codeElement = document.getElementById('generated-code');
			
			if (errorConsole && errorList) {
				errorConsole.style.display = 'block';
				errorList.innerHTML = 
					`<div class="error-item">❌ ${error.message}</div>`;
			}
			
			if (codeElement) {
				codeElement.textContent = `// Ошибка генерации кода:\n// ${error.message}\n// Проверьте правильность блоков`;
			}
			
			this.showToast('❌ Ошибка генерации кода!', 'error');
		}
	}

    // Подсветка синтаксиса Arduino кода
    highlightCode(code) {
        // Экранируем HTML
        let html = code
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        
        // Ключевые слова
        const keywords = [
            'void', 'setup', 'loop', 'if', 'else', 'for', 'while', 'return',
            'int', 'float', 'long', 'char', 'String', 'bool', 'boolean', 'byte',
            'const', 'static', 'unsigned', 'signed', 'volatile',
            'HIGH', 'LOW', 'INPUT', 'OUTPUT', 'INPUT_PULLUP',
            'true', 'false', 'NULL'
        ];
        
        // Функции Arduino
        const arduinoFuncs = [
            'pinMode', 'digitalWrite', 'digitalRead', 'analogWrite', 'analogRead',
            'delay', 'delayMicroseconds', 'millis', 'micros',
            'Serial', 'begin', 'print', 'println', 'read', 'available',
            'tone', 'noTone', 'map', 'constrain', 'random',
            'attach', 'write', 'readTemperature', 'readHumidity'
        ];
        
        // Комментарии (однострочные)
        html = html.replace(/(\/\/.*$)/gm, '<span style="color: #6a9955;">$1</span>');
        
        // Многострочные комментарии
        html = html.replace(/(\/\*[\s\S]*?\*\/)/g, '<span style="color: #6a9955;">$1</span>');
        
        // Строки
        html = html.replace(/(&quot;.*?&quot;)/g, '<span style="color: #ce9178;">$1</span>');
        html = html.replace(/(".*?")/g, '<span style="color: #ce9178;">$1</span>');
        
        // Директивы препроцессора
        html = html.replace(/^(#\w+.*$)/gm, '<span style="color: #9b9b9b;">$1</span>');
        
        // Числа
        html = html.replace(/\b(\d+\.?\d*)\b/g, '<span style="color: #b5cea8;">$1</span>');
        
        // Arduino функции
        arduinoFuncs.forEach(func => {
            const regex = new RegExp(`\\b${func}\\b(?=\\s*\\()`, 'g');
            html = html.replace(regex, `<span style="color: #dcdcaa;">${func}</span>`);
        });
        
        // Ключевые слова
        keywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'g');
            html = html.replace(regex, `<span style="color: #569cd6;">${keyword}</span>`);
        });
        
        // Типы данных (отдельно)
        html = html.replace(/\b(int|float|long|char|String|bool|byte)\b/g, 
            '<span style="color: #4ec9b0;">$1</span>');
        
        return html;
    }

    // Обновление статистики кода
    updateCodeStats(code) {
        const lines = code.split('\n').length;
        const size = new Blob([code]).size;
        
        document.getElementById('stat-lines').textContent = lines;
        document.getElementById('stat-size').textContent = this.formatSize(size);
        document.getElementById('code-stats').style.display = 'flex';
    }

    formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    // Копирование кода
    async copyCode() {
        const code = this.generatedCode || document.getElementById('generated-code').textContent;
        try {
            await navigator.clipboard.writeText(code);
            this.showToast('📋 Код скопирован в буфер обмена!', 'success');
        } catch (error) {
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = code;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            this.showToast('📋 Код скопирован!', 'success');
        }
    }

    // Скачивание .ino файла
    downloadCode() {
        const code = this.generatedCode || document.getElementById('generated-code').textContent;
        const boardName = this.selectedBoard 
            ? this.selectedBoard.name.toLowerCase().replace(/\s+/g, '_') 
            : 'arduino';
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `${boardName}_project_${timestamp}.ino`;
        
        const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast(`💾 Файл "${filename}" сохранен!`, 'success');
    }

    // Валидация кода
    validateCode() {
        const code = this.generatedCode || document.getElementById('generated-code').textContent;
        const issues = arduinoGenerator.validate(code);
        
        const errorConsole = document.getElementById('error-console');
        const errorList = document.getElementById('error-list');
        
        if (issues.length === 0) {
            errorConsole.style.display = 'none';
            this.showToast('✅ Синтаксических ошибок не найдено!', 'success');
        } else {
            errorConsole.style.display = 'block';
            errorList.innerHTML = issues.map(issue => 
                `<div class="error-item">
                    ${issue.type === 'error' ? '❌' : '⚠️'} ${issue.message}
                </div>`
            ).join('');
            
            const errorCount = issues.filter(i => i.type === 'error').length;
            const warnCount = issues.filter(i => i.type === 'warning').length;
            
            this.showToast(
                `Найдено: ${errorCount} ошибок, ${warnCount} предупреждений`,
                errorCount > 0 ? 'error' : 'warning'
            );
        }
    }

    // Сохранение проекта
    saveProject() {
        const xml = Blockly.Xml.workspaceToDom(this.workspace);
        const xmlText = Blockly.Xml.domToText(xml);
        
        const project = {
            name: 'Arduino Blocks Project',
            version: '2.0',
            date: new Date().toISOString(),
            board: this.selectedBoard ? this.selectedBoard.name : null,
            boardId: document.getElementById('board-selector').value || null,
            blockCount: this.workspace.getAllBlocks(false).length,
            xml: xmlText,
            customBlocks: blocksManager.customBlocks
        };
        
        // Сохраняем в localStorage
        localStorage.setItem('arduino_blocks_project_v2', JSON.stringify(project));
        
        // Предлагаем скачать файл
        const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `arduino_project_${new Date().toISOString().slice(0, 10)}.ablocks`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('💾 Проект успешно сохранен!', 'success');
    }

    // Загрузка проекта
    loadProject(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const project = JSON.parse(e.target.result);
                
                // Восстанавливаем плату
                if (project.boardId) {
                    document.getElementById('board-selector').value = project.boardId;
                    this.selectBoard(project.boardId);
                }
                
                // Восстанавливаем пользовательские блоки
                if (project.customBlocks) {
                    blocksManager.customBlocks = project.customBlocks;
                    blocksManager.saveCustomBlocks();
                    blocksManager.initBlocks();
                }
                
                // Очищаем и загружаем блоки
                this.workspace.clear();
                const xml = Blockly.utils.xml.textToDom(project.xml);
                Blockly.Xml.domToWorkspace(xml, this.workspace);
                
                // Обновляем тулбокс
                this.workspace.updateToolbox(blocksManager.getToolboxConfig());
                
                this.showToast(
                    `📂 Проект "${project.name}" загружен! (${project.blockCount || 0} блоков)`,
                    'success'
                );
            } catch (error) {
                console.error('Ошибка загрузки:', error);
                this.showToast('❌ Ошибка загрузки файла проекта', 'error');
            }
        };
        
        reader.readAsText(file);
    }

    // Автосохранение
    autoSave() {
        if (!this.settings.autosave) return;
        
        const xml = Blockly.Xml.workspaceToDom(this.workspace);
        const xmlText = Blockly.Xml.domToText(xml);
        localStorage.setItem('arduino_blocks_autosave_v2', xmlText);
        localStorage.setItem('arduino_blocks_autosave_time', new Date().toISOString());
        
        document.getElementById('status-autosave').innerHTML = 
            '<i class="fas fa-check"></i> Автосохранено';
    }

    // Восстановление автосохранения
    restoreAutoSave() {
        const saved = localStorage.getItem('arduino_blocks_autosave_v2');
        const savedTime = localStorage.getItem('arduino_blocks_autosave_time');
        
        if (saved) {
            try {
                const xml = Blockly.utils.xml.textToDom(saved);
                Blockly.Xml.domToWorkspace(xml, this.workspace);
                
                if (savedTime) {
                    const time = new Date(savedTime);
                    document.getElementById('status-autosave').innerHTML = 
                        `<i class="fas fa-history"></i> Восстановлено ${time.toLocaleTimeString()}`;
                }
                
                console.log('📂 Автосохранение восстановлено');
            } catch (e) {
                console.log('Не удалось восстановить автосохранение:', e);
            }
        }
    }

    // Обновление при изменении workspace
    onWorkspaceChange(event) {
        const blockCount = this.workspace.getAllBlocks(false).length;
        document.getElementById('status-blocks').textContent = blockCount;
        
        // Автосохранение с задержкой
        if (this.settings.autosave) {
            clearTimeout(this.autoSaveTimeout);
            this.autoSaveTimeout = setTimeout(() => this.autoSave(), 3000);
        }
        
        // Скрываем/показываем подсказку
        const hint = document.getElementById('workspace-hint');
        if (blockCount > 0) {
            hint.classList.add('hidden');
        } else {
            hint.classList.remove('hidden');
        }
    }

    // Модальное окно пользовательского блока
    openCustomBlockModal() {
        document.getElementById('modal-custom-block').classList.add('show');
    }

    saveCustomBlock() {
        const name = document.getElementById('custom-block-name').value.trim();
        const code = document.getElementById('custom-block-code').value.trim();
        const category = document.getElementById('custom-block-category').value;
        const type = document.getElementById('custom-block-type').value;
        const color = document.getElementById('custom-block-color').value;
        
        if (!name || !code) {
            this.showToast('⚠️ Заполните название и код блока!', 'warning');
            return;
        }
        
        const blockData = { name, code, category, type, color };
        const newBlock = blocksManager.addCustomBlock(blockData);
        
        // Обновляем категории в UI
        this.populateBlockCategories();
        
        // Обновляем тулбокс Blockly
        this.workspace.updateToolbox(blocksManager.getToolboxConfig());
        
        // Закрываем модалку
        document.getElementById('modal-custom-block').classList.remove('show');
        
        // Очищаем форму
        document.getElementById('custom-block-name').value = '';
        document.getElementById('custom-block-code').value = '';
        
        this.showToast(`✅ Блок "${name}" создан!`, 'success');
    }

    // Настройки
    openSettings() {
        document.getElementById('setting-theme').value = this.settings.theme;
        document.getElementById('setting-font-size').value = this.settings.fontSize;
        document.getElementById('setting-autosave').checked = this.settings.autosave;
        document.getElementById('setting-grid').checked = this.settings.grid;
        
        document.getElementById('modal-settings').classList.add('show');
    }

    saveSettingsFromModal() {
        const newTheme = document.getElementById('setting-theme').value;
        const newFontSize = document.getElementById('setting-font-size').value;
        const newAutosave = document.getElementById('setting-autosave').checked;
        const newGrid = document.getElementById('setting-grid').checked;
        
        const needsReload = this.settings.theme !== newTheme;
        
        this.settings = {
            theme: newTheme,
            fontSize: newFontSize,
            autosave: newAutosave,
            grid: newGrid
        };
        
        this.saveSettings();
        this.applySettings();
        
        document.getElementById('modal-settings').classList.remove('show');
        
        if (needsReload) {
            this.showToast('⚙️ Настройки сохранены. Тема изменится после перезагрузки.', 'info');
        } else {
            this.showToast('⚙️ Настройки сохранены!', 'success');
        }
    }

    resetSettings() {
        this.settings = {
            theme: 'dark',
            fontSize: '14',
            autosave: true,
            grid: true
        };
        
        document.getElementById('setting-theme').value = 'dark';
        document.getElementById('setting-font-size').value = '14';
        document.getElementById('setting-autosave').checked = true;
        document.getElementById('setting-grid').checked = true;
        
        this.saveSettings();
        this.applySettings();
        this.showToast('⚙️ Настройки сброшены!', 'info');
    }

	applySettings() {
		// Размер шрифта кода
		const codeOutput = document.getElementById('generated-code');
		if (codeOutput) {
			codeOutput.style.fontSize = this.settings.fontSize + 'px';
		}
		
		// Сетка - проверяем что workspace существует и имеет правильное API
		if (this.workspace && this.workspace.options) {
			if (this.settings.grid) {
				this.workspace.options.gridPattern = Blockly.Grid?.createDom
					? Blockly.Grid.createDom(20, 3, '#2a2a4a', this.workspace.options.gridLength || 3)
					: null;
			} else {
				this.workspace.options.gridPattern = null;
			}
		}
	}

    // Справка
    openHelp() {
        document.getElementById('modal-help').classList.add('show');
    }

    // Часы в статус-баре
    updateClock() {
        const now = new Date();
        document.getElementById('status-time').textContent = 
            now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }

    // Toast уведомления
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i> ${message}`;
        container.appendChild(toast);
        
        // Анимация удаления
        setTimeout(() => {
            toast.classList.add('toast-removing');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Инициализация при загрузке страницы
window.addEventListener('DOMContentLoaded', () => {
    window.arduinoApp = new ArduinoBlocksApp();
});

// Экспорт для использования в консоли разработчика
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ArduinoBlocksApp;
}