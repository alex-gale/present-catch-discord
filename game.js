const Discord = require('discord.js')
const GraphemeSplitter = require('grapheme-splitter')

const splitter = new GraphemeSplitter()

const GAME_WIDTH = 11
const GAME_HEIGHT = 11
const PIECES = {
  b: '⬛',
  s: '🎅🏻',
  p: '🎁'
}

const _2dArray = (w, h, val) => {
  var arr = []
  for (let i = 0; i < h; i++) {
    arr[i] = []
    for (let j = 0; j < w; j++) {
      arr[i][j] = val
    }
  }
  return arr
}

// renders array to string of emojis
const _render = (board) => {
  let text = ''

  for (const y of board) {
    for (const x of y) {
      text += PIECES[x]
    }

    text += '\n'
  }

  return text
}

// turns string of emojis into array
const _derender = (text) => {
  const gameBoard = _2dArray(GAME_WIDTH, GAME_HEIGHT, 'b')
  const textSplit = text.split('\n').map(line => splitter.splitGraphemes(line))

  textSplit.forEach((line, i) => {
    line.forEach((char, j) => {
      gameBoard[i][j] = Object.keys(PIECES).find(key => PIECES[key] === char)
    })
  })

  return gameBoard
}

const initiate = async (bot, msg, channel) => {
  channel.send(`${msg.author}`).then(message => message.delete())

  const gameBoard = _2dArray(GAME_WIDTH, GAME_HEIGHT, 'b')
  gameBoard[gameBoard.length - 1][5] = 's'

  const x = Math.floor(Math.random() * 11)
  gameBoard[0][x] = 'p'

  channel.send(new Discord.MessageEmbed()
    .setTitle('The Elves are all drunk again and are throwing all the presents out of a helicopter. Help Santa to catch them all and save Christmas!')
    .setDescription(_render(gameBoard))
    .setColor('#ffffff')
    .addField('Score', '0 / 10', true)
    .addField('Frame', '0', true)
  ).then(message => {
    message.react('⬅️')
    message.react('➡️')
    message.react('⬇️')
    message.react('❌')
  })
}

const action = async (bot, reaction, user) => {
  const gameMessage = reaction.message
  const gameChannel = reaction.message.channel
  const action = reaction.emoji.name
  let score = parseInt(gameMessage.embeds[0].fields[0].value)
  let frame = parseInt(gameMessage.embeds[0].fields[1].value)
  frame += 1

  if (action === '❌') {
    gameChannel.delete()
  } else {
    // calculate game board
    const gameString = reaction.message.embeds[0].description
    const gameBoard = _derender(gameString)
    const playerX = gameBoard[gameBoard.length - 1].findIndex(n => n === 's')

    // handle player movement
    if (action === '⬅️') {
      if (playerX > 0) {
        if (gameBoard[gameBoard.length - 1][playerX - 1] === 'p') {
          score += 1
        }

        gameBoard[gameBoard.length - 1][playerX] = 'b'
        gameBoard[gameBoard.length - 1][playerX - 1] = 's'
      }
    } else if (action === '➡️') {
      if (playerX < gameBoard[0].length - 1) {
        if (gameBoard[gameBoard.length - 1][playerX + 1] === 'p') {
          score += 1
        }

        gameBoard[gameBoard.length - 1][playerX] = 'b'
        gameBoard[gameBoard.length - 1][playerX + 1] = 's'
      }
    }

    // present gravity
    let presentCount = 0
    gameBoard.forEach((line, i) => {
      if (line.includes('p')) {
        const presentX = gameBoard[i].findIndex(n => n === 'p')
        gameBoard[i][presentX] = 'b'

        if (i + 1 < GAME_HEIGHT) {
          if (gameBoard[i + 1][presentX] === 's') {
            // if player is at next position
            score += 1
          } else {
            gameBoard[i + 1][presentX] = 'pe'
          }
        }
      } else if (line.includes('pe')) {
        const presentX = gameBoard[i].findIndex(n => n === 'pe')
        gameBoard[i][presentX] = 'p'
        presentCount += 1
      }
    })

    // present spawning
    if (frame % 5 === 0 && frame <= 45) {
      const newPresentX = Math.floor(Math.random() * 11)
      gameBoard[0][newPresentX] = 'p'
      presentCount += 1
    }

    if (presentCount > 0) {
      gameMessage.edit(new Discord.MessageEmbed()
        .setDescription(_render(gameBoard))
        .setColor('#ffffff')
        .addField('Score', `${score} / 10`, true)
        .addField('Frame', frame, true)
      ).then(() => {
        // delete reaction
        reaction.users.remove(user.id)
      })
    } else {
      gameMessage.delete()
      gameChannel.send(`Game Over! You caught ${score} / 10 presents. Closing channel in 5 seconds...`)

      setTimeout(() => {
        gameChannel.delete()
      }, 5000)
    }
  }
}

module.exports = { initiate, action }
