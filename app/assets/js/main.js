// Stage Variables
var stage, w, h, loader, delta;

// Title Screen
var TitleView = new createjs.Container();

// Game Screen
var input, ground, player, spirit;
var projectiles, spriteSheetPlatform;
var enemySpritSheet1, enemySpriteSheet2, enemeySpritSheet3;
var orbSpriteSheet, spiritCount, scoreText;
var tilesets = [], enemies = [], orbs = [];
var lives = new createjs.Container();


function init() {
    stage = new createjs.Stage('arena');

    // grab canvas width and height for later calculations:
    w = stage.canvas.width;
    h = stage.canvas.height;

    manifest = [
        {src: 'huyana.png', id: 'character'},
        {src: 'tile4.png', id: 'platform'},
        {src: 'ground.png', id: 'ground'},
        {src: 'arrow-1.png', id: 'projectile'},
        {src: 'background-2.png', id: 'background'},
        {src: 'enemy1-spritesheet.png', id: 'enemy1'},
        {src: 'enemy2-spritesheet.png', id: 'enemy2'},
        {src: 'enemy3-spritesheet.png', id: 'enemy3'},
        {src: 'spirit-orb-spritesheet.png', id: 'orb'},
        {src: 'girl-spirit-spritesheet.png', id: 'girl-spirit'},
        {src: 'plume-heart.png', id: 'life'},
        {src: 'title-bg.png', id: 'title-bg'}
    ];

    loader = new createjs.LoadQueue(false);
    loader.addEventListener('complete', handleComplete);
    loader.loadManifest(manifest, true, 'assets/sprites/');
}

function Actor(width, height, x, y, state, ground) {
    if (typeof(x) === 'undefined')
        var x = 0;
    if (typeof(y) === 'undefined')
        var y = 0;
    if (typeof(state) === 'undefined')
        var state = null;
    if (typeof(ground) === 'undefined')
        var ground = false;
  
    this.width = width;
    this.height = height;
    this.pos = {
        x: x,
        y: y};
    this.speed = {
        x: 0,
        y: 0};
    this.state = state;
    this.ground = ground;
    this.health = 7;
    this.groundIgnore = 0;
    this.shoot = actorShoot;
    this.jump = actorJump;
    this.fall = actorFall;
    this.land = actorLand;
    this.setbounds = setBounds;
    this.updatepos = updatePos;
    this.initsensor = initSensor;
    this.update = actorUpdate;
    this.updatesensors = actorUpdateSensors;
    this.colliding = colliding;
    this.reposition = actorReposition;
}

function handleComplete() {
    createjs.Ticker.timingMode = createjs.Ticker.RAF;
    createjs.Ticker.addEventListener('tick', tick);
    addTitleScreen();
}

function addTitleScreen() {
    stage.enableMouseOver(10);
    stage.state = 'title';
    input = {
        left: false,
        right: false,
        down: false,
        jump: false,
        fire: false
    };
    this.document.onkeydown = keyPressedDown;
    this.document.onkeyup = keyPressedUp;
  
    var titleBg = new createjs.Shape();
    titleBg.graphics.beginBitmapFill(loader.getResult('title-bg')).drawRect(0, 0, w, h);
  
    var startText = new createjs.Text('Start', '32px Tahoma, Geneva, sans-serif', '#000');
    startText.x = w/2 - 32;
    startText.y = 350;
    startText.alpha = 0.5;

    var hitArea = new createjs.Shape();
    hitArea.graphics.beginFill('#FFF').drawRect(0, 0, startText.getMeasuredWidth()+5, startText.getMeasuredHeight()+10);
    startText.hitArea = hitArea;

    startText.on('mouseover', hoverEffect);
    startText.on('mouseout', hoverEffect);
    startText.on('mousedown', transitionTitleView);
  
    TitleView.addChild(titleBg, startText);
    stage.addChild(TitleView);
    stage.update();
}

function hoverEffect(event) {
    event.target.alpha = (event.type == 'mouseover') ? '1' : '0.5'; 
    stage.update()
}

function transitionTitleView() {       
    // Todo: Maybe try to fade out title screen. 
    stage.removeChild(TitleView);
    TitleView = null;
    addGameScreen();
}

