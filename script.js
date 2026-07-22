/* ==========================================================================
   ARC Guide V3 — script.js FIXED
   Part 1/3
   Safe DOM + Utils + State + Checklist + Bots
   ========================================================================== */

(() => {
"use strict";

/* =============================== Utils =============================== */

const $ = (sel, ctx = document) => ctx?.querySelector?.(sel) || null;
const $$ = (sel, ctx = document) => ctx ? [...ctx.querySelectorAll(sel)] : [];

const prefersReducedMotion =
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

const STORAGE_KEY = "arcGuide.onboarding.v1";


function escapeHTML(str = "") {
    return String(str).replace(/[&<>"']/g, c => ({
        "&":"&amp;",
        "<":"&lt;",
        ">":"&gt;",
        '"':"&quot;",
        "'":"&#39;"
    }[c]));
}


function loadProgress() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
        return {};
    }
}


function saveProgress(data) {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(data)
        );
    } catch {}
}


async function fetchJSON(path) {
    try {
        const res = await fetch(path, {
            cache:"no-cache"
        });

        if(!res.ok)
            throw new Error(res.status);

        return {
            ok:true,
            data:await res.json()
        };

    } catch(err){

        console.error(
            "ARC Guide gagal load:",
            path,
            err
        );

        return {
            ok:false,
            data:null
        };
    }
}


function renderSkeleton(el,count=3){

    if(!el) return;

    el.innerHTML =
        Array.from(
            {length:count},
            ()=>`
            <div class="skeleton skeleton-card"></div>
            `
        ).join("");
}


function renderError(el,msg,retry){

    if(!el) return;

    el.innerHTML=`
    <div class="error-box">
        <p>${msg}</p>
        <button class="btn btn-secondary" data-retry>
        Coba lagi
        </button>
    </div>
    `;

    el.querySelector("[data-retry]")
    ?.addEventListener(
        "click",
        retry
    );
}


/* =============================== Icons =============================== */


const ICONS={

music:
`<svg viewBox="0 0 24 24">
<path d="M9 18V5l12-2v13"/>
<circle cx="6" cy="18" r="3"/>
<circle cx="18" cy="16" r="3"/>
</svg>`,

trophy:
`<svg viewBox="0 0 24 24">
<path d="M8 21h8M12 17v4"/>
<path d="M7 4h10v5a5 5 0 0 1-10 0V4Z"/>
</svg>`,

ticket:
`<svg viewBox="0 0 24 24">
<path d="M3 9a2 2 0 0 0 0 4v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3a2 2 0 0 1 0-4V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3Z"/>
</svg>`,

check:
`<svg viewBox="0 0 24 24">
<path d="M20 6 9 17l-5-5"/>
</svg>`

};


/* =============================== Store =============================== */


const store={

onboarding:[],
bots:[],
channels:null,
faq:[],
events:[],
staff:[]

};



/* =============================== Bubble =============================== */


function spawnBubbles(){

const holder=$("#heroBubbles");

if(!holder || prefersReducedMotion)
return;


const amount =
window.innerWidth < 640 ? 10:18;


for(let i=0;i<amount;i++){

const b=document.createElement("span");

b.className="bubble";

const size=
4+Math.random()*12;


b.style.width=size+"px";
b.style.height=size+"px";
b.style.left=Math.random()*100+"%";

holder.appendChild(b);

}

}



/* =============================== Checklist =============================== */


function renderChecklist(steps=[]){

const box=$("#homeChecklist");

if(!box)
return;


const progress=loadProgress();


box.innerHTML=
steps.slice(0,4)
.map(step=>{

const done=!!progress[step.id];

return `

<li class="checklist-item ${done?"done":""}"
data-step-id="${step.id}"
>

<span class="check-circle">
${ICONS.check}
</span>

<div>

<b>
${escapeHTML(step.title)}
</b>

<p>
${escapeHTML(step.short||"")}
</p>

</div>

</li>

`;

})
.join("");



$$(".checklist-item",box)
.forEach(item=>{

item.addEventListener(
"click",
()=>toggleStep(
item.dataset.stepId,
steps
)
);

});


updateProgressBar(steps);

}




function toggleStep(id,steps){

const data=loadProgress();

data[id]=!data[id];

saveProgress(data);


renderChecklist(steps);

renderSteps(steps);

}



function updateProgressBar(steps){

const data=loadProgress();

const done=
steps.filter(
s=>data[s.id]
).length;


const pct=
steps.length?
Math.round(done/steps.length*100)
:0;


const fill=$("#progressFill");
const label=$("#progressLabel");


if(fill)
fill.style.width=pct+"%";


if(label)
label.textContent=
`${done}/${steps.length} selesai`;

}



