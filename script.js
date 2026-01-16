const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ==========================================
// 1. 게임 변수 및 설정
// ==========================================
let frames = 0;
const DEGREE = Math.PI / 180;

// 스프라이트 이미지 (이미지가 없으면 색깔 박스로 대체됨)
const spriteBird = new Image();
spriteBird.src = 'bird.png';

const spriteBg = new Image();
spriteBg.src = 'bg.png';

const spritePipe = new Image();
spritePipe.src = 'pipe.png';

// 게임 상태
let currentState;
const state = {
    getReady: 0,
    game: 1,
    over: 2
};

// ==========================================
// 2. 입력 핸들링
// ==========================================
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const getReadyScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const scoreElement = document.getElementById('score');
const finalScoreElement = document.getElementById('final-score');

if (startBtn) {
    startBtn.addEventListener('click', () => {
        if (currentState === state.getReady) {
            currentState = state.game;
            getReadyScreen.classList.remove('active');
            bird.flap();
        }
    });
}

if (restartBtn) {
    restartBtn.addEventListener('click', () => {
        resetGame();
        currentState = state.getReady;
        gameOverScreen.classList.remove('active');
        getReadyScreen.classList.add('active');
    });
}

function handleInput(e) {
    if (e.type === 'keydown') {
        if (e.code !== 'Space' && e.code !== 'ArrowUp') return;
    }
    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return;

    if (currentState === state.getReady) {
        currentState = state.game;
        getReadyScreen.classList.remove('active');
        bird.flap();
    } else if (currentState === state.game) {
        bird.flap();
    }
}

document.addEventListener('keydown', handleInput);
document.addEventListener('mousedown', handleInput);
document.addEventListener('touchstart', (e) => {
    if (e.target.closest('.control-panel') || e.target.closest('.screen button')) return;
    handleInput(e);
}, { passive: false });

// ==========================================
// 3. 게임 객체 (수정됨: 이미지가 없어도 보이게 설정)
// ==========================================
const bg = {
    x: 0, y: 0, w: 320, h: 480, dx: 1,
    draw: function () {
        // 배경색 채우기 (이미지 없을 때를 대비)
        ctx.fillStyle = "#70c5ce";
        ctx.fillRect(0, 0, this.w, this.h);

        // 이미지 그리기
        if (spriteBg.complete && spriteBg.naturalHeight !== 0) {
            ctx.drawImage(spriteBg, this.x, this.y, this.w, this.h);
            ctx.drawImage(spriteBg, this.x + this.w, this.y, this.w, this.h);
        }
    },
    update: function () {
        if (currentState === state.game) {
            this.x = (this.x - this.dx) % this.w;
        }
    }
};

const bird = {
    animation: [0, 1, 2, 1],
    x: 50, y: 150, w: 34, h: 24,
    speed: 0, gravity: 0.25, jump: 4.6, rotation: 0,

    draw: function () {
        ctx.save();
        ctx.translate(this.x + this.w / 2, this.y + this.h / 2);

        // 회전 로직
        if (this.speed < 0) this.rotation = -25 * DEGREE;
        else {
            this.rotation += 2 * DEGREE;
            if (this.rotation > 90 * DEGREE) this.rotation = 90 * DEGREE;
        }
        ctx.rotate(this.rotation);

        // [중요] 이미지가 없으면 빨간 박스를, 있으면 이미지를 그리기
        if (spriteBird.complete && spriteBird.naturalHeight !== 0) {
            ctx.drawImage(spriteBird, -this.w / 2, -this.h / 2, this.w, this.h);
        } else {
            // 대체 그래픽 (빨간 새)
            ctx.fillStyle = "red";
            ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
        }

        ctx.restore();
    },
    flap: function () { this.speed = -this.jump; },
    update: function () {
        if (currentState === state.getReady) {
            this.y = 150 + Math.cos(frames / 5) * 5;
            this.rotation = 0; this.speed = 0;
        } else if (currentState === state.game) {
            this.speed += this.gravity;
            this.y += this.speed;

            // 바닥 충돌
            if (this.y + this.h / 2 >= canvas.height) {
                this.y = canvas.height - this.h / 2;
                currentState = state.over;
                gameOver();
            }
        }
    },
    reset: function () { this.speed = 0; this.rotation = 0; this.y = 150; }
};

