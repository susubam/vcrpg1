const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const gamePanel = document.querySelector(".game-panel");
const summonControlsEl = document.querySelector(".summon-controls");

const playerLevelEl = document.getElementById("playerLevel");
const playerHpEl = document.getElementById("playerHp");
const playerMaxHpEl = document.getElementById("playerMaxHp");
const playerAttackEl = document.getElementById("playerAttack");
const playerExpEl = document.getElementById("playerExp");
const needExpEl = document.getElementById("needExp");
const goldEl = document.getElementById("gold");
const employeeCountEl = document.getElementById("employeeCount");
const maxEmployeeCountEl = document.getElementById("maxEmployeeCount");
const upgradeCostEl = document.getElementById("upgradeCost");
const killCountEl = document.getElementById("killCount");
const stageEl = document.getElementById("stage");
const stageKillCountEl = document.getElementById("stageKillCount");
const stageKillGoalEl = document.getElementById("stageKillGoal");
const companyIncomeEl = document.getElementById("companyIncome");
const companyWorkTimeEl = document.getElementById("companyWorkTime");
const companionCountEl = document.getElementById("companionCount");
const companionUnlockCountEl = document.getElementById("companionUnlockCount");
const companionTotalCountEl = document.getElementById("companionTotalCount");
const companionCostEl = document.getElementById("companionCost");
const equipmentCostEl = document.getElementById("equipmentCost");
const latestCompanionEl = document.getElementById("latestCompanion");
const latestEquipmentEl = document.getElementById("latestEquipment");
const investmentTotalLevelEl = document.getElementById("investmentTotalLevel");
const investmentNextCostEl = document.getElementById("investmentNextCost");
const spinSkillIconEl = document.getElementById("spinSkillIcon");
const lightningSkillIconEl = document.getElementById("lightningSkillIcon");
const upgradeBtn = document.getElementById("upgradeBtn");
const speedToggleBtn = document.getElementById("speedToggleBtn");
const skillModeToggleBtn = document.getElementById("skillModeToggleBtn");
const summonCompanionBtn = document.getElementById("summonCompanionBtn");
const summonEquipmentBtn = document.getElementById("summonEquipmentBtn");
const summonCompanionModeBtn = document.getElementById("summonCompanionModeBtn");
const summonEquipmentModeBtn = document.getElementById("summonEquipmentModeBtn");
const codexCompanionModeBtn = document.getElementById("codexCompanionModeBtn");
const codexEquipmentModeBtn = document.getElementById("codexEquipmentModeBtn");
const battleTabBtn = document.getElementById("battleTabBtn");
const companyTabBtn = document.getElementById("companyTabBtn");
const summonTabBtn = document.getElementById("summonTabBtn");
const investmentTabBtn = document.getElementById("investmentTabBtn");
const companionTabBtn = document.getElementById("companionTabBtn");

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
let activeView = "battle";
let companyGoldBuffer = 0;
let companyWorkTime = 0;
let companions = [];
let companionCost = 120;
let latestCompanionName = "없음";
let companionCollection = {};
let activeSummonType = "companion";
let activeCodexType = "companion";
let equipments = [];
let equipmentCost = 160;
let latestEquipmentName = "없음";
let summonPreview = null;
let companyLevel = 1;
let maxEmployees = 5;
let goldRewardMultiplier = 1;
let investmentButtons = [];

const company = {
  baseIncomePerSecond: 3
};

const investments = [
  {
    id: "companyLevel",
    name: "회사 레벨",
    description: "회사 기본 체급 상승",
    level: 1,
    cost: 50,
    color: "#38bdf8",
    apply() {
      companyLevel++;
      player.maxHp += 20;
      player.hp = player.maxHp;
      player.attack += 3;
    }
  },
  {
    id: "devSpeed",
    name: "개발 속도",
    description: "자동 개발 공격 주기 감소",
    level: 1,
    cost: 45,
    color: "#a3e635",
    apply() {
      player.attackCooldown = Math.max(260, player.attackCooldown - 35);
    }
  },
  {
    id: "marketing",
    name: "마케팅 효과",
    description: "개발 완료 골드 보상 증가",
    level: 1,
    cost: 30,
    color: "#f472b6",
    apply() {
      goldRewardMultiplier += 0.1;
    }
  },
  {
    id: "training",
    name: "직원 교육",
    description: "개발력 상승",
    level: 1,
    cost: 40,
    color: "#60a5fa",
    apply() {
      player.attack += 8;
    }
  },
  {
    id: "equipment",
    name: "장비 효율",
    description: "장비 운용 능력 상승",
    level: 1,
    cost: 35,
    color: "#fbbf24",
    apply() {
      player.attack += 4;
      player.maxHp += 10;
      player.hp = Math.min(player.maxHp, player.hp + 10);
    }
  }
];

const companionPool = [
  { name: "인턴 해커", rarity: "N", color: "#60a5fa", attackBonus: 2, incomeBonus: 1, weight: 42 },
  { name: "영업 에이스", rarity: "R", color: "#34d399", attackBonus: 4, incomeBonus: 2, weight: 30 },
  { name: "전투 매니저", rarity: "SR", color: "#fbbf24", attackBonus: 8, incomeBonus: 4, weight: 18 },
  { name: "사이버 이사", rarity: "SSR", color: "#f472b6", attackBonus: 15, incomeBonus: 8, weight: 8 },
  { name: "네온 대표", rarity: "UR", color: "#a78bfa", attackBonus: 28, incomeBonus: 15, weight: 2 }
];

