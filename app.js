const markets=[{id:"gold",name:"Gold",symbol:"XAU/USD",short:"AU",price:2350,change:1.2,type:"commodity"},{id:"silver",name:"Silver",symbol:"XAG/USD",short:"AG",price:28.42,change:-.34,type:"commodity"},{id:"maize",name:"Maize",symbol:"MAIZE",short:"MZ",price:312.5,change:.72,type:"commodity"},{id:"rice",name:"Rice",symbol:"RICE",short:"RC",price:418.2,change:-.18,type:"commodity"},{id:"bitcoin",name:"Bitcoin",symbol:"BTC/USD",short:"₿",price:67420,change:2.31,type:"crypto"},{id:"ethereum",name:"Ethereum",symbol:"ETH/USD",short:"Ξ",price:3520.8,change:.85,type:"crypto"},{id:"eurusd",name:"EUR / USD",symbol:"EURUSD",short:"€$",price:1.0842,change:-.12,type:"forex"},{id:"gbpusd",name:"GBP / USD",symbol:"GBPUSD",short:"£$",price:1.2714,change:.23,type:"forex"}];
const STORAGE_KEY="cashflowGatePracticeV1";
const freshState=()=>({balance:10000,selected:"gold",positions:[],xp:0,history:[]});
function loadState(){try{const saved=JSON.parse(localStorage.getItem(STORAGE_KEY));if(saved&&typeof saved.balance==="number"&&Array.isArray(saved.positions)&&Array.isArray(saved.history))return {...freshState(),...saved};}catch(e){}return freshState();}
const s=loadState();const fmt=n=>Number(n).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});const get=id=>markets.find(m=>m.id===id);
function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(s));}catch(e){message("Browser storage is unavailable; this practice session may not persist.");}}
function logEvent(text){s.history.unshift({id:Date.now().toString()+Math.random().toString(16).slice(2),time:new Date().toLocaleString(),text});s.history=s.history.slice(0,30);save();renderHistory();}
function renderHistory(){let root=document.querySelector("#practiceHistory");if(!root){root=document.createElement("section");root.id="practiceHistory";root.className="panel";root.innerHTML='<h3>Practice history <small>Saved on this device</small></h3><div class="historyRows"></div>';const anchor=document.querySelector("#positions")?.parentElement||document.querySelector("main");if(anchor)anchor.appendChild(root);}const rows=root.querySelector(".historyRows");rows.replaceChildren();if(!s.history.length){const p=document.createElement("p");p.className="muted";p.textContent="No practice activity yet. Buy a virtual position or record a youth challenge to start.";rows.appendChild(p);return;}s.history.forEach(item=>{const row=document.createElement("div");row.className="position";const left=document.createElement("div"),title=document.createElement("b"),time=document.createElement("small");title.textContent=item.text;time.textContent=item.time;left.append(title,time);row.appendChild(left);rows.appendChild(row);});}
function renderMarkets(filter="all"){const root=document.querySelector("#marketList");root.innerHTML="";markets.filter(m=>filter==="all"||m.type===filter).forEach(m=>{const b=document.createElement("button");b.className="market"+(s.selected===m.id?" selected":"");b.type="button";b.innerHTML='<span class="asset"><span class="coin">'+m.short+'</span><span><b>'+m.name+'</b><small>'+m.symbol+' · '+m.type.toUpperCase()+'</small></span></span><span class="quote"><b>'+fmt(m.price)+'</b><small class="'+(m.change>=0?"green":"red")+'">'+(m.change>=0?"+":"")+m.change.toFixed(2)+'%</small></span>';b.onclick=()=>select(m.id);root.appendChild(b);});}
function select(id){s.selected=id;const m=get(id);document.querySelector("#selectedName").textContent=m.name;document.querySelector("#selectedPrice").textContent=fmt(m.price);const c=document.querySelector("#selectedChange");c.textContent=(m.change>=0?"+":"")+m.change.toFixed(2)+"%";c.className=m.change>=0?"green":"red";renderMarkets(document.querySelector(".filter.active").dataset.filter);save();}
function stats(){document.querySelector("#balance").innerHTML=fmt(s.balance)+' <small>CFG (DEMO)</small>';const pnl=s.positions.reduce((n,p)=>n+p.units*(get(p.market).price-p.entry),0),el=document.querySelector("#pnl");el.innerHTML=(pnl>=0?"+":"")+fmt(pnl)+' <small>CFG (DEMO)</small>';el.className=pnl>=0?"green":"red";document.querySelector("#openCount").textContent=s.positions.length+" open positions";document.querySelector("#xp").textContent=s.xp+" XP";save();}
function renderPositions(){const root=document.querySelector("#positions");root.innerHTML="";document.querySelector("#empty").style.display=s.positions.length?"none":"block";s.positions.forEach(p=>{const m=get(p.market),pnl=p.units*(m.price-p.entry),row=document.createElement("div");row.className="position";row.innerHTML='<div><b>'+m.name+' · Virtual Buy</b><small>'+p.units.toFixed(5)+' units @ '+fmt(p.entry)+'</small></div><div style="text-align:right"><b class="'+(pnl>=0?"green":"red")+'">'+(pnl>=0?"+":"")+fmt(pnl)+' CFG (DEMO)</b><button data-close="'+p.id+'">Close position</button></div>';root.appendChild(row);});root.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>close(b.dataset.close));}
function message(t){document.querySelector("#tradeMessage").textContent=t;}
function buy(){const amount=Number(document.querySelector("#amount").value),m=get(s.selected);if(!Number.isFinite(amount)||amount<=0){message("Enter a valid practice amount.");return;}if(amount>s.balance){message("Insufficient virtual balance. Reduce the amount.");return;}s.balance-=amount;s.positions.push({id:Date.now().toString()+Math.random().toString(16).slice(2),market:m.id,entry:m.price,units:amount/m.price,cost:amount});logEvent("Practice Buy · "+m.name+" · "+fmt(amount)+" CFG (DEMO)");message("Virtual Buy recorded for "+m.name+". No real order was sent.");stats();renderPositions();}
function close(id){const i=s.positions.findIndex(p=>p.id===id);if(i<0)return;const p=s.positions[i],m=get(p.market),proceeds=p.units*m.price,pnl=proceeds-p.cost;s.balance+=proceeds;s.xp+=pnl>=0?10:2;s.positions.splice(i,1);logEvent("Position closed · "+m.name+" · "+(pnl>=0?"+":"")+fmt(pnl)+" CFG (DEMO) simulated P/L");message("Practice position closed: "+(pnl>=0?"+":"")+fmt(pnl)+" CFG (DEMO). Simulation only.");stats();renderPositions();}
document.querySelectorAll(".filter").forEach(b=>b.onclick=()=>{document.querySelectorAll(".filter").forEach(x=>x.classList.toggle("active",x===b));renderMarkets(b.dataset.filter);});
document.querySelector("#buy").onclick=buy;document.querySelector("#sell").onclick=()=>{const p=[...s.positions].reverse().find(p=>p.market===s.selected);if(!p){message("No open practice position for this market. Use Practice Buy first.");return;}close(p.id);};
document.querySelector("#plus").onclick=()=>{const e=document.querySelector("#amount");e.value=Math.min(10000,(Number(e.value)||0)+100);};document.querySelector("#minus").onclick=()=>{const e=document.querySelector("#amount");e.value=Math.max(1,(Number(e.value)||0)-100);};
document.querySelectorAll("[data-pick]").forEach(b=>b.onclick=()=>{s.xp+=5;const answer="Practice prediction recorded: "+b.dataset.pick.toUpperCase()+". +5 demo XP. No real settlement or prize is active.";document.querySelector("#predictionMessage").textContent=answer;logEvent("Youth challenge · "+b.dataset.pick.toUpperCase()+" · +5 demo XP");stats();});
document.querySelector("#reset").onclick=()=>{if(!confirm("Reset virtual balance, positions, XP and practice history on this device?"))return;Object.assign(s,freshState());message("Demo reset. Virtual balance restored; practice history cleared.");document.querySelector("#predictionMessage").textContent="Choose a prediction to record your practice answer.";stats();renderPositions();renderHistory();select(s.selected);};
renderMarkets();select(s.selected);stats();renderPositions();renderHistory();

