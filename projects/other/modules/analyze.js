const fs = require('fs');
const code = fs.readFileSync('advanced-analytics.js', 'utf8');

// 1. Найти все вызовы методов
const methodCalls = code.match(/(\w+)\.(\w+)\(/g) || [];
console.log('Вызовы методов:', [...new Set(methodCalls)].slice(0, 20));

// 2. Найти все определения методов
const methodDefinitions = code.match(/(\w+)\([^)]*\)\s*\{/g) || [];
console.log('\nОпределения методов:', methodDefinitions.length);

// 3. Найти потенциальные проблемы
console.log('\n=== ПОИСК ПРОБЛЕМ ===');

// Поиск несуществующих функций
const problematicFunctions = ['getColorForCorrelation', 'addMissingStyles', 'debugCharts', 'exportComprehensiveAnalysisToWord'];
problematicFunctions.forEach(func => {
    const calls = (code.match(new RegExp(func, 'g')) || []).length;
    const definitions = (code.match(new RegExp(`${func}\\([^)]*\\)\\s*\\{`, 'g')) || []).length;
    
    if (calls > 0 && definitions === 0) {
        console.log(`❌ ${func}: Вызывается ${calls} раз, но не определена!`);
    } else if (calls > 0) {
        console.log(`✅ ${func}: Вызывается ${calls} раз, определена ${definitions} раз`);
    }
});

// Поиск дубликатов
console.log('\n=== ПОИСК ДУБЛИКАТОВ ===');
const allMethods = code.match(/(\w+)\([^)]*\)\s*\{/g) || [];
const methodNames = allMethods.map(m => m.split('(')[0]);
const duplicates = methodNames.filter((name, i) => methodNames.indexOf(name) !== i);
console.log('Дубликаты:', [...new Set(duplicates)]);