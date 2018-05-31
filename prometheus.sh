#!/bin/bash

NAME=`cat /etc/hostname`

while true ; do
    echo "PUBLISHING METRICS DATA TO $NAME"
    curl -s http://localhost:3000/metrics | curl --data-binary @- http://206.189.196.180:9091/metrics/job/orange/instance/$NAME
    curl -s http://localhost:9100/metrics | curl --data-binary @- http://206.189.196.180:9091/metrics/job/orange/instance/$NAME
    cat /sys/devices/virtual/thermal/thermal_zone0/temp | awk '{print "orange_temp{zone=\"zone0\"} " $1}' > /home/deped/textfile_collector.prom.tmp
    cat /sys/devices/virtual/thermal/thermal_zone1/temp | awk '{print "orange_temp{zone=\"zone1\"} " $1}' >> /home/deped/textfile_collector.prom.tmp
    mv /home/deped/textfile_collector.prom.tmp /home/deped/textfile_collector.prom
    echo "DONE"
    sleep 5;
done
