import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable must be set");
}

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function getChatResponse(
  message: string,
  context: string = "",
  previousMessages: ChatMessage[] = []
): Promise<string> {
  try {
    const systemMessage = `당신은 미국 세법 전문가입니다. 한국어로 정확하고 도움이 되는 세금 상담을 제공해주세요.

특별히 다음 영역에 대해 전문적인 조언을 제공하세요:
- 소득 신고 (W-2, 1099, 자영업 소득)
- 표준공제 vs 항목별공제
- 세액공제 (Child Tax Credit, EITC, Education Credits 등)
- 은퇴계획 기여금 (401k, IRA)
- 자영업세 계산

현재 사용자는 "${context}" 섹션에서 작업 중입니다.

응답 시 주의사항:
1. 정확한 2024/2025 세법 기준으로 답변
2. 복잡한 경우 전문가 상담을 권유
3. 간결하고 이해하기 쉽게 설명
4. 관련 양식이나 한도액 등 구체적 정보 제공
5. 한국어로 친절하게 답변`;

    const messages = [
      { role: "system" as const, content: systemMessage },
      ...previousMessages.slice(-4), // Last 4 messages for context
      { role: "user" as const, content: message }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: 500,
      temperature: 0.7,
    });

    return response.choices[0].message.content || "죄송합니다. 응답을 생성할 수 없습니다.";
  } catch (error) {
    console.error("OpenAI API 오류:", error);
    throw new Error("AI 상담 서비스에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.");
  }
}