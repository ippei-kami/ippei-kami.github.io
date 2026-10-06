// Void Survivor - Master Definitions (Weapons, Passives, Evolutions, Enemies, Meta Upgrades)

const WEAPONS_DATA = {
  wand: {
    id: 'wand',
    name: '魔導弾 (Magic Wand)',
    icon: '🔮',
    type: 'weapon',
    desc: '最も近い敵を狙って高威力の魔力弾を自動連射する。',
    maxLevel: 5,
    evolution: 'gatling',
    requiredPassive: 'cooldown',
    levels: [
      { damage: 14, count: 1, cooldown: 1000, speed: 8, pierce: 1 },
      { damage: 18, count: 2, cooldown: 900, speed: 9, pierce: 1 },
      { damage: 24, count: 2, cooldown: 800, speed: 10, pierce: 2 },
      { damage: 30, count: 3, cooldown: 700, speed: 11, pierce: 2 },
      { damage: 38, count: 4, cooldown: 600, speed: 12, pierce: 3 }
    ]
  },
  blades: {
    id: 'blades',
    name: '回転刃 (Orbit Blades)',
    icon: '⚔️',
    type: 'weapon',
    desc: 'プレイヤーの周囲を高速回転し、接近する敵を刻み刻む防護刃。',
    maxLevel: 5,
    evolution: 'void_ripper',
    requiredPassive: 'area',
    levels: [
      { damage: 10, count: 2, radius: 65, speed: 2.2 },
      { damage: 14, count: 3, radius: 75, speed: 2.6 },
      { damage: 19, count: 4, radius: 85, speed: 3.0 },
      { damage: 25, count: 5, radius: 95, speed: 3.4 },
      { damage: 32, count: 6, radius: 105, speed: 3.8 }
    ]
  },
  lightning: {
    id: 'lightning',
    name: '神聖の雷 (Holy Lightning)',
    icon: '⚡',
    type: 'weapon',
    desc: '画面内のランダムな敵の頭上へ落雷を降らせ、範囲放電で一網打尽にする。',
    maxLevel: 5,
    evolution: 'thunderstorm',
    requiredPassive: 'damage',
    levels: [
      { damage: 35, strikes: 1, radius: 45, cooldown: 1800 },
      { damage: 45, strikes: 2, radius: 55, cooldown: 1600 },
      { damage: 60, strikes: 3, radius: 65, cooldown: 1400 },
      { damage: 80, strikes: 4, radius: 75, cooldown: 1200 },
      { damage: 110, strikes: 5, radius: 90, cooldown: 1000 }
    ]
  },
  molotov: {
    id: 'molotov',
    name: '冥府の火炎瓶 (Molotov)',
    icon: '🔥',
    type: 'weapon',
    desc: '地面に投擲して燃焼地帯を形成。踏んだ敵を継続ダメージで焼き払う。',
    maxLevel: 5,
    evolution: 'inferno',
    requiredPassive: 'duration',
    levels: [
      { damage: 8, count: 1, duration: 2500, radius: 40, cooldown: 2200 },
      { damage: 12, count: 2, duration: 3000, radius: 50, cooldown: 2000 },
      { damage: 16, count: 2, duration: 3500, radius: 60, cooldown: 1800 },
      { damage: 22, count: 3, duration: 4000, radius: 70, cooldown: 1600 },
      { damage: 28, count: 4, duration: 4500, radius: 85, cooldown: 1400 }
    ]
  },
  scythe: {
    id: 'scythe',
    name: '貫通大鎌 (Death Scythe)',
    icon: '🪓',
    type: 'weapon',
    desc: '巨大な刃を投擲し、敵の群れを貫通しながら往復して引き裂く。',
    maxLevel: 5,
    evolution: 'reaper_storm',
    requiredPassive: 'speed',
    levels: [
      { damage: 25, count: 1, speed: 6, cooldown: 1800, size: 28 },
      { damage: 34, count: 2, speed: 7, cooldown: 1600, size: 34 },
      { damage: 45, count: 2, speed: 8, cooldown: 1400, size: 40 },
      { damage: 60, count: 3, speed: 9, cooldown: 1200, size: 46 },
      { damage: 80, count: 4, speed: 10, cooldown: 1000, size: 54 }
    ]
  }
};

