let SerialPort = require('serialport');
let Delimiter = require('parser-delimiter')
let port = new SerialPort('/dev/tty.wchusbserial1410', {
    baudRate: 9600
})

    /*let parser = port.pipe(new Delimiter({
    delimiter: '153'
}))*/

let isRunning = false

port.on('data', (data) => {
    let leitura = data.toString()

    if (leitura.length) {
        leitura = leitura.trim()
        console.log(parseFloat(leitura) > 0.25)
    }
})

