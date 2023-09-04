# Allow incoming traffic from trusted IP addresses
iptables -A INPUT -s trusted_ip_address -j ACCEPT

# Drop incoming traffic from IP addresses that have made more than 10 connections within the last 10 seconds
iptables -A INPUT -p tcp -m recent --update --seconds 10 --hitcount 10 --name ddos --rsource -j DROP

# Accept incoming traffic from IP addresses that have made less than 10 connections within the last 10 seconds
iptables -A INPUT -p tcp -m recent --set --name ddos --rsource -j ACCEPT

# Log incoming traffic from IP addresses that have made more than 5 connections within the last 5 seconds
iptables -A INPUT -p tcp -m recent --update --seconds 5 --hitcount 5 --rttl --name ddos --rsource -j LOG --log-prefix "DDoS attack detected: "

# Drop incoming traffic from IP addresses that have made more than 5 connections within the last 5 seconds
iptables -A INPUT -p tcp -m recent --update --seconds 5 --hitcount 5 --rttl --name ddos --rsource -j DROP