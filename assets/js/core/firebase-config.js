// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCSA4Qkt3rj7Juijpwi45ZKGcVHSjdvvVw",
  authDomain: "trainlinkeureal.firebaseapp.com",
  projectId: "trainlinkeureal",
  storageBucket: "trainlinkeureal.firebasestorage.app",
  messagingSenderId: "630231025389",
  appId: "1:630231025389:web:cebfb048c5b95b95616ee4",
  measurementId: "G-24Q1VQFNM3"
};

// Initialize Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { 
  getFirestore,
  collection,
  getDocs,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// Initialize Firebase (only if configuration is proper)
let app, auth, db;

try {
  // Check if the configuration has been updated from placeholders
  if (firebaseConfig.apiKey === "YOUR_API_KEY" || 
      firebaseConfig.apiKey === "" || 
      !firebaseConfig.apiKey) {
    console.warn("Firebase configuration not set properly. Using mock Firebase implementation.");
    
    // Create mock implementations if Firebase isn't configured
    auth = createMockAuth();
    db = createMockFirestore();
  } else {
    // Initialize Firebase properly
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("Firebase initialized successfully with proper credentials");
  }
} catch (error) {
  console.error("Error initializing Firebase:", error);
  // Use mock implementations as fallback
  auth = createMockAuth();
  db = createMockFirestore();
}

// Mock auth implementation
function createMockAuth() {
  console.log("Creating mock auth implementation");
  let mockCurrentUser = null;
  let authStateListeners = [];
  
  return {
    // Properties
    get currentUser() { return mockCurrentUser; },
    
    // Methods
    onAuthStateChanged: (callback) => {
      console.log("Mock: Adding auth state change listener");
      // Add listener to list
      authStateListeners.push(callback);
      // Call immediately with current state
      setTimeout(() => callback(mockCurrentUser), 0);
      // Return unsubscribe function
      return () => {
        authStateListeners = authStateListeners.filter(cb => cb !== callback);
      };
    },
    
    // Mock sign in - simulates successful login
    mockSignIn: (email, password) => {
      console.log(`Mock: Signing in user ${email}`);
      mockCurrentUser = {
        uid: 'mock-user-' + Date.now(),
        email: email,
        displayName: email.split('@')[0],
        emailVerified: true
      };
      // Notify listeners
      authStateListeners.forEach(cb => cb(mockCurrentUser));
      return Promise.resolve(mockCurrentUser);
    },
    
    // Mock sign out
    mockSignOut: () => {
      console.log("Mock: Signing out user");
      mockCurrentUser = null;
      // Notify listeners
      authStateListeners.forEach(cb => cb(mockCurrentUser));
      return Promise.resolve();
    }
  };
}

// Mock Firestore implementation with local storage backing
function createMockFirestore() {
  console.log("Creating mock Firestore implementation backed by localStorage");
  
  // Helper function to get collection from localStorage
  const getCollection = (collectionName) => {
    const data = localStorage.getItem(`firestore_${collectionName}`);
    return data ? JSON.parse(data) : {};
  };
  
  // Helper function to save collection to localStorage
  const saveCollection = (collectionName, data) => {
    localStorage.setItem(`firestore_${collectionName}`, JSON.stringify(data));
  };
  
  return {
    // Collection method
    collection: (collectionName) => {
      return {
        // Methods for collection reference
        id: collectionName,
        
        // Add a document with auto-generated ID
        add: (data) => {
          const docId = `mock-doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const collection = getCollection(collectionName);
          collection[docId] = { ...data };
          saveCollection(collectionName, collection);
          return Promise.resolve({ id: docId });
        }
      };
    },
    
    // Document reference
    doc: (collectionName, docId) => {
      return {
        id: docId,
        
        // Get document
        get: () => {
          const collection = getCollection(collectionName);
          const data = collection[docId];
          return Promise.resolve({
            exists: !!data,
            data: () => data || null,
            id: docId
          });
        },
        
        // Set document data
        set: (data) => {
          const collection = getCollection(collectionName);
          collection[docId] = { ...data };
          saveCollection(collectionName, collection);
          return Promise.resolve();
        },
        
        // Update document data
        update: (data) => {
          const collection = getCollection(collectionName);
          if (collection[docId]) {
            collection[docId] = { ...collection[docId], ...data };
            saveCollection(collectionName, collection);
          }
          return Promise.resolve();
        },
        
        // Delete document
        delete: () => {
          const collection = getCollection(collectionName);
          if (collection[docId]) {
            delete collection[docId];
            saveCollection(collectionName, collection);
          }
          return Promise.resolve();
        }
      };
    },
    
    // Query method
    query: () => {
      // Return a mock query that will work with getDocs
      return {
        mockCollectionName: arguments[0],
        mockConditions: Array.from(arguments).slice(1)
      };
    },
    
    // Get documents from query
    getDocs: (queryObj) => {
      let collectionName = '';
      if (queryObj.mockCollectionName) {
        collectionName = queryObj.mockCollectionName;
      } else {
        // If query wasn't used, the argument is a collection reference
        collectionName = queryObj.id;
      }
      
      const collection = getCollection(collectionName);
      const docs = Object.entries(collection).map(([id, data]) => ({
        id,
        data: () => data,
        exists: true
      }));
      
      return Promise.resolve({
        docs,
        forEach: (callback) => docs.forEach(callback),
        empty: docs.length === 0
      });
    }
  };
}

// Export Firebase modules
export { app, auth, db };

// Auth state observer
export function initAuthStateObserver(callback) {
  onAuthStateChanged(auth, (user) => {
    callback(user);
  });
}

// Login function
export function loginUser(email, password) {
  if (auth.mockSignIn) {
    return auth.mockSignIn(email, password);
  } else {
    return signInWithEmailAndPassword(auth, email, password);
  }
}

// Google login function
export function loginWithGoogle() {
  if (auth.mockSignIn) {
    return auth.mockSignIn("demo@example.com", "password");
  } else {
    const googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });
    return signInWithPopup(auth, googleProvider);
  }
}

// Register function
export function registerUser(email, password) {
  if (auth.mockSignIn) {
    return auth.mockSignIn(email, password);
  } else {
    return createUserWithEmailAndPassword(auth, email, password);
  }
}

// Logout function
export function logoutUser() {
  if (auth.mockSignOut) {
    return auth.mockSignOut();
  } else {
    return signOut(auth);
  }
}

// Get current user
export function getCurrentUser() {
  return auth.currentUser;
}

// Send password reset email
export function sendPasswordReset(email) {
  if (auth.mockSignIn) {
    console.log(`Mock: Sending password reset email to ${email}`);
    return Promise.resolve();
  } else {
    return sendPasswordResetEmail(auth, email);
  }
} 