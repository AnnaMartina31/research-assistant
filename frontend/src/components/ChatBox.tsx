import { useState } from "react";
import { useTranslation } from "react-i18next";
import { askQuestion } from "../api/client";
import type { ChatResponse } from "../types";

interface Message {
  question: string;
  response: ChatResponse | null;
  loading: boolean;
}

export default function ChatBox() {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  const handleAsk = async () => {
    const question = input.trim();
    if (!question) return;

    setInput("");
    const newMessage: Message = { question, response: null, loading: true };
    setMessages((prev) => [...prev, newMessage]);

    try {
      const response = await askQuestion(question);
      setMessages((prev) =>
        prev.map((m) => (m === newMessage ? { ...m, response, loading: false } : m))
      );
    } catch (err) {
      console.error(err);
      setMessages((prev) =>
        prev.map((m) =>
          m === newMessage
            ? { ...m, response: { answer: t("chat.error"), sources: [] }, loading: false }
            : m
        )
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <div>
      {messages.length === 0 && (
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
          {t("chat.empty_state")}
        </p>
      )}

      <div style={{ marginBottom: messages.length > 0 ? "1.2rem" : 0 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: "1.5rem" }}>
            <p style={{ fontWeight: 600, marginBottom: "0.3rem" }}>🧑 {msg.question}</p>
            {msg.loading ? (
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
                {t("chat.thinking")}
              </p>
            ) : (
              <div>
                <p style={{ lineHeight: 1.5 }}>🤖 {msg.response?.answer}</p>
                {msg.response && msg.response.sources.length > 0 && (
                  <div style={{ marginTop: "0.6rem", display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                    {msg.response.sources.map((s, j) => (
                      <span
                        key={j}
                        style={{
                          backgroundColor: "var(--color-bg)",
                          border: "1px solid var(--color-border)",
                          borderRadius: "999px",
                          padding: "0.25rem 0.7rem",
                          fontSize: "0.8rem",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        {s.filename} — {t("chat.page_label")} {s.page}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("chat.placeholder")}
          style={{ flex: 1 }}
        />
        <button onClick={handleAsk}>{t("chat.send")}</button>
      </div>
    </div>
  );
}