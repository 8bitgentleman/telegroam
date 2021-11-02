import {
    InputTextNode,
  } from "roam-client";
  
  export type Panel = (props: {
    uid: string;
    parentUid: string;
  }) => React.ReactElement;

//   shortcodes.set(".t", extractTweet);
//   shortcodes.set('.d', "D&D");
//   shortcodes.set(".apt", "moving apartments");
//   // formatting shortcodes
//   shortcodes.set(".h1", textFormatting);
//   shortcodes.set(".a", textFormatting);
//   shortcodes.set(".cv", textFormatting);
  export const DEFAULT_SHORTCODE_VALUES: InputTextNode[] = [
    {
      uid: "_d&d-shortcode",
      text: ".d",
      children: [{ text: "D&D" }],
    },
    {
      uid: "_apt-shortcode",
      text: ".apt",
      children: [{ text: "Question" }, { text: "Q" }],
    },
  ];