/* ==========================================================================
   ARC Guide V3 — script.js FINAL
   Part 1/3
   ========================================================================== */

(() => {
"use strict";


/* =============================== Utils =============================== */


const $ = (selector, ctx = document) =>
    ctx ? ctx.querySelector(selector) : null;


const $$ = (selector, ctx = document) =>
    ctx ? Array.from(ctx.querySelectorAll(selector)) : [];


const prefersReducedMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;



const STORAGE_KEY =
    "arcGuide.onboarding.v1";



function escapeHTML(value = "") {

    return String(value).replace(/[&<>"']/g, char => ({
        "&":"&amp;",
        "<":"&lt;",
        ">":"&gt;",
        '"':"&quot;",
        "'":"&#39;"
    }[char]));

}



function loadProgress(){

    try {

        return JSON.parse(
            localStorage.getItem(STORAGE_KEY)
        ) || {};

    } catch {

        return {};

    }

}



function saveProgress(data){

    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(data)
        );

    } catch {}

}



async function fetchJSON(path){

    try {

        const response =
            await fetch(path, {
                cache:"no-cache"
            });


        if(!response.ok)
            throw new Error(
                response.status
            );


        return {
            ok:true,
            data:await response.json()
        };


    } catch(error){

        console.error(
            "ARC Guide gagal:",
            path,
            error
        );


        return {
            ok:false,
            data:null
        };

    }

}



function renderSkeleton(element, count = 3){

    if(!element)
        return;


    element.innerHTML =
        Array.from(
            {
                length:count
            },
            () =>
            `
            <div class="skeleton skeleton-card"></div>
            `
        ).join("");

}



function renderError(element, message, retry){

    if(!element)
        return;


    element.innerHTML = `

    <div class="error-box">

        <p>
        ${message}
        </p>


        <button class="btn btn-secondary"
        data-retry>
        Coba lagi
        </button>

    </div>

    `;


    element
    .querySelector("[data-retry]")
    ?.addEventListener(
        "click",
        retry
    );

}



/* =============================== State =============================== */


const store = {

    onboarding:[],
    bots:[],
    channels:null,
    faq:[],
    events:[],
    staff:[]

};




/* =============================== Icons =============================== */


const ICONS = {


check:
`
<svg viewBox="0 0 24 24"
fill="none"
stroke="currentColor"
stroke-width="3">

<path d="M20 6L9 17l-5-5"/>

</svg>
`,


music:
`
<svg viewBox="0 0 24 24"
fill="none"
stroke="currentColor">

<path d="M9 18V5l12-2v13"/>

<circle cx="6" cy="18" r="3"/>

<circle cx="18" cy="16" r="3"/>

</svg>
`,


trophy:
`
<svg viewBox="0 0 24 24"
fill="none"
stroke="currentColor">

<path d="M8 21h8"/>
<path d="M12 17v4"/>
<path d="M7 4h10v5a5 5 0 0 1-10 0V4Z"/>

</svg>
`,


ticket:
`
<svg viewBox="0 0 24 24"
fill="none"
stroke="currentColor">

<path d="M3 9a2 2 0 0 0 0 4v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3a2 2 0 0 1 0-4V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3Z"/>

</svg>
`

};




/* =============================== Bubbles =============================== */


function spawnBubbles(){

    const holder =
        $("#heroBubbles");


    if(!holder || prefersReducedMotion)
        return;



    const amount =
        window.innerWidth < 640 ? 10 : 18;



    for(let i = 0; i < amount; i++){

        const bubble =
            document.createElement("span");


        bubble.className =
            "bubble";


        const size =
            5 + Math.random()*12;


        bubble.style.width =
            `${size}px`;


        bubble.style.height =
            `${size}px`;


        bubble.style.left =
            `${Math.random()*100}%`;


        holder.appendChild(bubble);

    }

}
/* =============================== Checklist =============================== */


