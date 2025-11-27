# Pedidos en Restaurante con Cocina

---

## Descripción del Proyecto

Solución para la gestión de pedidos en un restaurante, con:

- **API REST** (Express, Node.js)
- **Base de datos NoSQL** (MongoDB)
- **Broker de mensajería** (RabbitMQ)
- **Integración en tiempo real** (WebSocket para tablero de cocina)
- **Seguridad** (OAuth2 + JWT)
- **Contenedores** (Docker + Compose)

Entidades principales: **Pedido**, **Producto**.

---

## Arquitectura (C4)

**Vista de contexto:**

![C4 - Contexto](docs/c4/c4-context.png)

**Vista de contenedor:**

![C4 - Arquitectura de alto nivel](docs/c4/c4-container.png)

**Vista de componentes:**

![C4 - Componentes](docs/c4/c4-component.png)

## Modelo de datos NoSQL (MongoDB)

![Modelo de datos NoSQL](docs/nosql-schema.png)

Más diagramas y decisiones en [`/docs`](./docs).

---

## Requisitos Previos

- **Docker** >= 20.10
- **Docker Compose** v2 (integrado en Docker Desktop)
- **RAM mínima:** 4 GB libres (recomendado 8 GB para una experiencia fluida con MongoDB + RabbitMQ + servicios)
- (Opcional) Node.js, Postman/curl para pruebas

---

## Variables de Entorno

Ejemplo de archivo: `.env.example`

```env
PORT=3000
MONGODB_URI=mongodb://mongo:27017/restaurant_db
RABBITMQ_URL=amqp://guest:guest@RabbitMQ:5672
JWT_SECRET=supersecreto
NODE_ENV=development

WEBSOCKET_PORT=3001
TABLERO_PORT=3003
FRONT_PORT=8080

ELASTIC_PASSWORD=MiClaveElastic123
KIBANA_SYSTEM_PASSWORD=MiClaveKibana123
KIBANA_ENCRYPTION_KEY=TuClaveSeguraDe32CaracteresAqui1
APM_SERVER_URL=http://apm-server:8200
APM_SECRET_TOKEN=TuTokenSecretoParaAPM
```

- Copiar `.env.example` a `.env` y personalizar los valores.

---

## Pasos para Levantar el Sistema Localmente

1. **Preparar variables de entorno**
   - Copiar `.env.example` a `.env` y editar si es necesario.
2. **Levantar servicios**
   - Solo dependencias:
     ```powershell
     docker compose up -d mongo RabbitMQ
     ```
   - Todos los servicios (API, cocina, front):
     ```powershell
     docker compose up -d --build
     ```
3. **Verificar funcionamiento**
   - API: http://localhost:3000/health
   - RabbitMQ UI: http://localhost:15672
   - Front Mesero: http://localhost:8080
   - Tablero Cocina (Frontend): http://localhost:3003
   - Servicio Cocina (Backend): http://localhost:3001/health
   - Kibana (Observabilidad): http://localhost:5601
   - Logs: `docker compose logs -f servicio-cocina tablero-cocina`

---

## Flujo Completo del Sistema

```
1. Mesero (Front) → Crea pedido → API REST (estado: PENDIENTE)
2. Mesero → Confirma pedido → API REST verifica stock
3. API → Actualiza stock y estado (CONFIRMADO)
4. API → Publica evento a RabbitMQ (pedido.confirmado)
5. RabbitMQ → Enruta a cola cocina.pedidos
6. Servicio Cocina → Consume evento y broadcastea via WebSocket
7. Front Mesero + Tablero Cocina → Reciben notificación en tiempo real
8. Cocina → Cambia estado → API REST → RabbitMQ → Notificación
```

---

## Servicios Disponibles

| Servicio          | Puerto | Descripción                                        |
| ----------------- | ------ | -------------------------------------------------- |
| `api-pedidos`     | 3000   | API REST principal (pedidos, productos, auth)      |
| `servicio-cocina` | 3001   | Backend SOLO: WebSocket server + RabbitMQ consumer |
| `tablero-cocina`  | 3003   | Frontend SOLO: Tablero de cocina (HTML/nginx)      |
| `front-mesero`    | 8080   | Frontend web para meseros (nginx)                  |
| `mongo`           | 27017  | Base de datos MongoDB                              |
| `RabbitMQ`        | 5672   | Broker de mensajería (UI: 15672)                   |
| `Kibana`        | 5601   | Observabilidad                   |

---

## Usuarios de Prueba

| Email                    | Password    | Rol   | Descripción                          |
| ------------------------ | ----------- | ----- | ------------------------------------ |
| `mesero@restaurante.com` | `mesero123` | USER  | Usuario mesero con permisos básicos  |
| `admin@restaurante.com`  | `admin123`  | ADMIN | Administrador con todos los permisos |

## Cómo Ejecutar Pruebas

### Colección Postman

La colección completa de Postman incluye **24 endpoints** con tests automatizados.

**Importar en Postman:**

1. Abrir Postman
2. Import → Seleccionar archivos de `/postman`
3. Seleccionar environment "Local" o "Docker"
4. Ejecutar "Autenticación → Login" para obtener token

**Carpetas de la colección:**

- **Sistema** (2 endpoints): Health check, API info
- **Autenticación** (2 endpoints): Login con JWT
- **Productos** (5 endpoints): CRUD completo
- **Pedidos** (9 endpoints): CRUD + transacción + cambios de estado
- **Usuarios** (6 endpoints): Gestión de usuarios
- **Flujo Completo Demo** (8 pasos): Secuencia end-to-end
---
## Cómo Observar el Sistema (Kibana)

