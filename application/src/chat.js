const MessageTemplate = window.MessageTemplate;
if (!MessageTemplate) {
    alert("Initalization error - contact site owners: MessageTemplate is NULL");
    throw new ReferenceError("MessageTemplate is NULL");
}
window.MessageTemplate = undefined;

const ListCache = {
    List: {},
    Get: function (id) {
        if (ListCache.List[id] === undefined) {
            return undefined;
        }
        return ListCache.List[id];
    },
    Push: function (id, val) {
        if (ListCache.List[id] !== undefined) {
            return val;
        }
        ListCache.List[id] = val;
        return val;
    }
}

let CachedKPFPs = {};

let RewardMsgIds = {};
let RewardQueuedIds = {};

const inputField = document.querySelector("#MessageField");
let CharLimit = 200;
inputField.addEventListener('keydown', function (e) {
    if (e.keyCode === 13) { // Enter (Submit)
        e.preventDefault();
        SubmitMessage();
    }

    let len = e.target.innerText.trim().length;

    let keys = {
        'backspace': 8,
        'shift': 16,
        'ctrl': 17,
        'alt': 18,
        'delete': 46,
        // 'cmd':
        'leftArrow': 37,
        'upArrow': 38,
        'rightArrow': 39,
        'downArrow': 40,
    }

    let special = {};
    let navigational = {};

    special[keys['backspace']] = true;
    special[keys['shift']] = true;
    special[keys['ctrl']] = true;
    special[keys['alt']] = true;
    special[keys['delete']] = true;

    navigational[keys['upArrow']] = true;
    navigational[keys['downArrow']] = true;
    navigational[keys['leftArrow']] = true;
    navigational[keys['rightArrow']] = true;

    hasSelection = false;
    selection = window.getSelection();
    isSpecial = typeof special[e.keyCode] !== 'undefined';
    isNavigational = typeof navigational[e.keyCode] !== 'undefined';

    if (selection) {
        hasSelection = selection.toString();
    }

    if (isSpecial || (e.keyCode === 91 || e.keyCode === 92) || isNavigational || ((e.ctrlKey) && e.keyCode === 65)) {
        return true;
    }

    if (len >= CharLimit && !hasSelection) {
        e.preventDefault();
        return false;
    }
});

let ChatSettings = {
    ModAppearance: {
        LogModerationActions: true,
        HideModeratorNames: false,

        ShowHeldMessages: true,
        LogBlockedTerms: true,
        LogSuspiciousUserUpdates: true,
        LogRedemptionUpdates: true,
        LogUnbanRequest: false
    },
    Apperance: {
        Zoom: 1,
        ShowProfilePictures: false,
        ShowBadges: false,
        ShowTime: false,
        ShowPlatformIcons: true,
        ShowModButtons: true,

        HideDeletedMessages: false,
        ShowThirdPartyEmotes: false,
        ShowRaidMessages: true,
        ShowModVIPEvents: true,
        ShowAdEvents: true,
        HighlightSuspiciousUsers: true,
        ShowRestrictedUsers: false,
        ShowChannelPointRewards: true,
        ShowHypeTrainEvents: false,
        DisplayTimeout: 0.1,
        DisplayAmount: 150,

        PollYTMessagesOnStart: true
    }
}

let SendYouTubeDataToTop = false;

const UIModal = {
    /**
    * @param {string} Label
    * @param {boolean} IsChecked
    */
    UtilsCreateToggle: (Label, IsChecked) => {
        const Items = document.querySelector('.ModalItems');
        const DIV1 = document.createElement('div');
        DIV1.className = "ModalToggle";
        const LABEL = document.createElement('span');
        LABEL.innerText = Label;
        const DIV2 = document.createElement('label');
        DIV2.className = "ModalSwitch";
        const INPUT = document.createElement('input');
        INPUT.type = "checkbox";
        INPUT.checked = IsChecked; // Set default value
        const DIV3 = document.createElement('span');
        DIV3.className = "slider round";

        DIV2.appendChild(INPUT);
        DIV2.appendChild(DIV3);

        DIV1.appendChild(LABEL);
        DIV1.appendChild(DIV2);
        Items.appendChild(DIV1);

        return INPUT;
    },
    /**
    * @param {string} Label
    * @param {string} SecondaryLabel
    */
    UtilsCreateButtonSection: (Label, SecondaryLabel = "...") => {
        const Items = document.querySelector('.ModalItems');
        const Button = document.createElement('button');
        Button.className = "ModalSectionButton";
        const label = document.createElement('span');
        label.innerText = Label;
        const secondLabel = document.createElement('a');
        secondLabel.innerText = SecondaryLabel;
        secondLabel.style.float = "right";
        Button.appendChild(label);
        Button.appendChild(secondLabel);
        Items.appendChild(Button);
        return Button;
    },
    /**
    * @param {string} Label
    * @param {Number} DefaultValue
    * @param {Number} MaxValue
    */
    UtilsCreateSlider: (Label, DefaultValue, MaxValue) => {
        const Items = document.querySelector('.ModalItems');
        const DIV1 = document.createElement('div');
        DIV1.className = "ModalSlider";
        const LABEL = document.createElement('span');
        LABEL.innerText = Label;
        const INPUT = document.createElement('input');
        INPUT.type = "range";
        INPUT.value = DefaultValue.toString();
        INPUT.min = "0";
        INPUT.max = MaxValue;
        DIV1.appendChild(LABEL);
        DIV1.appendChild(INPUT);
        Items.appendChild(DIV1);

        return INPUT;
    },
    /**
    * @param {string} Label
    * @param {Number} DefaultValue
    * @param {Number} MinValue
    * @param {Number} MaxValue
    */
    UtilsCreateInputNumber: (Label, DefaultValue, MinValue, MaxValue) => {
        const Items = document.querySelector('.ModalItems');
        const DIV1 = document.createElement('div');
        DIV1.className = "ModalField";
        const LABEL = document.createElement('span');
        LABEL.innerText = Label;
        const INPUT = document.createElement('input');
        INPUT.type = "number";
        INPUT.value = DefaultValue.toString();
        INPUT.min = MinValue;
        INPUT.max = MaxValue;

        DIV1.appendChild(LABEL);
        DIV1.appendChild(INPUT);
        Items.appendChild(DIV1);

        return [DIV1, INPUT];
    },
    /**
    * @param {string} Label
    */
    UtilsCreateCollapsed: (Label) => {
        const Items = document.querySelector('.ModalItems');
        const Details = document.createElement('details');

        const DetailsLabel = document.createElement('summary');
        DetailsLabel.innerText = Label;
        Details.appendChild(DetailsLabel);

        Items.appendChild(Details);
        return Details;
    },
    UtilsClearItems: function () {
        const Items = document.querySelector('.ModalItems');
        while (Items.firstChild) {
            Items.removeChild(Items.lastChild);
        }
    },
    //#region Simplified
    /**
    * @param {string} Label
    * @param {Array} InnerItems
    */
    SimplifiedCreate_CollapsedSection: function (Label, InnerItems = []) {
        const Collapsed = UIModal.UtilsCreateCollapsed(Label);
        for (let Item of InnerItems) {
            if (Item instanceof HTMLInputElement && Item.type === "checkbox") {
                Collapsed.appendChild(Item.parentElement.parentElement)
            }
            else if (Item instanceof HTMLInputElement && Item.type === "range") {
                Collapsed.appendChild(Item.parentElement)
            }
            else if (Item instanceof HTMLElement) {
                Collapsed.appendChild(Item);
            }
        }
    },
    /**
    * @param {string} Label
    * @param {boolean} DefaultValue
    */
    SimplifiedCreate_Toggle: function (Label, DefaultValue, Func) {
        const keyParam = 'cs_' + Label.trim().replaceAll(' ', '').toLowerCase();
        const toggle =
            UIModal.UtilsCreateToggle(Label,
                (DefaultValue
                    ? (localStorage.getItem(keyParam) === null || localStorage.getItem(keyParam) === "true")
                    : (localStorage.getItem(keyParam) !== null && localStorage.getItem(keyParam) === "true"))
            );
        toggle.addEventListener('change', (ev) => {
            const newValue = ev.target.checked;
            localStorage.setItem(keyParam, newValue.toString().toLowerCase())
            Func(newValue);
        });
        return toggle;
    },
    /**
    * @param {string} Label
    * @param {Number} DefaultValue
    * @param {Number} Max
    * @param {Number} Min
    * @param {Number} Divisor
    */
    SimplifiedCreate_ZoomSlider: function (Label, DefaultValue, Func, Max, Min, Divisor) {
        const keyParam = 'cs_' + Label.trim().replaceAll(' ', '').toLowerCase();
        const value = (localStorage.getItem(keyParam) === null
            ? DefaultValue
            : localStorage.getItem(keyParam)
        );
        const labelValue = Min + (parseInt(value) / Divisor);
        const slider =
            UIModal.UtilsCreateSlider(Label + " (" + labelValue + ")", value, Max);
        slider.addEventListener('input', (ev) => {
            const newValue = ev.target.value;
            const span = ev.target.parentElement.querySelector('span');
            span.innerText = Label + " (" + (Min + (parseInt(ev.target.value) / Divisor)).toString() + ")";
        });
        slider.addEventListener('change', (ev) => {
            const newValue = ev.target.value;
            const span = ev.target.parentElement.querySelector('span');
            span.innerText = Label + " (" + (Min + (parseInt(ev.target.value) / Divisor)).toString() + ")";
            localStorage.setItem(keyParam, newValue);
            Func(newValue);
        });
        return slider;
    },
    /**
    * @param {string} Label
    * @param {Number} DefaultValue
    * @param {Number} Min
    * @param {Number} Max
    * @param {boolean} Decimals
    */
    SimplifiedCreate_Number: function (Label, DefaultValue, Min, Max, Decimals, Func) {
        const keyParam = 'cs_' + Label.trim().replaceAll(' ', '').toLowerCase();
        const value = (localStorage.getItem(keyParam) === null
            ? DefaultValue
            : localStorage.getItem(keyParam)
        );
        const elements = UIModal.UtilsCreateInputNumber(Label, value, Min, Max);
        const slider =
            elements[1];
        if (Decimals) slider.step = "0.1";
        slider.addEventListener('change', (ev) => {
            const newValue = ev.target.value;
            if (isNaN(parseFloat(newValue))) {
                return;
            }
            const num = parseFloat(newValue);
            if (num < Min || num > Max) {
                if (num < Min) ev.target.value = Min;
                if (num > Max) ev.target.value = Max;
                return;
            }
            localStorage.setItem(keyParam, newValue);
            Func(newValue);
        });
        return elements[0];
    },
    SimplifiedGetValue: function (Label, DefaultValue) {
        const keyParam = 'cs_' + Label.trim().replaceAll(' ', '').toLowerCase();
        return (DefaultValue
            ? (localStorage.getItem(keyParam) === null || localStorage.getItem(keyParam) === "true")
            : (localStorage.getItem(keyParam) !== null && localStorage.getItem(keyParam) === "true"));
    },
    SimplifiedGetNumValue: function (Label, DefaultValue) {
        const keyParam = 'cs_' + Label.trim().replaceAll(' ', '').toLowerCase();
        return (localStorage.getItem(keyParam) === null
            ? DefaultValue
            : parseInt(localStorage.getItem(keyParam)));
    },
    SimplifiedGetFloatValue: function (Label, DefaultValue) {
        const keyParam = 'cs_' + Label.trim().replaceAll(' ', '').toLowerCase();
        return (localStorage.getItem(keyParam) === null
            ? DefaultValue
            : parseFloat(localStorage.getItem(keyParam)));
    },
    //#endregion
    //#region TEMPLATES
    Settings_Start: function () {
        UIModal.UtilsClearItems();
        // Toggle: Mod Actions (Default: true)
        UIModal.UtilsCreateButtonSection("Moderation Activity Options").addEventListener('click', (ev) => {
            UIModal.Settings_ModActivityOptions();
        });
        UIModal.UtilsCreateButtonSection("Appearance").addEventListener('click', (ev) => {
            UIModal.Settings_AppearanceOptions();
        });
    },
    Settings_ModActivityOptions: function () {
        UIModal.UtilsClearItems();
        // Set Title
        SettingsHelper.AddBackButton("Moderation Activity");
        // Toggle: Log Moderation Actions (Default: true)
        UIModal.SimplifiedCreate_Toggle("Log Moderation Activity", true, (Checked) => {
            ChatSettings.ModAppearance.LogModerationActions = Checked;
        });
        // UIModal.SimplifiedCreate_Toggle("Hide Moderator Names", false, (Checked) => {
        //     ChatSettings.ModAppearance.HideModeratorNames = Checked;
        // });
        // Advanced Options
        UIModal.SimplifiedCreate_CollapsedSection("Advanced", [
            // UIModal.SimplifiedCreate_Toggle("Show Automod Messages", true, (Checked) => {
            //     ChatSettings.ModAppearance.ShowHeldMessages = Checked;
            // }),
            // UIModal.SimplifiedCreate_Toggle("Log Blocked Terms", true, (Checked) => {
            //     ChatSettings.ModAppearance.LogBlockedTerms = Checked;
            // }),
            UIModal.SimplifiedCreate_Toggle("Log Redemption Updates", true, (Checked) => {
                ChatSettings.ModAppearance.LogRedemptionUpdates = Checked;
            }),
            // UIModal.SimplifiedCreate_Toggle("Log Suspicious User Updates", true, (Checked) => {
            //     ChatSettings.ModAppearance.LogSuspiciousUserUpdates = Checked;
            // }),
            // UIModal.SimplifiedCreate_Toggle("Log Unban Request Actions", false, (Checked) => {
            //     ChatSettings.ModAppearance.LogUnbanRequest = Checked;
            // })
        ])
    },
    Settings_AppearanceOptions: function () {
        UIModal.UtilsClearItems();
        // Set Title
        SettingsHelper.AddBackButton("Appearance");
        // Slider
        UIModal.SimplifiedCreate_ZoomSlider("Zoom", 10, (Value) => {
            const num = parseInt(Value);
            const zoomValue = 0.5 + (num / 20);
            ChatSettings.Apperance.Zoom = zoomValue;
            document.getElementById("Messages").style.zoom = (zoomValue === 1) ? "" : zoomValue.toString();
        }, 20, 0.5, 20);
        // Toggles
        UIModal.SimplifiedCreate_Toggle("Show Profile Pictures", false, (Checked) => {
            ChatSettings.Apperance.ShowProfilePictures = Checked;
            SettingsHelper.UpdateAll('.PFP', ChatSettings.Apperance.ShowProfilePictures);
        });
        UIModal.SimplifiedCreate_Toggle("Show Badges", false, (Checked) => {
            ChatSettings.Apperance.ShowBadges = Checked;
            SettingsHelper.UpdateBadges();
        });
        UIModal.SimplifiedCreate_Toggle("Show Time", false, (Checked) => {
            ChatSettings.Apperance.ShowTime = Checked;
            SettingsHelper.UpdateAll('.Time', ChatSettings.Apperance.ShowTime);
        });
        UIModal.SimplifiedCreate_Toggle("Show Platform Icons", true, (Checked) => {
            ChatSettings.Apperance.ShowPlatformIcons = Checked;

        });
        UIModal.SimplifiedCreate_Number("Update Messages Every(s)", 0.1, 0, 10, true, (Value) => {
            ChatSettings.Apperance.DisplayTimeout = parseFloat(Value);
        });
        // Advanced Options
        UIModal.SimplifiedCreate_CollapsedSection("Advanced", [
            // UIModal.SimplifiedCreate_Toggle("Show Third Party Emotes", false, (Checked) => {
            //     ChatSettings.Apperance.ShowThirdPartyEmotes = Checked;
            // }),
            UIModal.SimplifiedCreate_Toggle("Hide Deleted Messages", false, (Checked) => {
                ChatSettings.Apperance.HideDeletedMessages = Checked;
                const IsAtTheBottom = IsAtTheBottomList();
                if (Checked) {
                    for (const Message of document.querySelectorAll(".Msg.Strike")) {
                        Message.parentElement.style.display = "none";
                    }
                }
                else {
                    for (const Message of document.querySelectorAll(".Msg.Strike")) {
                        Message.parentElement.style.display = "";
                    }
                }
                if (IsAtTheBottom) {
                    document.querySelector("#Messages").scrollTo(0, document.querySelector("#Messages").scrollHeight)
                }
            }),
            // UIModal.SimplifiedCreate_Toggle("Show Raid Messages", true, (Checked) => {
            //     ChatSettings.Apperance.ShowRaidMessages = Checked;
            //     SettingsHelper.UpdateAll('.RaidAlert', ChatSettings.Apperance.ShowRaidMessages);
            // }),
            UIModal.SimplifiedCreate_Toggle("Show Mod Buttons", true, (Checked) => {
                ChatSettings.Apperance.ShowModButtons = Checked;
                SettingsHelper.UpdateMAButtons();
            }),
            UIModal.SimplifiedCreate_Toggle("Log New/Removed Mod & VIPs", true, (Checked) => {
                ChatSettings.Apperance.ShowModVIPEvents = Checked;
            }),
            UIModal.SimplifiedCreate_Toggle("Log Twitch Ad Events", true, (Checked) => {
                ChatSettings.Apperance.ShowAdEvents = Checked;
            }),
            // UIModal.SimplifiedCreate_Toggle("Highlight Suspicious Users", true, (Checked) => {
            //     ChatSettings.Apperance.HighlightSuspiciousUsers = Checked;
            // }),
            // UIModal.SimplifiedCreate_Toggle("Display Restricted Users", true, (Checked) => {
            //     ChatSettings.Apperance.ShowRestrictedUsers = Checked;
            //     SettingsHelper.UpdateAll('.RestrictedTag', ChatSettings.Apperance.ShowRestrictedUsers);
            // }),
            UIModal.SimplifiedCreate_Toggle("Show Channel Point Rewards", true, (Checked) => {
                ChatSettings.Apperance.ShowChannelPointRewards = Checked;
                SettingsHelper.UpdateAll('.ChannelPointR', ChatSettings.Apperance.ShowChannelPointRewards);
            }),
            UIModal.SimplifiedCreate_Toggle("Automatically Connect to YouTube", true, (Checked) => {
                ChatSettings.Apperance.PollYTMessagesOnStart = Checked;
            }),
            UIModal.SimplifiedCreate_Number("Display Messages", 150, 0, 500, false, (Value) => {
                ChatSettings.Apperance.DisplayAmount = parseInt(Value);
            }),
            // UIModal.SimplifiedCreate_Toggle("Log Hype Train Events", true, (Checked) => {
            //     ChatSettings.Apperance.ShowHypeTrainEvents = Checked;
            // })
        ])
        //#endregion
    }
}
const SettingsHelper = {
    BackPressed: function () {
        UIModal.Settings_Start();
        document.querySelector('.ModalBack').remove();
        document.querySelector('.ModalTitle').classList.remove('Indent');
        document.querySelector('.ModalTitle').innerText = "Settings";
    },
    AddBackButton: function (Title = "Settings") {
        if (!document.querySelector('.ModalBack')) {
            const BackButton = document.createElement('button');
            BackButton.className = "ModalBack";
            BackButton.innerText = "<";
            BackButton.addEventListener('click', SettingsHelper.BackPressed);
            document.querySelector('#SettingsModal').appendChild(BackButton);
            document.querySelector('.ModalTitle').classList.add('Indent');
        }
        document.querySelector('.ModalTitle').innerText = Title;
    },
    UpdateBadges: function () {
        if (ChatSettings.Apperance.ShowBadges) {
            for (let Badge of document.querySelectorAll('.Badges')) {
                if (Badge.className.includes('Hide') &&
                    (!Badge.querySelector('.NUMORPLATFORM.Hide') || !Badge.querySelector('.MODTYPE.Hide') || !Badge.querySelector('.SUBSTATUS.Hide') || !Badge.querySelector('.USERBADGE.Hide'))
                )
                    Badge.classList.remove('Hide');
            }
        }
        else {
            for (let Badge of document.querySelectorAll('.Badges')) {
                if (!Badge.className.includes('Hide')) Badge.classList.add('Hide');
            }
        }
    },
    UpdateAll: function (QueryName, IsBoolean = true) {
        if (IsBoolean) {
            for (let Badge of document.querySelectorAll(QueryName)) {
                if (Badge.className.includes('Hide')) Badge.classList.remove('Hide');
            }
        }
        else {
            for (let Badge of document.querySelectorAll(QueryName)) {
                if (!Badge.className.includes('Hide')) Badge.classList.add('Hide');
            }
        }
    },
    UpdateMAButtons: function () {
        if (!ChatSettings.Apperance.ShowModButtons) {
            for (let Badge of document.querySelectorAll('.ModActions')) {
                if (!Badge.className.includes('Hide')) {
                    Badge.classList.add('Hide');
                    const gap = document.createElement('div');
                    gap.className = "gap";
                    Badge.parentElement.insertBefore(gap, Badge.parentElement.firstChild);
                }
            }
        }
        else {
            for (let Badge of document.querySelectorAll('.ModActions')) {
                if (Badge.className.includes('Hide')) {
                    Badge.classList.remove('Hide');
                    const gap = Badge.parentElement.querySelector('.gap');
                    if (gap) Badge.parentElement.removeChild(gap);
                }
            }
        }
    }
}

