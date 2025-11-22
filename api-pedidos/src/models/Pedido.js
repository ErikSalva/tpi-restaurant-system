const mongoose = require('mongoose');

const ItemEmbebidoSchema = new mongoose.Schema({
  productoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Producto',
    required: true
  },
  cantidad: {
    type: Number,
    required: true,
    min: 1
  },
  nombreProducto: {
    type: String,
    required: false
  },
  precioUnitario: {
    type: Number,
    required: false,
    min: 0
  },
  subtotal: {
    type: Number,
    required: false,
    min: 0
  }
}, { _id: false });

const PedidoSchema = new mongoose.Schema({
  usuarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  estado: {
    type: String,
    enum: ['PENDIENTE', 'CONFIRMADO', 'EN_PREPARACION', 'LISTO', 'ENTREGADO'],
    default: 'PENDIENTE'
  },
  items: {
    type: [ItemEmbebidoSchema],
    required: true
  },
  subtotal: {
    type: Number,
    required: false,
    min: 0
  },
  total: {
    type: Number,
    required: false,
    min: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Pedido', PedidoSchema);
