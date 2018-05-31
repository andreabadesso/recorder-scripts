#!/bin/bash
# P&D TV Globo - Alvinho

pid=$(pgrep -xn pulseaudio)
export pid
DBUS_SESSION_BUS_ADDRESS="$(grep -ao -m1 -P '(?<=DBUS_SESSION_BUS_ADDRESS=).*?\0' /proc/"$pid"/environ)"
export DBUS_SESSION_BUS_ADDRESS
CAMERA_DEVICE="/dev/video1"
CAMERA_TYPE=$(v4l2-ctl --info -d $CAMERA_DEVICE | grep type | cut -d':' -f 2 | tr -d ' ')
FPS=24
QUEUE_SIZE=1024
GOP_TIME_SECONDS=2
GOP_TIME_FRAMES=$(($GOP_TIME_SECONDS*$FPS))
SEGMENT_TIME_SECONDS=1200

if [ "$CAMERA_TYPE" = "HDProWebcamC920" ]; then
        AUDIO_DEVICE="hw:CARD=C920_1,DEV=0"
        RESOLUTION="1280x720"
        AUDIO_CHANNELS=2
        logger "Camera 2 detected, it is HDProWebcamC920"
elif [ "$CAMERA_TYPE" = "Microsoft®LifeCamHD-3000" ]; then
        AUDIO_DEVICE="hw:CARD=HD3000,DEV=0"
        RESOLUTION="1280x720"
        AUDIO_CHANNELS=1
        logger "Camera 2 detected, it is Microsoft®LifeCamHD-3000"
elif [ "$CAMERA_TYPE" = "Microsoft®LifeCamHD-5000" ]; then
        AUDIO_DEVICE="hw:CARD=HD5000,DEV=0"
        RESOLUTION="1280x720"
        AUDIO_CHANNELS=1
        logger "Camera 2 detected, it is Microsoft®LifeCamHD-5000"
else
        logger "Camera 2 not found or it's an unknown model, recording disabled"
        echo "Camera 2 not found or it's an unknown model, recording disabled" >> /opt/LAST_ERROR_CAMERA_2
        exit 1
fi
if grep -qs '/media/videodrive' /proc/mounts; then
        logger "Removable drive is mounted"
        #echo "Removable drive is mounted" >> /opt/LAST_ERROR_CAMERA_2
else
        logger "Removable drive is not mounted, recording disabled"
        echo "Removable drive is not mounted, recording disabled" >> /opt/LAST_ERROR_CAMERA_2
        exit 1
fi

nice -n -7 ffmpeg -thread_queue_size $QUEUE_SIZE \
  -loglevel error \
  -f alsa -ac $AUDIO_CHANNELS -i $AUDIO_DEVICE \
  -thread_queue_size $QUEUE_SIZE -f video4linux2 \
  -input_format mjpeg -framerate $FPS -video_size $RESOLUTION -i $CAMERA_DEVICE \
  -pix_fmt yuv420p -vcodec libx264 -crf 22 -preset superfast -af "dynaudnorm=s=0:f=60" \
  -vf "drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf: text='%{localtime\\:%a %b %d %Y %T} - $1': fontcolor=white: fontsize=24: box=1: boxcolor=black@0.5: y=0: x=0" \
  -g $GOP_TIME_FRAMES -sc_threshold 0 -force_key_frames "expr:gte(t,n_forced*$GOP_TIME_SECONDS)" -f segment -segment_time $SEGMENT_TIME_SECONDS \
  "$2"/"$(date "+%Y.%m.%d-%H.%M.%S")"_%04d.mp4
