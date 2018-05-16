#!/bin/bash
mkfs.exfat -n VIDEODRIVE /dev/sdb1
fsck.exfat /dev/sdb1
