// Example:
// node octoferm-manager.js 2 12:12:12:12:12
// --or--
// node octoferm-manager.js 2 < /dev/null > ferm1.log 2>&1 &

const FermentorCycle = require('./services/fermentor-cycle');

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

  console.log('DeviceId: ' + devId);

  const fermCycle = new FermentorCycle(address, devId);

  loop(fermCycle);
}

main(deviceId)
