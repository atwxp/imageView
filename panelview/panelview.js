define(function (require, exports, module) {
    var $ = require('zepto');
    var onscroll = require('util/onscroll');
    var Emitter = require('util/emitter');

    var clone = function (obj) {
        var ret = {};

        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (typeof obj[key] === 'object') {
                    ret[key] = clone(obj[key]);
                }
                else {
                    ret[key] = obj[key];
                }
            }
        }

        return ret;
    };

    var extend = function (target, source, alone) {
        source = source || {};

        target = alone ? clone(target) : target;

        for (var key in source) {
            if (source.hasOwnProperty(key)) {
                target[key] = source[key];
            }
        }

        return target;
    };

    var getPageOffset = function () {
        var t = document.documentElement || document.body.parentNode;

        if (window.pageYOffset !== undefined) {
            var y = window.pageYOffset;
        }
        else {
            y = (t && typeof t.scrollTop === 'number' ? t : document.body).scrollTop;
        }

        if (window.pageXOffset !== undefined) {
            var x = window.pageXOffset;
        }
        else {
            x = (t && typeof t.scrollLeft === 'number' ? t : document.body).scrollLeft;
        }

        return {
            x: x,
            y: y
        };
    };

    /**
     * constructor
     *
     * @param {Object}                options,      options for panelview
     * @param {Zepto|DOM|HTMLElement} options.main, nav&panel's container
     * @param {Object}                options.map,  nav panel map
     * @param {number}                options.thresold, thresold
     * @param {number}                options.proportion, the body proportion to be change nav
     */
    function PanelView(options) {
        this.options = {
            main: '',
            map: {},
            thresold: 0,
            proportion: .8
        };

        extend(this.options, options);

        this.init();
    }

    Emitter.mixTo(PanelView.prototype);

    PanelView.prototype.init = function () {
        var options = this.options;
        var map = options.map;

        var main = this.main = $(options.main);

        var panelNodes = [];
        for (var k in map) {
            if (map.hasOwnProperty(k)) {
                var nav = main.find(k);                    
                var panel = main.find(map[k]);

                if (nav.length && panel.length) {
                    panelNodes[panelNodes.length] = {
                        nav: nav,
                        panel: panel,
                        top: panel.offset().top,
                        height: panel.height()
                    }
                }
            }
        }

        if (!panelNodes.length) {
            return;
        }

        this.panelNodes = this.sortPanel(panelNodes);

        this.bindEvent();
    };

    /**
     * 对panel按照offset.top从小到大排序
     *
     * @param {Array} arr panel array
     *
     * @return {Array} sorted panel
     */
    PanelView.prototype.sortPanel = function (arr) {
        var l = arr.length;
        var temp;

        for (var i = 0; i < l - 1; i++) {
            var minIndex = i;

            for (var j = i + 1; j < l; j++) {
                if (arr[j].top < arr[minIndex].top) {
                    minIndex = j;
                }
            }

            if (minIndex !== i) {
                temp = arr[minIndex];
                arr[minIndex] = arr[i];
                arr[i] = temp;
            }
        }

        return arr;
    };

    PanelView.prototype.bindEvent = function () {
        var me = this;

        $.each(this.panelNodes, function (index, node) {
            node.nav.on('click', function () {
                me.scrollToPanel(index);
            });
        });

        onscroll.add(this.scrollBack.bind(this));
    };

    /**
     * scroll发生的处理逻辑
     */
    PanelView.prototype.scrollBack = function () {
        var options = this.options;
        var proportion = options.proportion;
        var thresold = options.thresold;

        var panelNodes = this.panelNodes;

        var pageY = getPageOffset().y;
        var len = panelNodes.length;
        var min = 9999;
        var cur = 0;

        $.each(panelNodes, function (index, node) {
            var panel = panelNodes[index];

            var diff = pageY - panel.top - thresold;

            if (diff >= 0 && diff <= min) {
                min = diff;

                if (diff >= panel.height * proportion) {
                    cur = Math.min(index + 1, len - 1);
                }

                else {
                    cur = index;
                }
            }
        });

        this.fire('change', cur, this.isInViewport(pageY));
    };

    /**
     * 判断panel是否在视口内
     *
     * @param {number} scrollTop 页面的滚动距离
     * @return {boolean}
     */
    PanelView.prototype.isInViewport = function (scrollTop) {
        var options = this.options;
        var thresold = options.thresold;

        var pn = this.panelNodes;

        var panelStart = pn[0].top + thresold;

        var lastPanel = pn[pn.length - 1];

        var panelEnd = lastPanel.height + lastPanel.top + thresold;

        var winH = window.innerHeight;

        return (panelStart < (scrollTop + winH) && panelEnd > scrollTop);
    };

    PanelView.prototype.scrollToPanel = function (index) {
        var thresold = this.options.thresold;

        var top = this.panelNodes[index].top;

        window.scrollTo(0, top + thresold);
    };

    PanelView.prototype.dispose = function () {
        $.each(this.panelNodes, function (index, node) {
            node.nav.off('click');
        });

        onscroll.remove(this.scrollBack.bind(this));
    };

    module.exports = PanelView;
});
