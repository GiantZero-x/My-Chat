Chat
===
 
A chat application built with Node.js and socket.io.

Features
---
* send pictures :sunrise:
* send emojis :smile:
* keyboard support :musical_keyboard:
* online users count statistic :ghost:

How to run
---
1. download the code then extract
2. run `npm install` from command line window
3. run `node server` or `iojs server` if you are using [io.js](https://iojs.org/)
4. finnaly, open your browser and visit `localhost:3000`

若出现提示
`DeprecationWarning: process.EventEmitter is deprecated. use require('events') instead.`, 将 `socket.io/lib` 目录js文件中的 `process.EventEmitter` 替换成 `require('events')`.