function renderChecklist(steps = []){

    const box = $("#homeChecklist");

    if(!box)
        return;


    const progress = loadProgress();


    box.innerHTML =
        steps.slice(0,4)
        .map(step => {

            const done =
                !!progress[step.id];


            return `

            <li class="checklist-item ${done ? "done" : ""}"
            data-step-id="${step.id}">

                <span class="check-circle">
                    ${ICONS.check}
                </span>


                <div class="check-text">

                    <b>
                    ${escapeHTML(step.title)}
                    </b>


                    <p>
                    ${escapeHTML(step.short || "")}
                    </p>

                </div>

            </li>

            `;

        })
        .join("");



    $$(".checklist-item", box)
    .forEach(item => {

        item.addEventListener(
            "click",
            () => {

                toggleStep(
                    item.dataset.stepId,
                    steps
                );

            }
        );

    });



    updateProgressBar(steps);

}




function toggleStep(id, steps){

    const data =
        loadProgress();


    data[id] =
        !data[id];


    saveProgress(data);


    renderChecklist(steps);

    renderSteps(steps);

}




function updateProgressBar(steps){

    const data =
        loadProgress();


    const done =
        steps.filter(
            step => data[step.id]
        ).length;


    const percent =
        steps.length
        ?
        Math.round(
            done / steps.length * 100
        )
        :
        0;



    const fill =
        $("#progressFill");


    const label =
        $("#progressLabel");



    if(fill)
        fill.style.width =
        `${percent}%`;



    if(label)
        label.textContent =
        `${done}/${steps.length} selesai`;

}




function renderSteps(steps = []){

    const box =
        $("#stepsList");


    if(!box)
        return;



    const progress =
        loadProgress();



    box.innerHTML =
        steps.map((step,index)=>`

        <div class="step-card">

            <span class="step-index">

            ${
                progress[step.id]
                ?
                "✓"
                :
                index + 1
            }

            </span>


            <div>

                <h3>
                ${escapeHTML(step.title)}
                </h3>


                <p>
                ${escapeHTML(step.description || "")}
                </p>

            </div>

        </div>

        `).join("");

}




/* =============================== Bots =============================== */


function renderBotCards(
    bots = [],
    target
){

    const box =
        $(target);


    if(!box)
        return;



    box.innerHTML =
        bots.map(bot => `

        <div class="card feature-card"
        data-bot-id="${bot.id}">


            <div class="card-icon">

                ${ICONS[bot.icon] || ""}

            </div>



            <h3>

            ${escapeHTML(bot.name)}

            </h3>



            <p>

            ${escapeHTML(
                bot.tagline ||
                bot.function ||
                ""
            )}

            </p>


        </div>

        `)
        .join("");



    bindBotCards(
        box,
        bots
    );

}




function bindBotCards(box,bots){

    $$(".feature-card",box)
    .forEach(card=>{


        card.addEventListener(
            "click",
            ()=>{


                const bot =
                    bots.find(
                        x =>
                        x.id ===
                        card.dataset.botId
                    );


                openBotModal(bot);


            }
        );


    });

}




function openBotModal(bot){

    if(!bot)
        return;


    const modal =
        $("#botModal");


    if(!modal)
        return;



    $("#botModalTitle")
    ?.replaceChildren(
        document.createTextNode(
            bot.name
        )
    );



    $("#botModalDesc")
    ?.replaceChildren(
        document.createTextNode(
            bot.function || ""
        )
    );



    modal.classList.add(
        "open"
    );

}




function closeBotModal(){

    $("#botModal")
    ?.classList.remove(
        "open"
    );

}




/* =============================== Events =============================== */


function formatEventDate(date){

    try{

        return new Date(date)
        .toLocaleString(
            "id-ID",
            {
                day:"numeric",
                month:"long",
                hour:"2-digit",
                minute:"2-digit"
            }
        );


    }catch{

        return date || "-";

    }

}




