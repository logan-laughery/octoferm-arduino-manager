import dotenv from 'dotenv';
import {setupConnection} from '@src/repositories/firebase';
import logger from '@src/utils/logger';
import {powerOn} from '@src/scanner/scan';
import manageFerementorProcesses from '@src/manager/processManager';
import setupCommandListener from '@src/manager/commandManager';

async function main() {
  logger.init('Octoferm');

  dotenv.config();

  await setupConnection();

  // Turn host bluetooth on
  await powerOn();

  // On new device
  // Spin up new device manager
  manageFerementorProcesses();

  // On new command
  // Send whatever command was requested
  // Pass initialized admin context along
  setupCommandListener();
}

main();