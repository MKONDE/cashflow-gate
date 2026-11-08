/* CFG QUIZ AI ASSISTANT V1 — local prototype only.
 * This is a transparent scripted demo, NOT a connected AI model.
 * No network calls, provider keys, wallet access, scoring changes or payments.
 */
(function () {
  "use strict";
  const host = document.querySelector("#cfg-quiz-pot");
  if (!host || document.querySelector("#cfgQuizAiPrototype")) return;
  const panel = document.createElement("section");
  panel.id = "cfgQuizAiPrototype";
  panel.className = "card cfgAiPanel";
  panel.innerHTML = `
    <p class="eyebrow">CFG QUIZ · AI ASSISTANT PREVIEW</p>
    <h3>AI Study Assistant <span class="tag">DEMO</span></h3>
    <p class="muted">Uliza swali la masomo au chagua mada. Hii ni prototype ya majibu ya mfano; bado haijaunganishwa na AI model halisi.</p>
    <label for="cfgAiSubject">Somo</label>
    <select id="cfgAiSubject"><option>General Science</option><option>Mathematics</option><option>Biology</option><option>English</option><option>Kiswahili</option><option>Geography</option><option>History</option><option>Agriculture</option><option>Business</option><option>ICT</option></select>
    <label for="cfgAiQuestion">Andika swali lako</label>
    <textarea id="cfgAiQuestion" rows="3" maxlength="600" placeholder="Mfano: Photosynthesis ni nini?"></textarea>
    <div class="cfgAiActions"><button type="button" id="cfgAiAsk">Uliza Assistant</button><button type="button" id="cfgAiPractice">Nipe swali la mazoezi</button></div>
    <div id="cfgAiReply" class="cfgAiReply" role="status" aria-live="polite">Majibu ya mfano yataonekana hapa.</div>
    <small class="fine">Usiweke taarifa binafsi. Majibu haya ni ya majaribio na yanahitaji kuhakikiwa na mwalimu au chanzo cha kuaminika.</small>`;
  const style = document.createElement("style");
  style.textContent = `
    .cfgAiPanel{margin-top:18px}.cfgAiPanel h3{margin:0 0 8px;font:700 20px Manrope,sans-serif}
    .cfgAiPanel label{display:block;margin:12px 0 5px;color:var(--muted);font-size:12px}
    .cfgAiPanel select,.cfgAiPanel textarea{width:100%;padding:11px;border:1px solid var(--line);border-radius:9px;background:#0b1016;color:var(--text);font:inherit}
    .cfgAiActions{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
    .cfgAiActions button{border:0;border-radius:9px;padding:11px 14px;background:#176b3a;color:white;font-weight:700}
    .cfgAiReply{margin-top:13px;padding:13px;border:1px solid var(--line);border-radius:10px;background:#0c1117;white-space:pre-wrap;min-height:54px}
  `;
  document.head.appendChild(style);
  host.appendChild(panel);
  const subject = panel.querySelector("#cfgAiSubject");
  const question = panel.querySelector("#cfgAiQuestion");
  const reply = panel.querySelector("#cfgAiReply");
  const answer = (q, s) => {
    const t=q.toLowerCase();
    if (/photosynthesis|usanisinuru/.test(t)) return "Mfano wa maelezo: Usanisinuru ni mchakato ambao mimea hutumia mwanga wa jua, maji na hewa ya ukaa kutengeneza chakula (glucose), huku ikitoa oksijeni.\nKumbuka: hakiki maelezo haya kwenye kitabu cha somo.";
    if (/fraction|sehemu|\d+\s*\/\s*\d+/.test(t)) return "Mfano wa hesabu: sehemu (fraction) huonyesha sehemu ya kitu kizima. Namba ya juu ni numerator; ya chini ni denominator. Mfano 1/2 ni sehemu moja kati ya sehemu mbili zilizo sawa.";
    if (/cash flow|mtiririko wa fedha/.test(t)) return "Cash flow ni ufuatiliaji wa fedha zinazoingia na kutoka katika biashara kwa kipindi fulani. Tofautisha mapato yanayoingia na matumizi yanayotoka.";
    return "Nimepokea swali lako kuhusu "+s+". Katika prototype hii bado hakuna muunganisho wa AI halisi, kwa hiyo siwezi kutoa jibu lililothibitishwa kwa swali hili. Jaribu mada ya msingi au hakiki kwa kitabu/mwalimu.";
  };
  panel.querySelector("#cfgAiAsk").addEventListener("click",()=>{
    const q=question.value.trim();
    if(!q){reply.textContent="Tafadhali andika swali kwanza.";return;}
    reply.textContent="Somo: "+subject.value+"\nSwali: "+q+"\n\n"+answer(q,subject.value);
  });
  panel.querySelector("#cfgAiPractice").addEventListener("click",()=>{
    const samples={
      "Mathematics":"Swali la mfano: 3/4 + 1/4 = ?\nJibu: 1.",
      "Biology":"Swali la mfano: Ni sehemu gani ya mmea hufyonza maji kutoka ardhini?\nJibu: Mizizi.",
      "English":"Practice: Choose the correct verb: She ___ to school every day. (go/goes)\nAnswer: goes.",
      "Kiswahili":"Swali la mfano: Taja aina moja ya nomino.\nJibu: Nomino ya pekee, ya kawaida au ya jamii.",
      "General Science":"Swali la mfano: Maji huganda katika nyuzi joto ngapi kwa kipimo cha Celsius?\nJibu: 0°C katika shinikizo la kawaida.",
      "Geography":"Swali la mfano: Ramani hutumika kufanya nini?\nJibu: Kuonyesha maeneo na vipengele vya uso wa dunia.",
      "History":"Swali la mfano: Kwa nini tunasoma historia?\nJibu: Ili kuelewa matukio ya zamani na athari zake.",
      "Agriculture":"Swali la mfano: Kwa nini udongo unahitaji maji?\nJibu: Maji husaidia ukuaji wa mimea na usafirishaji wa virutubisho.",
      "Business":"Swali la mfano: Bajeti ya biashara husaidia nini?\nJibu: Kupanga mapato na matumizi.",
      "ICT":"Swali la mfano: CPU ni kifupi cha nini?\nJibu: Central Processing Unit."
    };
    reply.textContent="Swali la mazoezi — "+subject.value+"\n"+(samples[subject.value]||"Chagua somo ili kupata swali la mfano.");
  });
})();