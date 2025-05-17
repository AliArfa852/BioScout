import React, { useState, useEffect } from "react";
import { SectionContainer, Button, Card, Badge } from "../components/common/UIComponents";

export default function QAPage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previousQuestions, setPreviousQuestions] = useState([]);
  const [error, setError] = useState(null);

  // Load previous questions from localStorage
  useEffect(() => {
    const savedQuestions = localStorage.getItem("bioscoutPreviousQuestions");
    if (savedQuestions) {
      setPreviousQuestions(JSON.parse(savedQuestions));
    }
  }, []);

  // Save questions to localStorage when they change
  useEffect(() => {
    localStorage.setItem("bioscoutPreviousQuestions", JSON.stringify(previousQuestions));
  }, [previousQuestions]);

  // Sample suggested questions
  const suggestedQuestions = [
    "What are the most common bird species in Margalla Hills?",
    "How can I identify native plant species in Islamabad?",
    "What conservation efforts are ongoing in Rawal Lake?",
    "When is the best time to observe butterflies in Islamabad?",
    "What environmental challenges does Islamabad face?",
    "How can citizens contribute to biodiversity preservation?"
  ];

  async function handleAsk() {
    if (!question.trim()) {
      setError("Please enter a question.");
      return;
    }
    
    setLoading(true);
    setAnswer(null);
    setError(null);

    try {
      const res = await fetch("http://localhost:5000/api/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      
      if (!res.ok) {
        throw new Error(`Server responded with status: ${res.status}`);
      }
      
      const data = await res.json();
      setAnswer(data.answer);
      
      // Add to previous questions
      const newQuestion = {
        id: Date.now(),
        question: question,
        answer: data.answer,
        timestamp: new Date().toISOString()
      };
      
      setPreviousQuestions(prev => [newQuestion, ...prev.slice(0, 9)]); // Keep most recent 10
      setQuestion(""); // Clear input field
    } catch (err) {
      console.error("Error fetching answer:", err);
      setError("Failed to fetch answer. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Handle suggested question click
  function handleSuggestedQuestion(q) {
    setQuestion(q);
    // Auto-ask the question
    setAnswer(null);
    setLoading(true);
    setError(null);
    
    fetch("http://localhost:5000/api/qa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: q }),
    })
      .then(res => {
        if (!res.ok) throw new Error(`Server responded with status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        setAnswer(data.answer);
        
        // Add to previous questions
        const newQuestion = {
          id: Date.now(),
          question: q,
          answer: data.answer,
          timestamp: new Date().toISOString()
        };
        
        setPreviousQuestions(prev => [newQuestion, ...prev.slice(0, 9)]);
      })
      .catch(err => {
        console.error("Error fetching answer:", err);
        setError("Failed to fetch answer. Please try again.");
      })
      .finally(() => {
        setLoading(false);
      });
  }

  // Handle "Ask Again" feature for previous questions
  function handleAskAgain(q) {
    setQuestion(q);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Format timestamp for display
  function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString();
  }

  return (
    <div className="qa-page">
      <div className="qa-header">
        <h1>Biodiversity Q&A</h1>
        <p className="qa-subtitle">
          Ask questions about Islamabad's biodiversity, conservation, and local species
        </p>
      </div>
      
      <SectionContainer className="question-section">
        <div className="question-form">
          <textarea
            className="question-input"
            rows={3}
            placeholder="Ask about local species, ecosystems, or conservation efforts..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                handleAsk();
              }
            }}
          />
          
          <div className="question-actions">
            <Button 
              onClick={handleAsk} 
              disabled={loading || !question.trim()}
              icon="❓"
            >
              {loading ? "Searching..." : "Ask Question"}
            </Button>
            <div className="question-tip">
              Tip: Use Ctrl+Enter to submit
            </div>
          </div>
          
          {error && <div className="question-error">{error}</div>}
        </div>
        
        {/* Suggested Questions */}
        <div className="suggested-questions">
          <h3>Suggested Questions</h3>
          <div className="suggested-questions-grid">
            {suggestedQuestions.map((q, index) => (
              <button 
                key={index}
                className="suggested-question"
                onClick={() => handleSuggestedQuestion(q)}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </SectionContainer>
      
      {/* Answer Display */}
      {loading && (
        <div className="loading-answer">
          <div className="loading-pulse"></div>
          <p>Finding the best answer...</p>
        </div>
      )}
      
      {answer && (
        <SectionContainer className="answer-section">
          <div className="answer-header">
            <h3>Answer</h3>
            <Badge type="success">BioScout AI</Badge>
          </div>
          
          <div className="question-display">
            <span className="question-prefix">Q:</span> {question}
          </div>
          
          <div className="answer-content">
            <p className="answer-text">{answer}</p>
          </div>
          
          <div className="answer-footer">
            <p className="answer-disclaimer">
              Answers are based on our biodiversity database and general knowledge. 
              For scientific research, please consult with professional biologists.
            </p>
          </div>
        </SectionContainer>
      )}
      
      {/* Previous Questions */}
      {previousQuestions.length > 0 && (
        <SectionContainer className="previous-questions-section" title="Your Previous Questions">
          <div className="previous-questions-list">
            {previousQuestions.map((item) => (
              <Card key={item.id} className="previous-question-card">
                <div className="previous-question-header">
                  <h4>{item.question}</h4>
                  <span className="question-timestamp">{formatTimestamp(item.timestamp)}</span>
                </div>
                
                <div className="previous-answer">
                  <p>{item.answer}</p>
                </div>
                
                <div className="previous-question-actions">
                  <Button 
                    type="secondary" 
                    size="small"
                    onClick={() => handleAskAgain(item.question)}
                  >
                    Ask Again
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </SectionContainer>
      )}
      
      {/* FAQ Section */}
      <SectionContainer className="faq-section" title="Frequently Asked Questions">
        <div className="faq-list">
          <div className="faq-item">
            <h4>What is BioScout Islamabad?</h4>
            <p>
              BioScout Islamabad is a community science initiative that allows citizens to document and explore biodiversity in Islamabad, Pakistan. The platform uses AI technology to identify species and provide information about local ecosystems.
            </p>
          </div>
          
          <div className="faq-item">
            <h4>How can I contribute to biodiversity conservation?</h4>
            <p>
              You can contribute by submitting your observations of plants and animals, participating in community conservation events, reducing your ecological footprint, and raising awareness about local species and their habitats.
            </p>
          </div>
          
          <div className="faq-item">
            <h4>Why is biodiversity important for Islamabad?</h4>
            <p>
              Biodiversity plays a crucial role in maintaining Islamabad's ecosystem health, providing clean air and water, regulating climate, preventing soil erosion in the Margalla Hills, and supporting natural beauty that enhances residents' quality of life.
            </p>
          </div>
          
          <div className="faq-item">
            <h4>How does the AI species identification work?</h4>
            <p>
              Our AI classifier analyzes uploaded images using advanced computer vision models trained on thousands of species. It identifies visual patterns and features to match unknown specimens with known species in our database.
            </p>
          </div>
        </div>
      </SectionContainer>
    </div>
  );
}