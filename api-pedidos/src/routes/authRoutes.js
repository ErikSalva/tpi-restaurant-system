const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validate = require('../middleware/validateMiddleware');
const { loginSchema } = require('../validators/authValidator');

router.post('/token', validate(loginSchema, 'body'), authController.login);

module.exports = router;

