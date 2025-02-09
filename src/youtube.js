import axios from "axios";

const YOUTUBE_API_KEY = "";

async function getYoutubeVideoLink(text) {
  // 요청 파라미터 구성
  const searchParams = new URLSearchParams({
    part: "snippet",
    q: `${text} official`,
    order: "relevance", // 관련성 기준 정렬
    maxResults: "5",
    type: "video", // 영상만 검색
    videoEmbeddable: "true",
    // videoCategoryId: "10", // 음악 카테고리로 제한 (음악 카테고리 ID: 10)
    key: YOUTUBE_API_KEY, // API 키 (전역변수 또는 설정된 환경변수)
  });
  const requestUrl = `https://www.googleapis.com/youtube/v3/search?${searchParams.toString()}`;

  try {
    // axios를 사용하여 YouTube Search API 호출
    const searchResponse = await axios.get(requestUrl);
    const searchData = searchResponse.data;

    if (!searchData.items || searchData.items.length === 0) {
      throw new Error("검색 결과가 없습니다.");
    }

    // 검색 결과의 첫 번째 항목(관련성이 가장 높은 영상) 선택
    const topVideo = searchData.items[0];
    if (!topVideo || !topVideo.id || !topVideo.id.videoId) {
      throw new Error("유효한 영상 ID를 찾지 못했습니다.");
    }

    // YouTube 영상 URL 생성 후 반환
    const videoUrl = `https://www.youtube.com/watch?v=${topVideo.id.videoId}`;
    return { url: videoUrl };
  } catch (error) {
    console.error("유튜브 영상 검색 실패:", error);
    throw error;
  }
}

// 사용 예시
getYoutubeVideoLink("aespa - Black Mamba")
  .then((result) => console.log(result))
  .catch((err) => console.error(err));

getYoutubeVideoLink("aespa - Next Level")
  .then((result) => console.log(result))
  .catch((err) => console.error(err));

getYoutubeVideoLink("aespa - Savage")
  .then((result) => console.log(result))
  .catch((err) => console.error(err));

getYoutubeVideoLink("aespa - Drama")
  .then((result) => console.log(result))
  .catch((err) => console.error(err));

getYoutubeVideoLink("aespa - Hold On Tight")
  .then((result) => console.log(result))
  .catch((err) => console.error(err));

getYoutubeVideoLink("aespa - Spicy")
  .then((result) => console.log(result))
  .catch((err) => console.error(err));
