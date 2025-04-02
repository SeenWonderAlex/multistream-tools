var client_id = 'siayiyd16jh90e3j473ckuu2seoq0p';
var redirect = (() => { let str = window.location.href; if (str.includes('?')) { str = str.split('?')[0]; } if (str.includes('#')) { str = str.split('#')[0]; } return str; })();
var access_token = '';
var socket_space = '';
var session_id = '';
var user_id = '';

var ConnectedPollID = '';
var ConnectedYTPoll = '';

// Ellipsis Check
var Ellipsis = 0;
var redemptions = [];
const EllipsisText = ["", ".", "..", "..."]

var Presets = {};
var Presets_Loaded = "";

var POLL_TYPE = "";

var PlatformsConnected = [];

var CapWarning = document.querySelector(".CapWarning");

var MaxLength_Choice = 35;

document.getElementById("authorize").addEventListener('click', (ev) => { b("AuthRequired").style.display = "none"; });

document.addEventListener('DOMContentLoaded', () => {
    handleSavedToken();
});

async function handleSavedToken() {
    const urlParams = new URLSearchParams(window.location.hash.replace('#', '?'));
    const myParam = urlParams.get('access_token');
    const StateMatch = verifyState(urlParams.get('state'));
    const isTwitch = (typeof urlParams.get('state') === 'string') && urlParams.get('state').startsWith('ttv') && StateMatch;
    const isYouTube = (typeof urlParams.get('state') === 'string') && urlParams.get('state').startsWith('yt') && StateMatch;
    let IsConnectingToAccount = false;
    if (myParam != null && isTwitch) {
        IsConnectingToAccount = true;
        b("ConnectedPlatforms").open = true;
        getElementClass("Platform1").disabled = true;
        processToken(myParam);
    }
    else if ((localStorage.getItem('saved_access_token')) != null) {
        IsConnectingToAccount = true;
        getElementClass("Platform1").disabled = true;
        processToken(localStorage.getItem('saved_access_token'));
    }
    else {
        ConnectedPollID = "NONE";
        const queryParams = new URLSearchParams(window.location.search);
        const error = queryParams.get('error');
        if (error != null) {
            b("AuthRequired").className = "Oops";
            b("AuthRequired").getElementsByTagName('img')[0].src = './cdn/Weirdge-perry8782-7tv.gif';
            let Text = "We could not complete the authentication of your Twitch account: " + queryParams.get('error_description');
            if (error == "access_denied") {
                Text = "Don't like the permissions we have? No worries. Contact SeenWonderAlex and he'll give you permissions you need.";
            }
            else if (error == "redirect_mismatch") {
                Text = "Are you in the right page? We are unable to complete this process. Feel free to try again or reopen this page from the source.";
            }
            b("AuthRequired").getElementsByTagName('span')[0].innerText = Text;
            b("authorize").innerText = "Dismiss";
            document.getElementById("AuthRequired").style = '';
            b('ConnectedPlatforms').open = true;
        }
        getElementClass("Platform1").addEventListener('click', (ev) => {
            const State = ('ttv' + generateCryptoRandomState());
            localStorage.setItem('state', State);
            location.href = 'https://id.twitch.tv/oauth2/authorize?client_id=' + client_id + '&redirect_uri=' + encodeURIComponent(redirect) + '&response_type=token&scope=channel:read:redemptions+channel:manage:polls+channel:read:polls&state=' + State;
        });
        getElementClass("Platform1").addEventListener('contextmenu', (ev) => {
            ev.preventDefault();
            const State = ('ttv' + generateCryptoRandomState());
            localStorage.setItem('state', State);
            location.href = 'https://id.twitch.tv/oauth2/authorize?client_id=' + client_id + '&redirect_uri=' + encodeURIComponent(redirect) + '&response_type=token&scope=channel:manage:polls+channel:read:polls&state=' + State + '&force_verify=true'
        });
    }

    if (myParam != null && isYouTube) {
        IsConnectingToAccount = true;
        b('YouTubeConnection').style.display = "";
        if (urlParams.get('refresh_token') != null) {
            InitRefresh(urlParams.get('refresh_token'), parseInt(urlParams.get('expires_in')))
                .then((v) => {
                    if (!v) return Promise.reject("You must verify again to continue with YouTube");
                    verifyYTToken(myParam);
                }).catch(err => {
                    console.error(err);
                    verifyYTToken(myParam);
                });
        } else verifyYTToken(myParam);
        getElementClass("Platform2").disabled = true;
    }
    else if ((await EncStorage.getItem('ytsavedtoken')) != null) {
        IsConnectingToAccount = true;
        b('YouTubeConnection').style.display = "";
        if ((await EncStorage.getItem('ytrefresh')) != null) {
            InitRefresh((await EncStorage.getItem('ytrefresh')), -1)
                .then(async (v) => {
                    if (!v) return Promise.reject("You must verify again to continue with YouTube");
                    verifyYTToken((await EncStorage.getItem('ytsavedtoken')));
                }).catch(async err => {
                    console.error(err);
                    verifyYTToken((await EncStorage.getItem('ytsavedtoken')));
                });
        } else verifyYTToken((await EncStorage.getItem('ytsavedtoken')));
        getElementClass("Platform2").disabled = true;
    }
    else {
        ConnectedYTPoll = "NONE";
        b('YouTubeConnection').remove();
        getElementClass("Platform2").addEventListener('click', YoutubeLinkHandler);
    }

    if (!IsConnectingToAccount) {
        b("ConnectedPlatforms").open = true;
        b("ConnectedPlatforms").append(document.createElement('br'));
        let span = document.createElement('span');
        span.innerHTML = "Start making polls by connecting to one or both of the platforms. Read <a href=\"./privacy.html\">Privacy Policy</a> on how we handle your data.";
        b("ConnectedPlatforms").append(span);
    }
}

function InitRefresh(rt, timeout = -1) {
    if (timeout === -1) {
        try {
            let TIME = ((new Date(localStorage.getItem('ytexpiresin')).getTime() - new Date().getTime())) - 20000;
            if (TIME < 0) TIME = 0;
            console.log("[YT] Token expires in " + (TIME / 1000))
            if (TIME <= 0) {
                return Refresh(rt);
            }
            setTimeout(() => { Refresh(rt); }, TIME);
            return Promise.resolve(true);
        } catch (error) {
            console.error(error);
        }
        return Promise.resolve(false);
    }
    localStorage.setItem('ytexpiresin', new Date(new Date().setSeconds(new Date().getSeconds() + timeout)).toString());
    EncStorage.setItem('ytrefresh', rt);
    console.log("[YT] Token expires in " + timeout)
    if (((timeout * 1000) - 20000) <= 0) {
        return Refresh(rt);
    }
    setTimeout(() => { Refresh(rt); }, (timeout * 1000) - 20000);
    return Promise.resolve(true);
}

function Refresh(rt) {
    localStorage.removeItem('ytexpiresin');
    EncStorage.removeItem('ytrefresh');
    return fetch('https://seenwalex.wixsite.com/chat-live/_functions/GAPI/Refresh', {
        "method": "POST",
        "headers": {
            "Content-Type": "application/json"
        },
        "body": JSON.stringify({
            "t": rt
        })
    }).then(res => {
        if (!res.ok) {
            return Promise.reject("You must verify again to continue with YouTube.");
        }
        return res.json();
    }).then(async res => {
        if (res.access_token) {
            InitRefresh(rt, res.expires_in);
            if ((await EncStorage.getItem('ytsavedtoken')) == null) { setTimeout(() => { location.reload(); }, 250); }
            await EncStorage.setItem("ytsavedtoken", res.access_token);
            YTAccessToken = res.access_token;
            return Promise.resolve(true);
        }
        return Promise.resolve(false);
    });
}

function ShowPresets() {
    b('Create').style = "display: none;";
    b('NewEditor').style = "display: none;";
    LoadPresets();
    b('GetPresets').style = "";
}

function ShowNewPoll() {
    b('Create').style = "display: none;";
    b('NewEditor').style = "";
    b('GetPresets').style = "display: none;";
}

let CapWarningVisible = false;

function SetupQuestionCapWarning() {
    b("Editor_PollQuestion").addEventListener('input', (ev => {
        const str = ev.target.value.trim();
        const Length = 60;
        if (POLL_TYPE !== "TTV" && str.length > Length) {
            CapWarning.style = "";
            CapWarning.querySelector('span').innerText = "Twitch will trim to " + str.substring(0, Length);
            CapWarningVisible = true;
        }
        else if (CapWarningVisible) {
            CapWarningVisible = false;
            CapWarning.style = "display: none;";
        }
    }));
}

SetupQuestionCapWarning();

function GetOptionCount() { return document.querySelectorAll("#EditorOptions > .option").length; };

