const IsRunningFromApp = /MultistreamTools/i.test(navigator.userAgent);

var KickAccessToken = ""; // Kick
var access_token = ""; // Twitch
var YTAccessToken = ""; // YouTube

let WaitFor1 = true;
let WaitFor2 = true;
let WaitFor3 = true;

if (IsRunningFromApp) {
    document.querySelector("#ConnectedPlatforms").style.display = "none";
    // Back Button
    const BackButton = document.createElement('a');
    BackButton.className = "BackToConnectedAccounts";

    const newpath = document.createElementNS('http://www.w3.org/2000/svg', "path");
    newpath.setAttribute("fill", "#d3d3d3");
    newpath.setAttribute("d", "M32 15H3.41l8.29-8.29-1.41-1.42-10 10a1 1 0 0 0 0 1.41l10 10 1.41-1.41L3.41 17H32z");
    newpath.setAttribute("data-name", "4-Arrow Left");

    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttributeNS(null, 'viewBox', "0 0 32 32");

    icon.appendChild(newpath);
    BackButton.appendChild(icon);

    const label = document.createElement('span');
    label.innerText = "Manage Connected Accounts";
    BackButton.appendChild(label);

    document.body.insertBefore(BackButton, document.body.firstChild);
    BackButton.addEventListener('click', (ev) => {
        window.electronAPI.backToManageAccounts();
    });
}

async function LoadFromRecentStream() {
    document.querySelector('#YUHandler').disabled = true;
    document.querySelector('#YUHandler').innerText = "Checking Your Streams";
    try {
        let result = await fetch('https://youtube.googleapis.com/youtube/v3/liveBroadcasts?part=status&part=snippet&broadcastType=all&maxResults=20&mine=true', {
            "headers": {
                "Authorization": "Bearer " + YTAccessToken,
                "Accept": "application/json"
            }
        });
        let json = await result.json();
        if (json.pageInfo.totalResults <= 0) {
            document.querySelector('#YUHandler').disabled = false;
            document.querySelector('#YUHandler').innerText = "NO STREAMS FOUND!";
            setTimeout(() => { document.querySelector('#YUHandler').innerText = "Load from Recent"; }, 3000);
        }
        else {
            // Check if a stream is live
            const items = json.items;
            let RecentStream = undefined;
            for (const Stream of items) {
                if (Stream.status.lifeCycleStatus === "liveStarting" && Stream.status.lifeCycleStatus === "live") {
                    RecentStream = Stream;
                    break;
                }
            }
            if (!RecentStream) {
                let Dat = new Date(0);
                for (const Stream of items) {
                    if (Stream.status.lifeCycleStatus !== "complete" && (Stream.snippet.scheduledStartTime || "") !== "") {
                        let This = new Date(Stream.snippet.scheduledStartTime);
                        if (This > Dat) {
                            Dat = This;
                            RecentStream = Stream;
                        }
                    }
                }
            }
            if (!RecentStream) {
                RecentStream = items[0];
            }

            document.querySelector('#YUHandler').disabled = false;
            document.querySelector('#YUHandler').innerText = "Load from Recent";
            document.querySelector('#YouTubeURL').value = 'https://youtube.com/live/' + RecentStream.id;
            LoadURL();
        }
    } catch (error) {
        console.error(error);
        document.querySelector('#YUHandler').disabled = false;
        document.querySelector('#YUHandler').innerText = "AN INTERNAL ERROR OCCURRED!";
        setTimeout(() => { document.querySelector('#YUHandler').innerText = "Load from Recent"; }, 3000);
    }
}

async function handleConnectedAccounts() {
    (async function () {
        if (localStorage.getItem('saved_access_token_e') != null) {
            document.querySelector(".Platform1").innerText = "Connecting";
            document.querySelector(".Platform1").disabled = true;
            WaitFor1 = false;
            if ((await EncStorage.getItem('saved_refresh_token')) != null) {
                TWInitRefresh((await EncStorage.getItem('saved_refresh_token')), -1)
                    .then(async (v) => {
                        if (!v) return Promise.reject("You must verify again to continue with Twitch");
                        processToken((await EncStorage.getItem('saved_access_token')));
                    }).catch(async err => {
                        console.error(err);
                        processToken((await EncStorage.getItem('saved_access_token')));
                    });
            } else processToken((await EncStorage.getItem('saved_access_token')));
        }
    })();

    (async function () {
        if (localStorage.getItem('ytsavedtoken_e') != null) {
            document.querySelector(".Platform2").innerText = "Connecting";
            document.querySelector(".Platform2").disabled = true;
            WaitFor2 = false;
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
        }
    })();

    (async function () {
        if (localStorage.getItem('kkactoken_e') != null) {
            document.querySelector(".Platform3").innerText = "Connecting";
            document.querySelector(".Platform3").disabled = true;
            WaitFor3 = false;
            if ((await EncStorage.getItem('kkrefresh')) != null) {
                TWInitRefresh((await EncStorage.getItem('kkrefresh')), -1)
                    .then(async (v) => {
                        if (!v) return Promise.reject("You must verify again to continue with Kick");
                        KickGatherUser();
                    }).catch(async err => {
                        console.error(err);
                        KickGatherUser();
                    });
            } else KickGatherUser();
        }
    })();
}

