import React,{useState} from "react"; 
import axios from "axios";
import {Pie} from "react-chartjs-2";
import "chart.js/auto";

function PredictionForm(){
    const [text,setText]=useState(""); //user input
    const [result,setResult]=useState(null);    //Api response 
    const [loading,setLoading]=useState(false);     //loading state 

    //handle form submit
    const handleSubmit=async (e)=>{
        e.preventDefault();
        setLoading(true)
        try{
            const response=await axios.post("http://127.0.0.1:8000/predict",{
                message:text,
            });
            setResult(response.data);
        }
        catch(error){
            console.error("Error:",error);
            alert("Something went wrong with API call");
        }
        setLoading(false);
    }; 

    const handleFeedback=async (label)=>{
        try{
            await axios.post("http://127.0.0.1:8000/feedback",{
                message:text,
                label:label,
        });
        alert("Thanks for the feedback");
        }
        catch(error){
            console.error("Error saving feedback:",error);
        }
    }
    const charData=result ? {
        labels:["Spam","Ham"],
        datasets:[
            {
                data:[
                    result.probability.Spam *100,
                    result.probability.Ham *100
                ],
                backgroundColor:["#ff4d4d","#4CAF50"],
            },
        ],
    }:null;

    return (
        <div style={{ maxWidth: "500px", margin: "auto", padding: "20px" }}>
            <form onSubmit={handleSubmit}>
                <textarea rows="4" placeholder="Enter your message..." value={text} onChange={(e)=>setText(e.target.value)}
                required style={{ width: "100%", padding: "10px", fontSize: "16px" }} />
                <br/>
                <button type="submit" disabled={loading} style={{
            marginTop: "10px",
            padding: "10px 20px",
            fontSize: "16px",
            cursor: "pointer",
        }}>
                    {loading?"Checking...":"Check Spam"}
                </button>
            </form>
            {result &&(
                <div style={{marginTop:"20px" ,textAlign: "center"}}>
                    <h3>Prediction: {result.label}</h3>
                        <p>Spam: {(result.probability.Spam * 100).toFixed(2)}%</p>
                        <p>Ham: {(result.probability.Ham * 100).toFixed(2)}%</p>
                <div style={{width:"300px",margin:"auto", marginTop: "20px"}}>
                    <Pie data={charData}/>
                </div>
                {/* Feedback buttons */}
        <div style={{ marginTop: "15px" }}>
            <p>Was this prediction correct?</p>
            <button onClick={() => handleFeedback("Spam")}>Mark as Spam</button>
            <button onClick={() => handleFeedback("Ham")}>Mark as Ham</button>
        </div>
                </div>
            )}
        </div>
    );
}

export default PredictionForm;