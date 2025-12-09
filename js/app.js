// Основной скрипт приложения — полный рабочий функционал с защитой и проверками

// ===================== Данные приложения =====================
let appData = {
    test: {
        subject: "",
        className: "",
        testDate: new Date().toISOString().split('T')[0],
        theme: "",
        goals: "",
        workType: "current",
        timeLimit: 45,
        totalStudents: 0,
        presentStudents: 0,
        absentReason: "",
        criteria: { 5:{min:18,max:20},4:{min:15,max:17},3:{min:10,max:14},2:{min:0,max:9} }
    },
    tasks: [],
    students: [],
    results: [],
    errors: []
};

// экземпляры графиков
window.gradesChartInstance = null;
window.solvabilityChartInstance = null;
window.complexityChartInstance = null;

const STORAGE_KEY = 'edu_analytics_v1';

// ===================== Инициализация =====================
document.addEventListener('DOMContentLoaded', () => {
    // Установим дату по умолчанию
    const dateEl = document.getElementById('testDate');
    if (dateEl && !dateEl.value) dateEl.value = appData.test.testDate;

    loadData();
    normalizeResultsMatrix();
    renderAll();
});

// ===================== Навигация по вкладкам =====================
function showTab(id) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    const btns = Array.from(document.querySelectorAll('.tab-btn'));
    const index = ['setup','tasks','students','results','analytics','visualization','recommendations','export'].indexOf(id);
    if (index >= 0 && btns[index]) btns[index].classList.add('active');

    document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active');

    // рендер специфики вкладки
    if (id === 'visualization') initCharts();
    if (id === 'analytics') renderKpi();
}

// ===================== Сохранение/Загрузка =====================
let saveTimeout;
function scheduleAutoSave() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        saveData();
        createBackup();
        showNotification('Данные автоматически сохранены', 'success');
    }, 1200);
}

function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    } catch (e) {
        console.error('Ошибка сохранения данных', e);
        showNotification('Ошибка сохранения: место в localStorage исчерпано или ошибка сериализации', 'error');
    }
}

function loadData() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
        try {
            const parsed = JSON.parse(raw);
            // простая валидация структуры
            if (parsed && typeof parsed === 'object') {
                appData = Object.assign(appData, parsed);
            }
        } catch (e) {
            console.error('Ошибка парсинга данных', e);
            showNotification('Ошибка чтения сохранённых данных', 'error');
        }
    }
    appData.tasks = Array.isArray(appData.tasks) ? appData.tasks : [];
    appData.students = Array.isArray(appData.students) ? appData.students : [];
    appData.results = Array.isArray(appData.results) ? appData.results : [];
    normalizeResultsMatrix();
}

// ===================== Нормализация матрицы результатов =====================
function normalizeResultsMatrix() {
    const tasksCount = appData.tasks.length;
    const studentsCount = appData.students.length;
    // Ensure rows match studentsCount
    while (appData.results.length < studentsCount) {
        appData.results.push(Array(tasksCount).fill(0));
    }
    // Trim extra rows
    if (appData.results.length > studentsCount) {
        appData.results = appData.results.slice(0, studentsCount);
    }
    // Normalize each row length
    appData.results = appData.results.map(row => {
        row = Array.isArray(row) ? row.slice(0) : [];
        while (row.length < tasksCount) row.push(0);
        if (row.length > tasksCount) row = row.slice(0, tasksCount);
        return row;
    });
}

// ===================== Резервные копии =====================
function createBackup() {
    try {
        const timestampKey = new Date().toISOString().replace(/[:.]/g,'-');
        const backup = { data: JSON.parse(JSON.stringify(appData)), timestamp: new Date().toLocaleString(), version: '1.0' };
        localStorage.setItem(`backup_${timestampKey}`, JSON.stringify(backup));
        // keep last 5 backups, remove older
        const backups = Object.keys(localStorage).filter(k => k.startsWith('backup_')).sort().reverse();
        const keep = backups.slice(0,5);
        const remove = backups.slice(5);
        remove.forEach(key => localStorage.removeItem(key));
    } catch (e) {
        console.error('Ошибка создания бэкапа', e);
    }
}

