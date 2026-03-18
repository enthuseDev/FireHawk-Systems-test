const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const credentialsPathRaw = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const firestoreCollection = process.env.FIRESTORE_COLLECTION || 'cars';

if (!admin.apps.length) {
  if (!credentialsPathRaw) {
    throw new Error(
      'Missing env var GOOGLE_APPLICATION_CREDENTIALS (path to service account JSON).'
    );
  }

  const credentialsPath = path.isAbsolute(credentialsPathRaw)
    ? credentialsPathRaw
    : path.resolve(process.cwd(), credentialsPathRaw);

  if (!fs.existsSync(credentialsPath)) {
    throw new Error(
      `Service account file not found at: ${credentialsPath}. Check GOOGLE_APPLICATION_CREDENTIALS.`
    );
  }

  // eslint-disable-next-line import/no-dynamic-require
  const serviceAccount = require(credentialsPath);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

function carsCollection() {
  return db.collection(firestoreCollection);
}

module.exports = { db, carsCollection, firestoreCollection };

