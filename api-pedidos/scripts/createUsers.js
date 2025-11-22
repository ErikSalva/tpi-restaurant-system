const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const Usuario = require('../src/models/Usuario');

const usuarios = [
  {
    email: 'admin@restaurante.com',
    password: 'admin123',
    roles: ['ADMIN', 'USER']
  },
  {
    email: 'usuario@restaurante.com',
    password: 'usuario123',
    roles: ['USER']
  }
];

async function crearUsuarios() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://mongo:27017/restaurant_db';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');

    for (const userData of usuarios) {
      // Verificar si el usuario ya existe
      const existe = await Usuario.findOne({ email: userData.email });
      if (existe) {
        console.log(`⚠️  Usuario ${userData.email} ya existe, omitiendo...`);
        continue;
      }

      // Hashear contraseña
      const passwordHash = await bcrypt.hash(userData.password, 10);

      // Crear usuario
      const usuario = await Usuario.create({
        email: userData.email,
        passwordHash: passwordHash,
        roles: userData.roles
      });

      console.log(`✅ Usuario creado: ${usuario.email} (Roles: ${usuario.roles.join(', ')})`);
    }

    console.log('\n📋 Usuarios disponibles:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 ADMIN:');
    console.log('   Email: admin@restaurante.com');
    console.log('   Password: admin123');
    console.log('   Roles: ADMIN, USER');
    console.log('\n👤 USER:');
    console.log('   Email: usuario@restaurante.com');
    console.log('   Password: usuario123');
    console.log('   Roles: USER');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

crearUsuarios();