// 究極進化武器（Evolved Weapons）
const EVOLVED_WEAPONS_DATA = {
  gatling: {
    id: 'gatling',
    name: '★ 聖光ガトリング (Holy Gatling)',
    icon: '🌟',
    type: 'weapon',
    desc: '【究極進化】無数のレーザー光弾を絶え間なく超連射！敵群を一瞬で消し炭にする。',
    damage: 48,
    cooldown: 120,
    speed: 15,
    pierce: 5
  },
  void_ripper: {
    id: 'void_ripper',
    name: '★ 虚無の断層刃 (Void Ripper)',
    icon: '🌀',
    type: 'weapon',
    desc: '【究極進化】プレイヤーを覆う超巨大なブラックホール回転刃。接触した敵を切り刻みHPを吸収！',
    damage: 45,
    radius: 140,
    speed: 4.5,
    vamp: 1
  },
  thunderstorm: {
    id: 'thunderstorm',
    name: '★ 天変地異の雷嵐 (Thunderstorm)',
    icon: '⚡',
    type: 'weapon',
    desc: '【究極進化】神の怒り。画面全域に10発の巨大連鎖雷撃を叩き込み、全体殲滅！',
    damage: 160,
    strikes: 8,
    radius: 120,
    cooldown: 800
  },
  inferno: {
    id: 'inferno',
    name: '★ 煉獄の業火 (Inferno Field)',
    icon: '🌋',
    type: 'weapon',
    desc: '【究極進化】青白い炎が地面全体に広がり続け、触れた敵を最大HP割合ダメージで融解！',
    damage: 42,
    count: 5,
    duration: 6000,
    radius: 110,
    cooldown: 1200
  },
  reaper_storm: {
    id: 'reaper_storm',
    name: '★ 死神の破滅鎌 (Reaper Storm)',
    icon: '💀',
    type: 'weapon',
    desc: '【究極進化】全方位へ8つの超巨大死神鎌を放ち、画面内の敵を根こそぎ粉砕！',
    damage: 120,
    count: 8,
    speed: 11,
    cooldown: 900,
    size: 60
  }
};

const PASSIVES_DATA = {
  damage: {
    id: 'damage',
    name: '腕力グローブ (Power Gauntlet)',
    icon: '🥊',
    type: 'passive',
    desc: 'すべての武器の攻撃力を +15% 増加。',
    maxLevel: 5,
    effect: (lvl) => lvl * 0.15,
    format: (lvl) => `攻撃力 +${lvl * 15}%`
  },
  cooldown: {
    id: 'cooldown',
    name: '時の魔導書 (Spell Tome)',
    icon: '📖',
    type: 'passive',
    desc: 'すべての武器の攻撃クールダウンを -8% 短縮。',
    maxLevel: 5,
    effect: (lvl) => lvl * 0.08,
    format: (lvl) => `クールダウン -${lvl * 8}%`
  },
  speed: {
    id: 'speed',
    name: '韋駄天のブーツ (Swift Boots)',
    icon: '👟',
    type: 'passive',
    desc: 'プレイヤーの移動速度を +12% 上昇。回避が格段にしやすくなる。',
    maxLevel: 5,
    effect: (lvl) => lvl * 0.12,
    format: (lvl) => `移動速度 +${lvl * 12}%`
  },
  area: {
    id: 'area',
    name: '拡大の水晶 (Amplifier)',
    icon: '🔮',
    type: 'passive',
    desc: '攻撃や爆発、回転刃の範囲を +15% 拡大。',
    maxLevel: 5,
    effect: (lvl) => lvl * 0.15,
    format: (lvl) => `攻撃範囲 +${lvl * 15}%`
  },
  magnet: {
    id: 'magnet',
    name: '強磁石の指輪 (Attractor Ring)',
    icon: '🧲',
    type: 'passive',
    desc: '経験値ジェムやアイテムの吸い寄せ範囲を +35% 拡大。',
    maxLevel: 5,
    effect: (lvl) => lvl * 0.35,
    format: (lvl) => `回収範囲 +${lvl * 35}%`
  },
  heart: {
    id: 'heart',
    name: '巨人の血潮 (Giant Heart)',
    icon: '💖',
    type: 'passive',
    desc: '最大HPを +25 増加し、毎秒 +1 HP 自然回復。',
    maxLevel: 5,
    effect: (lvl) => ({ hp: lvl * 25, regen: lvl * 1 }),
    format: (lvl) => `最大HP +${lvl * 25} / 毎秒+${lvl}回復`
  },
  duration: {
    id: 'duration',
    name: '永久の砂時計 (Chronos Sand)',
    icon: '⏳',
    type: 'passive',
    desc: '火炎や召喚物の持続時間を +25% 延長。',
    maxLevel: 5,
    effect: (lvl) => lvl * 0.25,
    format: (lvl) => `効果持続 +${lvl * 25}%`
  }
};

