const debug = require('debug')('botium-connector-botkit-websocket')
const WebSocket = require('ws')

const Capabilities = {
  BOTKIT_SERVER_URL: 'BOTKIT_SERVER_URL'
}

class BotiumConnectorBotkitWebsocket {
  constructor ({ queueBotSays, caps }) {
    this.queueBotSays = queueBotSays
    this.caps = caps
    this.counter = 1
  }

  Validate () {
    debug('Validate called')

    if (!this.caps[Capabilities.BOTKIT_SERVER_URL]) {
      throw new Error('BOTKIT_SERVER_URL capability required')
    }
    return Promise.resolve()
  }

  Build () {
    debug('Build called')
  }

  s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }

  Start () {
    debug('Start called')
    this.userId = this.s4() + this.s4() + "-" + this.s4() + "-" + this.s4() + "-" + this.s4() + "-" + this.s4() + this.s4() + this.s4()

    const socket = new WebSocket(this.caps[Capabilities.BOTKIT_SERVER_URL])
    this.socket = socket

    socket.on('message', (encodedMessage) => {
      const message = JSON.parse(encodedMessage)
      if (message.text) {
        debug('Bot says ' + message.text)
        this.queueBotSays({ sender: 'bot', messageText: message.text })
      } else {
        debug('Received Websocket Message without text: ' + encodedMessage)
      }
    })

    return new Promise((resolve, reject) => {
      socket.on('open', function () {
        socket.send(JSON.stringify({
          type: "hello",
          user: this.userId,
          channel: "socket",
          user_profile: null
        }));

        // wait 10 sec
        setTimeout(()=> {}, 10000);

        console.log("websocket open, user says hello to bot")

        resolve()
      }.bind(this))
      socket.on('error', function (err) {
        reject(err)
      })
    })
  }

  UserSays ({messageText}) {
    debug('User says ' + messageText)
    const message = {
      type: 'message',
      text: messageText,
      user: this.userId,
      channel: 'socket'
    }

    return new Promise((resolve, reject) => {
      this.socket.send(JSON.stringify(message), {}, (err) => {
        if (err) {
          reject(err)
        }
        resolve()
      })
    })
  }

  Stop () {
    debug('Stop called')

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          this.socket.terminate()
          resolve()
        } catch (err) {
          reject(err)
        }
      }, 1000)
    })
  }

  Clean () {
    debug('Clean called')

    return Promise.resolve()
  }
}

module.exports = {
  PluginVersion: 1,
  PluginClass: BotiumConnectorBotkitWebsocket
}
