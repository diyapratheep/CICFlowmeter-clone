import argparse
import pandas as pd, numpy as np, joblib
from sklearn.metrics import classification_report

parser = argparse.ArgumentParser(description="Predict video-like flows on a CSV")
parser.add_argument("--in",  dest="infile",  required=True, help="Input CSV (e.g., output_clustered.csv)")
parser.add_argument("--out", dest="outfile", default="output_with_predictions.csv", help="Predictions CSV")
parser.add_argument("--model", default="flow_video_rf.joblib", help="Trained model file")
args = parser.parse_args()

model = joblib.load(args.model)
df = pd.read_csv(args.infile)

# Derived features (same as training)
df["TotalBytes"]  = df.get("TotalBytes", df["TotLenFwd"] + df["TotLenBwd"])
df["Duration"]    = df.get("Duration", df["FlowDuration"].replace(0, np.nan))
df["BytesPerSec"] = df.get("BytesPerSec", df["TotalBytes"] / df["Duration"])
df["PktsPerSec"]  = df.get("PktsPerSec", (df["TotFwdPkts"] + df["TotBwdPkts"]) / df["Duration"])
df["FwdBwdBytesRatio"] = (df["TotLenFwd"] + 1) / (df["TotLenBwd"] + 1)
df["ProtoNum"]    = df["Protocol"].map({"TCP":1,"UDP":2}).fillna(0).astype(int)

features = [
    "FlowDuration","TotFwdPkts","TotBwdPkts","TotLenFwd","TotLenBwd",
    "FwdPktLenMean","FwdPktLenStd","BwdPktLenMean","BwdPktLenStd",
    "FlowIATMean","FlowIATStd","FwdIATMean","FwdIATStd","BwdIATMean","BwdIATStd",
    "TotalBytes","BytesPerSec","PktsPerSec","FwdBwdBytesRatio","ProtoNum"
]
X = df[features].replace([np.inf,-np.inf], np.nan).fillna(0)

proba = model.predict_proba(X)[:, 1]
df["pred_video_prob"]  = proba
df["pred_video_label"] = (proba >= 0.5).astype(int)
df["uncertain"]        = ((proba >= 0.4) & (proba <= 0.6)).astype(int)

# If pseudo-labels exist (from clustering), print a quick quality check
if "video_like" in df.columns:
    print("\nEval vs. pseudo-labels (video_like):")
    print(classification_report(df["video_like"].astype(int), df["pred_video_label"]))

df.to_csv(args.outfile, index=False)
print(f"\nWrote: {args.outfile}")
