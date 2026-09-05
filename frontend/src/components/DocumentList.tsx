import { useTranslation } from "react-i18next";
import type { Document } from "../types";

interface Props {
  documents: Document[];
}

export default function DocumentList({ documents }: Props) {
  const { t } = useTranslation();

  if (documents.length === 0) {
    return (
      <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginTop: "1rem" }}>
        {t("documents.empty_list")}
      </p>
    );
  }

  return (
    <ul style={{ listStyle: "none", padding: 0, marginTop: "1rem" }}>
      {documents.map((doc) => (
        <li
          key={doc.id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "0.7rem 0.9rem",
            backgroundColor: "var(--color-bg)",
            borderRadius: "8px",
            marginBottom: "0.5rem",
            fontSize: "0.9rem",
          }}
        >
          <span>📄 {doc.filename}</span>
          <span style={{ color: "var(--color-text-muted)" }}>
            {doc.num_pages} {t("documents.pages")}
          </span>
        </li>
      ))}
    </ul>
  );
}