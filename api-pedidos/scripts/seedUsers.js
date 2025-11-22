const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const Usuario = require('../src/models/Usuario');
const Producto = require('../src/models/Producto');
const Pedido = require('../src/models/Pedido');

async function seedUsers() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://mongo:27017/restaurant_db';

  // Intentar conectarse a Mongo con reintentos, útil en arranques con docker-compose
  const maxAttempts = 10;
  const delayMs = 2000;
  let attempts = 0;
  while (attempts < maxAttempts) {
    try {
      await mongoose.connect(mongoUri);
      console.log('✅ Conectado a Mongo para seed');
      break;
    } catch (err) {
      attempts++;
      console.log(`⏳ Esperando MongoDB... intento ${attempts}/${maxAttempts}`);
      if (attempts >= maxAttempts) throw err;
      await new Promise(r => setTimeout(r, delayMs));
    }
  }

  const usersToCreate = [
    {
      email: 'admin@restaurante.com',
      password: 'admin123',
      roles: ['ADMIN', 'USER']
    },
    {
      email: 'user@restaurante.com',
      password: 'user123',
      roles: ['USER']
    }
  ];

  for (const u of usersToCreate) {
    const existing = await Usuario.findOne({ email: u.email });
    if (existing) {
      console.log(`User already exists: ${u.email}`);
      continue;
    }

    const passwordHash = await bcrypt.hash(u.password, 10);
    const created = await Usuario.create({
      email: u.email,
      passwordHash,
      roles: u.roles
    });
    console.log(`Created user: ${created.email} with roles ${created.roles}`);
  }

  // --- Seed productos ---
  const productsToCreate = [
    { nombre: 'Hamburguesa Doble Cheddar', descripcion: 'Doble carne, doble cheddar, panceta.', precio: 1500.5, stock: 20 },
    { nombre: 'Papas Fritas', descripcion: 'Papas fritas con cheddar', precio: 700.0, stock: 50 },
    { nombre: 'Refresco Cola', descripcion: 'Lata 350ml', precio: 300.0, stock: 100 }
  ];

  for (const p of productsToCreate) {
    const existingP = await Producto.findOne({ nombre: p.nombre });
    if (existingP) {
      console.log(`Product already exists: ${p.nombre}`);
      continue;
    }
    const createdP = await Producto.create(p);
    console.log(`Created product: ${createdP.nombre} (${createdP._id})`);
  }

  // Refresh product documents
  const productos = await Producto.find({ nombre: { $in: productsToCreate.map(x => x.nombre) } });

  // --- Seed pedidos (un par) ---
  // Helper to find product by name
  const findProd = name => productos.find(p => p.nombre === name);

  const pedidosToCreate = [
    {
      usuarioEmail: 'user@restaurante.com',
      estado: 'CONFIRMADO',
      items: [
        { productoNombre: 'Hamburguesa Doble Cheddar', cantidad: 1 },
        { productoNombre: 'Refresco Cola', cantidad: 2 }
      ]
    },
    {
      usuarioEmail: 'admin@restaurante.com',
      estado: 'EN_PREPARACION',
      items: [
        { productoNombre: 'Papas Fritas', cantidad: 3 }
      ]
    }
  ];

  for (const ped of pedidosToCreate) {
    const usuario = await Usuario.findOne({ email: ped.usuarioEmail });
    if (!usuario) {
      console.log(`Skipping pedido: user not found ${ped.usuarioEmail}`);
      continue;
    }

    // Build items with product references
    const items = [];
    let subtotal = 0;
    let canCreate = true;

    for (const it of ped.items) {
      const prod = findProd(it.productoNombre);
      if (!prod) {
        console.log(`Skipping pedido item: product not found ${it.productoNombre}`);
        canCreate = false;
        break;
      }
      if (prod.stock < it.cantidad) {
        console.log(`Not enough stock for product ${prod.nombre} (have ${prod.stock}, need ${it.cantidad}). Skipping pedido.`);
        canCreate = false;
        break;
      }

      const precioUnitario = prod.precio;
      const itemSubtotal = precioUnitario * it.cantidad;
      items.push({
        productoId: prod._id,
        cantidad: it.cantidad,
        nombreProducto: prod.nombre,
        precioUnitario,
        subtotal: itemSubtotal
      });
      subtotal += itemSubtotal;
    }

    if (!canCreate) continue;

    const total = subtotal; // no taxes for now

    // Check if an identical pedido already exists to keep idempotent
    const existingPedido = await Pedido.findOne({ usuarioId: usuario._id, subtotal, total });
    if (existingPedido) {
      console.log(`Pedido already exists for user ${usuario.email} with total ${total}`);
      continue;
    }

    // Create pedido
    const createdPedido = await Pedido.create({
      usuarioId: usuario._id,
      estado: ped.estado,
      items,
      subtotal,
      total
    });

    // Deduct stock
    for (const it of items) {
      await Producto.findByIdAndUpdate(it.productoId, { $inc: { stock: -it.cantidad } });
    }

    console.log(`Created pedido ${createdPedido._id} for user ${usuario.email} total ${total}`);
  }

  await mongoose.disconnect();
}

module.exports = seedUsers;
