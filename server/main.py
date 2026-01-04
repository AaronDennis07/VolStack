from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List
import csv
import os
import joblib
import pandas as pd
import numpy as np
from datetime import datetime
from contextlib import asynccontextmanager
from arch import arch_model
from fastapi.middleware.cors import CORSMiddleware
from utils import read_csv_slice

# ======================================================
# 1. MODEL SERVICE & LIFESPAN
# ======================================================

class ModelService:
    def __init__(self):
        self.vol_model = None
        self.dir_model = None
        self.vol_features = []
        self.dir_features = []
        self.loaded = False

    def load_artifacts(self):
        """Loads trained models and feature lists."""
        print("Loading AI Models...")
        try:
            self.vol_model = joblib.load("vol_model_xgb.pkl")
            self.dir_model = joblib.load("dir_model_xgb.pkl")
            self.vol_features = joblib.load("vol_features.pkl")
            self.dir_features = joblib.load("dir_features.pkl")
            self.loaded = True
            print("AI Models loaded successfully.")
        except FileNotFoundError as e:
            print(f"WARNING: Model files not found ({e}). Prediction endpoint will fail.")
        except Exception as e:
            print(f"CRITICAL ERROR loading artifacts: {e}")

service = ModelService()

@asynccontextmanager
async def lifespan(app: FastAPI):
    service.load_artifacts()
    init_csv_files() 
    yield

app = FastAPI(title="Market Data Feed & AI API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ======================================================
# 2. FILE PATHS
# ======================================================
NIFTY_CSV_FILE = "./data/combined_sorted_data.csv"
VIX_CSV_FILE = "./data/combined_sorted_vix.csv"

# ======================================================
# 3. UTILS (File Ops)
# ======================================================

def validate_date(date_str: str):
    """Validates DD-MM-YYYY format."""
    try:
        datetime.strptime(date_str, "%d-%m-%Y")
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Date '{date_str}' must be in DD-MM-YYYY format"
        )

def init_csv_files():
    """Creates empty CSVs with headers if they don't exist."""
    os.makedirs("./data", exist_ok=True)
    
    if not os.path.exists(NIFTY_CSV_FILE):
        with open(NIFTY_CSV_FILE, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["Date", "Open", "High", "Low", "Close", "Shares Traded", "Turnover (₹ Cr)"])

    if not os.path.exists(VIX_CSV_FILE):
        with open(VIX_CSV_FILE, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["Date", "Open", "High", "Low", "Close", "Prev. Close", "Change", "% Change"])

# ======================================================
# 4. DATA MODELS
# ======================================================
class NiftyRow(BaseModel):
    Date: str
    Open: float
    High: float
    Low: float
    Close: float
    Shares_Traded: int = Field(..., alias="Shares Traded")
    Turnover_Cr: float = Field(..., alias="Turnover (₹ Cr)")

class VixRowInput(BaseModel):
    Date: str
    Open: float
    High: float
    Low: float
    Close: float
    Prev_Close: float = Field(..., alias="Prev. Close")

# ======================================================
# 5. UPDATED FEED ENDPOINTS (UPSERT LOGIC)
# ======================================================

@app.post("/feed/nifty")
def feed_nifty(rows: List[NiftyRow]):
    if not rows: raise HTTPException(status_code=400, detail="No rows provided")
    
    # 1. Load Existing Data
    try:
        # Read with DayFirst=True to handle DD-MM-YYYY correctly
        df = pd.read_csv(NIFTY_CSV_FILE, parse_dates=["Date"], dayfirst=True)
        if "Date" in df.columns:
            df.set_index("Date", inplace=True)
    except Exception:
        # Fallback if file is corrupted or empty
        df = pd.DataFrame()

    # 2. Update / Insert Rows
    for row in rows:
        validate_date(row.Date)
        dt = pd.to_datetime(row.Date, dayfirst=True)
        
        # Uses .loc[dt] to overwrite if exists, or create if new
        df.loc[dt, "Open"] = row.Open
        df.loc[dt, "High"] = row.High
        df.loc[dt, "Low"] = row.Low
        df.loc[dt, "Close"] = row.Close
        df.loc[dt, "Shares Traded"] = row.Shares_Traded
        df.loc[dt, "Turnover (₹ Cr)"] = row.Turnover_Cr

    # 3. Sort & Save
    df.sort_index(inplace=True)
    
    # Reset index to turn 'Date' back into a column
    df.reset_index(inplace=True)
    
    # Format Date specifically as DD-MM-YYYY strings
    df["Date"] = df["Date"].dt.strftime("%d-%m-%Y")
    
    # Write full file
    df.to_csv(NIFTY_CSV_FILE, index=False)
    
    return {"status": "success", "rows_processed": len(rows), "action": "upsert"}

