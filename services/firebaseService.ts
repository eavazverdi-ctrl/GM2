// Fix: Updated Firebase imports and usage to v8 syntax to match the likely installed SDK version.
import firebase from 'firebase/app';
import 'firebase/firestore';

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
if (!firebase.apps.length) {
  firebase.initializeApp(FIREBASE_CONFIG);
}
const db = firebase.firestore();

const messagesCollection = db.collection('messages');

export const sendMessageToFirebase = (author: string, text: string): Promise<any> => {
  return messagesCollection.add({
    author,
    text,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
  });
};

export const onMessagesSnapshot = (callback: (messages: Message[]) => void): () => void => {
  const q = messagesCollection.orderBy('timestamp', 'asc');

  // onSnapshot returns an unsubscribe function that we can use for cleanup
  const unsubscribe = q.onSnapshot((querySnapshot) => {
    // The querySnapshot object from Firebase contains complex, non-serializable objects.
    // We must map over the documents and create our own array of plain objects.
    const messages: Message[] = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      // This is the plain object that is safe to store in React state.
      return {
        id: doc.id,
        text: data.text,
        author: data.author,
        // CRITICAL: Firestore's timestamp is a special object. We must convert it
        // to a standard JavaScript Date object to prevent circular structure errors.
        // We use optional chaining (?.) and the nullish coalescing operator (??) for safety.
        timestamp: data.timestamp?.toDate() ?? null,
      };
    });
    
    callback(messages);
  });

  return unsubscribe;
};
