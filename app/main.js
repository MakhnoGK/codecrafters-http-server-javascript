const net = require('net')

class Request {
    constructor(method, path, version) {
        this.method = method
        /** @type {string} */
        this.path = path
        this.version = version
    }

    static parse(str) {
        const [method, path, version] = str.split(/\s/)

        return new Request(method, path, version)
    }
}

class RequestHeaders {
    constructor(request, ua) {
        this.request = request
        this.ua = ua
    }

    static parse(buffer) {
        const str = buffer.toString('utf-8')
        const [request] = str.split(/\r\n/)
        const [, ua] = str.match(/User-Agent:\s(\S+)/)

        return new RequestHeaders(
            Request.parse(request),
            ua
        )
    }
}

const textResponse = (text) => {
    return (
        'HTTP/1.1 200 OK\r\n' +
        'Content-Type: text/plain\r\n' +
        `Content-Length: ${text.length}\r\n\r\n${text}`
    )
}

const server = net.createServer((socket) => {
    socket.on('data', (data) => {
        const headers = RequestHeaders.parse(data)

        if (headers.request.path.startsWith('/user-agent')) {
            socket.write(textResponse(headers.ua), 'utf-8')
        } else if (headers.request.path.startsWith('/echo')) {
            const [, text] = headers.request.path.match(/\/echo\/(.+)/)

            socket.write(
                textResponse(text),
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
