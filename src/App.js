import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import "./index.css";

const App = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const {
    transcript,
    browserSupportsSpeechRecognition,
    listening,
    resetTranscript,
  } = useSpeechRecognition();

  // Wrap sendMessage in useCallback
  const sendMessage = useCallback(
    async (message) => {
      setInput("");
      if (!message.trim()) return;

      const userMessage = { sender: "user", text: message };
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      console.log(process.env.REACT_APP_CHAT_KEY);

      try {
        const { data } = await axios({
          url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.REACT_APP_CHAT_KEY}`,
          method: "post",
          data: {
            contents: [{ parts: [{ text: message }] }],
          },
        });
        const text = data.candidates?.[0]?.content?.parts[0]?.text;
        const botMessage = {
          sender: "bot",
          text: text || "Error fetching response",
        };
        setMessages((prevMessages) => [...prevMessages, botMessage]);
        resetTranscript();
      } catch (error) {
        console.error("Error generating content:", error);
        setMessages((prevMessages) => [
          ...prevMessages,
          { sender: "bot", text: "Error fetching response" },
        ]);
        setInput("");
      }
    },
    [resetTranscript]
  );

  useEffect(() => {
    if (!listening && transcript) {
      setInput(transcript);
      sendMessage(transcript);
    }
  }, [listening, transcript, sendMessage]);

  const startListening = () => {
    SpeechRecognition.startListening({ continuous: false });
  };

  if (!browserSupportsSpeechRecognition) {
    return <div>Your browser does not support speech recognition.</div>;
  }

  return (
    <>
      <center>
        <div className="chat-container">
          <h1 style={{ marginRight: "15rem" }}>Chat with AI</h1>
          <div className="chat-box">
            <div className="messages">
              <div className="message bot-message">
                Hi 👋, How can I assist you today?
              </div>
              {messages.map((message, index) => (
                <div
                  key={index}
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
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    sendMessage(input);
                  }
                }}
              />
              <button onClick={() => sendMessage(input)}>Send</button>
              <button onClick={startListening}>
                <i className="fa fa-microphone" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        </div>
      </center>
    </>
  );
};

export default App;
