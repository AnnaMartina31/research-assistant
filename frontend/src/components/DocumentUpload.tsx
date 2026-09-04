import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { uploadDocument } from "../api/client";
import type { Document } from "../types";

interface Props {
  onUploadSuccess: (doc: Document) => void;
}

export default function DocumentUpload({ onUploadSuccess }: Props) {
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
        setError("Errore durante il caricamento. Riprova.");
        console.error(err);
      } finally {
        setUploading(false);
      }
    },
    [onUploadSuccess]
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
          border: "2px dashed #ccc",
          borderRadius: "8px",
          padding: "2rem",
          textAlign: "center",
          cursor: "pointer",
          backgroundColor: isDragActive ? "#f0f0f0" : "transparent",
        }}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <p>Caricamento in corso...</p>
        ) : isDragActive ? (
          <p>Rilascia il PDF qui...</p>
        ) : (
          <p>Trascina un PDF qui, o clicca per selezionarlo</p>
        )}
      </div>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}