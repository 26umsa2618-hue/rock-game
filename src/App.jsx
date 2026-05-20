import React, { useEffect, useMemo, useState } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, onValue, ref, set } from "firebase/database";

const SAMPLES = [
  {
    id: "granite",
    name: "화강암",
    icon: "🧱",
    type: "화성암",
    subtype: "심성암",
    clue: "흰색·검은색·분홍색 알갱이가 눈으로 보일 만큼 섞여 있다.",
    observeMode: "igneous",
    grain: "큼",
    color: "밝은색 계열",
    feature: "알갱이가 눈에 잘 보임",
    fact: "마그마가 지하 깊은 곳에서 천천히 식어 만들어진 심성암이다.",
    value: 16,
  },
  {
    id: "basalt",
    name: "현무암",
    icon: "🌋",
    type: "화성암",
    subtype: "화산암",
    clue: "전체적으로 검고, 표면에 작은 구멍이 보이기도 한다.",
    observeMode: "igneous",
    grain: "작음",
    color: "어두운색 계열",
    feature: "구멍이 보일 수 있음",
    fact: "용암이 지표 부근에서 빠르게 식어 만들어진 화산암이다.",
    value: 14,
  },
  {
    id: "conglomerate",
    name: "역암",
    icon: "🪨",
    type: "퇴적암",
    subtype: "쇄설성 퇴적암",
    clue: "둥글고 큰 자갈들이 모여 굳어진 모습이다.",
    observeMode: "sedimentary",
    sedimentFeature: "퇴적물이 쌓여 굳어진 모습",
    feature: "큰 자갈 알갱이가 보임",
    fact: "자갈이 쌓이고 다져지고 굳어져 만들어진 퇴적암이다.",
    value: 15,
  },
  {
    id: "sandstone",
    name: "사암",
    icon: "🏜️",
    type: "퇴적암",
    subtype: "쇄설성 퇴적암",
    clue: "작은 퇴적물이 쌓여 굳어진 것처럼 보이고, 층이 나타날 수 있다.",
    observeMode: "sedimentary",
    sedimentFeature: "퇴적물이 쌓여 굳어진 모습",
    feature: "층리가 나타날 수 있음",
    fact: "모래가 쌓이고 다져지고 굳어져 만들어진 퇴적암이다.",
    value: 13,
  },
  {
    id: "limestone",
    name: "석회암",
    icon: "🐚",
    type: "퇴적암",
    subtype: "생물·화학적 퇴적암",
    clue: "밝은색이며 조개껍데기 같은 흔적이 보일 수 있다. 묽은 염산을 떨어뜨리면 변화가 생긴다.",
    observeMode: "sedimentary",
    sedimentFeature: "화석이나 생물 흔적이 보일 수 있음",
    feature: "묽은 염산에 기포가 생김",
    fact: "탄산 칼슘 성분이 많아 묽은 염산과 반응하여 이산화 탄소 기체가 발생한다.",
    value: 18,
  },
  {
    id: "gneiss",
    name: "편마암",
    icon: "〰️",
    type: "변성암",
    subtype: "엽리 있는 변성암",
    clue: "색이 다른 부분이 길게 이어져 줄무늬처럼 보인다.",
    observeMode: "metamorphic",
    metamorphicFeature: "줄무늬나 엽리가 보임",
    feature: "열과 압력을 받은 흔적이 있음",
    fact: "높은 열과 압력을 받아 광물이 줄무늬 모양으로 배열된 변성암이다.",
    value: 20,
  },
  {
    id: "marble",
    name: "대리암",
    icon: "🏛️",
    type: "변성암",
    subtype: "석회암이 변성",
    clue: "석회암이 열과 압력을 받아 변한 암석이다. 밝고 단단하며 무늬가 부드럽게 이어져 보인다.",
    observeMode: "metamorphic",
    metamorphicFeature: "기존 암석이 변한 모습",
    feature: "석회암이 변성되어 만들어짐",
    fact: "석회암이 변성 작용을 받아 만들어진 변성암이다.",
    value: 19,
  },
];

const ROCK_IMAGES = {
  granite: "https://commons.wikimedia.org/wiki/Special:FilePath/Granite.jpg",
  basalt: "https://commons.wikimedia.org/wiki/Special:FilePath/BasaltUSGOV.jpg",
  sandstone: "https://commons.wikimedia.org/wiki/Special:FilePath/Jacobsville%20Sandstone%20sample.jpg",
  limestone: "https://commons.wikimedia.org/wiki/Special:FilePath/Limestone%20(coquina)%20student%20sample.JPG",
  gneiss: "https://commons.wikimedia.org/wiki/Special:FilePath/Gneiss.jpg",
  marble: "https://commons.wikimedia.org/wiki/Special:FilePath/Carrara%20marble.jpg",
};

const STARTING_LEADERBOARD = [];
const BROWSER_PLAYER_KEY = "rock-game-browser-player-v1";
const GAME_STATE_PREFIX = "rock-game-state-v1:";

const LEVELS = [
  { level: 1, title: "초보 채굴가", minScore: 0, rewardCoins: 0, rewardEnergy: 0, bonus: 0 },
  { level: 2, title: "암석 수집가", minScore: 60, rewardCoins: 20, rewardEnergy: 3, bonus: 2 },
  { level: 3, title: "표본 감정사", minScore: 150, rewardCoins: 35, rewardEnergy: 4, bonus: 4 },
  { level: 4, title: "지질 탐험가", minScore: 280, rewardCoins: 50, rewardEnergy: 5, bonus: 6 },
  { level: 5, title: "암석 박사", minScore: 450, rewardCoins: 80, rewardEnergy: 6, bonus: 9 },
];

const DEFAULT_GAME_STATE = {
  coins: 50,
  energy: 8,
  score: 0,
  level: 1,
  inventory: {},
  book: {},
  verified: {},
};