@app.post("/feed/vix")
def feed_vix(rows: List[VixRowInput]):
    if not rows: raise HTTPException(status_code=400, detail="No rows provided")

    # 1. Load Existing Data
    try:
        df = pd.read_csv(VIX_CSV_FILE, parse_dates=["Date"], dayfirst=True)
        if "Date" in df.columns:
            df.set_index("Date", inplace=True)
    except Exception:
        df = pd.DataFrame()

    # 2. Update / Insert Rows
    for row in rows:
        validate_date(row.Date)
        dt = pd.to_datetime(row.Date, dayfirst=True)
        
        # Calculate derived fields (same as before)
        change = round(row.Close - row.Prev_Close, 4)
        pct_change = round((change / row.Prev_Close) * 100, 2)

        # Upsert
        df.loc[dt, "Open"] = row.Open
        df.loc[dt, "High"] = row.High
        df.loc[dt, "Low"] = row.Low
        df.loc[dt, "Close"] = row.Close
        df.loc[dt, "Prev. Close"] = row.Prev_Close
        df.loc[dt, "Change"] = change
        df.loc[dt, "% Change"] = pct_change

    # 3. Sort & Save
    df.sort_index(inplace=True)
    df.reset_index(inplace=True)
    df["Date"] = df["Date"].dt.strftime("%d-%m-%Y")
    df.to_csv(VIX_CSV_FILE, index=False)

    return {"status": "success", "rows_processed": len(rows), "action": "upsert"}

@app.get("/data/nifty")
def get_nifty_data(days: int, from_: str = "end"):
    data = read_csv_slice(file_path=NIFTY_CSV_FILE, days=days, direction=from_)
    return {"symbol": "NIFTY", "rows_returned": len(data), "data": data}

@app.get("/data/vix")
def get_vix_data(days: int, from_: str = "end"):
    data = read_csv_slice(file_path=VIX_CSV_FILE, days=days, direction=from_)
    return {"symbol": "INDIA_VIX", "rows_returned": len(data), "data": data}

# ======================================================
# 6. AI & STRATEGY LOGIC (Unchanged)
# ======================================================

def feature_engineering(df):
    df = df.copy()
    
    # Basic Features
    df["Log_Ret"] = np.log(df["Close"] / df["Close"].shift(1))
    df["HV_5"] = df["Log_Ret"].rolling(5).std() * np.sqrt(252)
    df["HV_20"] = df["Log_Ret"].rolling(20).std() * np.sqrt(252)
    df["Range_Vol"] = np.log(df["High"] / df["Low"])

    tr = pd.concat([
        df["High"] - df["Low"],
        (df["High"] - df["Close"].shift(1)).abs(),
        (df["Low"] - df["Close"].shift(1)).abs()
    ], axis=1).max(axis=1)

    df["ATR_Pct"] = tr.rolling(14).mean() / df["Close"]

    sma = df["Close"].rolling(20).mean()
    std = df["Close"].rolling(20).std()
    df["BB_Width"] = ((sma + 2 * std) - (sma - 2 * std)) / sma
    df["Ret_Sq"] = df["Log_Ret"] ** 2

    # VIX Features
    df["VIX_Change"] = df["India_VIX"].pct_change()
    df["VIX_Momentum"] = df["VIX_Change"].rolling(3).mean()
    df["VIX_vs_HV"] = df["India_VIX"] / (df["HV_20"] * 100)
    
    # Direction Features
    df["Ret_5"] = df["Log_Ret"].rolling(5).sum()
    df["Ret_20"] = df["Log_Ret"].rolling(20).sum()
    df["Price_vs_SMA20"] = df["Close"] / df["Close"].rolling(20).mean() - 1
    df["Price_vs_SMA50"] = df["Close"] / df["Close"].rolling(50).mean() - 1
    df["Vol_Ratio"] = df["HV_5"] / df["HV_20"]
    df["Range_Spike"] = df["Range_Vol"] / df["HV_20"]
    df["Neg_Ret_Sq"] = np.minimum(df["Log_Ret"], 0) ** 2

    return df

def get_latest_garch(df):
    window = df["Log_Ret"].iloc[-1000:] * 100
    model = arch_model(window, mean="Zero", vol="Garch", p=1, q=1)
    res = model.fit(disp="off", show_warning=False)
    f = res.forecast(horizon=5)
    return np.sqrt(f.variance.iloc[-1].mean()) * np.sqrt(252) / 100

