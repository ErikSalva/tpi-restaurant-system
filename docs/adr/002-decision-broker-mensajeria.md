# ADR-002: Elección de Broker de Mensajería

**Estado:** Aceptado

## Contexto (El Problema)

Se requiere un flujo asincrónico (Productor -> Broker -> Consumidor) para gestionar los "avances de cocina". Cuando la API (Productor) confirma un pedido, la Cocina (Consumidor) debe ser notificada sin bloquear la respuesta al cliente. Se consideraron RabbitMQ y Kafka.

## Decisión (La Solución)

Utilizaremos **RabbitMQ**.

## Consecuencias (El Impacto)

**Positivas (+):**

* **Ligero y Rápido:** RabbitMQ tiene una huella de memoria mucho menor que Kafka y es más simple de levantar en un entorno de desarrollo con `docker-compose`.
* **Enrutamiento Flexible:** Es ideal para el *enrutamiento de eventos* (Event-Driven Architecture). Podemos enviar un evento `pedido.confirmado` y que uno o más consumidores (Cocina, Notificaciones) reaccionen.
* **Facilidad de Uso:** La UI de management que trae por defecto es muy útil para la demo y la depuración.

**Negativas (-):**

* **No Persistencia a Largo Plazo:** A diferencia de Kafka, RabbitMQ no está diseñado para re-consumir (replay) eventos antiguos. Esto no es un requisito para este proyecto.