function addGameScreen() {
    stage.enableMouseOver(0);
    stage.state = 'game';
  
    player = new Actor(64, 128, w/2, 558, 'stand', true);
    player.initsensor('right', 4, player.height-8, player.width/2, 0);
    player.initsensor('left', 4, player.height-8, -player.width/2, 0);
    player.initsensor('bottom', player.width, 4, 0, player.height/2);
    player.initsensor('bottom2', player.width, 4, 0, player.height/2-1);
    //player.initsensor('top', player.width, 4, 0, -player.height/2);
    player.hasFired = false;

    background = new createjs.Shape();
    background.graphics.beginBitmapFill(loader.getResult('background')).drawRect(0, 0, w, h);
    background.alpha = 0.9;

    var groundImg = loader.getResult('ground');
    ground = new createjs.Shape();
    ground.alpha = 0;

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

    projectiles = new Array();

    var spriteSheet = new createjs.SpriteSheet({
        framerate: 30,
        'images': [loader.getResult('character')],
        'frames': {'width': 128, 'height': 128, 'regX': 64, 'regY': 36, 'count': 32},
        'animations': {
            'stand': [0, 9, 'stand', 0.25],
            'run': [10, 19, 'run', 0.6],
            'jump': [20, 23, 'jump', 0.75],
            'fall': [24, 29, 'fall', 0.75],
            'shootGround': [30, 30, 'stand', 0.25],
            'shootAir': [31, 31, 'jump', 0.25]
        }
    });

    player.sprite = new createjs.Sprite(spriteSheet, 'stand');

    enemySpriteSheet1 = new createjs.SpriteSheet({
        framerate: 10,
        'images': [loader.getResult('enemy1')],
        'frames': {'width': 128, 'height': 128, 'regX': 69, 'regY': 30, 'count': 8},
        'animations': {
            'walk': [5, 7],
            'die': [0, 3, 'end'],
            'hit': [4, 5, 'walk'],
            'end': [-1]
        }
    });

    enemySpriteSheet2 = new createjs.SpriteSheet({
        framerate: 10,
        'images': [loader.getResult('enemy2')],
        'frames': {'width': 128, 'height': 128, 'regX': 64, 'regY': 64, 'count': 10},
        'animations': {
            'walk': [5, 9],
            'die': [0, 3, 'end'],
            'hit': [4, 5, 'walk'],
            'end': [-1]
        }
    });

    orbSpriteSheet = new createjs.SpriteSheet({
        framerate: 8,
        'images': [loader.getResult('orb')],
        'frames': {'width': 128, 'height': 128, 'regX': 64, 'regY': 64, 'count': 4},
        'animations': {
            'pulse': [0, 3],
        }
    });

    var spiritSpriteSheet = new createjs.SpriteSheet({
        framerate: 12,
        'images': [loader.getResult('girl-spirit')],
        'frames': {'width': 128, 'height': 128, 'regX': 69, 'regY': 30, 'count': 7},
        'animations': {
            'float': [0, 3, 'float', 0.5],
            'absorb': [4, 6, 'float', 0.5]
        }
    });

    spirit = new Actor(64, 128, w/2, h/2-64, 'float');
    spirit.sprite = new createjs.Sprite(spiritSpriteSheet, 'float');
    spirit.speed.y = 50;

    // Add lives
    for(var i = 0; i < player.health; i++) { 
        var life = new createjs.Bitmap(loader.getResult('life'));
        life.x = 5 + (20 * i); 
        life.y = 5;
        life.scaleX = 0.5;
        life.scaleY = 0.5;
        life.alpha = 0.5;
        lives.addChild(life); 
    }

    score = new createjs.Text('0', 'bold 18px Tahoma, Geneva, sans-serif', '#111');
    score.x = w-5;
    score.y = 2;
    score.textAlign = 'right';

    stage.addChild(background, ground, spirit.sprite);

    // Generate platforms
    for ( k = 0; k < 4; k++ ) {
        for ( i = 0; i < 3; i++ ) {
            var x = Math.floor((Math.random() * (w - 108)) / 24) * 24;
            var y = Math.floor((Math.random() * (h/4 - 48) + h/5*k + 48) / 48) * 48;
            addPlatform(x, y);
        }
    }

    stage.addChild(player.sprite, lives, score);

    timerSource = setInterval('spawnEnemy()', 3000); 
    timerSource = setInterval('spawnEnemy()', 5521); 
    timerSource = setInterval('spawnEnemy()', 8967);
    timerSource = setInterval('spawnEnemy()', 14745);
    timerSource = setInterval('spawnEnemy()', 26119);
}

function spawnOrb(x, y) {
    var orb = new Actor(24, 24, x, y, 'pulse');
    orb.sprite = new createjs.Sprite(orbSpriteSheet, 'pulse');
    orb.alpha = 0.8;
    orbs.push(orb);
    stage.addChild(orb.sprite);
}

