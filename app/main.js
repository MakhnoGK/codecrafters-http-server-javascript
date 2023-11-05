const net = require('net')
const fs = require('fs')
const path = require('path')

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
    constructor(request, ua, data) {
        this.request = request
        this.ua = ua
        this.data = data;
    }

    static parse(buffer) {
        const str = buffer.toString('utf-8')
        const parts = str.split(/\r\n/)
        const [request] = parts;
        const [, ua] = str.match(/User-Agent:\s(\S+)/) ?? []

        const data = parts[parts.length - 1];

        return new RequestHeaders(
            Request.parse(request),
            ua,
            data
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

const fileResponse = (bytesRead, buffer) => {
    return (
        'HTTP/1.1 200 OK\r\n' +
        'Content-Type: application/octet-stream\r\n' +
        `Content-Length: ${bytesRead}\r\n\r\n${buffer}`
    )
}

const fileCreatedResponse = () => {

    return (
        'HTTP/1.1 201 Created\r\n'
    )
}

const notFoundResponse = () => {
    return 'HTTP/1.1 404 Not Fund\r\n\r\n'
}

const server = net.createServer((socket) => {
    socket.on('data', (data) => {
        const headers = RequestHeaders.parse(data)

        if (headers.request.path.startsWith('/files')) {
            const [, filename] = headers.request.path.match(/\/files\/(.+)/)
            const dirFlag = process.argv.indexOf('--directory') + 1;
            const directory = process.argv[dirFlag];
            const file = path.join(directory, filename);

            try {
                if (headers.request.method === 'GET') {
                    const fd = fs.openSync(file, 'r');
                    const contents = fs.readFileSync(fd)

                    socket.write(fileResponse(contents.length, contents))
                } else if (headers.request.method === 'POST') {
                    fs.writeFileSync(file, headers.data)
                    socket.write(fileCreatedResponse())
                }
            } catch(error) {
                socket.write(notFoundResponse())
            }
        } else if (headers.request.path.startsWith('/user-agent')) {
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
            socket.write(notFoundResponse(), 'utf-8')
        }

        socket.end()
    })

    socket.on('close', () => {
        socket.end()
        // server.close()
    })
})

server.listen(4221, 'localhost')
