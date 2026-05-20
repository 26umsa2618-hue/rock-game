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
  granite: "https://upload.wikimedia.org/wikipedia/commons/f/f7/Granite.jpg",
  basalt: "https://upload.wikimedia.org/wikipedia/commons/a/af/BasaltUSGOV.jpg",
  sandstone: "https://upload.wikimedia.org/wikipedia/commons/8/87/Jacobsville_Sandstone_sample.jpg",
  limestone: "https://upload.wikimedia.org/wikipedia/commons/e/ea/Limestone_%28coquina%29_student_sample.JPG",
  gneiss: "https://upload.wikimedia.org/wikipedia/commons/d/dd/Gneiss.jpg",
  marble: "https://upload.wikimedia.org/wikipedia/commons/5/52/Carrara_marble.jpg",
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

// 💎 스타일 컴포넌트 역할을 하는 공통 버튼 (애니메이션 및 미세한 스케일 피드백 포함)
function AppButton({ children, onClick, disabled, selected, kind = "primary" }) {
  const getStyles = () => {
    if (disabled) return styles.btnDisabled;
    if (selected) return styles.btnSelected;
    if (kind === "secondary") return styles.btnSecondary;
    if (kind === "danger") return styles.btnDanger;
    return styles.btnPrimary;
  };

  return (
    <button onClick={onClick} disabled={disabled} style={{ ...styles.btnBase, ...getStyles() }}>
      {children}
    </button>
  );
}

function Card({ children, style }) {
  return <section style={{ ...styles.card, ...style }}>{children}</section>;
}

