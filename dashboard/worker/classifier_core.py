# # worker/classifier_core.py
# import os
# import pandas as pd
# import numpy as np
# import joblib
# import subprocess
# import sys

# # ---------------- Paths ----------------
# BASE_DIR = os.path.dirname(__file__)
# MODEL_DIR = os.path.join(BASE_DIR, "..", "models")

# # ---------------- Column Mapping ----------------
# COLUMN_MAPPING = {
#     'FlowDuration': 'duration',
#     'TotalFwdIAT': 'total_fiat',
#     'TotalBwdIAT': 'total_biat',
#     'FwdIATMin': 'min_fiat',
#     'BwdIATMin': 'min_biat',
#     'FwdIATMax': 'max_fiat',
#     'BwdIATMax': 'max_biat',
#     'FwdIATMean': 'mean_fiat',
#     'BwdIATMean': 'mean_biat',
#     'PktsPerSec': 'flowPktsPerSecond',
#     'BytesPerSec': 'flowBytesPerSecond',
#     'FlowIATMin': 'min_flowiat',
#     'FlowIATMax': 'max_flowiat',
#     'FlowIATMean': 'mean_flowiat',
#     'FlowIATStd': 'std_flowiat',
#     'MinActive': 'min_active',
#     'MeanActive': 'mean_active',
#     'MaxActive': 'max_active',
#     'StdActive': 'std_active',
#     'MinIdle': 'min_idle',
#     'MeanIdle': 'mean_idle',
#     'MaxIdle': 'max_idle',
#     'StdIdle': 'std_idle'
# }
# MODEL_FEATURES = list(COLUMN_MAPPING.values())

# # ---------------- Labels ----------------
# LABEL_MAP = {0: "Web", 1: "Multimedia", 2: "Social Media", 3: "Malicious"}

# # ---------------- Load Models ----------------
# SCALER = joblib.load(os.path.join(MODEL_DIR, "scaler_new_xgb.pkl"))
# MODEL = joblib.load(os.path.join(MODEL_DIR, "xgboost_model_new.pkl"))

# # ---------------- Helper Functions ----------------
# def extract_flows_from_pcap(pcap_path, output_csv="gmflows.csv"):
#     """Call the pcap2csv script to convert PCAP → CSV"""
#     try:
#         subprocess.run(
#             [sys.executable, "pcap2csv_win_new.py", "-i", pcap_path, "-o", output_csv],
#             check=True,
#             cwd=os.path.dirname(__file__)
#         )
#     except subprocess.CalledProcessError as e:
#         print(f"[!] Error running pcap2csv: {e}", file=sys.stderr)
#         return None
#     return output_csv if os.path.exists(output_csv) else None


# def classify_flows(csv_path, last_n_seconds=None):
#     import traceback
#     import pandas as pd
#     import numpy as np
#     import os

#     df = pd.DataFrame()  # define outside try-except
#     try:
#         if not os.path.exists(csv_path):
#             print(f"[!] CSV not found: {csv_path}", file=sys.stderr)
#             return df

#         df_read = pd.read_csv(csv_path)  # read into a separate var
#         if df_read.empty:
#             print("[!] CSV is empty", file=sys.stderr)
#             return df

#         df = df_read.copy()  # assign to df after successful read

#         # Optional filtering
#         if last_n_seconds is not None and "FlowDuration" in df.columns:
#             max_dur = df["FlowDuration"].max()
#             df = df[df["FlowDuration"] >= max_dur - last_n_seconds]

#         # Rename columns safely
#         df = df.rename(columns={k: v for k, v in COLUMN_MAPPING.items() if k in df.columns})

#         # Ensure all model features exist
#         for col in MODEL_FEATURES:
#             if col not in df.columns:
#                 df[col] = 0

#         df = df[MODEL_FEATURES]
#         df.replace([np.inf, -np.inf], np.nan, inplace=True)
#         df.fillna(0, inplace=True)

#         # Prediction
#         X_scaled = SCALER.transform(df)
#         y_pred = MODEL.predict(X_scaled)
#         df["Prediction"] = [LABEL_MAP.get(p, p) for p in y_pred]