// Additive Cashflow Gate V1 modules — demo only; no real-money functionality.
function initRoiDemo(){
 const principal=document.querySelector("#roiPrincipal"),term=document.querySelector("#roiTerm"),scenario=document.querySelector("#roiScenario");
 const changeEl=document.querySelector("#roiChange"),endEl=document.querySelector("#roiEnd"),disclosure=document.querySelector("#roiDisclosure");
 if(!principal||!term||!scenario||!changeEl||!endEl)return;
 const money=n=>"TSh "+Number(n).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
 function update(){
  const amount=Number(principal.value),rate=Number(scenario.value);
  if(!Number.isFinite(amount)||amount<0){changeEl.textContent="Enter a valid amount";endEl.textContent="—";return;}
  const delta=amount*rate/100;
  changeEl.textContent=(delta>0?"+":delta<0?"−":"")+money(Math.abs(delta));
  changeEl.className=delta>0?"green":delta<0?"red":"";
  endEl.textContent=money(amount+delta);
  const duration=term.value==="custom"?"a custom duration":(["7","14","21"].includes(term.value)?term.value+" days":term.value+(term.value==="1"?" month":" months"));
  disclosure.textContent="Illustrative "+rate.toFixed(2)+"% total scenario over "+duration+". This is not a forecast or promise. Actual results can be zero or negative; no real contract, account, deposit, payout or withdrawal is active.";
 }
 [principal,term,scenario].forEach(el=>{el.addEventListener("input",update);el.addEventListener("change",update);});update();
}
initRoiDemo();


