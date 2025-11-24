require('dotenv').config();
const apm = require('./apm.js');

const express = require('express');
const mongoose = require('mongoose');
const amqp = require('amqplib');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { connectRabbit } = require('./src/events/producer');



// Swagger UI
let swaggerUi, YAML;
try {
  swaggerUi = require('swagger-ui-express');
  YAML = require('yamljs');
} catch (error) {
  console.warn('⚠️  Swagger UI no disponible:', error.message);
}


// Importar rutas
const pedidosRoutes = require('./src/routes/pedidosRoutes');
const usuariosRoutes = require('./src/routes/usuariosRoutes');
const authRoutes = require('./src/routes/authRoutes');
const productosRoutes = require('./src/routes/productosRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Swagger UI
if (swaggerUi && YAML) {
  try {
    let swaggerPath = path.join(__dirname, 'openapi.yaml');
    if (!fs.existsSync(swaggerPath)) {
      swaggerPath = path.join(__dirname, '../openapi.yaml');
    }
    if (fs.existsSync(swaggerPath)) {
      const swaggerDocument = YAML.load(swaggerPath);
      if (swaggerDocument.servers && swaggerDocument.servers[0]) {
        swaggerDocument.servers[0].url = `http://localhost:${PORT}`;
      }
      app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'API Restaurante - Documentación'
      }));
      console.log('✅ Swagger UI configurado');
    } else {
      console.warn('⚠️  Archivo openapi.yaml no encontrado');
    }
  } catch (error) {
    console.warn('⚠️  No se pudo cargar Swagger UI:', error.message);
  }
} else {
  console.warn('⚠️  Swagger UI no disponible (dependencias faltantes)');
}

//MongoDB
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://mongo:27017/restaurant_db';
    await mongoose.connect(mongoUri);
    console.log('Conectado a MongoDB');
  } catch (error) {
    console.error('Error conectando a MongoDB:', error);
  }
};

//RabbitMQ
const connectRabbitMQ = async () => {
  try {
    const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://guest:guest@RabbitMQ:5672';
    const connection = await amqp.connect(rabbitUrl);
    const channel = await connection.createChannel();
    console.log('✅ Conectado a RabbitMQ');
    return { connection, channel };
  } catch (error) {
    console.error('Error conectando a RabbitMQ:', error);
    // No detener el servidor si RabbitMQ no está disponible
    return null;
  }
};

// Servir archivos estáticos (debe ir antes de las rutas)
app.use(express.static('public'));

// Rutas básicas
app.get('/api', (req, res) => {
  res.json({
    message: '¡Hola! API del Sistema de Restaurante funcionando correctamente',
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

// Rutas de la API
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/productos', productosRoutes);
// Rutas sin /api para Swagger (openapi.yaml)
app.use('/pedidos', pedidosRoutes);
app.use('/productos', productosRoutes);
app.use('/auth', authRoutes);

// Iniciar servidor
const startServer = async () => {
  await connectDB();
  await connectRabbitMQ();
  await connectRabbit();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`📚 Swagger UI: http://localhost:${PORT}/api-docs`);
    console.log('📋 API endpoints:');
    console.log('   GET  / - Información de la API');
    console.log('   GET  /health - Estado de salud');
  });
};

startServer().catch(console.error);