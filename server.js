const http = require('http')
const server = http.createServer()
const path = require('path')
const { serverStatic } = require('./lib/utils')
// 因为计算读写内存比读写硬盘速度快多了，所以使用缓存管理静态文件
const caches = {}
const staticDir = path.join(__dirname, 'public')
const chatServer = require('./lib/chat')

server.on('request', (req, res) => {
  let filePath = ''
  if (req.url === '/') {
    filePath = '/index.html'
  } else {
    filePath = req.url
  }
  
  // 文件绝对路径
  const abspath = staticDir + filePath
  serverStatic(res, caches, abspath)
})


server.listen(8087)

// 监听socketIo服务
chatServer.listen(server)

console.log('server run in port 8087')