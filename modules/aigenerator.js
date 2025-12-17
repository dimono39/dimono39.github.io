function generateTasksAutomatically() {
    console.log('🤖 Запуск AI-генерации заданий...');
    
    // Проверяем, есть ли базовые данные
    if (!appData.test.subject || !appData.test.workType) {
        showNotification('Сначала укажите предмет и тип работы в настройках', 'warning');
        showTab('setup');
        return;
    }
    
    const subject = appData.test.subject.toLowerCase();
    const workType = appData.test.workType;
    const theme = appData.test.theme || 'Общая тема';
    const className = appData.test.class || '5';
    
    // Определяем параметры генерации в зависимости от типа работы
    const generationParams = getGenerationParameters(workType, className);
    
    // Получаем шаблоны заданий для предмета
    const taskTemplates = getSubjectTaskTemplates(subject, theme);
    
    if (taskTemplates.length === 0) {
        showNotification('Не найдены шаблоны заданий для этого предмета', 'error');
        return;
    }
    
    // Показываем диалог настройки генерации
    showGenerationDialog(subject, workType, generationParams, taskTemplates);
}

function getGenerationParameters(workType, className) {
    const grade = parseInt(className) || 5;
    
    const params = {
        current: { // Текущая контрольная
            count: 10,
            timePerTask: 3,
            easy: 5,    // 50% базовых
            medium: 3,  // 30% применения
            hard: 2,    // 20% анализа
            creative: 0 // 0% творческих
        },
        milestone: { // Рубежная
            count: 15,
            timePerTask: 4,
            easy: 6,    // 40%
            medium: 5,  // 33%
            hard: 3,    // 20%
            creative: 1 // 7%
        },
        final: { // Итоговая
            count: 20,
            timePerTask: 5,
            easy: 6,    // 30%
            medium: 7,  // 35%
            hard: 5,    // 25%
            creative: 2 // 10%
        },
        oge: { // ОГЭ
            count: 25,
            timePerTask: 6,
            easy: 10,   // 40%
            medium: 10, // 40%
            hard: 5,    // 20%
            creative: 0
        },
        ege: { // ЕГЭ
            count: 30,
            timePerTask: 7,
            easy: 12,   // 40%
            medium: 12, // 40%
            hard: 6,    // 20%
            creative: 0
        },
        vpr: { // ВПР
            count: 12,
            timePerTask: 4,
            easy: 6,    // 50%
            medium: 4,  // 33%
            hard: 2,    // 17%
            creative: 0
        }
    };
    
    // Корректируем в зависимости от класса
    let baseParams = params[workType] || params.current;
    
    if (grade <= 6) {
        // Младшие классы - меньше заданий, проще
        baseParams.count = Math.max(8, Math.round(baseParams.count * 0.7));
        baseParams.timePerTask = Math.max(2, baseParams.timePerTask - 1);
        baseParams.easy = Math.round(baseParams.easy * 1.2);
        baseParams.hard = Math.max(0, Math.round(baseParams.hard * 0.5));
        baseParams.creative = 0;
    } else if (grade >= 10) {
        // Старшие классы - сложнее
        baseParams.count = Math.round(baseParams.count * 1.2);
        baseParams.hard = Math.round(baseParams.hard * 1.5);
        if (workType === 'ege') {
            baseParams.creative = 1;
        }
    }
    
    return baseParams;
}

