import React, { useState } from "react";
import axios from "axios";
import { Pie } from "react-chartjs-2";
import "chart.js/auto";
import { motion } from "framer-motion";
import ClipLoader from "react-spinners/ClipLoader";

function PredictionForm() {
const [text, setText] = useState("");
const [result, setResult] = useState(null);
const [loading, setLoading] = useState(false);

const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        const response = await axios.post("http://127.0.0.1:8000/predict", {
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
    await axios.post("http://127.0.0.1:8000/feedback", {
        message: text,
        label: label,
    });
    alert("Thanks for the feedback!");
    } catch (error) {
        console.error("Error saving feedback:", error);
    }
    };

const charData = result
    ? {
        labels: ["Spam", "Ham"],
        datasets: [
        {
            data: [result.probability.Spam * 100, result.probability.Ham * 100],
            backgroundColor: ["#ff4d4d", "#4CAF50"],
        },
        ],
    }
    : null;

return (
    <div
    style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
    }}
    >
    <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        style={{
            maxWidth: "500px",
            width: "100%",
            padding: "30px",
            borderRadius: "15px",
            boxShadow: "0 15px 40px rgba(0,0,0,0.5)",
            backgroundColor: "#1c1c1c",
            color: "#fff",
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        }}
    >
        <h1 style={{ textAlign: "center", marginBottom: "20px" }}>Spam Classifier</h1>
        <form onSubmit={handleSubmit}>
            <textarea
            rows="4"
            placeholder="Enter your message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
            style={{
            width: "100%",
            padding: "12px",
            fontSize: "16px",
            borderRadius: "8px",
            border: "1px solid #444",
            backgroundColor: "#2c2c2c",
            color: "#fff",
            resize: "none",
            }}
        />
        <button
            type="submit"
            disabled={loading}
            style={{
                marginTop: "15px",
                width: "100%",
                padding: "12px",
                fontSize: "16px",
                cursor: "pointer",
                borderRadius: "8px",
                border: "none",
                background: "linear-gradient(90deg, #ff4d4d, #ff1a1a)",
                color: "white",
                transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => (e.target.style.opacity = 0.85)}
            onMouseLeave={(e) => (e.target.style.opacity = 1)}
        >
            {loading ? <ClipLoader color="#fff" size={20} /> : "Check Spam"}
        </button>
        </form>

        {result && (
            <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ marginTop: "30px", textAlign: "center" }}
        >
            <h3 style={{ fontSize: "22px" }}>Prediction: {result.label}</h3>
            <p>
              Spam: {(result.probability.Spam * 100).toFixed(2)}% | Ham:{" "}
              {(result.probability.Ham * 100).toFixed(2)}%
            </p>

            <div style={{ width: "300px", margin: "20px auto" }}>
            <Pie data={charData} />
            </div>

            <div style={{ marginTop: "20px" }}>
            <p>Was this prediction correct?</p>
            <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                <button
                onClick={() => handleFeedback("Spam")}
                style={{
                    padding: "10px 15px",
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                    backgroundColor: "#ff4d4d",
                    color: "white",
                    transition: "0.3s",
                }}
                onMouseEnter={(e) => (e.target.style.opacity = 0.85)}
                onMouseLeave={(e) => (e.target.style.opacity = 1)}
                >
                Mark as Spam
                </button>
                <button
                onClick={() => handleFeedback("Ham")}
                style={{
                    padding: "10px 15px",
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                    backgroundColor: "#4CAF50",
                    color: "white",
                    transition: "0.3s",
                }}
                onMouseEnter={(e) => (e.target.style.opacity = 0.85)}
                onMouseLeave={(e) => (e.target.style.opacity = 1)}
                >
                Mark as Ham
                </button>
            </div>
            </div>
        </motion.div>
        )}
    </motion.div>
    </div>
  );
}

export default PredictionForm;
