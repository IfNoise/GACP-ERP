#!/bin/bash

# Скрипт для замены плейсхолдеров URS-XXX-001, FS-XXX-001 в SOP файлах
# на корректные ссылки на валидационные документы

echo "🔧 Исправление плейсхолдеров в SOP файлах..."

# Список файлов с плейсхолдерами
FILES=(
  "/home/noise83/Projects/GACP-ERP/docs/sop/SOP_HVACMonitoring.md"
  "/home/noise83/Projects/GACP-ERP/docs/sop/SOP_Packaging.md"
  "/home/noise83/Projects/GACP-ERP/docs/sop/SOP_IrrigationFertilization.md"
  "/home/noise83/Projects/GACP-ERP/docs/sop/SOP_RawMaterialReception.md"
  "/home/noise83/Projects/GACP-ERP/docs/sop/SOP_InventoryManagement.md"
  "/home/noise83/Projects/GACP-ERP/docs/sop/SOP_CleaningSanitation.md"
  "/home/noise83/Projects/GACP-ERP/docs/sop/SOP_DryingCuring.md"
  "/home/noise83/Projects/GACP-ERP/docs/sop/SOP_Transplantation.md"
  "/home/noise83/Projects/GACP-ERP/docs/sop/SOP_Disinfection.md"
  "/home/noise83/Projects/GACP-ERP/docs/sop/SOP_Labeling.md"
  "/home/noise83/Projects/GACP-ERP/docs/sop/SOP_Storage.md"
)

# Старый текст для замены
OLD_TEXT="- [URS-XXX-001, FS-XXX-001]
- [Нормативные документы]"

# Новый текст
NEW_TEXT="### Validation Documents

- [User Requirements Specification (URS)](../validation/URS.md)
- [Functional Specification (FS)](../validation/FS.md)
- [Design Specification (DS)](../validation/DS.md)
- [Traceability Matrix](../validation/TraceabilityMatrix.md)

### Regulatory Documents

- [WHO GACP](../compliance/WHO_GACP.md)
- [EU GMP Annex 11](../compliance/EU_GMP_Annex11.md)
- [ALCOA+ Principles](../compliance/ALCOA+.md)"

# Счетчик обработанных файлов
COUNT=0

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "📝 Обработка: $(basename "$file")"
    
    # Создаем временный файл
    temp_file=$(mktemp)
    
    # Выполняем замену с использованием awk для многострочной замены
    awk '
    BEGIN { 
      old1 = "- \\[URS-XXX-001, FS-XXX-001\\]"
      old2 = "- \\[Нормативные документы\\]"
      replacement_done = 0
    }
    {
      if ($0 ~ old1 && !replacement_done) {
        # Читаем следующую строку
        getline next_line
        if (next_line ~ old2) {
          # Выводим новый текст
          print "### Validation Documents"
          print ""
          print "- [User Requirements Specification (URS)](../validation/URS.md)"
          print "- [Functional Specification (FS)](../validation/FS.md)"
          print "- [Design Specification (DS)](../validation/DS.md)"
          print "- [Traceability Matrix](../validation/TraceabilityMatrix.md)"
          print ""
          print "### Regulatory Documents"
          print ""
          print "- [WHO GACP](../compliance/WHO_GACP.md)"
          print "- [EU GMP Annex 11](../compliance/EU_GMP_Annex11.md)"
          print "- [ALCOA+ Principles](../compliance/ALCOA+.md)"
          replacement_done = 1
          next
        } else {
          print $0
          print next_line
        }
      } else {
        print $0
      }
    }
    ' "$file" > "$temp_file"
    
    # Заменяем оригинальный файл
    mv "$temp_file" "$file"
    
    ((COUNT++))
    echo "  ✅ Готово"
  else
    echo "  ⚠️  Файл не найден: $file"
  fi
done

echo ""
echo "✅ Обработано файлов: $COUNT"
echo "🎉 Готово!"
