var stage, w, h, loader;
var ground, player, tilesets;


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
    player = {
        width: 32,
        height: 64,
        pos: {
            x: w/2,
            y: 354},
        speed: {
            x: 2,
            y: 0},
        ground: true,
        land: actorLand,
        setbounds: setBounds,
        updatepos: updatePos,
        initsensor: initSensor,
        update: actorUpdate,
        updatesensors: actorUpdateSensors
    };
    player.initsensor("right", 4, player.height-8, player.width/2, 0);
    player.initsensor("left", 4, player.height-8, -player.width/2, 0);
    player.initsensor("bottom", player.width, 4, 0, player.height/2);
    player.initsensor("top", player.width, 4, 0, -player.height/2);

    var groundImg = loader.getResult("ground");
    ground = new createjs.Shape();

    hill2 = new createjs.Bitmap(loader.getResult("hill2"));

    ground.graphics.beginBitmapFill(groundImg).drawRect(0, 0, w + groundImg.width, groundImg.height);
    ground.tileW = groundImg.width;
    ground.y = h - groundImg.height;

    var spriteSheet = new createjs.SpriteSheet({
        framerate: 30,
        "images": [loader.getResult("character")],
        "frames": {"regX": 82, "height": 292, "count": 64, "regY": 146, "width": 165},
        // define two animations, run (loops, 1.5x speed) and jump (returns to run):
        "animations": {
            "run": [0, 25, "run", 1],
            "stand": [58, 60, "stand", 0.25],
            "jump": [26, 63, "run"]
        }
    });

    player.sprite = new createjs.Sprite(spriteSheet, "stand");
    player.sprite.x = player.pos.x;
    player.sprite.y = player.pos.y;

    stage.addChild(ground, player.sprite);
    createjs.Ticker.timingMode = createjs.Ticker.RAF;
    createjs.Ticker.addEventListener("tick", tick);
}

function tick(event) {
    if (!player.ground && player.speed.y > 0 && player.sensor.bottom.colliding())
        player.land();
    keyPressed(event);
    stage.update(event);
}

function actorLand() {
    this.ground = true;
    this.speed.y = 0;
    // Add repositioning logic here
}

function actorUpdate() {
    this.updatepos();
    this.updatesensors();
}

function actorUpdateSensors() {
    for (var i = 0; i < this.sensor.length; i++)
        this.sensor[i].updatepos();
}

function initSensor(label, width, height, offsetX, offsetY) { // Creates child (sensor) for parent
    if (typeof(this.sensor) === 'undefined')
        this.sensor = {};
    this.sensor[label] = {
        width: width,
        height: height,
        pos: {
            x: this.pos.x,
            y: this.pos.y
        },
        offset: {
            x: offsetX,
            y: offsetY
        },
        parent: this,
        setbounds: setBounds,
        updatepos: updatePos
    };
}

function updatePos(delta) {
    if (typeof(this.offset) !== 'undefined') { // Sensor positioning
        this.pos.x = parent.pos.x + this.offset.x;
        this.pos.y = parent.pos.y + this.offset.y;
    } else if (typeof(this.speed) !== 'undefined') { // Player positioning
        this.pos.x += this.speed.x * delta;
        this.pos.y += this.speed.y * delta;
    }
    if (typeof(this.sprite) !== 'undefined') { // Sprite positioning
        this.sprite.x = this.pos.x;
        this.sprite.y = this.pos.y;
    }
}

function setBounds() { // Calculates object bounds for collision detection
    this.bound = {
        right: this.pos.x + this.width/2,
        left: this.pos.x - this.width/2,
        bottom: this.pos.y + this.height/2,
        top: this.pos.y - this.height/2
    };
}

function colliding(objects) { // Compares object bounds vs objects[] to test for collision
    this.setbounds();
    if (typeof(objects) === 'undefined')
      objects = tilesets;
    for (var i = 0; i < objects.length; i++) {
        var object = objects[i];
        if (this.bound.right > object.bound.left &&
            this.bound.left < object.bound.right &&
            this.bound.bottom > object.bound.top &&
            this.bound.top < object.bound.bottom)
            return true;
    }
    return false;
}

function keyPressed(event) {
    if (key.isPressed('left') || key.isPressed('a')) {
        player.speed.x = -1
        player.updatepos(event.delta);
    }
    if (key.isPressed('right') || key.isPressed('d')) {
        player.speed.x = 1
        player.updatepos(event.delta);
    }
}