/* ==========================================================================
   ARC Guide V3 — script.js FINAL CLEAN
   Vanilla JS
   ========================================================================== */

(() => {
"use strict";


/* =============================== Utils =============================== */


const $ = (s, c = document) =>
    c?.querySelector?.(s) || null;


const $$ = (s, c = document) =>
    c ? [...c.querySelectorAll(s)] : [];


const prefersReducedMotion =
    window.matchMedia?.(
        "(prefers-reduced-motion: reduce)"
    )?.matches ?? false;



const STORAGE_KEY =
"arcGuide.onboarding.v1";



function escapeHTML(text = ""){

    return String(text).replace(
        /[&<>"']/g,
        c => ({
            "&":"&amp;",
            "<":"&lt;",
            ">":"&gt;",
            '"':"&quot;",
            "'":"&#39;"
        }[c])
    );

}




async function fetchJSON(path){

    try{

        const res =
            await fetch(path,{
                cache:"no-cache"
            });


        if(!res.ok)
            throw Error(res.status);



        return {
            ok:true,
            data:await res.json()
        };


    }catch(e){

        console.error(
            "ARC Guide:",
            path,
            e
        );


        return {
            ok:false,
            data:null
        };

    }

}





function loadProgress(){

    try{

        return JSON.parse(
            localStorage.getItem(
                STORAGE_KEY
            )
        ) || {};

    }catch{

        return {};

    }

}




function saveProgress(data){

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
    );

}





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


check:`
<svg viewBox="0 0 24 24"
fill="none"
stroke="currentColor"
stroke-width="3">
<path d="M20 6L9 17l-5-5"/>
</svg>
`,


music:`
<svg viewBox="0 0 24 24"
fill="none"
stroke="currentColor">
<path d="M9 18V5l12-2v13"/>
<circle cx="6" cy="18" r="3"/>
<circle cx="18" cy="16" r="3"/>
</svg>
`,


trophy:`
<svg viewBox="0 0 24 24"
fill="none"
stroke="currentColor">
<path d="M8 21h8"/>
<path d="M12 17v4"/>
<path d="M7 4h10v5a5 5 0 0 1-10 0V4Z"/>
</svg>
`,


ticket:`
<svg viewBox="0 0 24 24"
fill="none"
stroke="currentColor">
<path d="M3 9a2 2 0 0 0 0 4v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3a2 2 0 0 1 0-4V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3Z"/>
</svg>
`

};





/* =============================== Bubble =============================== */


function spawnBubbles(){

    const box =
        $("#heroBubbles");


    if(!box || prefersReducedMotion)
        return;



    const count =
        innerWidth < 640 ? 10 : 18;



    for(let i=0;i<count;i++){

        const b =
            document.createElement(
                "span"
            );


        b.className =
            "bubble";


        const size =
            5 + Math.random()*10;


        b.style.width =
            size+"px";


        b.style.height =
            size+"px";


        b.style.left =
            Math.random()*100+"%";


        box.appendChild(b);

    }

}





/* =============================== Checklist =============================== */


function renderChecklist(){

    const box =
        $("#homeChecklist");


    if(!box)
        return;



    const data =
        loadProgress();



    box.innerHTML =
    store.onboarding
    .slice(0,4)
    .map(step=>`

    <li class="checklist-item ${
        data[step.id] ? "done": ""
    }"
    data-id="${step.id}">


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

    `)
    .join("");



    $$(".checklist-item",box)
    .forEach(item=>{


        item.onclick=()=>{

            const p =
                loadProgress();


            p[item.dataset.id] =
                !p[item.dataset.id];


            saveProgress(p);


            renderChecklist();

            renderSteps();

        };


    });


    updateProgress();

}




function renderSteps(){

    const box =
        $("#stepsList");


    if(!box)
        return;



    const data =
        loadProgress();



    box.innerHTML =
    store.onboarding
    .map((s,i)=>`

    <div class="step-card">


    <span class="step-index">

    ${
        data[s.id]
        ?
        "✓"
        :
        i+1
    }

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


    `)
    .join("");

}




function updateProgress(){

    const data =
        loadProgress();


    const done =
        store.onboarding
        .filter(x=>data[x.id])
        .length;



    const fill =
        $("#progressFill");


    const label =
        $("#progressLabel");



    const percent =
        store.onboarding.length
        ?
        done/store.onboarding.length*100
        :
        0;



    if(fill)
        fill.style.width =
        percent+"%";


    if(label)
        label.textContent =
        `${done}/${store.onboarding.length} selesai`;

}






/* =============================== Bots =============================== */


function renderBots(target){

    const box =
        $(target);


    if(!box)
        return;



    box.innerHTML =
    store.bots.map(bot=>`

    <div class="card feature-card"
    data-bot="${bot.id}">


        <div class="card-icon">
        ${ICONS[bot.icon]||""}
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



    $$(".feature-card",box)
    .forEach(card=>{


        card.onclick=()=>{


            const bot =
            store.bots.find(
                b =>
                b.id===card.dataset.bot
            );


            openBotModal(bot);

        };


    });

}





function openBotModal(bot){

    if(!bot)
        return;


    $("#botModalTitle")
    &&(
    $("#botModalTitle").textContent =
    bot.name
    );


    $("#botModalDesc")
    &&(
    $("#botModalDesc").textContent =
    bot.function || ""
    );


    $("#botModal")
    ?.classList.add(
        "open"
    );

}



function closeBotModal(){

    $("#botModal")
    ?.classList.remove(
        "open"
    );

}/* =============================== Events =============================== */


function formatDate(date){

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

        return "-";

    }

}



function eventHTML(event){

return `

<div class="event-card">


<div class="event-banner">

<span>
${escapeHTML(event.game||"")}
</span>


<h3>
${escapeHTML(event.name||"Event")}
</h3>


</div>



<div class="event-body">


<p>
${escapeHTML(event.description||"")}
</p>



<div class="event-meta">


<div>
<b>Hadiah</b>
${escapeHTML(event.prize||"-")}
</div>


<div>
<b>Host</b>
${escapeHTML(event.host||"-")}
</div>


<div>
<b>Jadwal</b>
${formatDate(event.date)}
</div>


</div>



<div class="countdown"
data-date="${event.date}">
Loading...
</div>



</div>


</div>

`;

}



function renderEvents(){

    const preview =
        $("#eventPreviewList");


    const full =
        $("#eventFullList");



    if(preview){

        preview.innerHTML =
        store.events
        .slice(0,2)
        .map(eventHTML)
        .join("");

    }



    if(full){

        full.innerHTML =
        store.events
        .map(eventHTML)
        .join("");

    }


    countdown();

}




let timer;


function countdown(){

    clearInterval(timer);


    timer =
    setInterval(()=>{


        $$("[data-date]")
        .forEach(el=>{


            const end =
            new Date(
                el.dataset.date
            )
            .getTime();



            let diff =
            end-Date.now();



            if(diff<=0){

                el.textContent =
                "Dimulai";

                return;

            }



            const h =
            Math.floor(
                diff/3600000
            );


            diff %= 3600000;


            const m =
            Math.floor(
                diff/60000
            );


            diff %= 60000;


            const s =
            Math.floor(
                diff/1000
            );



            el.textContent =
            `${h}j ${m}m ${s}d`;

        });



    },1000);

}






/* =============================== Rules =============================== */


function renderChannels(){

    const rules =
        $("#rulesList");


    const channels =
        $("#channelsList");



    if(rules && store.channels){

        rules.innerHTML =
        store.channels.rules
        .map((r,i)=>`

        <div class="rule-item">

        <b>
        ${i+1}.
        </b>

        <span>
        ${escapeHTML(r)}
        </span>

        </div>

        `)
        .join("");

    }




    if(channels && store.channels){

        channels.innerHTML =
        store.channels.categories
        .map(cat=>`

        <div class="channel-group">


        <h3>
        ${escapeHTML(cat.name)}
        </h3>


        ${
        cat.channels
        .map(ch=>`

        <div class="channel-item">

        <b>
        ${escapeHTML(ch.name)}
        </b>

        <p>
        ${escapeHTML(
            ch.description||""
        )}
        </p>


        </div>


        `)
        .join("")
        }


        </div>


        `)
        .join("");

    }

}






/* =============================== FAQ =============================== */


function renderFAQ(){

    const box =
        $("#faqList");


    if(!box)
        return;



    box.innerHTML =
    store.faq.map(item=>`

    <div class="accordion-item">


    <button class="accordion-trigger">

    ${escapeHTML(item.question)}

    </button>



    <div class="accordion-panel">

    <p>
    ${escapeHTML(item.answer)}
    </p>

    </div>


    </div>


    `)
    .join("");




    $$(".accordion-trigger",box)
    .forEach(btn=>{


        btn.onclick=()=>{


            btn.parentElement
            .classList
            .toggle(
                "open"
            );



            const panel =
            btn.nextElementSibling;



            if(
                panel
            ){

                panel.style.maxHeight =
                panel.style.maxHeight
                ?
                ""
                :
                panel.scrollHeight+"px";

            }


        };


    });

}





/* =============================== Staff =============================== */


function renderStaff(){

    const box =
        $("#staffGroups");


    if(!box)
        return;



    box.innerHTML =
    store.staff.map(user=>`

    <div class="staff-card">


    <img
    src="${user.avatar||""}"
    loading="lazy"
    >


    <div>


    <strong>
    ${escapeHTML(user.name)}
    </strong>


    <span>
    ${escapeHTML(user.role)}
    </span>


    <p>
    ${escapeHTML(
        user.description||""
    )}
    </p>


    </div>


    </div>


    `)
    .join("");

}






/* =============================== Search =============================== */


function initSearch(){

    const open =
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



    open?.addEventListener(
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
        ()=>{

            overlay.classList.remove(
                "open"
            );

        }
    );



    input.oninput=()=>{


        const q =
        input.value
        .toLowerCase();



        const all = [

            ...store.faq.map(x=>x.question),

            ...store.bots.map(x=>x.name),

            ...store.events.map(x=>x.name),

            ...store.staff.map(x=>x.name)

        ];



        result.innerHTML =
        all
        .filter(x=>
            x.toLowerCase()
            .includes(q)
        )
        .map(x=>`

        <div class="global-search-result">
        ${escapeHTML(x)}
        </div>

        `)
        .join("");

    };

}






/* =============================== Load Data =============================== */


async function loadAll(){

    const [

        onboarding,

        bots,

        channels,

        faq,

        events,

        staff

    ] =
    await Promise.all([

        fetchJSON(
        "data/onboarding.json"
        ),

        fetchJSON(
        "data/bots.json"
        ),

        fetchJSON(
        "data/channels.json"
        ),

        fetchJSON(
        "data/faq.json"
        ),

        fetchJSON(
        "data/events.json"
        ),

        fetchJSON(
        "data/staff.json"
        )

    ]);



    if(onboarding.ok){

        store.onboarding =
        onboarding.data.steps||[];

        renderChecklist();
        renderSteps();

    }



    if(bots.ok){

        store.bots =
        bots.data.bots||[];

        renderBots(
        "#homeFeatureGrid"
        );

        renderBots(
        "#botGrid"
        );

    }



    if(channels.ok){

        store.channels =
        channels.data;

        renderChannels();

    }



    if(faq.ok){

        store.faq =
        faq.data.faq||[];

        renderFAQ();

    }



    if(events.ok){

        store.events =
        events.data.events||[];

        renderEvents();

    }



    if(staff.ok){

        store.staff =
        staff.data.staff||[];

        renderStaff();

    }


}







/* =============================== Start =============================== */


function init(){

    console.log(
        "ARC Guide V3 Loaded"
    );


    spawnBubbles();


    initSearch();



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
                e.target.id==="botModal"
            )
            closeBotModal();

        }
    );



    loadAll()
    .then(()=>{

        console.log(
            "ARC Guide siap."
        );

    });


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