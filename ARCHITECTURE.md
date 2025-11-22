# Flujo de Comunicación del Sistema

## Arquitectura General

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│  Front Mesero   │◄─────┤     Nginx       │─────►│   API Pedidos   │
│   (Browser)     │      │  Reverse Proxy  │      │   (Express)     │
│                 │      │                 │      │                 │
└────────┬────────┘      └────────┬────────┘      └────────┬────────┘
         │                        │                         │
         │                        │                         │
         │ WebSocket              │                         │
         │                        │                         ▼
         │                        │                ┌─────────────────┐
         │                        │                │                 │
         │                        │                │    MongoDB      │
         │                        │                │                 │
         │                        │                └─────────────────┘
         │                        │                         │
         │                        │                         │
         │                        │                         ▼
         │                        │                ┌─────────────────┐
         │                        │                │                 │
         │                        │                │    RabbitMQ     │
         │                        │                │   (Exchange)    │
         │                        │                │                 │
         │                        │                └────────┬────────┘
         │                        │                         │
         │                        │                         │ Event
         │                        │                         ▼
         │                        │                ┌─────────────────┐
         │                        │                │                 │
         │                        └───────────────►│ Servicio Cocina │
         │                       WebSocket Server  │   (Consumer)    │
         │                                         │                 │
         └─────────────────────────────────────────┴─────────────────┘
                          WebSocket

┌──────────────────┐
│  Tablero Cocina  │ (Browser)
│  (index.html)    │
└────────┬─────────┘
         │
         │ WebSocket
         │
         ▼
┌─────────────────┐
│ Servicio Cocina │
└─────────────────┘
```

## Flujo Detallado: Confirmar Pedido

### Creación del Pedido

```
┌──────────────┐         POST /api/pedidos        ┌──────────────┐
│              │──────────────────────────────────►│              │
│ Front Mesero │      { items: [...] }             │ API Pedidos  │
│              │◄──────────────────────────────────│              │
└──────────────┘   201 Created (PENDIENTE)         └──────┬───────┘
                                                           │
                                                           │ Save
                                                           ▼
                                                   ┌──────────────┐
                                                   │   MongoDB    │
                                                   │              │
                                                   │ estado:      │
                                                   │ PENDIENTE    │
                                                   └──────────────┘
```

### Confirmación del Pedido

```
┌──────────────┐   POST /api/pedidos/:id/confirmar  ┌──────────────┐
│              │────────────────────────────────────►│              │
│ Front Mesero │                                     │ API Pedidos  │
│              │                                     │              │
└──────────────┘                                     └──────┬───────┘
                                                            │
                                                            │ 1. Iniciar transacción
                                                            │ 2. Verificar stock
                                                            │ 3. Calcular total
                                                            │ 4. Actualizar stock
                                                            │ 5. Cambiar estado → CONFIRMADO
                                                            ▼
                                                    ┌──────────────┐
                                                    │   MongoDB    │
                                                    │              │
                                                    │ estado:      │
                                                    │ CONFIRMADO   │
                                                    │ stock: -X    │
                                                    └──────────────┘
```

### Publicación de Evento

```
┌──────────────┐                                    ┌──────────────┐
│              │                                    │              │
│ API Pedidos  │───────publish event───────────────►│  RabbitMQ    │
│              │                                    │              │
└──────────────┘   {                                └──────┬───────┘
                     routingKey: "pedido.confirmado"      │
                     data: {                               │
                       pedidoId: "...",                    │
                       usuarioId: "...",          Exchange: pedidos.exchange
                       total: 100,                  Type: topic
                       items: [...]                 Durable: true
                     }                                     │
                   }                                       │
                                                           │ Route
                                                           ▼
                                                   ┌──────────────┐
                                                   │    Queue     │
                                                   │              │
                                                   │ cocina.      │
                                                   │ pedidos      │
                                                   └──────────────┘
