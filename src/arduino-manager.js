// Example:
// node octoferm-manager.js 2 12:12:12:12:12
// --or--
// node octoferm-manager.js 2 < /dev/null > ferm1.log 2>&1 &

const FermentorCycle = require('./services/fermentor-cycle');
const logger = require('./services/logger.js');
const admin = require('firebase-admin');
const serviceAccount = require('../config/keys/sa.json');
const config = require('config');

const stdin = process.stdin;
const deviceId = process.argv[2];
const address = process.argv[3];
let errorCount = 0;

function delayPromise(delay) {
  return new Promise((res, rej) => setTimeout(res, delay));
}

function loop(fermCycle) {
  return delayPromise(500)
    .then(() => fermCycle.loop())
    .then(() => {
      errorCount = 0;
    })
    .catch((err) => {
      errorCount++;
      logger.error(`${err} : Cycle has now failed ${errorCount} time(s) in a row.`);

      if(errorCount > 3) {
        throw new Error(`Fermentation exceeded maximum allowed sequential failures`);
      }

      return loop(fermCycle);
    })
    .then(() => {
      return loop(fermCycle);
    })
}

function updateErrorCount() {
  return admin.database().ref(`/devices/${deviceId}`).once('value')
    .then((device) => {
      const errorCount = device.val().errorCount || 0;
   
      return admin.database().ref(`/devices/${deviceId}/errorCount`)
        .set(errorCount + 1);
    });
}

async function main(devId) {
  if (!devId) {
    logger.error('Must provide device id');
    process.exit(1);
  }

  logger.info(`Device id: ${devId}`);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: config.get('firebaseConfig.databaseURL')
  });

  await admin.database().ref(`/devices/${devId}`).once('value')
    .then((device) => {
      if (!device.val() || !device.val().address) {
        logger.error(`Device not found in database`);
        return;
      }

      logger.info(`Device Address: ${device.val().address}`);

      const fermCycle = new FermentorCycle(device.val().address, devId);

      return loop(fermCycle);
    })
    .catch((err) => {
      logger.error('Job terminated. ' + err);
      return updateErrorCount();
    });

  process.exit(2);
}

main(deviceId)
