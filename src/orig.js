
/*
* Copyright (c) 2021 Mikael Brockman & Matt Vogel (typescript port & modifications)
*
* See the LICENSE file (MIT).
*/

function massage(text) {
    text = text.replace(/\bTODO\b/ig, "{{[[TODO]]}}")
    return text
}

function findBotAttribute(name) {
    const BOT_PAGE_NAME = "Telegram Bot"

    let x = roamAlphaAPI.q(`[
    :find (pull ?block [:block/uid :block/string])
    :where
        [?page :node/title "${BOT_PAGE_NAME}"]
        [?block :block/page ?page]
        [?block :block/refs ?ref]
        [?ref :node/title "${name}"]
        [?block :block/string ?string]
    ]`)

    if (!x.length) {
    throw new Error(`attribute ${name} missing from [[${BOT_PAGE_NAME}]]`)
    }

    return {
    uid: x[0][0].uid,
    value: x[0][0].string.split("::")[1].trim(),
    }
}

function uidForToday() {
    let today = new Date
    let yyyy = today.getFullYear()
    let mm = (today.getMonth() + 1).toString().padStart(2, '0')
    let dd = today.getDate().toString().padStart(2, '0')
    return `${mm}-${dd}-${yyyy}`
}

function formatTime(unixSeconds) {
    let date = new Date(1000 * unixSeconds)
    let hhmm = date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    })

    return hhmm
}

function stripTrailingSlash(url) {
    if (url.endsWith('/')) {
    return url.slice(0, -1)
    } else {
    return url
    }
}

let telegramApiKey = findBotAttribute("API Key").value

function unlinkify(s) {
    if (s.match(/^\[.*?\]\((.*?)\)$/)) {
    return RegExp.$1
    } else {
    return s
    }
}

