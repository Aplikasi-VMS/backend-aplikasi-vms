import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.printf(({ timestamp, level, message, stack, ...meta }) => {
      let log = `${timestamp} [${level.toUpperCase()}]`;

      if (message instanceof Error) {
        log += ` ${message.message}`;
        if (stack) log += `\n${stack}`;
      }
      else if (typeof message === 'string') {
        log += ` ${message}`;
        if (Object.keys(meta).length > 0) {
          log += ` ${JSON.stringify(meta)}`;
        }
      }

      else {
        log += ` ${JSON.stringify(message)}`;
      }

      return log;
    })
  ),
  transports: [
    new transports.File({
      filename: 'logs/error.log',
      level: 'error',
      handleExceptions: true,
      handleRejections: true
    }),
    new transports.File({
      filename: 'logs/combined.log',
      handleExceptions: true,
      handleRejections: true
    }),
  ],
  exitOnError: false
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: format.combine(
      format.colorize(),
      format.printf(({ level, message, stack, ...meta }) => {
        let log = `[${level}]`;

        if (message instanceof Error) {
          log += ` ${message.message}`;
          if (stack) log += `\n${stack}`;
        } else {
          log += ` ${message}`;
          if (Object.keys(meta).length > 0) {
            log += ` ${JSON.stringify(meta)}`;
          }
        }

        return log;
      })
    )
  }));
}

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', {
    message: error.message,
    stack: error.stack,
    type: 'uncaughtException'
  });
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', {
    reason: reason instanceof Error ? reason.stack : reason,
    promise,
    type: 'unhandledRejection'
  });
});

export default logger;