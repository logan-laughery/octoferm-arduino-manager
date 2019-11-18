import {getConnection} from '@src/repositories/firebase';

export default class DeviceRepo {
  constructor() {
    this.connection = getConnection();
  }

  async getDeviceOnce(deviceKey) {
    return await this.connection
      .ref(`devices/${deviceKey}`)
      .once('value');
  }

  addDeviceUpdatedHandler(deviceKey, handler) {
    this.ref = this.connection.ref(`devices/${deviceKey}`);
    this.ref.on('value', handler);
  }
  
  addChildAddedHandler(handler) {
    this.ref = this.connection.ref('devices/');
    this.ref.on('child_added', handler);
  }

  addChildChangedHandler(handler) {
    this.ref.on('child_changed', handler);    
  }

  addChildRemovedHandler(handler) {
    this.ref.on('child_removed', handler);    
  }

  async setErrorCount(deviceKey, count) {
    await this.connection.ref(`devices/${deviceKey}/errorCount`)
      .set(count);
  }
}