function LoadSettings() {
    // Chat Settings
    // Mod Appearance
    ChatSettings.ModAppearance.LogModerationActions = UIModal.SimplifiedGetValue("Log Moderation Activity", true);
    ChatSettings.ModAppearance.HideModeratorNames = UIModal.SimplifiedGetValue("Hide Moderator Names", false);
    ChatSettings.ModAppearance.ShowHeldMessages = UIModal.SimplifiedGetValue("Show Automod Messages", true);
    ChatSettings.ModAppearance.LogBlockedTerms = UIModal.SimplifiedGetValue("Log Blocked Terms", true);
    ChatSettings.ModAppearance.LogRedemptionUpdates = UIModal.SimplifiedGetValue("Log Redemption Updates", true);
    ChatSettings.ModAppearance.LogSuspiciousUserUpdates = UIModal.SimplifiedGetValue("Log Suspicious User Updates", true);
    ChatSettings.ModAppearance.LogUnbanRequest = UIModal.SimplifiedGetValue("Log Unban Request Actions", false);
    // Appearance for Chat
    const zoomNum = parseInt(UIModal.SimplifiedGetNumValue("Zoom", 10));
    const zoomValue = (0.5 + (zoomNum / 20));
    ChatSettings.Apperance.Zoom = zoomValue;
    document.getElementById("Messages").style.zoom = (zoomValue === 1) ? "" : zoomValue.toString();

    ChatSettings.Apperance.ShowProfilePictures = UIModal.SimplifiedGetValue("Show Profile Pictures", true);
    SettingsHelper.UpdateAll('.PFP', ChatSettings.Apperance.ShowProfilePictures);
    ChatSettings.Apperance.ShowBadges = UIModal.SimplifiedGetValue("Show Badges", false);
    SettingsHelper.UpdateBadges();
    ChatSettings.Apperance.ShowTime = UIModal.SimplifiedGetValue("Show Time", false);
    SettingsHelper.UpdateAll('.Time', ChatSettings.Apperance.ShowTime);
    ChatSettings.Apperance.ShowPlatformIcons = UIModal.SimplifiedGetValue("Show Platform Icons", true);

    ChatSettings.Apperance.ShowModButtons = UIModal.SimplifiedGetValue("Show Mod Buttons", true);
    SettingsHelper.UpdateMAButtons();
    ChatSettings.Apperance.ShowThirdPartyEmotes = UIModal.SimplifiedGetValue("Show Third Party Emotes", false);
    ChatSettings.Apperance.HideDeletedMessages = UIModal.SimplifiedGetValue("Hide Deleted Messages", false);

    ChatSettings.Apperance.ShowRaidMessages = UIModal.SimplifiedGetValue("Show Raid Messages", true);
    SettingsHelper.UpdateAll('.RaidAlert', ChatSettings.Apperance.ShowRaidMessages);
    ChatSettings.Apperance.ShowModVIPEvents = UIModal.SimplifiedGetValue("Log New/Removed Mod & VIPs", true);
    ChatSettings.Apperance.ShowAdEvents = UIModal.SimplifiedGetValue("Log Twitch Ad Events", true);
    ChatSettings.Apperance.HighlightSuspiciousUsers = UIModal.SimplifiedGetValue("Highlight Suspicious Users", true);

    ChatSettings.Apperance.ShowRestrictedUsers = UIModal.SimplifiedGetValue("Display Restricted Users", true);
    SettingsHelper.UpdateAll('.RestrictedTag', ChatSettings.Apperance.ShowRestrictedUsers);
    ChatSettings.Apperance.ShowChannelPointRewards = UIModal.SimplifiedGetValue("Show Channel Point Rewards", true);
    SettingsHelper.UpdateAll('.ChannelPointR', ChatSettings.Apperance.ShowChannelPointRewards);
    ChatSettings.Apperance.ShowHypeTrainEvents = UIModal.SimplifiedGetValue("Log Hype Train Events", true);

    ChatSettings.Apperance.PollYTMessagesOnStart = UIModal.SimplifiedGetValue("Automatically Connect to YouTube", true);
    ChatSettings.Apperance.DisplayTimeout = UIModal.SimplifiedGetFloatValue("Update Messages Every(s)", 0.1);
    ChatSettings.Apperance.DisplayAmount = UIModal.SimplifiedGetNumValue("Display Messages", 150);
    // Buttons
    document.querySelector('.ModalExit').addEventListener('click', () => {
        if (!!document.querySelector('.ModalBack')) {
            SettingsHelper.BackPressed();
        }
        document.querySelector('#SettingsModal').classList.add('Hide');
    });
    document.querySelector('#SettingsIcon').addEventListener('click', (ev) => {
        if (document.querySelector('#SettingsModal').className.includes('Hide')) {
            document.querySelector('#SettingsModal').classList.remove('Hide');
        }
        else {
            document.querySelector('#SettingsModal').classList.add('Hide');
        }
    });
}

// UI
LoadSettings();
UIModal.Settings_Start();

let ExcludeMessageIds = {};

let MyPFPURL = "";
let MyName = "";

let JustClearedChat = false;

function HandleCommand(command = "/format :TTV:name: args1 args2") {
    const args = command.split(' ');
    const commandName = args.shift();
    switch (commandName) {
        case "/clear":
            let ClearMine = true;
            let ClearOthers = true;
            if (args.length > 0) {
                if (args[0] === "others") {
                    ClearMine = false;
                }
                else if (args[0] === "mine") {
                    ClearOthers = false;
                }
            }

            if (access_token.length <= 0) { // Twitch only supports clearing chat for everyone
                ClearMine = true;
                ClearOthers = false;
            }

            if (ClearMine && !ClearOthers) {
                ClearMyChat();
                HandleMessage({
                    "type": "event",
                    "message": "Your chat was cleared for you!"
                });
            }
            else if (ClearOthers) {
                fetch('https://api.twitch.tv/helix/moderation/chat?broadcaster_id=' + user_id + "&moderator_id=" + user_id, {
                    "method": "DELETE",
                    "headers": {
                        "Client-ID": client_id,
                        "Authorization": "Bearer " + access_token
                    }
                }).then(async res => {
                    if (!res.ok) {
                        return Promise.reject(await res.json());
                    }
                    if (ClearMine) {
                        JustClearedChat = true;
                        ClearMyChat();
                        HandleMessage({
                            "type": "event",
                            "message": `Your chat was cleared for you and Twitch users (VIP and below)!`
                        });
                    }
                }).catch(err => {
                    let message = err.message ?? err;
                    if (ClearMine) {
                        ClearMyChat();
                    }
                    HandleMessage({
                        "type": "event",
                        "message": `Your chat was cleared but we couldn't clear for Twitch uesrs: ${message}`
                    });
                });
            }
            break;
        default:
            HandleMessage({
                "type": "event",
                "message": `Command ${commandName} is not available. Submit a feature request if you like this command to be added.`
            });
            break;
    }
}

function SubmitMessage() {
    let MessageInput = (inputField.innerText || "").trim();
    if (MessageInput.length <= 0) return;
    inputField.innerText = "";

    if (MessageInput.startsWith("/") && !MessageInput.startsWith("/me ")) {
        HandleCommand(MessageInput);
        return;
    }

    MessageInput = MessageInput.substring(0, 500);

    // Twitch
    const MessageId = "all-" + crypto.randomUUID();

    let JsonTemplate = {
        "type": "Message",
        "id": MessageId,
        "message": MessageInput,
        "person": {
            "username": MyName || "Streamer",
            "profilePicture": MyPFPURL,
            "id": "0"
        },
        "time": new Date().getTime(),
        "badge_platform": "",
        "badge_user": "",
        "badge_modtype": "",
        "badge_substatus": "",
        "platform": "ALL",
        "user_link": "",
        "user_color": ""
    };
    HandleMessage(JsonTemplate);

    if (access_token.length > 0) {
        fetch('https://api.twitch.tv/helix/chat/messages', {
            "method": "POST",
            "headers": {
                "Client-ID": client_id,
                "Authorization": "Bearer " + access_token,
                'Content-Type': 'application/json'
            },
            "body": JSON.stringify({
                "broadcaster_id": user_id,
                "sender_id": user_id,
                "message": MessageInput
            })
        }).then(res => {
            return res.json();
        }).then(json => {
            if (!json.data) {
                return Promise.reject(json);
            }
            const data = json.data[0];
            ExcludeMessageIds[data.id] = true;
            if (!data.is_sent) {
                HandleMessage({
                    "type": "event",
                    "message": "Twitch: " + data.drop_reason.message
                });
            }
            else {
                console.log("[Multistream Chat] Success on sending message (Twitch)");
                const a = document.querySelector('div[data-id="' + MessageId + '"]');
                if (a) {
                    a.setAttribute("data-ttv", data.message_id);
                }
            }
        }).catch(err => {
            HandleMessage({
                "type": "event",
                "message": `Failed to send Twitch message: ${err}`
            });
        });
    }
    // YouTube
    if (YTChatID.length > 0) {
        fetch('https://www.googleapis.com/youtube/v3/liveChat/messages?part=snippet', { // No need for data, just IDs.
            "method": "POST",
            "headers": {
                "Authorization": "Bearer " + YTAccessToken,
                "Accept": "application/json"
            },
            "body": JSON.stringify({
                "snippet": {
                    "liveChatId": YTChatID,
                    "type": "textMessageEvent",
                    "textMessageDetails": {
                        "messageText": MessageInput
                    }
                }
            })
        }).then(async res => {
            if (!res.ok) {
                return Promise.reject(await res.json());
            }
            return res.json();
        }).then(json => {
            const data = json;
            ExcludeMessageIds[data.id] = true;
            console.log("[Multistream Chat] Success on sending message (YouTube)");
            const a = document.querySelector('div[data-id="' + MessageId + '"]');
            if (a) {
                a.setAttribute("data-yt", data.id);
            }
        }).catch(err => {
            const errorMessage = err.error ? err.error.message : (err.message ?? err);
            HandleMessage({
                "type": "event",
                "message": `Failed to send YouTube message: ${errorMessage}`
            });
        });
    }
    // Kick
    if (KickAccessToken.length > 0) {
        fetch('https://api.kick.com/public/v1/chat', {
            "method": "POST",
            "headers": {
                "Client-ID": client_id,
                "Authorization": "Bearer " + KickAccessToken,
                'Content-Type': 'application/json'
            },
            "body": JSON.stringify({
                "broadcaster_user_id": KickChannel.user_id,
                "type": "user",
                "content": MessageInput
            })
        }).then(res => {
            return res.json();
        }).then(json => {
            if (!json.data || !json.data.message_id) {
                return Promise.reject(json);
            }
            const data = json.data;
            if (!data.is_sent) {
                HandleMessage({
                    "type": "event",
                    "message": "Kick: Failed to send the message."
                });
            }
            else {
                ExcludeMessageIds[data.message_id] = true;
                console.log("[Multistream Chat] Success on sending message (Kick)");
                const a = document.querySelector('div[data-id="' + MessageId + '"]');
                if (a) {
                    a.setAttribute("data-kk", data.message_id);
                }
            }
        }).catch(err => {
            HandleMessage({
                "type": "event",
                "message": `Failed to send Kick message: ${err.message ?? err}`
            });
        });
    }
}

document.querySelector('#MessageSend').addEventListener('click', SubmitMessage);

document.addEventListener('visibilitychange', OnHidden); // Optimization

function OnHidden() {
    if (PauseChat && document.hidden) return;
    if (PauseChat && (PauseChatForce || !IsAtTheBottomList()) && !document.hidden) return;

    if (!document.hidden && PauseChat) {
        PauseChat = false;
        IsAtTheBottom = true;
        BottomDelay = performance.now() + 100;

        for (const QueuedPromise of QueuedPromisedList) {
            QueuedPromise();
            delete QueuedPromise;
        }
        QueuedPromisedList = [];

        setTimeout(() => {
            document.getElementById('Messages').scrollTo(0, document.getElementById('Messages').scrollHeight);
        }, 100);
        document.querySelector('#Switch').classList.remove("Pause");
    }
    else if (!PauseChat && document.hidden) {
        PauseChat = true;
        document.querySelector('#Switch').classList.add("Pause");
    }
}

document.querySelector('#Switch').addEventListener('click', (ev) => {
    if (PauseChat) document.getElementById('Messages').scrollTo(0, document.getElementById('Messages').scrollHeight);
    if (ev.target.classList.contains("Scroll")) {
        return;
    }
    if (PauseChat) {
        PauseChat = false;
        PauseChatForce = false;
        IsAtTheBottom = true;
        BottomDelay = performance.now() + 100;

        for (const QueuedPromise of QueuedPromisedList) {
            QueuedPromise();
            delete QueuedPromise;
        }
        QueuedPromisedList = [];

        setTimeout(() => {
            document.getElementById('Messages').scrollTo(0, document.getElementById('Messages').scrollHeight);
        }, 100);

        AnimateScrollButton();
        document.querySelector('#Switch').classList.remove("Pause");
    }
    else {
        PauseChat = true;
        PauseChatForce = true;
        AnimateScrollButton();
        document.querySelector('#Switch').classList.add("Pause");
    }
});

document.querySelector('#Switch').addEventListener('contextmenu', (ev) => {
    ev.preventDefault();
    if (PauseChat) return;
    if (YTChatID.length <= 0) return;
    const ToggleOn = !document.querySelector('#Switch').classList.contains("YTConnected");
    if (ToggleOn) {
        document.querySelector('#Switch').classList.add("YTConnected");
        DoNotReconnect = false;
        YTDisconnect = false;
        PollChatMessages();


    }
    else {
        document.querySelector('#Switch').classList.remove("YTConnected");
        YTDisconnect = true;
        if (socket && socket.connected) {
            socket.disconnect();
        }


    }
});

let IsAtTheBottom = true;
let BottomDelay = 0;
let LastChat = 0;
let PauseChat = false;
let PauseChatForce = false;
let QueuedPromisedList = [];

let AnimationButton = -1;

function AnimateScrollButton() {
    clearTimeout(AnimationButton);
    document.querySelector('#Switch').classList.remove("Clicked")
    document.querySelector('#Switch').classList.add("Clicked")
    AnimationButton = setTimeout(() => {
        document.querySelector('#Switch').classList.remove("Clicked")
    }, 100);
}

document.querySelector('#Messages').addEventListener('scroll', (ev) => {
    const MessagesList = document.querySelector('#Messages');
    const DistanceToBottom = Math.abs(MessagesList.scrollHeight - MessagesList.scrollTop - MessagesList.clientHeight);
    if (DistanceToBottom < 10) {
        IsAtTheBottom = true;
    }
    else if (BottomDelay <= performance.now()) {
        IsAtTheBottom = false;
    }
    else {
        document.getElementById('Messages').scrollTo(0, document.getElementById('Messages').scrollHeight);
    }

    if (DistanceToBottom >= 10) {
        if (!PauseChat) {
            PauseChat = true;
            if (!document.querySelector('#Switch').classList.contains("Pause")) AnimateScrollButton();
            document.querySelector('#Switch').classList.add("Pause");
            document.querySelector('#Switch').classList.add("Scrolled");
        }
    }
    else if (PauseChat) {
        if (!PauseChatForce) {
            PauseChat = false;
            IsAtTheBottom = true;
            BottomDelay = performance.now() + 100;

            for (const QueuedPromise of QueuedPromisedList) {
                QueuedPromise();
                delete QueuedPromise;
            }
            QueuedPromisedList = [];

            setTimeout(() => {
                document.getElementById('Messages').scrollTo(0, document.getElementById('Messages').scrollHeight);
            }, 100);

            if (document.querySelector('#Switch').classList.contains("Pause")) AnimateScrollButton();
            document.querySelector('#Switch').classList.remove("Pause");
            document.querySelector('#Switch').classList.remove("Scrolled");
        }
        else {
            document.querySelector('#Switch').classList.remove("Scrolled");
        }
    }
})

function IsAtTheBottomList() {
    const MessagesList = document.querySelector('#Messages');
    return IsAtTheBottom || Math.abs(MessagesList.scrollHeight - MessagesList.scrollTop - MessagesList.clientHeight) < 1;
}

