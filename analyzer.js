// analyzer.js
const fs = require('fs');
const path = require('path');

class FunctionDependencyAnalyzer {
    constructor() {
        this.functions = new Map(); // имя функции → информация
        this.dependencies = new Map(); // функция → от кого зависит
        this.dependents = new Map(); // функция → кто от неё зависит
        this.globalVars = new Set(); // глобальные переменные
        this.domElements = new Set(); // DOM элементы
    }
    
    analyzeFile(filePath) {
        console.log(`📄 Анализ файла: ${filePath}`);
        
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            this.extractFunctions(content);
            this.analyzeDependencies(content);
            this.findGlobalReferences(content);
            
            return this.generateReport();
        } catch (error) {
            console.error(`❌ Ошибка анализа файла ${filePath}:`, error.message);
            return null;
        }
    }
    
    extractFunctions(content) {
        // Регулярки для поиска объявлений функций
        const patterns = [
            // function name() { ... }
            /function\s+(\w+)\s*\([^)]*\)\s*\{/g,
            // const name = function() { ... }
            /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?function\s*\(/g,
            // const name = () => { ... }
            /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g,
            // class Name { method() { ... } }
            /class\s+\w+\s*\{[^}]*?(\w+)\s*\([^)]*\)\s*\{/g
        ];
        
        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const funcName = match[1];
                if (funcName && !this.functions.has(funcName)) {
                    this.functions.set(funcName, {
                        name: funcName,
                        type: this.getFunctionType(match[0]),
                        line: this.getLineNumber(content, match.index),
                        dependencies: new Set(),
                        dependents: new Set(),
                        usesGlobal: false,
                        usesDOM: false,
                        complexity: 0
                    });
                }
            }
        });
        
        console.log(`✅ Найдено функций: ${this.functions.size}`);
    }
    
    getFunctionType(match) {
        if (match.startsWith('function ')) return 'function';
        if (match.includes('=>')) return 'arrow';
        if (match.includes('class')) return 'method';
        return 'variable';
    }
    
    getLineNumber(content, index) {
        return content.substring(0, index).split('\n').length;
    }
    
    analyzeDependencies(content) {
        console.log('🔍 Анализ зависимостей...');
        
        this.functions.forEach((funcInfo, funcName) => {
            // Находим тело функции
            const funcRegex = new RegExp(
                `(?:function\\s+${funcName}|(?:const|let|var)\\s+${funcName}\\s*=).*?\\{(.*?)\\n\\}`,
                's'
            );
            
            const match = funcRegex.exec(content);
            if (!match) return;
            
            const functionBody = match[1];
            
            // Ищем вызовы других функций
            this.functions.forEach((otherFunc, otherName) => {
                if (otherName === funcName) return;
                
                // Ищем вызов функции: otherName(...)
                const callRegex = new RegExp(`\\b${otherName}\\s*\\(`, 'g');
                if (callRegex.test(functionBody)) {
                    // funcName зависит от otherName
                    funcInfo.dependencies.add(otherName);
                    
                    // otherName имеет зависимого funcName
                    if (!this.dependents.has(otherName)) {
                        this.dependents.set(otherName, new Set());
                    }
                    this.dependents.get(otherName).add(funcName);
                    
                    // Записываем в обе карты
                    if (!this.dependencies.has(funcName)) {
                        this.dependencies.set(funcName, new Set());
                    }
                    this.dependencies.get(funcName).add(otherName);
                }
            });
            
            // Анализ сложности (простой подсчет операторов)
            funcInfo.complexity = this.calculateComplexity(functionBody);
            
            // Проверяем использование глобальных переменных
            funcInfo.usesGlobal = this.checkGlobalUsage(functionBody);
            funcInfo.usesDOM = this.checkDOMUsage(functionBody);
        });
    }
    
    calculateComplexity(code) {
        // Простой подсчет циклов и условий
        const complexityIndicators = [
            /\bif\s*\(/g,
            /\belse\b/g,
            /\bfor\s*\(/g,
            /\bwhile\s*\(/g,
            /\bswitch\s*\(/g,
            /\bcase\s+/g,
            /\btry\s*\{/g,
            /\bcatch\s*\(/g,
            /\bthrow\b/g,
            /\?.*:/g // тернарный оператор
        ];
        
        let complexity = 1; // базовая сложность
        complexityIndicators.forEach(pattern => {
            const matches = code.match(pattern);
            if (matches) complexity += matches.length;
        });
        
        return complexity;
    }
    
    checkGlobalUsage(code) {
        // Проверяем использование глобальных переменных из вашего списка
        const globals = [
            'appData', 'schoolData', 'complexityLevels', 'errorTypes',
            'workTypes', 'vprLevels', 'vprCompetencies',
            'functionalLiteracyTypes', 'literacyContexts',
            'gradesChartInstance', 'complexityChartInstance',
            'saveTimeout', 'currentStep', 'criteriaMode'
        ];
        
        return globals.some(global => new RegExp(`\\b${global}\\b`).test(code));
    }
    
    checkDOMUsage(code) {
        // Проверяем использование DOM API
        const domPatterns = [
            /document\./g,
            /window\./g,
            /\.getElementById\(/g,
            /\.querySelector\(/g,
            /\.addEventListener\(/g,
            /\.innerHTML/g,
            /\.appendChild\(/g,
            /\.style\./g
        ];
        
        return domPatterns.some(pattern => pattern.test(code));
    }
    
    findGlobalReferences(content) {
        // Ищем обращения к глобальным переменным вне функций
        const globalVarPattern = /(?:^|\n)[^{}]*?\b(appData|schoolData|window\.\w+)\b/g;
        let match;
        
        while ((match = globalVarPattern.exec(content)) !== null) {
            this.globalVars.add(match[1]);
        }
        
        // Ищем DOM элементы по ID
        const domIdPattern = /getElementById\(["'](\w+)["']\)/g;
        while ((match = domIdPattern.exec(content)) !== null) {
            this.domElements.add(match[1]);
        }
    }
    
    generateReport() {
        const report = {
            summary: {
                totalFunctions: this.functions.size,
                functionsWithDependencies: 0,
                independentFunctions: 0,
                mostComplexFunction: null,
                maxComplexity: 0
            },
            modules: this.suggestModules(),
            dependencies: this.getDependencyGraph(),
            problematicFunctions: this.findProblematicFunctions(),
            globalUsage: Array.from(this.globalVars),
            domElements: Array.from(this.domElements)
        };
        
        // Статистика
        this.functions.forEach(func => {
            if (func.dependencies.size > 0) {
                report.summary.functionsWithDependencies++;
            } else {
                report.summary.independentFunctions++;
            }
            
            if (func.complexity > report.summary.maxComplexity) {
                report.summary.maxComplexity = func.complexity;
                report.summary.mostComplexFunction = func.name;
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
            'ui': []          // Интерфейс
        };
        
        // Ключевые слова для классификации
        const keywords = {
            'core': ['showNotification', 'debounce', 'saveData', 'loadAppData', 'initialize'],
            'setup': ['workType', 'criteria', 'step', 'wizard', 'selectWorkType'],
            'tasks': ['task', 'addTask', 'removeTask', 'duplicateTask', 'taxonomy'],
            'students': ['student', 'addStudent', 'class', 'importSchool', 'filterStudents'],
            'results': ['result', 'calculate', 'grade', 'score', 'renderResults', 'updateScore'],
            'analytics': ['analyze', 'chart', 'report', 'generate', 'recommendation'],
            'export': ['export', 'import', 'print', 'PDF', 'Excel', 'HTML'],
            'ui': ['showModal', 'tab', 'notification', 'tour', 'pwa']
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
                        complexity: func.complexity,
                        usesGlobal: func.usesGlobal,
                        usesDOM: func.usesDOM
                    });
                    assigned = true;
                    break;
                }
            }
            
            // Если не нашли по ключевым словам, распределяем по зависимостям
            if (!assigned) {
                // Проверяем зависимости
                for (const dep of func.dependencies) {
                    for (const [module, funcs] of Object.entries(modules)) {
                        if (funcs.some(f => f.name === dep)) {
                            modules[module].push({
                                name,
                                dependencies: Array.from(func.dependencies),
                                complexity: func.complexity,
                                usesGlobal: func.usesGlobal,
                                usesDOM: func.usesDOM
                            });
                            assigned = true;
                            break;
                        }
                    }
                    if (assigned) break;
                }
            }
            
            // Если всё ещё не распределили - в core
            if (!assigned) {
                modules.core.push({
                    name,
                    dependencies: Array.from(func.dependencies),
                    complexity: func.complexity,
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
                        Array.from(this.dependents.get(name)) : [],
                    complexity: func.complexity
                };
            }
        });
        
        return graph;
    }
    
    findProblematicFunctions() {
        const problematic = [];
        
        this.functions.forEach((func, name) => {
            // Функции высокой сложности
            if (func.complexity > 15) {
                problematic.push({
                    name,
                    issue: 'Высокая сложность',
                    complexity: func.complexity,
                    suggestion: 'Разделить на несколько функций'
                });
            }
            
            // Функции с многими зависимостями
            if (func.dependencies.size > 10) {
                problematic.push({
                    name,
                    issue: 'Много зависимостей',
                    dependencyCount: func.dependencies.size,
                    suggestion: 'Упростить архитектуру'
                });
            }
            
            // Функции, от которых зависят многие другие
            if (this.dependents.has(name) && this.dependents.get(name).size > 15) {
                problematic.push({
                    name,
                    issue: 'Критическая зависимость',
                    dependentsCount: this.dependents.get(name).size,
                    suggestion: 'Создать интерфейс/фасад'
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
        const report = this.generateReport();
        
        // Сохраняем JSON
        fs.writeFileSync(
            path.join(outputPath, 'dependencies.json'),
            JSON.stringify(report, null, 2)
        );
        
        // Сохраняем визуальную карту в формате Mermaid
        const mermaid = this.generateMermaidDiagram();
        fs.writeFileSync(
            path.join(outputPath, 'dependencies.mmd'),
            mermaid
        );
        
        // Сохраняем HTML отчет
        const htmlReport = this.generateHTMLReport(report);
        fs.writeFileSync(
            path.join(outputPath, 'report.html'),
            htmlReport
        );
        
        console.log(`✅ Отчеты сохранены в ${outputPath}`);
        
        return report;
    }
    
    generateMermaidDiagram() {
        let mermaid = '```mermaid\ngraph TD\n';
        
        // Группируем по модулям
        const modules = this.suggestModules();
        
        // Создаем подграфы для модулей
        Object.entries(modules).forEach(([moduleName, funcs]) => {
            if (funcs.length > 0) {
                mermaid += `    subgraph ${moduleName.toUpperCase()}\n`;
                funcs.forEach(func => {
                    mermaid += `        ${func.name}_${moduleName}[${func.name}]\n`;
                });
                mermaid += '    end\n';
            }
        });
        
        // Добавляем зависимости
        mermaid += '\n    % Зависимости между функциями\n';
        
        this.dependencies.forEach((deps, func) => {
            deps.forEach(dep => {
                // Находим модуль для каждой функции
                const funcModule = this.findFunctionModule(func, modules);
                const depModule = this.findFunctionModule(dep, modules);
                
                if (funcModule && depModule) {
                    mermaid += `    ${dep}_${depModule} --> ${func}_${funcModule}\n`;
                }
            });
        });
        
        mermaid += '```';
        
        return mermaid;
    }
    
    findFunctionModule(funcName, modules) {
        for (const [moduleName, funcs] of Object.entries(modules)) {
            if (funcs.some(f => f.name === funcName)) {
                return moduleName;
            }
        }
        return null;
    }
    
    generateHTMLReport(report) {
        return `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Анализ зависимостей функций</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 20px; border-radius: 10px; }
        .module { border: 1px solid #ddd; margin: 10px 0; padding: 15px; }
        .high-complexity { background: #ffebee; }
        .many-deps { background: #fff3e0; }
        .critical { background: #ffcdd2; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f0f0f0; }
    </style>
</head>
<body>
    <h1>📊 Анализ зависимостей функций</h1>
    
    <div class="summary">
        <h2>📈 Сводка</h2>
        <p>Всего функций: <strong>${report.summary.totalFunctions}</strong></p>
        <p>Функций с зависимостями: <strong>${report.summary.functionsWithDependencies}</strong></p>
        <p>Независимых функций: <strong>${report.summary.independentFunctions}</strong></p>
        <p>Самая сложная функция: <strong>${report.summary.mostComplexFunction}</strong> (сложность: ${report.summary.maxComplexity})</p>
    </div>
    
    <h2>🏗️ Предлагаемые модули</h2>
    ${Object.entries(report.modules).map(([module, funcs]) => `
        <div class="module">
            <h3>${module.toUpperCase()} (${funcs.length} функций)</h3>
            <table>
                <tr>
                    <th>Функция</th>
                    <th>Зависимости</th>
                    <th>Сложность</th>
                    <th>Глобальные</th>
                    <th>DOM</th>
                </tr>
                ${funcs.map(func => `
                    <tr class="${func.complexity > 15 ? 'high-complexity' : ''}">
                        <td>${func.name}</td>
                        <td>${func.dependencies.join(', ') || 'нет'}</td>
                        <td>${func.complexity}</td>
                        <td>${func.usesGlobal ? '✓' : ''}</td>
                        <td>${func.usesDOM ? '✓' : ''}</td>
                    </tr>
                `).join('')}
            </table>
        </div>
    `).join('')}
    
    <h2>⚠️ Проблемные функции</h2>
    <table>
        <tr>
            <th>Функция</th>
            <th>Проблема</th>
            <th>Детали</th>
            <th>Рекомендация</th>
        </tr>
        ${report.problematicFunctions.map(func => `
            <tr class="${func.issue.includes('Критическая') ? 'critical' : 
                        func.issue.includes('Много') ? 'many-deps' : 'high-complexity'}">
                <td>${func.name}</td>
                <td>${func.issue}</td>
                <td>${func.complexity || func.dependencyCount || func.dependentsCount || ''}</td>
                <td>${func.suggestion}</td>
            </tr>
        `).join('')}
    </table>
    
    <h2>🌐 Глобальные переменные</h2>
    <ul>
        ${report.globalUsage.map(varName => `<li>${varName}</li>`).join('')}
    </ul>
    
    <h2>🎯 DOM элементы</h2>
    <ul>
        ${report.domElements.map(element => `<li>${element}</li>`).join('')}
    </ul>
    
    <h2>🔗 Граф зависимостей (Mermaid)</h2>
    <pre>${this.generateMermaidDiagram()}</pre>
    
    <script>
        // Для просмотра Mermaid диаграммы
        console.log('Для просмотра диаграммы скопируйте содержимое в Mermaid Live Editor');
    </script>
</body>
</html>`;
    }
}

// Утилита для анализа нескольких файлов
class ProjectAnalyzer {
    constructor() {
        this.analyzer = new FunctionDependencyAnalyzer();
        this.projectResults = [];
    }
    
    analyzeProject(rootPath) {
        console.log(`🔍 Анализ проекта: ${rootPath}`);
        
        // Ищем все JS файлы
        const jsFiles = this.findJSFiles(rootPath);
        
        jsFiles.forEach(file => {
            console.log(`\n📄 Анализ: ${file}`);
            const result = this.analyzer.analyzeFile(file);
            if (result) {
                this.projectResults.push({
                    file,
                    result
                });
            }
        });
        
        // Создаем сводный отчет
        return this.generateProjectReport(rootPath);
    }
    
    findJSFiles(dir) {
        const files = [];
        
        function traverse(currentPath) {
            const items = fs.readdirSync(currentPath, { withFileTypes: true });
            
            items.forEach(item => {
                const fullPath = path.join(currentPath, item.name);
                
                if (item.isDirectory()) {
                    // Пропускаем node_modules и .git
                    if (!['node_modules', '.git', '.vscode'].includes(item.name)) {
                        traverse(fullPath);
                    }
                } else if (item.isFile() && 
                          (item.name.endsWith('.js') || 
                           item.name.endsWith('.html'))) {
                    files.push(fullPath);
                }
            });
        }
        
        traverse(dir);
        return files;
    }
    
    generateProjectReport(rootPath) {
        const outputDir = path.join(rootPath, 'analysis-report');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // Сохраняем отчеты для каждого файла
        this.projectResults.forEach((project, index) => {
            const fileName = path.basename(project.file, path.extname(project.file));
            fs.writeFileSync(
                path.join(outputDir, `${fileName}-analysis.json`),
                JSON.stringify(project.result, null, 2)
            );
        });
        
        // Создаем сводный отчет
        const summary = {
            totalFiles: this.projectResults.length,
            totalFunctions: 0,
            files: this.projectResults.map(p => ({
                file: p.file,
                functionCount: p.result.summary.totalFunctions,
                mostComplex: p.result.summary.mostComplexFunction
            })),
            crossFileDependencies: this.findCrossFileDependencies()
        };
        
        fs.writeFileSync(
            path.join(outputDir, 'project-summary.json'),
            JSON.stringify(summary, null, 2)
        );
        
        console.log(`\n✅ Анализ завершен! Отчеты сохранены в: ${outputDir}`);
        
        return {
            outputDir,
            summary
        };
    }
    
    findCrossFileDependencies() {
        // Находим функции, которые вызываются из разных файлов
        const crossDeps = {};
        
        // Этот анализ требует сравнения вызовов между файлами
        // Пока возвращаем заглушку
        return { note: 'Требуется анализ вызовов между файлами' };
    }
}

// ==================== ИСПОЛЬЗОВАНИЕ ====================

// Способ 1: Анализ одного файла
function analyzeSingleFile() {
    const analyzer = new FunctionDependencyAnalyzer();
    const report = analyzer.analyzeFile('index.html'); // Ваш файл
    
    // Сохраняем отчет
    analyzer.saveReport('./analysis');
    
    console.log('\n🎯 Ключевые выводы:');
    console.log('1. Начните с модуля CORE - там независимые функции');
    console.log('2. Функции с высокой сложностью требуют рефакторинга');
    console.log('3. Проверьте зависимости в HTML (onclick="..." )');
}

// Способ 2: Анализ всего проекта
function analyzeFullProject() {
    const projectAnalyzer = new ProjectAnalyzer();
    projectAnalyzer.analyzeProject('.');
}

// Способ 3: Интерактивный анализ
function interactiveAnalysis() {
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    console.log('🔧 Инструмент анализа зависимостей функций\n');
    console.log('1. Анализ одного файла (index.html)');
    console.log('2. Анализ всего проекта');
    console.log('3. Создать карту модулей');
    
    readline.question('Выберите вариант (1-3): ', (choice) => {
        switch(choice) {
            case '1':
                analyzeSingleFile();
                break;
            case '2':
                analyzeFullProject();
                break;
            case '3':
                createModuleMap();
                break;
            default:
                console.log('Используйте: node analyzer.js <путь-к-файлу>');
        }
        readline.close();
    });
}

// Утилита для создания карты модулей
function createModuleMap() {
    console.log('Создание карты модулей на основе вашего списка функций...');
    
    // Здесь можно использовать ваш список из 740 функций
    const functionList = require('./function-list.json'); // если сохранен
    
    // Группировка по префиксам/ключевым словам
    const modules = {
        'core': [],
        'setup': [],
        'tasks': [],
        'students': [],
        'results': [],
        'analytics': [],
        'export': [],
        'ui': [],
        'debug': [],
        'psychology': [],
        'literacy': [],
        'vpr': [],
        'oge': []
    };
    
    // Автоматическая группировка
    Object.keys(modules).forEach(module => {
        modules[module] = functionList.filter(func => 
            func.toLowerCase().includes(module.toLowerCase()) ||
            func.toLowerCase().startsWith(module.substring(0, 3))
        );
    });
    
    // Сохраняем карту
    fs.writeFileSync(
        'module-map.json',
        JSON.stringify(modules, null, 2)
    );
    
    console.log('✅ Карта модулей создана: module-map.json');
}

// Запуск
if (require.main === module) {
    if (process.argv[2]) {
        // Анализ указанного файла
        const analyzer = new FunctionDependencyAnalyzer();
        analyzer.analyzeFile(process.argv[2]);
        analyzer.saveReport('./analysis');
    } else {
        interactiveAnalysis();
    }
}

module.exports = {
    FunctionDependencyAnalyzer,
    ProjectAnalyzer
};