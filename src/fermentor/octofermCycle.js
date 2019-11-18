import logger from '@src/utils/logger';
import DeviceRepo from '@src/repositories/device';
import OctofermDevice from '@src/fermentor/octofermDevice';
import DeviceCommandsRepo from '@src/repositories/deviceCommands';
import RealTimeMeasurementsRepo from '@src/repositories/realTimeMeasurements';

class OctofermCycle {
  constructor({address, key}) {
    this.key = key;
    this.address = address;

    logger.info(`Connecting to: ${address}`);

    this.device = new OctofermDevice(address);
    this.deviceRepo = new DeviceRepo();
    this.deviceCommandRepo = new DeviceCommandsRepo();
    this.realTimeMeasurementsRepo = new RealTimeMeasurementsRepo();
    this.operations = {};
  }

  intervalHasPassed(operationKey, intervalSec) {
    const currentTime = new Date();
    const lastPerformed = this.operations[operationKey];
    
    if (!lastPerformed) {
      this.operations[operationKey] = currentTime;

      return false;
    }

    if (((currentTime - lastPerformed) / 1000) >= intervalSec) {
      this.operations[operationKey] = currentTime;

      return true;
    }
  
    return false;
  }

  getDeviceSettings(device) {  
    const { temperature, pumpState, isHeating } = device;

    return {
      temperature: temperature || 0,
      pumpState: pumpState || 'off',
      isHeating: isHeating || false
    };
  }

  async recordDeviceTemperature() {
    const currentTimeStamp = Math.floor(Date.now() / 1000);
    const measurement = {
      p: this.state.pumpRunning,
      t: this.state.temperature
    };

    await this.realTimeMeasurementsRepo.add(
      this.key,
      currentTimeStamp,
      measurement
    );
  }

  async handleCommand(command) {
    await this.deviceCommandRepo.update(this.key, {
      key: command.key,
      acknowledged_date: new Date(),
    });

    if (command.type === 'ping') {
      await this.device.ping();
    }

    await this.deviceCommandRepo.update(this.key, {
      key: command.key,
      completed_date: new Date(),
    });
  }

  async loop(device, command) {
    let executedCommand = false;

    const newCommandRecieved = command && !command.acknowledged_date;
    const newSettings = JSON.stringify(this.getDeviceSettings(device));
    const newSettingsRecieved = this.previousSettings !== newSettings;
    this.previousSettings = newSettings;

    if (newSettingsRecieved) {
      const desiredSettings = this.getDeviceSettings(device);

      await this.device.updateSettings(desiredSettings);
      logger.debug(`Updated settings: ${JSON.stringify(desiredSettings)}`);
    }

    if (newCommandRecieved) {
      logger.debug('Commmand Recieved: ' + JSON.stringify(command));
      await this.handleCommand(command);
    }

    if (this.intervalHasPassed('TEMP_POLL', 15)) {
      this.state = await this.device.getState();
      
      executedCommand = true;
      logger.debug(`Polled state: ${JSON.stringify(this.state)}`);
    }

    if (this.intervalHasPassed('SYNC_SETTINGS', 30)) {
      const desiredSettings = this.getDeviceSettings(device);

      await this.device.updateSettings(desiredSettings);
    }

    // // if (this.intervalHasPassed('MEM_POLL', 300)) {
    // //   this.memory = await this.device.getMemory();

    // //   logger.debug(`Polled memory: ${JSON.stringify(this.memory)}`);
    // // }

    if (this.intervalHasPassed('RECORD_TEMP', 30)) {
      await this.recordDeviceTemperature();
    }

    return executedCommand;
  }
  
  close() {
    this.device.close();
  }
}

export default OctofermCycle;