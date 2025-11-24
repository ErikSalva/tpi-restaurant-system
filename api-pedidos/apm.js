const apm = require('elastic-apm-node').start({
    // CLAVE: Usamos el nombre del servicio de Docker Compose
    serverUrl: process.env.APM_SERVER_URL, 
    serviceName: 'api-pedidos',
    environment: process.env.NODE_ENV,
    secretToken: 'TuTokenSecretoParaAPM', // Opcional si usas seguridad en APM Server
    captureExceptions: true,
    logLevel: 'error',
    centralErrorLogger: false,  // No interceptar errores para logging central
    captureErrorLogStackTraces: 'never',  // No capturar stack traces de logs
    captureBody: 'all',
        
    usePathAsTransactionName: true
});
  
module.exports = apm;