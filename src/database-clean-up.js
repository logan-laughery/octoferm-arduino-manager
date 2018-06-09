// Example:
// node process-manager.js
// --or--
// node process-manager.js

const logger = require('./services/logger.js');
const admin = require('firebase-admin');
const serviceAccount = require('../config/keys/sa.json');
const config = require('config');


const SIX_HOURS = (6 * 60 * 60);

function findMeasurementAverages(deviceId) {
    const currentTimeStamp = (Math.floor(Date.now() / 1000)) - SIX_HOURS;
    
    const olderMeasurementsRef = admin.database().ref(`/realTimeMeasurements/${deviceId}`)
        .endAt(currentTimeStamp);

    return olderMeasurementsRef.once('value').then(function(snapshot) {
        const olderMeasurements = [];

        snapshot.forEach(function(childSnapShot) {
            olderMeasurements.push({
                timeStamp: childSnapShot.key,
                temp: childSnapShot.val().t
            });
        });

        const groupedMeasurements = olderMeasurements.reduce((acc, cur) => {
            const lowerSixHourMark = cur.timeStamp - (cur.timeStamp % SIX_HOURS);
            const upperSixHourMark = lowerSixHourMark + SIX_HOURS;
            const upperSixHourTemps = acc[upperSixHourMark] || [];
            
            if (upperSixHourMark > currentTimeStamp) {
                return acc;
            }

            acc[upperSixHourMark] = [...upperSixHourTemps, cur];

            return acc;
        }, {});

        const averagedGroups = Object.keys(groupedMeasurements).map((sixHourMark) => {
            const summedTemp = groupedMeasurements[sixHourMark].reduce((acc, cur) => {
                return Number(cur.temp) + acc;
            }, 0);
            const averageTemp = summedTemp / groupedMeasurements[sixHourMark].length;


            return {
                time: sixHourMark,
                average: averageTemp,
                temps: groupedMeasurements[sixHourMark]
            };
        });

        return Promise.all(averagedGroups.map((average) => {
            const updates = {};
            average.temps.map((temp) => {
                updates[`/realTimeMeasurements/${deviceId}/${temp.timeStamp}`] = null;
            });
            updates[`/averagedMeasurements/${deviceId}/${average.time}`] = average.average;
            console.log(`Found average: '/averagedMeasurements/${deviceId}/${average.time}' = ${average.average}`);
            return admin.database().ref().update(updates);
        }));
    });
}

function clearErrorLogs(deviceId) {
    admin.database().ref(`errorLogs/${deviceId}`).limitToLast(10);
}

async function main() {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: config.get('firebaseConfig.databaseURL')
    });

    const deviceRef = admin.database().ref('/devices');

    await deviceRef.once('value').then(function(snapshot) {
        const deviceIds = [];

        snapshot.forEach(function(childSnapShot) {
            deviceIds.push(childSnapShot.key);
        });

        logger.info(`DATABASE CLEAN UP - All devices read from database`);
        return Promise.all(deviceIds.map(findMeasurementAverages));
    });

    process.exit(0);
}

main();