function HandleMessage(Payload) {
    const MessagesList = document.querySelector('#Messages');
    const Type = Payload.type;
    const IsAtTheBottom = IsAtTheBottomList();

    const HandleEvent = () => {
        switch (Type) {
            case "reward_event":
                if (document.querySelector('div[removewhen="' + Payload.match_if_needed + '"]')) {
                    document.querySelector('div[removewhen="' + Payload.match_if_needed + '"]').remove();
                }
                const RewardEventHTML = document.createElement('div');
                RewardEventHTML.className = "Message RewardEvent";
                const RewardGap = document.createElement('div');
                RewardGap.className = "gap";
                const RewardSpan = document.createElement('span');
                RewardSpan.className = "Msg Text";
                RewardSpan.style.color = "gray";

                RewardSpan.innerHTML = Payload.message;

                RewardEventHTML.appendChild(RewardGap);
                RewardEventHTML.appendChild(RewardSpan);
                MessagesList.appendChild(RewardEventHTML);

                if (Payload.reward_type) {
                    if (Payload.is_input) {
                        const htmlToFind = Payload.user_input_formatted;
                        const AllMessagesText = Array.from(document.querySelectorAll('.Msg.Text')).reverse();
                        const RemoveSpaces = (h) => { return h.replaceAll("\n", "").replaceAll("\r", ""); };
                        const Find = AllMessagesText.find((element) => RemoveSpaces(element.innerHTML) === RemoveSpaces(htmlToFind));
                        if (Find) {
                            if (Payload.reward_type === "send_highlighted_message") {
                                Find.classList.add("MentionBG");
                            }
                            Find.parentElement.classList.add("RewardEventInput");
                            MessagesList.insertBefore(RewardEventHTML, Find.parentElement);
                        }
                    }
                    else if (Payload.reward_type === "single_message_bypass_sub_mode") {
                        const username = Payload.from_user;
                        const AllMessagesText = Array.from(document.querySelectorAll('.Username.Text')).reverse();
                        const Find = AllMessagesText.find((element) => element.innerText === username);
                        if (Find) {
                            Find.parentElement.classList.add("RewardEventInput");
                            MessagesList.insertBefore(RewardEventHTML, Find.parentElement);
                        }
                    }
                }
                else if (Payload.is_input) {
                    if (RewardMsgIds[Payload.id]) {
                        const element = document.querySelector('div[data-id="' + RewardMsgIds[Payload.id] + '"]');
                        if (element) {
                            element.classList.add("RewardEventInput");
                            MessagesList.insertBefore(RewardEventHTML, element);
                        }
                        RewardMsgIds[Payload.id] = undefined;
                    }
                    else {
                        RewardQueuedIds[Payload.id] = true;
                    }
                }
                break;
            case "redemption_update_event":
                const RUEventHTML = document.createElement('div');
                RUEventHTML.className = "Message UserEvent";
                RUEventHTML.setAttribute('data-id', Payload.id);

                const RUGap = document.createElement('div');
                RUGap.className = "gap";
                const RUSpan = document.createElement('span');
                RUSpan.className = "Msg Text";
                RUSpan.style.color = Payload.color;

                RUSpan.innerText = Payload.message;

                RUEventHTML.appendChild(RUGap);
                RUEventHTML.appendChild(RUSpan);
                MessagesList.appendChild(RUEventHTML);
                break;
            case "event":
                if (document.querySelector('div[donotadd="' + Payload.match_if_needed + '"]')) {
                    document.querySelector('div[donotadd="' + Payload.match_if_needed + '"]').removeAttribute('donotadd');
                    return;
                }
                if (document.querySelector('div[removewhen="' + Payload.match_if_needed + '"]')) {
                    document.querySelector('div[removewhen="' + Payload.match_if_needed + '"]').remove();
                }
                const EventHTML = document.createElement('div');
                EventHTML.className = "Message UserEvent";
                const Gap = document.createElement('div');
                Gap.className = "gap";
                const Span = document.createElement('span');
                Span.className = "Msg Text";
                Span.style.color = "gray";

                if (Payload.message.includes('<a href=') && !Payload.message.includes('<script>')) Span.innerHTML = Payload.message;
                else Span.innerText = Payload.message;

                if (Payload.undo) {
                    const Left = document.createElement('span');
                    Left.innerText = " (";
                    Left.style.color = "gray";
                    Span.appendChild(Left);

                    const Undo = document.createElement('a');
                    Undo.href = "#undo";
                    Undo.innerText = "Undo";
                    const UndoAction = (ev) => {
                        ev.preventDefault();
                        Undo.removeAttribute('href');
                        Undo.style.color = "gray";

                        const UndoLoadingIcon = document.createElement('div');
                        UndoLoadingIcon.style = "--color: purple;";
                        UndoLoadingIcon.className = "loadingicon";

                        const Space = document.createElement('span');
                        Space.innerText = " ";

                        Span.insertBefore(Space, Span.lastChild);
                        Span.insertBefore(UndoLoadingIcon, Span.lastChild);

                        Undo.removeEventListener('click', UndoAction);

                        Payload.undo().then(dontaddid => {
                            UndoLoadingIcon.remove();
                            Space.remove();
                            Span.classList.add('Strike');
                            EventHTML.setAttribute('donotadd', dontaddid)
                            Undo.remove();
                            Span.removeChild(Span.querySelector('span'));
                            Span.removeChild(Span.lastChild);
                        }).catch(err => {
                            Span.innerHTML = "Unable to undo that action: " + err;
                        });
                    };
                    Undo.addEventListener('click', UndoAction);
                    Span.appendChild(Undo);

                    const Right = document.createElement('span');
                    Right.innerText = ")";
                    Right.style.color = "gray";
                    Span.appendChild(Right);
                }

                EventHTML.appendChild(Gap);
                EventHTML.appendChild(Span);
                MessagesList.appendChild(EventHTML);

                if (Payload.you_message) {
                    EventHTML.setAttribute('removewhen', Payload.match_if_needed)
                }
                break;
            case "Message":
                let HTML = MessageTemplate;
                let time = "0:00";
                try {
                    if (!Intl.DateTimeFormat(undefined, { hour: 'numeric' }).resolvedOptions().hour12) {
                        const DateNow = new Date(Payload.time);

                        const Minutes = DateNow.getMinutes();
                        let Min = Minutes.toString();
                        if (Minutes < 10) Min = "0" + Min;

                        time = `${DateNow.getHours()}:${Min}`;
                    }
                    else {
                        const DateNow = new Date(Payload.time);
                        let hour = DateNow.getHours();
                        hour = (hour === 0 || hour === 12) ? 12 : (hour % 12);

                        const Minutes = DateNow.getMinutes();
                        let Min = Minutes.toString();
                        if (Minutes < 10) Min = "0" + Min;

                        time = `${hour}:${Min}`
                    }
                } catch (error) {
                    const DateNow = new Date();

                    const Minutes = DateNow.getMinutes();
                    let Min = Minutes.toString();
                    if (Minutes < 10) Min = "0" + Min;

                    time = `${DateNow.getHours()}:${Min}`;
                }

                if (Payload.platform === "Kick" && CachedKPFPs[Payload.person.id]) {
                    Payload.person.profilePicture = CachedKPFPs[Payload.person.id];
                }

                if (!ChatSettings.Apperance.ShowModButtons) {
                    HTML = HTML.replace("\"ModActions\"", "\"ModActions Hide\"");
                    HTML = HTML.replace("<span", "<div class=\"gap\"></div><span");
                }

                HTML = HTML.replace('{MESSAGE.TIME}', time)
                if (!ChatSettings.Apperance.ShowTime) {
                    HTML = HTML.replace("\"Time\"", "\"Time Hide\"");
                }
                HTML = HTML.replace('{MESSAGE.PFPURL}', Payload.person.profilePicture);
                if (!ChatSettings.Apperance.ShowProfilePictures) {
                    HTML = HTML.replace("\"PFP\"", "\"PFP Hide\"");
                }

                if (Payload.user_link && Payload.user_link.length > 0) {
                    HTML = HTML.replace('<span class="Username Text">{MESSAGE.USERNAME}</span>', '<a href="' + Payload.user_link + '" target="blank" class="Username Text">{MESSAGE.USERNAME}</a>')
                }

                if (Payload.user_color && Payload.user_color.length > 0) {
                    HTML = HTML.replace('class="Username Text"', 'class="Username Text" style="color: ' + Payload.user_color + ';"')
                }

                HTML = HTML.replace('{MESSAGE.USERNAME}', Payload.person.username);
                HTML = HTML.replace('{MESSAGE.DISPLAY}', Payload.message);

                // Badges
                if ((Payload.badge_platform || "") !== "" || ChatSettings.Apperance.ShowPlatformIcons) {
                    if (ChatSettings.Apperance.ShowPlatformIcons) {
                        switch (Payload.platform) {
                            case "TTV":
                                Payload.badge_platform = "cdn/glitch_flat_purple.svg";
                                break;
                            case "YT":
                                Payload.badge_platform = "cdn/yt_icon_rgb.webp";
                                break;
                            case "Kick":
                                Payload.badge_platform = "cdn/kick_icon.svg";
                                break;
                            case "ALL":
                                Payload.badge_platform = "cdn/AllIcon.svg";
                                break;
                        }
                    }
                    HTML = HTML.replace('NUMORPLATFORM Hide', "NUMORPLATFORM");
                    HTML = HTML.replace('{MESSAGE.BADGE.PLATFORMORPRED}', Payload.badge_platform);
                }
                else {
                    HTML = HTML.replace('{MESSAGE.BADGE.PLATFORMORPRED}', "");
                }
                if ((Payload.badge_user || "") !== "" && ChatSettings.Apperance.ShowBadges) {
                    HTML = HTML.replace('USERBADGE Hide', "USERBADGE");
                    HTML = HTML.replace('{MESSAGE.BADGE.CHOSEN}', Payload.badge_user);
                }
                else {
                    HTML = HTML.replace('{MESSAGE.BADGE.CHOSEN}', "");
                }
                if ((Payload.badge_substatus || "") !== "" && ChatSettings.Apperance.ShowBadges) {
                    HTML = HTML.replace('SUBSTATUS Hide', "SUBSTATUS");
                    HTML = HTML.replace('{MESSAGE.BADGE.SUB}', Payload.badge_substatus);
                }
                else {
                    HTML = HTML.replace('{MESSAGE.BADGE.SUB}', "");
                }
                if ((Payload.badge_modtype || "") !== "" && ChatSettings.Apperance.ShowBadges) {
                    HTML = HTML.replace('MODTYPE Hide', "MODTYPE");
                    HTML = HTML.replace('{MESSAGE.BADGE.MODORVIP}', Payload.badge_modtype);
                }
                else {
                    HTML = HTML.replace('{MESSAGE.BADGE.MODORVIP}', "");
                }

                if ((HTML.includes("NUMORPLATFORM Hide") && HTML.includes("MODTYPE Hide") && HTML.includes("SUBSTATUS Hide") && HTML.includes("USERBADGE Hide"))) {
                    HTML = HTML.replace("\"Badges\"", "\"Badges Hide\"");
                }

                HTML = HTML.replace("class=\"Message\"",
                    "class=\"Message" + (Payload.from_reward ? " RewardEventInput" : "")
                    + "\" data-id=\"" + escape(Payload.id) + "\" data-platform=\"" + Payload.platform + "\""
                );

                MessagesList.insertAdjacentHTML('beforeend', HTML);
                const a = document.querySelector('div[data-id="' + escape(Payload.id) + '"]');

                if (Payload.from_reward) {
                    if (RewardQueuedIds[Payload.from_reward_id]) {
                        RewardQueuedIds[Payload.from_reward_id] = undefined;
                    }
                    else {
                        RewardMsgIds[Payload.from_reward_id] = Payload.id;
                    }
                }

                if (a) {
                    if (Payload.platform === "ALL") {
                        a.querySelector('.ModActions > .Ban').style.display = "none";
                        a.querySelector('.ModActions > .Timeout').style.display = "none";
                    }
                    if (Payload.platform === "Kick") {
                        const ERROR = (ev) => {
                            a.querySelector("img.PFP").removeEventListener('error', ERROR);
                            ev.target.src = "https://files.kick.com/images/profile_image/default1.jpeg";
                            CachedKPFPs[Payload.person.id] = "https://files.kick.com/images/profile_image/default1.jpeg";
                        };
                        a.querySelector("img.PFP").addEventListener('error', ERROR);
                    }
                    // Ban user
                    a.querySelector('.ModActions > .Ban').addEventListener('click', (ev) => {
                        const target = a.querySelector('.ModActions > .Ban');
                        target.disabled = true;
                        const LoadingIcon = document.createElement('div');
                        LoadingIcon.className = "loadingicon";
                        LoadingIcon.style = "--color: white;";

                        a.querySelector('.Msg').style = "opacity: 50%;";
                        a.querySelector('.Msg').classList.add('Strike');

                        target.appendChild(LoadingIcon);
                        target.querySelector('svg').style = "display: none";

                        if (Payload.platform === "TTV") {
                            if (user_id === Payload.person.id) {
                                LoadingIcon.remove();
                                target.querySelector('svg').style = "";
                                HandleMessage({
                                    "type": "event",
                                    "message": "You are not allowed to ban yourself."
                                });
                                a.querySelector('.Msg').style = "";
                                a.querySelector('.Msg').classList.remove('Strike');
                                return;
                            }
                            fetch('https://api.twitch.tv/helix/moderation/bans?broadcaster_id=' + user_id + "&moderator_id=" + user_id, {
                                "method": "POST",
                                "headers": {
                                    "Client-ID": client_id,
                                    "Authorization": "Bearer " + access_token,
                                    'Content-Type': 'application/json'
                                },
                                "body": JSON.stringify({
                                    data: {
                                        "user_id": Payload.person.id
                                    }
                                })
                            }).then(async res => {
                                if (!res.ok) {
                                    return Promise.reject(await res.json());
                                }
                                LoadingIcon.remove();
                                target.querySelector('svg').querySelector('path').removeAttribute('fill-rule');
                                target.querySelector('svg').querySelector('path').removeAttribute('clip-rule');
                                target.querySelector('svg').querySelector('path').setAttribute('d', "m4 10 5 5 8-8-1.5-1.5L9 12 5.5 8.5 4 10z");
                                target.querySelector('svg').style = "";

                                HandleMessage({
                                    "type": "event",
                                    "message": `You banned ${Payload.person.username}`,
                                    "match_if_needed": `BAN:${Payload.person.username.toLowerCase()}`,
                                    "you_message": true
                                });

                                const d = a.querySelector('.ModActions > .Delete');
                                if (d) {
                                    d.disabled = true;
                                }
                            }).catch(err => {
                                let message = err.message ?? err;
                                LoadingIcon.remove();
                                target.disabled = false;
                                target.querySelector('svg').style = "";
                                HandleMessage({
                                    "type": "event",
                                    "message": "Unable to ban user: " + message
                                });

                                a.querySelector('.Msg').style = "";
                                a.querySelector('.Msg').classList.remove('Strike');
                            });
                        }
                        else if (Payload.platform === "YT") {
                            fetch('https://www.googleapis.com/youtube/v3/liveChat/bans?part=snippet', {
                                "method": "POST",
                                "headers": {
                                    "Authorization": "Bearer " + YTAccessToken,
                                    "Accept": "application/json"
                                },
                                "body": JSON.stringify({
                                    "snippet": {
                                        "liveChatId": YTChatID,
                                        "type": "permanent",
                                        "bannedUserDetails": {
                                            "channelId": Payload.person.id
                                        }
                                    }
                                })
                            }).then(async res => {
                                if (!res.ok) {
                                    return Promise.reject(await res.json());
                                }
                                return res.json();
                            }).then(res => {
                                CachedBanIds[Payload.person.id] = res.id;
                                LoadingIcon.remove();
                                target.querySelector('svg').querySelector('path').removeAttribute('fill-rule');
                                target.querySelector('svg').querySelector('path').removeAttribute('clip-rule');
                                target.querySelector('svg').querySelector('path').setAttribute('d', "m4 10 5 5 8-8-1.5-1.5L9 12 5.5 8.5 4 10z");
                                target.querySelector('svg').style = "";

                                HandleMessage({
                                    "type": "event",
                                    "message": `You hid ${Payload.person.username} from the channel`,
                                    "match_if_needed": `YTBAN:${Payload.person.id}`,
                                    "you_message": true
                                });

                                const d = a.querySelector('.ModActions > .Delete');
                                if (d) {
                                    d.disabled = true;
                                }
                            }).catch(err => {
                                const message = err.error ? err.error.message : (err.message ?? err);
                                LoadingIcon.remove();
                                target.disabled = false;
                                target.querySelector('svg').style = "";
                                HandleMessage({
                                    "type": "event",
                                    "message": "Unable to ban user: " + message
                                });

                                a.querySelector('.Msg').style = "";
                                a.querySelector('.Msg').classList.remove('Strike');
                            });
                        }
                        else if (Payload.platform === "Kick") {
                            if (KickChannel.user_id === Payload.person.id) {
                                LoadingIcon.remove();
                                target.querySelector('svg').style = "";
                                HandleMessage({
                                    "type": "event",
                                    "message": "You are not allowed to ban yourself."
                                });
                                a.querySelector('.Msg').style = "";
                                a.querySelector('.Msg').classList.remove('Strike');
                                return;
                            }
                            fetch('https://api.kick.com/public/v1/moderation/bans', {
                                "method": "POST",
                                "headers": {
                                    "Authorization": "Bearer " + KickAccessToken,
                                    'Content-Type': 'application/json'
                                },
                                "body": JSON.stringify({
                                    broadcaster_user_id: KickChannel.user_id,
                                    user_id: Payload.person.id
                                })
                            }).then(async res => {
                                if (!res.ok) {
                                    return Promise.reject(await res.json());
                                }
                                LoadingIcon.remove();
                                target.querySelector('svg').querySelector('path').removeAttribute('fill-rule');
                                target.querySelector('svg').querySelector('path').removeAttribute('clip-rule');
                                target.querySelector('svg').querySelector('path').setAttribute('d', "m4 10 5 5 8-8-1.5-1.5L9 12 5.5 8.5 4 10z");
                                target.querySelector('svg').style = "";

                                HandleMessage({
                                    "type": "event",
                                    "message": `You banned ${Payload.person.username}`,
                                    "match_if_needed": `KKBAN:${Payload.person.id}`,
                                    "you_message": true
                                });

                                const d = a.querySelector('.ModActions > .Delete');
                                if (d) {
                                    d.disabled = true;
                                }
                            }).catch(err => {
                                let message = err.message ?? err;
                                LoadingIcon.remove();
                                target.disabled = false;
                                target.querySelector('svg').style = "";
                                HandleMessage({
                                    "type": "event",
                                    "message": "Unable to ban user: " + message
                                });

                                a.querySelector('.Msg').style = "";
                                a.querySelector('.Msg').classList.remove('Strike');
                            });
                        }
                    });
                    // Timeout user
                    a.querySelector('.ModActions > .Timeout').addEventListener('click', (ev) => {
                        const target = a.querySelector('.ModActions > .Timeout');
                        target.disabled = true;
                        const LoadingIcon = document.createElement('div');
                        LoadingIcon.className = "loadingicon";
                        LoadingIcon.style = "--color: white;";

                        a.querySelector('.Msg').style = "opacity: 50%;";
                        a.querySelector('.Msg').classList.add('Strike');

                        target.appendChild(LoadingIcon);
                        target.querySelector('svg').style = "display: none";

                        if (Payload.platform === "TTV") {
                            if (user_id === Payload.person.id) {
                                LoadingIcon.remove();
                                target.querySelector('svg').style = "";
                                HandleMessage({
                                    "type": "event",
                                    "message": "You are not allowed to timeout yourself."
                                });
                                a.querySelector('.Msg').style = "";
                                a.querySelector('.Msg').classList.remove('Strike');
                                return;
                            }
                            fetch('https://api.twitch.tv/helix/moderation/bans?broadcaster_id=' + user_id + "&moderator_id=" + user_id, {
                                "method": "POST",
                                "headers": {
                                    "Client-ID": client_id,
                                    "Authorization": "Bearer " + access_token,
                                    'Content-Type': 'application/json'
                                },
                                "body": JSON.stringify({
                                    data: {
                                        "user_id": Payload.person.id,
                                        "duration": 60
                                    }
                                })
                            }).then(async res => {
                                if (!res.ok) {
                                    return Promise.reject(await res.json());
                                }
                                LoadingIcon.remove();
                                target.querySelector('svg').querySelector('path').removeAttribute('fill-rule');
                                target.querySelector('svg').querySelector('path').removeAttribute('clip-rule');
                                target.querySelector('svg').querySelector('path').setAttribute('d', "m4 10 5 5 8-8-1.5-1.5L9 12 5.5 8.5 4 10z");
                                target.querySelector('svg').style = "";

                                HandleMessage({
                                    "type": "event",
                                    "message": `You timed out ${Payload.person.username} for 1:00`,
                                    "match_if_needed": `TIMEOUT:${Payload.person.username.toLowerCase()}`,
                                    "you_message": true
                                });

                                const d = a.querySelector('.ModActions > .Delete');
                                if (d) {
                                    d.disabled = true;
                                }
                            }).catch(err => {
                                let message = err.message ?? err;
                                LoadingIcon.remove();
                                target.disabled = false;
                                target.querySelector('svg').style = "";
                                HandleMessage({
                                    "type": "event",
                                    "message": "Unable to timeout user: " + message
                                });

                                a.querySelector('.Msg').style = "";
                                a.querySelector('.Msg').classList.remove('Strike');
                            });
                        }
                        else if (Payload.platform === "YT") {
                            fetch('https://www.googleapis.com/youtube/v3/liveChat/bans?part=snippet', {
                                "method": "POST",
                                "headers": {
                                    "Authorization": "Bearer " + YTAccessToken,
                                    "Accept": "application/json"
                                },
                                "body": JSON.stringify({
                                    "snippet": {
                                        "liveChatId": YTChatID,
                                        "type": "temporary",
                                        "banDurationSeconds": 60,
                                        "bannedUserDetails": {
                                            "channelId": Payload.person.id
                                        }
                                    }
                                })
                            })
                                .then(async res => {
                                    if (!res.ok) {
                                        return Promise.reject(await res.json());
                                    }
                                    return res.json();
                                })
                                .then(res => {
                                    CachedBanIds[Payload.person.id] = res.id;
                                    LoadingIcon.remove();
                                    target.querySelector('svg').querySelector('path').removeAttribute('fill-rule');
                                    target.querySelector('svg').querySelector('path').removeAttribute('clip-rule');
                                    target.querySelector('svg').querySelector('path').setAttribute('d', "m4 10 5 5 8-8-1.5-1.5L9 12 5.5 8.5 4 10z");
                                    target.querySelector('svg').style = "";

                                    HandleMessage({
                                        "type": "event",
                                        "message": `You timed out ${Payload.person.username} for 1:00`,
                                        "match_if_needed": `YTTIMEOUT:${Payload.person.id}`,
                                        "you_message": true
                                    });

                                    const d = a.querySelector('.ModActions > .Delete');
                                    if (d) {
                                        d.disabled = true;
                                    }
                                })
                                .catch(err => {
                                    let message = err.error ? err.error.message : (err.message ?? err);
                                    LoadingIcon.remove();
                                    target.disabled = false;
                                    target.querySelector('svg').style = "";
                                    HandleMessage({
                                        "type": "event",
                                        "message": "Unable to timeout user: " + message
                                    });

                                    a.querySelector('.Msg').style = "";
                                    a.querySelector('.Msg').classList.remove('Strike');
                                });
                        }
                        else if (Payload.platform === "Kick") {
                            if (KickChannel.user_id === Payload.person.id) {
                                LoadingIcon.remove();
                                target.querySelector('svg').style = "";
                                HandleMessage({
                                    "type": "event",
                                    "message": "You are not allowed to timeout yourself."
                                });
                                a.querySelector('.Msg').style = "";
                                a.querySelector('.Msg').classList.remove('Strike');
                                return;
                            }
                            fetch('https://api.kick.com/public/v1/moderation/bans', {
                                "method": "POST",
                                "headers": {
                                    "Authorization": "Bearer " + KickAccessToken,
                                    'Content-Type': 'application/json'
                                },
                                "body": JSON.stringify({
                                    broadcaster_user_id: KickChannel.user_id,
                                    duration: 1,
                                    user_id: Payload.person.id
                                })
                            }).then(async res => {
                                if (!res.ok) {
                                    return Promise.reject(await res.json());
                                }
                                LoadingIcon.remove();
                                target.querySelector('svg').querySelector('path').removeAttribute('fill-rule');
                                target.querySelector('svg').querySelector('path').removeAttribute('clip-rule');
                                target.querySelector('svg').querySelector('path').setAttribute('d', "m4 10 5 5 8-8-1.5-1.5L9 12 5.5 8.5 4 10z");
                                target.querySelector('svg').style = "";

                                HandleMessage({
                                    "type": "event",
                                    "message": `You timed out ${Payload.person.username} for 1:00`,
                                    "match_if_needed": `KKTIMEOUT:${Payload.person.id}`,
                                    "you_message": true
                                });

                                const d = a.querySelector('.ModActions > .Delete');
                                if (d) {
                                    d.disabled = true;
                                }
                            }).catch(err => {
                                let message = err.message ?? err;
                                LoadingIcon.remove();
                                target.disabled = false;
                                target.querySelector('svg').style = "";
                                HandleMessage({
                                    "type": "event",
                                    "message": "Unable to timeout user: " + message
                                });

                                a.querySelector('.Msg').style = "";
                                a.querySelector('.Msg').classList.remove('Strike');
                            });
                        }
                    });
                    // Delete message
                    a.querySelector('.ModActions > .Delete').addEventListener('click', (ev) => {
                        const target = a.querySelector('.ModActions > .Delete');
                        target.disabled = true;
                        const LoadingIcon = document.createElement('div');
                        LoadingIcon.className = "loadingicon";
                        LoadingIcon.style = "--color: white;";

                        a.querySelector('.Msg').style = "opacity: 50%;";
                        a.querySelector('.Msg').classList.add('Strike');

                        target.appendChild(LoadingIcon);
                        target.querySelector('svg').style = "display: none";

                        if (Payload.platform === "TTV") {
                            fetch('https://api.twitch.tv/helix/moderation/chat?broadcaster_id=' + user_id + "&moderator_id=" + user_id + "&message_id=" + Payload.id, {
                                "method": "DELETE",
                                "headers": {
                                    "Client-ID": client_id,
                                    "Authorization": "Bearer " + access_token
                                }
                            }).then(async res => {
                                if (!res.ok) {
                                    return Promise.reject(await res.json());
                                }
                                LoadingIcon.remove();
                                target.querySelector('svg').style = "";

                                HandleMessage({
                                    "type": "event",
                                    "message": `You deleted ${Payload.person.username}'s message`,
                                    "match_if_needed": `DELETE:${Payload.id}`,
                                    "you_message": true
                                });
                            }).catch(err => {
                                let message = err.message ?? err;
                                LoadingIcon.remove();
                                target.disabled = false;
                                target.querySelector('svg').style = "";
                                HandleMessage({
                                    "type": "event",
                                    "message": "Unable to delete message: " + message
                                });

                                a.querySelector('.Msg').style = "";
                                a.querySelector('.Msg').classList.remove('Strike');
                            });
                        }
                        else if (Payload.platform === "YT") {
                            fetch('https://www.googleapis.com/youtube/v3/liveChat/messages?id=' + Payload.id, { // No need for data, just IDs.
                                "method": "DELETE",
                                "headers": {
                                    "Authorization": "Bearer " + YTAccessToken,
                                    "Accept": "application/json"
                                }
                            }).then(async res => {
                                if (!res.ok) {
                                    return Promise.reject(await res.json());
                                }
                                LoadingIcon.remove();
                                target.querySelector('svg').style = "";

                                HandleMessage({
                                    "type": "event",
                                    "message": `You deleted ${Payload.person.username}'s message`,
                                    "match_if_needed": `YTDELETE:${Payload.id}`,
                                    "you_message": true
                                });
                            }).catch(err => {
                                let message = err.error ? err.error.message : (err.message ?? err);
                                LoadingIcon.remove();
                                target.disabled = false;
                                target.querySelector('svg').style = "";
                                HandleMessage({
                                    "type": "event",
                                    "message": "Unable to delete message: " + message
                                });

                                a.querySelector('.Msg').style = "";
                                a.querySelector('.Msg').classList.remove('Strike');
                            });
                        }
                        else if (Payload.platform === "Kick") {
                            // Public API does not have an endpoint for deleting messages
                            LoadingIcon.remove();
                            target.querySelector('svg').style = "";

                            HandleMessage({
                                "type": "event",
                                "message": "To delete this message for everyone, please visit kick.com/yourchannel as Kick does not support deleting messages through third-party apps."
                            });
                        }
                        else if (Payload.platform === "ALL") {
                            const TTV_MsgId = a.getAttribute('data-ttv');
                            const YT_MsgId = a.getAttribute('data-yt');
                            const Kick_MsgId = a.getAttribute('data-kk');
                            let A1 = TTV_MsgId === null;
                            let A2 = YT_MsgId === null;
                            let ACall = (IsOnlyKick = false) => {
                                LoadingIcon.remove();
                                target.querySelector('svg').style = "";
                                HandleMessage({
                                    "type": "event",
                                    "message": IsOnlyKick ? "To delete this message for everyone, please visit kick.com/yourchannel as Kick does not support deleting messages through third-party apps." : `Deleted message on all platforms`,
                                    "match_if_needed": `DELETE:${Payload.id}`
                                });
                            };
                            if (!A1) {
                                fetch('https://api.twitch.tv/helix/moderation/chat?broadcaster_id=' + user_id + "&moderator_id=" + user_id + "&message_id=" + TTV_MsgId, {
                                    "method": "DELETE",
                                    "headers": {
                                        "Client-ID": client_id,
                                        "Authorization": "Bearer " + access_token
                                    }
                                }).then(async res => {
                                    if (!res.ok) {
                                        return Promise.reject(await res.json());
                                    }
                                    A1 = true;
                                    if (A1 && A2) ACall();
                                }).catch(err => {
                                    let message = err.message ?? err;
                                    LoadingIcon.remove();
                                    HandleMessage({
                                        "type": "event",
                                        "message": "Unable to delete message on Twitch: " + message
                                    });;
                                });
                            }
                            if (!A2) {
                                fetch('https://www.googleapis.com/youtube/v3/liveChat/messages?id=' + YT_MsgId, { // No need for data, just IDs.
                                    "method": "DELETE",
                                    "headers": {
                                        "Authorization": "Bearer " + YTAccessToken,
                                        "Accept": "application/json"
                                    }
                                }).then(async res => {
                                    if (!res.ok) {
                                        return Promise.reject(await res.json());
                                    }
                                    A2 = true;
                                    if (A1 && A2) ACall();
                                }).catch(err => {
                                    let message = err.error ? err.error.message : (err.message ?? err);
                                    LoadingIcon.remove();
                                    HandleMessage({
                                        "type": "event",
                                        "message": "Unable to delete message on YouTube: " + message
                                    });;
                                });
                            }
                            if (A1 && A2) // No support
                            {
                                ACall(true);
                            }
                        }
                    });
                }
                break;
        }

        if (IsAtTheBottom) {
            MessagesList.scrollTo(0, MessagesList.scrollHeight)
        }

        if (MessagesList.children.length > ChatSettings.Apperance.DisplayAmount) {
            const Remove = (MessagesList.children.length - ChatSettings.Apperance.DisplayAmount);
            for (let k = 0; k < Remove; k++) {
                MessagesList.removeChild(MessagesList.children[k]); // Remove old messages
            }
        }

        sessionStorage.setItem("cache_msglist", MessagesList.innerHTML);
    };
    if (PauseChat) {
        QueuedPromisedList.push(HandleEvent);;
        return;
    }
    else if (performance.now() < LastChat) {
        if (IsTimingOut === -1) IsTimingOut = setTimeout(() => {
            IsTimingOut = -1;
            if (WaitingEvents.length > 0) {
                LastChat = (performance.now() + (ChatSettings.Apperance.DisplayTimeout * 1000));
            }
            for (const WaitingEvent of WaitingEvents) {
                WaitingEvent();
                delete WaitingEvent;
            }
            WaitingEvents = [];
        }, LastChat - performance.now());

        WaitingEvents.push(HandleEvent);
        return;
    }

    LastChat = (performance.now() + (ChatSettings.Apperance.DisplayTimeout * 1000));
    HandleEvent();
}

