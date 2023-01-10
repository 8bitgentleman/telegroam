
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

const Singleton = ({ extensionAPI }) => {
    const [existingPtnKeyFromSettings, existingSettings] = React.useMemo(() => {
        return [extensionAPI.settings.get("ptnKey"), extensionAPI.settings.getAll()];
    }, [extensionAPI.settings]);

    const [ptnKey, setPtnKeyDebounced, setPtnKey] = useDebounce(undefined, 500);
    const [existingPtnKey, setExistingPtnKey] = React.useState<string>();
    const [liveSettings, setLiveSettings] = React.useState({
        ...DEFAULT_SETTINGS,
        ...existingSettings,
      });
    
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
};

async function onload({extensionAPI}) {
    // set default setting
    if (!extensionAPI.settings.get('update-id')) {
        await extensionAPI.settings.set('update-id', "01");
    }

    console.log("unload telegroam plugin");

}

function onunload() {
    console.log("unload telegroam plugin");
}
  
export default {
    onload,
    onunload
};