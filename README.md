# can-websocket-bridge
The following instructions are mostly Arch Linux focused

# Building
* Install rust and the cargo package manager
* Run `cargo build` to build the binary
## Cross Compilation for ARM
* [arm-linux-gnueabihf-gcc AUR package](https://aur.archlinux.org/packages/arm-linux-gnueabihf-gcc)

# Testing Information
## Hardware
* Raspberry Pi 4 Model B 4GB or Raspberry Pi 3 Model B/B+
* Copperhill Tech PiCAN FD Shield
    * [User Manual](https://copperhilltech.com/content/PICAN_FD_UGB_11.pdf)
    * [Schematic](https://copperhilltech.com/content/pican_fd_rtc_rev_B.pdf)
    
## Software
* [Arch Linux ARM](https://archlinuxarm.org/)
    * [Raspberry Pi 4B](https://archlinuxarm.org/platforms/armv8/broadcom/raspberry-pi-4)
    * [Raspberry Pi 3B/B+](https://archlinuxarm.org/platforms/armv8/broadcom/raspberry-pi-3)
    * aarch64 option currently doesn't support overlays out of the box
    * [can-utils AUR package](https://aur.archlinux.org/packages/can-utils/)
* To set up a virtual CAN interface for testing, run `./setup_vcan.sh` as root or `sudo ./setup_vcan.sh`.
* To generate CAN bus traffic for testing, use the [cangen utility](https://manpages.debian.org/stretch-backports/can-utils/cangen.1.en.html) included in `can-utils`
* Example command for generating frames with a gap of 500ms, a set ID of 1, and data payload of fixed length 8: `cangen vcan0 -g 500 -I 1 -L 8`
* The static files can be served through many different means
  * an easy way to do this is to use `python3 -m http.server`
  * install the Node.js reference http server `npm install -g http-server` and run with `./start_webserver.sh`