#     except Exception as e:
#         print("[!] Exception in classify_flows:", e, file=sys.stderr)
#         print(traceback.format_exc(), file=sys.stderr)

#     return df

# classifier_core.py
# import pandas as pd
# import numpy as np
# import joblib
# from sklearn.preprocessing import StandardScaler
# import os

# # Load model and scaler
# MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'xgboost_model_new.pkl')
# SCALER_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'scaler_new_xgb.pkl')

# def classify_flows(csv_file, last_n_seconds=None):
#     """
#     Classify flows from CSV file
#     """
#     print(f"[classifier_core] Processing: {csv_file}")
    
#     try:
#         # Check if file exists and has data
#         if not os.path.exists(csv_file):
#             print(f"[classifier_core] File not found: {csv_file}")
#             return pd.DataFrame()
            
#         file_size = os.path.getsize(csv_file)
#         if file_size == 0:
#             print(f"[classifier_core] File is empty: {csv_file}")
#             return pd.DataFrame()
        
#         # Read CSV
#         df = pd.read_csv(csv_file)
#         print(f"[classifier_core] Read {len(df)} rows from CSV")
        
#         if df.empty:
#             print("[classifier_core] DataFrame is empty")
#             return df
            
#         print(f"[classifier_core] Columns: {df.columns.tolist()}")
        
#         # Filter by last N seconds if specified
#         if last_n_seconds is not None and "FlowDuration" in df.columns:
#             max_dur = df["FlowDuration"].max()
#             threshold = max_dur - last_n_seconds
#             df = df[df["FlowDuration"] >= threshold]
#             print(f"[classifier_core] Filtered to {len(df)} flows from last {last_n_seconds}s")
        
#         # Check if we have the required features
#         column_mapping = {
#             'FlowDuration': 'duration',
#             'TotalFwdIAT': 'total_fiat', 
#             'TotalBwdIAT': 'total_biat',
#             'FwdIATMin': 'min_fiat',
#             'BwdIATMin': 'min_biat',
#             'FwdIATMax': 'max_fiat',
#             'BwdIATMax': 'max_biat',
#             'FwdIATMean': 'mean_fiat',
#             'BwdIATMean': 'mean_biat',
#             'PktsPerSec': 'flowPktsPerSecond',
#             'BytesPerSec': 'flowBytesPerSecond',
#             'FlowIATMin': 'min_flowiat',
#             'FlowIATMax': 'max_flowiat',
#             'FlowIATMean': 'mean_flowiat',
#             'FlowIATStd': 'std_flowiat',
#             'MinActive': 'min_active',
#             'MeanActive': 'mean_active',
#             'MaxActive': 'max_active',
#             'StdActive': 'std_active',
#             'MinIdle': 'min_idle',
#             'MeanIdle': 'mean_idle',
#             'MaxIdle': 'max_idle',
#             'StdIdle': 'std_idle'
#         }
        
#         # Rename columns
#         df = df.rename(columns=column_mapping)
        
#         # Get model features
#         model_features = list(column_mapping.values())
#         missing_features = [f for f in model_features if f not in df.columns]
        
#         if missing_features:
#             print(f"[classifier_core] Missing features: {missing_features}")
#             return pd.DataFrame()
        
#         # Select only the features we need
#         df_features = df[model_features].copy()
        
#         # Handle infinite values and NaN
#         df_features.replace([np.inf, -np.inf], np.nan, inplace=True)
#         df_features.fillna(0, inplace=True)
        
#         print(f"[classifier_core] Features shape: {df_features.shape}")
        
#         # Load scaler and model
#         try:
#             scaler = joblib.load(SCALER_PATH)
#             model = joblib.load(MODEL_PATH)
#         except Exception as e:
#             print(f"[classifier_core] Error loading model/scaler: {e}")
#             return pd.DataFrame()
        
#         # Scale features
#         X_scaled = scaler.transform(df_features)
        
#         # Predict
#         y_pred = model.predict(X_scaled)
        
