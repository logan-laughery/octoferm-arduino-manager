//http://stackoverflow.com/questions/18188083/javascript-oop-in-nodejs-how
var BTSP = require('bluetooth-serial-port');
var method = BluetoothScanner.prototype;

function BluetoothScanner(port) {
  this.port = port;
  this.devices = [];
  this.serial = new BTSP.BluetoothSerialPort();
  this.serial.on('found', this.deviceFound.bind(this));
}

method.deviceFound = function(address, name) {
  this.devices.push({address: address, name: name});
}

method.scanSync = function() {
  this.devices = [];
  this.serial.inquireSync();
  return this.devices;
};

module.exports = BluetoothScanner;
