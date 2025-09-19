# import signal
# import sys
# import csv
# import requests
# import uuid
# from scapy.all import sniff, IP, TCP, UDP
# import time

# # ========= CONFIG =========
# CSV_FILE = "liveflows.csv"
# API_URL = "http://127.0.0.1:5000/api/flows"   # Replace with your server endpoint
# INTERFACE = "Wi-Fi"  # Or "Ethernet" / None for default
# ROUTER_ID = "ROUTER-001"

# flows = {}
# row_counter = 0  # row_id tracker

# # ========= HELPERS =========
# def get_ip_layer(pkt):
#     return pkt[IP] if IP in pkt else None, pkt[IP].proto if IP in pkt else None

# def get_l4_info(pkt):
#     if TCP in pkt:
#         return "TCP", pkt[TCP].sport, pkt[TCP].dport, pkt[TCP].flags
#     elif UDP in pkt:
#         return "UDP", pkt[UDP].sport, pkt[UDP].dport, None
#     return None, None, None, None

# def pkt_len(pkt):
#     return len(pkt)

# # ========= FLOW HANDLING =========
# def process_packet(src, dst, sport, dport, proto, timestamp, length, flags):
#     key = (src, dst, sport, dport, proto)
#     reverse_key = (dst, src, dport, sport, proto)

#     if key in flows:
#         f = flows[key]
#     elif reverse_key in flows:
#         f = flows[reverse_key]
#     else:
#         f = {
#             "src": src, "dst": dst, "sport": sport, "dport": dport, "proto": proto,
#             "fwd_pkts": 0, "bwd_pkts": 0, "fwd_bytes": 0, "bwd_bytes": 0,
#             "start": timestamp, "end": timestamp
#         }
#         flows[key] = f

#     if (src, sport) == (f["src"], f["sport"]):
#         f["fwd_pkts"] += 1
#         f["fwd_bytes"] += length
#     else:
#         f["bwd_pkts"] += 1
#         f["bwd_bytes"] += length

#     f["end"] = timestamp
#     return f

# # ========= CSV + API =========
# def write_flow_to_csv(flow):
#     file_exists = False
#     try:
#         with open(CSV_FILE, "r"):
#             file_exists = True
#     except FileNotFoundError:
#         pass

#     with open(CSV_FILE, "a", newline="") as f:
#         writer = csv.DictWriter(f, fieldnames=flow.keys())
#         if not file_exists:
#             writer.writeheader()
#         writer.writerow(flow)

# def send_flow_to_api(flow):
#     try:
#         res = requests.post(API_URL, json=flow, timeout=5)
#         if res.status_code == 200:
#             print(f"[API] Flow sent: row_id={flow['row_id']} {flow['src']}->{flow['dst']}")
#         else:
#             print(f"[API ERROR] {res.status_code} {res.text}")
#     except Exception as e:
#         print(f"[API EXCEPTION] {e}")

# # ========= PACKET CALLBACK =========
# def handle_packet(pkt):
#     global row_counter
#     ip, proto_num = get_ip_layer(pkt)
#     if not ip: return
#     proto, sport, dport, flags = get_l4_info(pkt)
#     if not proto: return

#     flow = process_packet(ip.src, ip.dst, sport, dport, proto, float(pkt.time), pkt_len(pkt), flags)

#     # Add IDs
#     row_counter += 1
#     flow["router_id"] = ROUTER_ID
#     flow["user_id"] = ip.src
#     flow["packet_id"] = str(uuid.uuid4())
#     flow["row_id"] = row_counter

#     # Immediately write + send
#     write_flow_to_csv(flow)
#     send_flow_to_api(flow)

# # ========= GRACEFUL EXIT =========
# def signal_handler(sig, frame):
#     print("\nStopping sniffer gracefully...")
#     sys.exit(0)

# signal.signal(signal.SIGINT, signal_handler)

# # ========= MAIN =========
# if __name__ == "__main__":
#     print(f"[START] Sniffing packets on {INTERFACE or 'default'}...")
#     sniff(iface=INTERFACE, prn=handle_packet, store=False)

import signal
import sys
import csv
import requests
import uuid
from scapy.all import sniff, IP, TCP, UDP
import time, statistics
import numpy as np

# ========= CONFIG =========
CSV_FILE = "liveflows.csv"
API_URL = "http://127.0.0.1:5000/api/flows"   # Replace with your server endpoint
INTERFACE = "Wi-Fi"  # Or "Ethernet" / None for default
ROUTER_ID = "ROUTER-001"

flows = {}
row_counter = 0  # row_id tracker

# ========= SAFE HELPERS =========
def safe_mean(x): return statistics.fmean(x) if x else 0.0
def safe_std(x): return statistics.pstdev(x) if len(x) > 1 else 0.0
def safe_div(a, b): return a / b if b else 0.0
def pctile(lst, q): return float(np.percentile(lst, q)) if lst else 0.0

