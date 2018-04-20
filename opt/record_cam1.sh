#!/bin/bash

SEGMENT_TIME=5
QUEUE_SIZE=512

ffmpeg -thread_queue_size $QUEUE_SIZE \
  -f alsa -ac 2 -i "hw:CARD=C920,DEV=0" \
  -thread_queue_size $QUEUE_SIZE -f video4linux2 \
  -input_format mjpeg -framerate 30 -video_size 1920x1080 -i /dev/video0 \
  -vcodec libx264 -preset superfast -af dynaudnorm=s=3:f=60 \
  -vf "drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf: text='%{localtime\:%a %b %d %Y} - $1': fontcolor=white: fontsize=48: box=1: boxcolor=black@0.5: y=0: x=0" \
  -f segment -segment_time $SEGMENT_TIME \
  $2/$(date +%s)_%04d.mp4
