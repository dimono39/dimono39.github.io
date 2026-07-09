import json
import sys

def simple_fix_json(input_file, output_file=None):
    """Простое исправление JSON файла."""
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Создаем резервную копию
    with open(input_file + '.bak', 'w', encoding='utf-8') as f:
        f.write(content)
    
    # Пробуем исправить, заменяя проблемные кавычки
    # Это простое решение для конкретной проблемы из примера
    fixed_content = content
    
    # Удаляем BOM если есть
    if fixed_content.startswith('\ufeff'):
        fixed_content = fixed_content[1:]
    
    # Пробуем загрузить несколько раз с разными исправлениями
    for attempt in range(3):
        try:
            data = json.loads(fixed_content)
            print(f"Успешно после {attempt + 1} попытки!")
            
            if output_file is None:
                output_file = input_file
            
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            print(f"Исправленный файл сохранен: {output_file}")
            return True
            
        except json.JSONDecodeError as e:
            print(f"Попытка {attempt + 1} ошибка: {e}")
            
            # Пробуем разные стратегии исправления
            if attempt == 0:
                # Простое экранирование кавычек
                lines = fixed_content.split('\n')
                for i, line in enumerate(lines):
                    if 'description' in line and ':' in line:
                        # Находим строку с описанием
                        parts = line.split(':', 1)
                        if len(parts) > 1 and '"' in parts[1]:
                            # Это упрощенная логика - в реальном случае нужно парсить точнее
                            lines[i] = line.replace('"', '\\"') if line.count('"') % 2 != 0 else line
                fixed_content = '\n'.join(lines)
            
            elif attempt == 1:
                # Используем регулярные выражения для поиска строк
                import re
                # Находим все строковые значения и экранируем кавычки внутри
                pattern = r'("[^"\\]*(?:\\.[^"\\]*)*")'
                def replace_quotes(match):
                    content = match.group(1)
                    # Экранируем кавычки внутри, но не трогаем границы
                    if len(content) > 2:
                        inner = content[1:-1]
                        # Экранируем неэкранированные кавычки
                        inner = re.sub(r'(?<!\\)"', r'\"', inner)
                        return '"' + inner + '"'
                    return content
                
                fixed_content = re.sub(pattern, replace_quotes, fixed_content)
    
    print("Не удалось исправить автоматически")
    return False

if __name__ == "__main__":
    if len(sys.argv) > 1:
        input_file = sys.argv[1]
        output_file = sys.argv[2] if len(sys.argv) > 2 else None
        simple_fix_json(input_file, output_file)
    else:
        print("Использование: python fix_json.py <input_file> [output_file]")