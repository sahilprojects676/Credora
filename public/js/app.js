let catalogueExpanded = false;

const state = {
  requirements: [],
  answers: {
    requirements: [],
    rewardType: "cashback",
    upiImportance: "sometimes",
    feePreference: "flexible",
    travelFrequency: "sometimes",
    shoppingPreference: "none",
    monthlySpend: {Shopping:10000, Travel:5000, "Bills & Utility":5000, Dining:3000, Fuel:3000, UPI:3000}
  },
  surveyStep: 1,
  cards: [],
  compare: JSON.parse(localStorage.getItem("credoraCompare") || "[]")
};

const requirements = [
  {id:"Travel", icon:"✈", title:"Travel", subtitle:"Make every trip more rewarding", bullets:["Airport lounge access","Flight & hotel rewards","Travel / forex benefits"], color:"purple"},
  {id:"Shopping", icon:"▣", title:"Shopping", subtitle:"Shop more. Earn more.", bullets:["Amazon & Flipkart rewards","Online shopping cashback","Lifestyle offers"], color:"blue"},
  {id:"Bills & Utility", icon:"₹", title:"Bills & Utility", subtitle:"Save on everyday payments", bullets:["Electricity & mobile bills","Fuel benefits","Groceries & essentials"], color:"green"},
  {id:"Dining", icon:"◈", title:"Dining", subtitle:"Get more from eating out", bullets:["Dining rewards","Food delivery offers","Restaurant discounts"], color:"orange"},
  {id:"Fuel", icon:"⛽", title:"Fuel", subtitle:"Make fuel spending count", bullets:["Fuel surcharge waiver","Fuel rewards","Everyday savings"], color:"red"},
  {id:"UPI", icon:"⌁", title:"UPI", subtitle:"Earn on everyday UPI", bullets:["UPI rewards","RuPay support","Everyday payments"], color:"teal"}
];

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

function money(n){ return "₹" + Number(n || 0).toLocaleString("en-IN"); }

const API_BASE = (window.location.port === "5000" || window.location.protocol === "file:")
  ? ""
  : "http://localhost:5000";

async function api(endpoint, options={}){
  const target = API_BASE + endpoint;
  const res = await fetch(target, {headers:{"Content-Type":"application/json"}, ...options});
  if(!res.ok) throw new Error(await res.text());
  return res.json();
}

function renderRequirements(){
  $("#requirementGrid").innerHTML = requirements.map(o => `
    <button class="req-card ${state.requirements.includes(o.id) ? "selected":""}" data-req="${o.id}">
      <span class="req-check">${state.requirements.includes(o.id) ? "✓" : ""}</span>
      <span class="req-icon ${o.color}">${o.icon}</span>
      <span class="req-copy"><b>${o.title}</b><small>${o.subtitle}</small>
      ${o.bullets.map(x=>`<em>✓ ${x}</em>`).join("")}</span>
    </button>`).join("");
  $$(".req-card").forEach(btn => btn.onclick = () => {
    const id = btn.dataset.req;
    state.requirements = state.requirements.includes(id) ? state.requirements.filter(x=>x!==id) : [...state.requirements,id];
    state.answers.requirements = state.requirements;
    renderRequirements();
  });
}

function showSurvey(){
  if(!state.requirements.length){ alert("Please select at least one requirement."); return; }
  $("#survey").classList.remove("hidden");
  document.querySelector("#survey").scrollIntoView({behavior:"smooth"});
  renderSurvey();
}

