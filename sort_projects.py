import os
import shutil
import json
from pathlib import Path
from datetime import datetime
import re

# ===================== НАСТРОЙКИ =====================
ROOT_DIR = Path(".")  # Текущая папка (или укажите свою)
OUTPUT_INDEX = "index.html"
META_FILE = "projects_meta.json"
PROJECTS_DIR = ROOT_DIR / "projects"  # Новая структура будет здесь

# ===================== ОПРЕДЕЛЕНИЕ ТИПОВ ПРОЕКТОВ =====================
def detect_project_type(folder_path, files):
    """Определяет тип проекта по содержимому папки"""
    file_names = [f.lower() for f in files]
    file_contents = {}
    
    # Читаем содержимое первых нескольких файлов для анализа
    for f in files[:5]:
        try:
            with open(folder_path / f, 'r', encoding='utf-8', errors='ignore') as file:
                content = file.read(5000).lower()
                file_contents[f] = content
        except:
            pass
    
    # 1. Школьное питание (ФЦМПО)
    food_keywords = ['фцмпо', 'школьное питание', 'генератор ежедневных меню', 
                     'типовое меню', 'календарь питания', 'санпин', 'пищеблок',
                     'kp2026', 'tm2026-sm', 'ежедневное меню']
    
    for content in file_contents.values():
        if any(kw in content for kw in food_keywords):
            return "school-food"
    
    # 2. Arduino / Blockly
    arduino_keywords = ['blockly', 'arduino', 'микроконтроллер', 'скетч', 
                        'цифровой пин', 'аналоговый пин', 'setup', 'loop']
    
    for content in file_contents.values():
        if any(kw in content for kw in arduino_keywords):
            return "arduino"
    
    # 3. Игры
    game_keywords = ['game', 'игра', 'платформер', 'canvas', 'игровой', 
                     'score', 'player', 'enemy', 'jump', 'level']
    
    for content in file_contents.values():
        if any(kw in content for kw in game_keywords):
            return "games"
    
    # 4. Мотокалькуляторы
    moto_keywords = ['motocalc', 'двигатель', 'мотоцикл', 'самоделка', 
                     'звезда', 'передаточное число', 'обороты', 'л.с.']
    
    for content in file_contents.values():
        if any(kw in content for kw in moto_keywords):
            return "moto-calc"
    
    # 5. Инструменты (отчёты, анализ)
    tool_keywords = ['анализ', 'отчёт', 'шаблон', 'экспорт', 'импорт']
    
    for content in file_contents.values():
        if any(kw in content for kw in tool_keywords):
            return "tools"
    
    # 6. По названиям файлов
    if any('index.html' in f for f in file_names):
        return "website"
    
    return "other"

def get_project_category(folder_path):
    """Определяет категорию проекта по папке и содержимому"""
    folder_name = folder_path.name.lower()
    files = [f.name for f in folder_path.iterdir() if f.is_file()]
    
    # Особые случаи по имени папки
    if 'arduino' in folder_name:
        return "arduino"
    if 'food' in folder_name or 'menu' in folder_name:
        return "school-food"
    if 'game' in folder_name:
        return "games"
    if 'moto' in folder_name or 'calc' in folder_name:
        return "moto-calc"
    
    # Анализ содержимого
    return detect_project_type(folder_path, files)

def get_project_icon(category):
    """Возвращает иконку для категории"""
    icons = {
        "school-food": "🍽️",
        "arduino": "🤖",
        "games": "🎮",
        "moto-calc": "🏍️",
        "tools": "🔧",
        "website": "🌐",
        "other": "📁"
    }
    return icons.get(category, "📁")

# ===================== ОСНОВНАЯ ЛОГИКА =====================
def sort_projects():
    print("🔍 Сканирование проектов...")
    
    # Создаём папку для отсортированных проектов
    PROJECTS_DIR.mkdir(exist_ok=True)
    
    # Загружаем метаданные
    meta = {}
    if (ROOT_DIR / META_FILE).exists():
        with open(ROOT_DIR / META_FILE, 'r', encoding='utf-8') as f:
            meta = json.load(f)
    
    # Собираем все папки (исключаем служебные)
    folders = [f for f in ROOT_DIR.iterdir() 
               if f.is_dir() and f.name not in ['projects', '_meta', 'css', 'js', 'libs', 'node_modules']]
    
    project_count = 0
    category_stats = {}
    
    for folder in folders:
        # Проверяем, есть ли в папке HTML-файлы
        html_files = list(folder.glob("*.html"))
        if not html_files:
            print(f"⏭️ Пропускаем {folder.name} (нет HTML-файлов)")
            continue
        
        # Определяем категорию
        category = get_project_category(folder)
        category_stats[category] = category_stats.get(category, 0) + 1
        
        # Создаём целевую папку
        target_dir = PROJECTS_DIR / category / folder.name
        target_dir.mkdir(parents=True, exist_ok=True)
        
        # Копируем все файлы
        print(f"📦 {folder.name} → {category}")
        for file in folder.glob("*"):
            if file.is_file():
                shutil.copy2(file, target_dir / file.name)
        
        project_count += 1
    
    # Сохраняем обновлённые метаданные
    with open(ROOT_DIR / META_FILE, 'w', encoding='utf-8') as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ Готово! Обработано {project_count} проектов.")
    print("\n📊 Статистика по категориям:")
    for cat, count in sorted(category_stats.items()):
        print(f"   {get_project_icon(cat)} {cat}: {count} проектов")
    
    # Генерируем index.html
    generate_index(meta, category_stats)

