# CICFlowMeter Clone

A lightweight Python-based toolkit to extract features from PCAP files, train ML models, and detect video-like network flows. Inspired by CICFlowMeter, this clone focuses on converting packet captures into feature-rich CSVs, applying machine learning, and clustering flows.

---

## Features
- Convert raw PCAP files into flow-based CSV feature datasets.  
- Train ML models (Random Forest) using pseudolabels.  
- Predict video-like flows on new datasets.  
- Cluster flows and flag the cluster with the highest throughput as "video-like".  

---

## Project Structure
| File | Description |
|------|-------------|
| `pcap2csv_win.py` | Converts PCAP files into a features CSV. |
| `train_from_pseudolabels_quick.py` | Trains a Random Forest model from pseudolabels and saves it as `flow_video_rf.joblib`. |
| `predict_on_csv.py` | Runs predictions on a features CSV using the trained model. |
| `cluster_flows.py` | Clusters flows and flags the cluster with the highest throughput as video-like. |

---

## Installation
git clone https://github.com/your-username/cicflowmeter-clone.git
cd cicflowmeter-clone
pip install -r requirements.txt

---
## Usage

### 1. Convert PCAP to CSV
python pcap2csv_win.py input.pcap output.csv
### 2. Train Model
python train_from_pseudolabels_quick.py pseudolabels.csv
### 3. Run Predictions
python predict_on_csv.py input.csv flow_video_rf.joblib predictions.csv
### 4. Cluster Flows
python cluster_flows.py input.csv

---

## Example Workflow
1. Start with a PCAP: `sample.pcap`.  
2. Convert to CSV:  
python pcap2csv_win.py sample.pcap sample.csv
3. Train a model:  
python train_from_pseudolabels_quick.py pseudolabels.csv
4. Predict on new data:  
python predict_on_csv.py sample.csv flow_video_rf.joblib results.csv
5. Cluster flows:  
python cluster_flows.py sample.csv

---

## Notes
- Requires Python 3.8+.  
- PCAP parsing depends on scapy/pyshark (install via requirements).  
- Outputs are CSVs for easy integration with ML workflows.
