let SerialPort = require('serialport');
let { Buffer } = require('buffer')
let { ERROR_STATUS, STATUS_UPDATE, COMMANDS } = require('./protocol.js')
 
const port = new SerialPort('/dev/cu.usbserial-12345678')

port.on('data', (data) => {
  console.log('DATA => ', data)
})