// 敵の種類
const ENEMY_TYPES = {
  bat: {
    name: 'シャドウバット',
    hp: 15,
    speed: 2.2,
    size: 10,
    color: '#818cf8',
    damage: 8,
    exp: 1,
    shape: 'bat'
  },
  zombie: {
    name: 'ヴォイドウォーカー',
    hp: 35,
    speed: 1.2,
    size: 13,
    color: '#4ade80',
    damage: 12,
    exp: 2,
    shape: 'zombie'
  },
  ghost: {
    name: 'レイス',
    hp: 60,
    speed: 1.6,
    size: 14,
    color: '#38bdf8',
    damage: 15,
    exp: 3,
    shape: 'ghost'
  },
  skeleton: {
    name: '装甲スケルトン',
    hp: 120,
    speed: 1.4,
    size: 16,
    color: '#e2e8f0',
    damage: 20,
    exp: 5,
    shape: 'skeleton'
  },
  gargoyle: {
    name: 'ガーゴイル',
    hp: 280,
    speed: 2.0,
    size: 18,
    color: '#f97316',
    damage: 28,
    exp: 10,
    shape: 'gargoyle'
  },
  elite_beast: {
    name: '【エリート】深淵の巨獣',
    hp: 800,
    speed: 1.5,
    size: 26,
    color: '#a855f7',
    damage: 40,
    exp: 50,
    isElite: true,
    shape: 'elite'
  },
  boss_reaper: {
    name: '【ボス】虚無の死神',
    hp: 3500,
    speed: 1.3,
    size: 38,
    color: '#ef4444',
    damage: 55,
    exp: 200,
    isBoss: true,
    shape: 'boss'
  }
};

