import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom"; // This was missing

const EnhancedQASection = () => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recentQuestions, setRecentQuestions] = useState([]);
  const [suggestions, setSuggestions] = useState([
    "What birds are common in Margalla Hills?",
    "Are there recent sightings of leopards near Rawal Lake?",
    "What's the most endangered species in Islamabad?",
    "How has urbanization affected biodiversity in Islamabad?",
    "What conservation efforts are underway in Islamabad?"
  ]);

  // Initialize with sample questions instead of API fetch
  useEffect(() => {
    // Using local state since the API endpoint doesn't exist yet
    setRecentQuestions([
      {
        question: "What birds are common in Margalla Hills?",
        answer: "Common birds in Margalla Hills include the Grey Francolin, Rose-ringed Parakeet, Black Kite, and various kingfisher species.",
        timestamp: "2025-05-16T10:30:00Z"
      },
      {
        question: "Are there leopards in Islamabad?",
        answer: "Yes, Common Leopards (Panthera pardus) are found in the Margalla Hills surrounding Islamabad, though sightings are rare.",
        timestamp: "2025-05-15T14:20:00Z"
      },
      {
        question: "What conservation efforts are underway in Islamabad?",
        answer: "Current conservation efforts include invasive species management, community engagement programs, and ongoing monitoring of local ecosystems.",
        timestamp: "2025-05-14T09:45:00Z"
      }
    ]);
    
    // Note: In production, you would implement this API endpoint
    // Commented out until backend endpoint is available
    /* 
    const fetchRecentQuestions = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/qa/recent");
        if (res.ok) {
          const data = await res.json();
          setRecentQuestions(data.slice(0, 5)); 
        }
      } catch (error) {
        console.error("Failed to fetch recent questions:", error);
      }
    };
    fetchRecentQuestions();
    */
  }, []);

  async function handleAsk() {
    if (!question.trim()) {
      alert("Please enter your question.");
      return;
    }
    setLoading(true);
    setAnswer(null);

    try {
      const res = await fetch("http://localhost:5000/api/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setAnswer(data.answer);
      
      // Add to recent questions if successful
      if (data.answer) {
        setRecentQuestions(prev => [
          { question, answer: data.answer, timestamp: new Date().toISOString() },
          ...prev
        ].slice(0, 5));
      }
    } catch (error) {
      setAnswer("Failed to fetch answer. Please try again.");
      console.error("Error fetching answer:", error);
    }
    setLoading(false);
  }

  // Use a suggestion as the question
  const handleSuggestionClick = (suggestion) => {
    setQuestion(suggestion);
  };

  return (
    <section aria-label="Enhanced Biodiversity Q&A" className="qa-section">
      <h2>Ask About Islamabad Biodiversity</h2>
      
      <div className="qa-main">
        <div className="question-area">
          <textarea
            rows={4}
            className="question-input"
            placeholder="Ask a question about Islamabad's biodiversity..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <button 
            className="ask-button"
            onClick={handleAsk} 
            disabled={loading}
          >
            {loading ? "Searching..." : "Ask"}
          </button>
          
          <div className="suggested-questions">
            <h4>Suggested Questions:</h4>
            <ul className="suggestions-list">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="suggestion-item">
                  <button
                    className="suggestion-button"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="answer-area">
          {answer && (
            <div className="answer-container">
              <h3 className="answer-header">Answer:</h3>
              <p className="answer-text">{answer}</p>
              {/* Link to related observations */}
              <div className="related-links">
                <p>
                  <Link to="/observations">View Related Observations</Link>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="recent-questions">
        <h3>Recently Asked Questions</h3>
        {recentQuestions.length > 0 ? (
          <ul className="recent-questions-list">
            {recentQuestions.map((item, index) => (
              <li key={index} className="recent-question-item">
                <div className="question-text">{item.question}</div>
                <button
                  className="view-answer-button"
                  onClick={() => {
                    setQuestion(item.question);
                    setAnswer(item.answer);
                  }}
                >
                  View Answer
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="no-questions">No questions have been asked yet.</p>
        )}
      </div>
    </section>
  );
};

export default EnhancedQASection;