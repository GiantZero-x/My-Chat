/**
 * Created by GiantR on 2016/12/15.
 */
var ex = require('express'),
    app = ex(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    //保存所有在线用户的昵称
    users = [];

app.use('/',ex.static(__dirname + '/App'));
server.listen(80,function () {
    console.log('服务器开启,正在监听 80 端口.');
});

io.on('connection',function (socket) {
    //昵称设置
   socket.on('login',function (nickName) {
       if(users.indexOf(nickName) != -1){
           socket.emit('nameExisted');
       }else{
           socket.userIndex = users.length;
           socket.nickName = nickName;
           users.push(nickName);
           socket.emit('loginSucc');
           //向所有在线客户端发送当前登陆的用户名,状态以及用户列表
           io.sockets.emit('sys',nickName,users,'login');
       }
       console.log(socket.nickName +　' 连接,目前共有' + users.length  + '人在线.');
   });
    //用户断开连接事件
    socket.on('disconnect',function () {
       // 将断线用户从表中移除
       users.splice(socket.userIndex,1);
    //   通知除自己以外的所有人
        socket.broadcast.emit('sys',socket.nickName,users.length,'logout');
        console.log(socket.nickName +　' 离开,目前共有 ' + users.length +　' 人在线.');
    });
//    接收新消息
    socket.on('postMsg',function (msg,color) {
        socket.broadcast.emit('newMsg',socket.nickName,msg,color);
    });
//    接收图片消息
    socket.on('postImg',function (data,color) {
        socket.broadcast.emit('newImg',socket.nickName,data,color);
    })
});
