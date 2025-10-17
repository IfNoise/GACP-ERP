---
title: "Training Completion Tracking"
module: "Training & Competency"
urs_id: "URS-TRAIN-001"
fs_id: "FS-TRAIN-001"
ds_id: "DS-TRAIN-001"
iq_oq_pq_step: "OQ-TRAIN-001"
version: "1.0"
status: "active"
last_updated: "2025-10-15"
test_priority: "High"
regulatory_impact: "Critical - GMP Annex 11, FDA 21 CFR Part 11"
# AI-Assisted Documentation Metadata (per AI_Assisted_Documentation_Policy.md)
ai_generated: true
author_verified: false
qa_approved: false
ai_status: draft
---

# TC-TRAIN-001: Training Completion Tracking

## 1. Purpose

Проверка корректного отслеживания прохождения обучения, тестирования и сертификации сотрудников в соответствии с требованиями GMP и нормативными стандартами.

**Compliance требования:**

- EU GMP Annex 11 - Chapter 2 (Personnel)
- FDA 21 CFR Part 11 - Electronic signatures и audit trails
- WHO GACP - Personnel training requirements

## 2. Scope

**Тестируемая функциональность:**

- Назначение обучающих курсов сотрудникам
- Прохождение курсов и тестирование
- Сохранение результатов экзаменов
- Генерация сертификатов о прохождении
- Отслеживание истечения сертификации
- Audit trail для всех действий

## 3. Preconditions

### 3.1 System State

- ✅ GACP-ERP система запущена и доступна
- ✅ База данных инициализирована с тестовыми данными
- ✅ Training Management модуль активен
- ✅ Email notifications настроены

### 3.2 Test Data

- **HR Manager**: `hr.manager@gacp-test.com` / пароль: `Test123!`
- **Test Employee**: `john.doe@gacp-test.com` / пароль: `Test123!`
- **Training Course**: "GMP Basics for Cultivation" (ID: COURSE-001)
- **Exam**: "GMP Basics Exam" (ID: EXAM-001, проходной балл: 80%)

### 3.3 User Permissions

- HR Manager имеет права: `training:manage`, `training:assign`, `reports:view`
- Test Employee имеет права: `training:view`, `training:complete`

## 4. Test Steps

### Step 1: Вход в систему как HR Manager

**Action:**

```text
1.1. Открыть URL: https://gacp-erp.test/login
1.2. Ввести email: hr.manager@gacp-test.com
1.3. Ввести password: Test123!
1.4. Нажать кнопку "Sign In"
```

**Expected Result:**

- ✅ Успешная аутентификация
- ✅ Редирект на Dashboard
- ✅ В audit trail записан: LOGIN event для <hr.manager@gacp-test.com>

---

### Step 2: Навигация к модулю Training Management

**Action:**

```text
2.1. Кликнуть на меню "Workforce"
2.2. Выбрать "Training & Competency"
2.3. Открыть вкладку "Assign Training"
```

**Expected Result:**

- ✅ Отображается список сотрудников
- ✅ Отображается список доступных курсов
- ✅ Интерфейс назначения обучения активен

---

### Step 3: Назначение курса сотруднику

**Action:**

```text
3.1. Найти сотрудника: "John Doe" (john.doe@gacp-test.com)
3.2. Выбрать курс: "GMP Basics for Cultivation" (COURSE-001)
3.3. Установить дедлайн: +30 дней от текущей даты
3.4. Добавить комментарий: "Mandatory GMP training"
3.5. Нажать кнопку "Assign Course"
```

**Expected Result:**

- ✅ Курс назначен со статусом "Assigned"
- ✅ Email уведомление отправлено John Doe
- ✅ В audit trail записано:

  ```text
  TRAINING_ASSIGNED | Employee: john.doe@gacp-test.com | 
  Course: COURSE-001 | Assigned By: hr.manager@gacp-test.com |
  Deadline: [date+30d]
  ```

- ✅ В списке назначений отображается новая запись

---

### Step 4: Выход и вход как сотрудник

**Action:**

```text
4.1. Logout из HR Manager аккаунта
4.2. Login как john.doe@gacp-test.com / Test123!
4.3. Перейти в "My Training"
```

**Expected Result:**

- ✅ В списке "Assigned Courses" отображается COURSE-001
- ✅ Статус: "Not Started"
- ✅ Показан оставшийся срок до дедлайна
- ✅ Кнопка "Start Course" активна

---

### Step 5: Прохождение курса

**Action:**

```
5.1. Нажать "Start Course" для COURSE-001
5.2. Пройти все модули курса (5 модулей):
    - Module 1: Introduction to GMP
    - Module 2: Documentation Requirements
    - Module 3: Personal Hygiene
    - Module 4: Contamination Control
    - Module 5: Quality Management
5.3. Отметить каждый модуль как "Completed"
```

**Expected Result:**

- ✅ Каждый модуль помечается как "Completed"
- ✅ Progress bar обновляется: 20% → 40% → 60% → 80% → 100%
- ✅ После завершения всех модулей кнопка "Take Exam" становится активной
- ✅ В audit trail записаны все MODULE_COMPLETED events

---

### Step 6: Прохождение экзамена

**Action:**

```
6.1. Нажать "Take Exam"
6.2. Ответить на 20 вопросов теста
6.3. Правильно ответить на 17 вопросов (85% правильных ответов)
6.4. Нажать "Submit Exam"
```

**Expected Result:**

