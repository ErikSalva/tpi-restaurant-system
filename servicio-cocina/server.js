const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.WEBSOCKET_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Almacenar conexiones WebSocket
const clients = new Set();

// Función para enviar mensajes a todos los clientes conectados
// Se usará cuando se implemente el consumer de RabbitMQ
// eslint-disable-next-line no-unused-vars
const broadcastToClients = (message) => {
  const messageStr = JSON.stringify(message);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
  console.log(`📡 Mensaje enviado a ${clients.size} clientes conectados`);
};

app.get('/', (req, res) => {
  res.json({
    message: '🍳 ¡Hola! Servicio Cocina funcionando correctamente',
    status: 'OK',
    timestamp: new Date().toISOString(),
    services: {
      websocket: 'WebSocket Server',
      broker: 'RabbitMQ Consumer'
    },
    clients_connected: clients.size
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    websocket_clients: clients.size,
    timestamp: new Date().toISOString()
  });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🍳 Servicio Cocina corriendo en puerto ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('🔌 Nuevo cliente WebSocket conectado');
  clients.add(ws);
  
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Conectado al tablero de cocina',
    timestamp: new Date().toISOString()
  }));
  
  ws.on('close', () => {
    console.log('Cliente WebSocket desconectado');
    clients.delete(ws);
  });
  
  ws.on('error', (error) => {
    console.error('Error en WebSocket:', error);
    clients.delete(ws);
  });
});

const startServices = async () => {
  console.log('📋 Servicios disponibles:');
  console.log('   GET  / - Información del servicio');
  console.log('   GET  /health - Estado de salud');
  console.log('   WS   / - Conexión WebSocket para tablero');
  console.log('⚠️  Consumer de RabbitMQ no configurado aún');
};

startServices().catch(console.error);
