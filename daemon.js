let { spawn, exec } = require('child_process')
let fs = require('fs')
let videoDrive = process.env.VIDEO_PATH || '/media/videodrive/'
let shouldRunFlag = process.env.RUN_FLAG || '/opt/RUN_FLAG'
let path = require('path')
let shouldRun = fs.existsSync(shouldRunFlag)
let http = require('http')

console.log('Service started.')

let cam1, cam2
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

  cam1.stdout.on('data', (data) => {
    console.log(data)
  })

  cam2.stdout.on('data', (data) => {
    console.log(data)
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

    // Too much POST data, kill the connection!
    // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
    if (body.length > 1e6)
    request.connection.destroy()
  });

  request.on('end', function () {
    if (request.url.indexOf('/api') > -1) {
      switch(body) {
        case 'start_video':
          console.log('Starting video..')
          writeFlag()
          record()
          response.end('OK')
        break
        case 'end_video':
          console.log('Ending video..')
          removeFlag()

          try {
            cam1.stdin.pause()
            process.kill(-cam1.pid)

            cam2.stdin.pause()
            process.kill(-cam2.pid)
            response.end('OK')
          } catch(e) {
            exec('killall -9 ffmpeg', () => {
              response.end('OK FORCED')
            })
          }
        break
      }
    } else {
      return response.end(fs.readFileSync('/opt/index.html'))
    }
  })
}).listen(1337)

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
