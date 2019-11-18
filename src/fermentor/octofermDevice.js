import logger from '@src/utils/logger';
import BluetoothDevice from '@src/fermentor/bluetoothDevice';

class OctofermDevice {
  constructor(address) {
    this.address = address;

    this.device = new BluetoothDevice(address);
  }

  close() {
    this.device.close();
  }

  async getMemory() {
    const result = await this.sendCommand('memstatus', 'memstatus:', 3);

    const memory = result.substring(0, result.length - 1)
      .split(':')[1];

    return {
      memory
    };
  }

  async ping() {
    await this.sendCommand('ping', 'ping', 3);
  }

  async getState() {
    const result = await this.sendCommand('gs', 'gs:', 3);

    const vals = result.substring(0, result.length - 1)
      .split(':')[1].split('|');

    return {
      temperature: vals[0],
      pumpRunning: vals[1] === '1'
    };
  }

  async getSettings() {
    const result = await this.sendCommand('getsettings', 'getsettings:', 3);

    const vals = result.substring(0, result.length - 1)
      .split(':')[1].split('|');

    return {
      temperature: vals[0],
      autoPump: vals[1] === '1',
      pumpOn: vals[2] === '1',
      isHeating: vals[3] === '1'
    };
  }

  async setTemp(temp) {
    const command = 'temp:' + temp;
    const result = await this.sendCommand(command, 'temp', 3);
    
    logger.debug(`Set temp to: ${temp}`);

    return result;
  }

  async setHeating(isHeating) {
    const heatingState = isHeating ? '1' : '0';
    const command = 'h:' + heatingState;
    const result = await this.sendCommand(command, 'h', 3);
    
    logger.debug(`Set heating to: ${heatingState}`);

    return result;
  }

  async setPump(state) {
    const command = 'state:' + state;
    const result = await this.sendCommand(command, 'state', 3);
    
    logger.debug(`Set pump state to: ${state}`);

    return result;
  }

  async sendCommand(command, expected, attempts) {
    const remainingAttempts = attempts - 1;

    try {
      return await this.device.executeCommand(command, expected, 1000);
    } catch (err) {
      logger.debug(
        `Command '${command}' failed. '${remainingAttempts}' attempt(s) remaining.` + 
        ` Error: ${err}`
      );

      if (remainingAttempts > 0) {
        return await this.sendCommand(command, expected, remainingAttempts);
      }
      
      throw err;
    }
  }

  async updateSettings(desired) {
    const actual = await this.getSettings();

    // Set temp
    if (desired.temperature != actual.temperature) {
      logger.debug(`Need to set temp - Actual: ${actual.temperature}` + 
        ` Desired: ${desired.temperature}`);

      await this.setTemp(desired.temperature);
    }

    // Set heater
    if (desired.isHeating != actual.isHeating) {
      logger.debug(`Need to set heating state - Actual: ${actual.isHeating}` + 
        ` Desired: ${desired.isHeating}`);

      await this.setHeating(desired.isHeating);
    }

    // Set pump to auto
    if (desired.pumpState === 'auto' && !actual.autoPump) {
      logger.debug(`Need to set pump to ` + 
        `auto. Desired: ${desired.pumpState}`);
      
      await this.setPump(0);
    }

    // Set pump on
    if (desired.pumpState === 'on' && (!actual.pumpOn || actual.autoPump)) {
      logger.debug(`Need to turn pump on.  Desired: ${desired.pumpState}`);
      
      await this.setPump(1);
    }
       
    // Set pump off
    if (desired.pumpState === 'off' && (actual.pumpOn || actual.autoPump)) {
      logger.debug(`Need to turn pump off.  Desired: ${desired.pumpState}`);

      await this.setPump(2);
    }

    return {
      actual,
      desired: {
        temperature: desired.temperature,
        pumpState: desired.pumpState
      }
    };
  }
}

export default OctofermDevice;