// CFG PLAY + CFG PREDICT — additive, free-to-play demo only.
(function initPlayPredict(){
 const playKey="cfgPlayDemoV1";let play={points:0,answeredOn:""};
 try{const saved=JSON.parse(localStorage.getItem(playKey));if(saved&&typeof saved.points==="number")play={...play,...saved};}catch(e){}
 const pointsEl=document.querySelector("#playPoints"),quizMessage=document.querySelector("#quizMessage");
 if(pointsEl)pointsEl.textContent=String(play.points);
 const now=new Date();const today=[now.getFullYear(),String(now.getMonth()+1).padStart(2,"0"),String(now.getDate()).padStart(2,"0")].join("-");
 const answerButtons=[...document.querySelectorAll("[data-answer]")];
 if(play.answeredOn===today){if(quizMessage)quizMessage.textContent="Umeshajibu changamoto ya leo kwenye kifaa hiki. Rudi kesho kwa swali jipya.";answerButtons.forEach(b=>b.disabled=true);}
 answerButtons.forEach(button=>button.addEventListener("click",()=>{
  if(play.answeredOn===today)return;
  const correct=button.dataset.answer==="a";play.answeredOn=today;if(correct)play.points+=10;
  try{localStorage.setItem(playKey,JSON.stringify(play));}catch(e){}
  if(pointsEl)pointsEl.textContent=String(play.points);
  if(quizMessage)quizMessage.textContent=correct?"Sahihi! Umeongeza pointi 10 za CFG PLAY demo.":"Si sahihi. Jibu sahihi ni Cash-flow statement. Jaribio la leo limeisha.";
  answerButtons.forEach(b=>b.disabled=true);
 }));
 const predictKey="cfgPredictDemoV1",predictMessage=document.querySelector("#marketPredictMessage");
 let prediction={date:"",choice:""};try{prediction=JSON.parse(localStorage.getItem(predictKey))||prediction;}catch(e){}
 const picks=[...document.querySelectorAll("[data-market-pick]")];
 if(prediction.date===today&&prediction.choice){if(predictMessage)predictMessage.textContent="Utabiri wako wa leo umerekodiwa: "+prediction.choice.toUpperCase()+". Raundi hii ni ya mazoezi tu.";picks.forEach(b=>b.disabled=true);}
 picks.forEach(button=>button.addEventListener("click",()=>{
  if(prediction.date===today)return;
  prediction={date:today,choice:button.dataset.marketPick};try{localStorage.setItem(predictKey,JSON.stringify(prediction));}catch(e){}
  if(predictMessage)predictMessage.textContent="Utabiri wa demo umerekodiwa: "+prediction.choice.toUpperCase()+". Hakuna dau wala malipo.";picks.forEach(b=>b.disabled=true);
 }));
})();