function AddOption() {
    const Options = b('EditorOptions');
    const option = document.createElement('div');
    const button = document.createElement('button');
    const input = document.createElement('input');
    option.className = "option";
    button.style = "width: 25px; float: left; height: 25px; background: none;";
    button.innerText = "X";
    button.type = "button";
    button.tabIndex = 1;
    input.type = "text";
    input.className = "YU1";
    input.placeholder = "Choice " + (GetOptionCount() + 1);
    input.maxLength = MaxLength_Choice;
    input.style.width = "100%";
    option.append(button);
    option.append(input);
    var Warning = CapWarning.cloneNode(true);
    var WarningShown = false;
    input.addEventListener('input', (ev) => {
        var str = ev.target.value.trim();
        if (str.length > 25) {
            if (!WarningShown) { Warning.style = ""; Options.insertBefore(Warning, option.nextSibling); }
            Warning.querySelector("span").innerText = "Twitch will trim to " + str.substring(0, 25);
            WarningShown = true;
        }
        else if (WarningShown) {
            WarningShown = false;
            Warning.remove();
        }
    });
    button.addEventListener('click', () => {
        if (GetOptionCount() <= 2) return; // Can't remove less than 2 options.
        option.remove();
        ValidatePollOptions();
        const OptionsList = document.querySelectorAll("#EditorOptions > .option");
        try {
            for (let i = 0; i < OptionsList.length; i++) {
                if (i <= 1) {
                    OptionsList[i].querySelector("div > input").required = true;
                }
                OptionsList[i].querySelector("div > input").placeholder = "Choice " + (i + 1);
            }
        } catch (error) {
            console.error(error);
        }

        if (WarningShown) Warning.remove();
        delete WarningShown;
        Warning = null;
    });
    Options.append(option);
    ValidatePollOptions();
    return input;
}

// Check availability...
function ValidatePollOptions() {
    const count = b('EditorOptions').childElementCount;
    b('NewEditor').querySelector("button[type=submit]").disabled = count < 2 || count > (POLL_TYPE === "TTV" ? 5 : 4);
    return count >= 2 && count <= (POLL_TYPE === "TTV" ? 5 : 4);
}

// Save Presets to local storage
function SaveToLocalStorage() {
    localStorage.setItem('Presets', JSON.stringify(Presets));
}

// Load Presets
function LoadPresets() {
    Presets = JSON.parse(localStorage.getItem('Presets') ?? '{}');
    let List = [];
    for (let i = 0; i < Object.keys(Presets).length; i++) {
        List.push(Object.keys(Presets)[i]);
    }
    const EditorPresets = b('EditorPresets');
    while (EditorPresets.firstChild) {
        EditorPresets.removeChild(EditorPresets.lastChild);
    }
    List.forEach(ele => {
        const option = document.createElement('option');
        option.value = ele;
        option.innerText = ele;
        EditorPresets.append(option);
    });
}

// Load the preset
function LoadPreset() {
    const Value = b('EditorPresets').value;
    if (Value.length <= 0) {
        ShowNewPoll();
        ValidatePollOptions();
        return;
    }
    let Preset = Presets[Value];
    if (Preset != undefined) {
        Presets_Loaded = Value;
        if (PlatformsConnected.length < 2) {
            if (PlatformsConnected.includes("Twitch")) {
                Preset.platforms = "TTV";
                if (Preset.duration === "Infinity") Preset.duration = "60";
            }
            else if (PlatformsConnected.includes("YouTube")) {
                Preset.platforms = "YT";
            }
        }
        b("CB_YT").checked = (Preset.platforms ?? "YT,TTV").includes("YT");
        b("CB_TTV").checked = (Preset.platforms ?? "YT,TTV").includes("TTV");
        OnUpdateCheckboxes(null);

        b("Editor_PollDuration").value = Preset.duration ?? "30";

        const EditorOptions = b('EditorOptions');
        while (EditorOptions.firstChild) {
            EditorOptions.removeChild(EditorOptions.lastChild);
        }
        b('Editor_PollQuestion').value = Preset.prompt;
        for (let i = 0; i < Preset.options.length; i++) { AddOption().value = Preset.options[i]; }
    }
    ShowNewPoll();
    ValidatePollOptions();
}

// Delete the preset
function DeletePreset() {
    const Value = b('EditorPresets').value;
    let Preset = Presets[Value];
    if (Preset != undefined) {
        Presets[Value] = undefined;
        delete Preset;
        SaveToLocalStorage();
        ShowPresets();
    }
}

// We setup the current X buttons
(function () {
    const EditorOptions = b('EditorOptions');
    while (EditorOptions.firstChild) {
        EditorOptions.removeChild(EditorOptions.lastChild);
    }
    AddOption(); AddOption();
    b('CreatePresetButton').addEventListener('click', (ev) => {
        const name = prompt("Enter a preset name. Any existing preset with the exact name will be replaced.", Presets_Loaded);
        if (name == null || name.length <= 0) return;
        let Preset = { "prompt": b('Editor_PollQuestion').value, "options": [], "platforms": POLL_TYPE, "duration": b("Editor_PollDuration").value };
        const OptionInputs = b('EditorOptions').querySelectorAll("div > input");
        for (let i = 0; i < OptionInputs.length; i++) {
            Preset.options.push(OptionInputs[i].value);
        }
        Presets[name] = Preset;
        SaveToLocalStorage();
    });
    b('CreatePresetButton').addEventListener('contextmenu', (ev) => {
        ev.preventDefault();
        ShowPresets();
    });
})();

let YTAccessToken = "";
let YTChatID = "";
let Retries = 4;
let YTIsFetching = false;
let NextPageToken = "";

function CheckPollUpdates() {
    if (ConnectedYTPoll == "NONE") {
        console.warn("A poll isn't running anymore, ignoring request.");
        return;
    }
    if (document.hidden) // Don't send requests when the page is hidden to avoid exceeding quota
    {
        if (ConnectedYTPoll != "NONE") setTimeout(CheckPollUpdates, 500);
        return;
    }
    if (YTIsFetching) // A bug that it sends more than one request at once. This is a workaround;
    {
        console.warn("A simultaneously operation was detected and prevented.");
        return;
    }
    YTIsFetching = true;
    return fetch('https://www.googleapis.com/youtube/v3/liveChat/messages?part=snippet&maxResults=200&liveChatId=' + YTChatID + ((NextPageToken.length > 0) ? ("&pageToken=" + NextPageToken) : ""), { // No need for data, just IDs.
        "headers": {
            "Authorization": "Bearer " + YTAccessToken,
            "Accept": "application/json"
        }
    }).then(res => {
        YTIsFetching = false;
        if (!res.ok) {
            console.warn("[YT] We are unable to access the live chat right now. We'll try again in 2 seconds.");

            b("WarningMessage").style.display = "";
            getElementClass("Warning").innerText = "Lost connection to chat, results may be outdated";
            WarningShown = true;

            return Promise.reject("failed to update");
        }
        return res.json();
    }).then(json => {
        NextPageToken = json.nextPageToken || "";
        if (json.activePollItem != undefined && json.activePollItem.id == ConnectedYTPoll) { // Check if the poll is the same as the linked ID
            SetYTPollRes(json.activePollItem);
            setTimeout(CheckPollUpdates, json.pollingIntervalMillis); // Timeout in a polling interval according to YouTube.
            if (WarningShown) {
                b("WarningMessage").style.display = "none";
                getElementClass("Warning").innerText = ".";
                WarningShown = false;
            }
            return json.activePollItem;
        }
        if (Array.isArray(json.items)) { // Check if there's a poll event that ended
            const Messages = json.items;
            for (const Message of Messages) {
                if (Message.snippet.type === "pollEvent" && Message.id === ConnectedYTPoll && Message.snippet.pollDetails.status === "closed") {
                    SetYTPollRes(Message);
                    if (POLL_TYPE === "YT") // If it's a YT only poll, show the results
                    {
                        document.removeEventListener("visibilitychange", OnPageShown);
                        b('PollResultsDiv').style = "";
                        b("CurrentPoll").style = "display: none;";
                        clearInterval(IntervalIDForPoll);
                        ConnectedYTPoll = "NONE";
                        b("CreatePollEditor").style = "";
                        b('Create').style = "";
                        b('NewEditor').style = "display: none;";
                        b('GetPresets').style = "display: none;";
                        CalculateResults();
                    }
                    return Message;
                }
            }
        }

        if (Retries > 0) {
            Retries--;
            console.warn("[YT] Has not received poll item yet!");
            return Promise.reject("no poll item received");
        }
        // No more poll... We'll no longer send requests and set the YT poll ID to none.
        ConnectedYTPoll = "NONE";
        console.warn("[YT] A poll isn't running in YouTube anymore, previous results will remain the same for this session")
        if (POLL_TYPE === "YT") // If it's a YT only poll, show the results
        {
            document.removeEventListener("visibilitychange", OnPageShown);
            b('PollResultsDiv').style = "";
            b("CurrentPoll").style = "display: none;";
            clearInterval(IntervalIDForPoll);
            ConnectedYTPoll = "NONE";
            b("CreatePollEditor").style = "";
            b('Create').style = "";
            b('NewEditor').style = "display: none;";
            b('GetPresets').style = "display: none;";
            CalculateResults();
        }
        return null;
    }).catch(err => {
        YTIsFetching = false;
        console.warn("[YT] Request failed. Retrying in 2 seconds");
        if (ConnectedYTPoll != "NONE") setTimeout(CheckPollUpdates, 2000);
        return Promise.reject("failed to update");
    });
}

