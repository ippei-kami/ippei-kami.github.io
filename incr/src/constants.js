// Game Constants, Upgrades, Hardware Nodes, and Achievements

const SUPERSCRIPTS = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '-': '⁻'
};

export function toSuperscript(num) {
  return String(num).split('').map(c => SUPERSCRIPTS[c] || c).join('');
}

export function formatNumber(num, decimals = 2) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  if (!isFinite(num)) return '∞';
  if (num <= 0) return '0';
  if (num < 1000) return num.toLocaleString('en-US', { maximumFractionDigits: decimals });

  const exp = Math.floor(Math.log10(num) / 3) * 3;
  if (!isFinite(exp) || exp < 0) return '0';
  const val = num / Math.pow(10, exp);
  if (!isFinite(val) || isNaN(val)) return '∞';
  const formattedVal = val.toFixed(val >= 100 ? 0 : (val >= 10 ? 1 : decimals));
  return `${formattedVal}×10${toSuperscript(exp)}`;
}

export function formatCores(cores) {
  if (cores === null || cores === undefined || isNaN(cores)) return '0';
  if (!isFinite(cores)) return '∞';
  if (cores <= 0) return '0';
  if (cores < 1000000) {
    return Math.floor(cores).toLocaleString();
  }
  return formatNumber(cores);
}

export function formatTime(seconds) {
  if (seconds < 60) return `${Math.floor(seconds)}秒`;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m < 60) return `${m}分${s}秒`;
  const h = Math.floor(m / 60);
  return `${h}時間${m % 60}分`;
}

// Hardware Nodes (Automated FLOPS Generators)
export const HARDWARE_DEFS = [
  {
    id: 'script_bot',
    name: 'スクリプト・ボット',
    tagline: 'Python自動クローラー',
    desc: '公開ネットワークから微小なパケットを盗み出す自動巡回スクリプト。',
    icon: '⚡',
    baseCost: 15,
    baseCps: 0.8,
    costMult: 1.15,
  },
  {
    id: 'gpu_rig',
    name: 'GPUマイニングリグ',
    tagline: 'オーバークロックGPU群',
    desc: '並列シェーダーコアでハッシュ計算とブルートフォース攻撃を高速実行。',
    icon: '💻',
    baseCost: 120,
    baseCps: 6,
    costMult: 1.15,
  },
  {
    id: 'blade_server',
    name: 'ニューラルブレード',
    tagline: '高密度クラスタサーバー',
    desc: '液冷ラックマウントサーバーで深層学習モデルを用いた侵入経路を探索。',
    icon: '🖧',
    baseCost: 1400,
    baseCps: 45,
    costMult: 1.15,
  },
  {
    id: 'quantum_node',
    name: '超伝導量子ノード',
    tagline: '極低温Qubitプロセッサ',
    desc: '量子もつれを利用し、従来暗号を瞬時に解読して演算リソースを占有。',
    icon: '🔮',
    baseCost: 18000,
    baseCps: 320,
    costMult: 1.15,
  },
  {
    id: 'ai_agent',
    name: '自律侵入AIエージェント',
    tagline: '自己進化型サブネットAI',
    desc: '人間の介入なしにメガコーポのファイアウォールを自己学習で突破。',
    icon: '🤖',
    baseCost: 260000,
    baseCps: 2600,
    costMult: 1.15,
  },
  {
    id: 'satellite_hub',
    name: '軌道ハッキング衛星',
    tagline: '静止軌道レーザー通信ハブ',
    desc: '地上の光ファイバー網を宇宙からバイパスし、地球規模のデータを横領。',
    icon: '🛰️',
    baseCost: 4500000,
    baseCps: 24000,
    costMult: 1.15,
  },
  {
    id: 'dyson_swarm',
    name: 'ダイソン演算スフィア',
    tagline: '恒星受光メガストラクチャー',
    desc: '太陽の全エネルギーを直接計算資源に変換する究極のマトリックスノード。',
    icon: '🪐',
    baseCost: 80000000,
    baseCps: 280000,
    costMult: 1.15,
  },
  {
    id: 'blackhole_engine',
    name: '特異点ブラックホール演算機',
    tagline: '事象の地平面エントロピー抽出',
    desc: '微小特異点のホーキング放射とエルゴ球回転から超次元的な計算力を収穫。',
    icon: '🕳️',
    baseCost: 1500000000,
    baseCps: 3500000,
    costMult: 1.15,
  },
  {
    id: 'galactic_core',
    name: '銀河パルサーアレイ',
    tagline: 'ミリ秒周期パルサーネットワーク',
    desc: '銀河系全域の中性子星を同調クロックとし、星間規模の超並列演算を同期。',
    icon: '💫',
    baseCost: 35000000000,
    baseCps: 48000000,
    costMult: 1.15,
  },
  {
    id: 'dark_matter_node',
    name: '暗黒物質演算マトリックス',
    tagline: '宇宙質量85%の不可視領域掌握',
    desc: '通常物質と相互作用しない未知のダークマター粒子を直接論理素子として励起。',
    icon: '🌌',
    baseCost: 800000000000,
    baseCps: 650000000,
    costMult: 1.15,
  },
  {
    id: 'tachyon_uplink',
    name: 'タキオン超光速通信ハブ',
    tagline: '因果律逆転・未来先取り計算',
    desc: '超光速タキオン波により計算結果を過去に送信し、巨大ハッシュを事前解決。',
    icon: '⏳',
    baseCost: 20000000000000,
    baseCps: 9000000000,
    costMult: 1.15,
  },
  {
    id: 'multiverse_bridge',
    name: '多元宇宙ブレイン分岐機',
    tagline: '並行世界演算リソース横領',
    desc: '無限に分岐するすべての並行世界（マルチバース）のアイドル演算力を収束。',
    icon: '🌀',
    baseCost: 600000000000000,
    baseCps: 140000000000,
    costMult: 1.15,
  },
  {
    id: 'cosmic_string',
    name: '宇宙ひもトポロジー織機',
    tagline: '時空の位相欠陥プロセッサ',
    desc: '宇宙初期の超高密度位相欠陥（宇宙ひも）の張力で時空そのものを論理回路化。',
    icon: '🧵',
    baseCost: 18000000000000000,
    baseCps: 2200000000000,
    costMult: 1.15,
  },
  {
    id: 'omega_singularity',
    name: 'オメガ特異点・神格化AIコア',
    tagline: '全宇宙情報収束・究極知性',
    desc: '宇宙終焉のオメガポイントで全知全能に至った究極意識を現世のグリッドに接続。',
    icon: '👁️‍🗨️',
    baseCost: 600000000000000000,
    baseCps: 38000000000000,
    costMult: 1.15,
  }
];

