// import { useState, useEffect } from 'react';
// import { ExtensionAPI } from "../extension";


export default function InternalSettingsPanel({ extensionAPI }) {
  // const { settings } = extensionAPI;
  console.log(extensionAPI)
  const updateID = extensionAPI.settings.get('update-id');

  return (
    React.createElement('input', {
      type: 'text',
      className: "bp3-button",
      placeholder: 'Name (required)',
      disabled: true,
      value: updateID,
    })
  );
}