import os
import json
from datetime import datetime

# ===== НАСТРОЙКИ =====
PROJECTS_ROOT = os.getcwd()          # папка, где лежат проекты
OUTPUT_FILE = "index.html"           # имя выходного файла
META_FILE = "projects_meta.json"     # файл с описаниями
EXCLUDE = ['.git', '__pycache__', 'venv', 'env', 'node_modules']

# ===== ЗАГРУЗКА ОПИСАНИЙ =====
def load_meta():
    if os.path.exists(META_FILE):
        with open(META_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def save_meta(meta):
    with open(META_FILE, 'w', encoding='utf-8') as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)

# ===== ОПРЕДЕЛЕНИЕ ТИПА ПРОЕКТА =====
def detect_project_type(folder_path):
    """Определяет тип проекта по файлам и возвращает иконку + ярлык"""
    files = os.listdir(folder_path)
    files_lower = [f.lower() for f in files]
    
    if 'package.json' in files:
        return '🟩', 'Node.js'
    if 'requirements.txt' in files or 'setup.py' in files:
        return '🐍', 'Python'
    if 'pom.xml' in files:
        return '☕', 'Java (Maven)'
    if 'build.gradle' in files:
        return '☕', 'Java (Gradle)'
    if 'Cargo.toml' in files:
        return '🦀', 'Rust'
    if 'go.mod' in files:
        return '🐹', 'Go'
    if 'composer.json' in files:
        return '🐘', 'PHP'
    if 'Gemfile' in files:
        return '💎', 'Ruby'
    if 'Dockerfile' in files:
        return '🐳', 'Docker'
    if any(f.endswith(('.html', '.htm')) for f in files):
        return '🌐', 'HTML'
    if any(f.endswith('.py') for f in files):
        return '🐍', 'Python (скрипт)'
    if any(f.endswith('.js') for f in files):
        return '📜', 'JavaScript'
    return '📁', 'Проект'

# ===== ГЕНЕРАЦИЯ СТРАНИЦЫ =====
def generate_index():
    meta = load_meta()
    items = os.listdir(PROJECTS_ROOT)
    
    # Фильтруем только папки
    projects = []
    for item in items:
        full_path = os.path.join(PROJECTS_ROOT, item)
        if os.path.isdir(full_path) and item not in EXCLUDE and not item.startswith('.'):
            # Проверяем, есть ли index-файл для ссылки
            has_index = any(os.path.exists(os.path.join(full_path, f)) 
                           for f in ['index.html', 'index.php', 'index.htm', 'index.py'])
            
            # Определяем тип
            icon, tech = detect_project_type(full_path)
            
            # Берём описание из meta или ставим заглушку
            description = meta.get(item, "")
            
            # Дата последнего изменения
            mtime = os.path.getmtime(full_path)
            last_modified = datetime.fromtimestamp(mtime).strftime('%d.%m.%Y %H:%M')
            
            projects.append({
                'name': item,
                'path': full_path,
                'has_index': has_index,
                'icon': icon,
                'tech': tech,
                'description': description,
                'last_modified': last_modified,
                'is_new': (datetime.now().timestamp() - mtime) < 86400 * 7  # 7 дней
            })
    
    # Сортируем: сначала с описанием, потом по алфавиту
    projects.sort(key=lambda p: (not p['description'], p['name']))
    
    # ===== ГЕНЕРИРУЕМ HTML =====
    html = f'''<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Мои проекты</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            background: #0d1117;
            color: #c9d1d9;
            padding: 40px 20px;
        }}
        .container {{
            max-width: 1000px;
            margin: 0 auto;
        }}
        .header {{
            border-bottom: 1px solid #30363d;
            padding-bottom: 20px;
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
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
        .project-icon {{
            font-size: 28px;
            min-width: 40px;
            text-align: center;
        }}
        .project-info {{
            flex: 1;
        }}
        .project-name {{
            font-size: 18px;
            font-weight: 500;
            color: #f0f6fc;
        }}
        .project-name a {{
            color: #f0f6fc;
            text-decoration: none;
        }}
        .project-name a:hover {{
            color: #58a6ff;
        }}
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
        .no-link {{
            opacity: 0.6;
            cursor: default;
        }}
        .no-link .project-name {{
            color: #8b949e;
        }}
        .footer {{
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #21262d;
            font-size: 13px;
            color: #484f58;
            text-align: center;
        }}
        .edit-hint {{
            background: #1f2937;
            border-left: 3px solid #58a6ff;
            padding: 12px 16px;
            border-radius: 6px;
            margin-bottom: 20px;
            font-size: 14px;
            color: #8b949e;
        }}
        .edit-hint code {{
            background: #0d1117;
            padding: 2px 8px;
            border-radius: 4px;
            color: #f0f6fc;
        }}
    </style>
</head>
<body>
<div class="container">
    <div class="header">
        <h1>📂 Мои проекты</h1>
        <span class="badge">Всего: {len(projects)}</span>
    </div>

    <div class="edit-hint">
        ✏️ Чтобы добавить описание проекту, отредактируйте файл <code>{META_FILE}</code> в формате:
        <br><code>{{"имя_папки": "Ваше описание"}}</code>
    </div>

    {''.join(generate_card(p) for p in projects)}

    <div class="footer">
        Сгенерировано {datetime.now().strftime('%d.%m.%Y в %H:%M')} • 
        <span style="color:#58a6ff;">Python</span> генератор
    </div>
</div>
</body>
</html>
'''

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(html)
    
    print(f"✅ Страница сгенерирована: {OUTPUT_FILE}")
    print(f"📊 Найдено проектов: {len(projects)}")

def generate_card(p):
    """Генерирует HTML-карточку одного проекта"""
    link_open = f'<a href="/{p["name"]}/">' if p["has_index"] else '<span class="no-link">'
    link_close = '</a>' if p["has_index"] else '</span>'
    new_tag = '<span class="new-badge">новое</span>' if p.get('is_new') else ''
    
    return f'''
    <div class="project-card">
        <div class="project-icon">{p["icon"]}</div>
        <div class="project-info">
            <div class="project-name">
                {link_open}{p["name"]}{link_close}
                <span class="project-tech">{p["tech"]}</span>
                {new_tag}
            </div>
            {f'<div class="project-desc">{p["description"]}</div>' if p["description"] else ''}
            <div class="project-meta">
                <span>🕐 {p["last_modified"]}</span>
                {f'<span>🔗 {"/" + p["name"] + "/" if p["has_index"] else "нет index-файла"}</span>'}
            </div>
        </div>
    </div>
    '''

if __name__ == "__main__":
    generate_index()