function eventCardHTML(event){

return `

<div class="event-card">


<div class="event-banner">

<span>
${escapeHTML(event.game || "")}
</span>


<h3>
${escapeHTML(event.name || "Event")}
</h3>

</div>



<div class="event-body">


<p>
${escapeHTML(event.description || "")}
</p>



<div class="event-meta">


<div>
<b>Hadiah</b>
${escapeHTML(event.prize || "-")}
</div>


<div>
<b>Host</b>
${escapeHTML(event.host || "-")}
</div>


<div>
<b>Jadwal</b>
${formatEventDate(event.date)}
</div>


</div>



<div class="countdown"
data-time="${event.date}">

Loading...

</div>


</div>


</div>

`;

}



function renderEvents(events = []){


$("#eventPreviewList")
?.replaceChildren();



$("#eventPreviewList")
?.insertAdjacentHTML(
"beforeend",
events.slice(0,2)
.map(eventCardHTML)
.join("")
);



$("#eventFullList")
?.insertAdjacentHTML(
"beforeend",
events.map(eventCardHTML)
.join("")
);



startCountdown();

}




let countdownTimer;


function startCountdown(){

clearInterval(
countdownTimer
);


countdownTimer =
setInterval(()=>{


$$("[data-time]")
.forEach(el=>{


const target =
new Date(
el.dataset.time
)
.getTime();



const diff =
target - Date.now();



if(diff <= 0){

el.textContent =
"Dimulai";

return;

}



const h =
Math.floor(
diff / 3600000
);


const m =
Math.floor(
diff % 3600000 / 60000
);


const s =
Math.floor(
diff % 60000 / 1000
);



el.textContent =
`${h}j ${m}m ${s}d`;


});


},1000);

}/* =============================== Rules =============================== */


function renderRules(rules = []){

    const box = $("#rulesList");

    if(!box)
        return;


    box.innerHTML =
    rules.map((rule,index)=>`

    <div class="rule-item">

        <strong>
        ${index + 1}.
        </strong>

        <span>
        ${escapeHTML(rule)}
        </span>

    </div>

    `).join("");

}




/* =============================== Channels =============================== */


function renderChannels(categories = []){

    const box =
        $("#channelsList");


    if(!box)
        return;



    box.innerHTML =
    categories.map(category=>`

    <div class="channel-group">


        <h3>
        ${escapeHTML(category.name)}
        </h3>



        ${
            (category.channels || [])
            .map(channel=>`

            <div class="channel-item">


                <b>
                ${escapeHTML(channel.name)}
                </b>


                <p>
                ${escapeHTML(
                    channel.description || ""
                )}
                </p>


            </div>


            `).join("")
        }


    </div>


    `).join("");

}





/* =============================== FAQ =============================== */


function renderFAQ(items = []){

    const box =
        $("#faqList");


    if(!box)
        return;



    box.innerHTML =
    items.map(item=>`

    <div class="accordion-item">


        <button class="accordion-trigger">


            <span>
            ${escapeHTML(item.question)}
            </span>


            <span>
            ▼
            </span>


        </button>



        <div class="accordion-panel">


            <p>
            ${escapeHTML(item.answer)}
            </p>


        </div>


    </div>


    `).join("");




    $$(".accordion-trigger",box)
    .forEach(button=>{


        button.addEventListener(
            "click",
            ()=>{


                const parent =
                    button.closest(
                        ".accordion-item"
                    );


                parent.classList.toggle(
                    "open"
                );


                const panel =
                    parent.querySelector(
                        ".accordion-panel"
                    );


                if(panel){

                    panel.style.maxHeight =
                    parent.classList.contains("open")
                    ?
                    panel.scrollHeight + "px"
                    :
                    "";

                }


            }
        );


    });



}





/* =============================== Staff =============================== */