function getSubjectTaskTemplates(subject, theme) {
    const templates = {
        // Математика
        'математика': [
            {
                level: 1,
                templates: [
                    "Вычислите: {expression}",
                    "Решите уравнение: {equation}",
                    "Найдите значение выражения: {expression}",
                    "Сравните числа: {numbers}",
                    "Округлите число {number} до {place}"
                ],
                skills: ["вычисления", "сравнение чисел", "округление"],
                errorTypes: ["calculation", "attention"]
            },
            {
                level: 2,
                templates: [
                    "Решите задачу: {problem}",
                    "Постройте график функции: {function}",
                    "Найдите площадь фигуры: {figure}",
                    "Решите систему уравнений: {system}",
                    "Преобразуйте выражение: {expression}"
                ],
                skills: ["решение задач", "построение графиков", "нахождение площади"],
                errorTypes: ["application", "conceptual"]
            },
            {
                level: 3,
                templates: [
                    "Докажите, что {statement}",
                    "Проанализируйте график {graph_description}",
                    "Исследуйте функцию {function}",
                    "Составьте уравнение по условию: {condition}",
                    "Сравните различные способы решения {problem_type}"
                ],
                skills: ["доказательство", "анализ", "исследование"],
                errorTypes: ["logical", "conceptual"]
            },
            {
                level: 4,
                templates: [
                    "Придумайте задачу на тему '{theme}'",
                    "Предложите нестандартный способ решения {standard_problem}",
                    "Составьте кроссворд по теме '{theme}'",
                    "Создайте презентацию о {concept}",
                    "Исследуйте реальную ситуацию: {real_world_problem}"
                ],
                skills: ["творчество", "исследование", "проектирование"],
                errorTypes: ["conceptual", "application"]
            }
        ],
        
        // Русский язык
        'русский язык': [
            {
                level: 1,
                templates: [
                    "Вставьте пропущенные буквы: {word_with_gaps}",
                    "Расставьте ударения в словах: {words}",
                    "Подберите проверочное слово к {word}",
                    "Определите род/число/падеж слова {word}",
                    "Разберите слово по составу: {word}"
                ],
                skills: ["орфография", "фонетика", "морфемика"],
                errorTypes: ["factual", "attention"]
            },
            {
                level: 2,
                templates: [
                    "Составьте предложение со словом {word}",
                    "Определите тип предложения: {sentence}",
                    "Найдите грамматическую основу: {sentence}",
                    "Исправьте ошибки в тексте: {text_with_errors}",
                    "Подберите синонимы/антонимы к {word}"
                ],
                skills: ["синтаксис", "стилистика", "лексика"],
                errorTypes: ["application", "conceptual"]
            },
            {
                level: 3,
                templates: [
                    "Проанализируйте текст: {text}",
                    "Определите стиль и тип речи: {text}",
                    "Найдите средства выразительности в тексте: {text}",
                    "Сравните две точки зрения на {topic}",
                    "Напишите сочинение-рассуждение на тему '{theme}'"
                ],
                skills: ["анализ текста", "стилистический анализ", "аргументация"],
                errorTypes: ["logical", "conceptual"]
            }
        ],
        
        // Физика
        'физика': [
            {
                level: 1,
                templates: [
                    "Переведите единицы измерения: {value} {unit_from} в {unit_to}",
                    "Запишите формулу для {physical_concept}",
                    "Определите по графику {graph_parameter}",
                    "Назовите прибор для измерения {physical_quantity}",
                    "Сформулируйте закон {law_name}"
                ],
                skills: ["единицы измерения", "формулы", "законы"],
                errorTypes: ["factual", "technical"]
            },
            {
                level: 2,
                templates: [
                    "Решите задачу на {topic}: {problem}",
                    "Рассчитайте {physical_quantity} по формуле {formula}",
                    "Объясните физическое явление: {phenomenon}",
                    "Прочитайте схему электрической цепи: {circuit}",
                    "Постройте график зависимости {y} от {x}"
                ],
                skills: ["решение задач", "расчеты", "объяснение явлений"],
                errorTypes: ["application", "calculation"]
            }
        ],
        
        // История
        'история': [
            {
                level: 1,
                templates: [
                    "Назовите дату события: {event}",
                    "Укажите историческую личность, связанную с {event}",
                    "Расположите события в хронологическом порядке: {events}",
                    "Определите век по году: {year}",
                    "Назовите памятник культуры периода {period}"
                ],
                skills: ["хронология", "факты", "даты"],
                errorTypes: ["factual", "attention"]
            },
            {
                level: 2,
                templates: [
                    "Установите причинно-следственные связи: {events}",
                    "Проанализируйте исторический документ: {document_excerpt}",
                    "Сравните {concept1} и {concept2}",
                    "Объясните значение термина: {term}",
                    "Составьте план ответа по теме '{theme}'"
                ],
                skills: ["анализ", "сравнение", "объяснение"],
                errorTypes: ["conceptual", "logical"]
            }
        ],
        
        // Общий шаблон для других предметов
        'default': [
            {
                level: 1,
                templates: [
                    "Дайте определение термину: {term}",
                    "Назовите {concept}",
                    "Перечислите {list_of_items}",
                    "Выберите правильный ответ: {question_with_options}",
                    "Установите соответствие: {pairs}"
                ],
                skills: ["терминология", "факты", "классификация"],
                errorTypes: ["factual", "attention"]
            },
            {
                level: 2,
                templates: [
                    "Объясните {concept}",
                    "Решите задачу: {problem}",
                    "Примените правило {rule} к {situation}",
                    "Проанализируйте {data}",
                    "Сравните {object1} и {object2}"
                ],
                skills: ["объяснение", "применение", "анализ"],
                errorTypes: ["application", "conceptual"]
            }
        ]
    };
    
    // Ищем шаблоны для предмета
    for (const [key, value] of Object.entries(templates)) {
        if (subject.includes(key)) {
            return value;
        }
    }
    
    return templates.default;
}