- ✅ Экзамен отправлен на проверку
- ✅ Отображается результат: "Score: 85% - PASSED"
- ✅ Сгенерирован сертификат с уникальным ID
- ✅ Статус курса изменен на "Completed"
- ✅ В audit trail записано:

  ```
  EXAM_COMPLETED | Employee: john.doe@gacp-test.com |
  Exam: EXAM-001 | Score: 85% | Result: PASSED |
  Certificate: CERT-001-2025-XXXX
  ```

- ✅ Email уведомление с сертификатом отправлено

---

### Step 7: Верификация сертификата

**Action:**

```
7.1. Открыть "My Certificates"
7.2. Проверить детали сертификата CERT-001-2025-XXXX
7.3. Скачать PDF сертификата
```

**Expected Result:**

- ✅ Сертификат отображается в списке
- ✅ Детали содержат:
  - Employee Name: John Doe
  - Course: GMP Basics for Cultivation
  - Completion Date: [текущая дата]
  - Expiration Date: [дата + 1 год]
  - Score: 85%
  - Certificate ID: CERT-001-2025-XXXX
  - Digital Signature (SHA-256 hash)
- ✅ PDF файл скачивается и содержит watermark

---

### Step 8: Проверка Training Report (как HR Manager)

**Action:**

```
8.1. Logout и login как hr.manager@gacp-test.com
8.2. Перейти в "Reports" → "Training Report"
8.3. Выбрать период: текущий месяц
8.4. Применить фильтр: Employee = "John Doe"
8.5. Сгенерировать отчет
```

**Expected Result:**

- ✅ Отчет отображает:
  - Employee: John Doe
  - Course: GMP Basics for Cultivation
  - Status: Completed
  - Completion Date: [текущая дата]
  - Score: 85%
  - Certificate: CERT-001-2025-XXXX
  - Expires: [дата + 1 год]
- ✅ Возможность экспорта в PDF/Excel
- ✅ Отчет содержит watermark с датой и именем генератора

---

### Step 9: Проверка Audit Trail

**Action:**

```
9.1. Перейти в "Audit" → "Training Audit Trail"
9.2. Применить фильтр: Employee = "john.doe@gacp-test.com"
9.3. Проверить записи за сегодняшний день
```

**Expected Result:**

- ✅ Audit trail содержит все события:
  1. TRAINING_ASSIGNED (by hr.manager)
  2. COURSE_STARTED (by john.doe)
  3. MODULE_COMPLETED x5 (by john.doe)
  4. EXAM_STARTED (by john.doe)
  5. EXAM_COMPLETED (by john.doe)
  6. CERTIFICATE_GENERATED (system)
- ✅ Каждая запись содержит:
  - Timestamp
  - User ID
  - Action
  - Old/New values
  - Session ID
  - IP Address

---

### Step 10: Проверка уведомлений о истечении

**Action:**

```
10.1. Изменить системную дату на [current_date + 350 дней]
10.2. Запустить scheduled job: "training_expiration_check"
10.3. Проверить email уведомления
```

**Expected Result:**

- ✅ Email отправлен John Doe:
  - Subject: "Training Certificate Expiring Soon"
  - Content: сертификат CERT-001-2025-XXXX истекает через 15 дней
- ✅ Email отправлен HR Manager:
  - Subject: "Training Certifications Expiring Report"
  - Content: список сотрудников с истекающими сертификатами
- ✅ В системе появился reminder в Dashboard

## 5. Expected Results (Summary)

### Functional Requirements

- ✅ Курсы корректно назначаются сотрудникам
- ✅ Прогресс обучения точно отслеживается
- ✅ Экзамены проходят с правильной оценкой
- ✅ Сертификаты генерируются автоматически
- ✅ Отчеты содержат актуальные данные
- ✅ Уведомления отправляются своевременно

### Compliance Requirements

- ✅ Audit trail полный и неизменяемый (FDA 21 CFR Part 11)
- ✅ Electronic signatures валидны (SHA-256)
- ✅ Данные защищены watermark при экспорте
- ✅ История изменений сохранена

### Performance Requirements

- ✅ Время отклика UI < 2 секунды
- ✅ Генерация отчета < 5 секунд
- ✅ Генерация сертификата < 3 секунды

## 6. Actual Results

**Test Execution Date:** _________________  
**Tester:** _________________  
**Environment:** _________________

| Step | Status | Comments | Evidence |
|------|--------|----------|----------|
| 1 | ☐ Pass ☐ Fail | | |
| 2 | ☐ Pass ☐ Fail | | |
| 3 | ☐ Pass ☐ Fail | | |
| 4 | ☐ Pass ☐ Fail | | |
| 5 | ☐ Pass ☐ Fail | | |
| 6 | ☐ Pass ☐ Fail | | |
| 7 | ☐ Pass ☐ Fail | | |
| 8 | ☐ Pass ☐ Fail | | |
| 9 | ☐ Pass ☐ Fail | | |
| 10 | ☐ Pass ☐ Fail | | |

**Overall Test Result:** ☐ PASS ☐ FAIL  
**Defects Found:** _________________

## 7. Test Evidence

**Required Attachments:**

1. Screenshots для каждого шага
2. Audit trail export (CSV/PDF)
3. Сгенерированный Training Report (PDF)
4. Пример сертификата (PDF)
5. Email notifications (screenshots)

## 8. Cleanup

**Post-Test Actions:**

```
1. Удалить тестовые курсы и назначения
2. Удалить тестовые сертификаты
3. Восстановить системную дату
4. Очистить email queue
```

## 9. Approvals

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Test Author | | | |
| Test Reviewer | | | |
| QA Manager | | | |
| Project Manager | | | |

---

**Revision History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | 2025-09-01 | Initial | Draft version |
| 1.0 | 2025-10-15 | AI Assistant | Full detailed test case with compliance requirements |
