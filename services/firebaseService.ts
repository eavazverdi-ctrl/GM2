import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { type Message } from '../types';

// User's provided Firebase config
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDCHAwNiO4ajgswiP-DWUrG58rM3FOtUHY",
  authDomain: "mychat-9f052.firebaseapp.com",
  projectId: "mychat-9f052",
  storageBucket: "mychat-9f052.firebasestorage.app",
  messagingSenderId: "873918965",
  appId: "1:873918965:web:f7ffb83f8263ceb5f1b0bc"
};

// Initialize Firebase
const app = initializeApp(FIREBASE_CONFIG);
const db = getFirestore(app);

const messagesCollection = collection(db, 'messages');

export const sendMessageToFirebase = (author: string, text: string): Promise<any> => {
  return addDoc(messagesCollection, {
    author,
    text,
    timestamp: serverTimestamp(),
  });
};

export const onMessagesSnapshot = (callback: (messages: Message[]) => void): Unsubscribe => {
  const q = query(messagesCollection, orderBy('timestamp', 'asc'));
  return onSnapshot(q, (querySnapshot) => {
    const messages: Message[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        text: data.text,
        author: data.author,
        timestamp: data.timestamp ? data.timestamp.toDate() : null,
      });
    });
    callback(messages);
  });
};