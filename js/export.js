/**
 * Модуль экспорта данных в различные форматы
 */

// ==================== ЭКСПОРТ В EXCEL (XLSX) ====================

/**
 * Экспорт результатов в Excel
 */
function exportToExcel() {
    try {
        if (typeof XLSX === 'undefined') {
            showNotification('Библиотека XLSX не загружена!', 'error');
            return;
        }
        
        const wb = XLSX.utils.book_new();
        const subject = app.data.test.subject || 'Предмет';
        const className = app.data.test.class || 'Класс';
        const date = formatDate(app.data.test.testDate, 'iso') || new Date().toISOString().split('T')[0];
        
        // 1. Лист с результатами
        const resultsData = [];
        
        // Заголовки
        const headers = ['№', 'Учащийся', ...app.data.tasks.map((t, i) => `Задание ${i+1}`), 'Сумма', 'Оценка', 'Процент'];
        resultsData.push(headers);
        
        // Данные
        app.data.students.forEach((student, index) => {
            const scores = app.data.results[index] || [];
            const total = scores.reduce((sum, score) => sum + (score || 0), 0);
            const grade = app.calculateGrade(total);
            const maxPossible = app.data.tasks.reduce((sum, task) => sum + (task.maxScore || 0), 0);
            const percentage = maxPossible > 0 ? (total / maxPossible * 100) : 0;
            
            const row = [
                index + 1,
                student,
                ...scores,
                total,
                grade,
                percentage.toFixed(1) + '%'
            ];
            resultsData.push(row);
        });
        
        const wsResults = XLSX.utils.aoa_to_sheet(resultsData);
        
        // Настройка ширины колонок
        const colWidths = [];
        headers.forEach((header, i) => {
            if (i === 0) colWidths.push({ wch: 5 }); // №
            else if (i === 1) colWidths.push({ wch: 25 }); // Учащийся
            else if (i < headers.length - 3) colWidths.push({ wch: 10 }); // Задания
            else colWidths.push({ wch: 12 }); // Итоговые колонки
        });
        wsResults['!cols'] = colWidths;
        
        XLSX.utils.book_append_sheet(wb, wsResults, 'Результаты');
        
        // 2. Лист с аналитикой
        const analysisData = [
            ['Аналитический отчет', '', '', '', ''],
            ['Предмет:', app.data.test.subject || '-', '', '', ''],
            ['Класс:', app.data.test.class || '-', '', '', ''],
            ['Тема:', app.data.test.theme || '-', '', '', ''],
            ['Дата:', formatDate(app.data.test.testDate, 'ru') || '-', '', '', ''],
            ['', '', '', '', ''],
            ['Ключевые показатели', 'Значение', '', '', ''],
            ['Средний балл', calculateAverageScore().toFixed(2), '', '', ''],
            ['Успеваемость', calculateSuccessRate().toFixed(1) + '%', '', '', ''],
            ['Качество знаний', calculateQualityRate().toFixed(1) + '%', '', '', ''],
            ['СОУ', calculateSou().toFixed(1) + '%', '', '', ''],
            ['', '', '', '', ''],
            ['Распределение оценок', 'Количество', 'Процент', '', ''],
            ['5 (отлично)', countGrades(5), formatPercent(countGrades(5) / app.data.students.length * 100), '', ''],
            ['4 (хорошо)', countGrades(4), formatPercent(countGrades(4) / app.data.students.length * 100), '', ''],
            ['3 (удовлетв.)', countGrades(3), formatPercent(countGrades(3) / app.data.students.length * 100), '', ''],
            ['2 (неудовл.)', countGrades(2), formatPercent(countGrades(2) / app.data.students.length * 100), '', '']
        ];
        
        const wsAnalysis = XLSX.utils.aoa_to_sheet(analysisData);
        XLSX.utils.book_append_sheet(wb, wsAnalysis, 'Аналитика');
        
        // 3. Лист с ошибками (если есть)
        if (app.data.errors.length > 0) {
            const errorsData = [['Учащийся', 'Задание', 'Тип ошибки', 'Описание', 'Дата']];
            
            app.data.errors.forEach(error => {
                const studentName = app.data.students[error.studentIndex] || `Уч. ${error.studentIndex + 1}`;
                const taskNumber = (error.taskIndex + 1).toString();
                const errorType = ERROR_TYPES[error.type]?.name || error.type;
                const description = error.description || '';
                const date = error.timestamp ? formatDate(error.timestamp, 'full') : '';
                
                errorsData.push([studentName, taskNumber, errorType, description, date]);
            });
            
            const wsErrors = XLSX.utils.aoa_to_sheet(errorsData);
            XLSX.utils.book_append_sheet(wb, wsErrors, 'Ошибки');
        }
        
        // Сохранение файла
        const filename = `анализ_${subject}_${className}_${date}.xlsx`;
        XLSX.writeFile(wb, filename);
        
        showNotification('Excel файл успешно экспортирован', 'success');
        
    } catch (error) {
        console.error('Ошибка при экспорте в Excel:', error);
        showNotification('Ошибка при экспорте в Excel: ' + error.message, 'error');
    }
}