#         # Map predictions to labels
#         label_map = {0: "Web", 1: "Multimedia", 2: "Social Media", 3: "Malicious"}
#         df["Prediction"] = [label_map.get(p, "Unknown") for p in y_pred]
        
#         print(f"[classifier_core] Classification complete. Predictions: {df['Prediction'].value_counts().to_dict()}")
        
#         return df
        
#     except Exception as e:
#         print(f"[classifier_core] Error: {e}")
#         import traceback
#         traceback.print_exc()
#         return pd.DataFrame()

# if __name__ == "__main__":
#     # Test the function
#     test_file = "test.csv"
#     result = classify_flows(test_file)
#     print(f"Test result: {len(result)} rows")



# classifier_core.py
import pandas as pd
import numpy as np
import joblib
from sklearn.preprocessing import StandardScaler
import os
import sys

# Load model and scaler
MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'xgboost_model_new.pkl')
SCALER_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'scaler_new_xgb.pkl')

def classify_flows(csv_path, last_n_seconds=None):
    """Classify flows from CSV file - with proper debug output"""
    print(f"[CLASSIFIER] Starting classification: {csv_path}", flush=True)
    
    df = pd.DataFrame()
    try:
        if not os.path.exists(csv_path):
            print(f"[CLASSIFIER ERROR] CSV not found: {csv_path}", flush=True, file=sys.stderr)
            return df

        # Read CSV
        df_read = pd.read_csv(csv_path)
        print(f"[CLASSIFIER] Read CSV: {len(df_read)} rows, {len(df_read.columns)} columns", flush=True)
        
        if df_read.empty:
            print("[CLASSIFIER] CSV is empty", flush=True)
            return df

        df = df_read.copy()

        # FIX: Only filter if last_n_seconds is provided and valid
        if last_n_seconds is not None and last_n_seconds > 0 and "FlowDuration" in df.columns:
            max_dur = df["FlowDuration"].max()
            threshold = max_dur - last_n_seconds
            original_count = len(df)
            df = df[df["FlowDuration"] >= threshold]
            print(f"[CLASSIFIER] Filtered to last {last_n_seconds}s: {len(df)} rows (from {original_count})", flush=True)
        else:
            print(f"[CLASSIFIER] Using all {len(df)} flows (no time filter)", flush=True)

        print(f"[CLASSIFIER] Columns: {df.columns.tolist()}")
        
        # Check if we have the required features
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
        
        # Rename columns
        df = df.rename(columns=column_mapping)
        
        # Get model features
        model_features = list(column_mapping.values())
        missing_features = [f for f in model_features if f not in df.columns]
        
        if missing_features:
            print(f"[CLASSIFIER] Missing features: {missing_features}")
            return pd.DataFrame()
        
        # Select only the features we need
        df_features = df[model_features].copy()
        
        # Handle infinite values and NaN
        df_features.replace([np.inf, -np.inf], np.nan, inplace=True)
        df_features.fillna(0, inplace=True)
        
        print(f"[CLASSIFIER] Features shape: {df_features.shape}")
        
        # Load scaler and model
        try:
            scaler = joblib.load(SCALER_PATH)
            model = joblib.load(MODEL_PATH)
        except Exception as e:
            print(f"[CLASSIFIER] Error loading model/scaler: {e}")
            return pd.DataFrame()
        
        # Scale features
        X_scaled = scaler.transform(df_features)
        
        # Predict
        y_pred = model.predict(X_scaled)
        
        # Map predictions to labels
        label_map = {0: "Web", 1: "Multimedia", 2: "Social Media", 3: "Malicious"}
        df["Prediction"] = [label_map.get(p, "Unknown") for p in y_pred]
        
        print(f"[CLASSIFIER] Classification complete. Predictions: {df['Prediction'].value_counts().to_dict()}")
        
        return df
        
    except Exception as e:
        print(f"[CLASSIFIER] Error: {e}")
        import traceback
        traceback.print_exc()
        return pd.DataFrame()

if __name__ == "__main__":
    # Test the function
    test_file = "test.csv"
    result = classify_flows(test_file)
    print(f"Test result: {len(result)} rows")