const pipes = {
    position: [], w: 52, h: 400, dx: 2,
    draw: function () {
        for (let i = 0; i < this.position.length; i++) {
            let p = this.position[i];
            let topY = p.y;
            let bottomY = p.y + this.h + p.gap;

            // 위쪽 파이프
            ctx.fillStyle = "green"; // 대체 색상
            if (spritePipe.complete && spritePipe.naturalHeight !== 0) {
                ctx.save();
                ctx.translate(p.x + this.w / 2, topY + this.h / 2);
                ctx.rotate(Math.PI);
                ctx.drawImage(spritePipe, -this.w / 2, -this.h / 2, this.w, this.h);
                ctx.restore();
            } else {
                ctx.fillRect(p.x, topY, this.w, this.h); // 위쪽 파이프 박스
            }

            // 아래쪽 파이프
            if (spritePipe.complete && spritePipe.naturalHeight !== 0) {
                ctx.drawImage(spritePipe, p.x, bottomY, this.w, this.h);
            } else {
                ctx.fillRect(p.x, bottomY, this.w, this.h); // 아래쪽 파이프 박스
            }
        }
    },
    update: function () {
        if (currentState !== state.game) return;
        if (frames % 100 === 0) {
            let difficultyGap = Math.max(85, 150 - (score.value * 2));
            this.position.push({
                x: canvas.width,
                y: Math.floor(Math.random() * (-100 - -300 + 1) + -300),
                gap: difficultyGap
            });
        }
        for (let i = 0; i < this.position.length; i++) {
            let p = this.position[i];
            p.x -= this.dx;

            // 충돌 체크
            let birdRect = { l: bird.x, r: bird.x + bird.w, t: bird.y, b: bird.y + bird.h };
            let pipeRectTop = { l: p.x, r: p.x + this.w, t: p.y, b: p.y + this.h };
            let pipeRectBot = { l: p.x, r: p.x + this.w, t: p.y + this.h + p.gap, b: p.y + this.h + p.gap + this.h };

            // 간단 충돌 로직
            if (birdRect.r > p.x && birdRect.l < p.x + this.w) {
                if (birdRect.t < p.y + this.h || birdRect.b > p.y + this.h + p.gap) {
                    currentState = state.over;
                    gameOver();
                }
            }

            if (p.x + this.w <= 0) {
                this.position.shift();
                score.value += 1;
                scoreElement.innerHTML = score.value;
                i--;
            }
        }
    },
    reset: function () { this.position = []; }
};

const score = {
    value: 0,
    reset: function () { this.value = 0; scoreElement.innerHTML = 0; }
};

// ==========================================
// 4. 게임 루프 및 로직 (수정됨)
// ==========================================
function gameOver() {
    gameOverScreen.classList.add('active');
    finalScoreElement.innerText = score.value;
}

function resetGame() {
    bird.reset();
    pipes.reset();
    score.reset();
    frames = 0;
}

function loop() {
    bg.update(); bg.draw();
    pipes.update(); pipes.draw();
    bird.update(); bird.draw();

    // [중요] 아까 빠져있던 UI 업데이트 함수를 여기에 추가!
    updateMicUI();

    frames++;
    requestAnimationFrame(loop);
}

// ==========================================
// 5. 음성 인식 로직 (순서 변경: 루프 실행 전 변수 선언)
// ==========================================
let audioContext, analyser, microphone, javascriptNode;
let isMicEnabled = false;
let sensitivity = 30;
let currentMicVolume = 0;
let isAboveThreshold = false;
const VOICE_COOLDOWN = 10;
let lastVoiceJumpTime = 0;

// UI 요소
const enableMicBtn = document.getElementById('enable-mic-btn');
const micMeterFill = document.getElementById('mic-meter-fill');
const micThresholdLine = document.getElementById('mic-threshold-line');
const sensitivitySlider = document.getElementById('sensitivity-slider');

