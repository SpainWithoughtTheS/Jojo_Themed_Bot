const express = require("express");
const app = express();

app.listen(3000, () => {
   console.log("Project is running!");
});

app.get("/", (req, res) => {
  res.send("Hello world!");
});

const Discord = require("discord.js");
const client = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_MEMBERS", "GUILD_MESSAGE_REACTIONS"] });

const prefix = '/'; // Prefix for commands

const reactionRoleMap = new Map();

client.on("messageCreate", async (message) => {
  if (message.content === "ping") {
    message.channel.send("Yare Yare Daze");
  }

  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'ban') {
    if (!message.member.permissions.has('BAN_MEMBERS')) {
      return message.reply('You do not have permission to use this command.');
    }

    const member = message.mentions.members.first();
    if (!member) {
      return message.reply('Please mention a valid member of this server.');
    }

    member.ban()
      .then(() => message.reply(`${member.user.tag} has been banned.`))
      .catch(error => {
        console.error(`Error banning member: ${error}`);
        message.reply('There was an error trying to ban that member.');
      });
  } else if (command === 'purge') {
    if (!message.member.permissions.has('MANAGE_MESSAGES')) {
      return message.reply('You do not have permission DIO.');
    }

    const deleteCount = parseInt(args[0]);

    if (!deleteCount || deleteCount < 1 || deleteCount > 100) {
      return message.reply('Please provide a number between 1 and 100 for the number of messages to delete idiot.');
    }

    message.channel.bulkDelete(deleteCount)
      .then(deleted => message.channel.send(`Deleted ${deleted.size} messages.`))
      .catch(error => {
        console.error(`Error purging messages: ${error}`);
        message.reply('There was an error trying to purge messages in this channel.');
      });
  } else if (command === 'rps') {
    const choices = ['rock', 'paper', 'scissors'];
    const botChoice = choices[Math.floor(Math.random() * choices.length)];

    const userChoice = args[0];

    if (!userChoice || !choices.includes(userChoice)) {
      return message.reply(`Please provide a valid choice: ${choices.join(', ')}`);
    }

    let result;
    if (userChoice === botChoice) {
      result = 'It\'s a tie!';
    } else if (
      (userChoice === 'rock' && botChoice === 'scissors') ||
      (userChoice === 'paper' && botChoice === 'rock') ||
      (userChoice === 'scissors' && botChoice === 'paper')
    ) {
      result = 'Yare Yare You win!';
    } else {
      result = 'I win DIO!';
    }

    message.reply(`You chose **${userChoice}**, I chose **${botChoice}**. ${result}`);
  } else if (command === 'reactionrole') {
    if (!message.member.permissions.has('MANAGE_ROLES')) {
      return message.reply('You do not have permission to use this command.');
    }

    if (args[0] === 'add') {
      const messageId = args[1];
      const emoji = args[2];
      const roleName = args.slice(3).join(' ');

      if (!messageId || !emoji || !roleName) {
        return message.reply('Please provide the message ID, emoji, and role name.');
      }

      const role = message.guild.roles.cache.find(role => role.name === roleName);
      if (!role) {
        return message.reply(`Role "${roleName}" not found.`);
      }

      const channel = message.guild.channels.cache.get(message.channel.id);
      if (!channel) {
        return message.reply('Channel not found.');
      }

      const reactionRole = { messageId, emoji, roleId: role.id, channelId: channel.id };
      reactionRoleMap.set(messageId, reactionRole);

      const targetMessage = await channel.messages.fetch(messageId).catch(console.error);
      if (!targetMessage) {
        return message.reply('Message not found. Please ensure the provided message ID is correct and the bot has access to the channel.');
      }

      await targetMessage.react(emoji).catch(console.error);

      message.reply(`Reaction role added. React with ${emoji} on the specified message to assign the role "${roleName}".`);
    } else if (args[0] === 'remove') {
      const messageId = args[1];

      if (!messageId) {
        return message.reply('Please provide the message ID.');
      }

      if (!reactionRoleMap.has(messageId)) {
        return message.reply('No reaction role found for the provided message ID.');
      }

      reactionRoleMap.delete(messageId);
      message.reply(`Reaction role removed for message ID: ${messageId}.`);
    } else {
      return message.reply(`Invalid command. Usage: ${prefix}reactionrole add <message ID> <emoji> <role name> OR ${prefix}reactionrole remove <message ID>`);
    }
  } else {
    message.reply('Invalid command. Available commands: ban, purge, rps, reactionrole');
  }
});

client.on("messageReactionAdd", async (reaction, user) => {
  if (reaction.partial) await reaction.fetch().catch(console.error);

  if (user.bot) return; // Ignore bot's own reactions

  const reactionRole = reactionRoleMap.get(reaction.message.id);
  if (reactionRole && reactionRole.emoji === reaction.emoji.name && reaction.message.channel.id === reactionRole.channelId) {
    const role = reaction.message.guild.roles.cache.get(reactionRole.roleId);
    const member = reaction.message.guild.members.cache.get(user.id);

    if (role && member) {
      member.roles.add(role).catch(console.error);
    }
  }
});

client.login("Your Bot token here");
