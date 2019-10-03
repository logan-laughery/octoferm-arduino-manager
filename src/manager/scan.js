import { timeoutAsync, execAsync } from '@src/utils/exec';
import logger from '@src/utils/logger';
import stripAnsi from 'strip-ansi';
import CommandRepo from '@src/repositories/command';

async function getVersion() {
  logger.info('Check Bluetoothctl Version');

  const { execPromise } = execAsync('bluetoothctl -- version');

  return await execPromise;
}

async function turnOnScan() {
  logger.info('Scan On');

  const { childProcess, execPromise } = execAsync('bluetoothctl -- scan on');

  await timeoutAsync(20000);

  childProcess.kill();

  const result = await execPromise;

  return result;
}

async function powerOn() {
  logger.info('Powering On');

  const { execPromise } = execAsync('bluetoothctl -- power on');

  return await execPromise;
}

async function listDevices() {
  logger.info('Listing Devices');

  const { execPromise } = execAsync('bluetoothctl -- devices');

  return await execPromise;
}

async function runScanCommands() {
  let stdout = '';
  let stderr = '';

  const setupCommands = [
    getVersion,
    powerOn,
    turnOnScan,
  ];

  await Promise.all(setupCommands.map(async (command) => {
    const result = await command();

    stdout += result.stdout;
    stderr += result.stderr;
  }));

  const result = await listDevices();
  const devices = {};
  
  result.stdout.split(/\r?\n/)
    .filter(line => line.length > 1)
    .forEach(line => {
      const [, address, ...name] = line.split(' ');

      devices[address] = {
        address,
        name: name.join(' '),
      };
    });

  stdout += result.stdout;
  stderr += result.stderr;

  return {
    stdout,
    stderr,
    devices,
  };
}

async function scan(command) {
  const commandRepo = new CommandRepo();
  const result = await runScanCommands();

  await commandRepo.update({
    key: command.key,
    result: result.devices,
    stdout: stripAnsi(result.stdout),
    stderr: stripAnsi(result.stderr),
    completed_date: new Date(),
  });
}

export default scan;
