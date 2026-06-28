const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const playerLevelEl = document.getElementById("playerLevel");
const playerHpEl = document.getElementById("playerHp");
const playerMaxHpEl = document.getElementById("playerMaxHp");
const playerAttackEl = document.getElementById("playerAttack");
const playerExpEl = document.getElementById("playerExp");
const needExpEl = document.getElementById("needExp");
const goldEl = document.getElementById("gold");
const upgradeCostEl = document.getElementById("upgradeCost");
const killCountEl = document.getElementById("killCount");
const stageEl = document.getElementById("stage");
const stageKillCountEl = document.getElementById("stageKillCount");
const stageKillGoalEl = document.getElementById("stageKillGoal");
const spinSkillIconEl = document.getElementById("spinSkillIcon");
const lightningSkillIconEl = document.getElementById("lightningSkillIcon");
const upgradeBtn = document.getElementById("upgradeBtn");
const speedToggleBtn = document.getElementById("speedToggleBtn");
const skillModeToggleBtn = document.getElementById("skillModeToggleBtn");

const groundY = 350;
const MAX_STAGE = 100;
const ENEMY_SPAWN_INTERVAL = 1200;
const LIGHTNING_SKILL_UNLOCK_LEVEL = 10;

const stages = Array.from({ length: MAX_STAGE }, (_, index) => {
  const stage = index + 1;

  return {
    number: stage,
    killGoal: 10 + Math.floor(index * 1.5),
    maxEnemies: 3 + Math.floor(index / 4),
    maxSpawnCount: 2 + Math.floor(index / 10),
    hpBonus: index * 2,
    attackBonus: Math.floor(index / 6),
    speedBonus: index * 0.01,
    rewardBonus: Math.floor(index * 0.3)
  };
});

const player = {
  x: 150,
  y: groundY,
  radius: 14,

  level: 1,
  hp: 120,
  maxHp: 120,
  attack: 10,
  exp: 0,
  needExp: 100,
  gold: 0,
  upgradeCost: 50,

  attackRange: 140,
  attackCooldown: 600,
  lastAttackTime: 0,

  skillCooldown: 5000,
  lastSkillTime: 0,
  skillDamage: 2,

  lightningCooldown: 8000,
  lastLightningTime: 0,
  lightningDamage: 3
};

let enemies = [];
let damageTexts = [];
let slashEffects = [];
let skillEffects = [];
let lightningEffects = [];
let killCount = 0;
let currentStageIndex = 0;
let stageKillCount = 0;
let isPlayerDown = false;
let respawnAt = 0;
let gameSpeed = 1;
let isSkillAutoMode = true;
let gameTime = 0;
let lastFrameTime = performance.now();
let spawnTimer = 0;

function getCurrentStage() {
  return stages[currentStageIndex];
}

function createEnemy() {
  if (isPlayerDown) return;

  const stage = getCurrentStage();

  if (enemies.length >= stage.maxEnemies) return;

  const maxHp = 30 + player.level * 8 + stage.hpBonus;

  enemies.push({
    x: canvas.width + 30,
    y: groundY,
    radius: 13,
    hp: maxHp,
    maxHp,
    speed: 0.6 + player.level * 0.04 + stage.speedBonus,
    attack: 4 + stage.attackBonus,
    attackCooldown: 1200,
    lastAttackTime: 0,
    rewardGold: 10 + player.level * 2 + stage.rewardBonus,
    rewardExp: 20 + player.level * 3 + stage.rewardBonus
  });
}

function spawnEnemyGroup() {
  if (isPlayerDown) return;

  const stage = getCurrentStage();
  const spawnCount = Math.floor(Math.random() * stage.maxSpawnCount) + 1;

  for (let i = 0; i < spawnCount; i++) {
    createEnemy();
  }
}

function updateEnemies(deltaScale) {
  if (isPlayerDown) return;

  enemies.forEach(enemy => {
    const distanceToPlayer = enemy.x - player.x;

    if (distanceToPlayer > player.radius + enemy.radius + 35) {
      enemy.x -= enemy.speed * deltaScale;
    } else {
      enemyAttack(enemy);
    }
  });
}

