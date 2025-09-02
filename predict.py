import re
import pickle
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.sequence import pad_sequences

try:
    model = load_model("spam_ham_classifier_bilstm.h5", compile=False)
except Exception as e:
    print(f"Error loading model: {e}")

with open("token.pkl","rb") as f:
    tokenizer=pickle.load(f)
    
def clean_text(text):
    text = text.lower()
    text = re.sub(r"http\S+", "", text)
    text = re.sub(r"[^a-zA-Z0-9\s]", "", text)
    return text 

def predict_spam(text):
    cleaned = clean_text(text)
    seq = tokenizer.texts_to_sequences([cleaned])
    padded = pad_sequences(seq, maxlen=100, padding='post', truncating='post')
    pred = model.predict(padded)[0][0]
    return "Spam" if pred > 0.5 else "Ham"

print(predict_spam("Congratulations! You've won a ₹5000 gift card."))
print(predict_spam("Hey, let's catch up later today."))