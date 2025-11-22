const Producto = require('../models/Producto');

/**
 * Crear un nuevo producto
 */
async function crearProducto(data) {
  return await Producto.create(data);
}

/**
 * Obtener todos los productos
 */
async function obtenerProductos() {
  return await Producto.find();
}

/**
 * Obtener un producto por ID
 */
async function obtenerProducto(id) {
  return await Producto.findById(id);
}

/**
 * Actualizar un producto
 */
async function actualizarProducto(id, data) {
  return await Producto.findByIdAndUpdate(id, data, { new: true, runValidators: true });
}

/**
 * Eliminar un producto
 */
async function eliminarProducto(id) {
  return await Producto.findByIdAndDelete(id);
}

module.exports = {
  crearProducto,
  obtenerProductos,
  obtenerProducto,
  actualizarProducto,
  eliminarProducto
};

