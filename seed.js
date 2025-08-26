import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// 지식 베이스 디렉토리
const KB_DIR = './kb';

// 벡터 저장소 (메모리 기반 - 실제 운영시에는 벡터 DB 사용 권장)
let vectorStore = [];

// 텍스트를 청크로 분할하는 함수
function splitTextIntoChunks(text, maxChunkSize = 1000, overlap = 200) {
  const chunks = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  let currentChunk = '';
  
  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (currentChunk.length + trimmedSentence.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      
      // 오버랩을 위해 마지막 문장들 유지
      const words = currentChunk.split(' ');
      const overlapWords = words.slice(-Math.floor(overlap / 6)); // 대략 200자 정도
      currentChunk = overlapWords.join(' ') + ' ' + trimmedSentence;
    } else {
      currentChunk += (currentChunk ? '. ' : '') + trimmedSentence;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

// 텍스트 임베딩 생성
async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('임베딩 생성 오류:', error);
    throw error;
  }
}

// 코사인 유사도 계산
function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

// 지식 베이스 로드 및 임베딩
async function loadKnowledgeBase() {
  console.log('지식 베이스 로딩 시작...');
  
  try {
    const files = fs.readdirSync(KB_DIR);
    
    for (const file of files) {
      if (file.endsWith('.txt')) {
        console.log(`처리 중: ${file}`);
        
        const filePath = path.join(KB_DIR, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // 텍스트를 청크로 분할
        const chunks = splitTextIntoChunks(content);
        
        // 각 청크에 대해 임베딩 생성
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          console.log(`  청크 ${i + 1}/${chunks.length} 임베딩 생성 중...`);
          
          const embedding = await generateEmbedding(chunk);
          
          vectorStore.push({
            id: `${file}_chunk_${i}`,
            source: file,
            content: chunk,
            embedding: embedding,
            metadata: {
              file: file,
              chunkIndex: i,
              totalChunks: chunks.length
            }
          });
          
          // API 호출 제한을 위한 지연
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    }
    
    console.log(`총 ${vectorStore.length}개의 청크가 처리되었습니다.`);
    
    // 벡터 저장소를 JSON 파일로 저장
    fs.writeFileSync('./vector_store.json', JSON.stringify(vectorStore, null, 2));
    console.log('벡터 저장소가 vector_store.json 파일로 저장되었습니다.');
    
  } catch (error) {
    console.error('지식 베이스 로딩 중 오류:', error);
    throw error;
  }
}

// 메인 실행
async function main() {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY 환경 변수가 설정되지 않았습니다.');
    }
    
    await loadKnowledgeBase();
    console.log('지식 베이스 초기화 완료!');
    
  } catch (error) {
    console.error('오류:', error);
    process.exit(1);
  }
}

main();