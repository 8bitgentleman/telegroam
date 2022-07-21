/* Original code by matt vogel */
  /* v1  */
function reactButton(extensionAPI) {
    // Declare a new state variable, which we'll call "count"

    const [count, setCount] = React.useState(0);
    // const luid = 01;

    return (
        React.createElement(
            "button",
            {className: "bp3-button",
             onClick: () => setCount(count + 1)},
            "my button " + count
        )
    );
}
const panelConfig = {
  tabTitle: "Telegroam",
  settings: [
      {id:     "api-key",
        name:   "API Key",
        description: "Your custom Telegram Bot API key. Refresh page after update.",
        action: {type:        "input",
                placeholder: "",
                onChange:    (evt) => { 
                  // console.log("Tweet Extract Template Changed!", evt.target.value); 
                  // template = evt.target.value;
                }}},
      {id:     "inbox-name",
      name:   "Inbox Name",
      description:  "The tag your telegram imports will be nested under. Refresh page after update.",
      action: {type:        "input",
                placeholder: "#inbox",
                onChange:    (evt) => { 
                  // console.log("Tweet Extract Template Changed!", evt.target.value); 
                  // template = evt.target.value;
                }}},
      {id:          "inbox-location",
        name:        "Inbox Location",
        description: "NOT WORKING: Options for the location of the inbox tag on the daily notes page",
        action:      {type:     "select",
                      items:    ["FIRST", "LAST"],
                      onChange: (evt) => { console.log("Select Changed!", evt); }}},
      {id:     "proxy",
        name:   "Trusted Media Proxy",
        description: "The proxy server your messages will be routed through. Only change this if you know what you are doing",
        action: {type:        "input",
                placeholder: "https://telegram-cors-proxy.herokuapp.com",
                onChange:    (evt) => { 
                  // console.log("Tweet Extract Template Changed!", evt.target.value); 
                  // template = evt.target.value;
                }}},
      {id:     "reactComponent-setting",
        name:   "reactComponent test",
        action: {type:     "reactComponent",
                component: reactButton}}
  ]
};
  
  // move onload to async function
  async function onload({extensionAPI}) {
    console.log("load telegroam plugin")
    // set default setting
    // if (!extensionAPI.settings.get('tweet-template')) {
      await extensionAPI.settings.set('update-id', "01");
      console.log(extensionAPI.settings.get('update-id'));
    // }
  
    extensionAPI.settings.panel.create(panelConfig);
    
    
  }
  
  function onunload() {
    console.log("unload telegroam plugin")
  
  }
  
  export default {
    onload,
    onunload
  };