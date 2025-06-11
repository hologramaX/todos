const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const startButton = document.getElementById("startButton");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const player = {
  x: WIDTH / 2 - 20,
  y: HEIGHT - 50,
  width: 40,
  height: 20,
  speed: 5,
  color: "white",
};

let bullets = [];
let enemyBullets = [];
let enemies = [];
let barricades = [];
let enemyDx = 1;
let enemyShootChance = 0.002;
let level = 1;
let score = 0;
let waveSurvived = 0;
let gameOver = false;
let showRanking = false;
let ranking = JSON.parse(localStorage.getItem("top5")) || [];

let currentQuote = null;
let quoteTimer = 0;

const frases = [
  "«La libertad es la prerrogativa de la razón.» — Kant",
  "«El deber es la necesidad de actuar por respeto a la ley.» — Kant",
  "«Toda nuestra sabiduría se reduce a la espera paciente.» — Tatarkiewicz",
  "«El arte es la expresión de la belleza, no su imitación.» — Tatarkiewicz",
  "«Actúa de tal modo que tu máxima pueda valer como ley universal.» — Kant",
  "«La historia de la filosofía es historia de preguntas, no solo de respuestas.» — Tatarkiewicz"
];

const keys = { left: false, right: false };

document.addEventListener("keydown", (e) => {
  if (!gameStarted) return; // no aceptar teclas hasta iniciar
  if (e.code === "ArrowLeft") keys.left = true;
  if (e.code === "ArrowRight") keys.right = true;
  if (e.code === "Space") {
    if (gameOver) {
      if (showRanking) location.reload();
      else submitScore();
    } else {
      shoot();
    }
  }
});

document.addEventListener("keyup", (e) => {
  if (!gameStarted) return; // no aceptar teclas hasta iniciar
  if (e.code === "ArrowLeft") keys.left = false;
  if (e.code === "ArrowRight") keys.right = false;
});

function shoot() {
  bullets.push({
    x: player.x + player.width / 2 - 2,
    y: player.y,
    width: 4,
    height: 10,
    speed: 6,
  });
}

function enemyShoot(x, y) {
  enemyBullets.push({
    x: x + 12,
    y: y + 20,
    width: 4,
    height: 10,
    speed: 4 + level,
  });
}

function createEnemies() {
  enemies = [];
  const rows = 3 + level;
  const cols = 6 + Math.min(level, 4);
  const spacing = 60;
  const startX = 40;
  const startY = 40;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      enemies.push({
        x: startX + c * spacing,
        y: startY + r * spacing,
        width: 30,
        height: 20,
        alive: true,
        col: c
      });
    }
  }
  enemyDx = 1 + level * 0.2;
  enemyShootChance = 0.002 + level * 0.001;
}

function createBarricades() {
  barricades = [];
  const count = 4;
  const spacing = WIDTH / (count + 1);
  for (let i = 1; i <= count; i++) {
    barricades.push({
      x: i * spacing - 25,
      y: HEIGHT - 120,
      width: 50,
      height: 20,
      health: 3
    });
  }
}