function handleButtons() {
    document.querySelector(".Platform1").addEventListener('click', (ev) => {
        if (access_token.length > 0) return;
        document.querySelector(".Platform1").disabled = true;

        localStorage.setItem("RedirectTo", location.pathname);

        if (localStorage.getItem('warning_agreed') === null && !IsRunningFromApp) {
            location.href = '../auth/twitch-warning';
            return;
        }
        location.href = '../auth/start?type=Twitch' + (IsRunningFromApp ? "&isapp=1" : "");
    });

    document.querySelector(".Platform2").addEventListener('click', (ev) => {
        if (YTAccessToken.length > 0) return;
        document.querySelector(".Platform2").disabled = true;

        localStorage.setItem("RedirectTo", location.pathname);

        if (localStorage.getItem('consent_agreed') === null) {
            location.href = '../privacy.html?consent_needed' + (IsRunningFromApp ? "_app" : "");
            return;
        }
        location.href = '../auth/start?type=YouTube' + (IsRunningFromApp ? "&isapp=1" : "");
    });

    document.querySelector(".Platform3").addEventListener('click', (ev) => {
        if (KickAccessToken.length > 0) return;
        document.querySelector(".Platform3").disabled = true;

        localStorage.setItem("RedirectTo", location.pathname);

        location.href = '../auth/start?type=Kick' + (IsRunningFromApp ? "&isapp=1" : "");
    });
}

