/**
 * Скрипт сборки проекта
 */

const fs = require('fs');
const path = require('path');

// Конфигурация
const config = {
  inputDir: '.',
  outputDir: 'dist',
  partsDir: 'parts',
  jsDir: 'js',
  cssDir: 'css'
};

// Создаем директорию dist если её нет
if (!fs.existsSync(config.outputDir)) {
  fs.mkdirSync(config.outputDir, { recursive: true });
}

// Функция для чтения файла
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Ошибка чтения файла ${filePath}:`, error);
    return '';
  }
}

// Функция для записи файла
function writeFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Создан: ${filePath}`);
  } catch (error) {
    console.error(`Ошибка записи файла ${filePath}:`, error);
  }
}

// Сборка HTML
function buildHTML() {
  console.log('🔨 Сборка HTML...');
  
  const template = readFile(path.join(config.inputDir, 'index.html'));
  
  // Заменяем инклюды
  let result = template.replace(
    /<!--#include file="([^"]+)" -->/g,
    (match, filePath) => {
      const fullPath = path.join(config.inputDir, filePath);
      if (fs.existsSync(fullPath)) {
        return readFile(fullPath);
      } else {
        console.warn(`⚠️ Файл не найден: ${filePath}`);
        return `<!-- Файл ${filePath} не найден -->`;
      }
    }
  );
  
  writeFile(path.join(config.outputDir, 'index.html'), result);
}

// Сборка CSS
function buildCSS() {
  console.log('🎨 Сборка CSS...');
  
  const cssFiles = [
    'css/style.css',
    'css/print.css'
  ];
  
  let combinedCSS = '/* Объединенный CSS файл */\n\n';
  
  cssFiles.forEach(cssFile => {
    if (fs.existsSync(cssFile)) {
      combinedCSS += `/* ${cssFile} */\n`;
      combinedCSS += readFile(cssFile);
      combinedCSS += '\n\n';
    }
  });
  
  writeFile(path.join(config.outputDir, 'css', 'style.min.css'), combinedCSS);
}

// Сборка JavaScript
function buildJS() {
  console.log('📦 Сборка JavaScript...');
  
  const jsFiles = [
    'js/utils.js',
    'js/render.js',
    'js/charts.js',
    'js/export.js',
    'js/app.js'
  ];
  
  let combinedJS = '/* Объединенный JavaScript файл */\n\n';
  combinedJS += '// ==================== УТИЛИТЫ ====================\n\n';
  
  jsFiles.forEach(jsFile => {
    if (fs.existsSync(jsFile)) {
      const fileName = path.basename(jsFile, '.js');
      combinedJS += `\n// ==================== ${fileName.toUpperCase()} ====================\n\n`;
      combinedJS += readFile(jsFile);
      combinedJS += '\n\n';
    }
  });
  
  // Добавляем инициализацию
  combinedJS += `
// ==================== ИНИЦИАЛИЗАЦИЯ ====================

document.addEventListener('DOMContentLoaded', function() {
  setTimeout(() => {
    if (typeof app !== 'undefined' && app.initializeApp) {
      app.initializeApp();
    } else {
      console.error('Ошибка инициализации: app не найден');
    }
  }, 100);
});

console.log('✅ Система анализа образовательных результатов загружена');
  `;
  
  writeFile(path.join(config.outputDir, 'js', 'app.min.js'), combinedJS);
}

// Копирование ресурсов
function copyResources() {
  console.log('📁 Копирование ресурсов...');
  
  // Создаем директории
  ['css', 'js', 'assets'].forEach(dir => {
    const dirPath = path.join(config.outputDir, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
  
  // Копируем библиотеки если есть
  const libs = [
    'chart.js',
    'xlsx.full.min.js',
    'jspdf.umd.min.js'
  ];
  
  libs.forEach(lib => {
    const libPath = path.join(config.inputDir, 'lib', lib);
    if (fs.existsSync(libPath)) {
      const content = readFile(libPath);
      writeFile(path.join(config.outputDir, 'js', lib), content);
    }
  });
}

// Основная функция сборки
function build() {
  console.log('🚀 Начало сборки проекта...\n');
  
  try {
    buildHTML();
    buildCSS();
    buildJS();
    copyResources();
    
    console.log('\n🎉 Сборка завершена успешно!');
    console.log(`📁 Файлы находятся в папке: ${config.outputDir}`);
    
  } catch (error) {
    console.error('\n❌ Ошибка сборки:', error);
    process.exit(1);
  }
}

// Запуск сборки
if (require.main === module) {
  build();
}

module.exports = { build };