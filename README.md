# Ballastix - Advanced Ballistic Analytics and Simulation Platform

> [!IMPORTANT]
> **Academic & Research Compliance Disclaimer**
> This platform is developed strictly for academic machine learning research, educational visualization, and computational physics demonstration. It does NOT generate operational weapon guidance, targeting solutions, firing calculations, or real-world weapon optimization.

---

## Technical Stack & Architecture

- **Frontend**: React + Vite + TypeScript + Tailwind CSS + Framer Motion + Recharts + Three.js
- **Backend**: Python 3.11 + FastAPI + Pandas + NumPy + Scikit-Learn + Joblib + Pydantic
- **Model Storage**: Pre-trained Random Forest `.pkl` pipelines loaded via Scikit-Learn version compatibility patches.

---

## Core Modules & Capabilities

1. **Trajectory Prediction**: Predict Apex Height and Downrange Distance using Random Forest on initial launch velocity, angle, and gravity.
2. **Ballistic Performance**: Predict downrange velocity decay ($V_{100}, V_{200}$), kinetic energy drop ($E_{100}, E_{200}$), and bullet drop ($BD_{100}, BD_{200}$).
3. **V50 Penetration Velocity**: Estimate 50% armor perforation threshold velocity ($V_{50}$) based on projectile geometry and target plate mechanical properties.
4. **Interactive Simulator**: Real-time trajectory simulator featuring an animated 2D Canvas renderer, a Three.js 3D orbital camera view, and drag coefficient controls.
5. **Analytics Dashboard**: Exploratory Data Analysis (EDA) containing summary statistics, column profiling, and feature correlation heatmaps.
6. **Model Insights**: Model performance evaluation matrices comparing Random Forest, Decision Tree, Gradient Boosting, and Linear Regression with feature importance rankings.
7. **Dataset Explorer**: Paginated tabular browser for all 3 datasets (`accurate_ballastic.csv`, `ballistics_500.csv`, `REL_v50_database_20230527.csv`) with live search and CSV export.
8. **Prediction History**: Session prediction log with detail inspection, comparison mode, and JSON export.
9. **Deployment**: Containerized Docker and `docker-compose` production setup scripts.

---

## Running the Platform Locally

### 1. Start the Backend API (FastAPI)
```bash
# Navigate to project root
cd backend

# Start FastAPI dev server on port 8000
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Start the Frontend App (React + Vite)
```bash
# Navigate to frontend folder
cd frontend

# Install dependencies & run Vite dev server on port 5173
npm install
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## Docker Container Deployment

```bash
docker-compose up --build
```