/**
 * Экспорт в CSV
 */
function exportToCSV() {
    try {
        const subject = app.data.test.subject || 'Предмет';
        const className = app.data.test.class || 'Класс';
        const date = formatDate(app.data.test.testDate, 'iso') || new Date().toISOString().split('T')[0];
        
        let csvContent = "Учащийся;";
        
        // Заголовки заданий
        app.data.tasks.forEach((task, i) => {
            csvContent += `"Задание ${i+1}";`;
        });
        
        csvContent += "Сумма;Оценка;Процент\n";
        
        // Данные
        app.data.students.forEach((student, index) => {
            const scores = app.data.results[index] || [];
            const total = scores.reduce((sum, score) => sum + (score || 0), 0);
            const grade = app.calculateGrade(total);
            const maxPossible = app.data.tasks.reduce((sum, task) => sum + (task.maxScore || 0), 0);
            const percentage = maxPossible > 0 ? (total / maxPossible * 100) : 0;
            
            csvContent += `"${student}";`;
            
            scores.forEach(score => {
                csvContent += `${score};`;
            });
            
            csvContent += `${total};${grade};${percentage.toFixed(1)}%\n`;
        });
        
        // Добавляем аналитику
        csvContent += "\n\nАНАЛИТИКА\n";
        csvContent += `Предмет;${app.data.test.subject || '-'}\n`;
        csvContent += `Класс;${app.data.test.class || '-'}\n`;
        csvContent += `Тема;${app.data.test.theme || '-'}\n`;
        csvContent += `Дата;${formatDate(app.data.test.testDate, 'ru') || '-'}\n\n`;
        csvContent += `Средний балл;${calculateAverageScore().toFixed(2)}\n`;
        csvContent += `Успеваемость;${calculateSuccessRate().toFixed(1)}%\n`;
        csvContent += `Качество знаний;${calculateQualityRate().toFixed(1)}%\n`;
        csvContent += `СОУ;${calculateSou().toFixed(1)}%\n`;
        
        const filename = `анализ_${subject}_${className}_${date}.csv`;
        utils.downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
        
        showNotification('CSV файл успешно экспортирован', 'success');
        
    } catch (error) {
        console.error('Ошибка при экспорте в CSV:', error);
        showNotification('Ошибка при экспорте в CSV: ' + error.message, 'error');
    }
}

// ==================== ЭКСПОРТ В PDF ====================

/**
 * Экспорт в PDF
 */
