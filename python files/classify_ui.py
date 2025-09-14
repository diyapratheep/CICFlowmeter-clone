import streamlit as st
from streamlit_autorefresh import st_autorefresh
import subprocess, os, signal, time
import pandas as pd
import numpy as np
import joblib

st.title("PCAP Flow Classifier")
st.write("Upload a PCAP file or run in live mode to classify network flows.")

# ---------------- Options ----------------
mode = st.radio("Choose mode:", ["Upload PCAP", "Live Capture"])

# Load model + scaler once
scaler = joblib.load(r"scaler_new_xgb.pkl")
model = joblib.load(r"xgboost_model_new.pkl")
label_map = {0: "Web", 1: "Multimedia", 2: "Social Media", 3: "Malicious"}

column_mapping = {
    'FlowDuration': 'duration',
    'TotalFwdIAT': 'total_fiat',
    'TotalBwdIAT': 'total_biat',
    'FwdIATMin': 'min_fiat',
    'BwdIATMin': 'min_biat',
    'FwdIATMax': 'max_fiat',
    'BwdIATMax': 'max_biat',
    'FwdIATMean': 'mean_fiat',
    'BwdIATMean': 'mean_biat',
    'PktsPerSec': 'flowPktsPerSecond',
    'BytesPerSec': 'flowBytesPerSecond',
    'FlowIATMin': 'min_flowiat',
    'FlowIATMax': 'max_flowiat',
    'FlowIATMean': 'mean_flowiat',
    'FlowIATStd': 'std_flowiat',
    'MinActive': 'min_active',
    'MeanActive': 'mean_active',
    'MaxActive': 'max_active',
    'StdActive': 'std_active',
    'MinIdle': 'min_idle',
    'MeanIdle': 'mean_idle',
    'MaxIdle': 'max_idle',
    'StdIdle': 'std_idle'
}
model_features = list(column_mapping.values())

def run_classifier(csv_file, last_n_seconds=None):
    if not os.path.exists(csv_file):
        return pd.DataFrame()
    df = pd.read_csv(csv_file)
    if df.empty:
        return df

    # Filter by last N seconds (based on FlowDuration or EndTime if available)
    if last_n_seconds is not None and "FlowDuration" in df.columns:
        max_dur = df["FlowDuration"].max()
        df = df[df["FlowDuration"] >= max_dur - last_n_seconds]

    df = df.rename(columns=column_mapping)
    df = df[model_features]
    df.replace([np.inf, -np.inf], np.nan, inplace=True)
    df.fillna(0, inplace=True)
    X_scaled = scaler.transform(df)
    y_pred = model.predict(X_scaled)
    df["Prediction"] = [label_map.get(p, p) for p in y_pred]
    return df

# ---------------- Upload Mode ----------------
if mode == "Upload PCAP":
    pcap_file = st.file_uploader("Upload a PCAP file", type=["pcap", "pcapng"])
    if pcap_file:
        with open("temp.pcap", "wb") as f:
            f.write(pcap_file.read())
        st.info("Extracting flows from PCAP...")
        subprocess.run(["python", "pcap2csv_win.py", "-i", "temp.pcap", "-o", "gmflows.csv"], check=True)
        df = run_classifier("gmflows.csv")
        if not df.empty:
            st.success(f"Processed {len(df)} flows!")
            st.dataframe(df[["Prediction"]])
            st.bar_chart(df["Prediction"].value_counts())

# ---------------- Live Mode ----------------
elif mode == "Live Capture":
    iface = st.text_input("Interface name:", "Wi-Fi")
    output_file = "liveflows.csv"

    if "live_process" not in st.session_state:
        st.session_state.live_process = None

    refresh_interval = st.number_input("Refresh interval (seconds)", min_value=5, max_value=120, value=30, step=5)
    last_n_seconds = st.number_input("Show only last N seconds (0 = all)", min_value=0, max_value=3600, value=0, step=10)

    # Only one button (Start)
    if st.button("Start Live Capture") and st.session_state.live_process is None:
        st.session_state.live_process = subprocess.Popen(
            ["python", "pcap2csv_win_new.py", "--live", "-o", output_file, "--iface", iface]
        )
        st.success("✅ Live capture started")

    # Auto-refresh while live capture is running
    if st.session_state.live_process is not None:
        st_autorefresh(interval=refresh_interval * 1000, key="live_refresh")

    # Run classifier
    df = run_classifier(output_file, last_n_seconds if last_n_seconds > 0 else None)
    if not df.empty:
        st.subheader(f"Processed {len(df)} flows so far")
        st.dataframe(df[["Prediction"]])
        st.subheader("Class Distribution")
        st.bar_chart(df["Prediction"].value_counts())