function showGenerationDialog(subject, workType, params, taskTemplates) {
    const subjectName = getSubjectDisplayName(subject);
    const workTypeName = workTypes[workType]?.name || workType;
    
    let html = `
        <div style="max-width: 700px;">
            <h3>🤖 AI-генерация заданий</h3>
            <p>Создание заданий для <strong>${subjectName}</strong> (${workTypeName})</p>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <h4>📊 Параметры генерации</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 10px;">
                    <div>
                        <label>Количество заданий:</label>
                        <input type="number" id="genCount" value="${params.count}" min="5" max="50" 
                               class="form-control" style="width: 100px;">
                    </div>
                    
                    <div>
                        <label>Общее время (мин):</label>
                        <input type="number" id="genTotalTime" value="${params.count * params.timePerTask}" 
                               class="form-control" style="width: 100px;" readonly>
                    </div>
                </div>
                
                <div style="margin-top: 15px;">
                    <label>Распределение по сложности:</label>
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 10px;">
                        <div style="text-align: center; background: #27ae60; color: white; padding: 8px; border-radius: 5px;">
                            <div>Базовые</div>
                            <div><strong>${params.easy}</strong></div>
                        </div>
                        <div style="text-align: center; background: #3498db; color: white; padding: 8px; border-radius: 5px;">
                            <div>Применение</div>
                            <div><strong>${params.medium}</strong></div>
                        </div>
                        <div style="text-align: center; background: #f39c12; color: white; padding: 8px; border-radius: 5px;">
                            <div>Анализ</div>
                            <div><strong>${params.hard}</strong></div>
                        </div>
                        <div style="text-align: center; background: #e74c3c; color: white; padding: 8px; border-radius: 5px;">
                            <div>Творчество</div>
                            <div><strong>${params.creative}</strong></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div style="background: #e8f4fc; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <h4>🎯 Настройки заданий</h4>
                
                <div class="form-group">
                    <label>Тема работы:</label>
                    <input type="text" id="genTheme" value="${appData.test.theme || ''}" 
                           class="form-control" placeholder="Основная тема для заданий">
                </div>
                
                <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div class="form-group">
                        <label>Средний балл за задание:</label>
                        <select id="genAvgScore" class="form-control">
                            <option value="1">1 балл</option>
                            <option value="2" selected>2 балла</option>
                            <option value="3">3 балла</option>
                            <option value="5">5 баллов</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Формат заданий:</label>
                        <select id="genFormat" class="form-control">
                            <option value="mixed">Смешанный</option>
                            <option value="test" selected>Тестовый</option>
                            <option value="extended">С развернутым ответом</option>
                            <option value="practical">Практический</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Дополнительные параметры:</label>
                    <div style="display: flex; gap: 15px; flex-wrap: wrap; margin-top: 5px;">
                        <label>
                            <input type="checkbox" id="genIncludeExamples" checked>
                            Включить примеры
                        </label>
                        <label>
                            <input type="checkbox" id="genIncludeHints" checked>
                            Добавить подсказки
                        </label>
                        <label>
                            <input type="checkbox" id="genVariedDifficulty">
                            Разная сложность внутри уровня
                        </label>
                    </div>
                </div>
            </div>
            
            <div style="background: #fff8e1; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <h4>👁️ Предпросмотр шаблонов</h4>
                <div style="max-height: 200px; overflow-y: auto; font-size: 13px;">
    `;
    
    // Показываем примеры шаблонов для каждого уровня
    taskTemplates.forEach((levelTemplate, levelIndex) => {
        const levelName = complexityLevels[levelTemplate.level]?.name || `Уровень ${levelTemplate.level}`;
        html += `<div style="margin: 5px 0;"><strong>${levelName}:</strong> ${levelTemplate.templates[0]}</div>`;
    });
    
    html += `
                </div>
            </div>
            
            <div id="genPreview" style="display: none; max-height: 300px; overflow-y: auto; margin: 15px 0; padding: 15px; background: white; border: 2px solid #eee; border-radius: 8px;">
                <h5>Предпросмотр заданий:</h5>
                <div id="genPreviewContent"></div>
            </div>
            
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button class="btn btn-outline" onclick="previewGeneratedTasks()">
                    👁️ Предпросмотр
                </button>
                <button class="btn btn-success" onclick="executeGeneration()">
                    🚀 Сгенерировать задания
                </button>
                <button class="btn" onclick="hideModal()">
                    Отмена
                </button>
            </div>
        </div>
    `;
    
    showModal('AI-генерация заданий', html);
    
    // Обновляем общее время при изменении количества
    document.getElementById('genCount').addEventListener('input', function() {
        const count = parseInt(this.value) || 10;
        const timePerTask = params.timePerTask;
        document.getElementById('genTotalTime').value = count * timePerTask;
    });
}

