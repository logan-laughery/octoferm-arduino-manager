const logger = require('./logger.js');
const OctofermFermentor = require('./octoferm-fermentor.js');

const method = FermentorCycle.prototype;

function FermentorCycle(address, id) {
  this._id = id;
  this._address = address;
  this._settings = {};
  this._desiredSettings = {};
  this._status = {};
  this._actual = {};
  this._intervalOperations = {};

  this._device = new OctofermFermentor(address);
}

method.close = function() {
  this._device.close();
}

method.sendOnInterval = function(operationKey, sec) {
  const currentTime = new Date();
  const lastPerformed = this._intervalOperations[operationKey];
  
  if (!lastPerformed || ((currentTime - lastPerformed) / 1000) >= sec) {
    this._intervalOperations[operationKey] = currentTime;
    return true;
  }

  return false;
}

method.loop = async function() {
  const self = this;
  
  try {
    if(self.sendOnInterval('TEMP_POLL', 5)) {
      await this._device.getState().then(res => {
        logger.info(`Polled state: ${JSON.stringify(res)}`);
      });
    }
    if(this.sendOnInterval('SETTINGS_POLL', 30)) {
      await this.getDeviceSettings()
        .then((settings) => self._device.updateSettings(settings))
        .then(res => {
          logger.info(`Polled settings: ${JSON.stringify(res)}`);
        });
    }
    if(this.sendOnInterval('MEM_POLL', 300)) {
      await this._device.getMemory().then(res => {
        logger.info(`Polled memory: ${JSON.stringify(res)}`);
      });
    }
  } catch(err) {
    if (typeof err === 'string' || err instanceof String) {
      logger.error(err);
    } else if (err instanceof Error) {
      logger.error(err);
    } else {
      logger.error(JSON.stringify(err));
    }
  }
}

method.getDeviceSettings = () => {
  // Need to talk to db here
  const defaultSettings = {
    temperature: 65,
    pumpState: 'auto'
  };

  return new Promise(resolve => {
    this._desiredSettings = defaultSettings;
    resolve(this._desiredSettings);
  });
}

module.exports = FermentorCycle;
