from pathlib import Path
import pickle
import re

from keras.models import load_model
from keras.preprocessing.sequence import pad_sequences

BASE_DIR = Path(__file__).resolve().parent
MODEL_CANDIDATES = [
    "spam_ham_classifier_attention_bilstm.keras",
    "spam_ham_classifier_bilstm.keras",
]
MAX_SEQUENCE_LENGTH = 100
PREDICTION_THRESHOLD = 0.5


def load_prediction_artifacts():
    model_path = next(
        (BASE_DIR / candidate for candidate in MODEL_CANDIDATES if (BASE_DIR / candidate).exists()),
        None,
    )
    if model_path is None:
        searched = ", ".join(MODEL_CANDIDATES)
        raise FileNotFoundError(f"No model file found. Expected one of: {searched}")

    tokenizer_path = BASE_DIR / "tokenizer.pkl"
    if not tokenizer_path.exists():
        raise FileNotFoundError("tokenizer.pkl was not found in the backend directory")

    with tokenizer_path.open("rb") as file_obj:
        tokenizer_obj = pickle.load(file_obj)

    loaded_model = load_model(model_path, compile=False)
    return loaded_model, tokenizer_obj, model_path.name

def clean_text(text):
    text = text.lower()
    text = re.sub(r"http\S+", "", text)   # remove links
    text = re.sub(r"[^a-zA-Z0-9\s]", "", text)  # remove special chars
    return text


model, tokenizer, loaded_model_name = load_prediction_artifacts()

def predict_spam(text):
    cleaned=clean_text(text)
    seq=tokenizer.texts_to_sequences([cleaned])
    padded_seq=pad_sequences(
        seq,
        maxlen=MAX_SEQUENCE_LENGTH,
        padding='post',
        truncating='post',
    )
    prob = model.predict(padded_seq, verbose=0)[0][0]
    confidence = prob if prob > PREDICTION_THRESHOLD else 1 - prob
    return {
        "prediction": "Spam" if prob > PREDICTION_THRESHOLD else "Ham",
        "probabilities": {
            "Spam": round(float(prob), 4), 
            "Ham": round(float(1 - prob), 4),
        },
        "confidence": round(float(confidence), 4),
        "threshold": PREDICTION_THRESHOLD,
        "model_name": loaded_model_name,
        "sequence_length": MAX_SEQUENCE_LENGTH,
    }
