class RequestParser {
    constructor(buffer) {
        this.parts = buffer.toString().split('\r\n')
    }

    getRequestInfo() {
        const [request] = this.parts
        const [method, path, version] = request.split(/\s/)

        return { method, path, version }
    }

    getUserAgent() {
        const uaEntry = this.parts.find((search) => search.toLowerCase().includes('user-agent:'))
        const [, ua] = uaEntry.match(/User-Agent:\s(\S+)/) ?? []

        return ua;
    }

    getBody() {
       return this.parts[this.parts.length - 1]
    }
}

class Headers {
    method
    path
    version
    ua
    data

    constructor(method, path, version, ua, data) {
        this.method = method
        this.path = path
        this.version = version
        this.ua = ua
        this.data = data
    }

    static parse(buffer) {
        const parser = new RequestParser(buffer)

        const ua = parser.getUserAgent()
        const { method, path, version } = parser.getRequestInfo()
        const data = parser.getBody()

        return new Headers(
            method,
            path,
            version,
            ua,
            data
        )
    }
}

module.exports = Headers