function exportToPDF() {
    try {
        if (typeof jspdf === 'undefined') {
            showNotification('Библиотека jsPDF не загружена!', 'error');
            return;
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        
        const margin = 20;
        let yPos = margin;
        const pageWidth = doc.internal.pageSize.getWidth();
        const contentWidth = pageWidth - 2 * margin;
        
        // Заголовок
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Аналитический отчет по диагностической работе', margin, yPos);
        yPos += 10;
        
        // Основная информация
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        
        const info = [
            `Предмет: ${app.data.test.subject || 'Не указан'}`,
            `Класс: ${app.data.test.class || 'Не указан'}`,
            `Тема: ${app.data.test.theme || 'Не указана'}`,
            `Дата проведения: ${formatDate(app.data.test.testDate, 'ru') || 'Не указана'}`
        ];
        
        info.forEach(line => {
            doc.text(line, margin, yPos);
            yPos += 7;
        });
        
        yPos += 10;
        
        // Ключевые показатели
        doc.setFont('helvetica', 'bold');
        doc.text('Ключевые показатели:', margin, yPos);
        yPos += 7;
        doc.setFont('helvetica', 'normal');
        
        const kpis = [
            `• Средний балл: ${calculateAverageScore().toFixed(2)}`,
            `• Успеваемость: ${calculateSuccessRate().toFixed(1)}%`,
            `• Качество знаний: ${calculateQualityRate().toFixed(1)}%`,
            `• СОУ: ${calculateSou().toFixed(1)}%`
        ];
        
        kpis.forEach(line => {
            if (yPos > 270) {
                doc.addPage();
                yPos = margin;
            }
            doc.text(line, margin + 5, yPos);
            yPos += 7;
        });
        
        yPos += 5;
        
        // Распределение оценок
        doc.setFont('helvetica', 'bold');
        doc.text('Распределение оценок:', margin, yPos);
        yPos += 7;
        doc.setFont('helvetica', 'normal');
        
        const totalStudents = app.data.students.length;
        const gradeLabels = ['5 (отлично)', '4 (хорошо)', '3 (удовлетв.)', '2 (неудовл.)'];
        const gradeCounts = [countGrades(5), countGrades(4), countGrades(3), countGrades(2)];
        
        gradeLabels.forEach((label, i) => {
            const count = gradeCounts[i];
            const percent = totalStudents > 0 ? (count / totalStudents * 100).toFixed(1) : 0;
            doc.text(`${label}: ${count} учащихся (${percent}%)`, margin + 5, yPos);
            yPos += 6;
        });
        
        yPos += 10;
        
        // Таблица с результатами (первые 15 студентов)
        doc.setFont('helvetica', 'bold');
        doc.text('Результаты учащихся (первые 15):', margin, yPos);
        yPos += 7;
        
        // Заголовки таблицы
        const colWidths = [10, 60, 20, 20, 20];
        const headers = ['№', 'Учащийся', 'Сумма', 'Оценка', '%'];
        
        doc.setFontSize(9);
        let xPos = margin;
        headers.forEach((header, i) => {
            doc.text(header, xPos, yPos);
            xPos += colWidths[i];
        });
        
        yPos += 5;
        doc.line(margin, yPos, margin + contentWidth, yPos);
        yPos += 3;
        
        // Данные студентов
        doc.setFont('helvetica', 'normal');
        const maxStudents = Math.min(15, app.data.students.length);
        
        for (let i = 0; i < maxStudents; i++) {
            if (yPos > 270) {
                doc.addPage();
                yPos = margin;
            }
            
            const student = app.data.students[i];
            const scores = app.data.results[i] || [];
            const total = scores.reduce((sum, score) => sum + (score || 0), 0);
            const grade = app.calculateGrade(total);
            const maxPossible = app.data.tasks.reduce((sum, task) => sum + (task.maxScore || 0), 0);
            const percentage = maxPossible > 0 ? (total / maxPossible * 100) : 0;
            
            xPos = margin;
            doc.text(`${i + 1}`, xPos, yPos);
            xPos += colWidths[0];
            
            // Обрезаем длинные имена
            const studentName = student.length > 25 ? student.substring(0, 22) + '...' : student;
            doc.text(studentName, xPos, yPos);
            xPos += colWidths[1];
            
            doc.text(total.toString(), xPos, yPos);
            xPos += colWidths[2];
            
            doc.text(grade.toString(), xPos, yPos);
            xPos += colWidths[3];
            
            doc.text(percentage.toFixed(1) + '%', xPos, yPos);
            
            yPos += 5;
        }
        
        // Футер
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(`Отчет сгенерирован ${new Date().toLocaleDateString('ru-RU')}`, margin, 285);
        doc.text('Система анализа образовательных результатов', pageWidth - margin - 80, 285);
        
        // Сохранение
        const filename = `отчет_${app.data.test.subject || 'предмет'}_${formatDate(app.data.test.testDate, 'iso') || 'дата'}.pdf`;
        doc.save(filename);
        
        showNotification('PDF файл успешно экспортирован', 'success');
        
    } catch (error) {
        console.error('Ошибка при экспорте в PDF:', error);
        showNotification('Ошибка при экспорте в PDF: ' + error.message, 'error');
    }
}

/**
 * Экспорт в HTML для печати
 */
function exportHTML() {
    try {
        const subject = app.data.test.subject || 'Предмет';
        const className = app.data.test.class || 'Класс';
        const date = formatDate(app.data.test.testDate, 'iso') || new Date().toISOString().split('T')[0];
        
        let html = `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Отчет: ${subject}, ${className}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        h1, h2, h3 { color: #2c3e50; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
        .kpi-card { background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #3498db; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        .kpi-value { font-size: 1.8em; font-weight: bold; margin: 5px 0; }
        .kpi-label { color: #7f8c8d; font-size: 0.9em; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #34495e; color: white; }
        tr:nth-child(even) { background: #f8f9fa; }
        .print-only { display: block; }
        @media print {
            body { margin: 0; padding: 0; font-size: 12pt; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Аналитический отчет по диагностической работе</h1>
        <h2>${subject}, ${className}</h2>
        <p><strong>Тема:</strong> ${app.data.test.theme || 'Не указана'}</p>
        <p><strong>Дата проведения:</strong> ${formatDate(app.data.test.testDate, 'ru') || 'Не указана'}</p>
    </div>
    
    <div class="kpi-grid">
        <div class="kpi-card">
            <div class="kpi-value">${calculateAverageScore().toFixed(2)}</div>
            <div class="kpi-label">Средний балл</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-value">${calculateSuccessRate().toFixed(1)}%</div>
            <div class="kpi-label">Успеваемость</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-value">${calculateQualityRate().toFixed(1)}%</div>
            <div class="kpi-label">Качество знаний</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-value">${calculateSou().toFixed(1)}%</div>
            <div class="kpi-label">СОУ</div>
        </div>
    </div>
    
    <h3>Распределение оценок</h3>
    <table>
        <tr>
            <th>Оценка</th>
            <th>Количество</th>
            <th>Процент</th>
        </tr>
        <tr>
            <td>5 (отлично)</td>
            <td>${countGrades(5)}</td>
            <td>${(countGrades(5) / app.data.students.length * 100).toFixed(1)}%</td>
        </tr>
        <tr>
            <td>4 (хорошо)</td>
            <td>${countGrades(4)}</td>
            <td>${(countGrades(4) / app.data.students.length * 100).toFixed(1)}%</td>
        </tr>
        <tr>
            <td>3 (удовлетв.)</td>
            <td>${countGrades(3)}</td>
            <td>${(countGrades(3) / app.data.students.length * 100).toFixed(1)}%</td>
        </tr>
        <tr>
            <td>2 (неудовл.)</td>
            <td>${countGrades(2)}</td>
            <td>${(countGrades(2) / app.data.students.length * 100).toFixed(1)}%</td>
        </tr>
    </table>
    
    <h3>Результаты учащихся</h3>
    <table>
        <tr>
            <th>№</th>
            <th>Учащийся</th>
        `;
        
        // Заголовки заданий
        app.data.tasks.forEach((task, i) => {
            html += `<th>${i+1}</th>`;
        });
        
        html += `
            <th>Сумма</th>
            <th>Оценка</th>
            <th>%</th>
        </tr>
        `;
        
        // Данные студентов
        app.data.students.forEach((student, index) => {
            const scores = app.data.results[index] || [];
            const total = scores.reduce((sum, score) => sum + (score || 0), 0);
            const grade = app.calculateGrade(total);
            const maxPossible = app.data.tasks.reduce((sum, task) => sum + (task.maxScore || 0), 0);
            const percentage = maxPossible > 0 ? (total / maxPossible * 100) : 0;
            
            html += `<tr>
                <td>${index + 1}</td>
                <td>${student}</td>`;
            
            scores.forEach(score => {
                html += `<td>${score}</td>`;
            });
            
            html += `
                <td><strong>${total}</strong></td>
                <td>${grade}</td>
                <td>${percentage.toFixed(1)}%</td>
            </tr>`;
        });
        
        html += `
    </table>
    
    <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #eee; font-size: 11px; color: #7f8c8d;">
        <p>Отчет сгенерирован ${new Date().toLocaleDateString('ru-RU')} ${new Date().toLocaleTimeString('ru-RU')}</p>
        <p>Система анализа образовательных результатов</p>
    </div>
    
    <div class="no-print" style="margin-top: 30px; text-align: center;">
        <button onclick="window.print()" style="padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">
            🖨️ Печать отчета
        </button>
    </div>
    
    <script>
        // Автоматическая печать при загрузке
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 1000);
        };
    </script>
</body>
</html>`;
        
        const filename = `отчет_${subject}_${className}_${date}.html`;
        utils.downloadFile(html, filename, 'text/html');
        
        showNotification('HTML отчет успешно экспортирован', 'success');
        
    } catch (error) {
        console.error('Ошибка при экспорте в HTML:', error);
        showNotification('Ошибка при экспорте в HTML: ' + error.message, 'error');
    }
}

// ==================== ЭКСПОРТ ДЛЯ СИСТЕМ ====================

/**
 * Экспорт для электронного дневника
 */
function exportForEJournal() {
    try {
        const data = {
            meta: {
                system: 'education-analytics',
                version: '2.0',
                exportDate: new Date().toISOString()
            },
            test: {
                subject: app.data.test.subject,
                class: app.data.test.class,
                theme: app.data.test.theme,
                date: app.data.test.testDate,
                type: app.data.test.workType,
                totalStudents: app.data.test.totalStudents,
                presentStudents: app.data.test.presentStudents
            },
            results: app.data.students.map((student, index) => {
                const scores = app.data.results[index] || [];
                const total = scores.reduce((sum, score) => sum + (score || 0), 0);
                const grade = app.calculateGrade(total);
                const maxPossible = app.data.tasks.reduce((sum, task) => sum + (task.maxScore || 0), 0);
                const percentage = maxPossible > 0 ? (total / maxPossible * 100) : 0;
                
                return {
                    student: student,
                    scores: scores,
                    total: total,
                    grade: grade,
                    percentage: percentage,
                    comment: generateStudentComment(index),
                    details: app.data.tasks.map((task, taskIndex) => ({
                        task: taskIndex + 1,
                        score: scores[taskIndex] || 0,
                        max: task.maxScore || 0,
                        percentage: task.maxScore > 0 ? ((scores[taskIndex] || 0) / task.maxScore * 100) : 0
                    }))
                };
            }),
            statistics: {
                averageScore: calculateAverageScore(),
                successRate: calculateSuccessRate(),
                qualityRate: calculateQualityRate(),
                sou: calculateSou(),
                gradeDistribution: {
                    5: countGrades(5),
                    4: countGrades(4),
                    3: countGrades(3),
                    2: countGrades(2)
                }
            }
        };
        
        const jsonStr = JSON.stringify(data, null, 2);
        const filename = `электронный_дневник_${app.data.test.subject || 'предмет'}_${formatDate(app.data.test.testDate, 'iso') || 'дата'}.json`;
        utils.downloadFile(jsonStr, filename, 'application/json');
        
        showNotification('Данные для электронного дневника экспортированы', 'success');
        
    } catch (error) {
        console.error('Ошибка при экспорте для эл.дневника:', error);
        showNotification('Ошибка при экспорте: ' + error.message, 'error');
    }
}

/**
 * Экспорт в JSON для резервного копирования
 */
function exportJSON() {
    try {
        const exportData = {
            appData: app.data,
            exportInfo: {
                timestamp: new Date().toISOString(),
                version: '2.0',
                user: navigator.userAgent,
                dataType: 'full-export'
            }
        };
        
        const jsonStr = JSON.stringify(exportData, null, 2);
        const filename = `резервная_копия_${formatDate(new Date(), 'iso')}.json`;
        utils.downloadFile(jsonStr, filename, 'application/json');
        
        showNotification('Резервная копия данных экспортирована', 'success');
        
    } catch (error) {
        console.error('Ошибка при экспорте JSON:', error);
        showNotification('Ошибка при экспорте: ' + error.message, 'error');
    }
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ЭКСПОРТА ====================

/**
 * Генерация комментария для студента
 * @param {number} studentIndex - Индекс студента
 * @returns {string}
 */
function generateStudentComment(studentIndex) {
    const scores = app.data.results[studentIndex] || [];
    const total = scores.reduce((sum, score) => sum + (score || 0), 0);
    const grade = app.calculateGrade(total);
    const maxPossible = app.data.tasks.reduce((sum, task) => sum + (task.maxScore || 0), 0);
    const percentage = maxPossible > 0 ? (total / maxPossible * 100) : 0;
    
    const studentErrors = app.data.errors.filter(e => e.studentIndex === studentIndex);
    
    let comment = '';
    
    if (percentage >= 90) {
        comment = 'Отличный результат! Материал усвоен в полном объеме.';
    } else if (percentage >= 75) {
        comment = 'Хороший результат. Есть незначительные ошибки.';
    } else if (percentage >= 60) {
        comment = 'Удовлетворительный результат. Требуется повторение отдельных тем.';
    } else if (percentage >= 40) {
        comment = 'Результат ниже среднего. Необходима дополнительная работа.';
    } else {
        comment = 'Низкий результат. Требуется индивидуальная работа с учителем.';
    }
    
    // Добавляем информацию об ошибках
    if (studentErrors.length > 0) {
        const errorTypes = studentErrors.map(e => ERROR_TYPES[e.type]?.name || e.type);
        const uniqueErrors = [...new Set(errorTypes)];
        comment += ` Основные ошибки: ${uniqueErrors.join(', ')}.`;
    }
    
    return comment;
}

/**
 * Расчет среднего балла
 * @returns {number}
 */
function calculateAverageScore() {
    if (app.data.results.length === 0) return 0;
    
    const totalScores = app.data.results.map(scores => {
        return scores.reduce((sum, score) => sum + (score || 0), 0);
    });
    
    return totalScores.reduce((sum, score) => sum + score, 0) / totalScores.length;
}

/**
 * Расчет успеваемости
 * @returns {number}
 */
function calculateSuccessRate() {
    if (app.data.results.length === 0) return 0;
    
    const totalScores = app.data.results.map(scores => {
        return scores.reduce((sum, score) => sum + (score || 0), 0);
    });
    
    const grades = totalScores.map(score => app.calculateGrade(score));
    return (grades.filter(grade => grade >= 3).length / grades.length * 100);
}

/**
 * Расчет качества знаний
 * @returns {number}
 */
function calculateQualityRate() {
    if (app.data.results.length === 0) return 0;
    
    const totalScores = app.data.results.map(scores => {
        return scores.reduce((sum, score) => sum + (score || 0), 0);
    });
    
    const grades = totalScores.map(score => app.calculateGrade(score));
    return (grades.filter(grade => grade >= 4).length / grades.length * 100);
}

/**
 * Расчет СОУ (степень обученности учащихся)
 * @returns {number}
 */
function calculateSou() {
    if (app.data.results.length === 0) return 0;
    
    const totalScores = app.data.results.map(scores => {
        return scores.reduce((sum, score) => sum + (score || 0), 0);
    });
    
    const grades = totalScores.map(score => app.calculateGrade(score));
    const gradeWeights = {5: 1.0, 4: 0.64, 3: 0.36, 2: 0.14};
    
    const weightedSum = grades.reduce((sum, grade) => {
        return sum + (gradeWeights[grade] || 0);
    }, 0);
    
    return (weightedSum / grades.length * 100);
}

/**
 * Подсчет количества оценок
 * @param {number} grade - Оценка (2-5)
 * @returns {number}
 */
function countGrades(grade) {
    if (app.data.results.length === 0) return 0;
    
    const totalScores = app.data.results.map(scores => {
        return scores.reduce((sum, score) => sum + (score || 0), 0);
    });
    
    const grades = totalScores.map(score => app.calculateGrade(score));
    return grades.filter(g => g === grade).length;
}

// ==================== ПЕЧАТЬ ОТЧЕТОВ ====================

/**
 * Печать полного отчета
 */
function printFullReport() {
    // Сохраняем текущее состояние вкладок
    const activeTab = localStorage.getItem('activeTab');
    
    // Показываем все вкладки для печати
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('active');
    });
    
    // Скрываем ненужные элементы
    document.querySelectorAll('.no-print').forEach(el => {
        el.style.display = 'none';
    });
    
    // Добавляем информацию для печати
    const printSubject = document.getElementById('printSubject');
    const printClass = document.getElementById('printClass');
    const printTheme = document.getElementById('printTheme');
    const printDate = document.getElementById('printDate');
    
    if (printSubject) printSubject.textContent = app.data.test.subject || '';
    if (printClass) printClass.textContent = app.data.test.class || '';
    if (printTheme) printTheme.textContent = app.data.test.theme || '';
    if (printDate) printDate.textContent = formatDate(app.data.test.testDate, 'ru') || '';
    
    // Печать
    window.print();
    
    // Восстанавливаем состояние
    setTimeout(() => {
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        document.querySelectorAll('.no-print').forEach(el => {
            el.style.display = '';
        });
        
        if (activeTab) {
            const tabButton = document.querySelector(`.tab-btn[onclick*="${activeTab}"]`);
            if (tabButton) {
                tabButton.click();
            }
        }
    }, 500);
}