let WaitingEvents = [];
let IsTimingOut = -1;

try {
    if (sessionStorage.getItem("cache_msglist") !== null) {
        document.getElementById('Messages').innerHTML = sessionStorage.getItem("cache_msglist");

        for (let Badge of document.querySelectorAll('.ModActions')) { // Remove Mod Actions
            Badge.innerText = "";
            Badge.className = "empty-gap";
        }

        BottomDelay = performance.now() + 100;
        document.getElementById('Messages').scrollTo(0, document.getElementById('Messages').scrollHeight);
    }

} catch (error) {
    console.error("Couldn't cache ", error);
}

//#region Verify Stuff
const TypicalMessages = {
    ReverifyNeeded: function () {
        console.error("Reverification with YouTube is needed to continue.");
    }
};

let YTChatID = "";
let YTAccessToken = "";
let access_token = "";
var client_id = 'b5d3338b79q2xza4zab9j5g9vhk7is';
function LoadYTBroadcast(ID) {
    return fetch('https://youtube.googleapis.com/youtube/v3/liveBroadcasts?part=snippet&broadcastType=all&maxResults=1&id=' + ID, {
        "headers": {
            "Authorization": "Bearer " + YTAccessToken,
            "Accept": "application/json"
        }
    }).then(res => {
        if (res.status == 401) {
            TypicalMessages.ReverifyNeeded();
        }
        return res.json();
    }).then(json => {
        if (json.items.length > 0) {
            if (sessionStorage.getItem("cache_npt") != null) {
                NextPageToken = sessionStorage.getItem("cache_npt");
            }

            YTChatID = json.items[0].snippet.liveChatId;
            console.log("[YT] Connected to broadcast!");

            if (ChatSettings.Apperance.PollYTMessagesOnStart) {
                PollChatMessages();
                if (document.querySelector("#Switch")) {
                    document.querySelector('#Switch').classList.add("YTConnected");
                }
            }
            fetchStickers();
            return Promise.resolve(YTChatID);
        }
        return Promise.reject("No stream found!");
    }).catch(err => {
        console.error(err);
        return Promise.reject(err);
    });
}

let YTIsFetching = false;
let YTDisconnect = false;
let WebSocketSupported = /MultistreamTools/i.test(navigator.userAgent);
let NextPageToken = "";
let socket = null;
let DoNotReconnect = false;

function ConnectSocket() {
    if (socket && socket.connected) return;
    //performance.now()
    socket = io("ws://127.0.0.1:8765", {
        reconnection: false,
        transports: ["websocket"]
    });

    socket.on("details_needed", () => {
        socket.emit("authenticate", { "chatId": YTChatID, "cachedPageToken": NextPageToken, "maxResults": 200 })
    });

    socket.on("chat", (data) => {
        if (Array.isArray(data.items)) {
            const Messages = data.items;
            if (Messages.length > 0) HandleYTMessages(Messages, 0);
        }
        if (data.nextPageToken) {
            NextPageToken = data.nextPageToken;
            try {
                sessionStorage.setItem("cache_npt", NextPageToken);
            } catch (error) {
                console.error(error);
            }
        }
        if (SendYouTubeDataToTop) {
            IfDashboardSend("ytChatReceived", data)
        }
    });

    socket.on('error', (data) => {
        if (data.details && data.details.includes('invalid authentication credential')) {
            HandleMessage({
                "type": "event",
                "message": "[Chat] Disconnected from YouTube. Please refresh and reauthenticate yourself to continue."
            });
            DoNotReconnect = true;
            return;
        }
        if (data.details && data.details.includes("quota")) {
            HandleMessage({
                "type": "event",
                "message": `[Chat] YouTube's Chat is unavailable for the rest of the day. We are currently limited, as we have a small quota.`
            });
            DoNotReconnect = true;
            return;
        }
        HandleMessage({
            "type": "event",
            "message": data.details ?? data.message ?? data
        });
    });

    socket.on("connect_error", (err) => {
        console.log(`connect_error due to ${err.message}`);
        if (YTDisconnect) return;
        HandleMessage({
            "type": "event",
            "message": "Bug Report: Unable to connect to YouTube Low-Latency chat. Using fallback polling (website behavior)."
        });
        WebSocketSupported = false;
        PollChatMessages();
    });

    socket.on("connect", () => {
        const EventHTML = document.createElement('div');
        EventHTML.className = "Message UserEvent";
        const Gap = document.createElement('div');
        Gap.className = "gap";
        const Span = document.createElement('span');
        Span.className = "Msg Text";
        Span.style.color = "gray";

        Span.innerText = "[Chat] YouTube (Low-Latency) is connected!";
        EventHTML.appendChild(Gap);
        EventHTML.appendChild(Span);
        document.getElementById('Messages').appendChild(EventHTML);
        if (IsAtTheBottom) document.getElementById('Messages').scrollTo(0, document.getElementById('Messages').scrollHeight)
    });

    socket.on("disconnect", (reason, details) => {
        console.log(reason);
        if (reason != "io server disconnect" && reason != "io client disconnect" && reason != "parse error" && !DoNotReconnect && !YTDisconnect) {
            ConnectSocket();
        }
    });
}

let ConnectedMessageYT = false;

function PollChatMessages() {
    if (document.hidden) // Don't send requests when the page is hidden
    {
        setTimeout(PollChatMessages, 500);
        return;
    }
    if (YTIsFetching) // A bug that it sends more than one request at once. This is a workaround;
    {
        console.warn("A simultaneously operation was detected and prevented.");
        return;
    }
    if (YTDisconnect) {
        console.log("Disconnected YT chat.");
        return;
    }
    YTIsFetching = true;
    return fetch('https://www.googleapis.com/youtube/v3/liveChat/messages?part=snippet&part=authorDetails&maxResults=200&liveChatId=' + YTChatID + ((NextPageToken.length > 0) ? ("&pageToken=" + NextPageToken) : ""), { // No need for data, just IDs.
        "headers": {
            "Authorization": "Bearer " + YTAccessToken,
            "Accept": "application/json"
        }
    }).then(res => {
        YTIsFetching = false;
        if (!res.ok) {
            console.warn("[YT] We are unable to access the live chat right now. We'll try again in 2 seconds.");
            return Promise.reject("failed to update");
        }
        return res.json();
    }).then(json => {
        NextPageToken = json.nextPageToken || "";
        try {
            sessionStorage.setItem("cache_npt", NextPageToken);
        } catch (error) {
            console.error(error);
        }

        if (Array.isArray(json.items)) {
            const Messages = json.items;
            if (Messages.length > 0) HandleYTMessages(Messages, (json.pollingIntervalMillis / Messages.length));

            if (WebSocketSupported) {
                ConnectSocket();
                return;
            }
        }
        if (!ConnectedMessageYT) {
            ConnectedMessageYT = true;
            const EventHTML = document.createElement('div');
            EventHTML.className = "Message UserEvent";
            const Gap = document.createElement('div');
            Gap.className = "gap";
            const Span = document.createElement('span');
            Span.className = "Msg Text";
            Span.style.color = "gray";

            Span.innerText = "[Chat] YouTube is connected!";
            EventHTML.appendChild(Gap);
            EventHTML.appendChild(Span);
            document.getElementById('Messages').appendChild(EventHTML);
            if (IsAtTheBottom) document.getElementById('Messages').scrollTo(0, document.getElementById('Messages').scrollHeight)
        }

        if (SendYouTubeDataToTop) {
            IfDashboardSend("ytChatReceived", json)
        }

        setTimeout(PollChatMessages, json.pollingIntervalMillis); // Timeout in a polling interval according to YouTube.
        return null;
    }).catch(err => {
        YTIsFetching = false;
        console.warn("[YT] Request failed. Retrying in 2 seconds");
        setTimeout(PollChatMessages, 2000);
        console.error(err);
        return Promise.reject("failed to update");
    });
}

