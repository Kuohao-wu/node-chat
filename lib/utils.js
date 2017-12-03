const path = require('path')
const mime = require('mime')
const fs = require('fs')

// 返回404提示
function send404(res) {
  res.writeHead(404, {"Content-Type": "text/plain"})
  res.write('Error 404: resource not found')
  res.end()
}

// 发送文件
function sendFile(res, filePath, fileContent) {
  res.writeHead(200, {"Content-type": mime.lookup(path.basename(filePath))})
  res.end(fileContent)
}

// 静态资源管理器
function serverStatic(res, cache, absPath) {
  // 先判断缓存中是否存在改文件路径
  if (cache[absPath]) {
    sendFile(res, absPath ,cache[absPath])
  } else {
    // 如果不存在缓存，在判断是否存在于硬盘中
    fs.exists(absPath, exists => {
      // 如果存在硬盘中，则从硬盘中读取出来
      if (exists) {
        fs.readFile(absPath, (err, data) => {
          // 发送文件
          sendFile(res, absPath ,data)
          // 将数据写入缓存
          cache[absPath] = data
        })
      } else {
        // 如果不存在硬盘中，则返回404
        send404(res)
      }
    })
  }
}

module.exports = {
  serverStatic
}