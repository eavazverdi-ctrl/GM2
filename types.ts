export interface Message {
  id: string;
  text: string;
  author: string; // Will store a unique user ID
  timestamp: Date | null; // Firestore timestamp object converted to JS Date
}