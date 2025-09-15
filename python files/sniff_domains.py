import logging
logging.getLogger("scapy.runtime").setLevel(logging.ERROR)  # Hide Scapy warnings

from scapy.all import sniff, TCP, Raw, DNSQR
from scapy.layers.http import HTTPRequest

seen_domains = set()

# Extract HTTP Host headers
def extract_http_host(packet):
    if packet.haslayer(HTTPRequest):
        host = packet[HTTPRequest].Host.decode(errors="ignore")
        if host and host not in seen_domains:
            seen_domains.add(host)
            print(f"[HTTP] {host}")

# Extract DNS query domains
def extract_dns(packet):
    if packet.haslayer(DNSQR):
        domain = packet[DNSQR].qname.decode().strip('.')
        if domain and domain not in seen_domains:
            seen_domains.add(domain)
            print(f"[DNS] {domain}")

# Callback for sniffing packets
def packet_callback(packet):
    if packet.haslayer(TCP) and packet.haslayer(Raw):
        extract_http_host(packet)
    extract_dns(packet)

# Automatically detect active interface
from scapy.all import get_if_list, get_if_addr
active_iface = None
for iface in get_if_list():
    try:
        ip = get_if_addr(iface)
        if ip != "0.0.0.0" and not ip.startswith("169.254") and not ip.startswith("127."):
            active_iface = iface
            break
    except:
        continue

if not active_iface:
    print("No active network interface found. Run as Administrator and check your connection.")
    exit()

print(f"Sniffing on interface: {active_iface} ... Press Ctrl+C to stop.")

sniff(
    iface=active_iface,
    prn=packet_callback,
    filter="tcp port 80 or udp port 53",
    store=False
)
