用途：
=========
- 製作一款可以在遊戲中使用指令控制的Bot，讓他前往指定地點掛機且斷線可以重新連線。
- 看了很多款，最後選擇使用TemzinBot為基底。
   因為其代碼看起來有條理，且基礎功能完備(log紀錄、斷線重連功能、模組化的系統)，也是很好的學習對象。
- 添加一些額外的功能。為了方便使用，或是好玩，順便學習JavaScript。

功能：
=========
- v1.0.0
  - 將原本1.17的Bot，改為可在1.18執行。
  - 待機狀態互動來自TemzinBot自帶的。
  - stat : 回報目前Bot的狀態
  - come : 來到玩家目前所在位置
  - follow : 跟隨指定玩家
  - drop : 丟出一組物品
  - geton : 騎上最近的實體
  - getoff : 下車
  - aatk : AutoAttack 選定最近的實體為目標，再進行自動攻擊直到停止
  - stop : 停止目前的行動回到待機狀態
  - kick : 踢Bot下線 (會連回來)

TODO：
=========
- [ ] aatk 自動攻擊加入攻擊設定間隔的參數，修正攻擊距離有夠長的怪異現象。
- [ ] drop 加入 drop all 一次丟棄全部，進階則是能找到附近的箱子全放進去。
- [ ] 加入定義Bot切換密語回話，回話給Owner、等功能。
- [ ] 搞清楚如何實現同步執行函數的方式，優化代碼。
- [ ] 將函數納入Class類裡頭進行分類，預計分為 Action:持續行動類、Attack:攻擊與裝備類、Call短功能執行類。
- [ ] 納入更多autoeat、armorManager、pvp、mineflayerViewer等等plugin的功能。


=========
=========
=========
TemzinBot
=========

mineflayerを利用した適当bot


## Features

  - I'M BOT!
  - Modulized functions
    - move to the designated position
    - follow player
    - greeting responce
    - 3sec countdown
    - data recorder
  - Commandline interface
  - Dockerize support

## Installation

    $ git clone https://github.com/fubira/TemzinBot
    $ cd TemzinBot
    $ npm install

## Environment

.env.sample をコピーして .env を作成し、環境に合わせて内容を書き換えてください。

```
MC_HOST="localhost"
MC_PORT="25565"
MC_USERNAME="user@foo.bar"
MC_PASSWORD="password"
```

## Usage

    $ npm start


## Dockerize

### Build docker image

```bash
docker build -t <yourname>/temzinbot .
```

### Run docker container

```bash
docker run -d -it \
  -e MC_HOST=localhost \
  -e MC_PORT=25565 \
  -e MC_USERNAME=username \
  -e MC_PASSWORD=password \
  --name temzinbot \
  <yourname>/temzinbot
```

## License

[MIT](https://github.com/fubira/TemzinBot/blob/master/LICENSE,md)

## Author

[fubira](https://github.com/fubira)
