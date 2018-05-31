#!/bin/bash
# Ubuntu 16.04.4 Desktop 64 bits
# P&D TV Globo - Alvinho

# Update SO
sudo apt -y update && sudo apt -y upgrade

# Set timezone to Brazil UCT-3
sudo timedatectl set-timezone America/Sao_Paulo

# Prepare removable drive for video recording
# Enable support for ExFAT ,format removable drive, configure automount
# Plug drive before commands
sudo apt install -y exfat-fuse exfat-utils
sudo mkfs.exfat -n VIDEODRIVE /dev/sdb1
sudo fsck.exfat /dev/sdb1
mkdir -p /media/videodrive
echo '/dev/sdb1 /media/videodrive exfat rw,users 0 0' | sudo tee -a /etc/fstab

# Allow a regular user to mount fuse drive
sudo chmod u+s /sbin/mount.exfat-fuse
sudo sed -i 's/#user_allow_other/user_allow_other/g' /etc/fuse.conf
mount -t exfat /dev/sdb1 /media/videodrive

# Install FFMPEG Prerequisites
sudo apt -y install autoconf build-essential \
git libasound2-dev libdbus-1-dev libflac-dev \
libfreetype6-dev libgl1-mesa-dev libjpeg-dev \
libmpg123-dev libpng-dev libsdl2-dev libsdl2-image-dev \
libsdl2-mixer-dev libsdl2-ttf-dev libssl-dev \
libtool libudev-dev libvorbis-dev libx11-dev \
make mercurial nasm openssl xorg-dev yasm \
libx264-dev libfdk-aac-dev v4l-utils libv4l-dev \
htop texinfo libfribidi-dev

# Clone, Compile and install Simple DirectMedia Layer
cd "${HOME}" || exit
hg clone https://hg.libsdl.org/SDL SDL
cd SDL || exit
make clean
./autogen.sh
./configure
make all -j "$(nproc)"
sudo make install
cd test || exit
make clean
./configure
sudo ln -s /usr/include/SDL2/SDL_ttf.h /usr/local/include/SDL2/
make all -j "$(nproc)"

# Clone, Compile and install FFMPEG
# Enable support for H264, AAC, video4linux and drawtext
cd "${HOME}" || exit
git clone https://github.com/FFmpeg/FFmpeg.git
cd FFmpeg || exit
git pull
./configure \
	--enable-gpl \
	--enable-nonfree \
	--enable-openssl \
	--enable-libx264 \
	--enable-libfdk-aac \
	--enable-libv4l2 \
	--enable-libfreetype \
	--enable-libfontconfig \
	--enable-libfribidi
make -j "$(nproc)"
sudo make install

# configure autologon for the user
# Disable screen blackout and lock
sudo gsettings set org.gnome.desktop.session idle-delay 0
sudo gsettings set org.gnome.desktop.screensaver lock-enabled false

# Set permissions for current user to access webcam
sudo usermod -aG video "$USER"
sudo usermod -aG audio "$USER"
sudo usermod -aG pulse "$USER"
sudo usermod -aG pulse-access "$USER"
sudo chmod g+rw /dev/video0
sudo chmod g+rw /dev/video1

# Start pulseaudio as a daemon for headless usage
echo 'pulseaudio -D' | sudo tee /etc/rc.local
echo 'exit 0' | sudo tee --append /etc/rc.local 

# Set X display for the user
# Disable screensaver and screen blanking
echo "export DISPLAY=:0" >> "${HOME}"/.profile
echo "xset s off && xset s noblank && xset -dpms" >> "${HOME}"/.profile
source "${HOME}"/.profile

# Install node.js via NVM
cd "${HOME}" || exit
sudo apt install -y build-essential libssl-dev curl
curl -sL https://raw.githubusercontent.com/creationix/nvm/v0.33.8/install.sh -o install.sh
bash install.sh
source "${HOME}"/.profile
nvm install v9.11.1

# Install orchestrator daemon and ffmpeg scripts
cd "${HOME}"/ffmpeg_dvr || exit
chmod +x record_cam*
sudo mkdir /opt/recorder-scripts
sudo chown -R "$USER":"$USER" /opt/
cp ./* /opt/recorder-scripts

# Prepare and setup record orchestrator daemon
cd "${HOME}"/ffmpeg_dvr || exit
sed -i "s/User=.*/User='$USER'/g" record.service
sudo cp record.service /lib/systemd/system/record.service
sudo chmod 644 /lib/systemd/system/record.service
sudo systemctl daemon-reload
sudo systemctl enable record.service


# Exporter for prometheus
sudo apt install golang-go
go get github.com/prometheus/node_exporter
cd ${GOPATH-$HOME/go}/src/github.com/prometheus/node_exporter
make
cp node_exporter /opt/