const firebaseConfig = {
  apiKey: "AIzaSyBR_uqP_bJdTULAkcyQJF4p3ZIkLzY-30",
  authDomain: "rock-game-a09c2.firebaseapp.com",
  databaseURL: "https://rock-game-a09c2-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "rock-game-a09c2",
  storageBucket: "rock-game-a09c2.firebasestorage.app",
  messagingSenderId: "182019123095",
  appId: "1:182019123095:web:cda88c83d5a8464a7acd2",
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);

function safeKey(name) {
  return name.trim().replace(/[.#$\[\]/]/g, "_").slice(0, 30) || "player";
}

function loadBrowserPlayerName() {
  try {
    return window.localStorage.getItem(BROWSER_PLAYER_KEY) || "";
  } catch {
    return "";
  }
}

function loadBrowserGameState(playerName) {
  if (!playerName) return DEFAULT_GAME_STATE;
  try {
    const saved = window.localStorage.getItem(`${GAME_STATE_PREFIX}${safeKey(playerName)}`);
    if (!saved) return DEFAULT_GAME_STATE;
    return { ...DEFAULT_GAME_STATE, ...JSON.parse(saved) };
  } catch {
    return DEFAULT_GAME_STATE;
  }
}

function saveBrowserGameState(playerName, state) {
  if (!playerName) return;
  try {
    window.localStorage.setItem(BROWSER_PLAYER_KEY, playerName);
    window.localStorage.setItem(`${GAME_STATE_PREFIX}${safeKey(playerName)}`, JSON.stringify(state));
  } catch {
    // localStorage may be disabled in some browsers.
  }
}

function makeUniqueName(baseName, entries) {
  const base = baseName.trim();
  const names = new Set(entries.map((entry) => entry.name));
  if (!names.has(base)) return base;

  let serial = 2;
  while (names.has(`${base}_${String(serial).padStart(3, "0")}`)) {
    serial += 1;
  }
  return `${base}_${String(serial).padStart(3, "0")}`;
}

function randomSample() {
  return SAMPLES[Math.floor(Math.random() * SAMPLES.length)];
}

function randomFromIds(ids) {
  const choices = SAMPLES.filter((sample) => ids.includes(sample.id));
  return choices[Math.floor(Math.random() * choices.length)] || randomSample();
}

function sampleFromGeologyZone(xRatio, yRatio) {
  // Educational click zones:
  // top/crater = fast-cooling lava -> basalt
  // bottom/deep magma = slow-cooling magma -> granite
  if (yRatio < 0.5) return randomFromIds(["basalt"]);
  return randomFromIds(["granite"]);
}

function sampleFromPondZone(xRatio, yRatio) {
  // Fish POV sedimentary environment:
  // lower sandy bed = sandstone
  // shell/fossil-rich bed = limestone
  if (xRatio < 0.5) return randomFromIds(["sandstone"]);
  return randomFromIds(["limestone"]);
}

function metamorphicResultFromSource(sourceId) {
  if (sourceId === "granite") return SAMPLES.find((sample) => sample.id === "gneiss");
  if (sourceId === "limestone") return SAMPLES.find((sample) => sample.id === "marble");
  return null;
}

function rankEmoji(rank) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return "🪨";
}

function typeEmoji(type) {
  if (type === "화성암") return "🌋";
  if (type === "퇴적암") return "🌊";
  if (type === "변성암") return "🔥";
  return "🪨";
}

function getLevelInfo(level) {
  return LEVELS.find((item) => item.level === level) || LEVELS[0];
}

function getLevelFromScore(score) {
  let current = LEVELS[0];
  for (const level of LEVELS) {
    if (score >= level.minScore) current = level;
  }
  return current.level;
}

function getNextLevelInfo(level) {
  return LEVELS.find((item) => item.level === level + 1) || null;
}

function getProgressPercent(score, level) {
  const current = getLevelInfo(level);
  const next = getNextLevelInfo(level);
  if (!next) return 100;
  const range = next.minScore - current.minScore;
  const progress = score - current.minScore;
  return Math.max(0, Math.min(100, Math.round((progress / range) * 100)));
}

function AppButton({ children, onClick, disabled, selected, kind = "primary" }) {
  const baseBg = selected
    ? "rgba(17,24,39,0.86)"
    : kind === "secondary"
      ? "rgba(253,230,138,0.72)"
      : "rgba(255,255,255,0.48)";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        border: selected ? "1px solid rgba(255,255,255,0.72)" : "1px solid rgba(255,255,255,0.62)",
        background: baseBg,
        color: selected ? "white" : "#1f2937",
        borderRadius: 16,
        padding: "10px 14px",
        fontWeight: 800,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        boxShadow: selected ? "0 12px 28px rgba(15,23,42,0.22)" : "0 8px 20px rgba(15,23,42,0.08)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
      }}
    >
      {children}
    </button>
  );
}

function Card({ children, style }) {
  return (
    <section
      style={{
        background: "rgba(255,255,255,0.42)",
        borderRadius: 30,
        padding: 22,
        boxShadow: "0 18px 48px rgba(15,23,42,0.12)",
        border: "1px solid rgba(255,255,255,0.62)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        ...style,
      }}
    >
      {children}
    </section>
  );
}

function RockPhoto({ sample, small = false, hidden = false }) {
  if (hidden) {
    return (
      <div
        style={{
          width: small ? 52 : "100%",
          height: small ? 52 : 260,
          borderRadius: small ? 14 : 24,
          background: "#e7e5e4",
          display: "grid",
          placeItems: "center",
          fontSize: small ? 18 : 42,
          color: "#78716c",
          fontWeight: 900,
        }}
      >
        ?
      </div>
    );
  }

  return (
    <div
      style={{
        width: small ? 52 : "100%",
        height: small ? 52 : 260,
        borderRadius: small ? 14 : 24,
        background: "#fff",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid #e7e5e4",
      }}
    >
      <img
        src={ROCK_IMAGES[sample.id]}
        alt={`${sample.name} 암석 사진`}
        style={{
          width: "100%",
          height: "100%",
          objectFit: small ? "cover" : "contain",
          display: "block",
        }}
      />
    </div>
  );
}

