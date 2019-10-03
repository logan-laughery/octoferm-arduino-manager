import winston, { format } from 'winston';
const { combine, timestamp, label, printf } = format;

const simpleFormat = printf(({ level, message, label, timestamp }) => {
  return `[${label}] ${level}: ${message}`;
});

const logger = winston.createLogger({
  level: 'debug',
  format: combine(
    label({ label: '' }),
    timestamp(),
    simpleFormat
  ),
  transports: [
    new winston.transports.Console(),
  ],
});

function init(namespace) {
  logger.format = combine(
    label({ label: namespace }),
    timestamp(),
    simpleFormat
  );
}

function error(...args) {
  logger.error(...args);
}

function warn(...args) {
  logger.warn(...args);
}

function info(...args) {
  logger.info(...args);
}

function debug(...args) {
  logger.debug(...args);
}

export default {
  error,
  warn,
  info,
  debug,
  init,
};