/**
 * Оптимизированная печать
 */
function printOptimizedReport() {
    // Создаем временный iframe для печати
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
    
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    
    // Генерируем оптимизированный контент для печати
    iframeDoc.open();
    iframeDoc.write(generatePrintContent());
    iframeDoc.close();
    
    // Печать
    setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        
        // Удаляем iframe после печати
        setTimeout(() => {
            document.body.removeChild(iframe);
        }, 1000);
    }, 500);
}

/**
 * Генерация контента для печати
 * @returns {string}
 */
function generatePrintContent() {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Отчет по диагностической работе</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; font-size: 12pt; }
        h1, h2, h3 { color: #000; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { padding: 8px; border: 1px solid #ddd; text-align: left; }
        th { background: #f2f2f2; font-weight: bold; }
        .header { text-align: center; margin-bottom: 20px; }
        .kpi { display: flex; justify-content: space-between; margin: 20px 0; }
        .kpi-item { text-align: center; flex: 1; }
        .kpi-value { font-size: 24pt; font-weight: bold; }
        .kpi-label { font-size: 10pt; color: #666; }
        @page { size: A4; margin: 2cm; }
        @media print {
            body { margin: 0; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Аналитический отчет</h1>
        <h2>${app.data.test.subject || ''}, ${app.data.test.class || ''}</h2>
        <p>Тема: ${app.data.test.theme || ''}</p>
        <p>Дата: ${formatDate(app.data.test.testDate, 'ru') || ''}</p>
    </div>
    
    <div class="kpi">
        <div class="kpi-item">
            <div class="kpi-value">${calculateAverageScore().toFixed(2)}</div>
            <div class="kpi-label">Средний балл</div>
        </div>
        <div class="kpi-item">
            <div class="kpi-value">${calculateSuccessRate().toFixed(1)}%</div>
            <div class="kpi-label">Успеваемость</div>
        </div>
        <div class="kpi-item">
            <div class="kpi-value">${calculateQualityRate().toFixed(1)}%</div>
            <div class="kpi-label">Качество знаний</div>
        </div>
    </div>
    
    <h3>Результаты учащихся</h3>
    <table>
        <tr>
            <th>№</th>
            <th>Учащийся</th>
            <th>Сумма</th>
            <th>Оценка</th>
            <th>%</th>
        </tr>
        ${app.data.students.map((student, index) => {
            const scores = app.data.results[index] || [];
            const total = scores.reduce((sum, score) => sum + (score || 0), 0);
            const grade = app.calculateGrade(total);
            const maxPossible = app.data.tasks.reduce((sum, task) => sum + (task.maxScore || 0), 0);
            const percentage = maxPossible > 0 ? (total / maxPossible * 100) : 0;
            
            return `
            <tr>
                <td>${index + 1}</td>
                <td>${student}</td>
                <td>${total}</td>
                <td>${grade}</td>
                <td>${percentage.toFixed(1)}%</td>
            </tr>`;
        }).join('')}
    </table>
    
    <div style="margin-top: 30px; font-size: 10pt; color: #666; text-align: center;">
        <p>Отчет сгенерирован ${new Date().toLocaleDateString('ru-RU')}</p>
    </div>
</body>
</html>`;
}

// ==================== ИНИЦИАЛИЗАЦИЯ ЭКСПОРТА ====================

/**
 * Предпросмотр отчета перед экспортом
 */
function updateReportPreview() {
    const container = document.getElementById('reportPreview');
    if (!container) return;
    
    const previewHTML = `
        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h3>📋 Предпросмотр отчета</h3>
            
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0;">
                <div style="background: #f8f9fa; padding: 15px; border-radius: 6px;">
                    <strong>Основная информация</strong>
                    <p>Предмет: ${app.data.test.subject || 'Не указан'}</p>
                    <p>Класс: ${app.data.test.class || 'Не указан'}</p>
                    <p>Тема: ${app.data.test.theme || 'Не указана'}</p>
                    <p>Дата: ${formatDate(app.data.test.testDate, 'ru') || 'Не указана'}</p>
                </div>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 6px;">
                    <strong>Статистика</strong>
                    <p>Учащихся: ${app.data.students.length}</p>
                    <p>Заданий: ${app.data.tasks.length}</p>
                    <p>Средний балл: ${calculateAverageScore().toFixed(2)}</p>
                    <p>Успеваемость: ${calculateSuccessRate().toFixed(1)}%</p>
                </div>
            </div>
            
            <div style="margin-top: 20px;">
                <strong>Доступные форматы экспорта:</strong>
                <ul style="margin-top: 10px;">
                    <li>📊 <strong>Excel</strong> - Полная таблица с результатами и аналитикой</li>
                    <li>📄 <strong>PDF</strong> - Красивый отчет для печати</li>
                    <li>🌐 <strong>HTML</strong> - Веб-страница с возможностью печати</li>
                    <li>📋 <strong>CSV</strong> - Простой текстовый формат</li>
                    <li>💾 <strong>JSON</strong> - Резервная копия всех данных</li>
                    <li>📒 <strong>Эл.дневник</strong> - Формат для импорта в системы учета</li>
                </ul>
            </div>
            
            <div style="margin-top: 20px; padding: 15px; background: #e8f4fc; border-radius: 6px; border-left: 4px solid #3498db;">
                <strong>💡 Совет:</strong> Для печати используйте кнопку "Печать на А4" или сочетание клавиш Ctrl+P
            </div>
        </div>
    `;
    
    container.innerHTML = previewHTML;
}

// ==================== ЭКСПОРТ ФУНКЦИЙ ====================

// Экспортируем все функции экспорта
window.exportModule = {
    // Основные функции экспорта
    exportToExcel,
    exportToCSV,
    exportToPDF,
    exportHTML,
    exportJSON,
    exportForEJournal,
    
    // Функции печати
    printFullReport,
    printOptimizedReport,
    
    // Вспомогательные функции
    updateReportPreview,
    generateStudentComment,
    calculateAverageScore,
    calculateSuccessRate,
    calculateQualityRate,
    calculateSou,
    countGrades
};

console.log('✅ export.js загружен');