async function updateFromTelegram() {
    let corsProxyUrl =
    stripTrailingSlash(
        unlinkify(
        findBotAttribute("Trusted Media Proxy").value))
    let inboxName = findBotAttribute("Inbox Name").value
    let api = `https://api.telegram.org/bot${telegramApiKey}`

    let updateId = null
    let updateIdBlock = findBotAttribute("Latest Update ID")
    //   console.log(updateId, updateIdBlock)
//   console.log("before matching")
    if (updateIdBlock.value.match(/^\d+$/)) {
    // console.log("update block matches numerical value")
    // console.log(updateId, updateIdBlock)
    updateId = +updateIdBlock.value + 1
    // console.log(updateId, updateIdBlock)
    }
    // console.log("after matching")

    async function GET(path) {
    // console.log("API", api)
    // console.log("Path", path)
    let response = await fetch(`${api}/${path}`)
    if (response.ok) {
        return await response.json()
    } else {
        throw new Error(`telegroam fetch: ${response.status}`)
    }
    }

    let updateResponse = await GET(`getUpdates?offset=${updateId}&timeout=60`)
    let dailyNoteUid = uidForToday()

    let inboxUid
    let inboxUids = roamAlphaAPI.q(`[
    :find (?uid ...)
    :where
        [?today :block/uid "${dailyNoteUid}"]
        [?today :block/children ?block]
        [?block :block/string "${inboxName}"]
        [?block :block/uid ?uid]
    ]`)



    let maxOrder = findMaxOrder(inboxUid)

    if (updateResponse.result.length) {
    if (inboxUids.length) {
        inboxUid = inboxUids[0]
    } else {
        inboxUid = roamAlphaAPI.util.generateUID()
        roamAlphaAPI.createBlock({
        location: { "parent-uid": dailyNoteUid, order: 0 },
        block: { uid: inboxUid, string: inboxName }
        })
    }
    let i = 1
    for (let result of updateResponse.result) {
        await handleTelegramUpdate(result, i)
        ++i
    }

    // Save the latest Telegram message ID in the Roam graph.
    let lastUpdate = updateResponse.result[updateResponse.result.length - 1]
    console.log("updating latest id because a response was read")
    console.log(lastUpdate)
    roamAlphaAPI.updateBlock({
        block: {
        uid: updateIdBlock.uid,
        string: `Latest Update ID:: ${lastUpdate.update_id}`
        }
    })
    }

    function findMaxOrder(parent) {
    let orders = roamAlphaAPI.q(`[
        :find (?order ...)
        :where
        [?today :block/uid "${parent}"]
        [?today :block/children ?block]
        [?block :block/order ?order]
    ]`)

    let maxOrder = Math.max(-1, ...orders)
    return maxOrder
    }

    function createNestedBlock(parent, { uid, order, string, children = [] }) {
    if (uid === undefined) {
        uid = roamAlphaAPI.util.generateUID()
    }

    if (order === undefined) {
        order = findMaxOrder(parent) + 1
    }

    roamAlphaAPI.createBlock({
        location: { "parent-uid": parent, order },
        block: { uid, string }
    })

    for (let child of children) {
        createNestedBlock(uid, child)
    }

    return uid
    }

    function blockExists(uid) {
    return roamAlphaAPI.q(`[
        :find (?block ...)
        :where [?block :block/uid "${uid}"]
    ]`).length > 0
    }

    async function handleTelegramUpdate(result, i) {
    let { message, edited_message, poll } = result
    console.log(result)
    if (poll) {
        handlePollCreation()
    }

    if (edited_message && edited_message.location) {
        handleLiveLocationUpdate()
    }

    if (message) {
        handleMessage(message)
    }

    i++
    return i

    function handlePollCreation() {
        createNestedBlock(inboxUid, {
        order: maxOrder + i,
        string: `((telegrampoll-${poll - id}))`,
        children: [{
            string: "{{[[table]]}}",
            children: poll.options.map(({ option, i }) => ({
            string: `((telegrampoll-${poll.id}-${i}))`,
            children: [{
                string: `${option.voter_count}`
            }]
            }))
        }]
        })
    }

    function urlWithParams(url, params) {
        let qs = Object.entries(params).map(([k, v]) => `${k}=${v}`).join("&")
        return `${url}?${qs}`
    }

    function mapStuff({ latitude, longitude }) {
        let d = 0.004
        let bb = [longitude - d, latitude - d, longitude + d, latitude + d]
        let bbox = bb.join("%2C")
        let marker = [latitude, longitude].join("%2C")

        let osm = urlWithParams("https://www.openstreetmap.org/", {
        mlat: latitude,
        mlon: longitude
        })

        let gmaps = urlWithParams("https://www.google.com/maps/search/", {
        api: "1",
        query: `${latitude},${longitude}`
        })

        let url = urlWithParams(
        "https://www.openstreetmap.org/export/embed.html", {
            layer: "mapnik",
            bbox,
            marker
        })

        return {
        embed: `:hiccup[:iframe {
            :width "100%" :height "400"
            :src "${url}"
        }]`,
        osm: `[View on OpenStreetMap](${osm})`,
        gmaps: `[View on Google Maps](${gmaps})`,
        }
    }

    function makeLocationBlock(uid, location) {
        let mapuid = `${uid}-map`
        let { embed, osm, gmaps } = mapStuff(location)

        createNestedBlock(uid, {
        uid: mapuid,
        string: embed,
        children: [{
            uid: `${mapuid}-link-osm`,
            string: osm
        }, {
            uid: `${mapuid}-link-gmaps`,
            string: gmaps
        }]
        })
    }

    async function handleMessage() {
        let name = message.from ? message.from.first_name : null
        let hhmm = formatTime(message.date)
        let text = massage(message.text || "")

        let uid = `telegram-${message.chat.id}-${message.message_id}`

        // console.log(message)

        let parent = inboxUid

        if (message.reply_to_message) {
        parent = [
            "telegram",
            message.reply_to_message.chat.id,
            message.reply_to_message.message_id,
        ].join("-")

        if (!blockExists(parent)) {
            // the message replied to is included in the reply
            // so we should use that
            // but for now we just make a placeholder
            createNestedBlock(inboxUid, {
            uid: parent,
            string: "[[Telegroam: placeholder for missing message]]"
            })
        }
        }
    //   remove timestamping
    //   createNestedBlock(parent, {
    //     uid,
    //     order: maxOrder + i,
    //     string: `${hhmm}`,
    //     children: [{
    //       string: `${text}`,
    //     }]
    //   })
        createNestedBlock(parent, {
        uid,
        order: 'last',
        string: `${text}`,
        })

        async function insertFile(fileid, generate) {
        let photo = await GET(
            `getFile?chat_id=${message.chat.id}&file_id=${fileid}`)
        let path = photo.result.file_path
        let url = `https://api.telegram.org/file/bot${telegramApiKey}/${path}`
        //console.log(url, generate(url));

        let mediauid = createNestedBlock(uid, {
            string: generate(url)
        })

        let tmpuid = createNestedBlock(mediauid, {
            string: `Uploading in progress:: ${message.chat.id} ${fileid}`
        })

        //console.log("fetching", url, "from proxy")
        let blobResponse = await fetch(
            `${corsProxyUrl}/${url}`
        )

        let blob = await blobResponse.blob()

        let ref = firebase.storage().ref().child(
            `imgs/app/${graphName()}/${mediauid}`
        )

        //console.log("uploading", url, "to Roam Firebase")
        let result = await ref.put(blob)
        let firebaseUrl = await ref.getDownloadURL()

        roamAlphaAPI.updateBlock({
            block: {
            uid: mediauid,
            string: generate(firebaseUrl)
            }
        })

        roamAlphaAPI.deleteBlock({
            block: {
            uid: tmpuid
            }
        })
        }

        let photo = url => `![photo](${url})`
        let audio = url => `{{[[audio]]:${url}}}`
        let video = url => `:hiccup[:video {:height "520", :controls true :src "${url}"}]`

        if (message.sticker) {
        if (message.sticker.is_animated)
            await insertFile(message.sticker.thumb.file_id, photo)
        else
            await insertFile(message.sticker.file_id, photo)
        }

        if (message.photo) {
        let fileid = message.photo[message.photo.length - 1].file_id
        await insertFile(fileid, photo)
        }

        if (message.voice) {
        await insertFile(message.voice.file_id, audio)
        }

        if (message.video) {
            await insertFile(message.video.file_id, video)
        }

        if (message.video_note) {
        await insertFile(message.video_note.file_id, video)
        }

        if (message.animation) {
            await insertFile(message.animation.file_id, video)
        }

        if (message.document) {
        await insertFile(message.document.file_id, url => `File:: [${message.document.file_name}](${url})`)
        }

        if (message.location) {
        makeLocationBlock(uid, message.location)
        }

        if (message.poll) {
        createNestedBlock(uid, {
            uid: `telegrampoll-${message.poll.id}`,
            order: 0,
            children: message.poll.options.map((option, i) => ({
            uid: `telegrampoll-${message.poll.id}-${i}`,
            order: i,
            string: option.text
            }))
        })
        }

        if (message.contact) {
        if (!message.contact.vcard) {
            let { first_name, last_name, phone_number } = message.contact

            let name = first_name
            if (last_name)
            name += ` ${last_name}`

            createNestedBlock(uid, [{
            string: `[[${name}]]`,
            children: [{
                string: `Phone Number:: ${phone_number}`
            }]
            }])
        }

        if (message.contact.vcard) {
            let vcard = parseVcard(message.contact.vcard)
            delete vcard.begin
            delete vcard.prodid
            delete vcard.version
            delete vcard.end

            if (vcard.fn)
            delete vcard.n

            let translations = {
            n: "Name",
            fn: "Full Name",
            email: "Email",
            tel: "Phone Number",
            adr: "Street Address",
            bday: "Birthday",
            impp: "Social Media",
            }

            // console.log(vcard)

            createNestedBlock(uid, {
            order: 0,
            string: `[[${vcard.fn[0].value.trim()}]]`,
            children: Object.keys(vcard).map((k, i) => {
                let string = (translations[k] || k) + "::"

                let single = (
                vcard[k].length == 1 && typeof vcard[k][0].value == "string"
                )

                if (single) {
                string += " " + vcard[k][0].value.trim()
                }

                return {
                order: i,
                string,
                children: !single ? [] : vcard[k].map(({ value }, j) => ({
                    order: j,
                    string: (
                    value instanceof Array
                        ? value.filter(x => x.trim()).join("\n")
                        : value.trim()
                    )
                }))
                }
            })
            })
        }
        }
    }

    function handleLiveLocationUpdate() {
        let message = edited_message
        let uid = `telegram-${message.chat.id}-${message.message_id}`
        let mapuid = `${uid}-map`

        let { embed, osm, gmaps } = mapStuff(edited_message.location)

        roamAlphaAPI.updateBlock({
        block: {
            uid: mapuid,
            string: embed,
        }
        })

        roamAlphaAPI.updateBlock({
        block: {
            uid: `${mapuid}-link-osm`,
            string: osm
        }
        })

        roamAlphaAPI.updateBlock({
        block: {
            uid: `${mapuid}-link-gmaps`,
            string: gmaps
        }
        })
    }
    }
}

