/* requestAnimationFrame.js
 * by zhangxinxu 2013-09-30
 */
(function() {
    var lastTime = 0;
    var vendors = ['webkit', 'moz'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || // name has changed in Webkit
            window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16.7 - (currTime - lastTime));
            var id = window.setTimeout(function() {
                callback(currTime + timeToCall);
            }, timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    }
    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
    }
}());
(function(ctx, $) {
    // 颜色由 http://www.checkman.io/please/ 生成
    /*
     * 不能移动的方块。
     */
    function Item(loc, color, width, height) {
        this.width = width || 10;
        this.height = height || 10;
        this.x = loc.x;
        this.y = loc.y;
        this.color = color || 'rgb(250, 128, 114)';
    }

    /*
     * 一组方块：田，四格直线之类
     * @centrePos 中心那个方块: 方块进行旋转时，不动的那个点
     * @relPosArr 相对中心点的位置
     * @color ti
     */
    function Diamond(centrePos, relPosArr, color) {
        this.centrePos = centrePos;
        this.relPosArr = relPosArr;
        this.color = color || '#a6e22e';
        this.initPosArr();
    }

    $.extend(Diamond.prototype, {
        initPosArr: function() {
            var posArr = [];
            var centrePos = this.centrePos;
            posArr.push(centrePos);
            this.relPosArr.forEach(function(each) {
                posArr.push({
                    x: centrePos.x + each.x,
                    y: centrePos.y + each.y
                });
            });
            this.setPosArr(posArr);
        },
        getPosArr: function() {
            return this.posArr;
        },
        setPosArr: function(posArr) {
            this.centreItem = posArr[0]; // 中心元素是第一个元素，对scroll时很重要
            this.posArr = posArr;
        },
        getRelPosArr: function() {
            return this.relPosArr;
        },
        setRelPosArr: function(relPosArr) {
            this.relPosArr = relPosArr;
        },
        getItemArr: function() {
            var color = this.color;
            var arr = [];
            this.getPosArr().forEach(function(each) {
                arr.push(new Item({
                    x: each.x,
                    y: each.y
                }, color, Game.ITEM_SIZE, Game.ITEM_SIZE));
            });
            return arr;
        }
    });

    var DiamondHelper = {
        clone: function(diamond) {
            var tempArr = [];
            var temp = new Diamond($.extend({}, diamond.centrePos), this.cloneArr(diamond.relPosArr), diamond.color);
            return temp;
        },
        cloneArr: function(arr) {
            var temp = [];
            arr.forEach(function(each) {
                temp.push($.extend({}, each));
            })
            return temp;
        },
        move: function(diamond, dir, step, locMap) {
            step = step || 1;
            if (this.canMove(diamond, dir, step, locMap)) {
                this.justMove(diamond, dir, step);
            }
        },
        moveDown: function(diamond, locMap) {
            this.move(diamond, 'down', 1, locMap);
        },
        // 不验证是否能移动
        justMove: function(diamond, dir, step) {
            step = step || 1;
            var posArr = diamond.getPosArr();
            var moveCoordinate;
            switch (dir) {
                case 'left':
                    moveCoordinate = 'x';
                    step = -step;
                    break;
                case 'right':
                    moveCoordinate = 'x';
                    break;
                case 'top':
                    moveCoordinate = 'y';
                    step = -step;
                    break;
                case 'down':
                    moveCoordinate = 'y';
                    break;
                default:
                    throw 'unknow move type';
            }
            posArr.forEach(function(each) {
                each[moveCoordinate] += step;
            });
            diamond.setPosArr(posArr);
        },
        canMove: function(diamond, dir, step, locMap) {
            var movedDimond = this.clone(diamond);
            this.justMove(movedDimond, dir, step);
            return this.isItemsLocValid(movedDimond, locMap);
        },
        //旋转 dir :left 逆时针转 right: 顺时针
        scroll: function(diamond, dir, locMap) {
            dir = dir || 'right'; // 其实，只有顺时针转
            if (this.canScroll(diamond, dir, locMap)) {
                this.justScroll(diamond, dir);
            }
        },
        // 不验证是否能旋转
        justScroll: function(diamond, dir) {
            var posArr = diamond.getPosArr();
            var relPosArr = diamond.getRelPosArr();
            var centrePos = posArr[0];
            var temp;
            // 中心点的坐标是不变的
            if (dir === 'right') {
                for (var i = 1; i < posArr.length; i++) {
                    posArr[i].x = centrePos.x + relPosArr[i - 1].y;
                    posArr[i].y = centrePos.y - relPosArr[i - 1].x;
                    temp = relPosArr[i - 1].x;
                    relPosArr[i - 1].x = -relPosArr[i - 1].y;
                    relPosArr[i - 1].y = temp;
                }
            } else {
                for (var i = 1; i < posArr.length; i++) {
                    temp = posArr[i].x;
                    posArr[i].x = centrePos.x - relPosArr[i - 1].y;
                    posArr[i].y = centrePos.y + relPosArr[i - 1].x;

                    temp = relPosArr[i - 1].x;
                    relPosArr[i - 1].x = relPosArr[i - 1].y;
                    relPosArr[i - 1].y = -temp;
                }
            }

            diamond.setPosArr(posArr);
            diamond.setRelPosArr(relPosArr);
        },
        canScroll: function(diamond, dir, locMap) {
            var movedDimond = this.clone(diamond);
            this.justScroll(movedDimond, dir);
            return this.isItemsLocValid(movedDimond, locMap);
        },
        isItemsLocValid: function(diamond, locMap) {
            // locMap 是一个二维数组
            var isValid = true;
            var posArr = diamond.getPosArr();
            var rowNum = locMap.length;
            var colNum = locMap[0].length;
            posArr.forEach(function(loc) {
                if (!isValid) {
                    return;
                }
                // loc.y < 0 开始的时候，是有没露出来的
                if (loc.y < 0) { // todo
                    return;
                }
                if (loc.x < 0 || loc.x >= colNum) {
                    isValid = false;
                } else if (loc.y >= rowNum) {
                    isValid = false;
                } else if (locMap[loc.y][loc.x]) { // 那一个有东西
                    isValid = false;
                }
                if (!isValid) {
                    // debugger;
                    console.log('invalid loc:' + JSON.stringify(loc)); // for debug
                }

            });
            return isValid;
        },
        // 落到底了
        isDiamondDown: function(diamond, locMap) {
            return !this.canMove(diamond, 'down', 1, locMap)
        },
        makeRandomDiamond: function(colNum) {
            colNum = colNum || Game.COL_NUM;
            var centrePos = {
                x: parseInt(colNum / 2, 10),
                y: 0
            }
            var relPosArr = this.random(this.DIAMOND_REL_POS_ARR);
            // var relPosArr = this.DIAMOND_REL_POS_ARR[1];
            var color = this.random(this.COLOR_ARR);
            var diamond = new Diamond(centrePos, relPosArr, color);
            // todo 随机的左转或右转
            this.fixLoc(diamond);
            return diamond;
        },
        // 只能露出一行 找出最下面的那个，让那漏出来
        fixLoc: function(diamond) {
            var yFixOffset = 0;
            var relPosArr = diamond.getRelPosArr();
            var lowestPos = 0;
            relPosArr.forEach(function(each) {
                if (each.y > lowestPos) { //越下面，值越大
                    lowestPos = each.y;
                }
            });
            yFixOffset = lowestPos;
            if (yFixOffset != 0) {
                this.justMove(diamond, 'top', yFixOffset)
            }
        },
        random: function(arr) {
            return arr[parseInt(arr.length * Math.random(), 10)];
        }
    };

    $.extend(DiamondHelper, {
        COLOR_ARR: ['rgb(250, 128, 114)', 'rgb(250, 173, 114)', 'rgb(250, 218, 114)', 'rgb(236, 250, 114)'],
        DIAMOND_REL_POS_ARR: [ // *是中心位置
            //
            [],
            // 0*00
            [{
                x: -1,
                y: 0
            }, {
                x: 1,
                y: 0
            }, {
                x: 2,
                y: 0
            }],
            /*
              0*
              00
            */
            [{
                x: -1,
                y: 0
            }, {
                x: -1,
                y: 1
            }, {
                x: 0,
                y: 1
            }],
            /*
                0
              00*
            */
            [{
                x: 0,
                y: -1
            }, {
                x: -2,
                y: 0
            }, {
                x: -1,
                y: 0
            }],
            /*
              0
              *00
            */
            [{
                x: 0,
                y: -1
            }, {
                x: 1,
                y: 0
            }, {
                x: 2,
                y: 0
            }],
        ]
    })

    function Pen($canvas) {
        this.ctx = $canvas[0].getContext('2d');
        this.width = $canvas.width();
        this.height = $canvas.height();
    }

    $.extend(Pen.prototype, {
        drawMap: function(map) {
            var locArr = map.getLocArr();
            for (var i = 0; i < Game.ROW_NUM; i++) {
                for (var j = 0; j < Game.COL_NUM; j++) {
                    if (locArr[i][j]) {
                        this.drawItem(locArr[i][j]);
                    }
                }
            }
        },
        drawDiamond: function(diamond) {
            var self = this;
            var itemArr = diamond.getItemArr();
            itemArr.forEach(function(item) {
                self.drawItem(item);
            });
        },
        drawItem: function(item) {
            var ctx = this.ctx;
            var x = item.x;
            var y = item.y;
            var width = item.width;
            var height = item.height;
            ctx.fillStyle = '#000';
            ctx.fillRect(x * Game.ITEM_SIZE, y * Game.ITEM_SIZE, width, height);
            ctx.fillStyle = item.color;
            ctx.fillRect(x * Game.ITEM_SIZE + 1, y * Game.ITEM_SIZE + 1, width - 2, height - 2); // border一像素
        },
        clear: function() {
            this.ctx.clearRect(0, 0, this.width, this.height);
        }
    });

    function Map(row, col) {
        this.locArr = [];
        for (var i = 0; i < row; i++) {
            this.locArr.push(this.makeFalseArr(col));
        }
    }

    $.extend(Map.prototype, {
        makeFalseArr: function(len) {
            var arr = [];
            for (var i = 0; i < len; i++) {
                arr.push(false);
            }
            return arr;
        },
        getLocArr: function() {
            return this.locArr;
        },
        add: function(diamond) {
            var mapLocArr = this.locArr;
            var posArr = diamond.getPosArr();
            var color = diamond.color;
            try {
                posArr.forEach(function(each) {
                    if (mapLocArr[each.y][each.x]) {
                        // 覆盖了。。。
                        console.log('calculate error!');
                        throw 'calculate error!';
                    }
                    mapLocArr[each.y][each.x] = new Item({
                        x: each.x,
                        y: each.y
                    }, color, Game.ITEM_SIZE, Game.ITEM_SIZE);
                });
            } catch (ex) {
                console.error(ex);
                console.error(JSON.stringify(posArr));
            }

        }
    });

    function Game(param) {
        var $canvas = $('#playgrond canvas');
        $canvas.attr('width', Game.COL_NUM * Game.ITEM_SIZE);
        $canvas.attr('height', Game.ROW_NUM * Game.ITEM_SIZE);

        this.level = this.level || 1;
        this.speed = Game.SPEED_ARRAY[this.level];
        this.pen = new Pen($canvas);
        this.map = new Map(Game.ROW_NUM, Game.COL_NUM);
        this.pen.drawDiamond(DiamondHelper.makeRandomDiamond());
        this.observeInput();
        this.start();
        var self = this;
        requestAnimationFrame(function() {
            self.updateView();
        });
    }

    $.extend(Game, {
        ROW_NUM: 15,
        COL_NUM: 15,
        ITEM_SIZE: 30,
        SPEED_ARRAY: [1000, 700, 500]
    });

    $.extend(Game.prototype, {
        start: function() {
            var helper = DiamondHelper;
            if (!this.gameOver) {
                var self = this;
                if (!this.currDiamond) {
                    this.currDiamond = helper.makeRandomDiamond();
                }
                this.runId = setInterval(function() {
                    var currDiamond = self.currDiamond;
                    var mapLocArr = self.map.getLocArr();
                    if (helper.isDiamondDown(self.currDiamond, mapLocArr)) {
                        // if (false) {
                        self.map.add(self.currDiamond);
                        self.currDiamond = helper.makeRandomDiamond();
                    } else {
                        DiamondHelper.moveDown(currDiamond, mapLocArr);
                    }
                }, this.speed);
            } else {
                this.stop();
                this.renderGameOver();
            }
            this.isRun = true;
        },
        updateView: function() {
            // console.log('updateView');
            var self = this;
            this.pen.clear();
            this.pen.drawMap(this.map);
            this.pen.drawDiamond(this.currDiamond);
            requestAnimationFrame(function() {
                self.updateView();
            });
        },
        renderGameOver: function() {
            // body...
        },
        isGameOver: function() {
            // body...
        },
        stop: function() {
            clearInterval(this.runId);
            this.isRun = false;
        },
        observeInput: function() {
            var self = this;
            $(document).keyup(function(evt) {
                var keycode = evt.which;
                var currDiamond = self.currDiamond;
                var mapLocArr = self.map.getLocArr();
                switch (keycode) {
                    case 37: // arrow left
                    case 65: // a
                        DiamondHelper.move(currDiamond, 'left', 1, mapLocArr);
                        break;
                    case 38: // arrow top 顺时针旋转,shift键按下时，逆时针旋转
                    case 87: // w
                        if (evt.shiftKey) { // shiftkey 按下
                            DiamondHelper.scroll(currDiamond, 'left', mapLocArr);
                        } else {
                            DiamondHelper.scroll(currDiamond, 'right', mapLocArr);
                        }
                        break;
                    case 39: // arrow right
                    case 68: // arrow right
                        DiamondHelper.move(currDiamond, 'right', 1, mapLocArr);
                        break;
                    case 40: // arrow down
                    case 83: // s
                        DiamondHelper.move(currDiamond, 'down', 1, mapLocArr);
                        break;
                    case 32: // 空格 暂停,开始
                        if (self.isRun) {
                            self.stop();
                        } else {
                            self.start();
                        }
                        break;
                    default:
                        break;
                }

            });
        }
    });

    $(document).ready(function() {
        var game = new Game();
        // game.start();
    });
})(this, jQuery);
