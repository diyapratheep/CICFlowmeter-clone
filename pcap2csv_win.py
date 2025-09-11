# pcap2csv_win.py
# Minimal CIC-style flow features from a PCAP (Windows-friendly, no tcpdump)
# Requires: scapy (you already have it)

import argparse, csv, math, statistics
from scapy.all import PcapReader, IP, IPv6, TCP, UDP

def safe_mean(x):
    return statistics.fmean(x) if x else 0.0

def safe_std(x):
    return statistics.pstdev(x) if len(x) > 1 else 0.0

def iat_stats(times):
    if len(times) < 2:
        return (0.0, 0.0, 0.0, 0.0)
    times_sorted = sorted(times)
    gaps = [t2 - t1 for t1, t2 in zip(times_sorted[:-1], times_sorted[1:])]
    return (safe_mean(gaps), safe_std(gaps), min(gaps), max(gaps))

def pkt_len(pkt):
    try:
        return len(bytes(pkt))
    except Exception:
        return 0

def get_ip_layer(pkt):
    if IP in pkt:
        return pkt[IP], 'IPv4'
    if IPv6 in pkt:
        return pkt[IPv6], 'IPv6'
    return None, None

def get_l4_info(pkt):
    if TCP in pkt:
        l4 = pkt[TCP]
        return 'TCP', int(l4.sport), int(l4.dport)
    if UDP in pkt:
        l4 = pkt[UDP]
        return 'UDP', int(l4.sport), int(l4.dport)
    return None, None, None

def make_bi_key(proto, a_ip, a_port, b_ip, b_port):
    # direction-agnostic 5-tuple key (so fwd/bwd live in one flow)
    a = (a_ip, a_port)
    b = (b_ip, b_port)
    if a <= b:
        return (proto, a, b)
    else:
        return (proto, b, a)

def main():
    ap = argparse.ArgumentParser(description="PCAP -> CSV (CIC-like flow features, Windows-friendly)")
    ap.add_argument("-i", "--input", required=True, help="Input PCAP file")
    ap.add_argument("-o", "--output", required=True, help="Output CSV file")
    args = ap.parse_args()

    flows = {}  # key -> flow dict

    n_pkts = 0
    with PcapReader(args.input) as pr:
        for pkt in pr:
            n_pkts += 1
            ip, ipver = get_ip_layer(pkt)
            if ip is None:
                continue
            proto, sport, dport = get_l4_info(pkt)
            if proto is None:
                continue

            src = ip.src
            dst = ip.dst
            ts  = float(pkt.time)
            length = pkt_len(pkt)

            key = make_bi_key(proto, src, sport, dst, dport)
            f = flows.get(key)
            if f is None:
                # First packet defines forward direction
                f = {
                    "src": src, "dst": dst, "sport": sport, "dport": dport, "proto": proto,
                    "start": ts, "end": ts,
                    "fwd_times": [ts], "bwd_times": [],
                    "fwd_lens": [length], "bwd_lens": [],
                }
                flows[key] = f
            else:
                f["end"] = max(f["end"], ts)
                # Determine direction relative to first observed orientation
            if src == f["src"] and dst == f["dst"] and sport == f["sport"] and dport == f["dport"]:
                f["fwd_times"].append(ts)
                f["fwd_lens"].append(length)
            elif src == f["dst"] and dst == f["src"] and sport == f["dport"] and dport == f["sport"]:
                f["bwd_times"].append(ts)
                f["bwd_lens"].append(length)
            else:
                # Same 5-tuple unordered key, but ports/IPs swapped unexpectedly; treat as bwd
                f["bwd_times"].append(ts)
                f["bwd_lens"].append(length)

    # Prepare CSV
    headers = [
        "FlowID","SrcIP","DstIP","SrcPort","DstPort","Protocol",
        "FlowDuration",
        "TotFwdPkts","TotBwdPkts",
        "TotLenFwd","TotLenBwd",
        "FwdPktLenMean","FwdPktLenStd","FwdPktLenMin","FwdPktLenMax",
        "BwdPktLenMean","BwdPktLenStd","BwdPktLenMin","BwdPktLenMax",
        "FlowIATMean","FlowIATStd","FlowIATMin","FlowIATMax",
        "FwdIATMean","FwdIATStd","FwdIATMin","FwdIATMax",
        "BwdIATMean","BwdIATStd","BwdIATMin","BwdIATMax"
    ]

    with open(args.output, "w", newline="", encoding="utf-8") as fcsv:
        w = csv.DictWriter(fcsv, fieldnames=headers)
        w.writeheader()
        for idx, (key, fl) in enumerate(flows.items(), start=1):
            dur = max(0.0, fl["end"] - fl["start"])
            # Combined times for flow-level IAT
            all_times = sorted(fl["fwd_times"] + fl["bwd_times"])
            flow_iat_mean, flow_iat_std, flow_iat_min, flow_iat_max = iat_stats(all_times)
            fwd_iat_mean, fwd_iat_std, fwd_iat_min, fwd_iat_max = iat_stats(fl["fwd_times"])
            bwd_iat_mean, bwd_iat_std, bwd_iat_min, bwd_iat_max = iat_stats(fl["bwd_times"])

            row = {
                "FlowID": idx,
                "SrcIP": fl["src"], "DstIP": fl["dst"],
                "SrcPort": fl["sport"], "DstPort": fl["dport"], "Protocol": fl["proto"],
                "FlowDuration": dur,
                "TotFwdPkts": len(fl["fwd_lens"]), "TotBwdPkts": len(fl["bwd_lens"]),
                "TotLenFwd": sum(fl["fwd_lens"]), "TotLenBwd": sum(fl["bwd_lens"]),
                "FwdPktLenMean": safe_mean(fl["fwd_lens"]),
                "FwdPktLenStd": safe_std(fl["fwd_lens"]),
                "FwdPktLenMin": min(fl["fwd_lens"]) if fl["fwd_lens"] else 0,
                "FwdPktLenMax": max(fl["fwd_lens"]) if fl["fwd_lens"] else 0,
                "BwdPktLenMean": safe_mean(fl["bwd_lens"]),
                "BwdPktLenStd": safe_std(fl["bwd_lens"]),
                "BwdPktLenMin": min(fl["bwd_lens"]) if fl["bwd_lens"] else 0,
                "BwdPktLenMax": max(fl["bwd_lens"]) if fl["bwd_lens"] else 0,
                "FlowIATMean": flow_iat_mean, "FlowIATStd": flow_iat_std,
                "FlowIATMin": flow_iat_min, "FlowIATMax": flow_iat_max,
                "FwdIATMean": fwd_iat_mean, "FwdIATStd": fwd_iat_std,
                "FwdIATMin": fwd_iat_min, "FwdIATMax": fwd_iat_max,
                "BwdIATMean": bwd_iat_mean, "BwdIATStd": bwd_iat_std,
                "BwdIATMin": bwd_iat_min, "BwdIATMax": bwd_iat_max,
            }
            w.writerow(row)

    print(f"Read {n_pkts} packets, wrote {len(flows)} flows -> {args.output}")

if __name__ == "__main__":
    main()
