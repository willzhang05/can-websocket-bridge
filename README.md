# can-websocket-bridge

# Building
* Install rust and the cargo package manager
* Run `cargo build` to build the binary

# Testing Information
## Hardware
* Raspberry Pi 4 Model B 4GB
* Copperhill Tech PiCAN FD Shield
    * [User Manual](https://copperhilltech.com/content/PICAN_FD_UGB_11.pdf)
    * [Schematic](https://copperhilltech.com/content/pican_fd_rtc_rev_B.pdf)
    
## Software
* [Arch Linux ARM](https://archlinuxarm.org/platforms/armv8/broadcom/raspberry-pi-4)
* [can-utils AUR package](https://aur.archlinux.org/packages/can-utils/)
* To generate CAN bus traffic for testing, use the [cangen utility](https://manpages.debian.org/stretch-backports/can-utils/cangen.1.en.html) included in `can-utils`.
