const productosService = require('../services/productosService');

exports.crearProducto = async (req, res) => {
  try {
    const producto = await productosService.crearProducto(req.body);
    res.status(201).json(producto);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.obtenerProductos = async (req, res) => {
  try {
    const productos = await productosService.obtenerProductos();
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.obtenerProducto = async (req, res) => {
  try {
    const producto = await productosService.obtenerProducto(req.params.id);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(producto);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.actualizarProducto = async (req, res) => {
  try {
    const producto = await productosService.actualizarProducto(req.params.id, req.body);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(producto);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.eliminarProducto = async (req, res) => {
  try {
    const producto = await productosService.eliminarProducto(req.params.id);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ message: 'Producto eliminado' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

