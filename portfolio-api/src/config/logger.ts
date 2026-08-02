import pino from 'pino';
import { config } from './index.js';

// Create logger instance
export const logger = pino({
  level: config.logging.level,
  ...(config.logging.pretty && config.isDevelopment
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
      }
    : {}),
  base: {
    env: config.nodeEnv,
    app: config.appName,
  },
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'password', 'passwordHash'],
    remove: true,
  },
});

// Child loggers for different modules
export const createLogger = (module: string): pino.Logger => {
  return logger.child({ module });
};

export default logger;
