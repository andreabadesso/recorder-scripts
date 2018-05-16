let WebSocket = require('ws')
let fs = require('fs')
let spawn = require('child_process').spawn
let request = require('request')
let wss = new WebSocket.Server({
    port: 1387
})

if (fs.existsSync('/opt/SHOULD_PAUSE')) {
    fs.unlinkSync('/opt/SHOULD_PAUSE')
}

wss.on('connection', (ws) => {
    let isConfigured = fs.existsSync('/opt/IS_CONFIGURED')

    if (isConfigured) {
        ws.send('is_configured')
    } else {
        ws.send('not_configured')
    }

    ws.on('message', (message) => {
        switch(message) {
            case 'format':
                console.log('Formatting..')
                return
                if (fs.existsSync('/opt/IS_CONFIGURED')) {
                    fs.unlinkSync('/opt/IS_CONFIGURED')
                }

                request.post({
                    url: 'http://localhost/api',
                    body: 'end_video'
                }, () => {

                    setTimeout(() => {
                        let format = spawn('sh', ['/opt/format_drive.sh']);

                        format.on('error', () => {
                            ws.send('format_error')
                        })

                        format.on('close', () => {
                            ws.send('format_end')
                            ws.send('not_configured')
                        })
                    }, 3000)
                })
            break;
            case 'umount':
                if (fs.existsSync('/opt/IS_CONFIGURED')) {
                    fs.unlinkSync('/opt/IS_CONFIGURED')
                }

                request.post({
                    url: 'http://localhost/api',
                    body: 'end_video'
                }, () => {
                    console.log('VIDEO STOPED')
                    setTimeout(() => {
                        let umount = spawn('sh', ['/opt/umount_drive.sh']);

                        umount.on('error', () => {
                            ws.send('umount_error')
                        })

                        umount.on('close', () => {
                            ws.send('umount_end')
                        })
                    }, 3000)
                })
            break;
            case 'reset':
                // DELETE CONFIGURED FLAG
                console.log('reset')

                if (fs.existsSync('/opt/IS_CONFIGURED')) {
                    fs.unlinkSync('/opt/IS_CONFIGURED')
                }
                ws.send('reset_end')
                ws.send('not_configured')
            break;
            case 'finish':
                // create FLAG and quit server
                console.log('finish!!')
                fs.writeFileSync('/opt/IS_CONFIGURED', 'true', 'utf-8')
                ws.send('is_configured')
            break;
        }
        console.log('received: %s', message)
    })
})
