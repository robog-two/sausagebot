export interface Message {
  data: string
}

export interface PrivMessage {
  data: string
  nick: string //the recipient of the message
}

export interface IncomingMessage extends Message {
  features: string[] // Features of their account, like "bot" or different custom flairs ("flair13" is T1 sub flair in keffals chat)
  nick: string // Their current username
  pronouns: number // The number of their pronouns corresponding to dropdown in profile settings
  sub: number // The tier of their subscription
  timestamp: number
}

let lastMessage = ''

export const profile = {
  nick: 'MarkFluffalo',
  pronouns: 6,
  sub: 0,
  features: ['bot'],
}

export const cookie = Deno.env.get('SAUSAGE_BOT_COOKIES') || ''

export async function connectSocket(onIncoming: (message: IncomingMessage, sendReply: (reply: string, recipient?: string) => void) => void): Promise<void> {
  await fetch('https://www.keffals.gg/api/chat/me', {
    headers: {
      cookie,
    }
  })

  const socket: WebSocketConnection = await (new WebSocketStream(
    'wss://www.keffals.gg/afori35LIjEzhFBYR02kw7j3tk1h3wHWQiE3cM7',
    {
      headers: {
        cookie
      }
    }
  )).connection

  const readable = socket.readable.getReader()
  const writeable = socket.writable.getWriter()

  writeable.write("JOIN " + JSON.stringify({
    ...profile,
    timestamp: Date.now(),
  }))
  console.log('Connected to keffals chat')

  function sendReply(reply: string, recipient?: string) {
    console.log(`Sending reply: ${reply}`)
    if (lastMessage === reply) {
      reply = reply + '.'
    }
    writeable.write((recipient ? `PRIVMSG ${recipient}` : 'MSG ') + JSON.stringify({
      data: reply,
      timestamp: Date.now(),
    } as IncomingMessage))
    lastMessage = reply
  }

  setInterval(async () => {
    const rawMessage = await readable.read()

    const stringMessage = rawMessage.value as string
    if (stringMessage.startsWith('MSG ')) {
      const message = JSON.parse(stringMessage.slice(4)) as IncomingMessage
      console.log(`${message.nick}: ${message.data}`)
      onIncoming(message, sendReply)
    } else {
      // console.log(event.data)
    }
  }, 0)
}
