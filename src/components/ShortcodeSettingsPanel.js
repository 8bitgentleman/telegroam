// import { useState, useEffect } from 'react';
// import { ExtensionAPI } from "../extension";
import {
  Button,
  H6,
  InputGroup,
  Intent,
  Label,
} from "@blueprintjs/core";
import React, { useState } from "react";

export default function ShortcodeSettingsPanel({ extensionAPI }) {
  // const { settings } = extensionAPI;
  console.log(extensionAPI)
  const updateID = extensionAPI.settings.get('update-id');

  return (
    <>
      <Button
        text={"Add Tag"}
        intent={Intent.PRIMARY}
        rightIcon={"plus"}
        minimal
        style={{ marginBottom: 8 }}
      />
      
    </>
  );
}