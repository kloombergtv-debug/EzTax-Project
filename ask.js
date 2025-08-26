import fs from 'fs';
import OpenAI from 'openai';
import readline from 'readline';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// 벡터 저장소 로드
let vectorStore = [];

// 코사인 유사도 계산
function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

// 질문에 대한 임베딩 생성
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

// 관련 문서 검색
async function searchRelevantDocs(query, topK = 3) {
  console.log(`질문: "${query}"`);
  console.log('관련 문서 검색 중...');
  
  // 질문 임베딩 생성
  const queryEmbedding = await generateEmbedding(query);
  
  // 모든 문서와 유사도 계산
  const similarities = vectorStore.map(doc => ({
    ...doc,
    similarity: cosineSimilarity(queryEmbedding, doc.embedding)
  }));
  
  // 유사도 기준으로 정렬하고 상위 K개 선택
  const topDocs = similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
  
  console.log('\\n=== 검색된 관련 문서 ===');
  topDocs.forEach((doc, index) => {
    console.log(`${index + 1}. [${doc.source}] 유사도: ${doc.similarity.toFixed(4)}`);
    console.log(`   내용: ${doc.content.substring(0, 100)}...\\n`);
  });
  
  return topDocs;
}

// RAG 기반 답변 생성
async function generateAnswer(query, relevantDocs) {
  const context = relevantDocs
    .map(doc => `[출처: ${doc.source}]\\n${doc.content}`)
    .join('\\n\\n---\\n\\n');
  
  const prompt = `다음은 미국 세법과 관련된 정보입니다. 주어진 정보를 바탕으로 질문에 정확하고 도움이 되는 답변을 제공해주세요.

컨텍스트:
${context}

질문: ${query}

답변 시 다음 사항을 고려해주세요:
- 제공된 정보만을 기반으로 답변하세요
- 정확한 수치나 금액이 있다면 명시해주세요
- 불확실한 정보는 추가 확인이 필요하다고 언급하세요
- 한국어로 답변해주세요

답변:`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "당신은 미국 세법 전문가입니다. 제공된 정보를 바탕으로 정확하고 도움이 되는 답변을 제공합니다."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.1
    });
    
    return response.choices[0].message.content;
  } catch (error) {
    console.error('답변 생성 오류:', error);
    throw error;
  }
}

// 벡터 저장소 로드
function loadVectorStore() {
  try {
    if (!fs.existsSync('./vector_store.json')) {
      console.log('벡터 저장소를 찾을 수 없습니다. 먼저 "npm run seed"를 실행해주세요.');
      process.exit(1);
    }
    
    const data = fs.readFileSync('./vector_store.json', 'utf-8');
    vectorStore = JSON.parse(data);
    console.log(`벡터 저장소 로드 완료: ${vectorStore.length}개 문서`);
  } catch (error) {
    console.error('벡터 저장소 로드 오류:', error);
    process.exit(1);
  }
}

// 대화형 질문-답변 시스템
async function startInteractiveMode() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  console.log('\\n=== 세법 RAG 시스템 ===');
  console.log('미국 세법에 관한 질문을 해주세요. 종료하려면 "quit"를 입력하세요.\\n');
  
  const askQuestion = () => {
    rl.question('질문: ', async (query) => {
      if (query.toLowerCase() === 'quit') {
        console.log('세법 RAG 시스템을 종료합니다.');
        rl.close();
        return;
      }
      
      if (!query.trim()) {
        console.log('질문을 입력해주세요.\\n');
        askQuestion();
        return;
      }
      
      try {
        // 관련 문서 검색
        const relevantDocs = await searchRelevantDocs(query);
        
        if (relevantDocs.length === 0) {
          console.log('\\n관련된 정보를 찾을 수 없습니다.\\n');
          askQuestion();
          return;
        }
        
        // RAG 기반 답변 생성
        console.log('답변 생성 중...');
        const answer = await generateAnswer(query, relevantDocs);
        
        console.log('\\n=== 답변 ===');
        console.log(answer);
        console.log('\\n' + '='.repeat(50) + '\\n');
        
      } catch (error) {
        console.error('오류 발생:', error.message);
        console.log('');
      }
      
      askQuestion();
    });
  };
  
  askQuestion();
}

// CLI 모드 (단일 질문)
async function handleSingleQuery(query) {
  try {
    const relevantDocs = await searchRelevantDocs(query);
    
    if (relevantDocs.length === 0) {
      console.log('관련된 정보를 찾을 수 없습니다.');
      return;
    }
    
    const answer = await generateAnswer(query, relevantDocs);
    console.log('\\n=== 답변 ===');
    console.log(answer);
    
  } catch (error) {
    console.error('오류 발생:', error.message);
    process.exit(1);
  }
}

// 메인 실행
async function main() {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY 환경 변수가 설정되지 않았습니다.');
    }
    
    // 벡터 저장소 로드
    loadVectorStore();
    
    // 명령행 인수 확인
    const args = process.argv.slice(2);
    
    if (args.length > 0) {
      // 단일 질문 모드
      const query = args.join(' ');
      await handleSingleQuery(query);
    } else {
      // 대화형 모드
      await startInteractiveMode();
    }
    
  } catch (error) {
    console.error('오류:', error.message);
    process.exit(1);
  }
}

main();