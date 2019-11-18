import {BluetoothSerialPort} from 'bluetooth-serial-port';
import logger from '@src/utils/logger';
import {promiseTimeout} from '@src/utils/promiseHelpers';

class BluetoothDevice {
  constructor(address) {
    this.address = address;
    this.connected = false;
    this.received = '';
    this.expected = '';
    this.serial = new BluetoothSerialPort();
    this.serial.on('data', this.dataCallback.bind(this));
    this.serial.on('closed', this.closed);
    this.serial.on('failure', this.closed);
  }

  close() {
    this.serial.close();
  }

  closed() {
    this.connected = false;
  }

  connect() {
    return new Promise((resolve, reject) => {
      if (this.connected) {
        resolve('Already connected');
      } else {
        let isDeviceFound = false;

        this.serial.on('found', (address, name) => {
          logger.debug(`Found - ${name} : ${address}`);
          if (address === this.address) {
            isDeviceFound = true;
          }
        });

        this.serial.inquireSync();

        if (!isDeviceFound) {
          return reject(`Failed to find device: ${this.address}`);
        }

        this.serial.findSerialPortChannel(this.address, (channel) => {
          this.serial.connect(this.address, channel, () => {
            this.connected = true;
            logger.info('Connected to: ' + this.address)
            resolve('Connected');
          }, () => {
            this.connected = false;
            reject('Connection failed for Address: ' + this.address);
          });
        }, (err) => {
          logger.debug(`Failed finding port`);
          reject('Find Port failed for Address: ' + this.address);
        });
      }
    });
  }

  reset() {
    this.received = '';
    this.expected = '';
    this.currentResolve = null;
    this.currentReject = null;
  }

  dataCallback(buffer) {
    const response = buffer.toString('utf-8');

    logger.debug('Got: ' + response);

    if (!this.currentResolve || !this.currentReject){
      logger.debug('Recieved data after resolving');
      return;
    }

    response.split('').forEach(character => {
      this.received += character;
      if (character === '{') {
        this.received = '{';
      } else if (character === '}') {
        if (this.received.startsWith(this.expected) && this.currentResolve) {
          this.currentResolve(this.received);
        } else if (this.currentReject) {
          this.currentReject('Unexpected response: ' + this.received);
        }

        this.reset();
      }
    });
  }

  sendCommand(command, response, timeout) {
    const commandRequest = new Promise((resolve, reject) => {
      this.currentResolve = resolve;
      this.currentReject = reject;
      this.expected = '{' + response;

      const wrappedCommand = '{' + command + '}';
      logger.debug('Sending: ' + wrappedCommand);

      this.serial.write(Buffer.from(wrappedCommand), (err, bytesWritten) => {
        if (err && this.currentReject) {
          this.currentReject(err);
        }
      });
    });

    return promiseTimeout(commandRequest, timeout);
  }

  async executeCommand(command, response, timeout) {
    await this.connect();

    return await this.sendCommand(command, response, timeout);
  }
}

export default BluetoothDevice;