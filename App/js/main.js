/**
 * Created by GiantR on 2016/12/15.
 */
'use strict';
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
        //初始化常量
        const TYPING_TIMER_LENGTH = 500,  //输入延时
            reg = /^[\w\u4e00-\u9fa5]*$/,  //用户名匹配正则
            login_input = $('.login_input').focus(),    //用户名输入框
            login_info = $('.login_info'),  //登陆信息框
            msgArea = $('.msg'),    //信息输入框
            bgTotalNum = 6;  //背景图总数
        //初始化变量
        let that = this,
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
            lastTypingTime, //上次输入时间
            isShake = true,
            currentInput = login_input,
            bgNum = 1,
            bgFlag = true;
        //页面事件
        //    初始化弹窗
        this._initialPopup();
        //    昵称设置的确定按钮
        $('input.login_btn').click(function () {
            userName = login_input.val().trim();
            //   检查昵称输入框是否为空
            if (!userName) {
                login_info.html('小白这个名字怎么样');
            } else if (userName.length > 16) {
                login_info.html('你这名字也忒长了');
            } else if (!isNaN(userName[0])) {
                login_info.html('数字不可以打头阵');
            } else if (!reg.test(userName)) {
                login_info.html('除了字母、汉字、数字或_ 其他统统不要');
            } else {
                that.socket.emit('login', userName);
            }
        });
        //    切换背景事件
        $('div.bgChange_box').on('click', 'span', function () {
            if (!bgFlag) {
                return;
            }
            bgFlag = false;
            if (this.className == 'forward') {//向前
                if (bgNum == 1) {
                    bgNum = bgTotalNum;
                } else {
                    bgNum--;
                }
            } else {  //向后
                if (bgNum == bgTotalNum) {
                    bgNum = 1;
                } else {
                    bgNum++;
                }
            }
            $('div.stage').css('background-image', 'url("../resource/stage_bg/' + bgNum + '.jpg")');
            setTimeout(function () {
                bgFlag = true;
            }, 500);
        });
        //    字号改变
        $('span.sprite-size').click(function (e) {
            _changeFontBtn(this, 'ul.font_size_box', e);
        });
        $('ul.font_size_box').on('click', 'li', function () {
            _changFontBox(this, 'span.sprite-size', 'font_size');
        });
        //    字体改变
        $('span.sprite-family').click(function (e) {
            _changeFontBtn(this, 'ul.font_family_box', e);
        });
        $('ul.font_family_box').on('click', 'li', function () {
            _changFontBox(this, 'span.sprite-family', 'font_family');
        });
        //    颜色改变
        $('span.sprite-color').click(function (e) {
            _changeFontBtn(this, 'ul.font_color_box', e);
        });
        $('ul.font_color_box').on('click', 'li', function () {
            _changFontBox(this, 'span.sprite-color', 'color');
        });
        //    字体加粗
        $('span.sprite-bold').click(function () {
            _changeFont(this, 'font_weight', 'bold', 'normal');
        });
        //    字体倾斜
        $('span.sprite-italic').click(function () {
            _changeFont(this, 'font_style', 'italic', 'normal');
        });
        //    字体下划线
        $('span.sprite-underline').click(function () {
            _changeFont(this, 'text_decoration', 'underline', 'none');
        });
        //    表情被点击
        $('span.sprite-emoji').click(function (e) {
            _changeFontBtn(this, 'div.emoji_box', e);
        });
        $('div.emoji_box').on('click', 'img', function () {
            msgArea.focus();
            msgArea.val(msgArea.val() + '[emoji:' + this.title + ']');
        });
        //    发送图片
        $('span.sprite-pic').click(function () {
            $(this).addClass('active');
            $('#img').trigger('click');
        });
        $('#img').on('change', function () {
            $('span.sprite-pic').removeClass('active');
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
                    that._displayNewMsg('我', null, null, e.target.result);
                };
                reader.readAsDataURL(file);
            }
        });
        //    窗口抖动
        $('span.sprite-shake').click(function () {
            $(this).addClass('active');
            that.socket.emit('shake');
            setTimeout(function () {
                $('span.sprite-shake').removeClass('active');
            }, 1000);
        });
        //    取消抖动
        $('span.sprite-ban').on('click', function () {
            $(this).toggleClass('active');
            isShake = !$(this).is('.active');
        });
        //    清除历史消息
        $('span.sprite-clear').click(function () {
            $(this).addClass('active');
            $('div.article').html('');
            setTimeout(function () {
                $('span.sprite-clear').removeClass('active');
            }, 500);
        });

        //    点击其他区域弹框消失
        $('body').click(function (e) {
            const boxList = [
                    $('div.emoji_box'),
                    $('ul.font_family_box'),
                    $('ul.font_size_box'),
                    $('ul.font_color_box')
                ],
                btnList = [
                    $('span.sprite-emoji'),
                    $('span.sprite-family'),
                    $('span.sprite-size'),
                    $('span.sprite-color'),
                ];
            $.each(boxList, function (i, n) {
                if (e.target != n[0]) {
                    n.fadeOut('fast');
                    btnList[i].removeClass('active')
                }
            });
        });

        //    按钮自身控制事件
        function _changeFont(self, styleName, active, normal) {
            $(self).toggleClass('active');
            if ($(self).hasClass('active')) {
                font[styleName] = active;
            } else {
                font[styleName] = normal;
            }
            msgArea.css(styleName.replace('_', '-'), font[styleName]).focus();
        }
        //    控制按钮事件
        function _changeFontBtn(self, controlBox, e) {
            $(self).addClass('active');
            $(controlBox).fadeIn('fast');
            e.stopPropagation();
        }
        //    控制容器事件
        function _changFontBox(self, controlBtn, styleName) {
            $(self).addClass('active').siblings().removeClass('active');
            $(controlBtn).removeClass('active');
            font[styleName] = self.innerHTML;
            msgArea.css(styleName.replace('_', '-'), font[styleName]).focus();
        }

        //    正在输入
        msgArea.on('input', function () {
            const self = that;
            if (!typing) {
                typing = true;
                self.socket.emit('typing', '1');
            }
            lastTypingTime = (new Date()).getTime();

            setTimeout(function () {
                let typingTimer = (new Date()).getTime(),
                    timeDiff = typingTimer - lastTypingTime;
                if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
                    self.socket.emit('typing', '0');
                    typing = false;
                }
            }, TYPING_TIMER_LENGTH);
        });
        //    退出登陆
        $('input.close').click(function () {
            location.reload(true);
        });
        //    清空输入
        $('input.clear').click(function () {
            msgArea.val('').focus();
        });
        //    发送消息按钮
        $('input.sent').click(function () {
            let msg = msgArea.val();
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
                $('input.login_btn').trigger('click');
                e.preventDefault();
            }
        });
        msgArea.keydown(function (e) {
            if (e.keyCode == 13) {
                $('input.sent').trigger('click');
                e.preventDefault();
            }
        });
        $('div.modal').click(function () {
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
                $('input.login_btn').trigger('click');
                return;
            }
            $('div.login_form input').removeAttr('disabled');
            login_input.focus();
        });
        //    连接断开
        this.socket.on('disconnect', function () {
            login_info.html('<span>正在重新连接</span>');
            $('div.login_form input').attr('disabled', 'disabled');
            $('div.modal').fadeIn();
            $('div.stage').fadeOut();
        });
        //    若昵称已存在
        this.socket.on('nameExisted', function () {
            login_info.html('被冒名顶替了');
        });
        //    昵称可用
        this.socket.on('loginSucc', function () {
            $('div.article').html('');
            document.title = 'Chat | ' + userName;
            $('span.title').html('My Chat - <small>' + userName + '</small>');
            $('div.modal').fadeOut();
            $('div.stage').fadeIn();
            currentInput = msgArea;
            msgArea.focus();
        });
        //    接收系统信息
        this.socket.on('sys', function (nickName, users, type) {
            //    判断用户是连接还是离开以显示不同的信息
            let msg = nickName + (type == 'login' ? ' 已加入' : ' 已离开');
            that._displayNewMsg('系统', msg);
            //    将在线用户显示在侧边栏
            that._displayUsers(users, userName);
        });
        //    接收新消息
        this.socket.on('newMsg', function (user, msg, font) {
            that._displayNewMsg(user, msg, font);
        });
        //    接收图片
        this.socket.on('newImg', function (user, img) {
            that._displayNewMsg(user, null, null, img);
        });
        //   监听输入状态
        this.socket.on('typing', function (user, status) {
            // 正在输入
            $('ul.users li').each(function (i, e) {
                let item = e.textContent.split(' ')[0];
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
            if (user == userName) {
                user = '我'
            }
            that._displayNewMsg('系统', user + ' 发送了一个窗口抖动');
            if (!isShake) {
                return
            }
            $('div.container').addClass('shake');
            setTimeout(function () {
                $('div.container').removeClass('shake');
            }, 1000);
        });
    },
//    初始化弹窗
    _initialPopup: function () {
        //Emoji
        const emojiBox = $('div.emoji_box'),
            colorLiList = $('ul.font_color_box li'),
            famLiList = $('ul.font_family_box li'),
            sizeLiList = $('ul.font_size_box li');
        let html = '';
        for (let i = 69; i > 0; i--) {
            html += `<img src="../resource/emoji/${i}.gif" title="${i}">`;
        }
        emojiBox.html(html);
        //color
        for (let i = 0; i < colorLiList.length; i++) {
            let li = colorLiList[i];
            $(li).css({'background-color': li.innerHTML, 'color': li.innerHTML});
        }
        //font-family
        for (let i = 0; i < famLiList.length; i++) {
            let li = famLiList[i];
            $(li).css({'font-family': li.innerHTML});
        }
        //font-size
        for (let i = 0; i < sizeLiList.length; i++) {
            let li = sizeLiList[i];
            $(li).css({'font-size': li.innerHTML});
        }
    },
//    显示新消息
    _displayNewMsg: function (user, msg, font, img) {
        let container = $('.article'),
            userColor = '',
            date = new Date().toLocaleString(),
            div = document.createElement('div');
        if (user == '系统' || msg == '"发送了一个窗口抖动"') {
            userColor = 'font_red';
            div.className = 'sysMsg';
            font = {
                color: '#666', //颜色
                font_weight: 'normal', //粗细
                font_style: 'normal',  //倾斜
                text_decoration: 'none',    //下划线
                font_size: '14px', //字号
                font_family: 'Microsoft Yahei' //字体
            }
        } else if (user == '我') {
            userColor = 'font_purple';
            div.className += ' myMsg';
        }
        div.className += ' newMsg';
        if (img) {
            div.innerHTML = `
              <h4 class="${userColor}">${user}<small>${date}</small></h4>
              <p>
                <a href="${img}" target="_blank" title="查看原图"><img src="${img}"></a>
              </p>`;
        } else {
            div.innerHTML = `
              <h4 class="${userColor}">${user}<small>${date}</small></h4>
              <p style="color:${font.color};
                        font-weight:${font.font_weight};
                        font-style: ${font.font_style};
                        text-decoration: ${font.text_decoration};
                        font-size: ${font.font_size};
                        font-family: ${font.font_family};">
                ${this._showEmoji(msg)}
              </p>`;
        }

        container.append(div);
        container[0].scrollTop = container[0].scrollHeight;
        setTimeout(function () {
            $(div).removeClass(' newMsg');
        }, 500);
    },
//    更新用户列表
    _displayUsers: function (users, me) {
        const container = $('.users');
        let html = '';
        for (var i = 0; i < users.length; i++) {
            html += users[i] == me ? `<li class="font_darkcyan">${users[i]}</li>` : `<li><a href="#">${users[i]}<span  style="display:none" class="font_cornflowerblue"> (正在输入)</span></a></li>`;
        }
        container.html(html);
        $('p.count span').html(users.length);
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
                result = result.replace(match[0], ` <img class="emoji" src="../resource/emoji/${emojiIndex}.gif"/> `);
            }
        }
        return result;
    }
};