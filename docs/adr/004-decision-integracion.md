# ADR-004: Elección de Integración (WebSocket)

**Estado:** Aceptado

## Contexto (El Problema)

Los requisitos del proyecto exigen implementar una integración, siendo las opciones Webhook, gRPC o **WebSocket**. El dominio "Pedidos en Restaurante" sugiere explícitamente un caso de uso para un **"WebSocket tablero de cocina"**.

Necesitamos un mecanismo para que el servicio consumidor (que procesa los pedidos de RabbitMQ) pueda notificar a una interfaz de usuario (el tablero de la cocina) en **tiempo real** cada vez que un nuevo pedido llega o cambia de estado.

## Decisión (La Solución)

Implementaremos una integración con **WebSocket (stream en tiempo real)**.

## Consecuencias (El Impacto)

**Positivas (+):**

* **Solución Ideal para el Dominio:** Es la tecnología perfecta para un "tablero en vivo". Permite al servidor *empujar* (push) eventos (`nuevo_pedido`, `pedido_listo`) a la UI de la cocina sin que esta tenga que estar recargando la página (polling).
* **Experiencia Técnica en el Equipo:** El equipo posee experiencia previa y sólida en la implementación de WebSockets. Esto reduce drásticamente el riesgo técnico y el tiempo de desarrollo.
* **Efecto Visual Claro:** Permite una demostración clara y visual del flujo en tiempo real: un pedido creado en la API se refleja instantáneamente en la interfaz de cocina.

**Negativas (-):**

* **Manejo de Estado:** A diferencia de REST (stateless), un servidor de WebSocket debe gestionar el estado de las conexiones (quién está conectado), lo cual añade una leve complejidad.
* **Pruebas:** Probar un stream de WebSocket es más complejo que probar un endpoint REST (requiere un cliente de WebSocket para simular la suscripción).