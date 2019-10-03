import { execAsync } from '@src/utils/exec';
import stripAnsi from 'strip-ansi';
import CommandRepo from '@src/repositories/command';

// const command = {
//   type: 'pair | scan',
//   args: { mac: '', pass: '' }
//   request_date: 'date',
//   acknowledged_date: 'date',
//   completed_date: 'date',
//   result: 'object',
//   stdout: 'stdout',
//   stderr: 'stderr',
// }

async function runPairScript(mac, password, sleep) {
  const scriptPath = `${process.env.APP_ROOT}/resources/bluetooth_pair.sh`;
  const { execPromise } = execAsync(`${scriptPath} ${mac} ${password} ${sleep}`);

  const output = await execPromise;
  
  return {
    result: {
      success: output.stdout.includes("Pairing successful"),
    },
    stdout: output.stdout,
    stderr: output.stderr,
  }
}

async function pair(command) {
  const sleep = 10;
  const { mac, password } = command.args;
  const commandRepo = new CommandRepo();
  const result = await runPairScript(mac, password, sleep);

  await commandRepo.update({
    key: command.key,
    result: result.result,
    stdout: stripAnsi(result.stdout),
    stderr: stripAnsi(result.stderr),
    completed_date: new Date(),
  });
}

export default pair;