const WinstonDailyRotateFile = require('winston-daily-rotate-file');

module.exports = (transport, format) => new WinstonDailyRotateFile({
  level: transport.level || 'info',
  format,
  ...transport.config,
});
