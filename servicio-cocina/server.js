require('dotenv').config();
const apm = require('./apm.js');

const express = require('express');
const WebSocket = require('ws');
const amqp = require('amqplib');
const cors = require('cors');

const app = express();
const PORT = process.env.WEBSOCKET_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Almacenar conexiones WebSocket
const clients = new Set();

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

// Conectar a RabbitMQ y consumir mensajes
const connectRabbitMQ = async () => {
  try {
    const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://guest:guest@RabbitMQ:5672';
    const connection = await amqp.connect(rabbitUrl);
    const channel = await connection.createChannel();

    // Declarar exchange (debe coincidir con el producer)
    await channel.assertExchange('pedidos.exchange', 'topic', { durable: true });

    // Crear cola exclusiva para este servicio
    const queue = await channel.assertQueue('cocina.pedidos', { durable: true });

    // Bind a los eventos que nos interesan
    await channel.bindQueue(queue.queue, 'pedidos.exchange', 'pedido.confirmado');
    await channel.bindQueue(queue.queue, 'pedidos.exchange', 'pedido.estado_cambiado');
    await channel.bindQueue(queue.queue, 'pedidos.exchange', 'pedido.*');

    console.log('✅ Conectado a RabbitMQ');
    console.log(`📥 Esperando mensajes en cola: ${queue.queue}`);

    // Consumir mensajes
    channel.consume(queue.queue, (msg) => {
      if (msg) {
        //Captura la traza
        const traceparentHeader = msg.properties.headers?.traceparent;

        // Iniciar transacción (usando el traceparent si existe)
        const transaction = apm.startTransaction(
            msg.fields.routingKey, // Nombre de la transacción (ej: pedido.confirmado)
            'messaging',           // Tipo de transacción
            { childOf: traceparentHeader } // Reanudar la traza si traceparent está presente
        );

        try {
          const content = JSON.parse(msg.content.toString());
          const routingKey = msg.fields.routingKey;

          // Etiquetar la traza con el ID del pedido (asumiendo que viene en content)
          if (transaction && content.pedidoId) {
              apm.setLabel('pedido_id', content.pedidoId, transaction);
              apm.setLabel('pedido_estado', content.estadoNuevo, transaction); 
          }

          console.log(`📨 Mensaje recibido [${routingKey}]:`, content);

          // Enviar a todos los clientes WebSocket
          broadcastToClients({
            type: routingKey,
            data: content,
            timestamp: new Date().toISOString()
          });

          // Confirmar mensaje procesado
          channel.ack(msg);
        } catch (error) {
          console.error('❌ Error procesando mensaje:', error);

          // Capturar Error y Finalizar Traza si hay excepción
          if (apm) apm.captureError(error, { custom: { routingKey: msg.fields.routingKey } });
          channel.nack(msg, false, false);
          
          // Rechazar mensaje y no re-encolar
          channel.nack(msg, false, false);
        } finally {
            // Finalizar la transaccion APM
            if (transaction) transaction.end();
        }
      }
    });

    return { connection, channel };
  } catch (error) {
    console.error('❌ Error conectando a RabbitMQ:', error);
    // Reintentar conexión después de 5 segundos
    setTimeout(connectRabbitMQ, 5000);
    return null;
  }
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
  // Conectar a RabbitMQ
  await connectRabbitMQ();

  console.log('📋 Servicios disponibles:');
  console.log('   GET  / - Información del servicio');
  console.log('   GET  /health - Estado de salud');
  console.log('   WS   / - Conexión WebSocket para tablero');
  console.log('✅ Consumer de RabbitMQ activo');
};

startServices().catch(console.error);
