const express = require('express');
const mongoose = require('mongoose');
const amqp = require('amqplib');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

//MongoDB
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://mongo:27017/restaurant_db';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
  }
};

//RabbitMQ
const connectRabbitMQ = async () => {
  try {
    const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://guest:guest@broker:5672';
    const connection = await amqp.connect(rabbitUrl);
    const channel = await connection.createChannel();
    console.log('✅ Conectado a RabbitMQ');
    return { connection, channel };
  } catch (error) {
    console.error('❌ Error conectando a RabbitMQ:', error);
    return null;
  }
};

// Rutas básicas
app.get('/', (req, res) => {
  res.json({
    message: '🍽️ ¡Hola! API del Sistema de Restaurante funcionando correctamente',
    status: 'OK',
    timestamp: new Date().toISOString(),
    services: {
      database: 'MongoDB',
      broker: 'RabbitMQ'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Iniciar servidor
const startServer = async () => {
  await connectDB();
  await connectRabbitMQ();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log('📋 API endpoints:');
    console.log('   GET  / - Información de la API');
    console.log('   GET  /health - Estado de salud');
  });
};

startServer().catch(console.error);