let CachedBanIds = {};

async function HandleYTMessages(Messages = [], Duration = 0) {
    if (Messages.length > 10 || Messages.length === 1) Duration = 0;

    const RemoveAtSymbol = (str) => {
        if (str.startsWith("@"))
        {
            str = str.substring(1);
        }
        return str;
    };

    const LastHour = new Date().getTime() - (1000 * 60 * 60);
    for (const Message of Messages) {
        if (Message.snippet.publishedAt && (LastHour > new Date(Message.snippet.publishedAt).getTime())) {
            continue; // Past hour messages only
        }
        if (ExcludeMessageIds[Message.id]) {
            ExcludeMessageIds[Message.id] = undefined;
            continue;
        }
        switch (Message.snippet.type) {
            case "textMessageEvent":
                const Snippet = Message.snippet;
                let JsonTemplate = {
                    "type": "Message",
                    "id": Message.id,
                    "message": null,
                    "person": {
                        "username": RemoveAtSymbol(Message.authorDetails.displayName),
                        "profilePicture": Message.authorDetails.profileImageUrl,
                        "id": Message.authorDetails.channelId
                    },
                    "time": new Date(Snippet.publishedAt).getTime(),
                    "badge_platform": "",
                    "badge_user": "",
                    "badge_modtype": "",
                    "badge_substatus": "",
                    "platform": "YT",
                    "user_link": "",
                    "user_color": ""
                };

                let namecolor = "";
                if (Message.authorDetails.isChatOwner) {
                    namecolor = "#ffdb00";
                }
                else if (Message.authorDetails.isChatModerator) {
                    namecolor = "#2962eb";
                }
                else if (Message.authorDetails.isChatSponsor) {
                    namecolor = "#0ec700"
                }

                // ListCache.Push(Message.authorDetails.displayName, {
                //     "platform": "YT",
                //     "channelId": Message.authorDetails.channelId
                // });

                JsonTemplate.user_color = namecolor;
                JsonTemplate.user_link = `https://www.youtube.com/channel/` + Message.authorDetails.channelId;

                // Badges
                let msgHTML = [];
                let htmlEscape = function (text) {
                    if (!text && text.length <= 0) return "";
                    return text.replaceAll("&", "&amp;")
                        .replaceAll("<", "&lt;")
                        .replaceAll(">", "&gt;")
                        .replaceAll('"', "&quot;")
                        .replaceAll("'", "&#39;");
                }

                msgHTML.push('<span>' + htmlEscape(Snippet.textMessageDetails.messageText) + '</span>')

                JsonTemplate.message = (msgHTML.length !== 0) ? msgHTML.join("") : Snippet.displayMessage;

                HandleMessage(JsonTemplate);
                break;
            case "messageDeletedEvent":
                const Snippet2 = Message.snippet;
                const val = document.querySelector('div[data-id="' + Snippet2.messageDeletedDetails.deletedMessageId + '"]')
                if (val) {
                    const username = val.querySelector('.Username').innerText;
                    if (ChatSettings.ModAppearance.LogModerationActions)
                        HandleMessage({
                            "type": "event",
                            "message": `${RemoveAtSymbol(Message.authorDetails.displayName)} deleted ${username}'s message`,
                            "match_if_needed": "YTDELETE:" + Snippet2.messageDeletedDetails.deletedMessageId
                        })

                    const d = val.querySelector('.ModActions > .Delete');
                    if (d) {
                        d.disabled = true;
                    }
                    const m = val.querySelector('.Msg');
                    m.classList.add("Strike");
                    m.style.opacity = "50%";
                    if (ChatSettings.Apperance.HideDeletedMessages) {
                        val.parentElement.style.display = "none";
                    }
                }
                break;
            case "userBannedEvent":
                const BanSnippet = Message.snippet;
                const BanDetails = BanSnippet.userBannedDetails;
                // Clear chat messages
                let values = Array.from(document.querySelectorAll('.Username.Text'))
                    .filter(el => el.textContent === RemoveAtSymbol(BanDetails.bannedUserDetails.displayName));
                for (let val of values) {
                    const d = val.parentElement.querySelector('.ModActions > .Delete');
                    if (d) {
                        d.disabled = true;
                    }
                    const m = val.parentElement.querySelector('.Msg');
                    m.classList.add("Strike");
                    m.style.opacity = "50%";
                    if (ChatSettings.Apperance.HideDeletedMessages) {
                        val.parentElement.style.display = "none";
                    }
                }
                // Determine if timeout or ban
                let id = "";
                if (CachedBanIds[BanDetails.bannedUserDetails.channelId]) {
                    id = CachedBanIds[BanDetails.bannedUserDetails.channelId];
                    CachedBanIds[BanDetails.bannedUserDetails.channelId] = undefined;
                }

                if (BanDetails.banType === "temporary") {
                    const getAmount = function () {
                        const totalSeconds = BanDetails.banDurationSeconds;
                        const days = Math.floor(totalSeconds / 86400);
                        const hours = Math.floor(totalSeconds / 3600);
                        const minutes = Math.floor((totalSeconds % 3600) / 60);
                        const seconds = totalSeconds % 60;

                        const IsExactDay = ((totalSeconds / 86400) === Math.floor(totalSeconds / 86400));

                        if ((days >= 1 && IsExactDay) || days > 3) {
                            return IsExactDay ? (days + (days === 1 ? " day" : " days")) : (days + "+ days");
                        }
                        if (totalSeconds < 60) {
                            return totalSeconds === 1 ? (totalSeconds + " second") : (totalSeconds + " seconds");
                        }
                        const formattedMinutes = String(minutes).padStart(2, '0');
                        const formattedSeconds = String(seconds).padStart(2, '0');
                        if (hours > 0) {
                            return hours + ":" + formattedMinutes + ":" + formattedSeconds;
                        }
                        return minutes + ":" + formattedSeconds;
                    };
                    if (ChatSettings.ModAppearance.LogModerationActions)
                        HandleMessage({
                            "type": "event",
                            "message": `${RemoveAtSymbol(Message.authorDetails.displayName)} timed out ${RemoveAtSymbol(BanDetails.bannedUserDetails.displayName)} for ${getAmount()}`,
                            "undo": () => {
                                return fetch('https://www.googleapis.com/youtube/v3/liveChat/bans?part=snippet', {
                                    "method": "POST",
                                    "headers": {
                                        "Authorization": "Bearer " + YTAccessToken,
                                        "Accept": "application/json"
                                    },
                                    "body": JSON.stringify({
                                        "snippet": {
                                            "liveChatId": YTChatID,
                                            "type": "temporary",
                                            "banDurationSeconds": 1,
                                            "bannedUserDetails": {
                                                "channelId": BanDetails.bannedUserDetails.channelId
                                            }
                                        }
                                    })
                                }).then(async res => {
                                    if (res.ok) return Promise.resolve(`YTTIMEOUT:${BanDetails.bannedUserDetails.channelId}`);
                                    else return Promise.reject(await res.json());
                                }).catch(err => {
                                    if (err instanceof Object) {
                                        return Promise.reject(err.message ?? err);
                                    }
                                    else {
                                        return Promise.reject(err);
                                    }
                                })
                            },
                            "match_if_needed": `YTTIMEOUT:${BanDetails.bannedUserDetails.channelId}`
                        })
                }
                else {
                    let banTemplate = {
                        "type": "event",
                        "message": `${RemoveAtSymbol(Message.authorDetails.displayName)} hid ${RemoveAtSymbol(BanDetails.bannedUserDetails.displayName)} from the channel`,
                        "match_if_needed": `YTBAN:${BanDetails.bannedUserDetails.channelId}`
                    };
                    if (id.length > 0) {
                        banTemplate.undo = () => {
                            return fetch(`https://www.googleapis.com/youtube/v3/liveChat/bans?id=${id}`, {
                                "method": "DELETE",
                                "headers": {
                                    "Authorization": "Bearer " + YTAccessToken
                                }
                            }).then(async res => {
                                if (res.ok) return Promise.resolve(`YTUNBAN:${BanDetails.bannedUserDetails.channelId}`);
                                else return Promise.reject(await res.json());
                            }).catch(err => {
                                if (err instanceof Object) {
                                    return Promise.reject(err.message ?? err);
                                }
                                else {
                                    return Promise.reject(err);
                                }
                            })
                        };
                    }
                    if (ChatSettings.ModAppearance.LogModerationActions)
                        HandleMessage(banTemplate);
                }
                break;
            case "sponsorOnlyModeStartedEvent":
            case "sponsorOnlyModeEndedEvent":
                if (!ChatSettings.ModAppearance.LogModerationActions) break;
                const b = Message.snippet.type === "sponsorOnlyModeStartedEvent";
                HandleMessage({
                    "type": "event",
                    "message": `Member Only Mode was ${b ? "turned on" : "turned off"} for the chat`
                })
                break;
            case "newSponsorEvent":
            case "memberMilestoneChatEvent":

            case "superChatEvent":
            case "superStickerEvent":

            case "membershipGiftingEvent":
            case "giftMembershipReceivedEvent":
                const Snippet3 = Message.snippet;
                let JsonTemplate2 = {
                    "type": "Message",
                    "id": Message.id,
                    "message": null,
                    "person": {
                        "username": RemoveAtSymbol(Message.authorDetails.displayName),
                        "profilePicture": Message.authorDetails.profileImageUrl,
                        "id": Message.authorDetails.channelId
                    },
                    "time": new Date(Snippet.publishedAt).getTime(),
                    "badge_platform": "",
                    "badge_user": "",
                    "badge_modtype": "",
                    "badge_substatus": "",
                    "platform": "YT",
                    "user_link": "",
                    "user_color": ""
                };

                let namecolor2 = "";
                if (Message.authorDetails.isChatOwner) {
                    namecolor2 = "#ffdb00";
                }
                else if (Message.authorDetails.isChatModerator) {
                    namecolor2 = "#2962eb";
                }
                else if (Message.authorDetails.isChatSponsor) {
                    namecolor2 = "#0ec700"
                }

                JsonTemplate2.user_color = namecolor2;
                JsonTemplate2.user_link = `https://www.youtube.com/channel/` + Message.authorDetails.channelId;

                // Badges
                let msgHTML2 = [];
                let htmlEscape2 = function (text) {
                    if (!text && text.length <= 0) return "";
                    return text.replaceAll("&", "&amp;")
                        .replaceAll("<", "&lt;")
                        .replaceAll(">", "&gt;")
                        .replaceAll('"', "&quot;")
                        .replaceAll("'", "&#39;");
                }
                let getTierColor = function (tier) {
                    let Colors = [
                        "#1200ff",
                        "#00f6ff",
                        "#59e282",
                        "#feff5f",
                        "#ff83e9",
                        "#ff5252"
                    ];
                    tier = Math.min(Colors.length - 1, tier);
                    return Colors[tier];
                }

                if (Snippet3.newSponsorDetails) {
                    if (!Snippet3.newSponsorDetails.isUpgrade) {
                        msgHTML.push(`<span style="color: #00ff30;">is now a member! (${htmlEscape2(Snippet3.newSponsorDetails.memberLevelName)})</span>`);
                    }
                    else {
                        msgHTML.push(`<span style="color: #00ff30;">has upgraded to: ${htmlEscape2(Snippet3.newSponsorDetails.memberLevelName)}</span>`);
                    }
                }
                else if (Snippet3.memberMilestoneChatDetails) {
                    const OneMonth = Snippet3.memberMilestoneChatDetails.memberMonth === 1;
                    msgHTML.push(`<span style="color: #95ffa9">has been a member for ${Snippet3.memberMilestoneChatDetails.memberMonth} ${OneMonth ? "month" : "months"}! (${htmlEscape2(Snippet3.memberMilestoneChatDetails.memberLevelName)})</span>`);
                    if (Snippet.memberMilestoneChatDetails.userComment.length > 0) {
                        msgHTML.push(`<span>: ${htmlEscape2(Snippet.memberMilestoneChatDetails.userComment)}</span>`);
                    }
                }
                else if (Snippet3.superChatDetails) {
                    const Color = getTierColor(Snippet3.superChatDetails.tier);
                    msgHTML.push(`<span style="color: ${Color}">donated ${htmlEscape2(Snippet3.superChatDetails.amountDisplayString)}</span>`);

                    const SuperChatMessage = Snippet3.superChatDetails.userComment;
                    if (SuperChatMessage.length > 0) {
                        msgHTML.push(`<span>: ${htmlEscape2(SuperChatMessage)}</span>`);
                    }
                }
                else if (Snippet3.superStickerDetails) {
                    const Color = getTierColor(Snippet3.superStickerDetails.tier);
                    msgHTML.push(`<span style="color: ${Color}">donated `);
                    let Sticker = "https://lh3.googleusercontent.com/G2OgWJkuvSullUPp2i09zG_WR0IpQu-6Ti4pFXn_FJ1OkR6zU5GdiP9cBavimQopETyojInsRCe8uefjJBqn";
                    if (YTStickers[Snippet3.superStickerDetails.superStickerMetadata.stickerId]) {
                        Sticker = YTStickers[Snippet3.superStickerDetails.superStickerMetadata.stickerId];
                    }
                    msgHTML.push('<img loading="lazy" title="' + htmlEscape(Snippet.superStickerDetails.superStickerMetadata.altText) + '" src="'
                        + `${Sticker}`
                        + '">');
                    msgHTML.push(` for ${htmlEscape2(Snippet3.superStickerDetails.amountDisplayString)}</span>`);
                }
                else if (Snippet3.membershipGiftingDetails) {
                    const OneMembership = Snippet.membershipGiftingDetails.giftMembershipsCount === 1;
                    msgHTML.push(`<span style="color: #f35aff">is gifting ${Snippet3.membershipGiftingDetails.giftMembershipsCount} ${OneMembership ? "membership" : "memberships"} of ${htmlEscape2(Snippet3.membershipGiftingDetails.giftMembershipsLevelName)}</span>`);
                    //#00ff61
                }
                else if (Snippet3.giftMembershipReceivedDetails) {
                    msgHTML.push(`<span style="color: #00a1a1ff">is now a member of ${htmlEscape2(Snippet3.giftMembershipReceivedDetails.memberLevelName)}</span>`);
                }

                JsonTemplate2.message = (msgHTML2.length !== 0) ? msgHTML2.join("") : Snippet3.displayMessage;

                HandleMessage(JsonTemplate2);
                break;
        }
        if (Duration > 0) await new Promise((resolve, reject) => { setTimeout(() => { resolve(""); }, Duration) });
    }
}

let YTStickers = {};

function fetchStickers() {
    fetch("cdn/yt_stickers.json")
        .then(res => {
            if (res.ok) {
                return res.json();
            }
            else {
                return Promise.reject(res);
            }
        })
        .then(json => {
            YTStickers = json;
        })
        .catch(err => {
            console.error("Couldn't load YT stickers");
        })
}

function validateEveryHour() // Twitch requires all apps to validate tokens, every hour when used. https://dev.twitch.tv/docs/authentication/validate-tokens/
{
    fetch("https://id.twitch.tv/oauth2/validate", {
        "headers": {
            "Authorization": "OAuth " + access_token
        }
    }).then(res => {
        if (res.ok) {
            console.log("[Twitch] Token validation succeeded!");
            setTimeout(validateEveryHour, 3600000);
        }
        else {
            console.error("[Twitch] Token validation failed!");

            EncStorage.removeItem('saved_access_token')
            EncStorage.removeItem('saved_refresh_token')
            localStorage.removeItem('saved_expiresin')

            if (access_token.length > 0) location.reload();
        }
    })
}

async function handleSavedToken() {
    (async function () {
        if ((await EncStorage.getItem('saved_access_token')) != null) {
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
        if ((await EncStorage.getItem('ytsavedtoken')) != null) {
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
}

let PastMessageIDs = [];
let session_id = "";
let user_id = "";

//#region Refresh
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
    setTimeout(() => {
        if (socket && socket.connected) // Reconnect socket
        {
            socket.disconnect();
            ConnectSocket();
        }
    }, 100);
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

            IfDashboardSend("ytNewToken", { "t": YTAccessToken, "r": rt, "expires_in": res.expires_in });
            return Promise.resolve(true);
        }
        return Promise.resolve(false);
    });
}

function TWInitRefresh(rt, timeout = -1) {
    if (timeout === -1) {
        try {
            let TIME = ((new Date(localStorage.getItem('saved_expiresin')).getTime() - new Date().getTime())) - 20000;
            if (TIME < 0) TIME = 0;
            console.log("[Twitch] Token expires in " + (TIME / 1000))
            if (TIME <= 0) {
                return TWRefresh(rt);
            }
            setTimeout(() => { TWRefresh(rt); }, TIME);
            return Promise.resolve(true);
        } catch (error) {
            console.error(error);
        }
        return Promise.resolve(false);
    }
    localStorage.setItem('saved_expiresin', new Date(new Date().setSeconds(new Date().getSeconds() + timeout)).toString());
    EncStorage.setItem('saved_refresh_token', rt);
    console.log("[Twitch] Token expires in " + timeout)
    if (((timeout * 1000) - 20000) <= 0) {
        return TWRefresh(rt);
    }
    setTimeout(() => {
        if (socket && socket.connected) // Reconnect socket
        {
            socket.disconnect();
            ConnectSocket();
        }
    }, 100);
    setTimeout(() => { TWRefresh(rt); }, (timeout * 1000) - 20000);
    return Promise.resolve(true);
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

            IfDashboardSend("twNewToken", { "t": access_token, "r": res.refresh_token, "expires_in": res.expires_in });
            return Promise.resolve(true);
        }
        return Promise.resolve(false);
    });
}
//#endregion

