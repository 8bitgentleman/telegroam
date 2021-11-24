import {
    InputTextNode,
    RoamBasicNode,

  } from "roam-client";
  import { getSettingValueFromTree, toFlexRegex } from "roamjs-components";
  let treeRef: { tree: RoamBasicNode[] } = { tree: [] };

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
      children: [{ text: "moving apartments" }],
    },
    {
      uid: "_tomorrow-shortcode",
      text: ".tomorrow",
      children: [
        { text: "tomorrow",
        children: [
          { text: "function" },] },],
    },
  ];
  export const getShortcodes = () =>
  (
    (
      treeRef.tree.find((t) => toFlexRegex("Inline Transformations").test(t.text))?.children ||
      []
    ).find((t) => toFlexRegex("Tag Shortcodes").test(t.text))?.children ||
    DEFAULT_SHORTCODE_VALUES
  ).map((n: InputTextNode) => ({
    shortcode: n.text,
    expandedText: n.children[0]?.text || "",
    shortcodeType: n.children[0]?.text || "text",
    type: n.uid,
  }));
