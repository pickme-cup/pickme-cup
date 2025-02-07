(() => {
  let players = [];

  function setWinnerTitle(winner) {
    const title = document.querySelector(".winner-title");
    title.textContent = winner;
  }

  async function setWinnerDescriptionWithGemini(winner) {
    const textElement = document.querySelector(".winner-text");
    const spinnerContainer = document.querySelector(".spinner-container");
    const backHomeBtnContainer = document.querySelector(".back-home-container");
    const topics = "가수";

    // 스피너 보이기
    spinnerContainer.classList.remove("d-none");
    backHomeBtnContainer.style.display = "none"; // 버튼 숨기기

    try {
      const url = `https://decisive-buttery-fork.glitch.me/api/models/gemini?topics=${encodeURIComponent(
        topics
      )}&text=${encodeURIComponent(winner)}`;
      const response = await axios.get(url);

      const description = response.data.reply.description;

      // 스피너 숨기기
      spinnerContainer.classList.add("d-none");

      function typeTextEffect(element, text, speed = 50) {
        element.textContent = "";
        let index = 0;
        function typeNextChar() {
          if (index < text.length) {
            element.textContent += text[index];
            index++;
            setTimeout(typeNextChar, speed);
          } else {
            // 텍스트 출력이 끝난 후 버튼 표시 (페이드인 애니메이션 적용)
            setTimeout(() => {
              backHomeBtnContainer.style.display = "block";
            }, 1000);
          }
        }
        typeNextChar();
      }
      typeTextEffect(textElement, description, 40);
    } catch (error) {
      console.error("AI 응답 생성 요청에 실패했습니다.", error);
      spinnerContainer.classList.add("d-none");
      textElement.textContent = "설명을 불러오는 데 실패했습니다.";
      backHomeBtnContainer.style.display = "block"; // 에러 발생 시 버튼 표시
    }
  }

  function displayWinner() {
    //  파라미터 값 가져오기
    const searchParams = new URLSearchParams(location.search);
    const title = searchParams.get("title");
    console.log(title);
    const youtubeLink = searchParams.get("youtubeLink");

    const videoId = extractVideoId(youtubeLink);
    if (players[0]) {
      players[0].cueVideoById(videoId);
    } else {
      console.error(`플레이어가 아직 준비되지 않았습니다.`);
    }

    setWinnerTitle(title);
    console.log(title.split("-")[0].trim());
    setWinnerDescriptionWithGemini(title.split("-")[0].trim());
  }

  /**
   * YouTube 링크에서 비디오 ID를 추출합니다.
   * '/embed/' 경로 또는 'v' 쿼리 파라미터를 사용하여 비디오 ID를 찾습니다.
   * @param {string} youtubeLink - YouTube 링크.
   * @returns {string} - 비디오 ID.
   */
  function extractVideoId(youtubeLink) {
    const url = new URL(youtubeLink);
    return url.pathname.startsWith("/embed/")
      ? url.pathname.split("/embed/")[1]
      : url.searchParams.get("v");
  }

  /**
   * YouTube Iframe API가 준비되면 호출됩니다.
   * 각 YouTube 플레이어 iframe에 대해 YT.Player 객체를 생성하고, 이벤트 핸들러를 설정합니다.
   */
  function onYouTubeIframeAPIReady() {
    const iframeElements = document.querySelectorAll(".youtube-player");
    iframeElements.forEach((iframe, index) => {
      players.push(
        new YT.Player(iframe, {
          events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange,
          },
        })
      );
    });
  }

  /**
   * 플레이어가 준비될 때마다 호출됩니다.
   * 플레이어 준비 카운트를 증가시키고, 모든 플레이어가 준비되면 게임 시작을 시도합니다.
   * @param {object} event - 플레이어 이벤트 객체.
   */
  function onPlayerReady(event) {
    event.target.pauseVideo();
    console.log("플레이어 준비 완료");
    displayWinner();
  }

  /**
   * 플레이어 상태가 변경될 때마다 호출됩니다.
   * 한 플레이어가 재생 중이면 다른 플레이어는 일시 중지시킵니다.
   * @param {object} event - 플레이어 이벤트 객체.
   */
  function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
      players.forEach((player) => {
        if (player !== event.target) player.pauseVideo();
      });
    }
  }

  /**
   * 웹 페이지가 로드되면 호출됩니다.
   * 각 카드에 클릭 이벤트 리스너를 추가하고, YouTube Iframe API를 초기화합니다.
   */
  window.onload = () => {
    console.log("웹 페이지 로드 완료");

    onYouTubeIframeAPIReady();
  };
})();
