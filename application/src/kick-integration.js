var KickPusher = undefined;
var KickPusherChannel = undefined;

var KickAccessToken = "";

var KickSubscriptionTypes = [];

async function KickInitialize(ResultFunc) {
    const AccessToken = await EncStorage.getItem("kkactoken");
    if (AccessToken == null) {
        ResultFunc(null);
        return;
    }
    const RefreshToken = await EncStorage.getItem("kkrefresh");
    KickInitRefresh(RefreshToken, -1)
        .then(async (v) => {
            if (!v) {
                return Promise.reject("You must verify again to continue with Kick");
            }
            else {
                if (KickAccessToken.length <= 0) KickAccessToken = AccessToken;
                return KickGatherUser()
                    .then(res => {
                        ResultFunc(res);
                    })
            }
        }).catch(async err => {
            EncStorage.removeItem("kkactoken");
            EncStorage.removeItem("kkrefresh");
            localStorage.removeItem("kkexpiresin");

            console.error(err);
            ResultFunc({ "error": err })
        });
}

function KickGatherUser() {
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
    });
}

function KickConnect(User_id) {
    KickPusher = new Pusher('774e9c2a327ee226bb03', {
        cluster: 'us2'
    });

    KickPusher.connection.bind("error", function (err) {
        console.error(err);
        if (err.error.data.code === 4004) {
            const EventHTML = document.createElement('div');
            EventHTML.className = "Message UserEvent";
            const Gap = document.createElement('div');
            Gap.className = "gap";
            const Span = document.createElement('span');
            Span.className = "Msg Text";
            Span.style.color = "#b51515";

            Span.innerText = "[Chat] Kick's chat is unavailable due to our third-party provider exceeding the concurrent amount of connnections. Please try again later.";
            EventHTML.appendChild(Gap);
            EventHTML.appendChild(Span);
            document.getElementById('Messages').appendChild(EventHTML);
            if (IsAtTheBottom) document.getElementById('Messages').scrollTo(0, document.getElementById('Messages').scrollHeight)
        }
        else {

        }
    });

    KickPusher.connection.bind("connected", function () {
        const EventHTML = document.createElement('div');
        EventHTML.className = "Message UserEvent";
        const Gap = document.createElement('div');
        Gap.className = "gap";
        const Span = document.createElement('span');
        Span.className = "Msg Text";
        Span.style.color = "gray";

        Span.innerText = "[Chat] Kick is connected!";
        EventHTML.appendChild(Gap);
        EventHTML.appendChild(Span);
        document.getElementById('Messages').appendChild(EventHTML);
        if (IsAtTheBottom) document.getElementById('Messages').scrollTo(0, document.getElementById('Messages').scrollHeight)
    });

    //KickPusher.LogToChannel = true; // DEBUG

    KickPusherChannel = KickPusher.subscribe(User_id);
    return KickPusherChannel;
}

function GatherSubscriptions() {
    if (KickSubscriptionTypes && KickSubscriptionTypes.length > 0) return Promise.resolve(KickSubscriptionTypes);
    return fetch("https://api.kick.com/public/v1/events/subscriptions", {
        "headers": {
            "Authorization": "Bearer " + KickAccessToken
        }
    }).then(res => {
        if (res.status === 401) {
            location.reload();
            return null;
        }
        if (!res.ok) {
            return res.json()
                .then(res => {
                    return Promise.reject(res);
                });
        }
        return res.json()
            .then(res => {
                KickSubscriptionTypes = res.data;
                return Promise.resolve(res.data);
            });
    });
}

function KickSubscribe(Events) {
    if (!KickPusherChannel) return Promise.reject("Not connected!");
    return GatherSubscriptions()
        .then((Subscriptions) => {
            let SubscribeTo = [];
            for (let Event of Events) {
                const EventName = Event[0];
                const Func = Event[1];
                let SubUniqueId = "";
                for (const Sub of Subscriptions) {
                    if (Sub.event.toLowerCase() === EventName.toLowerCase()) {
                        SubUniqueId = Sub.id;
                        break;
                    }
                }

                KickPusherChannel.bind(EventName, Func);

                if (SubUniqueId.length > 0) {
                    continue;
                }
                SubscribeTo.push({ "name": EventName, "version": 1 });
            }

            if (SubscribeTo.length <= 0) return Promise.resolve({});

            return fetch("https://api.kick.com/public/v1/events/subscriptions", {
                "headers": {
                    "Authorization": "Bearer " + KickAccessToken,
                    "Content-Type": "application/json"
                },
                "method": "POST",
                "body": JSON.stringify({
                    "events": SubscribeTo,
                    "method": "webhook"
                })
            });
        });
}

function KickUnsubscribe(Events = []) {
    if (!KickPusherChannel) return Promise.reject("Not connected!");
    if (Events.length <= 0) return Promise.reject("None");
    return GatherSubscriptions()
        .then((Subscriptions) => {
            const Params = new URLSearchParams();
            for (const EventName of Events) {
                for (const Sub of Subscriptions) {
                    if (Sub.event.toLowerCase() === EventName.toLowerCase()) {
                        Params.append("id", Sub.id);
                        break;
                    }
                }

                KickPusherChannel.unbind(EventName);
            }

            if (Params.size <= 0) return Promise.resolve({});

            return fetch("https://api.kick.com/public/v1/events/subscriptions?" + Params.toString(), {
                "headers": {
                    "Authorization": "Bearer " + KickAccessToken
                },
                "method": "DELETE"
            });
        });
}

function KickInitRefresh(rt, timeout = -1) {
    if (timeout === -1) {
        try {
            let TIME = ((new Date(localStorage.getItem('kkexpiresin')).getTime() - new Date().getTime())) - 20000;
            if (TIME < 0) TIME = 0;
            console.log("[Kick] Token expires in " + (TIME / 1000))
            if (TIME <= 0) {
                return KickRefresh(rt);
            }
            setTimeout(() => { KickRefresh(rt); }, TIME);
            return Promise.resolve(true);
        } catch (error) {
            console.error(error);
        }
        return Promise.resolve(false);
    }
    localStorage.setItem('kkexpiresin', new Date(new Date().setSeconds(new Date().getSeconds() + timeout)).toString());
    EncStorage.setItem('kkrefresh', rt);
    console.log("[Kick] Token expires in " + timeout)
    if (((timeout * 1000) - 20000) <= 0) {
        return KickRefresh(rt);
    }
    setTimeout(() => { KickRefresh(rt); }, (timeout * 1000) - 20000);
    return Promise.resolve(true);
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

            IfDashboardSend("kkNewToken", {"t": KickAccessToken, "r": res.refresh_token, "expires_in": res.expires_in});
            return Promise.resolve(true);
        }
        return Promise.resolve(false);
    });
}