function renderStaff(staff=[]){

    const box =
        $("#staffGroups");


    if(!box)
        return;



    box.innerHTML =
    staff.map(member=>`

    <div class="staff-card">


        <img
        src="${member.avatar || ""}"
        loading="lazy"
        >


        <div>


            <strong>
            ${escapeHTML(member.name)}
            </strong>


            <span>
            ${escapeHTML(member.role)}
            </span>


            <p>
            ${escapeHTML(
                member.description || ""
            )}
            </p>


        </div>


    </div>


    `).join("");

}




/* =============================== Search =============================== */


function buildSearchIndex(){

    const data=[];


    store.faq.forEach(item=>{
        data.push({
            title:item.question,
            target:"#faq"
        });
    });



    store.bots.forEach(item=>{
        data.push({
            title:item.name,
            target:"#fitur"
        });
    });



    store.events.forEach(item=>{
        data.push({
            title:item.name,
            target:"#event"
        });
    });



    store.staff.forEach(item=>{
        data.push({
            title:item.name,
            target:"#staff"
        });
    });



    return data;

}




function initSearch(){

    const button =
        $("#searchOpenBtn");


    const close =
        $("#globalSearchCloseBtn");


    const overlay =
        $("#globalSearchOverlay");


    const input =
        $("#globalSearchInput");


    const result =
        $("#globalSearchResults");



    if(!overlay || !input)
        return;



    function hide(){

        overlay.classList.remove(
            "open"
        );

    }



    button?.addEventListener(
        "click",
        ()=>{

            overlay.classList.add(
                "open"
            );

            input.focus();

        }
    );



    close?.addEventListener(
        "click",
        hide
    );



    input.addEventListener(
        "input",
        ()=>{


            const q =
            input.value
            .toLowerCase()
            .trim();



            if(!q){

                result.innerHTML="";
                return;

            }



            result.innerHTML =
            buildSearchIndex()
            .filter(item=>
                item.title
                .toLowerCase()
                .includes(q)
            )
            .map(item=>`

            <div class="global-search-result">

                ${escapeHTML(item.title)}

            </div>

            `)
            .join("");


        }
    );


}





/* =============================== Loaders =============================== */


async function loadOnboarding(){

    const result =
        await fetchJSON(
            "data/onboarding.json"
        );


    if(!result.ok)
        return;


    store.onboarding =
        result.data.steps || [];


    renderChecklist(
        store.onboarding
    );


    renderSteps(
        store.onboarding
    );

}





async function loadBots(){

    const result =
        await fetchJSON(
            "data/bots.json"
        );


    if(!result.ok)
        return;


    store.bots =
        result.data.bots || [];


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

    const result =
        await fetchJSON(
            "data/channels.json"
        );


    if(!result.ok)
        return;


    store.channels =
        result.data;


    renderRules(
        result.data.rules || []
    );


    renderChannels(
        result.data.categories || []
    );

}





async function loadFAQ(){

    const result =
        await fetchJSON(
            "data/faq.json"
        );


    if(!result.ok)
        return;


    store.faq =
        result.data.faq || [];


    renderFAQ(
        store.faq
    );

}





async function loadEvents(){

    const result =
        await fetchJSON(
            "data/events.json"
        );


    if(!result.ok)
        return;


    store.events =
        result.data.events || [];


    renderEvents(
        store.events
    );

}





async function loadStaff(){

    const result =
        await fetchJSON(
            "data/staff.json"
        );


    if(!result.ok)
        return;


    store.staff =
        result.data.staff || [];


    renderStaff(
        store.staff
    );

}





/* =============================== Modal =============================== */


$("#botModalClose")
?.addEventListener(
    "click",
    closeBotModal
);



$("#botModal")
?.addEventListener(
    "click",
    e=>{

        if(
            e.target === $("#botModal")
        ){

            closeBotModal();

        }

    }
);





/* =============================== INIT =============================== */


async function init(){

    console.log(
        "ARC Guide V3 Loaded"
    );


    spawnBubbles();


    initSearch();



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
document.readyState === "loading"
){

    document.addEventListener(
        "DOMContentLoaded",
        init
    );


}else{

    init();

}



})();