const equipmentPool = [
  { name: "복사기", rarity: "N", color: "#94a3b8", incomeBonus: 3, attackBonus: 0, hpBonus: 0, weight: 32 },
  { name: "업무용 컴퓨터", rarity: "R", color: "#38bdf8", incomeBonus: 5, attackBonus: 2, hpBonus: 0, weight: 27 },
  { name: "정수기", rarity: "R", color: "#67e8f9", incomeBonus: 4, attackBonus: 0, hpBonus: 10, weight: 22 },
  { name: "회의실 빔프로젝터", rarity: "SR", color: "#facc15", incomeBonus: 8, attackBonus: 3, hpBonus: 0, weight: 13 },
  { name: "고성능 서버랙", rarity: "SSR", color: "#c084fc", incomeBonus: 14, attackBonus: 6, hpBonus: 15, weight: 5 },
  { name: "대표실 커피머신", rarity: "UR", color: "#fb7185", incomeBonus: 24, attackBonus: 10, hpBonus: 25, weight: 1 }
];

companionPool.forEach(companion => {
  companionCollection[companion.name] = {
    ...companion,
    unlocked: false,
    level: 0,
    progress: 0,
    totalPulled: 0
  };
});

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

  player.gold += Math.floor(enemy.rewardGold * goldRewardMultiplier);
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
  ctx.fillStyle = "#253047";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#38445d";
  ctx.fillRect(0, 0, canvas.width, 72);

  ctx.fillStyle = "#2f3b55";
  ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);

  ctx.fillStyle = "#151923";
  ctx.fillRect(0, groundY, canvas.width, 8);
}

function drawCompanyBackground() {
  ctx.fillStyle = "#253047";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#38445d";
  ctx.fillRect(0, 0, canvas.width, 68);

  ctx.fillStyle = "#30394f";
  ctx.fillRect(0, 68, canvas.width, groundY - 68);

  ctx.fillStyle = "#252b3b";
  ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);

  ctx.fillStyle = "#151923";
  ctx.fillRect(0, groundY, canvas.width, 8);

  drawWindow(60, 100, 118, 78);
  drawWindow(720, 96, 120, 82);
  drawCompanyUpgradeDecorations();
  drawDesk(310, groundY - 58, 280, 58);
  drawCompanyEquipments();
  drawCompanyCompanions();

  ctx.fillStyle = "#f8fafc";
  ctx.font = "700 22px Arial";
  ctx.fillText("COMPANY OFFICE", 330, 44);

  ctx.fillStyle = "#ffd45a";
  ctx.font = "700 18px Arial";
  ctx.fillText(`회사 Lv.${companyLevel} / 투자 ${investments.reduce((sum, item) => sum + item.level, 0)}`, player.x + 38, player.y - 88);
}

function getCompanyBuildingTier() {
  return Math.floor(companyLevel / 5);
}

function drawCompanyUpgradeDecorations() {
  const tier = getCompanyBuildingTier();

  if (tier <= 0) return;

  ctx.fillStyle = "#1f2937";
  ctx.fillRect(218, 92, 464, 92 + tier * 18);

  ctx.strokeStyle = "#f6c64a";
  ctx.lineWidth = 4;
  ctx.strokeRect(218, 92, 464, 92 + tier * 18);

  ctx.fillStyle = "#f6c64a";
  ctx.font = "700 16px Arial";
  ctx.fillText("GAME STUDIO", 386, 118);

  const rows = Math.min(3 + tier, 7);
  const cols = 5;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      ctx.fillStyle = (row + col) % 2 === 0 ? "#60a5fa" : "#fde68a";
      ctx.fillRect(252 + col * 76, 136 + row * 18, 36, 10);
    }
  }

  if (tier >= 2) {
    ctx.fillStyle = "#ffd45a";
    ctx.fillRect(342, 74, 216, 20);
    ctx.fillStyle = "#241a12";
    ctx.font = "700 12px Arial";
    ctx.fillText("GLOBAL PUBLISHER", 382, 89);
  }

  if (tier >= 3) {
    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(200, 208, 500, 8);
    ctx.fillStyle = "#f472b6";
    ctx.fillRect(228, 224, 444, 6);
  }
}

function drawCompanionBackground() {
  ctx.fillStyle = activeSummonType === "equipment" ? "#082f49" : "#451a03";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = activeSummonType === "equipment" ? "#075985" : "#78350f";
  ctx.fillRect(0, 0, canvas.width, 72);

  ctx.fillStyle = activeSummonType === "equipment" ? "#e0f2fe" : "#fef3c7";
  ctx.fillRect(0, 72, canvas.width, groundY - 72);

  ctx.fillStyle = activeSummonType === "equipment" ? "#0e7490" : "#92400e";
  ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);

  ctx.fillStyle = activeSummonType === "equipment" ? "#164e63" : "#451a03";
  ctx.fillRect(0, groundY, canvas.width, 8);

  ctx.fillStyle = "#111827";
  ctx.font = "700 22px Arial";
  ctx.fillText(activeSummonType === "equipment" ? "OFFICE EQUIPMENT" : "COMPANION RECRUIT", 302, 44);

  drawSummonMachine(352, 116);

  if (activeSummonType === "equipment") {
    drawEquipmentRoster();
  } else {
    drawCompanionRoster();
  }
}

function drawCompanionCodexBackground() {
  ctx.fillStyle = "#1f2937";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#374151";
  ctx.fillRect(0, 0, canvas.width, 72);

  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 72, canvas.width, groundY - 72);

  ctx.fillStyle = "#6b7280";
  ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);

  ctx.fillStyle = "#111827";
  ctx.font = "700 22px Arial";
  ctx.fillText("COMPANION CODEX", 322, 44);

  companionPool.forEach((companion, index) => {
    const record = companionCollection[companion.name];
    const x = 48 + (index % 3) * 280;
    const y = index < 3 ? 108 : 238;

    drawCompanionCodexCard(x, y, 236, 104, record);
  });
}

