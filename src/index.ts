import {
  toConfig,
  runExtension, 
  getTreeByPageName, 
  createBlock,
  getBlockUidByTextOnPage,
  getPageTitleByPageUid, } from "roam-client";
import { 
  createConfigObserver,
  getSettingValueFromTree,
  toFlexRegex, } from "roamjs-components";
import firebase from "firebase/app";
import InternalSettingsPanel from "./InternalSettingsPanel";
import ShortcodeSettingsPanel from "./ShortcodeSettingsPanel";

import { FocusStyleManager } from "@blueprintjs/core";
// import the telegroam js here too?

const ID = "telegroam";
const CONFIG = toConfig(ID);
runExtension(ID, () => {
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
              defaultValue: false,
              description:
                "If checked, will print useful things to the console",
            },
          ],
        },
      ],
    },
  });
});
