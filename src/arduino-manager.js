// Example:
// node octoferm-manager.js 2 12:12:12:12:12
// --or--
// node octoferm-manager.js 2 < /dev/null > ferm1.log 2>&1 &

const FermentorCycle = require('./services/fermentor-cycle');
const logger = require('./logger.js');
const config = require('config');

const stdin = process.stdin;
const deviceId = process.argv[2];
const address = process.argv[3];

function delayPromise(delay) {
  return new Promise((res, rej) => setTimeout(res, delay));
}

function loop(fermCycle) {
  return delayPromise(500)
    .then(() => fermCycle.loop())
    .catch((err) => console.error("Error: " + err))
    .then(() => loop(fermCycle));
}

function main(devId) {
  if (!devId) {
    console.error('Must provide device id');
    return;
  }

  logger.info(`Device id: ${devId}`);

  var config = config.get('firebaseConfig');
  
  firebase.initializeApp(config);

  firebase.database().ref(`/users/${devId}`).once('value')
    .then((device) => {
      if (!device.val() || !device.val().address) {
        logger.error(`Device not found in database`);
        return;
      }

      logger.info(`Device Address: ${device.val().address}`);

      const fermCycle = new FermentorCycle(device.val().address, devId);

      loop(fermCycle);
    });
}

main(deviceId)
