import React,{useEffect,useMemo,useState}from"react";
import"./App.css";
import{initializeApp}from"firebase/app";
import{getDatabase,onValue,ref,set}from"firebase/database";

const ROCKS=[
["granite","화강암","화성암","심성암","큼","밝은색 계열","알갱이가 눈에 잘 보임","마그마가 지하 깊은 곳에서 천천히 식어 만들어진 심성암이다.",16],
["gabbro","반려암","화성암","심성암","큼","어두운색 계열","알갱이가 눈에 잘 보임","마그마가 지하 깊은 곳에서 천천히 식어 만들어진 어두운색 심성암이다.",17],
["basalt","현무암","화성암","화산암","작음","어두운색 계열","구멍이 보일 수 있음","용암이 지표 부근에서 빠르게 식어 만들어진 어두운색 화산암이다.",14],
["rhyolite","유문암","화성암","화산암","작음","밝은색 계열","알갱이가 잘 보이지 않음","용암이 지표 부근에서 빠르게 식어 만들어진 밝은색 화산암이다.",15],
["conglomerate","역암","퇴적암","쇄설성 퇴적암","퇴적물이 쌓여 굳어진 모습","","큰 자갈 알갱이가 보임","자갈이 쌓이고 굳어져 만들어진 퇴적암이다.",15],
["sandstone","사암","퇴적암","쇄설성 퇴적암","퇴적물이 쌓여 굳어진 모습","","층리가 나타날 수 있음","모래가 쌓이고 굳어져 만들어진 퇴적암이다.",13],
["mudstone","이암","퇴적암","쇄설성 퇴적암","퇴적물이 쌓여 굳어진 모습","","알갱이가 매우 작음","진흙처럼 작은 입자가 쌓이고 굳어져 만들어진 퇴적암이다.",14],
["limestone","석회암","퇴적암","생물·화학적 퇴적암","화석이나 생물 흔적이 보일 수 있음","","묽은 염산에 기포가 생김","탄산 칼슘 성분이 많아 묽은 염산과 반응한다.",18],
["gneiss","편마암","변성암","엽리 있는 변성암","줄무늬나 엽리가 보임","","열과 압력을 받은 흔적이 있음","높은 열과 압력으로 광물이 줄무늬 모양으로 배열된 변성암이다.",20],
["marble","대리암","변성암","석회암이 변성","기존 암석이 변한 모습","","석회암이 변성되어 만들어짐","석회암이 변성 작용을 받아 만들어진 변성암이다.",19]
].map(([id,name,type,subtype,a,b,feature,fact,value])=>({id,name,type,subtype,a,b,feature,fact,value}));

const IMG_BASE = import.meta.env.BASE_URL;

const PHOTO={
granite:`${IMG_BASE}rocks/granite.jpg`,
gabbro:`${IMG_BASE}rocks/gabbro.jpg`,
basalt:`${IMG_BASE}rocks/basalt.jpg`,
rhyolite:`${IMG_BASE}rocks/rhyolite.jpg`,
conglomerate:`${IMG_BASE}rocks/conglomerate.jpg`,
sandstone:`${IMG_BASE}rocks/sandstone.jpg`,
mudstone:`${IMG_BASE}rocks/mudstone.jpg`,
limestone:`${IMG_BASE}rocks/limestone.jpg`,
gneiss:`${IMG_BASE}rocks/gneiss.jpg`,
marble:`${IMG_BASE}rocks/marble.jpg`,
volcano:`${IMG_BASE}rocks/volcano.jpg`,
lake:`${IMG_BASE}rocks/lake.jpg`
};

const firebaseConfig={apiKey:"AIzaSyBR_uqP_bJdTULAkcyQJF4p3ZIkLzY-30",authDomain:"rock-game-a09c2.firebaseapp.com",databaseURL:"https://rock-game-a09c2-default-rtdb.asia-southeast1.firebasedatabase.app",projectId:"rock-game-a09c2",storageBucket:"rock-game-a09c2.firebasestorage.app",messagingSenderId:"182019123095",appId:"1:182019123095:web:cda88c83d5a8464a7acd2"};
const db=getDatabase(initializeApp(firebaseConfig));