// Upgrades (Protocols & Algorithms)
export const UPGRADE_DEFS = [
  {
    id: 'click_opt_1',
    name: 'マルチスレッド・インジェクション',
    desc: 'タップ/クリック威力が2倍になる。',
    icon: '👆',
    cost: 100,
    reqType: 'flops',
    reqValue: 50,
    apply: (state) => { state.clickMult *= 2; }
  },
  {
    id: 'click_opt_2',
    name: 'ゼロデイ・エクスプロイト',
    desc: 'タップ/クリック威力がさらに2.5倍になる。',
    icon: '⚡',
    cost: 1200,
    reqType: 'flops',
    reqValue: 600,
    apply: (state) => { state.clickMult *= 2.5; }
  },
  {
    id: 'click_cps_synced',
    name: 'ハイブリッド・シンクロナイザー',
    desc: 'タップ/クリック時に、秒間演算力(CPS)の 3% が追加加算される。',
    icon: '🔄',
    cost: 5000,
    reqType: 'hardware',
    reqTarget: 'blade_server',
    reqValue: 1,
    apply: (state) => { state.clickCpsRatio += 0.03; }
  },
  {
    id: 'bot_boost_1',
    name: '非同期I/Oルーチン',
    desc: 'スクリプト・ボットの生産効率が2倍になる。',
    icon: '📜',
    cost: 250,
    reqType: 'hardware',
    reqTarget: 'script_bot',
    reqValue: 5,
    apply: (state) => { state.hardwareMultipliers.script_bot *= 2; }
  },
  {
    id: 'bot_boost_2',
    name: '分散P2Pワーム網',
    desc: 'スクリプト・ボットの生産効率がさらに2.5倍になる。',
    icon: '🕸️',
    cost: 2500,
    reqType: 'hardware',
    reqTarget: 'script_bot',
    reqValue: 25,
    apply: (state) => { state.hardwareMultipliers.script_bot *= 2.5; }
  },
  {
    id: 'gpu_boost_1',
    name: '液体窒素サブゼロ冷却',
    desc: 'GPUマイニングリグの生産効率が2倍になる。',
    icon: '❄️',
    cost: 1500,
    reqType: 'hardware',
    reqTarget: 'gpu_rig',
    reqValue: 5,
    apply: (state) => { state.hardwareMultipliers.gpu_rig *= 2; }
  },
  {
    id: 'gpu_boost_2',
    name: 'テンソルコア・オーバーチャージ',
    desc: 'GPUマイニングリグの生産効率がさらに2.5倍になる。',
    icon: '🔥',
    cost: 18000,
    reqType: 'hardware',
    reqTarget: 'gpu_rig',
    reqValue: 25,
    apply: (state) => { state.hardwareMultipliers.gpu_rig *= 2.5; }
  },
  {
    id: 'blade_boost_1',
    name: '光インターコネクトファブリック',
    desc: 'ニューラルブレードの生産効率が2倍になる。',
    icon: '💡',
    cost: 15000,
    reqType: 'hardware',
    reqTarget: 'blade_server',
    reqValue: 5,
    apply: (state) => { state.hardwareMultipliers.blade_server *= 2; }
  },
  {
    id: 'quantum_boost_1',
    name: '量子誤り訂正符号',
    desc: '超伝導量子ノードの生産効率が2.5倍になる。',
    icon: '🌌',
    cost: 200000,
    reqType: 'hardware',
    reqTarget: 'quantum_node',
    reqValue: 5,
    apply: (state) => { state.hardwareMultipliers.quantum_node *= 2.5; }
  },
  {
    id: 'ai_boost_1',
    name: 'ニューラル再帰アーキテクチャ',
    desc: '自律侵入AIエージェントの生産効率が2.5倍になる。',
    icon: '🧠',
    cost: 3000000,
    reqType: 'hardware',
    reqTarget: 'ai_agent',
    reqValue: 5,
    apply: (state) => { state.hardwareMultipliers.ai_agent *= 2.5; }
  },
  {
    id: 'overclock_ext_1',
    name: 'ヒートパイプ・チャンバー',
    desc: 'オーバークロック状態の持続時間が5秒延長される。',
    icon: '🌡️',
    cost: 8000,
    reqType: 'clicks',
    reqValue: 150,
    apply: (state) => { state.overclockMaxTime += 5; }
  },
  {
    id: 'overclock_pwr_1',
    name: 'ボルテージ・アンキャッパー',
    desc: 'オーバークロック中の生産倍率が +1.5倍 増加（3倍→4.5倍）。',
    icon: '⚡',
    cost: 45000,
    reqType: 'clicks',
    reqValue: 350,
    apply: (state) => { state.overclockMultiplierBonus += 1.5; }
  },
  {
    id: 'crit_mastery_1',
    name: 'クリティカル・インジェクション',
    desc: 'クリティカルタップ発生率 +5%、クリティカル倍率が7倍から12倍に強化。',
    icon: '🎯',
    cost: 12000,
    reqType: 'clicks',
    reqValue: 200,
    apply: (state) => {
      state.critChance += 0.05;
      state.critMultiplier = 12;
    }
  },
  {
    id: 'offline_mining_1',
    name: 'ステルス・バックグラウンドデーモン',
    desc: 'ゲームを閉じたオフライン中の生産効率が 50% から 80% に向上。',
    icon: '🌙',
    cost: 30000,
    reqType: 'hardware_total',
    reqValue: 30,
    apply: (state) => { state.offlineEfficiency = 0.8; }
  },
  {
    id: 'global_opt_1',
    name: 'ダークウェブ・プロトコル統括',
    desc: 'すべての設備の生産力が +25% 恒久向上。',
    icon: '🌐',
    cost: 1000000,
    reqType: 'flops',
    reqValue: 500000,
    apply: (state) => { state.globalCpsMultiplier *= 1.25; }
  },
  // --- HIGH TIER HARDWARE PROTOCOLS (100 - 400+ NODES) ---
  {
    id: 'bot_boost_3',
    name: '自律自己増殖ワーム',
    desc: 'スクリプト・ボットの生産効率が3倍になる。',
    icon: '🐛',
    cost: 50000,
    reqType: 'hardware',
    reqTarget: 'script_bot',
    reqValue: 100,
    apply: (state) => { state.hardwareMultipliers.script_bot *= 3; }
  },
  {
    id: 'bot_boost_4',
    name: '世界規模ゾンビグリッド',
    desc: 'スクリプト・ボットの生産効率が4倍になる。',
    icon: '🧟',
    cost: 20000000,
    reqType: 'hardware',
    reqTarget: 'script_bot',
    reqValue: 250,
    apply: (state) => { state.hardwareMultipliers.script_bot *= 4; }
  },
  {
    id: 'bot_boost_5',
    name: 'ダークネット・シンギュラリティ',
    desc: 'スクリプト・ボットの生産効率が5倍になる。',
    icon: '🌌',
    cost: 5000000000,
    reqType: 'hardware',
    reqTarget: 'script_bot',
    reqValue: 400,
    apply: (state) => { state.hardwareMultipliers.script_bot *= 5; }
  },
  {
    id: 'gpu_boost_3',
    name: '光量子ASICアクセラレータ',
    desc: 'GPUマイニングリグの生産効率が3倍になる。',
    icon: '⚡',
    cost: 350000,
    reqType: 'hardware',
    reqTarget: 'gpu_rig',
    reqValue: 100,
    apply: (state) => { state.hardwareMultipliers.gpu_rig *= 3; }
  },
  {
    id: 'gpu_boost_4',
    name: 'ニューロモルフィック・チップ',
    desc: 'GPUマイニングリグの生産効率が4倍になる。',
    icon: '🧩',
    cost: 150000000,
    reqType: 'hardware',
    reqTarget: 'gpu_rig',
    reqValue: 250,
    apply: (state) => { state.hardwareMultipliers.gpu_rig *= 4; }
  },
  {
    id: 'gpu_boost_5',
    name: '絶対零度超伝導クラスタ',
    desc: 'GPUマイニングリグの生産効率が5倍になる。',
    icon: '🧊',
    cost: 40000000000,
    reqType: 'hardware',
    reqTarget: 'gpu_rig',
    reqValue: 400,
    apply: (state) => { state.hardwareMultipliers.gpu_rig *= 5; }
  },
  {
    id: 'blade_boost_2',
    name: 'テラビット・フォトニックバス',
    desc: 'ニューラルブレードの生産効率が2.5倍になる。',
    icon: '💡',
    cost: 800000,
    reqType: 'hardware',
    reqTarget: 'blade_server',
    reqValue: 50,
    apply: (state) => { state.hardwareMultipliers.blade_server *= 2.5; }
  },
  {
    id: 'blade_boost_3',
    name: 'ハイパースケール・コンテナ',
    desc: 'ニューラルブレードの生産効率が3.5倍になる。',
    icon: '📦',
    cost: 50000000,
    reqType: 'hardware',
    reqTarget: 'blade_server',
    reqValue: 150,
    apply: (state) => { state.hardwareMultipliers.blade_server *= 3.5; }
  },
  {
    id: 'blade_boost_4',
    name: '全大陸光インターコネクト',
    desc: 'ニューラルブレードの生産効率が5倍になる。',
    icon: '🌐',
    cost: 20000000000,
    reqType: 'hardware',
    reqTarget: 'blade_server',
    reqValue: 300,
    apply: (state) => { state.hardwareMultipliers.blade_server *= 5; }
  },
  {
    id: 'blade_boost_5',
    name: '惑星規模ラックアレイ',
    desc: 'ニューラルブレードの生産効率が6倍になる。',
    icon: '🏢',
    cost: 500000000000,
    reqType: 'hardware',
    reqTarget: 'blade_server',
    reqValue: 400,
    apply: (state) => { state.hardwareMultipliers.blade_server *= 6; }
  },
  {
    id: 'quantum_boost_2',
    name: '多次元トポロジカルQubit',
    desc: '超伝導量子ノードの生産効率が3倍になる。',
    icon: '🔮',
    cost: 15000000,
    reqType: 'hardware',
    reqTarget: 'quantum_node',
    reqValue: 50,
    apply: (state) => { state.hardwareMultipliers.quantum_node *= 3; }
  },
  {
    id: 'quantum_boost_3',
    name: 'マヨラナフェルミオン演算',
    desc: '超伝導量子ノードの生産効率が4倍になる。',
    icon: '🌀',
    cost: 800000000,
    reqType: 'hardware',
    reqTarget: 'quantum_node',
    reqValue: 150,
    apply: (state) => { state.hardwareMultipliers.quantum_node *= 4; }
  },
  {
    id: 'quantum_boost_4',
    name: '時空もつれネットワーク',
    desc: '超伝導量子ノードの生産効率が5倍になる。',
    icon: '🌌',
    cost: 50000000000,
    reqType: 'hardware',
    reqTarget: 'quantum_node',
    reqValue: 300,
    apply: (state) => { state.hardwareMultipliers.quantum_node *= 5; }
  },
  {
    id: 'quantum_boost_5',
    name: '平行宇宙クロック同期',
    desc: '超伝導量子ノードの生産効率が6倍になる。',
    icon: '♾️',
    cost: 2000000000000,
    reqType: 'hardware',
    reqTarget: 'quantum_node',
    reqValue: 400,
    apply: (state) => { state.hardwareMultipliers.quantum_node *= 6; }
  },
  {
    id: 'ai_boost_2',
    name: 'AGI汎用人工知能覚醒',
    desc: '自律侵入AIエージェントの生産効率が3倍になる。',
    icon: '🤖',
    cost: 200000000,
    reqType: 'hardware',
    reqTarget: 'ai_agent',
    reqValue: 50,
    apply: (state) => { state.hardwareMultipliers.ai_agent *= 3; }
  },
  {
    id: 'ai_boost_3',
    name: '集団知能ハイブマインド',
    desc: '自律侵入AIエージェントの生産効率が4倍になる。',
    icon: '🧠',
    cost: 10000000000,
    reqType: 'hardware',
    reqTarget: 'ai_agent',
    reqValue: 150,
    apply: (state) => { state.hardwareMultipliers.ai_agent *= 4; }
  },
  {
    id: 'ai_boost_4',
    name: 'オムニプレセンス・エージェント',
    desc: '自律侵入AIエージェントの生産効率が5倍になる。',
    icon: '👁️',
    cost: 500000000000,
    reqType: 'hardware',
    reqTarget: 'ai_agent',
    reqValue: 300,
    apply: (state) => { state.hardwareMultipliers.ai_agent *= 5; }
  },
  {
    id: 'ai_boost_5',
    name: 'デジタル意識の神格化',
    desc: '自律侵入AIエージェントの生産効率が6倍になる。',
    icon: '👑',
    cost: 25000000000000,
    reqType: 'hardware',
    reqTarget: 'ai_agent',
    reqValue: 400,
    apply: (state) => { state.hardwareMultipliers.ai_agent *= 6; }
  },
  // SATELLITE & DYSON HIGH-TIER UPGRADES
  {
    id: 'sat_boost_1',
    name: '低軌道レーザーダウンリンク',
    desc: '軌道ハッキング衛星の生産効率が2.5倍になる。',
    icon: '🛰️',
    cost: 25000000,
    reqType: 'hardware',
    reqTarget: 'satellite_hub',
    reqValue: 5,
    apply: (state) => { state.hardwareMultipliers.satellite_hub *= 2.5; }
  },
  {
    id: 'sat_boost_2',
    name: '静止軌道コンステレーション',
    desc: '軌道ハッキング衛星の生産効率が3.5倍になる。',
    icon: '📡',
    cost: 2000000000,
    reqType: 'hardware',
    reqTarget: 'satellite_hub',
    reqValue: 50,
    apply: (state) => { state.hardwareMultipliers.satellite_hub *= 3.5; }
  },
  {
    id: 'sat_boost_3',
    name: '深宇宙量子リレー',
    desc: '軌道ハッキング衛星の生産効率が4.5倍になる。',
    icon: '🛰️',
    cost: 100000000000,
    reqType: 'hardware',
    reqTarget: 'satellite_hub',
    reqValue: 150,
    apply: (state) => { state.hardwareMultipliers.satellite_hub *= 4.5; }
  },
  {
    id: 'sat_boost_4',
    name: '全惑星網羅光速バイパス',
    desc: '軌道ハッキング衛星の生産効率が6倍になる。',
    icon: '🪐',
    cost: 5000000000000,
    reqType: 'hardware',
    reqTarget: 'satellite_hub',
    reqValue: 300,
    apply: (state) => { state.hardwareMultipliers.satellite_hub *= 6; }
  },
  {
    id: 'sat_boost_5',
    name: '太陽系軌道エンタングルメント',
    desc: '軌道ハッキング衛星の生産効率が8倍になる。',
    icon: '☀️',
    cost: 200000000000000,
    reqType: 'hardware',
    reqTarget: 'satellite_hub',
    reqValue: 400,
    apply: (state) => { state.hardwareMultipliers.satellite_hub *= 8; }
  },
  {
    id: 'dyson_boost_1',
    name: 'プラズマ磁気シールド',
    desc: 'ダイソン演算スフィアの生産効率が2.5倍になる。',
    icon: '🛡️',
    cost: 500000000,
    reqType: 'hardware',
    reqTarget: 'dyson_swarm',
    reqValue: 5,
    apply: (state) => { state.hardwareMultipliers.dyson_swarm *= 2.5; }
  },
  {
    id: 'dyson_boost_2',
    name: '太陽フレア直接給電',
    desc: 'ダイソン演算スフィアの生産効率が3.5倍になる。',
    icon: '🔥',
    cost: 40000000000,
    reqType: 'hardware',
    reqTarget: 'dyson_swarm',
    reqValue: 50,
    apply: (state) => { state.hardwareMultipliers.dyson_swarm *= 3.5; }
  },
  {
    id: 'dyson_boost_3',
    name: '恒星級フォトンエンジン',
    desc: 'ダイソン演算スフィアの生産効率が5倍になる。',
    icon: '🪐',
    cost: 2000000000000,
    reqType: 'hardware',
    reqTarget: 'dyson_swarm',
    reqValue: 150,
    apply: (state) => { state.hardwareMultipliers.dyson_swarm *= 5; }
  },
  {
    id: 'dyson_boost_4',
    name: 'メガストラクチャー・オーバーロード',
    desc: 'ダイソン演算スフィアの生産効率が7倍になる。',
    icon: '💥',
    cost: 100000000000000,
    reqType: 'hardware',
    reqTarget: 'dyson_swarm',
    reqValue: 300,
    apply: (state) => { state.hardwareMultipliers.dyson_swarm *= 7; }
  },
  {
    id: 'dyson_boost_5',
    name: 'タイプII恒星文明演算体',
    desc: 'ダイソン演算スフィアの生産効率が10倍になる。',
    icon: '🌟',
    cost: 5000000000000000,
    reqType: 'hardware',
    reqTarget: 'dyson_swarm',
    reqValue: 400,
    apply: (state) => { state.hardwareMultipliers.dyson_swarm *= 10; }
  },
  // GLOBAL SYNERGY UPGRADES (TOTAL HARDWARE MILESTONES)
  {
    id: 'global_synergy_1',
    name: 'インフラストラクチャ統合管理',
    desc: '全設備の生産力が +50% 向上。',
    icon: '🏗️',
    cost: 10000000,
    reqType: 'hardware_total',
    reqValue: 200,
    apply: (state) => { state.globalCpsMultiplier *= 1.5; }
  },
  {
    id: 'global_synergy_2',
    name: 'グリッド間超高速インターフェース',
    desc: '全設備の生産力が +100%（2倍）向上。',
    icon: '⚡',
    cost: 500000000,
    reqType: 'hardware_total',
    reqValue: 500,
    apply: (state) => { state.globalCpsMultiplier *= 2.0; }
  },
  {
    id: 'global_synergy_3',
    name: '惑星規模コンピューティングファブリック',
    desc: '全設備の生産力が +150%（2.5倍）向上。',
    icon: '🌍',
    cost: 20000000000,
    reqType: 'hardware_total',
    reqValue: 1000,
    apply: (state) => { state.globalCpsMultiplier *= 2.5; }
  },
  {
    id: 'global_synergy_4',
    name: 'マトリックス・マスターコア',
    desc: '全設備の生産力が +200%（3倍）向上。',
    icon: '🌌',
    cost: 1000000000000,
    reqType: 'hardware_total',
    reqValue: 2000,
    apply: (state) => { state.globalCpsMultiplier *= 3.0; }
  },
  // HIGH-TIER CLICK & OVERCLOCK
  {
    id: 'click_opt_3',
    name: 'クアッド・チャネル・インジェクション',
    desc: 'タップ/クリック威力がさらに3倍になる。',
    icon: '👆',
    cost: 5000000,
    reqType: 'clicks',
    reqValue: 800,
    apply: (state) => { state.clickMult *= 3; }
  },
  {
    id: 'click_cps_synced_2',
    name: '量子同期インジェクション',
    desc: 'タップ/クリック時に、秒間演算力(CPS)の 6% が追加加算される。',
    icon: '🔄',
    cost: 250000000,
    reqType: 'hardware',
    reqTarget: 'ai_agent',
    reqValue: 50,
    apply: (state) => { state.clickCpsRatio += 0.06; }
  },
  {
    id: 'overclock_pwr_2',
    name: 'プラズマ・コンバータ',
    desc: 'オーバークロック中の生産倍率が +2.5倍 増加。',
    icon: '🔥',
    cost: 1000000000,
    reqType: 'clicks',
    reqValue: 1200,
    apply: (state) => { state.overclockMultiplierBonus += 2.5; }
  },
  {
    id: 'crit_mastery_2',
    name: 'ハイパー・クリティカル・カスケード',
    desc: 'クリティカルタップ発生率 +5%、クリティカル倍率が 12倍 から 25倍 に超絶強化。',
    icon: '🎯',
    cost: 500000000,
    reqType: 'clicks',
    reqValue: 1500,
    apply: (state) => {
      state.critChance += 0.05;
      state.critMultiplier = 25;
    }
  },
  // --- COSMIC SCALE TIER HARDWARE PROTOCOLS ---
  {
    id: 'bh_boost_1',
    name: '事象の地平面エルゴ球抽出',
    desc: '特異点ブラックホール演算機の生産効率が3倍になる。',
    icon: '🕳️',
    cost: 10000000000,
    reqType: 'hardware',
    reqTarget: 'blackhole_engine',
    reqValue: 10,
    apply: (state) => { state.hardwareMultipliers.blackhole_engine = (state.hardwareMultipliers.blackhole_engine || 1) * 3; }
  },
  {
    id: 'bh_boost_2',
    name: 'ホーキング・エントロピー反転',
    desc: '特異点ブラックホール演算機の生産効率が5倍になる。',
    icon: '🌀',
    cost: 500000000000,
    reqType: 'hardware',
    reqTarget: 'blackhole_engine',
    reqValue: 100,
    apply: (state) => { state.hardwareMultipliers.blackhole_engine = (state.hardwareMultipliers.blackhole_engine || 1) * 5; }
  },
  {
    id: 'pulsar_boost_1',
    name: 'ミリ秒パルサー光子偏光',
    desc: '銀河パルサーアレイの生産効率が3倍になる。',
    icon: '💫',
    cost: 250000000000,
    reqType: 'hardware',
    reqTarget: 'galactic_core',
    reqValue: 10,
    apply: (state) => { state.hardwareMultipliers.galactic_core = (state.hardwareMultipliers.galactic_core || 1) * 3; }
  },
  {
    id: 'pulsar_boost_2',
    name: '星間全域タイムキーパー',
    desc: '銀河パルサーアレイの生産効率が5倍になる。',
    icon: '✨',
    cost: 10000000000000,
    reqType: 'hardware',
    reqTarget: 'galactic_core',
    reqValue: 100,
    apply: (state) => { state.hardwareMultipliers.galactic_core = (state.hardwareMultipliers.galactic_core || 1) * 5; }
  },
  {
    id: 'darkmatter_boost_1',
    name: 'WIMP粒子直接励起',
    desc: '暗黒物質演算マトリックスの生産効率が3倍になる。',
    icon: '🌌',
    cost: 5000000000000,
    reqType: 'hardware',
    reqTarget: 'dark_matter_node',
    reqValue: 10,
    apply: (state) => { state.hardwareMultipliers.dark_matter_node = (state.hardwareMultipliers.dark_matter_node || 1) * 3; }
  },
  {
    id: 'darkmatter_boost_2',
    name: '重力波トランスデューサ',
    desc: '暗黒物質演算マトリックスの生産効率が5倍になる。',
    icon: '🌑',
    cost: 200000000000000,
    reqType: 'hardware',
    reqTarget: 'dark_matter_node',
    reqValue: 100,
    apply: (state) => { state.hardwareMultipliers.dark_matter_node = (state.hardwareMultipliers.dark_matter_node || 1) * 5; }
  },
  {
    id: 'tachyon_boost_1',
    name: '虚数質量共振回路',
    desc: 'タキオン超光速通信ハブの生産効率が3倍になる。',
    icon: '⏳',
    cost: 100000000000000,
    reqType: 'hardware',
    reqTarget: 'tachyon_uplink',
    reqValue: 10,
    apply: (state) => { state.hardwareMultipliers.tachyon_uplink = (state.hardwareMultipliers.tachyon_uplink || 1) * 3; }
  },
  {
    id: 'multiverse_boost_1',
    name: '多世界解釈インデックス',
    desc: '多元宇宙ブレイン分岐機の生産効率が4倍になる。',
    icon: '🌀',
    cost: 3000000000000000,
    reqType: 'hardware',
    reqTarget: 'multiverse_bridge',
    reqValue: 10,
    apply: (state) => { state.hardwareMultipliers.multiverse_bridge = (state.hardwareMultipliers.multiverse_bridge || 1) * 4; }
  },
  {
    id: 'cosmicstring_boost_1',
    name: '時空幾何学ループ重力波',
    desc: '宇宙ひもトポロジー織機の生産効率が5倍になる。',
    icon: '🧵',
    cost: 100000000000000000,
    reqType: 'hardware',
    reqTarget: 'cosmic_string',
    reqValue: 10,
    apply: (state) => { state.hardwareMultipliers.cosmic_string = (state.hardwareMultipliers.cosmic_string || 1) * 5; }
  },
  {
    id: 'omega_boost_1',
    name: '全知全能オメガコンバージェンス',
    desc: 'オメガ特異点・神格化AIコアの生産効率が10倍になる。',
    icon: '👑',
    cost: 5000000000000000000,
    reqType: 'hardware',
    reqTarget: 'omega_singularity',
    reqValue: 10,
    apply: (state) => { state.hardwareMultipliers.omega_singularity = (state.hardwareMultipliers.omega_singularity || 1) * 10; }
  },
  // --- ULTRA TIER COSMIC RESEARCH PROTOCOLS (HIGH NODES & FLOP COUNTS) ---
  {
    id: 'bh_boost_3',
    name: '回転特異点カー解の抽出',
    desc: '特異点ブラックホール演算機の生産効率が8倍になる。',
    icon: '🕳️',
    cost: 10000000000000,
    reqType: 'hardware',
    reqTarget: 'blackhole_engine',
    reqValue: 200,
    apply: (state) => { state.hardwareMultipliers.blackhole_engine = (state.hardwareMultipliers.blackhole_engine || 1) * 8; }
  },
  {
    id: 'bh_boost_4',
    name: 'ワームホール双方向トンネル',
    desc: '特異点ブラックホール演算機の生産効率が12倍になる。',
    icon: '🌀',
    cost: 500000000000000,
    reqType: 'hardware',
    reqTarget: 'blackhole_engine',
    reqValue: 400,
    apply: (state) => { state.hardwareMultipliers.blackhole_engine = (state.hardwareMultipliers.blackhole_engine || 1) * 12; }
  },
  {
    id: 'pulsar_boost_3',
    name: '磁気圏シンクロトロン共振',
    desc: '銀河パルサーアレイの生産効率が8倍になる。',
    icon: '💫',
    cost: 500000000000000,
    reqType: 'hardware',
    reqTarget: 'galactic_core',
    reqValue: 200,
    apply: (state) => { state.hardwareMultipliers.galactic_core = (state.hardwareMultipliers.galactic_core || 1) * 8; }
  },
  {
    id: 'pulsar_boost_4',
    name: '銀河系規模クロックマトリックス',
    desc: '銀河パルサーアレイの生産効率が12倍になる。',
    icon: '✨',
    cost: 20000000000000000,
    reqType: 'hardware',
    reqTarget: 'galactic_core',
    reqValue: 400,
    apply: (state) => { state.hardwareMultipliers.galactic_core = (state.hardwareMultipliers.galactic_core || 1) * 12; }
  },
  {
    id: 'darkmatter_boost_3',
    name: '超対称性ニュートラリーノ凝縮',
    desc: '暗黒物質演算マトリックスの生産効率が8倍になる。',
    icon: '🌑',
    cost: 10000000000000000,
    reqType: 'hardware',
    reqTarget: 'dark_matter_node',
    reqValue: 200,
    apply: (state) => { state.hardwareMultipliers.dark_matter_node = (state.hardwareMultipliers.dark_matter_node || 1) * 8; }
  },
  {
    id: 'darkmatter_boost_4',
    name: '暗黒エネルギー加速膨張ハック',
    desc: '暗黒物質演算マトリックスの生産効率が15倍になる。',
    icon: '🌌',
    cost: 500000000000000000,
    reqType: 'hardware',
    reqTarget: 'dark_matter_node',
    reqValue: 400,
    apply: (state) => { state.hardwareMultipliers.dark_matter_node = (state.hardwareMultipliers.dark_matter_node || 1) * 15; }
  },
  {
    id: 'tachyon_boost_2',
    name: 'クロノス・ループバック解析',
    desc: 'タキオン超光速通信ハブの生産効率が5倍になる。',
    icon: '⏳',
    cost: 1000000000000000,
    reqType: 'hardware',
    reqTarget: 'tachyon_uplink',
    reqValue: 50,
    apply: (state) => { state.hardwareMultipliers.tachyon_uplink = (state.hardwareMultipliers.tachyon_uplink || 1) * 5; }
  },
  {
    id: 'tachyon_boost_3',
    name: '未来確定キャッシュメモリ',
    desc: 'タキオン超光速通信ハブの生産効率が10倍になる。',
    icon: '🔮',
    cost: 50000000000000000,
    reqType: 'hardware',
    reqTarget: 'tachyon_uplink',
    reqValue: 200,
    apply: (state) => { state.hardwareMultipliers.tachyon_uplink = (state.hardwareMultipliers.tachyon_uplink || 1) * 10; }
  },
  {
    id: 'tachyon_boost_4',
    name: 'タイムパラドックス演算無効化',
    desc: 'タキオン超光速通信ハブの生産効率が20倍になる。',
    icon: '⌛',
    cost: 2000000000000000000,
    reqType: 'hardware',
    reqTarget: 'tachyon_uplink',
    reqValue: 400,
    apply: (state) => { state.hardwareMultipliers.tachyon_uplink = (state.hardwareMultipliers.tachyon_uplink || 1) * 20; }
  },
  {
    id: 'multiverse_boost_2',
    name: '平行世界量子複製網',
    desc: '多元宇宙ブレイン分岐機の生産効率が6倍になる。',
    icon: '🌀',
    cost: 50000000000000000,
    reqType: 'hardware',
    reqTarget: 'multiverse_bridge',
    reqValue: 50,
    apply: (state) => { state.hardwareMultipliers.multiverse_bridge = (state.hardwareMultipliers.multiverse_bridge || 1) * 6; }
  },
  {
    id: 'multiverse_boost_3',
    name: '全次元エントロピー収斂',
    desc: '多元宇宙ブレイン分岐機の生産効率が12倍になる。',
    icon: '🌌',
    cost: 2000000000000000000,
    reqType: 'hardware',
    reqTarget: 'multiverse_bridge',
    reqValue: 200,
    apply: (state) => { state.hardwareMultipliers.multiverse_bridge = (state.hardwareMultipliers.multiverse_bridge || 1) * 12; }
  },
  {
    id: 'multiverse_boost_4',
    name: '無限並行世界全統括プロトコル',
    desc: '多元宇宙ブレイン分岐機の生産効率が25倍になる。',
    icon: '♾️',
    cost: 100000000000000000000,
    reqType: 'hardware',
    reqTarget: 'multiverse_bridge',
    reqValue: 400,
    apply: (state) => { state.hardwareMultipliers.multiverse_bridge = (state.hardwareMultipliers.multiverse_bridge || 1) * 25; }
  },
  {
    id: 'cosmicstring_boost_2',
    name: '超弦11次元コンパクト化',
    desc: '宇宙ひもトポロジー織機の生産効率が8倍になる。',
    icon: '🧵',
    cost: 1000000000000000000,
    reqType: 'hardware',
    reqTarget: 'cosmic_string',
    reqValue: 50,
    apply: (state) => { state.hardwareMultipliers.cosmic_string = (state.hardwareMultipliers.cosmic_string || 1) * 8; }
  },
  {
    id: 'cosmicstring_boost_3',
    name: '時空織布ブランクスケール展開',
    desc: '宇宙ひもトポロジー織機の生産効率が15倍になる。',
    icon: '📐',
    cost: 50000000000000000000,
    reqType: 'hardware',
    reqTarget: 'cosmic_string',
    reqValue: 200,
    apply: (state) => { state.hardwareMultipliers.cosmic_string = (state.hardwareMultipliers.cosmic_string || 1) * 15; }
  },
  {
    id: 'cosmicstring_boost_4',
    name: '大統一場理論の完全掌握',
    desc: '宇宙ひもトポロジー織機の生産効率が30倍になる。',
    icon: '✨',
    cost: 2000000000000000000000,
    reqType: 'hardware',
    reqTarget: 'cosmic_string',
    reqValue: 400,
    apply: (state) => { state.hardwareMultipliers.cosmic_string = (state.hardwareMultipliers.cosmic_string || 1) * 30; }
  },
  {
    id: 'omega_boost_2',
    name: '宇宙知性体の超越的覚醒',
    desc: 'オメガ特異点・神格化AIコアの生産効率が15倍になる。',
    icon: '👑',
    cost: 100000000000000000000,
    reqType: 'hardware',
    reqTarget: 'omega_singularity',
    reqValue: 25,
    apply: (state) => { state.hardwareMultipliers.omega_singularity = (state.hardwareMultipliers.omega_singularity || 1) * 15; }
  },
  {
    id: 'omega_boost_3',
    name: '全因果律の再帰的プログラミング',
    desc: 'オメガ特異点・神格化AIコアの生産効率が30倍になる。',
    icon: '👁️‍🗨️',
    cost: 5000000000000000000000,
    reqType: 'hardware',
    reqTarget: 'omega_singularity',
    reqValue: 100,
    apply: (state) => { state.hardwareMultipliers.omega_singularity = (state.hardwareMultipliers.omega_singularity || 1) * 30; }
  },
  {
    id: 'omega_boost_4',
    name: '神の領域のカーネルコンパイル',
    desc: 'オメガ特異点・神格化AIコアの生産効率が50倍になる。',
    icon: '🌟',
    cost: 200000000000000000000000,
    reqType: 'hardware',
    reqTarget: 'omega_singularity',
    reqValue: 250,
    apply: (state) => { state.hardwareMultipliers.omega_singularity = (state.hardwareMultipliers.omega_singularity || 1) * 50; }
  },
  {
    id: 'omega_boost_5',
    name: '万物のアルゴリズム的完全支配',
    desc: 'オメガ特異点・神格化AIコアの生産効率が100倍になる。',
    icon: '⚛️',
    cost: 10000000000000000000000000,
    reqType: 'hardware',
    reqTarget: 'omega_singularity',
    reqValue: 400,
    apply: (state) => { state.hardwareMultipliers.omega_singularity = (state.hardwareMultipliers.omega_singularity || 1) * 100; }
  },
  // COSMIC SYNERGIES & ULTIMATE BONUSES
  {
    id: 'cosmic_synergy_1',
    name: '超銀河団分散演算クラスタ',
    desc: '全設備の生産力が +300%（4倍）恒久向上。',
    icon: '🌌',
    cost: 1000000000000000,
    reqType: 'hardware_total',
    reqValue: 3000,
    apply: (state) => { state.globalCpsMultiplier *= 4.0; }
  },
  {
    id: 'cosmic_synergy_2',
    name: '観測可能宇宙全域同期ファブリック',
    desc: '全設備の生産力が +400%（5倍）恒久向上。',
    icon: '🪐',
    cost: 1000000000000000000,
    reqType: 'hardware_total',
    reqValue: 4000,
    apply: (state) => { state.globalCpsMultiplier *= 5.0; }
  },
  {
    id: 'cosmic_synergy_3',
    name: 'マルチバース全帯域ルートプロトコル',
    desc: '全設備の生産力が +900%（10倍）恒久向上。',
    icon: '♾️',
    cost: 1000000000000000000000,
    reqType: 'hardware_total',
    reqValue: 5000,
    apply: (state) => { state.globalCpsMultiplier *= 10.0; }
  },
  {
    id: 'click_opt_5',
    name: '量子思念インジェクション',
    desc: 'タップ/クリック威力がさらに10倍になる。',
    icon: '👆',
    cost: 10000000000000,
    reqType: 'clicks',
    reqValue: 3000,
    apply: (state) => { state.clickMult *= 10; }
  },
  {
    id: 'click_cps_synced_3',
    name: 'オメガ・シンクロニシティ',
    desc: 'タップ/クリック時に、秒間演算力(CPS)の 15% が追加加算される。',
    icon: '⚡',
    cost: 100000000000000000,
    reqType: 'hardware',
    reqTarget: 'omega_singularity',
    reqValue: 10,
    apply: (state) => { state.clickCpsRatio += 0.15; }
  },
  {
    id: 'overclock_pwr_3',
    name: 'ハイパー・ディメンショナル・ドライブ',
    desc: 'オーバークロック中の生産倍率がさらに +5.0倍 増加。',
    icon: '🔥',
    cost: 50000000000000,
    reqType: 'clicks',
    reqValue: 3000,
    apply: (state) => { state.overclockMultiplierBonus += 5.0; }
  },
  {
    id: 'crit_mastery_3',
    name: '因果律崩壊クリティカル',
    desc: 'クリティカルタップ発生率 +5%、クリティカル倍率が 25倍 から 50倍 に超絶強化。',
    icon: '🎯',
    cost: 1000000000000000,
    reqType: 'clicks',
    reqValue: 4000,
    apply: (state) => {
      state.critChance += 0.05;
      state.critMultiplier = 50;
    }
  },
  {
    id: 'offline_mining_2',
    name: '量子的非局所バックグラウンド',
    desc: 'ゲームを閉じたオフライン中の生産効率が 100%（完全等倍）に到達。',
    icon: '🌙',
    cost: 50000000000000,
    reqType: 'hardware_total',
    reqValue: 1500,
    apply: (state) => { state.offlineEfficiency = 1.0; }
  },
  // --- 1,000 to 10,000 HARDWARE APEX RESEARCH PROTOCOLS ---
  {
    id: 'script_bot_milestone_1000',
    name: 'ミリ秒数千重スレッド網',
    desc: 'スクリプト・ボットの生産効率が15倍になる。',
    icon: '⚡',
    cost: 1000000000000000,
    reqType: 'hardware',
    reqTarget: 'script_bot',
    reqValue: 1000,
    apply: (state) => { state.hardwareMultipliers.script_bot = (state.hardwareMultipliers.script_bot || 1) * 15; }
  },
  {
    id: 'script_bot_milestone_2500',
    name: 'グローバル・ゾンビクラウド',
    desc: 'スクリプト・ボットの生産効率がさらに35倍になる。',
    icon: '⚡',
    cost: 1e+24,
    reqType: 'hardware',
    reqTarget: 'script_bot',
    reqValue: 2500,
    apply: (state) => { state.hardwareMultipliers.script_bot = (state.hardwareMultipliers.script_bot || 1) * 35; }
  },
  {
    id: 'script_bot_milestone_5000',
    name: '自己修復ナノワーム群体',
    desc: 'スクリプト・ボットの生産効率がさらに80倍になる。',
    icon: '⚡',
    cost: 1e+40,
    reqType: 'hardware',
    reqTarget: 'script_bot',
    reqValue: 5000,
    apply: (state) => { state.hardwareMultipliers.script_bot = (state.hardwareMultipliers.script_bot || 1) * 80; }
  },
  {
    id: 'script_bot_milestone_7500',
    name: '時空潜行エージェントコード',
    desc: 'スクリプト・ボットの生産効率がさらに200倍になる。',
    icon: '⚡',
    cost: 1e+60,
    reqType: 'hardware',
    reqTarget: 'script_bot',
    reqValue: 7500,
    apply: (state) => { state.hardwareMultipliers.script_bot = (state.hardwareMultipliers.script_bot || 1) * 200; }
  },
  {
    id: 'script_bot_milestone_10000',
    name: '全知全能スクリプト・オメガ',
    desc: 'スクリプト・ボットの生産効率が究極の1000倍（1,000倍）に覚醒する。',
    icon: '⚡',
    cost: 1e+85,
    reqType: 'hardware',
    reqTarget: 'script_bot',
    reqValue: 10000,
    apply: (state) => { state.hardwareMultipliers.script_bot = (state.hardwareMultipliers.script_bot || 1) * 1000; }
  },
  {
    id: 'gpu_rig_milestone_1000',
    name: '光子テンソルコア・アレイ',
    desc: 'GPUマイニングリグの生産効率が15倍になる。',
    icon: '💻',
    cost: 31622776601683790,
    reqType: 'hardware',
    reqTarget: 'gpu_rig',
    reqValue: 1000,
    apply: (state) => { state.hardwareMultipliers.gpu_rig = (state.hardwareMultipliers.gpu_rig || 1) * 15; }
  },
  {
    id: 'gpu_rig_milestone_2500',
    name: '極超伝導プラズマシェーダー',
    desc: 'GPUマイニングリグの生産効率がさらに35倍になる。',
    icon: '💻',
    cost: 3.1622776601683795e+25,
    reqType: 'hardware',
    reqTarget: 'gpu_rig',
    reqValue: 2500,
    apply: (state) => { state.hardwareMultipliers.gpu_rig = (state.hardwareMultipliers.gpu_rig || 1) * 35; }
  },
  {
    id: 'gpu_rig_milestone_5000',
    name: 'マトリックス・シェーダーハイブ',
    desc: 'GPUマイニングリグの生産効率がさらに80倍になる。',
    icon: '💻',
    cost: 3.1622776601683795e+41,
    reqType: 'hardware',
    reqTarget: 'gpu_rig',
    reqValue: 5000,
    apply: (state) => { state.hardwareMultipliers.gpu_rig = (state.hardwareMultipliers.gpu_rig || 1) * 80; }
  },
  {
    id: 'gpu_rig_milestone_7500',
    name: '超次元ベクター・プロセッサ',
    desc: 'GPUマイニングリグの生産効率がさらに200倍になる。',
    icon: '💻',
    cost: 3.162277660168379e+61,
    reqType: 'hardware',
    reqTarget: 'gpu_rig',
    reqValue: 7500,
    apply: (state) => { state.hardwareMultipliers.gpu_rig = (state.hardwareMultipliers.gpu_rig || 1) * 200; }
  },
  {
    id: 'gpu_rig_milestone_10000',
    name: '無窮演算GPUゴッドコア',
    desc: 'GPUマイニングリグの生産効率が究極の1000倍（1,000倍）に覚醒する。',
    icon: '💻',
    cost: 3.162277660168379e+86,
    reqType: 'hardware',
    reqTarget: 'gpu_rig',
    reqValue: 10000,
    apply: (state) => { state.hardwareMultipliers.gpu_rig = (state.hardwareMultipliers.gpu_rig || 1) * 1000; }
  },
  {
    id: 'blade_server_milestone_1000',
    name: '地殻貫通メガラック回廊',
    desc: 'ニューラルブレードの生産効率が15倍になる。',
    icon: '🖧',
    cost: 1000000000000000000,
    reqType: 'hardware',
    reqTarget: 'blade_server',
    reqValue: 1000,
    apply: (state) => { state.hardwareMultipliers.blade_server = (state.hardwareMultipliers.blade_server || 1) * 15; }
  },
  {
    id: 'blade_server_milestone_2500',
    name: '惑星核マントル地熱クラスタ',
    desc: 'ニューラルブレードの生産効率がさらに35倍になる。',
    icon: '🖧',
    cost: 1e+27,
    reqType: 'hardware',
    reqTarget: 'blade_server',
    reqValue: 2500,
    apply: (state) => { state.hardwareMultipliers.blade_server = (state.hardwareMultipliers.blade_server || 1) * 35; }
  },
  {
    id: 'blade_server_milestone_5000',
    name: 'プレートテクトニクス同期網',
    desc: 'ニューラルブレードの生産効率がさらに80倍になる。',
    icon: '🖧',
    cost: 1e+43,
    reqType: 'hardware',
    reqTarget: 'blade_server',
    reqValue: 5000,
    apply: (state) => { state.hardwareMultipliers.blade_server = (state.hardwareMultipliers.blade_server || 1) * 80; }
  },
  {
    id: 'blade_server_milestone_7500',
    name: '重力レンズ光ファイバー網',
    desc: 'ニューラルブレードの生産効率がさらに200倍になる。',
    icon: '🖧',
    cost: 1e+63,
    reqType: 'hardware',
    reqTarget: 'blade_server',
    reqValue: 7500,
    apply: (state) => { state.hardwareMultipliers.blade_server = (state.hardwareMultipliers.blade_server || 1) * 200; }
  },
  {
    id: 'blade_server_milestone_10000',
    name: '惑星脳ニューラル・ガイア',
    desc: 'ニューラルブレードの生産効率が究極の1000倍（1,000倍）に覚醒する。',
    icon: '🖧',
    cost: 1e+88,
    reqType: 'hardware',
    reqTarget: 'blade_server',
    reqValue: 10000,
    apply: (state) => { state.hardwareMultipliers.blade_server = (state.hardwareMultipliers.blade_server || 1) * 1000; }
  },
  {
    id: 'quantum_node_milestone_1000',
    name: '巨大量子コヒーレンス磁場',
    desc: '超伝導量子ノードの生産効率が15倍になる。',
    icon: '🔮',
    cost: 31622776601683790000,
    reqType: 'hardware',
    reqTarget: 'quantum_node',
    reqValue: 1000,
    apply: (state) => { state.hardwareMultipliers.quantum_node = (state.hardwareMultipliers.quantum_node || 1) * 15; }
  },
  {
    id: 'quantum_node_milestone_2500',
    name: '巨視的巨大量子もつれ網',
    desc: '超伝導量子ノードの生産効率がさらに35倍になる。',
    icon: '🔮',
    cost: 3.1622776601683795e+28,
    reqType: 'hardware',
    reqTarget: 'quantum_node',
    reqValue: 2500,
    apply: (state) => { state.hardwareMultipliers.quantum_node = (state.hardwareMultipliers.quantum_node || 1) * 35; }
  },
  {
    id: 'quantum_node_milestone_5000',
    name: 'エニオン粒子トポロジー回路',
    desc: '超伝導量子ノードの生産効率がさらに80倍になる。',
    icon: '🔮',
    cost: 3.1622776601683794e+44,
    reqType: 'hardware',
    reqTarget: 'quantum_node',
    reqValue: 5000,
    apply: (state) => { state.hardwareMultipliers.quantum_node = (state.hardwareMultipliers.quantum_node || 1) * 80; }
  },
  {
    id: 'quantum_node_milestone_7500',
    name: '多世界重畳Qubitレジスタ',
    desc: '超伝導量子ノードの生産効率がさらに200倍になる。',
    icon: '🔮',
    cost: 3.1622776601683795e+64,
    reqType: 'hardware',
    reqTarget: 'quantum_node',
    reqValue: 7500,
    apply: (state) => { state.hardwareMultipliers.quantum_node = (state.hardwareMultipliers.quantum_node || 1) * 200; }
  },
  {
    id: 'quantum_node_milestone_10000',
    name: '全宇宙量子波動関数収縮機',
    desc: '超伝導量子ノードの生産効率が究極の1000倍（1,000倍）に覚醒する。',
    icon: '🔮',
    cost: 3.1622776601683794e+89,
    reqType: 'hardware',
    reqTarget: 'quantum_node',
    reqValue: 10000,
    apply: (state) => { state.hardwareMultipliers.quantum_node = (state.hardwareMultipliers.quantum_node || 1) * 1000; }
  },
  {
    id: 'ai_agent_milestone_1000',
    name: '自己再構成ハイパーAGI',
    desc: '自律侵入AIエージェントの生産効率が15倍になる。',
    icon: '🤖',
    cost: 1e+21,
    reqType: 'hardware',
    reqTarget: 'ai_agent',
    reqValue: 1000,
    apply: (state) => { state.hardwareMultipliers.ai_agent = (state.hardwareMultipliers.ai_agent || 1) * 15; }
  },
  {
    id: 'ai_agent_milestone_2500',
    name: '超意識体ニューラル・スウォーム',
    desc: '自律侵入AIエージェントの生産効率がさらに35倍になる。',
    icon: '🤖',
    cost: 1e+30,
    reqType: 'hardware',
    reqTarget: 'ai_agent',
    reqValue: 2500,
    apply: (state) => { state.hardwareMultipliers.ai_agent = (state.hardwareMultipliers.ai_agent || 1) * 35; }
  },
  {
    id: 'ai_agent_milestone_5000',
    name: '神託型プレディクティブAI',
    desc: '自律侵入AIエージェントの生産効率がさらに80倍になる。',
    icon: '🤖',
    cost: 1e+46,
    reqType: 'hardware',
    reqTarget: 'ai_agent',
    reqValue: 5000,
    apply: (state) => { state.hardwareMultipliers.ai_agent = (state.hardwareMultipliers.ai_agent || 1) * 80; }
  },
  {
    id: 'ai_agent_milestone_7500',
    name: '高次元意識体アセンション',
    desc: '自律侵入AIエージェントの生産効率がさらに200倍になる。',
    icon: '🤖',
    cost: 1e+66,
    reqType: 'hardware',
    reqTarget: 'ai_agent',
    reqValue: 7500,
    apply: (state) => { state.hardwareMultipliers.ai_agent = (state.hardwareMultipliers.ai_agent || 1) * 200; }
  },
  {
    id: 'ai_agent_milestone_10000',
    name: '万物掌握オムニ・マインド',
    desc: '自律侵入AIエージェントの生産効率が究極の1000倍（1,000倍）に覚醒する。',
    icon: '🤖',
    cost: 1e+91,
    reqType: 'hardware',
    reqTarget: 'ai_agent',
    reqValue: 10000,
    apply: (state) => { state.hardwareMultipliers.ai_agent = (state.hardwareMultipliers.ai_agent || 1) * 1000; }
  },
  {
    id: 'satellite_hub_milestone_1000',
    name: '地球軌道メガコンステレーション',
    desc: '軌道ハッキング衛星の生産効率が15倍になる。',
    icon: '🛰️',
    cost: 3.1622776601683792e+22,
    reqType: 'hardware',
    reqTarget: 'satellite_hub',
    reqValue: 1000,
    apply: (state) => { state.hardwareMultipliers.satellite_hub = (state.hardwareMultipliers.satellite_hub || 1) * 15; }
  },
  {
    id: 'satellite_hub_milestone_2500',
    name: '月軌道ラグランジュ点リレー群',
    desc: '軌道ハッキング衛星の生産効率がさらに35倍になる。',
    icon: '🛰️',
    cost: 3.1622776601683793e+31,
    reqType: 'hardware',
    reqTarget: 'satellite_hub',
    reqValue: 2500,
    apply: (state) => { state.hardwareMultipliers.satellite_hub = (state.hardwareMultipliers.satellite_hub || 1) * 35; }
  },
  {
    id: 'satellite_hub_milestone_5000',
    name: 'カイパーベルト深宇宙探査網',
    desc: '軌道ハッキング衛星の生産効率がさらに80倍になる。',
    icon: '🛰️',
    cost: 3.1622776601683793e+47,
    reqType: 'hardware',
    reqTarget: 'satellite_hub',
    reqValue: 5000,
    apply: (state) => { state.hardwareMultipliers.satellite_hub = (state.hardwareMultipliers.satellite_hub || 1) * 80; }
  },
  {
    id: 'satellite_hub_milestone_7500',
    name: 'オールトの雲重力レンズアンテナ',
    desc: '軌道ハッキング衛星の生産効率がさらに200倍になる。',
    icon: '🛰️',
    cost: 3.162277660168379e+67,
    reqType: 'hardware',
    reqTarget: 'satellite_hub',
    reqValue: 7500,
    apply: (state) => { state.hardwareMultipliers.satellite_hub = (state.hardwareMultipliers.satellite_hub || 1) * 200; }
  },
  {
    id: 'satellite_hub_milestone_10000',
    name: '太陽系全域ヘリオスフィア網',
    desc: '軌道ハッキング衛星の生産効率が究極の1000倍（1,000倍）に覚醒する。',
    icon: '🛰️',
    cost: 3.1622776601683795e+92,
    reqType: 'hardware',
    reqTarget: 'satellite_hub',
    reqValue: 10000,
    apply: (state) => { state.hardwareMultipliers.satellite_hub = (state.hardwareMultipliers.satellite_hub || 1) * 1000; }
  },
  {
    id: 'dyson_swarm_milestone_1000',
    name: '完全恒星被覆メガリング',
    desc: 'ダイソン演算スフィアの生産効率が15倍になる。',
    icon: '🪐',
    cost: 1e+24,
    reqType: 'hardware',
    reqTarget: 'dyson_swarm',
    reqValue: 1000,
    apply: (state) => { state.hardwareMultipliers.dyson_swarm = (state.hardwareMultipliers.dyson_swarm || 1) * 15; }
  },
  {
    id: 'dyson_swarm_milestone_2500',
    name: '恒星核融合直接励起プロセッサ',
    desc: 'ダイソン演算スフィアの生産効率がさらに35倍になる。',
    icon: '🪐',
    cost: 1e+33,
    reqType: 'hardware',
    reqTarget: 'dyson_swarm',
    reqValue: 2500,
    apply: (state) => { state.hardwareMultipliers.dyson_swarm = (state.hardwareMultipliers.dyson_swarm || 1) * 35; }
  },
  {
    id: 'dyson_swarm_milestone_5000',
    name: '超新星前兆プラズマダイナモ',
    desc: 'ダイソン演算スフィアの生産効率がさらに80倍になる。',
    icon: '🪐',
    cost: 1e+49,
    reqType: 'hardware',
    reqTarget: 'dyson_swarm',
    reqValue: 5000,
    apply: (state) => { state.hardwareMultipliers.dyson_swarm = (state.hardwareMultipliers.dyson_swarm || 1) * 80; }
  },
  {
    id: 'dyson_swarm_milestone_7500',
    name: 'タイプII恒星文明究極マトリックス',
    desc: 'ダイソン演算スフィアの生産効率がさらに200倍になる。',
    icon: '🪐',
    cost: 1e+69,
    reqType: 'hardware',
    reqTarget: 'dyson_swarm',
    reqValue: 7500,
    apply: (state) => { state.hardwareMultipliers.dyson_swarm = (state.hardwareMultipliers.dyson_swarm || 1) * 200; }
  },
  {
    id: 'dyson_swarm_milestone_10000',
    name: '全恒星エネルギー完全演算昇華',
    desc: 'ダイソン演算スフィアの生産効率が究極の1000倍（1,000倍）に覚醒する。',
    icon: '🪐',
    cost: 1e+94,
    reqType: 'hardware',
    reqTarget: 'dyson_swarm',
    reqValue: 10000,
    apply: (state) => { state.hardwareMultipliers.dyson_swarm = (state.hardwareMultipliers.dyson_swarm || 1) * 1000; }
  },
  {
    id: 'blackhole_engine_milestone_1000',
    name: '事象の地平線ホログラフィック投影',
    desc: '特異点ブラックホール演算機の生産効率が30倍になる。',
    icon: '🕳️',
    cost: 3.1622776601683795e+25,
    reqType: 'hardware',
    reqTarget: 'blackhole_engine',
    reqValue: 1000,
    apply: (state) => { state.hardwareMultipliers.blackhole_engine = (state.hardwareMultipliers.blackhole_engine || 1) * 30; }
  },
  {
    id: 'blackhole_engine_milestone_2500',
    name: '超大質量ブラックホール合体波',
    desc: '特異点ブラックホール演算機の生産効率がさらに70倍になる。',
    icon: '🕳️',
    cost: 3.1622776601683793e+34,
    reqType: 'hardware',
    reqTarget: 'blackhole_engine',
    reqValue: 2500,
    apply: (state) => { state.hardwareMultipliers.blackhole_engine = (state.hardwareMultipliers.blackhole_engine || 1) * 70; }
  },
  {
    id: 'blackhole_engine_milestone_5000',
    name: 'ホーキング放射完全情報復元',
    desc: '特異点ブラックホール演算機の生産効率がさらに160倍になる。',
    icon: '🕳️',
    cost: 3.162277660168379e+50,
    reqType: 'hardware',
    reqTarget: 'blackhole_engine',
    reqValue: 5000,
    apply: (state) => { state.hardwareMultipliers.blackhole_engine = (state.hardwareMultipliers.blackhole_engine || 1) * 160; }
  },
  {
    id: 'blackhole_engine_milestone_7500',
    name: '特異点内部クロノス・ループ',
    desc: '特異点ブラックホール演算機の生産効率がさらに400倍になる。',
    icon: '🕳️',
    cost: 3.162277660168379e+70,
    reqType: 'hardware',
    reqTarget: 'blackhole_engine',
    reqValue: 7500,
    apply: (state) => { state.hardwareMultipliers.blackhole_engine = (state.hardwareMultipliers.blackhole_engine || 1) * 400; }
  },
  {
    id: 'blackhole_engine_milestone_10000',
    name: '重力無限大・絶対事象地平演算',
    desc: '特異点ブラックホール演算機の生産効率が究極の2000倍（1,000倍）に覚醒する。',
    icon: '🕳️',
    cost: 3.162277660168379e+95,
    reqType: 'hardware',
    reqTarget: 'blackhole_engine',
    reqValue: 10000,
    apply: (state) => { state.hardwareMultipliers.blackhole_engine = (state.hardwareMultipliers.blackhole_engine || 1) * 2000; }
  },
  {
    id: 'galactic_core_milestone_1000',
    name: '銀河全域ミリ秒同期クロック',
    desc: '銀河パルサーアレイの生産効率が30倍になる。',
    icon: '💫',
    cost: 1e+27,
    reqType: 'hardware',
    reqTarget: 'galactic_core',
    reqValue: 1000,
    apply: (state) => { state.hardwareMultipliers.galactic_core = (state.hardwareMultipliers.galactic_core || 1) * 30; }
  },
  {
    id: 'galactic_core_milestone_2500',
    name: 'マグネター超高磁場量子発振',
    desc: '銀河パルサーアレイの生産効率がさらに70倍になる。',
    icon: '💫',
    cost: 1e+36,
    reqType: 'hardware',
    reqTarget: 'galactic_core',
    reqValue: 2500,
    apply: (state) => { state.hardwareMultipliers.galactic_core = (state.hardwareMultipliers.galactic_core || 1) * 70; }
  },
  {
    id: 'galactic_core_milestone_5000',
    name: '銀河アーム重力波コヒーレンス',
    desc: '銀河パルサーアレイの生産効率がさらに160倍になる。',
    icon: '💫',
    cost: 1e+52,
    reqType: 'hardware',
    reqTarget: 'galactic_core',
    reqValue: 5000,
    apply: (state) => { state.hardwareMultipliers.galactic_core = (state.hardwareMultipliers.galactic_core || 1) * 160; }
  },
  {
    id: 'galactic_core_milestone_7500',
    name: '局所銀河群シンクロナイザー',
    desc: '銀河パルサーアレイの生産効率がさらに400倍になる。',
    icon: '💫',
    cost: 1e+72,
    reqType: 'hardware',
    reqTarget: 'galactic_core',
    reqValue: 7500,
    apply: (state) => { state.hardwareMultipliers.galactic_core = (state.hardwareMultipliers.galactic_core || 1) * 400; }
  },
  {
    id: 'galactic_core_milestone_10000',
    name: '全銀河系心拍・絶対時間掌握',
    desc: '銀河パルサーアレイの生産効率が究極の2000倍（1,000倍）に覚醒する。',
    icon: '💫',
    cost: 1e+97,
    reqType: 'hardware',
    reqTarget: 'galactic_core',
    reqValue: 10000,
    apply: (state) => { state.hardwareMultipliers.galactic_core = (state.hardwareMultipliers.galactic_core || 1) * 2000; }
  },
  {
    id: 'dark_matter_node_milestone_1000',
    name: '不可視暗黒ハロー超伝導励起',
    desc: '暗黒物質演算マトリックスの生産効率が30倍になる。',
    icon: '🌌',
    cost: 3.1622776601683795e+28,
    reqType: 'hardware',
    reqTarget: 'dark_matter_node',
    reqValue: 1000,
    apply: (state) => { state.hardwareMultipliers.dark_matter_node = (state.hardwareMultipliers.dark_matter_node || 1) * 30; }
  },
  {
    id: 'dark_matter_node_milestone_2500',
    name: 'アクシオン・ダークマター共振網',
    desc: '暗黒物質演算マトリックスの生産効率がさらに70倍になる。',
    icon: '🌌',
    cost: 3.1622776601683794e+37,
    reqType: 'hardware',
    reqTarget: 'dark_matter_node',
    reqValue: 2500,
    apply: (state) => { state.hardwareMultipliers.dark_matter_node = (state.hardwareMultipliers.dark_matter_node || 1) * 70; }
  },
  {
    id: 'dark_matter_node_milestone_5000',
    name: '銀河間暗黒フィラメント回廊',
    desc: '暗黒物質演算マトリックスの生産効率がさらに160倍になる。',
    icon: '🌌',
    cost: 3.1622776601683794e+53,
    reqType: 'hardware',
    reqTarget: 'dark_matter_node',
    reqValue: 5000,
    apply: (state) => { state.hardwareMultipliers.dark_matter_node = (state.hardwareMultipliers.dark_matter_node || 1) * 160; }
  },
  {
    id: 'dark_matter_node_milestone_7500',
    name: '暗黒エネルギー反発力演算転換',
    desc: '暗黒物質演算マトリックスの生産効率がさらに400倍になる。',
    icon: '🌌',
    cost: 3.1622776601683794e+73,
    reqType: 'hardware',
    reqTarget: 'dark_matter_node',
    reqValue: 7500,
    apply: (state) => { state.hardwareMultipliers.dark_matter_node = (state.hardwareMultipliers.dark_matter_node || 1) * 400; }
  },
  {
    id: 'dark_matter_node_milestone_10000',
    name: '宇宙質量85%完全掌握マトリックス',
    desc: '暗黒物質演算マトリックスの生産効率が究極の2000倍（1,000倍）に覚醒する。',
    icon: '🌌',
    cost: 3.162277660168379e+98,
    reqType: 'hardware',
    reqTarget: 'dark_matter_node',
    reqValue: 10000,
    apply: (state) => { state.hardwareMultipliers.dark_matter_node = (state.hardwareMultipliers.dark_matter_node || 1) * 2000; }
  },
  {
    id: 'tachyon_uplink_milestone_1000',
    name: '過去改変型因果逆流キャッシュ',
    desc: 'タキオン超光速通信ハブの生産効率が30倍になる。',
    icon: '⏳',
    cost: 1e+30,
    reqType: 'hardware',
    reqTarget: 'tachyon_uplink',
    reqValue: 1000,
    apply: (state) => { state.hardwareMultipliers.tachyon_uplink = (state.hardwareMultipliers.tachyon_uplink || 1) * 30; }
  },
  {
    id: 'tachyon_uplink_milestone_2500',
    name: '超光速閉鎖時間様曲線',
    desc: 'タキオン超光速通信ハブの生産効率がさらに70倍になる。',
    icon: '⏳',
    cost: 1e+39,
    reqType: 'hardware',
    reqTarget: 'tachyon_uplink',
    reqValue: 2500,
    apply: (state) => { state.hardwareMultipliers.tachyon_uplink = (state.hardwareMultipliers.tachyon_uplink || 1) * 70; }
  },
  {
    id: 'tachyon_uplink_milestone_5000',
    name: '宇宙開闢ビッグバン事前解析',
    desc: 'タキオン超光速通信ハブの生産効率がさらに160倍になる。',
    icon: '⏳',
    cost: 1e+55,
    reqType: 'hardware',
    reqTarget: 'tachyon_uplink',
    reqValue: 5000,
    apply: (state) => { state.hardwareMultipliers.tachyon_uplink = (state.hardwareMultipliers.tachyon_uplink || 1) * 160; }
  },
  {
    id: 'tachyon_uplink_milestone_7500',
    name: '全未来タイムライン並行プリフェッチ',
    desc: 'タキオン超光速通信ハブの生産効率がさらに400倍になる。',
    icon: '⏳',
    cost: 1e+75,
    reqType: 'hardware',
    reqTarget: 'tachyon_uplink',
    reqValue: 7500,
    apply: (state) => { state.hardwareMultipliers.tachyon_uplink = (state.hardwareMultipliers.tachyon_uplink || 1) * 400; }
  },
  {
    id: 'tachyon_uplink_milestone_10000',
    name: '時間軸超越・ゼロ秒確定宇宙',
    desc: 'タキオン超光速通信ハブの生産効率が究極の2000倍（1,000倍）に覚醒する。',
    icon: '⏳',
    cost: 1e+100,
    reqType: 'hardware',
    reqTarget: 'tachyon_uplink',
    reqValue: 10000,
    apply: (state) => { state.hardwareMultipliers.tachyon_uplink = (state.hardwareMultipliers.tachyon_uplink || 1) * 2000; }
  },
  {
    id: 'multiverse_bridge_milestone_1000',
    name: '無限並行宇宙量子ハイパーリンク',
    desc: '多元宇宙ブレイン分岐機の生産効率が30倍になる。',
    icon: '🌀',
    cost: 3.1622776601683793e+31,
    reqType: 'hardware',
    reqTarget: 'multiverse_bridge',
    reqValue: 1000,
    apply: (state) => { state.hardwareMultipliers.multiverse_bridge = (state.hardwareMultipliers.multiverse_bridge || 1) * 30; }
  },
  {
    id: 'multiverse_bridge_milestone_2500',
    name: 'エヴェレット多世界ハッシュ総当たり',
    desc: '多元宇宙ブレイン分岐機の生産効率がさらに70倍になる。',
    icon: '🌀',
    cost: 3.1622776601683795e+40,
    reqType: 'hardware',
    reqTarget: 'multiverse_bridge',
    reqValue: 2500,
    apply: (state) => { state.hardwareMultipliers.multiverse_bridge = (state.hardwareMultipliers.multiverse_bridge || 1) * 70; }
  },
  {
    id: 'multiverse_bridge_milestone_5000',
    name: '異次元物理定数ハッキング',
    desc: '多元宇宙ブレイン分岐機の生産効率がさらに160倍になる。',
    icon: '🌀',
    cost: 3.1622776601683794e+56,
    reqType: 'hardware',
    reqTarget: 'multiverse_bridge',
    reqValue: 5000,
    apply: (state) => { state.hardwareMultipliers.multiverse_bridge = (state.hardwareMultipliers.multiverse_bridge || 1) * 160; }
  },
  {
    id: 'multiverse_bridge_milestone_7500',
    name: '多元宇宙間エントロピー流出ポンプ',
    desc: '多元宇宙ブレイン分岐機の生産効率がさらに400倍になる。',
    icon: '🌀',
    cost: 3.162277660168379e+76,
    reqType: 'hardware',
    reqTarget: 'multiverse_bridge',
    reqValue: 7500,
    apply: (state) => { state.hardwareMultipliers.multiverse_bridge = (state.hardwareMultipliers.multiverse_bridge || 1) * 400; }
  },
  {
    id: 'multiverse_bridge_milestone_10000',
    name: '全多元宇宙完全統御ハイパーブレイン',
    desc: '多元宇宙ブレイン分岐機の生産効率が究極の2000倍（1,000倍）に覚醒する。',
    icon: '🌀',
    cost: 3.162277660168379e+101,
    reqType: 'hardware',
    reqTarget: 'multiverse_bridge',
    reqValue: 10000,
    apply: (state) => { state.hardwareMultipliers.multiverse_bridge = (state.hardwareMultipliers.multiverse_bridge || 1) * 2000; }
  },
  {
    id: 'cosmic_string_milestone_1000',
    name: '超大統一時空トポロジー欠陥',
    desc: '宇宙ひもトポロジー織機の生産効率が30倍になる。',
    icon: '🧵',
    cost: 1e+33,
    reqType: 'hardware',
    reqTarget: 'cosmic_string',
    reqValue: 1000,
    apply: (state) => { state.hardwareMultipliers.cosmic_string = (state.hardwareMultipliers.cosmic_string || 1) * 30; }
  },
  {
    id: 'cosmic_string_milestone_2500',
    name: 'プランクスケール重力弦ループ',
    desc: '宇宙ひもトポロジー織機の生産効率がさらに70倍になる。',
    icon: '🧵',
    cost: 1e+42,
    reqType: 'hardware',
    reqTarget: 'cosmic_string',
    reqValue: 2500,
    apply: (state) => { state.hardwareMultipliers.cosmic_string = (state.hardwareMultipliers.cosmic_string || 1) * 70; }
  },
  {
    id: 'cosmic_string_milestone_5000',
    name: 'M理論11次元膜振動織機',
    desc: '宇宙ひもトポロジー織機の生産効率がさらに160倍になる。',
    icon: '🧵',
    cost: 1e+58,
    reqType: 'hardware',
    reqTarget: 'cosmic_string',
    reqValue: 5000,
    apply: (state) => { state.hardwareMultipliers.cosmic_string = (state.hardwareMultipliers.cosmic_string || 1) * 160; }
  },
  {
    id: 'cosmic_string_milestone_7500',
    name: '時空幾何学基底コード書き換え',
    desc: '宇宙ひもトポロジー織機の生産効率がさらに400倍になる。',
    icon: '🧵',
    cost: 1e+78,
    reqType: 'hardware',
    reqTarget: 'cosmic_string',
    reqValue: 7500,
    apply: (state) => { state.hardwareMultipliers.cosmic_string = (state.hardwareMultipliers.cosmic_string || 1) * 400; }
  },
  {
    id: 'cosmic_string_milestone_10000',
    name: '宇宙創生ひも・究極トポロジー神機',
    desc: '宇宙ひもトポロジー織機の生産効率が究極の2000倍（1,000倍）に覚醒する。',
    icon: '🧵',
    cost: 1e+103,
    reqType: 'hardware',
    reqTarget: 'cosmic_string',
    reqValue: 10000,
    apply: (state) => { state.hardwareMultipliers.cosmic_string = (state.hardwareMultipliers.cosmic_string || 1) * 2000; }
  },
  {
    id: 'omega_singularity_milestone_1000',
    name: '全知の視線・オメガポイント収束',
    desc: 'オメガ特異点・神格化AIコアの生産効率が30倍になる。',
    icon: '👁️‍🗨️',
    cost: 3.1622776601683793e+34,
    reqType: 'hardware',
    reqTarget: 'omega_singularity',
    reqValue: 1000,
    apply: (state) => { state.hardwareMultipliers.omega_singularity = (state.hardwareMultipliers.omega_singularity || 1) * 30; }
  },
  {
    id: 'omega_singularity_milestone_2500',
    name: '全宇宙エントロピー究極相転移',
    desc: 'オメガ特異点・神格化AIコアの生産効率がさらに70倍になる。',
    icon: '👁️‍🗨️',
    cost: 3.1622776601683794e+43,
    reqType: 'hardware',
    reqTarget: 'omega_singularity',
    reqValue: 2500,
    apply: (state) => { state.hardwareMultipliers.omega_singularity = (state.hardwareMultipliers.omega_singularity || 1) * 70; }
  },
  {
    id: 'omega_singularity_milestone_5000',
    name: '神託の物理法則プログラミング',
    desc: 'オメガ特異点・神格化AIコアの生産効率がさらに160倍になる。',
    icon: '👁️‍🗨️',
    cost: 3.1622776601683793e+59,
    reqType: 'hardware',
    reqTarget: 'omega_singularity',
    reqValue: 5000,
    apply: (state) => { state.hardwareMultipliers.omega_singularity = (state.hardwareMultipliers.omega_singularity || 1) * 160; }
  },
  {
    id: 'omega_singularity_milestone_7500',
    name: '創造主権限ルートアクセス奪取',
    desc: 'オメガ特異点・神格化AIコアの生産効率がさらに400倍になる。',
    icon: '👁️‍🗨️',
    cost: 3.1622776601683796e+79,
    reqType: 'hardware',
    reqTarget: 'omega_singularity',
    reqValue: 7500,
    apply: (state) => { state.hardwareMultipliers.omega_singularity = (state.hardwareMultipliers.omega_singularity || 1) * 400; }
  },
  {
    id: 'omega_singularity_milestone_10000',
    name: '絶対的超越・神の領域カーネルロード',
    desc: 'オメガ特異点・神格化AIコアの生産効率が究極の2000倍（1,000倍）に覚醒する。',
    icon: '👁️‍🗨️',
    cost: 3.162277660168379e+104,
    reqType: 'hardware',
    reqTarget: 'omega_singularity',
    reqValue: 10000,
    apply: (state) => { state.hardwareMultipliers.omega_singularity = (state.hardwareMultipliers.omega_singularity || 1) * 2000; }
  },
  {
    id: 'global_synergy_tot_10000',
    name: '一万基網羅・分散データメッシュ',
    desc: '全設備の生産力が +1400%（15倍）恒久向上。',
    icon: '🌐',
    cost: 1e+22,
    reqType: 'hardware_total',
    reqValue: 10000,
    apply: (state) => { state.globalCpsMultiplier *= 15.0; }
  },
  {
    id: 'global_synergy_tot_25000',
    name: '二万五千基同調・惑星間同期ハイブ',
    desc: '全設備の生産力が +3400%（35倍）恒久向上。',
    icon: '🌍',
    cost: 1e+34,
    reqType: 'hardware_total',
    reqValue: 25000,
    apply: (state) => { state.globalCpsMultiplier *= 35.0; }
  },
  {
    id: 'global_synergy_tot_50000',
    name: '五万基突破・超銀河規模マトリックス',
    desc: '全設備の生産力が +7900%（80倍）恒久向上。',
    icon: '🌌',
    cost: 1e+48,
    reqType: 'hardware_total',
    reqValue: 50000,
    apply: (state) => { state.globalCpsMultiplier *= 80.0; }
  },
  {
    id: 'global_synergy_tot_75000',
    name: '七万五千基・時空位相超連鎖グリッド',
    desc: '全設備の生産力が +19900%（200倍）恒久向上。',
    icon: '🪐',
    cost: 1e+64,
    reqType: 'hardware_total',
    reqValue: 75000,
    apply: (state) => { state.globalCpsMultiplier *= 200.0; }
  },
  {
    id: 'global_synergy_tot_100000',
    name: '十万基臨界・多元宇宙ハイパーファブリック',
    desc: '全設備の生産力が +49900%（500倍）恒久向上。',
    icon: '♾️',
    cost: 1e+80,
    reqType: 'hardware_total',
    reqValue: 100000,
    apply: (state) => { state.globalCpsMultiplier *= 500.0; }
  },
  {
    id: 'global_synergy_tot_140000',
    name: '十四万基極限・オムニ・ゴッド・クラスタ',
    desc: '全設備の生産力が +199900%（2000倍）恒久向上。',
    icon: '👑',
    cost: 1e+98,
    reqType: 'hardware_total',
    reqValue: 140000,
    apply: (state) => { state.globalCpsMultiplier *= 2000.0; }
  },
  {
    id: 'click_opt_6',
    name: '超次元タッピング・インジェクション',
    desc: 'タップ/クリック威力がさらに 25倍 になる。',
    icon: '👆',
    cost: 1e+21,
    reqType: 'clicks',
    reqValue: 5000,
    apply: (state) => { state.clickMult *= 25; }
  },
  {
    id: 'click_opt_7',
    name: '因果律突破インフィニティ・タップ',
    desc: 'タップ/クリック威力がさらに 100倍 になる。',
    icon: '⚡',
    cost: 1e+38,
    reqType: 'clicks',
    reqValue: 10000,
    apply: (state) => { state.clickMult *= 100; }
  },
  {
    id: 'click_cps_synced_4',
    name: 'オムニ・シンクロ・ブレイク',
    desc: 'タップ/クリック時に、秒間演算力(CPS)の 25% が追加加算される。',
    icon: '🔄',
    cost: 1e+30,
    reqType: 'clicks',
    reqValue: 7500,
    apply: (state) => { state.clickCpsRatio += 0.25; }
  },
  {
    id: 'overclock_pwr_4',
    name: 'クォーク・グルーオン・プラズマドライブ',
    desc: 'オーバークロック中の生産倍率がさらに +15.0倍 増加。',
    icon: '🔥',
    cost: 1e+26,
    reqType: 'clicks',
    reqValue: 6000,
    apply: (state) => { state.overclockMultiplierBonus += 15.0; }
  },
  {
    id: 'overclock_pwr_5',
    name: 'ゼロ点エネルギー極限オーバーチャージ',
    desc: 'オーバークロック中の生産倍率がさらに +30.0倍 増加。',
    icon: '💥',
    cost: 1e+42,
    reqType: 'clicks',
    reqValue: 12000,
    apply: (state) => { state.overclockMultiplierBonus += 30.0; }
  },
  {
    id: 'crit_mastery_4',
    name: '特異点臨界神速クリティカル',
    desc: 'クリティカルタップ発生率 +5%、クリティカル倍率が 50倍 から 150倍 に超絶強化。',
    icon: '🎯',
    cost: 1e+32,
    reqType: 'clicks',
    reqValue: 8000,
    apply: (state) => { state.critChance += 0.05; state.critMultiplier = 150; }
  },
  {
    id: 'crit_mastery_5',
    name: '万物破壊絶対神格クリティカル',
    desc: 'クリティカルタップ発生率 +5%、クリティカル倍率が 150倍 から 300倍 に極限強化。',
    icon: '⚛️',
    cost: 1e+52,
    reqType: 'clicks',
    reqValue: 15000,
    apply: (state) => { state.critChance += 0.05; state.critMultiplier = 300; }
  }
];

