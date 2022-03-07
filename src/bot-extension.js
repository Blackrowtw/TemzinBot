const dateformat = require('dateformat');
const delay = require('delay');
const readline = require('readline');

module.exports = function(bot) {
  this.bot = bot;
  this.bot.hasInterrupt = false;
  
  bot.on('login', () => {
    bot.log('[bot.login] user: [' + bot.username + ']');
    bot.log('[bot-extension.open]');
    bot.init_readline();
  });

  bot.on('end', () => {
    bot.log('[bot-extension.end]');
    bot.close_readline();
  });

  // 入力処理を有効にする  啟用輸入處理
  this.bot.init_readline = () => {
    this.rl = readline.createInterface({input: process.stdin, output: process.stdout});
    this.rl.setPrompt('> ');

    // 入力はチャットに流す  聊天輸入 
    this.rl.on('line', (line) => {
      this.safechat(line);
    });

    this.rl.on('SIGINT', () => {
      this.bot.log('[bot.readline] SIGINT');
      this.bot.hasInterrupt = true;
      delay(1000).then(() => { 
        this.bot.quit();
      });
    })
  }
  
  this.bot.close_readline = () => {
    this.rl.close();
  }

  // prompt処理とかをちゃんとやるログ出力   正確提示處理的日誌輸出
  this.bot.log = (...args) => {
    readline.cursorTo(process.stdout, 0);

    if (typeof args[0] === 'string') {
      // 出力の頭に現在時刻を挿入  在輸出的開頭插入當前時間
      args[0] = '[' + dateformat(new Date(), 'isoTime') + '] ' + args[0];
    }
    console.log.apply(console, args);

    if (typeof this.rl !== 'undefined')
      this.rl.prompt(true);
  }

  // jmes形式のメッセージからテキスト成分だけを抜き出して文字列で返す   僅從 jmes 格式消息中提取文本組件並將其作為字符串返回 
  this.bot.jmes_to_text = (jmes) => {
    var message = '';
    if (jmes.text)
      message = jmes.text;

    if (jmes.extra)
      jmes.extra.forEach((v, i, a) => {
        message += v.text;
      });
    return message;
  }

  /// 同じメッセージのループ送信、短時間での大量送信などを   同一條消息的循環傳輸、短時間的海量傳輸等。
  /// 防ぐ仕組みを入れたチャット送信メソッド  帶有防止機制的聊天發送方法 
  this.safechat_send_text_cache = [];
  this.safechat_last_send_time = new Date().getTime();
  this.safechat_continuous_count = 0;

  this.safechat = (text) => {
    var current_time = new Date().getTime();
    var elapsed_ms = current_time - safechat_last_send_time;

    if (!text)
      return;

    if (elapsed_ms > 1000) {
      this.safechat_continuous_count = 0;
    }

    this.safechat_continuous_count++;
    if (this.safechat_continuous_count > 10) {
      // this.bot.log('[bot.safechat] *REJECTED* 短時間での大量メッセージが送信がされました');
      this.bot.log('[bot.safechat] * REJECTED * 短時間內發送了大量消息 ');
      return;
    }

    if (elapsed_ms > 3000) {
      // 一定時間経過したら直前のメッセージは忘れる  一定時間後忘記上一條消息 
      this.safechat_send_text_cache = [];
    }

    if (this.safechat_send_text_cache.find((value)=>{ return value === text; })) {
      // this.bot.log('[bot.safechat] *REJECTED* 一定時間内に同一の文章が複数回送信されました: ' + text);
      this.bot.log('[bot.safechat] * REJECTED * 在一定時間內多次發送同一句話： ' + text);
      return;
    }
    this.safechat_send_text_cache.push(text);

    this.safechat_last_send_time = current_time;
    this.bot.chat(text);
  }

  this.bot.safechat = (text, delay_ms = 800) => {
    delay(delay_ms).then(() => { this.safechat(text); });
  }

  // 配列で定義された複数の文言のうちの一つをランダム選択してチャット送信する  隨機選擇數組中定義的多個單詞之一，通過聊天發送 
  this.bot.randomchat = (messages, delay_ms = 800) => {
    var message;
    if (Array.isArray(messages)) {
      message = messages[Math.floor(Math.random() * messages.length)]
    } else {
      message = messages;
    }
    delay(delay_ms).then(() => { this.safechat(message); });
  }
}
