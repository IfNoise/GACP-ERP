#!/usr/bin/env python3
"""
Скрипт для замены плейсхолдеров в SOP файлах
Заменяет [URS-XXX-001, FS-XXX-001] на корректные ссылки
"""

import re
from pathlib import Path

# Список файлов для обработки
FILES = [
    "SOP_Packaging.md",
    "SOP_IrrigationFertilization.md",
    "SOP_RawMaterialReception.md",
    "SOP_InventoryManagement.md",
    "SOP_CleaningSanitation.md",
    "SOP_DryingCuring.md",
    "SOP_Transplantation.md",
    "SOP_Disinfection.md",
    "SOP_Labeling.md",
    "SOP_Storage.md",
]

# Старый паттерн для поиска
OLD_PATTERN = r"- \[URS-XXX-001, FS-XXX-001\]\n- \[Нормативные документы\]"

# Новый текст для замены
NEW_TEXT = """### Validation Documents

- [User Requirements Specification (URS)](../validation/URS.md)
- [Functional Specification (FS)](../validation/FS.md)
- [Design Specification (DS)](../validation/DS.md)
- [Traceability Matrix](../validation/TraceabilityMatrix.md)

### Regulatory Documents

- [WHO GACP](../compliance/WHO_GACP.md)
- [EU GMP Annex 11](../compliance/EU_GMP_Annex11.md)
- [ALCOA+ Principles](../compliance/ALCOA+.md)"""

# Также обновляем дату Last Modified
DATE_PATTERN = r"(Last Modified:)\s*\d{4}-\d{2}-\d{2}"
NEW_DATE = r"\1 2025-10-16"

def process_file(file_path: Path) -> bool:
    """Обработать один файл"""
    try:
        # Читаем файл
        content = file_path.read_text(encoding='utf-8')
        
        # Проверяем, есть ли плейсхолдер
        if not re.search(OLD_PATTERN, content):
            print(f"  ⚠️  Плейсхолдер не найден в {file_path.name}")
            return False
        
        # Заменяем плейсхолдер
        new_content = re.sub(OLD_PATTERN, NEW_TEXT, content)
        
        # Обновляем дату
        new_content = re.sub(DATE_PATTERN, NEW_DATE, new_content)
        
        # Записываем обратно
        file_path.write_text(new_content, encoding='utf-8')
        
        print(f"  ✅ {file_path.name} - обработан")
        return True
        
    except Exception as e:
        print(f"  ❌ Ошибка при обработке {file_path.name}: {e}")
        return False

def main():
    """Главная функция"""
    print("🔧 Исправление плейсхолдеров в SOP файлах...\n")
    
    base_path = Path("/home/noise83/Projects/GACP-ERP/docs/sop")
    
    processed = 0
    skipped = 0
    errors = 0
    
    for filename in FILES:
        file_path = base_path / filename
        
        if not file_path.exists():
            print(f"  ⚠️  Файл не найден: {filename}")
            skipped += 1
            continue
        
        print(f"📝 Обработка: {filename}")
        if process_file(file_path):
            processed += 1
        else:
            errors += 1
    
    print(f"\n" + "="*50)
    print(f"✅ Обработано: {processed}")
    print(f"⚠️  Пропущено: {skipped}")
    print(f"❌ Ошибки: {errors}")
    print(f"🎉 Готово!")

if __name__ == "__main__":
    main()
