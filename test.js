let SerialPort = require('serialport');
let Delimiter = require('parser-delimiter')

let { Buffer } = require('buffer')
let { ERROR_STATUS, STATUS_UPDATE, COMMANDS } = require('./protocol.js')
 
const port = new SerialPort('/dev/cu.usbserial-12345678', {
  baudRate: 9600
})

const parser = port.pipe(new Delimiter({ delimiter: '153' }))

parser.on('data', (data) => {
  let val = data.toString('utf8')
  let serviceStart = STATUS_UPDATE.SERVICE_START

  if (serviceStart.indexOf(val) > -1) {
    console.log('SERVICE START')
  }
})