function LoadURL() {
    let URL = document.querySelector("#YouTubeURL").value;
    const Changed = URL != localStorage.getItem("saved_url");
    localStorage.setItem("saved_url", URL);
    var regExp = /.*(?:youtu.be\/|v\/|u\/\w\/|live\/|watch\?v=)([^#\&\?]*).*/;
    try {
        LinkId = URL.match(regExp)[1];

        if (Changed) {
            document.querySelector("#MultistreamChat").querySelector('iframe').contentWindow.location.reload();
            if (WaitFor1 && WaitFor2 && WaitFor3) {
                clearTimeout(IntervalUpdate);
                UpdateCombinedViewsCount();
            }
        }
        let OldText = document.querySelector("#YouTubeConnectionURL").querySelector("span").innerHTML;

        if (!OldText.includes("invalid") && !OldText.includes("loaded")) {
            document.querySelector("#YouTubeConnectionURL").querySelector("span").innerHTML = "Successfully loaded!";
            document.querySelector("#YouTubeConnectionURL").querySelector("span").style.color = "green";
            setTimeout(() => {
                document.querySelector("#YouTubeConnectionURL").querySelector("span").innerHTML = OldText;
                document.querySelector("#YouTubeConnectionURL").querySelector("span").style.color = "";
            }, 1000)
        }
    } catch (error) {
        console.error(error);

        localStorage.setItem("saved_url", "");

        let OldText = document.querySelector("#YouTubeConnectionURL").querySelector("span").innerText;
        if (!OldText.includes("invalid") && !OldText.includes("loaded")) {
            document.querySelector("#YouTubeConnectionURL").querySelector("span").innerText = "Invalid YouTube URL!";
            document.querySelector("#YouTubeConnectionURL").querySelector("span").style.color = "red";
            setTimeout(() => {
                document.querySelector("#YouTubeConnectionURL").querySelector("span").innerText = OldText;
                document.querySelector("#YouTubeConnectionURL").querySelector("span").style.color = "";
            }, 1000)
        }
    }
}

let user_id = "";
let kick_user_id = "";
let LinkId = "";
let ShortsLinkId = "";

let IntervalUpdate = -1;
let CancelSignals = [];
const client_id = 'b5d3338b79q2xza4zab9j5g9vhk7is';

/***
 * @type {Window}
 */
let PoppedOutWindow = undefined;

let IsSetup = false;
function SetupDashboard() {
    if (IsSetup) return;
    IsSetup = true;

    document.querySelector("#Dashboard").style.display = "";

    document.querySelector("#MultistreamChat").querySelector('iframe').src = "chat";
    document.querySelector("#MultistreamChat").querySelector(".Popout").addEventListener('click', (ev) => {
        if (PoppedOutWindow && !PoppedOutWindow.closed) return;
        document.querySelector("#MultistreamChat").querySelector('iframe').src = "../alerts/popped-out.html";
        document.querySelector("#MultistreamChat").querySelector(".Popout").disabled = true;

        PoppedOutWindow = window.open("chat", "_blank", "width=450,height=600,popup");
        PoppedOutWindow.addEventListener('load', () => {
            PoppedOutWindow.addEventListener('beforeunload', () => {
                document.querySelector("#MultistreamChat").querySelector('iframe').src = "chat";
                document.querySelector("#MultistreamChat").querySelector(".Popout").disabled = false;
                PoppedOutWindow = undefined;
            });
        });
    });
    document.querySelector("#MultistreamChat").querySelector(".Collapse").addEventListener('click', (ev) => {
        const button = document.querySelector("#MultistreamChat").querySelector(".Collapse");
        if (!button.classList.contains("Collapsed")) {
            button.classList.add("Collapsed");
            button.parentElement.parentElement.classList.add("Collapse");
        }
        else {
            button.classList.remove("Collapsed");
            button.parentElement.parentElement.classList.remove("Collapse");
        }
    });

    document.querySelector("#CombinedViews").querySelector(".Collapse").addEventListener('click', (ev) => {
        const button = document.querySelector("#CombinedViews").querySelector(".Collapse");
        if (!button.classList.contains("Collapsed")) {
            button.classList.add("Collapsed");
            button.parentElement.parentElement.classList.add("Collapse");

            clearInterval(IntervalUpdate);
            if (CancelSignals.length > 0) {
                for (let CancelSignal of CancelSignals) {
                    CancelSignal.abort();
                }
            }
        }
        else {
            button.classList.remove("Collapsed");
            button.parentElement.parentElement.classList.remove("Collapse");

            // Combined Views Count
            if (WaitFor1 && WaitFor2 && WaitFor3)
                UpdateCombinedViewsCount();
        }
    });

    InitializeButtons();

    // Combined Views Count
    UpdateCombinedViewsCount();
}

function ToggleYTMessagesReceiver(ReceiverOn) {
    if (ReceiverOn) {
        const Win = PoppedOutWindow || document.querySelector("#MultistreamChat").querySelector('iframe').contentWindow;
        Win.postMessage({ type: "startReceiveYT" });
    }
    else {
        const Win = PoppedOutWindow || document.querySelector("#MultistreamChat").querySelector('iframe').contentWindow;
        Win.postMessage({ type: "stopReceiveYT" });
    }
}

function InitializeButtons() {
    const Buttons = document.querySelector("#FullSize");
    while (Buttons.firstChild) {
        Buttons.removeChild(Buttons.lastChild);
    }

    Buttons.removeAttribute('class');
    YouTubePollWeb = undefined;

    const UpdateTitle = document.createElement('button');
    UpdateTitle.innerText = "Change Title";
    Buttons.appendChild(UpdateTitle);
    UpdateTitle.addEventListener('click', InitializeTitleWidget)

    if (localStorage.getItem('saved_access_token_e') != null || localStorage.getItem('ytsavedtoken_e') != null) {
        const ManagePolls = document.createElement('button');
        ManagePolls.innerText = "Manage Combined Polls";

        ManagePolls.addEventListener('click', InitializePollWidget);
        Buttons.appendChild(ManagePolls);
    }
}

function InitializePollWidget() {
    const Buttons = document.querySelector("#FullSize");
    Buttons.className = "PollWidget";
    while (Buttons.firstChild) {
        Buttons.removeChild(Buttons.lastChild);
    }

    const Back = document.createElement('button');
    Back.innerText = "Back";
    Buttons.appendChild(Back);
    Back.addEventListener('click', InitializeButtons);

    const iFrame = document.createElement('iframe');
    iFrame.src = "../polling";
    YouTubePollWeb = iFrame;
    Buttons.appendChild(iFrame);
}

function InitializeTitleWidget() {
    const Buttons = document.querySelector("#FullSize");
    Buttons.className = "TitleWidget";
    while (Buttons.firstChild) {
        Buttons.removeChild(Buttons.lastChild);
    }

    const Back = document.createElement('button');
    Back.className = "Back";
    Back.innerText = "Back";
    Buttons.appendChild(Back);
    Back.addEventListener('click', InitializeButtons);

    const createField = (name, placeholder, length, input = "") => {
        const title = document.createElement('input')
        title.type = "text";
        title.maxLength = length;
        title.name = name;
        title.placeholder = placeholder;
        title.value = input;
        return title;
    };
    const createLabel = (label, Icon = null) => {
        const scroller = document.createElement('div');
        scroller.className = "scrolldiv";

        if (Icon) {
            const img = document.createElement('img');
            img.src = Icon;
            scroller.appendChild(img);
            scroller.classList.add("HasImg");
        }

        const title = document.createElement('span')
        title.innerText = label;
        scroller.appendChild(title);
        return scroller;
    };

    const createText = (label, color = "") => {
        const title = document.createElement((color === "") ? 'span' : 'p')
        title.className = "RegularText"
        title.innerText = label;
        title.style.color = color;
        return title;
    };

    Buttons.appendChild(createLabel("Title to Apply"));
    const Field = createField("GlobalTitle", "Add title to change, check formats below", 100);
    Buttons.appendChild(Field);

    Buttons.appendChild(createText("Will change to the following with formats:"));

    let TwitchField = undefined;
    let YTField = undefined;
    let KickField = undefined;

    let TwitchLabel = undefined;
    let YTLabel = undefined;
    let KickLabel = undefined;

    let YTCategoryId = "20";

    // Twitch
    if (access_token.length > 0) {
        TwitchLabel = createLabel("Checking...", "cdn/glitch_flat_purple.svg");
        TwitchField = createField("Title_Twitch", "Title in Twitch", 140, (() => {
            if (localStorage.getItem('tformat_twitch') !== null) {
                return localStorage.getItem('tformat_twitch');
            }
            return "{TITLE}";
        })());
        TwitchField.addEventListener('change', () => {
            localStorage.setItem('tformat_twitch', TwitchField.value);
        });
        Buttons.appendChild(TwitchLabel);
        Buttons.appendChild(TwitchField);

        fetch('https://api.twitch.tv/helix/channels?broadcaster_id=' + user_id, {
            "headers": {
                "Authorization": "Bearer " + access_token,
                "Client-Id": client_id
            }
        }).then(res => res.json())
            .then(res => {
                if (res.data && Array.isArray(res.data)) {
                    if (res.data.length <= 0) {
                        TwitchLabel.querySelector('span').innerText = "Not Live";
                        return;
                    }
                    TwitchLabel.querySelector('span').innerText = res.data[0].title || "[NO TITLE]";
                }
                else {
                    return Promise.reject("Error from server");
                }
            }).catch(err => {
                console.error(err);
                TwitchLabel.querySelector('span').innerText = "Failed to check";
            })
    }

    // YouTube
    if (YTAccessToken.length > 0 && LinkId.length > 0) {
        YTLabel = createLabel("Checking...", "cdn/yt_icon_rgb.webp");
        YTField = createField("Title_YT", "Title in YouTube", 140, (() => {
            if (localStorage.getItem('tformat_yt') !== null) {
                return localStorage.getItem('tformat_yt');
            }
            return "{TITLE}";
        })());
        YTField.addEventListener('change', () => {
            localStorage.setItem('tformat_yt', YTField.value);
        });
        Buttons.appendChild(YTLabel);
        Buttons.appendChild(YTField);

        fetch('https://www.googleapis.com/youtube/v3/videos?part=snippet&id=' + LinkId, {
            "headers": {
                "Authorization": "Bearer " + YTAccessToken
            }
        }).then(res => res.json())
            .then(res => {
                if (res.items && Array.isArray(res.items)) {
                    if (res.items.length <= 0) {
                        YTLabel.querySelector('span').innerText = "Not Live";
                        return;
                    }
                    YTCategoryId = res.items[0].snippet.categoryId;
                    YTLabel.querySelector('span').innerText = res.items[0].snippet.title || "[NO TITLE]";
                }
                else {
                    return Promise.reject("Error from server");
                }
            }).catch(err => {
                console.error(err);
                YTLabel.querySelector('span').innerText = "Failed to check";
            })
    }

    // Kick
    if (KickAccessToken.length > 0) {
        KickLabel = createLabel("Checking...", "cdn/kick_icon.svg");
        KickField = createField("Title_Kick", "Title in Kick", 140, (() => {
            if (localStorage.getItem('tformat_kick') !== null) {
                return localStorage.getItem('tformat_kick');
            }
            return "{TITLE}";
        })());
        KickField.addEventListener('change', () => {
            localStorage.setItem('tformat_kick', KickField.value);
        });
        Buttons.appendChild(KickLabel);
        Buttons.appendChild(KickField);

        fetch('https://api.kick.com/public/v1/channels', {
            "headers": {
                "Authorization": "Bearer " + KickAccessToken
            }
        }).then(res => res.json())
            .then(res => {
                if (res.data && Array.isArray(res.data)) {
                    if (res.data.length <= 0) {
                        KickLabel.querySelector('span').innerText = "Not Live";
                        return;
                    }
                    KickLabel.querySelector('span').innerText = res.data[0].stream_title || "[NO TITLE]";
                }
                else {
                    return Promise.reject("Error from server");
                }
            }).catch(err => {
                console.error(err);
                KickLabel.querySelector('span').innerText = "Failed to check";
            })
    }

    const WarningsDiv = document.createElement('div');
    WarningsDiv.className = "Warnings";

    const SubmitButton = document.createElement('button');
    SubmitButton.innerText = "Change & Apply";
    SubmitButton.addEventListener('click', (ev) => {
        if (Field.length <= 0) return;
        if (KickField && KickField.value.length <= 0) {
            return;
        }
        if (YTField && YTField.value.length <= 0) {
            return;
        }
        if (TwitchField && TwitchField.value.length <= 0) {
            return;
        }

        while (WarningsDiv.firstChild) {
            WarningsDiv.removeChild(WarningsDiv.lastChild);
        }

        SubmitButton.disabled = true;

        if (access_token.length > 0) {
            let Title = TwitchField.value.replace("{TITLE}", Field.value);
            if (Title.length > 140) {
                WarningsDiv.appendChild(createText(`Twitch's title was cropped out because it's too long (${Title.length}/140)`, "yellow"));
                Title = Title.substring(0, 140);
            }

            fetch('https://api.twitch.tv/helix/channels?broadcaster_id=' + user_id, {
                "method": "PATCH",
                "headers": {
                    "Authorization": "Bearer " + access_token,
                    "Content-Type": "application/json",
                    "Client-Id": client_id
                },
                "body": JSON.stringify({
                    "title": Title || "TITLE NOT SET!"
                })
            }).then(res => {
                if (res.ok) {
                    WarningsDiv.appendChild(createText(`Title successfully changed! (Twitch)`, "green"));
                    TwitchLabel.querySelector('span').innerText = Title;
                    SubmitButton.disabled = false;
                }
                else {
                    return Promise.reject("Failed");
                }
            }).catch(err => {
                console.error(err);
                WarningsDiv.appendChild(createText(`Failed to change title on Twitch.`, "red"));
                SubmitButton.disabled = false;
            });
        }

        if (YTField) {
            let Title = YTField.value.replace("{TITLE}", Field.value);
            if (Title.length > 100) {
                WarningsDiv.appendChild(createText(`YouTube's title was cropped out because it's too long (${Title.length}/100)`, "yellow"));
                Title = Title.substring(0, 100);
            }

            fetch('https://www.googleapis.com/youtube/v3/videos?part=snippet', {
                "method": "PUT",
                "headers": {
                    "Authorization": "Bearer " + YTAccessToken,
                    "Content-Type": "application/json"
                },
                "body": JSON.stringify({
                    "id": LinkId,
                    "snippet": {
                        "title": Title || "TITLE NOT SET!",
                        "categoryId": YTCategoryId
                    }
                })
            }).then(res => {
                if (res.ok) {
                    WarningsDiv.appendChild(createText(`Title successfully changed! (YouTube)`, "green"));
                    YTLabel.querySelector('span').innerText = Title;
                    SubmitButton.disabled = false;
                }
                else {
                    return Promise.reject("Failed");
                }
            }).catch(err => {
                console.error(err);
                WarningsDiv.appendChild(createText(`Failed to change title on YouTube.`, "red"));
                SubmitButton.disabled = false;
            });
        }

        if (KickAccessToken.length > 0) {
            let Title = KickField.value.replace("{TITLE}", Field.value);
            if (Title.length > 140) {
                WarningsDiv.appendChild(createText(`Kick's title was cropped out because it's too long (${Title.length}/140)`, "yellow"));
                Title = Title.substring(0, 140);
            }

            fetch('https://api.kick.com/public/v1/channels', {
                "method": "PATCH",
                "headers": {
                    "Authorization": "Bearer " + KickAccessToken,
                    "Content-Type": "application/json"
                },
                "body": JSON.stringify({
                    "stream_title": Title || "TITLE NOT SET!"
                })
            }).then(res => {
                if (res.ok) {
                    WarningsDiv.appendChild(createText(`Title successfully changed! (Kick)`, "green"));
                    KickLabel.querySelector('span').innerText = Title;
                    SubmitButton.disabled = false;
                }
                else {
                    return Promise.reject("Failed");
                }
            }).catch(err => {
                console.error(err);
                WarningsDiv.appendChild(createText(`Failed to change title on Kick.`, "red"));
                SubmitButton.disabled = false;
            });
        }
    });
    Buttons.appendChild(document.createElement('br'))
    Buttons.appendChild(SubmitButton);
    Buttons.appendChild(WarningsDiv);

}

let Count1 = 0;
let Count2 = 0;
let Count3 = 0;

function UpdateCombinedViewsCount() {
    const TotalCount = document.querySelector(".CVTotal");

    let IsChecked1 = access_token.length <= 0;
    let IsChecked2 = YTAccessToken.length <= 0 || LinkId.length <= 0;
    let IsChecked3 = KickAccessToken.length <= 0;

    if (document.querySelector("#CombinedViews").classList.contains("Collapse")) return; // Don't.

    if (access_token.length > 0) {
        const TTVCount = document.querySelector('#CVTwitch');
        TTVCount.removeAttribute('style');

        let AbortSignal = new AbortController();
        CancelSignals.push(AbortSignal);

        fetch("https://api.twitch.tv/helix/streams?user_id=" + user_id + "&type=live", {
            "headers": {
                "Client-ID": client_id,
                "Authorization": "Bearer " + access_token
            },
            "signal": AbortSignal.signal
        }).then(res => {
            const index = CancelSignals.indexOf(AbortSignal);
            if (index > -1) { // only splice array when item is found
                CancelSignals.splice(index, 1); // 2nd parameter means remove one item only
            }

            if (!res.ok) return Promise.reject("An error occurred");
            return res.json();
        }).then(json => {
            if (!json.data[0]) {
                return Promise.reject("Not live!");
            }
            IsChecked1 = true;
            Count1 = json.data[0].viewer_count;
            TTVCount.querySelector('a').innerText = Count1.toLocaleString();
            TTVCount.querySelector('a').classList.remove("NotLive");

            if (IsChecked1 && IsChecked2 && IsChecked3) {
                const Num = Count1 + Count2 + Count3;
                TotalCount.innerText = Num.toLocaleString();

                IntervalUpdate = setTimeout(UpdateCombinedViewsCount, 60000);
            }
        }).catch(err => {
            const index = CancelSignals.indexOf(AbortSignal);
            if (index > -1) { // only splice array when item is found
                CancelSignals.splice(index, 1); // 2nd parameter means remove one item only
            }

            console.error("Twitch:", err);

            IsChecked1 = true;
            TTVCount.querySelector('a').classList.add("NotLive");
            if (Count1 === 0) TTVCount.querySelector('a').innerText = Count1.toString();

            if (IsChecked1 && IsChecked2 && IsChecked3) {
                const Num = Count1 + Count2 + Count3;
                TotalCount.innerText = Num.toLocaleString();

                IntervalUpdate = setTimeout(UpdateCombinedViewsCount, 60000);
            }
        });
    }

    if (YTAccessToken.length > 0) {
        const YTCount = document.querySelector('#CVYouTube');
        YTCount.removeAttribute('style');

        let AbortSignal = new AbortController();
        CancelSignals.push(AbortSignal);

        fetch("https://www.googleapis.com/youtube/v3/videos?part=snippet&part=liveStreamingDetails&id=" + LinkId, {
            "headers": {
                "Authorization": "Bearer " + YTAccessToken
            },
            "signal": AbortSignal.signal
        }).then(res => {
            const index = CancelSignals.indexOf(AbortSignal);
            if (index > -1) { // only splice array when item is found
                CancelSignals.splice(index, 1); // 2nd parameter means remove one item only
            }

            if (!res.ok) return Promise.reject("An error occurred");
            return res.json();
        }).then(json => {
            if (!json.items[0]) {
                return Promise.reject("Live doesn't exist");
            }
            if (!json.items[0].liveStreamingDetails.concurrentViewers) {
                return Promise.reject("Not live!");
            }
            IsChecked2 = true;
            Count2 = json.items[0].liveStreamingDetails.concurrentViewers;
            YTCount.querySelector('a').innerText = Count2.toLocaleString();
            YTCount.querySelector('a').classList.remove("NotLive");

            if (IsChecked1 && IsChecked2 && IsChecked3) {
                const Num = Count1 + Count2 + Count3;
                TotalCount.innerText = Num.toLocaleString();

                IntervalUpdate = setTimeout(UpdateCombinedViewsCount, 60000);
            }
        }).catch(err => {
            const index = CancelSignals.indexOf(AbortSignal);
            if (index > -1) { // only splice array when item is found
                CancelSignals.splice(index, 1); // 2nd parameter means remove one item only
            }

            console.error("YouTube:", err);

            IsChecked2 = true;
            YTCount.querySelector('a').classList.add("NotLive");
            if (Count2 === 0) YTCount.querySelector('a').innerText = Count2.toString();

            if (IsChecked1 && IsChecked2 && IsChecked3) {
                const Num = Count1 + Count2 + Count3;
                TotalCount.innerText = Num.toLocaleString();

                IntervalUpdate = setTimeout(UpdateCombinedViewsCount, 60000);
            }
        });
    }

    if (KickAccessToken.length > 0) {
        const KickCount = document.querySelector('#CVKick');
        KickCount.removeAttribute('style');

        let AbortSignal = new AbortController();
        CancelSignals.push(AbortSignal);

        fetch("https://api.kick.com/public/v1/livestreams?broadcaster_user_id=" + kick_user_id, {
            "headers": {
                "Authorization": "Bearer " + KickAccessToken
            },
            "signal": AbortSignal.signal
        }).then(res => {
            const index = CancelSignals.indexOf(AbortSignal);
            if (index > -1) { // only splice array when item is found
                CancelSignals.splice(index, 1); // 2nd parameter means remove one item only
            }

            if (!res.ok) return Promise.reject("An error occurred");
            return res.json();
        }).then(json => {
            if (!json.data[0]) {
                return Promise.reject("Not live!");
            }
            IsChecked3 = true;
            Count3 = json.data[0].viewer_count;
            KickCount.querySelector('a').innerText = Count3.toLocaleString();
            KickCount.querySelector('a').classList.remove("NotLive");

            if (IsChecked1 && IsChecked2 && IsChecked3) {
                const Num = Count1 + Count2 + Count3;
                TotalCount.innerText = Num.toLocaleString();

                IntervalUpdate = setTimeout(UpdateCombinedViewsCount, 60000);
            }
        }).catch(err => {
            const index = CancelSignals.indexOf(AbortSignal);
            if (index > -1) { // only splice array when item is found
                CancelSignals.splice(index, 1); // 2nd parameter means remove one item only
            }

            console.error("Kick:", err);

            IsChecked3 = true;
            KickCount.querySelector('a').classList.add("NotLive");
            if (Count3 === 0) KickCount.querySelector('a').innerText = Count3.toString();

            if (IsChecked1 && IsChecked2 && IsChecked3) {
                const Num = Count1 + Count2 + Count3;
                TotalCount.innerText = Num.toLocaleString();

                IntervalUpdate = setTimeout(UpdateCombinedViewsCount, 60000);
            }
        });
    }
}

window.addEventListener('message', EventReceived);

let YouTubePollWeb = undefined;

function EventReceived(ev) {
    const data = ev.data;
    if (data.type === "closePopout") {
        if (PoppedOutWindow) {
            PoppedOutWindow.close();
        }
        else {
            document.querySelector("#MultistreamChat").querySelector('iframe').src = "chat";
            ocument.querySelector("#MultistreamChat").querySelector(".Popout").disabled = false;
        }
    }
    if (data.type === "ytChatReceived") {
        if (YouTubePollWeb) {
            YouTubePollWeb.contentWindow.postMessage({
                "type": "ytChatReceived",
                "data": data.data
            });
        }
    }
    if (data.type === "startReceiveYT") {
        ToggleYTMessagesReceiver(true);
    }
    if (data.type === "stopReceiveYT") {
        ToggleYTMessagesReceiver(false);
    }

    if (data.type === "twNewToken") { // Renewed from Refresh Token    
        access_token = data.data.t;
        if (YouTubePollWeb) {
            YouTubePollWeb.contentWindow.postMessage({
                "type": data.type,
                "data": data.data
            });
        }
        if (IsRunningFromApp) {
            window.electronAPI.setNewToken("ttv", data.data.t, data.data.r, data.data.expires_in);
        }
    }
    if (data.type === "ytNewToken") { // Renewed from Refresh Token
        YTAccessToken = data.data.t;
        if (YouTubePollWeb) {
            YouTubePollWeb.contentWindow.postMessage({
                "type": data.type,
                "data": data.data
            });
        }
        if (IsRunningFromApp) {
            window.electronAPI.setNewToken("yt", data.data.t, data.data.r, data.data.expires_in);
        }
    }
    if (data.type === "kkNewToken") { // Renewed from Refresh Token
        KickAccessToken = data.data.t;
        if (IsRunningFromApp) {
            window.electronAPI.setNewToken("kk", data.data.t, data.data.r, data.data.expires_in);
        }
    }
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
            if (document.querySelectorAll("#ConnectedPlatforms > div")[0]) {
                document.querySelectorAll("#ConnectedPlatforms > div")[0].querySelector("span").innerText = resp.data[0].display_name;
            }

            user_id = resp.data[0].id;
            SetupDashboard();

            document.querySelector(".Platform1").disabled = false;
            document.querySelector(".Platform1").classList.add("disconnect");
            document.querySelector(".Platform1").innerText = "Disconnect";
            document.querySelector(".Platform1").addEventListener('click', (ev) => {
                document.querySelector(".Platform1").disabled = true;
                fetch(
                    'https://id.twitch.tv/oauth2/revoke',
                    {
                        "headers": {
                            "Content-Type": "application/x-www-form-urlencoded"
                        },
                        "method": "POST",
                        "body": `client_id=${client_id}&token=${access_token}`
                    }
                ).then(res => { location.reload(); })
            });
            document.querySelector(".Platform1").addEventListener('contextmenu', (ev) => {
                document.querySelector(".Platform1").disabled = true;
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
                tokenField.setAttribute('value', access_token);
                form.appendChild(tokenField);

                // Add form to page and submit it to actually revoke the token.
                document.body.appendChild(form);
                form.submit();
            });

            WaitFor1 = true;
            if (WaitFor1 && WaitFor2 && WaitFor3)
                SetupDashboard();
        }).catch(err => {
            console.error(err);

            access_token = "";
            EncStorage.removeItem("saved_access_token");
            EncStorage.removeItem("saved_refresh_token");

            document.querySelector(".Platform1").innerText = "Connect";
            document.querySelector(".Platform1").disabled = false;

            const message = err;
            const errorText = document.createElement('a');
            errorText.innerText = message;
            document.querySelector(".Platform1").parentElement.appendChild(errorText);

            WaitFor1 = true;
            if (WaitFor1 && WaitFor2 && WaitFor3)
                SetupDashboard();
        });
}

