import logger from '@src/utils/logger';
import DeviceRepo from '@src/repositories/device';
import OctofermDevice from '@src/fermentor/octofermDevice';

class OctofermCycle {
  constructor({address, key}) {
    this.key = key;
    this.address = address;

    logger.info(`Connecting to: ${address}`);

    this.device = new OctofermDevice(address);
    this.deviceRepo = new DeviceRepo();
    this.operations = {};
  }

  intervalHasPassed(operationKey, intervalSec) {
    const currentTime = new Date();
    const lastPerformed = this.operations[operationKey];
    
    if (!lastPerformed || ((currentTime - lastPerformed) / 1000) >= intervalSec) {
      this.operations[operationKey] = currentTime;

      return true;
    }
  
    return false;
  }

  async loop() {
    let executedCommand = false;

    if (this.intervalHasPassed('TEMP_POLL', 15)) {
      await this.device.getState();
      
      executedCommand = true;
      this.state = res;
      logger.debug(`Polled state: ${JSON.stringify(res)}`);
    }

    if (this.intervalHasPassed('SYNC_SETTINGS', 30)) {
    }

    if (this.intervalHasPassed('MEM_POLL', 300)) {
    }

    if (this.intervalHasPassed('RECORD_TEMP', 30)) {
    }

    return executedCommand;
  }
  
  close() {
    this.device.close();
  }
}

export default OctofermCycle;