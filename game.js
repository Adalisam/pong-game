const canvas = document.getElementById('pong');
const ctx = canvas.getContext('2d');

// Constants
const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 80;
const BALL_RADIUS = 10;
const PADDLE_SPEED = 6;
const AI_SPEED = 4;

// Game state
let leftPaddle = {
    x: 0,
    y: canvas.height/2 - PADDLE_HEIGHT/2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    color: "#4CAF50"
};

let rightPaddle = {
    x: canvas.width - PADDLE_WIDTH,
    y: canvas.height/2 - PADDLE_HEIGHT/2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    color: "#E91E63"
};

let ball = {
    x: canvas.width/2,
    y: canvas.height/2,
    radius: BALL_RADIUS,
    speed: 5,
    velocityX: 5 * (Math.random() > 0.5 ? 1 : -1),
    velocityY: 5 * (Math.random() > 0.5 ? 1 : -1),
    color: "#FFEB3B"
};

// Score (optional)
let leftScore = 0;
let rightScore = 0;

// Draw functions
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

function resetBall() {
    ball.x = canvas.width/2;
    ball.y = canvas.height/2;
    ball.velocityX = 5 * (Math.random() > 0.5 ? 1 : -1);
    ball.velocityY = 5 * (Math.random() > 0.5 ? 1 : -1);
}

// Mouse movement for left paddle
canvas.addEventListener("mousemove", function(evt) {
    let rect = canvas.getBoundingClientRect();
    let scaleY = canvas.height / rect.height;
    let mouseY = (evt.clientY - rect.top) * scaleY;
    leftPaddle.y = mouseY - leftPaddle.height / 2;
    // Don't allow paddle to go outside canvas
    leftPaddle.y = Math.max(Math.min(leftPaddle.y, canvas.height - leftPaddle.height), 0);
});

// Collision detection
function collision(b, p) {
    return  b.x + b.radius > p.x &&
            b.x - b.radius < p.x + p.width &&
            b.y + b.radius > p.y &&
            b.y - b.radius < p.y + p.height;
}

// Game update
function update() {
    // Move the ball
    ball.x += ball.velocityX;
    ball.y += ball.velocityY;

    // AI paddle movement (simple)
    if (ball.y > rightPaddle.y + rightPaddle.height/2) {
        rightPaddle.y += AI_SPEED;
    } else {
        rightPaddle.y -= AI_SPEED;
    }
    // Clamp to canvas
    rightPaddle.y = Math.max(Math.min(rightPaddle.y, canvas.height - rightPaddle.height), 0);

    // Ball collision with top and bottom
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.velocityY = -ball.velocityY;
    }

    // Ball collision with paddles
    let currentPaddle = (ball.x < canvas.width/2) ? leftPaddle : rightPaddle;
    if (collision(ball, currentPaddle)) {
        // Calculate hit position
        let collidePoint = (ball.y - (currentPaddle.y + currentPaddle.height/2));
        collidePoint = collidePoint / (currentPaddle.height/2);
        // Calculate angle
        let angleRad = (Math.PI / 4) * collidePoint;
        // Direction
        let direction = (ball.x < canvas.width/2) ? 1 : -1;
        // Change velocity
        ball.velocityX = direction * ball.speed * Math.cos(angleRad);
        ball.velocityY = ball.speed * Math.sin(angleRad);
        // Optional: slightly increase speed
        ball.speed += 0.2;
    }

    // Ball goes off left or right
    if (ball.x - ball.radius < 0) {
        rightScore++;
        resetBall();
        ball.speed = 5;
    } else if (ball.x + ball.radius > canvas.width) {
        leftScore++;
        resetBall();
        ball.speed = 5;
    }
}

// Render everything
function render() {
    // Clear
    drawRect(0, 0, canvas.width, canvas.height, "#222");
    // Net
    for (let i = 0; i < canvas.height; i += 32) {
        drawRect(canvas.width/2 - 2, i, 4, 16, "#fff");
    }
    // Paddles
    drawRect(leftPaddle.x, leftPaddle.y, leftPaddle.width, leftPaddle.height, leftPaddle.color);
    drawRect(rightPaddle.x, rightPaddle.y, rightPaddle.width, rightPaddle.height, rightPaddle.color);
    // Ball
    drawCircle(ball.x, ball.y, ball.radius, ball.color);
    // Score
    drawText(leftScore, canvas.width/4, 50);
    drawText(rightScore, 3*canvas.width/4, 50);
}

// Main game loop
function game() {
    update();
    render();
    requestAnimationFrame(game);
}

// Start game
game();