function spawnEnemy() {
    var direction = Math.random() < 0.5 ? -1 : 1;
    var xStart  = direction == -1 ? w+30 : -30;
    var enemyType = getRandomInt(1, 3);
    switch (enemyType) {
    case 1:
        var enemy = new Actor(64, 128, xStart, getRandomInt(-100, 500), 'walk');
        enemy.sprite = new createjs.Sprite(enemySpriteSheet1, 'walk');
        enemy.health = 2;
        break;
    case 2:
        var enemy = new Actor(64, 128, xStart, getRandomInt(-100, 500), 'walk');
        enemy.sprite = new createjs.Sprite(enemySpriteSheet2, 'walk');
        enemy.health = 3;
        break;
    }
    enemy.initsensor('right', 4, enemy.height-8, enemy.width/2, 0);
    enemy.initsensor('left', 4, enemy.height-8, -enemy.width/2, 0);
    enemy.initsensor('bottom', enemy.width, 4, 0, enemy.height/2);
    enemy.initsensor('bottom2', enemy.width, 4, 0, enemy.height/2-1);
    enemy.speed.x = getRandomInt(100, 300) * direction;
    enemy.sprite.scaleX = enemyType == 2 ? 0-direction : direction;
    enemy.sprite.alpha = 0.6;
    enemies.push(enemy);
    stage.addChild(enemy.sprite);
}

function addPlatform(x, y) {
    var length = 5 + Math.floor(Math.random() * 4) * 4;
    var spriteImg = loader.getResult('platform');
    var sprite = new createjs.Shape();
    sprite.graphics.beginBitmapFill(spriteImg).drawRect(0, 0, spriteImg.width * length, spriteImg.height);
    sprite.x = Math.round(x);
    sprite.y = Math.round(y);
    sprite.snapToPixel = true;
  
    platform = {
        width: spriteImg.width * length,
        height: spriteImg.height,
        pos: {
            x: sprite.x + (spriteImg.width * length)/2,
            y: sprite.y + spriteImg.height/2},
        sprite: sprite,
        setbounds: setBounds
    }
    platform.setbounds();

    tilesets.push(platform);
    stage.addChild(platform.sprite);
}

function tick(event) {
    delta = event.delta / 1000;

    switch (stage.state) {
    case 'title':
        if (input.fire)
        {
            input.fire = false;
            transitionTitleView();
        }
        break;
    case 'game':
        // Player inputs
        player.speed.x = 0;

        if (input.right && player.pos.x <= w) {
            player.speed.x = 300;
        }
        if (input.left && player.pos.x >= 0) {
            player.speed.x = -300;
        }
        if (player.ground) {
            if (input.jump)
                player.jump();
            else if (input.down && player.pos.y < 500)
                player.fall();
        }
        if (input.fire && !player.hasFired) {
            player.shoot();
            player.hasFired = true;
            if (player.ground)
                player.state = 'shootGround';
            else
                player.state = 'shootAir';
            player.sprite.gotoAndPlay(player.state);
        }
        if (player.hasFired && !input.fire) {
            player.hasFired = false;
        }

        // Player momentum
        if (!player.ground)
            player.speed.y += 1200 * delta;
        
        // Spirit momentum
        if (spirit.pos.y > h/2-64)
            spirit.speed.y -= 40 * delta;
        if (spirit.pos.y < h/2-64)
            spirit.speed.y += 40 * delta;

        // Player states
        if (player.state != 'shootGround' && player.state != 'shootAir') {
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
        }
        
        if (player.state == 'shootGround' || player.state == 'shootAir') {
            if (player.sprite.currentAnimation != player.state)
                player.state = player.sprite.currentAnimation;
        }

        // Update actors and sensors
        player.update();
        spirit.update();

        // Projectiles update/destruction
        for (var i = 0; i < projectiles.length; i++) { 
            var projectile = projectiles[i];
            projectile.updatepos();
            // Remove projectiles no longer on screen
            if (projectile.sprite.x < -projectile.sprite.getBounds().width || projectile.sprite.x > w) {
                stage.removeChild(projectile.sprite);
                projectiles.splice(i, 1);
            }

            // Check projectile and enemy collision
            for (var j = 0; j < enemies.length; j++) {
                var enemy = enemies[j];
                var currAnim = enemy.sprite.currentAnimation;
                if (currAnim != 'end' && currAnim != 'die' && currAnim != 'hit' && projectile.colliding(enemy)) {
                    enemy.sprite.gotoAndPlay('hit');
                    enemy.health -= 1;
                    if (enemy.health <= 0 && currAnim != 'die') {
                        enemy.sprite.gotoAndPlay('die');
                        spawnOrb(enemy.pos.x, enemy.pos.y+36);
                        enemy.speed.x = 0;
                    }
                }
                else if (currAnim == 'end') {
                    stage.removeChild(enemy.sprite);
                    enemies.splice(j, 1);
                }
            }
        }
        
        for (var i = 0; i < orbs.length; i++) {
            var orb = orbs[i];
            var orbDist = Math.sqrt(Math.pow(Math.abs(orb.pos.x-spirit.pos.x),2) + Math.pow(Math.abs(orb.pos.y-spirit.pos.y),2));
            var orbAccel = Math.max(Math.pow(orbDist,2)/80, 800);
          
            // Orb momentum
            if (orb.pos.x < spirit.pos.x)
                orb.speed.x += orbAccel * delta;
            if (orb.pos.x > spirit.pos.x)
                orb.speed.x -= orbAccel * delta;
            if (orb.pos.y < spirit.pos.y)
                orb.speed.y += orbAccel * delta;
            if (orb.pos.y > spirit.pos.y)
                orb.speed.y -= orbAccel * delta;
          
            if (orb.colliding(spirit)) {
                score.text = parseFloat(score.text + 1);
                spirit.sprite.gotoAndPlay('absorb');
                stage.removeChild(orb.sprite);
                orbs.splice(i, 1);
            }
            
            // Orb update
            orb.update();
        }

        // Check for collisions
        if (!player.ground && player.groundIgnore <= 0 && player.speed.y > 0 && player.sensor.bottom.colliding())
            player.land();
        if ((player.ground && !player.sensor.bottom.colliding()) || player.groundIgnore > 0)
            player.ground = false;
        if (player.groundIgnore > 0)
            player.groundIgnore -= delta;

        // Set player animation
        if (player.sprite.currentAnimation != player.state)
            player.sprite.gotoAndPlay(player.state);

        // Set player orientation
        if (player.speed.x > 0 && player.sprite.scaleX == -1)
            player.sprite.scaleX = 1;
        else if (player.speed.x < 0 && player.sprite.scaleX == 1)
            player.sprite.scaleX = -1;

        // Now do the same thing for the enemies
        for (var i = 0; i < enemies.length; i++) {
            var enemy = enemies[i];
            if (enemy.sprite.currentAnimation == 'walk')
            {
                if (enemy.sprite.x < -enemy.sprite.getBounds().width || enemy.sprite.x > w+enemy.sprite.getBounds().width) {
                    stage.removeChild(enemy.sprite);
                    enemies.splice(i, 1);
                    // Remove player-health here.
                    player.health--;
                    lives.removeChildAt(lives.children.length-1);
                    if (player.health <= 0)
                        document.location.reload(true);
                }
            }

            if (!enemy.ground)
                enemy.speed.y += 1200 * delta;

            if (!enemy.ground && enemy.speed.y > 0 && enemy.sensor.bottom.colliding())
                enemy.land();
            if (enemy.ground && !enemy.sensor.bottom.colliding())
                enemy.ground = false;

            enemy.update();
        }
        break;
    default:
        break;
    }

    // Update stage
    stage.update(event);
}

