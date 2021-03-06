$(document).ready(function () {
    var socket = io();

    var usermsg = $("#usermsg")
    var userbtn = $("#submitmsg")
    var chatbox = $("#chatbox")

    usermsg.focus()

    var userid = getRandId()
    var users = []
    var defaultName = "user_" + userid.toString()
    var newName = defaultName
    $("#yourId").html(userid.toString())
    $("#yourName").html(defaultName)

    new SimpleBar(document.getElementById('chat-wrapper'))

    $("#exit").click(function () {
        if (confirm('Are you sure want to exit this conversation?')) {
            socket.emit("end")
            window.location = "/?exit=true"
        } else {
            // Do nothing
        }

    })

    $("#btnwrap").click(function (e) {
        e.preventDefault()
        changeName(null)
    })

    userbtn.click(function (e) {
        send()
    })

    usermsg.keydown(function (e) {
        if (e.keyCode == 13) {
            send()
        }
    })

    function send() {
        var message = usermsg.val().trim()

        if ($.trim(message) == '') {
            //alert('Input can not be left blank');
        } else {
            if (message[0] == '/') {
                processQuery(message)

                usermsg.val("")
            } else {
                if(message.length >= 100) return;
                if(validUrl(message)) {
                    window.open(message, '_blank')
                    usermsg.val("")
                } else {
                    message = message.replace('@id', userid).replace('@username', newName)
                    socket.emit('message', {
                        user: userid,
                        name: newName,
                        message: message,
                        time: new Date()
                    })
                    usermsg.val("")
                }
            }
        }
    }


    socket.emit('join', {
        user: userid,
        name: newName
    })

    socket.on('counter', function(data) {
        $("#count-online").html(data.users.length)
        $("#list-users").empty()
        data.users.forEach(function(item) {
            var item = "<span class='dropdown-item'><i class='fas fa-circle text-success'></i>&nbsp;" + item.user + " - " + item.name + "</span>"
            $("#list-users").append(item)
        })
    })

    socket.on('receiv', function (receiv) {
        displayChat(receiv.user, receiv.name, receiv.message)
    })

    socket.on('left', function (data) {
        var header = "<b>" + data.name + "</b> "
        var content = "<li class='bubble-info'><span class='info'>" + header + "has <span class='error'>left </span>conversation" + "</span></li>"
        displayToLog(content)
    })

    socket.on('new', function (data) {
        var header = "<b>" + data.name + "</b> "
        var content = "<li class='bubble-info'><span class='info'>" + header + " has <span class='success'>joined </span>conversation" + "</span></li>"
        displayToLog(content)
    })

    socket.on('usernewname', function (data) {
        var header = "An user with ID <b>" + data.user + "</b> has changed name to "
        var content = "<li class='bubble-info'><span class='info'>" + header + "<b>" + data.name + "</b></span></li>"
        displayToLog(content)
    })

    socket.on('stats_count', function (data) {
        var m = "<li class='bubble-info'><span class='info'>"
        m += "Online: " + data.total + "<br>"
        data.clients.forEach(function (item) {
            m += "<span class='success'>" + item.user + " - "+ item.name + "<span><br>"
        })
        m += "</span></li>"
        displayToLog(m)
    })

    function getRandId() {
        return Math.floor(Math.random() * (9999999 - 999999 + 1)) + 999999;
    }

    function displayChat(id, owner, message) {
        var header = " " + owner + " "
        if(id != userid) {
            var content = "<li class='message'><div class='bubble-you'>" + message + "</div><span class='you badge badge-light'>" + header + "</span></li>"
            displayToLog(content, false)
        } else {
            var content = "<li class='message'><div class='bubble-me'>" + message +"</div><span class='me badge badge-light'>" + header + "</span></li>"
            displayToLog(content, false)
        }
            
    }

    function displayToLog(content, brk = true) {
        chatbox.append(content)
            .append(brk === true ? "<br>" : "")
            .animate({
                scrollTop: chatbox
                    .prop("scrollHeight")
            }, 500);
    }

    function processQuery(cmd) {
        if (cmd[1] === '?' || cmd[1] === "" || cmd[1] === " ") {
            var help = "<li class='bubble-info'><span class='info'>"
            help += "------------------------------------------------------------------------------------------<br>"
            help += "Help:<br>"
            help += "------------------------------------------------------------------------------------------<br>"
            help += "- type /? for help<br>"
            help += "- type <b>/name</b> [<b>newname</b>] to change your display name<br>"
            help += "- type <b>/id</b> to display your current ID<br>"
            help += "- type <b>/online</b> to show all online users<br>"
            help += "- type <b>/clear</b> or <b>/cls</b> to clear log screen<br>"
            help += "------------------------------------------------------------------------------------------<br>"
            help += "------------------------------------------------------------------------------------------<br>"
            help += "</span></li>"
            displayToLog(help)
        } else if (cmd === "/id") {
            var m = "<li class='bubble-info'><span class='info'>Your ID: <span class='success'>" + userid + "</span></span><li class='bubble-info'>";
            displayToLog(m)
        } else if (cmd.startsWith("/name ")) {
            var arr = cmd.split(' ')
            var newname = arr[1]
            if (newname && newname != "" && newname != " ") changeName(newname)
            else {
                var m = "<li class='bubble-info'>Your display name: <span class='success'>" + newName + "</span></li>"
            }
        } else if (cmd.startsWith('/online')) {
            socket.emit('stats')
        } else if(cmd == "/clear" || cmd == "/cls") {
            chatbox.empty()
        }
    }

    function changeName(name) {
        if (name) {
            newName = name
        } else {
            newName = prompt("What's your name?", defaultName).trim()
        }
        if (newName != null || newName != "" || newName != defaultName) {
            $("#yourName").html(newName)
            socket.emit("changename", {
                user: userid,
                name: newName
            })
        }

    }

    function validUrl(url) {
        return /^(https?|s?ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(url);
      }
})