import { useState } from "react";
import { useTranslation } from "react-i18next";
import { askQuestionStream } from "../api/client";
import type { Source } from "../types";

interface Message {
  question: string;
  answer: string;
  sources: Source[];
  status: "waiting" | "streaming" | "done" | "error";
}

export default function ChatBox() {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  const updateMessage = (index: number, change: (m: Message) => Message) => {
    setMessages((prev) => prev.map((m, i) => (i === index ? change(m) : m)));
  };

  const handleAsk = async () => {
    const question = input.trim();
    if (!question) return;

    setInput("");
    const index = messages.length;
    setMessages((prev) => [...prev, { question, answer: "", sources: [], status: "waiting" }]);

    try {
      await askQuestionStream(question, {
        onSources: (sources) => updateMessage(index, (m) => ({ ...m, sources })),
        onToken: (text) =>
          updateMessage(index, (m) => ({ ...m, answer: m.answer + text, status: "streaming" })),
      });
      updateMessage(index, (m) => ({ ...m, status: "done" }));
    } catch (err) {
      console.error(err);
      updateMessage(index, (m) => ({
        ...m,
        answer: m.answer || t("chat.error"),
        status: "error",
      }));
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

            {msg.status === "waiting" ? (
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
                {t("chat.thinking")}
              </p>
            ) : (
              <p style={{ lineHeight: 1.5, whiteSpace: "pre-wrap" }}>🤖 {msg.answer}</p>
            )}

            {msg.sources.length > 0 && (
              <div style={{ marginTop: "0.6rem", display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {msg.sources.map((s, j) => (
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