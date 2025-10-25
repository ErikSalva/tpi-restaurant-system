# ADR-003: Elección de Estilo de API

**Estado:** Aceptado

## Contexto (El Problema)

El TP requiere una API principal para la gestión del restaurante (CRUD de productos, creación de pedidos). Las opciones principales son **REST** (sobre HTTP/JSON) o **gRPC** (sobre HTTP/2 + Protobuf).

## Decisión (La Solución)

Utilizaremos **API REST** como el estilo de API principal.

## Consecuencias (El Impacto)

**Positivas (+):**

* **Estándar de Facto:** REST es el estándar universal para APIs consumidas por clientes (navegadores, apps móviles, Postman).
* **Legibilidad (JSON):** Utiliza JSON, que es un formato legible por humanos, facilitando la depuración.
* **Documentación (OpenAPI):** Es un requisito del TP usar OpenAPI 3.1, el cual está diseñado específicamente para documentar APIs REST.
* **Facilidad de Pruebas:** Es trivial de probar con herramientas como Postman (otro requisito).

**Negativas (-):**

* **Rendimiento:** gRPC (binario) es técnicamente más rápido que REST (texto/JSON), pero esta alta performance no es un requisito crítico para este dominio, que depende más de la consistencia de la DB.
* *(Nota: gRPC se suele usar para comunicación interna de alta velocidad entre microservicios, no tanto para la API pública que consume un cliente).*