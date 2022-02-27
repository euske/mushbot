/// <reference path="../base/utils.ts" />
/// <reference path="../base/geom.ts" />
/// <reference path="../base/entity.ts" />
/// <reference path="../base/text.ts" />
/// <reference path="../base/scene.ts" />
/// <reference path="../base/app.ts" />

///  game.ts
///  colors: #0066cc and #ffcc00


//  Initialize the resources.
let FONT: Font;
let SPRITES:SpriteSheet;
function main() {
    APP = new App(160, 160);
    FONT = new ShadowFont(APP.images['font'], 'white');
    //SPRITES = new ImageSpriteSheet(
    //    APP.images['sprites'], new Vec2(16,16), new Vec2(8,8));
    SPRITES = new ArraySpriteSheet([
        new RectSprite('#f40', new Rect(-60,-80,120,80)), // 0: upper body
        new RectSprite('#c84', new Rect(-50,-160,100,160)), // 1: lower body
        new RectSprite('#008', new Rect(-8,-8,16,16)),   // 2: food1
        new RectSprite('#f00', new Rect(-8,-8,16,16)),   // 3: food2
        new RectSprite('#fff', new Rect(-8,-8,16,16)),   // 4: enemy1
        new RectSprite('#080', new Rect(-8,-8,16,16)),   // 5: enemy2
    ]);
    APP.init(new Game());
}


//  Food
//
class Food extends Entity {

    v: Vec2;

    constructor(pos: Vec2, v: Vec2, sprite: Sprite) {
        super(pos);
        this.v = v;
        this.sprites = [sprite];
        this.collider = sprite.getBounds();
    }

    onTick() {
        super.onTick();
        this.pos = this.pos.add(this.v);
        let collider = this.getCollider();
        if (collider !== null && !collider.overlapsRect(this.world.area)) {
            this.stop();
        }
    }
}


//  Enemy
//
class Enemy extends Entity {

    v: Vec2;

    constructor(pos: Vec2, v: Vec2, sprite: Sprite) {
        super(pos);
        this.v = v;
        this.sprites = [sprite];
        this.collider = sprite.getBounds();
    }

    onTick() {
        super.onTick();
        this.pos = this.pos.add(this.v);
        let collider = this.getCollider();
        if (collider !== null && !collider.overlapsRect(this.world.area)) {
            this.stop();
        }
    }
}


//  Sky
//
class Sky extends World {

    game: Game;
    cy = 160;
    open = false;

    sprite = SPRITES.get(0);

    constructor(game: Game) {
        super(game.screen);
        this.game = game;
    }

    onTick() {
        super.onTick();
        if (rnd(10) == 0) {
            let pos = new Vec2(this.area.width+8, rnd(60, 160));
            let food = new Food(pos, new Vec2(-2,0), SPRITES.get(2));
            this.add(food);
        }
        if (rnd(100) == 0) {
            let pos = new Vec2(this.area.width+8, rnd(60, 160));
            let enemy = new Enemy(pos, new Vec2(-4,0), SPRITES.get(4));
            this.add(enemy);
        }
        let x = this.game.cx;
        let y = this.cy+this.game.jy;
        if (this.open) {
            let rect = new Rect(x-30, y-60, 60, 40);
            for (let e of this.findEntities(rect)) {
                this.game.consume(e);
            }
        }
    }

    render(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = '#0066cc';
        fillRect(ctx, this.area);
        let x = this.game.cx;
        let y = this.cy+this.game.jy;
        ctx.save();
        ctx.translate(x, y);
        this.sprite.render(ctx);
        ctx.restore();
        if (this.open) {
            let rect = new Rect(x-30, y-60, 60, 40);
            ctx.fillStyle = '#222';
            fillRect(ctx, rect);
        }
        super.render(ctx);
    }

    setAction(x: boolean) {
        this.open = x;
    }
}

//  Land
//
class Land extends World {

    game: Game;
    cy = 0;
    vy = +1;
    ygoal = 100;

    sprite = SPRITES.get(1);

    constructor(game: Game) {
        super(game.screen);
        this.game = game;
    }

    onTick() {
        super.onTick();
        this.cy += this.vy;
        if (0 < this.vy && this.ygoal <= this.cy) {
            this.vy = -1;
            this.ygoal = rnd(60,160);
        } else if (this.vy < 0 && this.cy <= this.ygoal) {
            this.vy = +1;
            this.ygoal = rnd(60,160);
        }
        if (rnd(10) == 0) {
            let pos = new Vec2(this.area.width+8, rnd(this.area.height));
            let food = new Food(pos, new Vec2(-1,0), SPRITES.get(3));
            this.add(food);
        }
        if (rnd(100) == 0) {
            let pos = new Vec2(this.area.width+8, rnd(this.area.height));
            let enemy = new Enemy(pos, new Vec2(-1,0), SPRITES.get(5));
            this.add(enemy);
        }
    }

