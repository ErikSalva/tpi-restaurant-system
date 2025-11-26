const amqp = require('amqplib');
const apm = require('elastic-apm-node');

let channel;

async function connectRabbit() {
  try {
    const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://guest:guest@RabbitMQ:5672';
    const connection = await amqp.connect(rabbitUrl);
    channel = await connection.createChannel();

    await channel.assertExchange('pedidos.exchange', 'topic', { durable: true });

    console.log('RabbitMQ Producer conectado');
  } catch (error) {
    console.error('Error conectando RabbitMQ Producer:', error);
  }
}

async function publishPedidoConfirmado(pedido) {
  if (!channel) return console.error('Channel RabbitMQ no inicializado');

  const routingKey = 'pedido.confirmado';
  const headers = {};

  const traceparent = typeof apm.currentTraceparent === 'function'
    ? apm.currentTraceparent()
    : apm.currentTransaction?.traceparent;
  
  if (traceparent) {
    headers.traceparent = traceparent;
  }
  channel.publish(
    'pedidos.exchange',
    routingKey,
    Buffer.from(JSON.stringify(pedido)),
    { 
      persistent: true,
      headers: headers
    }
  );

  console.log('Evento pedido.confirmado enviado:', pedido.pedidoId);
}

async function publishEstadoCambiado(pedidoId, estadoAnterior, estadoNuevo) {
  if (!channel) return console.error('Channel RabbitMQ no inicializado');

  const routingKey = 'pedido.estado_cambiado';
  const headers = {};
  
  const mensaje = {
    pedidoId,
    estadoAnterior,
    estadoNuevo,
    timestamp: new Date().toISOString()
  };

  const traceparent = typeof apm.currentTraceparent === 'function'
    ? apm.currentTraceparent()
    : apm.currentTransaction?.traceparent;
  
  if (traceparent) {
    headers.traceparent = traceparent;
  }

  channel.publish(
    'pedidos.exchange',
    routingKey,
    Buffer.from(JSON.stringify(mensaje)),
    { 
      persistent: true,
      headers: headers
    }
  );
  

  console.log(`Evento pedido.estado_cambiado enviado: ${pedidoId} (${estadoAnterior} → ${estadoNuevo})`);
}

module.exports = {
  connectRabbit,
  publishPedidoConfirmado,
  publishEstadoCambiado
};