const surveyQuestions = [
  {title:"Which benefits matter most to you?", sub:"Choose all that apply.", type:"requirements"},
  {title:"What kind of rewards do you prefer?", sub:"Choose the reward style you value most.", type:"choice", key:"rewardType", options:[
    ["cashback","Cashback","Simple and easy to understand"],["rewards","Reward points","Flexible redemption and travel value"]
  ]},
  {title:"How important is UPI to you?", sub:"Think about your regular UPI payments.", type:"choice", key:"upiImportance", options:[
    ["important","Very important","I use UPI for everyday spending"],["sometimes","Sometimes","I use both UPI and cards"],["low","Not important","I mainly use my card directly"]
  ]},
  {title:"How do you feel about annual fees?", sub:"Premium cards can have higher fees but richer benefits.", type:"choice", key:"feePreference", options:[
    ["ltf","I want lifetime-free","Avoid annual fees where possible"],["flexible","I am flexible","Fee is okay if value is higher"],["paid","I want maximum benefits","Comfortable with a premium fee"]
  ]},
  {title:"How often do you travel?", sub:"This changes the weight of travel benefits.", type:"choice", key:"travelFrequency", options:[
    ["rare","Rarely","0–1 trips a year"],["sometimes","Sometimes","2–4 trips a year"],["frequent","Frequently","I travel regularly"]
  ]},
  {title:"Where do you shop most?", sub:"Pick your most common online destination.", type:"choice", key:"shoppingPreference", options:[
    ["amazon","Amazon","I use Amazon frequently"],["flipkart","Flipkart","I use Flipkart frequently"],["none","No preference","I shop across different platforms"]
  ]},
  {title:"What is your approximate monthly spend?", sub:"Use rough numbers for the value estimate.", type:"spend"},
  {title:"Ready to see your matches?", sub:"We will compare the current project catalogue against your answers.", type:"review"}
];

function renderSurvey(){
  const q = surveyQuestions[state.surveyStep-1];
  $("#progressBar").style.width = `${state.surveyStep/8*100}%`;
  $("#progressLabel").textContent = `Question ${state.surveyStep} of 8`;

  let body = "";
  if(q.type==="requirements"){
    body = `<div class="survey-options">${requirements.map(o=>`
      <button class="survey-choice ${state.requirements.includes(o.id)?"selected":""}" data-sq="${o.id}">
        <span class="req-icon ${o.color}">${o.icon}</span><span><b>${o.title}</b><small>${o.subtitle}</small></span><i>${state.requirements.includes(o.id)?"✓":""}</i>
      </button>`).join("")}</div>`;
  } else if(q.type==="choice"){
    body = `<div class="choice-list">${q.options.map(x=>`
      <button class="choice-row ${state.answers[q.key]===x[0]?"selected":""}" data-key="${q.key}" data-value="${x[0]}">
        <span class="radio">${state.answers[q.key]===x[0]?"✓":""}</span><span><b>${x[1]}</b><small>${x[2]}</small></span>
      </button>`).join("")}</div>`;
  } else if(q.type==="spend"){
    body = `<div class="spend-grid">${["Shopping","Travel","Bills & Utility","Dining","Fuel","UPI"].map(k=>`
      <label><b>${k}</b><div><span>₹</span><input type="number" min="0" data-spend="${k}" value="${state.answers.monthlySpend[k]}"></div></label>`).join("")}</div>`;
  } else {
    body = `<div class="review"><div><b>${state.requirements.length}</b><span>selected needs</span></div><div><b>${state.answers.rewardType==="cashback"?"Cashback":"Points"}</b><span>reward style</span></div><div><b>${state.answers.feePreference==="ltf"?"Lifetime-free":"Flexible"}</b><span>fee preference</span></div></div><p class="small-note">Your answers are used to rank cards. No account is created and nothing is submitted to a bank.</p>`;
  }

  $("#surveyCard").innerHTML = `
    <h3>${q.title}</h3><p>${q.sub}</p>${body}
    <div class="survey-actions">
      <button class="secondary-btn" id="surveyBack" ${state.surveyStep===1?"disabled":""}>← Back</button>
      <button class="primary-btn" id="surveyNext">${state.surveyStep===8?"Show My Matches":"Continue"} <b>→</b></button>
    </div>`;

  $$(".survey-choice").forEach(b=>b.onclick=()=>{ 
    const id=b.dataset.sq;
    state.requirements=state.requirements.includes(id)?state.requirements.filter(x=>x!==id):[...state.requirements,id];
    state.answers.requirements=state.requirements; renderSurvey();
  });
  $$(".choice-row").forEach(b=>b.onclick=()=>{state.answers[b.dataset.key]=b.dataset.value; renderSurvey();});
  $$("[data-spend]").forEach(i=>i.oninput=()=>state.answers.monthlySpend[i.dataset.spend]=Number(i.value)||0);
  $("#surveyBack").onclick=()=>{if(state.surveyStep>1){state.surveyStep--;renderSurvey();}};
  $("#surveyNext").onclick=async()=>{
    if(state.surveyStep<8){state.surveyStep++;renderSurvey();}
    else await getRecommendations();
  };
}

