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
