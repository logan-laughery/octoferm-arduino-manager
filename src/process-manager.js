// Example:
// node process-manager.js
// --or--
// node process-manager.js

const logger = require('./services/logger.js');
const admin = require('firebase-admin');
const serviceAccount = require('../config/keys/sa.json');
const config = require('config');
const exec = require('child_process').exec;

const ACTIVE_PROCESSES = {};
const KNOWN_DEVICES = {};

function deviceLog(deviceId, log) {
    console.log(`DEVICE ${deviceId} - ${log.toString().slice(0, -1)}`);
}

function startArduinoManager(deviceId, processFailures) {
    if (ACTIVE_PROCESSES[deviceId]) {
        logger.error(`PROCCESS MANAGER - Manager Process for device '${deviceId}' has already been started`);
        return;
    }

    if (processFailures > 2) {
        logger.error(`PROCCESS MANAGER - Manager Process for device '${deviceId}' has failed too many` +
            `times and won't be started`);
        return;
    }

    logger.info(`PROCCESS MANAGER - Starting Manager Process for device '${deviceId}'`);

    const arduinoManagerCommand = `node ${__dirname}/arduino-manager.js ${deviceId}`;

    const managerProcess = exec(arduinoManagerCommand);
    managerProcess.stdout.on('data', (data) => deviceLog(deviceId, data));
    managerProcess.stderr.on('data', (data) => deviceLog(deviceId, data));
    managerProcess.on('close', () => {
        ACTIVE_PROCESSES[deviceId] = undefined;
        logger.warn(`PROCCESS MANAGER - Manager Process for '${deviceId}' terminated.`);
    });

    ACTIVE_PROCESSES[deviceId] = managerProcess;
}

function startMissingProcesses() {
    Object.keys(KNOWN_DEVICES).map((deviceId) => {
        const device = KNOWN_DEVICES[deviceId];

        if (device.errorCount > 2 || ACTIVE_PROCESSES[deviceId]) {
            return;
        }

        startArduinoManager(deviceId, device.errorCount);
    });
}

function delayPromise(delay) {
    return new Promise((res, rej) => setTimeout(res, delay));
}

function checkForDownProcesses() {
    startMissingProcesses();

    return delayPromise(60000)
      .then(() => {
        return checkForDownProcesses();
      });
}

async function main() {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: config.get('firebaseConfig.databaseURL')
    });

    const deviceRef = admin.database().ref('/devices');
    
    deviceRef.on('child_added', function(data) {
        KNOWN_DEVICES[data.key] = {
            errorCount: data.val().errorCount
        };

        logger.info(`PROCCESS MANAGER - Device '${data.key}' added in database`);
        
        if (data.val().errorCount > 2) {
            logger.error(`PROCCESS MANAGER - Manager Process for device '${data.key}' has failed too many` +
                `times and won't be started`);
        }

        startMissingProcesses();
    });

    deviceRef.on('child_changed', function(data) {
        KNOWN_DEVICES[data.key] = {
            errorCount: data.val().errorCount
        };

        logger.info(`PROCCESS MANAGER - Device '${data.key}' updated in database`);

        if (data.val().errorCount > 2) {
            logger.error(`PROCCESS MANAGER - Manager Process for device '${data.key}' has failed too many` +
                `times and won't be started`);
        }

        startMissingProcesses();
    });

    deviceRef.on('child_removed', function(data) {
        KNOWN_DEVICES[data.key] = undefined;

        if (ACTIVE_PROCESSES[deviceId]) {
            ACTIVE_PROCESSES[deviceId].kill();
            ACTIVE_PROCESSES[deviceId] = undefined;
        }

        logger.info(`PROCCESS MANAGER - Device '${data.key}' removed in database`);
    });

    // deviceRef.once('value').then(function(snapshot) {
    //     snapshot.forEach(function(childSnapShot) {
    //         KNOWN_DEVICES[childSnapShot.key] = {
    //             errorCount: childSnapShot.val().errorCount
    //         };
    //     });

    //     logger.info(`PROCCESS MANAGER - All devices read from database`);
    //     startMissingProcesses();
    // }); 

    // Set up db listener for device updates
    //startArduinoManager(1, 1);
    // KNOWN_DEVICES[1] = {
    //     processErrorCount: 0
    // };

    await checkForDownProcesses();
}

main();
