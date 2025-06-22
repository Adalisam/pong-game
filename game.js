const canvas = document.getElementById('pong');
const ctx = canvas.getContext('2d');

const setScoreInput = document.getElementById('setScore');
const setsToWinInput = document.getElementById('setsToWin');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const setInfo = document.getElementById('setInfo');

const sounds = {
    paddles: [new Audio('paddle1.wav'), new Audio('paddle2.wav')],
    wall: new Audio('wall.wav'),
    score: new Audio('score.wav'),
    win: new Audio('win.wav'),
    lose: new Audio('lose.wav'),
    winner: new Audio('winner.wav'),
    loser: new Audio('loser.wav')
};

const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 80;
const BALL_RADIUS = 10;
const AI_SPEED = 4;
const PAUSE_DURATION = 1000;

let leftPaddle, rightPaddle, ball;
let leftScore, rightScore, leftSets, rightSets;
let setScore, setsToWin;
let paused = false;
let pauseTimer = null;
let gameRunning = false;
let matchWinner = null;
let waitingToStart = true;

function resetGameState() {
    leftPaddle = { x: 0, y: canvas.height/2 - PADDLE_HEIGHT/2, width: PADDLE_WIDTH, height: PADDLE_HEIGHT, color: "#4CAF50" };
    rightPaddle = { x: canvas.width - PADDLE_WIDTH, y: canvas.height/2 - PADDLE_HEIGHT/2, width: PADDLE_WIDTH, height: PADDLE_HEIGHT, color: "#E91E63" };
    ball = {
        x: canvas.width/2,
        y: canvas.height/2,
        radius: BALL_RADIUS,
        speed: 5,
        velocityX: 0,
        velocityY: 0,
        color: "#FFEB3B"
    };
    leftScore = 0;
    rightScore = 0;
    leftSets = 0;
    rightSets = 0;
    setScore = parseInt(setScoreInput.value) || 5;
    setsToWin = parseInt(setsToWinInput.value) || 2;
    paused = false;
    pauseTimer = null;
    gameRunning = false;
    matchWinner = null;
    waitingToStart = true;
    updateSetInfo();
}

function startNewMatch() {
    setScore = parseInt(setScoreInput.value) || 5;
    setsToWin = parseInt(setsToWinInput.value) || 2;
    leftScore = 0;
    rightScore = 0;
    leftSets = 0;
    rightSets = 0;
    matchWinner = null;
    paused = false;
    waitingToStart = false;
    gameRunning = true;
    resetBall();
    updateSetInfo();
}

function resetBall() {
    ball.x = canvas.width/2;
    ball.y = canvas.height/2;
    ball.speed = 5;
    if (!waitingToStart) {
        ball.velocityX = 5 * (Math.random() > 0.5 ? 1 : -1);
        ball.velocityY = 5 * (Math.random() > 0.5 ? 1 : -1);
    } else {
        ball.velocityX = 0;
        ball.velocityY = 0;
    }
}

function playSound(effect) {
    if (effect === 'paddle') {
        const idx = Math.floor(Math.random() * sounds.paddles.length);
        const sound = sounds.paddles[idx];
        sound.currentTime = 0;
        sound.play();
    } else if (sounds[effect]) {
        sounds[effect].currentTime = 0;
        sounds[effect].play();
    }
}

canvas.addEventListener("mousemove", function(evt) {
    let rect = canvas.getBoundingClientRect();
    let scaleY = canvas.height / rect.height;
    let mouseY = (evt.clientY - rect.top) * scaleY;
    leftPaddle.y = mouseY - leftPaddle.height / 2;
    leftPaddle.y = Math.max(Math.min(leftPaddle.y, canvas.height - leftPaddle.height), 0);
});

function collision(b, p) {
    return  b.x + b.radius > p.x &&
            b.x - b.radius < p.x + p.width &&
            b.y + b.radius > p.y &&
            b.y - b.radius < p.y + p.height;
}

function pauseGameAndResetBall() {
    paused = true;
    pauseTimer = setTimeout(() => {
        resetBall();
        paused = false;
    }, PAUSE_DURATION);
}

function updateSetInfo() {
    setInfo.textContent = `Set: ${leftSets + rightSets + 1} | Sets: Player ${leftSets} - AI ${rightSets} | First to ${setScore} pts, ${setsToWin} sets wins`;
    if (matchWinner) {
        setInfo.textContent += ` | Winner: ${matchWinner}`;
    }
}

