const socket = io.connect()

$(function() {
  // 实例化Chat
  var chatApp = new Chat(socket)

  // 接收服务器更名事件
  socket.on('nameResult', function(result) {
    var message
    if (result.success) {
      message = `You are now kown as ${result.name}.`
    } else {
      message = result.message
    }
    $('.chat-panel').append(createText(message))
  })

  // 接收服务器加入房间事件
  socket.on('joinResult', function(result) {
    $('#currentRoom').text(result.room)
    // 新用户加入，清空聊天记录
    $('.chat-panel').empty()
    $('.chat-panel').append(createText('Room changed'))
  })

  // 接收服务器处理消息事件
  socket.on('message', function(message) {
    $('.chat-panel').append(createText(message.text))
  })

  // 显示所有房间
  socket.on('rooms', function(rooms) {
    const roomsDOMArr = []
    for(let room in rooms) {
      if (room !== '') roomsDOMArr.push(createText(room))
    }
    $('#room-list').empty().append(roomsDOMArr)
  })

  // 点击房间名可以切换到该房间来
  $('#room-list').on('click', 'li', function(evt) {
    chatApp.processCommand(`/join ${$(this).text()}`)
    $('#msg-input').focus()
  })

  // 定期请求可用房间列表
  setInterval(function() {
    socket.emit('rooms')    
  }, 1000)
  
  // focus 发送框
  $('#msg-input').focus()

  // 提交聊天消息
  $('#msg-input').keyup(function (evt) {
    if (evt.keyCode === 13 && $(this).val() !== '') {
      processUserInput(chatApp, socket)  
    }
  })
  $('#submit').click(function() {
    // 处理用户输入
    processUserInput(chatApp, socket)
  })
})