```

### Consumo y Broadcast WebSocket

```
┌──────────────┐                                   ┌──────────────┐
│  RabbitMQ    │                                   │  Servicio    │
│              │────────consume message───────────►│  Cocina      │
│              │                                   │              │
└──────────────┘                                   └──────┬───────┘
                                                          │
                                                          │ Parse & Validate
                                                          │
                                                          │ Broadcast to all
                                                          │ connected clients
                                                          │
                                     ┌────────────────────┴────────────────────┐
                                     │                                          │
                                     ▼                                          ▼
                          ┌──────────────────┐                      ┌──────────────────┐
                          │                  │                      │                  │
                          │  Front Mesero    │                      │  Tablero Cocina  │
                          │  (WebSocket)     │                      │  (WebSocket)     │
                          │                  │                      │                  │
                          └────────┬─────────┘                      └────────┬─────────┘
                                   │                                         │
                                   │ 1. Recibe mensaje                       │ 1. Recibe mensaje
                                   │ 2. Muestra notificación                 │ 2. Crea tarjeta
                                   │ 3. Actualiza lista                      │ 3. Anima entrada
                                   │                                         │
                                   ▼                                         ▼
                          ┌──────────────────┐                      ┌──────────────────┐
                          │  "✅ Pedido      │                      │  ┌──────────────┐│
                          │  #abc123         │                      │  │ Pedido #123  ││
                          │  confirmado!"    │                      │  │ 2x Pizza     ││
                          └──────────────────┘                      │  │ 1x Refresco  ││
                                                                    │  │ Total: $100  ││
                                                                    │  └──────────────┘│
                                                                    └──────────────────┘
```

## Estados del Pedido

```
┌─────────────┐   Crear    ┌─────────────┐   Confirmar   ┌─────────────┐
│             │ ────────►  │             │  ──────────►  │             │
│   (nuevo)   │            │  PENDIENTE  │  (Mesero)     │ CONFIRMADO  │
│             │            │             │               │             │
└─────────────┘            └─────────────┘               └──────┬──────┘
                                                                 │
                                                                 │ Publica
                                                                 │ Evento
                                                                 ▼
                                                          ┌─────────────┐
                                                          │    EN       │
                                                          │ PREPARACION │◄─── (Cocina)
                                                          │             │
                                                          └──────┬──────┘
                                                                 │
                                                                 │ Publica
                                                                 │ Evento
                                                                 ▼
                           ┌─────────────┐               ┌─────────────┐
                           │             │               │             │
                           │  ENTREGADO  │  ◄──────────  │    LISTO    │◄─── (Cocina)
                           │   (Mesero)  │               │             │
                           │             │               │             │
                           └─────────────┘               └─────────────┘
```

**Responsables de cada transición:**

- `PENDIENTE` → `CONFIRMADO`: Mesero (descuenta stock)
- `CONFIRMADO` → `EN_PREPARACION`: Cocina (inicia preparación)
- `EN_PREPARACION` → `LISTO`: Cocina (pedido listo para entregar)
- `LISTO` → `ENTREGADO`: Mesero (entrega al cliente)

**Eventos RabbitMQ:**

- `pedido.confirmado`: Cuando el mesero confirma un pedido
- `pedido.estado_cambiado`: Cuando cambia cualquier estado (EN_PREPARACION, LISTO, ENTREGADO)

## Tecnologías y Puertos

```
┌────────────────────────────────────────────────────────────────┐
│                        CONTENEDORES DOCKER                     │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ front-mesero │  │ api-pedidos  │  │   MongoDB    │       │
│  │   (nginx)    │  │  (express)   │  │   (mongo)    │       │
│  │   :8080      │  │   :3000      │  │   :27017     │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                                │
│  ┌──────────────┐  ┌──────────────┐                          │
│  │  servicio-   │  │   RabbitMQ   │                          │
│  │   cocina     │  │   (broker)   │                          │
│  │   :3001      │  │ :5672, :15672│                          │
│  └──────────────┘  └──────────────┘                          │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

## Mensajes RabbitMQ

### Exchange Configuration

```yaml
Name: pedidos.exchange
Type: topic
Durable: true
Auto-delete: false
```

### Queue Configuration

```yaml
Name: cocina.pedidos
Durable: true
Exclusive: false
Auto-delete: false
Bindings:
  - exchange: pedidos.exchange
    routing_key: pedido.confirmado
  - exchange: pedidos.exchange
    routing_key: pedido.estado_cambiado
  - exchange: pedidos.exchange
    routing_key: pedido.* # Wildcard para futuros eventos
```

### Message Structure