def get_strategy_output(pred_vol, bull_prob, current_vix, spot, trade_date):
    # Regimes
    vol_ratio = pred_vol / (current_vix / 100)
    if vol_ratio > 1.15: vreg = "RISING_VOL"
    elif vol_ratio < 0.85: vreg = "FALLING_VOL"
    else: vreg = "NEUTRAL_VOL"

    if bull_prob > 0.6: dreg = "BULLISH"
    elif bull_prob < 0.4: dreg = "BEARISH"
    else: dreg = "NEUTRAL"

    # Strategy Selection
    strat = "NO_TRADE"
    if vreg == "RISING_VOL":
        strat = "LONG_CALL" if dreg == "BULLISH" else "LONG_PUT" if dreg == "BEARISH" else "STRADDLE"
    elif vreg == "FALLING_VOL":
        strat = "BULL_PUT_SPREAD" if dreg == "BULLISH" else "BEAR_CALL_SPREAD" if dreg == "BEARISH" else "IRON_CONDOR"

    # Expiry
    exp_type = "WEEKLY" if pred_vol > 0.22 else "NEXT_WEEKLY" if pred_vol > 0.15 else "MONTHLY"
    
    date = pd.Timestamp(trade_date)
    days_to_thursday = (3 - date.weekday()) % 7 
    if days_to_thursday == 0: days_to_thursday = 7
    next_thursday = date + pd.Timedelta(days=days_to_thursday)

    if exp_type == "WEEKLY": exp_date = next_thursday
    elif exp_type == "NEXT_WEEKLY": exp_date = next_thursday + pd.Timedelta(days=7)
    elif exp_type == "MONTHLY":
        exp_date = date + pd.offsets.MonthEnd(0)
        while exp_date.weekday() != 3: exp_date -= pd.Timedelta(days=1)
    
    # Strikes
    atm = round(spot / 50) * 50
    legs = {}
    if strat == "LONG_CALL": legs = {"BUY_CALL": atm}
    elif strat == "LONG_PUT": legs = {"BUY_PUT": atm}
    elif strat == "STRADDLE": legs = {"BUY_CALL": atm, "BUY_PUT": atm}
    elif strat == "BULL_PUT_SPREAD": legs = {"SELL_PUT": atm, "BUY_PUT": atm - 300}
    elif strat == "BEAR_CALL_SPREAD": legs = {"SELL_CALL": atm, "BUY_CALL": atm + 300}
    elif strat == "IRON_CONDOR":
        legs = {"SELL_PUT": atm - 200, "BUY_PUT": atm - 400, "SELL_CALL": atm + 200, "BUY_CALL": atm + 400}

    return {
        "regime": {"volatility": vreg, "direction": dreg},
        "recommendation": {
            "strategy": strat,
            "expiry_type": exp_type,
            "expiry_date": str(exp_date.date()),
            "legs": legs
        }
    }

# ======================================================
# 7. PREDICTION ENDPOINT
# ======================================================

@app.get("/predict")
async def predict_market():
    if not service.loaded:
        raise HTTPException(status_code=503, detail="AI Models not loaded")

    # 1. READ & MERGE DATA
    try:
        # Load data fresh from disk to catch any recent updates
        nifty = pd.read_csv(NIFTY_CSV_FILE, parse_dates=["Date"], dayfirst=True)
        nifty = nifty.set_index("Date").sort_index()

        if os.path.exists(VIX_CSV_FILE):
            vix = pd.read_csv(VIX_CSV_FILE, parse_dates=["Date"], dayfirst=True)
            vix = vix.set_index("Date").sort_index()
            nifty = nifty.join(vix["Close"].rename("India_VIX"), how="left")
            nifty["India_VIX"] = nifty["India_VIX"].ffill()
        else:
            raise HTTPException(status_code=404, detail="VIX Data missing")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading CSVs: {str(e)}")

    # 2. FEATURE ENGINEERING
    try:
        df_feat = feature_engineering(nifty)
        latest_garch = get_latest_garch(df_feat)
        df_feat["Log_GARCH_Vol"] = np.nan
        df_feat.iloc[-1, df_feat.columns.get_loc("Log_GARCH_Vol")] = np.log(latest_garch)
        latest = df_feat.iloc[[-1]].copy()
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Feature Calculation Failed: {str(e)}")

    # 3. PREDICT
    try:
        X_vol = latest[service.vol_features]
        log_vol_pred = service.vol_model.predict(X_vol)[0]
        vol_pred = np.exp(log_vol_pred)

        latest["Log_Pred_Vol"] = log_vol_pred
        X_dir = latest[service.dir_features]
        bull_prob = service.dir_model.predict_proba(X_dir)[0][1]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference Failed: {str(e)}")

    # 4. STRATEGY RESULT
    spot = float(latest["Close"].iloc[0])
    vix_val = float(latest["India_VIX"].iloc[0])
    trade_date = latest.index[0]
    
    res = get_strategy_output(vol_pred, bull_prob, vix_val, spot, trade_date)
    
    return {
        "date": str(trade_date.date()),
        "nifty_spot": spot,
        "india_vix": vix_val,
        "metrics": {
            "predicted_annualized_vol": float(round(vol_pred, 4)),
            "bull_probability": float(round(bull_prob, 4))
        },
        **res
    }