function drawCompanionCodexCard(x, y, width, height, record) {
  const isUnlocked = record.unlocked;
  const required = getCompanionRequiredCount(record.level);
  const progressText = record.level >= 10 ? "MAX" : `${record.progress}/${required}`;

  ctx.fillStyle = isUnlocked ? "#ffffff" : "#d1d5db";
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = isUnlocked ? record.color : "#6b7280";
  ctx.lineWidth = 4;
  ctx.strokeRect(x, y, width, height);

  drawCompanionSprite(x + 42, y + 72, isUnlocked ? record.color : "#9ca3af");

  ctx.fillStyle = "#111827";
  ctx.font = "700 15px Arial";
  ctx.fillText(isUnlocked ? record.name : "???", x + 82, y + 28);

  ctx.fillStyle = isUnlocked ? record.color : "#4b5563";
  ctx.font = "700 13px Arial";
  ctx.fillText(isUnlocked ? `${record.rarity}  LV.${record.level}` : "LOCKED", x + 82, y + 50);

  ctx.fillStyle = "#374151";
  ctx.font = "700 12px Arial";
  ctx.fillText(isUnlocked ? `다음 성장 ${progressText}` : "뽑기에서 해금", x + 82, y + 72);

  ctx.fillStyle = "#6b7280";
  ctx.fillText(`총 ${record.totalPulled}명`, x + 82, y + 91);
}

function drawSummonMachine(x, y) {
  const isEquipment = activeSummonType === "equipment";
  const cost = isEquipment ? equipmentCost : companionCost;

  ctx.fillStyle = isEquipment ? "#075985" : "#7c2d12";
  ctx.fillRect(x, y + 52, 196, 160);

  ctx.fillStyle = isEquipment ? "#bae6fd" : "#fbbf24";
  ctx.fillRect(x + 16, y + 16, 164, 72);

  ctx.fillStyle = "#111827";
  ctx.fillRect(x + 34, y + 34, 128, 34);

  ctx.fillStyle = "#fef3c7";
  ctx.font = "700 16px Arial";
  ctx.fillText(`${cost}G`, x + 78, y + 57);

  ctx.fillStyle = isEquipment ? "#0284c7" : "#dc2626";
  ctx.beginPath();
  ctx.arc(x + 98, y + 130, 24, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = isEquipment ? "#e0f2fe" : "#fca5a5";
  ctx.beginPath();
  ctx.arc(x + 90, y + 122, 7, 0, Math.PI * 2);
  ctx.fill();
}

function drawCompanionRoster() {
  const visibleCompanions = companions.slice(-8);

  visibleCompanions.forEach((companion, index) => {
    const x = 80 + (index % 4) * 170;
    const y = index < 4 ? 230 : 300;

    drawCompanionSprite(x, y, companion.color);

    ctx.fillStyle = "#111827";
    ctx.font = "700 13px Arial";
    ctx.fillText(`${companion.rarity} ${companion.name}`, x - 42, y + 28);
  });

  if (companions.length === 0) {
    ctx.fillStyle = "#92400e";
    ctx.font = "700 18px Arial";
    ctx.fillText("골드로 첫 동료를 뽑아보세요", 314, 285);
  }
}

function drawEquipmentRoster() {
  const visibleEquipments = equipments.slice(-8);

  visibleEquipments.forEach((equipment, index) => {
    const x = 82 + (index % 4) * 170;
    const y = index < 4 ? 230 : 300;

    drawEquipmentSprite(x, y, equipment);

    ctx.fillStyle = "#111827";
    ctx.font = "700 13px Arial";
    ctx.fillText(`${equipment.rarity} ${equipment.name}`, x - 48, y + 30);
  });

  if (equipments.length === 0) {
    ctx.fillStyle = "#075985";
    ctx.font = "700 18px Arial";
    ctx.fillText("회사 비품을 뽑아 사무실을 키워보세요", 284, 285);
  }
}

function drawCompanionSprite(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x - 13, y - 38, 26, 30);

  ctx.beginPath();
  ctx.arc(x, y - 52, 14, 0, Math.PI * 2);
  ctx.fillStyle = "#f8fafc";
  ctx.fill();

  ctx.fillStyle = color;
  ctx.fillRect(x - 18, y - 8, 12, 14);
  ctx.fillRect(x + 6, y - 8, 12, 14);
}

function drawEquipmentSprite(x, y, equipment) {
  ctx.fillStyle = equipment.color;

  if (equipment.name.includes("복사기")) {
    ctx.fillRect(x - 24, y - 48, 48, 36);
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(x - 16, y - 56, 32, 12);
  } else if (equipment.name.includes("컴퓨터")) {
    ctx.fillRect(x - 26, y - 56, 52, 34);
    ctx.fillStyle = "#111827";
    ctx.fillRect(x - 18, y - 48, 36, 20);
    ctx.fillStyle = equipment.color;
    ctx.fillRect(x - 6, y - 22, 12, 14);
  } else if (equipment.name.includes("정수기")) {
    ctx.fillRect(x - 16, y - 62, 32, 52);
    ctx.fillStyle = "#e0f2fe";
    ctx.fillRect(x - 10, y - 54, 20, 20);
  } else if (equipment.name.includes("서버")) {
    ctx.fillRect(x - 22, y - 66, 44, 58);
    ctx.fillStyle = "#111827";
    ctx.fillRect(x - 14, y - 56, 28, 8);
    ctx.fillRect(x - 14, y - 40, 28, 8);
  } else if (equipment.name.includes("커피")) {
    ctx.fillRect(x - 18, y - 48, 36, 34);
    ctx.fillStyle = "#451a03";
    ctx.fillRect(x - 8, y - 38, 16, 16);
  } else {
    ctx.fillRect(x - 26, y - 52, 52, 34);
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(x - 18, y - 44, 36, 18);
  }

  ctx.fillStyle = "#111827";
  ctx.fillRect(x - 24, y - 10, 48, 6);
}

