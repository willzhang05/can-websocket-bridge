CC := clang
CFLAGS := -g -Wall
OUTPUT_LIBRARY := librivanna2.a

SOURCES = rivanna2.c bps.c motor_controller.c

.PHONY: all

all: rivanna2.o bps.o motor_controller.o

rivanna2.o: rivanna2.c
	$(CC) $(CFLAGS) -O -c $<
bps.o: bps.c
	$(CC) $(CFLAGS) -O -c $<
motor_controller.o: motor_controller.c
	$(CC) $(CFLAGS) -O -c $<

clean:
	rm -f *.o
