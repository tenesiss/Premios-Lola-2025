import './env';
import admin from 'firebase-admin';

const projectId = process.env.FIREBASE_PROJECT_ID;
if (!projectId) {
  throw new Error('FIREBASE_PROJECT_ID must match the frontend Firebase project.');
}

const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
if (Boolean(privateKey) !== Boolean(clientEmail)) {
  throw new Error('Provide both FIREBASE_PRIVATE_KEY and FIREBASE_CLIENT_EMAIL, or neither.');
}

// ID-token verification uses Google's public signing certificates and project ID.
// Service-account credentials are optional for this API's verifyIdToken calls.
admin.initializeApp({
  projectId,
  ...(privateKey && clientEmail ? {
    credential: admin.credential.cert({ projectId, privateKey, clientEmail }),
  } : {}),
});

export default admin;
