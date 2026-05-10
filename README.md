# CMS Monitoring Service

NestJS‑сервис мониторинга и конфигурации интеграций: REST API, фоновые pull‑задачи и публикация событий в Kafka. Ниже — как он связан с остальной платформой и внешними системами.

## Взаимодействие с другими сервисами

### Хранение данных

- **PostgreSQL** — основное хранилище (конфигурации интеграций, объекты риска, результаты мониторинга, outbox‑очередь и т.д.). Подключение задаётся через `DATABASE_URL` либо переменные `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`.

### Аутентификация и проверка прав

- **Провайдер OAuth2 / JWT** — входящие запросы к защищённым эндпоинтам сопровождаются Bearer‑токеном. Токен проверяется локально по публичному ключу `OAUTH2_PUBLIC_KEY_PEM` **или** по JWKS: задаётся `AUTH_JWKS_URL`, иначе при наличии `AUTH_ISSUER` используется URL вида `{AUTH_ISSUER}/oauth2/jwks`. При проверке могут требоваться scope’ы из `AUTH_REQUIRED_SCOPES`.
- **cms-auth-service** — для отдельных операций (например, в контроллере конфигураций интеграций) выполняется HTTP‑запрос `GET /api/users/{userId}/permissions/check?permission=...` на базовый URL из `CMS_AUTH_SERVICE_URL` (по умолчанию `http://localhost:9091`). Передаётся тот же заголовок `Authorization`, что и у клиента; ответ с `access: "permit"` означает разрешение.

### Асинхронная шина (исходящие события)

- **Apache Kafka** — сервис только **публикует** сообщения (не подписан на топики). События для админки/WebSocket и пайплайна рисков описаны в разделе [Topics and events](#topics-and-events) ниже. Брокеры задаются в `KAFKA_BROKERS`. Потребителями сообщений являются другие компоненты платформы (реалтайм‑уведомления, downstream‑обработка рисков и т.п.) — не этот сервис.

### Внешние HTTP‑интеграции (исходящие вызовы)

- Для **pull‑интеграций** фоновый процесс периодически отправляет **POST** на URL из конфигурации интеграции (`endpointUrl` и при необходимости `pullConfig.requestUri` / query‑параметры). Тело — JSON (в т.ч. пример заказа из `src/assets/order_example.json`), заголовки включают `x-integration-id`. Это вызовы во **внешние или корпоративные системы**, настроенные пользователем, а не фиксированный внутренний микросервис.

### Входящий HTTP API

- Клиенты (админка, другие backend‑сервисы) обращаются к REST API этого сервиса под префиксом `/api` (см. Swagger `/api/docs`). Отдельные маршруты помечены как публичные и не требуют JWT.

---

## Kafka topics: what this service publishes

This document describes all Kafka topics where `cms-monitoring-service` publishes messages, including payload format and business context.

### Transport format

- Producer library: `kafkajs`.
- Message value format: JSON string (`JSON.stringify(payload)`).
- Message key:
  - `ws_events`-like topic: `companyId`
  - `risk_topic`-like topic: `companyId`

### Topics and events

#### 1) Topic for WS/admin events

- Environment variable: `KAFKA_WS_EVENTS_TOPIC`
- Default value: `ws_events`

This topic receives three logical event types (distinguished by `moduleType` and `data`):

##### 1.1 Integration runtime status changed

Published when integration runtime status changes (`loading`, `work`, `failed`, `stop`, etc.).

```json
{
  "userId": "string",
  "companyId": "string",
  "entityId": "string",
  "valueType": "text",
  "moduleType": "integration_status",
  "clientType": "admin",
  "data": {
    "status": "idle | loading | work | failed | stop"
  }
}
```

Field notes:
- `userId`: initiator user id; if missing, fallback from `KAFKA_WS_EVENTS_USER_ID` (default: `integration-manager`).
- `entityId`: integration id (as string).
- `data.status`: runtime status.

##### 1.2 Integration invocation counters changed

Published every 5 invocations (`(success + failed) % 5 === 0`).

```json
{
  "userId": "string",
  "companyId": "string",
  "entityId": "string",
  "valueType": "text",
  "moduleType": "integration_invocations",
  "clientType": "admin",
  "data": {
    "invocations_success": "string(number)",
    "invocations_failed": "string(number)"
  }
}
```

Field notes:
- `entityId`: integration id (as string).
- `data.invocations_success`: success counter serialized as string.
- `data.invocations_failed`: failed counter serialized as string.

##### 1.3 Risk object disabled notification

Published when incoming outbox data cannot be processed because the related risk object is disabled.

```json
{
  "userId": "string",
  "companyId": "string",
  "valueType": "text",
  "entityId": null,
  "moduleType": "integration-event",
  "clientType": "admin",
  "data": {
    "message": "DISABLED_RISK_OBJECT: <riskObjectId>"
  }
}
```

Field notes:
- Sent to each recipient from risk object metadata (`authorId`, `lastModifiedBy`, if present).
- `entityId` is always `null` for this event.

---

#### 2) Topic for risk monitoring pipeline

- Environment variable: `KAFKA_RISK_TOPIC`
- Default value: `risk_topic`

Published after successful processing and persistence of monitoring data.

```json
{
  "integrationId": "string",
  "companyId": "string",
  "monitoring_entity": "string",
  "start_process": "ISO-8601 datetime string"
}
```

Field notes:
- `integrationId`: integration id serialized as string.
- `monitoring_entity`: id of persisted monitoring result entity.
- `start_process`: processing timestamp (`processDate.toISOString()`).

### Related Kafka config

- `KAFKA_BROKERS` - comma-separated broker list (required for actual publishing).
- `KAFKA_CLIENT_ID` - Kafka client id (default: `cms-monitoring-service`).
- `KAFKA_WS_EVENTS_TOPIC` - topic for admin/ws events (default: `ws_events`).
- `KAFKA_RISK_TOPIC` - topic for risk monitoring events (default: `risk_topic`).
- `KAFKA_WS_EVENTS_USER_ID` - fallback `userId` for ws events (default: `integration-manager`).

### Important behavior

- If producer is not connected, events are skipped (logged as warning), not buffered.
- All payloads are sent as single-message batches.
- Partitioning behavior depends on topic configuration, but message key is always `companyId`.