    landed() {
        let rect = new Rect(this.game.cx-50, this.cy-100, 100, 100)
        for (let e of this.findEntities(rect)) {
            this.game.consume(e);
        }
    }

    render(ctx: CanvasRenderingContext2D) {
        let x = this.game.cx;
        let jy = this.game.jy;
        ctx.fillStyle = '#ffcc00';
        fillRect(ctx, this.area);
        ctx.fillStyle = '#222';
        fillRect(ctx, new Rect(x-48, this.cy-jy/2-98, 100, 100));
        super.render(ctx);
        ctx.save();
        ctx.translate(x, this.cy+jy*3);
        this.sprite.render(ctx);
        ctx.restore();
    }

    setAction(x: boolean) {
    }
}


//  Game
//
class Game extends Scene {

    highscore = 0;

    sky: Sky;
    land: Land;
    scoreBox: TextBox;
    score = 0;
    island = false;
    nextflip = 0;

    ax = +1;
    vx = 0;
    cx = 0;
    xgoal = 100;

    jt = Infinity;
    jy = 0;

    onStart() {
        super.onStart();
        this.scoreBox = new TextBox(this.screen.inflate(-4,-4), FONT);
        this.sky = new Sky(this);
        this.sky.onStart();
        this.land = new Land(this);
        this.land.onStart();
        this.score = 0;
        this.updateScore();
        this.island = false;
        this.nextflip = getTime() + 5;

        this.ax = +1;
        this.vx = 0;
        this.cx = 0;
        this.xgoal = 100;

        this.jt = Infinity;
        this.jy = 0;
    }

    onTick() {
        super.onTick();
        this.vx = clamp(-2, this.vx+this.ax, +2);
        this.cx += this.vx;
        if (0 < this.ax && this.xgoal <= this.cx) {
            this.ax = -1;
            this.xgoal = rnd(20, this.xgoal);
        } else if (this.ax < 0 && this.cx <= this.xgoal) {
            this.ax = +1;
            this.xgoal = rnd(this.xgoal, 100);
        }
        if (this.jt < 8) {
            this.jy -= 3;
            this.jt++;
        }
        if (this.jy < 0 && -2 <= this.jy) {
            this.land.landed();
        }
        this.jy = Math.min(0, this.jy+1);
        this.sky.onTick();
        this.land.onTick();
        if (this.nextflip < getTime()) {
            this.flipWorld();
        }
    }

    flipWorld() {
        this.island = !this.island;
        // x/y=10, x/(100+y)=2
        // x=10y, x=(200+2y)
        // 10y=200+2y, 8y=200, y=200/8=12.5, x=125
        let t = 125/(this.score+13); // 0->10, 100->2
        this.nextflip = getTime() + rnd(t) + 1;
    }

    setAction(x: boolean) {
        this.land.setAction(x);
        this.sky.setAction(x);
        if (x) {
            if (this.jy == 0) {
                this.jt = 0;
            }
        } else {
            this.jt = Infinity;
        }
    }

    consume(e: Entity) {
        e.stop();
        if (e instanceof Food) {
            this.score += 1;
            this.highscore = Math.max(this.score, this.highscore);
            this.updateScore();
        } else if (e instanceof Enemy) {
        }
    }

    onButtonPressed(keysym: KeySym) {
        super.onButtonPressed(keysym);
        switch (keysym) {
        case KeySym.Action1:
        case KeySym.Action2:
            this.setAction(true);
        }
    }
    onButtonReleased(keysym: KeySym) {
        super.onButtonReleased(keysym);
        switch (keysym) {
        case KeySym.Action1:
        case KeySym.Action2:
            this.setAction(false);
        }
    }

    onMouseDown(p: Vec2, button: number) {
        super.onMouseDown(p, button);
        this.setAction(true);
    }
    onMouseUp(p: Vec2, button: number) {
        super.onMouseUp(p, button);
        this.setAction(false);
    }

    render(ctx: CanvasRenderingContext2D) {
        if (this.island) {
            this.land.render(ctx);
        } else {
            this.sky.render(ctx);
        }
        this.scoreBox.render(ctx);
    }

    updateScore() {
        this.scoreBox.clear();
        let s = (this.score < this.highscore)? ' < ' : ' = ';
        this.scoreBox.putText([this.score+s+this.highscore]);
    }
}
