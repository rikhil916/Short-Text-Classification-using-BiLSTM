import React, { useEffect, useState } from "react";
import axios from "axios";
import ClipLoader from "react-spinners/ClipLoader";

const API_BASE_URL = "http://127.0.0.1:8000";
const SAMPLE_MESSAGES = [
  "Congratulations! You won a free trip. Call now to claim the reward.",
  "Hi, the project sync is at 4 PM. Please bring the updated deck.",
  "URGENT: verify your bank account immediately to avoid suspension.",
];

function PredictionForm() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modelMetrics, setModelMetrics] = useState(null);
  const [metricsError, setMetricsError] = useState("");

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/model-metrics`);
        setModelMetrics(response.data);
        setMetricsError("");
      } catch (error) {
        console.error("Error loading model metrics:", error);
        setMetricsError("Model metrics are unavailable until the backend is running.");
      }
    };

    fetchMetrics();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/predict`, {
        message: text,
      });
      setResult(response.data);
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong with API call");
    }
    setLoading(false);
  };

  const handleFeedback = async (label) => {
    try {
      await axios.post(`${API_BASE_URL}/feedback`, {
        message: text,
        label,
      });
      alert("Thanks for the feedback!");
    } catch (error) {
      console.error("Error saving feedback:", error);
    }
  };

  const charCount = text.trim().length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const linkCount = (text.match(/https?:\/\/\S+/gi) || []).length;
  const emphasisCount = (text.match(/[A-Z]{2,}|!+/g) || []).length;
  const confidencePercent = result ? (result.confidence * 100).toFixed(1) : null;
  const activeStatusClass = modelMetrics?.status === "ready" ? "status-ready" : "status-pending";

  const formatMetric = (value) =>
    value === null || value === undefined ? "--" : `${(value * 100).toFixed(2)}%`;

  return (
    <div className="dashboard">
      <header
        className="intro"
      >

        <div>
          <h1>Accurate short text classifier.</h1>
          <p className="intro-copy">
          </p>
        </div>

        <div className="intro-meta">
          <div className="sample-row">
            {SAMPLE_MESSAGES.map((message) => (
              <button
                key={message}
                type="button"
                className={`sample-chip ${text === message ? "active" : ""}`}
                onClick={() => setText(message)}
              >
                {message.length > 42 ? `${message.slice(0, 42)}...` : message}
              </button>
            ))}
          </div>
          <p className="muted small">
            Status: {modelMetrics?.status ?? "backend unavailable"}
          </p>
        </div>
      </header>

      <div className="content-grid">
        <div className="stack">
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2 className="panel-title">Analyze Message</h2>
                <p className="muted small">
                  SMS, email snippets, and short-form chat text work best here.
                </p>
              </div>
              <button className="ghost-button" type="button" onClick={() => setText("")}>
                Clear
              </button>
            </div>

            <form className="composer" onSubmit={handleSubmit}>
              <textarea
                placeholder="Paste a message to classify."
                value={text}
                onChange={(e) => setText(e.target.value)}
                required
              />

              <div className="micro-metrics">
                <div className="metric-chip">
                  <span className="metric-label">Characters</span>
                  <span className="metric-value">{charCount}</span>
                </div>
                <div className="metric-chip">
                  <span className="metric-label">Words</span>
                  <span className="metric-value">{wordCount}</span>
                </div>
                <div className="metric-chip">
                  <span className="metric-label">Links</span>
                  <span className="metric-value">{linkCount}</span>
                </div>
                <div className="metric-chip">
                  <span className="metric-label">Urgency cues</span>
                  <span className="metric-value">{emphasisCount}</span>
                </div>
              </div>

              <div className="button-row">
                <button className="primary-button" type="submit" disabled={loading}>
                  {loading ? <ClipLoader color="#fffdf9" size={18} /> : "Run classification"}
                </button>
                <p className="muted small">
                  Feedback buttons appear after a prediction.
                </p>
              </div>
            </form>
          </section>

          <section className="panel">
            {result ? (
              <div className="result-card">
                <div className="result-head">
                  <div>
                    <p className="muted small">Prediction</p>
                    <h2 className="panel-title">
                      {result.label === "Spam"
                        ? "Likely spam content"
                        : "Likely legitimate content"}
                    </h2>
                    <p className="muted small">
                      {result.model_name} · threshold {result.threshold}
                    </p>
                  </div>
                  <span className={`result-badge ${result.label.toLowerCase()}`}>
                    {result.label}
                  </span>
                </div>

                <div className="score-block">
                  <div className="score-row">
                    <span className="metric-label">Confidence</span>
                    <strong>{confidencePercent}%</strong>
                  </div>
                  <div className="score-track">
                    <div
                      className="score-fill"
                      style={{ width: `${result.confidence * 100}%` }}
                    />
                  </div>
                </div>

                <div className="probability-list">
                  <div>
                    <div className="score-row">
                      <span className="metric-label">Spam probability</span>
                      <strong>{(result.probability.Spam * 100).toFixed(2)}%</strong>
                    </div>
                    <div className="probability-track">
                      <div
                        className="probability-fill spam"
                        style={{ width: `${result.probability.Spam * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="score-row">
                      <span className="metric-label">Ham probability</span>
                      <strong>{(result.probability.Ham * 100).toFixed(2)}%</strong>
                    </div>
                    <div className="probability-track">
                      <div
                        className="probability-fill ham"
                        style={{ width: `${result.probability.Ham * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="feedback-row">
                  <button
                    type="button"
                    className="feedback-button spam"
                    onClick={() => handleFeedback("Spam")}
                  >
                    Mark as Spam
                  </button>
                  <button
                    type="button"
                    className="feedback-button ham"
                    onClick={() => handleFeedback("Ham")}
                  >
                    Mark as Ham
                  </button>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                Run a classification to see the model label, confidence, and feedback actions.
              </div>
            )}
          </section>
        </div>

        <aside className="sidebar">
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2 className="panel-title">Model Snapshot</h2>
                <p className="muted small">
                  Live values from <code>backend/model_metrics.json</code>.
                </p>
              </div>
            </div>

            <div className="status-card">
              <span className="metric-label">Model status</span>
              <strong className={activeStatusClass}>
                {modelMetrics?.status ?? "backend unavailable"}
              </strong>
              <p className="muted small">
                {metricsError || modelMetrics?.message || "No metrics returned yet."}
              </p>
            </div>

            <div className="metrics-grid" style={{ marginTop: "14px" }}>
              <div className="metric-card">
                <span className="metric-label">Accuracy</span>
                <span className="metric-value">
                  {formatMetric(modelMetrics?.metrics?.accuracy)}
                </span>
              </div>
              <div className="metric-card">
                <span className="metric-label">Precision</span>
                <span className="metric-value">
                  {formatMetric(modelMetrics?.metrics?.precision)}
                </span>
              </div>
              <div className="metric-card">
                <span className="metric-label">Recall</span>
                <span className="metric-value">
                  {formatMetric(modelMetrics?.metrics?.recall)}
                </span>
              </div>
              <div className="metric-card">
                <span className="metric-label">F1 score</span>
                <span className="metric-value">
                  {formatMetric(modelMetrics?.metrics?.f1_score)}
                </span>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-head">
              <div>
                <h2 className="panel-title">Confusion Matrix</h2>
                <p className="muted small">Compact summary of validation outcomes.</p>
              </div>
            </div>

            <div className="confusion-grid">
              <div className="confusion-card">
                <span className="metric-label">True positive</span>
                <span className="metric-value">
                  {modelMetrics?.confusion_matrix?.true_positive ?? "--"}
                </span>
              </div>
              <div className="confusion-card">
                <span className="metric-label">True negative</span>
                <span className="metric-value">
                  {modelMetrics?.confusion_matrix?.true_negative ?? "--"}
                </span>
              </div>
              <div className="confusion-card">
                <span className="metric-label">False positive</span>
                <span className="metric-value">
                  {modelMetrics?.confusion_matrix?.false_positive ?? "--"}
                </span>
              </div>
              <div className="confusion-card">
                <span className="metric-label">False negative</span>
                <span className="metric-value">
                  {modelMetrics?.confusion_matrix?.false_negative ?? "--"}
                </span>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-head">
              <div>
                <h2 className="panel-title">Deployment Notes</h2>
                <p className="muted small">Training context and current exported artifacts.</p>
              </div>
            </div>

            <div className="notes-list">
              <div className="note-row">
                <span className="metric-label">Architecture</span>
                <strong>{modelMetrics?.model_name ?? "Attention BiLSTM"}</strong>
              </div>
              <div className="note-row">
                <span className="metric-label">Best epoch</span>
                <strong>{modelMetrics?.training?.best_epoch ?? "--"}</strong>
              </div>
              <div className="note-row">
                <span className="metric-label">Epochs tracked</span>
                <strong>{modelMetrics?.training?.epochs ?? "--"}</strong>
              </div>
              <div className="note-row">
                <span className="metric-label">Batch size</span>
                <strong>{modelMetrics?.training?.batch_size ?? 32}</strong>
              </div>
              <div className="note-row">
                <span className="metric-label">AUC</span>
                <strong>{formatMetric(modelMetrics?.metrics?.auc)}</strong>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default PredictionForm;