function drawCompanyEquipments() {
  const visibleEquipments = equipments.slice(-6);

  visibleEquipments.forEach((equipment, index) => {
    const x = 120 + (index % 6) * 125;
    const y = index % 2 === 0 ? groundY - 2 : groundY - 82;
    drawEquipmentSprite(x, y, equipment);
  });
}

function getUniqueCompanionsForPlacement(limit) {
  const uniqueCompanions = [];
  const seenNames = new Set();

  for (let index = companions.length - 1; index >= 0; index--) {
    const companion = companions[index];

    if (seenNames.has(companion.name)) continue;

    seenNames.add(companion.name);
    uniqueCompanions.unshift(companion);

    if (uniqueCompanions.length >= limit) break;
  }

  return uniqueCompanions;
}

function drawBattleCompanions() {
  const visibleCompanions = getUniqueCompanionsForPlacement(5);

  visibleCompanions.forEach((companion, index) => {
    const x = player.x - 54 - index * 42;
    const y = groundY - (index % 2) * 10;

    drawCompanionSprite(x, y, companion.color);

    ctx.fillStyle = companion.color;
    ctx.font = "700 11px Arial";
    ctx.fillText(companion.rarity, x - 9, y - 68);
  });
}

function drawCompanyCompanions() {
  const visibleCompanions = getUniqueCompanionsForPlacement(6);

  visibleCompanions.forEach((companion, index) => {
    const x = 250 + (index % 3) * 190;
    const y = index < 3 ? groundY : groundY - 86;

    drawCompanionSprite(x, y, companion.color);

    ctx.fillStyle = "#111827";
    ctx.font = "700 12px Arial";
    ctx.fillText(companion.rarity, x - 8, y - 70);
  });
}

function drawWindow(x, y, width, height) {
  ctx.fillStyle = "#60a5fa";
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = "#1e3a8a";
  ctx.lineWidth = 5;
  ctx.strokeRect(x, y, width, height);
  ctx.beginPath();
  ctx.moveTo(x + width / 2, y);
  ctx.lineTo(x + width / 2, y + height);
  ctx.moveTo(x, y + height / 2);
  ctx.lineTo(x + width, y + height / 2);
  ctx.stroke();
}

function drawDesk(x, y, width, height) {
  ctx.fillStyle = "#854d0e";
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = "#a16207";
  ctx.fillRect(x, y, width, 14);
  ctx.fillStyle = "#422006";
  ctx.fillRect(x + 28, y + height, 18, 44);
  ctx.fillRect(x + width - 46, y + height, 18, 44);
  ctx.fillStyle = "#111827";
  ctx.fillRect(x + 132, y - 52, 58, 42);
  ctx.fillStyle = "#38bdf8";
  ctx.fillRect(x + 138, y - 46, 46, 28);
}