function update() {
  if (gameOver || showRanking) return;

  if (keys.left) player.x -= player.speed;
  if (keys.right) player.x += player.speed;
  player.x = Math.max(0, Math.min(WIDTH - player.width, player.x));

  bullets.forEach(b => b.y -= b.speed);
  bullets = bullets.filter(b => b.y > 0);

  enemyBullets.forEach(b => b.y += b.speed);
  enemyBullets = enemyBullets.filter(b => b.y < HEIGHT);

  let moveDown = false;
  for (let e of enemies) {
    if (!e.alive) continue;
    e.x += enemyDx;
    if (e.x <= 0 || e.x + e.width >= WIDTH) moveDown = true;
  }
  if (moveDown) {
    enemyDx *= -1;
    for (let e of enemies) {
      e.y += 20;
      if (e.y + e.height >= player.y) gameOver = true;
    }
  }

  const activeCols = [...new Set(enemies.filter(e => e.alive).map(e => e.col))];
  for (let col of activeCols) {
    const colEnemies = enemies.filter(e => e.col === col && e.alive);
    const shooter = colEnemies[colEnemies.length - 1];
    if (shooter && Math.random() < enemyShootChance) {
      enemyShoot(shooter.x, shooter.y);
    }
  }

  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    for (let e of enemies) {
      if (e.alive &&
          b.x < e.x + e.width &&
          b.x + b.width > e.x &&
          b.y < e.y + e.height &&
          b.y + b.height > e.y) {
        e.alive = false;
        bullets.splice(i, 1);
        score += 10;

        if (Math.random() < 0.3) { // 30% de probabilidad de mostrar frase
          currentQuote = frases[Math.floor(Math.random() * frases.length)];
          quoteTimer = 180; // duración de 3 segundos (60 FPS)
        }

        break;
      }
    }
  }

  for (let arr of [bullets, enemyBullets]) {
    for (let i = arr.length - 1; i >= 0; i--) {
      const b = arr[i];
      for (let j = 0; j < barricades.length; j++) {
        const br = barricades[j];
        if (
          b.x < br.x + br.width &&
          b.x + b.width > br.x &&
          b.y < br.y + br.height &&
          b.y + b.height > br.y
        ) {
          arr.splice(i, 1);
          br.health--;
          if (br.health <= 0) barricades.splice(j, 1);
          break;
        }
      }
    }
  }

  for (let b of enemyBullets) {
    if (
      b.x < player.x + player.width &&
      b.x + b.width > player.x &&
      b.y < player.y + player.height &&
      b.y + b.height > player.y
    ) {
      gameOver = true;
    }
  }

  if (enemies.every(e => !e.alive)) {
    level++;
    waveSurvived++;
    bullets = [];
    enemyBullets = [];
    createEnemies();
    createBarricades();
  }

  if (quoteTimer > 0) quoteTimer--;
  if (quoteTimer === 0) currentQuote = null;
}

function submitScore() {
  let name = prompt("¡Nuevo récord! Escribe tu nombre:");
  if (!name) name = "Anónimo";
  ranking.push({ name, score, level, waveSurvived });
  ranking.sort((a, b) => b.score - a.score);
  ranking = ranking.slice(0, 5);
  localStorage.setItem("top5", JSON.stringify(ranking));
  showRanking = true;
}

function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);

  ctx.fillStyle = "red";
  bullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));

  ctx.fillStyle = "cyan";
  enemyBullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));

  ctx.fillStyle = "lime";
  enemies.forEach(e => {
    if (e.alive) ctx.fillRect(e.x, e.y, e.width, e.height);
  });

  barricades.forEach(b => {
    ctx.fillStyle = b.health === 3 ? "#00ff88" :
                    b.health === 2 ? "#ffaa00" : "#ff0000";
    ctx.fillRect(b.x, b.y, b.width, b.height);
  });

  ctx.fillStyle = "white";
  ctx.font = "18px monospace";
  ctx.fillText("Puntaje: " + score, 10, 25);
  ctx.fillText("Oleadas: " + waveSurvived, 10, 50);
  ctx.fillText("Nivel: " + level, WIDTH - 130, 25);

  if (gameOver) {
    ctx.font = "30px monospace";
    ctx.textAlign = "center";
    ctx.fillText("¡Game over!", WIDTH / 2, HEIGHT / 2 - -90);
    ctx.font = "20px monospace";
    ctx.fillText("", WIDTH / 2, HEIGHT / 2 - 30);
    ctx.textAlign = "left";
  }

  if (showRanking) {
    ctx.fillStyle = "white";
    ctx.font = "24px monospace";
    ctx.textAlign = "center";
    ctx.fillText("🏆 TOP 5 JUGADORES 🏆", WIDTH / 2, 100);
    ctx.font = "18px monospace";
    ranking.forEach((p, i) => {
      ctx.fillText(`${i + 1}. ${p.name} - ${p.score} pts | Nivel ${p.level} | Oleadas ${p.waveSurvived}`, WIDTH / 2, 140 + i * 30);
    });
    ctx.font = "16px monospace";
    ctx.fillText("Presiona ESPACIO", WIDTH / 2, 320);
    ctx.textAlign = "left";
  }

  if (currentQuote) {
    ctx.fillStyle = "yellow";
    ctx.font = "16px monospace";
    ctx.textAlign = "center";
    ctx.fillText(currentQuote, WIDTH / 2, HEIGHT / 2);
    ctx.textAlign = "left";
  }
}

let gameStarted = false;

function loop() {
  if (!gameStarted) return; // no corre loop hasta empezar
  update();
  draw();
  requestAnimationFrame(loop);
}

startButton.onclick = () => {
  startButton.style.display = "none";
  canvas.style.display = "block";
  gameStarted = true;
  createEnemies();
  createBarricades();
  loop();
};