#!/bin/bash
# P&D TV Globo - Alvinho

pid=$(pgrep -xn pulseaudio)
export pid
DBUS_SESSION_BUS_ADDRESS="$(grep -ao -m1 -P '(?<=DBUS_SESSION_BUS_ADDRESS=).*?\0' /proc/"$pid"/environ)"
export DBUS_SESSION_BUS_ADDRESS
CAMERA_DEVICE="/dev/video0"
CAMERA_TYPE=$(v4l2-ctl --info -d $CAMERA_DEVICE | grep type | cut -d':' -f 2 | tr -d ' ')
SEGMENT_TIME=1200
QUEUE_SIZE=1024

if [ "$CAMERA_TYPE" = "HDProWebcamC920" ]; then
        AUDIO_DEVICE="hw:CARD=C920,DEV=0"
        RESOLUTION="1920x1080"
        AUDIO_CHANNELS=2
        logger "Camera 1 detected, it is HDProWebcamC920"
elif [ "$CAMERA_TYPE" = "Microsoft®LifeCamHD-3000" ]; then
        AUDIO_DEVICE="hw:CARD=HD3000,DEV=0"
        RESOLUTION="1280x720"
        AUDIO_CHANNELS=1
        logger "Camera 1 detected, it is Microsoft®LifeCamHD-3000"
elif [ "$CAMERA_TYPE" = "Microsoft®LifeCamHD-5000" ]; then
        AUDIO_DEVICE="hw:CARD=HD5000,DEV=0"
        RESOLUTION="1280x720"
        AUDIO_CHANNELS=1
        logger "Camera 1 detected, it is Microsoft®LifeCamHD-5000"
else
        logger "Camera 1 not found or it's an unknown model, recording disabled"
        echo "Camera 1 not found or it's an unknown model, recording disabled" >> /opt/LAST_ERROR_CAMERA_1
        exit 1
fi
if grep -qs '/media/videodrive' /proc/mounts; then
        logger "Removable drive is mounted"
        #echo "Removable drive is mounted" >> /opt/LAST_ERROR_CAMERA_1
else
        logger "Removable drive is not mounted, recording disabled"
        echo "Removable drive is not mounted, recording disabled" >> /opt/LAST_ERROR_CAMERA_1
        exit 1
fi

nice -n -7 ffmpeg -thread_queue_size $QUEUE_SIZE \
  -loglevel error \
  -f alsa -ac $AUDIO_CHANNELS -i $AUDIO_DEVICE \
  -thread_queue_size $QUEUE_SIZE -f video4linux2 \
  -input_format mjpeg -framerate 30 -video_size $RESOLUTION -i $CAMERA_DEVICE \
  -pix_fmt yuv420p -vcodec libx264 -preset superfast -af "dynaudnorm=s=0:f=60" \
  -vf "drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf: text='%{localtime\\:%a %b %d %Y %T} - $1': fontcolor=white: fontsize=24: box=1: boxcolor=black@0.5: y=0: x=0" \
  -f segment -segment_time $SEGMENT_TIME \
  "$2"/"$(date "+%Y.%m.%d-%H.%M.%S")"_%04d.mp4
