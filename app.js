const data=[
{name:'KBS 1라디오',badge:'KBS\n1라디오',freq:'97.3 MHz',cat:'뉴스 · 시사',type:'kbs',code:'21'},
{name:'KBS 2라디오',badge:'KBS\n2라디오',freq:'106.1 MHz',cat:'음악 · 생활정보',type:'kbs',code:'22'},
{name:'KBS 클래식FM',badge:'KBS\n클래식FM',freq:'93.1 MHz',cat:'클래식 · 음악',type:'kbs',code:'24'},
{name:'KBS 쿨FM',badge:'KBS\n쿨FM',freq:'89.1 MHz',cat:'음악 · 예능',type:'kbs',code:'25'},
{name:'SBS 파워FM',badge:'SBS\n파워FM',freq:'107.7 MHz',cat:'음악 · 예능',type:'sbs',streamApi:'https://apis.sbs.co.kr/play-api/1.0/livestream/powerpc/powerfm?protocol=hls&ssl=Y',match:'파워FM'},
{name:'SBS 러브FM',badge:'SBS\n러브FM',freq:'103.5 MHz',cat:'토크 · 음악',type:'sbs',streamApi:'https://apis.sbs.co.kr/play-api/1.0/livestream/lovepc/lovefm?protocol=hls&ssl=Y',match:'러브FM'},
{name:'CBS 음악FM',badge:'CBS\n음악FM',freq:'93.9 MHz',cat:'음악 · 힐링',type:'direct',url:'https://aac.cbs.co.kr/cbs939/_definst_/cbs939.stream/playlist.m3u8'},
{name:'CBS 표준FM',badge:'CBS\n표준FM',freq:'98.1 MHz',cat:'뉴스 · 시사 · 교양',type:'direct',url:'https://aac.cbs.co.kr/cbs981/_definst_/cbs981.stream/playlist.m3u8'},
{name:'EBS FM',badge:'EBS\nFM',freq:'104.5 MHz',cat:'교육 · 교양',type:'direct',url:'https://ebsonair.ebs.co.kr/fmradiofamilypc/familypc1m/playlist.m3u8'},
{name:'BBS 불교방송',badge:'BBS\n불교방송',freq:'101.9 MHz',cat:'교양 · 음악',type:'direct',url:'https://bbslive.clouducs.com/bbsradio-live/livestream/playlist.m3u8'},
{name:'YTN 라디오',badge:'YTN\n라디오',freq:'94.5 MHz',cat:'뉴스 · 시사',type:'direct',url:'https://radiolive.ytn.co.kr/radio/_definst_/20211118_fmlive/playlist.m3u8'}
];
const colors=['#1479e9','#2746b8','#7651db','#dc3165','#ef5b37','#e77a20','#18a866','#248e74','#3975c6','#d59a24','#4b64a8'];
let idx=Math.min(+(localStorage.radioLast||0),data.length-1),playing=false,timer=0,timerHandle=null;
const $=x=>document.getElementById(x),audio=new Audio();audio.preload='none';audio.playsInline=true;
data.forEach((s,i)=>{const b=document.createElement('button');b.className='station';b.style.background=colors[i];b.innerHTML=`<strong>${s.badge.replace('\n','<br>')}</strong><small>${s.freq}</small><em>${s.cat}</em>`;b.onclick=()=>open(i);$('stations').appendChild(b)});
async function getStream(s){
 if(s.type==='direct')return s.url;
 if(s.type==='kbs'){const r=await fetch(`https://cfpwwwapi.kbs.co.kr/api/v1/landing/live/channel_code/${s.code}`);const j=await r.json();const item=(j.channel_item||j.channel?.item||[])[0];if(!item?.service_url)throw Error('KBS stream');return item.service_url}
 if(s.type==='sbs'){const r=await fetch(s.streamApi);const text=(await r.text()).trim();try{const j=JSON.parse(text);return j?.onair?.source?.mediasource?.mediaurl||j?.mediaurl||j?.url||text}catch{return text}}
}
function findMeta(obj){let best=null;function walk(x){if(!x||typeof x!=='object')return;const title=x.program_title||x.programTitle||x.title||x.program_name||x.programName;const st=x.start_time||x.starttime||x.startTime;const et=x.end_time||x.endtime||x.endTime;if(title&&(st||et)&&!best)best={title,start:st,end:et};Object.values(x).forEach(walk)}walk(obj);return best}
function fmt(t){if(!t)return'';const m=String(t).match(/(\d{1,2}):(\d{2})/);return m?`${m[1].padStart(2,'0')}:${m[2]}`:''}
async function loadProgram(s){$('program').textContent='편성 정보를 불러오는 중…';$('programTime').textContent='';$('nextProgram').textContent='';try{
 if(s.type==='kbs'){const r=await fetch(`https://cfpwwwapi.kbs.co.kr/api/v1/landing/live/channel_code/${s.code}`);const j=await r.json();const meta=findMeta(j);if(meta){$('program').textContent=meta.title;$('programTime').textContent=[fmt(meta.start),fmt(meta.end)].filter(Boolean).join(' ~ ');return}}
 if(s.type==='sbs'){const r=await fetch('https://static.apis.sbs.co.kr/play-api/1.0/onair/channels');const j=await r.json();const list=j.list||[];const item=list.find(x=>(x.channelname||'').includes(s.match));if(item){$('program').textContent=item.title||'현재 방송';$('programTime').textContent=[fmt(item.starttime),fmt(item.endtime)].filter(Boolean).join(' ~ ');return}}
 $('program').textContent='현재 방송을 듣고 있어요';$('programTime').textContent='편성표 연동 준비 중';
 }catch(e){$('program').textContent='현재 방송을 듣고 있어요';$('programTime').textContent='편성 정보를 가져오지 못했어요'}}
