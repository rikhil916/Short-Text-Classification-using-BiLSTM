from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.keras.preprocessing.text import tokenizer_from_json
import json
import re
import tensorflow as tf
import keras
print(tf.__version__)
print(keras.__version__)

from keras.models import load_model
import pickle

model = load_model("spam_ham_classifier_bilstm.keras")

with open("tokenizer.pkl", "rb") as f:
    tokenizer = pickle.load(f)


# Clean text function
def clean_text(text):
    text = text.lower()
    text = re.sub(r"http\S+", "", text)
    text = re.sub(r"[^a-zA-Z0-9\s]", "", text)
    return text

# Prediction function
def predict_spam(text):
    cleaned = clean_text(text)
    seq = tokenizer.texts_to_sequences([cleaned])
    padded_seq = pad_sequences(seq, maxlen=100, padding='post', truncating='post')
    pred = model.predict(padded_seq)[0][0]
    return "Spam" if pred > 0.5 else "Ham"

# Example
print(predict_spam("Congratulations! You've won a free iPhone!"))
