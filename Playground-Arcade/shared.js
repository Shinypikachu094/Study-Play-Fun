const ARCADE_KEY='playgroundArcadeProgress';
const STUDY_KEY='playgroundStudyData';
const ARCADE_THEMES={midnight:{name:'Midnight',cost:0,bg:'#111827',canvas:'#25295c',text:'#eef5ff',pack:'neon'},sunset:{name:'Sunset',cost:100,bg:'linear-gradient(135deg,#40204f,#f47b53)',canvas:'#71395f',text:'#fff6e8',pack:'sunset'},forest:{name:'Forest',cost:150,bg:'linear-gradient(135deg,#102d2b,#5a9e68)',canvas:'#245445',text:'#efffea',pack:'forest'},candy:{name:'Candy',cost:250,bg:'linear-gradient(135deg,#573b82,#f08ab5)',canvas:'#a34d83',text:'#fff4fc',pack:'candy'},ocean:{name:'Ocean',cost:350,bg:'linear-gradient(135deg,#062c4c,#19a7b8)',canvas:'#12617d',text:'#eaffff',pack:'ocean'},volcano:{name:'Volcano',cost:500,bg:'linear-gradient(135deg,#351016,#e35328)',canvas:'#682326',text:'#fff0df',pack:'volcano'},aurora:{name:'Aurora',cost:700,bg:'linear-gradient(135deg,#152b55,#7b4bb7,#37bca0)',canvas:'#28527a',text:'#f1ffff',pack:'aurora'},arcade:{name:'Pixel Arcade',cost:900,bg:'linear-gradient(135deg,#17134b,#e21d8f)',canvas:'#292061',text:'#fff4ff',pack:'pixel'},paper:{name:'Paper Pop',cost:1200,bg:'linear-gradient(135deg,#fff4c2,#ffd4e8)',canvas:'#fff0bd',text:'#42244f',pack:'paper'},lime:{name:'Lime Glow',cost:1500,bg:'linear-gradient(135deg,#153c2c,#d3ee58)',canvas:'#376b45',text:'#f4ffe0',pack:'lime'},galaxy:{name:'Galaxy',cost:1800,bg:'linear-gradient(135deg,#080b32,#40228d,#e638a1)',canvas:'#21145c',text:'#f9edff',pack:'galaxy'}};
const TANK_COLORS={cyan:{name:'Cyan',cost:0,color:'#6ce5ff'},ruby:{name:'Ruby',cost:200,color:'#ff657b'},emerald:{name:'Emerald',cost:350,color:'#65e69b'},gold:{name:'Gold',cost:550,color:'#ffd85e'},violet:{name:'Violet',cost:800,color:'#c084fc'},white:{name:'Pearl',cost:1100,color:'#f4fbff'}};
function arcadeGet(){try{return JSON.parse(localStorage.getItem(ARCADE_KEY))||{}}catch{return {}}}
function arcadeState(){const s=arcadeGet();if(typeof s.coins!=='number')s.coins=0;if(typeof s.xp!=='number')s.xp=0;if(typeof s.level!=='number')s.level=1+Math.floor(s.xp/100);return {points:s.points||0,coins:s.coins,xp:s.xp,level:s.level,highScores:s.highScores||{},items:s.items||['midnight'],theme:s.theme||'midnight',tankColors:s.tankColors||['cyan'],tankColor:s.tankColor||'cyan',fruitReward:s.fruitReward||0,arenaReward:s.arenaReward||0,streak:s.streak||0,lastStreakClaim:s.lastStreakClaim||''}}
function arcadeAddXP(amount,source){const s=arcadeState(),before=s.level;s.xp+=Math.max(0,Math.floor(amount));s.level=1+Math.floor(s.xp/100);if(source)s[`${source}XP`]=(s[`${source}XP`]||0)+Math.floor(amount);arcadeSave(s);return {state:s,leveled:s.level>before}}
function arcadeSave(s){localStorage.setItem(ARCADE_KEY,JSON.stringify(s));return s}
function arcadeAddCoins(amount,source){const s=arcadeState();s.coins+=Math.max(0,Math.floor(amount));if(source)s[`${source}Coins`]=(s[`${source}Coins`]||0)+Math.floor(amount);arcadeSave(s);return s}
function arcadeSpendCoins(amount,source){const s=arcadeState(),n=Math.max(0,Math.floor(amount));if(s.coins<n)return null;s.coins-=n;if(source)s[`${source}Spent`]=(s[`${source}Spent`]||0)+n;return arcadeSave(s)}
function arcadeAddPoints(amount,source){const s=arcadeState(),earned=Math.max(0,Math.floor(amount));s.points+=earned;s.xp+=earned;s.level=1+Math.floor(s.xp/100);if(source)s[`${source}Earned`]=(s[`${source}Earned`]||0)+earned;arcadeSave(s);return s}
function arcadeRecordScore(game,score){const s=arcadeState();s.highScores[game]=Math.max(s.highScores[game]||0,Math.floor(score));arcadeSave(s);return s}
function arcadeBuyTheme(theme){const s=arcadeState(),t=ARCADE_THEMES[theme];if(!t||s.items.includes(theme))return s;if(s.points<t.cost)return null;s.points-=t.cost;s.items.push(theme);s.theme=theme;return arcadeSave(s)}
function arcadeUseTheme(theme){const s=arcadeState();if(s.items.includes(theme)){s.theme=theme;arcadeSave(s)}arcadeApplyTheme()}
function arcadeBuyTankColor(color){const s=arcadeState(),t=TANK_COLORS[color];if(!t||s.tankColors.includes(color))return s;if(s.points<t.cost)return null;s.points-=t.cost;s.tankColors.push(color);s.tankColor=color;return arcadeSave(s)}
function arcadeUseTankColor(color){const s=arcadeState();if(s.tankColors.includes(color)){s.tankColor=color;arcadeSave(s)}return s}
function arcadeTankColor(){const s=arcadeState(),t=TANK_COLORS[s.tankColor]||TANK_COLORS.cyan;return t.color}
function arcadeApplyTheme(){const s=arcadeState(),t=ARCADE_THEMES[s.theme]||ARCADE_THEMES.midnight;document.body.style.background=t.bg;document.body.style.color=t.text;document.documentElement.style.setProperty('--arcade-text',t.text);document.documentElement.style.setProperty('--arcade-canvas',t.canvas);return s}
function arcadeCanvasBackground(){const s=arcadeState(),t=ARCADE_THEMES[s.theme]||ARCADE_THEMES.midnight;return t.canvas}
function arcadeTexturePack(){const s=arcadeState(),t=ARCADE_THEMES[s.theme]||ARCADE_THEMES.midnight;return t.pack||'neon'}
function arcadeSessionSave(game,data){try{localStorage.setItem(`${ARCADE_KEY}:session:${game}`,JSON.stringify(data))}catch{}return data}
function arcadeSessionLoad(game){try{return JSON.parse(localStorage.getItem(`${ARCADE_KEY}:session:${game}`)||'null')}catch{return null}}
function arcadeSessionClear(game){localStorage.removeItem(`${ARCADE_KEY}:session:${game}`)}
function arcadeDayNumber(date=new Date()){return Math.floor(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate())/86400000)}
function arcadeToday(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function arcadeStreakReward(streak){return 400+Math.max(0,streak-1)*300}
function arcadeStreakStatus(){const s=arcadeState(),today=arcadeToday(),last=s.lastStreakClaim,days=last?arcadeDayNumber(new Date())-arcadeDayNumber(new Date(last+'T00:00:00')):0;return {streak:days>1?0:s.streak,claimed:last===today,reward:arcadeStreakReward(days>1?1:Math.max(1,s.streak+1)),nextReward:arcadeStreakReward(days>1?1:Math.max(1,s.streak+1))}}
function arcadeClaimStreak(){const s=arcadeState(),today=arcadeToday();if(s.lastStreakClaim===today)return {claimed:false,reward:0,streak:s.streak,points:s.points};const previous=s.lastStreakClaim?arcadeDayNumber(new Date(s.lastStreakClaim+'T00:00:00')):0;const days=previous?arcadeDayNumber(new Date())-previous:0;s.streak=days===1?s.streak+1:1;const reward=arcadeStreakReward(s.streak);s.points+=reward;s.lastStreakClaim=today;arcadeSave(s);return {claimed:true,reward,streak:s.streak,points:s.points}}
document.addEventListener('DOMContentLoaded',arcadeApplyTheme);




function studyGet(){try{const s=JSON.parse(localStorage.getItem(STUDY_KEY))||{};return {title:s.title||'My Study Quest',notes:s.notes||'',tasks:Array.isArray(s.tasks)?s.tasks:[]}}catch{return {title:'My Study Quest',notes:'',tasks:[]}}}
function studySave(s){localStorage.setItem(STUDY_KEY,JSON.stringify(s));return s}
function studyCompleteTask(id){const s=studyGet(),task=s.tasks.find(t=>t.id===id);if(task&&!task.done){task.done=true;studySave(s);arcadeAddCoins(3,'activity');arcadeAddPoints(5,'studyActivity');arcadeAddXP(25,'studyActivity')}return s}

document.addEventListener('DOMContentLoaded',()=>{if(document.querySelector('.arcade-xp-hud'))return;const hud=document.createElement('div');hud.className='arcade-xp-hud';hud.style.cssText='position:fixed;top:12px;right:12px;z-index:9999;width:min(280px,calc(100vw - 24px));padding:9px 13px;border:1px solid #ffffff55;border-radius:16px;background:#111827dd;color:#fff;font:800 13px system-ui,sans-serif;box-shadow:0 6px 18px #0002;backdrop-filter:blur(7px)';hud.innerHTML='<div class="arcade-xp-label"></div><div class="arcade-xp-track"><i class="arcade-xp-fill"></i></div><div class="arcade-xp-next"></div>';const style=document.createElement('style');style.textContent='.arcade-xp-track{height:8px;margin-top:6px;border-radius:99px;background:#ffffff33;overflow:hidden}.arcade-xp-fill{display:block;height:100%;width:0;border-radius:inherit;background:linear-gradient(90deg,#ffd85e,#ff6fa8,#6ce5ff);transition:width .25s}.arcade-xp-next{margin-top:4px;color:#dbe4ff;font-size:11px;font-weight:700}';document.head.appendChild(style);function render(){const s=arcadeState(),into=s.xp%100;hud.querySelector('.arcade-xp-label').textContent=`⭐ Level ${s.level} · ${s.xp} XP · ${s.points} points`;hud.querySelector('.arcade-xp-fill').style.width=`${into}%`;hud.querySelector('.arcade-xp-next').textContent=`${into}/100 XP to Level ${s.level+1}`}document.body.appendChild(hud);render();setInterval(render,500)});

const PLAY_TIME_KEY='studyQuestPlayTimeV1';
const PLAY_TIME_CAP=30*60;
function playTimeGet(){try{const s=JSON.parse(localStorage.getItem(PLAY_TIME_KEY))||{};return {playSeconds:Math.min(PLAY_TIME_CAP,Math.max(0,Number(s.playSeconds)||0)),studySeconds:Math.max(0,Number(s.studySeconds)||0),sessionSeconds:Math.max(0,Number(s.sessionSeconds)||0)}}catch{return {playSeconds:0,studySeconds:0,sessionSeconds:0}}}
function playTimeSave(s){localStorage.setItem(PLAY_TIME_KEY,JSON.stringify(s));return s}
document.addEventListener('DOMContentLoaded',()=>{
  const onStudy=location.pathname.toLowerCase().endsWith('/study.html')||document.querySelector('.brainstorm');
  const formatTime=(seconds)=>`${Math.floor(seconds/60)}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;
  const style=document.createElement('style');
  style.textContent='.study-time-card{margin:0 0 22px;padding:18px 22px;border:1px solid #dfe3f4;border-radius:22px;background:linear-gradient(135deg,#fff8d8,#e7fff5);box-shadow:0 16px 45px #3f4e9b1a;color:#182044}.study-time-card h2{margin:4px 0 7px}.study-time-card .study-time-number{font-size:34px;font-weight:950;letter-spacing:-.06em}.study-time-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:12px}.play-time-hud{position:fixed;left:12px;bottom:12px;z-index:9999;padding:10px 14px;border-radius:16px;background:#111827eF;color:#fff;font:800 13px system-ui,sans-serif;box-shadow:0 6px 18px #0003}.play-time-lock{position:fixed;inset:0;z-index:10000;display:grid;place-items:center;padding:24px;background:#111827cc;color:#fff;font-family:system-ui,sans-serif;text-align:center}.play-time-lock>div{max-width:430px;padding:28px;border-radius:24px;background:#26305f;box-shadow:0 18px 55px #0005}.play-time-lock h2{margin-top:0}.play-time-lock p{line-height:1.5;color:#e4e9ff}';
  document.head.appendChild(style);
  let time=playTimeGet(),last=Date.now(),running=Boolean(!onStudy&&time.playSeconds>0),locked=false;
  const startingPlaySeconds=time.playSeconds;
  const render=()=>{
    if(onStudy){
      const number=document.querySelector('#study-time-number');
      const status=document.querySelector('#study-time-status');
      const button=document.querySelector('#study-time-toggle');
      if(number)number.textContent=formatTime(time.sessionSeconds);
      if(status)status.innerHTML=`Total study time: <b>${formatTime(time.studySeconds)}</b><br>${time.playSeconds>=PLAY_TIME_CAP?'Play time is full at 30:00. Use some before earning more.':`${formatTime(time.playSeconds)} of 30:00 play time available.`}`;
      if(button)button.textContent=running?'Pause studying':'Start studying';
    }else{
      const hud=document.querySelector('.play-time-hud');
      if(hud)hud.textContent=`🎮 Play time left: ${formatTime(time.playSeconds)}`;
    }
  };
  const tick=()=>{
    const now=Date.now(),elapsed=Math.min(10,Math.floor((now-last)/1000));
    if(elapsed<1){return} last=now;
    if(document.hidden||!running){render();return}
    if(onStudy){
      const available=PLAY_TIME_CAP-time.playSeconds;
      const earned=Math.min(elapsed,Math.max(0,available));
      time.studySeconds+=elapsed;
      time.sessionSeconds+=elapsed;
      time.playSeconds+=earned;
      if(time.playSeconds>=PLAY_TIME_CAP)running=false;
    }else{
      time.playSeconds=Math.max(0,time.playSeconds-elapsed);
      if(time.playSeconds===0){running=false;showLock();}
    }
    playTimeSave(time);render();
  };
  const showLock=()=>{
    if(locked||onStudy)return;
    locked=true;
    const lock=document.createElement('div');lock.className='play-time-lock';lock.innerHTML=`<div><h2>Study time is needed</h2><p>You started this game with <b>${formatTime(startingPlaySeconds)}</b> of play time. Your play time has now run out. Return to Study Quest and spend study time to earn more.</p><a class="button gold" href="study.html">Go to Study Quest</a></div>`;
    document.body.appendChild(lock);
  };
  if(onStudy){
    const hero=document.querySelector('.hero');
    if(hero){
      const card=document.createElement('section');card.className='study-time-card';card.innerHTML='<div class="eyebrow">Study-to-play timer</div><h2>Earn game time by studying</h2><p class="small">Study for one second to earn one second of game time. Game time can never be more than 30 minutes.</p><div class="study-time-number" id="study-time-number">0:00</div><p class="small">Current study session</p><p class="small" id="study-time-status"></p><div class="study-time-actions"><button class="button" id="study-time-toggle" type="button">Start studying</button><button class="button" id="study-time-reset" type="button">Reset session</button><a class="button gold" href="index (1).html">Play games →</a></div></div>';hero.after(card);
      document.querySelector('#study-time-toggle').onclick=()=>{running=!running;last=Date.now();render()};
      document.querySelector('#study-time-reset').onclick=()=>{time.sessionSeconds=0;playTimeSave(time);last=Date.now();render()};
    }
  }else{
    const hud=document.createElement('div');hud.className='play-time-hud';document.body.appendChild(hud);if(!running)showLock();
  }
  render();setInterval(tick,1000);document.addEventListener('visibilitychange',()=>{last=Date.now();render()});
});

