#!/bin/bash

# Logs in /var/log directory

# Set default policies
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT

# Allow loopback traffic
iptables -A INPUT -i lo -j ACCEPT
iptables -A OUTPUT -o lo -j ACCEPT

# Allow established and related traffic
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

# Allow incoming HTTP/HTTPS traffic from all sources
iptables -A INPUT -p tcp --match multiport --dports 80,443 -j ACCEPT

# Block incoming traffic with invalid flags
iptables -A INPUT -p tcp --tcp-flags ALL NONE -j DROP
iptables -A INPUT -p tcp --tcp-flags SYN,FIN SYN,FIN -j DROP
iptables -A INPUT -p tcp --tcp-flags SYN,RST SYN,RST -j DROP

# Block incoming traffic with invalid packets
iptables -A INPUT -p tcp --tcp-flags FIN,ACK FIN -j DROP
iptables -A INPUT -p tcp --tcp-flags PSH,ACK PSH -j DROP

# Block incoming traffic with excessive connection attempts
iptables -A INPUT -p tcp --syn -m connlimit --connlimit-above 10 --connlimit-mask 32 -j DROP

# Block incoming traffic to ports other than SSH, HTTP, HTTPS, and DNS
iptables -A INPUT -p tcp --match multiport ! --dports 22,80,443 -j DROP

#### Dos Protection ####

# Drop incoming traffic from IP addresses that have made more than 10 connections within the last 10 seconds
iptables -A INPUT -p tcp -m recent --update --seconds 10 --hitcount 10 --name ddos --rsource -j DROP

# Accept incoming traffic from IP addresses that have made less than 10 connections within the last 10 seconds
iptables -A INPUT -p tcp -m recent --set --name ddos --rsource -j ACCEPT

# Log incoming traffic from IP addresses that have made more than 5 connections within the last 5 seconds
iptables -A INPUT -p tcp -m recent --update --seconds 5 --hitcount 5 --rttl --name ddos --rsource -j LOG --log-prefix "DDoS attack detected: "

# Drop incoming traffic from IP addresses that have made more than 5 connections within the last 5 seconds
iptables -A INPUT -p tcp -m recent --update --seconds 5 --hitcount 5 --rttl --name ddos --rsource -j DROP

#! End Dos protection !#

#### Brute Force Protection ####

# Allow incoming SSH traffic from trusted IP addresses
iptables -A INPUT -p tcp --dport 22 -m state --state NEW -m recent --set --name ssh --rsource
iptables -A INPUT -p tcp --dport 22 -m state --state NEW -m recent --update --seconds 60 --hitcount 4 --rttl --name ssh --rsource -j DROP
iptables -A INPUT -p tcp --dport 22 -j ACCEPT

# Log and drop incoming traffic from suspicious IP addresses
iptables -A INPUT -p tcp -m recent --rcheck --seconds 60 --name ssh --rsource -j LOG --log-prefix "Brute force attack detected: "
iptables -A INPUT -p tcp -m recent --rcheck --seconds 60 --name ssh --rsource -j DROP

#! End Brute Force Protection !#

# Log and drop all other incoming traffic
iptables -A INPUT -j LOG --log-prefix "DROP: "
iptables -A INPUT -j DROP