import { exec } from 'child_process';
import logger from '@src/utils/logger';

export async function timeoutAsync(delay) {
  return new Promise((resolve) => {
    setTimeout(resolve, delay);
  });
}

export function execAsync(command) {
  let childProcess;

  const execPromise = new Promise((resolve, reject) => {
    childProcess = exec(command, (err, stdout, stderr) => {
      if (err) {
        return reject(new Error({ err, stdout, stderr }));
      }

      return resolve({ stdout, stderr });
    });
  });

  const handledPromise = execPromise.catch((err) => {
    logger.error(err);
    return err;
  });

  return {
    childProcess,
    execPromise: handledPromise,
  };
}
