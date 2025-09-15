```markdown
# AI POWERED Traffic Analyzer

**Professional Summary**  
This project provides a complete solution for **network traffic analysis** using PCAP files. Users can upload packet capture files (`.pcap` / `.pcapng`) or perform live capture, and the system classifies network flows into categories like Web, Multimedia, Social Media, or Malicious using a Python-based XGBoost model. The platform includes a **React frontend** for interactive visualization and a **Node.js/Express backend** for file handling, analysis, and WebSocket-based live updates.

---

## Features
- Upload `.pcap` or `.pcapng` files for automated flow extraction and classification.
- Live network capture and real-time classification.
- Traffic classification into Web, Multimedia, Social Media, and Malicious categories.
- Flow statistics and top-10 flow details visualization.
- Interactive charts for traffic distribution.
- WebSocket support for live capture updates.

---

## Project Structure

```

project-root/
│
├── backend/
│   ├── worker/
│   │   ├── classifier\_core.py
│   │   └── pcap2csv\_win\_new\.py
│   ├── services/
│   │   └── pythonClient.js
│   ├── routes/
│   │   ├── sessions.js
│   │   └── flows.js
│   ├── uploads/         # generated at runtime
│   ├── app.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── pages/
│   │   │   └── Upload.tsx
│   │   └── App.tsx
│   ├── public/
│   └── package.json
│
├── README.md
└── .gitignore

````

---

## Installation & Setup

### Backend
```bash
cd backend
npm install
````

### Frontend

```bash
cd frontend
npm install
```

---

## Running the Application

### Start Backend

```bash
cd backend
npm run dev
```

### Start Frontend

```bash
cd frontend
npm run dev
```

* Backend runs on `http://localhost:3001`
* Frontend runs on `http://localhost:5173`

---

## Notes

* Ensure **Python 3** is installed and accessible (`py -3` on Windows, `python3` on macOS/Linux).
* Required Python packages for flow analysis: `pandas`, `numpy`, `joblib`, `scikit-learn`, `xgboost`.
* Uploaded files are stored in `backend/uploads/`.
* Use `.pcap` or `.pcapng` files only. File size limit: 100MB.
* Live capture requires proper network interface name (Windows: `Wi-Fi` / `Ethernet`).

---

## Update in Progress

* Add **authentication and session management**.
* Improve **real-time dashboard** for live capture flows.
* Optimize **Python flow classification** for large PCAP files.
* Add **frontend pagination and filtering** for flow table.

---

## License

This project is open-source. But only contributors allowed are my teammates✋

```
```
