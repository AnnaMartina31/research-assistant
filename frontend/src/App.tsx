import { useState } from "react";
import DocumentUpload from "./components/DocumentUpload";
import DocumentList from "./components/DocumentList";
import ChatBox from "./components/ChatBox";
import type { Document } from "./types";

function App() {
  const [documents, setDocuments] = useState<Document[]>([]);

  return (
    <div style={{ maxWidth: "700px", margin: "2rem auto", padding: "0 1rem" }}>
      <h1>📚 Research Assistant</h1>

      <section style={{ marginBottom: "2rem" }}>
        <h2>Documenti</h2>
        <DocumentUpload onUploadSuccess={(doc) => setDocuments((prev) => [...prev, doc])} />
        <DocumentList documents={documents} />
      </section>

      <section>
        <h2>Chat</h2>
        <ChatBox />
      </section>
    </div>
  );
}

export default App;