function Chat(socket) {
  this.socket = socket
}

// 发送聊天记录
Chat.prototype.sendMessage = function(room, text) {
  const message = { room, text }
  this.socket.emit('message', message)
}

// 变更房间
Chat.prototype.changeRoom = function(room) {
  this.socket.emit('join', {newRoom: room})
}

// 处理聊天命令
Chat.prototype.processCommand = function(command) {
  // 将命令分割成数组
  var words = command.split(' ')
  var action = words[0].substr(1).toLowerCase()
  var name = words[1]
  var message = false
  //处理命令
  switch (action) {
    case 'join': 
      this.changeRoom(name)
      break
    case 'nick':
      this.socket.emit('nameAttempt', name)
      break
    default:
      message = 'Unrecognized command'
      break
  }
  return message
}
