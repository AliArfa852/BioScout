import React, { useState } from "react";

export default function QASection() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);

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
    } catch {
      setAnswer("Failed to fetch answer. Please try again.");
    }
    setLoading(false);
  }

  return (
    <section aria-label="Biodiversity Q&A" style={{ marginBottom: "20px" }}>
      <h2>Ask About Islamabad Biodiversity</h2>
      <textarea
        rows={4}
        style={{ width: "100%", padding: "8px" }}
        placeholder="Ask a question about Islamabad's biodiversity..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />
      <button onClick={handleAsk} disabled={loading} style={{ marginTop: "10px" }}>
        {loading ? "Searching..." : "Ask"}
      </button>
      {answer && (
        <div style={{ marginTop: "15px", padding: "10px", backgroundColor: "#e0f2f1", borderRadius: "6px" }}>
          <strong>Answer:</strong>
          <p style={{ whiteSpace: "pre-wrap" }}>{answer}</p>
        </div>
      )}
    </section>
  );
}
