#!/bin/sh
http-server -S -C cert.pem -o -a  0.0.0.0 -p 8000 gauges/
#http-server -a 0.0.0.0 -p 8000 gauges/
