import json
import pickle
import re
from pathlib import Path

import numpy as np
import pandas as pd
import tensorflow as tf
from sklearn.metrics import accuracy_score, confusion_matrix, f1_score, precision_score, recall_score
from sklearn.model_selection import train_test_split
from tensorflow.keras.callbacks import EarlyStopping
from tensorflow.keras.layers import (
    Attention,
    Bidirectional,
    Dense,
    Dropout,
    Embedding,
    GlobalAveragePooling1D,
    Input,
    LSTM,
)
from tensorflow.keras.metrics import AUC, BinaryAccuracy, Precision, Recall
from tensorflow.keras.models import Model
from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.keras.preprocessing.text import Tokenizer

CURRENT_FILE = Path(__file__).resolve() if "__file__" in globals() else Path.cwd() / "attention_bi_lstm.py"
BASE_DIR = CURRENT_FILE.parent
VOCAB_SIZE = 5000
MAX_SEQUENCE_LENGTH = 100
EMBEDDING_DIM = 128
LSTM_UNITS = 64
BATCH_SIZE = 32
EPOCHS = 20
SEED = 42
MODEL_FILENAME = "spam_ham_classifier_attention_bilstm.keras"
TOKENIZER_FILENAME = "tokenizer.pkl"
METRICS_FILENAME = "model_metrics.json"


def clean_text(text):
    text = str(text).lower()
    text = re.sub(r"http\S+", "", text)
    text = re.sub(r"[^a-zA-Z0-9\s]", "", text)
    return text


def find_existing_path(*candidates):
    for candidate in candidates:
        path = Path(candidate)
        if path.exists():
            return path
    return None


def load_training_frame():
    spam_path = find_existing_path(
        BASE_DIR / "notebooks" / "spam.csv",
        BASE_DIR / "spam.csv",
        Path.cwd() / "spam.csv",
        Path.cwd() / "backend" / "notebooks" / "spam.csv",
    )
    if spam_path is None:
        raise FileNotFoundError(
            "spam.csv not found. Put it beside this script or in notebooks/spam.csv before training."
        )

    spam = pd.read_csv(spam_path, encoding="latin1")
    spam = spam[["v1", "v2"]]
    spam.columns = ["label", "text"]

    feedback_path = find_existing_path(
        BASE_DIR / "feedback.csv",
        Path.cwd() / "feedback.csv",
        Path.cwd() / "backend" / "feedback.csv",
    )
    if feedback_path is not None and feedback_path.stat().st_size > 0:
        feedback = pd.read_csv(feedback_path, encoding="latin1")
        feedback = feedback[["label", "message"]]
        feedback.columns = ["label", "text"]
        df = pd.concat([spam, feedback], ignore_index=True)
    else:
        df = spam.copy()

    df["label"] = df["label"].astype(str).str.lower().map({"ham": 0, "spam": 1})
    df = df.dropna(subset=["label"])
    df["label"] = df["label"].astype(int)
    df["cleaned_text"] = df["text"].apply(clean_text)
    return df


def build_attention_bilstm():
    inputs = Input(shape=(MAX_SEQUENCE_LENGTH,), name="tokens")
    embedding = Embedding(
        input_dim=VOCAB_SIZE,
        output_dim=EMBEDDING_DIM,
        name="embedding",
    )(inputs)
    bilstm = Bidirectional(
        LSTM(LSTM_UNITS, return_sequences=True),
        name="bidirectional_lstm",
    )(embedding)
    attention = Attention(name="self_attention")([bilstm, bilstm])
    pooled = GlobalAveragePooling1D(name="sequence_pool")(attention)
    dropout = Dropout(0.5, name="dropout")(pooled)
    dense = Dense(32, activation="relu", name="dense_projection")(dropout)
    outputs = Dense(1, activation="sigmoid", name="spam_probability")(dense)
    return Model(inputs=inputs, outputs=outputs, name="attention_bilstm_classifier")


