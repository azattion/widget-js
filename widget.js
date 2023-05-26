(function (window) {
    (function (window) {
        window.__parseFunction = function (__func, __attrs) {
            __attrs = __attrs || [];
            __func = '(function(' + __attrs.join(',') + '){' + __func + '})';
            return window.execScript ? window.execScript(__func) : eval(__func);
        }
    }(window));
    (function (window) {

        function addEvent(el, event, handler) {
            var events = event.split(/\s+/);
            for (var i = 0; i < events.length; i++) {
                if (el.addEventListener) {
                    el.addEventListener(events[i], handler);
                } else {
                    el.attachEvent('on' + events[i], handler);
                }
            }
        }

        function removeEvent(el, event, handler) {
            var events = event.split(/\s+/);
            for (var i = 0; i < events.length; i++) {
                if (el.removeEventListener) {
                    el.removeEventListener(events[i], handler);
                } else {
                    el.detachEvent('on' + events[i], handler);
                }
            }
        }

        function getCssProperty(el, prop) {
            if (window.getComputedStyle) {
                return window.getComputedStyle(el, '').getPropertyValue(prop) || null;
            } else if (el.currentStyle) {
                return el.currentStyle[prop] || null;
            }
            return null;
        }

        var getWidgetsOrigin = function (default_origin) {
            var link = document.createElement('A'), origin;
            link.href = document.currentScript && document.currentScript.src || default_origin;
            origin = link.origin || (link.protocol + '//' + link.hostname);
            console.log(origin);
            return origin;
        };

        //function getXHR() {
        //    if (navigator.appName == "Microsoft Internet Explorer"){
        //        return new ActiveXObject("Microsoft.XMLHTTP");
        //    } else {
        //        return new XMLHttpRequest();
        //    }
        //}

        function initWidget(widgetEl) {
            var widgetId, widgetElId, widgetsOrigin, existsEl,
                src, styles = {}, allowedAttrs = [], defWidth, defHeight, ration, parentWidth;
            if (!widgetEl.tagName || !(widgetEl.tagName.toUpperCase() == 'SCRIPT' || widgetEl.classList.contains('aki-url'))) {
                return null;
            }
            if (widgetId = widgetEl.getAttribute('data-aki-url')) {
		r = /^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/?\n]+)\.(\w){1,3}/igm
		if(r.test(widgetId)){
			widgetsOrigin = 'https://';
		} else {                	
			widgetsOrigin = 'https://akipress.org/';			
		}
		src = widgetsOrigin + widgetId;
                widgetElId = 'aki-' + widgetId.replace(/[^a-z0-9_]/ig, '-');               
                allowedAttrs = ['userpic', 'single?'];
                defWidth = widgetEl.getAttribute('data-width') || '100%';
                defHeight = '';
                styles.minWidth = '320px';
            }
            else {
                return null;
            }
            existsEl = document.getElementById(widgetElId);
            if (existsEl) {
                return existsEl;
            }
            for (var i = 0; i < allowedAttrs.length; i++) {
                var attr = allowedAttrs[i];
                var novalue = attr.substr(-1) == '?';
                if (novalue) {
                    attr = attr.slice(0, -1);
                }
                var data_attr = 'data-' + attr.replace(/_/g, '-');
                if (widgetEl.hasAttribute(data_attr)) {
                    var attr_value = novalue ? '1' : encodeURIComponent(widgetEl.getAttribute(data_attr));
                    src += '&' + attr + '=' + attr_value;
                }
            }

            function postMessageHandler(event) {
                if (event.source !== iframe.contentWindow ||
                    event.origin != widgetsOrigin) {
                    return;
                }
                try {
                    var data = JSON.parse(event.data);
                } catch(e) {
                    var data = {};
                }
                if (data.event == 'resize') {
                    if (data.height) {
                        iframe.style.height = data.height + 'px';
                    }
                    if (data.width) {
                        iframe.style.width = data.width + 'px';
                    }
                }
            }

            function isVisible(el, padding) {
                var node = el, val;
                var visibility = getCssProperty(node, 'visibility');
                if (visibility == 'hidden') return false;
                while (node) {
                    if (node === document.documentElement) break;
                    var display = getCssProperty(node, 'display');
                    if (display == 'none') return false;
                    var opacity = getCssProperty(node, 'opacity');
                    if (opacity !== null && opacity < 0.1) return false;
                    node = node.parentNode;
                }
                if (el.getBoundingClientRect) {
                    padding = +padding || 0;
                    var rect = el.getBoundingClientRect();
                    var html = document.documentElement;
                    if (rect.bottom < padding ||
                        rect.right < padding ||
                        rect.top > (window.innerHeight || html.clientHeight) - padding ||
                        rect.left > (window.innerWidth || html.clientWidth) - padding) {
                        return false;
                    }
                }
                return true;
            }

            function visibilityHandler() {
                try {
                    if (isVisible(iframe, 50)) {
                        var data = {event: 'visible', frame: widgetElId};
                        iframe.contentWindow.postMessage(JSON.stringify(data), '*');
                        // console.log('send', data);
                    }
                } catch(e) {}
            }

            function resizeHandler() {
                try {
                    var data = {event: 'visible', frame: widgetElId};
                    iframe.contentWindow.postMessage(JSON.stringify(data), '*');
                    iframe.height = iframe.contentWindow.document.body.scrollHeight;
                } catch (e) {
                }
                console.log(iframe.contentWindow.document.body.scrollHeight);
            }

            var iframe = document.createElement('iframe');
            iframe.id = widgetElId;
            iframe.src = src;
            iframe.width = defWidth;
            iframe.height = defHeight;
            iframe.setAttribute('frameborder', '0');
            iframe.setAttribute('scrolling', 'no');
            iframe.style.border = 'none';
            iframe.style.overflow = 'hidden';
            for (var prop in styles) {
                iframe.style[prop] = styles[prop];
            }
            if (widgetEl.parentNode) {
                widgetEl.parentNode.insertBefore(iframe, widgetEl);
            }
            addEvent(iframe, 'load', function() {
                removeEvent(iframe, 'load', visibilityHandler);
                addEvent(window, 'scroll', visibilityHandler);
                addEvent(window, 'resize', visibilityHandler);
                visibilityHandler();
            });
            addEvent(window, 'message', postMessageHandler);
            return iframe;
        }

        if (!document.currentScript || !initWidget(document.currentScript)) {
            var widgets;
            if (document.querySelectorAll) {
                widgets = document.querySelectorAll('script[data-aki-url]');
            } else {
                widgets = Array.prototype.slice.apply(document.getElementsByTagName('SCRIPT'));
            }
            for (var i = 0; i < widgets.length; i++) {
                initWidget(widgets[i]);
            }
        }
    }(window));
})(window);
