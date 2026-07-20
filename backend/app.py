import csv
import json
import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from predict import predict_spam
from translate import translate

app=FastAPI()     
BASE_DIR = Path(__file__).resolve().parent
METRICS_PATH = BASE_DIR / "model_metrics.json"


# Allow CORS from your frontend origin
origins = [
    "http://localhost:5173",  # React dev server
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,        # Allow these origins
    allow_credentials=True,
    allow_methods=["*"],          # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],          # Allow all headers
)

# Define input schema
class TextIn(BaseModel):
    
    message : str

class FeedbackIn(BaseModel):
    message: str
    label: str


def load_model_metrics():
    if not METRICS_PATH.exists():
        return {
            "model_name": "Attention BiLSTM",
            "status": "pending_training",
            "message": "Train the attention BiLSTM in Colab and replace backend/model_metrics.json with the exported metrics.",
            "metrics": {
                "accuracy": None,
                "precision": None,
                "recall": None,
                "f1_score": None,
                "auc": None,
            },
            "confusion_matrix": {
                "true_positive": None,
                "true_negative": None,
                "false_positive": None,
                "false_negative": None,
            },
        }

    with METRICS_PATH.open("r", encoding="utf-8") as file_obj:
        return json.load(file_obj)
    
@app.get("/") 
def home():
    return {"message": "Spam Classifier API is running"}


@app.get("/model-metrics")
def model_metrics():
    return load_model_metrics()

@app.post("/predict")
def predict(data:TextIn):
    text=translate(data.message)
    print(text)
    result_dict = predict_spam(text)
    return {
        "label": result_dict["prediction"],
        "probability": result_dict["probabilities"],
        "confidence": result_dict["confidence"],
        "threshold": result_dict["threshold"],
        "model_name": result_dict["model_name"],
        "sequence_length": result_dict["sequence_length"],
    }
    
@app.post("/feedback")
def save_feedback(feedback:FeedbackIn):
    feedback_path = BASE_DIR / "feedback.csv"
    file_exists=os.path.isfile(feedback_path)
    
    with open(feedback_path,mode="a",newline='') as f:
        writer=csv.writer(f)
        if not file_exists:
            writer.writerow(["message","label"])
        writer.writerow([translate(feedback.message),feedback.label])
    
    return {"message":"Feedback saved successfully!"}


    
