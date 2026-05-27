import { getState, setState } from '../core/state-manager.js';
import { escapeHtml, showToast, deepClone } from '../core/utils.js';

let currentTemplateData = null;

export async function renderEditor(container) {
    container.innerHTML = `
        <div class="editor-module" style="animation: fadeIn 0.5s ease;">
            <div class="card">
                <h2 class="card-title"><i class="fas fa-cloud-upload-alt"></i> Редактор типового меню</h2>
                
                <div id="dropZone" style="border: 2px dashed #cbd5e1; border-radius: 24px; padding: 45px; text-align: center; cursor: pointer; transition: all 0.3s ease;">
                    <i class="fas fa-file-excel fa-4x" style="color: #10b981; margin-bottom: 16px;"></i>
                    <h3>Перетащите файл <span style="color: #059669;">tm2026-sm.xlsx</span></h3>
                    <p>или кликните для выбора</p>
                    <input type="file" id="fileInput" accept=".xlsx,.xls" style="display: none;">
                </div>
                
                <div style="margin-top: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
                    <button id="exportBtn" class="btn btn-primary" disabled>
                        <i class="fas fa-download"></i> Экспорт в Excel
                    </button>
                    <button id="validateBtn" class="btn btn-warning" disabled>
                        <i class="fas fa-check-double"></i> Проверить
                    </button>
                </div>
                
                <div id="editorContent" style="margin-top: 20px; padding: 20px; background: #f8f9fa; border-radius: 10px; text-align: center; color: #6c757d;">
                    Загрузите файл типового меню для редактирования
                </div>
            </div>
        </div>
    `;
    
    attachEditorEvents();
}

function attachEditorEvents() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    
    if (dropZone) {
        dropZone.addEventListener('click', () => fileInput?.click());
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = '#10b981';
            dropZone.style.background = '#f0fdf4';
        });
        dropZone.addEventListener('dragleave', () => {
            dropZone.style.borderColor = '#cbd5e1';
            dropZone.style.background = 'transparent';
        });
        dropZone.addEventListener('drop', async (e) => {
            e.preventDefault();
            dropZone.style.borderColor = '#cbd5e1';
            dropZone.style.background = 'transparent';
            if (e.dataTransfer.files[0]) {
                await loadTemplateFile(e.dataTransfer.files[0]);
            }
        });
    }
    
    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            if (e.target.files[0]) {
                await loadTemplateFile(e.target.files[0]);
            }
        });
    }
    
    document.getElementById('exportBtn')?.addEventListener('click', exportToExcel);
    document.getElementById('validateBtn')?.addEventListener('click', validateMenu);
}

export function initEditor() {
    const state = getState();
    currentTemplateData = state.templateMenuData ? deepClone(state.templateMenuData) : null;
    
    if (currentTemplateData) {
        displayEditorContent();
        document.getElementById('exportBtn').disabled = false;
        document.getElementById('validateBtn').disabled = false;
    }
    
    console.log('Editor module initialized');
}

async function loadTemplateFile(file) {
    try {
        const data = await readExcelFile(file);
        currentTemplateData = parseTemplateData(data);
        setState({ templateMenuData: currentTemplateData });
        
        displayEditorContent();
        
        document.getElementById('exportBtn').disabled = false;
        document.getElementById('validateBtn').disabled = false;
        
        showToast(`Файл "${file.name}" загружен`, 'success');
    } catch (error) {
        console.error('Load error:', error);
        showToast(`Ошибка: ${error.message}`, 'error');
    }
}

function readExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                resolve(json);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

function parseTemplateData(data) {
    const template = { weeks: {} };
    
    // Простой парсинг
    for (let i = 5; i < Math.min(data.length, 200); i++) {
        const row = data[i];
        if (!row || row.length < 4) continue;
        
        const week = parseInt(row[0]);
        const day = parseInt(row[1]);
        
        if (week && day) {
            if (!template.weeks[week]) template.weeks[week] = {};
            if (!template.weeks[week][day]) {
                template.weeks[week][day] = {
                    breakfast: { items: [] },
                    lunch: { items: [] },
                    dinner: { items: [] }
                };
            }
            
            const dishName = row[4];
            if (dishName && dishName !== 'итого' && dishName !== 'Итого') {
                const meal = getMealType(row[2]);
                if (meal) {
                    template.weeks[week][day][meal].items.push({
                        section: row[3] || '',
                        name: dishName,
                        weight: parseFloat(row[5]) || 0,
                        calories: parseFloat(row[9]) || 0,
                        proteins: parseFloat(row[6]) || 0,
                        fats: parseFloat(row[7]) || 0,
                        carbs: parseFloat(row[8]) || 0
                    });
                }
            }
        }
    }
    
    return template;
}

function getMealType(mealName) {
    if (!mealName) return null;
    const name = mealName.toString().toLowerCase();
    if (name.includes('завтрак')) return 'breakfast';
    if (name.includes('обед')) return 'lunch';
    if (name.includes('ужин')) return 'dinner';
    return null;
}

