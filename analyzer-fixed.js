// analyzer-fixed.js
const fs = require('fs');
const path = require('path');

class FunctionDependencyAnalyzer {
    constructor() {
        this.functions = new Map();
        this.dependencies = new Map();
        this.dependents = new Map();
        this.globalVars = new Set();
        this.domElements = new Set();
    }
    
    analyzeFile(filePath) {
        console.log(`📄 Анализ файла: ${filePath}`);
        
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            this.extractFunctions(content);
            this.analyzeDependencies(content);
            this.findGlobalReferences(content);
            
            console.log(`✅ Найдено функций: ${this.functions.size}`);
            
            return this.generateReport();
        } catch (error) {
            console.error(`❌ Ошибка анализа файла ${filePath}:`, error.message);
            return null;
        }
    }
    
    extractFunctions(content) {
        // Все шаблоны для поиска функций
        const patterns = [
            // function name() { ... }
            /function\s+(\w+)\s*\([^)]*\)\s*\{/g,
            // const name = function() { ... }
            /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?function\s*\(/g,
            // const name = () => { ... }
            /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g,
            // class Name { method() { ... } }
            /class\s+\w+\s*\{[^}]*?(\w+)\s*\([^)]*\)\s*\{/g,
            // methodName() { ... } (внутри объекта)
            /(\w+)\s*\([^)]*\)\s*\{[^}]*\}(?=\s*(?:,|\}|\n|$))/g
        ];
        
        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const funcName = match[1];
                if (funcName && !this.functions.has(funcName)) {
                    this.functions.set(funcName, {
                        name: funcName,
                        type: this.getFunctionType(match[0]),
                        dependencies: new Set(),
                        dependents: new Set(),
                        usesGlobal: false,
                        usesDOM: false,
                        complexity: 0
                    });
                }
            }
        });
    }
    
    getFunctionType(match) {
        if (match.startsWith('function ')) return 'function';
        if (match.includes('=>')) return 'arrow';
        if (match.includes('class')) return 'method';
        return 'variable';
    }
    
    analyzeDependencies(content) {
        console.log('🔍 Анализ зависимостей...');
        
        this.functions.forEach((funcInfo, funcName) => {
            // Упрощенный поиск тела функции
            const funcStart = content.indexOf(`function ${funcName}(`) > -1 ? 
                `function ${funcName}(` : 
                content.indexOf(`${funcName} = function`) > -1 ?
                `${funcName} = function` :
                content.indexOf(`${funcName} = (`) > -1 ?
                `${funcName} = (` : null;
            
            if (!funcStart) return;
            
            const startIndex = content.indexOf(funcStart);
            let braceCount = 0;
            let endIndex = startIndex;
            let inString = false;
            let stringChar = '';
            
            // Находим конец функции
            for (let i = startIndex; i < content.length; i++) {
                const char = content[i];
                
                // Обработка строк
                if (!inString && (char === '"' || char === "'" || char === '`')) {
                    inString = true;
                    stringChar = char;
                } else if (inString && char === stringChar && content[i-1] !== '\\') {
                    inString = false;
                }
                
                if (!inString) {
                    if (char === '{') braceCount++;
                    if (char === '}') {
                        braceCount--;
                        if (braceCount === 0) {
                            endIndex = i;
                            break;
                        }
                    }
                }
            }
            
            const functionBody = content.substring(startIndex, endIndex + 1);
            
            // Ищем вызовы других функций
            this.functions.forEach((otherFunc, otherName) => {
                if (otherName === funcName) return;
                
                // Простая проверка - есть ли вызов функции
                if (functionBody.includes(`${otherName}(`)) {
                    funcInfo.dependencies.add(otherName);
                    
                    if (!this.dependents.has(otherName)) {
                        this.dependents.set(otherName, new Set());
                    }
                    this.dependents.get(otherName).add(funcName);
                    
                    if (!this.dependencies.has(funcName)) {
                        this.dependencies.set(funcName, new Set());
                    }
                    this.dependencies.get(funcName).add(otherName);
                }
            });
            
            // Проверяем использование глобальных переменных
            funcInfo.usesGlobal = this.checkGlobalUsage(functionBody);
            funcInfo.usesDOM = this.checkDOMUsage(functionBody);
        });
    }
    
    checkGlobalUsage(code) {
        const globals = [
            'appData', 'schoolData', 'complexityLevels', 'errorTypes',
            'workTypes', 'vprLevels', 'vprCompetencies',
            'functionalLiteracyTypes', 'literacyContexts',
            'gradesChartInstance', 'complexityChartInstance',
            'saveTimeout', 'currentStep', 'criteriaMode',
            'window', 'document', 'localStorage'
        ];
        
        return globals.some(global => code.includes(global));
    }
    
    checkDOMUsage(code) {
        const domPatterns = [
            'document.',
            'getElementById',
            'querySelector',
            'addEventListener',
            'innerHTML',
            'appendChild',
            '.style.'
        ];
        
        return domPatterns.some(pattern => code.includes(pattern));
    }
    
    findGlobalReferences(content) {
        // Ищем глобальные переменные
        const lines = content.split('\n');
        lines.forEach(line => {
            // Поиск объявлений глобальных переменных
            if (line.includes('let ') || line.includes('const ') || line.includes('var ')) {
                const match = line.match(/(?:let|const|var)\s+(\w+)/);
                if (match && !line.includes('function')) {
                    this.globalVars.add(match[1]);
                }
            }
            
            // Поиск window.*
            if (line.includes('window.')) {
                const match = line.match(/window\.(\w+)/);
                if (match) this.globalVars.add(`window.${match[1]}`);
            }
        });
    }
    
    generateReport() {
        const report = {
            summary: {
                totalFunctions: this.functions.size,
                functionsWithDependencies: 0,
                independentFunctions: 0,
                mostComplexFunction: null
            },
            modules: this.suggestModules(),
            dependencies: this.getDependencyGraph(),
            problematicFunctions: this.findProblematicFunctions(),
            globalUsage: Array.from(this.globalVars),
            domElements: Array.from(this.domElements)
        };
        
        // Статистика
        let maxDeps = 0;
        this.functions.forEach(func => {
            if (func.dependencies.size > 0) {
                report.summary.functionsWithDependencies++;
            } else {
                report.summary.independentFunctions++;
            }
            
            if (func.dependencies.size > maxDeps) {
                maxDeps = func.dependencies.size;
                report.summary.mostComplexFunction = {
                    name: func.name,
                    dependencies: func.dependencies.size
                };
            }
        });
        
        return report;
    }
    
    suggestModules() {
        const modules = {
            'core': [],        // Независимые утилиты
            'setup': [],       // Настройка
            'tasks': [],       // Задания
            'students': [],    // Учащиеся
            'results': [],     // Результаты
            'analytics': [],   // Аналитика
            'export': [],      // Экспорт
            'ui': [],          // Интерфейс
            'errors': [],      // Ошибки
            'charts': []       // Графики
        };
        
        // Ключевые слова для классификации
        const keywords = {
            'core': ['showNotification', 'debounce', 'saveData', 'loadAppData', 
                    'initialize', 'escapeHtml', 'safe', 'validate', 'check'],
            'setup': ['workType', 'criteria', 'step', 'wizard', 'selectWorkType',
                     'updateWorkType', 'nextStep', 'prevStep'],
            'tasks': ['task', 'addTask', 'removeTask', 'duplicateTask', 'taxonomy',
                     'moveTask', 'parseTask'],
            'students': ['student', 'addStudent', 'class', 'importSchool', 'filterStudents',
                        'moveStudent', 'sortStudents'],
            'results': ['result', 'calculate', 'grade', 'score', 'renderResults', 
                       'updateScore', 'fillPattern', 'bulkEdit', 'copyRow'],
            'analytics': ['analyze', 'chart', 'report', 'generate', 'recommendation',
                         'statistics', 'kpi', 'dashboard', 'performance'],
            'export': ['export', 'import', 'print', 'PDF', 'Excel', 'HTML', 'JSON',
                      'download', 'saveAs'],
            'ui': ['showModal', 'tab', 'notification', 'tour', 'pwa', 'toggle', 'show'],
            'errors': ['error', 'Error', 'addError', 'deleteError', 'showError'],
            'charts': ['chart', 'Chart', 'renderChart', 'updateChart', 'createChart']
        };
        
        // Распределяем функции по модулям
        this.functions.forEach((func, name) => {
            let assigned = false;
            
            for (const [module, moduleKeywords] of Object.entries(keywords)) {
                if (moduleKeywords.some(keyword => 
                    name.toLowerCase().includes(keyword.toLowerCase()) ||
                    moduleKeywords.includes(name)
                )) {
                    modules[module].push({
                        name,
                        dependencies: Array.from(func.dependencies),
                        usesGlobal: func.usesGlobal,
                        usesDOM: func.usesDOM
                    });
                    assigned = true;
                    break;
                }
            }
            
            // Если не нашли - в core
            if (!assigned) {
                modules.core.push({
                    name,
                    dependencies: Array.from(func.dependencies),
                    usesGlobal: func.usesGlobal,
                    usesDOM: func.usesDOM
                });
            }
        });
        
        return modules;
    }
    
    getDependencyGraph() {
        const graph = {};
        
        this.functions.forEach((func, name) => {
            if (func.dependencies.size > 0) {
                graph[name] = {
                    dependencies: Array.from(func.dependencies),
                    dependents: this.dependents.has(name) ? 
                        Array.from(this.dependents.get(name)) : []
                };
            }
        });
        
        return graph;
    }
    
    findProblematicFunctions() {
        const problematic = [];
        
        this.functions.forEach((func, name) => {
            // Функции с многими зависимостями
            if (func.dependencies.size > 8) {
                problematic.push({
                    name,
                    issue: 'Много зависимостей',
                    dependencyCount: func.dependencies.size,
                    suggestion: 'Разделить на несколько функций'
                });
            }
            
            // Функции, от которых зависят многие другие
            if (this.dependents.has(name) && this.dependents.get(name).size > 10) {
                problematic.push({
                    name,
                    issue: 'Критическая зависимость',
                    dependentsCount: this.dependents.get(name).size,
                    suggestion: 'Вынести в core модуль'
                });
            }
            
            // Функции, использующие DOM и глобальные переменные
            if (func.usesDOM && func.usesGlobal) {
                problematic.push({
                    name,
                    issue: 'Смешанная ответственность',
                    suggestion: 'Разделить на логику и представление'
                });
            }
        });
        
        return problematic;
    }
    
    saveReport(outputPath) {
        // Создаем папку, если её нет
        if (!fs.existsSync(outputPath)) {
            fs.mkdirSync(outputPath, { recursive: true });
        }
        
        const report = this.generateReport();
        
        // Сохраняем JSON
        fs.writeFileSync(
            path.join(outputPath, 'dependencies.json'),
            JSON.stringify(report, null, 2)
        );
        
        // Сохраняем HTML отчет
        const htmlReport = this.generateHTMLReport(report);
        fs.writeFileSync(
            path.join(outputPath, 'report.html'),
            htmlReport
        );
        
        // Сохраняем простой текстовый отчет
        this.saveTextReport(outputPath, report);
        
        console.log(`✅ Отчеты сохранены в: ${outputPath}`);
        
        return report;
    }
    
    generateHTMLReport(report) {
        return `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Анализ зависимостей - 709 функций</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .summary { background: #e3f2fd; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
        .module { border: 1px solid #ddd; margin: 15px 0; padding: 15px; border-radius: 5px; }
        .module h3 { margin-top: 0; color: #1976d2; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 14px; }
        th { background: #f5f5f5; }
        .high-deps { background: #ffebee; }
        .critical { background: #fff3e0; }
        .mixed { background: #f3e5f5; }
        .count-badge { background: #1976d2; color: white; padding: 2px 8px; border-radius: 10px; font-size: 12px; }
        .tip { background: #e8f5e8; padding: 10px; border-radius: 5px; margin: 10px 0; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>📊 Анализ зависимостей функций</h1>
    <div class="summary">
        <h2>📈 Сводка анализа</h2>
        <p>Всего функций: <strong>${report.summary.totalFunctions}</strong></p>
        <p>Функций с зависимостями: <strong>${report.summary.functionsWithDependencies}</strong></p>
        <p>Независимых функций: <strong>${report.summary.independentFunctions}</strong></p>
        <p>Функция с наибольшим количеством зависимостей: 
           <strong>${report.summary.mostComplexFunction?.name || 'не определена'}</strong> 
           (${report.summary.mostComplexFunction?.dependencies || 0} зависимостей)</p>
    </div>
    
    <div class="tip">
        💡 <strong>Рекомендация:</strong> Начните рефакторинг с модуля <strong>CORE</strong> 
        (независимые функции), затем переходите к Setup → Tasks → Students → Results.
    </div>
    
    <h2>🏗️ Предлагаемая модульная структура</h2>
    
    ${Object.entries(report.modules)
        .filter(([module, funcs]) => funcs.length > 0)
        .map(([module, funcs]) => `
        <div class="module">
            <h3>${module.toUpperCase()} <span class="count-badge">${funcs.length} функций</span></h3>
            <p><em>Функции для выноса в отдельный файл: ${module}.js</em></p>
            <table>
                <tr>
                    <th>Функция</th>
                    <th>Зависимости</th>
                    <th>Глобальные</th>
                    <th>DOM</th>
                </tr>
                ${funcs.map(func => `
                    <tr class="${func.dependencies.length > 5 ? 'high-deps' : ''} 
                               ${func.usesGlobal && func.usesDOM ? 'mixed' : ''}">
                        <td><code>${func.name}</code></td>
                        <td>${func.dependencies.slice(0, 3).join(', ')}${func.dependencies.length > 3 ? '...' : ''}</td>
                        <td>${func.usesGlobal ? '✓' : ''}</td>
                        <td>${func.usesDOM ? '✓' : ''}</td>
                    </tr>
                `).join('')}
            </table>
            <p><small>Полный список: ${funcs.map(f => f.name).join(', ')}</small></p>
        </div>
    `).join('')}
    
    <h2>⚠️ Проблемные функции (требуют внимания)</h2>
    <table>
        <tr>
            <th>Функция</th>
            <th>Проблема</th>
            <th>Детали</th>
            <th>Рекомендация</th>
        </tr>
        ${report.problematicFunctions.slice(0, 20).map(func => `
            <tr class="${func.issue.includes('Критическая') ? 'critical' : 
                        func.issue.includes('Много') ? 'high-deps' : 'mixed'}">
                <td><code>${func.name}</code></td>
                <td>${func.issue}</td>
                <td>${func.dependencyCount || func.dependentsCount || ''}</td>
                <td>${func.suggestion}</td>
            </tr>
        `).join('')}
    </table>
    ${report.problematicFunctions.length > 20 ? 
        `<p>... и ещё ${report.problematicFunctions.length - 20} проблемных функций</p>` : ''}
    
    <h2>📋 План рефакторинга (по приоритету)</h2>
    <ol>
        <li><strong>День 1:</strong> Создать структуру папок и вынести CSS из index.html</li>
        <li><strong>День 2:</strong> Создать модуль CORE (${report.modules.core.length} функций)</li>
        <li><strong>День 3:</strong> Модуль SETUP (${report.modules.setup.length} функций)</li>
        <li><strong>День 4:</strong> Модуль TASKS (${report.modules.tasks.length} функций)</li>
        <li><strong>День 5:</strong> Модуль STUDENTS (${report.modules.students.length} функций)</li>
        <li><strong>День 6:</strong> Модуль RESULTS (${report.modules.results.length} функций)</li>
        <li><strong>День 7:</strong> Остальные модули</li>
    </ol>
    
    <h2>📝 Пример создания модуля CORE</h2>
    <pre>
// js/core/utils.js
export function showNotification(message, type = 'info') {
    // существующий код функции
}

export function debounce(func, wait) {
    // существующий код
}

export function escapeHtml(text) {
    // существующий код
}

// Всего ${report.modules.core.length} функций
    </pre>
    
    <script>
        console.log('Анализ завершен. Начните рефакторинг с модуля CORE.');
        
        // Экспорт данных для других инструментов
        window.analysisReport = ${JSON.stringify(report)};
        
        // Сохранить как файл
        function saveReport() {
            const data = JSON.stringify(window.analysisReport, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'analysis-report.json';
            a.click();
        }
    </script>
</body>
</html>`;
    }
    
    saveTextReport(outputPath, report) {
        let text = '='.repeat(80) + '\n';
        text += 'АНАЛИЗ ЗАВИСИМОСТЕЙ ФУНКЦИЙ\n';
        text += '='.repeat(80) + '\n\n';
        
        text += `Всего функций: ${report.summary.totalFunctions}\n`;
        text += `Функций с зависимостями: ${report.summary.functionsWithDependencies}\n`;
        text += `Независимых функций: ${report.summary.independentFunctions}\n\n`;
        
        text += 'ПРЕДЛАГАЕМЫЕ МОДУЛИ:\n';
        text += '-'.repeat(40) + '\n';
        
        Object.entries(report.modules).forEach(([module, funcs]) => {
            if (funcs.length > 0) {
                text += `\n${module.toUpperCase()} (${funcs.length} функций):\n`;
                funcs.forEach((func, index) => {
                    text += `  ${index + 1}. ${func.name}`;
                    if (func.dependencies.length > 0) {
                        text += ` → зависит от: ${func.dependencies.slice(0, 3).join(', ')}`;
                        if (func.dependencies.length > 3) text += '...';
                    }
                    text += '\n';
                });
            }
        });
        
        text += '\n\nПРОБЛЕМНЫЕ ФУНКЦИИ (первые 20):\n';
        text += '-'.repeat(40) + '\n';
        report.problematicFunctions.slice(0, 20).forEach(func => {
            text += `• ${func.name}: ${func.issue} (${func.dependencyCount || func.dependentsCount || ''})\n`;
            text += `  Рекомендация: ${func.suggestion}\n\n`;
        });
        
        fs.writeFileSync(path.join(outputPath, 'report.txt'), text, 'utf8');
    }
}

// ==================== ИСПОЛЬЗОВАНИЕ ====================

if (require.main === module) {
    const analyzer = new FunctionDependencyAnalyzer();
    
    // Получаем путь к файлу из аргументов или используем index.html
    const filePath = process.argv[2] || 'index.html';
    
    console.log('🔧 Запуск анализа зависимостей...\n');
    
    // Анализируем файл
    const report = analyzer.analyzeFile(filePath);
    
    if (report) {
        // Создаем папку для отчета
        const outputDir = './analysis-report';
        
        // Сохраняем отчет
        analyzer.saveReport(outputDir);
        
        console.log('\n🎯 Анализ завершен!');
        console.log('📁 Отчеты сохранены в папке: analysis-report/');
        console.log('📊 Откройте analysis-report/report.html в браузере');
        console.log('\n🚀 Рекомендуемые следующие шаги:');
        console.log('1. Вынести CSS из index.html в отдельные файлы');
        console.log('2. Начать с модуля CORE (независимые функции)');
        console.log('3. Использовать ES6 модули для импорта/экспорта');
    } else {
        console.error('❌ Не удалось проанализировать файл');
    }
}