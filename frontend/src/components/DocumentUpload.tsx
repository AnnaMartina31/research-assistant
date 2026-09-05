import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useTranslation } from "react-i18next";
import { uploadDocument } from "../api/client";
import type { Document } from "../types";

interface Props {
  onUploadSuccess: (doc: Document) => void;
}

export default function DocumentUpload({ onUploadSuccess }: Props) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setUploading(true);
      setError(null);

      try {
        const doc = await uploadDocument(file);
        onUploadSuccess(doc);
      } catch (err) {
        setError(t("documents.upload_error"));
        console.error(err);
      } finally {
        setUploading(false);
      }
    },
    [onUploadSuccess, t]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
  });

  return (
    <div>
      <div
        {...getRootProps()}
        style={{
          border: `1.5px dashed ${isDragActive ? "var(--color-primary)" : "var(--color-border)"}`,
          borderRadius: "var(--radius)",
          padding: "2rem 1rem",
          textAlign: "center",
          cursor: "pointer",
          backgroundColor: isDragActive ? "#eef2ff" : "var(--color-bg)",
          transition: "all 0.15s ease",
        }}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <p style={{ margin: 0, color: "var(--color-text-muted)" }}>⏳ {t("documents.uploading")}</p>
        ) : isDragActive ? (
          <p style={{ margin: 0, color: "var(--color-primary)" }}>{t("documents.dropzone_active")}</p>
        ) : (
          <p style={{ margin: 0, color: "var(--color-text-muted)" }}>
            📄 {t("documents.dropzone_idle")}
          </p>
        )}
      </div>
      {error && <p style={{ color: "#dc2626", fontSize: "0.9rem" }}>{error}</p>}
    </div>
  );
}