async function playCurrent(){const btn=$('playBtn');try{btn.querySelector('span').textContent='연결 중';audio.src=await getStream(data[idx]);audio.volume=$('volume').value/100;await audio.play();setPlay(true)}catch(e){console.error(e);setPlay(false);btn.querySelector('span').textContent='다시 듣기';alert('이 방송은 지금 연결되지 않아요. 다른 방송을 선택해 주세요.')}}
function stopRadio(){audio.pause();audio.removeAttribute('src');audio.load();setPlay(false)}
function open(i){idx=(i+data.length)%data.length;localStorage.radioLast=idx;const s=data[idx];$('stationName').textContent=s.name;$('stationBadge').textContent=s.badge;$('stationBadge').style.background=colors[idx];$('frequency').textContent=s.freq;$('category').textContent=s.cat;$('home').classList.remove('active');$('player').classList.add('active');fav();loadProgram(s);playCurrent()}
function setPlay(v){playing=v;$('playBtn').childNodes[0].nodeValue=v?'■':'▶';$('playBtn').querySelector('span').textContent=v?'라디오 끄기':'다시 듣기'}
function fav(){const f=JSON.parse(localStorage.radioFav||'[]');$('favoriteBtn').childNodes[0].nodeValue=f.includes(idx)?'♥':'♡'}
$('backBtn').onclick=()=>{$('player').classList.remove('active');$('home').classList.add('active')};$('playBtn').onclick=()=>playing?stopRadio():playCurrent();$('prevBtn').onclick=()=>{stopRadio();open(idx-1)};$('nextBtn').onclick=()=>{stopRadio();open(idx+1)};$('resumeBtn').onclick=()=>open(+(localStorage.radioLast||0));$('volume').oninput=e=>audio.volume=e.target.value/100;$('favoriteBtn').onclick=()=>{let f=JSON.parse(localStorage.radioFav||'[]');f=f.includes(idx)?f.filter(x=>x!==idx):[...f,idx];localStorage.radioFav=JSON.stringify(f);fav()};$('timerBtn').onclick=()=>{timer=timer===0?15:timer===15?30:timer===30?60:0;if(timerHandle)clearTimeout(timerHandle);if(timer)timerHandle=setTimeout(()=>{stopRadio();timer=0;$('timerBtn').textContent='🌙 수면 타이머: 꺼짐'},timer*60000);$('timerBtn').textContent=timer?`🌙 수면 타이머: ${timer}분`:'🌙 수면 타이머: 꺼짐'};audio.addEventListener('ended',()=>setPlay(false));