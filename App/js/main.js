/**
 * Created by GiantR on 2016/12/15.
 */

// 快捷登陆
$('.login_input').keydown(function (e) {
    if(e.keyCode == 13){
        $('.login_btn').click();
    }
});
//快捷发送信息
/*$('#messageInput').onkeydown = function (e) {
    if(e.keyCode == 13){
        $('#sendBtn').click();
    }
};*/

window.onload = function () {
    //实例并初始化my chat程序
    let chat = new Chat();
    chat.init();
};

//定义Chat类
let Chat = function(){
    this.socket = null;
};

//向原型添加业务方法
Chat.prototype = {
  //  初始化程序
  init:function () {
      let that = this;
      let name = '';
      let reg = /^[a-zA-Z\u4e00-\u9fa5][\w\u4e00-\u9fa5]{0,15}$/;
      let login_input = $('.login_input');
      let login_info = $('.login_info');
  //    建立到服务器的socket连接
      this.socket = io.connect();
  //    监听socket的connect事件,此事件表示连接已经建立
      this.socket.on('connect',function () {
      //    连接到服务器后显示昵称输入框
          login_info.html('已连接');
          $('.login_form input').removeAttr('disabled');
          login_input.focus();
      });
  //    昵称设置的确定按钮
      $('.login_btn').click(function () {
         name = login_input.val().trim();
      //   检查昵称输入框是否为空
          if (!name){
              login_info.html('小白这个名字怎么样');
              login_input.focus();
          } else if(!isNaN(name[0])){
              login_info.html('数字可不能打头阵哦');
          } else if(!reg.test(name)){
              login_info.html('除了字母、汉字或数字其他统统不要');
          } else {
              that.socket.emit('login',name);
          }
      });
  //   若昵称已存在
       this.socket.on('nameExisted',function () {
           login_info.html('您已被人冒名顶替');
      });
  //    昵称可用
      this.socket.on('loginSucc',function () {
          document.title = 'Chat | ' + name;
          $('.modal').hide();
          $('.stage').show();
          $('.msg').focus();
      });
  //    接收系统信息
        this.socket.on('sys',function (nickName,users,type) {
      //    判断用户是连接还是离开以显示不同的信息
          let msg = nickName + (type == 'login' ? ' 加入聊天室' : ' 离开聊天室');
          that._displayNewMsg('系统',msg,'#000');
          //    将在线人数显示在页面顶部
          $('.count span').html(users.length);
          that._dispalyUsers(users);
      });
  //    发送消息按钮
         /*$('#sendBtn').on('click',function () {
         var msgInput = $('#messageInput'),
             msg = msgInput.value,
             color = $('#colorStyle').value;
         msgInput.value = '';
         msgInput.focus();
         if(msg.trim().length != 0){
             that.socket.emit('postMsg',msg,color);
             that._displayNewMsg(nickName,msg,color);
         }
      });
  //    接收新消息
      this.socket.on('newMsg',function (user,msg,color) {
          that._displayNewMsg(user,msg,color);
      });
  //    发送图片
      $('#sendImage').on('change',function () {
         if(this.files.length != 0){
             //获取文件并用filereader进行读取
             var file = this.files[0],
                 reader = new FileReader();
             if(!reader){
                 that._displayNewMsg('系统','当前浏览器不支持文件读取','red');
                 this.value = '';
                 return;
             }
             reader.onload = function (e) {
             //    读取成功,显示到页面并发送到服务器
                 this.value = '';
                 var color = $('#colorStyle').value;
                 that.socket.emit('postImg',e.target.result,color);
                 that._displayNewImg(nickName,e.target.result,color);
             };
             reader.readAsDataURL(file);
         }
      });
  //    接收图片
      this.socket.on('newImg',function (user,img,color) {
          that._displayNewImg(user,img,color);
      });
  //    调用表情初始化方法
      this._initialEmoji();
      $('#emoji').on('click',function (e) {
          var emojiWrapper = $('#emojiWrapper');
          emojiWrapper.style.display = 'block';
          e.stopPropagation();
      });
      //点击其他区域表情框消失
      document.body.on('click',function(e){
          var emojiWrapper = $('#emojiWrapper');
          if(e.target != emojiWrapper){
              emojiWrapper.style.display = 'none';
          }
      });
  //    表情被点击事件
      $('#emojiWrapper').on('click',function (e) {
          var target = e.target;
          if(target.nodeName == 'IMG'){
              var messageInput = $('#messageInput');
              messageInput.focus();
              messageInput.value = messageInput.value + '[emoji:' + target.title + ']';
          }
      });*/
  },
//  显示新消息
    _displayNewMsg:function (user,msg,color) {
      let container = $('.article'),
          Msg = container.html(),
          userColor = '',
          date = new Date().toLocaleString();
      if(user == '系统'){
          userColor = 'font_red';
      }else if(user == '我'){
          userColor = 'font_green' ;
      }else{
          userColor = 'font_blue';
      }
        Msg +=
            `<div>
              <h4 class="${userColor}">${user}<small>${date}</small></h4>
              <p style="color:${color}">${msg}</p>
            </div>`;
        //将消息中的表情转换为图片
        //msgToDisplay.innerHTML = user + '<span class="timespan">(' + date + ')：</span>' + this._showEmoji(msg);
        container.html(Msg);
        container[0].scrollTop = container[0].scrollHeight;
    },
//    更新用户列表
    _dispalyUsers:function (users) {
        let container = $('.users');
        let html = '';
        for(var i=0; i<users.length; i++){
            html += `<li>${users[i]}</li>`;
        }
        container.html(html);
    },
//    显示新图片
    _displayNewImg:function (user,img,color) {
        var container = $('#historyMsg'),
            msgToDisplay = document.createElement('p'),
            date = new Date().toLocaleString();
        msgToDisplay.style.color = color || '#000';
        msgToDisplay.innerHTML = user + '<span class="timespan">(' + date + ')：</span><br/>' + '<a href="' + img + '" target="_blank"><img src="' + img + '"/></a>';
        container.appendChild(msgToDisplay);
        container.scrollTop = container.scrollHeight;
    },
//    初始化表情
    _initialEmoji:function () {
        var emojiContainer = $('#emojiWrapper'),
            frag = document.createDocumentFragment();
        for(var i = 69; i > 0; i--){
            var item = new Image();
            item.src = '../resource/emoji/' + i +'.gif';
            item.title = i;
            frag.appendChild(item);
        }
        emojiContainer.appendChild(frag);
    },
//    显示表情
    _showEmoji:function (msg) {
        var match,result = msg,
            reg = /\[emoji:\d+\]/g,
            emojiIndex,
            totalEmojiNum = $('#emojiWrapper').children.length;
        while(match = reg.exec(msg)){
            emojiIndex = match[0].slice(7,-1);
            //判断是否存在这个这个表情
            if(emojiIndex > totalEmojiNum){
                result = result.replace(match[0],'[X]');
            }else{
                result = result.replace(match[0],'<img class="emoji" src="../resource/emoji/' + emojiIndex + '.gif"/>');
            }
        }
        return result;
    }
};