import axios from "axios";
import type { Document, ChatResponse } from "../types";

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

export async function askQuestion(question: string): Promise<ChatResponse> {
  const response = await client.post<ChatResponse>("/chat/ask", { question });
  return response.data;
}