function sleep(s) {
    return new Promise(ok => setTimeout(ok, 1000 * s))
}

function hex(buffer) {
    return [...new Uint8Array(buffer)].map(
    x => x.toString(16).padStart(2, '0')
    ).join("")
}

async function hashString(string) {
    let hash =
    await crypto.subtle.digest("SHA-256",
        new TextEncoder("utf-8").encode(string))

    return hex(hash).substr(0, 16)
}

const lockStatus = {
    ok: 200,
    busy: 423,
}

let currentLockPath

async function runWithMutualExclusionLock({ waitSeconds, action }) {
    let lockId =
    await hashString([graphName(), telegramApiKey].join(":"))

    let nonce =
    roamAlphaAPI.util.generateUID()

    let lockPath =
    `https://binary-semaphore.herokuapp.com/lock/${lockId}/${nonce}`

    let acquirePath = `${lockPath}/acquire`
    let releasePath = `${lockPath}/release`

    for (;;) {
    let result =
        await fetch(acquirePath, { method: "POST" })

    if (result.status === lockStatus.ok) {
        currentLockPath = lockPath

        try {
        return await action()
        } finally {
        // console.log("telegroam: releasing lock")
        currentLockPath = null
        try {
            await fetch(releasePath, { method: "POST" })
        } catch (e) {
            console.error(e)
            throw e
        }
        }

    } else if (result.status === lockStatus.busy) {
        // console.log(`telegroam: lock busy; waiting ${waitSeconds}s`)
        await sleep(waitSeconds)
    }
    }
}

