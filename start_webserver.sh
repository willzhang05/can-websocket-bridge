#!/bin/sh
#sudo http-server -S -C cert.pem -o -a  0.0.0.0 -p 8000 gauges/
sudo http-server -a 0.0.0.0 -p 8000 gauges/