function RockPhoto({ sample, small = false, hidden = false }) {
  if (hidden) {
    return (
      <div style={small ? styles.photoSmallHidden : styles.photoLargeHidden}>
        <span style={{ animation: "pulse 1.5s infinite" }}>?</span>
      </div>
    );
  }

  return (
    <div style={small ? styles.photoSmallWrapper : styles.photoLargeWrapper}>
      <img
        src={ROCK_IMAGES[sample.id]}
        alt={`${sample.name} 암석 사진`}
        style={styles.photoImg}
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
  const [currentSolved, setCurrentSolved] = useState(false);
  const [inventory, setInventory] = useState({});
  const [book, setBook] = useState({});
  const [verified, setVerified] = useState({});
  const [savedLeaderboard, setSavedLeaderboard] = useState([]);
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

  function updateFirebaseScore(name, targetScore) {
    if (!name) return;
    const playerKey = safeKey(name);
    const oldScore = savedLeaderboard.find((entry) => entry.name === name)?.score || 0;
    const bestScore = Math.max(oldScore, targetScore);
    
    set(ref(db, `leaderboard/${playerKey}`), {
      name: name,
      score: bestScore,
      updatedAt: Date.now(),
    });
  }

  const leaderboard = useMemo(() => {
    return savedLeaderboard
      .map((entry) => ({ ...entry, me: entry.name === playerName }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
  }, [savedLeaderboard, playerName]);

  const myBestScore = useMemo(() => {
    return Math.max(savedLeaderboard.find((entry) => entry.name === playerName)?.score || 0, score);
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
      setMessage(`👋 ${uniqueName}님, 암석 연구소에 오신 것을 환영합니다!`);
    } else {
      setMessage(`👋 ${clean} 닉네임이 이미 있어 ${uniqueName}으로 배정되었습니다.`);
    }
    updateFirebaseScore(uniqueName, score);
  }

  function penalizeWrong(reason) {
    const nextScore = Math.max(0, score - 3);
    setScore(nextScore);
    setMessage(`❌ ${reason} (-3점)`);
    updateFirebaseScore(playerName, nextScore);
  }

  function skipSample() {
    if (!current) {
      setMessage("⏭️ 넘길 표본이 없습니다. 먼저 채굴을 진행하세요.");
      return;
    }
    const nextScore = Math.max(0, score - 10);
    setScore(nextScore);
    setMessage(`⏭️ ${current.icon} ${current.name} 표본을 폐기하고 넘겼습니다. (-10점)`);
    setCurrent(null);
    setCurrentSolved(false);
    resetChoices();
    updateFirebaseScore(playerName, nextScore);
  }

  function mine() {
    if (energy <= 0) {
      setMessage("🔋 에너지가 방전되었습니다! 배터리를 충전하세요.");
      return;
    }
    const sample = randomSample();
    setCurrent(sample);
    setCurrentSolved(false);
    setEnergy((e) => e - 1);
    setInventory((prev) => ({ ...prev, [sample.id]: (prev[sample.id] || 0) + 1 }));
    resetChoices();
    setMessage(`🔎 [새 표본 발굴] ${sample.icon} ${sample.name} 확보 완료! 현미경 관찰 후 검증 시스템을 가동하세요.`);
  }

  function classify() {
    if (!current) return setMessage("먼저 채굴해서 표본을 분석대에 올려야 합니다.");
    if (currentSolved) return setMessage(`✅ 해당 표본은 검증 완료되었습니다. 보관함을 통해 판매가 가능합니다.`);

    if (current.observeMode === "igneous") {
      if (!selectedGrain || !selectedColor) return setMessage("💡 화성암은 알갱이 크기와 색상을 필수 지정해야 합니다.");
      if (selectedGrain !== current.grain || selectedColor !== current.color) return penalizeWrong("현미경 분석 실패: 입력한 조직 특징이 실물과 일치하지 않습니다.");
    }

    if (current.observeMode === "sedimentary") {
      if (!selectedSedimentFeature || !selectedFeature) return setMessage("💡 퇴적암은 형성 흔적과 구조적 특징을 선택해야 합니다.");
      if (selectedSedimentFeature !== current.sedimentFeature || selectedFeature !== current.feature) return penalizeWrong("현미경 분석 실패: 퇴적 구조 정보가 일치하지 않습니다.");
    }

    if (current.observeMode === "metamorphic") {
      if (!selectedMetamorphicFeature || !selectedFeature) return setMessage("💡 변성암은 변성 구조와 정밀 특징을 선택해야 합니다.");
      if (selectedMetamorphicFeature !== current.metamorphicFeature || selectedFeature !== current.feature) return penalizeWrong("현미경 분석 실패: 열·압력 변성 흔적이 맞지 않습니다.");
    }

    if (!selectedType) return setMessage("💡 최종 암석 계열(종류)을 분류 지정해 주세요.");
    if (selectedType !== current.type) return penalizeWrong("분류 학명 오류: 올바르지 않은 암석 종류입니다.");

    const gain = 10 + level * 2;
    const nextScore = score + gain;
    
    setScore(nextScore);
    setCoins((c) => c + Math.floor(current.value / 2));
    setBook((b) => ({ ...b, [current.id]: current }));
    setVerified((v) => ({ ...v, [current.id]: true }));
    setCurrentSolved(true);
    setMessage(`🎉 구조 분석 대성공! [${current.name}] 표본이 국가 도감에 정식 등록되었습니다!`);
    
    if (nextScore >= level * 50) {
      setLevel((l) => l + 1);
      setEnergy((e) => e + 3);
    }

    updateFirebaseScore(playerName, nextScore);
  }

  function sellSample(id) {
    const sample = SAMPLES.find((s) => s.id === id);
    if (!sample || !inventory[id]) return;
    if (!verified[id]) return setMessage("🔒 미검증 상태의 원석은 유통 및 판매가 불가능합니다.");
    
    const nextScore = score + 5;
    setInventory((prev) => ({ ...prev, [id]: prev[id] - 1 }));
    setCoins((c) => c + sample.value);
    setScore(nextScore);
    setMessage(`💰 [학술 판매] 과학관에 ${sample.name} 학술 표본을 양도하고 💰 ${sample.value} 코인을 획득했습니다.`);

    if (nextScore >= level * 50) {
      setLevel((l) => l + 1);
      setEnergy((e) => e + 3);
    }

    updateFirebaseScore(playerName, nextScore);
  }

  function refillEnergy() {
    if (coins < 20) return setMessage("코인이 부족하여 에너지 배터리를 구매할 수 없습니다.");
    setCoins((c) => c - 20);
    setEnergy((e) => e + 6);
    setMessage("🔋 전력 그리드 가동: 에너지를 6포인트 재충전했습니다.");
  }

  function renderObservationChoices() {
    if (!current) return null;

    if (current.observeMode === "igneous") {
      return (
        <>
          <ChoiceGroup title="🔬 조직 분석: 알갱이 크기" items={["큼", "작음"]} value={selectedGrain} onSelect={setSelectedGrain} />
          <ChoiceGroup title="🎨 분광 분석: 암석의 색조" items={["밝은색 계열", "어두운색 계열"]} value={selectedColor} onSelect={setSelectedColor} />
        </>
      );
    }

    if (current.observeMode === "sedimentary") {
      return (
        <>
          <ChoiceGroup title="🌊 구조 분석: 형성 흔적" items={["퇴적물이 쌓여 굳어진 모습", "화석이나 생물 흔적이 보일 수 있음"]} value={selectedSedimentFeature} onSelect={setSelectedSedimentFeature} />
          <ChoiceGroup title="🧩 반응 테스트: 물리적 특징" items={["층리가 나타날 수 있음", "묽은 염산에 기포가 생김"]} value={selectedFeature} onSelect={setSelectedFeature} />
        </>
      );
    }

    return (
      <>
        <ChoiceGroup title="🔥 결정 분석: 변성 흔적" items={["줄무늬나 엽리가 보임", "기존 암석이 변한 모습"]} value={selectedMetamorphicFeature} onSelect={setSelectedMetamorphicFeature} />
        <ChoiceGroup title="🧩 스트레스 테스트: 변성 특징" items={["열과 압력을 받은 흔적이 있음", "석회암이 변성되어 만들어짐"]} value={selectedFeature} onSelect={setSelectedFeature} />
      </>
    );
  }

  // 🚪 로그인 게이트웨이 화면 UI 개선
  if (!playerName) {
    return (
      <main style={styles.pageCenter}>
        <div style={styles.loginCard}>
          <div style={styles.loginHeader}>
            <span style={{ fontSize: 48 }}>🔬</span>
            <h1 style={styles.loginTitle}>지질학 연구소</h1>
            <p style={styles.loginSubtitle}>중2 과학 암석 분류 아카이브 가동</p>
          </div>
          <div style={{ width: "100%" }}>
            <label style={styles.fieldLabel}>연구원 코드 (닉네임)</label>
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && startGame()}
              placeholder="호칭 또는 이름 입력"
              style={styles.input}
            />
          </div>
          <button onClick={startGame} style={styles.loginButton}>
            연구실 입장하기 🚀
          </button>
        </div>
      </main>
    );
  }

  // 🛰️ 메인 대시보드 화면 UI 개선
  return (
    <main style={styles.page}>
      <div style={styles.shell}>
        
        {/* 상단 통합 스태터스 바 */}
        <header style={styles.hero}>
          <div style={styles.heroTextSection}>
            <h1 style={styles.heroTitle}>🔬 암석 정밀 연구소</h1>
            <p style={styles.subtitle}>관찰 · 분류 · 데이터 검증 자동화 시스템</p>
          </div>
          <div style={styles.statsGrid}>
            <Stat label="연구 자금" value={`${coins} 🪙`} icon="💰" color="#d97706" />
            <Stat label="작업 에너지" value={`${energy} / 8`} icon="⚡" color="#059669" />
            <Stat label="누적 점수" value={`${score} p`} icon="⭐" color="#4f46e5" />
            <Stat label="연구원 레벨" value={`Lv.${level}`} icon="🏆" color="#7c3aed" />
          </div>
        </header>

        {/* 퀘스트 가이드 라인 */}
        <div style={styles.gameGuide}>
          <div style={styles.guideStep}><span style={styles.stepBadge}>1</span> <b>시편 발굴</b><span>암석 샘플 무작위 추출</span></div>
          <div style={styles.guideStep}><span style={styles.stepBadge}>2</span> <b>정밀 관찰</b><span>현미경 미세 구조 판단</span></div>
          <div style={styles.guideStep}><span style={styles.stepBadge}>3</span> <b>계통 분류</b><span>3대 암석군 귀속 설정</span></div>
          <div style={styles.guideStep}><span style={styles.stepBadge}>4</span> <b>시스템 검증</b><span>국제 표준 데이터 대조</span></div>
          <div style={styles.guideStep}><span style={styles.stepBadge}>5</span> <b>학술 공헌</b><span>박물관 양도 및 예산 확보</span></div>
        </div>

        {/* 중앙 관제 센터 콘솔 */}
        <Card style={styles.consoleCard}>
          <div style={styles.actionRow}>
            <div style={styles.messageBox}>
              <span style={{ marginRight: 8 }}>🛰️ LOG:</span>
              <span style={styles.messageText}>{message}</span>
            </div>
            <div style={styles.buttonRow}>
              <AppButton onClick={mine}>⛏️ 신규 표본 채굴</AppButton>
              <AppButton onClick={classify} kind="secondary">🧪 시스템 데이터 검증</AppButton>
              <AppButton onClick={refillEnergy}>🔋 에너지 셀 구매 (-20🪙)</AppButton>
              <AppButton onClick={skipSample} kind="danger">⏭️ 표본 폐기 (-10p)</AppButton>
            </div>
          </div>
        </Card>

        {/* 메인 분석 스페이스 격자 */}
        <div style={styles.mainGrid}>
          {/* 왼쪽 암석 감정 섹션 */}
          <Card style={styles.observeContainer}>
            <div style={styles.panelHeader}>
              <div style={styles.panelTitleDot}></div>
              <h2 style={styles.sectionTitle}>🔎 실시간 시편 미세 구조 분석대</h2>
            </div>
            
            {current ? (
              <div style={styles.observeGrid}>
                <div style={styles.samplePanel}>
                  <RockPhoto sample={current} />
                  <div style={styles.rockIdentityBadge}>
                    <span style={{ fontSize: 24 }}>{current.icon}</span>
                    <h3 style={styles.rockName}>{current.name}</h3>
                  </div>
                  <div style={styles.clueContainer}>
                    <strong>📝 필드 감정 단서:</strong>
                    <p style={styles.clue}>{current.clue}</p>
                  </div>
                  <div style={styles.priceTag}>
                    학술 표준 평가 가치: <span>🪙 {current.value}</span>
                  </div>
                </div>
                
                <div style={styles.choicePanel}>
                  <div style={styles.choicePanelTitle}>📊 성분 변수 테이블 세팅</div>
                  {renderObservationChoices()}
                  <div style={{ borderTop: "2px dashed #e5e7eb", marginTop: 20, paddingTop: 16 }}>
                    <ChoiceGroup title="🧭 계통학적 최종 분류군 설정" items={["화성암", "퇴적암", "변성암"]} value={selectedType} onSelect={setSelectedType} />
                  </div>
                </div>
              </div>
            ) : (
              <div style={styles.empty}>
                <span style={{ fontSize: 48, display: "block", marginBottom: 12 }}>📡</span>
                정밀 검사 장비 대기 중. 상단의 <b>[신규 표본 채굴]</b> 엔진을 기동하세요.
              </div>
            )}
          </Card>

          {/* 오른쪽 리더보드 랭킹 섹션 */}
          <Card style={styles.sidebarCard}>
            <div style={styles.panelHeader}>
              <div style={{ ...styles.panelTitleDot, backgroundColor: "#7c3aed" }}></div>
              <h2 style={styles.sectionTitle}>🏅 실시간 싱크 리더보드</h2>
            </div>
            <div style={styles.bestScoreBox}>
              <span>🏆 개인 최고 성적 기록</span>
              <b>{myBestScore} p</b>
            </div>
            <div style={styles.rankList}>
              {leaderboard.length === 0 && (
                <div style={styles.emptyRank}>🪨 원격 서버 데이터 동기화 중...</div>
              )}
              {leaderboard.map((entry) => (
                <div key={entry.name} style={{ ...styles.rankRow, ...(entry.me ? styles.rankRowMe : {}) }}>
                  <div style={styles.rankUserGroup}>
                    <span style={styles.rankIconBox}>{rankEmoji(entry.rank)}</span>
                    <span style={{ fontWeight: entry.me ? 900 : 500 }}>
                      {entry.rank}위 · {entry.name} {entry.me ? " 👤(나)" : ""}
                    </span>
                  </div>
                  <b style={styles.rankScoreText}>{entry.score} p</b>
                </div>
              ))}
            </div>
            <p style={styles.leaderboardNote}>※ 본 연동 스코어보드는 실시간 Firebase 클라우드 인프라와 양방향 통신 중입니다.</p>
          </Card>
        </div>

        {/* 하단 인벤토리 및 도감 격자 */}
        <div style={styles.bottomGrid}>
          {/* 도감 섹션 */}
          <Card>
            <div style={styles.panelHeader}>
              <div style={{ ...styles.panelTitleDot, backgroundColor: "#2563eb" }}></div>
              <h2 style={styles.sectionTitle}>📘 글로벌 지질학 도감 고도화 ({collectedCount} / {SAMPLES.length})</h2>
            </div>
            <div style={styles.bookGrid}>
              {SAMPLES.map((sample) => {
                const found = Boolean(book[sample.id]);
                return (
                  <div key={sample.id} style={found ? styles.bookCardFound : styles.bookCardMissing}>
                    <RockPhoto sample={sample} small hidden={!found} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={styles.bookCardTitle}>
                        {found ? `${sample.icon} ${sample.name}` : "정밀 분석 미수행 표본"}
                      </div>
                      <p style={styles.smallText}>
                        {found ? `${sample.type} ➔ ${sample.subtype}` : "도감 메타데이터 락 상태"}
                      </p>
                      {found && <p style={styles.factText}>{sample.fact}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* 인벤토리 섹션 */}
          <Card style={styles.sidebarCard}>
            <div style={styles.panelHeader}>
              <div style={{ ...styles.panelTitleDot, backgroundColor: "#db2777" }}></div>
              <h2 style={styles.sectionTitle}>🎒 임시 물질 보관함 (표본고)</h2>
            </div>
            <div style={styles.inventoryList}>
              {SAMPLES.map((sample) => {
                const count = inventory[sample.id] || 0;
                const isVerified = verified[sample.id];
                return (
                  <div key={sample.id} style={styles.inventoryRow}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <RockPhoto sample={sample} small />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{sample.icon} {sample.name}</div>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>보유 수량: <span style={{ color: count ? "#111827" : "#9ca3af", fontWeight: "bold" }}>{count}개</span></div>
                      </div>
                    </div>
                    <AppButton
                      disabled={!count || !isVerified}
                      onClick={() => sellSample(sample.id)}
                      kind="secondary"
                    >
                      {isVerified ? `💰 학술 처분 (+${sample.value})` : "🔒 잠금(검증전)"}
                    </AppButton>
                  </div>
                );
              })}
            </div>
            <div style={styles.curriculumGoal}>
              🎓 <strong>중2 교육과정 성취 기준:</strong> 암석의 성인(화성암, 퇴적암, 변성암)에 따른 핵심 분류 기준인 조직 입자 크기, 색상 광물 배색, 층리 및 화석 존재 유무, 엽리 줄무늬 구조, 염산 기포 반응성 요소를 복합 대조하여 암석을 명확하게 동정할 수 있어야 합니다.
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}

// 🎛️ 정밀 가감 선택지 그룹 컴포넌트 내부 UI 고도화
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

// 📈 상단 전광판 위젯 컴포넌트 스타일 강화
function Stat({ icon, label, value, color }) {
  return (
    <div style={styles.statBox}>
      <div style={{ ...styles.statIconCircle, backgroundColor: `${color}15`, color: color }}>
        {icon}
      </div>
      <div>
        <div style={styles.statLabel}>{label}</div>
        <div style={{ ...styles.statValue, color: "#111827" }}>{value}</div>
      </div>
    </div>
  );
}

// 🎨 고급 테크니컬 GUI 전체 스타일 시트 정의
const styles = {
  // 베이스 셸 레이아웃
  page: {
    minHeight: "100vh",
    backgroundColor: "#f8fafc",
    backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
    backgroundSize: "24px 24px",
    color: "#0f172a",
    padding: "clamp(12px, 3vw, 24px)",
    fontFamily: "'Pretendard', system-ui, -apple-system, sans-serif",
    WebkitFontSmoothing: "antialiased",
  },
  pageCenter: {
    minHeight: "100vh",
    backgroundColor: "#0f172a",
    backgroundImage: "linear-gradient(to bottom right, #0f172a, #1e293b)",
    display: "grid",
    placeItems: "center",
    padding: 20,
    fontFamily: "'Pretendard', system-ui, -apple-system, sans-serif",
  },
  shell: { maxWidth: 1240, margin: "0 auto", display: "grid", gap: 20 },
  
  // 로그인 카드 진입 컴포넌트
  loginCard: {
    background: "rgba(30, 41, 59, 0.7)",
    backdropFilter: "blur(16px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: 32,
    padding: "40px 32px",
    width: "100%",
    maxWidth: 440,
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 24,
  },
  loginHeader: { textAlign: "center" },
  loginTitle: { margin: "12px 0 4px", fontSize: 32, fontWeight: 800, color: "#ffffff", letterSpacing: "-1px" },
  loginSubtitle: { margin: 0, color: "#94a3b8", fontSize: 14, fontWeight: 500 },
  fieldLabel: { display: "block", color: "#cbd5e1", fontSize: 13, fontWeight: 600, marginBottom: 8, paddingLeft: 4 },
  input: {
    width: "100%",
    boxSizing: "border-box",
    borderRadius: 16,
    border: "2px solid #334155",
    backgroundColor: "#0f172a",
    padding: "14px 16px",
    fontSize: 16,
    color: "#ffffff",
    outline: "none",
    transition: "all 0.2s ease",
  },
  loginButton: {
    width: "100%",
    border: "none",
    borderRadius: 16,
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    padding: "16px",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.4)",
    transition: "transform 0.1s ease",
  },

  // 메인 상단 헤더 폰트 및 정보 보드
  hero: {
    background: "#ffffff",
    borderRadius: 24,
    padding: 24,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 24,
    flexWrap: "wrap",
    boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.05)",
    border: "1px solid #e2e8f0",
  },
  heroTextSection: { minWidth: 280 },
  heroTitle: { margin: 0, fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 900, color: "#0f172a", letterSpacing: "-1.5px" },
  subtitle: { margin: "6px 0 0", color: "#64748b", fontWeight: 600, fontSize: 14 },
  
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(2, minmax(140px, 1fr))", gap: 12, flex: "1 1 auto", maxWidth: 600 },
  statBox: { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 18, padding: "12px 16px", display: "flex", alignItems: "center", gap: 14 },
  statIconCircle: { width: 44, height: 44, borderRadius: 12, display: "grid", placeItems: "center", fontSize: 20, fontWeight: "bold" },
  statValue: { fontSize: 18, fontWeight: 800, lineHeight: 1.2 },
  statLabel: { color: "#64748b", fontSize: 11, fontWeight: 700, marginBottom: 2 },

  // 상단 공정 가이드맵 라인
  gameGuide: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 },
  guideStep: {
    background: "#ffffff",
    borderRadius: 16,
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: 4,
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.03)",
    border: "1px solid #e2e8f0",
    fontSize: 13,
  },
  stepBadge: { width: 20, height: 20, borderRadius: "50%", backgroundColor: "#0f172a", color: "#ffffff", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 800 },

  // 실시간 커맨드 패널 콘솔
  consoleCard: { background: "#0f172a", border: "none", color: "#ffffff", borderRadius: 24, padding: 20, boxShadow: "0 20px 25px -5px rgba(15, 23, 42, 0.2)" },
  actionRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" },
  messageBox: { background: "#1e293b", borderRadius: 14, padding: "14px 18px", flex: 1, minWidth: 280, display: "flex", alignItems: "flex-start", borderLeft: "4px solid #3b82f6" },
  messageText: { fontWeight: 600, color: "#e2e8f0", fontSize: 14, lineHeight: 1.5 },
  buttonRow: { display: "flex", gap: 8, flexWrap: "wrap" },

  // 글로벌 공통 입체 카드 객체
  card: { background: "#ffffff", borderRadius: 24, padding: 24, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.04)", border: "1px solid #e2e8f0" },
  panelHeader: { display: "flex", alignItems: "center", gap: 10, marginBottom: 18 },
  panelTitleDot: { width: 8, height: 16, borderRadius: 4, backgroundColor: "#3b82f6" },
  sectionTitle: { margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a" },

  // 격자 스페이스 배치 엔진
  mainGrid: { display: "grid", gridTemplateColumns: "2.3fr 1fr", gap: 20, alignItems: "start" },
  observeContainer: { minWidth: 0 },
  sidebarCard: { backgroundColor: "#ffffff" },
  bottomGrid: { display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20, alignItems: "start" },
  observeGrid: { display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 24 },

  // 정밀 감정대 내부 비주얼 플레이트
  samplePanel: { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 20, padding: 20, textAlign: "center", display: "flex", flexDirection: "column", gap: 12 },
  rockIdentityBadge: { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10, alignSelf: "center", background: "#ffffff", border: "1px solid #e2e8f0", padding: "6px 20px", borderRadius: 30, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" },
  rockName: { margin: 0, fontSize: 22, fontWeight: 900, color: "#0f172a" },
  clueContainer: { background: "#ffffff", border: "1px solid #e2e8f0", padding: 14, borderRadius: 14, textAlign: "left" },
  clue: { margin: "4px 0 0", color: "#475569", fontSize: 14, lineHeight: 1.5, fontWeight: 500 },
  priceTag: { background: "#fef3c7", color: "#92400e", fontWeight: 800, fontSize: 13, padding: "8px 12px", borderRadius: 10, alignSelf: "center" },
  
  choicePanel: { background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 20, padding: 20, boxShadow: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.02)" },
  choicePanelTitle: { fontSize: 14, fontWeight: 800, color: "#64748b", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.5px" },
  empty: { background: "#f1f5f9", border: "2px dashed #cbd5e1", borderRadius: 20, padding: "60px 20px", textAlign: "center", color: "#64748b", fontWeight: 600, fontSize: 14 },
  choiceTitle: { margin: "0 0 8px", fontWeight: 700, color: "#334155", fontSize: 14 },
  choiceGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8 },

  // 이미지 해상도 보정 및 스켈레톤 디자인 블록
  photoLargeWrapper: { width: "100%", height: 240, borderRadius: 16, backgroundColor: "#ffffff", border: "1px solid #e2e8f0", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" },
  photoSmallWrapper: { width: 54, height: 54, borderRadius: 12, backgroundColor: "#ffffff", border: "1px solid #e2e8f0", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  photoLargeHidden: { width: "100%", height: 240, borderRadius: 16, background: "linear-gradient(135deg, #e2e8f0, #cbd5e1)", display: "grid", placeItems: "center", fontSize: 48, color: "#64748b", fontWeight: 900 },
  photoSmallHidden: { width: 54, height: 54, borderRadius: 12, background: "#e2e8f0", display: "grid", placeItems: "center", fontSize: 18, color: "#64748b", fontWeight: 900, flexShrink: 0 },
  photoImg: { width: "100%", height: "100%", objectFit: "cover" },

  // 원격 데이터 리더보드 시각화 고도화
  bestScoreBox: { background: "linear-gradient(135deg, #ecfccb, #d9f99d)", border: "1px solid #a3e635", color: "#3f6212", borderRadius: 16, padding: "14px 18px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 800, fontSize: 15 },
  rankList: { display: "grid", gap: 8 },
  rankRow: { borderRadius: 14, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", border: "1px solid #e2e8f0", fontSize: 13 },
  rankRowMe: { background: "#fef9c3", borderColor: "#fde047", boxShadow: "0 4px 6px -1px rgba(234, 179, 8, 0.1)" },
  rankUserGroup: { display: "flex", alignItems: "center", gap: 10 },
  rankIconBox: { width: 24, textAlign: "center" },
  rankScoreText: { color: "#334155", fontSize: 14 },
  leaderboardNote: { margin: "14px 0 0", color: "#94a3b8", fontSize: 11, lineHeight: 1.4, textAlign: "justify" },
  emptyRank: { background: "#f1f5f9", borderRadius: 14, padding: 14, color: "#64748b", textAlign: "center", fontWeight: 600, fontSize: 13 },

  // 도감 수집 서랍 격자 라인
  bookGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 },
  bookCardFound: { display: "flex", gap: 14, background: "#ffffff", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)", borderRadius: 18, padding: 14, alignItems: "flex-start" },
  bookCardMissing: { display: "flex", gap: 14, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 18, padding: 14, alignItems: "flex-start", opacity: 0.7 },
  bookCardTitle: { fontWeight: 800, fontSize: 15, color: "#0f172a" },
  factText: { margin: "8px 0 0", color: "#475569", fontSize: 12, lineHeight: 1.5, background: "#f1f5f9", padding: "8px 10px", borderRadius: 8 },

  // 인벤토리 저장 창고 컴포넌트
  inventoryList: { display: "grid", gap: 8 },
  inventoryRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 16, padding: 12 },
  curriculumGoal: { margin: "18px 0 0", color: "#64748b", fontSize: 12, lineHeight: 1.6, background: "#f8fafc", border: "1px solid #e2e8f0", padding: 14, borderRadius: 14, textAlign: "justify" },
  smallText: { margin: "2px 0 0", color: "#64748b", fontSize: 12, fontWeight: 500 },

  // 🚀 인터랙티브 버튼 스타일 명세 (기본 물리 스타일 및 배색 기법 통합)
  btnBase: {
    padding: "10px 18px",
    fontSize: "14px",
    fontWeight: "700",
    borderRadius: "12px",
    cursor: "pointer",
    border: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 2px 4px 0 rgba(0, 0, 0, 0.05)",
    userSelect: "none",
  },
  btnPrimary: { backgroundColor: "#ffffff", color: "#334155", border: "1px solid #cbd5e1" },
  btnSelected: { backgroundColor: "#0f172a", color: "#ffffff", boxShadow: "0 4px 12px rgba(15, 23, 42, 0.25)" },
  btnSecondary: { backgroundColor: "#3b82f6", color: "#ffffff", boxShadow: "0 4px 12px rgba(59, 130, 246, 0.2)" },
  btnDanger: { backgroundColor: "#ef4444", color: "#ffffff" },
  btnDisabled: { backgroundColor: "#e2e8f0", color: "#94a3b8", cursor: "not-allowed", boxShadow: "none" },
};
