function info(message) {
  const timeStamp = new Date();

  console.log(`${timeStamp} - INFO - ${message}`);
}

function warn(message) {
  const timeStamp = new Date();

  console.log(`${timeStamp} - WARN - ${message}`);
}

function error(message) {
  const timeStamp = new Date();

  if (message instanceof Error) {
    console.log(`${timeStamp} - ERROR - ${message.toString()}`
      + ` ${message.stack}`);
  }

  console.log(`${timeStamp} - ERROR - ${message}`);
}

module.exports = {
  info,
  warn,
  error
};
