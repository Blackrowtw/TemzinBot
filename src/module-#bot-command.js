const pathfinder = require('mineflayer-pathfinder').pathfinder
const Movements = require('mineflayer-pathfinder').Movements
const { GoalNear, GoalFollow, GoalInvert } = require('mineflayer-pathfinder').goals
// const { pathfinder, Movements, goals } = require('mineflayer-pathfinder')
// const GoalFollow = goals.GoalFollow
// const { GoalNear } = require('mineflayer-pathfinder').goals

module.exports = function(bot) {
bot.loadPlugin(pathfinder)
  const mcData = require('minecraft-data')(bot.version);
  const defaultMove = new Movements(bot, mcData); // 定義尋路機制的基本設定
    defaultMove.allowFreeMotion = true;  
    defaultMove.allow1by1towers = false // Do not build 1x1 towers when going up
    defaultMove.canDig = false // Disable breaking of blocks when pathing 
    defaultMove.scafoldingBlocks.push(mcData.itemsByName['netherrack'].id) // Add nether rack to allowed scaffolding items
    bot.pathfinder.setMovements(defaultMove) // Update the movement instance pathfinder uses

  var autoattacking = 0
  var aatk_clock = 1000
  var following = 0
  var coming = 0
  var staying = 1

  function checkStaying() {
    bot.log('[bot.Command] : Call checkStaying()')
    if (staying = 1) {
      callModuleActionFollow()
    } else {
      return
    }
  }
  checkStaying();

  bot.on('death',() => {  
    autoattacking = 0
    following = 0
    coming = 0
    staying = 1
    bot.pathfinder.setGoal(null)
    bot.chat('oh~ Nyo~')
  });

  bot.on('chat', async (username, message) => {
    if (username === bot.username) return // 排除機器人自己說的
    command = message.split(' ') // 將聊天訊息以空白分隔
    
    switch (command[0]) {
      case 'list':
        let items = bot.inventory.items()
        items = bot.inventory.items()
        function itemToString (item) {
          if (item) {
            return `${item.name} x ${item.count}`
          } else {
            return '(nothing)'
          }
        }
  
        const output = items.map(itemToString).join(', ')
        if (output) {
          bot.chat(output)
        } else {
          bot.chat('empty')
        }
        break
      case 'stat': 
        bot.chat("Health :" + ' ' + bot.health)
        bot.chat("Food :" + ' ' + bot.food + ' | ' + bot.foodSaturation)
        bot.chat("XP Levels :" + ' ' + bot.experience.level)
        bot.chat("SpawnPoint :" + ' ' + bot.spawnPoint)
        bot.chat("正在執行 :" + 
          ' Attack-' +  `${autoattacking}` + 
          ' | Follow-' + `${following}` + 
          ' | Come-' + `${coming}` + 
          ' | Stay-' + `${staying}`)
        break
      case 'come':
        await comeToMe(username)
        break
      case 'follow':
        if (command.length === 2) { // 如果輸入的訊息有兩個的話
          username = command[1] }; // 玩家名字 = 第2項
        await followPlayer(username)
        break
      case 'drop':
        tossNext()
        break
      case 'geton':
        GetOn()
        break
      case 'getoff':
        bot.log('[bot.Command] : Call bot.dismount()')
        bot.dismount()
        break
      case 'aatk':
        if (command.length === 2) { // 如果輸入的訊息有兩個的話
          aatk_clock = command[1] }; // aatk 的時間設為後者
        await AutoAttack()
        break
      case 'stop':
        Stop()
        break
      case 'kick':
        bot.end()
        break
    }
  })


  async function comeToMe(username) {
    bot.log('[bot.Command] : Call comeToMe(username)')
    const target_come = bot.players[username] ? bot.players[username].entity : null
    if (!target_come) {
      bot.randomchat(['無理だわ','無理じゃね','いけない'], 1000);
      return
    }
    await new Promise((resolve, reject) => {
      bot.chat('I am coming to '+ `${username}`)
      bot.log('[bot.pathfinder] to : ' + target_come.position)
      coming = 1
      staying = 0

      const p = target_come.position

      bot.pathfinder.setMovements(defaultMove)
      bot.pathfinder.setGoal(new GoalNear(p.x, p.y, p.z, 1))

      // 每一秒檢查 bot 是否正在移動
      var isComing = setInterval(()=>{
        if (bot.pathfinder.isMoving()) {
          bot.log("[bot.pathfinder] : Moving ")
        } else {
          bot.log("[bot.pathfinder] : Arrive ")
          bot.chat('I arrived, at location ('+ `${p.x.toFixed(1)}`+', '+`${p.y.toFixed(1)}`+', '+`${p.z.toFixed(1)}` +') now')
          coming = 0
          staying = 1
          checkStaying()
          clearInterval(isComing)  // 結束每秒循環
          return
        }
      },1000)
    resolve();  // 跳出非同步，繼續執行
    })
  } 

  async function followPlayer(username) {
    bot.log('[bot.Command] : Call followPlayer(username)')
    const target_follow = bot.players[username] ? bot.players[username].entity : null
    if (!target_follow) {
      bot.randomchat(['無理だわ','無理じゃね','いけない'], 1000);
      return
    }

    await new Promise((resolve, reject) => {
      if (following === 1) {bot.chat('Already following '+ `${username}` + ' ...'); return}

      bot.chat('I am following '+ `${username}` +' now')
      bot.log('[bot.pathfinder] : Following ' + target_follow.name);
      following = 1
      staying = 0

      bot.pathfinder.setMovements(defaultMove)
      bot.pathfinder.setGoal(new GoalFollow(target_follow, 3), true)

      // 每一秒檢查 bot 是否正在移動
      var isAattacking = setInterval(()=>{
        if (following === 0) {
          bot.chat('I will stay here.')
          bot.log('[bot.Command] : Stop followPlayer(username)')
          checkStaying()
          clearInterval(isAattacking)  // 結束每秒循環  
          return
        }
        if (bot.pathfinder.isMoving()) {
          bot.log("[bot.pathfinder] : Moving ")
        } else {
          bot.log("[bot.pathfinder] : Stucking ")
          return
        }
      },1000)
    resolve();  // 跳出非同步，繼續執行
    })
    bot.log('[bot.Command] : Check followPlayer(username)')
  }

  function Stop() {
    bot.log('[bot.Command] : Call Stop()')
    autoattacking = 0
    following = 0
    coming = 0
    staying = 1
    bot.pathfinder.setGoal(null)
    bot.chat('Okay,')
    checkStaying();
  }

  function tossNext () {
    if (bot.inventory.items().length === 0) {bot.chat('empty'); return}
    const item = bot.inventory.items()[0]
    bot.tossStack(item, tossNext)
  }


    
  async function AutoAttack() {
    bot.log('[bot.Command] : Call AutoAttack()')
    // const target_AutoAttack = bot.players[username] ? bot.players[username].entity : null
    // if (!target_AutoAttack) {
    //   bot.randomchat(['無理だわ','無理じゃね','いけない'], 1000);
    //   return
    // }
    await new Promise((resolve, reject) => {
      if (autoattacking === 1) {bot.chat('Already auto attacking ...'); return}
      autoattacking = 1
      staying =0
      const entity = bot.nearestEntity()
      // const entity_HP = entity.health
      if (entity => entity.type === 'mob') {
        bot.chat('I am attacking '+ `${entity.name}` + ' at ('+ `${entity.position.x.toFixed(1)}`+', '+`${entity.position.y.toFixed(1)}`+', '+`${entity.position.z.toFixed(1)}`+')');
        var isAattacking = setInterval(()=>{
          bot.lookAt(entity.position.offset(0, bot.entity.height, 0))
          bot.attack(entity, true)
          //目標太遠 或 HP = 0 時停止
          if (entity.health === 0 || bot.entity.position.distanceTo(entity.position) > 6) {
            bot.chat('The ' + `${entity.name}` + ' is gone.')
            bot.log('[bot.Command] : Stop AutoAttack()')
            autoattacking = 0
            staying = 1
            checkStaying()
            clearInterval(isAattacking)  // 結束每秒循環  
          }
          if (autoattacking === 0) {
            bot.chat('Stop auto attacking.')
            bot.log('[bot.Command] : Stop AutoAttack()')
            clearInterval(isAattacking)  // 結束每秒循環  
            return
          }
        },aatk_clock)
      } else {
          bot.chat('no nearby mob')
      }
    resolve();  // 跳出非同步，繼續執行
    })
    bot.log('[bot.Command] : Check AutoAttack() ')
  }

  function GetOn() {
      bot.log('[bot.Command] : Call GetOn()')
      entity = bot.nearestEntity((entity) => { return entity.type === 'object' })
      if (entity) {
        bot.mount(entity)
      } else {
        bot.chat('no nearby objects')
      }
  }

  function callModuleActionFollow() {    
    bot.log('[bot.Command] : Call callModuleActionFollow()')
    const Vec3 = require('vec3').Vec3;

    // ロックして追いかける対象target    //鎖定和追逐的目標
    var target_entity = undefined;

    function getTargetEntity() {
      return target_entity;
    }
    function setTargetEntity(entity = undefined) {
      if (target_entity !== entity) {
        target_entity = entity;
      }
    }
    
    // 追いかけないが注目する対象 interest    //不追逐但關注的目標
    var interest_entity = undefined;

    function getInterestEntity() {
      return interest_entity;
    }
    function setInterestEntity(entity = undefined) {
      if (interest_entity !== entity) {
        interest_entity = entity;
        if (interest_entity) {
          var name = interest_entity.name !== undefined ? interest_entity.name : interest_entity.username;
          var type = interest_entity.type;
          var kind = interest_entity.kind;
          bot.log('[bot.setInterestEntity] ' + bot.username + ' is interested in ' + name + ' (' + type + (kind !== undefined ? ':' + kind : '') + ')');
        }
      }
    }

    function RotToVec3(pitch, yaw, rad) {
      return new Vec3(-rad * Math.cos(pitch) * Math.sin(yaw),
                      rad * Math.sin(pitch),
                      -rad * Math.cos(pitch) * Math.cos(yaw));
    }

    function Vec3ToRot(vec) {
      return {
        'pitch': Vec3ToPitch(vec),
        'yaw': Vec3ToYaw(vec),
        'radius': vec.distanceTo(new Vec3(null))
      };
    }

    function Vec3ToPitch(vec) {
      var groundDist = Math.sqrt(vec.x * vec.x + vec.z * vec.z);
      return Math.atan2(-vec.y, groundDist);
    }

    function Vec3ToYaw(vec) {
      var yaw;
      if (vec.x != 0.0) {
        yaw = Math.atan2(vec.x, vec.z)
      } else {
        yaw = (vec.z >= 0) ? Math.PI / 2 : -Math.PI / 2;
      }
      return yaw;
    }

    bot.on('entitySwingArm', (entity) => {
      var distance = bot.entity.position.distanceTo(entity.position);

      if (entity.type === 'player') {
        if (distance < 4) {
          var lookat = RotToVec3(entity.pitch, entity.yaw, distance);
          var dt = bot.entity.position.distanceTo(lookat.add(entity.position));

          if (dt < 0.3) {
            // 近接距離で顔を見て殴られたら追いかける対象として認識する   // 近距離被打時，加入目標
            bot.log('[bot.entitySwingArm] ' + entity.username + ' hit me!');
            setTargetEntity((getTargetEntity() !== entity) ? entity : undefined);
          }
        }
      }
    });

    bot.on('playerCollect', (collector, collected) => {
      // 注目しているアイテムが誰かに拾われたら注目を解除する    // 東西被撿走時，解除注視
      if (getInterestEntity() === collected) {
        setInterestEntity();

        // 拾ったのが自分以外なら拾った人を注目する   //自己以外的人撿到東西，注視該人
        if (collector !== bot.entity) {
          setInterestEntity(collector);      
        }
      }
    });

    bot.on('entityMoved', (entity) => {
      var distance = bot.entity.position.distanceTo(entity.position);

      // 至近距離にプレイヤーがいる場合少し動く  //距離太近的時候 自動遠離
      if (entity.type === 'player' && distance < 0.8) {
        var botpos = bot.entity.position.clone();
        var entpos = entity.position.clone();
        botpos.y = entpos.y = 0;
        botpos.subtract(entpos);
        bot.entity.velocity.add(botpos.scaled(0.2));
      }
      
      
      if (distance < 3) {
        if (!getInterestEntity()) {
          // 注目している人がいないなら注目   // 如果沒有人注視的話，切換注視目標
          setInterestEntity(entity);
        } else {
          // 既に注目している人が居る場合、その人よりも近ければ注目を切り替える  //已經有了正在注視的目標，但有人更接近的話則改變目標
          if (bot.entity.position.distanceTo(getInterestEntity().position) > distance)
            setInterestEntity(entity);
        }
      }

      if (distance > 8) {
        // 注目している人が一定以上離れたら注目解除  //注視的人離得太遠了 則解除目標
        if (getInterestEntity() === entity)
          setInterestEntity();
      }
    });


    let isStaying01 = setInterval(() => {
      var target = getTargetEntity();
      var interest = getInterestEntity();
      
      var entity;
      if (target) {
        entity = target;
      } else if (interest) {
        entity = interest;
      }

      if (entity)
      {
        var pos = bot.entity.position.clone();
        pos.subtract(entity.position);
        var rot = Vec3ToRot(pos);
    
        // 対象に向く  // 適用的目標(?)
        if (Math.abs(rot.yaw - bot.entity.yaw) > 0.05 || Math.abs(rot.pitch - bot.entity.pitch) > 0.05) {
          bot.look(rot.yaw, rot.pitch, false, false);
        }
    
        if (target && target.onGround /*&& target.controlState['jump'] === false*/) {
          // 対象との距離に応じて移動する  // 根據到目標的距離，相對應的移動(?)
          var dist = bot.entity.position.distanceTo(entity.position);
          if(dist > 3) {
            bot.pathfinder.setMovements(defaultMove);
            bot.pathfinder.setGoal(new GoalInvert(new GoalFollow(target, 1)), true);
          } else {
            bot.pathfinder.setGoal(null);
          }
        }
      }
    }, 1000);

    let isStaying02 = setInterval(() => {
      var interest = getInterestEntity();
      if (interest) {
        var isSneaking = false;
        var isJumping = false;
        
        if (interest.kind === 'Drops') {
          isSneaking = true;
        } else if (interest.kind) {
          if (bot.controlState['front'] === true) {
            // モノ以外が足元にある場合ジャンプする   // 如果腳下有其他東西則跳開
            isJumping = true;
          }
        } else {
          if (interest.metadata['0'] === 2) {
            // 相手がしゃがんでいたらしゃがむ  // 如果對方蹲下，也跟著蹲下
            isSneaking = true;
          } else {
            // 注目先が自分よりも2m以上下の位置にいたらしゃがむ  //如果你的注意力在2m以下，那麼會蹲下
            isSneaking = (bot.entity.position.y - interest.position.y > 2 );
          }
        }
        bot.setControlState("sneak", isSneaking);
        bot.setControlState("jump", isJumping);
      }

      // 如果 staying 狀態 === 0 則停止循環
      if (staying === 0) {
        bot.log('[bot.Command] : Stop callModuleActionFollow()')
        clearInterval(isStaying01)
        clearInterval(isStaying02)  // 結束每秒循環
        return
      }
    }, 200);
  }



}

  /*
  bot.navigate.on('cannotFind', (closestPath) => {
    // bot.randomchat(['うーん',　'途中までなら'], 1000);
    bot.log('[bot.navigate] cannotFind');
    bot.pathfinder.setMovements(defaultMove);
    bot.pathfinder.setGoal(new GoalNear(closestPath)).navigate.walk(closestPath);
  })
  */