function restoreBackupDialog() {
    const backups = Object.keys(localStorage).filter(k => k.startsWith('backup_')).map(k => {
        try {
            return { key:k, data: JSON.parse(localStorage.getItem(k)) };
        } catch (e) {
            return null;
        }
    }).filter(x => x).sort((a,b) => (b.data.timestamp || '').localeCompare(a.data.timestamp || ''));
    if (backups.length === 0) {
        showNotification('Резервные копии не найдены', 'warning');
        return;
    }
    let html = '<h3>Выберите резервную копию:</h3>';
    backups.forEach(b => {
        html += `<div class="backup-item" style="padding:8px;border:1px solid #ddd;margin:6px 0;cursor:pointer" onclick="restoreBackup('${b.key}')">
            <strong>${escapeHtml(b.data.timestamp || b.key)}</strong><br><small>${escapeHtml((b.data.data && (b.data.data.test && b.data.data.test.subject)) || '—')} — ${escapeHtml((b.data.data && (b.data.data.test && b.data.data.test.className)) || '—')}</small>
        </div>`;
    });
    showModal('Восстановление резервной копии', html);
}

function restoreBackup(key) {
    const raw = localStorage.getItem(key);
    if (!raw) return showNotification('Резервная копия не найдена', 'error');
    try {
        const backup = JSON.parse(raw);
        if (confirm('Восстановить эту резервную копию? Текущие данные будут заменены.')) {
            appData = backup.data || appData;
            normalizeResultsMatrix();
            saveData();
            renderAll();
            hideModal();
            showNotification('Резервная копия восстановлена', 'success');
        }
    } catch (e) {
        console.error('Ошибка восстановления бэкапа', e);
        showNotification('Ошибка восстановления резервной копии', 'error');
    }
}

// ===================== Уведомления и модалки =====================
function showNotification(message, type='info') {
    const n = document.getElementById('notification');
    if (!n) return;
    n.textContent = message;
    n.className = `notification ${type} show`;
    setTimeout(()=>{ n.classList.remove('show'); }, 3000);
}

function showModal(title, content) {
    const overlay = document.getElementById('modalOverlay');
    const modalContent = document.getElementById('modalContent');
    modalContent.innerHTML = `<h2>${escapeHtml(title)}</h2>${content}<div style="margin-top:12px;text-align:right;"><button class="btn" onclick="hideModal()">Закрыть</button></div>`;
    overlay.classList.add('show');
}

function hideModal() {
    document.getElementById('modalOverlay').classList.remove('show');
}

// ===================== Рендер всех вкладок =====================
function renderAll() {
    renderSetup();
    renderTasks();
    renderStudents();
    renderResults();
    renderKpi();
    renderReportPreview();
    if (document.getElementById('gradesChart')) initCharts();
}

// ---------- Настройки ----------
function renderSetup() {
    document.getElementById('subject').value = appData.test.subject || '';
    document.getElementById('className').value = appData.test.className || '';
    document.getElementById('testDate').value = appData.test.testDate || new Date().toISOString().split('T')[0];
    document.getElementById('testTheme').value = appData.test.theme || '';
    document.getElementById('testGoals').value = appData.test.goals || '';
    document.getElementById('workType').value = appData.test.workType || 'current';
}

function saveTestSettings() {
    appData.test.subject = document.getElementById('subject').value;
    appData.test.className = document.getElementById('className').value;
    appData.test.testDate = document.getElementById('testDate').value;
    appData.test.theme = document.getElementById('testTheme').value;
    appData.test.goals = document.getElementById('testGoals').value;
    appData.test.workType = document.getElementById('workType').value;
    saveData();
    showNotification('Настройки сохранены', 'success');
    renderReportPreview();
}

