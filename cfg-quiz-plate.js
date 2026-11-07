/* CFG QUIZ POT & PLATE GAMES V1 — browser demo only.
 * Local storage is not an authoritative ledger. Never use this file for cash,
 * real CFG balances, prize settlement, or regulated random outcomes.
 */
(function initCfgQuizPotAndPlate() {
  "use strict";
  const $ = (selector) => document.querySelector(selector);
  if (!$("#cfg-quiz-pot")) return;
  const storageKey = "cfgQuizPotDemoV1", customKey = "cfgQuizCustomQuestionsV1";
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch (_) { return fallback; } };
  const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (_) { return false; } };
  function buildQuestionBank() {
    const bank = [];
    for (let a=1;a<=50;a++) for(let b=1;b<=50;b++) bank.push({id:"add-"+a+"-"+b,category:"Addition",difficulty:"Basic",question:a+" + "+b+" = ?",answer:a+b});
    for (let a=2;a<=50;a++) for(let b=1;b<a;b++) bank.push({id:"sub-"+a+"-"+b,category:"Subtraction",difficulty:"Basic",question:a+" − "+b+" = ?",answer:a-b});
    for (let a=2;a<=20;a++) for(let b=2;b<=20;b++) bank.push({id:"mul-"+a+"-"+b,category:"Multiplication",difficulty:"Basic",question:a+" × "+b+" = ?",answer:a*b});
    for (let a=2;a<=20;a++) for(let b=2;b<=20;b++) bank.push({id:"div-"+(a*b)+"-"+b,category:"Division",difficulty:"Basic",question:(a*b)+" ÷ "+b+" = ?",answer:a});
    return bank;
  }
  const baseBank=buildQuestionBank(), customQuestions=read(customKey,[]), bank=baseBank.concat(Array.isArray(customQuestions)?customQuestions:[]);
  const state=read(storageKey,{points:0,attempts:[]});
  if(!Number.isFinite(state.points))state.points=0;if(!Array.isArray(state.attempts))state.attempts=[];
  const questionEl=$("#quizPotQuestion"),answersEl=$("#quizPotAnswers"),timerEl=$("#quizPotTimer"),progressEl=$("#quizPotProgress"),messageEl=$("#quizPotMessage"),scoreEl=$("#quizPotPoints"),startBtn=$("#quizPotStart"),resultEl=$("#quizPotResult"),historyEl=$("#quizPotHistory"),managerMessage=$("#quizManagerMessage");
  let active=false,ended=true,remaining=60,timerId=null,questions=[],index=0,correct=0,wrong=0;
  function saveState(){write(storageKey,state);scoreEl.textContent=String(state.points);renderHistory();}
  function shuffle(items){const copy=items.slice();for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy;}
  function makeOptions(answer){const values=new Set([answer]);while(values.size<4){const offset=Math.floor(Math.random()*19)-9;values.add(Math.max(0,answer+(offset===0?11:offset)));}return shuffle([...values]);}
  function finish(reason){
    if(ended)return;ended=true;active=false;if(timerId)clearInterval(timerId);timerId=null;
    state.attempts.unshift({date:new Date().toISOString(),correct,wrong,points:correct*2,durationSeconds:60-remaining,reason});state.attempts=state.attempts.slice(0,20);saveState();
    startBtn.disabled=false;startBtn.textContent="Start new quiz";answersEl.replaceChildren();
    questionEl.textContent=reason==="third_wrong"?"Jaribio limesitishwa — makosa matatu.":reason==="timeout"?"Muda umeisha.":"Umemaliza maswali yote.";
    progressEl.textContent="Jaribio limefungwa";messageEl.textContent="Sahihi: "+correct+"/10 · Makosa: "+wrong+" · Pointi: "+(correct*2)+"/20.";
    resultEl.hidden=false;resultEl.textContent="Matokeo: "+correct+" majibu sahihi, "+wrong+" makosa. Umejipatia "+(correct*2)+" Quiz Points za demo.";
  }
  function showQuestion(){
    if(!active||index>=questions.length){finish("completed");return;}
    const item=questions[index];questionEl.textContent=item.question;progressEl.textContent="Swali "+(index+1)+" / 10";answersEl.replaceChildren();
    makeOptions(item.answer).forEach((value,n)=>{const button=document.createElement("button");button.type="button";button.className="quizPotAnswer";button.textContent=String.fromCharCode(65+n)+". "+value;
      button.addEventListener("click",()=>{if(!active)return;if(value===item.answer){correct++;state.points+=2;scoreEl.textContent=String(state.points);}else wrong++;index++;if(wrong>=3){finish("third_wrong");return;}if(index>=10){finish("completed");return;}showQuestion();},{once:true});answersEl.appendChild(button);});
  }
  function startQuiz(){if(active)return;questions=shuffle(bank).slice(0,10);if(questions.length<10){messageEl.textContent="Maswali 10 hayapatikani kwa sasa.";return;}
    active=true;ended=false;remaining=60;index=0;correct=0;wrong=0;startBtn.disabled=true;startBtn.textContent="Quiz inaendelea…";resultEl.hidden=true;resultEl.textContent="";
    messageEl.textContent="Jibu maswali 10 ndani ya sekunde 60. Kosa la tatu linasitisha jaribio.";timerEl.textContent="01:00";showQuestion();
    timerId=setInterval(()=>{if(!active)return;remaining--;timerEl.textContent="00:"+String(Math.max(0,remaining)).padStart(2,"0");if(remaining<=0)finish("timeout");},1000);
  }
  function renderHistory(){if(!historyEl)return;historyEl.replaceChildren();if(!state.attempts.length){historyEl.textContent="Bado hakuna jaribio lililohifadhiwa kwenye kifaa hiki.";return;}
    state.attempts.slice(0,5).forEach(item=>{const row=document.createElement("div");row.className="quizHistoryRow";const date=document.createElement("span");date.textContent=new Date(item.date).toLocaleString();const result=document.createElement("strong");result.textContent=item.correct+"/10 · "+item.points+" pts";row.append(date,result);historyEl.appendChild(row);});}
  startBtn.addEventListener("click",startQuiz);scoreEl.textContent=String(state.points);renderHistory();
  const addForm=$("#quizQuestionForm");
  if(addForm)addForm.addEventListener("submit",event=>{event.preventDefault();const data=new FormData(addForm),prompt=String(data.get("question")||"").trim(),options=[1,2,3,4].map(n=>String(data.get("option"+n)||"").trim()),answerIndex=Number(data.get("correct"));
    if(!prompt||options.some(x=>!x)||![0,1,2,3].includes(answerIndex)){managerMessage.textContent="Jaza swali, majibu manne na jibu sahihi.";return;}
    if(options.some(x=>!Number.isFinite(Number(x)))){managerMessage.textContent="Kwa demo hili, majibu yawe namba.";return;}
    const list=read(customKey,[]);list.push({id:"custom-"+Date.now(),category:"Custom",difficulty:"Basic",question:prompt,answer:Number(options[answerIndex])});write(customKey,list);
    managerMessage.textContent="Swali limehifadhiwa kwenye kifaa hiki. Jumla ya maswali: "+(baseBank.length+list.length)+".";addForm.reset();});
  const plateRows=[[1,"Normal","Haijapangiwa probability"],[2,"Normal","Haijapangiwa probability"],[3,"Normal","Haijapangiwa probability"],[4,"Small Win","Sehemu ya kundi la Winning 35%"],[5,"Fail","Sehemu ya kundi la Fail 63%"],[6,"Fail","Sehemu ya kundi la Fail 63%"],[7,"Normal","Haijapangiwa probability"],[8,"Normal","Haijapangiwa probability"],[9,"Big Win","Sehemu ya kundi la Winning 35%"],[10,"Fail","Fail 2%"],[11,"Normal","Haijapangiwa probability"],[12,"Normal","Haijapangiwa probability"],[13,"Fail","Sehemu ya kundi la Fail 63%"]];
  const plateList=$("#plateProbabilityList");
  if(plateList)plateRows.forEach(([number,outcome,note])=>{const row=document.createElement("div");row.className="plateProbabilityRow";const plate=document.createElement("strong");plate.textContent="Plate "+number;const label=document.createElement("span");label.textContent=outcome;const detail=document.createElement("small");detail.textContent=note;row.append(plate,label,detail);plateList.appendChild(row);});
  const plateMessage=$("#plateSimulatorMessage"),plateStart=$("#plateSimulatorStart");
  if(plateStart){plateStart.disabled=true;plateStart.addEventListener("click",()=>{if(plateMessage)plateMessage.textContent="Round haijawashwa: probability za kila plate ya Normal na mgawanyo wa Small Win/Big Win bado vinahitaji kuidhinishwa.";});}
  const bankCount=$("#quizBankCount");if(bankCount)bankCount.textContent=String(bank.length);
  const managerCount=$("#quizManagerCount");if(managerCount)managerCount.textContent=String(bank.length);
})();