async function updateFromTelegramContinuously() {
    for (;;) {
    try {
        let result = await runWithMutualExclusionLock({
        waitSeconds: 30,
        action: async () => {
            // console.log("telegroam: lock acquired; fetching messages")
            return await updateFromTelegram()
        }
        })

    } catch (e) {
        console.error(e)
        // console.log("telegroam: ignoring error; retrying in 30s")
        if (currentLockPath) {
        // console.log("telegroam: releasing lock via beacon")
        navigator.sendBeacon(currentLockPath + "/release")
        }
        await sleep(30)
    }
    }
}

function graphName() {
    return document.location.hash.split("/")[2]
}

async function startTelegroam() {
    // We need to use the Firebase SDK, which Roam already uses, but
    // Roam uses it via Clojure or whatever, so we import the SDK
    // JavaScript ourselves from their CDN...

    if (document.querySelector("#firebase-script")) {
    okay()
    } else {
    let script = document.createElement("SCRIPT")
    script.id = "firebase-script"
    script.src = "https://www.gstatic.com/firebasejs/8.4.1/firebase.js"
    script.onload = okay
    document.body.appendChild(script)
    }

    async function okay() {
    if (firebase.apps.length == 0) {

        // This is Roam's Firebase configuration stuff.
        // I hope they don't change it.
        let firebaseConfig = {
        apiKey: "AIzaSyDEtDZa7Sikv7_-dFoh9N5EuEmGJqhyK9g",
        authDomain: "app.roamresearch.com",
        databaseURL: "https://firescript-577a2.firebaseio.com",
        storageBucket: "firescript-577a2.appspot.com",
        }

        firebase.initializeApp(firebaseConfig)
    }

    updateFromTelegramContinuously()
    }
}

startTelegroam()