function drawPlayer() {
  if (activeView === "company" || activeView === "summon") {
    drawCompanyPlayer();
    return;
  }

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

function drawCompanyPlayer() {
  const x = player.x;
  const y = player.y;

  ctx.fillStyle = "#111827";
  ctx.fillRect(x - 12, y - 42, 24, 30);

  ctx.beginPath();
  ctx.arc(x, y - 55, 14, 0, Math.PI * 2);
  ctx.fillStyle = "#f8fafc";
  ctx.fill();

  ctx.fillStyle = "#2563eb";
  ctx.fillRect(x - 16, y - 12, 10, 12);
  ctx.fillRect(x + 6, y - 12, 10, 12);

  ctx.fillStyle = "#0f172a";
  ctx.fillRect(x - 22, y, 16, 6);
  ctx.fillRect(x + 6, y, 16, 6);
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
    if (text.source === "company" && activeView !== "company") return;

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

function getCompanyIncomePerSecond() {
  return company.baseIncomePerSecond + Math.floor(player.level * 1.5) + Math.floor(player.attack / 20);
}

function pickCompanion() {
  const totalWeight = companionPool.reduce((sum, companion) => sum + companion.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const companion of companionPool) {
    roll -= companion.weight;
    if (roll <= 0) {
      return { ...companion };
    }
  }

  return { ...companionPool[0] };
}

function pickEquipment() {
  const totalWeight = equipmentPool.reduce((sum, equipment) => sum + equipment.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const equipment of equipmentPool) {
    roll -= equipment.weight;
    if (roll <= 0) {
      return { ...equipment };
    }
  }

  return { ...equipmentPool[0] };
}

function getCompanionRequiredCount(level) {
  if (level >= 10) return 0;
  return Math.max(10, level * 10);
}

function getUnlockedEmployeeCount() {
  return Object.values(companionCollection).filter(record => record.unlocked).length;
}

function applyCompanionLevelBonus(companion) {
  player.attack += companion.attackBonus;
  company.baseIncomePerSecond += companion.incomeBonus;
}

function applyEquipmentBonus(equipment) {
  player.attack += equipment.attackBonus;
  company.baseIncomePerSecond += equipment.incomeBonus;

  if (equipment.hpBonus > 0) {
    player.maxHp += equipment.hpBonus;
    player.hp = Math.min(player.maxHp, player.hp + equipment.hpBonus);
  }
}

function registerCompanionPull(companion) {
  const record = companionCollection[companion.name];
  let leveledUp = false;

  record.totalPulled++;

  if (!record.unlocked) {
    record.unlocked = true;
    record.level = 1;
    record.progress = 1;
    applyCompanionLevelBonus(record);
  } else if (record.level < 10) {
    record.progress++;
  }

  while (record.level < 10 && record.progress >= getCompanionRequiredCount(record.level)) {
    record.progress -= getCompanionRequiredCount(record.level);
    record.level++;
    leveledUp = true;
    applyCompanionLevelBonus(record);
  }

  if (record.level >= 10) {
    record.progress = 0;
  }

  return { record, leveledUp };
}

function summonCompanion() {
  if (player.gold < companionCost) {
    alert("동료를 뽑을 골드가 부족합니다.");
    return;
  }

  const companion = pickCompanion();

  if (!companionCollection[companion.name].unlocked && getUnlockedEmployeeCount() >= maxEmployees) {
    alert("최대 직원 수에 도달했습니다. 회사 레벨 투자를 올려주세요.");
    return;
  }

  const result = registerCompanionPull(companion);
  const levelText = result.leveledUp ? ` LV.${result.record.level}` : "";

  player.gold -= companionCost;
  companions.push(companion);
  latestCompanionName = `${companion.rarity} ${companion.name}${levelText}`;
  summonPreview = {
    type: "companion",
    item: companion,
    label: latestCompanionName,
    life: 120,
    maxLife: 120
  };

  damageTexts.push({
    x: 384,
    y: 112,
    text: result.leveledUp ? `${companion.name} LV UP!` : `${latestCompanionName} 합류!`,
    color: companion.color,
    life: 90
  });

  updateUI();
}

function summonEquipment() {
  if (player.gold < equipmentCost) {
    alert("장비를 뽑을 골드가 부족합니다.");
    return;
  }

  const equipment = pickEquipment();

  player.gold -= equipmentCost;
  equipments.push(equipment);
  latestEquipmentName = `${equipment.rarity} ${equipment.name}`;
  applyEquipmentBonus(equipment);
  summonPreview = {
    type: "equipment",
    item: equipment,
    label: latestEquipmentName,
    life: 120,
    maxLife: 120
  };

  damageTexts.push({
    x: 384,
    y: 112,
    text: `${latestEquipmentName} 설치!`,
    color: equipment.color,
    life: 90
  });

  updateUI();
}

function setSummonType(nextType) {
  activeSummonType = nextType;
  summonControlsEl.classList.toggle("equipment-mode", activeSummonType === "equipment");
  summonCompanionModeBtn.classList.toggle("active", activeSummonType === "companion");
  summonEquipmentModeBtn.classList.toggle("active", activeSummonType === "equipment");
  updateUI();
}

function updateCompany(deltaTime) {
  const seconds = deltaTime / 1000;

  companyWorkTime += seconds;
  companyGoldBuffer += getCompanyIncomePerSecond() * seconds;

  if (companyGoldBuffer >= 1) {
    const earnedGold = Math.floor(companyGoldBuffer);
    companyGoldBuffer -= earnedGold;
    player.gold += earnedGold;

    damageTexts.push({
      x: player.x + 34,
      y: player.y - 98,
      text: `+${earnedGold}G`,
      color: "#16a34a",
      source: "company",
      life: 45
    });
  }
}

function setActiveView(nextView) {
  activeView = nextView;
  gamePanel.classList.toggle("company-view", activeView === "company");
  gamePanel.classList.toggle("summon-view", activeView === "summon");
  gamePanel.classList.toggle("investment-view", activeView === "investment");
  gamePanel.classList.toggle("companion-view", activeView === "companion");
  battleTabBtn.classList.toggle("active", activeView === "battle");
  companyTabBtn.classList.toggle("active", activeView === "company");
  summonTabBtn.classList.toggle("active", activeView === "summon");
  investmentTabBtn.classList.toggle("active", activeView === "investment");
  companionTabBtn.classList.toggle("active", activeView === "companion");

  if (activeView === "battle" && enemies.length === 0) {
    spawnEnemyGroup();
  }

  updateUI();
}

function updateUI() {
  playerLevelEl.textContent = player.level;
  playerHpEl.textContent = player.hp;
  playerMaxHpEl.textContent = player.maxHp;
  playerAttackEl.textContent = player.attack;
  playerExpEl.textContent = player.exp;
  needExpEl.textContent = player.needExp;
  goldEl.textContent = player.gold;
  employeeCountEl.textContent = getUnlockedEmployeeCount();
  maxEmployeeCountEl.textContent = maxEmployees;
  upgradeCostEl.textContent = player.upgradeCost;
  killCountEl.textContent = killCount;
  stageEl.textContent = getCurrentStage().number;
  stageKillCountEl.textContent = stageKillCount;
  stageKillGoalEl.textContent = getCurrentStage().killGoal;
  companyIncomeEl.textContent = companyLevel;
  companyWorkTimeEl.textContent = investments.reduce((sum, item) => sum + item.level, 0);
  companionUnlockCountEl.textContent = getUnlockedEmployeeCount();
  companionTotalCountEl.textContent = maxEmployees;
  companionCountEl.textContent = companions.length;
  companionCostEl.textContent = companionCost;
  latestCompanionEl.textContent = latestCompanionName;

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

  speedToggleBtn.textContent = gameSpeed === 2 ? "2배속 ON" : "2배속 OFF";
  skillModeToggleBtn.textContent = isSkillAutoMode ? "스킬 자동" : "스킬 수동";
}

updateUI = function () {
  playerLevelEl.textContent = player.level;
  playerHpEl.textContent = player.hp;
  playerMaxHpEl.textContent = player.maxHp;
  playerAttackEl.textContent = player.attack;
  playerExpEl.textContent = player.exp;
  needExpEl.textContent = player.needExp;
  goldEl.textContent = player.gold;
  employeeCountEl.textContent = getUnlockedEmployeeCount();
  maxEmployeeCountEl.textContent = maxEmployees;
  upgradeCostEl.textContent = player.upgradeCost;
  killCountEl.textContent = killCount;
  stageEl.textContent = getCurrentStage().number;
  stageKillCountEl.textContent = stageKillCount;
  stageKillGoalEl.textContent = getCurrentStage().killGoal;
  companyIncomeEl.textContent = companyLevel;
  companyWorkTimeEl.textContent = investments.reduce((sum, item) => sum + item.level, 0);
  companionUnlockCountEl.textContent = getUnlockedEmployeeCount();
  companionTotalCountEl.textContent = maxEmployees;
  companionCountEl.textContent = companions.length;
  companionCostEl.textContent = companionCost;
  equipmentCostEl.textContent = equipmentCost;
  latestCompanionEl.textContent = latestCompanionName;
  latestEquipmentEl.textContent = latestEquipmentName;
  investmentTotalLevelEl.textContent = investments.reduce((sum, item) => sum + item.level, 0);
  investmentNextCostEl.textContent = Math.min(...investments.map(item => item.cost));

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

  summonControlsEl.classList.toggle("equipment-mode", activeSummonType === "equipment");
  summonCompanionModeBtn.classList.toggle("active", activeSummonType === "companion");
  summonEquipmentModeBtn.classList.toggle("active", activeSummonType === "equipment");
  codexCompanionModeBtn.classList.toggle("active", activeCodexType === "companion");
  codexEquipmentModeBtn.classList.toggle("active", activeCodexType === "equipment");

  speedToggleBtn.textContent = gameSpeed === 2 ? "2배속 ON" : "2배속 OFF";
  skillModeToggleBtn.textContent = isSkillAutoMode ? "스킬 자동" : "스킬 수동";
};

drawCompanionBackground = function () {
  const isEquipment = activeSummonType === "equipment";

  ctx.fillStyle = isEquipment ? "#1e3348" : "#2c2532";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = isEquipment ? "#2f4b67" : "#46364f";
  ctx.fillRect(0, 0, canvas.width, 72);

  ctx.fillStyle = isEquipment ? "#263951" : "#362d3f";
  ctx.fillRect(0, 72, canvas.width, groundY - 72);

  ctx.fillStyle = isEquipment ? "#1f2f43" : "#292636";
  ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);

  ctx.fillStyle = "#f8fafc";
  ctx.font = "700 22px Arial";
  ctx.fillText(isEquipment ? "OFFICE EQUIPMENT" : "COMPANION RECRUIT", 302, 44);

  drawSummonMachine(352, 116);
  drawSummonPreview();
};

function drawSummonPreview() {
  if (!summonPreview) {
    ctx.fillStyle = activeSummonType === "equipment" ? "#dbeafe" : "#ffe08a";
    ctx.font = "700 18px Arial";
    ctx.fillText(activeSummonType === "equipment" ? "회사 비품을 뽑아보세요" : "골드로 동료를 뽑아보세요", 322, 285);
    return;
  }

  const alpha = Math.max(0, summonPreview.life / summonPreview.maxLife);
  ctx.save();
  ctx.globalAlpha = alpha;

  if (summonPreview.type === "equipment") {
    drawEquipmentSprite(450, 286, summonPreview.item);
  } else {
    drawCompanionSprite(450, 286, summonPreview.item.color);
  }

  ctx.fillStyle = "#111827";
  ctx.font = "700 18px Arial";
  ctx.fillText(summonPreview.label, 350, 338);
  ctx.restore();
}

drawCompanionCodexBackground = function () {
  const isEquipment = activeCodexType === "equipment";

  ctx.fillStyle = isEquipment ? "#1e3348" : "#242a3a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = isEquipment ? "#2f4b67" : "#38445d";
  ctx.fillRect(0, 0, canvas.width, 72);

  ctx.fillStyle = "#30394f";
  ctx.fillRect(0, 72, canvas.width, groundY - 72);

  ctx.fillStyle = isEquipment ? "#1f2f43" : "#252b3b";
  ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);

  ctx.fillStyle = "#f8fafc";
  ctx.font = "700 22px Arial";
  ctx.fillText(isEquipment ? "EQUIPMENT CODEX" : "COMPANION CODEX", 322, 44);

  if (isEquipment) {
    drawEquipmentCodex();
  } else {
    drawCompanionCodex();
  }
};

