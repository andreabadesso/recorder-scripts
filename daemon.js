let { spawn, exec } = require('child_process')
let fs = require('fs')
let videoDrive = process.env.VIDEO_PATH || '/media/videodrive/'
let shouldRunFlag = process.env.RUN_FLAG || '/opt/RUN_FLAG'
let path = require('path')
let shouldRun = fs.existsSync(shouldRunFlag)
let http = require('http')
let SerialPort = require('serialport');
let port = new SerialPort('/dev/ttyUSB0', {
  baudRate: 57600
})
let { ERROR_STATUS, STATUS_UPDATE, COMMANDS } = require('./protocol.js')

console.log('Service started.')

let cam1, cam2

let sendSerial = (message) => {
  if (!port) {
    console.log('Error sending message, port is not connected..')
  }

  port.write(message, (err) => {
    console.log('Serial error => ', err)
  })
}

port.on('data', (data) => {
  if (COMMANDS.START_RECORD.equals(data)) {
    start()
  } else {
    stop()
  }
})

let record = () => {
  let dirs = [
    `${videoDrive}CAMERA_1`,
    `${videoDrive}CAMERA_2`
  ]

  dirs.forEach((dir) => {
    if (fs.existsSync(dir)) return
    fs.mkdirSync(dir)
  })

  cam1 = spawn('/opt/record_cam1.sh', ['CAMERA_1', dirs[0]], {
    uid: 1000,
    gid: 1000,
    detached: true
  })

  cam2 = spawn('/opt/record_cam2.sh', ['CAMERA_2', dirs[1]], {
    uid: 1000,
    gid: 1000,
    detached: true
  })

  cam1.stdout.on('error', (data) => {
    console.log('ERROR CAM1')
  })

  cam2.stdout.on('error', (data) => {
    console.log('ERROR CAM2')
  })
}

http.createServer((request, response) => {
  let body = ''

  request.on('data', function (data) {
    body += data

    if (body.length > 1e6)
    request.connection.destroy()
  });

  request.on('end', function () {
    if (request.url.indexOf('/api') > -1) {
      switch(body) {
        case 'start_video':
          start()
          response.end('OK')
        break
        case 'end_video':
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
  removeFlag()

  try {
    cam1.stdin.pause()
    process.kill(-cam1.pid)

    cam2.stdin.pause()
    process.kill(-cam2.pid)
  } catch(e) {
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

if (shouldRun) {
  console.log('Flag is set, starting record')
  record()
}
