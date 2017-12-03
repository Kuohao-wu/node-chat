const socketio = require('socket.io')
let guestNum = 1
const nickNames = {}
const namesUsed = []
const currentRoom = {}
var io


// 起一个socketIO服务
exports.listen = function (server){
  io = socketio.listen(server)
  // 监听连接
  io.sockets.on('connection', socket => {

    // 分配新用户昵称
    guestNum = assignGuestName(socket, guestNum, nickNames, namesUsed)

    // 用户连接上来时把他放进聊天室lobby中
    joinRoom(socket, 'Lobby')
    // 处理用户消息
    handleMessageBroadcasting(socket, nickNames)
    // 处理用户更名
    handleNameChangeAttempts(socket, nickNames, namesUsed)
    // 创建变更聊天室
    handleRoomJoining(socket)

    // 用户发出请求是，向其提供已经被占用的聊天室列表
    socket.on('rooms', () => {
      socket.emit('rooms', io.of('/').adapter.rooms)
    })

    // 定义用户断开连接后的清除逻辑
    handleClientDisconnection(socket, nickNames, namesUsed)
  })
}

// 分配用户昵称
function assignGuestName(socket, guestNum, nickNames, namesUsed) {

  let name = `Guest${guestNum}`
  // 将用户昵称和客户端连接ID关联起来，储存在nickNames数组中
  nickNames[socket.id] = name
  socket.emit('nameResult', {
    success: true,
    name
  })
  // 将名字push到一个namesUsed中，表示这个名字已经被使用了
  namesUsed.push(name)
  // 增加用来生成昵称的计数器
  return guestNum + 1
}

// 加入聊天室 
function joinRoom(socket, room) {
  // 让用户退出自动加入的房间
  socket.leave(socket.id)
  // 将用户加入房间
  socket.join(room)
  // 记录用户进入了那个房间
  currentRoom[socket.id] = room
  // 发布加入房间成功事件
  socket.emit('joinResult', { room })

  // 广播事件，让其他用户知道当前用户加入了房间
  socket.broadcast.to(room).emit('message', {
    text: `${nickNames[socket.id]}' has joined '${room}.`
  })

  // 取得当前房间的连接用户
  const usersInRoom = io.of('/').in(room).clients
  // 如果不止一个用户在这个房间，汇总一下都是谁
  if (usersInRoom.length > 1) {
    let usersInRoomSummary = 'Users currently in ' + room + ':'
    // 用这个房间里面的用户全部遍历出来
    for (let index in usersInRoom) {
      let userSocketId = usersInRoom[index].id
      // 如果遍历的用户不为当前连接的用户
      if (userSocketId !== socket.id) {
        // 第一个用户后面加上,号
        if (index > 0) {
          usersInRoomSummary += ','
        }
        usersInRoomSummary += nickNames[userSocketId]
      }
    }
    usersInRoomSummary += '.'
    // 发布事件
    socket.emit('message', { text: usersInRoomSummary })
  }
}

function handleNameChangeAttempts(socket, nickNames, namesUsed) {
  // 订阅改名事件
  socket.on('nameAttempt', name => {
    // 不能以Guest开头
    if (name.indexOf('Guest') === 0) {
      socket.emit('nameResult', {
        success: false,
        message: 'Names connot begin with "Guest".'
      })
    } else {
      // 如果这个名字没有被使用过
      if (namesUsed.indexOf(name) === -1) {
        // 取到当前使用的名字
        let previousName = nickNames[socket.id]
        // 找到这个名字在nameUsed的位置，并删除它
        let previousNameIndex = namesUsed.indexOf(previousName)
        delete namesUsed[previousName]
        // 将新名字放到nameUsed中
        namesUsed.push(name)
        nickNames[socket.id] = name
        // 发布更名成功事件
        socket.emit('nameResult', {
          success: true,
          name
        })
        socket.broadcast.to(currentRoom[socket.id]).emit('message', {
          text: `${previousName} is now know as ${name}.`
        })
      } else {
        // 如果名字已经被使用了,就提示用户
        socket.emit('nameResult', {
          success: false,
          message: 'That name is already in use'
        })
      }
    }
  })
}

// 将用户发送的消息广播到所有在线用户
function handleMessageBroadcasting(socket) {
  socket.on('message', message => {
    socket.broadcast.to(message.room).emit('message', {
      text: `${nickNames[socket.id]}: ${message.text}`
    })
  })
}
// 变更房间， 加入已经存在的房间，如果该房间还没有的话，则创建一个房间
function handleRoomJoining(socket) {
  socket.on('join', room => {
    // 离开当前房间
    socket.leave(currentRoom[socket.id])
    // 加入新的房间
    joinRoom(socket, room.newRoom)
  })
}

// 用户断开连接, 清除数据
function handleClientDisconnection(socket) {
  socket.on('disconnect', () => {
    const nameIndex = namesUsed.indexOf(nickNames[socket.id])
    delete namesUsed[nameIndex]
    delete nickNames[socket.id]
  })
}