El sistema está instrumentado con el agente **Elastic APM** en los servicios Node.js y **Filebeat** para la recolección de logs estructurados (JSON) de todos los contenedores.

### 1. Acceso al Dashboard de Kibana

Para acceder al dashboard de visualización:
* **URL del Dashboard:** `http://localhost:5601`
* **Credenciales:** Usuario `elastic`, Contraseña `${ELASTIC_PASSWORD}` (`MiClaveElastic123` por defecto).
* **Ubicación Principal:** Una vez dentro de Kibana, la información se encuentra en la aplicación **APM** (para métricas y trazas) y en la aplicación **Analytics** → **Discover** (para logs).

### 2. Dónde Encontrar las Métricas Clave del TP

Estas métricas son cruciales para evaluar el rendimiento y la salud del servicio y se encuentran en la aplicación **APM** seleccionando el servicio **`api-pedidos`**.

| Requisito del TP | Pestaña en Kibana APM | Significado |
| :--- | :--- | :--- |
| **Latencia p95** | **Pestaña Latency** | **Valor:** Representa el tiempo de respuesta del 95% de las solicitudes. Es un indicador clave de la experiencia del usuario (SLO). |
| **Throughput** | **Pestaña Throughput** | **Valor:** Mide la **tasa de solicitudes por minuto (RPM)** de la API REST. Indica el volumen de trabajo que el sistema está procesando. |
| **Error Rate** | **Pestaña Errors** | **Valor:** Muestra el porcentaje de transacciones que resultaron en un error. Un alto *Error Rate* (típicamente > 1%) indica un problema crítico en producción. |

### 3. Dónde Encontrar Logs y Trazas Correlacionables

| Elemento | Ubicación en Kibana | Importancia |
| :--- | :--- | :--- |
| **Logs Estructurados (Filebeat)** | **Analytics** → **Discover** | Contiene los logs en formato JSON de todos los contenedores. Es la fuente primaria para la depuración de errores que no son capturados como excepciones. |
| **Correlación de Trazas** | **APM** (dentro de cualquier transacción) | Permite seguir el flujo completo (`API Pedidos` → `RabbitMQ` → `Servicio Cocina`) a través del identificador único **`trace.id`**. Es vital para diagnosticar latencias en sistemas distribuidos. |
---
## Flujo de Negocio: Asincronía e Integración (WebSocket)

El flujo clave es la **Transacción Multi-Paso** que activa la **Asincronía** (`RabbitMQ`) y la **Integración** en tiempo real (`WebSocket`).

### 1. Disparar el Flujo Asincrónico

El flujo asincrónico se dispara al ejecutar la **transacción multi-paso** que confirma un pedido. Esta acción debe ser realizada por un `Mesero` (con un JWT válido).

* **Ruta de Disparo (Ejemplo):** `PUT /pedidos/{id}/confirmar`
* **Acción interna de la API:** Una vez que la `API Pedidos` valida y persiste la transacción (`CONFIRMADO`), publica el evento `pedido.confirmado` en **RabbitMQ**.

### 2. Dónde Ver el Efecto (Integración en Tiempo Real)

El efecto visible de la asincronía es la aparición inmediata del pedido en el tablero de cocina, gracias a la integración WebSocket:

| Dónde Ver el Efecto | Componente Involucrado | Instrucción |
| :--- | :--- | :--- |
| **Tablero Cocina (Visual)** | `tablero-cocina` (Frontend) | **Abre:** `http://localhost:3003`. El nuevo pedido aparecerá instantáneamente en el listado, demostrando la integración **WebSocket**. |
| **Consumidor (Logs)** | `servicio-cocina` (Backend) | Verifica los logs de este contenedor (`docker compose logs -f servicio-cocina`) para ver que el `Consumidor de Eventos` recibió y procesó el mensaje de RabbitMQ. |
| **Broker (Opcional)** | RabbitMQ UI (`http://localhost:15672`) | Puedes verificar la cola `cocina.pedidos` para confirmar que el mensaje fue puesto en cola por la API y luego consumido por el Servicio Cocina. |
---
## Limitaciones y Próximos Pasos

El proyecto actual es una Prueba de Concepto (PoC) que implementa los requisitos básicos del TP. A continuación, se detallan las principales limitaciones de la arquitectura actual y las posibles mejoras:

### 1. Limitaciones Identificadas

* **Seguridad:** El flujo OAuth2/JWT es básico. Carece de implementación de **Refresh Tokens**, mecanismos de **revocación de tokens** y limitación de intentos de inicio de sesión (*rate limiting*).
* **Transacciones y Datos:** El manejo de stock en la transacción multi-paso es **optimista**. No se implementó una lógica de compensación robusta o un patrón Saga ante fallos en la publicación del evento a RabbitMQ.
* **Pruebas:** Solo se implementaron pruebas funcionales End-to-End con Postman. El código carece de **testing unitario** y de **pruebas de integración** entre servicios.

### 2. Mejoras Futuras Sugeridas

* **Observabilidad:** Implementar **OpenTelemetry (OTEL)** para métricas y trazas más ricas, exportando a Jaeger/Grafana (Opción C de bono del TP).
* **Asincronía:** Agregar **Dead Letter Queues (DLQ)** y un mecanismo de reintento para los mensajes fallidos en RabbitMQ.
---
## Versionado

| Versión         | Tag    | Último commit |
| --------------- | ------ | ------------- |
| Entrega inicial | v1.0.0 | 45d2a15       |

---

## Recursos y Documentación

- Especificación OpenAPI: [`openapi.yaml`](./openapi.yaml)
- Diagramas y ADRs: [`/docs`](./docs)
- Arquitectura completa: [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- Colección Postman: [`/postman`](./postman)
- Swagger UI: http://localhost:3000/api-docs
