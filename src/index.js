import dotenv from 'dotenv';
import {setupConnection} from '@src/repositories/firebase';
import logger from '@src/utils/logger';
import manageFerementorProcesses from '@src/manager/processManager';
import setupCommandListener from '@src/manager/commandManager';

async function main() {
  logger.init('Octoferm');

  dotenv.config();

  await setupConnection();
  
  manageFerementorProcesses();
  setupCommandListener();
  // On new device
  // Spin up new device manager

// On new command
  // Send whatever command was requested
  // Pass initialized admin context along

}

main();