function drawCompanionCodex() {
  companionPool.forEach((companion, index) => {
    const record = companionCollection[companion.name];
    const x = 48 + (index % 3) * 280;
    const y = index < 3 ? 108 : 238;

    drawCompanionCodexCard(x, y, 236, 104, record);
  });
}

function drawEquipmentCodex() {
  equipmentPool.forEach((equipment, index) => {
    const count = equipments.filter(item => item.name === equipment.name).length;
    const x = 48 + (index % 3) * 280;
    const y = index < 3 ? 104 : 232;

    drawEquipmentCodexCard(x, y, 236, 112, equipment, count);
  });
}

function drawEquipmentCodexCard(x, y, width, height, equipment, count) {
  const isUnlocked = count > 0;

  ctx.fillStyle = isUnlocked ? "#ffffff" : "#dbeafe";
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = isUnlocked ? equipment.color : "#64748b";
  ctx.lineWidth = 4;
  ctx.strokeRect(x, y, width, height);

  drawEquipmentSprite(x + 42, y + 76, isUnlocked ? equipment : { ...equipment, color: "#94a3b8" });

  ctx.fillStyle = "#111827";
  ctx.font = "700 15px Arial";
  ctx.fillText(isUnlocked ? equipment.name : "???", x + 86, y + 28);

  ctx.fillStyle = isUnlocked ? equipment.color : "#475569";
  ctx.font = "700 13px Arial";
  ctx.fillText(isUnlocked ? equipment.rarity : "LOCKED", x + 86, y + 50);

  ctx.fillStyle = "#374151";
  ctx.font = "700 12px Arial";
  ctx.fillText(isUnlocked ? `보유 ${count}개` : "장비 뽑기에서 해금", x + 86, y + 72);

  ctx.fillStyle = "#6b7280";
  ctx.fillText(`수익 +${equipment.incomeBonus}/초`, x + 86, y + 92);
}

