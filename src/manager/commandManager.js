import scan from '@src/manager/scan';
import pair from '@src/manager/pair';
import CommandRepo from '@src/repositories/command';

async function executeCommand(command) {
  const commands = {
    pair,
    scan,
  };

  await commands[command.type](command);
}

async function handleCommand(data, commandRepo) {
  if (data.val().acknowledged_date) {
    return;
  }

  const command = {
    key: data.key,
    ...data.val(),
  };

  await commandRepo.update({
    key: command.key,
    acknowledged_date: new Date(),
  });

  return await executeCommand(command);
}

export default function setupCommandListener() {
  const commandRepo = new CommandRepo();

  commandRepo.addChildAddedHandler(async (data) => {
    await handleCommand(data, commandRepo);
  });
}