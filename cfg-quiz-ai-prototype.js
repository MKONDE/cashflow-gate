/* CFG QUIZ AI STUDY ASSISTANT V1 — real server-side AI connection.
 * Browser code contains no provider key. All model requests go through /api/cfg-quiz-assistant.
 */
(function () {
  "use strict";
  const host = document.querySelector("#cfg-quiz-pot");
  if (!host || document.querySelector("#cfgQuizAiPrototype")) return;
  const panel = document.createElement("section");
  panel.id = "cfgQuizAiPrototype";
  panel.className = "card cfgAiPanel";
  panel.innerHTML = `
    <p class="eyebrow">CFG QUIZ · AI STUDY ASSISTANT</p>
    <h3>AI Study Assistant <span class="tag">AI BETA</span></h3>
    <p class="muted">Uliza swali la masomo au chagua mada. Majibu hutengenezwa na AI kupitia server salama ya Cashflow Gate.</p>
    <label for="cfgAiSubject">Somo</label>
    <select id="cfgAiSubject"><option>General Science</option><option>Mathematics</option><option>Biology</option><option>English</option><option>Kiswahili</option><option>Geography</option><option>History</option><option>Agriculture</option><option>Business</option><option>ICT</option></select>
    <label for="cfgAiQuestion">Andika swali lako</label>
    <textarea id="cfgAiQuestion" rows="3" maxlength="600" placeholder="Mfano: Mapambano ni nini?"></textarea>
    <div class="cfgAiActions"><button type="button" id="cfgAiAsk">Uliza Assistant</button><button type="button" id="cfgAiPractice">Nipe swali la mazoezi</button></div>
    <div id="cfgAiReply" class="cfgAiReply" role="status" aria-live="polite">Andika swali kisha bonyeza Uliza Assistant.</div>
    <small class="fine">Usiweke taarifa binafsi. Hakiki majibu muhimu kwa kitabu au mwalimu. Assistant hana ruhusa ya kubadilisha alama, salio au miamala ya CFG.</small>`;
  const style = document.createElement("style");
  style.textContent = `
    .cfgAiPanel{margin-top:18px}.cfgAiPanel h3{margin:0 0 8px;font:700 20px Manrope,sans-serif}
    .cfgAiPanel label{display:block;margin:12px 0 5px;color:var(--muted);font-size:12px}
    .cfgAiPanel select,.cfgAiPanel textarea{width:100%;padding:11px;border:1px solid var(--line);border-radius:9px;background:#0b1016;color:var(--text);font:inherit}
    .cfgAiActions{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
    .cfgAiActions button{border:0;border-radius:9px;padding:11px 14px;background:#176b3a;color:white;font-weight:700}
    .cfgAiActions button:disabled{opacity:.55;cursor:wait}
    .cfgAiReply{margin-top:13px;padding:13px;border:1px solid var(--line);border-radius:10px;background:#0c1117;white-space:pre-wrap;min-height:54px;line-height:1.55}
  `;
  document.head.appendChild(style);
  host.appendChild(panel);
  const subject=panel.querySelector("#cfgAiSubject"),question=panel.querySelector("#cfgAiQuestion");
  const reply=panel.querySelector("#cfgAiReply"),ask=panel.querySelector("#cfgAiAsk"),practice=panel.querySelector("#cfgAiPractice");
  async function request(task){
    const q=question.value.trim();
    if(task==="ask"&&!q){reply.textContent="Tafadhali andika swali kwanza.";return;}
    ask.disabled=true;practice.disabled=true;reply.textContent="Assistant anafikiri… tafadhali subiri.";
    try{
      const response=await fetch("/api/cfg-quiz-assistant",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({subject:subject.value,question:q,task})});
      const data=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(data.error||"Huduma ya AI haipatikani kwa sasa.");
      reply.textContent=data.answer||"Samahani, hakuna jibu lililopatikana.";
    }catch(error){reply.textContent=error.message||"Imeshindikana kuwasiliana na Assistant. Jaribu tena baadaye.";}
    finally{ask.disabled=false;practice.disabled=false;}
  }
  ask.addEventListener("click",()=>request("ask"));
  practice.addEventListener("click",()=>request("practice"));
})();