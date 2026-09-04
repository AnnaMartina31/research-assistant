import type { Document } from "../types";

interface Props {
  documents: Document[];
}

export default function DocumentList({ documents }: Props) {
  if (documents.length === 0) {
    return <p style={{ color: "#888" }}>Nessun documento ancora caricato.</p>;
  }

  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {documents.map((doc) => (
        <li
          key={doc.id}
          style={{
            padding: "0.5rem",
            borderBottom: "1px solid #eee",
          }}
        >
          📄 {doc.filename} — {doc.num_pages} pagine
        </li>
      ))}
    </ul>
  );
}