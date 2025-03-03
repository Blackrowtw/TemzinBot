const delay = require('delay');
const Vec3 = require('vec3').Vec3;
const Movements = require('mineflayer-pathfinder').Movements
const { GoalNear, GoalFollow, GoalInvert } = require('mineflayer-pathfinder').goals

module.exports = function(bot) {
  const mcData = require('minecraft-data')(bot.version);
  const defaultMove = new Movements(bot, mcData);
  defaultMove.allowFreeMotion = true;
  
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

  setInterval(() => {
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

  setInterval(() => {
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
  }, 200);
}