let WarningShown = false;

function OnPageShown(ev) {
    if (!document.hidden && ConnectedYTPoll != "NONE") {
        b("WarningMessage").style.display = "";
        getElementClass("Warning").innerText = "Updating YouTube Results";
        WarningShown = true;
        UpdatePollResponses();
    }
}

function LoadYTBroadcast(ID) {
    return fetch('https://youtube.googleapis.com/youtube/v3/liveBroadcasts?part=snippet&broadcastType=all&maxResults=1&id=' + ID, {
        "headers": {
            "Authorization": "Bearer " + YTAccessToken,
            "Accept": "application/json"
        }
    }).then(res => {
        if (res.status == 401) {
            ReverifyPrompt(() => { LoadYTBroadcast(ID); });
            return Promise.reject("User needs to re-verify");
        }
        return res.json();
    }).then(json => {
        if (json.items.length > 0) {
            ConnectedYTPoll = "";
            YTChatID = json.items[0].snippet.liveChatId;
            console.log("[YT] Connected to broadcast!");
            return CheckPollDetails();
        }
        return Promise.reject("No stream found!");
    }).catch(err => {
        console.error(err);
        return Promise.reject(err);
    });
}

function CheckPollDetails() {
    return fetch('https://www.googleapis.com/youtube/v3/liveChat/messages?part=id&maxResults=200&liveChatId=' + YTChatID, { // No need for data, just IDs.
        "headers": {
            "Authorization": "Bearer " + YTAccessToken,
            "Accept": "application/json"
        }
    }).then(res => {
        if (res.status == 403) {
            return Promise.reject("We are unable to access the live chat. Please check your stream settings.");
        }
        return res.json();
    }).then(json => {
        console.log("[YT] Successfully connected to chat!")
        if (json.activePollItem != undefined) { // Poll Running
            ConnectedYTPoll = json.activePollItem.id;
        }
        else {
            ConnectedYTPoll = "NONE";
        }
        return true;
    }).catch(err => {
        console.error(err);
        return Promise.reject(err);
    });
}

