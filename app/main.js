const net = require('net')

const server = net.createServer((socket) => {
    socket.on('data', () => {
        socket.write('HTTP/1.1 200 OK \r\n\r\n', 'utf-8')
        socket.end()
    })

    socket.on('close', () => {
        socket.end()
        server.close()
    })
})

server.listen(4221, 'localhost')