function getSubjectDisplayName(subject) {
    const names = {
        'математика': 'Математика',
        'русский': 'Русский язык',
        'физика': 'Физика',
        'история': 'История',
        'биология': 'Биология',
        'химия': 'Химия',
        'география': 'География',
        'обществознание': 'Обществознание',
        'информатика': 'Информатика',
        'английский': 'Английский язык'
    };
    
    for (const [key, value] of Object.entries(names)) {
        if (subject.includes(key)) {
            return value;
        }
    }
    
    return subject.charAt(0).toUpperCase() + subject.slice(1);
}

function previewGeneratedTasks() {
    console.log('👁️ Предпросмотр генерируемых заданий...');
    
    const count = parseInt(document.getElementById('genCount').value) || 10;
    const theme = document.getElementById('genTheme').value || appData.test.theme || 'Общая тема';
    const subject = appData.test.subject.toLowerCase();
    
    const previewContent = document.getElementById('genPreviewContent');
    const previewDiv = document.getElementById('genPreview');
    
    if (!previewContent || !previewDiv) return;
    
    // Генерируем примерные задания для предпросмотра
    let html = '';
    
    for (let i = 1; i <= Math.min(5, count); i++) {
        const level = i <= 3 ? 1 : i <= 7 ? 2 : 3;
        const taskText = generateSingleTask(subject, theme, level, i);
        
        html += `
            <div style="margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 5px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <strong>Задание ${i}</strong>
                    <span style="font-size: 11px; padding: 2px 8px; background: ${complexityLevels[level]?.color || '#95a5a6'}; color: white; border-radius: 10px;">
                        Уровень ${level}
                    </span>
                </div>
                <div style="margin-top: 5px; font-size: 13px;">${taskText}</div>
                <div style="margin-top: 5px; font-size: 11px; color: #666;">
                    Баллы: ${level === 1 ? '1' : level === 2 ? '2' : '3'} | 
                    Время: ${level === 1 ? '3' : level === 2 ? '5' : '7'} мин
                </div>
            </div>
        `;
    }
    
    if (count > 5) {
        html += `<div style="text-align: center; color: #666; padding: 10px;">... и еще ${count - 5} заданий</div>`;
    }
    
    previewContent.innerHTML = html;
    previewDiv.style.display = 'block';
}

function generateSingleTask(subject, theme, level, number) {
    // Генерация одного задания
    const templates = getSubjectTaskTemplates(subject, theme);
    const levelTemplates = templates.find(t => t.level === level) || templates[0];
    
    if (!levelTemplates || !levelTemplates.templates || levelTemplates.templates.length === 0) {
        return `Задание ${number} по теме "${theme}"`;
    }
    
    // Выбираем случайный шаблон
    const template = levelTemplates.templates[Math.floor(Math.random() * levelTemplates.templates.length)];
    
    // Заполняем шаблон данными
    return fillTemplate(template, subject, theme, number);
}

function fillTemplate(template, subject, theme, number) {
    // Заполнители для шаблонов
    const placeholders = {
        '{expression}': getMathExpression(),
        '{equation}': getMathEquation(),
        '{numbers}': getRandomNumbers(3),
        '{number}': Math.floor(Math.random() * 1000),
        '{place}': ['десятков', 'сотен', 'десятой'][Math.floor(Math.random() * 3)],
        '{problem}': getProblemBySubject(subject),
        '{function}': getFunctionBySubject(subject),
        '{figure}': getGeometricFigure(),
        '{system}': getEquationSystem(),
        '{statement}': getMathStatement(),
        '{graph_description}': getGraphDescription(),
        '{condition}': getProblemCondition(subject),
        '{problem_type}': getProblemType(subject),
        '{theme}': theme,
        '{concept}': getSubjectConcept(subject),
        '{real_world_problem}': getRealWorldProblem(subject),
        '{word_with_gaps}': getWordWithGaps(),
        '{words}': getWordsForStress(),
        '{word}': getRandomWord(),
        '{sentence}': getExampleSentence(),
        '{text_with_errors}': getTextWithErrors(),
        '{text}': getExampleText(subject),
        '{topic}': getRelatedTopic(theme),
        '{value}': Math.floor(Math.random() * 100),
        '{unit_from}': ['м', 'см', 'км'][Math.floor(Math.random() * 3)],
        '{unit_to}': ['см', 'м', 'мм'][Math.floor(Math.random() * 3)],
        '{physical_concept}': getPhysicsConcept(),
        '{graph_parameter}': getGraphParameter(),
        '{physical_quantity}': getPhysicsQuantity(),
        '{law_name}': getPhysicsLaw(),
        '{phenomenon}': getPhysicsPhenomenon(),
        '{circuit}': 'электрическая цепь',
        '{y}': getPhysicsDependentVariable(),
        '{x}': getPhysicsIndependentVariable(),
        '{event}': getHistoricalEvent(),
        '{period}': getHistoricalPeriod(),
        '{events}': getHistoricalEvents(3),
        '{year}': 1900 + Math.floor(Math.random() * 120),
        '{document_excerpt}': 'исторический документ',
        '{concept1}': getHistoricalConcept(),
        '{concept2}': getHistoricalConcept(),
        '{term}': getSubjectTerm(subject),
        '{list_of_items}': getListOfItems(subject),
        '{question_with_options}': 'вопрос с вариантами ответа',
        '{pairs}': 'пары для установления соответствия',
        '{rule}': getSubjectRule(subject),
        '{situation}': getExampleSituation(subject),
        '{data}': getExampleData(subject),
        '{object1}': getExampleObject(subject),
        '{object2}': getExampleObject(subject),
        '{standard_problem}': getStandardProblem(subject)
    };
    
    let result = template;
    
    // Заменяем все плейсхолдеры
    for (const [placeholder, value] of Object.entries(placeholders)) {
        if (result.includes(placeholder)) {
            result = result.replace(placeholder, value);
        }
    }
    
    return result;
}