function actorShoot() {
    var projectile = new Actor(24, 6, this.pos.x-12, this.pos.y+24);
    projectile.speed.x = 1500 * this.sprite.scaleX;
    projectile.sprite = new createjs.Bitmap(loader.getResult('projectile'));
    projectile.sprite.scaleX = this.sprite.scaleX;

    projectiles.push(projectile);
    stage.addChild(projectile.sprite);
}

function actorJump() {
    this.ground = false;
    this.speed.y = -680;
}

function actorFall() {
    this.ground = false;
    this.groundIgnore = 0.2;
}

function actorLand() {
    this.ground = true;
    this.speed.y = 0;
    this.reposition();
}

function actorReposition() {
    while (this.sensor.bottom2.colliding()) {
        this.pos.y -= 1;
        this.updatesensors();
    }
}

function actorUpdate() {
    this.updatepos();
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

function updatePos() {
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

function colliding(_objects) { // Compares object bounds vs objects[] to test for collision
    this.setbounds();
    var objects = [];
  
    if (typeof(_objects) === 'undefined')
        objects = tilesets;
    else if (typeof(_objects[0]) === 'undefined')
        objects.push(_objects);
    else
        objects = _objects;
  
    for (var i = 0; i < objects.length; i++) {
        var object = objects[i];
        if (typeof(object.state) !== 'undefined')
            object.setbounds();
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
    if (key.isPressed('down') || key.isPressed('s')) {
        input.down = true;
    }
    if (key.isPressed('up') || key.isPressed('w')) {
        input.jump = true;
    }
    if (key.isPressed('space') || key.isPressed('enter')) {
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
    if (!key.isPressed('down') && !key.isPressed('s')) {
        input.down = false;
    }
    if (!key.isPressed('up') && !key.isPressed('w')) {
        input.jump = false;
    }
    if (!key.isPressed('space') && !key.isPressed('enter')) {
        input.fire = false;
    }
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}
