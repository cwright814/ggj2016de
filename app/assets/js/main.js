
var stage, w, h, loader;
var ground, character;
var KEYCODE_w = 37, 
    KEYCODE_A = 65,
    KEYCODE_S = 83, 
    KEYCODE_D = 68;

function init() {
    stage = new createjs.Stage("arena");

    // grab canvas width and height for later calculations:
    w = stage.canvas.width;
    h = stage.canvas.height;

    manifest = [
        {src: "spritesheet_placeholder.png", id: "character"},
        {src: "ground.png", id: "ground"}
    ];

    loader = new createjs.LoadQueue(false);
    loader.addEventListener("complete", handleComplete);
    loader.loadManifest(manifest, true, "assets/sprites/");
}

function handleComplete() {

    var groundImg = loader.getResult("ground");
    ground = new createjs.Shape();

    hill2 = new createjs.Bitmap(loader.getResult("hill2"));

    ground.graphics.beginBitmapFill(groundImg).drawRect(0, 0, w + groundImg.width, groundImg.height);
    ground.tileW = groundImg.width;
    ground.y = h - groundImg.height;

    var spriteSheet = new createjs.SpriteSheet({
        framerate: 30,
        "images": [loader.getResult("character")],
        "frames": {"regX": 82, "height": 292, "count": 64, "regY": 0, "width": 165},
        // define two animations, run (loops, 1.5x speed) and jump (returns to run):
        "animations": {
            "run": [0, 25, "run", 1],
            "stand": [58, 60, "stand", 0.25],
            "jump": [26, 63, "run"]
        }
    });

    character = new createjs.Sprite(spriteSheet, "stand");
    character.y = 215;
    character.x = w/2;


    stage.addChild(ground, character);
    createjs.Ticker.timingMode = createjs.Ticker.RAF;
    createjs.Ticker.addEventListener("tick", tick);
}

function tick(event) {
    stage.update(event);
}

var player = {
  ground: true,
  pos: {
    x: w/2,
    y: h/2},
  speed: {
    x: 0,
    y: 0},
  width: 32,
  height: 64,
  land: playerLand,
  setbounds: setBounds,
  updatepos: updatePos,
  initsensor: initSensor,
  update: playerUpdate
};
player.initsensor("right", 4, player.height-8, player.width/2, 0);
player.initsensor("left", 4, player.height-8, -player.width/2, 0);
player.initsensor("top", player.width, 4, 0, player.height/2);
player.initsensor("bottom", player.width, 4, 0, -player.height/2);

if (player.sensor.bottom.colliding())
  player.land();

function playerLand() {
  player.ground = true;
  player.speed.y = 0;
}

function playerUpdate() {
  this.updatepos();
  for (var i = 0; i < this.sensor.length; i++)
    this.sensor[i].updatepos();
}

function setBounds() {
  this.bound = {
    right: this.pos.x + this.width/2,
    left: this.pos.x - this.width/2,
    top: this.pos.y + this.height/2,
    bottom: this.pos.y - this.height/2
  };
}

function initSensor(label, width, height, offsetX, offsetY) {
    if (typeof(this.sensor) === undefined)
    this.sensor = {};
  this.sensor[label] = {
    pos: {
      x: this.pos.x,
      y: this.pos.y
    },
    offset: {
      x: offsetX,
      y: offsetY
    },
    setbounds: setBounds,
    updatepos: updatePos
  };
}

function updatePos(delta) {
  if (typeof(this.offset) !== undefined) {
    this.pos.x = player.pos.x + this.offset.x;
    this.pos.y = player.pos.y + this.offset.y;
  } else if (typeof(this.speed) !== undefined) {
    this.pos.x += this.speed.x * delta;
    this.pos.y += this.speed.y * delta;
  }
}

function colliding() {
  this.setbounds();
  for (var i = 0; i < objects.length; i++) {
    var object = objects[i];
    if (this.bound.right > object.bound.left &&
        this.bound.left < object.bound.right &&
        this.bound.top > object.bound.bottom &&
        this.bound.bottom < object.bound.top)
      return true;
  }
  return false;
}

function keyPressed(event) {
    switch(event.keyCode) {
        case KEYCODE_W:  
            break;
        case KEYCODE_A: 
            break;
        case KEYCODE_S: 
            break;
        case KEYCODE_D: 
            break;
    }
    stage.update();
}