const admin = require('firebase-admin');
const fs = require('fs');

// 1) 서비스 계정 키 불러오기
const serviceAccount = require('./solutionchallenge-c03da-firebase-adminsdk-fbsvc-68dab03287.json');


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  
  const db = admin.firestore();
  
  const data = JSON.parse(fs.readFileSync("qna_dataset_full.json", "utf-8"));
  
  async function uploadData() {
    const batch = db.batch();
    const collectionRef = db.collection("skin_qna");
  
    data.forEach((item) => {
      const docRef = collectionRef.doc(); // 자동 ID
      batch.set(docRef, item);
    });
  
    await batch.commit();
    console.log(`✅ Uploaded ${data.length} QnA entries to Firestore.`);
  }
  
  uploadData().catch(console.error);