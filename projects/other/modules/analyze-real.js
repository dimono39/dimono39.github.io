const fs = require('fs');
const code = fs.readFileSync('advanced-analytics.js', 'utf8');

// Найдем реальные методы класса (не вложенные)
console.log('=== РЕАЛЬНЫЕ МЕТОДЫ КЛАССА ===\n');

// Ищем методы вида: methodName() { или methodName(args) {
// И которые не вложены глубоко (имеют небольшой отступ)
const lines = code.split('\n');
let inClass = false;
let indentLevel = 0;
const classMethods = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Начало класса
    if (line.startsWith('class AdvancedAnalytics')) {
        inClass = true;
        console.log(`Найден класс на строке ${i+1}`);
        continue;
    }
    
    if (inClass) {
        // Конец класса
        if (line === '}') {
            inClass = false;
            continue;
        }
        
        // Метод класса (начинается с имени и скобок, не слишком глубокий отступ)
        if (lines[i].match(/^\s{4}\w+\([^)]*\)\s*\{/)) {
            const methodName = line.match(/^(\w+)\(/)?.[1];
            if (methodName && !['if', 'for', 'switch', 'while', 'try', 'catch'].includes(methodName)) {
                classMethods.push({
                    name: methodName,
                    line: i + 1,
                    fullLine: line.substring(0, 100)
                });
            }
        }
    }
}

// Сгруппируем по имени
const grouped = {};
classMethods.forEach(m => {
    if (!grouped[m.name]) grouped[m.name] = [];
    grouped[m.name].push(m);
});

// Покажем дубликаты
console.log('\n=== ПРОВЕРКА ДУБЛИКАТОВ МЕТОДОВ КЛАССА ===');
let hasDuplicates = false;

Object.entries(grouped).forEach(([name, entries]) => {
    if (entries.length > 1) {
        console.log(`\n❌ ${name} - дублируется ${entries.length} раза:`);
        entries.forEach(entry => {
            console.log(`   Строка ${entry.line}: ${entry.fullLine}`);
        });
        hasDuplicates = true;
    }
});

if (!hasDuplicates) {
    console.log('\n✅ Нет дублирующихся методов класса!');
}

// Посчитаем статистику
console.log('\n=== СТАТИСТИКА ===');
console.log(`Всего методов класса: ${classMethods.length}`);
console.log(`Уникальных методов: ${Object.keys(grouped).length}`);