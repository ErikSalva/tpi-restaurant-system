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

![C4 - Arquitectura de alto nivel](docs/c4/c4-container.png)

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
PORT=8000
MONGO_URI=mongodb://mongo:27017/restaurante
RABBITMQ_URL=amqp://rabbitmq:5672
JWT_SECRET=supersecreto
NODE_ENV=development
```

- Copiar `.env.example` a `.env` y personalizar los valores.

---

## Pasos para Levantar el Sistema Localmente

1. **Preparar variables de entorno**
   - Copiar `.env.example` a `.env` y editar si es necesario.
2. **Levantar servicios**
   - Solo dependencias:
     ```powershell
     docker compose up -d mongo rabbitmq
     ```
   - Todos los servicios (API, cocina, etc):
     ```powershell
     docker compose up -d --build
     ```
3. **Verificar funcionamiento**
   - API: http://localhost:8000/health
   - RabbitMQ UI: http://localhost:15672
   - Logs: `docker compose logs -f cocina`

---

## Versionado

| Versión         | Tag    | Último commit |
| --------------- | ------ | ------------- |
| Entrega inicial | v1.0.0 | 4b852be       |

---

## Recursos y Documentación

- Especificación OpenAPI: [`openapi.yaml`](./openapi.yaml)
- Diagramas y ADRs: [`/docs`](./docs)
