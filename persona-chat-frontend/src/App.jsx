import { useEffect, useState } from "react";
import personasData from "./config/personas.json";
import axios from "axios";

function App() {
  const [personas, setPersonas] = useState({});
  const [persona, setPersona] = useState("Hitesh");
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPersonas(personasData);
    const stored = localStorage.getItem("chatHistory");
    if (stored) {
      setHistory(JSON.parse(stored));
    }
  }, []);

  const handleSpeak = (text) => {
    // Create a new utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";

    // Function to set the voice
    const setVoice = () => {
      const voices = speechSynthesis.getVoices();
      console.log("Available voices:", voices);

      // Try to find a Hindi voice first
      let selectedVoice = voices.find(
        (voice) => voice.lang.includes("hi") || voice.name.includes("Hindi")
      );

      // If no Hindi voice, try to find an Indian English voice
      if (!selectedVoice) {
        selectedVoice = voices.find(
          (voice) =>
            voice.lang.includes("en-IN") || voice.name.includes("India")
        );
      }

      // If still no voice found, use the default voice
      if (!selectedVoice) {
        selectedVoice = voices.find((voice) => voice.default) || voices[0];
      }
      console.log("selected voice:", selectedVoice);
      utterance.voice = selectedVoice;
      speechSynthesis.speak(utterance);
    };

    // If voices are already loaded, set the voice immediately
    if (speechSynthesis.getVoices().length > 0) {
      setVoice();
    } else {
      // Wait for voices to be loaded
      speechSynthesis.onvoiceschanged = setVoice;
    }
  };

  const handleSubmit = async () => {
    const selected = personas[persona];
    const prompt = `You are ${selected.name}. ${selected.style}\n\n
    User asked: "${question}"\n\n
    Answer like ${selected.name}:`;
    try {
      setLoading(true);
      setError("");
      const res = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
        },
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_OPENAI_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
      const content = res.data.choices[0].message.content;
      setResponse(content);
      handleSpeak(content);

      const newEntry = {
        persona,
        question,
        response: content,
        timestamp: new Date().toISOString(),
      };
      const updatedHistory = [newEntry, ...history.slice(0, 9)];
      setHistory(updatedHistory);
      localStorage.setItem("chatHistory", JSON.stringify(updatedHistory));
    } catch (err) {
      console.error(err);
      setError("❌ Oops! Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePersonaChange = (e) => {
    setPersona(e.target.value);
    setResponse("");
    setError("");
    setQuestion("");
  };

  const selectedPersona = personas[persona];

  return (
    <div className="min-h-screen bg-blue-100 p-6 flex  flex-col items-center">
      <h1 className="text-6xl font-bold mb-6 text-blue-600 mt-6">
        Persona Chat
      </h1>

      <div className="bg-white shadow-lg p-6 rounded-md w-full max-w-2xl">
        <div className="mb-4">
          <label htmlFor="" className="block mb-2 font-semibold">
            Choose Persona:
          </label>
          <select
            value={persona}
            onChange={handlePersonaChange}
            className="w-full p-2 border rounded"
          >
            {Object.keys(personas).map((p) => (
              <option key={p} value={p}>
                {personas[p].name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label htmlFor="" className="block font-semibold mb-2">
            Ask a Question:
          </label>
          <textarea
            rows="3"
            className="w-full p-2 border rounded"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`${
            loading ? "bg-green-300" : "bg-green-500 hover:bg-green-600"
          } text-white px-4 py-2 rounded`}
        >
          {loading ? "Loading..." : "Get Answer"}
        </button>
      </div>

      {response && selectedPersona && (
        <div className="mt-6 w-full max-w-2xl bg-white p-6 rounded shadow">
          <div className="flex mb-4 items-center">
            <img
              src={selectedPersona.image}
              alt={selectedPersona.name}
              className="w-16 h-16 rounded-full mr-4"
            />
            <div>
              <h2 className="text-xl font-bold">{selectedPersona.name}</h2>
              <p className="text-gray-500">
                Speaking in {selectedPersona.pronoun} unique style
              </p>
            </div>
            <div className="whitespace-pre-wrap text-gray-800 break-words max-h-80 overflow-auto">
              {response}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 w-full max-w-2xl bg-red-100 border border-red-400 text-red-700 p-4 rounded">
          {error}
        </div>
      )}
    </div>
  );
}

export default App;
