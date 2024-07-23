import { useRef, useState, useEffect } from "react";
import React from "react";
import axios from "axios";
import "./index.css";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

const App = () => {
  const [textMsg, settextMsg] = useState("");
  const [response, SetResponse] = useState([]);
  const messagescontainerref = useRef(null);
  const {
    transcript,
    browserSupportsSpeechRecognition,
    listening,
    resetTranscript,
  } = useSpeechRecognition();

  useEffect(() => {
    if (transcript) {
      settextMsg(transcript);
    }
    if (!listening && transcript) {
      fetchData(transcript);
    }
  }, [transcript, listening]);

  const fetchData = async (y) => {
    settextMsg("");
    if (y.trim() === "") return; // Use trim() to handle empty input

    const usersend = {
      sender: "user",
      text: y,
      index: y.length,
    };
    SetResponse((prevmessage) => [...prevmessage, usersend]);

    try {
      const x = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.REACT_APP_CHAT_KEY}`,
        {
          contents: [{ parts: [{ text: y }] }],
        }
      );
      const result = x.data.candidates?.[0]?.content?.parts[0]?.text;
      const botresponse = {
        sender: "bot",
        text: result || "Error fetching response",
        index: y.length + 1,
      };
      SetResponse((prevmessage) => [...prevmessage, botresponse]);
      resetTranscript();
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (response.length > 0) {
      const lastmessage = response[response.length - 1];
      const lastindexmessage = messagescontainerref.current.querySelector(
        `[data-index="${lastmessage.index}"]`
      );
      if (lastindexmessage) {
        lastindexmessage.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [response]);

  const startListening = () => {
    SpeechRecognition.startListening({ continuous: false });
  };

  if (!browserSupportsSpeechRecognition) {
    return <div>Your browser doesn't support speech recognition</div>;
  }

  return (
    <div className="center-container">
      <div className="chat-container">
        <h1>Chat with AI</h1>
        <div className="chat-box">
          <div className="messages" ref={messagescontainerref}>
            <div className="message bot-message">
              Hi 👋, How can I assist you today?
            </div>
            {response.map((message, index) => (
              <div
                key={index}
                data-index={message.index}
                className={`message ${
                  message.sender === "user" ? "user-message" : "bot-message"
                }`}
              >
                {message.text}
              </div>
            ))}
          </div>
          <div className="chat-input">
            <input
              value={textMsg}
              type="text"
              placeholder="Ask me anything..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  fetchData(textMsg);
                }
              }}
              onChange={(e) => settextMsg(e.target.value)}
            />
            <button onClick={() => fetchData(textMsg)}>Send</button>
            <button onClick={startListening}>
              <i className="fa fa-microphone" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
