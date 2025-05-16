// firestore_retriever.js
const { db } = require('./firebase');

// 🔍 단순 유사도 기반 검색 (제목에 포함되는 키워드 포함 여부)
async function retrieveSimilarQnA(searchText) {
  const snapshot = await db.collection('qna_dataset').get();
  const results = [];

  snapshot.forEach(doc => {
    const data = doc.data();
    const question = data.question || '';
    const answer = data.answer || '';

    // 매우 단순한 키워드 포함 필터 (실제론 벡터 유사도 기반으로 대체 가능)
    if (question.toLowerCase().includes(searchText.toLowerCase())) {
      results.push({ question, answer });
    }
  });

  // 최대 5개 반환
  return results.slice(0, 5);
}

module.exports = { retrieveSimilarQnA };
