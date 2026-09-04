export interface Document {
  id: number;
  filename: string;
  num_pages: number;
}

export interface Source {
  filename: string;
  page: number;
}

export interface ChatResponse {
  answer: string;
  sources: Source[];
}