function verifyYTToken(token) {
    fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true&access_token=' + token)
        .then(async result => {
            if (!result.ok) return Promise.reject(await result.json());
            YTAccessToken = token;

            if (localStorage.getItem('saved_url') != null && localStorage.getItem('saved_url').length > 0) {
                var regExp = /.*(?:youtu.be\/|v\/|u\/\w\/|live\/|watch\?v=)([^#\&\?]*).*/;
                LoadYTBroadcast(localStorage.getItem('saved_url').match(regExp)[1]);
            }
            EncStorage.setItem('ytsavedtoken', token);

            return result.json();
        }).then(json => {
            if (Array.isArray(json.items) && json.items.length > 0) {
                if (MyPFPURL.length <= 0) {
                    MyPFPURL = json.items[0].snippet.thumbnails["default"].url;
                    MyName = json.items[0].snippet.title;

                    const PlaceholderName = window.NamePlaceholder;
                    if (!PlaceholderName) {
                        alert("Bug detected - contact site owners: PlaceholderName is NULL");
                    }
                    else {
                        window.NamePlaceholder.innerText = MyName;
                    }
                    window.NamePlaceholder = undefined;
                }
            }
        })
        .catch(err => {
            if (err.error && err.error.errors) {
                if (err.error.errors[0].reason === "quotaExceeded") {
                    HandleMessage({
                        "type": "event",
                        "message": `YouTube's Chat is unavailable for the rest of the day. We are currently limited, as we have a small quota.`
                    });
                    console.warn("Authentication is held due to exceeding the quota.");
                    return;
                }
            }
            console.error("YouTube Authentication Failed: ", err);
            EncStorage.removeItem('ytsavedtoken');
        });
}
//#endregion

let SubscribedList = [];
let Badges = {};
let Cheermotes = {};

function FetchCheermotes() {
    fetch(
        'https://api.twitch.tv/helix/bits/cheermotes?broadcaster_id=' + user_id,
        {
            "headers": {
                "Client-ID": client_id,
                "Authorization": "Bearer " + access_token
            }
        }
    ).then(res => {
        if (!res.ok) return Promise.reject(res.statusText);
        return res.json();
    }).then(resp => {
        let data = resp.data;
        for (let Emote of data) {
            for (let Tier of Emote.tiers) {
                Cheermotes[Emote.prefix + Tier.id] = Tier;
            }
        }
    }).catch(err => {
        console.error(err);
    });
}

function FetchBadges() {
    fetch(
        'https://api.twitch.tv/helix/chat/badges/global',
        {
            "headers": {
                "Client-ID": client_id,
                "Authorization": "Bearer " + access_token
            }
        }
    ).then(res => {
        if (!res.ok) return Promise.reject(res.statusText);
        return res.json();
    }).then(resp => {
        let data = resp.data;
        for (let Badge of data) {
            for (let Version of Badge.versions) {
                Badges[Badge.set_id + Version.id] = Version.image_url_2x;
            }
        }
    }).catch(err => {
        console.error(err);
    });
}

function FetchUserBadges() {
    fetch(
        'https://api.twitch.tv/helix/chat/badges?broadcaster_id=' + user_id,
        {
            "headers": {
                "Client-ID": client_id,
                "Authorization": "Bearer " + access_token
            }
        }
    ).then(res => {
        if (!res.ok) return Promise.reject(res.statusText);
        return res.json();
    }).then(resp => {
        let data = resp.data;
        for (let Badge of data) {
            Badges["user_" + Badge.set_id + Version.id] = Badge.image_url_2x;
        }
    }).catch(err => {
        console.error(err);
    });
}

function GetBadge(BadgeId) {
    return Badges["user_" + BadgeId] ?? Badges[BadgeId] ?? "";
}

var KickChannel = null;

function handleKickSupport() {
    if (!KickInitialize) {
        console.error("MISSING KICK SUPPORT!");
        return;
    }
    KickInitialize((User) => {
        if (!User) return; // Not logged in at all.
        if (User.error) {
            HandleMessage({
                "type": "event",
                "message": `[Chat] Failed to connect to Kick: ${User.error.message ?? User.error}`
            });
            return;
        }
        KickChannel = User.data[0];

        setTimeout(() => {
            if (MyPFPURL.length <= 0) {
                MyPFPURL = KickChannel["profile_picture"];
                MyName = KickChannel.name;

                const PlaceholderName = window.NamePlaceholder;
                if (!PlaceholderName) {
                    alert("Bug detected - contact site owners: PlaceholderName is NULL");
                }
                else {
                    window.NamePlaceholder.innerText = MyName;
                }
                window.NamePlaceholder = undefined;
            }
        }, 1000);

        try {
            KickConnect(KickChannel.user_id.toString());
            KickSubscribe([
                ["chat.message.sent", (ChatEvent => {
                    const Message = ChatEvent.data;
                    const Sender = Message.sender;

                    if (ExcludeMessageIds[Message.message_id]) {
                        ExcludeMessageIds[Message.message_id] = undefined;
                        return;
                    }

                    let JsonTemplate = {
                        "type": "Message",
                        "id": Message.message_id,
                        "message": null,
                        "person": {
                            "username": Sender.username,
                            "profilePicture": Sender.profile_picture,
                            "id": Sender.user_id
                        },
                        "time": new Date(Message.created_at).getTime(),
                        "badge_platform": "",
                        "badge_user": "",
                        "badge_modtype": "",
                        "badge_substatus": "",
                        "platform": "Kick",
                        "user_link": "",
                        "user_color": ""
                    };

                    let namecolor = Sender.identity.username_color;

                    JsonTemplate.user_color = namecolor;
                    JsonTemplate.user_link = `https://www.kick.com/` + Sender.channel_slug;

                    // Badges
                    let msgHTML = [];
                    let htmlEscape = function (text) {
                        if (!text && text.length <= 0) return "";
                        return text.replaceAll("&", "&amp;")
                            .replaceAll("<", "&lt;")
                            .replaceAll(">", "&gt;")
                            .replaceAll('"', "&quot;")
                            .replaceAll("'", "&#39;");
                    }

                    let Formatted = htmlEscape(Message.content);

                    while (Formatted.indexOf("[emote:") !== -1) // The emote field on the JSON is broken, so this is the workaround before they fix it in their Public API.
                    {
                        if (!Formatted.includes("]")) break;
                        const param = Formatted.substring(Formatted.indexOf("[emote:")).split("]")[0];
                        if (!param.includes(":")) break;
                        const IdAndText = param.split(":");

                        const Id = IdAndText[1];
                        const TextName = IdAndText[2];

                        const ImgHTML = '<img loading="lazy" title="' + htmlEscape(TextName) + '" src="'
                            + `https://files.kick.com/emotes/${Id}/fullsize`
                            + '">';
                        Formatted = Formatted.replaceAll("[emote:" + Id + ":" + TextName + "]", "</span>" + ImgHTML + "<span>");
                    }

                    msgHTML.push('<span>' + Formatted + '</span>')

                    JsonTemplate.message = (msgHTML.length !== 0) ? msgHTML.join("") : Message.content;

                    HandleMessage(JsonTemplate);
                }),
                ],
                ["channel.subscription.gifts", (SubEventPayload) => {
                    let SubEvent = SubEventPayload.data;
                    if (SubEvent.gifter.is_anonymous) {
                        SubEvent.gifter.username = "Anonymous Gifter";
                        SubEvent.gifter.channel_slug = "anonymous"
                        SubEvent.gifter.profile_picture = "https://files.kick.com/images/profile_image/default1.jpeg";
                        SubEvent.gifter.user_id = 2994;
                    }

                    let NoticeColor = "#f35aff;"

                    let JsonTemplate = {
                        "type": "Message",
                        "id": window.crypto.randomUUID(),
                        "message": null,
                        "person": {
                            "username": SubEvent.gifter.username,
                            "profilePicture": SubEvent.gifter.profile_picture,
                            "id": SubEvent.gifter.user_id
                        },
                        "time": new Date(SubEvent.created_at).getTime(),
                        "badge_platform": "",
                        "badge_user": "",
                        "badge_modtype": "",
                        "badge_substatus": "",
                        "platform": "Kick",
                        "user_link": "",
                        "user_color": ""
                    };

                    JsonTemplate.user_color = ""; // Identity isn't supported for now
                    JsonTemplate.user_link = `https://www.kick.com/${SubEvent.gifter.channel_slug}`;

                    let msgHTML = [];
                    msgHTML.push(`<span style="color: ${NoticeColor};">is gifting ${SubEvent.giftees.length} subs to the community!</span>`);
                    JsonTemplate.message = (msgHTML.length !== 0) ? msgHTML.join("") : "gifted subs";
                    HandleMessage(JsonTemplate);

                    const SendAllGifteesMessages = async () => {
                        try {
                            for (let i = 0; i < SubEvent.giftees.length; i++) {
                                setTimeout(() => {
                                    const Giftee = SubEvent.giftees[i];
                                    HandleMessage({
                                        "type": "Message",
                                        "id": window.crypto.randomUUID(),
                                        "message": `<span style="color: #00a1a1ff;">was gifted by ${SubEvent.gifter.username}!</span>`,
                                        "person": {
                                            "username": Giftee.username,
                                            "profilePicture": Giftee.profile_picture,
                                            "id": Giftee.user_id
                                        },
                                        "time": new Date(SubEvent.created_at).getTime(),
                                        "badge_platform": "",
                                        "badge_user": "",
                                        "badge_modtype": "",
                                        "badge_substatus": "",
                                        "platform": "Kick",
                                        "user_link": `https://www.kick.com/${Giftee.channel_slug}`,
                                        "user_color": ""
                                    });
                                }, i * 250);
                            }
                        } catch (error) {
                            console.error(error);
                        }
                    };
                    setTimeout(SendAllGifteesMessages, 1000);
                }],
                ["channel.subscription.renewal", (SubEventPayload) => {
                    let SubEvent = SubEventPayload.data;
                    let NoticeColor = "#00ff30"

                    let JsonTemplate = {
                        "type": "Message",
                        "id": window.crypto.randomUUID(),
                        "message": null,
                        "person": {
                            "username": SubEvent.subscriber.username,
                            "profilePicture": SubEvent.subscriber.profile_picture,
                            "id": SubEvent.subscriber.user_id
                        },
                        "time": new Date(SubEvent.created_at).getTime(),
                        "badge_platform": "",
                        "badge_user": "",
                        "badge_modtype": "",
                        "badge_substatus": "",
                        "platform": "Kick",
                        "user_link": "",
                        "user_color": ""
                    };

                    JsonTemplate.user_color = ""; // Identity isn't supported for now
                    JsonTemplate.user_link = `https://www.kick.com/${SubEvent.subscriber.channel_slug}`;

                    let msgHTML = [];
                    msgHTML.push(`<span style="color: ${NoticeColor};">is now a </span>`);
                    msgHTML.push(`<span style="color: #0066ff;">${SubEvent.duration}</span>`)
                    msgHTML.push(`<span style="color: ${NoticeColor};">-month subscriber!</span>`)
                    JsonTemplate.message = (msgHTML.length !== 0) ? msgHTML.join("") : "just subscribed!";
                    HandleMessage(JsonTemplate);
                }],
                ["channel.subscription.new", (SubEventPayload) => {
                    let SubEvent = SubEventPayload.data;
                    let NoticeColor = "#00ff30;"

                    let JsonTemplate = {
                        "type": "Message",
                        "id": window.crypto.randomUUID(),
                        "message": null,
                        "person": {
                            "username": SubEvent.subscriber.username,
                            "profilePicture": SubEvent.subscriber.profile_picture,
                            "id": SubEvent.subscriber.user_id
                        },
                        "time": new Date(SubEvent.created_at).getTime(),
                        "badge_platform": "",
                        "badge_user": "",
                        "badge_modtype": "",
                        "badge_substatus": "",
                        "platform": "Kick",
                        "user_link": "",
                        "user_color": ""
                    };

                    JsonTemplate.user_color = ""; // Identity isn't supported for now
                    JsonTemplate.user_link = `https://www.kick.com/${SubEvent.subscriber.channel_slug}`;

                    let msgHTML = [];
                    msgHTML.push(`<span style="color: ${NoticeColor};">is now a subscriber to your channel!</span>`);
                    JsonTemplate.message = (msgHTML.length !== 0) ? msgHTML.join("") : "just subscribed!";
                    HandleMessage(JsonTemplate);
                }],
                ["moderation.banned", (BanEvent) => {
                    const BanDetails = BanEvent.data;

                    // Purge Messages
                    let values = Array.from(document.querySelectorAll('.Username.Text'))
                        .filter(el => el.textContent === BanDetails.banned_user.username);
                    for (let val of values) {
                        const d = val.parentElement.querySelector('.ModActions > .Delete');
                        if (d) {
                            d.disabled = true;
                        }
                        const m = val.parentElement.querySelector('.Msg');
                        m.classList.add("Strike");
                        m.style.opacity = "50%";
                        if (ChatSettings.Apperance.HideDeletedMessages) {
                            val.parentElement.style.display = "none";
                        }
                    }

                    if (BanDetails.metadata.expires_at) {
                        const getAmount = function () {
                            const MS = (new Date(BanDetails.metadata.expires_at).getTime() - new Date(BanDetails.metadata.created_at).getTime());

                            const totalSeconds = Math.ceil(MS / 1000);
                            const days = Math.floor(totalSeconds / 86400);
                            const hours = Math.floor(totalSeconds / 3600);
                            const minutes = Math.floor((totalSeconds % 3600) / 60);
                            const seconds = totalSeconds % 60;

                            const IsExactDay = ((totalSeconds / 86400) === Math.floor(totalSeconds / 86400));

                            if ((days >= 1 && IsExactDay) || days > 3) {
                                return IsExactDay ? (days + (days === 1 ? " day" : " days")) : (days + "+ days");
                            }
                            if (totalSeconds < 60) {
                                return totalSeconds === 1 ? (totalSeconds + " second") : (totalSeconds + " seconds");
                            }
                            const formattedMinutes = String(minutes).padStart(2, '0');
                            const formattedSeconds = String(seconds).padStart(2, '0');
                            if (hours > 0) {
                                return hours + ":" + formattedMinutes + ":" + formattedSeconds;
                            }
                            return minutes + ":" + formattedSeconds;
                        };

                        if (ChatSettings.ModAppearance.LogModerationActions)
                            HandleMessage({
                                "type": "event",
                                "message": `${BanDetails.moderator.username} timed out ${BanDetails.banned_user.username} for ${getAmount()}${(BanDetails.metadata.reason || null) ? (": " + BanDetails.metadata.reason) : ""}`,
                                "undo": () => {
                                    return fetch('https://api.kick.com/public/v1/moderation/bans', {
                                        "method": "DELETE",
                                        "headers": {
                                            "Authorization": "Bearer " + KickAccessToken,
                                            "Accept": "application/json",
                                            "Content-Type": "application/json"
                                        },
                                        "body": JSON.stringify({
                                            "broadcaster_user_id": BanDetails.broadcaster.user_id,
                                            "user_id": BanDetails.banned_user.user_id
                                        })
                                    }).then(async res => {
                                        if (res.ok) return Promise.resolve(`KKUNTIMEOUT:${BanDetails.banned_user.user_id}`);
                                        else return Promise.reject(await res.json());
                                    }).catch(err => {
                                        if (err instanceof Object) {
                                            return Promise.reject(err.message ?? err);
                                        }
                                        else {
                                            return Promise.reject(err);
                                        }
                                    })
                                },
                                "match_if_needed": `KKTIMEOUT:${BanDetails.banned_user.user_id}`
                            });
                    }
                    else {
                        if (ChatSettings.ModAppearance.LogModerationActions)
                            HandleMessage({
                                "type": "event",
                                "message": `${BanDetails.moderator.username} banned ${BanDetails.banned_user.username}${(BanDetails.metadata.reason || null) ? (": " + BanDetails.metadata.reason) : ""}`,
                                "undo": () => {
                                    return fetch('https://api.kick.com/public/v1/moderation/bans', {
                                        "method": "DELETE",
                                        "headers": {
                                            "Authorization": "Bearer " + KickAccessToken,
                                            "Accept": "application/json",
                                            "Content-Type": "application/json"
                                        },
                                        "body": JSON.stringify({
                                            "broadcaster_user_id": BanDetails.broadcaster.user_id,
                                            "user_id": BanDetails.banned_user.user_id
                                        })
                                    }).then(async res => {
                                        if (res.ok) return Promise.resolve(`KKUNBAN:${BanDetails.banned_user.user_id}`);
                                        else return Promise.reject(await res.json());
                                    }).catch(err => {
                                        if (err instanceof Object) {
                                            return Promise.reject(err.message ?? err);
                                        }
                                        else {
                                            return Promise.reject(err);
                                        }
                                    })
                                },
                                "match_if_needed": `KKBAN:${BanDetails.banned_user.user_id}`
                            });
                    }
                }]
            ]);
        } catch (error) {
            console.error(error);
            HandleMessage({
                "type": "event",
                "message": "Unable to connect to Kick: " + error.message
            });
        }
    }).catch(err => {
        console.error(err);
        HandleMessage({
            "type": "event",
            "message": "Kick: " + err.message
        });
    })
}

handleSavedToken();

handleKickSupport();

let USER_FETCHED = {};

function FetchCachedUser(id) {
    return USER_FETCHED[id];
}

function FetchUserForPFP(id) {
    if (USER_FETCHED[id]) return Promise.resolve(USER_FETCHED[id]);
    return fetch(
        'https://api.twitch.tv/helix/users?id=' + id,
        {
            "method": "GET",
            "headers": {
                "Client-ID": client_id,
                "Authorization": "Bearer " + access_token,
                'Content-Type': 'application/json'
            }
        }
    )
        .then(resp => resp.json())
        .then(resp => {
            if (!resp.data || resp.data.length <= 0) {
                return Promise.reject('No user found');
            }
            USER_FETCHED[id] = resp.data[0]["profile_image_url"];
            return Promise.resolve(resp.data[0]["profile_image_url"]);
        });
}

function processToken(token) {
    access_token = token;

    validateEveryHour();

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
            if (resp.data && resp.data[0]) {
                USER_FETCHED[resp.data[0].id] = resp.data[0]["profile_image_url"];
                if (MyPFPURL.length <= 0) {
                    MyPFPURL = resp.data[0]["profile_image_url"];
                    MyName = resp.data[0].display_name;

                    const PlaceholderName = window.NamePlaceholder;
                    if (!PlaceholderName) {
                        alert("Bug detected - contact site owners: PlaceholderName is NULL");
                    }
                    else {
                        window.NamePlaceholder.innerText = MyName;
                    }
                    window.NamePlaceholder = undefined;
                }
            }
            socket_space = new initSocket(true);
            // and build schnanaigans
            socket_space.on('connected', (id) => {
                log(`Connected to WebSocket with ${id}`);
                session_id = id;
                user_id = resp.data[0].id;
                requestHooks(resp.data[0].id);
                FetchBadges();
                FetchUserBadges();
                FetchCheermotes();
            });

            socket_space.on("channel.chat.clear_user_messages", async (msg) => {
                let { metadata, payload } = msg;
                let { event } = payload;
                if (PastMessageIDs.includes(metadata.message_id)) {
                    return;
                }
                PastMessageIDs.push(metadata.message_id);

                let values = Array.from(document.querySelectorAll('.Username.Text'))
                    .filter(el => el.textContent === event.target_user_name);
                for (let val of values) {
                    const d = val.parentElement.querySelector('.ModActions > .Delete');
                    if (d) {
                        d.disabled = true;
                    }
                    const m = val.parentElement.querySelector('.Msg');
                    m.classList.add("Strike");
                    m.style.opacity = "50%";
                    if (ChatSettings.Apperance.HideDeletedMessages) {
                        val.parentElement.style.display = "none";
                    }
                }
            });

            socket_space.on('channel.chat.message', async (msg) => {
                let { metadata, payload } = msg;
                let { event } = payload;
                if (PastMessageIDs.includes(metadata.message_id)) {
                    return;
                }
                PastMessageIDs.push(metadata.message_id);
                // Event:
                //console.log(msg);
                if (ExcludeMessageIds[event.id]) {
                    ExcludeMessageIds[event.id] = undefined;
                    return;
                }

                if (event.source_broadcaster_user_id && event.source_broadcaster_user_id != user_id) return;

                let JsonTemplate = {
                    "type": "Message",
                    "id": event.message_id,
                    "message": null,
                    "person": {
                        "username": event.chatter_user_name,
                        "profilePicture": FetchCachedUser(event.chatter_user_id) ?? ("about:blank?pfpid=" + event.message_id),
                        "id": event.chatter_user_id
                    },
                    "time": new Date(metadata.message_timestamp).getTime(),
                    "badge_platform": "",
                    "badge_user": "",
                    "badge_modtype": "",
                    "badge_substatus": "",
                    "platform": "TTV",
                    "user_link": "",
                    "user_color": ""
                };

                JsonTemplate.user_color = event.color;
                JsonTemplate.user_link = `https://www.twitch.tv/popout/${event.broadcaster_user_login}/viewercard/${event.chatter_user_login}`;

                // Badges
                for (let UserBadge of event.badges) {
                    switch (UserBadge.set_id) {
                        case "predictions":
                            JsonTemplate.badge_platform = GetBadge(UserBadge.set_id + UserBadge.id);
                            break;
                        case "moderator":
                        case "admin":
                        case "broadcaster":
                        case "staff":
                        case "vip":
                        case "global_mod":
                            JsonTemplate.badge_modtype = GetBadge(UserBadge.set_id + UserBadge.id);
                            break;
                        case "subscriber":
                            JsonTemplate.badge_substatus = GetBadge(UserBadge.set_id + UserBadge.id);
                            break;
                        default:
                            JsonTemplate.badge_user = GetBadge(UserBadge.set_id + UserBadge.id);
                            break;
                    }
                }

                if (!FetchCachedUser(event.chatter_user_id)) {
                    FetchUserForPFP(event.chatter_user_id)
                        .then(res => {
                            let e = document.querySelector('img[src="' + ("about:blank?pfpid=" + event.message_id) + '"');
                            if (e) e.src = res;
                        });
                }

                let msgHTML = [];
                let htmlEscape = function (text) {
                    if (!text && text.length <= 0) return "";
                    return text.replaceAll("&", "&amp;")
                        .replaceAll("<", "&lt;")
                        .replaceAll(">", "&gt;")
                        .replaceAll('"', "&quot;")
                        .replaceAll("'", "&#39;");
                }

                for (let Fragment of event.message.fragments) {
                    if (Fragment.type === "emote") {
                        const IsAnimated = Fragment.emote.format.includes('animated');
                        msgHTML.push('<img loading="lazy" title="' + htmlEscape(Fragment.text) + '" src="'
                            + `https://static-cdn.jtvnw.net/emoticons/v2/${Fragment.emote.id}/${IsAnimated ? 'animated' : 'static'}/dark/1.0`
                            + '">');
                    }
                    else if (Fragment.type === "text") {
                        msgHTML.push('<span>' + htmlEscape(Fragment.text) + '</span>')
                    }
                    else if (Fragment.type === "mention") {
                        const MentioningBroadcaster = user_id === Fragment.mention.user_id;
                        msgHTML.push('<a class="' + (MentioningBroadcaster ? "MentionBG" : "") + '" href="' + `https://www.twitch.tv/popout/${event.broadcaster_user_login}/viewercard/${Fragment.mention.user_login}` + '" target="blank">' + htmlEscape(Fragment.text) + '</a>')
                    }
                    else if (Fragment.type === "cheermote") {
                        let CheermoteURL = "https://d3aqoihi2n8ty8.cloudfront.net/actions/cheer/dark/animated/1/1.gif";
                        let CheermoteColor = "#979797";
                        if (Cheermotes[Fragment.cheermote.prefix + Fragment.cheermote.tier]) {
                            const Cheermote = Cheermotes[Fragment.cheermote.prefix + Fragment.cheermote.tier];
                            CheermoteURL = Cheermote.images.dark.animated['1'];
                            CheermoteColor = Cheermote.color;
                        }
                        msgHTML.push('<img loading="lazy" title="' + htmlEscape(Fragment.text) + '" src="'
                            + `${CheermoteURL}`
                            + '">');
                        msgHTML.push('<span style="color: ' + CheermoteColor + ';">' + Fragment.cheermote.bits + '</span>');
                    }
                }
                if (event.channel_points_custom_reward_id) {
                    JsonTemplate.from_reward = true;
                    JsonTemplate.from_reward_id = event.channel_points_custom_reward_id;
                }
                JsonTemplate.message = (msgHTML.length !== 0) ? msgHTML.join("") : event.message.text;

                HandleMessage(JsonTemplate);
            });

            socket_space.on('channel.chat.notification', async (msg) => {
                let { metadata, payload } = msg;
                let { event } = payload;
                if (PastMessageIDs.includes(metadata.message_id)) {
                    return;
                }
                PastMessageIDs.push(metadata.message_id);
                // Event:
                //console.log(msg);

                if (event.chatter_is_anonymous) {
                    event.chatter_user_name = "Anonymous Chatter";
                    event.chatter_user_login = "AnAnonymousCheerer";
                    event.chatter_user_id = "407665396";
                }

                if (event.unraid) {
                    return;
                }

                let NoticeColor = "#00ff61";
                switch (event.notice_type) {
                    case "raid":
                        NoticeColor = "#00d7ff";
                        break;
                    case "announcement":
                        if (event.announcement.color !== "PRIMARY") NoticeColor = (event.announcement.color) ?? "#00ff61";
                        event.system_message = "📢))";
                        break;
                    case "bits_badge_tier":
                        NoticeColor = "white";
                        break;
                    case "community_sub_gift":
                        NoticeColor = "#f35aff";
                        break;
                }
                if (event.notice_type === "sub" || event.notice_type === "resub") {
                    if ((event.sub && event.sub.is_prime) || (event.resub && event.resub.is_prime)) {
                        NoticeColor = "#0066ff";
                    }
                }

                if (event.source_broadcaster_user_id && event.source_broadcaster_user_id != user_id) return;

                let JsonTemplate = {
                    "type": "Message",
                    "id": event.message_id,
                    "message": null,
                    "person": {
                        "username": event.chatter_user_name,
                        "profilePicture": FetchCachedUser(event.chatter_user_id) ?? ("about:blank?pfpid=" + event.message_id),
                        "id": event.chatter_user_id
                    },
                    "time": new Date(metadata.message_timestamp).getTime(),
                    "badge_platform": "",
                    "badge_user": "",
                    "badge_modtype": "",
                    "badge_substatus": "",
                    "platform": "TTV",
                    "user_link": "",
                    "user_color": ""
                };

                JsonTemplate.user_color = event.color;
                JsonTemplate.user_link = `https://www.twitch.tv/popout/${event.broadcaster_user_login}/viewercard/${event.chatter_user_login}`;

                // Badges
                for (let UserBadge of event.badges) {
                    switch (UserBadge.set_id) {
                        case "predictions":
                            JsonTemplate.badge_platform = GetBadge(UserBadge.set_id + UserBadge.id);
                            break;
                        case "moderator":
                        case "admin":
                        case "broadcaster":
                        case "staff":
                        case "vip":
                        case "global_mod":
                            JsonTemplate.badge_modtype = GetBadge(UserBadge.set_id + UserBadge.id);
                            break;
                        case "subscriber":
                            JsonTemplate.badge_substatus = GetBadge(UserBadge.set_id + UserBadge.id);
                            break;
                        default:
                            JsonTemplate.badge_user = GetBadge(UserBadge.set_id + UserBadge.id);
                            break;
                    }
                }

                if (!FetchCachedUser(event.chatter_user_id)) {
                    FetchUserForPFP(event.chatter_user_id)
                        .then(res => {
                            let e = document.querySelector('img[src="' + ("about:blank?pfpid=" + event.message_id) + '"');
                            if (e) e.src = res;
                        });
                }

                let msgHTML = [];
                let htmlEscape = function (text) {
                    if (!text && text.length <= 0) return "";
                    return text.replaceAll("&", "&amp;")
                        .replaceAll("<", "&lt;")
                        .replaceAll(">", "&gt;")
                        .replaceAll('"', "&quot;")
                        .replaceAll("'", "&#39;");
                }

                let FormattedSystemMessage = event.system_message;
                FormattedSystemMessage = FormattedSystemMessage.replace("from " + event.chatter_user_name + " ", "");
                FormattedSystemMessage = FormattedSystemMessage.replace(event.chatter_user_name + " ", "");
                msgHTML.push(`<span style="color: ${NoticeColor};">${FormattedSystemMessage}</span>`);

                if (event.message && event.message.text && event.message.text.length > 0) {
                    msgHTML.push("<span> </span>");
                }
                for (let Fragment of event.message.fragments) {
                    if (Fragment.type === "emote") {
                        const IsAnimated = Fragment.emote.format.includes('animated');
                        msgHTML.push('<img loading="lazy" title="' + htmlEscape(Fragment.text) + '" src="'
                            + `https://static-cdn.jtvnw.net/emoticons/v2/${Fragment.emote.id}/${IsAnimated ? 'animated' : 'static'}/dark/1.0`
                            + '">');
                    }
                    else if (Fragment.type === "text") {
                        msgHTML.push('<span>' + htmlEscape(Fragment.text) + '</span>')
                    }
                    else if (Fragment.type === "mention") {
                        const MentioningBroadcaster = user_id === Fragment.mention.user_id;
                        msgHTML.push('<a class="' + (MentioningBroadcaster ? "MentionBG" : "") + '" href="' + `https://www.twitch.tv/popout/${event.broadcaster_user_login}/viewercard/${Fragment.mention.user_login}` + '" target="blank">' + htmlEscape(Fragment.text) + '</a>')
                    }
                    else if (Fragment.type === "cheermote") {
                        let CheermoteURL = "https://d3aqoihi2n8ty8.cloudfront.net/actions/cheer/dark/animated/1/1.gif";
                        let CheermoteColor = "#979797";
                        if (Cheermotes[Fragment.cheermote.prefix + Fragment.cheermote.tier]) {
                            const Cheermote = Cheermotes[Fragment.cheermote.prefix + Fragment.cheermote.tier];
                            CheermoteURL = Cheermote.images.dark.animated['1'];
                            CheermoteColor = Cheermote.color;
                        }
                        msgHTML.push('<img loading="lazy" title="' + htmlEscape(Fragment.text) + '" src="'
                            + `${CheermoteURL}`
                            + '">');
                        msgHTML.push('<span style="color: ' + CheermoteColor + ';">' + Fragment.cheermote.bits + '</span>');
                    }
                }

                JsonTemplate.message = (msgHTML.length !== 0) ? msgHTML.join("") : event.message.text;

                HandleMessage(JsonTemplate);
            });

            socket_space.on('channel.moderate', (msg) => {
                let { metadata, payload } = msg;
                let { event } = payload;
                if (PastMessageIDs.includes(metadata.message_id)) {
                    return;
                }
                PastMessageIDs.push(metadata.message_id);
                // Event:
                switch (event.action) {
                    case "delete":
                        if (ChatSettings.ModAppearance.LogModerationActions)
                            HandleMessage({
                                "type": "event",
                                "message": `${event.moderator_user_name} deleted ${event.delete.user_name}'s message`,
                                "match_if_needed": "DELETE:" + event.delete.message_id
                            })

                        const val = document.querySelector('div[data-id="' + event.delete.message_id + '"]')
                        if (val) {
                            const d = val.querySelector('.ModActions > .Delete');
                            if (d) {
                                d.disabled = true;
                            }
                            const m = val.querySelector('.Msg');
                            m.classList.add("Strike");
                            m.style.opacity = "50%";
                            if (ChatSettings.Apperance.HideDeletedMessages) {
                                val.parentElement.style.display = "none";
                            }
                        }
                        break;
                    case "clear":
                        if (JustClearedChat) {
                            JustClearedChat = false;
                            break;
                        }
                        HandleMessage({
                            "type": "event",
                            "message": `${event.moderator_user_name} has cleared chat for VIPs and below (<a href="javascript:ClearMyChat();">Clear</a>)`
                        })
                        break;
                    case "raid":
                        let R = {
                            "type": "event",
                            "message": `${event.moderator_user_name} is about to raid ${event.raid.user_name} with ${event.raid.viewer_count} viewers`
                        };
                        if (event.moderator_user_id != user_id) {
                            R.undo = () => {
                                return fetch(`https://api.twitch.tv/helix/raids?broadcaster_id=${user_id}`, {
                                    "method": "DELETE",
                                    "headers": {
                                        "Client-ID": client_id,
                                        "Authorization": "Bearer " + access_token,
                                        'Content-Type': 'application/json'
                                    }
                                }).then(async res => {
                                    if (res.ok) return Promise.resolve(`${event.broadcaster_user_login}:UNRAID`);
                                    else return Promise.reject(await res.json());
                                }).catch(err => {
                                    if (err instanceof Object) {
                                        return Promise.reject(err.message ?? err);
                                    }
                                    else {
                                        return Promise.reject(err);
                                    }
                                })
                            };
                        }
                        HandleMessage(R)
                        break;
                    case "unraid":
                        HandleMessage({
                            "type": "event",
                            "message": `${event.moderator_user_name} canceled the raid of ${event.unraid.user_name}`,
                            "match_if_needed": `${event.moderator_user_login}:UNRAID`
                        });
                        break;
                    case "mod":
                        if (!ChatSettings.Apperance.ShowModVIPEvents) break;
                        HandleMessage({
                            "type": "event",
                            "message": `${event.moderator_user_name} added ${event.mod.user_name} as a moderator`,
                            "match_if_needed": `${event.moderator_user_login}:MOD:${event.mod.user_login}`
                        })
                        break;
                    case "vip":
                        if (!ChatSettings.Apperance.ShowModVIPEvents) break;
                        HandleMessage({
                            "type": "event",
                            "message": `${event.moderator_user_name} added ${event.vip.user_name} as a VIP`,
                            "match_if_needed": `${event.moderator_user_login}:VIP:${event.vip.user_login}`
                        })
                        break;
                    case "warn":
                        if (!ChatSettings.ModAppearance.LogModerationActions) break;
                        let msg = `${event.moderator_user_name} warned ${event.warn.user_name}`;
                        if ((event.warn.chat_rules_cited ?? []).length > 0) {
                            msg += " reminding " + event.warn.chat_rules_cited.join(', ');
                        }
                        if ((event.warn.reason ?? "").length > 0) {
                            msg += ": " + reason;
                        }
                        HandleMessage({
                            "type": "event",
                            "message": msg
                        })
                        break;
                    case "emoteonly":
                    case "followers":
                    case "uniquechat":
                    case "slow":
                    case "subscribers":
                        if (!ChatSettings.ModAppearance.LogModerationActions) break;
                        let EnableIdsToStr = {
                            "emoteonly": "Emote Only",
                            "followers": "Follower Only",
                            "uniquechat": "Unique Chat Only",
                            "slow": "Slow",
                            "subscribers": "Subscriber Only"
                        };
                        let EnableFullName = EnableIdsToStr[event.action];
                        if (event.followers && event.followers.follow_duration_minutes > 0) {
                            HandleMessage({
                                "type": "event",
                                "message": `${event.moderator_user_name} set a ${event.followers.follow_duration_minutes}-minute ${EnableFullName} Mode for the chat`
                            });
                        }
                        else if (event.slow) {
                            HandleMessage({
                                "type": "event",
                                "message": `${event.moderator_user_name} enabled ${EnableFullName} Mode, with a cooldown of ${event.slow.wait_time_seconds} seconds`
                            });
                        }
                        else {
                            HandleMessage({
                                "type": "event",
                                "message": `${event.moderator_user_name} turned on ${EnableFullName} Mode for the chat`
                            });
                        }
                        break;
                    case "emoteonlyoff":
                    case "followersoff":
                    case "uniquechatoff":
                    case "slowoff":
                    case "subscribersoff":
                        if (!ChatSettings.ModAppearance.LogModerationActions) break;
                        let DisableIdsToStr = {
                            "emoteonlyoff": "Emote Only",
                            "followersoff": "Follower Only",
                            "uniquechatoff": "Unique Chat Only",
                            "slowoff": "Slow",
                            "subscribersoff": "Subscriber Only"
                        };
                        let DisableFullName = DisableIdsToStr[event.action];
                        HandleMessage({
                            "type": "event",
                            "message": `${event.moderator_user_name} turned off ${DisableFullName} Mode for the chat`
                        });
                        break;
                    case "unmod":
                        if (!ChatSettings.Apperance.ShowModVIPEvents) break;
                        let H = {
                            "type": "event",
                            "message": `${event.moderator_user_name} removed ${event.unmod.user_name}'s mod`,
                            "match_if_needed": `${event.moderator_user_login}:UNMOD:${event.unmod.user_login}`
                        };
                        if (event.moderator_user_name !== event.unmod.user_name && !ChatSettings.Apperance.ShowModVIPEvents) {
                            break;
                        }
                        if (event.moderator_user_name === event.unmod.user_name) {
                            H.undo = () => {
                                return fetch(`https://api.twitch.tv/helix/moderation/moderators?broadcaster_id=${user_id}&user_id=${event.unmod.user_id}`, {
                                    "method": "POST",
                                    "headers": {
                                        "Client-ID": client_id,
                                        "Authorization": "Bearer " + access_token
                                    }
                                }).then(async res => {
                                    if (res.ok) return Promise.resolve(`${event.broadcaster_user_login}:MOD:${event.unmod.user_login}`);
                                    else return Promise.reject(await res.json());
                                }).catch(err => {
                                    if (err instanceof Object) {
                                        return Promise.reject(err.message ?? err);
                                    }
                                    else {
                                        return Promise.reject(err);
                                    }
                                })
                            };
                        }
                        HandleMessage(H);
                        break;
                    case "unvip":
                        if (!ChatSettings.Apperance.ShowModVIPEvents) break;
                        let J = {
                            "type": "event",
                            "message": `${event.moderator_user_name} removed ${event.unvip.user_name}'s VIP`,
                            "match_if_needed": `${event.moderator_user_login}:UNVIP:${event.unvip.user_login}`
                        };
                        if (event.moderator_user_name !== event.unvip.user_name && !ChatSettings.Apperance.ShowModVIPEvents) {
                            break;
                        }
                        if (event.moderator_user_name === event.unvip.user_name) {
                            J.undo = () => {
                                return fetch(`https://api.twitch.tv/helix/channels/vips?broadcaster_id=${user_id}&user_id=${event.unvip.user_id}`, {
                                    "method": "POST",
                                    "headers": {
                                        "Client-ID": client_id,
                                        "Authorization": "Bearer " + access_token
                                    }
                                }).then(async res => {
                                    if (res.ok) return Promise.resolve(`${event.broadcaster_user_login}:VIP:${event.unvip.user_login}`);
                                    else return Promise.reject(await res.json());
                                }).catch(err => {
                                    if (err instanceof Object) {
                                        return Promise.reject(err.message ?? err);
                                    }
                                    else {
                                        return Promise.reject(err);
                                    }
                                })
                            };
                        }
                        HandleMessage(J);
                        break;
                    case "ban":
                        if (!ChatSettings.ModAppearance.LogModerationActions) break;
                        HandleMessage({
                            "type": "event",
                            "message": `${event.moderator_user_name} banned ${event.ban.user_name}${(event.ban.reason || null) ? (": " + event.ban.reason) : ""}`,
                            "undo": () => {
                                return fetch(`https://api.twitch.tv/helix/moderation/bans?broadcaster_id=${user_id}&moderator_id=${user_id}&user_id=${event.ban.user_id}`, {
                                    "method": "DELETE",
                                    "headers": {
                                        "Client-ID": client_id,
                                        "Authorization": "Bearer " + access_token,
                                        'Content-Type': 'application/json'
                                    }
                                }).then(async res => {
                                    if (res.ok) return Promise.resolve(`${event.broadcaster_user_login}:UNBAN:${event.ban.user_login}`);
                                    else if (res.status === 409) return Promise.reject("Someone is already moderating this user.")
                                    else return Promise.reject(await res.json());
                                }).catch(err => {
                                    if (err instanceof Object) {
                                        return Promise.reject(err.message ?? err);
                                    }
                                    else {
                                        return Promise.reject(err);
                                    }
                                })
                            },
                            "match_if_needed": `BAN:${event.ban.user_login}`
                        });
                        break;
                    case "unban":
                        if (!ChatSettings.ModAppearance.LogModerationActions) break;
                        HandleMessage({
                            "type": "event",
                            "message": `${event.moderator_user_name} unbanned ${event.unban.user_name}`,
                            "match_if_needed": `${event.moderator_user_login}:UNBAN:${event.unban.user_login}`
                        })
                        break;

                    case "timeout":
                        if (!ChatSettings.ModAppearance.LogModerationActions) break;
                        const getAmount = function () {
                            const MS = (new Date(event.timeout.expires_at).getTime() - new Date(metadata.message_timestamp).getTime());

                            const totalSeconds = Math.ceil(MS / 1000)
                            const days = Math.floor(totalSeconds / 86400);
                            const hours = Math.floor(totalSeconds / 3600);
                            const minutes = Math.floor((totalSeconds % 3600) / 60);
                            const seconds = totalSeconds % 60;

                            const IsExactDay = ((totalSeconds / 86400) === Math.floor(totalSeconds / 86400));

                            if ((days >= 1 && IsExactDay) || days > 3) {
                                return IsExactDay ? (days + (days === 1 ? " day" : " days")) : (days + "+ days");
                            }
                            if (totalSeconds < 60) {
                                return totalSeconds === 1 ? (totalSeconds + " second") : (totalSeconds + " seconds");
                            }
                            const formattedMinutes = String(minutes).padStart(2, '0');
                            const formattedSeconds = String(seconds).padStart(2, '0');
                            if (hours > 0) {
                                return hours + ":" + formattedMinutes + ":" + formattedSeconds;
                            }
                            return minutes + ":" + formattedSeconds;
                        };
                        HandleMessage({
                            "type": "event",
                            "message": `${event.moderator_user_name} timed out ${event.timeout.user_name} for ${getAmount()}${(event.timeout.reason || null) ? (": " + event.timeout.reason) : ""}`,
                            "undo": () => {
                                return fetch(`https://api.twitch.tv/helix/moderation/bans?broadcaster_id=${user_id}&moderator_id=${user_id}&user_id=${event.timeout.user_id}`, {
                                    "method": "DELETE",
                                    "headers": {
                                        "Client-ID": client_id,
                                        "Authorization": "Bearer " + access_token,
                                        'Content-Type': 'application/json'
                                    }
                                }).then(async res => {
                                    if (res.ok) return Promise.resolve(`${event.broadcaster_user_login}:UNTIMEOUT:${event.timeout.user_login}`);
                                    else if (res.status === 409) return Promise.reject("Someone is already moderating this user.")
                                    else return Promise.reject(await res.json());
                                }).catch(err => {
                                    if (err instanceof Object) {
                                        return Promise.reject(err.message ?? err);
                                    }
                                    else {
                                        return Promise.reject(err);
                                    }
                                })
                            },
                            "match_if_needed": `TIMEOUT:${event.timeout.user_login}`
                        })
                        break;
                    case "untimeout":
                        if (!ChatSettings.ModAppearance.LogModerationActions) break;
                        HandleMessage({
                            "type": "event",
                            "message": `${event.moderator_user_name} untimed out ${event.untimeout.user_name}`,
                            "match_if_needed": `${event.moderator_user_login}:UNTIMEOUT:${event.untimeout.user_login}`
                        })
                        break;
                    default:
                        console.log(msg);
                        break;
                }
            });

            socket_space.on('channel.shoutout.create', (msg) => {
                let { metadata, payload } = msg;
                let { event } = payload;
                if (PastMessageIDs.includes(metadata.message_id)) {
                    return;
                }
                PastMessageIDs.push(metadata.message_id);
                // Event:
                HandleMessage({
                    "type": "event",
                    "message": `${event.moderator_user_name} shouted-out <a href="https://twitch.tv/${event.to_broadcaster_user_login}" target="_blank">${event.to_broadcaster_user_name}</a> for your ${event.viewer_count} ${(event.viewer_count === 1 ? "viewer" : "viewers")}`
                });
            });

            socket_space.on('channel.shoutout.receive', (msg) => {
                let { metadata, payload } = msg;
                let { event } = payload;
                if (PastMessageIDs.includes(metadata.message_id)) {
                    return;
                }
                PastMessageIDs.push(metadata.message_id);
                // Event:
                HandleMessage({
                    "type": "event",
                    "message": `You were shouted out by <a href="https://twitch.tv/${event.from_broadcaster_user_login}" target="_blank">${event.from_broadcaster_user_name}</a> with ${event.viewer_count} ${(event.viewer_count === 1 ? "viewer" : "viewers")}`
                });
            });

            socket_space.on('channel.channel_points_automatic_reward_redemption.add', (msg) => {
                let { metadata, payload } = msg;
                let { event } = payload;
                if (PastMessageIDs.includes(metadata.message_id)) {
                    return;
                }
                PastMessageIDs.push(metadata.message_id);
                const reward = event.reward;
                if (!ChatSettings.Apperance.ShowChannelPointRewards) return;

                // Event:
                let combined_html = [];
                let icon = "https://static-cdn.jtvnw.net/custom-reward-images/default-2.png";
                if (event.reward.type === "message_effect" || event.reward.type === "gigantify_an_emote" || event.reward.type === "celebration") {
                    icon = "https://d3aqoihi2n8ty8.cloudfront.net/actions/cheer/dark/static/1/1.png";
                }
                const abbreviate = (num) => {
                    if (num < 10000) {
                        return Intl.NumberFormat().format(num);
                    }
                    return Intl.NumberFormat(undefined, {
                        notation: "compact",
                        maximumFractionDigits: 1
                    }).format(num);
                };
                let cost = abbreviate(event.reward.channel_points);
                const TypesToMessages = {
                    "single_message_bypass_sub_mode": `<span>${event.user_name} used </span><img src="${icon}"> <span class="Price">${cost}</span> <span>to type:</span>`,
                    "send_highlighted_message": `<span>${event.user_name} redeemed </span><img src="${icon}"> <span class="Price">${cost}</span> <span>Highlight Message:</span>`,
                    "random_sub_emote_unlock": `<span>${event.user_name} redeemed </span><img src="${icon}"> <span class="Price">${cost}</span> <span>Random Sub Emote and won</span> <img src="https://static-cdn.jtvnw.net/emoticons/v2/{EMOTE_ID}/static/dark/1.0">`,
                    "chosen_sub_emote_unlock": `<span>${event.user_name} unlocked </span><img src="https://static-cdn.jtvnw.net/emoticons/v2/{EMOTE_ID}/static/dark/1.0"> <span class="Price">${cost}</span> <span>{EMOTE_NAME}</span>`,
                    "chosen_modified_sub_emote_unlock": `<span>${event.user_name} redeemed and made their own </span><img src="https://static-cdn.jtvnw.net/emoticons/v2/{EMOTE_ID}/static/dark/1.0"> <span class="Price">${cost}</span> <span>{EMOTE_NAME}</span>`,
                    "message_effect": `<span>${event.user_name} donated a cool message effect with </span><img src="${icon}"> <span class="Price">${cost}</span> <span>bits that can't be showed here.</span>`,
                    "gigantify_an_emote": `<span>${event.user_name} typed </span><img src="${icon}"> <span class="Price">${cost}</span><span>:</span>`
                }
                if (reward.emote) {
                    TypesToMessages[reward.type] = TypesToMessages[reward.type].replaceAll("{EMOTE_ID}", reward.emote.id);
                    TypesToMessages[reward.type] = TypesToMessages[reward.type].replaceAll("{EMOTE_NAME}", reward.emote.name);
                }
                combined_html.push(TypesToMessages[event.reward.type]);

                //#region MESSAGE
                let msgHTML = [];
                let htmlEscape = function (text) {
                    if (!text && text.length <= 0) return "";
                    return text.replaceAll("&", "&amp;")
                        .replaceAll("<", "&lt;")
                        .replaceAll(">", "&gt;")
                        .replaceAll('"', "&quot;")
                        .replaceAll("'", "&#39;");
                }

                if (event.message) {
                    for (let Fragment of event.message.fragments) {
                        if (Fragment.type === "emote") {
                            const IsAnimated = Fragment.emote.format.includes('animated');
                            msgHTML.push('<img loading="lazy" title="' + htmlEscape(Fragment.text) + '" src="'
                                + `https://static-cdn.jtvnw.net/emoticons/v2/${Fragment.emote.id}/${IsAnimated ? 'animated' : 'static'}/dark/1.0`
                                + '">');
                        }
                        else if (Fragment.type === "text") {
                            msgHTML.push('<span>' + htmlEscape(Fragment.text) + '</span>')
                        }
                    }
                }
                //#endregion

                HandleMessage({
                    "type": "reward_event",
                    "message": `${combined_html.join("")}`,
                    "amount": cost,
                    "icon": icon,
                    "id": event.reward.type,
                    "is_input": !!event.message,
                    "reward_type": event.reward.type,
                    "user_input_formatted": event.message ? msgHTML.join("") : undefined,
                    "from_user": event.user_name
                });
            });

            socket_space.on('channel.channel_points_custom_reward_redemption.add', (msg) => {
                let { metadata, payload } = msg;
                let { event } = payload;
                if (PastMessageIDs.includes(metadata.message_id)) {
                    return;
                }
                PastMessageIDs.push(metadata.message_id);

                if (!ChatSettings.Apperance.ShowChannelPointRewards) return;

                // Event:
                let reward = ListCache.Get("reward_" + event.reward.id);
                let combined_html = [];
                let icon = reward ? (reward.image ? reward.image.url_2x : reward.default_image.url_2x) : "https://static-cdn.jtvnw.net/custom-reward-images/default-2.png";
                const abbreviate = (num) => {
                    if (num < 10000) {
                        return Intl.NumberFormat().format(num);
                    }
                    return Intl.NumberFormat(undefined, {
                        notation: "compact",
                        maximumFractionDigits: 1
                    }).format(num);
                };
                let cost = abbreviate(event.reward.cost);
                combined_html.push(`<span>${event.user_name} has redeemed ${event.reward.title} </span>`);
                combined_html.push(`<img src="${icon}"> <span class="Price">${cost}</span>`);

                HandleMessage({
                    "type": "reward_event",
                    "message": `${combined_html.join("")}`,
                    "amount": cost,
                    "icon": icon,
                    "id": event.reward.id,
                    "is_input": event.user_input.length > 0
                });
            });
            LoadRewardsToCache(resp.data[0].id);

            socket_space.on('channel.channel_points_custom_reward_redemption.update', (msg) => {
                let { metadata, payload } = msg;
                let { event } = payload;
                if (PastMessageIDs.includes(metadata.message_id)) {
                    return;
                }
                PastMessageIDs.push(metadata.message_id);

                if (!ChatSettings.ModAppearance.LogRedemptionUpdates) return;

                const thisMin = new Date(new Date().setSeconds(0));
                const id = event.reward.id + Math.floor(thisMin.getTime() / 1000) + event.status;

                const getExisting = document.querySelector('div[data-id="' + id + '"]');
                const term = event.status === "fulfilled" ? "completed" : "refunded";
                if (getExisting) {
                    const singular = getExisting.querySelector('.Msg.Text').innerText.includes("'s redemption for");
                    const text = getExisting.querySelector('.Msg.Text').innerText;
                    if (singular) {
                        let newText = text;

                        newText = "2 redemptions for " + text.split(' for ')[1];
                        newText = newText.replace('was', 'were');

                        getExisting.querySelector('.Msg.Text').innerText = newText;
                        return;
                    }
                    const parseNumber = parseInt(text.split(' redemptions')[0]);
                    if (isNaN(parseNumber)) return
                    let newNumber = parseNumber + 1;

                    getExisting.querySelector('.Msg.Text').innerText = newNumber + " redemptions" + text.split(' redemptions')[1];
                    return;
                }
                HandleMessage({
                    "type": "redemption_update_event",
                    "id": id,
                    "color": event.status === "fulfilled" ? "#009010" : "#9f0000",
                    "message": `${event.user_name}'s redemption for "${event.reward.title}" was ${term}.`
                });
            });
        })
        .catch(err => {
            console.error(err);
            localStorage.removeItem("saved_access_token");
        });
}