function enemyAttack(enemy) {
  const now = gameTime;

  if (now - enemy.lastAttackTime < enemy.attackCooldown) return;

  enemy.lastAttackTime = now;
  player.hp = Math.max(0, player.hp - enemy.attack);

  damageTexts.push({
    x: player.x - 20,
    y: player.y - 48,
    text: `-${enemy.attack}`,
    color: "#f87171",
    life: 40
  });

  if (player.hp <= 0) {
    handlePlayerDefeat();
  }
}

function handlePlayerDefeat() {
  if (isPlayerDown) return;

  isPlayerDown = true;
  respawnAt = gameTime + 1500;
  enemies = [];
  stageKillCount = Math.max(0, stageKillCount - 2);

  damageTexts.push({
    x: player.x - 34,
    y: player.y - 74,
    text: "DOWN",
    color: "#fb7185",
    life: 90
  });
}

function updatePlayerRespawn() {
  if (!isPlayerDown || gameTime < respawnAt) return;

  player.hp = player.maxHp;
  isPlayerDown = false;
  spawnEnemyGroup();
}

function autoAttack() {
  if (isPlayerDown) return;

  const now = gameTime;

  if (now - player.lastAttackTime < player.attackCooldown) return;

  const target = enemies.find(enemy => {
    const distance = enemy.x - player.x;
    return distance <= player.attackRange && distance > 0;
  });

  if (!target) return;

  target.hp -= player.attack;
  player.lastAttackTime = now;

  damageTexts.push({
    x: target.x,
    y: target.y - 45,
    text: `-${player.attack}`,
    color: "#ffffff",
    life: 45
  });

  slashEffects.push({
    x: target.x,
    y: target.y - 18,
    life: 15
  });

  if (target.hp <= 0) {
    killEnemy(target);
  }
}

function skillAttack() {
  if (isPlayerDown) return;

  const now = gameTime;

  if (now - player.lastSkillTime < player.skillCooldown) return;

  const targetCount = Math.floor(Math.random() * 2) + 3;

  const targets = enemies
    .filter(enemy => {
      const distance = enemy.x - player.x;
      return distance <= player.attackRange && distance > 0;
    })
    .sort((a, b) => a.x - b.x)
    .slice(0, targetCount);

  if (targets.length === 0) return;

  player.lastSkillTime = now;

  targets.forEach(enemy => {
    const damage = player.attack * player.skillDamage;

    enemy.hp -= damage;

    damageTexts.push({
      x: enemy.x,
      y: enemy.y - 58,
      text: `SKILL -${damage}`,
      color: "#ffffff",
      life: 55
    });

    skillEffects.push({
      x: enemy.x,
      y: enemy.y - enemy.radius,
      radius: 8,
      life: 25
    });

    if (enemy.hp <= 0) {
      killEnemy(enemy);
    }
  });

  checkLevelUp();
}

function lightningSkillAttack() {
  if (isPlayerDown) return;

  if (player.level < LIGHTNING_SKILL_UNLOCK_LEVEL) return;

  const now = gameTime;

  if (now - player.lastLightningTime < player.lightningCooldown) return;

  const targets = enemies
    .filter(enemy => {
      const distance = enemy.x - player.x;
      return distance <= player.attackRange + 120 && distance > 0;
    })
    .sort((a, b) => a.x - b.x)
    .slice(0, 5);

  if (targets.length === 0) return;

  player.lastLightningTime = now;

  targets.forEach(enemy => {
    const damage = player.attack * player.lightningDamage;

    enemy.hp -= damage;

    damageTexts.push({
      x: enemy.x,
      y: enemy.y - 68,
      text: `-${damage}`,
      color: "#bae6fd",
      life: 45
    });

    lightningEffects.push({
      x: enemy.x,
      y: enemy.y - enemy.radius,
      life: 18
    });

    if (enemy.hp <= 0) {
      killEnemy(enemy);
    }
  });

  checkLevelUp();
}

function killEnemy(enemy) {
  enemies = enemies.filter(e => e !== enemy);

  player.gold += enemy.rewardGold;
  player.exp += enemy.rewardExp;
  killCount++;
  stageKillCount++;

  checkLevelUp();
  checkStageClear();
}

function checkStageClear() {
  const stage = getCurrentStage();

  if (stageKillCount < stage.killGoal) return;
  if (currentStageIndex >= MAX_STAGE - 1) {
    stageKillCount = stage.killGoal;
    return;
  }

  currentStageIndex++;
  stageKillCount = 0;
  enemies = [];
  spawnEnemyGroup();
}