function verifyYTToken(token) {
    YTAccessToken = token;
    fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true&access_token=' + token)
        .then(async result => {
            if (!result.ok) return Promise.reject(await result.json());
            if (document.querySelectorAll("#ConnectedPlatforms > div")[1]) {
                result.json().then(res => {
                    document.querySelectorAll("#ConnectedPlatforms > div")[1].querySelector("span").innerText = res.items[0].snippet.title;
                });
            }

            document.querySelector("#YouTubeConnectionURL").style.display = "";

            // Disconnect
            document.querySelector(".Platform2").disabled = false;
            document.querySelector(".Platform2").classList.add("disconnect");
            document.querySelector(".Platform2").innerText = "Disconnect";
            document.querySelector(".Platform2").addEventListener('click', (ev) => {
                document.querySelector(".Platform2").disabled = true;
                fetch(
                    'https://oauth2.googleapis.com/revoke',
                    {
                        "headers": {
                            "Content-Type": "application/x-www-form-urlencoded"
                        },
                        "method": "POST",
                        "body": `token=${YTAccessToken}`
                    }
                ).then(res => { location.reload(); })
            });
            document.querySelector(".Platform2").addEventListener('contextmenu', (ev) => { // Left click will show the page.
                ev.preventDefault();

                document.querySelector(".Platform2").disabled = true;
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
                tokenField.setAttribute('value', YTAccessToken);
                form.appendChild(tokenField);

                // Add form to page and submit it to actually revoke the token.
                document.body.appendChild(form);
                form.submit();
            });

            if (localStorage.getItem('saved_url') != null && localStorage.getItem('saved_url').length > 0) {
                document.querySelector("#YouTubeURL").value = localStorage.getItem('saved_url');
                LoadURL();
            }

            document.querySelector('#YUHandler').addEventListener('click', LoadFromRecentStream);

            WaitFor2 = true;
            if (WaitFor1 && WaitFor2 && WaitFor3)
                SetupDashboard();
        })
        .catch(err => {
            if (err.error && err.error.errors) {
                if (err.error.errors[0].reason === "quotaExceeded") {
                    document.querySelector(".Platform2").innerText = "Disconnect";
                    document.querySelector(".Platform2").disabled = false;
                    document.querySelector(".Platform2").addEventListener('click', (ev) => {
                        document.querySelector(".Platform2").disabled = true;
                        EncStorage.removeItem('ytsavedtoken');
                        EncStorage.removeItem('ytrefresh');
                        location.reload();
                    });
                    console.warn("Authentication is held due to exceeding the quota.");
                    return;
                }
            }
            console.error(err);

            EncStorage.removeItem('ytsavedtoken');
            EncStorage.removeItem('ytrefresh');

            document.querySelector(".Platform2").innerText = "Connect";
            document.querySelector(".Platform2").disabled = false;

            let message = err;
            if (typeof message === "object" && err.error && err.error.message) {
                message = err.error.message;

                if (err.error.errors && err.error.errors[0] && err.error.errors[0].reason === "authError") {
                    message = "Connection with YouTube had been removed, or expired.";
                }
            }
            const errorText = document.createElement('a');
            errorText.innerText = message;
            document.querySelector(".Platform2").parentElement.appendChild(errorText);

            WaitFor2 = true;
            if (WaitFor1 && WaitFor2 && WaitFor3)
                SetupDashboard();
        });
}