// ---------- Задания ----------
function renderTasks() {
    const container = document.getElementById('tasksContainer');
    if (!container) return;
    if (appData.tasks.length === 0) {
        container.innerHTML = '<p>Список заданий пуст. Добавьте задания.</p>';
        return;
    }
    let html = '<div class="table-container"><table><thead><tr><th>#</th><th>Тип/Название</th><th>Макс балл</th><th>Сложность</th><th>Действия</th></tr></thead><tbody>';
    appData.tasks.forEach((t, i) => {
        const safeType = escapeHtml(t.type || '');
        const maxScore = (t.maxScore !== undefined && !isNaN(Number(t.maxScore))) ? Number(t.maxScore) : 1;
        const complexity = [1,2,3,4].includes(Number(t.complexity)) ? Number(t.complexity) : 1;
        html += `<tr>
            <td>${i+1}</td>
            <td><input value="${safeType}" onchange="updateTask(${i}, this.value, null, null)"></td>
            <td><input type="number" value="${maxScore}" onchange="updateTask(${i}, null, parseFloat(this.value), null)"></td>
            <td><select onchange="updateTask(${i}, null, null, parseInt(this.value))">
                <option value="1"${complexity===1?' selected':''}>1</option>
                <option value="2"${complexity===2?' selected':''}>2</option>
                <option value="3"${complexity===3?' selected':''}>3</option>
                <option value="4"${complexity===4?' selected':''}>4</option>
            </select></td>
            <td><button class="btn btn-danger" onclick="removeTask(${i})">Удалить</button></td>
        </tr>`;
    });
    html += '</tbody></table></div>';
    container.innerHTML = html;
}

function addTask() {
    const newTask = { type: `Задание ${appData.tasks.length+1}`, maxScore: 1, complexity: 1 };
    appData.tasks.push(newTask);
    normalizeResultsMatrix();
    saveData();
    renderTasks();
    renderResults();
    showNotification('Задание добавлено', 'success');
}

function updateTask(index, newType=null, newMax=null, newComplexity=null) {
    const t = appData.tasks[index];
    if (!t) return;
    if (newType !== null) t.type = newType;
    if (newMax !== null && !isNaN(newMax)) t.maxScore = Number(newMax);
    if (newComplexity !== null && !isNaN(newComplexity)) t.complexity = parseInt(newComplexity) || 1;
    normalizeResultsMatrix();
    saveData();
    renderTasks();
    renderResults();
}

function removeTask(index) {
    if (!confirm('Удалить задание?')) return;
    appData.tasks.splice(index,1);
    normalizeResultsMatrix();
    saveData();
    renderTasks();
    renderResults();
}

// ---------- Учащиеся ----------
function renderStudents() {
    const container = document.getElementById('studentsContainer');
    if (!container) return;
    if (appData.students.length === 0) {
        container.innerHTML = '<p>Список учащихся пуст. Добавьте учеников.</p>';
        return;
    }
    let html = '<div class="table-container"><table><thead><tr><th>#</th><th>ФИО</th><th>Действия</th></tr></thead><tbody>';
    appData.students.forEach((s,i) => {
        html += `<tr>
            <td>${i+1}</td>
            <td><input value="${escapeHtml(s||'')}" onchange="updateStudent(${i}, this.value)"></td>
            <td><button class="btn btn-danger" onclick="removeStudent(${i})">Удалить</button></td>
        </tr>`;
    });
    html += '</tbody></table></div>';
    container.innerHTML = html;
}

function addStudent() {
    const name = prompt('ФИО нового ученика:');
    if (!name) return;
    appData.students.push(name);
    normalizeResultsMatrix();
    saveData();
    renderStudents();
    renderResults();
    showNotification('Ученик добавлен', 'success');
}

function updateStudent(i, name) {
    if (typeof name !== 'string') return;
    appData.students[i] = name;
    saveData();
    renderStudents();
    renderResults();
}

function removeStudent(i) {
    if (!confirm('Удалить ученика и все его результаты?')) return;
    appData.students.splice(i,1);
    normalizeResultsMatrix();
    saveData();
    renderStudents();
    renderResults();
}