function checkLevelUp() {
  while (player.exp >= player.needExp) {
    player.exp -= player.needExp;
    player.level++;
    player.maxHp += 15;
    player.hp = player.maxHp;
    player.attack += 5;
    player.needExp = Math.floor(player.needExp * 1.3);
  }
}

function upgradeAttack() {
  if (player.gold < player.upgradeCost) {
    alert("골드가 부족합니다.");
    return;
  }

  player.gold -= player.upgradeCost;
  player.attack += 10;
  player.upgradeCost = Math.floor(player.upgradeCost * 1.5);

  updateUI();
}

function updateDamageTexts(deltaScale) {
  damageTexts.forEach(text => {
    text.y -= 0.7 * deltaScale;
    text.life -= deltaScale;
  });

  damageTexts = damageTexts.filter(text => text.life > 0);
}

function updateSlashEffects(deltaScale) {
  slashEffects.forEach(effect => {
    effect.life -= deltaScale;
  });

  slashEffects = slashEffects.filter(effect => effect.life > 0);
}

function updateSkillEffects(deltaScale) {
  skillEffects.forEach(effect => {
    effect.radius += 1.8 * deltaScale;
    effect.life -= deltaScale;
  });

  skillEffects = skillEffects.filter(effect => effect.life > 0);
}

function updateLightningEffects(deltaScale) {
  lightningEffects.forEach(effect => {
    effect.life -= deltaScale;
  });

  lightningEffects = lightningEffects.filter(effect => effect.life > 0);
}

function drawBackground() {
  ctx.fillStyle = "#7ecbff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#6bbf59";
  ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);

  ctx.fillStyle = "#4d8b3d";
  ctx.fillRect(0, groundY, canvas.width, 8);
}

function drawPlayer() {
  ctx.beginPath();
  ctx.arc(player.x, player.y - player.radius, player.radius, 0, Math.PI * 2);
  ctx.fillStyle = isPlayerDown ? "#9ca3af" : "#ffffff";
  ctx.fill();

  const hpBarWidth = 42;
  const hpPercent = player.hp / player.maxHp;

  ctx.fillStyle = "#222";
  ctx.fillRect(player.x - hpBarWidth / 2, player.y - 48, hpBarWidth, 5);

  ctx.fillStyle = "#60a5fa";
  ctx.fillRect(player.x - hpBarWidth / 2, player.y - 48, hpBarWidth * hpPercent, 5);
}

function drawEnemies() {
  enemies.forEach(enemy => {
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y - enemy.radius, enemy.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#ef4444";
    ctx.fill();

    const hpBarWidth = 32;
    const hpPercent = Math.max(enemy.hp / enemy.maxHp, 0);

    ctx.fillStyle = "#222";
    ctx.fillRect(enemy.x - hpBarWidth / 2, enemy.y - 42, hpBarWidth, 5);

    ctx.fillStyle = "#22c55e";
    ctx.fillRect(enemy.x - hpBarWidth / 2, enemy.y - 42, hpBarWidth * hpPercent, 5);
  });
}

function drawDamageTexts() {
  damageTexts.forEach(text => {
    ctx.fillStyle = text.color || "#ffffff";
    ctx.font = "18px Arial";
    ctx.fillText(text.text, text.x, text.y);
  });
}

function drawSlashEffects() {
  slashEffects.forEach(effect => {
    ctx.beginPath();
    ctx.moveTo(effect.x - 18, effect.y - 18);
    ctx.lineTo(effect.x + 18, effect.y + 18);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.lineWidth = 4;
    ctx.stroke();
  });
}

