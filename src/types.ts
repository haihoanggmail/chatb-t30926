export interface OrderItem {
  id: string;
  timestamp: string;
  sessionId: string;
  name: string;
  phone: string;
  email: string;
  product: string;
  price: string;
  address: string;
  status: "Mới" | "Đã xác nhận" | "Đang giao" | "Hoàn thành" | "Đã hủy";
  isLegacyCorrupted?: boolean;
  corruptionReason?: string;
}

export interface TrainingItem {
  id: string;
  topic: string;
  content: string;
  suggestion: string;
  link: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  orderAction?: {
    rawPayload: string;
    phone?: string;
    name?: string;
    email?: string;
    product?: string;
    price?: string;
    address?: string;
  };
}

export interface BugComparison {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium";
  oldCodeSnippet: string;
  issueDescription: string;
  consequenceInSheets: string;
  fixedCodeSnippet: string;
  improvementDetails: string;
}