```json
{
  "pedidoId": "507f1f77bcf86cd799439011",
  "usuarioId": "507f191e810c19729de860ea",
  "total": 150.0,
  "items": [
    {
      "productoId": "507f191e810c19729de860eb",
      "cantidad": 2,
      "nombreProducto": "Pizza Margarita",
      "precioUnitario": 50.0,
      "subtotal": 100.0
    },
    {
      "productoId": "507f191e810c19729de860ec",
      "cantidad": 1,
      "nombreProducto": "Coca Cola",
      "precioUnitario": 50.0,
      "subtotal": 50.0
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## WebSocket Messages

### Server → Client

#### Welcome Message

```json
{
  "type": "welcome",
  "message": "Conectado al tablero de cocina",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Pedido Confirmado

```json
{
  "type": "pedido.confirmado",
  "data": {
    "pedidoId": "507f1f77bcf86cd799439011",
    "usuarioId": "507f191e810c19729de860ea",
    "total": 150.00,
    "items": [...],
    "timestamp": "2024-01-15T10:30:00.000Z"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Estado Cambiado

```json
{
  "type": "pedido.estado_cambiado",
  "data": {
    "pedidoId": "507f1f77bcf86cd799439011",
    "estadoAnterior": "EN_PREPARACION",
    "estadoNuevo": "LISTO",
    "timestamp": "2024-01-15T10:35:00.000Z"
  },
  "timestamp": "2024-01-15T10:35:00.000Z"
}
```

## Flujo Completo de Cambio de Estado

### Cocina Marca "Listo"

```
┌──────────────┐   POST /api/pedidos/:id/listo    ┌──────────────┐
│  Tablero     │────────────────────────────────►│              │
│  Cocina      │      (con token JWT)             │ API Pedidos  │
│              │                                   │              │
└──────────────┘                                   └──────┬───────┘
                                                          │
                                                          │ 1. Validar estado actual
                                                          │ 2. Cambiar: EN_PREPARACION → LISTO
                                                          │ 3. Guardar en BD
                                                          │ 4. Publicar evento
                                                          ▼
                                                   ┌──────────────┐
                                                   │  RabbitMQ    │
                                                   │              │
                                                   │ routing_key: │
                                                   │ pedido.      │
                                                   │ estado_      │
                                                   │ cambiado     │
                                                   └──────┬───────┘
                                                          │
                                                          │ Consume
                                                          ▼
                                                   ┌──────────────┐
                                                   │  Servicio    │
                                                   │  Cocina      │
                                                   │              │
                                                   └──────┬───────┘
                                                          │
                                              ┌───────────┴───────────┐
                                              │ WebSocket Broadcast   │
                                              ▼                       ▼
                                   ┌──────────────┐        ┌──────────────┐
                                   │ Tablero      │        │ Front        │
                                   │ Cocina       │        │ Mesero       │
                                   │              │        │              │
                                   │ Actualiza    │        │ Muestra      │
                                   │ botones      │        │ notificación │
                                   │ (muestra     │        │ "Pedido      │
                                   │ ✓ Listo)     │        │ #123 LISTO"  │
                                   └──────────────┘        └──────────────┘
```

### Mesero Marca "Entregado"

```
┌──────────────┐   POST /api/pedidos/:id/entregado ┌──────────────┐
│  Front       │─────────────────────────────────►│              │
│  Mesero      │      (con token JWT)              │ API Pedidos  │
│              │                                    │              │
└──────────────┘                                    └──────┬───────┘
                                                           │
                                                           │ 1. Validar: estado = LISTO
                                                           │ 2. Cambiar: LISTO → ENTREGADO
                                                           │ 3. Publicar evento
                                                           ▼
                                                    ┌──────────────┐
                                                    │  RabbitMQ    │
                                                    └──────┬───────┘
                                                           │
                                                           ▼
                                                    ┌──────────────┐
                                                    │  Servicio    │
                                                    │  Cocina      │
                                                    └──────┬───────┘
                                                           │
                                               ┌───────────┴───────────┐
                                               │ WebSocket Broadcast   │
                                               ▼                       ▼
                                    ┌──────────────┐        ┌──────────────┐
                                    │ Tablero      │        │ Front        │
                                    │ Cocina       │        │ Mesero       │
                                    │              │        │              │
                                    │ ELIMINA      │        │ Actualiza    │
                                    │ tarjeta      │        │ estado badge │
                                    │ (animación)  │        │ ENTREGADO    │
                                    │              │        │              │
                                    │ Decrementa   │        │              │
                                    │ contador     │        │              │
                                    └──────────────┘        └──────────────┘
```

## Patrones de Comunicación

### 1. Request-Response (HTTP REST)

```
Cliente ────Request───► Servidor
        ◄───Response───
```

- Síncrono
- Usado para: CRUD operations, autenticación, cambios de estado

### 2. Publish-Subscribe (RabbitMQ)

```
Publisher ──►Exchange──►Queue──►Consumer
```

- Asíncrono
- Desacoplado
- Usado para: Eventos de negocio (confirmación, cambios de estado)

### 3. Broadcast (WebSocket)

```
Server ─────►│─────► Client 1 (Tablero Cocina)
             ├─────► Client 2 (Front Mesero)
             └─────► Client N (Múltiples clientes)
```

- Tiempo real
- Bidireccional (aunque usamos unidireccional)
- Usado para: Notificaciones instantáneas de cambios de estado

## Endpoints de Cambio de Estado

### API REST

```
POST /api/pedidos/:id/confirmar
  Authorization: Bearer <token>
  Roles: USER, ADMIN
  Transición: PENDIENTE → CONFIRMADO
  Acciones: Descuenta stock, publica evento

POST /api/pedidos/:id/en-preparacion
  Authorization: Bearer <token>
  Roles: USER, ADMIN
  Transición: CONFIRMADO → EN_PREPARACION
  Acciones: Publica evento estado_cambiado

POST /api/pedidos/:id/listo
  Authorization: Bearer <token>
  Roles: USER, ADMIN
  Transición: EN_PREPARACION → LISTO
  Acciones: Publica evento estado_cambiado

POST /api/pedidos/:id/entregado
  Authorization: Bearer <token>
  Roles: USER, ADMIN
  Transición: LISTO → ENTREGADO
  Acciones: Publica evento estado_cambiado
```

## Comportamiento de Interfaces

### Tablero Cocina (http://localhost:3001)

**Funcionalidades:**

- Login con JWT (almacena token en localStorage como 'token_cocina')
- Recibe pedidos vía WebSocket cuando se confirman
- Muestra tarjetas de pedidos con estado y botones de acción
- **Estados visibles:** CONFIRMADO, EN_PREPARACION, LISTO
- **Estados ocultos:** ENTREGADO (se elimina automáticamente con animación)

**Acciones disponibles:**

- CONFIRMADO → Botón "Iniciar Preparación" → API: POST /en-preparacion
- EN_PREPARACION → Botón "Marcar Listo" → API: POST /listo
- LISTO → Mensaje "✓ Listo para entregar" (sin botón, espera al mesero)
- ENTREGADO → Tarjeta desaparece + decrementa contador

**Contador de Pedidos:**

- Incrementa: +1 cuando llega pedido confirmado
- Decrementa: -1 cuando pedido se marca como entregado
- Muestra mensaje de espera cuando contador = 0

### Front Mesero (http://localhost:8080)

**Funcionalidades:**

- Login con JWT (almacena token en localStorage como 'token')
- Crear pedidos, confirmar pedidos
- Ver todos los pedidos (todos los estados)
- Recibe notificaciones vía WebSocket de cambios de estado

**Acciones disponibles:**

- PENDIENTE → Botón "✅ Confirmar Pedido" → API: POST /confirmar
- CONFIRMADO → Indicador "⏳ En cocina..."
- EN_PREPARACION → Indicador "⏳ En cocina..."
- LISTO → Botón "🚀 Marcar Entregado" → API: POST /entregado
- ENTREGADO → Badge gris "ENTREGADO"

**Notificaciones WebSocket:**

- "Pedido #abc123 confirmado exitosamente!"
- "Pedido #abc123 ahora está: En Preparación"
- "Pedido #abc123 ahora está: Listo"
- "Pedido #abc123 ahora está: Entregado"

## Ventajas del Diseño

**Separación de Responsabilidades**

- Front independiente de la API
- API desacoplada del servicio de cocina
- Comunicación asíncrona via broker
- Roles claros: Mesero (crear/confirmar/entregar), Cocina (preparar)

**Escalabilidad**

- Múltiples instancias de front-mesero
- Múltiples consumers de RabbitMQ
- Balance de carga con nginx
- WebSocket broadcast a N clientes simultáneos

**Resiliencia**

- Si RabbitMQ falla, la API sigue funcionando
- Si WebSocket falla, reconexión automática cada 3 segundos
- Mensajes persisten en RabbitMQ hasta ser consumidos
- Estados en base de datos como fuente de verdad

**Tiempo Real**

- Notificaciones instantáneas vía WebSocket
- Sin polling
- Bajo overhead de red
- Actualizaciones automáticas en todos los clientes conectados

**Auditabilidad**

- Todos los cambios de estado se registran con timestamps
- Eventos RabbitMQ permiten reconstruir historial
- MongoDB timestamps (createdAt, updatedAt) en cada pedido
