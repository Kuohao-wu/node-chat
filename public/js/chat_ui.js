function createText(text) {
  const _child = document.createElement('li')
  _child.innerText = text
  return _child
}
function createHTML(html) {
  const _child = document.createElement('li')
  _child.innerHTML = html
  return _child
}

// 处理用户输入
function processUserInput(chatApp, socket) {
  var message = $('#msg-input').val()
  var systemMessage = ''
  if (message.substr(0, 1) === '/') {
    systemMessage = chatApp.processCommand(message)
    if (systemMessage) {
      $('.chat-panel').append(createText(systemMessage))
    }
  } else {
    chatApp.sendMessage($('#currentRoom').text(),message)
    $('.chat-panel').append(createText(message))
    $('.chat-panel').scrollTop($('.chat-panel').prop('scrollHeight'))
  }
  $('#msg-input').val('')
}
