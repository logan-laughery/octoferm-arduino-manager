import { timeoutAsync, execAsync } from '@src/utils/exec';
import logger from '@src/utils/logger';

async function getVersion() {
  const { execPromise } = execAsync('bluetoothctl -- version');

  const { stdout } = await execPromise;

  logger.log(stdout);
}

async function getExpectVersion() {
  const { execPromise } = execAsync('expect -version');

  const { stdout } = await execPromise;

  logger.log(stdout);
}

async function turnOnScan() {
  const { childProcess, execPromise } = execAsync('bluetoothctl -- scan on');

  await timeoutAsync(5000);
  childProcess.kill();
  const { stdout } = await execPromise;

  logger.log(stdout);
}

async function powerOn() {
  const { execPromise } = execAsync('bluetoothctl -- power on');

  const { stdout } = await execPromise;

  logger.log(stdout);
}

async function listDevices() {
  const { execPromise } = execAsync('bluetoothctl -- devices');

  const { stdout } = await execPromise;

  logger.log(stdout);
}

async function pair(mac, password, sleep) {
  const scriptPath = `${process.env.APP_ROOT}/resources/bluetooth_pair.sh`;
  const { execPromise, childProcess } = execAsync(`${scriptPath} ${mac} ${password} ${sleep}`);

  childProcess.stdout.on('data', (data) => {
    logger.log(data.toString())
  })

  await execPromise;
}

async function scan() {
  logger.log('Check Bluetoothctl Version');
  await getVersion();

  logger.log('Powering On');
  await powerOn();

  logger.log('Scan On');
  await turnOnScan();

  logger.log('Listing Devices');
  await listDevices();

  logger.log('Check Expect Version');
  await getExpectVersion();

  logger.log('Pairing');
  await pair('98:D3:31:FD:68:8F', '1234', 10);
}

export default scan;
