# ADR-005: Estrategia de Migraciones y Seed de Base de Datos

**Estado:** Aceptado

## Contexto (El Problema)

El proyecto requiere una estrategia reproducible para inicializar y evolucionar el esquema de la base de datos (MongoDB). Este es un problema dual:

1.  **Seed (Semilla):** Necesitamos una forma de poblar la base de datos con datos iniciales (productos, usuarios admin) para que el entorno de desarrollo sea funcional y repetible.
2.  **Migraciones:** Necesitamos un mecanismo versionable para aplicar cambios de esquema a futuro (ej. "agregar un campo 'roles' a todos los usuarios") de forma controlada.

Se evaluaron herramientas como `mongoose-migrate` (deprecado) y `migrate-mongo`, así como el uso exclusivo de scripts de inicialización.

## Decisión (La Solución)

Se adopta una estrategia dual para separar la inicialización de la evolución del esquema:

1.  **Para el Seed Inicial:** Utilizaremos el script `mongo-init.js` provisto por la imagen oficial de Docker de MongoDB. Este script se ejecuta automáticamente una sola vez al crear el volumen de la base de datos.
2.  **Para Migraciones:** Se adopta la herramienta **`migrate-mongo`** como el *runner* oficial para todas las futuras evoluciones del esquema.

## Consecuencias (El Impacto)

**Positivas (+):**

* **Claridad de Propósito:** Esta estrategia separa limpiamente el problema del "seed" (una sola vez) del problema de las "migraciones" (muchas veces, a lo largo del tiempo).
* **Justificación del Seed (`mongo-init.js`):**
    * **Simplicidad:** Es la solución más simple y robusta para poblar la base de datos en el primer arranque.
* **Justificación de Migraciones (`migrate-mongo`):**
    * **Estándar Moderno:** Es la herramienta de facto y activamente mantenida por la comunidad de Node.js para migraciones en MongoDB.
    * **Versionable:** `migrate-mongo` crea archivos de migración (con `up`/`down`) que se versionan en Git, haciendo la evolución del esquema trazable y segura.

**Negativas (-):**

* **Doble Sintaxis:** El equipo deberá manejar dos sintaxis de base de datos: la sintaxis de la *shell nativa* de Mongo (para el `mongo-init.js`) y la sintaxis de **Mongoose** (que usaremos dentro de los scripts de `migrate-mongo` para reutilizar nuestros modelos de la API).
