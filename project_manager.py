#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PRO Управление проектами v2.0
- Автоопределение описаний (AI-анализ)
- Веб-интерфейс для ручной сортировки
- Поддержка вложенных проектов
"""

import os
import shutil
import json
import re
import webbrowser
from pathlib import Path
from datetime import datetime
from collections import defaultdict
import http.server
import socketserver
import threading

# ===================== НАСТРОЙКИ =====================
ROOT_DIR = Path(__file__).parent
PROJECTS_DIR = ROOT_DIR / "projects"
META_FILE = ROOT_DIR / "projects_meta.json"
INDEX_FILE = ROOT_DIR / "index.html"
PORT = 8080

# ===================== КАТЕГОРИИ =====================
CATEGORIES = {
    "school-food": {"name": "🍽️ Школьное питание", "icon": "🍽️"},
    "arduino": {"name": "🤖 Arduino", "icon": "🤖"},
    "games": {"name": "🎮 Игры", "icon": "🎮"},
    "moto-calc": {"name": "🏍️ Мото-калькуляторы", "icon": "🏍️"},
    "tools": {"name": "🔧 Инструменты", "icon": "🔧"},
    "website": {"name": "🌐 Сайты", "icon": "🌐"},
    "other": {"name": "📁 Прочее", "icon": "📁"},
    "archive": {"name": "📦 Архив", "icon": "📦"},
}

# ===================== AI-АНАЛИЗ ДЛЯ ОПИСАНИЙ =====================
def analyze_project(folder_path):
    """Анализирует проект и генерирует описание на основе содержимого"""
    description = ""
    keywords = []
    tech_stack = []
    features = []
    
    # Читаем все файлы в папке
    files_content = {}
    for file in folder_path.rglob("*"):
        if file.is_file() and file.suffix in ['.html', '.htm', '.js', '.py', '.json', '.css', '.txt', '.md']:
            try:
                with open(file, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read(10000).lower()
                    files_content[file.name] = content
            except:
                pass
    
    # Объединяем весь текст для анализа
    all_text = " ".join(files_content.values())
    
    # 1. Определяем технологический стек
    if any('blockly' in text for text in files_content.values()):
        tech_stack.append("Blockly")
    if any('arduino' in text for text in files_content.values()):
        tech_stack.append("Arduino")
    if any('python' in text for text in files_content.values()):
        tech_stack.append("Python")
    if any('node.js' in text or 'npm' in text for text in files_content.values()):
        tech_stack.append("Node.js")
    if any('react' in text for text in files_content.values()):
        tech_stack.append("React")
    if any('vue' in text for text in files_content.values()):
        tech_stack.append("Vue.js")
    if any('exceljs' in text for text in files_content.values()):
        tech_stack.append("ExcelJS")
    if any('chart.js' in text for text in files_content.values()):
        tech_stack.append("Chart.js")
    
    # 2. Поиск ключевых слов для описания
    if 'генератор' in all_text or 'создание' in all_text:
        if 'меню' in all_text or 'питание' in all_text:
            features.append("генерация меню")
        if 'код' in all_text or 'программа' in all_text:
            features.append("генерация кода")
        if 'отчёт' in all_text or 'отчет' in all_text:
            features.append("генерация отчётов")
    
    if 'проверк' in all_text:
        features.append("автопроверка")
    if 'анализ' in all_text or 'аналитика' in all_text:
        features.append("аналитика")
    if 'экспорт' in all_text:
        features.append("экспорт данных")
    if 'игра' in all_text or 'game' in all_text:
        features.append("игровой движок")
    if 'калькулятор' in all_text or 'calc' in all_text:
        features.append("калькулятор")
    
    # 3. Формируем описание
    desc_parts = []
    
    # Технологии
    if tech_stack:
        desc_parts.append(f"🛠️ Стек: {', '.join(tech_stack)}")
    
    # Особенности
    if features:
        unique_features = list(set(features))
        desc_parts.append(f"✨ Особенности: {', '.join(unique_features[:5])}")
    
    # Ключевые слова из заголовка
    title_match = re.search(r'<title>(.*?)</title>', str(files_content.values()), re.IGNORECASE)
    if title_match:
        title = title_match.group(1).strip()
        if len(title) > 5 and title not in ['Проект', 'Мои проекты']:
            desc_parts.append(f"📌 {title[:80]}")
    
    # Ищем описание в коде
    desc_match = re.search(r'<meta name="description" content="([^"]+)"', all_text)
    if desc_match and len(desc_match.group(1)) > 10:
        desc_parts.append(f"📝 {desc_match.group(1)[:100]}")
    
    # Добавляем информацию о файлах
    html_files = list(folder_path.glob("*.html"))
    if html_files:
        desc_parts.append(f"📄 HTML-файлов: {len(html_files)}")
    
    # Собираем в одно описание
    if desc_parts:
        description = ". ".join(desc_parts)
    
    return {
        "description": description[:300] if description else "Проект без описания",
        "tech_stack": tech_stack,
        "features": list(set(features)),
        "files_count": len(list(folder_path.glob("*")))
    }

# ===================== ЗАГРУЗКА МЕТАДАННЫХ =====================
def load_meta():
    if META_FILE.exists():
        with open(META_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def save_meta(meta):
    with open(META_FILE, 'w', encoding='utf-8') as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)

# ===================== ОСНОВНАЯ ЛОГИКА СОРТИРОВКИ =====================
def detect_category(folder_path):
    """Определяет категорию проекта"""
    folder_name = folder_path.name.lower()
    files = [f.name for f in folder_path.iterdir() if f.is_file()]
    
    # По имени папки
    category_map = {
        'arduino': 'arduino',
        'food': 'school-food',
        'menu': 'school-food',
        'game': 'games',
        'moto': 'moto-calc',
        'calc': 'moto-calc',
        'school': 'school-food',
    }
    
    for key, cat in category_map.items():
        if key in folder_name:
            return cat
    
    # По содержимому
    try:
        content = ""
        for file in folder_path.glob("*.html"):
            with open(file, 'r', encoding='utf-8', errors='ignore') as f:
                content += f.read(5000).lower()
        
        if any(kw in content for kw in ['фцмпо', 'питание', 'меню', 'календарь']):
            return 'school-food'
        if any(kw in content for kw in ['blockly', 'arduino', 'setup', 'loop']):
            return 'arduino'
        if any(kw in content for kw in ['game', 'игра', 'player', 'enemy']):
            return 'games'
        if any(kw in content for kw in ['motocalc', 'двигатель', 'звезда']):
            return 'moto-calc'
    except:
        pass
    
    # Если есть index.html — сайт
    if (folder_path / "index.html").exists():
        return 'website'
    
    return 'other'

def sort_projects(update_meta=True):
    """Сортирует проекты по категориям"""
    print("🔍 Сканирование проектов...")
    
    PROJECTS_DIR.mkdir(exist_ok=True)
    meta = load_meta()
    
    # Собираем все папки (кроме служебных)
    exclude = ['projects', '_meta', 'css', 'js', 'libs', 'node_modules', '__pycache__', '.git']
    folders = [f for f in ROOT_DIR.iterdir() 
               if f.is_dir() and f.name not in exclude]
    
    stats = defaultdict(int)
    project_count = 0
    
    for folder in folders:
        # Проверяем, есть ли HTML-файлы
        html_files = list(folder.glob("*.html"))
        if not html_files:
            # Если нет HTML, но есть другие файлы — оставляем
            pass
        
        category = detect_category(folder)
        stats[category] += 1
        
        target_dir = PROJECTS_DIR / category / folder.name
        target_dir.mkdir(parents=True, exist_ok=True)
        
        print(f"📦 {folder.name} → {CATEGORIES.get(category, {}).get('name', category)}")
        
        # Копируем все файлы
        for file in folder.glob("*"):
            if file.is_file():
                shutil.copy2(file, target_dir / file.name)
        
        # Если проект уже есть в мета, обновляем
        if folder.name not in meta or update_meta:
            analysis = analyze_project(folder)
            meta[folder.name] = {
                "category": category,
                "description": analysis["description"],
                "tech_stack": analysis["tech_stack"],
                "features": analysis["features"],
                "updated": datetime.now().isoformat()
            }
        
        project_count += 1
    
    save_meta(meta)
    
    print(f"\n✅ Готово! Обработано {project_count} проектов.")
    print("\n📊 Статистика:")
    for cat, count in sorted(stats.items()):
        print(f"   {CATEGORIES.get(cat, {}).get('icon', '📁')} {cat}: {count}")
    
    return project_count

# ===================== ГЕНЕРАЦИЯ INDEX.HTML =====================
def generate_index():
    """Генерирует красивую страницу со всеми проектами"""
    meta = load_meta()
    
    # Собираем проекты из папки projects
    projects_by_category = defaultdict(list)
    
    for category in CATEGORIES:
        cat_dir = PROJECTS_DIR / category
        if cat_dir.exists():
            for project in cat_dir.iterdir():
                if project.is_dir():
                    projects_by_category[category].append(project)
    
    html = f'''<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Мои проекты — PRO каталог</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            background: #0d1117;
            color: #c9d1d9;
            padding: 40px 20px;
        }}
        .container {{ max-width: 1200px; margin: 0 auto; }}
        .header {{
            border-bottom: 1px solid #30363d;
            padding-bottom: 20px;
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 16px;
        }}
        .header h1 {{
            font-size: 32px;
            font-weight: 600;
            background: linear-gradient(135deg, #58a6ff, #3fb950);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }}
        .header .badge {{
            background: #21262d;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 14px;
            color: #8b949e;
        }}
        .header .badge i {{ margin-right: 6px; }}
        
        .controls {{
            display: flex;
            gap: 12px;
            margin-bottom: 30px;
            flex-wrap: wrap;
        }}
        .search-input {{
            flex: 1;
            padding: 12px 20px;
            border: 1px solid #30363d;
            border-radius: 8px;
            background: #161b22;
            color: #c9d1d9;
            font-size: 16px;
            min-width: 200px;
        }}
        .search-input:focus {{
            outline: none;
            border-color: #58a6ff;
        }}
        .filter-btn {{
            padding: 12px 20px;
            border: 1px solid #30363d;
            border-radius: 8px;
            background: #161b22;
            color: #c9d1d9;
            cursor: pointer;
            transition: all 0.2s;
        }}
        .filter-btn:hover {{
            background: #1c2333;
            border-color: #58a6ff;
        }}
        .filter-btn.active {{
            background: #238636;
            border-color: #238636;
        }}
        
        .category-section {{
            margin-bottom: 40px;
        }}
        .category-title {{
            font-size: 24px;
            font-weight: 600;
            color: #f0f6fc;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 12px;
            cursor: pointer;
        }}
        .category-title .count {{
            font-size: 14px;
            color: #8b949e;
            font-weight: 400;
        }}
        
        .project-card {{
            background: #161b22;
            border: 1px solid #30363d;
            border-radius: 12px;
            padding: 16px 20px;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 16px;
            transition: all 0.2s ease;
        }}
        .project-card:hover {{
            background: #1c2333;
            border-color: #58a6ff;
            transform: translateX(4px);
        }}
        .project-icon {{ font-size: 28px; min-width: 40px; text-align: center; }}
        .project-info {{ flex: 1; }}
        .project-name {{
            font-size: 18px;
            font-weight: 500;
            color: #f0f6fc;
        }}
        .project-name a {{
            color: #f0f6fc;
            text-decoration: none;
        }}
        .project-name a:hover {{ color: #58a6ff; }}
        .project-tech {{
            font-size: 13px;
            color: #8b949e;
            background: #21262d;
            padding: 2px 10px;
            border-radius: 12px;
            display: inline-block;
            margin-left: 10px;
        }}
        .project-desc {{
            font-size: 14px;
            color: #8b949e;
            margin-top: 4px;
            line-height: 1.4;
        }}
        .project-desc .feature-tag {{
            display: inline-block;
            background: #1f2937;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
            margin-right: 4px;
            color: #58a6ff;
        }}
        .project-meta {{
            font-size: 12px;
            color: #484f58;
            display: flex;
            gap: 16px;
            margin-top: 4px;
            flex-wrap: wrap;
        }}
        .new-badge {{
            background: #238636;
            color: white;
            font-size: 10px;
            padding: 2px 10px;
            border-radius: 20px;
            text-transform: uppercase;
            font-weight: 700;
            margin-left: 10px;
        }}
        .no-link {{ opacity: 0.6; cursor: default; }}
        .no-link .project-name {{ color: #8b949e; }}
        
        .edit-hint {{
            background: #1f2937;
            border-left: 3px solid #58a6ff;
            padding: 12px 16px;
            border-radius: 6px;
            margin-bottom: 30px;
            font-size: 14px;
            color: #8b949e;
        }}
        .edit-hint code {{
            background: #0d1117;
            padding: 2px 8px;
            border-radius: 4px;
            color: #f0f6fc;
        }}
        
        .footer {{
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #21262d;
            font-size: 13px;
            color: #484f58;
            text-align: center;
        }}
        
        .empty-state {{
            text-align: center;
            padding: 60px;
            color: #484f58;
        }}
        .empty-state i {{ font-size: 48px; margin-bottom: 16px; }}
    </style>
</head>
<body>
<div class="container">
    <div class="header">
        <h1><i class="fas fa-folder-open"></i> Мои проекты — PRO каталог</h1>
        <div>
            <span class="badge"><i class="fas fa-code"></i> <span id="totalProjects">0</span></span>
            <span class="badge"><i class="fas fa-folder"></i> <span id="totalCategories">0</span></span>
        </div>
    </div>
    
    <div class="controls">
        <input type="text" id="searchInput" class="search-input" placeholder="🔍 Поиск по названию, описанию, технологиям...">
        <button class="filter-btn active" data-filter="all">📋 Все</button>
'''
    
    for cat_key, cat_info in CATEGORIES.items():
        html += f'        <button class="filter-btn" data-filter="{cat_key}">{cat_info["icon"]} {cat_info["name"]}</button>\n'
    
    html += f'''
    </div>
    
    <div class="edit-hint">
        <i class="fas fa-info-circle"></i>
        Описания проектов генерируются автоматически на основе содержимого.
        Для ручного редактирования отредактируйте файл <code>projects_meta.json</code>
    </div>
'''

    # Категории
    total_projects = 0
    total_categories = 0
    
    for cat_key, cat_info in CATEGORIES.items():
        projects = projects_by_category.get(cat_key, [])
        if not projects:
            continue
        
        total_categories += 1
        total_projects += len(projects)
        
        html += f'''
    <div class="category-section" data-category="{cat_key}">
        <div class="category-title">
            {cat_info["icon"]} {cat_info["name"]}
            <span class="count">({len(projects)})</span>
        </div>
'''
        
        for project in sorted(projects):
            has_index = (project / "index.html").exists()
            meta_info = meta.get(project.name, {})
            
            icon = "🌐" if has_index else "📁"
            
            # Технологии
            tech_stack = meta_info.get("tech_stack", [])
            tech_display = ", ".join(tech_stack[:3]) if tech_stack else "HTML"
            
            # Особенности
            features = meta_info.get("features", [])
            features_display = "".join([f'<span class="feature-tag">{f}</span>' for f in features[:4]])
            
            # Описание
            description = meta_info.get("description", "")
            
            # Проверяем новизну
            is_new = False
            try:
                mtime = datetime.fromtimestamp(project.stat().st_mtime)
                is_new = (datetime.now() - mtime).days < 7
            except:
                pass
            
            link = f'<a href="/{project.name}/">' if has_index else '<span class="no-link">'
            link_close = '</a>' if has_index else '</span>'
            new_badge = '<span class="new-badge">новое</span>' if is_new else ''
            
            try:
                mtime_str = datetime.fromtimestamp(project.stat().st_mtime).strftime('%d.%m.%Y %H:%M')
            except:
                mtime_str = "—"
            
            html += f'''
        <div class="project-card" data-name="{project.name.lower()}">
            <div class="project-icon">{icon}</div>
            <div class="project-info">
                <div class="project-name">
                    {link}{project.name}{link_close}
                    <span class="project-tech">{tech_display}</span>
                    {new_badge}
                </div>
                {f'<div class="project-desc">{description}</div>' if description else ''}
                {f'<div class="project-desc">{features_display}</div>' if features_display else ''}
                <div class="project-meta">
                    <span>🕐 {mtime_str}</span>
                    <span>🔗 {"/" + project.name + "/" if has_index else "нет index-файла"}</span>
                    <span>📄 {meta_info.get("files_count", 0)} файлов</span>
                </div>
            </div>
        </div>
'''
        
        html += '    </div>\n'
    
    if total_projects == 0:
        html += '''
    <div class="empty-state">
        <i class="fas fa-folder-open"></i>
        <h3>Проекты не найдены</h3>
        <p>Запустите скрипт для сортировки проектов</p>
    </div>
'''
    
    html += f'''
    <div class="footer">
        <i class="fas fa-robot"></i> Сгенерировано {datetime.now().strftime('%d.%m.%Y в %H:%M')} •
        <span style="color:#58a6ff;">PRO Управление проектами v2.0</span>
        <br>
        <small>Всего проектов: {total_projects} • Категорий: {total_categories}</small>
    </div>
</div>

<script>
    // Поиск и фильтрация
    const searchInput = document.getElementById('searchInput');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');
    const categorySections = document.querySelectorAll('.category-section');
    
    let currentFilter = 'all';
    
    // Обновляем общее количество
    document.getElementById('totalProjects').textContent = projectCards.length;
    document.getElementById('totalCategories').textContent = categorySections.length;
    
    searchInput.addEventListener('input', function() {{
        const query = this.value.toLowerCase();
        projectCards.forEach(card => {{
            const name = card.dataset.name || '';
            const text = card.textContent.toLowerCase();
            const match = name.includes(query) || text.includes(query);
            card.style.display = match ? 'flex' : 'none';
        }});
        updateCategoryCounts();
    }});
    
    filterBtns.forEach(btn => {{
        btn.addEventListener('click', function() {{
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            applyFilters();
        }});
    }});
    
    function applyFilters() {{
        const query = searchInput.value.toLowerCase();
        categorySections.forEach(section => {{
            const category = section.dataset.category;
            const cards = section.querySelectorAll('.project-card');
            let visible = 0;
            
            cards.forEach(card => {{
                const name = card.dataset.name || '';
                const text = card.textContent.toLowerCase();
                const matchSearch = name.includes(query) || text.includes(query);
                const matchCategory = currentFilter === 'all' || category === currentFilter;
                const show = matchSearch && matchCategory;
                card.style.display = show ? 'flex' : 'none';
                if (show) visible++;
            }});
            
            // Показываем/скрываем секцию
            section.style.display = visible > 0 ? 'block' : 'none';
        }});
    }}
    
    function updateCategoryCounts() {{
        categorySections.forEach(section => {{
            const visible = section.querySelectorAll('.project-card[style*="flex"]').length;
            const title = section.querySelector('.category-title .count');
            if (title) {{
                title.textContent = `(${{visible}})`;
            }}
        }});
    }}
</script>
</body>
</html>
'''
    
    with open(INDEX_FILE, 'w', encoding='utf-8') as f:
        f.write(html)
    
    print(f"\n📄 Сгенерирован {INDEX_FILE.name}")
    return total_projects

# ===================== ВЕБ-ИНТЕРФЕЙС ДЛЯ РУЧНОЙ СОРТИРОВКИ =====================
class WebInterfaceHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.path = '/projects/'
        return super().do_GET()

def start_web_interface():
    """Запускает веб-интерфейс для управления проектами"""
    print(f"\n🌐 Запуск веб-интерфейса на http://localhost:{PORT}")
    print("   Для выхода нажмите Ctrl+C")
    
    # Создаём папку для веб-интерфейса
    web_dir = ROOT_DIR / "web_interface"
    web_dir.mkdir(exist_ok=True)
    
    # Копируем index.html в папку веб-интерфейса (если он есть)
    if INDEX_FILE.exists():
        shutil.copy2(INDEX_FILE, web_dir / "index.html")
    
    # Запускаем сервер
    os.chdir(web_dir)
    handler = http.server.SimpleHTTPRequestHandler
    httpd = socketserver.TCPServer(("", PORT), handler)
    webbrowser.open(f"http://localhost:{PORT}")
    httpd.serve_forever()

# ===================== ФУНКЦИЯ ДЛЯ ВЛОЖЕННЫХ ПРОЕКТОВ =====================
def scan_nested_projects():
    """Сканирует вложенные проекты (проекты внутри проектов)"""
    print("🔍 Сканирование вложенных проектов...")
    meta = load_meta()
    nested_count = 0
    
    for category in CATEGORIES:
        cat_dir = PROJECTS_DIR / category
        if not cat_dir.exists():
            continue
        
        for project in cat_dir.iterdir():
            if not project.is_dir():
                continue
            
            # Ищем подпапки, которые могут быть проектами
            subdirs = [d for d in project.iterdir() if d.is_dir() and not d.name.startswith('.')]
            
            for sub in subdirs:
                # Проверяем, есть ли в подпапке HTML-файлы
                if list(sub.glob("*.html")):
                    # Это вложенный проект
                    nested_count += 1
                    # Добавляем его в мета
                    if sub.name not in meta:
                        analysis = analyze_project(sub)
                        meta[sub.name] = {
                            "category": "other",
                            "description": f"🔹 Вложенный проект в {project.name}: {analysis['description']}",
                            "tech_stack": analysis["tech_stack"],
                            "features": analysis["features"],
                            "parent": project.name,
                            "updated": datetime.now().isoformat()
                        }
                        print(f"   📂 {sub.name} (в {project.name})")
    
    save_meta(meta)
    print(f"\n✅ Найдено {nested_count} вложенных проектов")
    return nested_count

# ===================== ГЛАВНАЯ ФУНКЦИЯ =====================
def main():
    print("\n" + "="*50)
    print("🚀 PRO Управление проектами v2.0")
    print("="*50)
    
    # 1. Сортировка проектов
    project_count = sort_projects()
    
    # 2. Сканирование вложенных проектов
    nested_count = scan_nested_projects()
    
    # 3. Генерация index.html
    total = generate_index()
    
    print("\n" + "="*50)
    print("✅ Всё готово!")
    print(f"   📁 Основных проектов: {project_count}")
    print(f"   📂 Вложенных проектов: {nested_count}")
    print(f"   📄 Сгенерирован {INDEX_FILE.name}")
    print("="*50)
    
    # 4. Запуск веб-интерфейса
    print("\nЗапустить веб-интерфейс? (y/n)")
    if input().lower().strip() == 'y':
        start_web_interface()

if __name__ == "__main__":
    main()