function update() {
    if (waitingToStart || !gameRunning || paused) return;

    ball.x += ball.velocityX;
    ball.y += ball.velocityY;

    if (ball.y > rightPaddle.y + rightPaddle.height/2) {
        rightPaddle.y += AI_SPEED;
    } else {
        rightPaddle.y -= AI_SPEED;
    }
    rightPaddle.y = Math.max(Math.min(rightPaddle.y, canvas.height - rightPaddle.height), 0);

    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.velocityY = -ball.velocityY;
        playSound('wall');
    }

    let currentPaddle = (ball.x < canvas.width/2) ? leftPaddle : rightPaddle;
    if (collision(ball, currentPaddle)) {
        let collidePoint = (ball.y - (currentPaddle.y + currentPaddle.height/2));
        collidePoint = collidePoint / (currentPaddle.height/2);
        let angleRad = (Math.PI / 4) * collidePoint;
        let direction = (ball.x < canvas.width/2) ? 1 : -1;
        ball.velocityX = direction * ball.speed * Math.cos(angleRad);
        ball.velocityY = ball.speed * Math.sin(angleRad);
        ball.speed += 0.2;
        playSound('paddle');
    }

    if (ball.x - ball.radius < 0) {
        rightScore++;
        playSound('lose');
        checkSetEnd();
    } else if (ball.x + ball.radius > canvas.width) {
        leftScore++;
        playSound('win');
        checkSetEnd();
    }
}

function checkSetEnd() {
    if (leftScore >= setScore || rightScore >= setScore) {
        let playerWonSet = leftScore > rightScore;
        if (playerWonSet) {
            leftSets++;
            playSound('win');
        } else {
            rightSets++;
            playSound('lose');
        }
        if (leftSets >= setsToWin || rightSets >= setsToWin) {
            gameRunning = false;
            matchWinner = leftSets > rightSets ? "Player" : "AI";
            updateSetInfo();
            setTimeout(() => {
                if (matchWinner === "Player") {
                    playSound('winner');
                    alert(`Player wins the match! Press "Start Game" to play again.`);
                } else {
                    playSound('loser');
                    alert(`AI wins the match! Press "Start Game" to play again.`);
                }
            }, 100);
        } else {
            leftScore = 0;
            rightScore = 0;
            pauseGameAndResetBall();
            updateSetInfo();
        }
    } else {
        pauseGameAndResetBall();
    }
}

function render() {
    drawRect(0, 0, canvas.width, canvas.height, "#222");
    for (let i = 0; i < canvas.height; i += 32) {
        drawRect(canvas.width/2 - 2, i, 4, 16, "#fff");
    }
    drawRect(leftPaddle.x, leftPaddle.y, leftPaddle.width, leftPaddle.height, leftPaddle.color);
    drawRect(rightPaddle.x, rightPaddle.y, rightPaddle.width, rightPaddle.height, rightPaddle.color);
    drawCircle(ball.x, ball.y, ball.radius, ball.color);
    drawText(leftScore, canvas.width/4, 50);
    drawText(rightScore, 3*canvas.width/4, 50);

    if (waitingToStart) {
        ctx.fillStyle = "#fff";
        ctx.font = "36px Arial";
        ctx.fillText("Press 'Start Game' to Play", canvas.width/2 - ctx.measureText("Press 'Start Game' to Play").width/2, canvas.height/2);
    } else if (paused) {
        ctx.fillStyle = "#fff";
        ctx.font = "36px Arial";
        ctx.fillText("Get Ready!", canvas.width/2 - ctx.measureText("Get Ready!").width/2, canvas.height/2);
    }
    if (!gameRunning && matchWinner) {
        ctx.fillStyle = "#FFD700";
        ctx.font = "48px Arial";
        const winText = `${matchWinner} Wins!`;
        const textWidth = ctx.measureText(winText).width;
        ctx.fillText(winText, canvas.width/2 - textWidth/2, canvas.height/2 - 30);
    }
}

function drawRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}
function drawCircle(x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI*2, false);
    ctx.closePath();
    ctx.fill();
}
function drawText(text, x, y) {
    ctx.fillStyle = "#fff";
    ctx.font = "40px Arial";
    ctx.fillText(text, x, y);
}

function game() {
    update();
    render();
    requestAnimationFrame(game);
}

startBtn.addEventListener('click', () => {
    startNewMatch();
});

resetBtn.addEventListener('click', () => {
    resetGameState();
});

resetGameState();
game();
