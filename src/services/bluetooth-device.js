//http://stackoverflow.com/questions/18188083/javascript-oop-in-nodejs-how
var BTSP = require('bluetooth-serial-port');
var method = BluetoothDevice.prototype;

// serial.on('found', function(address, name) {
//   devices.push({name: address + ' - ' + name, value: {address: address, name: name}});
// });

// serial.findSerialPortChannel(address, function(channel) {
//     serial.connect(address, channel, function() {
//         console.log('connected');
//         process.stdin.resume();
//         console.log('Type something to send it to the bluetooth device')
//
//         process.stdin.on('data', function (data) {
//             serial.write(new Buffer(data, 'utf-8'), function(err, bytesWritten){
//           if (err) console.log(err);
//         });
//         });
//
//         serial.on('data', function(buffer) {
//             console.log('Received: ' + buffer.toString('utf-8'));
//         });
//     }, function () {
//         console.log('cannot connect');
//     });
// });

function BluetoothDevice(address, verbose) {
  this.address = address;
  this.connected = false;
  this.received = '';
  this.expected = '';
  this.serial = new BTSP.BluetoothSerialPort();
  this.serial.on('data', this.dataCallback.bind(this));
  this.serial.on('closed', this.closed.bind(this));
  this.serial.on('failure', this.closed.bind(this));
  this.verbose = false;
}

method.close = function() {
  var self = this;
  self.serial.close();
}

method.closed = function() {
  var self = this;
  self.connected = false;
}

method.log = function(message) {
  var self = this;
  if(self.verbose)
    console.log(message);
}

method.connect = function() {
  var self = this;
  var serial = self.serial;
  var address = self.address;
  self.log('Connecting');
  return new Promise(function(resolve, reject){
    if(self.connected) {
      resolve('Already connected');
    } else {
      serial.findSerialPortChannel(address, function(channel) {
          serial.connect(address, channel, function() {
              self.connected = true;
              self.log('Connected to: ' + self.address)
              resolve('Connected');
          }, function () {
              self.connected = false;
              reject('Connection failed for Address: ' + address);
          });
      }, function() {
        self.log('Failed finding port');
        reject('Find Port failed for Address: ' + address);
      });
    }
  });
}

method.reset = function() {
  var self = this;
  self.log('Reset');
  self.received = '';
  self.expected = '';
  self.currentResolve = null;
  self.currentReject = null;
}

method.dataCallback = function(buffer) {
  var response = buffer.toString('utf-8');
  var self = this;
  self.log('Got: ' + response);
  if (!this.currentResolve || !this.currentReject){
    self.log('Recieved data after resolving');
    return;
  }
  for (var i=0, len=response.length; i < len; i++){
    this.received += response[i];
    if(response[i] === '{'){
      this.received = '{';
    } else if(response[i] === '}'){
      if(this.received.startsWith(this.expected) && this.currentResolve){
        this.currentResolve(this.received);
      } else if(this.currentReject) {
        this.currentReject('Unexpected response: ' + this.received);
      }
      this.reset();
    }
  }
  // Loop through returned chars to build response
  // if(this.currentResolve)
  //   this.currentResolve(response);


}

method.sendCommand = function(command, response, timeout) {
  var self = this;
  var commandPromise = new Promise(function(resolve, reject){
    self.currentResolve = resolve;
    self.currentReject = reject;
    self.expected = '{' + response;
    var wrappedCommand = '{' + command + '}';
    self.log('Sending: ' + wrappedCommand)
    self.serial.write(new Buffer(wrappedCommand, 'utf-8'), function(err, bytesWritten){
      if(err) reject(err);
    })
    setTimeout(function() {
      reject('Command timeout with no response.  Expected: {' + response
        + '  Got: ' + this.received);
      //self.reset();
    }, timeout);
  });
  return commandPromise;
}

method.executeCommand = function(command, response, timeout) {
  var self = this;
  self.log('Execute command');
  return self.connect().then(() => self.sendCommand(command, response, timeout));
}


module.exports = BluetoothDevice;
