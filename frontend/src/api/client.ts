import axios from "axios";
import type { Document, ChatResponse, Source } from "../types";

const API_BASE_URL = "http://127.0.0.1:8000";

const client = axios.create({
  baseURL: API_BASE_URL,
});

export async function uploadDocument(file: File): Promise<Document> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await client.post<Document>("/documents/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
}

export async function listDocuments(): Promise<Document[]> {
  const response = await client.get<Document[]>("/documents");
  return response.data;
}

export async function askQuestion(question: string): Promise<ChatResponse> {
  const response = await client.post<ChatResponse>("/chat/ask", { question });
  return response.data;
}

export interface StreamHandlers {
  onSources: (sources: Source[]) => void;
  onToken: (text: string) => void;
}

function handleBlock(block: string, handlers: StreamHandlers) {
  let event = "";
  let data = "";
  for (const line of block.split("\n")) {
    if (line.startsWith("event: ")) event = line.slice(7).trim();
    else if (line.startsWith("data: ")) data += line.slice(6);
  }
  if (!event || !data) return;

  const payload = JSON.parse(data);
  if (event === "sources") handlers.onSources(payload.sources);
  else if (event === "token") handlers.onToken(payload.text);
}

// fetch + ReadableStream: axios nel browser non supporta bene lo streaming
export async function askQuestionStream(question: string, handlers: StreamHandlers): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/chat/ask-stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`HTTP ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() ?? "";
    for (const block of blocks) {
      handleBlock(block, handlers);
    }
  }
}