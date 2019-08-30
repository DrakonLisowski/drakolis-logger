const winston = require('winston');

module.exports = (transport, format) => new winston.transports.Console({
  level: transport.level || 'info',
  format,
});
