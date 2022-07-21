import { connectSocket, IncomingMessage } from "./messenger.ts"

interface Bet {
  nick: string
  sub: number
  rating: number
  wager: number
}

const start = Date.now()
let stage = 'notstarted'
let bets: Bet[] = []
let betters: string[] = []

connectSocket((message: IncomingMessage, sendReply: (reply: string, recipient?: string) => void) => {
  if (message.data === '!sausage') {
    sendReply(`🌭 Uptime ${Date.now()-start}`)
  }

  if (message.nick === 'pickleandcroissant' || message.features.includes('moderator') || message.features.includes('admin')) {
    if (message.data.startsWith('!startbet') && stage === 'notstarted') {
      stage = 'started'
      bets = []
      betters = []
      sendReply('SAUSAGE BETTING STARTED! >Type "!bet <rating from 1 to 5>" to take a guess!')
    }

    if (message.data.startsWith('!results') && stage === 'started') {
      stage = 'notstarted'
      try {
        const split = message.data.split(' ')
        const rating = parseInt(split[1])
        let sausageStars = ''

        if (rating && rating >= 0 && rating <= 5) {
          for (let i = 0; i < 5; i++) {
            if (i < rating) {
              sausageStars += '🌭'
            } else {
              sausageStars += '💩'
            }
          }
          sendReply(`SAUSAGE BETTING ENDED! The sausage was ${sausageStars}`)
          let winners = 0
          let pot = 0
          for (const bet of bets) { // gather totals
            if ((bet.rating < 3) === (rating < 3)) {
              winners++
            } else {
              pot += 100 //bet.wager
            }
          }
          const eachWin = Math.floor(pot/winners)
          // for (const bet of bets) { // TODO: Take points from losers, give points to winners

          // }
          if (rating < 3) {
            sendReply(`${winners} people bet 2 🌭's or less. They won ${eachWin} points each!`)
          } else {
            sendReply(`${winners} people bet 3 🌭's or more. They won ${eachWin} points each!`)
          }
          bets = []
          betters = []
        } else {
          sendReply(`${message.nick} >Format as: "!results <rating from 1 to 5>"`, message.nick)
        }
      } catch (_) {
        sendReply(`${message.nick} >Format as: "!results <rating from 1 to 5>"`, message.nick)
      }
    }
  }

  if (message.data.startsWith('!bet')) {
    try {
      const split = message.data.split(' ')
      const rating = parseInt(split[1])
      // const wager = parseInt(split[2])

      if (rating && rating >= 0 && rating <= 5 /*&& wager && wager > 0 */&& !betters.includes(message.nick)) {
        betters.push(message.nick)
        bets.push({
          nick: message.nick,
          sub: message.sub || 0,
          rating,
          // wager
        } as Bet)

        sendReply(`${message.nick} Bet accepted!`, message.nick)
      } else {
        sendReply(`${message.nick} >Format as: "!bet <rating from 1 to 5>"`, message.nick)
      }
    } catch (_) {
      sendReply(`${message.nick} >Format as: "!bet <rating from 1 to 5>"`, message.nick)
    }
  }
})
