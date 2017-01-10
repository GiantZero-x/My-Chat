/**
 * Created by GiantR on 2016/12/15.
 */
'use strict';
let express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    port = 3000,
    users = []; //保存所有在线用户的昵称
//socket配置
io.set('log level', 0);
server.listen(port, function () {
    console.log('服务器开启,正在监听 ' + port + ' 端口.');
});
//配置路由
app.use(express.static(__dirname + '/App'));

io.on('connection', function (socket) {
    //昵称设置
    socket.on('login', function (nickName) {
        if (users.indexOf(nickName) != -1) {
            socket.emit('nameExisted');
        } else {
            socket.userIndex = users.length;
            socket.nickName = nickName;
            users.push(nickName);
            socket.emit('loginSucc');
            //向所有在线客户端发送当前登陆的用户名,状态以及用户列表
            io.sockets.emit('sys', nickName, users, 'login');
        }
    });
    //用户断开连接事件
    socket.on('disconnect', function () {
        // 将断线用户从表中移除
        users.splice(socket.userIndex, 1);
        //   通知除自己以外的所有人
        socket.broadcast.emit('sys', socket.nickName, users, 'logout');
    });
//    接收新消息
    socket.on('postMsg', function (msg, font) {
        io.sockets.emit('newMsg', socket.nickName, msg, font);
    });
//    接收图片消息
    socket.on('postImg', function (data) {
        io.sockets.emit('newImg', socket.nickName, data);
    });
//    接收用户输入状态
    socket.on('typing', function (status) {
        socket.broadcast.emit('typing', socket.nickName, status);
    });
//    接收用户抖动请求
    socket.on('shake', function () {
        io.sockets.emit('shake', socket.nickName);
    });
});
