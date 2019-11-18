import {getConnection} from '@src/repositories/firebase';

export default class RealTimeMeasurementsRepo {
  constructor() {
    this.connection = getConnection();
  }

  async add(deviceKey, measurementKey, measurement) {
    await this.connection.ref(`realTimeMeasurements/${deviceKey}/${measurementKey}`)
      .set(measurement);
  }
}