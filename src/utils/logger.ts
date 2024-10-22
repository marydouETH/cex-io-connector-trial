import winston from 'winston';

export class Logger {
  public static getInstance(exchange: string): winston.Logger {
    return winston.createLogger({
      level: 'debug',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.simple()
      ),
      transports: [
        new winston.transports.Console({
          level: 'debug',
          format: winston.format.printf(({ timestamp, level, message }) => {
            return `[${exchange}] ${timestamp} ${level}: ${message}`;
          }),
        }),
        new winston.transports.Console({
          level: 'error',
          format: winston.format.printf(({ timestamp, level, message }) => {
            return `[${exchange}] ${timestamp} ${level}: ${message}`;
          }),
          stderrLevels: ['error'],
        }),
      ],
    });
  }
}

export default Logger;
