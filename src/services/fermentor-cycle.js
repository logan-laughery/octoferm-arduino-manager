const logger = require('./logger.js');
const OctofermFermentor = require('./octoferm-fermentor.js');
const admin = require('firebase-admin');

const method = FermentorCycle.prototype;

function FermentorCycle(address, id) {
  this._id = id;
  this._address = address;
  this._settings = {};
  this._desiredSettings = {};
  this._status = {};
  this._state = {};
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
    if(self.sendOnInterval('TEMP_POLL', 15)) {
      await this._device.getState().then(res => {
        this._state = res;
        logger.debug(`Polled state: ${JSON.stringify(res)}`);
      });
    }
    if(this.sendOnInterval('SETTINGS_POLL', 30)) {
      await this.getDeviceSettings()
        .then((settings) => self._device.updateSettings(settings))
        .then(res => {
          logger.debug(`Polled settings: ${JSON.stringify(res)}`);
        });
    }
    if(this.sendOnInterval('MEM_POLL', 300)) {
      await this._device.getMemory().then(res => {
        logger.debug(`Polled memory: ${JSON.stringify(res)}`);
      });
    }
    if(this.sendOnInterval('RECORD_TEMP', 30)) {
      await this.recordTemperature().then(res => {
        logger.info(`State recorded`);
      });;
    }
  } catch(err) {
    if (typeof err === 'string' || err instanceof String) {
      logger.error(err);
    } else if (err instanceof Error) {
      logger.error(err);
    } else {
      logger.error(JSON.stringify(err));
    }

    await self.logError(err);

    throw new Error('Fermentation Cycle failed');
  }
}

method.logError = function(errorMessage) {
  const currentTimeStamp = Math.floor(Date.now() / 1000);

  return admin.database().ref(`/errorLogs/${this._id}/${currentTimeStamp}`)
    .set(errorMessage);
}

method.getDeviceSettings = function() {
  const self = this;

  return admin.database().ref(`/devices/${self._id}`).once('value')
    .then((device) => {
      if (!device.val() || !device.val().temperature) {
        throw new Error(`Device '${self._id}' not found in database`);
      }

      self._desiredSettings = device.val();

      return {
        temperature: self._desiredSettings.temperature,
        pumpState: self._desiredSettings.pumpState
      };
    });
}

method.recordTemperature = function() {
  const self = this;
  const currentTimeStamp = Math.floor(Date.now() / 1000);

  return admin.database().ref(`/realTimeMeasurements/${self._id}/${currentTimeStamp}`).set({
    p: self._state.pumpRunning,
    t: self._state.temperature
  });
}

module.exports = FermentorCycle;
