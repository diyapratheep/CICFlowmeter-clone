import pandas as pd, numpy as np, joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report
from sklearn.ensemble import RandomForestClassifier

df = pd.read_csv("output_clustered.csv")

if "video_like" not in df.columns:
    raise SystemExit("output_clustered.csv must contain a 'video_like' column from the clustering step.")

# Derived features
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
y = df["video_like"].astype(int)

Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, stratify=y, random_state=0)

pipe = Pipeline([
    ("scaler", StandardScaler()),
    ("clf", RandomForestClassifier(n_estimators=300, class_weight="balanced", random_state=0, n_jobs=-1))
])

pipe.fit(Xtr, ytr)
print(classification_report(yte, pipe.predict(Xte)))
joblib.dump(pipe, "flow_video_rf.joblib")
print("Saved model -> flow_video_rf.joblib")
