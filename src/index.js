/*
 * Copyright(c) 2021 Matt Vogel - adapted from Mikael Brockman & Mark Robertson 
 *
 * See the LICENSE file (MIT).
 */
import {
  toConfig,
  runExtension, 
  getTreeByPageName, 
  createBlock,
  getBlockUidByTextOnPage,
  getPageTitleByPageUid, 
  getFirstChildUidByBlockUid,
  getBasicTreeByParentUid,
  getPageUidByPageTitle
   } from "roam-client";
import { 
  createConfigObserver,
  getSettingValueFromTree,
  toFlexRegex,
  getSubTree} from "roamjs-components";
import firebase from "firebase/app";
import InternalSettingsPanel from "./InternalSettingsPanel";
import ShortcodeSettingsPanel from "./ShortcodeSettingsPanel";

import { FocusStyleManager } from "@blueprintjs/core";
// import the telegroam js here too?
// import startTelegroam from './telegroam';
import extractTweet from './_extractTweet';


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
                "Your custom Telegram Bot API key. Refresh page after update.",
              // defaultValue: "xx",
            },
            {
              type: "text",
              title: "Inbox Name",
              description:
                "The tag your telegram imports will be nested under. Refresh page after update.",
              defaultValue: "#inbox",
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
              description:"For internal use only",
              defaultValue: "",
              options: {
                component: InternalSettingsPanel,
              },
            },
            {
              type: "custom",
              title: "Busy Since",
              defaultValue: "",
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
  const tree = getTreeByPageName(CONFIG);
  const telegramSetup = getBasicTreeByParentUid(
    getSubTree({tree, key: "Telegram Setup"}).uid);
  const internalSettings = getBasicTreeByParentUid(
    getSubTree({tree, key: "Internal Settings"}).uid);

  // I'm doing this manually for testing but ideally these are set and loaded from the shorcodesPanel
  // shortcodes expand into full tags or page names similar to how Readwise does it 
  var shortcodes = new Map();
  shortcodes.set(".t", extractTweet);
  shortcodes.set('.d', "D&D");
  shortcodes.set(".apt", "moving apartments");
  // formatting shortcodes
  shortcodes.set(".h1", textFormatting);
  shortcodes.set(".a", textFormatting);
  shortcodes.set(".cv", textFormatting);

   function isActionable(text) {
     if (text.charAt(0) === '.') {
       return true
     } else {
       return false
     }
   }

   function textFormatting(text, shortcode=None) {
     let heading = 0
     let childrenViewType = 'bullet'
     let textAlign = 'left'
    if (shortcode === '.h1'){
      heading = 1
    }
    if (shortcode === '.h2') {
      heading = 2
    }
    if (shortcode === '.h3') {
      heading = 3
    }
    if (shortcode === '.ac') {
      textAlign = 'center'
    }
    if (shortcode === '.al') {
      textAlign = 'left'
    }
    if (shortcode === '.aj') {
      textAlign = 'justify'
    }
    if (shortcode === '.cvn') {
      childrenViewType = 'numbered'
    }
    if (shortcode === '.cvd') {
      childrenViewType = 'document'
    }
    return [heading, childrenViewType, textAlign]
   }

  async function massage(text) {
    // dont' love this approach seems like it needs to be smarter
    // see if there is a thread
    text = text.replace(/\bTODO\b/ig, "{{[[TODO]]}}")
    // see if there is an actionable tag
    if (isActionable(text)) {
      var actionableTag = text.split(" ")[0]
      //check if a shortcode is defined
      if (shortcodes.has(actionableTag)) {
        // TODO stackable shortcodes .t.d.apt
        if (typeof shortcodes.get(actionableTag) === 'string') {
          //replace the shortcode with the actual tag
          //should decide if we indent or not too
          // TODO figure out how to indent
          var regex = new RegExp("^" + actionableTag, "g");
          text = text.replace(regex, `#[[${shortcodes.get(actionableTag)}]]`);
        } else if (typeof shortcodes.get(actionableTag) === 'function') {
          // this replaces the whole message with the tweet, may be problematic later
          if (shortcodes.get(actionableTag).name === 'extractTweet'){
            console.log(shortcodes.get(actionableTag).name)
            text = await shortcodes.get(actionableTag)(text)
          } else if (shortcodes.get(actionableTag).name === 'textFormatting') {
            // TODO rethink this - not the best place for formatting the block
            console.log(textFormatting(text, actionableTag))
          }
        }
      }
    }
    return  text
    }

  function findBotAttribute(name) {
    // TODO fix this
    const BOT_PAGE_NAME = `roam/js${ID}`

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

  let telegramApiKey = getSettingValueFromTree({
    tree: telegramSetup,
    key: "API Key",
  });

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
          getSettingValueFromTree({
            tree: telegramSetup,
            key: "Trusted Media Proxy",
          })
        ))

    let inboxName = getSettingValueFromTree({
      tree: telegramSetup,
      key: "Inbox Name",
    });
    //  console.log(tinboxName, inboxName)
    let api = `https://api.telegram.org/bot${telegramApiKey}`

    let updateId = null
    let updateIdBlock = findBotAttribute("Latest Update ID")

    if (updateIdBlock.value.match(/^\d+$/)) {
      updateId = +updateIdBlock.value + 1
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
          location: {
            "parent-uid": dailyNoteUid,
            order: 0
          },
          block: {
            uid: inboxUid,
            string: inboxName
          }
        })
      }
      let i = 1
      for (let result of updateResponse.result) {
        await handleTelegramUpdate(result, i)
          ++i
      }
      // TODO fix this
      // Save the latest Telegram message ID in the Roam graph.
      let lastUpdate = updateResponse.result[updateResponse.result.length - 1]
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

    function createNestedBlock(parent, {
      uid,
      order,
      string,
      textFormatting,
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
        let name = message.from ? message.from.first_name : null
        let hhmm = formatTime(message.date)
        let text = await massage(message.text || "")

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
        // TODO text formatting
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

          let mediauid = createNestedBlock(uid, {
            string: generate(url)
          })

          let tmpuid = createNestedBlock(mediauid, {
            string: `Uploading in progress:: ${message.chat.id} ${fileid}`
          })

          // console.log("fetching", url, "from proxy")
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

  // The following VCard parser is copied from
  //
  //   https://github.com/Heymdall/vcard
  //
  // MIT License
  //
  // Copyright (c) 2018 Aleksandr Kitov
  //
  // Permission is hereby granted, free of charge, to any person
  // obtaining a copy of this software and associated documentation
  // files (the "Software"), to deal in the Software without
  // restriction, including without limitation the rights to use, copy,
  // modify, merge, publish, distribute, sublicense, and/or sell copies
  // of the Software, and to permit persons to whom the Software is
  // furnished to do so, subject to the following conditions:
  //
  // The above copyright notice and this permission notice shall be included
  // in all copies or substantial portions of the Software.
  //
  // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  // IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  // FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  // AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  // LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  // OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  // SOFTWARE.
  //
  function parseVcard(string) {
    var PREFIX = 'BEGIN:VCARD',
      POSTFIX = 'END:VCARD';

    /**
     * Return json representation of vCard
     * @param {string} string raw vCard
     * @returns {*}
     */
    function parse(string) {
      var result = {},
        lines = string.split(/\r\n|\r|\n/),
        count = lines.length,
        pieces,
        key,
        value,
        meta,
        namespace;

      for (var i = 0; i < count; i++) {
        if (lines[i] === '') {
          continue;
        }
        if (lines[i].toUpperCase() === PREFIX || lines[i].toUpperCase() === POSTFIX) {
          continue;
        }
        var data = lines[i];

        /**
         * Check that next line continues current
         * @param {number} i
         * @returns {boolean}
         */
        var isValueContinued = function (i) {
          return i + 1 < count && (lines[i + 1][0] === ' ' || lines[i + 1][0] === '\t');
        };
        // handle multiline properties (i.e. photo).
        // next line should start with space or tab character
        if (isValueContinued(i)) {
          while (isValueContinued(i)) {
            data += lines[i + 1].trim();
            i++;
          }
        }

        pieces = data.split(':');
        key = pieces.shift();
        value = pieces.join(':');
        namespace = false;
        meta = {};

        // meta fields in property
        if (key.match(/;/)) {
          key = key
            .replace(/\\;/g, 'ΩΩΩ')
            .replace(/\\,/, ',');
          var metaArr = key.split(';').map(function (item) {
            return item.replace(/ΩΩΩ/g, ';');
          });
          key = metaArr.shift();
          metaArr.forEach(function (item) {
            var arr = item.split('=');
            arr[0] = arr[0].toLowerCase();
            if (arr[0].length === 0) {
              return;
            }
            if (meta[arr[0]]) {
              meta[arr[0]].push(arr[1]);
            } else {
              meta[arr[0]] = [arr[1]];
            }
          });
        }

        // values with \n
        value = value
          .replace(/\\n/g, '\n');

        value = tryToSplit(value);

        // Grouped properties
        if (key.match(/\./)) {
          var arr = key.split('.');
          key = arr[1];
          namespace = arr[0];
        }

        var newValue = {
          value: value
        };
        if (Object.keys(meta).length) {
          newValue.meta = meta;
        }
        if (namespace) {
          newValue.namespace = namespace;
        }

        if (key.indexOf('X-') !== 0) {
          key = key.toLowerCase();
        }

        if (typeof result[key] === 'undefined') {
          result[key] = [newValue];
        } else {
          result[key].push(newValue);
        }

      }

      return result;
    }

    var HAS_SEMICOLON_SEPARATOR = /[^\\];|^;/,
      HAS_COMMA_SEPARATOR = /[^\\],|^,/;
    /**
     * Split value by "," or ";" and remove escape sequences for this separators
     * @param {string} value
     * @returns {string|string[]
     */
    function tryToSplit(value) {
      if (value.match(HAS_SEMICOLON_SEPARATOR)) {
        value = value.replace(/\\,/g, ',');
        return splitValue(value, ';');
      } else if (value.match(HAS_COMMA_SEPARATOR)) {
        value = value.replace(/\\;/g, ';');
        return splitValue(value, ',');
      } else {
        return value
          .replace(/\\,/g, ',')
          .replace(/\\;/g, ';');
      }
    }
    /**
     * Split vcard field value by separator
     * @param {string|string[]} value
     * @param {string} separator
     * @returns {string|string[]}
     */
    function splitValue(value, separator) {
      var separatorRegexp = new RegExp(separator);
      var escapedSeparatorRegexp = new RegExp('\\\\' + separator, 'g');
      // easiest way, replace it with really rare character sequence
      value = value.replace(escapedSeparatorRegexp, 'ΩΩΩ');
      if (value.match(separatorRegexp)) {
        value = value.split(separator);

        value = value.map(function (item) {
          return item.replace(/ΩΩΩ/g, separator);
        });
      } else {
        value = value.replace(/ΩΩΩ/g, separator);
      }
      return value;
    }

    return parse(string)
  }

});
