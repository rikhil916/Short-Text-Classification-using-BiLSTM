from keras.models import load_model 
from keras.preprocessing.sequence import pad_sequences
import re
import tensorflow as tf
from keras.models import load_model
import pickle

# Load model once when the app starts
model=load_model("spam_ham_classifier_bilstm.keras")

with open("tokenizer.pkl", "rb") as f:
    tokenizer = pickle.load(f)
    
def clean_text(text):
    text = text.lower()
    text = re.sub(r"http\S+", "", text)   # remove links
    text = re.sub(r"[^a-zA-Z0-9\s]", "", text)  # remove special chars
    return text

def predict_spam(text):
    cleaned=clean_text(text)
    seq=tokenizer.texts_to_sequences([cleaned])
    padded_seq=pad_sequences(seq,maxlen=100,padding='post',truncating='post')
    prob = model.predict(padded_seq, verbose=0)[0][0]
    return {
        "prediction": "Spam" if prob > 0.5 else "Ham",
        "probabilities": {
            "Spam": round(float(prob), 4), 
            "Ham": round(float(1 - prob), 4),
        }
    }