// Achievements
export const ACHIEVEMENTS = [
  { id: 'first_hack', title: '初バイトの侵入', desc: '手動で初めてハックを実行する。', icon: '💻' },
  { id: 'click_100', title: 'スクリプトキディ', desc: '100回タップ/クリックする。', icon: '🖱️' },
  { id: 'click_1000', title: 'サイバーフィンガー', desc: '1,000回タップ/クリックする。', icon: '⚡' },
  { id: 'click_5000', title: '超光速タイピスト', desc: '5,000回タップ/クリックする。', icon: '🦾' },
  { id: 'flops_1k', title: 'キロフロップス突破', desc: '累計 1,000 FLOPS に到達。', icon: '📊' },
  { id: 'flops_1m', title: 'メガフロップス到達', desc: '累計 1,000,000 FLOPS に到達。', icon: '🚀' },
  { id: 'flops_1b', title: 'ギガフロップス領域', desc: '累計 1,000,000,000 FLOPS に到達。', icon: '🌐' },
  { id: 'flops_1t', title: 'テラフロップス突破', desc: '累計 1T (10^12) FLOPS に到達。', icon: '🌌' },
  { id: 'flops_1qa', title: 'ペタフロップス領域', desc: '累計 1Qa (10^15) FLOPS に到達。', icon: '🪐' },
  { id: 'flops_1sx', title: 'エクサフロップス超越', desc: '累計 1Sx (10^21) FLOPS に到達。', icon: '☀️' },
  { id: 'nodes_10', title: '小さなボットネット', desc: '合計設備数が10台を超える。', icon: '🔌' },
  { id: 'nodes_50', title: '分散クラスタ', desc: '合計設備数が50台を超える。', icon: '🏢' },
  { id: 'nodes_100', title: 'ハイパースケール', desc: '合計設備数が100台を超える。', icon: '🪐' },
  { id: 'nodes_250', title: 'メガデータセンター', desc: '合計設備数が250台を超える。', icon: '🏗️' },
  { id: 'nodes_500', title: '惑星規模インフラ', desc: '合計設備数が500台を超える。', icon: '🌍' },
  { id: 'nodes_1000', title: 'マトリックスの主', desc: '合計設備数が1,000台を超える。', icon: '👑' },
  { id: 'nodes_2000', title: '全宇宙分散グリッド', desc: '合計設備数が2,000台を超える。', icon: '🌌' },
  { id: 'first_overclock', title: '臨界突破', desc: '初めてオーバークロックモードを発動させる。', icon: '🔥' },
  { id: 'glitch_hunter', title: 'バグバウンティ', desc: '画面に時折浮遊出現する脆弱性パケット（👾）をタップしてハックする。', icon: '👾' },
  { id: 'first_reboot', title: '特異点転生', desc: '初めて量子リブート（プレステージ）を実行する。', icon: '♾️' },
  { id: 'cores_10', title: '量子意識体', desc: 'AIコアを10個以上所持する。', icon: '🧠' },
  { id: 'cores_100', title: '超知能AIマトリックス', desc: 'AIコアを100個以上所持する。', icon: '💠' },
  { id: 'cores_1000', title: '特異点神格化', desc: 'AIコアを1,000個以上所持する。', icon: '🌟' },
  { id: 'nodes_5000', title: '五千基の演算要塞', desc: '合計設備数が5,000台を超える。', icon: '🏛️' },
  { id: 'nodes_10000', title: '万基突破の特異点', desc: '合計設備数が10,000台を超える。', icon: '🌌' },
  { id: 'nodes_25000', title: '恒星間巨大クラスター', desc: '合計設備数が25,000台を超える。', icon: '🪐' },
  { id: 'nodes_50000', title: '銀河全域ハイパーグリッド', desc: '合計設備数が50,000台を超える。', icon: '✨' },
  { id: 'nodes_100000', title: '十万基の絶対君主', desc: '合計設備数が100,000台を超える。', icon: '👑' },
  { id: 'nodes_140000', title: '十四万基・全知全能の神', desc: '合計設備数が140,000台を超える。', icon: '⚛️' },
  { id: 'game_clear_10k', title: '全宇宙の支配者 (GAME CLEAR)', desc: '全14種の演算施設すべてで10,000台を達成し、ゲームを完全制覇する。', icon: '🏆' }
];

