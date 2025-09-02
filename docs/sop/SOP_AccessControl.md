---
title: "SOP: Access Control"
module: "ERP Security"
version: "0.2"
status: "draft"
last_updated: "2025-09-01"
author: "IT Security Officer"
approver: "General Manager"
effective_date: "TBD"
review_date: "2026-09-01"
---

# SOP: Access Control

## 1. Purpose

Обеспечение безопасного и контролируемого доступа пользователей к ERP системе согласно принципам GACP, RBAC (Role-Based Access Control) и требованиям безопасности данных.

## 2. Scope

Данная процедура распространяется на:

- Всех пользователей ERP системы (внутренних и внешних)
- Интегрированные системы и API
- Мобильные приложения и удаленный доступ
- Административные и технические учетные записи
- Временные и гостевые аккаунты

## 3. Responsibilities

| Роль                     | Ответственность                             |
| ------------------------ | ------------------------------------------- |
| **IT Security Officer**  | Общее управление системой контроля доступа  |
| **System Administrator** | Техническая реализация прав доступа         |
| **HR Manager**           | Управление жизненным циклом учетных записей |
| **Department Heads**     | Определение бизнес-ролей и прав             |
| **Compliance Officer**   | Аудит соответствия политикам доступа        |
| **Line Managers**        | Одобрение доступа для своих подчиненных     |
| **Users**                | Соблюдение политик безопасности             |

## 4. Access Control Framework

### 4.1 Role-Based Access Control (RBAC)

#### 4.1.1 Базовые роли системы

| Роль                     | Описание                                | Уровень доступа |
| ------------------------ | --------------------------------------- | --------------- |
| **System Administrator** | Полный административный доступ          | Critical        |
| **Quality Manager**      | Управление качеством и аудитом          | High            |
| **Production Manager**   | Управление производственными процессами | High            |
| **Laboratory Analyst**   | Лабораторные данные и анализы           | Medium          |
| **Cultivation Operator** | Операции выращивания                    | Medium          |
| **Warehouse Operator**   | Складские операции                      | Medium          |
| **Read-Only User**       | Просмотр отчетов и данных               | Low             |
| **Guest User**           | Ограниченный временный доступ           | Minimal         |

#### 4.1.2 Модульные права доступа

```yaml
Modules:
  Cultivation:
    - cultivation.view
    - cultivation.create
    - cultivation.edit
    - cultivation.delete
    - cultivation.approve

  Quality:
    - quality.view
    - quality.test
    - quality.approve
    - quality.release

  Inventory:
    - inventory.view
    - inventory.move
    - inventory.adjust
    - inventory.audit

  Reports:
    - reports.view
    - reports.generate
    - reports.export
    - reports.schedule
```

### 4.2 Принципы доступа

1. **Least Privilege**: Минимальные необходимые права
2. **Need to Know**: Доступ только к необходимой информации
3. **Segregation of Duties**: Разделение критических функций
4. **Time-based Access**: Временные ограничения доступа
5. **Location-based Access**: Географические ограничения

## 5. User Account Management

### 5.1 Создание учетных записей

1. **Запрос на создание аккаунта**

   - Заполнение формы запроса (Access Request Form)
   - Обоснование бизнес-потребности
   - Одобрение прямого руководителя
   - Согласование с IT Security

2. **Верификация и одобрение**

   - Проверка необходимости доступа
   - Определение подходящей роли
   - Установка временных рамок (если применимо)
   - Финальное одобрение

3. **Техническая реализация**
   - Создание аккаунта в Keycloak/SSO
   - Назначение ролей согласно PositionMatrix
   - Настройка MFA (многофакторная аутентификация)
   - Отправка учетных данных безопасным способом

### 5.2 Изменение прав доступа

1. **Инициирование изменений**

   - Запрос через систему Change Management
   - Обоснование изменений
   - Одобрение уполномоченного лица

2. **Реализация изменений**
   - Обновление ролей в системе
   - Тестирование новых прав
   - Уведомление пользователя
   - Документирование изменений

### 5.3 Деактивация учетных записей

1. **Временная деактивация**

   - Отпуск, командировка, больничный
   - Приостановка доступа
   - Сохранение настроек

2. **Постоянная деактивация**
   - Увольнение сотрудника
   - Смена должности
   - Полное удаление или архивирование

## 6. Authentication Requirements

### 6.1 Многофакторная аутентификация (MFA)

#### 6.1.1 Обязательные роли для MFA

- System Administrator
- Quality Manager
- Production Manager
- Finance roles
- External users

#### 6.1.2 Методы аутентификации

1. **Пароль** + **SMS OTP**
2. **Пароль** + **Authenticator App** (предпочтительно)
3. **Пароль** + **Hardware Token**
4. **Биометрические данные** (для критических операций)

### 6.2 Политика паролей

```yaml
Password_Policy:
  minimum_length: 12
  require_uppercase: true
  require_lowercase: true
  require_numbers: true
  require_special_chars: true
  expiration_days: 90
  history_count: 12
  lockout_attempts: 3
  lockout_duration: 30_minutes
```

