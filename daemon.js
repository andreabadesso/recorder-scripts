let fs = require('fs')

let IS_CONFIGURED = fs.existsSync('/opt/IS_CONFIGURED')

if (!IS_CONFIGURED) process.exit(1)

setInterval(() => {
    let IS_CONFIGURED = fs.existsSync('/opt/IS_CONFIGURED')

    if (!IS_CONFIGURED) process.exit(1)
}, 1000)

let {
    spawn,
    exec
} = require('child_process')
let videoDrive = process.env.VIDEO_PATH || '/media/videodrive/'
let shouldRunFlag = process.env.RUN_FLAG || '/opt/RUN_FLAG'
let path = require('path')
let http = require('http')
let SerialPort = require('serialport');
let Delimiter = require('parser-delimiter')
let port = new SerialPort('/dev/ttyUSB0', {
    baudRate: 9600
})
let {
    ERROR_STATUS,
    STATUS_UPDATE,
    COMMANDS,
    head,
    tail
} = require('./protocol.js')
let isRunning = false

port.on('data', (data) => {
    let leitura = data.toString()
    console.log('Received data..', leitura)

    if (leitura.length) {
        leitura = leitura.trim()
        console.log('READ => ', leitura)
        if (parseFloat(leitura) > 0.25) {
            let shouldPause = fs.existsSync('/opt/SHOULD_PAUSE')
            if (!shouldPause) {
                start()
            } else {
                console.log('IN PAUSE MODE!')
            }
        }

        if (parseFloat(leitura) < 0.25) {
            console.log('\n*********************\nstop captura\n***********************\n\n')
            stop()
        }
    }
})

let cam1, cam2

let record = () => {
    if (isRunning) {
        console.log('Already running');
        return;
    }
    let dirs = [
        `${videoDrive}CAMERA_1`,
        `${videoDrive}CAMERA_2`
    ]

    dirs.forEach((dir) => {
        if (fs.existsSync(dir)) return
        fs.mkdirSync(dir)
    })

    console.log(`/opt/record_cam1.sh CAMERA_1 ${videoDrive}CAMERA_1`)
    cam1 = spawn('/opt/record_cam1.sh', ['CAMERA_1', dirs[0]], {
        uid: 0,
        gid: 0,
        detached: true
    })

    console.log(`/opt/record_cam2.sh CAMERA_2 ${videoDrive}CAMERA_2`)
    cam2 = spawn('/opt/record_cam2.sh', ['CAMERA_2', dirs[1]], {
        uid: 0,
        gid: 0,
        detached: true
    })


        /*cam1.stdout.on('data', (data) => {
        console.log('cam1 data', data)
    })*/

    cam1.on('exit', (code) => {
        if (isRunning) {
            setTimeout(() => {
                process.exit(1)
            }, 3000)
        }
    });

    cam2.on('exit', (code) => {
        if (isRunning) {
            setTimeout(() => {
                process.exit(1)
            }, 3000)
        }
    });

    cam1.stdout.on('error', (data) => {
        console.log('ERROR CAM1')
        process.exit(1)
    })

    cam2.stdout.on('error', (data) => {
        console.log('ERROR CAM2')
        process.exit(1)
    })

    isRunning = true;
}

http.createServer((request, response) => {
    let body = ''

    request.on('data', function(data) {
        body += data

        if (body.length > 1e6)
            request.connection.destroy()
    });

    request.on('end', function() {
        if (request.url.indexOf('/api') > -1) {
            switch (body) {
                case 'start_video':
                    start()
                    response.end('OK')
                    break
                case 'end_video':
                    console.log('end_video!!')
                    stop()
                    response.end('OK')
                    break
            }
        } else {
            return response.end(fs.readFileSync('/opt/index.html'))
        }
    })
}).listen(1337)

function start() {
    console.log('Starting video..')
    writeFlag()
    record()
}

function stop() {
    if (!isRunning) return;

    removeFlag()
    isRunning = false;

    try {
        console.log('cam1 stop')
        cam1.stdin.pause()
        process.kill(-cam1.pid)
        console.log('cam2 stop')
        cam2.stdin.pause()
        process.kill(-cam2.pid)
    } catch (e) {
        console.log('catch')
        exec('killall -9 ffmpeg')
    }
}

let writeFlag = () => {
    return fs.writeFileSync(shouldRunFlag, 'true', 'utf-8')
}

let removeFlag = () => {
    if (fs.existsSync(shouldRunFlag)) {
        fs.unlinkSync(shouldRunFlag)
    } else {
        console.log('File does not exist.')
    }
}

let shouldRun = fs.existsSync(shouldRunFlag)

if (shouldRun) {
    console.log('Flag is set, starting record')
    record()
}
