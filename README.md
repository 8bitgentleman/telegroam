<h3 align="center">telegroam - roamjs fork</h3>

<div align="center">

  [![Status](https://img.shields.io/badge/status-active-success.svg)]()
  [![GitHub Issues](https://img.shields.io/github/issues/8bitgentleman/telegroam.svg)](https://github.com/8bitgentleman/telegroam/issues)
  [![GitHub Pull Requests](https://img.shields.io/github/issues-pr/8bitgentleman/telegroam.svg)](https://github.com/8bitgentleman/telegroam/pulls)

</div>

---

<p align="center"> Send messages and photos to your own Telegram bot and have them appear in the Daily Notes page of your Roam Research graph. You don't need to run any software or servers other than this JavaScript plugin for your Roam graph.
</p>

## 📝 Table of Contents
- [New Features](#features)
- [Getting Started](#getting_started)
- [TODOs and Roadmap](#roadmap)
- [Style Guide](#style)

## 🚀 New Features <a name = "features"></a>
- **Feat:** Now customize nearly everything with [@david Vargas's roamjs settings panel](https://github.com/dvargas92495/roamjs-components)
- **Fix:** Only adds a single inbox tag when needed instead of automatically every day
- **Fix:** Makes  contriversial design options optional (media tags)
- **Fix:** Correctly upload videos
- **Feat:** Adds in the concept of actionable inline tag shortcodes (ala [Readwise](https://blog.readwise.io/tag-your-highlights-while-you-read/))
- **Feat:** automatic tweet extraction, inspired by [Fabrice Gallet's Tweet Extactor](https://twitter.com/fbgallet/status/1440709705484038162)
- **Feat:** multiblock support with customizable tag, modified from [Calhistorian's telegroam fork](https://github.com/Calhistorian/RoamanCircus)

## ⚠️ Warning!

If you use the default proxy URL as in the instructions below, your
media files will get passed through a trusted middleman.

You can run your own proxy easily using Heroku's free tier. This is
how I run my proxy.

Click the button below and Heroku will guide you through the whole
thing with zero configuration or coding. You will end up with your
very own proxy URL.

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

### Why is a proxy necessary?

A proxy is necessary because of how Telegram's API works.

When Telegroam receives a photo, video, or audio, it has to download
that file from Telegram in order to upload it to Roam's file storage.

But Telegram doesn't allow the browser to download its files, probably
because of a bug. Instead we have to download via the proxy server.


## 🔧 Getting Started <a name = "getting_started"></a>
 - clone the repo
```
git clone --branch roam-js https://github.com/8bitgentleman/telegroam
```
- cd into the directory and install dependencies
```
npm install roamjs-scripts -g
```   
- To set up for developement follow the instructions [here](https://developer.roamjs.com/roamjs-scripts/dev)
- To build the script (currently not compiled already since it is in heavy development) 
```
npm run build
``` 

## Installation

I will make this more convenient later.

1. In Telegram, talk to @BotFather to create a new bot and get an API
   key for it.

2. Send something to your bot in a private message.

3. Make a page in your Roam called [[Telegram Bot]].

4. Paste these nodes somewhere on the [[Telegram Bot]] page:

   - Inbox Name:: [[Inbox]]
   - API Key:: insert key you get from Telegram's bot system
     - {{[[TODO]]}} update the Telegram API key above
   - Trusted Media Proxy:: https://telegram-cors-proxy.herokuapp.com
   - Latest Update ID::

5. Make a block with the text `{{[[roam/js]]}}`.

6. Nested in that block, make a code block and paste the full contents
   of `telegroam.js` inside.

7. Reload Roam.

## 🚗 TODO Roadmap <a name = "roadmap"></a>
- [x] squash that pesky empty `child` bug
- [ ] create a custom panel for shortcodes
    - this will be a combination of the multi and  pages component. Left most input is the shortcode and right side can only be filled by pages
- [x] figure out how to correctly import media (I messed this up in the switch to typescript somehow)
- [ ] actually update the attribute variables when they change in the settings panel
- [ ] actually toggle timestamp nesting on/off
- [ ] actually toggle message name nesting on/off
- [x] Support custom shortcodes
- [ ] actually toggle shortcode nesting
- [ ] figure out how to simulate a 'thread' ie multiple messages that are all indented under the same parent message
- [x] Support tweet extraction using [this smartblock](https://github.com/dvargas92495/SmartBlocks/issues/216) as inspiration. Extracted text would be the parent with the tweet URL as a child block
- [ ] support [Readwise esque block formatting shortcodes](https://blog.readwise.io/add-chapters-to-highlights/) (.h1, .h2, .ar (right alight), .al (left alight))
- [ ] only print stuff to the console if user has set debug mode to true
- [ ] bring back toggle media tags
- [ ] create a github repo pages site so the script can be hosted (not yet feasable since roam-client compiles)

# Git and GitHub Style Guide <a name = "style"></a>

## Commits

Follow guidelines from [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/). Specifically, begin each commit with one of the following types:

```
build:
ci:
chore:
docs:
feat:
fix:
perf:
refactor:
revert:
style:
test:
```

See some real examples in our [commit history](https://github.com/8bitgentleman/telegroam/commits/master).

## Issues

Please create issues using [our templates](https://github.com/8bitgentleman/telegroam/issues/new/choose).


## Pull Requests

If your PR is related to other issue(s), reference it by issue number. You can close issues smoothly with [GitHub keywords](https://help.github.com/en/enterprise/2.16/user/github/managing-your-work-on-github/closing-issues-using-keywords):

```
close #1
fix #2
resolve #2
```