async function getRecommendations(){
  try{
    const data = await api("/api/recommend",{method:"POST",body:JSON.stringify(state.answers)});
    $("#survey").classList.add("hidden");
    $("#results").classList.remove("hidden");
    renderResults(data.results);
    $("#results").scrollIntoView({behavior:"smooth"});
  }catch(e){alert("Could not calculate recommendations. Make sure the backend is running.");console.error(e);}
}

function cardMarkup(item, showScore=true){
  const c=item.card||item;
  const checked=state.compare.some(x=>x.id===c.id);
  return `<article class="card-tile">
    <div class="visual" style="--card:${c.color||"#163a70"}"><span class="mini-chip"></span><span>${c.network}</span><strong>${c.name}</strong><small>4826 •••• •••• 0926</small></div>
    <div class="tile-body">
      <div class="tile-top"><div><small class="issuer">${c.issuer}</small><h3>${c.name}</h3></div>${showScore&&item.score?`<b class="score">${item.score}% match</b>`:""}</div>
      <p>${c.description}</p>
      <div class="stats"><span><b>${money(c.annualFee)}</b><small>Annual fee</small></span><span><b>${c.primaryRewardRate}%</b><small>Reward</small></span><span><b>${c.travelScore}/10</b><small>Travel</small></span></div>
      ${item.reasons?`<div class="reasons">${item.reasons.map(r=>`<span>✓ ${r}</span>`).join("")}</div>`:""}
      <div class="tile-actions"><button class="secondary-btn details" data-id="${c.id}">View Details</button><button class="compare-btn ${checked?"active":""}" data-compare="${c.id}">${checked?"✓ Comparing":"Compare"}</button></div>
    </div>
  </article>`;
}

function bindCardButtons(){
  $$(".details").forEach(b=>b.onclick=()=>openDetails(b.dataset.id));
  $$(".compare-btn").forEach(b=>b.onclick=()=>toggleCompare(b.dataset.compare));
}

function renderResults(results){
  const best=results[0];
  $("#resultBest").innerHTML=best?`<div class="best"><div><span>BEST MATCH</span><h3>${best.card.name}</h3><p>${best.reasons?.[0]||best.card.tag}</p></div><strong>${best.score}%<small>match</small></strong></div>`:"";
  $("#resultsGrid").innerHTML=results.map(x=>cardMarkup(x)).join("");
  bindCardButtons();
}

function renderCatalogue(){
  const grid=$("#cardGrid");
  const showMore=$("#showMoreCards");
  if(!grid)return;

  const visibleCards=catalogueExpanded ? state.cards : state.cards.slice(0,6);
  grid.innerHTML=visibleCards.map(c=>cardMarkup(c,false)).join("");

  if(showMore){
    const remaining=state.cards.length-6;
    showMore.classList.toggle("hidden",state.cards.length<=6);
    showMore.textContent=catalogueExpanded
      ? "Show Less ↑"
      : `Show More${remaining>0 ? ` (${remaining} more)` : ""} ↓`;
  }

  bindCardButtons();
}

async function loadCards(resetView=true){
  try{
    const params=new URLSearchParams();
    const search=$("#searchInput").value.trim(), category=$("#categoryFilter").value;
    if(search)params.set("search",search); if(category)params.set("category",category);
    if(resetView)catalogueExpanded=false;
    state.cards=await api("/api/cards?"+params.toString());
    renderCatalogue();
  }catch(e){
    console.error("Credora API error:", e);
    $("#cardGrid").innerHTML=`<div class="error">
      <b>Unable to load cards.</b>
      <span>Please make sure the Credora backend is running at
      <code>http://localhost:5000</code>.</span>
    </div>`;
    $("#showMoreCards")?.classList.add("hidden");
  }
}

function toggleCompare(id){
  const card=state.cards.find(x=>x.id===id) || findFromVisible(id);
  if(!card)return;
  const exists=state.compare.some(x=>x.id===id);

  if(exists){
    state.compare=state.compare.filter(x=>x.id!==id);
  }else{
    if(state.compare.length>=3){
      alert("You can compare up to 3 cards.");
      return;
    }
    state.compare=[...state.compare,card];
  }

  localStorage.setItem("credoraCompare",JSON.stringify(state.compare));

  // Browse Cards uses a dedicated Compare page.
  if(window.location.pathname.toLowerCase().endsWith("browse.html") && !exists){
    window.location.href="compare.html";
    return;
  }

  if($("#cardGrid")) renderCatalogue();
  if($("#compareArea")) renderCompare();
}
function findFromVisible(id){
  return [...state.compare].find(x=>x.id===id);
}


