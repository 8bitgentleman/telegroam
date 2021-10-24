// taken and modified from Fabrice Gallet's Tweet Extactor
// released October 7th, 2021
import {
  toRoamDate } from "roam-client"; 

function extractTweet(message){

  const regex =/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/;
  var urlRegex = new RegExp(regex, 'ig');

  function linkify(text) {
    return text.match(urlRegex);
  } 

  function getTweetUrl(content) {
      let urlsTab = linkify(content);
    if (urlsTab != null) { 
        return urlsTab[urlsTab.length - 1];
    } else { return 0; }
  }
  function getDatefromTweet(htmlString){
    var htmlObject = document.createElement('div');
    htmlObject.innerHTML = htmlString;
    var links = htmlObject.querySelectorAll("a")
    var lastLink = links[links.length - 1]
    return last.text
  }

  function getInfofromTweet(htmlString){
    var htmlObject = document.createElement('div');
    htmlObject.innerHTML = htmlString;
    
    var paragraph = htmlObject.querySelector("p")
    var text = paragraph.innerText || paragraph.textContent;
    
    var links = htmlObject.querySelectorAll("a")
    var lastLink = links[links.length - 1]
    
    return [text, lastLink.text]
  }

  function getTextFromTweet(htmlString) {
      let stripedHtml = htmlString.replace(/<br[^>]*>/gi, "\n");
      stripedHtml = stripedHtml.replace(/<[^>]+>/g, '');
      stripedHtml = stripedHtml.replace(/&quot;/g,'"');
      stripedHtml = stripedHtml.replace(/&#39;/g,'\'');
      stripedHtml = stripedHtml.replace(/&mdash;/g,'—');
      let splitS = stripedHtml.split("—");
      stripedHtml = splitS[0];
      for(let i=1; i<splitS.length-1; i++) {
        stripedHtml = "—" + splitS[i];
      }
      return stripedHtml;
  }

  // var message = '.t https://twitter.com/parametricarch/status/1452269684091412480'
  var urlTweet = getTweetUrl(message)
  
  console.log(urlTweet)
  
  let r = await $.ajax({
    url: "https://publish.twitter.com/oembed?omit_script=1&url=" + urlTweet,
    //url: "https://publish.twitter.com/oembed?omit_script=1&limit=20&url="
    dataType: "jsonp",
    success: function(data){
      tweetData = getInfofromTweet(data.html)
      console.log(tweetData)
      tweetText = tweetData[0];
      tweetDate = tweetData[1];
      roamDate = toRoamDate(Date.parse(tweetDate))
      console.log("roam date", roamDate)
      return("[[>]] " + tweetText + "\n" + roamDate)

  }
  });
}

export default extractTweet;