import json
import re
import sys
from pathlib import Path

def fix_json_quotes(json_string):
    """
    Исправляет проблемы с экранированием кавычек в строке JSON.
    """
    # Регулярное выражение для поиска неэкранированных кавычек внутри строк
    # Ищем кавычки, которые находятся внутри строк (после : и до , или })
    pattern = r'(?<=:)\s*"[^"]*(?<!\\)"[^"]*(?<!\\)"(?=[^"]*",?\s*[,\]}])'
    
    # Более простой подход: находим все строки и правим их
    lines = json_string.split('\n')
    fixed_lines = []
    
    for line in lines:
        # Ищем начало строкового значения (после : )
        if ':' in line:
            parts = line.split(':', 1)
            key_part = parts[0]
            value_part = parts[1]
            
            # Проверяем, начинается ли значение с кавычки
            if value_part.strip().startswith('"'):
                # Находим позицию начала строки
                start_quote_idx = value_part.find('"')
                # Нам нужно найти закрывающую кавычку
                chars = list(value_part)
                in_string = False
                escape_next = False
                
                for i in range(start_quote_idx, len(chars)):
                    char = chars[i]
                    
                    if escape_next:
                        escape_next = False
                        continue
                    
                    if char == '\\':
                        escape_next = True
                    elif char == '"':
                        if not in_string:
                            in_string = True
                        else:
                            # Закрывающая кавычка
                            # Проверяем содержимое между кавычками
                            substring = value_part[start_quote_idx:i+1]
                            # Экранируем все кавычки внутри, кроме уже экранированных
                            fixed_substring = re.sub(r'(?<!\\)"', r'\"', substring[1:-1])
                            # Заменяем подстроку
                            new_value = value_part[:start_quote_idx] + '"' + fixed_substring + '"' + value_part[i+1:]
                            line = key_part + ':' + new_value
                            break
        fixed_lines.append(line)
    
    return '\n'.join(fixed_lines)

def smart_fix_json(json_string):
    """
    Умное исправление JSON с использованием парсинга с восстановлением.
    """
    # Попробуем разобрать JSON поэтапно
    try:
        data = json.loads(json_string)
        return json_string  # Если успешно, возвращаем как есть
    except json.JSONDecodeError as e:
        print(f"Ошибка парсинга: {e}")
        
        # Попробуем исправить наиболее частые проблемы
        fixed = json_string
        
        # 1. Исправляем неэкранированные кавычки внутри строк
        # Ищем строковые значения и экранируем кавычки внутри них
        lines = fixed.split('\n')
        result_lines = []
        
        for line_num, line in enumerate(lines, 1):
            # Упрощенный подход: экранируем все кавычки, которые не экранированы
            # и находятся внутри строковых литералов
            new_line = ""
            i = 0
            while i < len(line):
                char = line[i]
                new_line += char
                
                # Если находим начало строки
                if char == '"':
                    # Сканируем до конца строки
                    j = i + 1
                    while j < len(line):
                        if line[j] == '\\':
                            # Пропускаем экранированный символ
                            if j + 1 < len(line):
                                new_line += line[j] + line[j+1]
                                j += 2
                        elif line[j] == '"':
                            # Конец строки
                            new_line += line[j]
                            j += 1
                            break
                        else:
                            # Экранируем кавычку, если она не экранирована
                            if line[j] == '"':
                                new_line += '\\"'
                            else:
                                new_line += line[j]
                            j += 1
                    i = j
                else:
                    i += 1
            
            result_lines.append(new_line)
        
        fixed = '\n'.join(result_lines)
        
        # 2. Попробуем еще раз распарсить
        try:
            data = json.loads(fixed)
            return fixed
        except json.JSONDecodeError as e2:
            print(f"Не удалось исправить автоматически: {e2}")
            
            # Попробуем другой подход: построчное исправление
            return manual_fix_json(json_string)

def manual_fix_json(json_string):
    """
    Ручное исправление JSON на основе анализа структуры.
    """
    fixed_lines = []
    lines = json_string.split('\n')
    
    for line in lines:
        # Простое исправление: экранируем все кавычки внутри строк
        # которые не находятся в ключах
        if ':' in line:
            key, value = line.split(':', 1)
            key = key.strip()
            value = value.strip()
            
            # Проверяем, начинается ли значение с кавычки
            if value.startswith('"'):
                # Находим последнюю кавычку (не экранированную)
                # Упрощенный алгоритм
                if value.endswith('",'):
                    content = value[1:-2]
                    fixed_content = content.replace('"', '\\"')
                    fixed_line = f'{key}: "{fixed_content}",'
                elif value.endswith('"'):
                    content = value[1:-1]
                    fixed_content = content.replace('"', '\\"')
                    fixed_line = f'{key}: "{fixed_content}"'
                else:
                    # Сложный случай - многострочная строка
                    fixed_line = line
            else:
                fixed_line = line
        else:
            fixed_line = line
            
        fixed_lines.append(fixed_line)
    
    return '\n'.join(fixed_lines)

