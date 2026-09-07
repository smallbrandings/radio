const data=[
['KBS 1라디오','KBS\n1라디오','97.3 MHz','뉴스 · 시사','21'],
['KBS 2라디오','KBS\n2라디오','106.1 MHz','음악 · 생활정보','22'],
['KBS 클래식FM','KBS\n클래식FM','93.1 MHz','클래식 · 음악','24'],
['KBS 쿨FM','KBS\n쿨FM','89.1 MHz','음악 · 예능','25']
];
const colors=['#1479e9','#2746b8','#7651db','#dc3165'];
let idx=+(localStorage.radioLast||0),playing=false,timer=0,timerHandle=null;
const $=x=>document.getElementById(x);
const audio=new Audio(); audio.preload='none'; audio.playsInline=true;

data.forEach((s,i)=>{let b=document.createElement('button');b.className='station';b.innerHTML=`<strong>${s[1].replace('\n','<br>')}</strong><small>${s[2]}</small><em>${s[3]}</em>`;b.onclick=()=>open(i);$('stations').appendChild(b)});

async function getKbsStream(code){
 const r=await fetch(`https://cfpwwwapi.kbs.co.kr/api/v1/landing/live/channel_code/${code}`);
 if(!r.ok) throw new Error('방송 정보를 가져오지 못했습니다.');
 const j=await r.json();
 const items=j.channel_item||j.channel?.item||[];
 const url=items[0]?.service_url;
 if(!url) throw new Error('재생 주소를 찾지 못했습니다.');
 return url;
}
async function playCurrent(){
 const btn=$('playBtn');
 try{
  btn.querySelector('span').textContent='연결 중';
  const url=await getKbsStream(data[idx][4]);
  audio.src=url;
  audio.volume=$('volume').value/100;
  await audio.play();
  setPlay(true);
 }catch(e){
  console.error(e); setPlay(false);
  btn.querySelector('span').textContent='다시 듣기';
  alert('방송 연결에 실패했어요. 잠시 후 다시 눌러주세요.');
 }
}
function stopRadio(){audio.pause();audio.removeAttribute('src');audio.load();setPlay(false)}
function open(i){idx=(i+data.length)%data.length;localStorage.radioLast=idx;let s=data[idx];$('stationName').textContent=s[0];$('stationBadge').textContent=s[1];$('stationBadge').style.background=colors[idx];$('frequency').textContent=s[2];$('program').textContent=s[0];$('category').textContent=s[3];$('home').classList.remove('active');$('player').classList.add('active');fav();playCurrent()}
function setPlay(v){playing=v;$('playBtn').childNodes[0].nodeValue=v?'■':'▶';$('playBtn').querySelector('span').textContent=v?'라디오 끄기':'다시 듣기'}
function fav(){let f=JSON.parse(localStorage.radioFav||'[]');$('favoriteBtn').childNodes[0].nodeValue=f.includes(idx)?'♥':'♡'}
$('backBtn').onclick=()=>{$('player').classList.remove('active');$('home').classList.add('active')};
$('playBtn').onclick=()=>playing?stopRadio():playCurrent();
$('prevBtn').onclick=()=>{stopRadio();open(idx-1)};
$('nextBtn').onclick=()=>{stopRadio();open(idx+1)};
$('resumeBtn').onclick=()=>open(+(localStorage.radioLast||0));
$('volume').oninput=e=>audio.volume=e.target.value/100;
$('favoriteBtn').onclick=()=>{let f=JSON.parse(localStorage.radioFav||'[]');f=f.includes(idx)?f.filter(x=>x!==idx):[...f,idx];localStorage.radioFav=JSON.stringify(f);fav()};
$('timerBtn').onclick=()=>{timer=timer===0?15:timer===15?30:timer===30?60:0;if(timerHandle)clearTimeout(timerHandle);if(timer)timerHandle=setTimeout(()=>{stopRadio();timer=0;$('timerBtn').textContent='🌙 수면 타이머: 꺼짐'},timer*60000);$('timerBtn').textContent=timer?`🌙 수면 타이머: ${timer}분`:'🌙 수면 타이머: 꺼짐'};
audio.addEventListener('ended',()=>setPlay(false));
audio.addEventListener('pause',()=>{if(!audio.src)setPlay(false)});