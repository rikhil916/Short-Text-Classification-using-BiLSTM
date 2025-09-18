from fastapi import FastAPI 
#we can create an API with endpoints.
from pydantic import BaseModel
#define the structure of the data you expect from the user (e.g., JSON input).
from fastapi.middleware.cors import CORSMiddleware
from predict import predict_spam
    
app=FastAPI()     


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

@app.get("/") 
def home():
    return {"message": "Spam Classifier API is running"}

@app.post("/predict")
def predict(data:TextIn):
    result_dict = predict_spam(data.message)
    return {
        "label": result_dict["prediction"],
        "probability": result_dict["probabilities"]
    }


    