function displayEditorContent() {
    const container = document.getElementById('editorContent');
    if (!container || !currentTemplateData) return;
    
    let totalDishes = 0;
    let totalWeeks = Object.keys(currentTemplateData.weeks).length;
    
    for (const week of Object.values(currentTemplateData.weeks)) {
        for (const day of Object.values(week)) {
            totalDishes += day.breakfast?.items?.length || 0;
            totalDishes += day.lunch?.items?.length || 0;
            totalDishes += day.dinner?.items?.length || 0;
        }
    }
    
    container.innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 10px;">
            <h3>Меню загружено успешно!</h3>
            <p><strong>Недель:</strong> ${totalWeeks}</p>
            <p><strong>Всего блюд:</strong> ${totalDishes}</p>
            <p><strong>Структура:</strong> Завтрак, Обед, Ужин</p>
            <div style="margin-top: 15px; color: #27ae60;">
                <i class="fas fa-check-circle"></i> Данные готовы к редактированию
            </div>
        </div>
    `;
}

function validateMenu() {
    if (!currentTemplateData) {
        showToast('Нет данных для проверки', 'warning');
        return;
    }
    
    let violations = [];
    let totalWeight = 0;
    let totalCalories = 0;
    let dishesWithIssues = 0;
    
    for (const week of Object.values(currentTemplateData.weeks)) {
        for (const day of Object.values(week)) {
            // Проверка завтрака
            const breakfastItems = day.breakfast?.items || [];
            const breakfastWeight = breakfastItems.reduce((s, i) => s + (i.weight || 0), 0);
            const breakfastCalories = breakfastItems.reduce((s, i) => s + (i.calories || 0), 0);
            totalWeight += breakfastWeight;
            totalCalories += breakfastCalories;
            
            if (breakfastWeight > 0 && breakfastWeight < 500) {
                violations.push('Завтрак: вес меньше 500г');
            }
            if (breakfastCalories > 0 && breakfastCalories < 470) {
                violations.push('Завтрак: калорийность меньше 470 ккал');
            }
            
            // Проверка обеда
            const lunchItems = day.lunch?.items || [];
            const lunchWeight = lunchItems.reduce((s, i) => s + (i.weight || 0), 0);
            const lunchCalories = lunchItems.reduce((s, i) => s + (i.calories || 0), 0);
            totalWeight += lunchWeight;
            totalCalories += lunchCalories;
            
            if (lunchWeight > 0 && lunchWeight < 700) {
                violations.push('Обед: вес меньше 700г');
            }
            if (lunchCalories > 0 && lunchCalories < 705) {
                violations.push('Обед: калорийность меньше 705 ккал');
            }
            
            // Проверка БЖУ
            [...breakfastItems, ...lunchItems].forEach(item => {
                const bjuSum = (item.proteins || 0) + (item.fats || 0) + (item.carbs || 0);
                if (bjuSum > (item.weight || 0) && (item.weight || 0) > 0) {
                    violations.push(`"${item.name}": БЖУ (${bjuSum}г) > вес (${item.weight}г)`);
                    dishesWithIssues++;
                }
            });
        }
    }
    
    if (violations.length === 0) {
        showToast('✅ Меню соответствует всем требованиям!', 'success');
    } else {
        showToast(`⚠️ Найдено ${violations.length} нарушений (${dishesWithIssues} блюд с ошибками БЖУ)`, 'warning');
        console.log('Violations:', violations);
    }
}

async function exportToExcel() {
    if (!currentTemplateData) {
        showToast('Нет данных для экспорта', 'warning');
        return;
    }
    
    try {
        const wsData = [];
        
        // Заголовки
        wsData.push(['Неделя', 'День', 'Прием пищи', 'Раздел', 'Блюдо', 'Вес (г)', 'Белки', 'Жиры', 'Углеводы', 'Калории']);
        
        // Данные
        for (const [weekNum, week] of Object.entries(currentTemplateData.weeks)) {
            for (const [dayNum, day] of Object.entries(week)) {
                const addMealRows = (mealName, items) => {
                    items.forEach(item => {
                        wsData.push([
                            weekNum, dayNum, mealName,
                            item.section || '',
                            item.name,
                            item.weight || 0,
                            item.proteins || 0,
                            item.fats || 0,
                            item.carbs || 0,
                            item.calories || 0
                        ]);
                    });
                };
                
                addMealRows('Завтрак', day.breakfast?.items || []);
                addMealRows('Обед', day.lunch?.items || []);
                addMealRows('Ужин', day.dinner?.items || []);
            }
        }
        
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Типовое меню');
        XLSX.writeFile(wb, `template-menu-${new Date().toISOString().slice(0, 10)}.xlsx`);
        
        showToast('Экспорт завершён', 'success');
    } catch (error) {
        console.error('Export error:', error);
        showToast(`Ошибка экспорта: ${error.message}`, 'error');
    }
}