const apm = require('elastic-apm-node').start({
  serverUrl: process.env.APM_SERVER_URL, 
  serviceName: 'api-pedidos',
  environment: process.env.NODE_ENV,
  secretToken: process.env.APM_SECRET_TOKEN,
  captureExceptions: true,
  logLevel: 'error',
  centralErrorLogger: false,
  captureErrorLogStackTraces: 'never',
  captureBody: 'all',
        
  usePathAsTransactionName: true
});
  
module.exports = apm;