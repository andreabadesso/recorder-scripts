let { Buffer } = require('buffer')
let head = 0x98
let tail = 0x99

module.exports = {
  head: head,
  tail: tail,
  ERROR_STATUS: {
    HD_UNMOUNTED: Buffer.from([
      0x01, 0x01
    ]),
    SERVICE_STOP: Buffer.from([
      0x01, 0x02
    ]),
    CAM_DISCONNECTED: Buffer.from([
      0x01, 0x03
    ])
  },
  STATUS_UPDATE: {
    RECORDING: Buffer.from([
      0x02, 0x01
    ]),
    SERVICE_STOP: '22',
    CAM_DISCONNECTED: Buffer.from([
      0x02, 0x03
    ]),
    SERVICE_START: '24'
  },
  COMMANDS: {
    START_RECORD: Buffer.from([
      0x03, 0x01
    ]),
    STOP_RECORD: Buffer.from([
      0x03, 0x02
    ]),
    FORMAT_HD: Buffer.from([
      0x03, 0x03
    ]),
    UNMOUNT_HD: Buffer.from([
      0x03, 0x04
    ])
  }
}