function updateSummonPreview(deltaScale) {
  if (!summonPreview) return;

  summonPreview.life -= deltaScale;
  if (summonPreview.life <= 0) {
    summonPreview = null;
  }
}

function setCodexType(nextType) {
  activeCodexType = nextType;
  codexCompanionModeBtn.classList.toggle("active", activeCodexType === "companion");
  codexEquipmentModeBtn.classList.toggle("active", activeCodexType === "equipment");
}

drawCompanionCodexBackground = function () {
  ctx.fillStyle = "#182335";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const panelX = 74;
  const panelY = 30;
  const panelW = 752;
  const panelH = 348;

  ctx.fillStyle = "#4b3322";
  ctx.fillRect(panelX, panelY, panelW, panelH);
  ctx.strokeStyle = "#d8b982";
  ctx.lineWidth = 5;
  ctx.strokeRect(panelX, panelY, panelW, panelH);

  ctx.fillStyle = "#7a5538";
  ctx.fillRect(panelX + 8, panelY + 8, panelW - 16, 36);

  ctx.fillStyle = "#fff7dc";
  ctx.font = "700 22px Arial";
  ctx.fillText("직원", panelX + panelW / 2 - 22, panelY + 33);

  drawHrFilterTabs(panelX + 24, panelY + 56);
  drawHrEmployeeList(panelX + 24, panelY + 92);
};

function drawHrFilterTabs(x, y) {
  const tabs = ["전체", "개발", "아트", "기획", "마케팅"];

  tabs.forEach((label, index) => {
    const tabX = x + index * 138;

    ctx.fillStyle = index === 0 ? "#f2d7a2" : "#6f4c32";
    ctx.fillRect(tabX, y, 126, 28);
    ctx.strokeStyle = "#3f2a1c";
    ctx.lineWidth = 2;
    ctx.strokeRect(tabX, y, 126, 28);

    ctx.fillStyle = index === 0 ? "#2a1b12" : "#fff7dc";
    ctx.font = "700 12px Arial";
    ctx.fillText(label, tabX + 48, y + 19);
  });
}

function drawHrEmployeeList(x, y) {
  const jobs = ["프로그래머", "아트 디자이너", "기획자", "마케터", "운영 매니저"];
  const records = companionPool.map((companion, index) => {
    const record = companionCollection[companion.name];
    return {
      ...record,
      job: jobs[index] || "직원",
      cost: [25000, 20000, 18000, 15000, 22000][index] || 15000
    };
  });

  records.forEach((record, index) => {
    drawHrEmployeeRow(record, x, y + index * 51);
  });
}

function drawHrEmployeeRow(record, x, y) {
  const isUnlocked = record.unlocked;

  ctx.fillStyle = isUnlocked ? "#fff4d8" : "#d8c2a3";
  ctx.fillRect(x, y, 704, 43);
  ctx.strokeStyle = "#8d6844";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, 704, 43);

  ctx.fillStyle = isUnlocked ? record.color : "#8b8b8b";
  ctx.fillRect(x + 10, y + 6, 34, 31);
  drawCompanionSprite(x + 27, y + 36, isUnlocked ? record.color : "#9ca3af");

  ctx.fillStyle = "#2a1b12";
  ctx.font = "700 14px Arial";
  ctx.fillText(isUnlocked ? record.job : "미채용 직원", x + 58, y + 17);

  ctx.font = "700 11px Arial";
  ctx.fillText(isUnlocked ? `Lv.${record.level}` : "Lv.0", x + 58, y + 36);
  ctx.fillText(isUnlocked ? `${record.name} 효과 +${Math.max(5, record.level * 5)}%` : "직원 채용에서 해금", x + 126, y + 36);

  ctx.fillStyle = "#f4c84a";
  ctx.beginPath();
  ctx.arc(x + 486, y + 15, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#2a1b12";
  ctx.font = "700 13px Arial";
  ctx.fillText(record.cost.toLocaleString(), x + 500, y + 20);

  ctx.fillStyle = isUnlocked ? "#43a63d" : "#8b8b8b";
  ctx.fillRect(x + 500, y + 24, 168, 17);
  ctx.strokeStyle = "#27611f";
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 500, y + 24, 168, 17);

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 12px Arial";
  ctx.fillText("승급", x + 568, y + 37);
}

function drawInvestmentBackground() {
  investmentButtons = [];

  ctx.fillStyle = "#211a16";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#4a382c";
  ctx.fillRect(0, 0, canvas.width, 72);

  ctx.fillStyle = "#2f2a2a";
  ctx.fillRect(0, 72, canvas.width, canvas.height - 72);

  ctx.fillStyle = "#f8fafc";
  ctx.font = "700 22px Arial";
  ctx.fillText("INVESTMENT", 372, 44);

  investments.forEach((investment, index) => {
    drawInvestmentRow(investment, index);
  });
}

