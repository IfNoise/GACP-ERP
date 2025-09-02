#!/bin/bash

# Создание недостающих SOP файлов для GACP-ERP

SOP_DIR="/home/noise83/Projects/GACP-ERP/docs/sop"

# Функция для создания базового шаблона SOP
create_sop_file() {
    local filename="$1"
    local title="$2"
    local module="$3"
    local purpose="$4"
    
    cat > "$SOP_DIR/$filename" << EOF
---
title: "SOP: $title"
module: "$module"
version: "0.1"
status: "draft"
last_updated: "2025-09-01"
---

## 1. Purpose

$purpose

## 2. Scope

[Определить область применения данной процедуры]

## 3. Responsibilities

- [Role]: [описание ответственности]

## 4. Procedure

1. [Шаг 1]
2. [Шаг 2]
3. [Шаг 3]
4. [Шаг 4]
5. [Шаг 5]
6. [Шаг 6]

## 5. References

- [URS-XXX-001, FS-XXX-001]
- [Нормативные документы]

## 6. Notes

- [Дополнительные примечания]
EOF
}

# Cultivation & Agronomy (недостающие файлы)
create_sop_file "SOP_Transplantation.md" "Transplantation" "Cultivation Management" "Стандартизация процесса пересадки растений каннабиса."
create_sop_file "SOP_IrrigationFertilization.md" "Irrigation and Fertilization" "Cultivation Management" "Контроль полива и внесения удобрений для оптимального роста растений."
create_sop_file "SOP_PestControl.md" "Pest Control" "Cultivation Management" "Управление вредителями и болезнями растений каннабиса."
create_sop_file "SOP_GrowthMonitoring.md" "Growth Monitoring" "Cultivation Management" "Мониторинг роста и развития растений каннабиса."
create_sop_file "SOP_WastePlantMaterial.md" "Waste Plant Material" "Cultivation Management" "Обращение с растительными отходами в соответствии с требованиями."

# Post-Harvest & Processing
create_sop_file "SOP_DryingCuring.md" "Drying and Curing" "Post-Harvest Management" "Контроль процессов сушки и кюринга для обеспечения качества продукции."
create_sop_file "SOP_Trimming.md" "Trimming" "Post-Harvest Management" "Стандартизация процесса тримминга (обрезки) растений."
create_sop_file "SOP_Packaging.md" "Packaging" "Post-Harvest Management" "Упаковка готовой продукции с соблюдением стандартов качества."
create_sop_file "SOP_Labeling.md" "Labeling" "Post-Harvest Management" "Маркировка продукции QR/штрих-кодами для трассируемости."
create_sop_file "SOP_Storage.md" "Storage" "Post-Harvest Management" "Хранение сырья и готовой продукции в контролируемых условиях."
create_sop_file "SOP_Sampling.md" "Sampling" "Quality Control" "Отбор проб для лабораторного анализа."

# Facility & Equipment
create_sop_file "SOP_CleaningSanitation.md" "Cleaning and Sanitation" "Facility Management" "Уборка и санитарная обработка производственных помещений."
create_sop_file "SOP_Disinfection.md" "Disinfection" "Facility Management" "Дезинфекция оборудования и поверхностей."
create_sop_file "SOP_EquipmentCalibration.md" "Equipment Calibration" "Equipment Management" "Калибровка измерительного и технологического оборудования."
create_sop_file "SOP_EquipmentMaintenance.md" "Equipment Maintenance" "Equipment Management" "Планово-предупредительное обслуживание оборудования."
create_sop_file "SOP_HVACMonitoring.md" "HVAC Monitoring" "Facility Management" "Контроль систем вентиляции и климата."
create_sop_file "SOP_WaterSystem.md" "Water System" "Facility Management" "Контроль качества воды и водных систем."
create_sop_file "SOP_UtilitiesMonitoring.md" "Utilities Monitoring" "Facility Management" "Мониторинг инженерных сетей и энергоснабжения."

# Laboratory & QA/QC (недостающие файлы)
create_sop_file "SOP_SampleHandling.md" "Sample Handling" "Laboratory Management" "Правила обращения с лабораторными пробами."
create_sop_file "SOP_AnalyticalMethods.md" "Analytical Methods" "Laboratory Management" "Стандартные методы лабораторного анализа."
create_sop_file "SOP_ReleaseCriteria.md" "Release Criteria" "Quality Control" "Критерии выпуска готовой продукции."
create_sop_file "SOP_OutOfSpecification.md" "Out of Specification" "Quality Control" "Управление результатами анализов вне спецификации."

# Logistics & Compliance
create_sop_file "SOP_SupplierQualification.md" "Supplier Qualification" "Supply Chain Management" "Квалификация и аттестация поставщиков."
create_sop_file "SOP_RawMaterialReception.md" "Raw Material Reception" "Supply Chain Management" "Приёмка сырья и материалов."
create_sop_file "SOP_InventoryManagement.md" "Inventory Management" "Supply Chain Management" "Управление складскими запасами."
create_sop_file "SOP_Logistics.md" "Logistics" "Supply Chain Management" "Внутренняя и внешняя логистика."
create_sop_file "SOP_ChainOfCustody.md" "Chain of Custody" "Supply Chain Management" "Обеспечение трассируемости и целостности цепочки поставок."

echo "Создание SOP файлов завершено успешно!"
echo "Всего создано файлов: $(ls -1 $SOP_DIR/SOP_*.md | wc -l)"