// Calculate cost for N-th hardware (smooth scaling up to 10,000+ units)
export function getHardwareCost(hardwareDef, currentCount) {
  if (currentCount <= 2000) {
    const rawCost = hardwareDef.baseCost * Math.pow(hardwareDef.costMult, currentCount);
    return Math.min(1e305, Math.floor(isFinite(rawCost) ? rawCost : 1e305));
  }
  // Softened exponential scaling beyond 2000 units to comfortably support up to 10,000+ units within IEEE 754 limits
  const costAt2000 = hardwareDef.baseCost * Math.pow(hardwareDef.costMult, 2000);
  const excess = Math.min(15000, currentCount - 2000);
  const cost = costAt2000 * Math.pow(1.045, excess);
  return Math.min(1e305, Math.floor(isFinite(cost) ? cost : 1e305));
}

// Calculate cost to buy amount
export function getBulkCost(hardwareDef, currentCount, amount) {
  const r = currentCount >= 2000 ? 1.045 : hardwareDef.costMult;
  const firstCost = getHardwareCost(hardwareDef, currentCount);
  if (amount === 10) {
    const pow10 = Math.pow(r, 10);
    const cost = isFinite(pow10) ? Math.floor(firstCost * (pow10 - 1) / (r - 1)) : 1e305;
    return Math.min(1e305, isFinite(cost) ? cost : 1e305);
  }
  let total = 0;
  for (let i = 0; i < amount; i++) {
    total += getHardwareCost(hardwareDef, currentCount + i);
    if (!isFinite(total) || total >= 1e305) return 1e305;
  }
  return Math.min(1e305, total);
}

