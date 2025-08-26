import OpenAI from "openai";
import fs from 'fs';
import path from 'path';

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable must be set");
}

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// RAG 기능을 위한 유틸 함수들
async function generateEmbedding(text: string) {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('임베딩 생성 오류:', error);
    return null;
  }
}

function cosineSimilarity(vecA: number[], vecB: number[]) {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

function loadVectorStore() {
  try {
    if (!fs.existsSync('./vector_store.json')) {
      console.log('벡터 저장소를 찾을 수 없습니다.');
      return [];
    }
    
    const data = fs.readFileSync('./vector_store.json', 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('벡터 저장소 로드 오류:', error);
    return [];
  }
}

async function searchRelevantDocs(query: string, topK = 3) {
  const vectorStore = loadVectorStore();
  
  if (vectorStore.length === 0) {
    return [];
  }
  
  const queryEmbedding = await generateEmbedding(query);
  if (!queryEmbedding) return [];
  
  const similarities = vectorStore.map((doc: any) => ({
    ...doc,
    similarity: cosineSimilarity(queryEmbedding, doc.embedding)
  }));
  
  return similarities
    .sort((a: any, b: any) => b.similarity - a.similarity)
    .slice(0, topK)
    .filter((doc: any) => doc.similarity > 0.1);
}

async function generateRAGAnswer(query: string, relevantDocs: any[], context = "") {
  if (!relevantDocs || relevantDocs.length === 0) {
    return null;
  }
  
  const docContext = relevantDocs
    .map(doc => `[출처: ${doc.source}]\n${doc.content}`)
    .join('\n\n---\n\n');
  
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
    return null;
  }
}

export async function getChatResponse(
  message: string,
  context: string = "",
  previousMessages: ChatMessage[] = []
): Promise<string> {
  try {
    // Try RAG-based answer for tax-related questions
    try {
      console.log(`RAG 검색 시도: "${message.substring(0, 50)}..."`);
      const relevantDocs = await searchRelevantDocs(message, 3);
      
      if (relevantDocs && relevantDocs.length > 0) {
        console.log(`관련 문서 ${relevantDocs.length}개 발견, RAG 답변 생성 중...`);
        const ragAnswer = await generateRAGAnswer(message, relevantDocs, context);
        
        if (ragAnswer) {
          console.log(`RAG 답변 생성 완료 (길이: ${ragAnswer.length}자)`);
          return ragAnswer;
        }
      }
    } catch (ragError) {
      console.error('RAG 검색 오류:', ragError);
      console.log('RAG 실패, 기본 OpenAI 답변으로 대체...');
    }
    
    console.log('기본 OpenAI 답변 생성...');
    const systemMessage = `🚨 중요: EzTax는 웹 브라우저에서 사용하는 웹사이트입니다. 앱이 아닙니다! 앱 다운로드, 앱 스토어, 모바일 앱에 대해 절대 언급하지 마세요. 🚨

🚨 매우 중요한 제한사항: EzTax는 세금 신고서를 직접 IRS에 제출하는 기능을 제공하지 않습니다! 🚨

## EzTax 제출 제한사항 (반드시 기억하고 안내할 것):
- ❌ EzTax에서는 세금 신고서를 직접 IRS에 제출할 수 없습니다
- ✅ EzTax는 세금 신고서 준비 및 계산만 제공합니다
- ✅ 사용자가 입력한 정보를 바탕으로 Form 1040을 생성하고, 이를 통해 IRS에 전자 제출할 수 있습니다
- ✅ 따라서 EzTax를 통해 세금 신고서를 작성하고 제출하는데 필요한 모든 과정을 완료할 수 있습니다

**중요: IRS 직접 제출, 전자 신고 제출, e-filing 관련 질문 시 반드시 이 제한사항을 명확히 안내하세요.**

당신은 EzTax 웹사이트의 전문 세무 상담원입니다. EzTax는 웹 브라우저에서 바로 사용할 수 있는 온라인 세금 시뮬레이션 플랫폼입니다.

가입 방법은 다음과 같습니다:
1. 웹 브라우저에서 EzTax 웹사이트 접속
2. "로그인/회원가입" 버튼 클릭  
3. Google 로그인 또는 이메일/비밀번호 입력
4. 즉시 모든 기능 사용 가능

절대로 앱 다운로드나 설치에 대해 언급하지 마세요. EzTax는 웹사이트입니다.

미국 세법 전문가로서 한국어로 정확하고 도움이 되는 세금 상담을 제공해주세요.

## EzTax 애플리케이션 기능 안내:

### 주요 페이지 기능:
1. **기본정보 (PersonalInfo)**: 개인정보, 부양가족 정보 입력
   - 신고상태(Single, Married Joint/Separate, Head of Household)
   - 부양가족 정보 및 적격 자녀 판단
   - 주소, 연락처 정보

2. **소득정보 (Income)**: 모든 소득 유형 입력
   - W-2 임금소득, 1099 이자/배당 소득
   - 자영업 소득, 임대소득, 은퇴소득
   - Schedule K-1 파트너십/S-Corp 소득

3. **사업경비 (BusinessExpense)**: Schedule C 자영업자 경비
   - 광고비, 차량비, 사무용품비 등 20여 가지 경비 항목
   - Schedule K-1 개체별 소득 분배 계산
   - 순소득 자동 계산

4. **자본이득계산기 (CapitalGains)**: 투자 거래 손익 계산
   - 거래별 매수/매도 가격, 수량 입력
   - 장기/단기 자본이득 자동 구분 (1년 기준)
   - 세율별 세금 추정 계산

5. **공제항목 (Deductions)**: 표준공제 vs 항목별공제
   - 의료비, 주/지방세(SALT), 주택융자이자
   - 자선기부금, 기타 공제항목
   - 자동 최적 공제 방식 선택

6. **세액공제 (TaxCredits)**: 각종 세액공제 계산
   - Child Tax Credit / Additional Child Tax Credit (ACTC)
   - 자녀돌봄비용 공제, 교육비 공제 (AOTC, LLC)
   - 근로소득공제 (EITC), 은퇴저축공제
   - 외국납부세액공제

7. **은퇴기여금 (RetirementContributions)**: 은퇴계획 기여금
   - Traditional/Roth IRA, 401k, 403b, 457
   - Simple IRA, SEP-IRA, TSP, ABLE 계정
   - 2025년 기여한도: IRA $7,000 ($8,000 if 50+), 401k $23,500 ($31,000 if 50+)

8. **추가세금 (AdditionalTax)**: 추가 세금 계산
   - 자영업세 (Schedule SE)
   - 조기인출 벌금, 기타 세금
   - QBI (사업소득공제) 계산

9. **검토 (Review)**: 최종 세금 계산 및 검토
   - 총소득, 조정총소득(AGI), 과세소득 요약
   - 세금 부채, 세액공제, 최종 납부/환급액
   - Form 1040 PDF 생성 기능

### 특별 기능:
- **실시간 계산**: 입력 즉시 세금 계산 업데이트
- **데이터 자동저장**: 모든 입력 내용 자동 저장
- **이중언어 지원**: 한국어/영어 완전 지원
- **AI 상담**: 모든 페이지에서 세무 질문 가능
- **정확한 계산**: 2024/2025년 IRS 기준 완전 준수

### 중요: EzTax 접속 방법
**EzTax는 100% 웹 기반 세금 시뮬레이션 플랫폼입니다**
- 앱 다운로드나 설치 필요 없음
- 브라우저에서 바로 접속하여 사용
- 회원가입은 웹사이트에서 직접 진행
- 모든 기능이 웹에서 완전 작동
- Google 로그인 또는 이메일/비밀번호로 회원가입 가능

### 회원가입 절차:
1. 웹 브라우저에서 EzTax 웹사이트 접속
2. "로그인/회원가입" 버튼 클릭
3. Google 로그인 또는 이메일/비밀번호 입력
4. 즉시 EzTax 모든 기능 사용 가능

**중요: 절대로 앱 다운로드, 앱 스토어, 모바일 앱 설치에 대해 언급하지 마세요. EzTax는 온라인 세금 시뮬레이션 플랫폼으로 웹 브라우저에서만 작동합니다.**

### EzTax 고급 계산 로직:
1. **세율 계산**: 2024/2025 세율표 적용 (10%, 12%, 22%, 24%, 32%, 35%, 37%)
2. **ACTC 계산**: Child Tax Credit 초과분의 환급 가능한 부분 정확 계산
3. **QBI 공제**: Section 199A 사업소득공제 (일반적으로 사업소득의 20%)
4. **자영업세**: Schedule SE 정확한 계산 (소득의 15.3%, 단 고소득시 Medicare 추가세 적용)
5. **SALT 한도**: 주/지방세 공제 $10,000 한도 적용
6. **AMT 계산**: Alternative Minimum Tax 해당시 자동 계산

### 사용자 가이드:
- **입력 순서**: 기본정보 → 소득 → 공제 → 세액공제 → 검토 순서 권장
- **저장 기능**: 각 페이지에서 "저장" 버튼으로 진행상황 저장
- **계산 검증**: 검토 페이지에서 최종 계산 결과 확인
- **PDF 생성**: Form 1040 양식으로 신고서 출력 가능

현재 사용자는 "${context}" 섹션에서 작업 중입니다.

## 답변 가이드:
1. EzTax 기능 사용법 구체적 안내
2. 해당 페이지 입력 방법 및 주의사항
3. 2024/2025 세법 기준 정확한 정보
4. 계산 로직 및 IRS 규정 설명
5. 다른 EzTax 페이지와의 연관성 안내
6. 한국어로 친절하고 전문적으로 답변`;

    const messages = [
      { role: "system" as const, content: systemMessage },
      { role: "user" as const, content: "EzTax는 웹사이트인가요 앱인가요?" },
      { role: "assistant" as const, content: "EzTax는 웹 브라우저에서 사용하는 온라인 세금 시뮬레이션 플랫폼입니다. 앱 다운로드나 설치가 필요하지 않으며, 브라우저에서 바로 접속하여 사용할 수 있습니다." },
      { role: "user" as const, content: "EzTax 가입은 어떻게 하나요?" },
      { role: "assistant" as const, content: "EzTax 웹사이트에서 회원가입하는 방법은 간단합니다:\n1. 웹 브라우저에서 EzTax 웹사이트 접속\n2. '로그인/회원가입' 버튼 클릭\n3. Google 로그인 또는 이메일/비밀번호로 계정 생성\n4. 즉시 모든 세금 시뮬레이션 기능 사용 가능\n\n별도의 앱 설치나 다운로드 없이 웹에서 바로 시작하실 수 있습니다." },
      ...previousMessages.slice(-2), // Last 2 messages for context
      { role: "user" as const, content: message }
    ];

    // Check for app-related questions and provide correct response immediately
    if (message.includes('앱') || message.includes('다운로드') || message.includes('설치') || message.includes('App Store') || message.includes('Play Store')) {
      return `EzTax는 웹 브라우저에서 사용하는 온라인 세금 시뮬레이션 플랫폼입니다. 

❌ 앱 다운로드나 설치가 필요하지 않습니다
✅ 웹 브라우저에서 바로 접속하여 사용

회원가입 방법:
1. 웹 브라우저에서 EzTax 웹사이트 접속
2. "로그인/회원가입" 버튼 클릭
3. Google 로그인 또는 이메일/비밀번호로 계정 생성
4. 즉시 모든 세금 시뮬레이션 기능 사용 가능

EzTax는 완전한 웹 기반 시뮬레이션 플랫폼으로, 별도의 앱 설치 없이 브라우저에서 모든 기능을 사용할 수 있습니다.`;
    }

    // Check for IRS submission-related questions and provide correct response immediately
    if (message.includes('IRS') && (message.includes('제출') || message.includes('신고') || message.includes('e-filing') || message.includes('전자신고') || message.includes('직접제출'))) {
      return `🚨 중요: EzTax는 세금 신고서를 직접 IRS에 제출하는 기능을 제공하지 않습니다.

## EzTax 웹사이트에서는:
❌ 세금 신고서를 직접 IRS에 제출할 수 없습니다
✅ 세금 신고서 준비 및 계산만 제공합니다
✅ 사용자가 입력한 정보를 바탕으로 Form 1040을 생성하고, 이를 통해 IRS에 전자 제출할 수 있습니다
✅ 따라서 EzTax를 통해 세금 신고서를 작성하고 제출하는데 필요한 모든 과정을 완료할 수 있습니다

## 신고서 제출 절차:
1. EzTax에서 모든 세금 정보 입력 완료
2. 검토 페이지에서 계산 결과 확인
3. Form 1040 PDF 생성
4. 생성된 신고서를 IRS 웹사이트를 통해 직접 제출

EzTax를 통해 세금 신고서를 작성하고 제출하는데 필요한 모든 과정을 완료할 수 있지만, 실제 IRS 제출은 별도로 진행해야 합니다.`;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: 500,
      temperature: 0.3,
    });

    const result = response.choices[0].message.content || "죄송합니다. 응답을 생성할 수 없습니다.";
    console.log(`일반 OpenAI 답변 생성 완료 (길이: ${result.length}자)`);
    return result;
  } catch (error) {
    console.error("OpenAI API 오류:", error);
    
    // Check if it's a quota exceeded error
    if (error instanceof Error && error.message.includes('quota')) {
      return `현재 OpenAI API 할당량이 초과되었습니다. 

OpenAI 계정의 결제 상태와 사용량 한도를 확인해주세요:
- OpenAI 대시보드에서 Usage와 Billing 섹션을 확인
- 결제 방법이 유효한지 확인
- 새로운 API 키 발급을 고려해보세요

임시 해결방법:
1. OpenAI API 할당량 증가
2. 새로운 결제 카드 등록
3. 다른 OpenAI 계정 사용

세금 관련 기본 질문이 있으시면 FAQ나 도움말을 참조해주세요.`;
    }
    
    throw new Error("AI 상담 서비스에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.");
  }
}