// bot.on('chat', async (username, message) => {
//   if (username === bot.username) return
//   command = message.split(' ')
//   switch (command[0]) {
//     case 'list':
//       let items = bot.inventory.items()
//       items = bot.inventory.items()
//       function itemToString (item) {
//         if (item) {
//           return `${item.name} x ${item.count}`
//         } else {
//           return '(nothing)'
//         }
//       }

//       const output = items.map(itemToString).join(', ')
//       if (output) {
//         bot.chat(output)
//       } else {
//         bot.chat('empty')
//       }
//       break
//     case 'sway':
//       if (command[1] == '-') { sway = 1 } else if (command[1] == '+') { sway = -1}
//       save()
//       break
//     case 'shift':
//       if (command[1] == '-') { shift = 1 } else if (command[1] == '+') { shift = -1}
//       save()
//       break
//     case 'prepare':
//       digging = 1
//       digPrepare()
//       break
//     case 'lava':
//       lavaExec()
//       break
//     case 'cleardigged':
//       linesDigged = 0
//       bot.chat('clear digged lines')
//       save()
//       break
//     case 'dig':
//       digging = 1
//       offset = 0
//       dig()
//       linesDigged += 1
//       break
//     case 'stop':
//       digging = 0
//       bot.stopDigging()
//       break
//     case 'come':
//       const target = bot.players[username]?.entity
//       if (!target) {
//         bot.chat("I don't see you !")
//         break
//       }
//       const { x: playerX, y: playerY, z: playerZ } = target.position
//       bot.pathfinder.setGoal(new GoalNear(playerX, playerY, playerZ, RANGE_GOAL))
//       break
//     case 'home':
//       digging = 0
//       bot.stopDigging()
//       bot.pathfinder.goto(new GoalNear(HomeX, HomeY, HomeZ, 0))
//       break
//     case 'chest':
//       watchChest(['chest'], 1, 1)
//       break
//     case 'sethome':
//       HomeX = bot.entity.position.x.toFixed(1)
//       HomeY = bot.entity.position.y.toFixed(1)
//       HomeZ = bot.entity.position.z.toFixed(1)
//       bot.chat(`set home to ${HomeX} ${HomeY} ${HomeZ}`)
//       save()
//       break
//     case 'setlimit':
//       linesEnd = Number(command[1])
//       bot.chat(`end digging on ${linesEnd} lines`)
//       save()
//       break    
//     case 'state':
//       let out = ''
//       out = ''
//       if (restorePoint) { out += 'found restore points, do not turn off the bot, ' }
//       out += `lines digged: ${linesDigged}/${linesEnd}, `
//       if (sway == 1) { out += 'sway: -, ' } else { out += 'sway: +, ' }
//       if (shift == 1) { out += 'shift: -, ' } else { out += 'shift: +, ' }
//       if (digging) { out +=  'digging '} 
//       if (bot.pathfinder.isMoving()) {out += 'now moving'} else { out += 'staying ' }
//       if (chesting) { out += 'chesting '}
//       bot.chat(out)
//       break
//     case 'save':
//       save()
//       break
//     case 'exit': 
//       save()
//       digging = 0
//       bot.stopDigging()
//       bot.quit()
//       process.exit(1)
//     case 'm': 
//       checkMobs()
//       break
//   }
// })
//