// Вспомогательные функции генерации контента
function getMathExpression() {
    const operations = ['+', '-', '×', '÷'];
    const op = operations[Math.floor(Math.random() * operations.length)];
    const a = Math.floor(Math.random() * 100);
    const b = Math.floor(Math.random() * 100) + 1;
    return `${a} ${op} ${b}`;
}

function getMathEquation() {
    const types = [
        `x + ${Math.floor(Math.random() * 20)} = ${Math.floor(Math.random() * 30) + 10}`,
        `${Math.floor(Math.random() * 5) + 2}x = ${Math.floor(Math.random() * 30) + 10}`,
        `x² = ${Math.floor(Math.random() * 100) + 1}`
    ];
    return types[Math.floor(Math.random() * types.length)];
}

function getRandomNumbers(count) {
    const numbers = [];
    for (let i = 0; i < count; i++) {
        numbers.push(Math.floor(Math.random() * 1000));
    }
    return numbers.join(', ');
}

function getProblemBySubject(subject) {
    const problems = {
        'математика': 'На складе было 150 кг яблок. Продали 45 кг. Сколько килограммов яблок осталось?',
        'русский': 'Вставьте пропущенные буквы в словах: пр..красный, пр..бывание',
        'физика': 'Тело массой 2 кг движется со скоростью 5 м/с. Найдите его кинетическую энергию.',
        'история': 'Когда произошло Ледовое побоище?'
    };
    
    return problems[subject] || `Задача по теме "${subject}"`;
}

function getFunctionBySubject(subject) {
    const functions = {
        'математика': 'y = 2x + 3',
        'физика': 'v(t) = v₀ + at',
        'алгебра': 'f(x) = x² - 4',
        'геометрия': 'y = kx + b'
    };
    return functions[subject] || 'y = x';
}

function getGeometricFigure() {
    const figures = ['треугольник', 'прямоугольник', 'круг', 'трапеция', 'параллелограмм'];
    return figures[Math.floor(Math.random() * figures.length)];
}

function getEquationSystem() {
    return `{
        x + y = 10,
        2x - y = 5
    }`;
}

function getMathStatement() {
    const statements = [
        'сумма углов треугольника равна 180°',
        'квадрат гипотенузы равен сумме квадратов катетов',
        'отрезок, соединяющий середины двух сторон треугольника, параллелен третьей стороне'
    ];
    return statements[Math.floor(Math.random() * statements.length)];
}

function getGraphDescription() {
    const descriptions = [
        'зависимости скорости от времени',
        'изменения температуры в течение суток',
        'роста растения от времени'
    ];
    return descriptions[Math.floor(Math.random() * descriptions.length)];
}

function getProblemCondition(subject) {
    const conditions = {
        'математика': 'пешеход идет со скоростью 5 км/ч, а велосипедист едет со скоростью 15 км/ч',
        'физика': 'тело свободно падает с высоты 100 метров',
        'химия': 'смешали 20 г 10% раствора и 30 г 20% раствора'
    };
    return conditions[subject] || 'стандартное условие задачи';
}

function getProblemType(subject) {
    const types = {
        'математика': 'текстовой задачи',
        'физика': 'расчетной задачи',
        'химия': 'задачи на концентрацию',
        'биология': 'задачи на генетику'
    };
    return types[subject] || 'задачи';
}

function getSubjectConcept(subject) {
    const concepts = {
        'математика': 'дроби',
        'физика': 'силы трения',
        'химия': 'периодическая таблица',
        'биология': 'фотосинтез',
        'история': 'Великая Отечественная война',
        'русский': 'части речи',
        'английский': 'времена глаголов'
    };
    return concepts[subject] || 'основное понятие предмета';
}

