var stage, w, h, loader;
var input, ground, player, tilesets = [];


function init() {
    stage = new createjs.Stage('arena');

    // grab canvas width and height for later calculations:
    w = stage.canvas.width;
    h = stage.canvas.height;

    manifest = [
        {src: 'spritesheet_placeholder.png', id: 'character'},
        {src: 'ground.png', id: 'ground'}
    ];

    loader = new createjs.LoadQueue(false);
    loader.addEventListener('complete', handleComplete);
    loader.loadManifest(manifest, true, 'assets/sprites/');
}

function handleComplete() {
    input = {
        left: false,
        right: false,
        jump: false,
        fire: false
    };
  
    player = {
        width: 292,
        height: 165,
        pos: {
            x: w/2,
            y: 410},
        speed: {
            x: 2,
            y: 0},
        state: 'stand',
        ground: true,
        jump: actorJump,
        land: actorLand,
        setbounds: setBounds,
        updatepos: updatePos,
        initsensor: initSensor,
        update: actorUpdate,
        updatesensors: actorUpdateSensors,
        colliding: colliding
    };
    player.initsensor('right', 4, player.height-8, player.width/2, 0);
    player.initsensor('left', 4, player.height-8, -player.width/2, 0);
    player.initsensor('bottom', player.width, 4, 0, player.height/2);
    player.initsensor('top', player.width, 4, 0, -player.height/2);

    var groundImg = loader.getResult('ground');
    ground = new createjs.Shape();

    hill2 = new createjs.Bitmap(loader.getResult('hill2'));

    ground.graphics.beginBitmapFill(groundImg).drawRect(0, 0, w + groundImg.width, groundImg.height);
    ground.tileW = groundImg.width;
    ground.y = h - groundImg.height;
  
    tilesets.push({
        width: w,
        height: groundImg.height,
        pos: {
            x: w/2,
            y: h - groundImg.height/2},
        setbounds: setBounds
    });
    tilesets[0].setbounds();

    var spriteSheet = new createjs.SpriteSheet({
        framerate: 30,
        'images': [loader.getResult('character')],
        'frames': {'regX': 82, 'height': 292, 'count': 64, 'regY': 204, 'width': 165},
        'animations': {
            'run': [0, 25, 'run', 1],
            'stand': [58, 60, 'stand', 0.25],
            'jump': [36, 36, 'jump'],
            'fall': [53, 53, 'fall']
        }
    });

    player.sprite = new createjs.Sprite(spriteSheet, 'stand');
    player.sprite.x = player.pos.x;
    player.sprite.y = player.pos.y;

    stage.addChild(ground, player.sprite);
    createjs.Ticker.timingMode = createjs.Ticker.RAF;
    createjs.Ticker.addEventListener('tick', tick);
  
    this.document.onkeydown = keyPressedDown;
    this.document.onkeyup = keyPressedUp;
}

function tick(event) {
    var delta = event.delta / 1000;
  
    // Player inputs
    player.speed.x = 0;
  
    if (input.right) {
        player.speed.x = 300;
    }
    if (input.left) {
        player.speed.x = -300;
    }
    if (input.jump && player.ground) {
        player.jump();
    }
  
    // Player momentum
    if (!player.ground)
        player.speed.y += 1200 * delta;
  
    // Player states
    if (player.ground) {
        if (player.speed.x == 0)
            player.state = 'stand';
        else
            player.state = 'run';
    }
    else {
        if (player.speed.y <= 0)
            player.state = 'jump';
        else
            player.state = 'fall';
    }
  
    // Update player and sensors
    player.update(delta);
  
    // Check for collisions
    if (!player.ground && player.speed.y > 0 && player.sensor.bottom.colliding())
        player.land();

    // Set player animation
    if (player.sprite.currentAnimation != player.state)
        player.sprite.gotoAndPlay(player.state);
  
    // Set player orientation
    if (player.speed.x > 0 && player.sprite.scaleX == -1)
        player.sprite.scaleX = 1;
    else if (player.speed.x < 0 && player.sprite.scaleX == 1)
        player.sprite.scaleX = -1;
  
    // Update stage
    stage.update(event);
}


function actorJump() {
    this.ground = false;
    this.speed.y = -600;
}

function actorLand() {
    this.ground = true;
    this.speed.y = 0;
    // Add repositioning logic here
}

function actorUpdate(delta) {
    this.updatepos(delta);
    this.updatesensors();
}

function actorUpdateSensors() {
    for (var key in this.sensor)
        this.sensor[key].updatepos();
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
        updatepos: updatePos,
        colliding: colliding
    };
}

function updatePos(delta) {
    if (typeof(this.offset) !== 'undefined') { // Sensor positioning
        this.pos.x = this.parent.pos.x + this.offset.x;
        this.pos.y = this.parent.pos.y + this.offset.y;
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

function keyPressedDown() {
    if (key.isPressed('left') || key.isPressed('a')) {
        input.left = true;
    }
    if (key.isPressed('right') || key.isPressed('d')) {
        input.right = true;
    }
    if (key.isPressed('up') || key.isPressed('w')) {
        input.jump = true;
    }
    if (key.isPressed('space') || key.isPressed('s')) {
        input.fire = true;
    }
}

function keyPressedUp() {
    if (!key.isPressed('left') && !key.isPressed('a')) {
        input.left = false;
    }
    if (!key.isPressed('right') && !key.isPressed('d')) {
        input.right = false;
    }
    if (!key.isPressed('up') && !key.isPressed('w')) {
        input.jump = false;
    }
    if (!key.isPressed('space') && !key.isPressed('s')) {
        input.fire = false;
    }
}