// CFG PLAY Chess practice — legal moves, check, checkmate, castling and en passant.
(function initChessPractice(){
 const boardEl=document.querySelector("#chessBoard"),turnEl=document.querySelector("#chessTurn"),messageEl=document.querySelector("#chessMessage"),resetEl=document.querySelector("#chessReset");
 if(!boardEl||!turnEl||!messageEl||!resetEl)return;
 const glyph={w:{K:"♔",Q:"♕",R:"♖",B:"♗",N:"♘",P:"♙"},b:{K:"♚",Q:"♛",R:"♜",B:"♝",N:"♞",P:"♟"}};
 let board,turn,selected,rights,ep,gameOver;
 const copyBoard=b=>b.map(row=>row.map(p=>p?{...p}:null));
 function fresh(){board=Array.from({length:8},()=>Array(8).fill(null));const back=["R","N","B","Q","K","B","N","R"];for(let c=0;c<8;c++){board[0][c]={side:"b",type:back[c]};board[1][c]={side:"b",type:"P"};board[6][c]={side:"w",type:"P"};board[7][c]={side:"w",type:back[c]};}turn="w";selected=null;ep=null;gameOver=false;rights={wK:true,wQ:true,bK:true,bQ:true};messageEl.textContent="White aanza. Chagua kete kisha eneo la kwenda.";render();}
 function inside(r,c){return r>=0&&r<8&&c>=0&&c<8;}
 function pathClear(b,r,c,nr,nc){const dr=Math.sign(nr-r),dc=Math.sign(nc-c);let y=r+dr,x=c+dc;while(y!==nr||x!==nc){if(b[y][x])return false;y+=dr;x+=dc;}return true;}
 function kingPos(b,side){for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(b[r][c]?.side===side&&b[r][c].type==="K")return{r,c};return null;}
 function attacked(b,r,c,by){for(let y=0;y<8;y++)for(let x=0;x<8;x++){const p=b[y][x];if(!p||p.side!==by)continue;const dr=r-y,dc=c-x,ar=Math.abs(dr),ac=Math.abs(dc);switch(p.type){case"P":if(dr===(by==="w"?-1:1)&&ac===1)return true;break;case"N":if((ar===2&&ac===1)||(ar===1&&ac===2))return true;break;case"K":if(ar<=1&&ac<=1&&(ar+ac)>0)return true;break;case"R":if((dr===0||dc===0)&&pathClear(b,y,x,r,c))return true;break;case"B":if(ar===ac&&ar>0&&pathClear(b,y,x,r,c))return true;break;case"Q":if((dr===0||dc===0||ar===ac)&&(ar+ac)>0&&pathClear(b,y,x,r,c))return true;break;}}return false;}
 function inCheck(b,side){const k=kingPos(b,side);return !k||attacked(b,k.r,k.c,side==="w"?"b":"w");}
 function pseudo(b,r,c,state){const p=b[r][c],moves=[];if(!p)return moves;const add=(nr,nc,extra={})=>{if(!inside(nr,nc))return;const t=b[nr][nc];if(t?.side===p.side||t?.type==="K")return;moves.push({r:nr,c:nc,...extra});};const dr=p.side==="w"?-1:1;
  if(p.type==="P"){if(inside(r+dr,c)&&!b[r+dr][c]){add(r+dr,c);const start=p.side==="w"?6:1;if(r===start&&!b[r+2*dr][c])add(r+2*dr,c,{double:true});}for(const dc of [-1,1]){const nr=r+dr,nc=c+dc;if(!inside(nr,nc))continue;if(b[nr][nc]&&b[nr][nc].side!==p.side&&b[nr][nc].type!=="K")add(nr,nc);else if(state.ep&&state.ep.r===nr&&state.ep.c===nc)add(nr,nc,{enPassant:true});}return moves;}
  if(p.type==="N"){for(const [a,d] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]])add(r+a,c+d);return moves;}
  if(p.type==="K"){for(let a=-1;a<=1;a++)for(let d=-1;d<=1;d++)if(a||d)add(r+a,c+d);
   const row=p.side==="w"?7:0,enemy=p.side==="w"?"b":"w";
   if(r===row&&c===4&&!inCheck(b,p.side)){if(state.rights[p.side+"K"]&&!b[row][5]&&!b[row][6]&&b[row][7]?.type==="R"&&b[row][7]?.side===p.side&&!attacked(b,row,5,enemy)&&!attacked(b,row,6,enemy))moves.push({r:row,c:6,castle:"K"});if(state.rights[p.side+"Q"]&&!b[row][1]&&!b[row][2]&&!b[row][3]&&b[row][0]?.type==="R"&&b[row][0]?.side===p.side&&!attacked(b,row,3,enemy)&&!attacked(b,row,2,enemy))moves.push({r:row,c:2,castle:"Q"});}return moves;}
  const dirs=p.type==="R"?[[1,0],[-1,0],[0,1],[0,-1]]:p.type==="B"?[[1,1],[1,-1],[-1,1],[-1,-1]]:[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
  for(const [a,d] of dirs){let nr=r+a,nc=c+d;while(inside(nr,nc)){if(b[nr][nc]){if(b[nr][nc].side!==p.side&&b[nr][nc].type!=="K")add(nr,nc);break;}add(nr,nc);nr+=a;nc+=d;}}return moves;
 }
 function apply(b,from,move,state){const p=b[from.r][from.c],captured=b[move.r][move.c];b[from.r][from.c]=null;if(move.enPassant)b[move.r+(p.side==="w"?1:-1)][move.c]=null;if(move.castle){const row=from.r;if(move.castle==="K"){b[row][5]=b[row][7];b[row][7]=null;}else{b[row][3]=b[row][0];b[row][0]=null;}}b[move.r][move.c]=p;if(p.type==="P"&&(move.r===0||move.r===7))p.type="Q";
  if(p.type==="K"){state.rights[p.side+"K"]=false;state.rights[p.side+"Q"]=false;}if(p.type==="R"){if(from.r===7&&from.c===0)state.rights.wQ=false;if(from.r===7&&from.c===7)state.rights.wK=false;if(from.r===0&&from.c===0)state.rights.bQ=false;if(from.r===0&&from.c===7)state.rights.bK=false;}
  if(captured?.type==="R"){if(move.r===7&&move.c===0)state.rights.wQ=false;if(move.r===7&&move.c===7)state.rights.wK=false;if(move.r===0&&move.c===0)state.rights.bQ=false;if(move.r===0&&move.c===7)state.rights.bK=false;}
  state.ep=p.type==="P"&&Math.abs(move.r-from.r)===2?{r:(move.r+from.r)/2,c:from.c}:null;
 }
 function legalMoves(r,c){const p=board[r][c];if(!p)return[];const state={rights:{...rights},ep:ep?{...ep}:null};return pseudo(board,r,c,state).filter(m=>{const b=copyBoard(board),s={rights:{...rights},ep:ep?{...ep}:null};apply(b,{r,c},m,s);return !inCheck(b,p.side);});}
 function allLegal(side){const out=[];for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(board[r][c]?.side===side)for(const m of legalMoves(r,c))out.push({from:{r,c},move:m});return out;}
 function render(){boardEl.innerHTML="";for(let r=0;r<8;r++)for(let c=0;c<8;c++){const cell=document.createElement("button");cell.type="button";cell.className="chessCell "+((r+c)%2?"dark":"light");cell.setAttribute("role","gridcell");cell.setAttribute("aria-label",String.fromCharCode(97+c)+(8-r));if(selected?.r===r&&selected?.c===c)cell.classList.add("chosen");if(board[r][c])cell.textContent=glyph[board[r][c].side][board[r][c].type];cell.addEventListener("click",()=>tap(r,c));boardEl.appendChild(cell);}turnEl.textContent=(turn==="w"?"White":"Black")+" to move"+(inCheck(board,turn)?" · CHECK":"");}
 function tap(r,c){if(gameOver)return;const p=board[r][c];if(selected){const options=legalMoves(selected.r,selected.c),move=options.find(m=>m.r===r&&m.c===c);if(move){const mover=turn,state={rights:{...rights},ep:ep?{...ep}:null};apply(board,selected,move,state);rights=state.rights;ep=state.ep;turn=turn==="w"?"b":"w";selected=null;const check=inCheck(board,turn),remaining=allLegal(turn).length;if(check&&remaining===0){gameOver=true;messageEl.textContent=(mover==="w"?"White":"Black")+" wins by checkmate!";}else if(!check&&remaining===0){gameOver=true;messageEl.textContent="Stalemate — draw."; }else messageEl.textContent=check?(turn==="w"?"White":"Black")+" is in check. Tafuta njia ya kujinasua.":(mover==="w"?"White":"Black")+" moved. Zamu ya "+(turn==="w"?"White":"Black")+".";render();return;}if(p?.side===turn){selected={r,c};messageEl.textContent=legalMoves(r,c).length?"Kete imechaguliwa. Maeneo halali yataonekana kwa kubofya.":"Kete hii haina mwendo halali sasa.";render();return;}selected=null;messageEl.textContent="Mwendo huo si halali au ungeacha mfalme kwenye check.";render();return;}if(p?.side===turn){selected={r,c};messageEl.textContent=legalMoves(r,c).length?"Kete imechaguliwa. Chagua eneo la kwenda.":"Kete hii haina mwendo halali sasa.";render();}else messageEl.textContent="Chagua kete ya upande unaocheza.";}
 resetEl.addEventListener("click",fresh);fresh();
})();