async function KickGatherUser() {
    KickAccessToken = (await EncStorage.getItem("kkactoken"));
    return fetch("https://api.kick.com/public/v1/users", {
        "headers": {
            "Authorization": "Bearer " + KickAccessToken
        }
    }).then(res => {
        if (res.status === 401) {
            return Promise.reject({
                "message": "Connection from Kick was removed or expired. Please re-authenticate yourself."
            });
        }
        if (!res.ok) {
            return res.json()
                .then(res => {
                    return Promise.reject(res);
                });
        }
        return res.json();
    }).then(json => {
        if (document.querySelectorAll("#ConnectedPlatforms > div")[2]) {
            document.querySelectorAll("#ConnectedPlatforms > div")[2].querySelector("span").innerText = json.data[0].name;
        }

        kick_user_id = json.data[0].user_id.toString();
        SetupDashboard();

        document.querySelector(".Platform3").disabled = false;
        document.querySelector(".Platform3").classList.add("disconnect");
        document.querySelector(".Platform3").innerText = "Disconnect";
        document.querySelector(".Platform3").addEventListener('click', (ev) => {
            document.querySelector(".Platform3").disabled = true;
            fetch(
                `https://id.kick.com/oauth/revoke?token=${KickAccessToken}`,
                {
                    "headers": {
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    "method": "POST"
                }
            ).then(() => { location.reload(); })
        });
        document.querySelector(".Platform3").addEventListener('contextmenu', (ev) => {
            document.querySelector(".Platform3").disabled = true;
            ev.preventDefault();
            // Twitch End endpoint for revoking access tokens.
            var revokeTokenEndpoint = 'https://id.kick.com/oauth/revoke?token=' + KickAccessToken;

            // Create <form> element to use to POST data to the OAuth 2.0 endpoint.
            var form = document.createElement('form');
            form.setAttribute('method', 'post');
            form.setAttribute('action', revokeTokenEndpoint);

            // Add form to page and submit it to actually revoke the token.
            document.body.appendChild(form);
            form.submit();
        });

        WaitFor3 = true;
        if (WaitFor1 && WaitFor2 && WaitFor3)
            SetupDashboard();
    }).catch(err => {
        console.error(err);

        KickAccessToken = "";
        EncStorage.removeItem("kkactoken");
        EncStorage.removeItem("kkrefresh");

        document.querySelector(".Platform3").innerText = "Connect";
        document.querySelector(".Platform3").disabled = false;

        const message = err.message ?? err;
        const errorText = document.createElement('a');
        errorText.innerText = message;
        document.querySelector(".Platform3").parentElement.appendChild(errorText);

        WaitFor3 = true;
        if (WaitFor1 && WaitFor2 && WaitFor3)
            SetupDashboard();
    });
}

//#region Refresh
function InitRefresh(rt) {
    try {
        let TIME = ((new Date(localStorage.getItem('ytexpiresin')).getTime() - new Date().getTime())) - 20000;
        if (TIME < 0) TIME = 0;
        if (TIME <= 0) {
            return Refresh(rt);
        }
        return Promise.resolve(true);
    } catch (error) {
        console.error(error);
    }
    return Promise.resolve(false);
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

function TWInitRefresh(rt) {
    try {
        let TIME = ((new Date(localStorage.getItem('saved_expiresin')).getTime() - new Date().getTime())) - 20000;
        if (TIME < 0) TIME = 0;
        if (TIME <= 0) {
            return TWRefresh(rt);
        }
        return Promise.resolve(true);
    } catch (error) {
        console.error(error);
    }
    return Promise.resolve(false);
}

async function TWRefresh(rt) {
    if (rt === null) rt = await EncStorage.getItem('saved_refresh_token');
    localStorage.removeItem('saved_expiresin');
    EncStorage.removeItem('saved_refresh_token');
    return fetch('https://seenwalex.wixsite.com/chat-live/_functions/TWAPI/Refresh', {
        "method": "POST",
        "headers": {
            "Content-Type": "application/json"
        },
        "body": JSON.stringify({
            "t": rt
        })
    }).then(res => {
        if (!res.ok) {
            return Promise.reject("You must verify again to continue with Twitch.");
        }
        return res.json();
    }).then(async res => {
        if (res.access_token) {
            TWInitRefresh(res.refresh_token, res.expires_in);
            if ((await EncStorage.getItem('saved_access_token')) == null) { setTimeout(() => { location.reload(); }, 250); }
            await EncStorage.setItem("saved_access_token", res.access_token);
            access_token = res.access_token;
            return Promise.resolve(true);
        }
        return Promise.resolve(false);
    });
}

function KickInitRefresh(rt) {
    try {
        let TIME = ((new Date(localStorage.getItem('kkexpiresin')).getTime() - new Date().getTime())) - 20000;
        if (TIME < 0) TIME = 0;
        if (TIME <= 0) {
            return KickRefresh(rt);
        }
        return Promise.resolve(true);
    } catch (error) {
        console.error(error);
    }
    return Promise.resolve(false);
}

async function KickRefresh(rt) {
    if (rt === null) { rt = await EncStorage.getItem('kkrefresh'); }
    localStorage.removeItem('kkexpiresin');
    EncStorage.removeItem('kkrefresh');
    return fetch('https://seenwalex.wixsite.com/chat-live/_functions/KickAPI/Refresh', {
        "method": "POST",
        "headers": {
            "Content-Type": "application/json"
        },
        "body": JSON.stringify({
            "t": rt
        })
    }).then(res => {
        if (!res.ok) {
            return Promise.reject("You must verify again to continue with Kick.");
        }
        return res.json();
    }).then(async res => {
        if (res.access_token) {
            KickInitRefresh(res.refresh_token, res.expires_in);
            if ((await EncStorage.getItem('kkactoken')) == null) { setTimeout(() => { location.reload(); }, 250); }
            await EncStorage.setItem("kkactoken", res.access_token);
            KickAccessToken = res.access_token;
            return Promise.resolve(true);
        }
        return Promise.resolve(false);
    });
}
//#endregion
handleButtons();
handleConnectedAccounts();