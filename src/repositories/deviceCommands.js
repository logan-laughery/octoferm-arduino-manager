import {getConnection} from '@src/repositories/firebase';

export default class DeviceCommandsRepo {
  constructor() {
    this.connection = getConnection();
  }

  addChildAddedHandler(deviceKey, handler) {
    this.ref = this.connection.ref(`deviceCommands/${deviceKey}`)
      .limitToLast(1);
    this.ref.on('child_added', handler);
  }

  async update(deviceKey, command) {
    const {key, ...updatedValues} = command;

    await this.connection.ref(`deviceCommands/${deviceKey}/${key}`)
      .update(updatedValues);
  }
}