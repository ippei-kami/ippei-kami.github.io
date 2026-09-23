const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const startOverlay = document.getElementById('startOverlay');
const volumeSlider = document.getElementById('volumeSlider');

let width, height;
let isStarted = false;

// マウス・タッチの座標
const pointer = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    targetX: window.innerWidth / 2,
    targetY: window.innerHeight / 2,
    movedDistance: 0,
    lastMovedTime: Date.now()
};

// 色彩用オブジェクト群（オーロラのような塊）
const blobs = [];
const numBlobs = 5;

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}

window.addEventListener('resize', resize);
resize();

// Blob（色の塊）の初期化
for (let i = 0; i < numBlobs; i++) {
    const baseRadius = Math.min(width, height) * (0.12 + Math.random() * 0.05);
    blobs.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        baseRadius: baseRadius,
        radiusPhase: Math.random() * Math.PI * 2,
        radiusSpeed: 0.01 + Math.random() * 0.02,
        radius: baseRadius,
        hueOffset: Math.random() * 360,
        currentHue: Math.random() * 360
    });
}

// === Audio System ===
let audioCtx;
let masterGain;
let delayNode;
let filterNode;

// ペンタトニックスケール (C Major Pentatonic) の周波数
const pentatonicScale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];

function initAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    masterGain = audioCtx.createGain();
    masterGain.gain.value = parseFloat(volumeSlider.value);

    // ディレイエフェクト（空間的な広がり）
    delayNode = audioCtx.createDelay();
    delayNode.delayTime.value = 0.4;
    
    const delayFeedback = audioCtx.createGain();
    delayFeedback.gain.value = 0.4;
    
    delayNode.connect(delayFeedback);
    delayFeedback.connect(delayNode);
    
    // ローパスフィルター（柔らかい音質）
    filterNode = audioCtx.createBiquadFilter();
    filterNode.type = 'lowpass';
    filterNode.frequency.value = 2000;

    // 音の経路: delay/dry -> filter -> masterGain -> destination
    delayNode.connect(filterNode);
    filterNode.connect(masterGain);
    masterGain.connect(audioCtx.destination);
    
    isStarted = true;
    startOverlay.classList.add('hidden');
}

function playSound(x, y) {
    if (!isStarted || !audioCtx) return;

    // 画面のY座標を音階にマッピング（上が高い音）
    const normalizedY = 1 - (y / height);
    const scaleIndex = Math.floor(normalizedY * (pentatonicScale.length - 1));
    const frequency = pentatonicScale[scaleIndex];

    // 画面のX座標をパンニング（左右）にマッピング
    const normalizedX = (x / width) * 2 - 1; // -1 to 1

    const osc = audioCtx.createOscillator();
    osc.type = 'sine'; // 柔らかいサイン波
    osc.frequency.value = frequency;

    const env = audioCtx.createGain();
    
    const panner = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : null;
    if (panner) panner.pan.value = normalizedX;

    // エンベロープ（音の立ち上がりと減衰）
    const now = audioCtx.currentTime;
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(0.3, now + 0.1); // Attack
    env.gain.exponentialRampToValueAtTime(0.01, now + 2.0); // Decay & Release

    if (panner) {
        osc.connect(env);
        env.connect(panner);
        panner.connect(filterNode); // Dry
        panner.connect(delayNode);  // Wet
    } else {
        osc.connect(env);
        env.connect(filterNode);
        env.connect(delayNode);
    }

    osc.start(now);
    osc.stop(now + 2.1);
}

// === Interaction ===
function updatePointer(x, y) {
    const dx = x - pointer.targetX;
    const dy = y - pointer.targetY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    pointer.targetX = x;
    pointer.targetY = y;
    pointer.movedDistance += dist;

    // 一定距離動いたら音を鳴らす
    if (pointer.movedDistance > 150) {
        playSound(x, y);
        pointer.movedDistance = 0;
    }
}

window.addEventListener('mousemove', (e) => {
    updatePointer(e.clientX, e.clientY);
    pointer.lastMovedTime = Date.now();
});

window.addEventListener('touchmove', (e) => {
    updatePointer(e.touches[0].clientX, e.touches[0].clientY);
    pointer.lastMovedTime = Date.now();
});

startOverlay.addEventListener('click', initAudio);

volumeSlider.addEventListener('input', (e) => {
    if (masterGain && audioCtx) {
        masterGain.gain.setValueAtTime(parseFloat(e.target.value), audioCtx.currentTime);
    }
});

// === Rendering ===
function animate() {
    // 軌跡を残しつつクリア（滑らかな色の混ざり）
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, width, height);

    const isIdle = Date.now() - pointer.lastMovedTime > 2000;

    // アイドル状態のときにポインターのターゲット位置をゆっくり動かす（画面全体の漂い）
    if (isIdle) {
        const driftTime = Date.now() * 0.0005;
        pointer.targetX += Math.sin(driftTime) * 1.5;
        pointer.targetY += Math.cos(driftTime * 0.8) * 1.5;
        
        // 画面外に行きすぎないように制限
        pointer.targetX = Math.max(0, Math.min(width, pointer.targetX));
        pointer.targetY = Math.max(0, Math.min(height, pointer.targetY));
    }

    // ポインターの位置を滑らかに追従
    pointer.x += (pointer.targetX - pointer.x) * 0.05;
    pointer.y += (pointer.targetY - pointer.y) * 0.05;

    // 時間経過でゆっくりとベース色相を変化させる
    const time = Date.now() * 0.00005;

    // ベースとなる色相（ポインターのX座標依存 + 全体的な時間の変化）
    const baseHue = ((pointer.x / width) * 360 + time * 360) % 360;

    blobs.forEach((blob, index) => {
        // Blobの移動と状態更新
        if (index === 0) {
            // 1つ目のBlobはマウスに追従（操作したときのみ状態を更新）
            if (!isIdle) {
                blob.x += (pointer.x - blob.x) * 0.1;
                blob.y += (pointer.y - blob.y) * 0.1;
                blob.hueOffset += 0.5;
                blob.radiusPhase += blob.radiusSpeed;
                blob.radius = blob.baseRadius + Math.sin(blob.radiusPhase) * (blob.baseRadius * 0.3);
                blob.currentHue = (baseHue + blob.hueOffset + (pointer.y / height) * 100) % 360;
            }
        } else {
            // 他のBlobは自律移動
            blob.x += blob.vx;
            blob.y += blob.vy;

            // 画面端でバウンド
            if (blob.x < 0 || blob.x > width) blob.vx *= -1;
            if (blob.y < 0 || blob.y > height) blob.vy *= -1;
            
            blob.hueOffset += 0.5;
            blob.radiusPhase += blob.radiusSpeed;
            blob.radius = blob.baseRadius + Math.sin(blob.radiusPhase) * (blob.baseRadius * 0.3);
            blob.currentHue = (baseHue + blob.hueOffset + (blob.y / height) * 100) % 360;
        }

        // Blobの描画
        ctx.beginPath();
        const gradient = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, Math.max(1, blob.radius));
        
        gradient.addColorStop(0, `hsla(${blob.currentHue}, 100%, 60%, 0.8)`);
        gradient.addColorStop(1, `hsla(${blob.currentHue}, 100%, 60%, 0)`);

        ctx.fillStyle = gradient;
        ctx.arc(blob.x, blob.y, Math.max(1, blob.radius), 0, Math.PI * 2);
        ctx.fill();
    });

    requestAnimationFrame(animate);
}

animate();
