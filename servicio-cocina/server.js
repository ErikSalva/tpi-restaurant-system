const express = require('express');
const amqp = require('amqplib');
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

// Conectar a RabbitMQ
const connectRabbitMQ = async () => {
  try {
    const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://guest:guest@message-broker:5672';
    const connection = await amqp.connect(rabbitUrl);
    const channel = await connection.createChannel();
    
    // Crear cola para eventos de pedidos confirmados
    await channel.assertQueue('pedidos_confirmados', { durable: true });
    console.log('✅ Conectado a RabbitMQ');
    
    // Consumir mensajes de pedidos confirmados
    channel.consume('pedidos_confirmados', (msg) => {
      if (msg) {
        const pedido = JSON.parse(msg.content.toString());
        console.log('📨 Pedido confirmado recibido:', pedido);
        
        // Enviar a todos los clientes WebSocket conectados
        broadcastToClients({
          type: 'pedido_confirmado',
          data: pedido,
          timestamp: new Date().toISOString()
        });
        
        channel.ack(msg);
      }
    });
    
    return { connection, channel };
  } catch (error) {
    console.error('❌ Error conectando a RabbitMQ:', error);
    return null;
  }
};

// Función para enviar mensajes a todos los clientes conectados
const broadcastToClients = (message) => {
  const messageStr = JSON.stringify(message);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
  console.log(`📡 Mensaje enviado a ${clients.size} clientes conectados`);
};

// Rutas básicas
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

// Servidor HTTP
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🍳 Servicio Cocina corriendo en puerto ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

// Servidor WebSocket
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('🔌 Nuevo cliente WebSocket conectado');
  clients.add(ws);
  
  // Enviar mensaje de bienvenida
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Conectado al tablero de cocina',
    timestamp: new Date().toISOString()
  }));
  
  ws.on('close', () => {
    console.log('🔌 Cliente WebSocket desconectado');
    clients.delete(ws);
  });
  
  ws.on('error', (error) => {
    console.error('❌ Error en WebSocket:', error);
    clients.delete(ws);
  });
});

// Iniciar servicios
const startServices = async () => {
  await connectRabbitMQ();
  
  console.log(`📋 Servicios disponibles:`);
  console.log(`   GET  / - Información del servicio`);
  console.log(`   GET  /health - Estado de salud`);
  console.log(`   WS   / - Conexión WebSocket para tablero`);
};

startServices().catch(console.error);