// ---------- Результаты ----------
function renderResults() {
    const container = document.getElementById('resultsContainer');
    if (!container) return;
    if (appData.students.length === 0 || appData.tasks.length === 0) {
        container.innerHTML = '<p>Добавьте учеников и задания, чтобы ввести результаты.</p>';
        return;
    }

    normalizeResultsMatrix();

    // build table header
    let html = '<div class="table-container"><table><thead><tr><th>Ученик</th>';
    appData.tasks.forEach((t,i) => html += `<th>${i+1}<br><small>${escapeHtml(t.type)}</small></th>`);
    html += '<th>Итого</th></tr></thead><tbody>';

    appData.students.forEach((s, si) => {
        html += `<tr><td>${escapeHtml(s)}</td>`;
        const row = appData.results[si] || appData.tasks.map(()=>0);
        appData.results[si] = row; // ensure presence
        let sum = 0;
        row.forEach((val, ti) => {
            const max = (appData.tasks[ti] && appData.tasks[ti].maxScore) ? appData.tasks[ti].maxScore : 1;
            const safeVal = (val !== undefined && val !== null && !isNaN(Number(val))) ? Number(val) : 0;
            html += `<td><input type="number" min="0" max="${max}" value="${safeVal}" onchange="updateResult(${si}, ${ti}, parseFloat(this.value)||0)"></td>`;
            sum += Number(safeVal)||0;
        });
        html += `<td><strong>${sum}</strong></td></tr>`;
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;
}

function updateResult(studentIndex, taskIndex, value) {
    normalizeResultsMatrix();
    if (!appData.results[studentIndex]) appData.results[studentIndex] = appData.tasks.map(()=>0);
    let v = Number(value);
    if (isNaN(v)) v = 0;
    const max = (appData.tasks[taskIndex] && appData.tasks[taskIndex].maxScore) ? Number(appData.tasks[taskIndex].maxScore) : Infinity;
    v = Math.max(0, Math.min(max, v));
    appData.results[studentIndex][taskIndex] = v;
    saveData();
    renderResults();
    renderKpi();
}

function saveResults() {
    normalizeResultsMatrix();
    saveData();
    showNotification('Результаты сохранены', 'success');
    renderKpi();
}

// ================= Bulk edit: массовое редактирование =================
function showBulkEditScores() {
    const tasksOptions = appData.tasks.map((t,i) => `<option value="${i}" selected>${i+1}. ${escapeHtml(t.type)} (max:${t.maxScore})</option>`).join('');
    const studentsOptions = appData.students.map((s,i) => `<option value="${i}" selected>${escapeHtml(s)}</option>`).join('');
    const html = `
        <div class="form-group">
            <label>Действие:</label>
            <select id="bulkAction">
                <option value="set">Установить значение</option>
                <option value="add">Добавить баллы</option>
                <option value="multiply">Умножить на коэффициент</option>
                <option value="round">Округлить оценки</option>
            </select>
        </div>
        <div class="form-group" id="bulkValueContainer">
            <label>Значение:</label>
            <input type="number" id="bulkValue" value="0" min="-9999">
        </div>
        <div class="form-group">
            <label>Для заданий:</label>
            <select id="bulkTasks" multiple style="height:120px;">${tasksOptions}</select>
        </div>
        <div class="form-group">
            <label>Для учащихся:</label>
            <select id="bulkStudents" multiple style="height:120px;">${studentsOptions}</select>
        </div>
        <div style="text-align:right;">
            <button class="btn btn-warning" onclick="applyBulkEdit()">Применить</button>
            <button class="btn" onclick="previewBulkEdit()">Предпросмотр</button>
        </div>
    `;
    showModal('Массовое редактирование оценок', html);
}

function previewBulkEdit() {
    const action = document.getElementById('bulkAction').value;
    const value = parseFloat(document.getElementById('bulkValue').value) || 0;
    const selectedTasks = Array.from(document.getElementById('bulkTasks').selectedOptions).map(o=>parseInt(o.value));
    const selectedStudents = Array.from(document.getElementById('bulkStudents').selectedOptions).map(o=>parseInt(o.value));
    let changes = [];

    selectedStudents.forEach(si => {
        selectedTasks.forEach(ti => {
            const before = appData.results[si] && appData.results[si][ti] !== undefined ? appData.results[si][ti] : 0;
            let after = before;
            if (action === 'set') after = value;
            if (action === 'add') after = before + value;
            if (action === 'multiply') after = before * value;
            if (action === 'round') after = Math.round(before);
            changes.push({ student: appData.students[si], task: ti+1, before, after });
        });
    });

    let html = `<h3>Предпросмотр (${changes.length} изменений)</h3><div style="max-height:400px;overflow:auto"><table style="width:100%;border-collapse:collapse"><thead><tr><th>Ученик</th><th>Задание</th><th>Было</th><th>Станет</th></tr></thead><tbody>`;
    changes.forEach(c => {
        html += `<tr><td>${escapeHtml(c.student)}</td><td>${c.task}</td><td>${c.before}</td><td><strong>${c.after}</strong></td></tr>`;
    });
    html += '</tbody></table></div>';
    showModal('Предпросмотр изменений', html);
}

function applyBulkEdit() {
    const action = document.getElementById('bulkAction').value;
    const value = parseFloat(document.getElementById('bulkValue').value) || 0;
    const selectedTasks = Array.from(document.getElementById('bulkTasks').selectedOptions).map(o=>parseInt(o.value));
    const selectedStudents = Array.from(document.getElementById('bulkStudents').selectedOptions).map(o=>parseInt(o.value));

    normalizeResultsMatrix();

    selectedStudents.forEach(si => {
        appData.results[si] = appData.results[si] || appData.tasks.map(()=>0);
        selectedTasks.forEach(ti => {
            const before = appData.results[si][ti] || 0;
            let after = before;
            if (action === 'set') after = value;
            if (action === 'add') after = before + value;
            if (action === 'multiply') after = before * value;
            if (action === 'round') after = Math.round(before);
            // clamp
            if (appData.tasks[ti] && appData.tasks[ti].maxScore !== undefined) {
                after = Math.max(0, Math.min(appData.tasks[ti].maxScore, after));
            } else {
                after = Math.max(0, after);
            }
            appData.results[si][ti] = after;
        });
    });

    saveData();
    renderResults();
    hideModal();
    showNotification('Массовые изменения применены', 'success');
    renderKpi();
}

// ===================== KPI / Аналитика =====================
function renderKpi() {
    const container = document.getElementById('kpiDashboard');
    if (!container) return;
    const counts = appData.students.length;
    const tasksCount = appData.tasks.length;
    let totalMax = 0;
    appData.tasks.forEach(t => totalMax += Number(t.maxScore||0));
    let perStudent = appData.results.map(row => (row||[]).reduce((a,b)=>a+(Number(b)||0),0));
    const avg = perStudent.length ? (perStudent.reduce((a,b)=>a+b,0)/perStudent.length) : 0;
    const max = perStudent.length ? Math.max(...perStudent) : 0;
    container.innerHTML = `
        <div class="kpi-card"><div class="kpi-label">Учащихся</div><div class="kpi-value">${counts}</div></div>
        <div class="kpi-card"><div class="kpi-label">Средний балл</div><div class="kpi-value">${avg.toFixed(2)} / ${totalMax}</div></div>
        <div class="kpi-card"><div class="kpi-label">Максимум</div><div class="kpi-value">${max} / ${totalMax}</div></div>
    `;
}

// ===================== Шаблоны / sample data =====================
function loadSampleData() {
    appData.test.subject = "Математика";
    appData.test.className = "5А";
    appData.test.testDate = new Date().toISOString().split('T')[0];
    appData.test.theme = "Дроби и проценты";

    appData.tasks = [
        { type: "Простой пример", maxScore: 2, complexity:1 },
        { type: "Небольшая задача", maxScore: 3, complexity:2 },
        { type: "Задача повышенной сложности", maxScore: 4, complexity:3 },
        { type: "Творческое задание", maxScore: 5, complexity:4 }
    ];

    appData.students = ["Иванов И.И.","Петров П.П.","Сидорова А.А.","Козлова М.М."];
    appData.results = [
        [2,2,3,4],
        [1,3,2,2],
        [2,1,4,5],
        [0,2,1,3]
    ];

    normalizeResultsMatrix();
    saveData();
    renderAll();
    showNotification('Пример данных загружен', 'success');
}

// ===================== Экспорт =====================
function exportJSON() {
    const blob = new Blob([JSON.stringify(appData, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `edu_report_${new Date().toISOString().slice(0,10)}.json`);
}

function exportToExcel() {
    const wsData = [];
    const header = ['Ученик', ...appData.tasks.map((t,i)=>`${i+1}. ${t.type} (max:${t.maxScore})`), 'Итого'];
    wsData.push(header);
    appData.students.forEach((s, i) => {
        const row = [s];
        const vals = appData.results[i] || appData.tasks.map(()=>0);
        let sum = 0;
        vals.forEach((v,j)=>{ row.push(v); sum += Number(v)||0; });
        row.push(sum);
        wsData.push(row);
    });
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `edu_report_${new Date().toISOString().slice(0,10)}.xlsx`);
}

async function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit:'pt', format:'a4' });
    const title = `Аналитический отчет — ${appData.test.subject||''} ${appData.test.className||''}`;
    doc.setFontSize(14);
    doc.text(title, 40, 50);
    doc.setFontSize(10);
    let y = 80;
    const pageHeight = 770;
    appData.students.forEach((s,i) => {
        const vals = (appData.results[i] || appData.tasks.map(()=>0));
        const valsStr = vals.join(' | ');
        const line = `${i+1}. ${s} — ${valsStr}`;
        const lines = doc.splitTextToSize(line, 520);
        lines.forEach(ln => {
            doc.text(ln, 40, y);
            y += 14;
            if (y > pageHeight) { doc.addPage(); y = 40; }
        });
    });
    doc.save(`edu_report_${new Date().toISOString().slice(0,10)}.pdf`);
}

