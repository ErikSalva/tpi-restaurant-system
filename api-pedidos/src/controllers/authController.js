const usuariosService = require('../services/usuariosService');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body; // En OAuth2 estricto esto sería username y password

    if (!email || !password) {
      return res.status(400).json({ 
          error: 'invalid_request', 
          error_description: 'Email y contraseña son requeridos' 
      });
    }

    const resultado = await usuariosService.autenticarUsuario(email, password);
    
    // OAuth2 espera status 200 OK con el json del token
    res.json(resultado);

  } catch (error) {
    // Si falla la contraseña, OAuth2 prefiere 'invalid_grant'
    res.status(401).json({ 
        error: 'invalid_grant', 
        error_description: error.message 
    });
  }
};