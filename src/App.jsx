import React,{useEffect,useMemo,useState}from"react";
import"./App.css";
import{initializeApp}from"firebase/app";
import{getDatabase,onValue,ref,set}from"firebase/database";

const S=[
["granite","화강암","🧱","화성암","심성암","큼","밝은색 계열","알갱이가 눈에 잘 보임","마그마가 지하 깊은 곳에서 천천히 식어 만들어진다.",16],
["basalt","현무암","🌋","화성암","화산암","작음","어두운색 계열","구멍이 보일 수 있음","용암이 지표 부근에서 빠르게 식어 만들어진다.",14],
["conglomerate","역암","🪨","퇴적암","쇄설성 퇴적암","퇴적물이 쌓여 굳어진 모습","","큰 자갈 알갱이가 보임","자갈이 쌓이고 굳어져 만들어진다.",15],
["sandstone","사암","🏜️","퇴적암","쇄설성 퇴적암","퇴적물이 쌓여 굳어진 모습","","층리가 나타날 수 있음","모래가 쌓이고 굳어져 만들어진다.",13],
["mudstone","이암","🌫️","퇴적암","쇄설성 퇴적암","퇴적물이 쌓여 굳어진 모습","","알갱이가 매우 작음","진흙처럼 작은 입자가 쌓이고 굳어져 만들어진다.",14],
["limestone","석회암","🐚","퇴적암","생물·화학적 퇴적암","화석이나 생물 흔적이 보일 수 있음","","묽은 염산에 기포가 생김","탄산 칼슘 성분이 많아 묽은 염산과 반응한다.",18],
["gneiss","편마암","〰️","변성암","엽리 있는 변성암","줄무늬나 엽리가 보임","","열과 압력을 받은 흔적이 있음","높은 열과 압력으로 줄무늬가 생긴다.",20],
["marble","대리암","🏛️","변성암","석회암이 변성","기존 암석이 변한 모습","","석회암이 변성되어 만들어짐","석회암이 열과 압력을 받아 변한 암석이다.",19],
].map(([id,name,icon,type,subtype,a,b,feature,fact,value])=>({id,name,icon,type,subtype,a,b,feature,fact,value}));
const IMG={granite:"https://commons.wikimedia.org/wiki/Special:FilePath/Granite.jpg",basalt:"https://commons.wikimedia.org/wiki/Special:FilePath/BasaltUSGOV.jpg",conglomerate:"https://commons.wikimedia.org/wiki/Special:FilePath/Conglomerate%20Rock%20in%20Spain.jpg",sandstone:"https://commons.wikimedia.org/wiki/Special:FilePath/Jacobsville%20Sandstone%20sample.jpg",mudstone:"https://commons.wikimedia.org/wiki/Special:FilePath/Mudstone.jpg",limestone:"https://commons.wikimedia.org/wiki/Special:FilePath/Limestone%20(coquina)%20student%20sample.JPG",gneiss:"https://commons.wikimedia.org/wiki/Special:FilePath/Gneiss.jpg",marble:"https://commons.wikimedia.org/wiki/Special:FilePath/Carrara%20marble.jpg"};
const firebaseConfig={apiKey:"AIzaSyBR_uqP_bJdTULAkcyQJF4p3ZIkLzY-30",authDomain:"rock-game-a09c2.firebaseapp.com",databaseURL:"https://rock-game-a09c2-default-rtdb.asia-southeast1.firebasedatabase.app",projectId:"rock-game-a09c2",storageBucket:"rock-game-a09c2.firebasestorage.app",messagingSenderId:"182019123095",appId:"1:182019123095:web:cda88c83d5a8464a7acd2"};
const db=getDatabase(initializeApp(firebaseConfig));
const PLAYER="rock-game-player-v2",STATE="rock-game-state-v2:";
const LEVELS=[{lv:1,t:"초보 채굴가",min:0,coin:0,en:0,bonus:0},{lv:2,t:"암석 수집가",min:60,coin:20,en:3,bonus:2},{lv:3,t:"표본 감정사",min:150,coin:35,en:4,bonus:4},{lv:4,t:"지질 탐험가",min:280,coin:50,en:5,bonus:6},{lv:5,t:"암석 박사",min:450,coin:80,en:6,bonus:9}];
const def={coins:50,energy:8,score:0,level:1,inv:{},book:{},ver:{}};
const key=n=>n.trim().replace(/[.#$\[\]/]/g,"_").slice(0,30)||"player";
const loadName=()=>localStorage.getItem(PLAYER)||"";
const loadState=n=>{try{return n?{...def,...JSON.parse(localStorage.getItem(STATE+key(n))||"{}")} : def}catch{return def}};
const saveState=(n,st)=>{if(n){localStorage.setItem(PLAYER,n);localStorage.setItem(STATE+key(n),JSON.stringify(st))}};
const by=id=>S.find(x=>x.id===id);
const lvlFrom=s=>LEVELS.reduce((a,l)=>s>=l.min?l:a,LEVELS[0]);
const nextLvl=l=>LEVELS.find(x=>x.lv===l+1);
const typeIcon=t=>t==="화성암"?"🌋":t==="퇴적암"?"🌊":t==="변성암"?"🔥":"🪨";

function App(){
 const initName=useMemo(loadName,[]),init=useMemo(()=>loadState(initName),[initName]);
 const[player,setPlayer]=useState(initName),[name,setName]=useState("");
 const[coins,setCoins]=useState(init.coins),[energy,setEnergy]=useState(init.energy),[score,setScore]=useState(init.score),[level,setLevel]=useState(init.level);
 const[inv,setInv]=useState(init.inv),[book,setBook]=useState(init.book),[ver,setVer]=useState(init.ver);
 const[cur,setCur]=useState(null),[solved,setSolved]=useState(false),[msg,setMsg]=useState("⛏️ 암석 연구소에 오신 것을 환영합니다.");
 const[lb,setLb]=useState([]),[fb,setFb]=useState("Firebase 연결 확인 중...");
 const[grain,setGrain]=useState(""),[color,setColor]=useState(""),[feat,setFeat]=useState(""),[made,setMade]=useState(""),[meta,setMeta]=useState(""),[typ,setTyp]=useState("");
 const L=lvlFrom(score),N=nextLvl(level),pct=N?Math.max(0,Math.min(100,Math.round((score-L.min)/(N.min-L.min)*100))):100;
 useEffect(()=>saveState(player,{coins,energy,score,level,inv,book,ver}),[player,coins,energy,score,level,inv,book,ver]);
 useEffect(()=>onValue(ref(db,"leaderboard"),s=>{const e=Object.entries(s.val()||{}).map(([k,v])=>({name:v?.name||k,score:Number(v?.score||0)})).sort((a,b)=>b.score-a.score);setLb(e);setFb(`Firebase 연결됨 · ${e.length}명 등록`)},e=>setFb("Firebase 오류: "+e.message)),[]);
 useEffect(()=>{if(player)set(ref(db,"leaderboard/"+key(player)),{name:player,score:Math.max(score,lb.find(x=>x.name===player)?.score||0),updatedAt:Date.now()})},[player,score]);
 const reset=()=>{setGrain("");setColor("");setFeat("");setMade("");setMeta("");setTyp("")};
 const start=()=>{let n=name.trim();if(!n)return;let names=new Set(lb.map(x=>x.name)),base=n,i=2;while(names.has(n))n=`${base}_${String(i++).padStart(3,"0")}`;setPlayer(n);saveState(n,def);setMsg(`👋 ${n} 계정이 이 브라우저에 저장되었습니다.`)};
 const gainScore=g=>setScore(old=>{let ns=Math.max(0,old+g),ol=lvlFrom(old),nl=lvlFrom(ns);if(nl.lv>ol.lv){setLevel(nl.lv);setCoins(c=>c+nl.coin);setEnergy(e=>e+nl.en);setMsg(`🎉 Lv.${nl.lv} ${nl.t}! +${nl.coin}코인 +${nl.en}에너지`)}return ns});
 const wrong=t=>{setScore(s=>Math.max(0,s-3));setCoins(c=>Math.max(0,c-8));setMsg(`❌ ${t} -3점, -8코인`)};
 const addRock=s=>{if(energy<=0)return setMsg("에너지가 부족합니다.");setCur(s);setSolved(false);setEnergy(e=>e-1);setInv(v=>({...v,[s.id]:(v[s.id]||0)+1}));reset();setMsg(`${s.icon} ${s.name} 표본 발견! 관찰하고 검증하세요.`)};
 const clickVolcano=e=>{let r=e.currentTarget.getBoundingClientRect(),y=(e.clientY-r.top)/r.height;addRock(y<.5?by("basalt"):by("granite"))};
 const clickPond=e=>{let r=e.currentTarget.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;addRock(y<.5&&x<.5?by("conglomerate"):y<.5?by("sandstone"):x<.5?by("mudstone"):by("limestone"))};
 const makeMeta=id=>{let res=id==="granite"?by("gneiss"):id==="limestone"?by("marble"):null,src=by(id);if(!res)return;if((inv[id]||0)<1)return setMsg(`${src.name} 표본이 필요합니다.`);if(energy<1)return setMsg("에너지가 부족합니다.");setInv(v=>({...v,[id]:v[id]-1,[res.id]:(v[res.id]||0)+1}));setEnergy(e=>e-1);setCur(res);setSolved(false);reset();setMsg(`🔥 ${src.name} → ${res.name} 변성암 생성!`)};
 const verify=()=>{if(!cur)return setMsg("먼저 표본을 찾아주세요.");if(solved)return setMsg("이미 검증된 표본입니다.");
  if(cur.type==="화성암"){if(!grain||!color)return setMsg("알갱이 크기와 색깔을 선택하세요.");if(grain!==cur.a||color!==cur.b)return wrong("화성암 관찰이 틀렸습니다.")}
  if(cur.type==="퇴적암"){if(!made||!feat)return setMsg("퇴적 흔적과 특징을 선택하세요.");if(made!==cur.a||feat!==cur.feature)return wrong("퇴적암 관찰이 틀렸습니다.")}
  if(cur.type==="변성암"){if(!meta||!feat)return setMsg("변성 흔적과 특징을 선택하세요.");if(meta!==cur.a||feat!==cur.feature)return wrong("변성암 관찰이 틀렸습니다.")}
  if(!typ)return setMsg("암석 종류를 선택하세요.");if(typ!==cur.type)return wrong("암석 종류가 틀렸습니다.");
  let g=12+L.bonus;gainScore(g);setCoins(c=>c+Math.floor(cur.value/2));setBook(b=>({...b,[cur.id]:cur}));setVer(v=>({...v,[cur.id]:true}));setSolved(true);setMsg(`✅ ${cur.name} 검증 성공! +${g}점`)};
 const sell=id=>{let s=by(id);if(!inv[id])return;if(!ver[id])return setMsg("검증 필요");setInv(v=>({...v,[id]:v[id]-1}));setCoins(c=>c+s.value);gainScore(5);setMsg(`${s.name} 판매! +${s.value}코인`)};
 const charge=()=>coins<35?setMsg("35코인이 필요합니다."):(setCoins(c=>c-35),setEnergy(e=>e+4),setMsg("에너지 +4, -35코인"));
 const skip=()=>cur?(setCur(null),setSolved(false),reset(),setScore(s=>Math.max(0,s-10)),setMsg("표본을 넘겼습니다. -10점")):setMsg("넘길 표본이 없습니다.");
 if(!player)return <main className="center"><section className="card start"><h1>🪨 중2 과학 암석 연구소</h1><p>처음 한 번만 이름을 입력하면 이 브라우저에서 이어서 플레이합니다.</p><p className="made">Made by 이나우</p><input value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&start()} placeholder="이름 입력"/><button onClick={start}>게임 시작</button></section></main>;
 return <main><div className="shell"><section className="hero card"><div><h1>🪨 중2 과학 암석 연구소</h1><p>관찰 · 분류 · 검증 · 판매</p></div><div className="stats"><Stat i="💰" l="코인" v={coins}/><Stat i="⛏️" l="에너지" v={energy}/><Stat i="⭐" l="점수" v={score}/><Stat i="🏆" l={L.t} v={`Lv.${level}`}/></div></section>
  <section className="card level"><b>🏆 Lv.{level} {L.t}</b><div className="bar"><span style={{width:pct+"%"}}/></div><small>{N?`다음: Lv.${N.lv} ${N.t} · ${N.min-score}점 남음`:"최고 레벨"}</small></section>
  <section className="card actions"><b>{msg}</b><div><button onClick={verify}>🧪 검증</button><button onClick={charge}>⚡ 충전 -35코인</button><button onClick={skip}>⏭️ 넘기기 -10점</button></div></section>
  <Env title="🌋 화산 채굴장" info="위쪽=현무암, 아래쪽=화강암"><button className="volcano" onClick={clickVolcano} disabled={energy<=0}><span>☁️ ☁️</span><b>🌋</b><em>위쪽 현무암<br/>아래쪽 화강암</em></button></Env>
  <Env title="🐟 연못 퇴적층" info="좌상=역암 · 우상=사암 · 좌하=이암 · 우하=석회암"><button className="pond" onClick={clickPond} disabled={energy<=0}><span className="fish">🐟 🫧 🐠</span><b>🪨 역암</b><b>🏜️ 사암</b><b>🌫️ 이암</b><b>🐚 석회암</b></button></Env>
  <section className="card env"><h2>🔥 변성 작용 실험실</h2><div className="metaLab"><div className="press">⬇️ 압력<br/>🔥 열 + 압력 🔥<br/>⬆️ 압력</div><button onClick={()=>makeMeta("granite")}>🧱 화강암 → 〰️ 편마암</button><button onClick={()=>makeMeta("limestone")}>🐚 석회암 → 🏛️ 대리암</button></div></section>
  <section className="grid"><section className="card observe"><h2>🔎 현재 표본 관찰</h2>{cur?<><Rock s={cur}/><h3>{cur.icon} {cur.name}</h3><p>{cur.fact}</p><Choices cur={cur} vals={{grain,color,feat,made,meta,typ}} sets={{setGrain,setColor,setFeat,setMade,setMeta,setTyp}}/></>:<p className="empty">채굴장을 클릭해 표본을 찾으세요.</p>}</section><section className="card"><h2>🏅 리더보드</h2><div className="best">내 최고점 <b>{lb.find(x=>x.name===player)?.score||score}점</b></div>{lb.slice(0,10).map((e,i)=><p className={e.name===player?"me rank":"rank"} key={e.name}>{["🥇","🥈","🥉"][i]||"🪨"} {i+1}위 · {e.name}<b>{e.score}점</b></p>)}<small>{fb}</small></section></section>
  <section className="grid"><section className="card"><h2>📘 도감 {Object.keys(book).length}/{S.length}</h2><div className="book">{S.map(s=><div key={s.id}><Rock s={s} hidden={!book[s.id]}/><b>{book[s.id]?s.name:"미발견"}</b><small>{book[s.id]?s.fact:"관찰하고 검증하면 열립니다."}</small></div>)}</div></section><section className="card"><h2>🎒 보관함</h2>{S.map(s=><p className="bag" key={s.id}><span>{s.icon} {s.name} × {inv[s.id]||0}</span><button disabled={!inv[s.id]||!ver[s.id]} onClick={()=>sell(s.id)}>💰 판매</button></p>)}</section></section>
 </div></main>}
function Choices({cur,vals,sets}){return <div>{cur.type==="화성암"&&<><Group t="알갱이 크기" a={["큼","작음"]} v={vals.grain} f={sets.setGrain}/><Group t="색깔" a={["밝은색 계열","어두운색 계열"]} v={vals.color} f={sets.setColor}/></>}{cur.type==="퇴적암"&&<><Group t="만들어진 흔적" a={["퇴적물이 쌓여 굳어진 모습","화석이나 생물 흔적이 보일 수 있음"]} v={vals.made} f={sets.setMade}/><Group t="퇴적암 특징" a={["큰 자갈 알갱이가 보임","층리가 나타날 수 있음","알갱이가 매우 작음","묽은 염산에 기포가 생김"]} v={vals.feat} f={sets.setFeat}/></>}{cur.type==="변성암"&&<><Group t="변한 흔적" a={["줄무늬나 엽리가 보임","기존 암석이 변한 모습"]} v={vals.meta} f={sets.setMeta}/><Group t="변성암 특징" a={["열과 압력을 받은 흔적이 있음","석회암이 변성되어 만들어짐"]} v={vals.feat} f={sets.setFeat}/></>}<Group t="암석 종류" a={["화성암","퇴적암","변성암"]} v={vals.typ} f={sets.setTyp}/></div>}
function Group({t,a,v,f}){return <div className="choices"><b>{t}</b>{a.map(x=><button className={v===x?"sel":""} onClick={()=>f(x)} key={x}>{x}</button>)}</div>}
function Env({title,info,children}){return <section className="card env"><h2>{title}</h2><div className="envGrid">{children}<p>{info}</p></div></section>}
function Rock({s,hidden}){return <div className="rock">{hidden?"?":<img src={IMG[s.id]} alt={s.name}/>}</div>}
function Stat({i,l,v}){return <div className="stat"><span>{i}</span><b>{v}</b><small>{l}</small></div>}
export default App;
