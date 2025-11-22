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
