import fs from 'fs';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// 벡터 저장소 캐시
let vectorStoreCache = null;

// 코사인 유사도 계산
export function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

// 텍스트 임베딩 생성
export async function generateEmbedding(text) {
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

// 벡터 저장소 로드 (캐싱 지원)
export function loadVectorStore() {
  if (vectorStoreCache) {
    return vectorStoreCache;
  }
  
  try {
    if (!fs.existsSync('./vector_store.json')) {
      console.warn('벡터 저장소를 찾을 수 없습니다. seed.js를 먼저 실행해주세요.');
      return [];
    }
    
    const data = fs.readFileSync('./vector_store.json', 'utf-8');
    vectorStoreCache = JSON.parse(data);
    console.log(`벡터 저장소 로드 완료: ${vectorStoreCache.length}개 문서`);
    return vectorStoreCache;
  } catch (error) {
    console.error('벡터 저장소 로드 오류:', error);
    return [];
  }
}

// 관련 문서 검색
export async function searchRelevantDocs(query, topK = 3) {
  const vectorStore = loadVectorStore();
  
  if (vectorStore.length === 0) {
    return [];
  }
  
  // 질문 임베딩 생성
  const queryEmbedding = await generateEmbedding(query);
  
  // 모든 문서와 유사도 계산
  const similarities = vectorStore.map(doc => ({
    ...doc,
    similarity: cosineSimilarity(queryEmbedding, doc.embedding)
  }));
  
  // 유사도 기준으로 정렬하고 상위 K개 선택
  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK)
    .filter(doc => doc.similarity > 0.1); // 최소 유사도 임계값
}

// RAG 기반 답변 생성
export async function generateRAGAnswer(query, relevantDocs, context = "") {
  if (!relevantDocs || relevantDocs.length === 0) {
    return "죄송합니다. 해당 질문에 대한 관련 정보를 찾을 수 없습니다. 더 구체적인 질문을 해주시거나, 일반적인 세법 관련 용어로 다시 질문해 주세요.";
  }
  
  const docContext = relevantDocs
    .map(doc => `[출처: ${doc.source}]\\n${doc.content}`)
    .join('\\n\\n---\\n\\n');
  
  const systemPrompt = `당신은 미국 세법 전문가입니다. 다음 규칙을 따라 답변해주세요:

1. 제공된 컨텍스트 정보만을 기반으로 답변하세요
2. 정확한 수치나 금액이 있다면 반드시 명시하세요
3. 2024년 기준 정보임을 명확히 하세요
4. 불확실한 정보는 "추가 확인이 필요합니다"라고 언급하세요
5. 한국어로 정확하고 친절하게 답변하세요
6. 복잡한 내용은 이해하기 쉽게 설명하세요

${context ? `추가 컨텍스트: ${context}` : ''}`;
  
  const userPrompt = `다음 정보를 바탕으로 질문에 답변해주세요:

컨텍스트:
${docContext}

질문: ${query}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.1
    });
    
    return response.choices[0].message.content;
  } catch (error) {
    console.error('RAG 답변 생성 오류:', error);
    return "죄송합니다. 답변 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
  }
}

// 텍스트 청킹 유틸리티
export function splitTextIntoChunks(text, maxChunkSize = 1000, overlap = 200) {
  const chunks = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  let currentChunk = '';
  
  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (currentChunk.length + trimmedSentence.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      
      // 오버랩을 위해 마지막 문장들 유지
      const words = currentChunk.split(' ');
      const overlapWords = words.slice(-Math.floor(overlap / 6));
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