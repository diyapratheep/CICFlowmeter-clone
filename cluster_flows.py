# cluster_flows.py
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans

df = pd.read_csv("output.csv")

# Derived features
df["TotalBytes"] = df["TotLenFwd"] + df["TotLenBwd"]
df["Duration"] = df["FlowDuration"].replace(0, np.nan)  # avoid /0
df["BytesPerSec"] = df["TotalBytes"] / df["Duration"]
df["PktsPerSec"] = (df["TotFwdPkts"] + df["TotBwdPkts"]) / df["Duration"]
df["FwdBwdBytesRatio"] = (df["TotLenFwd"] + 1) / (df["TotLenBwd"] + 1)

# Encode protocol
df["ProtoNum"] = df["Protocol"].map({"TCP":1, "UDP":2}).fillna(0).astype(int)

feature_cols = [
    "FlowDuration","TotFwdPkts","TotBwdPkts","TotLenFwd","TotLenBwd",
    "FwdPktLenMean","FwdPktLenStd","BwdPktLenMean","BwdPktLenStd",
    "FlowIATMean","FlowIATStd","FwdIATMean","FwdIATStd","BwdIATMean","BwdIATStd",
    "TotalBytes","BytesPerSec","PktsPerSec","FwdBwdBytesRatio","ProtoNum"
]

X = df[feature_cols].replace([np.inf,-np.inf], np.nan).fillna(0)

scaler = StandardScaler()
Xs = scaler.fit_transform(X)

# k=3 often separates “small control”, “bulk download/streaming”, “background”
kmeans = KMeans(n_clusters=3, n_init="auto", random_state=0)
clusters = kmeans.fit_predict(Xs)
df["cluster"] = clusters

# Find cluster with the highest median throughput → mark as "video_like"
med_bps_by_cluster = df.groupby("cluster")["BytesPerSec"].median().sort_values(ascending=False)
video_like_cluster = int(med_bps_by_cluster.index[0])
df["video_like"] = (df["cluster"] == video_like_cluster).astype(int)

df.to_csv("output_clustered.csv", index=False)
print("Saved: output_clustered.csv")
print("Clusters by median BytesPerSec:\n", med_bps_by_cluster)
print(f"Heuristic: cluster {video_like_cluster} flagged as video_like=1")