function exportHTML() {
    // Экспорт полной страницы (documentElement) чтобы получился автономный HTML-файл
    const html = '<!doctype html>\n' + document.documentElement.outerHTML;
    const blob = new Blob([html], { type: 'text/html' });
    downloadBlob(blob, `edu_report_${new Date().toISOString().slice(0,10)}.html`);
}

function downloadBlob(blob, filename) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 100);
}

// печать
function printFullReport() {
    window.print();
}

// ===================== Отчётный превью =====================
function renderReportPreview() {
    const el = document.getElementById('reportPreview');
    if (!el) return;
    let html = `<h3>Отчет: ${escapeHtml(appData.test.subject||'—')}</h3>`;
    html += `<p><strong>Класс:</strong> ${escapeHtml(appData.test.className||'—')} | <strong>Тема:</strong> ${escapeHtml(appData.test.theme||'—')} | <strong>Дата:</strong> ${escapeHtml(appData.test.testDate||'—')}</p>`;
    html += '<h4>Результаты</h4>';
    html += '<div class="table-container"><table><thead><tr><th>Ученик</th>';
    appData.tasks.forEach((t,i) => html += `<th>${i+1}</th>`);
    html += '<th>Итого</th></tr></thead><tbody>';
    appData.students.forEach((s,i) => {
        html += `<tr><td>${escapeHtml(s)}</td>`;
        const row = appData.results[i] || appData.tasks.map(()=>0);
        let sum=0;
        row.forEach(v => { html += `<td>${v}</td>`; sum += Number(v)||0; });
        html += `<td><strong>${sum}</strong></td></tr>`;
    });
    html += '</tbody></table></div>';
    el.innerHTML = html;
}

