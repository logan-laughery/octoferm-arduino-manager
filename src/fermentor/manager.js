import logger from '@src/utils/logger';
import { timeoutAsync } from '@src/utils/exec';
import {setupConnection} from '@src/repositories/firebase';
import DeviceRepo from '@src/repositories/device';
import OctofermCycle from '@src/fermentor/octofermCycle';

const deviceId = process.argv[2];
const deviceAddress = process.argv[3];
let device = {};
let errorCount = 0;

logger.init(`FementorManager-${deviceId || '?'}`);

if (!deviceId) {
  logger.error('Must provide device id as first argument. Exiting.');
  process.exit(1);
}

if (!deviceAddress) {
  logger.error('Must provide device address as second argument. Exiting.');
  process.exit(2);
}

function handleDeviceUpdate(data) {
  device = {
    key: data.key,
    ...data.val(),
  };
  logger.debug(`Device updated: ${JSON.stringify(device)}`);
}

async function handleLoop(octofermCycle) {
  try {
    await timeoutAsync(500);
    const executedCommand = await octofermCycle.loop(device);
    
    if (executedCommand) {
      logger.debug('Resetting error count');
      errorCount = 0;
    }

    return handleLoop(octofermCycle);
  } catch (err) {
    errorCount++;

    if (errorCount > 5) {
      throw err;
    }

    logger.error(`Cycle has failed ${errorCount} time(s) consecutively.`);
    return handleLoop(octofermCycle);
  }
}

async function main() {
  await setupConnection();

  const deviceRepo = new DeviceRepo();
  const data = await deviceRepo.getDeviceOnce(deviceId);

  handleDeviceUpdate(data);
  deviceRepo.addDeviceUpdatedHandler(deviceId, handleDeviceUpdate);

  const octofermCycle = new OctofermCycle(device);

  try {
    await handleLoop(octofermCycle);
  } catch (err) {
    logger.error('Too many consecutive errors. Exiting.');
    // Update error count
    process.exit();
  }
}

logger.info('Started Manager Process');

main(deviceId, deviceAddress);

logger.info('Ended Manager Process');
