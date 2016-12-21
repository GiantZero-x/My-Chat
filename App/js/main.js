/**
 * Created by GiantR on 2016/12/15.
 */

window.onload = function () {
    //实例并初始化my chat程序
    var chat = new Chat();
    chat.init();
};

//定义Chat类
var Chat = function () {
    this.socket = null;
};

//向原型添加业务方法
Chat.prototype = {
//  初始化程序
    init: function () {
        //初始化变量
        var that = this,
            userName = '',  //用户名
            font = {
                color: '#000', //颜色
                font_weight: 'normal', //粗细
                font_style: 'normal',  //倾斜
                text_decoration: 'none',    //下划线
                font_size: '16px', //字号
                font_family: 'Microsoft Yahei' //字体
            },
            typing = false, //输入状态
            lastTyping, //上次输入时间
            TYPING_TIMER_LENGTH = 500,  //输入延时
            reg = /^[\w\u4e00-\u9fa5]*$/,  //用户名匹配正则
            currentInput = login_input = $('.login_input').focus(),    //用户名输入框
            login_info = $('.login_info'),  //登陆信息框
            msgArea = $('.msg');    //信息输入框

        //页面事件
        //    昵称设置的确定按钮
        $('.login_btn').click(function () {
            userName = login_input.val().trim();
            //   检查昵称输入框是否为空
            if (!userName) {
                login_info.html('小白这个名字怎么样');
            } else if (userName.length > 16) {
                login_info.html('你这名字也忒长了');
            } else if (!isNaN(userName[0])) {
                login_info.html('数字不可以打头阵');
            } else if (!reg.test(userName)) {
                login_info.html('除了字母、汉字或数字其他统统不要');
            } else {
                that.socket.emit('login', userName);
            }
        });

        //    颜色改变
        $('.color').change(function () {
            font.color = this.value;
            msgArea.css('color', font.color).focus();
        });
        //    字体加粗
        $('.font_weight').click(function () {
            _changeFont(this, 'font_weight', 'bold', 'normal');
        });
        //    字体倾斜
        $('.font_style').click(function () {
            _changeFont(this, 'font_style', 'italic', 'normal');
        });
        //    字体下划线
        $('.font_underline').click(function () {
            _changeFont(this, 'text_decoration', 'underline', 'none');
        });
        //    改变字体
        function _changeFont(self, styleName, active, normal) {
            $(self).toggleClass('active');
            if ($(self).hasClass('active')) {
                font[styleName] = active;
            } else {
                font[styleName] = normal;
            }
            msgArea.css(styleName.replace('_','-'), font[styleName]);
        }

        //    调用表情初始化方法
        this._initialEmoji();
        $('.emoji').click(function (e) {
            $('.emoji_box').show();
            e.stopPropagation();
        });
        //    点击其他区域表情框消失
        $('body').click(function (e) {
            var emojiBox = $('.emoji_box');
            if (e.target != emojiBox[0]) {
                emojiBox.hide();
            }
        });
        //    表情被点击事件
        $('.emoji_box').on('click', 'img', function () {
            msgArea.focus();
            msgArea.val(msgArea.val() + '[emoji:' + this.title + ']');
        });

        //    发送图片
        $('.img').click(function () {
            $('#img').trigger('click');
        });
        $('#img').on('change', function () {
            if (this.files.length != 0) {
                //获取文件并用filereader进行读取
                var file = this.files[0],
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

        //    窗口抖动
        $('.shake_btn').click(function () {
            that.socket.emit('shake');
            that._displayNewMsg('我', '"发送了一个窗口抖动"');
        });

        //    正在输入
        msgArea.on('input', function () {
            var self = that;
            if (!typing) {
                typing = true;
                self.socket.emit('typing', '1');
            }
            lastTypingTime = (new Date()).getTime();

            setTimeout(function () {
                var typingTimer = (new Date()).getTime(),
                    timeDiff = typingTimer - lastTypingTime;
                if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
                    self.socket.emit('typing', '0');
                    typing = false;
                }
            }, TYPING_TIMER_LENGTH);
        });
        //    退出登陆
        $('.close').click(function () {
            location.reload('true');
        });
        //    清空输入
        $('.clear').click(function () {
            msgArea.val('').focus();
        });
        //    发送消息按钮
        $('.sent').click(function () {
            var msg = msgArea.val();
            msgArea.val('');
            msgArea.focus();
            if (msg.trim().length != 0) {
                that.socket.emit('postMsg', msg, font);
                that._displayNewMsg('我', msg, font);
            }
        });

        //快捷操作

        login_input.keydown(function (e) {
            if (e.keyCode == 13) {
                $('.login_btn').trigger('click');
                e.preventDefault();
            }
        });
        msgArea.keydown(function (e) {
            if (e.keyCode == 13) {
                $('.sent').trigger('click');
                e.preventDefault();
            }
        });
        $('.modal').click(function () {
            login_input.focus();
        });
        $(window).keydown(function () {
            if (!(event.ctrlKey || event.metaKey || event.altKey)) {
                currentInput.focus();
            }
        });

        //socket事件

        //    建立到服务器的socket连接
        this.socket = io.connect();
        //    监听socket的connect事件,此事件表示连接已经建立
        this.socket.on('connect', function () {
            //    连接到服务器后显示昵称输入框
            login_info.html('已连接');
            if (userName) {
                $('.login_btn').trigger('click');
                return;
            }
            $('.login_form input').removeAttr('disabled');
            login_input.focus();
        });
        //    连接断开
        this.socket.on('disconnect', function () {
            login_info.html('<span>正在重新连接</span>');
            $('.login_form input').attr('disabled', 'disabled');
            $('.modal').fadeIn();
            $('.stage').fadeOut();
        });
        //    若昵称已存在
        this.socket.on('nameExisted', function () {
            login_info.html('被冒名顶替了');
        });
        //    昵称可用
        this.socket.on('loginSucc', function () {
            $('.article').html('');
            document.title = 'Chat | ' + userName;
            $('.modal').fadeOut();
            $('.stage').fadeIn();
            currentInput = msgArea;
            msgArea.focus();
        });
        //    接收系统信息
        this.socket.on('sys', function (nickName, users, type) {
            //    判断用户是连接还是离开以显示不同的信息
            var msg = nickName + (type == 'login' ? ' 已加入' : ' 已离开');
            that._displayNewMsg('系统', msg);
            //    将在线用户显示在侧边栏
            that._dispalyUsers(users, userName);
        });
        //    接收新消息
        this.socket.on('newMsg', function (user, msg, font) {
            that._displayNewMsg(user, msg, font);
        });
        //    接收图片
        this.socket.on('newImg', function (user, img) {
            that._displayNewImg(user, img);
        });
        //   监听输入状态
        this.socket.on('typing', function (user, status) {
            // 正在输入
            $('.users li').each(function (i, e) {
                var item = e.textContent.split(' ')[0];
                if (item == user) {
                    if (status == '1') {
                        $(e).find('span').fadeIn();
                    } else {
                        $(e).find('span').fadeOut();
                    }
                }


            });
        });
        //   监听抖动
        this.socket.on('shake', function (user) {
            $('.container').addClass('shake');
            setTimeout(function () {
                $('.container').removeClass('shake');
            }, 1000);
            that._displayNewMsg('系统', user + ' 发送了一个窗口抖动');
        });
    },
//    显示新消息
    _displayNewMsg: function (user, msg, font) {
        var container = $('.article'),
            userColor = '',
            date = new Date().toLocaleString();
        if (user == '系统'|| msg == '"发送了一个窗口抖动"') {
            userColor = 'font_red';
            font = {
                color: '#666', //颜色
                font_weight: 'normal', //粗细
                font_style: 'normal',  //倾斜
                text_decoration: 'none',    //下划线
                font_size: '80%', //字号
                font_family: 'Microsoft Yahei' //字体
            }
        } else if (user == '我') {
            userColor = 'font_green';
        } else {
            userColor = 'font_blue';
        }
        var div = document.createElement('div');
        div.className = 'newMsg';
        div.innerHTML = `
              <h4 class="${userColor}">${user}<small>${date}</small></h4>
              <p style="color:${font.color};font-weight:${font.font_weight};font-style: ${font.font_style};text-decoration: ${font.text_decoration};font-size: ${font.font_size};">
                ${this._showEmoji(msg)}
              </p>`;
        container.append(div);
        container[0].scrollTop = container[0].scrollHeight;
        setTimeout(function () {
            div.removeAttribute('class');
        },500);
    },
//    更新用户列表
    _dispalyUsers: function (users, me) {
        var container = $('.users');
        var html = '';
        for (var i = 0; i < users.length; i++) {
            html += users[i] == me ? `<li class="font_red">${users[i]}</li>` : `<li>${users[i]}<span  style="display:none"> (正在输入)</span></li>`;
        }
        container.html(html);
        $('.count span').html(users.length);
    },
//    显示新图片
    _displayNewImg: function (user, img) {
        var container = $('.article'),
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
        var emojiBox = $('.emoji_box'),
            html = '';
        for (var i = 69; i > 0; i--) {
            html += `<img src="../resource/emoji/${i}.gif" title="${i}">`;
        }
        emojiBox.html(html);
    },
//    显示表情
    _showEmoji: function (msg) {
        var match, result = msg,
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