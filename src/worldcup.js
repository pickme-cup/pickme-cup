let items = [];
let players = [];
let playersReadyCount = 0;
let currentPair = [];
let currentRound = 0;
let currentItemCount = 1;
let itemsLoaded = false;
let playersReady = false;

// YouTube IFrame API 로드
const script = document.createElement("script");
script.src = "https://www.youtube.com/iframe_api";
document.head.appendChild(script);

// 초기 라운드 설정
function setFirstRound(array) {
  currentRound = array.length;
  currentItemCount = 1;
}

// 배열을 랜덤으로 섞은 후 반환
function shuffleArray(array) {
  return array.sort(() => Math.random() - 0.5);
}

// 라운드 정보 갱신
function updateRoundInfo() {
  let text = "";

  if (currentRound === 1) {
    text = "우승!";
  } else if (currentRound === 2) {
    text = "결승";
  } else {
    text = `${currentRound}강(${currentItemCount++}/${currentRound * 0.5})`;
  }

  document.getElementById("round-info").textContent = text;
}

// 승자 처리
function winner() {
  location.href = "../resources/templates/winner.html";
}

// 화면 그리기
function displayNextPair() {
  if (!playersReady) {
    console.log("플레이어 준비되지 않음. 대기 중...");
    return; // 플레이어가 준비되지 않으면 실행하지 않음
  }

  if (items.length < 2) {
    if (currentRound === 1) {
      alert("최종 승자: " + items[0].title);
      currentRound >>= 1;
      winner();
      return;
    } else {
      items = shuffleArray(items);
      currentRound >>= 1;
    }
  }

  console.log("displayNextPair 호출");
  currentPair = items.splice(0, 2);
  for (let i = 0; i < 2; i++) {
    // 동영상 ID 추출 후 플레이어 API를 이용해 로드
    const videoId = extractVideoId(currentPair[i].youtubeLink);

    // players 배열에 유효한 플레이어가 있는지 확인
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

function selectItem(index) {
  // 다른 플레이어의 영상이 재생 중이면 정지시킴
  players.forEach((player, i) => {
    if (i !== index) {
      player.stopVideo();
    }
  });

  // 카드 영역 클릭 막기
  const cardContainer = document.querySelector(".card-container");
  cardContainer.style.pointerEvents = "none";

  const cards = document.querySelectorAll(".card");
  cards[index].classList.add("selected");
  cards[1 - index].classList.add("unselected");

  // 애니메이션이 끝난 후 딜레이 후에 다음 라운드로 이동
  setTimeout(() => {
    items.push(currentPair[index]);

    // 선택 후 모든 아이템을 비교했을 때 다음 라운드로 넘어가기
    if (items.length === currentRound / 2) {
      currentRound >>= 1;
      currentItemCount = 1;
      items = shuffleArray(items);
    }

    cards[index].classList.remove("selected");
    cards[1 - index].classList.remove("unselected");

    cardContainer.style.pointerEvents = "auto";

    // 새로운 아이템을 화면에 표시
    displayNextPair();
  }, 2000);
}

// 텍스트 파일에서 링크를 로드함
async function readItems() {
  console.log("txt 파일 로드 준비");
  try {
    const response = await fetch("./link_list.txt");
    const data = await response.text();
    const _Items = parseItems(data);

    items = shuffleArray(_Items);
    itemsLoaded = true;

    // 아이템과 플레이어 둘 다 준비되었는지 확인 후 게임 시작 시도
    console.log("txt 파일 로드 완료");
    tryStartWorldCup();
  } catch (error) {
    console.error("파일 로딩 중 오류 발생:", error);
  }
}

// 텍스트 파일 파싱
function parseItems(data) {
  return data
    .trim()
    .split("\n") // 줄 단위로 분리
    .map((line) => {
      // 각 줄을 콤마로 분리
      const [title, youtubeLink] = line
        .split(",")
        .map((item) => item.replace(/"/g, "").trim());
      return { title, youtubeLink };
    });
}

// 월드컵 시작 함수
function startWorldCup() {
  setFirstRound(items);
  displayNextPair();
}

// 아이템과 플레이어가 모두 로딩된 경우에 월드컵을 시작하는 함수
function tryStartWorldCup() {
  console.log("월드컵 시작 시도");
  if (itemsLoaded && playersReady) {
    console.log("월드컵 시작 성공");
    startWorldCup();
  } else {
    console.log("월드컵 시작 실패");
  }
}

// YouTube 링크에서 videoId를 추출하는 함수
function extractVideoId(youtubeLink) {
  const url = new URL(youtubeLink);

  // 경로가 "/embed/"를 포함하는 경우 해당 부분을 이용하여 videoId 추출
  if (url.pathname.startsWith("/embed/")) {
    return url.pathname.split("/embed/")[1];
  }

  // 일반적인 "watch?v=videoId" 형태의 링크
  return url.searchParams.get("v");
}

// 유튭 플레이어 준비 완료 시 호출
function onYouTubeIframeAPIReady() {
  //  console.log("onYouTubeIframeAPIReady 호출됨");
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

// 플레이어가 준비되었을 때 호출되는 함수
function onPlayerReady(event) {
  event.target.pauseVideo();
  playersReadyCount += 1;
  console.log("준비 완료된 플레이어 수: ", playersReadyCount);

  // 모든 플레이어가 준비되었는지 확인
  if (playersReadyCount === 2) {
    console.log("모든 플레이어 준비 완료");
    playersReady = true;
    readItems();
  }
}

// 플레이어의 상태가 변경될 때 호출되는 함수
function onPlayerStateChange(event) {
  // 재생 상태가 감지되면 현재 재생 중인 플레이어를 제외한 나머지 플레이어의 영상을 정지
  if (event.data === YT.PlayerState.PLAYING) {
    players.forEach((player) => {
      if (player !== event.target) {
        player.pauseVideo();
      }
    });
  }
}