// ===================== Чарты =====================
function initCharts() {
    if (!document.getElementById('gradesChart')) return;
    normalizeResultsMatrix();

    const gradesEl = document.getElementById('gradesChart');
    if (gradesEl && gradesEl.getContext) {
        const gradesCtx = gradesEl.getContext('2d');
        const labels = appData.students.map((s,i) => (i+1)+'. '+ (s.split(' ')[0] || s));
        const sums = appData.results.map(r => (r||[]).reduce((a,b)=>a+(Number(b)||0),0));
        if (window.gradesChartInstance) window.gradesChartInstance.destroy();
        window.gradesChartInstance = new Chart(gradesCtx, {
            type: 'bar',
            data: { labels, datasets:[{ label:'Сумма баллов', data: sums, backgroundColor:'#3498db' }] },
            options: { responsive:true, plugins:{legend:{display:false}} }
        });
    }

    const solvEl = document.getElementById('solvabilityChart');
    if (solvEl && solvEl.getContext) {
        const solvCtx = solvEl.getContext('2d');
        const avgPerTask = appData.tasks.map((t,ti) => {
            const vals = appData.results.map(r => (r && r[ti])? r[ti]:0);
            const avg = vals.length ? (vals.reduce((a,b)=>a+b,0)/vals.length) : 0;
            return t.maxScore ? (avg / t.maxScore * 100) : 0;
        });
        if (window.solvabilityChartInstance) window.solvabilityChartInstance.destroy();
        window.solvabilityChartInstance = new Chart(solvCtx, {
            type: 'line',
            data: { labels: appData.tasks.map((t,i)=>i+1), datasets:[{ label:'Решаемость (%)', data: avgPerTask, borderColor:'#27ae60', backgroundColor:'rgba(39,174,96,0.2)', tension:0.3 }]},
            options:{ responsive:true, plugins:{legend:{display:false}} }
        });
    }

    const compEl = document.getElementById('complexityChart');
    if (compEl && compEl.getContext) {
        const compCtx = compEl.getContext('2d');
        const complexityBuckets = [1,2,3,4].map(level => {
            const taskIndexes = appData.tasks.map((t,i)=> t.complexity===level ? i : -1).filter(i=>i>=0);
            if (taskIndexes.length===0) return 0;
            const avg = taskIndexes.map(ti => {
                const vals = appData.results.map(r => (r && r[ti])? r[ti]:0);
                return vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : 0;
            }).reduce((a,b)=>a+b,0) / taskIndexes.length;
            return avg;
        });
        if (window.complexityChartInstance) window.complexityChartInstance.destroy();
        window.complexityChartInstance = new Chart(compCtx, {
            type: 'bar',
            data: { labels: ['Базовый','Применение','Анализ','Творчество'], datasets:[{ label:'Средний балл', data: complexityBuckets, backgroundColor:['#27ae60','#3498db','#f39c12','#e74c3c'] }]},
            options:{ responsive:true, plugins:{legend:{display:false}} }
        });
    }

    // тепловая карта: простая таблица процентов
    renderHeatmap();
}