async function loadCompareCardList(){
  const list=$("#compareCardList");
  if(!list)return;

  try{
    const params=new URLSearchParams();
    const search=$("#compareSearchInput")?.value.trim()||"";
    const category=$("#compareCategoryFilter")?.value||"";
    if(search)params.set("search",search);
    if(category)params.set("category",category);

    const cards=await api("/api/cards?"+params.toString());
    state.compareCatalogue=cards;
    renderCompareCardList();
  }catch(e){
    console.error("Credora compare card list error:",e);
    list.innerHTML=`<div class="error"><b>Unable to load card list.</b><span>Please make sure the Credora backend is running at <code>http://localhost:5000</code>.</span></div>`;
  }
}

function renderCompareCardList(){
  const list=$("#compareCardList");
  if(!list)return;

  const cards=state.compareCatalogue||[];
  const selectedCount=state.compare.length;

  const limit=$("#compareLimit");
  if(limit)limit.textContent=`${selectedCount} / 3 selected`;

  if(!cards.length){
    list.innerHTML=`<div class="empty">No cards found.</div>`;
    return;
  }

  list.innerHTML=cards.map(c=>{
    const selected=state.compare.some(x=>x.id===c.id);
    const disabled=!selected && state.compare.length>=3;

    return `<article class="compare-select-card ${selected?"selected":""}">
      <div class="compare-select-visual" style="--card:${c.color||"#163a70"}">
        <span class="mini-chip"></span>
        <span>${c.network}</span>
        <strong>${c.name}</strong>
      </div>
      <div class="compare-select-body">
        <div>
          <small class="issuer">${c.issuer}</small>
          <h3>${c.name}</h3>
        </div>
        <div class="compare-select-stats">
          <span><b>${money(c.annualFee)}</b><small>Fee</small></span>
          <span><b>${c.primaryRewardRate}%</b><small>Reward</small></span>
          <span><b>${c.upiScore}/10</b><small>UPI</small></span>
        </div>
        <button class="compare-select-btn ${selected?"selected":""}" 
          data-select-compare="${c.id}" ${disabled?"disabled":""}>
          ${selected?"✓ Selected":disabled?"3 Cards Selected":"Add to Compare"}
        </button>
      </div>
    </article>`;
  }).join("");

  $$("[data-select-compare]").forEach(b=>b.onclick=()=>{
    const id=b.dataset.selectCompare;
    const card=(state.compareCatalogue||[]).find(x=>x.id===id);
    if(!card)return;

    const exists=state.compare.some(x=>x.id===id);

    if(exists){
      state.compare=state.compare.filter(x=>x.id!==id);
    }else{
      if(state.compare.length>=3){
        alert("You can compare up to 3 cards.");
        return;
      }
      state.compare=[...state.compare,card];
    }

    localStorage.setItem("credoraCompare",JSON.stringify(state.compare));
    renderCompareCardList();
    renderCompare();
  });
}

function renderCompare(){
  const area=$("#compareArea");
  if(!area)return;

  const clear=$("#clearCompare");
  if(clear)clear.disabled=!state.compare.length;

  if(!state.compare.length){
    area.innerHTML=`<div class="empty compare-empty">
      <h3>No cards selected</h3>
      <p>Go to Browse Cards and select up to three cards to compare.</p>
      <a href="browse.html" class="primary-btn">Browse Cards →</a>
    </div>`;
    return;
  }

  area.innerHTML=`<div class="table-wrap"><table><thead><tr><th>Feature</th>${state.compare.map(c=>`<th><button class="remove" data-remove="${c.id}">×</button><span class="table-card" style="background:${c.color}">${c.network}</span><b>${c.name}</b></th>`).join("")}</tr></thead><tbody>
  ${row("Issuer",state.compare.map(c=>c.issuer))}
  ${row("Annual fee",state.compare.map(c=>money(c.annualFee)))}
  ${row("Primary reward",state.compare.map(c=>c.primaryRewardRate+"%"))}
  ${row("Reward type",state.compare.map(c=>c.rewardType==="cashback"?"Cashback":"Reward points"))}
  ${row("Travel fit",state.compare.map(c=>c.travelScore+"/10"))}
  ${row("UPI fit",state.compare.map(c=>c.upiScore+"/10"))}
  ${row("Best for",state.compare.map(c=>c.tag))}
  </tbody></table></div>`;

  $$("[data-remove]").forEach(b=>b.onclick=()=>{
    state.compare=state.compare.filter(c=>c.id!==b.dataset.remove);
    localStorage.setItem("credoraCompare",JSON.stringify(state.compare));
    renderCompare();
  });
}
function clearCompare(){
  state.compare=[];
  localStorage.removeItem("credoraCompare");
  renderCompare();
  if($("#compareCardList")) renderCompareCardList();
}
function row(label,values){return `<tr><td>${label}</td>${values.map(v=>`<td>${v}</td>`).join("")}</tr>`;}

