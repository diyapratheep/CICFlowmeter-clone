# worker/classifier_core.py
import os
import pandas as pd
import numpy as np
import joblib
import subprocess

# ---------------- Paths ----------------
BASE_DIR = os.path.dirname(__file__)
MODEL_DIR = os.path.join(BASE_DIR, "..", "models")
DATA_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "data"))
# ---------------- Column Mapping ----------------
COLUMN_MAPPING = {
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
MODEL_FEATURES = list(COLUMN_MAPPING.values())

# ---------------- Labels ----------------
LABEL_MAP = {0: "Web", 1: "Multimedia", 2: "Social Media", 3: "Malicious"}

# ---------------- Load Models ----------------
SCALER = joblib.load(os.path.join(MODEL_DIR, "scaler_new_xgb.pkl"))
MODEL = joblib.load(os.path.join(MODEL_DIR, "xgboost_model_new.pkl"))

# ---------------- Helper Functions ----------------
def extract_flows_from_pcap(pcap_path, output_csv="gmflows.csv"):
    """Call the pcap2csv script to convert PCAP → CSV"""
    # Use DATA_DIR for both input and output
    pcap_full = os.path.join(DATA_DIR, os.path.basename(pcap_path))
    output_csv_full = os.path.join(DATA_DIR, output_csv)
    if not os.path.samefile(pcap_path, pcap_full):
        # Copy pcap to data dir if not already there
        import shutil
        shutil.copy2(pcap_path, pcap_full)
    subprocess.run(
        ["python", "pcap2csv_win_new.py", "-i", pcap_full, "-o", output_csv_full],
        check=True,
        cwd=os.path.dirname(__file__)
    )
    return output_csv_full

def classify_flows(csv_path, last_n_seconds=None):
    """Load CSV → preprocess → predict → return dataframe with predictions"""
    # Use DATA_DIR for csv_path if not already absolute
    if not os.path.isabs(csv_path):
        csv_path = os.path.join(DATA_DIR, csv_path)
    if not os.path.exists(csv_path):
        return pd.DataFrame()
    
    # Filter by last N seconds (optional)
    if last_n_seconds is not None and "FlowDuration" in df.columns:
        max_dur = df["FlowDuration"].max()
        df = df[df["FlowDuration"] >= max_dur - last_n_seconds]
    
    df = df.rename(columns=COLUMN_MAPPING)
    df = df[MODEL_FEATURES]
    df.replace([np.inf, -np.inf], np.nan, inplace=True)
    df.fillna(0, inplace=True)
    
    X_scaled = SCALER.transform(df)
    y_pred = MODEL.predict(X_scaled)
    df["Prediction"] = [LABEL_MAP.get(p, p) for p in y_pred]
    
    return df