// CFG PLAY Football Manager — fictional local season simulator; no financial integration.
(function initFootballManager(){
 const clubEl=document.querySelector("#fmClub"),formationEl=document.querySelector("#fmFormation"),tacticEl=document.querySelector("#fmTactic"),playEl=document.querySelector("#fmPlay"),tableEl=document.querySelector("#fmTable"),messageEl=document.querySelector("#fmMessage");
 if(!clubEl||!formationEl||!tacticEl||!playEl||!tableEl||!messageEl)return;
 const clubs={tabora:{name:"Tabora United",strength:72},coast:{name:"Coast Rangers",strength:69},lake:{name:"Lake Stars",strength:75}};
 const opponents=[{name:"Highland FC",strength:73},{name:"City Athletic",strength:70},{name:"Savannah SC",strength:68},{name:"Harbour FC",strength:74},{name:"Mountain Rovers",strength:71},{name:"Valley United",strength:69}];
 const key="cfgPlayFootballManagerV1",fresh=()=>({season:1,played:0,points:0,wins:0,draws:0,losses:0,goalsFor:0,goalsAgainst:0,club:"tabora"});
 let state=fresh();try{const saved=JSON.parse(localStorage.getItem(key));if(saved&&Number.isInteger(saved.played)&&Number.isInteger(saved.points)&&clubs[saved.club])state={...fresh(),...saved};}catch(e){}
 const save=()=>{try{localStorage.setItem(key,JSON.stringify(state));}catch(e){}};
 const el=id=>document.querySelector("#"+id);
 function render(){el("fmSeason").textContent=String(state.season);el("fmPoints").textContent=String(state.points);const club=clubs[state.club],bonus=formationEl.value==="attacking"?2:formationEl.value==="defensive"?1:0;el("fmStrength").textContent=String(club.strength+bonus);
 const rows=[{name:club.name,pts:state.points,gf:state.goalsFor,ga:state.goalsAgainst},...opponents.map((o,i)=>({name:o.name,pts:Math.max(0,12-i*2),gf:12-i,ga:9+i}))].sort((a,b)=>b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga));
 tableEl.replaceChildren();rows.forEach((r,i)=>{const row=document.createElement("div");row.className="fmRow";const rank=document.createElement("span"),name=document.createElement("b"),pts=document.createElement("strong");rank.textContent=String(i+1);name.textContent=r.name;pts.textContent=r.pts+" pts";row.append(rank,name,pts);tableEl.appendChild(row);});}
 clubEl.value=state.club;clubEl.addEventListener("change",()=>{state.club=clubEl.value;save();render();});[formationEl,tacticEl].forEach(x=>x.addEventListener("change",render));
 playEl.addEventListener("click",()=>{if(state.played>=6){state.season++;state.played=0;state.points=0;state.wins=0;state.draws=0;state.losses=0;state.goalsFor=0;state.goalsAgainst=0;messageEl.textContent="New demo season started. Club record reset.";save();render();return;}
 const club=clubs[state.club],op=opponents[state.played%opponents.length];let strength=club.strength+(formationEl.value==="attacking"?3:formationEl.value==="defensive"?1:0);if(tacticEl.value==="press")strength+=formationEl.value==="attacking"?3:-1;if(tacticEl.value==="counter")strength+=formationEl.value==="defensive"?3:1;
 const edge=(strength-op.strength)/12,roll=Math.random()+edge,scored=Math.max(0,Math.min(5,Math.floor(Math.random()*3)+(roll>.65?1:0))),conceded=Math.max(0,Math.min(5,Math.floor(Math.random()*3)+(roll<.25?1:0)));
 state.played++;state.goalsFor+=scored;state.goalsAgainst+=conceded;let result;if(scored>conceded){state.wins++;state.points+=3;result="WIN";}else if(scored===conceded){state.draws++;state.points++;result="DRAW";}else{state.losses++;result="LOSS";}
 messageEl.textContent=club.name+" "+scored+"–"+conceded+" "+op.name+" · "+result+". Fixture "+state.played+"/6.";save();render();});render();
})();

