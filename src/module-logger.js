module.exports = function(bot) {
  bot.on('chat', (username, message, translate, jsonMsg, matches) => {
    bot.log('[chat] <' + username + '>: ' + message);
  });

  bot.on('whisper', (username, message, translate, jsonMsg, matches) => {
    bot.log('[whisper] <' + username + '>: ' + message);
  });

  bot.on('message', (jmes) => {
    bot.log(bot.jmes_to_text(jmes));
  });

  bot.on('kicked', (reason, loggedIn) => {
    bot.log('[bot.kicked] reason: ' + reason);
  });

  bot.on('death', () => {
    const nowPos = bot.entity.position
    bot.log('[bot.death] ' + bot.username + ' dead at pos:(' + `${nowPos.x.toFixed(1)}`+', '+`${nowPos.y.toFixed(1)}`+', '+`${nowPos.z.toFixed(1)}` + '), dimensio: '+ bot.game.dimension + '.');
    
  });

  bot.on('spawn', () => {
    const nowPos = bot.entity.position
    bot.log('[bot.death] ' + bot.username + ' dead at pos:(' + `${nowPos.x.toFixed(1)}`+', '+`${nowPos.y.toFixed(1)}`+', '+`${nowPos.z.toFixed(1)}` + '), dimensio: '+ bot.game.dimension + '.');
    bot.safechat('Hello, World',2000);
  });
}