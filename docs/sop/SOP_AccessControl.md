---
title: "SOP: Access Control and Authentication Management"
module: "ERP Security & Compliance"
version: "1.0"
status: "active"
last_updated: "2025-10-15"
author: "IT Security Officer"
approver: "General Manager"
effective_date: "2025-10-15"
review_date: "2026-10-15"
regulatory_basis: "FDA 21 CFR Part 11, EU GMP Annex 11, ISO 27001, NIST SP 800-63"
# AI-Assisted Documentation Metadata (per AI_Assisted_Documentation_Policy.md)
ai_generated: true
author_verified: false
qa_approved: false
ai_status: draft
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

## 16. Incident Response

### 16.1 Unauthorized Access Detection

**Immediate Actions:**
1. Автоматическое блокирование подозрительной учетной записи
2. Уведомление IT Security Officer (email + SMS)
3. Логирование деталей инцидента в Audit Trail
4. Запуск процедуры расследования

**Investigation Steps:**
```yaml
Investigation_Procedure:
  1_Containment:
    - Изоляция скомпрометированного аккаунта
    - Ревокация всех активных сессий
    - Блокировка связанных API токенов
    
  2_Analysis:
    - Просмотр audit logs за последние 30 дней
    - Идентификация затронутых данных
    - Определение метода компрометации
    
  3_Recovery:
    - Принудительный сброс пароля
    - Ре-конфигурация MFA
    - Верификация личности пользователя
    
  4_Post_Incident:
    - Документирование инцидента (Incident Report)
    - Уведомление Compliance Officer
    - Внедрение дополнительных контролей
```

### 16.2 Brute Force Attack Mitigation

**Detection Criteria:**
- > 5 failed login attempts за 5 минут
- > 10 failed attempts с одного IP за 15 минут
- > 20 failed attempts для одного username за 1 час

**Automated Response:**
```
1. IP блокировка на 1 час (firewall-level)
2. Account временная блокировка (30 минут)
3. CAPTCHA challenge для всех последующих попыток
4. Alert IT Security + SOC
```

### 16.3 Privilege Escalation Detection

**Monitoring Rules:**
- Доступ к admin endpoints без admin роли
- Модификация прав без Change Request
- Использование deprecated/backdoor endpoints
- SQL injection attempts в параметрах

**Response:**
```
1. Немедленное прекращение сессии
2. Блокировка аккаунта до расследования
3. Автоматический Incident Report
4. Escalation to CTO + Compliance Officer
```

## 17. Compliance Validation

### 17.1 FDA 21 CFR Part 11 Requirements

| Requirement | Implementation | Validation Method |
|------------|----------------|-------------------|
| **§11.10(d)** Limiting system access to authorized individuals | RBAC + MFA | Quarterly access review |
| **§11.10(g)** Use of authority checks | Role-based permissions | Automated testing |
| **§11.30** Controls for open systems | Encryption + VPN | Security audit |
| **§11.300(b)** Use of identification codes | Unique user accounts | Account provisioning logs |
| **§11.300(d)** Loss management procedures | Account recovery SOP | Annual validation |

### 17.2 EU GMP Annex 11 Compliance

**System Access (Clause 12.1):**
- ✅ Physical and/or logical controls для ограничения доступа
- ✅ Methods для предотвращения unauthorized entry
- ✅ Процедуры для выдачи, cancellation, modification доступа

**Audit Trail (Clause 12.4):**
- ✅ Independent and computer-generated audit trail
- ✅ Recording of identity для создания/изменения данных
- ✅ No deleting or altering audit trails

### 17.3 ISO 27001 Controls Mapping

```yaml
ISO_27001_Controls:
  A.9.1_Business_Requirements:
    - Access control policy implemented
    - Regular access reviews conducted
    
  A.9.2_User_Access_Management:
    - Formal user registration процедура
    - Privileged access управление
    - Access rights review
    
  A.9.3_User_Responsibilities:
    - Password use policy
    - Unattended user equipment protection
    
  A.9.4_System_Access_Control:
    - Secure log-on procedures (MFA)
    - Password management system
    - Use of privileged utility programs
```

## 18. Change Control Integration

### 18.1 Changes Requiring Validation

**Critical Changes (Full Validation Required):**
- Модификация RBAC matrix
- Изменение authentication механизмов
- Обновление MFA configuration
- Новые privileged roles

**Standard Changes (Testing Only):**
- Добавление стандартных пользователей
- Изменение password expiration
- Обновление access request forms

### 18.2 Change Approval Matrix

| Change Type | Initiator | Reviewer | Approver | Testing Required |
|------------|-----------|----------|----------|-----------------|
| Role modification | Department Head | IT Security | General Manager | Yes |
| New user role | IT Security | Compliance | Quality Manager | Yes |
| Password policy | IT Security | IT Security | CTO | No |
| Individual access grant | Line Manager | IT Security | Department Head | No |

## 19. Continuous Improvement

### 19.1 Metrics Dashboard

