const amqp = require('amqplib');

let channel;

async function connectRabbit() {
  try {
    const rabbitUrl = process.env.RABBITMQ_URL || "amqp://guest:guest@RabbitMQ:5672";
    const connection = await amqp.connect(rabbitUrl);
    channel = await connection.createChannel();

    await channel.assertExchange("pedidos.exchange", "topic", { durable: true });

    console.log("RabbitMQ Producer conectado");
  } catch (error) {
    console.error("Error conectando RabbitMQ Producer:", error);
  }
}

async function publishPedidoConfirmado(pedido) {
  if (!channel) return console.error("Channel RabbitMQ no inicializado");

  const routingKey = "pedido.confirmado";

  channel.publish(
    "pedidos.exchange",
    routingKey,
    Buffer.from(JSON.stringify(pedido)),
    { persistent: true }
  );

  console.log("Evento pedido.confirmado enviado:", pedido.pedidoId);
}

module.exports = {
  connectRabbit,
  publishPedidoConfirmado
};