// 슬라이더 및 버튼 이벤트
if (sensitivitySlider) {
    sensitivitySlider.addEventListener('input', (e) => {
        sensitivity = e.target.value;
        if (micThresholdLine) micThresholdLine.style.left = sensitivity + '%';
    });
}

if (enableMicBtn) {
    enableMicBtn.addEventListener('click', () => {
        if (!isMicEnabled) startMicrophone();
        else stopMicrophone();
    });
}

function startMicrophone() {
    if (!navigator.mediaDevices) return alert('마이크 오류: 브라우저 설정에서 마이크를 허용해주세요.');

    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(stream);
        javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

        // ▼▼▼ [여기를 수정했습니다] ▼▼▼
        // 0.8 -> 0.1로 변경 (숫자가 낮을수록 게이지가 팍팍 움직입니다)
        analyser.smoothingTimeConstant = 0.1;
        // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

        analyser.fftSize = 1024;

        microphone.connect(analyser);
        analyser.connect(javascriptNode);
        javascriptNode.connect(audioContext.destination);

        javascriptNode.onaudioprocess = function () {
            const array = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(array);
            let values = 0;
            for (let i = 0; i < array.length; i++) values += array[i];

            currentMicVolume = Math.min(100, Math.round((values / array.length) * 2));
            checkVoiceTrigger(currentMicVolume);
        };

        isMicEnabled = true;
        enableMicBtn.textContent = '🔊 ON';
        enableMicBtn.classList.add('active');
    }).catch(err => {
        console.error(err);
        alert('마이크 권한이 필요합니다.');
    });
}

function stopMicrophone() {
    if (audioContext) audioContext.close();
    isMicEnabled = false;
    enableMicBtn.textContent = '🔇 OFF';
    enableMicBtn.classList.remove('active');
    currentMicVolume = 0;
}
// 1. 연속 점프가 발동되기까지 기다리는 시간 (잔향 무시용)
// "아!" 하고 짧게 칠 때 소리가 줄어드는 시간보다 길어야 합니다. (보통 300~400ms)
const HOLD_DELAY = 350;

// 2. 연속 점프 모드에 진입했을 때 점프 간격 (연타 속도)
const RAPID_FIRE_RATE = 80;

let thresholdStartTime = 0; // 소리가 커진 시점을 기록

function checkVoiceTrigger(volume) {
    if (volume > sensitivity) {
        const now = Date.now();

        // A. 소리가 막 커진 순간 (Rising Edge) -> 즉시 1회 점프
        if (!isAboveThreshold) {
            triggerJump();
            thresholdStartTime = now; // "꾹 누르기" 시작 시간 기록
            lastVoiceJumpTime = now;
            isAboveThreshold = true;
        }
        // B. 소리가 계속 유지되고 있는 경우 (Holding)
        else {
            // 소리가 유지된 지 0.35초(HOLD_DELAY)가 지났는지 확인
            // (이 시간이 지나야만 연속 점프 모드로 진입)
            if (now - thresholdStartTime > HOLD_DELAY) {

                // 연속 점프 쿨다운 체크
                if (now - lastVoiceJumpTime > RAPID_FIRE_RATE) {
                    triggerJump();
                    lastVoiceJumpTime = now;
                }
            }
        }
    } else {
        // 소리가 작아지면 모든 상태 리셋
        isAboveThreshold = false;
        thresholdStartTime = 0;
    }
}

function triggerJump() {
    if (currentState === state.getReady) {
        currentState = state.game;
        getReadyScreen.classList.remove('active');
        bird.flap();
    } else if (currentState === state.game) {
        bird.flap();
    }
}

function updateMicUI() {
    if (!micMeterFill) return;
    micMeterFill.style.width = currentMicVolume + '%';
    if (currentMicVolume > sensitivity) {
        micMeterFill.style.backgroundColor = '#e74c3c';
    } else {
        micMeterFill.style.backgroundColor = '#2ecc71';
    }
}

// [핵심] 모든 준비가 끝난 뒤 게임 루프 시작
currentState = state.getReady;
loop();