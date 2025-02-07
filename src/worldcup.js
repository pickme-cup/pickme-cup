(() => {
  let items = [];
  let players = [];
  let playersReadyCount = 0;
  let currentPair = [];
  let currentRound = 0;
  let currentItemCount = 1;
  let itemsLoaded = false;
  let playersReady = false;

  /**
   * 첫 라운드를 설정합니다.
   * 현재 라운드를 설정하고, 현재 아이템 카운트를 1로 초기화합니다.
   * @param {array} array - 라운드 배열.
   */
  function setFirstRound(array) {
    currentRound = array.length;
    currentItemCount = 1;
  }

  /**
   * 배열을 무작위로 섞습니다.
   * @param {array} array - 섞을 배열.
   * @returns {array} - 섞인 배열.
   */
  function shuffleArray(array) {
    return array.sort(() => Math.random() - 0.5);
  }

  /**
   * 현재 라운드 정보를 화면에 표시합니다.
   * 현재 라운드가 1이면 "우승!", 2이면 "결승", 그 외에는 "[라운드]강([현재 아이템 번호]/[전체 아이템 수])" 형식으로 표시합니다.
   */
  function updateRoundInfo() {
    let text =
      currentRound === 1
        ? "우승!"
        : currentRound === 2
        ? "결승"
        : `${currentRound}강(${currentItemCount++}/${currentRound * 0.5})`;
    document.getElementById("round-info").textContent = text;
  }

  /**
   * 우승 시 페이지를 새로고침합니다.
   */
  function winner() {
    location.reload();
  }

  /**
   * 다음 대결 쌍을 화면에 표시합니다.
   * 대결할 두 아이템을 선택하고, 각 아이템에 해당하는 YouTube 비디오를 로드합니다.
   * 라운드가 끝났는지 확인하고, 끝났으면 다음 라운드를 설정하거나 최종 우승자를 표시합니다.
   */
  function displayNextPair() {
    if (items.length < 2) {
      if (currentRound === 1) {
        alert("최종 승자: " + items[0].title);
        winner();
        return;
      } else {
        items = shuffleArray(items);
        currentRound >>= 1;
      }
    }

    currentPair = items.splice(0, 2);
    for (let i = 0; i < 2; i++) {
      const videoId = extractVideoId(currentPair[i].youtubeLink);
      if (players[i]) {
        players[i].cueVideoById(videoId);
      } else {
        console.error(`플레이어 ${i}가 아직 준비되지 않았습니다.`);
      }
      document.getElementById(`item-title-${i}`).textContent =
        currentPair[i].title;
    }
    updateRoundInfo();
  }

  /**
   * 아이템을 선택했을 때의 동작을 처리합니다.
   * 선택되지 않은 다른 아이템의 비디오를 정지시키고, 선택된 아이템과 선택되지 않은 아이템에 CSS 클래스를 추가하여 시각적 효과를 줍니다.
   * 2초 후에 선택된 아이템을 다음 라운드에 진출시키고, 다음 대결 쌍을 표시합니다.
   * @param {number} index - 선택된 아이템의 인덱스 (0 또는 1).
   */
  function selectItem(index) {
    players.forEach((player, i) => {
      if (i !== index) player.stopVideo();
    });

    const cardContainer = document.querySelector(".card-container");
    cardContainer.style.pointerEvents = "none";

    const cards = document.querySelectorAll(".card");
    cards[index].classList.add("selected");
    cards[1 - index].classList.add("unselected");

    setTimeout(() => {
      items.push(currentPair[index]);
      if (items.length === currentRound / 2) {
        currentRound >>= 1;
        currentItemCount = 1;
        items = shuffleArray(items);
      }

      cards[index].classList.remove("selected");
      cards[1 - index].classList.remove("unselected");
      cardContainer.style.pointerEvents = "auto";
      displayNextPair();
    }, 2000);
  }

  /**
   * 'link_list.txt' 파일에서 아이템 목록을 읽어옵니다.
   * 파일을 읽어온 후, 파싱하고 섞어서 게임을 시작할 준비를 합니다.
   * 오류 발생 시 콘솔에 오류 메시지를 출력합니다.
   */
  async function readItems() {
    console.log("txt 파일 로드 준비");
    try {
      const response = await fetch("link_list.txt");
      const data = await response.text();
      const _Items = parseItems(data);
      items = shuffleArray(_Items);
      itemsLoaded = true;
      console.log("txt 파일 로드 완료");
      tryStartWorldCup();
    } catch (error) {
      console.error("파일 로딩 중 오류 발생:", error);
    }
  }

  /**
   * 텍스트 데이터를 파싱하여 아이템 객체 배열로 변환합니다.
   * 각 줄을 쉼표로 분리하여 제목과 YouTube 링크를 추출하고, 각 아이템을 객체로 만들어 배열에 추가합니다.
   * @param {string} data - 파싱할 텍스트 데이터.
   * @returns {array} - 아이템 객체 배열.
   */
  function parseItems(data) {
    return data
      .trim()
      .split("\n")
      .map((line) => {
        const [title, youtubeLink] = line
          .split(",")
          .map((item) => item.replace(/"/g, "").trim());
        return { title, youtubeLink };
      });
  }

  /**
   * 월드컵 게임을 시작합니다.
   * 첫 라운드를 설정하고, 다음 대결 쌍을 표시합니다.
   */
  function startWorldCup() {
    setFirstRound(items);
    displayNextPair();
  }

  /**
   * 월드컵 게임 시작을 시도합니다.
   * 아이템 로드와 플레이어 준비가 모두 완료되면 게임을 시작합니다.
   */
  function tryStartWorldCup() {
    console.log("월드컵 시작 시도");
    if (itemsLoaded && playersReady) {
      console.log("월드컵 시작 성공");
      startWorldCup();
    } else {
      console.log("월드컵 시작 실패");
    }
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
    playersReadyCount += 1;
    console.log("준비 완료된 플레이어 수: ", playersReadyCount);
    if (playersReadyCount === 2) {
      console.log("모든 플레이어 준비 완료");
      playersReady = true;
      readItems();
    }
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

    for (let i = 0; i < 2; i++) {
      const cards = document.querySelectorAll(".card");
      cards[i].addEventListener("click", () => {
        selectItem(i);
      });
    }

    onYouTubeIframeAPIReady();
  };
})();