def fix_json_file(input_file, output_file=None, backup=True):
    """
    Исправляет JSON файл с проблемами экранирования кавычек.
    
    Args:
        input_file: путь к входному файлу
        output_file: путь к выходному файлу (если None, заменяет оригинал)
        backup: создавать ли резервную копию
    """
    input_path = Path(input_file)
    
    if not input_path.exists():
        print(f"Файл {input_file} не найден!")
        return False
    
    # Читаем исходный файл
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        with open(input_file, 'r', encoding='cp1251') as f:
            content = f.read()
    
    # Создаем резервную копию
    if backup:
        backup_file = input_file + '.bak'
        with open(backup_file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Создана резервная копия: {backup_file}")
    
    # Пробуем простой подход сначала
    try:
        # Пробуем загрузить JSON
        data = json.loads(content)
        print("JSON уже валиден, исправления не требуются.")
        
        if output_file and output_file != input_file:
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"Валидный JSON сохранен в: {output_file}")
        
        return True
    except json.JSONDecodeError as e:
        print(f"Найдены ошибки в JSON: {e}")
        
        # Используем более надежный метод исправления
        fixed_content = smart_fix_json(content)
        
        # Проверяем результат
        try:
            data = json.loads(fixed_content)
            print("Успешно исправлено!")
            
            # Определяем выходной файл
            if output_file is None:
                output_file = input_file
            
            # Сохраняем исправленный файл
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            print(f"Исправленный JSON сохранен в: {output_file}")
            return True
            
        except json.JSONDecodeError as e2:
            print(f"Не удалось исправить JSON: {e2}")
            
            # Показываем проблемные строки
            lines = content.split('\n')
            error_line = e2.lineno - 1 if hasattr(e2, 'lineno') else 0
            error_col = e2.colno if hasattr(e2, 'colno') else 0
            
            print(f"\nПроблема в строке {error_line + 1}, позиция {error_col}:")
            if 0 <= error_line < len(lines):
                print(f"Строка: {lines[error_line]}")
                print(" " * (error_col) + "^")
            
            # Показываем контекст
            print("\nКонтекст (строки вокруг ошибки):")
            start = max(0, error_line - 2)
            end = min(len(lines), error_line + 3)
            for i in range(start, end):
                prefix = ">>> " if i == error_line else "    "
                print(f"{prefix}{i+1}: {lines[i]}")
            
            return False

def interactive_fix_json(json_string):
    """
    Интерактивное исправление JSON.
    """
    print("Интерактивный режим исправления JSON")
    print("=" * 50)
    
    lines = json_string.split('\n')
    
    while True:
        try:
            data = json.loads('\n'.join(lines))
            print("JSON теперь валиден!")
            return '\n'.join(lines)
        except json.JSONDecodeError as e:
            print(f"\nОшибка: {e}")
            error_line = e.lineno - 1
            error_col = e.colno - 1
            
            print(f"Проблема в строке {error_line + 1}, позиция {error_col + 1}")
            print(f"Строка: {lines[error_line]}")
            
            # Подсвечиваем проблемное место
            if error_col < len(lines[error_line]):
                marker = " " * error_col + "^"
                print(marker)
            
            print("\nЧто вы хотите сделать?")
            print("1. Показать контекст ошибки")
            print("2. Исправить строку вручную")
            print("3. Удалить проблемную строку")
            print("4. Выйти")
            
            choice = input("Выберите действие (1-4): ").strip()
            
            if choice == '1':
                # Показать контекст
                start = max(0, error_line - 2)
                end = min(len(lines), error_line + 3)
                print("\nКонтекст:")
                for i in range(start, end):
                    prefix = ">>> " if i == error_line else "    "
                    print(f"{prefix}{i+1}: {lines[i]}")
                input("\nНажмите Enter для продолжения...")
                
            elif choice == '2':
                # Исправить строку
                print(f"\nТекущая строка {error_line + 1}: {lines[error_line]}")
                new_line = input("Введите исправленную строку: ")
                lines[error_line] = new_line
                
            elif choice == '3':
                # Удалить строку
                del lines[error_line]
                print(f"Строка {error_line + 1} удалена.")
                
            elif choice == '4':
                print("Выход из интерактивного режима.")
                return '\n'.join(lines)

def main():
    """Основная функция программы."""
    print("Исправление проблем с JSON файлами")
    print("=" * 40)
    
    if len(sys.argv) > 1:
        input_file = sys.argv[1]
        output_file = sys.argv[2] if len(sys.argv) > 2 else None
    else:
        input_file = input("Введите путь к JSON файлу: ").strip()
        output_file = input("Введите путь для исправленного файла (Enter для замены исходного): ").strip()
        if not output_file:
            output_file = None
    
    # Проверяем, существует ли файл
    if not Path(input_file).exists():
        print(f"Ошибка: Файл '{input_file}' не найден!")
        return
    
    print(f"\nОбработка файла: {input_file}")
    
    # Загружаем содержимое
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Ошибка при чтении файла: {e}")
        return
    
    # Предлагаем режимы работы
    print("\nВыберите режим работы:")
    print("1. Автоматическое исправление")
    print("2. Интерактивное исправление")
    print("3. Только проверка (без исправления)")
    
    mode = input("Выберите режим (1-3): ").strip()
    
    if mode == '1':
        success = fix_json_file(input_file, output_file)
        if success:
            print("\nОперация завершена успешно!")
        else:
            print("\nНе удалось автоматически исправить файл.")
            print("Попробуйте интерактивный режим.")
    
    elif mode == '2':
        # Интерактивный режим
        fixed_content = interactive_fix_json(content)
        
        if output_file is None:
            output_file = input_file
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(fixed_content)
        
        print(f"\nФайл сохранен как: {output_file}")
        
        # Проверяем результат
        try:
            json.loads(fixed_content)
            print("Файл успешно исправлен и валиден!")
        except json.JSONDecodeError as e:
            print(f"В файле все еще есть ошибки: {e}")
    
    elif mode == '3':
        # Только проверка
        try:
            data = json.loads(content)
            print("\n✓ JSON файл валиден!")
            print(f"  Тип данных: {type(data)}")
            if isinstance(data, dict):
                print(f"  Ключи: {list(data.keys())}")
        except json.JSONDecodeError as e:
            print(f"\n✗ Найдены ошибки: {e}")
            print(f"  Строка: {e.lineno}, Позиция: {e.colno}")
    
    else:
        print("Неверный выбор режима.")

if __name__ == "__main__":
    main()