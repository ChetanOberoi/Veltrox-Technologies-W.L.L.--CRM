import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSy0KEluo2VFrJzGSGNb_XePeMylMaIQ7MoU",
  authDomain: "veltrox-crm-b48b9.firebaseapp.com",
  projectId: "veltrox-crm-b48b9",
  storageBucket: "veltrox-crm-b48b9.firebasestorage.app",
  messagingSenderId: "406467969980",
  appId: "1:406467969980:web:e3f5e86cc0d3d53cde61b9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.log('Offline persistence failed: multiple tabs open');
  } else if (err.code === 'unimplemented') {
    console.log('Offline persistence not supported');
  }
});

export default app;