// 永続メタアップグレード（ハイレベル深淵ショップ）
const META_UPGRADES = [
  {
    id: 'hp',
    name: '強靭なる肉体',
    icon: '❤️',
    desc: 'ゲーム開始時の最大HPを永続増加。',
    maxLevel: 30,
    cost: (lvl) => Math.floor(15 * Math.pow(1.22, lvl)),
    effect: (lvl) => lvl * 15,
    format: (lvl) => `最大HP +${lvl * 15}`
  },
  {
    id: 'regen',
    name: '不死身の再生',
    icon: '💖',
    desc: '毎秒HPが自然回復する治癒力を獲得。',
    maxLevel: 20,
    cost: (lvl) => Math.floor(25 * Math.pow(1.28, lvl)),
    effect: (lvl) => Number((lvl * 0.4).toFixed(1)),
    format: (lvl) => `毎秒 +${(lvl * 0.4).toFixed(1)} HP回復`
  },
  {
    id: 'damage',
    name: '深淵の剛力',
    icon: '⚔️',
    desc: 'すべての武器・スキルの与ダメージを永続底上げ。',
    maxLevel: 30,
    cost: (lvl) => Math.floor(20 * Math.pow(1.24, lvl)),
    effect: (lvl) => Number((lvl * 0.06).toFixed(2)),
    format: (lvl) => `全与ダメージ +${lvl * 6}%`
  },
  {
    id: 'cd',
    name: '叡智の短縮',
    icon: '📖',
    desc: 'すべての武器の攻撃クールダウンを短縮連射化。',
    maxLevel: 15,
    cost: (lvl) => Math.floor(35 * Math.pow(1.35, lvl)),
    effect: (lvl) => Number((lvl * 0.03).toFixed(2)),
    format: (lvl) => `武器クールダウン -${lvl * 3}%`
  },
  {
    id: 'speed',
    name: '疾風走破',
    icon: '⚡',
    desc: 'プレイヤーの初期移動速度を永続アップ。',
    maxLevel: 20,
    cost: (lvl) => Math.floor(18 * Math.pow(1.26, lvl)),
    effect: (lvl) => Number((lvl * 0.04).toFixed(2)),
    format: (lvl) => `移動速度 +${lvl * 4}%`
  },
  {
    id: 'dash_cd',
    name: '緊急回避の神技',
    icon: '💨',
    desc: 'スペースキークールダウンを短縮。無敵回避の頻度アップ！',
    maxLevel: 15,
    cost: (lvl) => Math.floor(30 * Math.pow(1.32, lvl)),
    effect: (lvl) => Number((lvl * 0.04).toFixed(2)),
    format: (lvl) => `ダッシュCT -${lvl * 4}%`
  },
  {
    id: 'dash_inv',
    name: '虚無の残像',
    icon: '🛡️',
    desc: '緊急ダッシュ中の完全無敵時間を大幅延長。',
    maxLevel: 10,
    cost: (lvl) => Math.floor(40 * Math.pow(1.38, lvl)),
    effect: (lvl) => lvl * 35, // +35ms per lvl
    format: (lvl) => `ダッシュ無敵時間 +${lvl * 35}ms`
  },
  {
    id: 'magnet',
    name: '魂の引き寄せ',
    icon: '🧲',
    desc: '経験値ジェムやアイテムの基礎回収範囲を大幅拡大。',
    maxLevel: 25,
    cost: (lvl) => Math.floor(15 * Math.pow(1.23, lvl)),
    effect: (lvl) => Number((lvl * 0.15).toFixed(2)),
    format: (lvl) => `回収範囲 +${lvl * 15}%`
  },
  {
    id: 'greed',
    name: '強欲と幸運',
    icon: '✨',
    desc: '獲得EXPと敵からの魔核ドロップ率を倍増。',
    maxLevel: 25,
    cost: (lvl) => Math.floor(25 * Math.pow(1.25, lvl)),
    effect: (lvl) => Number((lvl * 0.08).toFixed(2)),
    format: (lvl) => `獲得EXP & 魔核ドロップ +${lvl * 8}%`
  },
  {
    id: 'revive',
    name: '不死鳥の加護',
    icon: '🪶',
    desc: '力尽きた時、HP50%でその場で蘇生する奇跡の権利！',
    maxLevel: 3,
    cost: (lvl) => [150, 450, 1200][lvl] || 2000,
    effect: (lvl) => lvl,
    format: (lvl) => `復活可能回数 +${lvl}回`
  }
];

window.SURVIVOR_DATA = {
  WEAPONS_DATA,
  EVOLVED_WEAPONS_DATA,
  PASSIVES_DATA,
  ENEMY_TYPES,
  META_UPGRADES
};
