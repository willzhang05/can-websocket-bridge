#!/bin/sh
CARGO_TARGET_ARMV7_UNKNOWN_LINUX_GNUEABIHF_LINKER=/usr/bin/arm-linux-gnueabihf-gcc OPENSSL_DIR=/usr/include/openssl OPENSSL_LIB_DIR=/usr/lib/openssl-1.0/ OPENSSL_INCLUDE_DIR=/usr/include cargo build --release --target=armv7-unknown-linux-gnueabihf
