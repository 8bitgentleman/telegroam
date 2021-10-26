import {
    InputGroup,
} from "@blueprintjs/core";
import React, { useState } from "react";
import {
    getFirstChildTextByBlockUid,
} from "roam-client";

const InternalSettingsPanel = ({uid,}: {
    uid?: string;
    parentUid: string;
}) => {
    const [token] = useState(
        uid ? getFirstChildTextByBlockUid(uid) : ""
    );
    return (
        <>
            <InputGroup
                disabled
                value={token}
                onChange={() => { }}
            />
        </>
    );
};

export default InternalSettingsPanel;