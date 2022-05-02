#!/usr/bin/env python
import sys
import asyncio
import websockets
import time

from digi.xbee.devices import XBeeDevice, RemoteXBeeDevice  
from digi.xbee.models.address import XBee64BitAddress

async def hello():
    async with websockets.connect("ws://localhost:8080/test") as websocket:
        await websocket.recv()


def main():
    args = sys.argv[1:]
    
    PORT = args[0]
    BAUD_RATE = args[1]

    xbee = XBeeDevice(PORT, BAUD_RATE)
    xbee.open()

    remote = RemoteXBeeDevice(xbee, XBee64BitAddress.from_hex_string("0013A20041C4ACC3"))
    while (1):
        xbee.send_data(remote, "testdata")
        print("sent testdata")
        time.sleep(1)
    #asyncio.run(hello())


if __name__ == "__main__":
    main()