def iat_stats(times):
    if len(times) < 2: return (0,0,0,0)
    gaps = [t2 - t1 for t1,t2 in zip(times[:-1], times[1:])]
    return (safe_mean(gaps), safe_std(gaps), min(gaps), max(gaps))

# ========= FLOW HANDLING =========
def process_packet(src, dst, sport, dport, proto, timestamp, length, flags):
    key = (proto, src, sport, dst, dport)
    rev_key = (proto, dst, dport, src, sport)

    f = flows.get(key) or flows.get(rev_key)
    if f is None:
        f = {
            "src": src, "dst": dst, "sport": sport, "dport": dport, "proto": proto,
            "start": timestamp, "end": timestamp,
            "fwd_times": [], "bwd_times": [],
            "fwd_lens": [], "bwd_lens": [],
            "fwd_flags": [], "bwd_flags": []
        }
        flows[key] = f

    # update flow
    f["end"] = max(f["end"], timestamp)
    if (src, sport) == (f["src"], f["sport"]):
        f["fwd_times"].append(timestamp)
        f["fwd_lens"].append(length)
        if flags is not None: f["fwd_flags"].append(flags)
    else:
        f["bwd_times"].append(timestamp)
        f["bwd_lens"].append(length)
        if flags is not None: f["bwd_flags"].append(flags)

    return f

def compute_features(f):
    dur = max(0.0, f["end"] - f["start"])
    all_times = sorted(f["fwd_times"] + f["bwd_times"])
    flow_iat = iat_stats(all_times)
    fwd_iat = iat_stats(f["fwd_times"])
    bwd_iat = iat_stats(f["bwd_times"])

    total_bytes = sum(f["fwd_lens"]) + sum(f["bwd_lens"])
    total_pkts = len(f["fwd_lens"]) + len(f["bwd_lens"])

    return {
        "FlowDuration": dur,
        "TotFwdPkts": len(f["fwd_lens"]), "TotBwdPkts": len(f["bwd_lens"]),
        "TotLenFwd": sum(f["fwd_lens"]), "TotLenBwd": sum(f["bwd_lens"]),
        "FwdPktLenMean": safe_mean(f["fwd_lens"]), "BwdPktLenMean": safe_mean(f["bwd_lens"]),
        "FwdPktLenStd": safe_std(f["fwd_lens"]), "BwdPktLenStd": safe_std(f["bwd_lens"]),
        "FlowIATMean": flow_iat[0], "FlowIATStd": flow_iat[1],
        "FwdIATMean": fwd_iat[0], "BwdIATMean": bwd_iat[0],
        "TotalBytes": total_bytes, "TotalPackets": total_pkts,
        "BytesPerSec": safe_div(total_bytes, dur),
        "PktsPerSec": safe_div(total_pkts, dur)
    }

# ========= CSV + API =========
def write_flow_to_csv(flow):
    file_exists = False
    try:
        with open(CSV_FILE, "r"): file_exists = True
    except FileNotFoundError:
        pass

    with open(CSV_FILE, "a", newline="") as fcsv:
        writer = csv.DictWriter(fcsv, fieldnames=flow.keys())
        if not file_exists: writer.writeheader()
        writer.writerow(flow)

def send_flow_to_api(flow):
    try:
        res = requests.post(API_URL, json=flow, timeout=5)
        if res.status_code == 200:
            print(f"[API] Sent row_id={flow['row_id']} {flow['src']}->{flow['dst']}")
        else:
            print(f"[API ERROR] {res.status_code} {res.text}")
    except Exception as e:
        print(f"[API EXCEPTION] {e}")

# ========= PACKET CALLBACK =========
def handle_packet(pkt):
    global row_counter
    ip = pkt[IP] if IP in pkt else None
    if not ip: return
    proto, sport, dport, flags = get_l4_info(pkt)
    if not proto: return

    flow = process_packet(ip.src, ip.dst, sport, dport, proto, float(pkt.time), len(pkt), flags)

    # build feature dict
    feats = compute_features(flow)

    # add IDs
    row_counter += 1
    feats.update({
        "router_id": ROUTER_ID,
        "row_id": row_counter,
        "packet_id": str(uuid.uuid4()),
        "src": flow["src"], "dst": flow["dst"],
        "sport": flow["sport"], "dport": flow["dport"],
        "proto": flow["proto"]
    })

    # store + send
    write_flow_to_csv(feats)
    send_flow_to_api(feats)

def get_l4_info(pkt):
    if TCP in pkt: return "TCP", pkt[TCP].sport, pkt[TCP].dport, pkt[TCP].flags
    if UDP in pkt: return "UDP", pkt[UDP].sport, pkt[UDP].dport, None
    return None, None, None, None

# ========= GRACEFUL EXIT =========
def signal_handler(sig, frame):
    print("\n[STOP] Sniffer shutting down...")
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)

# ========= MAIN =========
if __name__ == "__main__":
    print(f"[START] Sniffing packets on {INTERFACE or 'default'}...")
    sniff(iface=INTERFACE, prn=handle_packet, store=False)

