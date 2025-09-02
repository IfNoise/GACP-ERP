---
title: "SOP: Change Control"
module: "Quality Management System"
version: "0.1"
status: "draft"
last_updated: "2025-09-01"
author: "Quality Manager"
approver: "General Manager"
effective_date: "TBD"
review_date: "2026-09-01"
---

# SOP: Change Control

## 1. Purpose

Обеспечить систематический и контролируемый подход к внесению изменений в системы, оборудование, процессы и документацию для поддержания качества и соответствия GACP требованиям.

## 2. Scope

Данная процедура применяется ко всем изменениям в:

- Программном обеспечении ERP системы
- Производственном оборудовании
- Стандартных операционных процедурах (SOP)
- Технологических процессах
- Лабораторных методах
- Системах контроля качества
- Инфраструктуре предприятия

## 3. Responsibilities

| Роль                           | Ответственность                                                |
| ------------------------------ | -------------------------------------------------------------- |
| **Change Requestor**           | Инициирование запроса на изменение, предоставление обоснования |
| **Change Owner**               | Координация процесса изменения, управление реализацией         |
| **Quality Manager**            | Оценка влияния на качество, утверждение критических изменений  |
| **Department Head**            | Утверждение изменений в своей области                          |
| **IT Manager**                 | Технические аспекты изменений в ИТ системах                    |
| **Compliance Officer**         | Оценка нормативного соответствия                               |
| **Change Control Board (CCB)** | Принятие решений по сложным изменениям                         |

## 4. Change Classification

### 4.1 Критичность изменений

| Класс         | Описание                                                   | Процедура утверждения |
| ------------- | ---------------------------------------------------------- | --------------------- |
| **Critical**  | Влияет на безопасность продукции, нормативное соответствие | CCB + QA Manager      |
| **Major**     | Существенное влияние на процессы или системы               | Department Head + QA  |
| **Minor**     | Локальные улучшения без влияния на качество                | Supervisor approval   |
| **Emergency** | Срочные изменения для безопасности                         | Accelerated process   |

### 4.2 Типы изменений

- **Hardware Changes**: Модификации оборудования
- **Software Changes**: Изменения в ПО и конфигурациях
- **Process Changes**: Изменения технологических процессов
- **Documentation Changes**: Обновления процедур и документации
- **Infrastructure Changes**: Изменения в инфраструктуре

## 5. Procedure

### 5.1 Инициирование изменения

1. **Создание Change Request (CR)**

   - Уникальный номер CR: CR-YYYY-NNNN
   - Описание предлагаемого изменения
   - Обоснование необходимости
   - Ожидаемые преимущества
   - Предварительная оценка ресурсов

2. **Первичная оценка**
   - Классификация изменения
   - Определение владельца процесса
   - Назначение ответственных лиц

### 5.2 Анализ и планирование

1. **Risk Assessment**

   - Анализ потенциальных рисков
   - Оценка влияния на качество продукции
   - Идентификация зависимостей
   - План минимизации рисков

2. **Impact Analysis**

   - Технические последствия
   - Влияние на документацию
   - Требования к обучению персонала
   - Финансовые затраты

3. **Implementation Planning**
   - Детальный план реализации
   - Временные рамки
   - Ресурсные требования
   - Критерии приемки

### 5.3 Утверждение изменения

1. **Review Process**

   - Техническая экспертиза
   - Оценка качества и соответствия
   - Финансовое обоснование
   - Одобрение заинтересованных сторон

2. **Authorization Levels**
   ```
   Minor Changes: Supervisor
   Major Changes: Department Head + QA Manager
   Critical Changes: CCB (Change Control Board)
   Emergency Changes: QA Manager + General Manager
   ```

### 5.4 Реализация изменения

1. **Pre-Implementation Activities**

   - Создание резервных копий
   - Подготовка среды тестирования
   - Уведомление заинтересованных сторон
   - Подготовка планов отката

2. **Implementation**

   - Выполнение согласно утвержденному плану
   - Документирование всех действий
   - Мониторинг процесса реализации
   - Уведомление о статусе

3. **Post-Implementation**
   - Verification testing (OQ)
   - Performance testing (PQ)
   - User acceptance testing
   - Training delivery

### 5.5 Закрытие изменения

1. **Verification Activities**

   - Подтверждение соответствия требованиям
   - Валидация функциональности
   - Проверка отсутствия негативного влияния
   - Документирование результатов

2. **Documentation Updates**
   - Обновление технической документации
   - Актуализация процедур
   - Обновление обучающих материалов
   - Архивирование документов изменения

## 6. Emergency Changes

### 6.1 Критерии экстренных изменений

- Угроза безопасности продукции
- Критические сбои системы
- Нормативные требования
- Безопасность персонала

### 6.2 Ускоренная процедура

1. Устное одобрение уполномоченного лица
2. Немедленная реализация
3. Документирование в течение 24 часов
4. Ретроспективное рассмотрение CCB

## 7. Documentation and Records

### 7.1 Обязательная документация

- Change Request Form
- Risk Assessment Report
- Implementation Plan
- Test Results and Validation
- Training Records
- Final Change Report

### 7.2 Retention Period

- Критические изменения: Пожизненно
- Основные изменения: 10 лет
- Незначительные изменения: 5 лет

## 8. Training Requirements

### 8.1 Роли и обучение

- **Change Requestors**: Процедуры инициирования
- **Change Owners**: Управление жизненным циклом
- **CCB Members**: Принятие решений и оценка рисков
- **Technical Staff**: Specific implementation procedures

## 9. Performance Monitoring

### 9.1 Ключевые метрики

- Среднее время реализации изменений
- Процент успешных изменений
- Количество отклонений от плана
- Эффективность процедур отката

### 9.2 Периодический анализ

- Ежемесячный анализ статистики
- Квартальный анализ эффективности
- Годовой анализ процесса

## 10. System Integration

### 10.1 ERP Integration

- Автоматическое создание CR через ERP
- Workflow управление
- Уведомления и эскалация
- Reporting и analytics

### 10.2 Audit Trail

- Полная трассируемость изменений
- Immutable logging в immudb
- Integration с Audit Module
- Автоматическое архивирование

## 11. References

- **URS-CC-001**: User Requirements for Change Control System
- **FS-CC-001**: Functional Specification for Change Control
- **DS-CC-001**: Design Specification for Change Control
- GACP Guidelines
- ICH Q9: Quality Risk Management
- ICH Q10: Pharmaceutical Quality System
- ISPE GAMP 5: Risk-Based Approach to Compliant GxP Computerized Systems

## 12. Revision History

| Version | Date       | Description                   | Author          |
| ------- | ---------- | ----------------------------- | --------------- |
| 0.1     | 2025-09-01 | Initial comprehensive version | Quality Manager |

## 13. Attachments

- Attachment A: Change Request Form Template
- Attachment B: Risk Assessment Matrix
- Attachment C: CCB Charter and Procedures
- Attachment D: Emergency Change Notification Template
