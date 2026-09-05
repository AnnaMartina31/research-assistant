import { useState } from "react";
import { useTranslation } from "react-i18next";
import DocumentUpload from "./components/DocumentUpload";
import DocumentList from "./components/DocumentList";
import ChatBox from "./components/ChatBox";
import LanguageSwitcher from "./components/LanguageSwitcher";
import type { Document } from "./types";

function App() {
  const { t } = useTranslation();
  const [documents, setDocuments] = useState<Document[]>([]);

  return (
    <div style={{ minHeight: "100vh" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "3rem 1.5rem" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "2.5rem",
          }}
        >
          <div>
            <h1 style={{ fontSize: "1.8rem", margin: 0 }}>📚 {t("app.title")}</h1>
            <p style={{ color: "var(--color-text-muted)", marginTop: "0.4rem" }}>
              {t("app.subtitle")}
            </p>
          </div>
          <LanguageSwitcher />
        </header>

        <section
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius)",
            padding: "1.5rem",
            marginBottom: "1.5rem",
            boxShadow: "var(--shadow)",
          }}
        >
          <h2 style={{ fontSize: "1.1rem", marginTop: 0 }}>{t("documents.heading")}</h2>
          <DocumentUpload onUploadSuccess={(doc) => setDocuments((prev) => [...prev, doc])} />
          <DocumentList documents={documents} />
        </section>

        <section
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius)",
            padding: "1.5rem",
            boxShadow: "var(--shadow)",
          }}
        >
          <h2 style={{ fontSize: "1.1rem", marginTop: 0 }}>{t("chat.heading")}</h2>
          <ChatBox />
        </section>
      </div>
    </div>
  );
}

export default App;