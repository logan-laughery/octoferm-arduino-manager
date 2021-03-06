import {getConnection} from '@src/repositories/firebase';

export default class CommandRepo {
  constructor() {
    this.connection = getConnection();
  }

  addChildAddedHandler(handler) {
    this.ref = this.connection.ref('commands/').limitToLast(1);
    this.ref.on('child_added', handler);
  }

  async update(command) {
    const {key, ...updatedValues} = command;

    await this.connection.ref(`commands/${key}`)
      .update(updatedValues);
  }
}