const K="rock-game-player-v9",P="rock-game-state-v9:";
const DEF={coins:50,energy:8,score:0,level:1,inv:{},book:{},ver:{},cooldown:{}};
const LEVELS=[["초보 채굴가",0,0,0,0],["암석 수집가",60,20,3,2],["표본 감정사",150,35,4,4],["지질 탐험가",280,50,5,6],["암석 박사",450,80,6,9]].map(([t,min,coin,en,bonus],i)=>({lv:i+1,t,min,coin,en,bonus}));
const by=id=>ROCKS.find(r=>r.id===id), one=a=>by(a[Math.floor(Math.random()*a.length)]);
const safe=s=>s.trim().replace(/[.#$\[\]/]/g,"_").slice(0,30)||"player";
const loadName=()=>localStorage.getItem(K)||"";
const loadState=n=>{try{return n?{...DEF,...JSON.parse(localStorage.getItem(P+safe(n))||"{}")}:DEF}catch{return DEF}};
const save=(n,d)=>{if(n){localStorage.setItem(K,n);localStorage.setItem(P+safe(n),JSON.stringify(d))}};
const lev=s=>LEVELS.reduce((a,l)=>s>=l.min?l:a,LEVELS[0]);
const nxt=l=>LEVELS.find(x=>x.lv===l+1);

export default function App(){
 const initName=useMemo(loadName,[]), init=useMemo(()=>loadState(initName),[initName]);
 const[player,setPlayer]=useState(initName),[name,setName]=useState("");
 const[coins,setCoins]=useState(init.coins),[energy,setEnergy]=useState(init.energy),[score,setScore]=useState(init.score),[level,setLevel]=useState(init.level);
 const[inv,setInv]=useState(init.inv),[book,setBook]=useState(init.book),[ver,setVer]=useState(init.ver),[cooldown,setCooldown]=useState(init.cooldown||{});
 const[cur,setCur]=useState(null),[done,setDone]=useState(false),[msg,setMsg]=useState("✨ 환경 사진을 클릭해 표본을 찾아보세요.");
 const[lb,setLb]=useState([]),[fb,setFb]=useState("Firebase 연결 확인 중");
 const[grain,setGrain]=useState(""),[color,setColor]=useState(""),[made,setMade]=useState(""),[feature,setFeature]=useState(""),[meta,setMeta]=useState(""),[kind,setKind]=useState("");
 const L=lev(score),N=nxt(level),progress=N?Math.max(0,Math.min(100,Math.round((score-L.min)/(N.min-L.min)*100))):100;

 useEffect(()=>save(player,{coins,energy,score,level,inv,book,ver,cooldown}),[player,coins,energy,score,level,inv,book,ver,cooldown]);
 useEffect(()=>onValue(ref(db,"leaderboard"),s=>{let rows=Object.entries(s.val()||{}).map(([k,v])=>({name:v?.name||k,score:Number(v?.score||0)})).sort((a,b)=>b.score-a.score);setLb(rows);setFb(`Firebase 연결됨 · ${rows.length}명 등록`)},e=>setFb("Firebase 오류: "+e.message)),[]);
 useEffect(()=>{if(player)set(ref(db,"leaderboard/"+safe(player)),{name:player,score:Math.max(score,lb.find(x=>x.name===player)?.score||0),updatedAt:Date.now()})},[player,score]);

 const clear=()=>{setGrain("");setColor("");setMade("");setFeature("");setMeta("");setKind("")};
 const start=()=>{let n=name.trim();if(!n)return;let used=new Set(lb.map(x=>x.name)),base=n,i=2;while(used.has(n))n=`${base}_${String(i++).padStart(3,"0")}`;setPlayer(n);save(n,DEF);setMsg(`${n} 계정이 이 브라우저에 저장되었습니다.`)};
 const addScore=g=>setScore(old=>{let ns=Math.max(0,old+g),ol=lev(old),nl=lev(ns);if(nl.lv>ol.lv){setLevel(nl.lv);setCoins(c=>c+nl.coin);setEnergy(e=>e+nl.en);setMsg(`레벨 업! Lv.${nl.lv} ${nl.t} +${nl.coin}코인 +${nl.en}에너지`)}return ns});
 const wrong=m=>{setScore(s=>Math.max(0,s-3));setCoins(c=>Math.max(0,c-8));setMsg(`${m} -3점, -8코인`)};

 const cooldownCount=Object.keys(cooldown).length;

 const pickNotCooldown=ids=>{
  const available=ids.filter(id=>!cooldown[id]);
  if(available.length===0){
   setMsg("🧊 이 구역의 암석은 모두 쿨다운 중입니다. 다른 구역을 눌러보세요.");
   return null;
  }
  return one(available);
 };

 const addCooldown=id=>{
  setCooldown(prev=>{
   const next={...prev,[id]:true};
   if(Object.keys(next).length>=ROCKS.length){
    window.setTimeout(()=>setMsg("🎉 모든 암석을 한 번씩 맞혀서 쿨다운이 초기화되었습니다!"),0);
    return {};
   }
   return next;
  });
 };
 const findRock=(r,place)=>{if(energy<1)return setMsg("에너지가 부족합니다.");setCur(r);setDone(false);setEnergy(e=>e-1);setInv(v=>({...v,[r.id]:(v[r.id]||0)+1}));clear();setMsg(`${place}에서 ${r.name} 발견! 관찰하고 검증하세요.`)};
 const clickVolcano=e=>{let y=(e.clientY-e.currentTarget.getBoundingClientRect().top)/e.currentTarget.getBoundingClientRect().height;let ids=y<.5?["basalt","rhyolite"]:["granite","gabbro"];let sample=pickNotCooldown(ids);if(sample)findRock(sample,y<.5?"화산암 구역":"심성암 구역")};
 const clickLake=e=>{let r=e.currentTarget.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;let id=y<.5&&x<.5?"conglomerate":y<.5?"sandstone":x<.5?"mudstone":"limestone";let sample=pickNotCooldown([id]);if(sample)findRock(sample,"호수 퇴적층")};
 const transform=id=>{
 let out=id==="granite"?by("gneiss"):id==="limestone"?by("marble"):null,src=by(id);
 if(!out)return;

 const have=(inv[id]||0)+(inv[src.name]||0);
 if(have<1)return setMsg(`${src.name} 표본이 필요합니다.`);
 if(energy<1)return setMsg("에너지가 부족합니다.");

 setInv(v=>{
  const next={...v};
  if((next[id]||0)>0) next[id]=next[id]-1;
  else if((next[src.name]||0)>0) next[src.name]=next[src.name]-1;
  next[out.id]=(next[out.id]||0)+1;
  return next;
 });

 setEnergy(e=>e-1);
 setCur(out);
 setDone(false);
 clear();
 setMsg(`${src.name} → ${out.name} 변성 성공! 관찰하고 검증하세요.`);
};
 const sell=id=>{let r=by(id);if(!inv[id])return;if(!ver[id])return setMsg("검증 필요");setInv(v=>({...v,[id]:v[id]-1}));setCoins(c=>c+r.value);addScore(5);setMsg(`${r.name} 판매! +${r.value}코인`)};
 const charge=()=>coins<35?setMsg("35코인이 필요합니다."): (setCoins(c=>c-35),setEnergy(e=>e+4),setMsg("에너지 +4, -35코인"));
 const skip=()=>cur?(setCur(null),setDone(false),clear(),setScore(s=>Math.max(0,s-10)),setMsg("표본을 넘겼습니다. -10점")):setMsg("넘길 표본이 없습니다.");

 if(!player)return <main className="page center"><section className="card start"><h1>🧪 중2 과학 암석 연구소</h1><p>이름은 이 브라우저에 저장됩니다.</p><p className="made">Made by 이나우</p><input value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&start()} placeholder="이름 입력"/><button onClick={()=>transform("granite")}>화강암 → 편마암</button>
<button onClick={()=>transform("limestone")}>석회암 → 대리암</button></div></World>
  </section>
  <section className="mainGrid">
   <section className="card observe"><h2>🔬 현재 표본</h2>{cur?<><Photo r={cur}/><h3>{cur.name}</h3><p>{cur.fact}</p><Choices r={cur} vals={{grain,color,made,feature,meta,kind}} sets={{setGrain,setColor,setMade,setFeature,setMeta,setKind}}/></>:<p className="empty">환경 사진을 클릭해 표본을 찾으세요.</p>}</section>
   <section className="card"><h2>🏆 리더보드</h2><div className="best">내 최고점 <b>{lb.find(x=>x.name===player)?.score||score}점</b></div>{lb.slice(0,10).map((e,i)=><p className={e.name===player?"rank me":"rank"} key={e.name}><span>{i+1}위 · {e.name}</span><b>{e.score}점</b></p>)}<small>{fb}</small></section>
  </section>
  <section className="mainGrid">
   <section className="card"><h2>📘 도감 {Object.keys(book).length}/{ROCKS.length}</h2><div className="book">{ROCKS.map(r=><div key={r.id} className="bookItem"><Photo r={r} hidden={!book[r.id]}/><b>{book[r.id]?r.name:"미발견"}</b><small>{book[r.id]?r.fact:"검증하면 열립니다."}</small></div>)}</div></section>
   <section className="card"><h2>🎒 보관함</h2>{ROCKS.map(r=><p className="bag" key={r.id}><span>{r.name} × {inv[r.id]||0}</span><button disabled={!inv[r.id]||!ver[r.id]} onClick={()=>sell(r.id)}>판매</button></p>)}</section>
  </section>
 </div></main>
}

function Choices({r,vals,sets}){return <div>{r.type==="화성암"&&<><Group t="알갱이 크기" a={["큼","작음"]} v={vals.grain} f={sets.setGrain}/><Group t="색깔" a={["밝은색 계열","어두운색 계열"]} v={vals.color} f={sets.setColor}/></>}{r.type==="퇴적암"&&<><Group t="만들어진 흔적" a={["퇴적물이 쌓여 굳어진 모습","화석이나 생물 흔적이 보일 수 있음"]} v={vals.made} f={sets.setMade}/><Group t="특징" a={["큰 자갈 알갱이가 보임","층리가 나타날 수 있음","알갱이가 매우 작음","묽은 염산에 기포가 생김"]} v={vals.feature} f={sets.setFeature}/></>}{r.type==="변성암"&&<><Group t="변한 흔적" a={["줄무늬나 엽리가 보임","기존 암석이 변한 모습"]} v={vals.meta} f={sets.setMeta}/><Group t="특징" a={["열과 압력을 받은 흔적이 있음","석회암이 변성되어 만들어짐"]} v={vals.feature} f={sets.setFeature}/></>}<Group t="암석 종류" a={["화성암","퇴적암","변성암"]} v={vals.kind} f={sets.setKind}/></div>}
function Group({t,a,v,f}){return <div className="choices"><b>{t}</b>{a.map(x=><button className={v===x?"selected":""} onClick={()=>f(x)} key={x}>{x}</button>)}</div>}
function World({title,desc,children}){return <section className="card world"><h2>{title}</h2>{children}<p>{desc}</p></section>}
function Photo({r,hidden}){return <div className="photo">{hidden?"?":<img src={PHOTO[r.id]} alt={r.name}/>}</div>}
function Stat({l,v}){return <div className="stat"><b>{v}</b><small>{l}</small></div>}
