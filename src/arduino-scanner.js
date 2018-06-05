// Example:
// node arduino-scanner.js

const logger = require('./services/logger');
const BluetoothScanner = require('./services/bluetooth-scanner');

const stdin = process.stdin;

logger.info(`Starting scan`);

const btScanner = new BluetoothScanner(0);
const devices = btScanner.scanSync();

logger.info(`Devices Found: ${JSON.stringify(devices)}`);
