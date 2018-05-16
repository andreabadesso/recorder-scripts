let connection = new WebSocket(`ws://${window.location.hostname}/config/websocket`, ['soap', 'xmpp'])
const videos = []
const streams = []

function connect() {
    connection = new WebSocket(`ws://${window.location.hostname}/config/websocket`, ['soap', 'xmpp'])
}

console.log(connection)

connection.onopen = () => {
    console.log('OPEN')
}

connection.onerror = () => {
    setTimeout(() => {
        console.log('Retrying..')
        connect()
    }, 1000)
}

connection.onmessage = (message) => {
    console.log('Received message', message)
    if (message.data === 'not_configured') {
        setTimeout(() => {
            displayCameras()
        }, 5000)
    } else if (message.data === 'is_configured') {
        displayControls()
    } else if (message.data === 'format_end') {
        alert('Drive formatado.')
    } else if (message.data === 'umount_end') {
        alert('Drive ejetado.')
    } else if (message.data === 'format_error') {
        alert('Erro na formatação')
    } else if (message.data === 'umount_error') {
        alert('Erro ao ejetar')
    }
}

function command(cmd) {
    console.log('Sending command:', cmd)
    if (cmd === 'finish') {
        streams.forEach((stream) => {
            let tracks = stream.getTracks()

            tracks.forEach(track => {
                track.stop()
            })
        })

        connection.send(cmd)
        window.close()
    } else {
        connection.send(cmd)
    }
}

function displayControls() {
    console.log('Display Controls')
    let videoWrapper = document.querySelector('.video-wrapper')
    let controls = document.querySelector('.controls')

    controls.style.display = 'block';
    videoWrapper.style.display = 'none';
}

function displayCameras() {
    console.log('Displaying cameras..')
    let videoWrapper = document.querySelector('.video-wrapper')
    let controls = document.querySelector('.controls')

    controls.style.display = 'none';
    videoWrapper.style.display = 'block';
    let devices = [
        'HD-5000',
        'HD-3000'
    ]

    function handleSuccess(stream, videoClass) {
        let video = document.querySelector(videoClass)
        window.stream = stream; // make stream available to browser console
        video.srcObject = stream;
        videos.push(video)
        streams.push(stream)
    }

    function handleError(error) {
        console.log('navigator.getUserMedia error: ', error);
    }

    function gotDevices(devices) {
        console.log('devices => ', devices)
        let deviceList = devices.filter((device) => {
            if (device.label.indexOf('HD-5000') > -1 ||
                device.label.indexOf('HD-3000') > -1 ||
                device.label.indexOf('C920') > -1) {
                return true
            } else {
                return false
            }
        })

        if (deviceList.length <= 0) {
            alert('Alguma das cameras não está conectada.')
        }

        Promise.all(deviceList.map((device) => {
            return navigator.mediaDevices.getUserMedia({
                audio: false,
                video: true,
                video: {
                    deviceId: device.deviceId
                }
            })
        })).then((results) => {
            handleSuccess(results[0], '.video1')
            handleSuccess(results[1], '.video2')
        })
    }

    navigator.getUserMedia({
        video: true,
        audio: false
    }, () => {
        navigator.mediaDevices.enumerateDevices()
            .then(gotDevices)
            .catch(handleError);
    })
}
