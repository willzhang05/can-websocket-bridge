#!/bin/sh
cd CAN-messages
cantools generate_c_source Rivanna2.dbc
cantools generate_c_source BPS.dbc
cantools generate_c_source MotorController.dbc
