const logger = require('./logger.js');
const BluetoothDevice = require('./bluetooth-device.js');

class OctofermFermentor {
  constructor(address) {
    this._address = address;

    logger.info(`Connecting to: ${address}`);

    this._device = new BluetoothDevice(address);
  }

  close() {
    this._device.close();
  }

  getMemory() {
    return this.sendCommand('memstatus', 'memstatus:')
      .then(res => {
        const mem = res.substring(0, res.length - 1)
          .split(':')[1];

        return {
          memory: mem
        };
      })
  }

  getState() {
    return this.sendCommand('gs', 'gs:')
      .then(res => {
        const vals = res.substring(0, res.length - 1)
          .split(':')[1].split('|');

        return {
          temperature: vals[0],
          pumpRunning: vals[1] === '1'
        };
      });
  }

  getSettings() {
    return this.sendCommand('getsettings', 'getsettings:')
      .then(res => {
        const vals = res.substring(0, res.length - 1)
          .split(':')[1].split('|');

        return {
          temperature: vals[0],
          autoPump: vals[1] === '1',
          pumpOn: vals[2] === '1'
        };
      });
  }

  setTemp(temp) {
    const command = 'temp:' + temp;

    return this.sendCommand(command, 'temp')
      .then(res => {
        return logger.info(`Set temp to: ${temp}`);
      });
  }

  setPump(state) {
    const command = 'state:' + state;

    return this.sendCommand(command, 'state')
      .then(res => {
        return logger.info(`Set pump state to: ${state}`);
      });
  }

  updateSettings(desired) {
    const self = this;

    return this.getSettings()
      .then(actual => {
        let settingsPromise = new Promise(resolve => resolve());

        // Set temp setting
        if (desired.temperature != actual.temperature) {
          logger.warn(`Need to set temp - Actual: ${actual.temperature}` + 
            ` Desired: ${desired.temperature}`);

          settingsPromise = settingsPromise.then(() => {
            self.setTemp(desired.temperature);
          });
        }

        // Set pump to auto
        if (desired.pumpState === 'auto' && !actual.autoPump) {
          logger.warn(`Need to set pump to ` + 
            `auto. Desired: ${desired.pumpState}`);
          
          settingsPromise = settingsPromise.then(() => {
            self.setPump(0);
          });
        }

        // Set pump on
        if (desired.pumpState === 'on' && 
          (!actual.pumpOn || actual.autoPump)) {
          logger.warn(`Need to turn pump on.  Desired: ${desired.pumpState}`);
          
          settingsPromise = settingsPromise.then(() => {
            self.setPump(1);
          });
        }
       
        // Set pump off
        if (desired.pumpState === 'off' && 
          (actual.pumpOn || actual.autoPump)) {
          logger.warn(`Need to turn pump off.  Desired: ${desired.pumpState}`);

          settingsPromise = settingsPromise.then(() => {
            self.setPump(2);
          });
        }

        const response = {
          actual,
          desired: {
            temperature: desired.temperature,
            pumpState: desired.pumpState
          }
        };

        return settingsPromise.then(() => {
          return response;
        });
      });
  }

  sendCommand(command, expected) {
    const self = this;

    return this._device.executeCommand(command, expected, 1000)
      .catch(err => {
        logger.warn(`Attempting to send command '${command}' again due to error: ${err}`);
        return self._device.executeCommand(command, expected, 1000);
      })
      .catch(err => {
        logger.warn(`Attempting to send command '${command}' one last time due to error: ${err}`);
        return self._device.executeCommand(command, expected, 1000);
      });
  }
}

module.exports = OctofermFermentor;
