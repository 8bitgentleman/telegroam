/*
 * Copyright(c) 2021 Matt Vogel
 * See the LICENSE file (MIT).
 */

import {
    toRoamDate } from "roam-client"; 

function tomorrow(){
    var someDate = new Date();
    var numberOfDaysToAdd = 6;
    someDate.setDate(someDate.getDate() + numberOfDaysToAdd); 
    let roamDate = toRoamDate(someDate)
    return roamDate
}

export default tomorrow;