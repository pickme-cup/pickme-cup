class CircularQueue {
  constructor(items) {
    // 입력값이 배열이거나 객체인지 확인
    if (Array.isArray(items)) {
      this.queue = [...items]; // 배열을 복사하여 큐 초기화
    } else if (typeof items === "object" && items !== null) {
      this.queue = Object.values(items); // 객체의 값들만 추출하여 배열로 큐 초기화
    } else {
      console.log("배열이나 객체를 입력해 주세요.");
      return;
    }

    this.front = 0; // 큐의 맨 앞
    this.rear = items.length - 1; // 큐의 맨 뒤
    this.size = this.queue.length; // 큐의 크기
  }

  isEmpty() {
    return this.front === -1;
  }

  isFull() {
    return (this.rear + 1) % this.size === this.front;
  }

  enqueue(item) {
    if (this.isFull()) {
      console.log("큐가 가득 찼습니다. 추가할 수 없습니다.");
      return;
    }

    // rear를 한 칸 뒤로 이동
    this.rear = (this.rear + 1) % this.size;
    this.queue[this.rear] = item;
  }

  dequeue() {
    if (this.isEmpty()) {
      console.log("큐가 비었습니다. 제거할 항목이 없습니다.");
      return null;
    }

    const item = this.queue[this.front];
    if (this.front === this.rear) {
      this.front = this.rear = -1; // 큐가 비어 있음
    } else {
      this.front = (this.front + 1) % this.size;
    }
    return item;
  }

  // 큐의 맨 앞 반환
  peek() {
    if (this.isEmpty()) {
      console.log("큐가 비었습니다.");
      return null;
    }
    return this.queue[this.front];
  }

  // 전체 큐 출력
  display() {
    if (this.isEmpty()) {
      console.log("큐가 비었습니다.");
      return;
    }

    let i = this.front;
    let result = [];
    while (i !== this.rear) {
      result.push(this.queue[i]);
      i = (i + 1) % this.size;
    }
    result.push(this.queue[this.rear]);
    console.log(result);
  }

  // 맨 앞 요소를 맨 뒤에 추가 및 값 반환
  rotateQueue() {
    const item = this.dequeue(); // 맨 앞 요소 제거

    if (item !== null) {
      this.enqueue(item); // 제거된 항목을 큐의 끝에 추가
      return item; // 제거된 항목 반환
    }

    return null;
  }
}
