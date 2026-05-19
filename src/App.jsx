import React, { useMemo, useState } from "react";

function Button({
  children,
  onClick,
  disabled = false,
  variant = "default",
  size = "md",
  className = "",
  type = "button",
}) {
  const base =
    "inline-flex items-center justify-center rounded-2xl font-medium transition disabled:opacity-40 disabled:cursor-not-allowed";
  const sizes = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";
  const variants = {
    default: "bg-stone-900 text-white hover:bg-stone-700",
    secondary: "bg-amber-200 text-stone-900 hover:bg-amber-300",
    outline: "border border-stone-300 bg-white text-stone-900 hover:bg-stone-100",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes} ${variants[variant] || variants.default} ${className}`}
    >
      {children}
    </button>
  );
}

function Card({ children, className = "" }) {
  return <div className={`rounded-3xl bg-white ${className}`}>{children}</div>;
}

function CardContent({ children, className = "" }) {
  return <div className={className}>{children}</div>;
}

const SAMPLES = [
  {
    id: "granite",
    name: "화강암",
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

const STARTING_LEADERBOARD = [
  { name: "지질학자 민준", score: 180 },
  { name: "암석왕 서연", score: 145 },
  { name: "채석장 고수", score: 110 },
];

const ROCK_IMAGES = {
  granite: "https://commons.wikimedia.org/wiki/Special:FilePath/Granite.jpg",
  basalt: "https://commons.wikimedia.org/wiki/Special:FilePath/BasaltUSGOV.jpg",
  sandstone:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Jacobsville%20Sandstone%20sample.jpg",
  limestone:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Limestone%20(coquina)%20student%20sample.JPG",
  gneiss: "https://commons.wikimedia.org/wiki/Special:FilePath/Gneiss.jpg",
  marble: "https://commons.wikimedia.org/wiki/Special:FilePath/Carrara%20marble.jpg",
};

function RockPhoto({ sample, small = false, hidden = false }) {
  if (hidden) {
    return (
      <div
        className={
          small
            ? "flex h-10 w-10 items-center justify-center rounded-xl bg-stone-300 text-lg"
            : "flex h-56 w-full items-center justify-center rounded-3xl bg-stone-300 text-4xl"
        }
      >
        ?
      </div>
    );
  }

  return (
    <img
      src={ROCK_IMAGES[sample.id]}
      alt={`${sample.name} 암석 사진`}
      className={
        small
          ? "h-10 w-10 rounded-xl object-cover shadow-sm"
          : "mx-auto h-56 w-full rounded-3xl object-cover shadow-sm"
      }
    />
  );
}

function randomSample() {
  return SAMPLES[Math.floor(Math.random() * SAMPLES.length)];
}

export default function App() {
  const [playerName, setPlayerName] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [coins, setCoins] = useState(50);
  const [energy, setEnergy] = useState(8);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [message, setMessage] = useState(
    "채석장에 오신 것을 환영합니다. 암석 표본을 모아 도감을 완성하세요!"
  );
  const [current, setCurrent] = useState(null);
  const [inventory, setInventory] = useState({});
  const [book, setBook] = useState({});
  const [selectedType, setSelectedType] = useState("");
  const [selectedGrain, setSelectedGrain] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSedimentFeature, setSelectedSedimentFeature] = useState("");
  const [selectedMetamorphicFeature, setSelectedMetamorphicFeature] = useState("");
  const [selectedFeature, setSelectedFeature] = useState("");
  const [verified, setVerified] = useState({});

  const collectedCount = useMemo(() => Object.keys(book).length, [book]);

  const leaderboard = useMemo(() => {
    return [
      ...STARTING_LEADERBOARD,
      { name: playerName || "나", score, me: true },
    ]
      .sort((a, b) => b.score - a.score)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
  }, [score, playerName]);

  function startGame() {
    const cleanName = nameInput.trim();
    if (!cleanName) return;
    setPlayerName(cleanName);
    setMessage(`${cleanName}님, 채석장에 오신 것을 환영합니다.`);
  }

  function resetChoices() {
    setSelectedType("");
    setSelectedGrain("");
    setSelectedColor("");
    setSelectedSedimentFeature("");
    setSelectedMetamorphicFeature("");
    setSelectedFeature("");
  }

  function mine() {
    if (energy <= 0) {
      setMessage("에너지가 부족합니다. 에너지 충전으로 회복하세요.");
      return;
    }

    const sample = randomSample();
    setEnergy((e) => e - 1);
    setCurrent(sample);
    setInventory((prev) => ({
      ...prev,
      [sample.id]: (prev[sample.id] || 0) + 1,
    }));
    resetChoices();
    setMessage(`새 표본 발견: ${sample.name}. 관찰 항목을 선택하세요.`);
  }

  function classify() {
    if (!current) {
      setMessage("먼저 채굴해서 표본을 찾아야 합니다.");
      return;
    }

    if (current.observeMode === "igneous") {
      if (!selectedGrain || !selectedColor || !selectedFeature) {
        setMessage("화성암은 알갱이 크기, 색깔, 추가 특징을 모두 선택하세요.");
        return;
      }
      if (
        selectedGrain !== current.grain ||
        selectedColor !== current.color ||
        selectedFeature !== current.feature
      ) {
        setMessage("화성암 관찰 결과가 맞지 않습니다.");
        return;
      }
    }

    if (current.observeMode === "sedimentary") {
      if (!selectedSedimentFeature || !selectedFeature) {
        setMessage("퇴적암은 퇴적물/화석/층리/염산 반응 같은 특징을 선택하세요.");
        return;
      }
      if (
        selectedSedimentFeature !== current.sedimentFeature ||
        selectedFeature !== current.feature
      ) {
        setMessage("퇴적암 관찰 결과가 맞지 않습니다.");
        return;
      }
    }

    if (current.observeMode === "metamorphic") {
      if (!selectedMetamorphicFeature || !selectedFeature) {
        setMessage("변성암은 줄무늬/엽리 또는 기존 암석이 변한 특징을 선택하세요.");
        return;
      }
      if (
        selectedMetamorphicFeature !== current.metamorphicFeature ||
        selectedFeature !== current.feature
      ) {
        setMessage("변성암 관찰 결과가 맞지 않습니다.");
        return;
      }
    }

    if (!selectedType) {
      setMessage("화성암, 퇴적암, 변성암 중 하나를 선택하세요.");
      return;
    }

    if (selectedType !== current.type) {
      setMessage("분류가 맞지 않습니다. 관찰 단서를 바탕으로 다시 생각해 보세요.");
      return;
    }

    const gain = 10 + level * 2;
    setScore((s) => s + gain);
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

    if (!verified[id]) {
      setMessage("아직 검증되지 않은 표본입니다.");
      return;
    }

    setInventory((prev) => ({ ...prev, [id]: prev[id] - 1 }));
    setCoins((c) => c + sample.value);
    setScore((s) => s + 5);
    setMessage(`${sample.name} 검증 표본을 과학관에 판매했습니다. +${sample.value} 코인`);
  }

  function refillEnergy() {
    if (coins < 20) {
      setMessage("에너지 충전에는 20코인이 필요합니다.");
      return;
    }
    setCoins((c) => c - 20);
    setEnergy((e) => e + 6);
    setMessage("에너지를 충전했습니다.");
  }

  if (!playerName) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-amber-50 p-4 text-stone-900">
        <Card className="w-full max-w-md shadow-sm">
          <CardContent className="space-y-4 p-6">
            <h1 className="text-3xl font-bold">중2 과학 암석 연구소</h1>
            <p className="text-sm text-stone-600">
              리더보드에 표시할 이름을 입력하세요.
            </p>
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && startGame()}
              placeholder="이름 입력"
              className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none focus:border-stone-600"
            />
            <Button onClick={startGame} className="w-full">
              게임 시작
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50 p-4 text-stone-900">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold">중2 과학 암석 연구소</h1>
              <p className="text-sm text-stone-600">
                화성암 · 퇴적암 · 변성암 분류 게임
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
              <div className="rounded-2xl bg-amber-100 px-4 py-2">💰 {coins} 코인</div>
              <div className="rounded-2xl bg-amber-100 px-4 py-2">⛏️ {energy} 에너지</div>
              <div className="rounded-2xl bg-amber-100 px-4 py-2">⭐ {score} 점</div>
              <div className="rounded-2xl bg-amber-100 px-4 py-2">🏆 Lv.{level}</div>
            </div>
          </div>
        </div>

        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="rounded-2xl bg-stone-100 p-4 text-sm font-medium">
                {message}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={mine}>⛏️ 채굴하기</Button>
                <Button onClick={classify} variant="secondary">🧪 검증하기</Button>
                <Button onClick={refillEnergy} variant="outline">에너지 충전</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="shadow-sm lg:col-span-2">
            <CardContent className="p-5">
              <h2 className="mb-3 text-xl font-bold">🧪 현재 표본 관찰</h2>

              {current ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-3xl bg-amber-100 p-6 text-center">
                    <RockPhoto sample={current} />
                    <h3 className="mt-2 text-2xl font-bold">{current.name}</h3>
                    <p className="mt-2 text-sm text-stone-700">
                      겉모습 단서: {current.clue}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {current.observeMode === "igneous" && (
                      <>
                        <p className="text-sm font-medium">1단계: 알갱이 크기</p>
                        <div className="grid grid-cols-2 gap-2">
                          {["큼", "작음"].map((x) => (
                            <Button
                              key={x}
                              variant={selectedGrain === x ? "default" : "outline"}
                              onClick={() => setSelectedGrain(x)}
                            >
                              {x}
                            </Button>
                          ))}
                        </div>

                        <p className="text-sm font-medium">2단계: 색깔</p>
                        <div className="grid grid-cols-2 gap-2">
                          {["밝은색 계열", "어두운색 계열"].map((x) => (
                            <Button
                              key={x}
                              variant={selectedColor === x ? "default" : "outline"}
                              onClick={() => setSelectedColor(x)}
                            >
                              {x}
                            </Button>
                          ))}
                        </div>

                        <p className="text-sm font-medium">3단계: 추가 특징</p>
                        <div className="space-y-2">
                          {["알갱이가 눈에 잘 보임", "구멍이 보일 수 있음"].map((x) => (
                            <Button
                              key={x}
                              variant={selectedFeature === x ? "default" : "outline"}
                              onClick={() => setSelectedFeature(x)}
                              className="w-full justify-start"
                            >
                              {x}
                            </Button>
                          ))}
                        </div>
                      </>
                    )}

                    {current.observeMode === "sedimentary" && (
                      <>
                        <p className="text-sm font-medium">1단계: 만들어진 흔적</p>
                        <div className="space-y-2">
                          {["퇴적물이 쌓여 굳어진 모습", "화석이나 생물 흔적이 보일 수 있음"].map((x) => (
                            <Button
                              key={x}
                              variant={selectedSedimentFeature === x ? "default" : "outline"}
                              onClick={() => setSelectedSedimentFeature(x)}
                              className="w-full justify-start"
                            >
                              {x}
                            </Button>
                          ))}
                        </div>

                        <p className="text-sm font-medium">2단계: 퇴적암 특징</p>
                        <div className="space-y-2">
                          {["층리가 나타날 수 있음", "묽은 염산에 기포가 생김"].map((x) => (
                            <Button
                              key={x}
                              variant={selectedFeature === x ? "default" : "outline"}
                              onClick={() => setSelectedFeature(x)}
                              className="w-full justify-start"
                            >
                              {x}
                            </Button>
                          ))}
                        </div>
                      </>
                    )}

                    {current.observeMode === "metamorphic" && (
                      <>
                        <p className="text-sm font-medium">1단계: 변한 흔적</p>
                        <div className="space-y-2">
                          {["줄무늬나 엽리가 보임", "기존 암석이 변한 모습"].map((x) => (
                            <Button
                              key={x}
                              variant={selectedMetamorphicFeature === x ? "default" : "outline"}
                              onClick={() => setSelectedMetamorphicFeature(x)}
                              className="w-full justify-start"
                            >
                              {x}
                            </Button>
                          ))}
                        </div>

                        <p className="text-sm font-medium">2단계: 변성암 특징</p>
                        <div className="space-y-2">
                          {["열과 압력을 받은 흔적이 있음", "석회암이 변성되어 만들어짐"].map((x) => (
                            <Button
                              key={x}
                              variant={selectedFeature === x ? "default" : "outline"}
                              onClick={() => setSelectedFeature(x)}
                              className="w-full justify-start"
                            >
                              {x}
                            </Button>
                          ))}
                        </div>
                      </>
                    )}

                    <p className="text-sm font-medium">마지막 단계: 암석 종류</p>
                    <div className="grid grid-cols-3 gap-2">
                      {["화성암", "퇴적암", "변성암"].map((x) => (
                        <Button
                          key={x}
                          variant={selectedType === x ? "default" : "outline"}
                          onClick={() => setSelectedType(x)}
                        >
                          {x}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl bg-stone-100 p-8 text-center text-stone-600">
                  채굴하기를 눌러 첫 암석 표본을 찾아보세요.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-5">
              <h2 className="mb-3 text-xl font-bold">🏅 리더보드</h2>
              <div className="space-y-2">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.name}
                    className={`flex items-center justify-between rounded-2xl p-3 text-sm ${
                      entry.me ? "bg-amber-100 font-bold" : "bg-stone-100"
                    }`}
                  >
                    <span>
                      {entry.rank}위 · {entry.name}
                      {entry.me ? " 👤" : ""}
                    </span>
                    <span>{entry.score}점</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="shadow-sm">
            <CardContent className="p-5">
              <h2 className="mb-3 text-xl font-bold">
                📘 암석 도감 {collectedCount}/{SAMPLES.length}
              </h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {SAMPLES.map((sample) => {
                  const found = Boolean(book[sample.id]);
                  return (
                    <div key={sample.id} className="rounded-2xl bg-stone-100 p-3 text-sm">
                      <RockPhoto sample={sample} small hidden={!found} />
                      <b>{found ? sample.name : "미발견 표본"}</b>
                      <p className="text-stone-600">
                        {found
                          ? `${sample.type} · ${sample.subtype}`
                          : "관찰하고 분류하면 열립니다."}
                      </p>
                      {found && (
                        <p className="mt-1 text-xs text-stone-500">{sample.fact}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-5">
              <h2 className="mb-3 text-xl font-bold">표본 보관함</h2>
              <div className="space-y-2">
                {SAMPLES.map((sample) => (
                  <div
                    key={sample.id}
                    className="flex items-center justify-between rounded-2xl bg-stone-100 p-3 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <RockPhoto sample={sample} small />
                      <span>
                        <b>{sample.name}</b> × {inventory[sample.id] || 0}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={!inventory[sample.id] || !verified[sample.id]}
                      onClick={() => sellSample(sample.id)}
                    >
                      {verified[sample.id] ? "판매" : "검증 필요"}
                    </Button>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-stone-500">
                학습 목표: 화성암은 알갱이 크기와 색깔, 퇴적암은 층리·화석·염산 반응,
                변성암은 엽리·줄무늬·변성 작용의 흔적을 바탕으로 분류하기
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}