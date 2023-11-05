const net = require('net')

class Request {
    constructor(method, path, version) {
        this.method = method
        this.path = path
        this.version = version
    }

    static parse(str) {
        const [method, path, version] = str.split(/\s/)

        return new Request(method, path, version)
    }
}

class RequestHeaders {
    constructor(request) {
        this.request = request
    }

    static parse(buffer) {
        const str = buffer.toString('utf-8')
        const [request] = str.split(/\r\n/)

        return new RequestHeaders(
            Request.parse(request)
        )
    }
}

const server = net.createServer((socket) => {
    socket.on('data', (data) => {
        const headers = RequestHeaders.parse(data)

        if (headers.request.path.includes('echo')) {
            const [, , text] = headers.request.path.split('/')

            socket.write(
                'HTTP/1.1 200 OK\r\n' +
                'Content-Type: text/plain\r\n' +
                `Content-Length: ${text.length}\r\n\r\n${text}`,
                'utf-8'
            )
        } else if (headers.request.path === '/') {
            socket.write('HTTP/1.1 200 OK\r\n\r\n', 'utf-8')
        } else {
            socket.write('HTTP/1.1 404 Not Fund\r\n\r\n', 'utf-8')
        }

        socket.end()
    })

    socket.on('close', () => {
        socket.end()
        server.close()
    })
})

server.listen(4221, 'localhost')