# ===================== ГЕНЕРАЦИЯ INDEX.HTML =====================
def generate_index(meta, category_stats):
    html = f'''<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Мои проекты — структурированный каталог</title>
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
        }}
        .project-meta {{
            font-size: 12px;
            color: #484f58;
            display: flex;
            gap: 16px;
            margin-top: 4px;
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
    </style>
</head>
<body>
<div class="container">
    <div class="header">
        <h1>📂 Мои проекты — структурированный каталог</h1>
        <span class="badge">Всего: {project_count}</span>
    </div>
'''

    # Категории
    categories = [
        ("school-food", "🍽️ Школьное питание"),
        ("arduino", "🤖 Arduino"),
        ("games", "🎮 Игры"),
        ("moto-calc", "🏍️ Мото-калькуляторы"),
        ("tools", "🔧 Инструменты"),
        ("website", "🌐 Сайты"),
        ("other", "📁 Прочее"),
    ]
    
    total_projects = 0
    
    for cat_key, cat_name in categories:
        cat_dir = PROJECTS_DIR / cat_key
        if not cat_dir.exists():
            continue
        
        projects = [p for p in cat_dir.iterdir() if p.is_dir()]
        if not projects:
            continue
        
        total_projects += len(projects)
        
        html += f'''
    <div class="category-section">
        <div class="category-title">
            {cat_name}
            <span class="count">({len(projects)})</span>
        </div>
'''
        
        for project in sorted(projects):
            # Ищем index.html
            has_index = (project / "index.html").exists()
            html_files = list(project.glob("*.html"))
            
            # Определяем иконку
            icon = "🌐" if has_index else "📁"
            
            # Определяем технологию
            tech = "HTML"
            if (project / "package.json").exists():
                tech = "Node.js"
            elif (project / "requirements.txt").exists():
                tech = "Python"
            elif any(project.glob("*.py")):
                tech = "Python (скрипт)"
            elif any(project.glob("*.js")):
                tech = "JavaScript"
            
            # Проверяем новизну
            is_new = False
            try:
                mtime = datetime.fromtimestamp((project / "index.html").stat().st_mtime if has_index else project.stat().st_mtime)
                days_old = (datetime.now() - mtime).days
                is_new = days_old < 7
            except:
                pass
            
            link = f'<a href="/{project.name}/">' if has_index else '<span class="no-link">'
            link_close = '</a>' if has_index else '</span>'
            new_badge = '<span class="new-badge">новое</span>' if is_new else ''
            mtime_str = datetime.fromtimestamp(project.stat().st_mtime).strftime('%d.%m.%Y %H:%M') if has_index else "—"
            
            # Описание из meta
            desc = meta.get(project.name, "")
            desc_html = f'<div class="project-desc">{desc}</div>' if desc else ''
            
            html += f'''
        <div class="project-card">
            <div class="project-icon">{icon}</div>
            <div class="project-info">
                <div class="project-name">
                    {link}{project.name}{link_close}
                    <span class="project-tech">{tech}</span>
                    {new_badge}
                </div>
                {desc_html}
                <div class="project-meta">
                    <span>🕐 {mtime_str}</span>
                    <span>🔗 {"/" + project.name + "/" if has_index else "нет index-файла"}</span>
                </div>
            </div>
        </div>
'''
        
        html += '    </div>\n'
    
    html += f'''
    <div class="footer">
        Сгенерировано {datetime.now().strftime('%d.%m.%Y в %H:%M')} • 
        <span style="color:#58a6ff;">Python</span> сортировщик проектов
        <br>
        <small>Всего проектов: {total_projects}</small>
    </div>
</div>
</body>
</html>
'''
    
    # Сохраняем
    with open(ROOT_DIR / OUTPUT_INDEX, 'w', encoding='utf-8') as f:
        f.write(html)
    
    print(f"\n📄 Сгенерирован {OUTPUT_INDEX}")

# ===================== ЗАПУСК =====================
if __name__ == "__main__":
    sort_projects()