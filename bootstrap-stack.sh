#!/bin/bash

# ================================
#  Bootstrap completo: Elastic Stack + Kibana System Password
# ================================

# Nombre de los contenedores/servicios
COMPOSE_FILE="docker-compose.yml"
ES_SERVICE="elasticsearch"
KIBANA_SERVICE="kibana"

# Credenciales
ELASTIC_USER="elastic"
ELASTIC_PASSWORD="${ELASTIC_PASSWORD:-MiClaveElastic123}"
KIBANA_SYSTEM_PASSWORD="${KIBANA_SYSTEM_PASSWORD:-MiClaveKibana123}"

# Levantar servicios
echo "🚀 Levantando servicios con docker-compose..."
docker-compose -f "$COMPOSE_FILE" up -d elasticsearch kibana apm-server

# Esperar a que Elasticsearch esté listo
echo "⏳ Esperando a que Elasticsearch esté listo para autenticación..."
until docker exec "$ES_SERVICE" curl -s -u "$ELASTIC_USER:$ELASTIC_PASSWORD" http://localhost:9200 >/dev/null; do
  echo "    esperando..."
  sleep 2
done
echo "✔ Elasticsearch listo"

# Cambiar contraseña de kibana_system
echo "🔧 Configurando contraseña de kibana_system..."
docker exec -i "$ES_SERVICE" curl -s \
  -u "$ELASTIC_USER:$ELASTIC_PASSWORD" \
  -X POST "http://localhost:9200/_security/user/kibana_system/_password" \
  -H "Content-Type: application/json" \
  -d "{\"password\":\"$KIBANA_SYSTEM_PASSWORD\"}"

echo "✔ Contraseña de kibana_system actualizada"

# Opcional: reiniciar Kibana para que tome la nueva contraseña
echo "🔄 Reiniciando Kibana para aplicar la nueva contraseña..."
docker-compose up -d

echo "✅ Todo listo. Elasticsearch, Kibana y APM Server corriendo."
echo " Asegúrate de que tu aplicación use el token correcto si estás enviando datos a APM Server"