// Function to generate a random state value
function generateCryptoRandomState() {
    const randomValues = new Uint32Array(2);
    window.crypto.getRandomValues(randomValues);

    // Encode as UTF-8
    const utf8Encoder = new TextEncoder();
    const utf8Array = utf8Encoder.encode(
        String.fromCharCode.apply(null, randomValues)
    );

    // Base64 encode the UTF-8 data
    return btoa(String.fromCharCode.apply(null, utf8Array))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

function verifyState(Element) {
    const CheckAndMatch = localStorage.getItem('state') === Element;
    localStorage.removeItem('state');
    return CheckAndMatch;
}

function ReverifyPrompt(event) {
    // Google's OAuth 2.0 endpoint for requesting an access token
    var link = new URL('https://accounts.google.com/o/oauth2/v2/auth');

    const State = 'ytreverify' + generateCryptoRandomState();
    localStorage.setItem('state', State);

    // Parameters to pass to OAuth 2.0 endpoint.
    link.search = '?' + new URLSearchParams({
        'client_id': '597860444523-l87m271jorgmc0a9ea2vnn4ohqkmjphi.apps.googleusercontent.com',
        'redirect_uri': 'https://seenwalex.wixsite.com/chat-live/_functions/Red?refer=reverify',
        'response_type': 'token',
        'scope': 'https://www.googleapis.com/auth/youtube',
        'state': State
    }).toString();
    let win = window.open(link, '_blank');
    if (!win || win.closed || typeof win.closed == 'undefined') {
        //POPUP BLOCKED
        alert("Uh oh! We gotta re-verify you. Open the popup that was blocked from your blocker and you'll be prompt to reverify.");
        let i = setInterval(async () => {
            if ((await EncStorage.getItem('ytsavedtoken')) != null) {
                YTAccessToken = (await EncStorage.getItem('ytsavedtoken'));
                event();
                clearInterval(i);
            }
        }, 1000);
    } else {
        let onmessage = async (ev) => {
            if (typeof ev.data === "object" && ev.data.type == "REVERIFIED") {
                await EncStorage.setItem('ytsavedtoken', ev.data.retrieved);
                YTAccessToken = ev.data.retrieved;
                event();
                window.removeEventListener('message', onmessage);
            }
        }
        window.addEventListener('message', onmessage);
    }
}

function verifyYTToken(token) {
    fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true&access_token=' + token)
        .then(async result => {
            if (!result.ok) return Promise.reject(await result.json());
            if (document.querySelectorAll("#ConnectedPlatforms > span")[1]) {
                result.json().then(res => {
                    document.querySelectorAll("#ConnectedPlatforms > span")[1].innerText = res.items[0].snippet.title;
                });
            }
            YTAccessToken = token;
            b("Display_C1").style.display = "";
            b("CB_YT").checked = true;
            b("CB_YT").addEventListener("click", OnUpdateCheckboxes);
            OnUpdateCheckboxes(null);
            PlatformsConnected.push("YouTube");
            if (window.location.hash.length > 0) window.location.hash = "#authorized";
            // Disconnect
            getElementClass("Platform2").disabled = false;
            getElementClass("Platform2").classList.add("disconnect");
            getElementClass("Platform2").innerText = "Disconnect";
            getElementClass("Platform2").addEventListener('click', (ev) => {
                fetch(
                    'https://oauth2.googleapis.com/revoke',
                    {
                        "headers": {
                            "Content-Type": "application/x-www-form-urlencoded"
                        },
                        "method": "POST",
                        "body": `token=${token}`
                    }
                ).then(res => { location.reload(); })
            });
            getElementClass("Platform2").addEventListener('contextmenu', (ev) => { // Left click will show the page.
                ev.preventDefault();
                // Google's OAuth 2.0 endpoint for revoking access tokens.
                var revokeTokenEndpoint = 'https://oauth2.googleapis.com/revoke';

                // Create <form> element to use to POST data to the OAuth 2.0 endpoint.
                var form = document.createElement('form');
                form.setAttribute('method', 'post');
                form.setAttribute('action', revokeTokenEndpoint);

                // Add access token to the form so it is set as value of 'token' parameter.
                // This corresponds to the sample curl request, where the URL is:
                //      https://oauth2.googleapis.com/revoke?token={token}
                var tokenField = document.createElement('input');
                tokenField.setAttribute('type', 'hidden');
                tokenField.setAttribute('name', 'token');
                tokenField.setAttribute('value', token);
                form.appendChild(tokenField);

                // Add form to page and submit it to actually revoke the token.
                document.body.appendChild(form);
                form.submit();
            });

            // Add checkbox
            const Label = document.createElement('label');
            Label.className = "container";
            Label.innerText = "Show Chat";
            const InvisCheckbox = document.createElement('input');
            InvisCheckbox.type = "checkbox";
            let Click = (ev) => {
                if (InvisCheckbox.checked) {
                    b("YTChatDummyDoc").style.display = "";
                    b("YTChatDummyDoc").src = b("YTChatDummyDoc").getAttribute("data-link") ?? "about:blank";
                }
                else {
                    b("YTChatDummyDoc").style.display = "none";
                    b("YTChatDummyDoc").src = "about:blank";
                }
                localStorage.setItem("ChatShow_YT", InvisCheckbox.checked.toString().toLowerCase());
            }
            InvisCheckbox.addEventListener('click', Click);
            const Span = document.createElement('span');
            Span.className = "checkmark CB_YT";
            Label.append(InvisCheckbox);
            Label.append(Span);
            InvisCheckbox.checked = (localStorage.getItem("ChatShow_YT") ?? "true") === "true";
            Click(null);
            b("ConnectedPlatforms").append(Label);

            AddChecker();

            if (localStorage.getItem('saved_url') != null && localStorage.getItem('saved_url').length > 0) {
                b("YouTubeURL").value = localStorage.getItem('saved_url');
                LoadURL();
            }
            b('YUHandler').removeAttribute('onclick');
            b('YUHandler').onclick = async (ev) => {
                b('YUHandler').disabled = true;
                b('YUHandler').innerText = "Checking Your Streams";
                try {
                    let result = await fetch('https://youtube.googleapis.com/youtube/v3/liveBroadcasts?part=id&broadcastType=all&maxResults=1&mine=true', {
                        "headers": {
                            "Authorization": "Bearer " + YTAccessToken,
                            "Accept": "application/json"
                        }
                    });
                    let json = await result.json();
                    if (json.pageInfo.totalResults <= 0) {
                        b('YUHandler').disabled = false;
                        b('YUHandler').innerText = "NO STREAMS FOUND!";
                        setTimeout(() => { b('YUHandler').innerText = "Load from Recent"; }, 3000);
                    }
                    else {
                        b('YUHandler').disabled = false;
                        b('YUHandler').innerText = "Load from Recent";
                        b("YouTubeURL").value = 'https://youtube.com/live/' + json.items[0].id;
                        LoadURL();
                    }
                } catch (error) {
                    console.error(error);
                    b('YUHandler').disabled = false;
                    b('YUHandler').innerText = "AN INTERNAL ERROR OCCURRED!";
                    setTimeout(() => { b('YUHandler').innerText = "Load from Recent"; }, 3000);
                }
            };
            EncStorage.setItem('ytsavedtoken', token);
        })
        .catch(err => {
            ConnectedYTPoll = "NONE";
            console.error("YouTube Authentication Failed: ", err);
            EncStorage.removeItem('ytsavedtoken');
            b('YouTubeConnection').innerHTML = "We could not re-authenticate YouTube.";
            getElementClass("Platform2").disabled = false;
            getElementClass("Platform2").addEventListener('click', YoutubeLinkHandler);
        });
}

// function openDetails()
// {
//     b("troll_features_dialog").open = true;
// }

function getElementClass(Class) {
    return document.getElementsByClassName(Class).length > 0 ? document.getElementsByClassName(Class)[0] : null;
}

function b(Id) {
    return document.getElementById(Id);
}

function GetRedemptionData(ID) {
    for (var i = 0; i < redemptions.length; i++) {
        if (redemptions[i].id == ID) {
            return redemptions[i];
        }
    }
    return null;
}

function LoadCached() {
    if (localStorage.getItem("cached") != null) {
        redemptions = [];
        var b = (localStorage.getItem("cached")).split("~=~");
        b.forEach(ele => {
            let a = JSON.parse(ele);
            let date = new Date(a.redeemed_at);
            if ((new Date().getTime() - date.getTime()) < 86400000) {
                redemptions.push(a);
            }
        });
        SaveCached();
    }
}
function SaveCached() {
    var array = [];
    redemptions.forEach(ele => {
        array.push(JSON.stringify(ele));
    });
    localStorage.setItem("cached", array.join("~=~"));
}

function AddRedemption(data) {
    if (!data.reviewed_at) {
        if (data.status != "unfulfilled") {
            data.reviewed_at = new Date().toString();
        }
    }
    redemptions.unshift(data);
    SaveCached();
}

function UpdateRedemption(data) {
    if (!data.reviewed_at) {
        if (data.status != "unfulfilled") {
            data.reviewed_at = new Date().toString();
        }
    }
    var A = -1;
    for (var i = 0; i < redemptions.length; i++) {
        if (redemptions[i].id == data.id) {
            A = i;
            break;
        }
    }
    if (A != -1) {
        redemptions[A] = data;
        SaveCached();
    }
}

let IntervalID = 0;

function CheckPoll() {
    if (!ValidatePollOptions()) return;
    PE_Q = (b('Editor_PollQuestion').value || "Vote...");
    let Options = [];
    const OptionInputs = b('EditorOptions').querySelectorAll("div > input");
    for (let i = 0; i < OptionInputs.length; i++) {
        if (OptionInputs[i].value.length > 0) Options.push(OptionInputs[i].value);
    }
    PE_O = Options;
    if (PE_O.length < 2 || PE_O.length > (POLL_TYPE === "TTV" ? 5 : 4)) {
        alert(`A poll must have 2-${(POLL_TYPE === "TTV" ? 5 : 4)} options.`);
        return;
    }
    SubmitPoll();
}

function SubmitPoll() {
    const SubmitOnTwitch = POLL_TYPE.includes("TTV");
    const SubmitOnYouTube = POLL_TYPE.includes("YT");
    b("CreatePollEditor").style = "display: none;";
    if (SubmitOnTwitch) {
        let url = new URL('https://api.twitch.tv/helix/polls');
        let Options = [];
        for (var i = 0; i < PE_O.length; i++) {
            if (PE_O[i].length > 0) {
                Options.push({ "title": PE_O[i].trim().substring(0, 25) });
            }
        }
        if (isNaN(Number.parseInt(b("Editor_PollDuration").value))) b("Editor_PollDuration").value = "60";
        // Twitch Submit Poll
        fetch(
            url,
            {
                "method": "POST",
                "headers": {
                    "Client-ID": client_id,
                    "Authorization": "Bearer " + access_token,
                    "Content-Type": "application/json"
                },
                "body": JSON.stringify({
                    "broadcaster_id": user_id,
                    "title": PE_Q.trim().substring(0, 60),
                    "choices": Options,
                    "duration": Number.parseInt(b("Editor_PollDuration").value)
                })
            }
        )
            .then(resp => resp.json())
            .then(resp => {
                if (resp.data) {
                    log('Got Created Poll');
                    ConnectedPollID = resp.data[0].id;
                    console.log(resp.data);
                } else {
                    console.error('Failed to create poll', resp);
                }
            })
            .catch(err => {
                console.log(err);
                log(`Error with Polls Call Call: ${err.message ? err.message : ''}`);
            });
    } else {
        let TP_Options = [];
        for (let index = 0; index < PE_O.length; index++) {
            if (PE_O[index].length > 0) {
                TP_Options.push(0);
            }
        }
        TwitchPoll = { "votes": TP_Options }
    }
    // YT Submit Poll
    if (SubmitOnYouTube) {
        Options = [];
        for (var i = 0; i < PE_O.length; i++) {
            if (PE_O[i].length > 0) {
                Options.push({ "optionText": PE_O[i].trim().substring(0, 35) });
            }
        }
        fetch('https://www.googleapis.com/youtube/v3/liveChat/messages?part=snippet', { // No need for data, just IDs.
            "method": "POST",
            "headers": {
                "Authorization": "Bearer " + YTAccessToken,
                "Accept": "application/json"
            },
            "body": JSON.stringify({
                "snippet": { "liveChatId": YTChatID, "type": "pollEvent", "pollDetails": { "metadata": { "options": Options, "questionText": PE_Q.trim().substring(0, 100) } } }
            })
        }).then(res => {
            if (res.status == 401) {
                ReverifyPrompt(SubmitPoll);
                if (CheckForPolls) clearInterval(CheckForPolls);
                return Promise.reject("User needs to re-verify");
            }
            return res.json();
        }).then(json => {
            ConnectedYTPoll = json.id;
            Retries = 2;
            SetYTPollRes(json);
            CheckPollUpdates();
        }).catch(err => {
            console.error(err);
        });
    }
    else {
        let TP_Options = [];
        for (let index = 0; index < PE_O.length; index++) {
            if (PE_O[index].length > 0) {
                TP_Options.push(0);
            }
        }
        YouTubePoll = { "votes": TP_Options, "Total": 0 };
    }
    SetPleaseWait("Waiting for YouTube & Twitch");
    if (POLL_TYPE === "YT") SetPleaseWait("Waiting for YouTube");
    if (POLL_TYPE === "TTV") SetPleaseWait("Waiting for Twitch");

    var CheckForPolls = setInterval(() => {
        if (ConnectedPollID == "NONE" && (POLL_TYPE === "TTV" || ConnectedYTPoll != "NONE")) {
            SetPleaseWait("Waiting for Twitch");
        }
        if ((POLL_TYPE === "YT" || ConnectedPollID != "NONE") && ConnectedYTPoll == "NONE") {
            SetPleaseWait("Waiting for YouTube");
        }
        if (
            (ConnectedPollID != "NONE" && ConnectedYTPoll != "NONE") ||
            (POLL_TYPE === "YT" && ConnectedYTPoll != "NONE") ||
            (POLL_TYPE === "TTV" && ConnectedPollID != "NONE")
        ) {
            // Poll Duration Check
            PollDurationType = 0;
            b("PollDuration").style.display = "";
            b("PPollDuration").parentElement.style.display = "";

            if (POLL_TYPE === "YT") // YouTube does not auto-end polls with durations, it's all infinite
            {
                if (b("Editor_PollDuration").value !== "Infinity") {
                    PollStarttime = new Date();
                    PollEndtime = new Date();
                    PollEndtime.setSeconds(PollEndtime.getSeconds() + Number.parseInt(b("Editor_PollDuration").value) - 1);
                    PollDurationType = 1;
                }
                else {
                    PollDurationType = 2;
                    b("PollDuration").style.display = "none";
                    b("PPollDuration").parentElement.style.display = "none";
                }
            }
            // Button Text Update
            getElementClass("SubmitPoll").innerText = POLL_TYPE.includes(",") ? "End Polls Early" : "End Poll";
            // Now the other things.
            clearInterval(CheckForPolls);
            b("PleaseWait").style = "display: none;";
            b("CurrentPoll").style = "";
            document.addEventListener("visibilitychange", OnPageShown);
            UpdatePollResponses();
            window.scrollTo(0, document.body.scrollHeight);
            IntervalIDForPoll = setInterval(UpdatePollResponses, 150);
        }
    }, 250);
}

var PollEndtime = new Date();
var PollStarttime;
var IntervalIDForPoll = 0;
var PollDurationType = 0;

function LoadURL() {
    let URL = b("YouTubeURL").value;
    localStorage.setItem("saved_url", URL);
    var regExp = /.*(?:youtu.be\/|v\/|u\/\w\/|live\/|watch\?v=)([^#\&\?]*).*/;
    try {
        b("YTChatDummyDoc").setAttribute("data-link", "https://youtube.com/live_chat?v=" + (URL.match(regExp)[1] ?? "none") + "&embed_domain=" + location.hostname);
        if (b("YTChatDummyDoc").style.display != "none") {
            b("YTChatDummyDoc").src = "https://youtube.com/live_chat?v=" + (URL.match(regExp)[1] ?? "none") + "&embed_domain=" + location.hostname;
        }
        let OldText = b("YouTubeConnection").querySelector("span").innerHTML;
        if (!OldText.includes("invalid") && !OldText.includes("loaded")) {
            LoadYTBroadcast((URL.match(regExp)[1] ?? "none"));
            b("YouTubeConnection").querySelector("span").innerHTML = "YouTube Chat successfully loaded!";
            b("YouTubeConnection").querySelector("span").style.color = "green";
            setTimeout(() => {
                b("YouTubeConnection").querySelector("span").innerHTML = OldText;
                b("YouTubeConnection").querySelector("span").style.color = "";
            }, 1000)
        }
    } catch (error) {
        console.error(error);
        let OldText = b("YouTubeConnection").querySelector("span").innerText;
        if (!OldText.includes("invalid") && !OldText.includes("loaded")) {
            b("YouTubeConnection").querySelector("span").innerText = "Invalid YouTube URL!";
            b("YouTubeConnection").querySelector("span").style.color = "red";
            setTimeout(() => {
                b("YouTubeConnection").querySelector("span").innerText = OldText;
                b("YouTubeConnection").querySelector("span").style.color = "";
            }, 1000)
        }
    }
}

function UpdatePollResponses() {
    if (document.hidden) return; // To save space
    b("PollOption3").style = PE_O.length >= 3 ? "" : "display: none;";
    b("PPollOption3").parentElement.style = PE_O.length >= 3 ? "" : "display: none;";
    b("PollOption4").style = PE_O.length >= 4 ? "" : "display: none;";
    b("PPollOption4").parentElement.style = PE_O.length >= 4 ? "" : "display: none;";
    b("PollOption5").style = PE_O.length >= 5 ? "" : "display: none;";
    b("PPollOption5").parentElement.style = PE_O.length >= 5 ? "" : "display: none;";
    // Timer
    if (PollDurationType !== 2) {
        var Now = new Date().getTime();
        var distance = PollEndtime.getTime() - Now;
        if (distance >= 0) {
            b("PPollDuration").style.width = ((1 - ((Now - PollStarttime.getTime()) / (PollEndtime.getTime() - PollStarttime.getTime()))) * 100) + "%";
            var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            var seconds = Math.floor((distance % (1000 * 60)) / 1000);
            b("PollDuration").innerText = ('0' + minutes).substring((minutes).toString().length - 1) + ":" + ('0' + seconds).substring((seconds).toString().length - 1);
        }
        else if (PollDurationType === 1 && ConnectedYTPoll != "NONE" && ConnectedYTPoll != "ENDING") {
            document.removeEventListener("visibilitychange", OnPageShown);
            b("CurrentPoll").style = "display: none;";
            SetPleaseWait("Ending YouTube poll");
            clearInterval(IntervalIDForPoll);
            // I realized that the poll results aren't finalized right away because the API has like a 2 second delay. We'll have to delay the request.
            setTimeout(() => {
                if (ConnectedYTPoll != "NONE" && ConnectedYTPoll != "ENDING") {
                    fetch(`https://www.googleapis.com/youtube/v3/liveChat/messages/transition?part=snippet&id=${ConnectedYTPoll}&status=closed`, { // End the poll, no matter the response result...
                        "method": "POST",
                        "headers": {
                            "Authorization": "Bearer " + YTAccessToken,
                            "Accept": "application/json"
                        }
                    }).then(async res => {
                        try {
                            ConnectedYTPoll = "NONE";
                            b("CreatePollEditor").style = "";
                            b('Create').style = "";
                            b('NewEditor').style = "display: none;";
                            b('GetPresets').style = "display: none;";
                            b('PollResultsDiv').style = "";
                            b("PleaseWait").style = "display: none;";
                            SetYTPollRes(await res.json());
                        } finally {
                            CalculateResults();
                        }
                    }).catch(err => {
                        console.error(err);
                    });
                }
            }, 2000);
        }
    }

    if ((typeof TwitchPoll === 'object' && TwitchPoll != null) && (typeof YouTubePoll === 'object' && YouTubePoll != null)) {
        var CombinedVotes = Array(PE_O.length);
        var TwitchTotalVotes = 0;
        const YouTubeTotalVotes = YouTubePoll["Total"];
        for (let i = 0; i < TwitchPoll["votes"].length; i++) {
            TwitchTotalVotes += TwitchPoll["votes"][i];
            CombinedVotes[i] = TwitchPoll["votes"][i];
        }
        for (let i = 0; i < YouTubePoll["votes"].length; i++) {
            CombinedVotes[i] += YouTubePoll["votes"][i];
        }
        const CombinedTotal = TwitchTotalVotes + YouTubeTotalVotes;
        getElementClass("PollQ").innerText = PE_Q + " (" + numberWithCommas(CombinedTotal) + " Votes)";
        for (let i = 0; i < CombinedVotes.length; i++) {
            b("PPollOption" + (i + 1)).style.width = `${Math.round(CombinedVotes[i] / ((CombinedTotal == 0) ? 1 : CombinedTotal) * 100)}%`;
            b("PollOption" + (i + 1)).innerText = `${PE_O[i]} / ${Math.round(CombinedVotes[i] / ((CombinedTotal == 0) ? 1 : CombinedTotal) * 100)}% (${CombinedVotes[i]})`;
        }
    }
}

function EndPollEarly(AllowYouTubeEvents = false) {
    let url = new URL('https://api.twitch.tv/helix/polls');
    let Options = [];
    for (var i = 0; i < PE_O.length; i++) {
        if (PE_O[i].length > 0) {
            Options.push({ "title": PE_O[i] });
        }
    }

    if (ConnectedYTPoll != "NONE" && (!AllowYouTubeEvents || POLL_TYPE === "YT")) {
        fetch(`https://www.googleapis.com/youtube/v3/liveChat/messages/transition?id=${ConnectedYTPoll}&status=closed`, { // End the poll, no matter the response result...
            "method": "POST",
            "headers": {
                "Authorization": "Bearer " + YTAccessToken,
                "Accept": "application/json"
            }
        }).then(res => {
            ConnectedYTPoll = "NONE";
            if (POLL_TYPE === "YT") {
                b('PollResultsDiv').style = "";
                CalculateResults();
            }
        }).catch(err => {
            console.error(err);
        });
        ConnectedYTPoll = "ENDING"; // So the Twitch one won't end and give an error.
    }
    if (ConnectedPollID != "NONE") {
        fetch(
            url,
            {
                "method": "PATCH",
                "headers": {
                    "Client-ID": client_id,
                    "Authorization": "Bearer " + access_token,
                    "Content-Type": "application/json"
                },
                "body": JSON.stringify({
                    "broadcaster_id": user_id,
                    "id": ConnectedPollID,
                    "status": "TERMINATED"
                })
            }
        )
            .then(resp => resp.json())
            .then(resp => {
                if (!resp.data) {
                    return Promise.reject('Failed to end poll');
                }
            })
            .catch(err => {
                console.log(err);
                log(`Error with Polls Call Call: ${err.message ? err.message : ''}`);
            });
    }
    b("CurrentPoll").style = "display: none;";
    b("PollWarning").style = "display: none;";
    SetPleaseWait("Ending YouTube & Twitch polls");
    var CheckForPolls = setInterval(() => {
        if (ConnectedPollID != "NONE" && ConnectedYTPoll == "NONE") {
            SetPleaseWait("Ending Twitch poll");
        }
        else if (ConnectedPollID == "NONE" && ConnectedYTPoll != "NONE") {
            SetPleaseWait("Ending YouTube poll");
        }
        else if (ConnectedPollID == "NONE" && ConnectedYTPoll == "NONE") {
            clearInterval(CheckForPolls);
            b("PleaseWait").style = "display: none;";
            b("CreatePollEditor").style = "";
            b('Create').style = "";
            b('NewEditor').style = "display: none;";
            b('GetPresets').style = "display: none;";
        }
    }, 250);
}

function SetYTPollRes(json) {
    let Votes = [];
    let Total = 0;
    let arr = json.snippet.pollDetails.metadata.options;
    for (let i = 0; i < arr.length; i++) {
        const tally = arr[i].tally.replaceAll(',', "").replaceAll('.', "");
        const votes = parseInt(tally);
        if (isNaN(votes)) {
            console.error("[YT] Failed to parse tally for " + arr[i].optionText);
            Votes.push(0);
            continue;
        }
        Total += votes;
        Votes.push(votes);
    }
    //console.log("DEBUG VOTES", Votes, Total);
    SetYouTubePoll(Votes, Total);
}

function OnUpdateCheckboxes(ev) {
    let Checked_1 = b("CB_YT").checked;
    let Checked_2 = b("CB_TTV").checked;
    if (Checked_1 && Checked_2) {
        POLL_TYPE = "YT,TTV";
        if (document.querySelector("option[value=\"Infinity\"]")) {
            document.querySelector("option[value=\"Infinity\"]").remove();
        }
        UpdateCharLength(100, 35);
    }
    else if (Checked_1) {
        POLL_TYPE = "YT";
        if (!document.querySelector("option[value=\"Infinity\"]")) {
            const option = document.createElement('option');
            option.value = "Infinity";
            option.innerText = "Until the end of stream";
            b("Editor_PollDuration").append(option);
        }
        UpdateCharLength(100, 35);
    }
    else if (Checked_2) {
        POLL_TYPE = "TTV";
        if (document.querySelector("option[value=\"Infinity\"]")) {
            document.querySelector("option[value=\"Infinity\"]").remove();
        }
        UpdateCharLength(60, 25);
    }
    else if (ev != null) {
        ev.preventDefault();
    }
    ValidatePollOptions();
}

function UpdateCharLength(Question = 100, Choice = 35) {
    MaxLength_Choice = Choice;
    b("Editor_PollQuestion").maxLength = Question;
    let Choices = document.querySelectorAll("#EditorOptions > div > input");
    for (let choice of Choices) {
        choice.maxLength = Choice;
    }
}

var CheckForPolls = undefined;
const AddChecker = () => {
    if (CheckForPolls) return;
    CheckForPolls = setInterval(() => {
        const WaitForYouTube = b("YouTubeConnection") != null && b("YouTubeURL") != null && b("YouTubeURL").value.length <= 0;
        const WaitForTwitch = PlatformsConnected.includes("Twitch") && session_id.length <= 0;
        if (WaitForYouTube && WaitForTwitch) {
            SetPleaseWait("Waiting for YouTube & Twitch");
            return;
        }
        else if (WaitForYouTube) {
            SetPleaseWait("Waiting for YouTube");
            return;
        }
        else if (WaitForTwitch) {
            SetPleaseWait("Waiting for Twitch");
            return;
        }
        if (ConnectedPollID.length <= 0 && ConnectedYTPoll.length <= 0) {
            SetPleaseWait("Checking active polls for YouTube & Twitch");
        }
        if (ConnectedPollID.length > 0 && ConnectedYTPoll.length <= 0) {
            SetPleaseWait("Checking active polls for YouTube");
        }
        if (ConnectedPollID.length <= 0 && ConnectedYTPoll.length > 0) {
            SetPleaseWait("Checking active polls for Twitch");
        }
        if (ConnectedPollID.length > 0 && ConnectedYTPoll.length > 0) {
            clearInterval(CheckForPolls);
            b("PleaseWait").style = "display: none;";
            if (ConnectedPollID == "NONE" && ConnectedYTPoll == "NONE") {
                b("CreatePollEditor").style = "";
                b('Create').style = "";
                b('NewEditor').style = "display: none;";
                b('GetPresets').style = "display: none;";
            }
            if (ConnectedPollID != "NONE" && ConnectedYTPoll == "NONE") {
                b("PollWarning").style = "";
                getElementClass("PollWarningText").innerText = "You currently have an active poll for Twitch. Do you want to continue creating a multistreaming Poll & end Twitch poll?";
            }
            if (ConnectedPollID == "NONE" && ConnectedYTPoll != "NONE") {
                b("PollWarning").style = "";
                getElementClass("PollWarningText").innerText = "You currently have an active poll for YouTube. Do you want to continue creating a multistreaming Poll & end YouTube poll?";
            }
            if (ConnectedPollID != "NONE" && ConnectedYTPoll != "NONE") {
                b("PollWarning").style = "";
                getElementClass("PollWarningText").innerText = "You currently have an active poll for both platforms. Do you want to continue creating a multistreaming Poll & end both polls?";
            }
        }
    }, 250);
}

function processToken(token) {
    access_token = token;
    fetch(
        'https://api.twitch.tv/helix/users',
        {
            "headers": {
                "Client-ID": client_id,
                "Authorization": "Bearer " + access_token
            }
        }
    )
        .then(resp => resp.json())
        .then(resp => {
            if (resp.error != undefined) {
                return Promise.reject(resp.error + ": " + resp.message);
            }
            if (resp.data[0].broadcaster_type === "") {
                return Promise.reject("not_a_affiliate");
            }
            if (window.location.hash.length > 0) window.location.hash = "#authorized";
            if (document.querySelectorAll("#ConnectedPlatforms > span")[0]) {
                document.querySelectorAll("#ConnectedPlatforms > span")[0].innerText = resp.data[0].display_name;
            }
            localStorage.setItem("saved_access_token", token);

            b("Display_C2").style.display = "";
            b("CB_TTV").checked = true;
            b("CB_TTV").addEventListener("click", OnUpdateCheckboxes);
            OnUpdateCheckboxes(null);
            PlatformsConnected.push("Twitch");

            getElementClass("Platform1").disabled = false;
            getElementClass("Platform1").classList.add("disconnect");
            getElementClass("Platform1").innerText = "Disconnect";
            getElementClass("Platform1").addEventListener('click', (ev) => {
                fetch(
                    'https://id.twitch.tv/oauth2/revoke',
                    {
                        "headers": {
                            "Content-Type": "application/x-www-form-urlencoded"
                        },
                        "method": "POST",
                        "body": `client_id=${client_id}&token=${token}`
                    }
                ).then(res => { location.reload(); })
            });
            getElementClass("Platform1").addEventListener('contextmenu', (ev) => {
                ev.preventDefault();
                // Twitch End endpoint for revoking access tokens.
                var revokeTokenEndpoint = 'https://id.twitch.tv/oauth2/revoke';

                // Create <form> element to use to POST data to the OAuth 2.0 endpoint.
                var form = document.createElement('form');
                form.setAttribute('method', 'post');
                form.setAttribute('action', revokeTokenEndpoint);

                var idField = document.createElement('input');
                idField.setAttribute('type', 'hidden');
                idField.setAttribute('name', 'client_id');
                idField.setAttribute('value', client_id);
                form.appendChild(idField);

                var tokenField = document.createElement('input');
                tokenField.setAttribute('type', 'hidden');
                tokenField.setAttribute('name', 'token');
                tokenField.setAttribute('value', token);
                form.appendChild(tokenField);

                // Add form to page and submit it to actually revoke the token.
                document.body.appendChild(form);
                form.submit();
            });

            // Add checkbox
            const Label = document.createElement('label');
            Label.className = "container";
            Label.innerText = "Show Chat";
            const InvisCheckbox = document.createElement('input');
            InvisCheckbox.type = "checkbox";
            let Click = (ev) => {
                if (InvisCheckbox.checked) {
                    b("TwitchChatDummyDoc").style.display = "";
                    b("TwitchChatDummyDoc").src = "https://www.twitch.tv/embed/" + resp.data[0].login + "/chat?parent=" + location.hostname
                }
                else {
                    b("TwitchChatDummyDoc").style.display = "none";
                    b("TwitchChatDummyDoc").src = "about:blank";
                }
                localStorage.setItem("ChatShow_TTV", InvisCheckbox.checked.toString().toLowerCase());
            }
            InvisCheckbox.addEventListener('click', Click);
            const Span = document.createElement('span');
            Span.className = "checkmark CB_TTV";
            Label.append(InvisCheckbox);
            Label.append(Span);
            InvisCheckbox.checked = (localStorage.getItem("ChatShow_TTV") ?? "true") === "true";
            Click(null);
            document.querySelector("#ConnectedPlatforms > br").after(Label);

            document.getElementById("AuthRequired").remove();
            SetPleaseWait("Waiting for YouTube & Twitch");
            let Val = 0;
            AddChecker();

            socket_space = new initSocket(true);
            // and build schnanaigans
            socket_space.on('connected', (id) => {
                log(`Connected to WebSocket with ${id}`);
                session_id = id;
                user_id = resp.data[0].id;
                checkPolls(resp.data[0].id);
                requestHooks(resp.data[0].id);
            });

            // socket_space.on('session_keepalive', () => {
            //     console.log("New Keepalive: " + new Date());
            // });

            socket_space.on('channel.poll.begin', (msg) => {
                let { metadata, payload } = msg;
                if (PastMessageIDs.includes(metadata.message_id)) {
                    console.error("Ignored Start Poll event due to duplicate message IDs (this is due to Twitch probably re-sending events)");
                    return;
                }
                PastMessageIDs.push(metadata.message_id);
                if (POLL_TYPE === "YT") return;
                let { event } = payload;
                ConnectedPollID = event.id;
                PollStarttime = new Date(event.started_at);
                PollEndtime = new Date(event.ends_at);
                SetTwitchPoll(event, true);
                b('PollResultsDiv').open = false;
            });
            socket_space.on('channel.poll.progress', (msg) => {
                let { metadata, payload } = msg;
                let { event } = payload;
                if (PastMessageIDs.includes(metadata.message_id)) {
                    console.error("Ignored Progress Poll event due to duplicate message IDs (this is due to Twitch probably re-sending events)");
                    return;
                }
                PastMessageIDs.push(metadata.message_id);
                if (POLL_TYPE === "YT") return;
                ConnectedPollID = event.id;
                SetTwitchPoll(event);
            });
            socket_space.on('channel.poll.end', (msg) => {
                let { metadata, payload } = msg;
                let { event } = payload;
                let { id } = event;
                if (PastMessageIDs.includes(metadata.message_id)) {
                    console.error("Ignored End Poll event due to duplicate message IDs (this is due to Twitch probably re-sending events)");
                    return;
                }
                PastMessageIDs.push(metadata.message_id);
                if (POLL_TYPE === "YT") return;
                if (id != ConnectedPollID) {
                    console.error("Ignored End Poll event since the current Poll ID does not match with the event (this is due to Twitch probably re-sending events)")
                    return;
                }
                SetTwitchPoll(event);
                document.removeEventListener("visibilitychange", OnPageShown);
                b('PollResultsDiv').style = "";
                b("CurrentPoll").style = "display: none;";
                clearInterval(IntervalIDForPoll);
                CalculateResults();
                ConnectedPollID = "NONE";
                // I realized that the poll results aren't finalized right away because the API has like a 2 second delay. We'll have to delay the request.
                if (POLL_TYPE === "TTV") {
                    b("CreatePollEditor").style = "";
                    b('Create').style = "";
                    b('NewEditor').style = "display: none;";
                    b('GetPresets').style = "display: none;";
                } else setTimeout(() => {
                    if (ConnectedYTPoll != "NONE" && ConnectedYTPoll != "ENDING") {
                        fetch(`https://www.googleapis.com/youtube/v3/liveChat/messages/transition?part=snippet&id=${ConnectedYTPoll}&status=closed`, { // End the poll, no matter the response result...
                            "method": "POST",
                            "headers": {
                                "Authorization": "Bearer " + YTAccessToken,
                                "Accept": "application/json"
                            }
                        }).then(async res => {
                            try {
                                ConnectedYTPoll = "NONE";
                                b("CreatePollEditor").style = "";
                                b('Create').style = "";
                                b('NewEditor').style = "display: none;";
                                b('GetPresets').style = "display: none;";
                                SetYTPollRes(await res.json());
                            } finally {
                                CalculateResults();
                            }
                        }).catch(err => {
                            console.error(err);
                        });
                    }
                }, 2000);
            });
            socket_space.on('channel.channel_points_custom_reward_redemption.add', (msg) => {
                let { metadata, payload } = msg;
                if (PastMessageIDs.includes(metadata.message_id)) {
                    console.error("Ignored Add Redemption event due to duplicate message IDs (this is due to Twitch probably re-sending events)");
                    return;
                }
                if (GetRedemptionData(payload.event.id) != null) {
                    console.error("Ignored Add Redemption event due to duplicate redemption IDs (this is due to Twitch probably re-sending events)");
                    return;
                }
                AddRedemption(payload.event);
            });
            socket_space.on('channel.channel_points_custom_reward_redemption.update', (msg) => {
                let { metadata, payload } = msg;
                let { event } = payload;
                if (PastMessageIDs.includes(metadata.message_id)) {
                    console.error("Ignored Update Status event due to duplicate message IDs (this is due to Twitch probably re-sending events)");
                    return;
                }
                if (GetRedemptionData(payload.event.id) == null) {
                    AddRedemption(payload.event);
                    return;
                }
                UpdateRedemption(payload.event);
            });
        })
        .catch(err => {
            console.error(err);

            ConnectedPollID = "NONE";

            log('Error with Users Call');
            localStorage.removeItem("saved_access_token");
            document.getElementById("AuthRequired").style = '';
            if (err === "not_a_affiliate") {
                b("AuthRequired").className = "Oops";
                b("AuthRequired").getElementsByTagName('img')[0].src = './cdn/Weirdge-perry8782-7tv.gif';
                b("AuthRequired").getElementsByTagName('span')[0].innerText = "We're sorry, but this account doesn't have access to create polls. Check your achievements to see how far you're from affiliate.";
                b("authorize").innerText = "Dismiss";
            }
            else {
                b("AuthRequired").className = "Oops";
                b("AuthRequired").getElementsByTagName('img')[0].src = './cdn/Weirdge-perry8782-7tv.gif';
                b("AuthRequired").getElementsByTagName('span')[0].innerText = "We could not access your Twitch account anymore. " + err;
                b("authorize").innerText = "Dismiss";
            }

            getElementClass("Platform1").disabled = false;
            getElementClass("Platform1").addEventListener('click', (ev) => {
                const State = ('ttv' + generateCryptoRandomState());
                localStorage.setItem('state', State);
                location.href = 'https://id.twitch.tv/oauth2/authorize?client_id=' + client_id + '&redirect_uri=' + encodeURIComponent(redirect) + '&response_type=token&scope=channel:read:redemptions+channel:manage:polls+channel:read:polls&state=' + State;
            });
            getElementClass("Platform1").addEventListener('contextmenu', (ev) => {
                ev.preventDefault();
                const State = ('ttv' + generateCryptoRandomState());
                localStorage.setItem('state', State);
                location.href = 'https://id.twitch.tv/oauth2/authorize?client_id=' + client_id + '&redirect_uri=' + encodeURIComponent(redirect) + '&response_type=token&scope=channel:manage:polls+channel:read:polls&state=' + State + '&force_verify=true'
            });
        });
}

let PastMessageIDs = [];
var SPAM_AMOUNT = 0;
var LAST_TIME = new Date();

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function CalculateResults() {
    b("Res_PollOption3").style = PE_O.length >= 3 ? "" : "display: none;";
    b("Res_PollOption4").style = PE_O.length >= 4 ? "" : "display: none;";
    b("Res_PollOption5").style = PE_O.length >= 5 ? "" : "display: none;";
    if ((typeof TwitchPoll === 'object' && TwitchPoll != null) && (typeof YouTubePoll === 'object' && YouTubePoll != null)) {
        b('PollResultsDiv').open = true;
        b("RPOpt1_TTV").parentElement.style = "display: flex;";
        b("RPOpt2_TTV").parentElement.style = "display: flex;";
        b("RPOpt3_TTV").parentElement.style = PE_O.length >= 3 ? "display: flex;" : "display: flex; display: none;";
        b("RPOpt4_TTV").parentElement.style = PE_O.length >= 4 ? "display: flex;" : "display: flex; display: none;";
        b("RPOpt5_TTV").parentElement.style = PE_O.length >= 5 ? "display: flex;" : "display: flex; display: none;";

        var CombinedVotes = Array(PE_O.length);
        var TwitchTotalVotes = 0;
        const YouTubeTotalVotes = YouTubePoll["Total"];
        for (let i = 0; i < TwitchPoll["votes"].length; i++) {
            TwitchTotalVotes += TwitchPoll["votes"][i];
            CombinedVotes[i] = TwitchPoll["votes"][i];
        }
        for (let i = 0; i < YouTubePoll["votes"].length; i++) {
            CombinedVotes[i] += YouTubePoll["votes"][i];
        }
        const CombinedTotal = TwitchTotalVotes + YouTubeTotalVotes;
        b("Res_PollQuestion").innerText = PE_Q

        if (POLL_TYPE === "YT" || POLL_TYPE === "TTV") {
            b("Res_PollQuestionInfo").innerText = " (" + numberWithCommas(CombinedTotal) + " Votes)";
        }
        else {
            b("Res_PollQuestionInfo").innerText = " (" + numberWithCommas(CombinedTotal) + " Votes) T: " + numberWithCommas(TwitchTotalVotes) + " Y: " + numberWithCommas(YouTubeTotalVotes);
        }

        for (let i = 0; i < CombinedVotes.length; i++) {
            if (POLL_TYPE === "YT" || POLL_TYPE === "TTV") {
                b("Res_PollOption" + (i + 1)).innerText = `${PE_O[i]} / ${Math.round(CombinedVotes[i] / ((CombinedTotal == 0) ? 1 : CombinedTotal) * 100)}% (${CombinedVotes[i]})`;
            }
            else {
                b("Res_PollOption" + (i + 1)).innerText = `${PE_O[i]} / ${Math.round(CombinedVotes[i] / ((CombinedTotal == 0) ? 1 : CombinedTotal) * 100)}% (${CombinedVotes[i]}) T: ${TwitchPoll["votes"][i]} Y: ${YouTubePoll["votes"][i]}`;
            }
            if (TwitchPoll["votes"][i] == 0 && YouTubePoll["votes"][i] > 0) {
                b('RPOpt' + (i + 1) + "_TTV").style.width = "0%";
                b('RPOpt' + (i + 1) + "_YT").style.borderTopLeftRadius = "25px";
                b('RPOpt' + (i + 1) + "_YT").style.borderBottomLeftRadius = "25px";
                b('RPOpt' + (i + 1) + "_YT").style.width = Math.round((YouTubePoll["votes"][i] / CombinedTotal) * 100) + "%";
            }
            else if (TwitchPoll["votes"][i] > 0 && YouTubePoll["votes"][i] == 0) {
                b('RPOpt' + (i + 1) + "_YT").style.width = "0%";
                b('RPOpt' + (i + 1) + "_TTV").style.borderTopRightRadius = "25px";
                b('RPOpt' + (i + 1) + "_TTV").style.borderBottomRightRadius = "25px";
                b('RPOpt' + (i + 1) + "_TTV").style.width = Math.round((TwitchPoll["votes"][i] / CombinedTotal) * 100) + "%";
            }
            else {
                b('RPOpt' + (i + 1) + "_YT").style.borderTopLeftRadius = "0";
                b('RPOpt' + (i + 1) + "_YT").style.borderBottomLeftRadius = "0";
                b('RPOpt' + (i + 1) + "_TTV").style.borderTopRightRadius = "0";
                b('RPOpt' + (i + 1) + "_TTV").style.borderBottomRightRadius = "0";
                b('RPOpt' + (i + 1) + "_TTV").style.width = Math.round((TwitchPoll["votes"][i] / CombinedTotal) * 100) + "%";
                b('RPOpt' + (i + 1) + "_YT").style.width = Math.round((YouTubePoll["votes"][i] / CombinedTotal) * 100) + "%";
            }
        }
        window.scrollTo(0, document.body.scrollHeight);
    }
}

function log(Message) {
    console.log(Message);
}

function YoutubeLinkHandler(ev) {
    if (localStorage.getItem('consent_agreed') === null) {
        location.href = './privacy.html?consent_needed';
        return;
    }
    // Google's OAuth 2.0 endpoint for requesting an access token
    var oauth2Endpoint = 'https://accounts.google.com/o/oauth2/v2/auth';

    // Create <form> element to submit parameters to OAuth 2.0 endpoint.
    var form = document.createElement('form');
    form.setAttribute('method', 'GET'); // Send as a GET request.
    form.setAttribute('action', oauth2Endpoint);

    const State = 'yt' + generateCryptoRandomState();
    localStorage.setItem('state', State);

    // Parameters to pass to OAuth 2.0 endpoint.
    var params = {
        'client_id': '597860444523-l87m271jorgmc0a9ea2vnn4ohqkmjphi.apps.googleusercontent.com',
        'redirect_uri': 'https://seenwalex.wixsite.com/chat-live/_functions/Red',
        'response_type': 'code',
        'access_type': 'offline',
        'scope': 'https://www.googleapis.com/auth/youtube',
        'include_granted_scopes': 'true',
        'state': State,
        'prompt': 'consent'
    };

    // Add form parameters as hidden input values.
    for (var p in params) {
        var input = document.createElement('input');
        input.setAttribute('type', 'hidden');
        input.setAttribute('name', p);
        input.setAttribute('value', params[p]);
        form.appendChild(input);
    }

    // Add form to page and submit it to open the OAuth 2.0 endpoint.
    document.body.appendChild(form);
    form.submit();
}

function requestHooks(user_id) {
    let topics = {
        'channel.poll.begin': { version: '1', condition: { broadcaster_user_id: user_id } },
        'channel.poll.progress': { version: '1', condition: { broadcaster_user_id: user_id } },
        'channel.poll.end': { version: '1', condition: { broadcaster_user_id: user_id } },
        'channel.channel_points_custom_reward_redemption.add': { version: '1', condition: { broadcaster_user_id: user_id } },
        'channel.channel_points_custom_reward_redemption.update': { version: '1', condition: { broadcaster_user_id: user_id } }
    }

    log(`Spawn Topics for ${user_id}`);

    for (let type in topics) {
        log(`Attempt create ${type} - ${user_id}`);
        let { version, condition } = topics[type];

        fetch(
            'https://api.twitch.tv/helix/eventsub/subscriptions',
            {
                "method": "POST",
                "headers": {
                    "Client-ID": client_id,
                    "Authorization": "Bearer " + access_token,
                    'Content-Type': 'application/json'
                },
                "body": JSON.stringify({
                    type,
                    version,
                    condition,
                    transport: {
                        method: "websocket",
                        session_id
                    }
                })
            }
        )
            .then(resp => resp.json())
            .then(resp => {
                if (resp.error) {
                    log(`Error with eventsub Call ${type} Call: ${resp.message ? resp.message : ''}`);
                } else {
                    log(`Created ${type}`);
                    if (type == "channel.channel_points_custom_reward_redemption.add") {
                        LoadCached();
                    }
                }
            })
            .catch(err => {
                console.log(err);
                log(`Error with eventsub Call ${type} Call: ${err.message ? err.message : ''}`);
            });
    }
}





function checkPolls(broadcaster_id) {
    console.log('Get Existing Poll');

    let url = new URL('https://api.twitch.tv/helix/polls');
    let params = {
        broadcaster_id
    };
    url.search = new URLSearchParams(params).toString();

    fetch(
        url,
        {
            "method": "GET",
            "headers": {
                "Client-ID": client_id,
                "Authorization": "Bearer " + access_token,
                'Accept': 'application/json'
            }
        }
    )
        .then(resp => resp.json())
        .then(resp => {
            if (resp.data && resp.data.length > 0) {
                log('Got Poll');
                if (resp.data[0].status == "ACTIVE") {
                    ConnectedPollID = resp.data[0].id;
                }
                else {
                    ConnectedPollID = "NONE";
                }
            } else {
                log('No Polls Available');
                ConnectedPollID = "NONE";
            }
        })
        .catch(err => {
            console.log(err);
            log(`Error with Polls Call Call: ${err.message ? err.message : ''}`);
        });
}

let TwitchPoll;

function SetTwitchPoll(JSON, MissingVotes = false) {
    try {
        let TP_Options = [];
        for (let index = 0; index < PE_O.length; index++) {
            if (PE_O[index].length > 0) {
                TP_Options.push(MissingVotes ? 0 : JSON.choices[index].votes);
            }
        }
        TwitchPoll = { "votes": TP_Options }
    } catch (error) {
        console.log(error);
    }

}

let YouTubePoll;

function SetYouTubePoll(Votes, Total) {
    YouTubePoll = { "votes": Votes, "Total": Total };
}

var PleaseWaitInterval = -1;

var PWText = "";
var PleaseWaitText = document.getElementsByClassName('PleaseWait')[0];

function SetPleaseWait(TextToInput) {
    b('PleaseWait').style = "";
    if (PWText == TextToInput) return;
    PWText = TextToInput;
    PleaseWaitText.innerText = TextToInput + EllipsisText[Ellipsis];
    if (PleaseWaitInterval == -1) {
        PleaseWaitInterval = setInterval(() => {
            if (Ellipsis < 3) {
                Ellipsis++;
            }
            else {
                Ellipsis = 0;
            }
            if (b('PleaseWait').style.display == "none") { clearInterval(PleaseWaitInterval); PleaseWaitInterval = -1; }
            if (document.hidden) return;
            PleaseWaitText.innerText = PWText + EllipsisText[Ellipsis];
        }, 200)
    }
}

var PE_Q = '';
var PE_O = ['', '', '', '']

function Editor_SetPollDetails(Question = "", Option1 = "", Option2 = "", Option3 = "", Option4 = "") {
    PE_Q = Question.length > 0 ? Question : "Vote...";
    PE_O[0] = Option1.length > 0 ? Option1 : "Yes";
    PE_O[1] = Option2.length > 0 ? Option2 : "No";
    PE_O[2] = Option3;
    PE_O[3] = Option4;
}
Editor_SetPollDetails();