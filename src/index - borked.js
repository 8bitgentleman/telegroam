import {
  toConfig,
  runExtension, 
  getTreeByPageName, 
  createBlock,
  getBlockUidByTextOnPage,
  getPageTitleByPageUid, 
  getFirstChildUidByBlockUid,
  getPageUidByPageTitle
   } from "roam-client";
import { 
  createConfigObserver,
  getSettingValueFromTree,
  toFlexRegex} from "roamjs-components";
import firebase from "firebase/app";
import InternalSettingsPanel from "./InternalSettingsPanel";
import ShortcodeSettingsPanel from "./ShortcodeSettingsPanel";

import { FocusStyleManager } from "@blueprintjs/core";
// import the telegroam js here too?
// import startTelegroam from './telegroam';


const ID = "telegroam";
const CONFIG = toConfig(ID);
runExtension(ID, () => {
  //attributes to create
  // API Key, Latest Update ID, Inbox Name, Trusted Media Proxy
  // settings
  // nest by time sent or just nest under the inbox tag
  // change bot page name? BOT_PAGE_NAME
  createConfigObserver({
    title: CONFIG,
    config: {
      tabs: [
        {
          id: "Telegram Setup",
          fields: [
            {
              type: "text",
              title: "API Key",
              description:
                "Your custom Telegram Bot API key",
              // defaultValue: "xx",
            },
            {
              type: "text",
              title: "Inbox Name",
              description:
                "The tag your telegram imports will be nested under",
              defaultValue: "Inbox",
            },
            {
              type: "text",
              title: "Trusted Media Proxy",
              description:
                "The proxy server your messages will be routed through. Only change this if you know what you are doing",
              defaultValue: "https://telegram-cors-proxy.herokuapp.com",
            },

          ],
        },
        {
          id: "Script Settings",
          fields: [
            {
              title: "Timestamp nesting",
              type: "flag",
              defaultValue: true,
              description:
                "If checked, blocks will be nested under a block denoting the time they were sent",
            },
            {
              title: "Sender nesting",
              type: "flag",
              defaultValue: false,
              description:
                "If checked, blocks will nested under the telegram name of the sender",
            },
          ],
        },
        {
          id: "Media Tags",
          toggleable: true,
          fields: [
            {
              title: "Location Tag",
              type: "text",
              defaultValue: "#Location",
              description:
                "The tag each photo will be nested under",
            },
            {
              title: "Voice Tag",
              type: "text",
              defaultValue: "#Voice",
              description:
                "The tag each photo will be nested under",
            },
            {
              title: "Video Tag",
              type: "text",
              defaultValue: "#Video",
              description:
                "The tag each photo will be nested under",
            },
            {
              title: "Photo Tag",
              type: "text",
              defaultValue: "#Photo",
              description:
                "The tag each photo will be nested under",
            },
            {
              title: "Contact Tag",
              type: "text",
              defaultValue: "#Contact",
              description:
                "The tag each photo will be nested under",
            },
          ],

        },
        {
          id: "Inline Tagging",
          toggleable: true,
          fields: [
            {
              title: "Tag nesting",
              type: "flag",
              defaultValue: false,
              description:
                "If checked and if an inline tag is identified, the message will be nested under said tag",
            },
            {
              type: "custom",
              title: "Tag Custom",
              description:
                "Shortcodes and their associated expanded tags",
              options: {
                component: ShortcodeSettingsPanel,
              },
            },
            {
              type: "multitext",
              title: "Tag Shortcodes",
              description:
                "Shortcodes and their associated expanded tags",
            },
            {
              type: "pages",
              title: "Tag pages",
              description:
                "Shortcodes and their associated expanded tags",
            },
          ],

        },
        {
          id: "Internal Settings",
          fields: [
            {
              type: "custom",
              title: "Latest Update ID",
              description:
                "For internal use only",
              defaultValue: 0,
              options: {
                component: InternalSettingsPanel,
              },
            },
            {
              type: "custom",
              title: "Busy Since",
              description:
                "For internal use only",
              options: {
                component: InternalSettingsPanel,
              },
            },
            {
              title: "Debug mode",
              type: "flag",
              defaultValue: true,
              description:
                "If checked, will print useful things to the console",
            },
          ],
        },
      ],
    },
  });
  // const tree = getTreeByPageName(CONFIG);
  // console.log("TREE",tree)
  // let telegramApiKey = getSettingValueFromTree({
  //   tree: tree,
  //   key: "API Key",
  // });

  const timestampNesting = tree.some((t) =>
    toFlexRegex("Timestamp nesting").test(t.text)
  );
  // // I'm doing this manually for testing but ideally these are loaded from the shorcodesPanel
  // var shortcodes = new Map();
  // shortcodes.set(".t", "test");
  // shortcodes.set('.d', "D&D");
  // shortcodes.set(".apt", "moving apartments");
  
  function isActionable(text) {
    if (text.charAt(0) === '.') {
      return true
    } else {
      return false
    }
  }

  function massage(text) {
    // dont' love this approach seems like it needs to be smarter
    // see if there is a thread
    text = text.replace(/\bTODO\b/ig, "{{[[TODO]]}}")
    // see if there is an actionable tag
    if (isActionable(text)) {
      var actionableTag = text.split(" ")[0]
      //check if a shortcode is defined
      if (shortcodes.has(actionableTag)) {
        //replace the shortcode with the actual tag
        //should decide if we indent or not too
        var regex = new RegExp("^" + actionableTag, "g");
        text = text.replace(regex, `#[[${shortcodes.get(actionableTag)}]]`);
      }
      console.log(actionableTag, text)
    }
    return text
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

  function unlinkify(s) {
    if (s.match(/^\[.*?\]\((.*?)\)$/)) {
      return RegExp.$1
    } else {
      return s
    }
  }

  async function updateFromTelegram() {
    const debugMode = tree.some((t) =>
      toFlexRegex("Debug mode").test(t.text)
    );
    let corsProxyUrl = stripTrailingSlash(
            unlinkify(
              getSettingValueFromTree({
          tree: tree,
          key: "Trusted Media Proxy",
        })));
    let inboxName = getSettingValueFromTree({
      tree: tree,
      key: "Inbox Name",
    });

    let api = `https://api.telegram.org/bot${telegramApiKey}`

    let updateId = null
    let updateIdBlock
    try{
      // try to get the latest update id
       updateIdBlock = getSettingValueFromTree({
        tree: tree,
        key: "Latest Update ID",
      });
    } catch(error){
      // if the latest update id doesn't exist yet first create its parent block with an empty child then try the update again
      console.error(error)
      createNestedBlock(getPageUidByPageTitle(`roam/js/${ID}`), {
        string: "Latest Update ID",
        children: [{
          string: ""
        }]
      })
      updateIdBlock = getSettingValueFromTree({
        tree: tree,
        key: "Latest Update ID",
      });
      
    }

    if (updateIdBlock.match(/^\d+$/)) {
      updateId = +updateIdBlock + 1
    }

    async function GET(path) {

      let response = await fetch(`${api}/${path}`)
      if (response.ok) {
        return await response.json()
      } else {
        throw new Error(`telegroam fetch: ${response.status}`)
      }
    }

    let updateResponse = await GET(`getUpdates?offset=${updateId}&timeout=60`)
    let dailyNoteUid = uidForToday()
    let dailyPageTitle = getPageTitleByPageUid(dailyNoteUid);
    let inboxUid
    inboxUid = getBlockUidByTextOnPage({
      text: inboxName,
      title: dailyPageTitle
    });
    let inboxUids = roamAlphaAPI.q(`[
      :find (?uid ...)
      :where
        [?today :block/uid "${dailyNoteUid}"]
        [?today :block/children ?block]
        [?block :block/string "${inboxName}"]
        [?block :block/uid ?uid]
    ]`)

    if (debugMode === true){
      console.log("debugMode is a GO", dailyNoteUid, dailyPageTitle, inboxUid)
      console.log("update FromTelegram", inboxUids)
    }

    let maxOrder = findMaxOrder(inboxUid)

    if (updateResponse.result.length) {
      if (inboxUids.length) {
        inboxUid = inboxUids[0]
      } else {
        // inboxUid = roamAlphaAPI.util.generateUID()
        createBlock({
          node: {
            text: inboxName
          },
          parentUid: dailyNoteUid,
          order: 0
        })
      }
      let i = 1
      for (let result of updateResponse.result) {
        await handleTelegramUpdate(result, i)
          ++i
      }

      // Save the latest Telegram message ID in the Roam graph.
      let lastUpdate = updateResponse.result[updateResponse.result.length - 1]

      let updateIdParent = getBlockUidByTextOnPage({
        text: 'Latest Update ID',
        title: `roam/js/${ID}`});

        let updateIdBlockChild = getFirstChildUidByBlockUid(updateIdParent)

      // updateId = lastUpdate.update_id
      roamAlphaAPI.updateBlock({
        block: {
          uid: updateIdBlockChild,
          string: lastUpdate.update_id.toString()
        }
      })
    }
    // updateIdBlock = getSettingValueFromTree({
    //     tree: tree,
    //     key: "Latest Update ID",
    //   });

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

    function createNestedBlock(parent, {
      uid,
      order,
      string,
      children = []
    }) {
      if (uid === undefined) {
        uid = roamAlphaAPI.util.generateUID()
      }

      if (order === undefined) {
        order = findMaxOrder(parent) + 1
      }

      roamAlphaAPI.createBlock({
        location: {
          "parent-uid": parent,
          order
        },
        block: {
          uid,
          string
        }
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
      let {
        message,
        edited_message,
        poll
      } = result
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
            children: poll.options.map(({
              option,
              i
            }) => ({
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

      function mapStuff({
        latitude,
        longitude
      }) {
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
        let {
          embed,
          osm,
          gmaps
        } = mapStuff(location)

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
        // deal with sender nesting here
        let senderNesting = tree.some((t) =>
          toFlexRegex("Sender Nesting").test(t.text)
        );
        if (senderNesting === true) {
          let name = message.from ? message.from.first_name : null
        }
        // deal with Timestamp nesting here
        if (timestampNesting === true) {
          let hhmm = formatTime(message.date)
        }
        let text = massage(message.text || "")

        let uid = `telegram-${message.chat.id}-${message.message_id}`

        if (debugMode === true){
          console.log("handle message", message)
        }

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
        // nest under timestamp
        if (timestampNesting === true) {
          createNestedBlock(
            parent,
            uid,
            maxOrder + i,
            `${hhmm}`,
            [{
              string: `${text}`,
            }]
          )
        } else {
          createNestedBlock(parent, {
          uid,
          order: 'last',
          string: `${text}`,
        })
      }

        async function insertFile(fileid, generate) {
          let photo = await GET(
            `getFile?chat_id=${message.chat.id}&file_id=${fileid}`)
          let path = photo.result.file_path
          let url = `https://api.telegram.org/file/bot${telegramApiKey}/${path}`

          let mediauid = createNestedBlock(uid, {
            string: generate(url)
          })

          let tmpuid = createNestedBlock(mediauid, {
            string: `Uploading in progress:: ${message.chat.id} ${fileid}`
          })

          if (debugMode === true){
            console.log("fetching", url, "from proxy")
          }

          let blobResponse = await fetch(
            `${corsProxyUrl}/${url}`
          )

          let blob = await blobResponse.blob()

          let ref = firebase.storage().ref().child(
            `imgs/app/${graphName()}/${mediauid}`
          )
          if (debugMode === true) {
            console.log("uploading", url, "to Roam Firebase")
          }
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
            let {
              first_name,
              last_name,
              phone_number
            } = message.contact

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
                  children: !single ? [] : vcard[k].map(({
                    value
                  }, j) => ({
                    order: j,
                    string: (
                      value instanceof Array ?
                      value.filter(x => x.trim()).join("\n") :
                      value.trim()
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

        let {
          embed,
          osm,
          gmaps
        } = mapStuff(edited_message.location)

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

  async function runWithMutualExclusionLock({
    waitSeconds,
    action
  }) {
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
        await fetch(acquirePath, {
          method: "POST"
        })

      if (result.status === lockStatus.ok) {
        currentLockPath = lockPath

        try {
          return await action()
        } finally {
          // console.log("telegroam: releasing lock")
          currentLockPath = null
          try {
            await fetch(releasePath, {
              method: "POST"
            })
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

});