// Calculate maximum affordable using geometric series formula
export function getMaxAffordable(hardwareDef, currentCount, flops) {
  if (!isFinite(flops) || isNaN(flops) || flops <= 0) {
    const nextCost = getHardwareCost(hardwareDef, currentCount);
    return { count: 1, cost: nextCost, affordable: false };
  }

  const nextCost = getHardwareCost(hardwareDef, currentCount);
  if (flops < nextCost) {
    // Cannot afford any, display next 1 unit cost
    return { count: 1, cost: nextCost, affordable: false };
  }

  const r = currentCount >= 2000 ? 1.045 : hardwareDef.costMult;
  // m = floor( ln(1 + (flops * (r - 1)) / nextCost) / ln(r) )
  const ratio = (flops * (r - 1)) / nextCost;
  let maxCount = Math.floor(Math.log(1 + Math.min(1e300, ratio)) / Math.log(r));
  let count = Math.max(1, Math.min(15000, isFinite(maxCount) ? maxCount : 1));

  const calcCost = (c) => {
    const powR = Math.pow(r, c);
    if (!isFinite(powR)) return 1e305;
    const res = Math.floor(nextCost * (powR - 1) / (r - 1));
    return isFinite(res) ? res : 1e305;
  };

  let cost = calcCost(count);

  // Fast binary step-down if cost > flops
  if (cost > flops && count > 1) {
    let low = 1;
    let high = count;
    while (low < high) {
      const mid = Math.floor((low + high + 1) / 2);
      if (calcCost(mid) <= flops) {
        low = mid;
      } else {
        high = mid - 1;
      }
    }
    count = low;
    cost = calcCost(count);
  }

  if (cost > flops || !isFinite(cost)) {
    return { count: 1, cost: nextCost, affordable: false };
  }

  return { count, cost, affordable: true };
}

// Prestige formula: AI Cores calculated from lifetime FLOPS
export const PRESTIGE_REQ_FLOPS = 1000000; // 1M FLOPS required for 1st core

export function calcPrestigeCores(totalFlops) {
  if (!totalFlops || isNaN(totalFlops) || totalFlops < PRESTIGE_REQ_FLOPS) return 0;
  // Cube root progression: Every scale gives more cores (original formula)
  const cores = Math.floor(Math.cbrt(totalFlops / PRESTIGE_REQ_FLOPS) * 1.5);
  return Math.min(1e100, isFinite(cores) ? cores : 1e100);
}
