# worker/classify_ui.py
import streamlit as st
from streamlit_autorefresh import st_autorefresh
from classifier_core import extract_flows_from_pcap, classify_flows
import subprocess, os

BASE_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "data"))  # <-- Add this

st.title("PCAP Flow Classifier")
st.write("Upload a PCAP file or run in live mode to classify network flows.")

mode = st.radio("Choose mode:", ["Upload PCAP", "Live Capture"])

# ---------------- Upload Mode ----------------
if mode == "Upload PCAP":
    pcap_file = st.file_uploader("Upload a PCAP file", type=["pcap", "pcapng"])
    if pcap_file:
        temp_pcap_path = os.path.join(DATA_DIR, "temp.pcap")
        with open(temp_pcap_path, "wb") as f:
            f.write(pcap_file.read())
        st.info("Extracting flows from PCAP...")
        csv_path = extract_flows_from_pcap(temp_pcap_path, "gmflows.csv")
        df = classify_flows(csv_path)
        if not df.empty:
            st.success(f"Processed {len(df)} flows!")
            st.dataframe(df[["Prediction"]])
            st.bar_chart(df["Prediction"].value_counts())

# ---------------- Live Mode ----------------
elif mode == "Live Capture":
    iface = st.text_input("Interface name:", "Wi-Fi")
    output_file = os.path.join(DATA_DIR, "liveflows.csv")  # <-- Use DATA_DIR

    if "live_process" not in st.session_state:
        st.session_state.live_process = None

    refresh_interval = st.number_input("Refresh interval (seconds)", min_value=5, max_value=120, value=30, step=5)
    last_n_seconds = st.number_input("Show only last N seconds (0 = all)", min_value=0, max_value=3600, value=0, step=10)

    if st.button("Start Live Capture") and st.session_state.live_process is None:
        st.session_state.live_process = subprocess.Popen(
            ["python", "pcap2csv_win_new.py", "--live", "-o", output_file, "--iface", iface]
        )
        st.success("✅ Live capture started")

    # Auto-refresh UI
    if st.session_state.live_process is not None:
        st_autorefresh(interval=refresh_interval * 1000, key="live_refresh")

    # Classify flows live
    df = classify_flows(output_file, last_n_seconds if last_n_seconds > 0 else None)
    if not df.empty:
        st.subheader(f"Processed {len(df)} flows so far")
        st.dataframe(df[["Prediction"]])
        st.subheader("Class Distribution")
        st.bar_chart(df["Prediction"].value_counts())
