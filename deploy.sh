scp -r opt/* deped@192.168.10.1:/opt/
scp daemon.js deped@192.168.10.1:/opt/
scp protocol.js deped@192.168.10.1:/opt/
scp package.json deped@192.168.10.1:/opt/
scp index.html deped@192.168.10.1:/opt/
scp -r ./visualizer/web deped@192.168.10.1:/opt/visualizer/
scp -r ./visualizer/package.json deped@192.168.10.1:/opt/visualizer/
scp -r ./visualizer/server.js deped@192.168.10.1:/opt/visualizer/
scp -r ./systemd/record-web.service deped@192.168.10.1:/opt/visualizer/
scp -r ./systemd/record.service deped@192.168.10.1:/opt/visualizer/
scp -r ./nginx/default deped@192.168.10.1:/etc/nginx/sites-enabled/
scp -r ./prometheus.sh deped@192.168.10.1:/opt/
