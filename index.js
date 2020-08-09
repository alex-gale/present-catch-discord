const Discord = require('discord.js')
const shortid = require('shortid')
const bot = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] })
require('dotenv').config()

const game = require('./game')

shortid.characters('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ._')

const prefix = '!'

bot.on('ready', () => {
  bot.user.setActivity(`Present Catch - ${prefix}present`)
  console.log('Present Catch Bot Started')

  // clear out old channels
  const managedChannels = bot.channels.cache.array().filter(c => c.name.startsWith('🎁'))
  managedChannels.forEach(channel => {
    channel.messages.fetch({ limit: 1 })
      .then(messages => {
        if (messages.last().content) {
          channel.delete()
        }
      })
  })
})

bot.on('messageReactionAdd', async (reaction, user) => {
  // add reaction to cache if partial
  if (reaction.partial) {
    try {
      await reaction.fetch()
    } catch (error) {
      console.error(error)
    }
  }

  const VALID_REACTIONS = ['⬅️', '➡️', '⬇️', '❌']
  // delete if not valid reaction
  if (!VALID_REACTIONS.includes(reaction.emoji.name)) return reaction.remove()
  // check channel and reaction count
  if (reaction.count < 2 || !reaction.message.channel.name.startsWith('🎁')) return

  game.action(bot, reaction, user)
})

bot.on('message', msg => {
  if (msg.author.bot) return
  if (msg.content !== '!present') return
  if (msg.channel.name.startsWith('🎁') || msg.channel.name !== 'present-catch') return msg.delete()

  var guild = msg.guild

  const managedChannels = guild.channels.cache.array().filter(c => c.name.startsWith('🎁'))
  const channelName = `🎁-${msg.author.tag.toLowerCase().replace('#', '')}`

  if (managedChannels.map(c => c.name).includes(channelName)) {
    return msg.channel.send(new Discord.MessageEmbed()
      .setDescription(`${msg.author} You are already playing Present Catch!`)
      .setColor('#bd230e')
    ).then(warning => {
      msg.delete()
      setTimeout(() => {
        warning.delete()
      }, 3000)
    })
  }

  guild.channels.create(channelName, {
    permissionOverwrites: [
      {
        id: guild.id,
        deny: ['VIEW_CHANNEL']
      },
      {
        id: bot.user.id,
        allow: ['VIEW_CHANNEL', 'SEND_MESSAGES']
      },
      {
        id: msg.author.id,
        allow: ['VIEW_CHANNEL'],
        deny: ['SEND_MESSAGES']
      }
    ]
  }).then((channel) => {
    const category = guild.channels.cache.find(c => c.name === 'Present Catch' && c.type === 'category')
    if (!category) throw new Error('Present Catch category channel does not exist')
    channel.setParent(category.id)

    game.initiate(bot, msg, channel)
    msg.delete()
  }).catch(console.error)
})

bot.login(process.env.TOKEN)
