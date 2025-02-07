const GEMINI_API_KEY = "";

// Gemini 모델 리스트
const geminiModels = [
  "gemini-2.0-flash-001",
  "gemini-2.0-pro-exp-02-05",
  "gemini-2.0-flash-exp",
  "gemini-1.5-pro",
  "gemini-exp-1206",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
];

const modelQueue = new CircularQueue(geminiModels);

/**
 * 지정한 밀리초(ms)만큼 대기하는 Promise를 반환합니다.
 *
 * @param {number} ms - 대기할 시간 (밀리초)
 * @returns {Promise<void>} 지정한 시간이 지나면 해결되는 Promise
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Gemini API에 POST 요청을 보내고, 응답에서 생성된 텍스트를 추출하여 반환합니다.
 *
 * @param {string} prompt - 모델에게 전달할 프롬프트
 * @param {string} modelName - 사용할 Gemini 모델의 이름
 * @param {string} action - API 액션 (예: "generateContent")
 * @param {object} generationConfig - 요청 시 사용할 생성 구성 옵션
 * @returns {Promise<string>} 모델이 생성한 텍스트를 포함하는 Promise
 * @throws {Error} 요청이 실패하거나 예상치 못한 응답 형식인 경우 에러 발생
 */
async function requestAPI(prompt, modelName, action, generationConfig) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:${action}?key=${GEMINI_API_KEY}`;
  const response = await axios.post(
    url,
    { contents: [{ parts: [{ text: prompt }] }], generationConfig },
    { headers: { "Content-Type": "application/json" } }
  );
  return response.data.candidates[0].content.parts[0].text;
}

/**
 * 재시도 로직:
 * - 주어진 프롬프트로 모델 요청이 실패할 경우 2초 대기 후 모델 큐를 회전시켜
 *   새로운 모델로 요청을 재시도합니다.
 * - 요청이 성공할 때까지 무한 반복하며, 성공 시 생성된 텍스트를 반환합니다.
 *
 * @param {string} prompt - 모델에게 전달할 원본 프롬프트 (재시도 시에도 동일하게 사용)
 * @param {string} action - API 액션 (예: "generateContent")
 * @param {object} generationConfig - 요청 시 사용할 생성 구성 옵션
 * @param {boolean} autoSearch - 자동 검색 사용 여부 (현재 로직에서는 전달만 함)
 * @returns {Promise<string>} 성공적으로 생성된 텍스트를 포함하는 Promise
 */
async function retryPrompt(prompt, action, generationConfig, autoSearch) {
  while (true) {
    // 2초 대기
    await sleep(2000);

    // 모델 큐를 회전시키고 새로운 모델 선택
    modelQueue.rotateQueue();
    const newModelName = modelQueue.peek();
    console.log("재시도: 모델", newModelName, "로 요청합니다.");

    try {
      const result = await requestAPI(
        prompt,
        newModelName,
        action,
        generationConfig
      );
      return result; // 성공하면 결과 반환
    } catch (error) {
      console.error("모델", newModelName, "요청 실패:", error);
      // 에러가 발생하면 루프를 계속 진행하여 다음 모델로 재시도
    }
  }
}

/**
 * 모델에 API 요청을 보내는 함수입니다.
 * 최초 요청이 실패하면 재시도 로직(retryPrompt)을 통해 계속 재시도합니다.
 *
 * @param {Object} options - 요청에 필요한 옵션 객체
 * @param {string} options.prompt - 모델에게 전달할 프롬프트
 * @param {string} options.modelName - 초기 요청에 사용할 Gemini 모델 이름
 * @param {string} [options.action="generateContent"] - API 액션 (기본값: "generateContent")
 * @param {object} [options.generationConfig={}] - 요청 시 사용할 생성 구성 옵션
 * @param {boolean} [options.autoSearch=true] - 자동 검색 사용 여부 (재시도 로직에 전달됨)
 * @returns {Promise<string>} 모델의 응답으로 생성된 텍스트를 포함하는 Promise
 */
const callModel = async ({
  prompt,
  modelName,
  action = "generateContent",
  generationConfig = {},
  autoSearch = true,
}) => {
  console.log("요청 모델:", modelName, "\n프롬프트:", prompt);
  try {
    return await requestAPI(prompt, modelName, action, generationConfig);
  } catch (error) {
    console.error("모델", modelName, "요청 중 에러 발생:", error);
    // 재시도 시에는 원본 프롬프트, 액션, 생성 옵션, 자동 검색 여부를 그대로 전달합니다.
    return await retryPrompt(prompt, action, generationConfig, autoSearch);
  }
};

/**
 * 두 단계의 LLM 파이프라인을 순차적으로 수행합니다.
 * 1단계: 주제와 텍스트를 기반으로 모델에게 설명을 생성하도록 요청합니다.
 * 2단계: 생성된 설명을 바탕으로 대표곡 10곡의 제목을 검색하도록 요청합니다.
 *
 * @param {string} topics - 주제 (예: "KPOP")
 * @param {string} text - 텍스트 (예: "데이식스")
 * @returns {Promise<Object>} 파이프라인 실행 결과를 담은 객체
 *          예: {
 *                description: "모델이 생성한 설명",
 *                songs: "모델이 생성한 대표곡 목록 (JSON 형식의 문자열 혹은 배열)"
 *              }
 */
async function runModelPipeline(topics, text) {
  // 1단계: 주제와 텍스트를 이용해 설명 생성
  const pipeline1 = async (topics, text) => {
    return callModel({
      prompt: `${topics}라는 주제를 가지고 ${text}에 대한 정보를 소개, 특징, 성과 등을 포함해서 5줄의 평문으로 작성해주세요. 출력 예시: 아이유(이지은)는 2008년 데뷔한 대한민국의 대표적인 싱어송라이터이자 배우입니다. 뛰어난 작사, 작곡 능력과 독보적인 음색을 바탕으로 다양한 장르의 음악을 소화하며, '좋은 날', '밤편지', 'Blueming' 등 다수의 곡을 히트시켰습니다. 드라마 '드림하이', '호텔 델루나', 영화 '브로커' 등 다양한 작품에서 안정적인 연기력을 선보이며 배우로서도 인정받았습니다. MAMA 올해의 가수상, 골든디스크 대상 등 다수의 음악 시상식에서 수상하며 글로벌 스타로 자리매김했습니다. 팬들을 향한 진심 어린 소통과 꾸준한 활동으로 많은 사랑을 받고 있으며, 음악과 연기 분야에서 끊임없이 성장하는 모습으로 대중들에게 깊은 감동과 영감을 주는 아티스트입니다.`,
      modelName: modelQueue.peek(),
      generationConfig: {
        response_mime_type: "application/json",
        response_schema: {
          type: "STRING",
        },
      },
    });
  };

  const description = await pipeline1(topics, text);
  console.log("Description:", description);

  // 2단계: 생성된 설명을 기반으로 대표곡 10곡 검색
  const pipeline2 = async (text) => {
    return callModel({
      prompt: `${text}의 내용을 바탕으로 대표곡을 10곡 검색하고 곡의 제목만 출력하세요.`,
      modelName: modelQueue.peek(),
      generationConfig: {
        response_mime_type: "application/json",
        response_schema: {
          type: "ARRAY",
          items: {
            type: "STRING",
          },
        },
      },
    });
  };

  const songs = await pipeline2(description);
  console.log("Songs:", songs);

  const result = {
    description: description,
    songs: songs,
  };

  console.log("result:", result);
  return result;
}

// 파이프라인 실행: "KPOP" 주제와 "데이식스" 텍스트를 기반으로 실행
runModelPipeline("KPOP", "데이식스");