function getRealWorldProblem(subject) {
    const problems = {
        'математика': 'расчет стоимости покупок со скидкой',
        'физика': 'расчет необходимой мощности для подъема груза',
        'химия': 'очистка воды от примесей',
        'биология': 'влияние удобрений на рост растений',
        'география': 'прогноз погоды'
    };
    return problems[subject] || 'практическая ситуация из реальной жизни';
}

function getWordWithGaps() {
    const words = ['пр_красный', 'с_бака', 'в_ренье', 'б_леть', 'праз_ник'];
    return words[Math.floor(Math.random() * words.length)];
}

function getWordsForStress() {
    const words = ['звонит', 'торты', 'щавель', 'договор', 'баловать'];
    return words.slice(0, 3).join(', ');
}

function getRandomWord() {
    const words = ['солнце', 'книга', 'дружба', 'путешествие', 'открытие'];
    return words[Math.floor(Math.random() * words.length)];
}

function getExampleSentence() {
    const sentences = [
        'Быстро бегающий заяц скрылся в лесу.',
        'Мы изучаем сложные, но интересные науки.',
        'Красивая бабочка летает над цветами.'
    ];
    return sentences[Math.floor(Math.random() * sentences.length)];
}

function getTextWithErrors() {
    return 'Он приехал в горот, чтобы найти старую, но дорогую ему вещь.';
}

function getExampleText(subject) {
    const texts = {
        'русский': 'Весна - удивительное время года. Природа пробуждается от зимнего сна.',
        'литература': 'На небе зажглись первые звезды, и вечерняя прохлада опустилась на землю.',
        'история': 'В начале XX века Россия переживала период серьезных политических изменений.'
    };
    return texts[subject] || 'Пример текста для анализа.';
}

function getRelatedTopic(theme) {
    const topics = {
        'дроби': 'десятичные дроби',
        'фотосинтез': 'дыхание растений',
        'сила трения': 'сила тяжести',
        'глагол': 'существительное'
    };
    return topics[theme] || 'смежная тема';
}

function getPhysicsConcept() {
    const concepts = ['сила', 'энергия', 'мощность', 'давление', 'работа'];
    return concepts[Math.floor(Math.random() * concepts.length)];
}

function getGraphParameter() {
    const parameters = ['скорость', 'ускорение', 'пройденный путь', 'координату'];
    return parameters[Math.floor(Math.random() * parameters.length)];
}

function getPhysicsQuantity() {
    const quantities = ['длина', 'масса', 'время', 'температура', 'сила тока'];
    return quantities[Math.floor(Math.random() * quantities.length)];
}

function getPhysicsLaw() {
    const laws = [
        'Ньютона',
        'Ома',
        'сохранения энергии',
        'Архимеда',
        'всемирного тяготения'
    ];
    return laws[Math.floor(Math.random() * laws.length)];
}

function getPhysicsPhenomenon() {
    const phenomena = [
        'электрический ток',
        'отражение света',
        'кипение воды',
        'магнитное поле',
        'диффузия'
    ];
    return phenomena[Math.floor(Math.random() * phenomena.length)];
}

function getPhysicsDependentVariable() {
    const variables = ['скорость', 'температура', 'давление', 'сила', 'энергия'];
    return variables[Math.floor(Math.random() * variables.length)];
}

function getPhysicsIndependentVariable() {
    const variables = ['время', 'расстояние', 'масса', 'объем', 'площадь'];
    return variables[Math.floor(Math.random() * variables.length)];
}

function getHistoricalEvent() {
    const events = [
        'Крещение Руси',
        'Куликовская битва',
        'Октябрьская революция',
        'Великая Отечественная война'
    ];
    return events[Math.floor(Math.random() * events.length)];
}

function getHistoricalPeriod() {
    const periods = [
        'Древняя Русь',
        'Средневековье',
        'Эпоха Просвещения',
        'Новое время'
    ];
    return periods[Math.floor(Math.random() * periods.length)];
}

function getHistoricalEvents(count) {
    const events = [
        'принятие христианства',
        'образование Киевской Руси',
        'монгольское нашествие',
        'смутное время',
        'реформы Петра I'
    ];
    return events.slice(0, count).join(', ');
}

function getHistoricalConcept() {
    const concepts = [
        'феодализм',
        'абсолютизм',
        'демократия',
        'республика',
        'монархия'
    ];
    return concepts[Math.floor(Math.random() * concepts.length)];
}

function getSubjectTerm(subject) {
    const terms = {
        'математика': 'гипотенуза',
        'физика': 'инерция',
        'химия': 'молекула',
        'биология': 'клетка',
        'география': 'широта',
        'обществознание': 'государство',
        'информатика': 'алгоритм'
    };
    return terms[subject] || 'термин';
}