**Weekly Metrics:**
- Failed login attempts trend
- Average account provisioning time
- Active sessions по времени суток
- Anomaly detection alerts

**Monthly Metrics:**
- MFA adoption rate
- Password compliance rate
- Access review completion %
- Incident response time

**Quarterly Metrics:**
- User satisfaction survey
- Security training completion
- Audit findings trend
- Compliance score

### 19.2 Review and Update Cycle

```yaml
SOP_Maintenance:
  Quarterly_Review:
    - Performance metrics analysis
    - Incident trends review
    - Technology updates assessment
    
  Annual_Validation:
    - Full compliance audit
    - Regulatory requirements review
    - Technology stack evaluation
    
  Continuous:
    - Security patches application
    - Threat intelligence monitoring
    - Best practices adoption
```

## 20. Disaster Recovery Integration

### 20.1 Access Control Failover

**Scenario: Primary Keycloak Instance Failure**
```
1. Automatic failover к secondary instance (< 30 seconds)
2. Verification целостности user database
3. Validation активных сессий
4. Communication to users (если требуется)
```

**Scenario: Complete Identity Provider Outage**
```
1. Activation emergency access procedure
2. Break-glass accounts для критического персонала
3. Временная миграция на backup authentication
4. Post-recovery audit всех emergency access actions
```

### 20.2 Business Continuity

**RTO (Recovery Time Objective):** 1 hour  
**RPO (Recovery Point Objective):** 15 minutes

**Critical Functions Priority:**
1. Quality Manager access (compliance operations)
2. Production Manager access (production continuation)
3. System Administrator access (recovery operations)
4. Standard users (business as usual)

## 21. Integration Testing Procedures

### 21.1 User Acceptance Testing (UAT)

**Test Scenarios:**
1. ✅ New user account creation E2E
2. ✅ MFA enrollment and login
3. ✅ Password reset flow
4. ✅ Role modification impact
5. ✅ Session timeout validation
6. ✅ Concurrent sessions limit
7. ✅ Emergency access activation
8. ✅ Account deactivation process

**Success Criteria:**
- 100% test cases passed
- No security vulnerabilities detected
- Audit trail completeness verified
- Performance benchmarks met

### 21.2 Regression Testing

**Automated Test Suite:**
```typescript
describe('Access Control Validation', () => {
  test('RBAC permissions correctly enforced', async () => {
    // Test role-based access restrictions
  });
  
  test('MFA required for critical operations', async () => {
    // Verify MFA enforcement
  });
  
  test('Session timeout after inactivity', async () => {
    // Validate session management
  });
  
  test('Audit trail records all access events', async () => {
    // Verify audit completeness
  });
});
```

**Execution Frequency:**
- Pre-production deployment: Always
- Weekly: Smoke tests
- Monthly: Full regression suite
- Post-incident: Targeted tests

## 22. Glossary

| Term | Definition |
|------|------------|
| **RBAC** | Role-Based Access Control - метод управления доступом на основе ролей |
| **MFA** | Multi-Factor Authentication - многофакторная аутентификация |
| **SSO** | Single Sign-On - единая точка входа |
| **JIT** | Just-in-Time - предоставление доступа точно в момент необходимости |
| **SOD** | Segregation of Duties - разделение обязанностей |
| **PAM** | Privileged Access Management - управление привилегированным доступом |
| **SCUD** | System Configuration and User Database - модуль управления пользователями |

## 23. Revision History

| Version | Date       | Description | Author | Approved By |
|---------|------------|-------------|--------|-------------|
| 0.1 | 2025-09-01 | Initial draft | IT Security Officer | - |
| 0.2 | 2025-09-01 | Comprehensive RBAC details | IT Security Officer | - |
| 1.0 | 2025-10-15 | Finalized with compliance mapping, incident response, DR integration | IT Security Officer | General Manager |

## 24. Approvals

| Role | Name | Signature | Date |
|------|------|-----------|------|
| **Author** | IT Security Officer | _________________ | __________ |
| **Reviewer** | Compliance Officer | _________________ | __________ |
| **Approver** | General Manager | _________________ | __________ |
| **QA Verification** | Quality Manager | _________________ | __________ |

---

**Document Control:**
- Document ID: SOP-SEC-001
- Location: /docs/sop/SOP_AccessControl.md
- Classification: Internal - Restricted
- Next Review Date: 2026-10-15

## 25. Attachments

- **Attachment A**: Access Request Form Template (FORM-SEC-001)
- **Attachment B**: Position Matrix - Role-Permission Mapping (DOC-SEC-002)
- **Attachment C**: Emergency Access Procedures (SOP-SEC-002)
- **Attachment D**: MFA Setup Guide (GUIDE-SEC-001)
- **Attachment E**: Password Policy Configuration (CONFIG-SEC-001)
- **Attachment F**: Incident Response Playbook (PLAY-SEC-001)
- **Attachment G**: Access Audit Report Template (REPORT-SEC-001)
