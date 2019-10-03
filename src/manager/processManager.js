import logger from '@src/utils/logger';
import {fork} from 'child_process';
import DeviceRepo from '@src/repositories/device';

const activeDevices = {};
const activeProcesses = {};

function addDevice(data) {
  const device = {
    ...data.val(),
    key: data.key,
  };

  activeDevices[device.key] = device;
  checkProcesses();
}
 
function resetDeviceErrorCount(data) {
  const device = {
    ...data.val(),
    key: data.key,
  };

  if (!activeDevices[device.key]) {
    return;
  }

  activeDevices[device.key].errorCount = device.errorCount;
  checkProcesses();
}

function removeProcess(key) {
  delete activeProcesses[key];
  logger.info(`Exiting FerementorManager-${key}`);

  activeDevices[key].errorCount++;

  checkProcesses();
}

function checkProcesses() {
  Object.values(activeDevices)
    .filter(({errorCount}) => errorCount < 6)
    .filter(({key}) => !activeProcesses[key])
    .forEach(({key, address}) => startProcess(key, address));
}

function startProcess(key, address) {
  activeProcesses[key] = {};
  logger.info(`Starting FermentorManager-${key}`);

  const scriptPath = `${process.env.APP_ROOT}/fermentor/manager.js`;
  const childProcess = fork(scriptPath, [key, address]);

  childProcess.on('exit', () => removeProcess(key));
}

export default function manageFerementorProcesses() {
  const deviceRepo = new DeviceRepo();

  deviceRepo.addChildAddedHandler(addDevice);
  deviceRepo.addChildChangedHandler(resetDeviceErrorCount);
}