function renderSteps(steps=[]){

const box=$("#stepsList");

if(!box)
return;


const data=loadProgress();


box.innerHTML=
steps.map((s,i)=>`

<div class="step-card">

<span class="step-index">
${data[s.id]?"✓":i+1}
</span>

<div>

<h3>
${escapeHTML(s.title)}
</h3>

<p>
${escapeHTML(s.description||"")}
</p>

</div>

</div>

`).join("");

}



/* =============================== BOT =============================== */


function renderBotCards(list=[],target){

const box=$(target);

if(!box)
return;


box.innerHTML=
list.map(bot=>`

<div class="card feature-card"
data-id="${bot.id}"
>

<div class="card-icon">
${ICONS[bot.icon]||""}
</div>


<h3>
${escapeHTML(bot.name)}
</h3>


<p>
${escapeHTML(bot.tagline||bot.function||"")}
</p>


</div>

`).join("");


bindBotCards(box,list);

}



function bindBotCards(box,list){

$$(".feature-card",box)
.forEach(card=>{

card.addEventListener(
"click",
()=>openBotModal(
list.find(
x=>x.id===card.dataset.id
)
)
);

});

}



function openBotModal(bot){

if(!bot)
return;


const modal=$("#botModal");

if(!modal)
return;


$("#botModalTitle")?.replaceChildren(
document.createTextNode(bot.name)
);


$("#botModalDesc")?.replaceChildren(
document.createTextNode(
bot.function||""
)
);


modal.classList.add("open");

}



function closeBotModal(){

$("#botModal")
?.classList.remove("open");

}


$("#botModalClose")
?.addEventListener(
"click",
closeBotModal
);
/* =============================== LOAD DATA =============================== */


async function loadOnboarding(){

const home=$("#homeChecklist");

renderSkeleton(home,4);


const res=
await fetchJSON(
"data/onboarding.json"
);


if(!res.ok){

renderError(
home,
"Gagal memuat onboarding",
loadOnboarding
);

return;

}



store.onboarding=
res.data.steps||[];


renderChecklist(
store.onboarding
);


renderSteps(
store.onboarding
);


}




async function loadBots(){

renderSkeleton(
$("#homeFeatureGrid"),
4
);


renderSkeleton(
$("#botGrid"),
4
);



const res=
await fetchJSON(
"data/bots.json"
);



if(!res.ok){

renderError(
$("#botGrid"),
"Gagal memuat bot",
loadBots
);

return;

}



store.bots=
res.data.bots||[];



renderBotCards(
store.bots,
"#homeFeatureGrid"
);



renderBotCards(
store.bots,
"#botGrid"
);


}





async function loadChannels(){


const res=
await fetchJSON(
"data/channels.json"
);



if(!res.ok){

return;

}



store.channels=res.data;



renderRules(
res.data.rules||[]
);



renderChannels(
res.data.categories||[]
);


}




async function loadFAQ(){


const res=
await fetchJSON(
"data/faq.json"
);



if(!res.ok)
return;



store.faq=
res.data.faq||[];


renderFAQ(
store.faq
);



}





async function loadEvents(){


const res=
await fetchJSON(
"data/events.json"
);



if(!res.ok)
return;



store.events=
res.data.events||[];



renderEvents(
store.events
);


}




async function loadStaff(){


const res=
await fetchJSON(
"data/staff.json"
);



if(!res.ok)
return;



store.staff=
res.data.staff||[];


renderStaff(
store.staff
);



}





/* =============================== SCROLL =============================== */


function initScroll(){


const links=
$$("[data-nav]");



if(!links.length)
return;



window.addEventListener(
"scroll",
()=>{


const y=
window.scrollY+100;



links.forEach(link=>{


const target=
$(link.hash);


if(!target)
return;



if(
target.offsetTop<=y &&
target.offsetTop+target.offsetHeight>y
){

links.forEach(x=>
x.classList.remove("active")
);


link.classList.add(
"active"
);

}



});


});



}





/* =============================== REVEAL =============================== */


function initReveal(){


const items=
$(".reveal")
?
$$(".reveal")
:
[];



items.forEach(
el=>el.classList.add(
"in-view"
)
);


}





/* =============================== HERO =============================== */


function initStart(){

$("#startNowBtn")
?.addEventListener(
"click",
()=>{

$("#panduan")
?.scrollIntoView({
behavior:"smooth"
});

}

);

}





/* =============================== MAIN =============================== */


async function init(){


console.log(
"%cARC Guide V3 Loaded",
"color:#59d7ff;font-size:18px"
);



spawnBubbles();


initSearch();


initScroll();


initReveal();


initStart();



await Promise.allSettled([


loadOnboarding(),

loadBots(),

loadChannels(),

loadFAQ(),

loadEvents(),

loadStaff()


]);



console.log(
"ARC Guide siap."
);


}





if(
document.readyState==="loading"
){

document.addEventListener(
"DOMContentLoaded",
init
);


}else{

init();

}



})();