function getListOfItems(subject) {
    const lists = {
        'математика': 'геометрические фигуры',
        'биология': 'органы растений',
        'химия': 'химические элементы',
        'география': 'материки',
        'история': 'правители России'
    };
    return lists[subject] || 'основные понятия';
}

function getSubjectRule(subject) {
    const rules = {
        'русский': 'правописание приставок',
        'математика': 'правило сложения дробей',
        'физика': 'правило левой руки',
        'химия': 'правило октета'
    };
    return rules[subject] || 'основное правило';
}

function getExampleSituation(subject) {
    const situations = {
        'математика': 'решение бытовой задачи',
        'физика': 'движение автомобиля',
        'химия': 'химическая реакция',
        'обществознание': 'социальный конфликт'
    };
    return situations[subject] || 'конкретная ситуация';
}

function getExampleData(subject) {
    const data = {
        'математика': 'статистические данные',
        'физика': 'результаты измерений',
        'химия': 'таблица растворимости',
        'биология': 'результаты опыта'
    };
    return data[subject] || 'данные для анализа';
}

function getExampleObject(subject) {
    const objects = {
        'литература': 'литературные произведения',
        'история': 'исторические события',
        'биология': 'биологические виды',
        'география': 'географические объекты'
    };
    return objects[subject] || 'объекты для сравнения';
}

function getStandardProblem(subject) {
    const problems = {
        'математика': 'нахождение площади прямоугольника',
        'физика': 'расчет пути при равномерном движении',
        'химия': 'расчет массы вещества по уравнению реакции',
        'биология': 'построение родословной'
    };
    return problems[subject] || 'стандартной задачи';
}

function executeGeneration() {
    console.log('🚀 Выполнение генерации заданий...');
    
    const count = parseInt(document.getElementById('genCount').value) || 10;
    const avgScore = parseInt(document.getElementById('genAvgScore').value) || 2;
    const theme = document.getElementById('genTheme').value || appData.test.theme || 'Общая тема';
    const subject = appData.test.subject.toLowerCase();
    const workType = appData.test.workType;
    
    // Получаем параметры распределения
    const params = getGenerationParameters(workType, appData.test.class);
    
    // Генерируем задания
    const generatedTasks = [];
    let taskNumber = 1;
    
    // Генерируем базовые задания (уровень 1)
    for (let i = 0; i < params.easy && taskNumber <= count; i++, taskNumber++) {
        generatedTasks.push(createTaskObject(subject, theme, 1, taskNumber, avgScore * 0.8));
    }
    
    // Генерируем задания на применение (уровень 2)
    for (let i = 0; i < params.medium && taskNumber <= count; i++, taskNumber++) {
        generatedTasks.push(createTaskObject(subject, theme, 2, taskNumber, avgScore));
    }
    
    // Генерируем аналитические задания (уровень 3)
    for (let i = 0; i < params.hard && taskNumber <= count; i++, taskNumber++) {
        generatedTasks.push(createTaskObject(subject, theme, 3, taskNumber, avgScore * 1.2));
    }
    
    // Генерируем творческие задания (уровень 4)
    for (let i = 0; i < params.creative && taskNumber <= count; i++, taskNumber++) {
        generatedTasks.push(createTaskObject(subject, theme, 4, taskNumber, avgScore * 1.5));
    }
    
    // Если нужно больше заданий, добавляем случайные уровни
    while (taskNumber <= count) {
        const level = Math.min(4, Math.floor(Math.random() * 3) + 1);
        generatedTasks.push(createTaskObject(subject, theme, level, taskNumber, avgScore));
        taskNumber++;
    }
    
    // Показываем подтверждение
    showGenerationConfirmation(generatedTasks);
}

function createTaskObject(subject, theme, level, number, baseScore) {
    const templates = getSubjectTaskTemplates(subject, theme);
    const levelTemplates = templates.find(t => t.level === level) || templates[0];
    
    const taskText = generateSingleTask(subject, theme, level, number);
    
    // Определяем максимальный балл
    let maxScore;
    if (level === 1) maxScore = 1;
    else if (level === 2) maxScore = Math.round(baseScore);
    else if (level === 3) maxScore = Math.round(baseScore * 1.5);
    else maxScore = Math.round(baseScore * 2);
    
    // Определяем время на выполнение
    let time;
    if (level === 1) time = 3;
    else if (level === 2) time = 5;
    else if (level === 3) time = 7;
    else time = 10;
    
    // Определяем тип ошибки
    let errorType = '';
    if (levelTemplates.errorTypes && levelTemplates.errorTypes.length > 0) {
        errorType = levelTemplates.errorTypes[Math.floor(Math.random() * levelTemplates.errorTypes.length)];
    }
    
    // Определяем навыки
    let skills = '';
    if (levelTemplates.skills && levelTemplates.skills.length > 0) {
        skills = levelTemplates.skills.slice(0, 2).join(', ');
    }
    
    return {
        id: `task_${Date.now()}_${number}_${Math.random().toString(36).substr(2, 9)}`,
        number: number,
        description: taskText,
        maxScore: maxScore,
        level: level,
        errorType: errorType,
        complexity: complexityLevels[level]?.name || `Уровень ${level}`,
        skills: skills,
        taxonomy: `Таксономия Блума: уровень ${level}`,
        notes: `Сгенерировано автоматически. Предмет: ${subject}, тема: ${theme}`,
        code: `З${number}`,
        type: getTaskTypeByLevel(level),
        time: time,
        weight: level
    };
}

