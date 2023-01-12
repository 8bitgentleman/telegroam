
/*
* Copyright (c) 2021 Mikael Brockman & Matt Vogel (typescript port & modifications)
Major thanks to phonetonote for large sections of code
*
* See the LICENSE file (MIT).
*/

import React from "react";
import ReactDOM from "react-dom";
import getCurrentUserUid from "roamjs-components/queries/getCurrentUserUid";
import { render as renderOnboardingAlert } from "./components/onboarding-alert";
import { useDebounce } from "@react-hook/debounce";
import { Intent, Spinner, SpinnerSize } from "@blueprintjs/core";

const PARENT_BLOCK_KEY = "parentBlockTitle";
const DEFAULT_SETTINGS = {
    ["proxy"]: "https://telegroam-cors-proxy.herokuapp.com",
    [PARENT_BLOCK_KEY]: "inbox",
    ["proxy"]: "https://telegroam-cors-proxy.herokuapp.com",
  };
const BRING_YOUR_OWN_PTN_KEY = "BRING_YOUR_OWN_PTN_KEY";
const ROOT_ID = "ptn-roam-depot-root";

const Singleton = ({ extensionAPI }) => {
    const [existingPtnKeyFromSettings, existingSettings] = React.useMemo(() => {
        return [extensionAPI.settings.get("ptnKey"), extensionAPI.settings.getAll()];
    }, [extensionAPI.settings]);

    const [ptnKey, setPtnKeyDebounced, setPtnKey] = useDebounce(undefined, 500);
    const [existingPtnKey, setExistingPtnKey] = React.useState();
    const [liveSettings, setLiveSettings] = React.useState({
        ...DEFAULT_SETTINGS,
        ...existingSettings,
      });
    
    // set up the API key
    React.useEffect(() => {
        // check if the api key exists
      if (existingPtnKeyFromSettings) {
          setExistingPtnKey(existingPtnKeyFromSettings);
      } else {
          // if no api key exists
          // go through the onboarding process here
          renderOnboardingAlert({
              onConfirm: () => {
                createUserAndSetPtnKey(getCurrentUserEmail(), getCurrentUserUid()).then(() => {
                  renderToast({
                    id: "NEW_PTN_KEY_CREATED",
                    content:
                      "🙌 new ptn key created, thanks for joining phonetonote. click the ptn dash link in the left sidebar to get started",
                    intent: Intent.SUCCESS,
                  });
                });
              },
              onCancel: () => {
                renderToast({
                  id: BRING_YOUR_OWN_PTN_KEY,
                  content: "👍 please add your ptn key in roam's phonetonote extension settings",
                  intent: Intent.SUCCESS,
                });
                setExistingPtnKey(BRING_YOUR_OWN_PTN_KEY);
              },
            });
          }
      }, [existingPtnKeyFromSettings]);
    

    // settings panel
    React.useEffect(() => {
      if (!extensionAPI || !existingPtnKey || !setPtnKey || !setPtnKeyDebounced) {
        // do nothing if there is no api key
        return;
      } else {
        if (existingPtnKey !== BRING_YOUR_OWN_PTN_KEY) {
          // if there is an existing api key use that
          extensionAPI.settings.set("ptnKey", existingPtnKey);
        }
        // create the settings panel
        extensionAPI.settings.panel.create({
          tabTitle: "telegroam",
          settings: [
            {
              name: "ptn key",
              description: "your ptn key, used to tie your phonetonote account to roam",
              id: "ptnKey",
              action: {
                type: "input",
                onChange: (event) => {
                  setPtnKeyDebounced(event.currentTarget.value);
                },
              },
            },
            {
              ...SETTINGS_CONFIG[PARENT_BLOCK_KEY],
              action: {
                type: "input",
                onChange: (event) => {
                  const newObj = {
                    [PARENT_BLOCK_KEY]: event?.currentTarget?.value,
                  };
                  setLiveSettings((liveSettings) => ({
                    ...liveSettings,
                    ...newObj,
                  }));
                },
              },
            }
          ],
        });
        setPtnKey(existingPtnKey);
      }
    }, [extensionAPI, existingPtnKey, setPtnKey, setPtnKeyDebounced]);

    // fetch new notes
    function fetchNotes(
      ptnKey,
      roamId,
      settings) {
      console.log("fetching notes here")
    }
    React.useEffect(() => {
      if (ptnKey && liveSettings) {
        const fetchFreshNotes = (e) => {
          // e is undefined when being fired from setInterval
          // otherwise it is a pointer event with an HTML target,
          // we fetch notes when the target is the the DAILY NOTES button
          if (!e || (e?.target)?.innerText?.toUpperCase() === "DAILY NOTES") {
            fetchNotes(ptnKey, getCurrentUserUid(), liveSettings);
          }
        };
  
        document.addEventListener("click", fetchFreshNotes);
        const intervalId = window.setInterval(fetchFreshNotes, 1000 * 90);
  
        return () => {
          document.removeEventListener("click", fetchFreshNotes);
          window.clearInterval(intervalId);
        };
      }
    }, [liveSettings, ptnKey]);
};

async function onload({extensionAPI}) {
    // set default setting
    if (!extensionAPI.settings.get('update-id')) {
        await extensionAPI.settings.set('update-id', "01");
    }
    const ptnRoot = document.createElement("div");
    ptnRoot.id = `${ROOT_ID}`;
    ReactDOM.render(<Singleton extensionAPI={extensionAPI} />, ptnRoot);
    
    console.log("unload telegroam plugin");

}

function onunload() {
    console.log("unload telegroam plugin");
}
  
export default {
    onload,
    onunload
};