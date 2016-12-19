/**
 * Created by GiantR on 2016/12/15.
 */

// 快捷操作
$('.login_input').keydown(function (e) {
    if (e.keyCode == 13) {
        $('.login_btn').trigger('click');
    }
});
$('.msg').keydown(function (e) {
    if (e.keyCode == 13) {
        $('.sent').trigger('click');
    }
});

window.onload = function () {
    //实例并初始化my chat程序
    let chat = new Chat();
    chat.init();
};

//定义Chat类
let Chat = function () {
    this.socket = null;
};

//向原型添加业务方法
Chat.prototype = {
    //  初始化程序
    init: function () {
        let that = this,
            name = '',  //用户名
            color = '#000', //字体颜色
            reg = /^[a-zA-Z\u4e00-\u9fa5][\w\u4e00-\u9fa5]{0,15}$/,
            login_input = $('.login_input'),
            login_info = $('.login_info');
        //颜色改变事件
        $('.color').change(function () {
            color = this.value;
            $('.msg').css('color', color).focus();
        });
        // 清空输入框
        $('.clear').click(function () {
            $('.msg').val('').focus();
        });
        //    建立到服务器的socket连接
        this.socket = io.connect();
        //    监听socket的connect事件,此事件表示连接已经建立
        this.socket.on('connect', function () {
            //    连接到服务器后显示昵称输入框
            login_info.html('已连接');
            $('.login_form input').removeAttr('disabled');
            login_input.focus();
        });
        //    昵称设置的确定按钮
        $('.login_btn').click(function () {
            name = login_input.val().trim();
            //   检查昵称输入框是否为空
            if (!name) {
                login_info.html('小白这个名字怎么样');
                login_input.focus();
            } else if (!isNaN(name[0])) {
                login_info.html('数字可不能打头阵哦');
            } else if (!reg.test(name)) {
                login_info.html('除了字母、汉字或数字其他统统不要');
            } else {
                that.socket.emit('login', name);
            }
        });
        //   若昵称已存在
        this.socket.on('nameExisted', function () {
            login_info.html('您已被人冒名顶替');
        });
        //    昵称可用
        this.socket.on('loginSucc', function () {
            document.title = 'Chat | ' + name;
            $('.modal').hide();
            $('.stage').show();
            $('.msg').focus();
        });

        //    接收系统信息
        this.socket.on('sys', function (nickName, users, type) {
            //    判断用户是连接还是离开以显示不同的信息
            let msg = nickName + (type == 'login' ? ' 加入聊天室' : ' 离开聊天室');
            that._displayNewMsg('系统', msg);
            //    将在线用户显示在侧边栏
            that._dispalyUsers(users,name);
        });

        //    发送消息按钮
        $('.sent').click(function () {
            let msgArea = $('.msg'),
                msg = msgArea.val();
            msgArea.val('');
            msgArea.focus();
            if (msg.trim().length != 0) {

                that.socket.emit('postMsg', msg, color);
                that._displayNewMsg('我', msg, color);
            }
        });
        //    接收新消息
        this.socket.on('newMsg', function (user, msg, color) {
            that._displayNewMsg(user, msg, color);
        });
        //    发送图片
        $('#img').on('change', function () {
            if (this.files.length != 0) {
                //获取文件并用filereader进行读取
                let file = this.files[0],
                    reader = new FileReader();
                if (!reader) {
                    that._displayNewMsg('系统', '当前浏览器不支持文件读取');
                    this.value = '';
                    return;
                }
                reader.onload = function (e) {
                    //    读取成功,显示到页面并发送到服务器
                    this.value = '';
                    that.socket.emit('postImg', e.target.result);
                    that._displayNewImg('我', e.target.result);
                };
                reader.readAsDataURL(file);
            }
        });
        //    接收图片
        this.socket.on('newImg', function (user, img) {
            that._displayNewImg(user, img);
        });
        //    调用表情初始化方法
        this._initialEmoji();
        $('.emoji').click(function (e) {
            $('.emoji_box').show();
            e.stopPropagation();
        });
        //点击其他区域表情框消失
        $('body').click(function (e) {
            let emojiBox = $('.emoji_box');
            if (e.target != emojiBox[0]) {
                emojiBox.hide();
            }
        });
        //    表情被点击事件
        $('.emoji_box').on('click', 'img', function () {
            let msgArea = $('.msg');
            msgArea.focus();
            msgArea.val(msgArea.val() + '[emoji:' + this.title + ']');
        });
    },
//  显示新消息
    _displayNewMsg: function (user, msg, color) {
        let container = $('.article'),
            Msg = container.html(),
            userColor = '',
            date = new Date().toLocaleString();
        if (!color) {
            color = '#000';
        }
        if (user == '系统') {
            userColor = 'font_red';
        } else if (user == '我') {
            userColor = 'font_green';
        } else {
            userColor = 'font_blue';
        }
        Msg +=
            `<div>
              <h4 class="${userColor}">${user}<small>${date}</small></h4>
              <p style="color:${color}">${this._showEmoji(msg)}</p>
            </div>`;
        container.html(Msg);
        container[0].scrollTop = container[0].scrollHeight;
    },
//    更新用户列表
    _dispalyUsers: function (users,me) {
        let container = $('.users');
        let html = '';
        for (let i = 0; i < users.length; i++) {
            html += users[i] == me?`<li class="font_red">${users[i]}</li>`:`<li>${users[i]}</li>`;
        }
        container.html(html);
        $('.count span').html(users.length);
    },
//    显示新图片
    _displayNewImg: function (user, img) {
        let container = $('.article'),
            Msg = container.html(),
            date = new Date().toLocaleString();
        if (user == '系统') {
            userColor = 'font_red';
        } else if (user == '我') {
            userColor = 'font_green';
        } else {
            userColor = 'font_blue';
        }
        Msg +=
            `<div>
              <h4 class="${userColor}">${user}<small>${date}</small></h4>
              <p>
                <a href="${img}" target="_blank" title="查看原图"><img src="${img}"></a>
              </p>
            </div>`;
        container.html(Msg);
        container[0].scrollTop = container[0].scrollHeight;
    },
//    初始化表情
    _initialEmoji: function () {
        let emojiBox = $('.emoji_box'),
            html = '';
        for (let i = 69; i > 0; i--) {
            html += `<img src="../resource/emoji/${i}.gif" title="${i}">`;
        }
        emojiBox.html(html);
    },
//    显示表情
    _showEmoji: function (msg) {
        let match, result = msg,
            reg = /\[emoji:\d+\]/g,
            emojiIndex,
            totalEmojiNum = $('.emoji_box').children().length;
        while (match = reg.exec(msg)) {
            emojiIndex = match[0].slice(7, -1);
            //判断是否存在这个这个表情
            if (emojiIndex > totalEmojiNum) {
                result = result.replace(match[0], '[X]');
            } else {
                result = result.replace(match[0], `<img class="emoji" src="../resource/emoji/${emojiIndex}.gif"/>`);
            }
        }
        return result;
    }
};