function getTaskTypeByLevel(level) {
    const types = {
        1: 'reproduction',
        2: 'application', 
        3: 'analysis',
        4: 'creation'
    };
    return types[level] || 'standard';
}

function showGenerationConfirmation(tasks) {
    console.log('✅ Задания сгенерированы:', tasks.length);
    
    let html = `
        <div style="max-width: 800px;">
            <h3>✅ Генерация завершена!</h3>
            <p>Создано <strong>${tasks.length}</strong> заданий:</p>
            
            <div style="max-height: 300px; overflow-y: auto; margin: 15px 0;">
                <table style="width: 100%; font-size: 12px;">
                    <thead>
                        <tr>
                            <th>№</th>
                            <th>Задание</th>
                            <th>Уровень</th>
                            <th>Баллы</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    tasks.slice(0, 10).forEach(task => {
        html += `
            <tr>
                <td>${task.number}</td>
                <td>${task.description.substring(0, 50)}${task.description.length > 50 ? '...' : ''}</td>
                <td>
                    <span style="display: inline-block; padding: 2px 8px; background: ${complexityLevels[task.level]?.color || '#95a5a6'}; color: white; border-radius: 10px; font-size: 10px;">
                        ${task.level}
                    </span>
                </td>
                <td>${task.maxScore}</td>
            </tr>
        `;
    });
    
    if (tasks.length > 10) {
        html += `
            <tr>
                <td colspan="4" style="text-align: center; color: #666;">
                    ... и еще ${tasks.length - 10} заданий
                </td>
            </tr>
        `;
    }
    
    html += `
                    </tbody>
                </table>
            </div>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <h4>📊 Статистика</h4>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
                    <div style="text-align: center;">
                        <div style="font-size: 24px; font-weight: bold;">${tasks.length}</div>
                        <small>Всего заданий</small>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 24px; font-weight: bold;">${tasks.reduce((sum, t) => sum + t.maxScore, 0)}</div>
                        <small>Макс. баллов</small>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 24px; font-weight: bold;">${Math.round(tasks.reduce((sum, t) => sum + t.time, 0) / 60)}</div>
                        <small>Минут всего</small>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 24px; font-weight: bold;">
                            ${(tasks.filter(t => t.level === 1).length / tasks.length * 100).toFixed(0)}%
                        </div>
                        <small>Базовых</small>
                    </div>
                </div>
            </div>
            
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button class="btn btn-success" onclick="saveGeneratedTasks(${JSON.stringify(tasks).replace(/"/g, '&quot;')})">
                    💾 Сохранить задания
                </button>
                <button class="btn btn-outline" onclick="exportGeneratedTasks(${JSON.stringify(tasks).replace(/"/g, '&quot;')})">
                    📥 Экспорт в файл
                </button>
                <button class="btn" onclick="hideModal()">
                    Отмена
                </button>
            </div>
        </div>
    `;
    
    showModal('Подтверждение генерации', html);
}

function saveGeneratedTasks(tasks) {
    console.log('💾 Сохранение сгенерированных заданий...');
    
    // Заменяем существующие задания
    appData.tasks = tasks;
    
    // Сохраняем данные
    saveData();
    
    // Обновляем интерфейс
    renderTasks();
    
    hideModal();
    showNotification(`✅ Сохранено ${tasks.length} заданий`, 'success');
}

function exportGeneratedTasks(tasks) {
    console.log('📤 Экспорт сгенерированных заданий...');
    
    const exportData = {
        metadata: {
            exported: new Date().toISOString(),
            version: '1.0',
            generatedBy: 'AI-генератор заданий',
            subject: appData.test.subject,
            theme: appData.test.theme,
            workType: appData.test.workType
        },
        tasks: tasks
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileName = `Сгенерированные_задания_${appData.test.subject || 'предмет'}_${new Date().toLocaleDateString()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileName);
    linkElement.click();
    
    hideModal();
    showNotification(`✅ Задания экспортированы (${tasks.length} шт.)`, 'success');
}


