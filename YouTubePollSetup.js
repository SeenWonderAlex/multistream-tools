var YPS_UpdateInterval = -1;
var HTMLDocumentYouTube;
var YPS_HasCheckedCreation = false;

function YPS_AutoPollDialog() {
    YPS_UpdateInterval = setInterval(YPS_UpdateCheck, 100);
}

function YPS_UpdateCheck() {
    // If poll is active
    if (document.querySelectorAll('[aria-label="End poll"]').length > 0) {
        if (!YPS_HasCheckedCreation) {
            YPS_HasCheckedCreation = true;
            window.top.postMessage({ "MessageType": "ActivePollAlready" }, "*");
        }
    }
    else if (document.getElementById('poll-editor') != null) {
        console.log("Poll options now available!");
        clearInterval(YPS_UpdateInterval);
        YPS_UpdateInterval = setInterval(YPS_UpdateCheck2, 100);
        YPS_MakeButtonLookUnavailable();
        window.top.postMessage({ "MessageType": "OptionsAvailable" }, "*");
        YPS_HasCheckedCreation = false;
    }
    else if (document.querySelectorAll('[icon-id="poll"]').length > 0) {
        document.querySelectorAll('[icon-id="poll"]')[0].children[0].click();
    }
    else if (document.querySelectorAll('[aria-label="Engage with your audience"]').length > 0) {
        document.querySelectorAll('[aria-label="Engage with your audience"]')[0].click();
        document.querySelectorAll('[icon-id="poll"]')[0].children[0].click();
    }
    else {
        //console.error("Can't find any element");
    }
}

function YPS_UpdateCheck3() {
    // If poll is active
    if (document.querySelectorAll('[aria-label="End poll"]').length > 0) {
        if (!YPS_HasCheckedCreation) {
            YPS_HasCheckedCreation = true;
            window.top.postMessage({ "MessageType": "ActivePollAlready" }, "*");
        }
    }
    if (document.getElementById("poll-choice-container") != null) {
        let MainElementHeader = document.getElementById("poll-choice-container").parentElement.parentElement.querySelector("#header").children[0].children[0].children[1].children;
        let VoteText = "";
        for (var i = 1; i <= MainElementHeader.length; i++) {
            if (MainElementHeader[i].innerText.includes("vote")) {
                VoteText = MainElementHeader[i].innerText.split(' ')[0];
                break;
            }
        }
        let TotalVotes = 0;
        try {
            TotalVotes = Number.parseInt(VoteText);
        } catch (error) {
            console.error("Unable to calculate votes");
        }
        let Options = document.getElementById("poll-choice-container").children;
        let CalculatedVotes = [];
        for (let j = 0; j < Options.length; j++) {
            try {
                let PercentageText = Options[j].querySelector("#text-container").children[1].innerText.replace("%", "");
                let Percentage = Number.parseFloat(PercentageText) / 100;
                if (isNaN(Percentage)) throw new Error("NaN");
                CalculatedVotes.push(Math.round(TotalVotes * Percentage));
            } catch (error) {
                console.error("Cannot calculate percentage for choice" + j + ": " + error);
            }
        }
        window.top.postMessage({ "MessageType": "PollUpdateVotes", "PollOptions": CalculatedVotes, "TotalVotes": TotalVotes }, "*");
    }
}

function YPS_UpdateCheck2() {
    let PollOptions = ["", "", "", ""];
    let PollOptionsHTML = document.getElementById('poll-editor').querySelector("#poll-options").children;
    for (var i = 0; i < PollOptionsHTML.length; i++) {
        if (i > 3) break;
        PollOptions[i] = PollOptionsHTML[i].children[0].children[0].children[1].innerText;
    }
    window.top.postMessage({ "MessageType": "editor_detailschange", "PollQuestion": document.getElementById('poll-editor').querySelector("#poll-question").children[0].children[1].innerText, "PollOptions": PollOptions }, "*");
}

function YPS_MakeButtonLookUnavailable() {
    document.querySelector("#close-button.yt-live-chat-poll-editor-panel-renderer").children[0].children[0].children[0].children[0].style = "display: none;"
    let Elem = document.getElementById('start-button');
    Elem.children[0].children[0].children[0].style = "background-color: #0f0f0f; cursor: not-allowed;";
    Elem.children[0].children[0].children[0].children[0].style = "color: white;"
    Elem.children[0].children[0].children[0].children[0].innerText = "PRESS CREATE ON DASHBOARD";
}


function YPS_StartPoll() {
    document.getElementById('start-button').children[0].children[0].children[0].click();
    clearInterval(YPS_UpdateInterval);
    YPS_UpdateInterval = setInterval(YPS_UpdateCheck3, 100);
}

function YPS_EndPoll() {
    document.querySelectorAll('[aria-label="End poll"]')[0].click();
    clearInterval(YPS_UpdateInterval);
    YPS_AutoPollDialog();
}

function YPS_EndPoll_Singular() {
    document.querySelectorAll('[aria-label="End poll"]')[0].click();
}

window.addEventListener('message', (ev) => {
    if (ev.data == "Wait_Check" && YPS_UpdateInterval == -1) {
        YPS_AutoPollDialog();
        window.top.postMessage({ "MessageType": "Pong" }, "*");
    }
    if (ev.data == "Post_Poll") {
        YPS_StartPoll();
    }
    if (ev.data == "Stop_Poll") {
        YPS_EndPoll();
    }
    if (ev.data == "Stop_PollNoClear") {
        YPS_EndPoll_Singular();
    }
})