function drawInvestmentRow(investment, index) {
  const x = 96;
  const y = 88 + index * 58;
  const width = 708;
  const height = 48;
  const buttonWidth = 132;
  const buttonHeight = 34;
  const buttonX = x + width - buttonWidth - 18;
  const buttonY = y + 7;

  ctx.fillStyle = "#f5e0b8";
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = "#5f4531";
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, width, height);

  ctx.fillStyle = investment.color;
  ctx.fillRect(x + 12, y + 9, 30, 30);

  ctx.fillStyle = "#241a12";
  ctx.font = "700 14px Arial";
  ctx.fillText(investment.name, x + 58, y + 20);

  ctx.fillStyle = "#6b4d36";
  ctx.font = "700 11px Arial";
  ctx.fillText(investment.description, x + 58, y + 38);

  ctx.fillStyle = "#241a12";
  ctx.font = "700 11px Arial";
  ctx.fillText(`Lv.${investment.level}`, x + 334, y + 32);
  ctx.fillText(`Lv.${investment.level + 1}`, x + 424, y + 32);

  ctx.fillStyle = player.gold >= investment.cost ? "#f6c64a" : "#c7a36a";
  ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
  ctx.strokeStyle = "#7c4f18";
  ctx.lineWidth = 2;
  ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);

  ctx.fillStyle = "#241a12";
  ctx.font = "700 13px Arial";
  ctx.fillText(`${investment.cost.toLocaleString()}G`, buttonX + 26, buttonY + 22);

  investmentButtons.push({
    id: investment.id,
    x: buttonX,
    y: buttonY,
    width: buttonWidth,
    height: buttonHeight
  });
}

function buyInvestment(id) {
  const investment = investments.find(item => item.id === id);
  if (!investment) return;

  if (player.gold < investment.cost) {
    alert("투자에 필요한 골드가 부족합니다.");
    return;
  }

  player.gold -= investment.cost;
  investment.apply();
  investment.level++;
  if (investment.id === "companyLevel" && investment.level % 5 === 0) {
    maxEmployees += 1;
  }
  investment.cost = Math.floor(investment.cost * 1.35);
  updateUI();
}

function handleCanvasClick(event) {
  if (activeView !== "investment") return;

  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (event.clientX - rect.left) * scaleX;
  const y = (event.clientY - rect.top) * scaleY;

  const targetButton = investmentButtons.find(button =>
    x >= button.x &&
    x <= button.x + button.width &&
    y >= button.y &&
    y <= button.y + button.height
  );

  if (targetButton) {
    buyInvestment(targetButton.id);
  }
}

function gameLoop() {
  const now = performance.now();
  const deltaTime = Math.min((now - lastFrameTime) * gameSpeed, 80);
  const deltaScale = deltaTime / 16.67;
  lastFrameTime = now;
  gameTime += deltaTime;

  updatePlayerRespawn();
  updateSpawnTimer(deltaTime);
  updateEnemies(deltaScale);

  autoAttack();
  if (isSkillAutoMode) {
    skillAttack();
    lightningSkillAttack();
  }

  if (activeView === "battle") {
    drawBackground();
  } else if (activeView === "company") {
    drawCompanyBackground();
  } else if (activeView === "summon") {
    drawCompanionBackground();
  } else if (activeView === "investment") {
    drawInvestmentBackground();
  } else {
    drawCompanionCodexBackground();
  }

  updateDamageTexts(deltaScale);
  updateSlashEffects(deltaScale);
  updateSkillEffects(deltaScale);
  updateLightningEffects(deltaScale);
  updateSummonPreview(deltaScale);

  if (activeView === "battle") {
    drawBattleCompanions();
  }

  if (activeView !== "companion" && activeView !== "investment") {
    drawPlayer();
  }
  if (activeView === "battle") {
    drawEnemies();
    drawSlashEffects();
    drawSkillEffects();
    drawLightningEffects();
  }
  if (activeView === "battle") {
    drawDamageTexts();
  }

  updateUI();

  requestAnimationFrame(gameLoop);
}

upgradeAttack = function () {
  if (player.gold < player.upgradeCost) {
    alert("골드가 부족합니다.");
    return;
  }

  player.gold -= player.upgradeCost;
  player.attack += 10;
  player.upgradeCost = Math.floor(player.upgradeCost * 1.5);

  updateUI();
};

speedToggleBtn.addEventListener("click", toggleSpeed);
skillModeToggleBtn.addEventListener("click", toggleSkillMode);
summonCompanionBtn.addEventListener("click", summonCompanion);
summonEquipmentBtn.addEventListener("click", summonEquipment);
summonCompanionModeBtn.addEventListener("click", () => setSummonType("companion"));
summonEquipmentModeBtn.addEventListener("click", () => setSummonType("equipment"));
codexCompanionModeBtn.addEventListener("click", () => setCodexType("companion"));
codexEquipmentModeBtn.addEventListener("click", () => setCodexType("equipment"));
spinSkillIconEl.addEventListener("click", () => useManualSkill("spin"));
lightningSkillIconEl.addEventListener("click", () => useManualSkill("lightning"));
battleTabBtn.addEventListener("click", () => setActiveView("battle"));
companyTabBtn.addEventListener("click", () => setActiveView("company"));
summonTabBtn.addEventListener("click", () => setActiveView("summon"));
investmentTabBtn.addEventListener("click", () => setActiveView("investment"));
companionTabBtn.addEventListener("click", () => setActiveView("companion"));
canvas.addEventListener("click", handleCanvasClick);

spawnEnemyGroup();
setActiveView("battle");
setSummonType("companion");
setCodexType("companion");

gameLoop();
