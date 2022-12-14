import HotKeyPanel from "./components/ShortcodePanel";

async function onload({extensionAPI}) {

  // set defaults if they dont' exist
  const panelConfig = {
    tabTitle: "Flag Block",
    settings: [
        {id:     "input-setting",
         name:   "Flag icon",
         action: {type:        "input",
                  placeholder: "⚑ ",
                  onChange:    (evt) => { console.log("Input Changed!", evt); }}},
        {id:     "select-setting",
         name:   "Select test",
         action: {type:     "select",
                  items:    ["one", "two", "three"],
                  onChange: (evt) => { console.log("Select Changed!", evt); }}},
        {
          id: "hot-keys",
          name: "Hot Keys",
          description:
            "Set a custom hot key to flag the block",
          action: {
            type: "reactComponent",
            component: HotKeyPanel(extensionAPI),
          },
        },
    ]
  };
  extensionAPI.settings.panel.create(panelConfig);

  console.log("load telegroam plugin");
}

function onunload() {
  console.log("unload telegroam plugin");
}
  
export default {
onload,
onunload
};
