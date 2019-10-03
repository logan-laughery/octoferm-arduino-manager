#!/usr/bin/expect -f

set prompt "#"
set address [lindex $argv 0]
set password [lindex $argv 1]
set timeout [lindex $argv 2]

spawn bluetoothctl
expect -re $prompt
sleep 2
send "power on\r"
sleep 2
send "remove $address\r"
sleep 2
expect -re $prompt
send "scan on\r"
send_user "\nSleeping\r"
sleep 5
send_user "\nDone sleeping\r"
send "scan off\r"
expect "Controller"
send "trust $address\r"
sleep 2
send "pair $address\r"
sleep $timeout
send "$password\r"
sleep 3
send_user "\nShould be paired now.\r"
send "quit\r"
expect eof