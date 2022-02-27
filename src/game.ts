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
let BODY1:Sprite;
let BODY2:Sprite;
function main() {
    APP = new App(160, 160);
    FONT = new ShadowFont(APP.images['font'], 'white');
    SPRITES = new ImageSpriteSheet(
        APP.images['sprites'], new Vec2(16,16), new Vec2(8,8));
    BODY1 = new ImageSprite(
        APP.images['robot'], new Rect(0,0,140,100), new Rect(-70,-80,140,100));
    BODY2 = new ImageSprite(
        APP.images['robot'], new Rect(0,100,140,160), new Rect(-70,-160,140,160));
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
        this.collider = sprite.getBounds().inflate(-2,-2);
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
        this.collider = sprite.getBounds().inflate(-2,-2);
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

    constructor(game: Game) {
        super(game.screen);
        this.game = game;
    }

    onTick() {
        super.onTick();
        if (rnd(20) == 0) {
            let pos = new Vec2(this.area.width+4, rnd(60, 160));
            let food = new Food(pos, new Vec2(-2,0), SPRITES.get(0));
            this.add(food);
        }
        if (rnd(100) == 0) {
            let pos = new Vec2(this.area.width+4, rnd(60, 160));
            let enemy = new Enemy(pos, new Vec2(-4,0), SPRITES.get(2));
            this.add(enemy);
        }
        if (this.game.dying == 0 && !this.game.island && this.open) {
            let rect = this.getMouthRect().inflate(-10,-4);
            let eaten = false;
            for (let e of this.findEntities(rect)) {
                this.game.consume(e);
                eaten = true;
            }
            if (eaten) {
                APP.playSound('eat');
            }
        }
    }

    getMouthRect() {
        let x = this.game.cx;
        let y = this.cy+this.game.jy;
        return new Rect(x-20, y-50, 70, 40);
    }

    render(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = '#0066cc';
        fillRect(ctx, this.area);
        ctx.save();
        ctx.translate(this.game.cx, this.cy+this.game.jy);
        BODY1.render(ctx);
        if (this.open) {
            ctx.fillStyle = '#222';
            fillRect(ctx, new Rect(-20,-50,70,40));
        }
        if (0 < this.game.dying) {
            let sprite = SPRITES.get(4);
            for (let i = 0; i < 3; i++) {
                ctx.save();
                ctx.translate(rnd(140)-70, rnd(100)-80);
                sprite.render(ctx);
                ctx.restore();
            }
        }
        ctx.restore();
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
    shaking = 0;

    constructor(game: Game) {
        super(game.screen);
        this.game = game;
    }

    onTick() {
        super.onTick();
        if (this.game.dying == 0) {
            this.cy += this.vy;
        }
        if (0 < this.vy && this.ygoal <= this.cy) {
            this.vy = -1;
            this.ygoal = rnd(60,160);
        } else if (this.vy < 0 && this.cy <= this.ygoal) {
            this.vy = +1;
            this.ygoal = rnd(60,160);
        }
        if (rnd(20) == 0) {
            let pos = new Vec2(this.area.width+4, rnd(this.area.height));
            let food = new Food(pos, new Vec2(-1,0), SPRITES.get(1));
            this.add(food);
        }
        if (rnd(100) == 0) {
            let pos = new Vec2(this.area.width+4, rnd(this.area.height));
            let enemy = new Enemy(pos, new Vec2(-1,0), SPRITES.get(3));
            this.add(enemy);
        }
        this.shaking = Math.max(0, this.shaking-1);
    }

    landed() {
        APP.playSound('footstep');
        this.shaking = 10;
        let rect = new Rect(this.game.cx-40, this.cy-40, 80, 40)
        for (let e of this.findEntities(rect)) {
            this.game.consume(e);
        }
    }

    render(ctx: CanvasRenderingContext2D) {
        let x = this.game.cx;
        let jy = this.game.jy;
        ctx.fillStyle = '#ffcc00';
        fillRect(ctx, this.area);
        ctx.save();
        if (this.shaking) {
            ctx.translate(rnd(8)-4, rnd(8)-4);
        }
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ellipse(ctx, x, this.cy-jy/2, 50+jy/2, 30+jy/4);
        ctx.closePath();
        ctx.fill();
        super.render(ctx);
        ctx.save();
        ctx.translate(x, this.cy+jy*3);
        BODY2.render(ctx);
        if (0 < this.game.dying) {
            let sprite = SPRITES.get(4);
            for (let i = 0; i < 3; i++) {
                ctx.save();
                ctx.translate(rnd(80)-40, rnd(100)-100);
                sprite.render(ctx);
                ctx.restore();
            }
        }
        ctx.restore();
        ctx.restore();
    }

    setAction(x: boolean) {
    }
}


//  Game
//
class Game extends Scene {

    firsttime = true;
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

    dying = 0;

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
        this.dying = 0;

        if (this.firsttime) {
            this.firsttime = false;
            APP.setMusic('music', MP3_GAP, 12.0);
        }
    }

    onStop() {
        super.onStop();
        this.sky.onStop();
        this.land.onStop();
    }

    onTick() {
        super.onTick();
        if (0 < this.dying) {
            this.dying -= 1;
            this.cx -= 1;
            if (this.dying == 0) {
                this.reset();
                return;
            }
        } else {
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
            if (this.island && this.jy < 0 && -2 <= this.jy) {
                this.land.landed();
            }
            if (this.nextflip < getTime()) {
                this.flipWorld();
            }
        }
        let vy = clamp(1, int((this.jt-8)/4), 3);
        this.jy = Math.min(0, this.jy+vy);
        this.sky.onTick();
        this.land.onTick();
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
                APP.playSound('jump');
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
            this.dying = 60;
            APP.playSound('explosion');
            APP.lockKeys();
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