function drawSkillEffects() {
  skillEffects.forEach(effect => {
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 230, 0, ${effect.life / 25})`;
    ctx.lineWidth = 4;
    ctx.stroke();
  });
}

function drawLightningEffects() {
  lightningEffects.forEach(effect => {
    const alpha = effect.life / 18;

    ctx.beginPath();
    ctx.moveTo(effect.x - 10, effect.y - 34);
    ctx.lineTo(effect.x + 5, effect.y - 12);
    ctx.lineTo(effect.x - 4, effect.y - 12);
    ctx.lineTo(effect.x + 10, effect.y + 18);
    ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
    ctx.lineWidth = 5;
    ctx.stroke();
  });
}

function updateSkillIcon(iconEl, cooldown, lastUsedTime, isUnlocked) {
  const now = gameTime;
  const remainCooldown = Math.max(0, cooldown - (now - lastUsedTime));
  const cooldownRatio = remainCooldown / cooldown;

  iconEl.classList.toggle("locked", !isUnlocked);
  iconEl.classList.toggle("ready", isUnlocked && remainCooldown === 0);
  iconEl.classList.toggle("cooling", isUnlocked && remainCooldown > 0);
  iconEl.style.setProperty("--cooldown", cooldownRatio);
}

function updateSpawnTimer(deltaTime) {
  spawnTimer += deltaTime;

  while (spawnTimer >= ENEMY_SPAWN_INTERVAL) {
    spawnTimer -= ENEMY_SPAWN_INTERVAL;
    spawnEnemyGroup();
  }
}

function toggleSpeed() {
  gameSpeed = gameSpeed === 1 ? 2 : 1;
  updateUI();
}

function toggleSkillMode() {
  isSkillAutoMode = !isSkillAutoMode;
  updateUI();
}

function useManualSkill(skillName) {
  if (isSkillAutoMode) return;

  if (skillName === "spin") {
    skillAttack();
    return;
  }

  if (skillName === "lightning") {
    lightningSkillAttack();
  }
}

function updateUI() {
  playerLevelEl.textContent = player.level;
  playerHpEl.textContent = player.hp;
  playerMaxHpEl.textContent = player.maxHp;
  playerAttackEl.textContent = player.attack;
  playerExpEl.textContent = player.exp;
  needExpEl.textContent = player.needExp;
  goldEl.textContent = player.gold;
  upgradeCostEl.textContent = player.upgradeCost;
  killCountEl.textContent = killCount;
  stageEl.textContent = getCurrentStage().number;
  stageKillCountEl.textContent = stageKillCount;
  stageKillGoalEl.textContent = getCurrentStage().killGoal;

  updateSkillIcon(spinSkillIconEl, player.skillCooldown, player.lastSkillTime, true);
  updateSkillIcon(
    lightningSkillIconEl,
    player.lightningCooldown,
    player.lastLightningTime,
    player.level >= LIGHTNING_SKILL_UNLOCK_LEVEL
  );

  speedToggleBtn.textContent = gameSpeed === 2 ? "2배속 ON" : "2배속 OFF";
  speedToggleBtn.classList.toggle("active", gameSpeed === 2);

  skillModeToggleBtn.textContent = isSkillAutoMode ? "스킬 자동" : "스킬 수동";
  skillModeToggleBtn.classList.toggle("active", isSkillAutoMode);
  spinSkillIconEl.classList.toggle("manual", !isSkillAutoMode);
  lightningSkillIconEl.classList.toggle("manual", !isSkillAutoMode);
}

function gameLoop() {
  const now = performance.now();
  const deltaTime = Math.min((now - lastFrameTime) * gameSpeed, 80);
  const deltaScale = deltaTime / 16.67;
  lastFrameTime = now;
  gameTime += deltaTime;

  drawBackground();

  updatePlayerRespawn();
  updateSpawnTimer(deltaTime);
  updateEnemies(deltaScale);

  autoAttack();
  if (isSkillAutoMode) {
    skillAttack();
    lightningSkillAttack();
  }

  updateDamageTexts(deltaScale);
  updateSlashEffects(deltaScale);
  updateSkillEffects(deltaScale);
  updateLightningEffects(deltaScale);

  drawPlayer();
  drawEnemies();
  drawSlashEffects();
  drawSkillEffects();
  drawLightningEffects();
  drawDamageTexts();

  updateUI();

  requestAnimationFrame(gameLoop);
}

upgradeBtn.addEventListener("click", upgradeAttack);
speedToggleBtn.addEventListener("click", toggleSpeed);
skillModeToggleBtn.addEventListener("click", toggleSkillMode);
spinSkillIconEl.addEventListener("click", () => useManualSkill("spin"));
lightningSkillIconEl.addEventListener("click", () => useManualSkill("lightning"));

spawnEnemyGroup();

gameLoop();
