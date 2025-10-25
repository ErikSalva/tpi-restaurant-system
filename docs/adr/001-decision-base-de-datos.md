# ADR-001: Elección de Base de Datos

**Estado:** Aceptado

## Contexto (El Problema)

Necesitamos una base de datos para persistir las entidades principales: `Pedidos` y `Productos`. La entidad `Pedido` es la más compleja, ya que contiene una lista variable de `items` (productos) y sus atributos.

El requisito clave del TP es la "Transacción: Confirmar pedido", que exige verificar el stock de `Productos` y crear un `Pedido` de forma atómica (todo o nada).

## Decisión (La Solución)

Utilizaremos una base de datos **NoSQL Documental (MongoDB)**.

## Consecuencias (El Impacto)

**Positivas (+):**

* **Modelo de Datos Natural:** La entidad `Pedido` *es* un documento. Embeber los `items` es un mapeo directo de la realidad del dominio, eliminando por completo la necesidad de `JOINs` complejos.
* **Alto Rendimiento de Lectura:** La consulta de un pedido (la operación más frecuente) se convierte en una operación de lectura única y ultra-rápida, ya que se trae el documento completo con todos sus items de una sola vez.
* **Simplicidad de Desarrollo (API):** El formato de documento reduce drásticamente la fricción entre el código de la API y la capa de persistencia. Lo que la API envía (JSON) es casi idéntico a cómo se guarda (BSON).

**Negativas (-):**

* **Complejidad Transaccional:** A diferencia de SQL, la consistencia fuerte no es el fuerte por defecto. La transacción atómica (Verificar Stock en `productos` + Crear `pedidos`) debe ser implementada *explícitamente* en el código usando **Transacciones Multi-Documento** de MongoDB, lo cual es más complejo que una transacción SQL estándar.