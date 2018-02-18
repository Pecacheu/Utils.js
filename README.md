# Utils.js
#### Useful JavaScript Functions and Code

*More detailed usage & help in utils.js!*

### Custom Classes
- `UtilRect` Better class for working with element bounds.
- `Easing` Easing functions for use with *utils.map*.

### Prototype Extensions
- `[Function].wrap(...) returns Function` Wrap a function so that it always has a preset argument list when called.
- `String.trim() polyfill`
- `[String].startsWith(s) returns Boolean` Like Java.
- `[String].endsWith(s) returns Boolean` Like Java.
- `[Array].clean(kz)` Remove 'empty' elements like 0, false, ' ', undefined, and NaN from an array. Set 'kz' to true to keep '0's
- `[Array].remove(item) returns Boolean` Remove first instance of item from array. Returns false if not found.
- `Number [Element].index` Represents an element's index in it's parent. Set to -1 if the element has no parent.
- `[Element].insertChildAt(el,i)` Inserts child at index. Appends child to end if index exceeds child count.
- `UtilRect [Element].boundingRect` Element's bounding rect as a `UtilRect` object.
- `Math.cot(x) returns Number` No idea why this isn't built-in, but it's not.

### Main *utils* Class
- `utils.setCookie(name,value,exp,secure)` Set a cookie.
- `utils.getCookie(name) returns String or null` Get a cookie by name.
- `utils.remCookie(name)` Remove a cookie by name.
- `Boolean utils.mobile` This will be set to **true** if running on a mobile device, based on the UserAgent.
- `utils.copy(o[,sub]) returns Object` Deep (recursive) Object.create cloning function. If sub is set to false, will only copy 1 level deep.
- `utils.skinnedInput(el)` Fallback for when css *'appearance:none'* doesn't work. Generates container for input field for css skinning on unsupported browsers.
- `utils.numField(field[,min[,max[,decMax]]])` Turns your boring input field into a mobile-friendly number entry field with max/min & negative support!
- `utils.costField(field[,sym])` Turns your boring input field into a mobile-friendly currency entry field, optionally with custom currency symbol.
- `utils.formatCost(n[,sym]) returns String` Format Number as currency. Uses '$' by default.
- `utils.fromDateTimeBox(el) returns Date` Convert value from 'datetime-local' input to Date object.
- `utils.toDateTimeBox(d[,sec]) returns String` Convert Date object into format to set 'datetime-local' optionally including seconds if 'sec' is **true**.
- `utils.formatDate(d) returns String` Format Date object into human-readable string, including time.
- `utils.suffix(n) returns String` Add appropriate suffix to number. (ex. 31st, 12th, 22nd)
- `utils.goBack()` For AJAX navigation. Presses back button.
- `utils.goForward()` For AJAX navigation. Presses forward button.
- `utils.go(id, ...)` Push new history state for AJAX navigation. You can provide additional arguments to access later.
- `utils.onNav = function(id, ...)` Callback called when the browser wants to navigate to a page. Provides the page id (if any), as well as any optional additional arguments supplied to `utils.go`. This is also called when the page is first loaded, so it can work as a substitute to `window.onload`.
- `utils.mkEl(tag,parent,class,styles,innerHTML) returns Element` Quickly create element with parent, classes, style properties (as key/value pairs), and innerHTML content. All parameters (except for tag) are optional.
- `utils.mkDiv` Same as utils.mkEl, but assumes 'div' for tag.
- `utils.addText(el,text)` Appends a TextNode with given text to element.
- `utils.updateSize()` Updates variables `utils.width` and `utils.height` with window width and height.
- `utils.textWidth(text,font) returns Number` Get predicted width of text given css font style.
- `utils.define(obj,name,get,set)` Add getter/setter pair to an existing object. Set get or set to null to disable variable read or write.
- `utils.isBlank(o) returns Boolean` Check if string, array, or other object is empty.
- `utils.firstEmpty(arr) returns Number` Finds first empty (undefined/null) slot in array.
- `utils.firstEmptyChar(obj) returns String` Like *firstEmpty*, but uses letters from `utils.numToChar` instead.
- `utils.numToChar(n) returns String` Converts a number into letters (upper and lower) from a to Z.
- `utils.merge(target,source[,source2...]) returns target` Merges two (or more) objects, giving the last precedence. If both objects contain a property at the same index, and both are Arrays/Objects, they are merged.
- `utils.bounds(n,min,max) returns Number` Keeps value within max/min bounds. Also handles NaN or null.
- `utils.normalize(n,min,max) returns Number` 'Normalizes' a value so that it ranges from min to max, but unlike `utils.bounds`, this function retains input's offset. This can be used to normalize angles.
- `utils.cutStr(s,rem) returns String` Finds and removes all instances of 'rem' contained within String 's'
- `utils.parseCSS(prop) returns Object` Given css property value 'prop', returns object with space-seperated values from the property string.
- `utils.buildCSS(obj) returns String` Rebuilds css string from a *parseCSS* object.
- `utils.addClass(class,propList)` Create a css class and append it to the current document. Fill 'propList' object with key/value pairs repersenting the properties you want to add to the class.
- `utils.addId(id,propList)` Create a css selector and append it to the current document.
- `utils.addKeyframe(name,content)` Create a css keyframe and append it to the current document.
- `utils.removeSelector(name)` Remove a specific css selector (including the '.' or '#') from all stylesheets in the current document.
- `utils.hexToRgb(hex) returns Number` Converts HEX color to 24-bit RGB.
- `utils.rand(min,max) returns Number` Generates random interger from min to max.
- `utils.fromQuery(str) returns Object` Parses a url query string into an Object.
- `utils.toQuery(obj) returns String` Converts an object into a url query string.
- `utils.center(obj[,only[,type]])` Center objects with JavaScript, using a variety of methods. *See utils.js for details.*
- `utils.loadAjax(path,callback[,queryData[,contentType]]) returns Boolean` Loads a file and returns it's contents using HTTP GET. *See utils.js for details.*
- `utils.loadJSONP(path,callback,timeout)` Loads a file at the address from a JSONP-enabled server. Callback is fired with either recieved data, or **false** if unsucessful.
- `utils.loadFile(path,callback,timeout)` Good fallback for `utils.loadAjax`. Loads a file at the address via HTML object tag. Callback is fired with either recieved data, or **false** if unsucessful.
- `utils.rad(deg)` / `utils.deg(rad)` Convert between radians and degrees.
- `utils.map(input,minIn,maxIn,minOut,maxOut,ease) returns Number` Pecacheu's ultimate unit translation formula. Bounds Checking: NO, Rounding: NO, Max/Min Switching: NO, Easing: YES