function LoadRewardsToCache(user_id) {
    fetch('https://api.twitch.tv/helix/channel_points/custom_rewards?broadcaster_id=' + user_id,
        {
            "method": "GET",
            "headers": {
                "Client-ID": client_id,
                "Authorization": "Bearer " + access_token
            }
        }
    ).then(resp => resp.json())
        .then(resp => {
            if (!resp.data || resp.data.length <= 0) {
                return Promise.reject('No rewards');
            }
            for (let i = 0; i < resp.data.length; i++) {
                const reward = resp.data[i];
                ListCache.Push("reward_" + reward.title, reward);
            }
        });
}

function requestHooks(user_id) {
    let topics = {
        // 'automod.message.hold': { version: '2', condition: { broadcaster_user_id: user_id, moderator_user_id: user_id } },
        // 'automod.message.update': { version: '2', condition: { broadcaster_user_id: user_id, moderator_user_id: user_id } },
        // 'automod.terms.update': { version: '1', condition: { broadcaster_user_id: user_id, moderator_user_id: user_id } },

        'channel.ad_break.begin': { version: '1', condition: { broadcaster_user_id: user_id } },

        'channel.chat.clear_user_messages': { version: '1', condition: { broadcaster_user_id: user_id, user_id: user_id } },
        'channel.chat.message': { version: '1', condition: { broadcaster_user_id: user_id, user_id: user_id } },
        'channel.chat.notification': { version: '1', condition: { broadcaster_user_id: user_id, user_id: user_id } },

        'channel.raid': { version: '1', condition: { to_broadcaster_user_id: user_id } },
        'channel.moderate': { version: '2', condition: { broadcaster_user_id: user_id, moderator_user_id: user_id } },

        'channel.channel_points_automatic_reward_redemption.add': { version: '2', condition: { broadcaster_user_id: user_id } },
        'channel.channel_points_custom_reward_redemption.add': { version: '1', condition: { broadcaster_user_id: user_id } },
        'channel.channel_points_custom_reward_redemption.update': { version: '1', condition: { broadcaster_user_id: user_id } },

        // 'channel.suspicious_user.update': { version: '1', condition: { broadcaster_user_id: user_id, moderator_user_id: user_id } },
        // 'channel.suspicious_user.message': { version: '1', condition: { broadcaster_user_id: user_id, moderator_user_id: user_id } },

        'channel.shoutout.create': { version: '1', condition: { broadcaster_user_id: user_id, moderator_user_id: user_id } },
        'channel.shoutout.receive': { version: '1', condition: { broadcaster_user_id: user_id, moderator_user_id: user_id } }
    }

    console.log("[EventSub] Subscribing to " + Object.keys(topics).length + " events");

    let HasAlerted = false;

    for (let type in topics) {
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
                    if ((typeof resp.message === "string") && !HasAlerted && resp.message.includes("exceeds the number of subscriptions")) {
                        const EventHTML = document.createElement('div');
                        EventHTML.className = "Message UserEvent";
                        const Gap = document.createElement('div');
                        Gap.className = "gap";
                        const Span = document.createElement('span');
                        Span.className = "Msg Text";
                        Span.style.color = "#b51515";

                        Span.innerText = "[Chat] Twitch can't be connected because you have another device running Multistream Chat. Please close that instance, or reconnect your account.";
                        EventHTML.appendChild(Gap);
                        EventHTML.appendChild(Span);
                        document.getElementById('Messages').appendChild(EventHTML);
                        if (IsAtTheBottom) document.getElementById('Messages').scrollTo(0, document.getElementById('Messages').scrollHeight)
                        HasAlerted = true;
                    }
                    console.error(`[EventSub] Subscription error for ${type}: ${resp.message ? resp.message : ''}`);
                } else {
                    console.log(`[EventSub] Subscribed to ${type}`);
                    SubscribedList.push(type);

                    if (SubscribedList.length >= Object.entries(topics).length) {
                        const EventHTML = document.createElement('div');
                        EventHTML.className = "Message UserEvent";
                        const Gap = document.createElement('div');
                        Gap.className = "gap";
                        const Span = document.createElement('span');
                        Span.className = "Msg Text";
                        Span.style.color = "gray";

                        Span.innerText = "[Chat] Twitch is connected!";
                        EventHTML.appendChild(Gap);
                        EventHTML.appendChild(Span);
                        document.getElementById('Messages').appendChild(EventHTML);
                        if (IsAtTheBottom) document.getElementById('Messages').scrollTo(0, document.getElementById('Messages').scrollHeight)
                    }
                }
            })
            .catch(err => {
                console.error(`[EventSub] Subscription error for ${type}: ${err.message ? err.message : ''}`);
            });
        if (HasAlerted) break;
    }
}

function ClearMyChat() {
    var List = document.getElementById('Messages');
    while (List.firstChild) List.removeChild(List.firstChild);
}

function IfDashboardSend(Type, Payload = {}) {
    if (window.opener || window.parent) {
        (window.opener || window.parent).postMessage({
            'type': Type,
            "data": Payload
        });
    }
}

window.addEventListener('message', (ev) => {
    if (ev.data.type === "startReceiveYT") {
        SendYouTubeDataToTop = true;
    }
    if (ev.data.type === "stopReceiveYT") {
        SendYouTubeDataToTop = false;
    }
})