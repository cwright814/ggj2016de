
var stage, w, h, loader;
var ground;

function init() {
    stage = new createjs.Stage("arena");

    // grab canvas width and height for later calculations:
    w = stage.canvas.width;
    h = stage.canvas.height;

    manifest = [
        {src: "ground.png", id: "ground"}
    ];

    loader = new createjs.LoadQueue(false);
    loader.addEventListener("complete", handleComplete);
    loader.loadManifest(manifest, true, "assets/sprites/");
}

function handleComplete() {

    var groundImg = loader.getResult("ground");
    ground = new createjs.Shape();

    var matrix = new createjs.Matrix2D();

    ground.graphics.beginBitmapFill(groundImg, "repeat", matrix).drawRect(0, 0, w + groundImg.width, groundImg.height);
    ground.tileW = groundImg.width;
    ground.y = h - groundImg.height;

    stage.addChild(ground);
    createjs.Ticker.timingMode = createjs.Ticker.RAF;
    createjs.Ticker.addEventListener("tick", tick);
}

function tick(event) {
    stage.update(event);
}