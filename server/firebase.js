// firebase.js
const admin = require('firebase-admin');
require('dotenv').config(); // .env 불러오기

const serviceAccount = require(`./${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

module.exports = { admin, db };