## 7. Session Management

### 7.1 Параметры сессии

| Параметр                | Значение             | Обоснование                        |
| ----------------------- | -------------------- | ---------------------------------- |
| **Timeout (idle)**      | 30 минут             | Баланс безопасности и удобства     |
| **Maximum session**     | 8 часов              | Рабочий день                       |
| **Concurrent sessions** | 2                    | Основное рабочее место + мобильное |
| **Re-authentication**   | Критические операции | Дополнительная защита              |

### 7.2 Автоматическое закрытие сессий

- Неактивность пользователя
- Обнаружение аномальной активности
- Административное принуждение
- Плановое обслуживание системы

## 8. Privileged Access Management

### 8.1 Административные учетные записи

1. **Именованные административные аккаунты**

   - Личная ответственность
   - Расширенное логирование
   - Дополнительные проверки

2. **Shared/Service аккаунты**
   - Минимальное количество
   - Строгий контроль паролей
   - Регулярная ротация

### 8.2 Elevated privileges

1. **Just-in-Time (JIT) Access**

   - Временное повышение прав
   - Автоматическое снижение
   - Полное логирование

2. **Break-glass Access**
   - Экстренный доступ
   - Автоматические уведомления
   - Обязательная последующая проверка

## 9. Access Review and Audit

### 9.1 Периодический аудит доступа

| Тип аудита               | Периодичность   | Ответственный        |
| ------------------------ | --------------- | -------------------- |
| **Quarterly Review**     | Каждые 3 месяца | Department Heads     |
| **Annual Certification** | Ежегодно        | Compliance Officer   |
| **Role Review**          | Раз в полгода   | IT Security Officer  |
| **Privileged Access**    | Ежемесячно      | System Administrator |

### 9.2 Автоматизированный мониторинг

1. **Аномальная активность**

   - Необычные времена входа
   - Географические несоответствия
   - Множественные неудачные попытки
   - Доступ к несвойственным модулям

2. **Compliance мониторинг**
   - Использование shared accounts
   - Превышение времени сессии
   - Нарушения политик паролей
   - Неавторизованные изменения прав

## 10. Integration with ERP Modules

### 10.1 SCUD Module Integration

- Централизованное управление пользователями
- Автоматическая синхронизация ролей
- Real-time access control
- Интеграция с HR модулем

### 10.2 Audit Trail Integration

- Полное логирование доступа
- Immutable audit records (immudb)
- Correlation с business events
- Автоматические alert'ы

## 11. Emergency Access Procedures

### 11.1 Emergency Account

- Активация только в критических ситуациях
- Временные ограничения (24 часа)
- Немедленное уведомление руководства
- Обязательная документация использования

### 11.2 Account Recovery

- Процедуры восстановления доступа
- Верификация личности
- Временные учетные данные
- Мониторинг восстановленных аккаунтов

## 12. Training and Awareness

### 12.1 Обязательное обучение

- Политики информационной безопасности
- Процедуры аутентификации
- Социальная инженерия
- Incident response

### 12.2 Периодическая аттестация

- Ежегодные тесты по ИБ
- Симуляции фишинговых атак
- Обновления при изменении процедур

## 13. Performance Indicators

| KPI                       | Целевое значение        | Метод измерения      |
| ------------------------- | ----------------------- | -------------------- |
| Account provisioning time | < 4 часа                | Automated tracking   |
| Access review completion  | 100%                    | Compliance dashboard |
| Password compliance       | > 95%                   | System reports       |
| MFA adoption              | 100% (критические роли) | Security metrics     |
| Failed login attempts     | < 1%                    | Security logs        |

## 14. Technical Implementation

### 14.1 Technology Stack

- **Identity Provider**: Keycloak
- **Directory Service**: LDAP/Active Directory
- **MFA Service**: Integrated authenticator
- **Session Management**: JWT tokens
- **Audit Logging**: immudb + ELK Stack

### 14.2 API Access Control

```yaml
API_Security:
  authentication: OAuth2/JWT
  rate_limiting: true
  ip_whitelisting: true
  api_keys: encrypted
  scope_based_access: true
```

## 15. References

- **URS-SEC-001**: User Requirements for Security System
- **FS-SEC-001**: Functional Specification for Security
- **DS-SEC-001**: Design Specification for Security Architecture
- GACP Guidelines
- EU GMP Annex 11: Computerised Systems
- FDA 21 CFR Part 11: Electronic Records
- NIST SP 800-63: Digital Identity Guidelines
- ISO 27001: Information Security Management

## 16. Revision History

| Version | Date       | Description                            | Author              |
| ------- | ---------- | -------------------------------------- | ------------------- |
| 0.1     | 2025-09-01 | Initial draft                          | IT Security Officer |
| 0.2     | 2025-09-01 | Comprehensive update with RBAC details | IT Security Officer |

## 17. Attachments

- Attachment A: Access Request Form Template
- Attachment B: Position Matrix (Role-Permission Mapping)
- Attachment C: Emergency Access Procedures
- Attachment D: MFA Setup Guide
- Attachment E: Password Policy Configuration