// CFG Plate Games — equal-probability demo simulator; no stakes, payouts or wallet access.
(function initPlateSimulator(){
 const list=document.querySelector("#plateProbabilityList");
 const button=document.querySelector("#plateSimulatorStart");
 const message=document.querySelector("#plateSimulatorMessage");
 if(!list||!button||!message)return;
 const plates=[
  {n:1,result:"Normal"},{n:2,result:"Normal"},{n:3,result:"Normal"},
  {n:4,result:"Small Win"},{n:5,result:"Fail"},{n:6,result:"Fail"},
  {n:7,result:"Normal"},{n:8,result:"Normal"},{n:9,result:"Big Win"},
  {n:10,result:"Fail"},{n:11,result:"Normal"},{n:12,result:"Normal"},{n:13,result:"Fail"}
 ];
 const ticketCount=1300, ticketsPerPlate=100;
 const percent=(ticketsPerPlate/ticketCount*100).toFixed(4)+"%";
 plates.forEach(p=>{
  const row=document.createElement("div");row.className="plateProbabilityRow";
  const name=document.createElement("b");name.textContent="Plate "+p.n;
  const outcome=document.createElement("span");outcome.textContent=p.result;
  const chance=document.createElement("strong");chance.textContent=percent+" · 1/13";
  row.append(name,outcome,chance);list.appendChild(row);
 });
 function secureIndex(max){
  if(!globalThis.crypto?.getRandomValues)throw new Error("Secure random source is unavailable in this browser.");
  const range=0x100000000,limit=Math.floor(range/max)*max;
  const word=new Uint32Array(1);
  do{crypto.getRandomValues(word);}while(word[0]>=limit);
  return word[0]%max;
 }
 button.addEventListener("click",()=>{
  try{
   const chosen=plates[secureIndex(plates.length)];
   message.textContent="Matokeo ya demo: Plate "+chosen.n+" — "+chosen.result+". Kila plate ilikuwa na nafasi sawa ya 1/13 (7.6923%).";
  }catch(error){message.textContent="Droo haikuweza kufanyika: "+error.message;}
 });
})();
