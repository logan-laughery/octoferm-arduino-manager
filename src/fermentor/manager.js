import logger from '@src/utils/logger';
import { timeoutAsync } from '@src/utils/exec';
import {setupConnection, close} from '@src/repositories/firebase';
import DeviceRepo from '@src/repositories/device';
import DeviceCommandRepo from '@src/repositories/deviceCommands';
import OctofermCycle from '@src/fermentor/octofermCycle';
import admin from 'firebase-admin';
import wtfnode from 'wtfnode';
import log from 'why-is-node-running';

const deviceId = process.argv[2];
const deviceAddress = process.argv[3];
let device = {};
let command = undefined;
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

function handleNewCommand(data) {
  command = {
    key: data.key,
    ...data.val(),
  };
}

async function handleLoop(octofermCycle) {
  try {
    await timeoutAsync(500);
    const executedCommand = await octofermCycle.loop(device, command);
    command = undefined;
    
    if (executedCommand) {
      errorCount = 0;
    }

    return await handleLoop(octofermCycle);
  } catch (err) {
    errorCount++;

    if (errorCount > 3) {
      throw err;
    }

    logger.error(`Cycle has failed ${errorCount} time(s) consecutively.`);
    return await handleLoop(octofermCycle);
  }
}

async function main() {
  await setupConnection();

  const deviceRepo = new DeviceRepo();
  const deviceCommandRepo = new DeviceCommandRepo();
  const data = await deviceRepo.getDeviceOnce(deviceId);
  device = {
    key: data.key,
    ...data.val(),
  };

  deviceCommandRepo.addChildAddedHandler(deviceId, handleNewCommand);
  deviceRepo.addDeviceUpdatedHandler(deviceId, handleDeviceUpdate);

  const octofermCycle = new OctofermCycle(device);

  try {
    await handleLoop(octofermCycle);
  } catch (err) {
    logger.error(err);
    logger.error('Too many consecutive errors. Exiting.');
    const newErrorCount = device.errorCount ? device.errorCount + 1 : 1;
    
    await deviceRepo.setErrorCount(deviceId, newErrorCount);

    octofermCycle.close();
    close();
    process.kill(process.pid);
  }
}

logger.info('Started Manager Process');

main(deviceId, deviceAddress);