async function openDetails(id){
  try{
    const c=await api("/api/cards/"+id);
    $("#modalContent").innerHTML=`<div class="modal-card" style="--card:${c.color}">
      <div class="modal-visual"><span class="mini-chip"></span><span>${c.network}</span><b>${c.name}</b><small>4826 •••• •••• 0926</small></div>
      <small class="issuer">${c.issuer}</small><h2>${c.name}</h2><p>${c.description}</p>
      <div class="modal-stats"><span><b>${money(c.annualFee)}</b>Annual fee</span><span><b>${c.primaryRewardRate}%</b>Reward</span><span><b>${c.travelScore}/10</b>Travel</span><span><b>${c.upiScore}/10</b>UPI</span></div>
      <h4>Highlights</h4><ul>${c.highlights.map(x=>`<li>✓ ${x}</li>`).join("")}</ul>
      <div class="proscons"><div><h4>Pros</h4>${c.pros.map(x=>`<p>+ ${x}</p>`).join("")}</div><div><h4>Things to check</h4>${c.cons.map(x=>`<p>• ${x}</p>`).join("")}</div></div>
      <div class="warning">Demo/reference data. Verify current issuer terms before applying.</div>
    </div>`;
    $("#detailModal").classList.remove("hidden");
  }catch(e){alert("Unable to load card details.");}
}

function init(){
  const path = window.location.pathname.toLowerCase();
  const isFinder = path.endsWith("/finder.html") || path.endsWith("finder.html");

  const year=$("#year"); if(year) year.textContent=new Date().getFullYear();

  if(isFinder){
    renderRequirements();
    $("#startSurvey").onclick=showSurvey;
    $("#retake").onclick=()=>{
      state.surveyStep=1;
      $("#results").classList.add("hidden");
      $("#survey").classList.remove("hidden");
      renderSurvey();
      $("#survey").scrollIntoView({behavior:"smooth"});
    };
    $("#compareSelected").onclick=()=>window.location.href="compare.html";
  }

  // Catalogue and comparison exist on the home page.
  if($("#cardGrid")){
    loadCards();
    $("#searchInput").oninput=()=>loadCards(true);
    $("#categoryFilter").onchange=()=>loadCards(true);
    $("#showMoreCards")?.addEventListener("click",()=>{
      catalogueExpanded=!catalogueExpanded;
      renderCatalogue();
    });
  }
  if($("#compareArea")){
    renderCompare();
    loadCompareCardList();

    $("#compareSearchInput")?.addEventListener("input",loadCompareCardList);
    $("#compareCategoryFilter")?.addEventListener("change",loadCompareCardList);

    $("#clearCompare")?.addEventListener("click",()=>{
      clearCompare();
      renderCompareCardList();
    });
  }

  $$("[data-scroll]").forEach(b=>b.onclick=()=>{
    const target=document.querySelector(b.dataset.scroll);
    if(target) target.scrollIntoView({behavior:"smooth"});
  });

  $$("[data-close]").forEach(x=>x.onclick=()=>$("#detailModal")?.classList.add("hidden"));

  const toggle=$("#mobileToggle");
  if(toggle) toggle.onclick=()=>$("#navMenu")?.classList.toggle("open");
  $$("#navMenu a").forEach(a=>a.onclick=()=>$("#navMenu")?.classList.remove("open"));

  // Footer category shortcuts.
  $$("[data-category]").forEach(a=>a.onclick=()=>{
    const cat=a.dataset.category;
    const select=$("#categoryFilter");
    if(select){select.value=cat; loadCards();}
  });
}
document.addEventListener("DOMContentLoaded",init);

