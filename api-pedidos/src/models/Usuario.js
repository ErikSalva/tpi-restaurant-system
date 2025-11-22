const mongoose = require('mongoose');

const UsuarioSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Por favor ingresa un email válido']
  },
  passwordHash: {
    type: String,
    required: true
  },
  roles: {
    type: [String],
    default: ['USER'],
    enum: ['ADMIN', 'USER']
  }
}, { timestamps: true });

module.exports = mongoose.model('Usuario', UsuarioSchema);

