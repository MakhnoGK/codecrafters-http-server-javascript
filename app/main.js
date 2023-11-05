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

const statusDict = {
    200: 'OK',
    404: 'Not Found'
}

class Response {
    constructor(status) {
        this.status = 200
    }

    addContent(type, content) {
        this.contentType = type
        this.content = content
    }

    toString() {
        let responseString = `HTTP/1.1 ${this.status} ${statusDict[this.status]}\r\n`

        if (this.content) {
            responseString += `Content-Type: ${this.contentType}\r\n`
            responseString += `Content-Length: ${this.content.length}\r\n`
        }

        if (this.content) {
            responseString += `\r\n${this.content}`
        }

        return responseString;
    }
}

const server = net.createServer((socket) => {
    socket.on('data', (data) => {
        const headers = RequestHeaders.parse(data)

        if (headers.request.path.includes('echo')) {
            const [, , text] = headers.request.path.split('/')

            const content = new Response(200)
            content.addContent('text/plain', text)

            const responseString = content.toString()

            socket.write(content.toString(), 'utf-8')
        } else if (headers.request.path === '/') {
            const ok = new Response(200)
            socket.write(ok.toString(), 'utf-8')
        } else {
            const notFound = new Response(404);
            socket.write(notFound.toString(), 'utf-8')
        }

        socket.end()
    })

    socket.on('close', () => {
        socket.end()
        server.close()
    })
})

server.listen(4221, 'localhost')
