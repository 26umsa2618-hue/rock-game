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

function AppButton({ children, onClick, disabled, selected, kind = "primary" }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        border: selected ? "2px solid #111827" : "1px solid #d6d3d1",
        background: selected ? "#111827" : kind === "secondary" ? "#fde68a" : "#ffffff",
        color: selected ? "white" : "#1f2937",
        borderRadius: 14,
        padding: "10px 14px",
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        boxShadow: selected ? "0 6px 14px rgba(0,0,0,0.12)" : "none",
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
        background: "rgba(255,255,255,0.96)",
        borderRadius: 26,
        padding: 20,
        boxShadow: "0 10px 28px rgba(92,64,28,0.10)",
        border: "1px solid rgba(120,113,108,0.12)",
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
  const [playerName, setPlayerName] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [coins, setCoins] = useState(50);
  const [energy, setEnergy] = useState(8);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [message, setMessage] = useState("⛏️ 채석장에 오신 것을 환영합니다. 암석 표본을 모아 도감을 완성하세요!");
  const [current, setCurrent] = useState(null);
  const [inventory, setInventory] = useState({});
  const [book, setBook] = useState({});
  const [verified, setVerified] = useState({});
  const [savedLeaderboard, setSavedLeaderboard] = useState(STARTING_LEADERBOARD);
  const [selectedType, setSelectedType] = useState("");
  const [selectedGrain, setSelectedGrain] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedFeature, setSelectedFeature] = useState("");
  const [selectedSedimentFeature, setSelectedSedimentFeature] = useState("");
  const [selectedMetamorphicFeature, setSelectedMetamorphicFeature] = useState("");

  const collectedCount = useMemo(() => Object.keys(book).length, [book]);
  useEffect(() => {
    const leaderboardRef = ref(db, "leaderboard");
    const unsubscribe = onValue(leaderboardRef, (snapshot) => {
      const data = snapshot.val() || {};
      const entries = Object.values(data)
        .filter((entry) => entry && entry.name && typeof entry.score === "number")
        .sort((a, b) => b.score - a.score);
      setSavedLeaderboard(entries);
    });
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
    if (uniqueName === clean) {
      setMessage(`👋 ${uniqueName}님, 채석장에 오신 것을 환영합니다.`);
    } else {
      setMessage(`👋 ${clean} 닉네임이 이미 있어서 ${uniqueName}으로 등록했습니다.`);
    }
  }

  function changeScore(delta) {
    setScore((s) => Math.max(0, s + delta));
  }

  function penalizeWrong(reason) {
    changeScore(-3);
    setMessage(`❌ ${reason} -3점`);
  }

  function skipSample() {
    if (!current) {
      setMessage("⏭️ 넘길 표본이 없습니다. 먼저 채굴해 주세요.");
      return;
    }
    changeScore(-10);
    setMessage(`⏭️ ${current.icon} ${current.name} 표본을 넘겼습니다. -10점`);
    setCurrent(null);
    resetChoices();
  }

  function mine() {
    if (energy <= 0) {
      setMessage("에너지가 부족합니다. 에너지 충전을 눌러 주세요.");
      return;
    }
    const sample = randomSample();
    setCurrent(sample);
    setEnergy((e) => e - 1);
    setInventory((prev) => ({ ...prev, [sample.id]: (prev[sample.id] || 0) + 1 }));
    resetChoices();
    setMessage(`🔎 새 표본 발견: ${sample.icon} ${sample.name}. 관찰 항목을 고르고 검증하세요.`);
  }

  function classify() {
    if (!current) return setMessage("먼저 채굴해서 표본을 찾아야 합니다.");

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

    const gain = 10 + level * 2;
    changeScore(gain);
    setCoins((c) => c + Math.floor(current.value / 2));
    setBook((b) => ({ ...b, [current.id]: current }));
    setVerified((v) => ({ ...v, [current.id]: true }));
    setMessage(`정답! ${current.name} 표본이 검증되었습니다. 이제 판매할 수 있습니다.`);
    if (score + gain >= level * 50) {
      setLevel((l) => l + 1);
      setEnergy((e) => e + 3);
    }
  }

  function sellSample(id) {
    const sample = SAMPLES.find((s) => s.id === id);
    if (!sample || !inventory[id]) return;
    if (!verified[id]) return setMessage("아직 검증되지 않은 표본입니다.");
    setInventory((prev) => ({ ...prev, [id]: prev[id] - 1 }));
    setCoins((c) => c + sample.value);
    changeScore(5);
    setMessage(`${sample.name} 검증 표본을 과학관에 판매했습니다. +${sample.value} 코인`);
  }

  function refillEnergy() {
    if (coins < 20) return setMessage("에너지 충전에는 20코인이 필요합니다.");
    setCoins((c) => c - 20);
    setEnergy((e) => e + 6);
    setMessage("에너지를 충전했습니다.");
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
          <p style={styles.muted}>리더보드에 표시할 이름을 입력하세요.</p>
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
            <p style={styles.subtitle}>🧪 관찰하고 · 🧭 분류해서 · ✅ 검증하고 · 💰 판매하세요</p>
          </div>
          <div style={styles.stats}>
            <Stat label="코인" value={coins} icon="💰" />
            <Stat label="에너지" value={energy} icon="⛏️" />
            <Stat label="점수" value={score} icon="⭐" />
            <Stat label="레벨" value={level} icon="🏆" />
          </div>
        </header>

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
              <AppButton onClick={mine}>⛏️ 채굴하기</AppButton>
              <AppButton onClick={classify} kind="secondary">🧪 검증하기</AppButton>
              <AppButton onClick={refillEnergy}>에너지 충전</AppButton>
              <AppButton onClick={skipSample}>⏭️ 넘기기 -10점</AppButton>
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
                <div key={entry.name} style={{ ...styles.rankRow, background: entry.me ? "#fef3c7" : "#f5f5f4" }}>
                  <span>{rankEmoji(entry.rank)} {entry.rank}위 · {entry.name}{entry.me ? " 👤" : ""}</span>
                  <b>⭐ {entry.score}점</b>
                </div>
              ))}
            </div>
            <p style={styles.leaderboardNote}>Firebase 공유 리더보드와 연결되어 있습니다.</p>
            
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
            <p style={styles.goal}>학습 목표: 화성암은 알갱이 크기와 색깔, 퇴적암은 층리·화석·염산 반응, 변성암은 엽리·줄무늬·변성 작용의 흔적을 바탕으로 분류하기</p>
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
    background: "linear-gradient(180deg, #fff7d6 0%, #fffbeb 45%, #f5f5f4 100%)",
    color: "#1c1917",
    padding: 20,
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  pageCenter: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #fff7d6 0%, #fffbeb 100%)",
    display: "grid",
    placeItems: "center",
    color: "#1c1917",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  shell: { maxWidth: 1180, margin: "0 auto", display: "grid", gap: 18 },
  hero: {
    background: "#ffffff",
    borderRadius: 28,
    padding: 26,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 20,
    boxShadow: "0 12px 32px rgba(92,64,28,0.10)",
  },
  gameGuide: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 10,
  },
  guideStep: {
    background: "#ffffff",
    borderRadius: 18,
    padding: "12px 14px",
    display: "grid",
    gap: 4,
    boxShadow: "0 8px 20px rgba(92,64,28,0.08)",
    border: "1px solid rgba(120,113,108,0.12)",
  },
  heroTitle: { margin: 0, fontSize: "clamp(28px, 4vw, 46px)", letterSpacing: -1.5 },
  title: { margin: 0, fontSize: 32, letterSpacing: -1 },
  subtitle: { margin: "8px 0 0", color: "#78716c", fontWeight: 700 },
  muted: { color: "#78716c" },
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
  statBox: { background: "#fef3c7", borderRadius: 18, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 },
  statValue: { fontSize: 22, fontWeight: 900, lineHeight: 1 },
  statLabel: { color: "#78716c", fontSize: 12, fontWeight: 700 },
  actionRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap" },
  message: { background: "#f5f5f4", borderRadius: 18, padding: "13px 16px", fontWeight: 700, flex: 1, minWidth: 260 },
  buttonRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  mainGrid: { display: "grid", gridTemplateColumns: "2fr 1fr", gap: 18 },
  bottomGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 },
  observeGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 },
  samplePanel: { background: "#fff7ed", borderRadius: 24, padding: 18, textAlign: "center" },
  choicePanel: { background: "#fafaf9", borderRadius: 24, padding: 18 },
  sectionTitle: { margin: "0 0 14px", fontSize: 24 },
  rockName: { margin: "14px 0 6px", fontSize: 30 },
  clue: { margin: 0, color: "#57534e", lineHeight: 1.6 },
  empty: { background: "#f5f5f4", borderRadius: 22, padding: 40, textAlign: "center", color: "#78716c", fontWeight: 700 },
  choiceTitle: { margin: "0 0 8px", fontWeight: 900, color: "#44403c" },
  choiceGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8 },
  rankRow: { borderRadius: 16, padding: "12px 14px", display: "flex", justifyContent: "space-between", gap: 8 },
  bestScoreBox: {
    background: "#ecfccb",
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
    background: "#f5f5f4",
    borderRadius: 16,
    padding: "14px",
    color: "#78716c",
    textAlign: "center",
    fontWeight: 700,
  },
  bookGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 12 },
  bookCard: { display: "flex", gap: 12, background: "#f5f5f4", borderRadius: 18, padding: 12, alignItems: "flex-start" },
  inventoryRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, background: "#f5f5f4", borderRadius: 18, padding: 12 },
  smallText: { margin: "4px 0 0", color: "#78716c", fontSize: 13 },
  fact: { margin: "6px 0 0", color: "#57534e", fontSize: 12, lineHeight: 1.45 },
  goal: { margin: "14px 0 0", color: "#78716c", fontSize: 13, lineHeight: 1.5 },
};