function renderHeatmap() {
    const cont = document.getElementById('heatmapContainer');
    if (!cont) return;
    if (appData.students.length === 0 || appData.tasks.length === 0) { cont.innerHTML = '<p>Добавьте данные для тепловой карты</p>'; return; }
    let html = '<div style="display:flex;flex-wrap:wrap;gap:6px;">';
    appData.students.forEach((s,si) => {
        html += `<div style="min-width:160px;border:1px solid #eee;padding:8px;border-radius:6px;"><strong>${escapeHtml(s)}</strong><div style="margin-top:6px;">`;
        appData.results[si] = appData.results[si] || appData.tasks.map(()=>0);
        appData.results[si].forEach((v,ti) => {
            const max = appData.tasks[ti].maxScore || 1;
            const p = Math.round((v/max)*100);
            const cls = p>90 ? 'heatmap-100' : p>75 ? 'heatmap-80' : p>50 ? 'heatmap-60' : p>30 ? 'heatmap-40' : p>10 ? 'heatmap-20' : 'heatmap-0';
            html += `<span class="heatmap-cell ${cls}" title="${v}/${max}">${p}%</span>`;
        });
        html += '</div></div>';
    });
    html += '</div>';
    cont.innerHTML = html;
}

// ===================== Утилиты =====================
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/[&<>"']/g, function(m){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]; });
}