def export_metrics(history, y_true, y_pred_labels, y_pred_scores):
    y_true = np.asarray(y_true).astype("int32")
    y_pred_labels = np.asarray(y_pred_labels).astype("int32")
    y_pred_scores = np.asarray(y_pred_scores).astype("float32")
    matrix = confusion_matrix(y_true, y_pred_labels)
    tn, fp, fn, tp = matrix.ravel()

    best_epoch = int(np.argmin(history.history["val_loss"])) + 1
    auc_metric = tf.keras.metrics.AUC()
    auc_metric.update_state(y_true, y_pred_scores)

    payload = {
        "model_name": "Attention BiLSTM",
        "status": "ready",
        "message": "Metrics exported from Google Colab training run.",
        "artifacts": {
            "model_file": MODEL_FILENAME,
            "tokenizer_file": TOKENIZER_FILENAME,
        },
        "metrics": {
            "accuracy": round(float(accuracy_score(y_true, y_pred_labels)), 4),
            "precision": round(float(precision_score(y_true, y_pred_labels, zero_division=0)), 4),
            "recall": round(float(recall_score(y_true, y_pred_labels, zero_division=0)), 4),
            "f1_score": round(float(f1_score(y_true, y_pred_labels)), 4),
            "auc": round(float(auc_metric.result().numpy()), 4),
        },
        "confusion_matrix": {
            "true_positive": int(tp),
            "true_negative": int(tn),
            "false_positive": int(fp),
            "false_negative": int(fn),
        },
        "training": {
            "epochs": len(history.history["loss"]),
            "best_epoch": best_epoch,
            "batch_size": BATCH_SIZE,
            "validation_split": 0.2,
        },
        "notes": [
            "Copy spam_ham_classifier_attention_bilstm.keras, tokenizer.pkl, and model_metrics.json into backend/ after Colab training."
        ],
    }

    with (BASE_DIR / METRICS_FILENAME).open("w", encoding="utf-8") as file_obj:
        json.dump(payload, file_obj, indent=2)


def main():
    tf.keras.utils.set_random_seed(SEED)
    df = load_training_frame()

    tokenizer = Tokenizer(num_words=VOCAB_SIZE, oov_token="<OOV>")
    tokenizer.fit_on_texts(df["cleaned_text"])
    sequences = tokenizer.texts_to_sequences(df["cleaned_text"])
    padded = pad_sequences(
        sequences,
        maxlen=MAX_SEQUENCE_LENGTH,
        padding="post",
        truncating="post",
    )

    X_train, X_test, y_train, y_test = train_test_split(
        padded,
        df["label"].values,
        test_size=0.2,
        random_state=42,
        stratify=df["label"].values,
    )

    model = build_attention_bilstm()
    model.compile(
        loss="binary_crossentropy",
        optimizer="adam",
        metrics=[
            BinaryAccuracy(name="accuracy"),
            Precision(name="precision"),
            Recall(name="recall"),
            AUC(name="auc"),
        ],
    )

    early_stopping = EarlyStopping(
        patience=4,
        restore_best_weights=True,
        monitor="val_loss",
    )

    history = model.fit(
        X_train,
        y_train,
        validation_data=(X_test, y_test),
        epochs=EPOCHS,
        batch_size=BATCH_SIZE,
        callbacks=[early_stopping],
    )

    y_pred_scores = model.predict(X_test, verbose=0).ravel()
    y_pred_labels = (y_pred_scores > 0.5).astype(int)

    model.save(BASE_DIR / MODEL_FILENAME)
    with (BASE_DIR / TOKENIZER_FILENAME).open("wb") as file_obj:
        pickle.dump(tokenizer, file_obj)

    export_metrics(history, y_test, y_pred_labels, y_pred_scores)

    print(f"Saved model to: {BASE_DIR / MODEL_FILENAME}")
    print(f"Saved tokenizer to: {BASE_DIR / TOKENIZER_FILENAME}")
    print(f"Saved metrics to: {BASE_DIR / METRICS_FILENAME}")


if __name__ == "__main__":
    main()
