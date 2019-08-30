const winston = require('winston');
const { highlight } = require('cli-highlight');
const stripAnsi = require('strip-ansi');

const transports = require('./transports');

const SUPPORTED_TRANSPORT = {
  CONSOLE: 'console',
  FILE_ROTATOR: 'file_rotator',
}

const SUPPORTED_TRANSPORTS = Object.values(SUPPORTED_TRANSPORT);

const defaultSettings = {
  transports: [
    {
      type: SUPPORTED_TRANSPORT.CONSOLE,
      level: 'silly',
      colorize: true,
    },
    {
      type: SUPPORTED_TRANSPORT.FILE_ROTATOR,
      level: 'silly',
      colorize: true,
      config: {
        filename: 'log-%DATE%.log',
        dirname: './logs',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
      }
    }
  ],
}

const formatMessageForTransport = (transport) => {
  return printf(({
    level, message, label, timestamp,
  }) => `${timestamp} [${label}] <${level}> ${transport.colorize ? message : stripAnsi(message)}`)
}

const initTransport = (transport, labelsLog) => {
  if (!SUPPORTED_TRANSPORTS.includes(transport.type)) {
    throw new Error('Unsupported transport type');
  }
  let format;

  if (transport.colorize) {
    format = winston.combine(
      label({ label: labelsLog }),
      timestamp(),
      json(),
      formatMessageForTransport(transport),
    );
  } else {
    format = winston.combine(
      label({ label: labelsLog }),
      colorize(),
      timestamp(),
      json(),
      formatMessageForTransport(transport),
    );
  }
  switch (transport.type) {
    case SUPPORTED_TRANSPORTS.CONSOLE:
      return transports.consoleTransport(transport, format);
    case SUPPORTED_TRANSPORTS.FILE_ROTATOR:
      return transports.consoleTransport(transport, format);
  }
}

const loggerConstructor = (labels, settings = defaultSettings) => {
  const labelsLog = Array.isArray(labels) ? labels : [labels];

  const transports = settings.transports.map(tr => initTransport(tr));
  const logger = createLogger({transports});

  // Here I try to fix that winston itself can't log errors properly
  logger.error = (err) => {
    if (err instanceof Error) {
      logger.log('error', err.stack || err.message);
    } else {
      logger.log('error', err);
    }
  }

  // This is an extra method to log both description and error
  logger.exception = (description, err) => {
    logger.error(description);
    logger.error(err);
  };

  logger.syntax = (
    level,
    settings,
    message,
    extra,
  ) => {
    let highlightSettings = {};
    if (typeof settings === 'string') {
      highlightSettings = {
        ...highlightSettings,
        language: settings
      };
    }
    else if (typeof settings === 'object') {
      highlightSettings = {
        ...highlightSettings,
        ...settings
      };
    } else {
      throw new Error('Unsupported highlighter settings provided!');
    }
    const highlightedMessage = highlight(message, highlightSettings)
    logger.log(level, `${extra.prefix || ''} ${highlightedMessage} ${extra.postfix || ''}`.trim())
  };

  logger.errorSyntax = (syntax, message, extra) => {
    logger.syntax('error', syntax, message, extra);
  };

  logger.warnSyntax = (syntax, message, extra) => {
    logger.syntax('warn', syntax, message, extra);
  };

  logger.infoSyntax = (syntax, message, extra) => {
    logger.syntax('info', syntax, message, extra);
  };

  logger.verboseSyntax = (syntax, message, extra) => {
    logger.syntax('verbose', syntax, message, extra);
  };

  logger.debugSyntax = (syntax, message, extra) => {
    logger.syntax('debug', syntax, message, extra);
  };

  logger.sillySyntax = (syntax, message, extra) => {
    logger.syntax('silly', syntax, message, extra);
  };

  logger.addLabel = (lab) => loggerConstructor([...labelsLog, lab], settings);

  return logger;
};


export default loggerConstructor;
export {
  SUPPORTED_TRANSPORT,
  SUPPORTED_TRANSPORTS,
};