export default function App() {
  const initialPlayerName = useMemo(() => loadBrowserPlayerName(), []);
  const initialGameState = useMemo(() => loadBrowserGameState(initialPlayerName), [initialPlayerName]);

  const [playerName, setPlayerName] = useState(initialPlayerName);
  const [nameInput, setNameInput] = useState("");
  const [coins, setCoins] = useState(initialGameState.coins);
  const [energy, setEnergy] = useState(initialGameState.energy);
  const [score, setScore] = useState(initialGameState.score);
  const [level, setLevel] = useState(initialGameState.level);
  const [message, setMessage] = useState("⛏️ 채석장에 오신 것을 환영합니다. 암석 표본을 모아 도감을 완성하세요!");
  const [current, setCurrent] = useState(null);
  const [volcanoPop, setVolcanoPop] = useState(null);
  const [currentSolved, setCurrentSolved] = useState(false);
  const [inventory, setInventory] = useState(initialGameState.inventory || {});
  const [book, setBook] = useState(initialGameState.book || {});
  const [verified, setVerified] = useState(initialGameState.verified || {});
  const [savedLeaderboard, setSavedLeaderboard] = useState(STARTING_LEADERBOARD);
  const [firebaseStatus, setFirebaseStatus] = useState("Firebase 연결 확인 중...");
  const [selectedType, setSelectedType] = useState("");
  const [selectedGrain, setSelectedGrain] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedFeature, setSelectedFeature] = useState("");
  const [selectedSedimentFeature, setSelectedSedimentFeature] = useState("");
  const [selectedMetamorphicFeature, setSelectedMetamorphicFeature] = useState("");

  const collectedCount = useMemo(() => Object.keys(book).length, [book]);
  const levelInfo = useMemo(() => getLevelInfo(level), [level]);
  const nextLevelInfo = useMemo(() => getNextLevelInfo(level), [level]);
  const levelProgress = useMemo(() => getProgressPercent(score, level), [score, level]);

  useEffect(() => {
    if (!playerName) return;
    saveBrowserGameState(playerName, {
      coins,
      energy,
      score,
      level,
      inventory,
      book,
      verified,
    });
  }, [playerName, coins, energy, score, level, inventory, book, verified]);
  useEffect(() => {
    const leaderboardRef = ref(db, "leaderboard");
    const unsubscribe = onValue(
      leaderboardRef,
      (snapshot) => {
        const data = snapshot.val() || {};
        const entries = Object.entries(data)
          .map(([key, entry]) => ({
            key,
            name: entry?.name || key,
            score: Number(entry?.score ?? 0),
            updatedAt: entry?.updatedAt || 0,
          }))
          .filter((entry) => entry.name && Number.isFinite(entry.score))
          .sort((a, b) => b.score - a.score);
        setSavedLeaderboard(entries);
        setFirebaseStatus(`Firebase 연결됨 · ${entries.length}명 등록`);
      },
      (error) => {
        setFirebaseStatus(`Firebase 읽기 오류: ${error.message}`);
        setSavedLeaderboard([]);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!playerName) return;
    const playerKey = safeKey(playerName);
    const oldScore = savedLeaderboard.find((entry) => entry.name === playerName)?.score || 0;
    const bestScore = Math.max(oldScore, score);
    set(ref(db, `leaderboard/${playerKey}`), {
      name: playerName,
      score: bestScore,
      updatedAt: Date.now(),
    });
  }, [playerName, score]);

  const leaderboard = useMemo(() => {
    return savedLeaderboard
      .map((entry) => ({ ...entry, me: entry.name === playerName }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
  }, [savedLeaderboard, playerName]);

  const myBestScore = useMemo(() => {
    return savedLeaderboard.find((entry) => entry.name === playerName)?.score || score;
  }, [savedLeaderboard, playerName, score]);

  function resetChoices() {
    setSelectedType("");
    setSelectedGrain("");
    setSelectedColor("");
    setSelectedFeature("");
    setSelectedSedimentFeature("");
    setSelectedMetamorphicFeature("");
  }

  function startGame() {
    const clean = nameInput.trim();
    if (!clean) return;
    const uniqueName = makeUniqueName(clean, savedLeaderboard);
    setPlayerName(uniqueName);
    saveBrowserGameState(uniqueName, DEFAULT_GAME_STATE);
    if (uniqueName === clean) {
      setMessage(`👋 ${uniqueName}님, 이 브라우저에 계정을 저장했습니다.`);
    } else {
      setMessage(`👋 ${clean} 닉네임이 이미 있어서 ${uniqueName}으로 등록하고 이 브라우저에 저장했습니다.`);
    }
  }

  function changeScore(delta) {
    setScore((s) => Math.max(0, s + delta));
  }

  function applyScoreGain(gain) {
    setScore((oldScore) => {
      const newScore = Math.max(0, oldScore + gain);
      const oldLevel = getLevelFromScore(oldScore);
      const newLevel = getLevelFromScore(newScore);
      if (newLevel > oldLevel) {
        const reached = getLevelInfo(newLevel);
        setLevel(newLevel);
        setCoins((c) => c + reached.rewardCoins);
        setEnergy((e) => e + reached.rewardEnergy);
        setMessage(`🎉 레벨 업! Lv.${newLevel} ${reached.title} 달성! +${reached.rewardCoins}코인, +${reached.rewardEnergy}에너지`);
      }
      return newScore;
    });
  }

  function penalizeWrong(reason) {
    changeScore(-3);
    setCoins((c) => Math.max(0, c - 8));
    setMessage(`❌ ${reason} -3점, -8코인`);
  }

  function skipSample() {
    if (!current) {
      setMessage("⏭️ 넘길 표본이 없습니다. 먼저 채굴해 주세요.");
      return;
    }
    changeScore(-10);
    setMessage(`⏭️ ${current.icon} ${current.name} 표본을 넘겼습니다. -10점`);
    setCurrent(null);
    setCurrentSolved(false);
    resetChoices();
  }

  function mine(sampleOverride = null) {
    if (energy <= 0) {
      setMessage("에너지가 부족합니다. 에너지 충전을 눌러 주세요.");
      return;
    }
    const sample = sampleOverride || randomSample();
    setCurrent(sample);
    setVolcanoPop(sample);
    setCurrentSolved(false);
    setEnergy((e) => e - 1);
    setInventory((prev) => ({ ...prev, [sample.id]: (prev[sample.id] || 0) + 1 }));
    resetChoices();
    setMessage(`🌋 화산에서 ${sample.icon} ${sample.name} 표본이 나왔습니다. 관찰 항목을 고르고 검증하세요.`);
  }

  function mineFromVolcano(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const xRatio = (event.clientX - rect.left) / rect.width;
    const yRatio = (event.clientY - rect.top) / rect.height;
    const sample = sampleFromGeologyZone(xRatio, yRatio);
    mine(sample);
  }

  function mineFromPond(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const xRatio = (event.clientX - rect.left) / rect.width;
    const yRatio = (event.clientY - rect.top) / rect.height;
    const sample = sampleFromPondZone(xRatio, yRatio);
    mine(sample);
  }

  function transformToMetamorphic(sourceId) {
    const source = SAMPLES.find((sample) => sample.id === sourceId);
    const result = metamorphicResultFromSource(sourceId);
    if (!source || !result) return;
    if ((inventory[sourceId] || 0) <= 0) {
      setMessage(`🔥 ${source.name} 표본이 필요합니다. 먼저 채굴해 주세요.`);
      return;
    }
    if (energy <= 0) {
      setMessage("🔥 에너지가 부족합니다. 에너지 충전을 눌러 주세요.");
      return;
    }

    setInventory((prev) => ({
      ...prev,
      [sourceId]: Math.max(0, (prev[sourceId] || 0) - 1),
      [result.id]: (prev[result.id] || 0) + 1,
    }));
    setEnergy((e) => e - 1);
    setCurrent(result);
    setVolcanoPop(result);
    setCurrentSolved(false);
    resetChoices();
    setMessage(`🔥 ${source.icon} ${source.name}에 열과 압력을 가해 ${result.icon} ${result.name} 표본이 만들어졌습니다.`);
  }

  function classify() {
    if (!current) return setMessage("먼저 채굴해서 표본을 찾아야 합니다.");
    if (currentSolved) return setMessage(`✅ ${current.icon} ${current.name} 표본은 이미 검증되었습니다. 새 표본을 채굴하거나 판매하세요.`);

    if (current.observeMode === "igneous") {
      if (!selectedGrain || !selectedColor) return setMessage("화성암은 알갱이 크기와 색깔을 모두 선택하세요.");
      if (selectedGrain !== current.grain || selectedColor !== current.color) return penalizeWrong("관찰 결과가 맞지 않습니다. 알갱이 크기와 색깔을 다시 확인하세요.");
    }

    if (current.observeMode === "sedimentary") {
      if (!selectedSedimentFeature || !selectedFeature) return setMessage("퇴적암은 만들어진 흔적과 특징을 모두 선택하세요.");
      if (selectedSedimentFeature !== current.sedimentFeature || selectedFeature !== current.feature) return penalizeWrong("관찰 결과가 맞지 않습니다. 다시 확인하세요.");
    }

    if (current.observeMode === "metamorphic") {
      if (!selectedMetamorphicFeature || !selectedFeature) return setMessage("변성암은 변한 흔적과 특징을 모두 선택하세요.");
      if (selectedMetamorphicFeature !== current.metamorphicFeature || selectedFeature !== current.feature) return penalizeWrong("관찰 결과가 맞지 않습니다. 다시 확인하세요.");
    }

    if (!selectedType) return setMessage("암석 종류를 선택하세요.");
    if (selectedType !== current.type) return penalizeWrong("암석 종류가 맞지 않습니다.");


    const gain = 12 + levelInfo.bonus;
    applyScoreGain(gain);
    setCoins((c) => c + Math.floor(current.value / 2));
    setBook((b) => ({ ...b, [current.id]: current }));
    setVerified((v) => ({ ...v, [current.id]: true }));
    setCurrentSolved(true);
    setMessage(`✅ 정답! ${current.icon} ${current.name} 표본이 검증되었습니다. +${gain}점`);
  }

  function sellSample(id) {
    const sample = SAMPLES.find((s) => s.id === id);
    if (!sample || !inventory[id]) return;
    if (!verified[id]) return setMessage("아직 검증되지 않은 표본입니다.");
    setInventory((prev) => ({ ...prev, [id]: prev[id] - 1 }));
    setCoins((c) => c + sample.value);
    applyScoreGain(5);
    setMessage(`${sample.name} 검증 표본을 과학관에 판매했습니다. +${sample.value} 코인`);
  }

  function refillEnergy() {
    if (coins < 35) return setMessage("⚡ 에너지 충전에는 35코인이 필요합니다.");
    setCoins((c) => c - 35);
    setEnergy((e) => e + 4);
    setMessage("⚡ 에너지를 4만큼 충전했습니다. -35코인");
  }

  
  function renderObservationChoices() {
    if (!current) return null;

    if (current.observeMode === "igneous") {
      return (
        <>
          <ChoiceGroup title="🔬 1단계: 알갱이 크기" items={["큼", "작음"]} value={selectedGrain} onSelect={setSelectedGrain} />
          <ChoiceGroup title="🎨 2단계: 색깔" items={["밝은색 계열", "어두운색 계열"]} value={selectedColor} onSelect={setSelectedColor} />
        </>
      );
    }

    if (current.observeMode === "sedimentary") {
      return (
        <>
          <ChoiceGroup title="🌊 1단계: 만들어진 흔적" items={["퇴적물이 쌓여 굳어진 모습", "화석이나 생물 흔적이 보일 수 있음"]} value={selectedSedimentFeature} onSelect={setSelectedSedimentFeature} />
          <ChoiceGroup title="🧩 2단계: 퇴적암 특징" items={["층리가 나타날 수 있음", "묽은 염산에 기포가 생김"]} value={selectedFeature} onSelect={setSelectedFeature} />
        </>
      );
    }

    return (
      <>
        <ChoiceGroup title="🔥 1단계: 변한 흔적" items={["줄무늬나 엽리가 보임", "기존 암석이 변한 모습"]} value={selectedMetamorphicFeature} onSelect={setSelectedMetamorphicFeature} />
        <ChoiceGroup title="🧩 2단계: 변성암 특징" items={["열과 압력을 받은 흔적이 있음", "석회암이 변성되어 만들어짐"]} value={selectedFeature} onSelect={setSelectedFeature} />
      </>
    );
  }

  if (!playerName) {
    return (
      <main style={styles.pageCenter}>
        <Card style={{ width: "min(92vw, 430px)" }}>
          <h1 style={styles.title}>🪨 중2 과학 암석 연구소</h1>
          <p style={styles.muted}>처음 한 번만 이름을 입력하면 이 브라우저에서 계속 이어서 플레이합니다.</p>
          <p style={styles.madeBy}>Made by 이나우</p>
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && startGame()}
            placeholder="이름 입력"
            style={styles.input}
          />
          <div style={{ marginTop: 12 }}>
            <AppButton onClick={startGame}>게임 시작</AppButton>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.shell}>
        <header style={styles.hero}>
          <div>
            <h1 style={styles.heroTitle}>🪨 중2 과학 암석 연구소</h1>
            <p style={styles.subtitle}>🧪 관찰하고 · 🧭 분류해서 · ✅ 검증하고 · 💰 코인을 관리하세요</p>
          </div>
          <div style={styles.stats}>
            <Stat label="코인" value={coins} icon="💰" />
            <Stat label="에너지" value={energy} icon="⛏️" />
            <Stat label="점수" value={score} icon="⭐" />
            <Stat label={levelInfo.title} value={`Lv.${level}`} icon="🏆" />
          </div>
        </header>

        <Card>
          <div style={styles.levelPanel}>
            <div>
              <b>🏆 Lv.{level} {levelInfo.title}</b>
              <p style={styles.levelText}>
                {nextLevelInfo
                  ? `다음 레벨: Lv.${nextLevelInfo.level} ${nextLevelInfo.title} · ${nextLevelInfo.minScore - score}점 남음`
                  : "최고 레벨입니다!"}
              </p>
            </div>
            <div style={styles.progressTrack}>
              <div style={{ ...styles.progressFill, width: `${levelProgress}%` }} />
            </div>
            <div style={styles.levelBonus}>정답 보너스 +{levelInfo.bonus}점</div>
          </div>
        </Card>

        <div style={styles.gameGuide}>
          <div style={styles.guideStep}>⛏️ <b>1. 채굴</b><span>암석 표본 찾기</span></div>
          <div style={styles.guideStep}>🔎 <b>2. 관찰</b><span>특징 고르기</span></div>
          <div style={styles.guideStep}>🧭 <b>3. 분류</b><span>암석 종류 맞히기</span></div>
          <div style={styles.guideStep}>✅ <b>4. 검증</b><span>도감 등록</span></div>
          <div style={styles.guideStep}>💰 <b>5. 판매</b><span>점수 올리기</span></div>
        </div>

        <Card>
          <div style={styles.actionRow}>
            <div style={styles.message}>{message}</div>
            <div style={styles.buttonRow}>
              <AppButton onClick={classify} kind="secondary">🧪 검증하기</AppButton>
              <AppButton onClick={refillEnergy}>⚡ 에너지 충전 -35코인</AppButton>
              <AppButton onClick={skipSample}>⏭️ 넘기기 -10점</AppButton>
            </div>
          </div>
        </Card>

        <Card>
          <h2 style={styles.sectionTitle}>🌋 화산 채굴장</h2>
          <div style={styles.volcanoWrap}>
            <button onClick={mineFromVolcano} disabled={energy <= 0} style={styles.volcanoButton} title="지질 단면을 눌러 암석 채굴하기">
              <div style={styles.volcanoSmoke}>☁️ ☁️ ☁️</div>
              <div style={styles.volcanoCrater}>{volcanoPop ? volcanoPop.icon : "✨"}</div>
              <div style={styles.volcanoBody}>🌋</div>
              <div style={styles.zoneTop}>현무암<br />빠르게 식음</div>
              <div style={styles.zoneBottom}>화강암<br />천천히 식음</div>
              <div style={styles.volcanoHint}>{energy > 0 ? "위쪽=현무암 · 아래쪽=화강암" : "에너지 부족"}</div>
            </button>
            <div style={styles.volcanoResult}>
              {volcanoPop ? (
                <>
                  <b>{volcanoPop.icon} 방금 나온 표본: {volcanoPop.name}</b>
                  <span>{typeEmoji(volcanoPop.type)} {volcanoPop.type} · 관찰 후 검증하세요</span>
                </>
              ) : (
                <>
                  <b>아직 나온 표본이 없습니다.</b>
                  <span>위쪽을 누르면 현무암, 아래쪽을 누르면 화강암이 나옵니다.</span>
                </>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <h2 style={styles.sectionTitle}>🐟 연못 퇴적층 · 물고기 시점</h2>
          <div style={styles.pondWrap}>
            <button onClick={mineFromPond} disabled={energy <= 0} style={styles.pondButton} title="연못 바닥 퇴적층을 눌러 암석 채굴하기">
              <div style={styles.pondWater}>🐟  🫧  🐠  🫧</div>
              <div style={styles.pondLayerTop}>물속에서 퇴적물이 가라앉음</div>
              <div style={styles.pondLayerSand}>🏜️ 사암<br />모래가 굳음</div>
              <div style={styles.pondLayerShell}>🐚 석회암<br />조개껍데기/생물 흔적</div>
              <div style={styles.pondHint}>{energy > 0 ? "왼쪽=사암 · 오른쪽=석회암" : "에너지 부족"}</div>
            </button>
            <div style={styles.volcanoResult}>
              <b>퇴적암은 어디서 생길까?</b>
              <span>연못·강·바다 바닥처럼 퇴적물이 쌓이는 곳에서 만들어질 수 있어요.</span>
              <span>왼쪽 모래층을 누르면 사암, 오른쪽 조개층을 누르면 석회암이 나옵니다.</span>
            </div>
          </div>
        </Card>

        <Card>
          <h2 style={styles.sectionTitle}>🔥 변성 작용 실험실</h2>
          <div style={styles.metamorphicWrap}>
            <div style={styles.metamorphicMachine}>
              <div style={styles.pressureTop}>⬇️ 압력</div>
              <div style={styles.heatCore}>🔥 열 + 압력 🔥</div>
              <div style={styles.pressureBottom}>⬆️ 압력</div>
            </div>
            <div style={styles.metamorphicOptions}>
              <button style={styles.metamorphicChoice} onClick={() => transformToMetamorphic("granite")}>
                <b>🧱 화강암 넣기</b>
                <span>→ 〰️ 편마암</span>
                <small>높은 열과 압력으로 줄무늬가 생김</small>
              </button>
              <button style={styles.metamorphicChoice} onClick={() => transformToMetamorphic("limestone")}>
                <b>🐚 석회암 넣기</b>
                <span>→ 🏛️ 대리암</span>
                <small>석회암이 변성 작용을 받아 변함</small>
              </button>
            </div>
          </div>
        </Card>

        <div style={styles.mainGrid}>
          <Card style={{ gridColumn: "span 2" }}>
            <h2 style={styles.sectionTitle}>🔎 암석 감정소 · 현재 표본 관찰</h2>
            {current ? (
              <div style={styles.observeGrid}>
                <div style={styles.samplePanel}>
                  <RockPhoto sample={current} />
                  <h3 style={styles.rockName}>{current.icon} {current.name}</h3>
                  <p style={styles.clue}>📝 겉모습 단서: {current.clue}</p>
                </div>
                <div style={styles.choicePanel}>
                  {renderObservationChoices()}
                  <ChoiceGroup title="🧭 마지막 단계: 암석 종류" items={["화성암", "퇴적암", "변성암"]} value={selectedType} onSelect={setSelectedType} />
                </div>
              </div>
            ) : (
              <div style={styles.empty}>채굴하기를 눌러 첫 암석 표본을 찾아보세요.</div>
            )}
          </Card>

          <Card>
            <h2 style={styles.sectionTitle}>🏅 탐험가 랭킹 · 리더보드</h2>
            <div style={styles.bestScoreBox}>
              <span>🏆 내 최고점</span>
              <b>⭐ {myBestScore}점</b>
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {leaderboard.length === 0 && (
                <div style={styles.emptyRank}>🪨 아직 등록된 점수가 없습니다.</div>
              )}
              {leaderboard.map((entry) => (
                <div key={entry.name} style={{ ...styles.rankRow, background: entry.me ? "rgba(254,243,199,0.68)" : "rgba(255,255,255,0.34)" }}>
                  <span>{rankEmoji(entry.rank)} {entry.rank}위 · {entry.name}{entry.me ? " 👤" : ""}</span>
                  <b>⭐ {entry.score}점</b>
                </div>
              ))}
            </div>
            <p style={styles.leaderboardNote}>{firebaseStatus}</p>
            
          </Card>
        </div>

        <div style={styles.bottomGrid}>
          <Card>
            <h2 style={styles.sectionTitle}>📘 수집 도감 · 암석 도감 {collectedCount}/{SAMPLES.length}</h2>
            <div style={styles.bookGrid}>
              {SAMPLES.map((sample) => {
                const found = Boolean(book[sample.id]);
                return (
                  <div key={sample.id} style={styles.bookCard}>
                    <RockPhoto sample={sample} small hidden={!found} />
                    <div>
                      <b>{found ? `${sample.icon} ${sample.name}` : "❔ 미발견 표본"}</b>
                      <p style={styles.smallText}>{found ? `${sample.type} · ${sample.subtype}` : "관찰하고 분류하면 열립니다."}</p>
                      {found && <p style={styles.fact}>{sample.fact}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <h2 style={styles.sectionTitle}>🎒 내 가방 · 표본 보관함</h2>
            <div style={{ display: "grid", gap: 10 }}>
              {SAMPLES.map((sample) => (
                <div key={sample.id} style={styles.inventoryRow}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <RockPhoto sample={sample} small />
                    <span><b>{sample.icon} {sample.name}</b> × {inventory[sample.id] || 0}</span>
                  </div>
                  <AppButton disabled={!inventory[sample.id] || !verified[sample.id]} onClick={() => sellSample(sample.id)} kind="secondary">
                    {verified[sample.id] ? "💰 판매" : "🔒 검증 필요"}
                  </AppButton>
                </div>
              ))}
            </div>
            <p style={styles.goal}>학습 목표: 화성암은 알갱이 크기와 색깔, 퇴적암은 층리·화석·염산 반응, 변성암은 엽리·줄무늬·변성 작용의 흔적을 바탕으로 분류하기 · 오답은 코인이 줄어듭니다.</p>
          </Card>
        </div>
      </div>
    </main>
  );
}

function ChoiceGroup({ title, items, value, onSelect }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <p style={styles.choiceTitle}>{title}</p>
      <div style={styles.choiceGrid}>
        {items.map((item) => (
          <AppButton key={item} selected={value === item} onClick={() => onSelect(item)}>
            {item}
          </AppButton>
        ))}
      </div>
    </div>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div style={styles.statBox}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <div>
        <div style={styles.statValue}>{value}</div>
        <div style={styles.statLabel}>{label}</div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at 12% 8%, rgba(255,255,255,0.85) 0, rgba(255,255,255,0) 26%), radial-gradient(circle at 88% 12%, rgba(186,230,253,0.72) 0, rgba(186,230,253,0) 28%), radial-gradient(circle at 50% 96%, rgba(254,240,138,0.58) 0, rgba(254,240,138,0) 32%), linear-gradient(135deg, #f8fafc 0%, #e0f2fe 45%, #fef3c7 100%)",
    color: "#1c1917",
    padding: 20,
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  pageCenter: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at 18% 18%, rgba(255,255,255,0.88) 0, rgba(255,255,255,0) 28%), radial-gradient(circle at 82% 22%, rgba(186,230,253,0.78) 0, rgba(186,230,253,0) 30%), linear-gradient(135deg, #f8fafc 0%, #e0f2fe 48%, #fef3c7 100%)",
    display: "grid",
    placeItems: "center",
    color: "#1c1917",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  shell: { maxWidth: 1180, margin: "0 auto", display: "grid", gap: 18 },
  hero: {
    background: "rgba(255,255,255,0.48)",
    borderRadius: 34,
    padding: 28,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 20,
    boxShadow: "0 22px 54px rgba(15,23,42,0.13)",
    border: "1px solid rgba(255,255,255,0.70)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
  },
  gameGuide: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 10,
  },
  guideStep: {
    background: "rgba(255,255,255,0.42)",
    borderRadius: 22,
    padding: "13px 15px",
    display: "grid",
    gap: 4,
    boxShadow: "0 12px 28px rgba(15,23,42,0.10)",
    border: "1px solid rgba(255,255,255,0.64)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
  },
  volcanoWrap: {
    display: "grid",
    gridTemplateColumns: "minmax(240px, 360px) 1fr",
    gap: 18,
    alignItems: "center",
  },
  volcanoButton: {
    minHeight: 260,
    border: "1px solid rgba(255,255,255,0.70)",
    borderRadius: 34,
    background: "linear-gradient(180deg, rgba(255,255,255,0.42), rgba(254,202,202,0.42))",
    cursor: "pointer",
    boxShadow: "0 18px 45px rgba(127,29,29,0.15)",
    display: "grid",
    placeItems: "center",
    position: "relative",
    overflow: "hidden",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
  },
  volcanoSmoke: {
    position: "absolute",
    top: 18,
    opacity: 0.55,
    fontSize: 24,
  },
  volcanoCrater: {
    position: "absolute",
    top: 78,
    width: 72,
    height: 72,
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    background: "rgba(17,24,39,0.78)",
    color: "white",
    fontSize: 32,
    boxShadow: "0 0 32px rgba(249,115,22,0.55)",
    zIndex: 2,
  },
  volcanoBody: {
    fontSize: 132,
    lineHeight: 1,
    transform: "translateY(20px)",
    filter: "drop-shadow(0 18px 16px rgba(120,53,15,0.24))",
  },
  volcanoHint: {
    position: "absolute",
    bottom: 18,
    background: "rgba(255,255,255,0.58)",
    border: "1px solid rgba(255,255,255,0.68)",
    borderRadius: 999,
    padding: "8px 14px",
    fontSize: 13,
    fontWeight: 900,
  },
  zoneTop: {
    position: "absolute",
    top: 18,
    right: 18,
    fontSize: 11,
    fontWeight: 900,
    color: "#7f1d1d",
    background: "rgba(254,226,226,0.66)",
    borderRadius: 14,
    padding: "7px 9px",
    border: "1px solid rgba(255,255,255,0.62)",
  },
  zoneBottom: {
    position: "absolute",
    bottom: 58,
    left: "50%",
    transform: "translateX(-50%)",
    fontSize: 11,
    fontWeight: 900,
    color: "#78350f",
    background: "rgba(254,243,199,0.70)",
    borderRadius: 14,
    padding: "7px 9px",
    border: "1px solid rgba(255,255,255,0.62)",
  },
  volcanoResult: {
    minHeight: 120,
    borderRadius: 26,
    background: "rgba(255,255,255,0.36)",
    border: "1px solid rgba(255,255,255,0.58)",
    padding: 18,
    display: "grid",
    gap: 8,
    alignContent: "center",
    boxShadow: "0 12px 28px rgba(15,23,42,0.08)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
  },
  pondWrap: {
    display: "grid",
    gridTemplateColumns: "minmax(260px, 420px) 1fr",
    gap: 18,
    alignItems: "center",
  },
  pondButton: {
    minHeight: 260,
    border: "1px solid rgba(255,255,255,0.70)",
    borderRadius: 34,
    background: "linear-gradient(180deg, rgba(186,230,253,0.58) 0%, rgba(125,211,252,0.40) 48%, rgba(254,243,199,0.62) 100%)",
    cursor: "pointer",
    boxShadow: "0 18px 45px rgba(14,116,144,0.16)",
    display: "grid",
    placeItems: "center",
    position: "relative",
    overflow: "hidden",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
  },
  pondWater: {
    position: "absolute",
    top: 24,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 28,
    opacity: 0.78,
  },
  pondLayerTop: {
    position: "absolute",
    top: 80,
    left: "50%",
    transform: "translateX(-50%)",
    background: "rgba(255,255,255,0.48)",
    border: "1px solid rgba(255,255,255,0.64)",
    borderRadius: 999,
    padding: "8px 14px",
    fontSize: 12,
    fontWeight: 900,
    color: "#155e75",
  },
  pondLayerSand: {
    position: "absolute",
    left: 22,
    bottom: 58,
    width: "42%",
    minHeight: 76,
    borderRadius: 22,
    display: "grid",
    placeItems: "center",
    textAlign: "center",
    fontSize: 13,
    fontWeight: 900,
    color: "#78350f",
    background: "rgba(254,243,199,0.78)",
    border: "1px solid rgba(255,255,255,0.68)",
  },
  pondLayerShell: {
    position: "absolute",
    right: 22,
    bottom: 58,
    width: "42%",
    minHeight: 76,
    borderRadius: 22,
    display: "grid",
    placeItems: "center",
    textAlign: "center",
    fontSize: 13,
    fontWeight: 900,
    color: "#164e63",
    background: "rgba(207,250,254,0.72)",
    border: "1px solid rgba(255,255,255,0.68)",
  },
  pondHint: {
    position: "absolute",
    bottom: 18,
    background: "rgba(255,255,255,0.58)",
    border: "1px solid rgba(255,255,255,0.68)",
    borderRadius: 999,
    padding: "8px 14px",
    fontSize: 13,
    fontWeight: 900,
  },
  metamorphicWrap: {
    display: "grid",
    gridTemplateColumns: "minmax(240px, 360px) 1fr",
    gap: 18,
    alignItems: "center",
  },
  metamorphicMachine: {
    minHeight: 230,
    borderRadius: 34,
    background: "linear-gradient(180deg, rgba(254,226,226,0.60), rgba(243,232,255,0.58))",
    border: "1px solid rgba(255,255,255,0.70)",
    boxShadow: "0 18px 45px rgba(88,28,135,0.14)",
    position: "relative",
    display: "grid",
    placeItems: "center",
    overflow: "hidden",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
  },
  heatCore: {
    width: 150,
    height: 150,
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    textAlign: "center",
    background: "rgba(127,29,29,0.82)",
    color: "white",
    fontWeight: 900,
    boxShadow: "0 0 38px rgba(239,68,68,0.45)",
  },
  pressureTop: {
    position: "absolute",
    top: 18,
    fontWeight: 900,
    color: "#7f1d1d",
  },
  pressureBottom: {
    position: "absolute",
    bottom: 18,
    fontWeight: 900,
    color: "#581c87",
  },
  metamorphicOptions: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
  },
  metamorphicChoice: {
    minHeight: 120,
    borderRadius: 24,
    border: "1px solid rgba(255,255,255,0.66)",
    background: "rgba(255,255,255,0.42)",
    boxShadow: "0 12px 28px rgba(15,23,42,0.08)",
    padding: 16,
    display: "grid",
    gap: 6,
    textAlign: "left",
    cursor: "pointer",
    color: "#1c1917",
    fontWeight: 800,
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
  },
  heroTitle: { margin: 0, fontSize: "clamp(28px, 4vw, 46px)", letterSpacing: -1.5 },
  title: { margin: 0, fontSize: 32, letterSpacing: -1 },
  subtitle: { margin: "8px 0 0", color: "#78716c", fontWeight: 700 },
  muted: { color: "#78716c" },
  madeBy: {
    margin: "8px 0 14px",
    color: "#1c1917",
    opacity: 0.28,
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: 0.5,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    borderRadius: 16,
    border: "1px solid #d6d3d1",
    padding: "13px 14px",
    fontSize: 16,
    marginTop: 10,
  },
  stats: { display: "grid", gridTemplateColumns: "repeat(2, minmax(120px, 1fr))", gap: 10 },
  statBox: {
    background: "rgba(255,255,255,0.42)",
    borderRadius: 22,
    padding: "12px 14px",
    display: "flex",
    alignItems: "center",
    gap: 10,
    border: "1px solid rgba(255,255,255,0.62)",
    boxShadow: "0 10px 24px rgba(15,23,42,0.09)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
  },
  statValue: { fontSize: 22, fontWeight: 900, lineHeight: 1 },
  statLabel: { color: "#78716c", fontSize: 12, fontWeight: 700 },
  levelPanel: {
    display: "grid",
    gridTemplateColumns: "1.5fr 2fr auto",
    gap: 14,
    alignItems: "center",
  },
  levelText: { margin: "5px 0 0", color: "#78716c", fontSize: 13, fontWeight: 700 },
  progressTrack: {
    height: 16,
    background: "rgba(255,255,255,0.45)",
    borderRadius: 999,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.66)",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, rgba(34,197,94,0.68), rgba(59,130,246,0.72))",
    borderRadius: 999,
    transition: "width 0.35s ease",
  },
  levelBonus: {
    background: "rgba(254,243,199,0.64)",
    borderRadius: 16,
    padding: "10px 12px",
    fontSize: 13,
    fontWeight: 900,
    whiteSpace: "nowrap",
    border: "1px solid rgba(255,255,255,0.62)",
  },
  actionRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap" },
  message: {
    background: "rgba(255,255,255,0.42)",
    borderRadius: 22,
    padding: "14px 17px",
    fontWeight: 800,
    flex: 1,
    minWidth: 260,
    border: "1px solid rgba(255,255,255,0.60)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
  },
  buttonRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  mainGrid: { display: "grid", gridTemplateColumns: "2fr 1fr", gap: 18 },
  bottomGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 },
  observeGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 },
  samplePanel: {
    background: "rgba(255,255,255,0.36)",
    borderRadius: 28,
    padding: 18,
    textAlign: "center",
    border: "1px solid rgba(255,255,255,0.58)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
  },
  choicePanel: {
    background: "rgba(255,255,255,0.32)",
    borderRadius: 28,
    padding: 18,
    border: "1px solid rgba(255,255,255,0.54)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
  },
  sectionTitle: { margin: "0 0 14px", fontSize: 24 },
  rockName: { margin: "14px 0 6px", fontSize: 30 },
  clue: { margin: 0, color: "#57534e", lineHeight: 1.6 },
  empty: {
    background: "rgba(255,255,255,0.36)",
    borderRadius: 26,
    padding: 40,
    textAlign: "center",
    color: "#78716c",
    fontWeight: 800,
    border: "1px solid rgba(255,255,255,0.58)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
  },
  choiceTitle: { margin: "0 0 8px", fontWeight: 900, color: "#44403c" },
  choiceGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8 },
  rankRow: {
    borderRadius: 18,
    padding: "12px 14px",
    display: "flex",
    justifyContent: "space-between",
    gap: 8,
    border: "1px solid rgba(255,255,255,0.58)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
  },
  bestScoreBox: {
    background: "rgba(236,252,203,0.58)",
    borderRadius: 18,
    padding: "14px 16px",
    marginBottom: 12,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontWeight: 900,
  },
  leaderboardNote: { margin: "12px 0 0", color: "#78716c", fontSize: 12, lineHeight: 1.4 },
  emptyRank: {
    background: "rgba(255,255,255,0.36)",
    borderRadius: 18,
    padding: "14px",
    color: "#78716c",
    textAlign: "center",
    fontWeight: 800,
    border: "1px solid rgba(255,255,255,0.58)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blu