# Utils.js
###### If you, like many developers, prefer native JavaScript to jQuery, but can't live without those one or two essential features, then you need Utils.js!

Note: For production code, the minified version *utils.min.js* should be used. There's also *utilsES5.js*. It's been converted to the older ES5 standard, so should be more compatible with older browsers. Expect IE. Literally no one cares about IE :(

*More detailed usage & help available in utils.js!*

#### The most commonly functions in this library are:

*utils.mkEl(t,p,c,s,i) utils.mkDiv(p,c,s,i)* To use these quickly and efficiently, just remember PCSI: Parent, class, style, innerHTML!

*utils.center(obj[,only[,type]])* Does what it says on the tin! Input an Element, choose whether you want X, Y, or by default, both, and change the centering type.

*UtilRect* Getting the bounds/position of an element used to be a complete mess with incompatibilities across every browser. Not anymore! Use UtilRects to keep track of your object positions! Simply access the *boundingRect* property of any Element and you can access it's *top*, *bottom*, *left*, *right*, *width*, and *height* on the client's screen! If you need this relative to the top of the page, it's as simple as `Element.boundingRect.top + window.scrollY`

*[Function].wrap* This can be quite useful in combination with functions like *setTimeout*, for example `setTimeout(console.log.wrap("Hello!"), 50)`. Also sets the *this* object inside the function to *arguments*, in case you want to access the calling arguments as well!

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
- `[Array].each(fn[,start[,end]]) returns Any` Calls fn on each index of array, with optional start and end index.
- `Number [Element].index` Represents an element's index in it's parent. Set to -1 if the element has no parent.
- `[Element].insertChildAt(el,i)` Inserts child at index. Appends child to end if index exceeds child count.
- `UtilRect [Element].boundingRect` Element's bounding rect as a `UtilRect` object.
- `UtilRect [Element].innerRect` Element's inner rect (excluding margin, padding, and border)
- `Math.cot(x) returns Number` No idea why this isn't built-in, but it's not.
- `[TouchList].get(id) returns Touch` Gets touch by id, returns null if none found.

### Main *utils* Class
- `String utils.VER` Current library version.
- `Number utils.w` and `Number utils.h` Cross-platform window width and height.
- `Boolean utils.mobile` Will be **true** if running on a mobile device, based on the UserAgent.
- `utils.setCookie(name,value,exp,secure)` Set a cookie.
- `utils.getCookie(name) returns String or null` Get a cookie by name.
- `utils.remCookie(name)` Remove a cookie by name.
- `utils.setPropSafe(obj, path, val, onlyNull=false)` Set a nested property, even if higher levels don't exist. Useful for defining settings in a complex config object.
- `utils.getPropSafe(obj, path) returns Object` Gets a nested property, returns undefined if any level doesn't exist.
- `utils.copy(o[,sub]) returns Object` Deep (recursive) Object.create. Copies down to given sub levels, all levels if undefined.
- `utils.skinnedInput(el)` Fallback for when css *'appearance:none'* doesn't work. Generates container for input field for css skinning on unsupported browsers.
- `utils.numField(field[,min[,max[,decMax]]])` Turns your boring input field into a mobile-friendly number entry field with max/min & negative support!
- `utils.costField(field[,sym])` Turns your boring input field into a mobile-friendly currency entry field, optionally with custom currency symbol.
- `utils.formatCost(n[,sym]) returns String` Format Number as currency. Uses '$' by default.
- `utils.fromDateTimeBox(el) returns Date` Convert value from 'datetime-local' input to Date object.
- `utils.toDateTimeBox(d[,sec]) returns String` Convert Date object into format to set 'datetime-local' optionally including seconds if 'sec' is **true**.
- `utils.formatDate(d[,opts]) returns String` Format Date object into a pretty string, with various options.
- `utils.months` Array of months from Jan to Dec.
- `utils.suffix(n) returns String` Add appropriate suffix to number. (ex. 31st, 12th, 22nd)
- `utils.goBack()` For AJAX navigation. Presses back button.
- `utils.goForward()` For AJAX navigation. Presses forward button.
- `utils.go(url, data)` Push new history state for AJAX navigation. You can provide additional data to access later.
- `utils.onNav = function(data)` Callback called when the browser wants to navigate to a page. Provides the optional data argument supplied to `utils.go`. Also called when the page is first loaded, directly after `window.onload`.
- `utils.mkEl(tag,parent,class,styles,innerHTML) returns Element` Quickly create element with parent, classes, style properties (as key/value pairs), and innerHTML content. All parameters (except for tag) are optional.
- `utils.mkDiv` Same as utils.mkEl, but assumes 'div' for tag.
- `utils.addText(el,text)` Appends a TextNode with given text to element.
- `utils.textWidth(text,font) returns Number` Get predicted width of text given css font style.
- `utils.define(obj,name,get,set)` Add getter/setter pair to an existing object. Set get or set to null to disable variable read or write.
- `utils.isBlank(o) returns Boolean` Check if string, array, or other object is empty.
- `utils.firstEmpty(arr) returns Number` Finds first empty (undefined/null) slot in array.
- `utils.firstEmptyChar(obj) returns String` Like *firstEmpty*, but uses letters from `utils.numToChar` instead.
- `utils.numToChar(n) returns String` Converts a number into letters (upper and lower) from a to Z.
- `utils.merge(target,source[,source2...]) returns target` Merges two (or more) objects, giving the last precedence. If both objects contain a property at the same index, and both are Arrays/Objects, they are merged.
- `utils.bounds(n,min=0,max=1) returns Number` Keeps value within max/min bounds. Also handles NaN or null.
- `utils.norm` *OR* `utils.normalize(n,min=0,max=1) returns Number` 'Normalizes' a value so that it ranges from min to max, but unlike `utils.bounds`, this function retains input's offset. This can be used to normalize angles.
- `utils.cutStr(s,rem) returns String` Finds and removes all instances of 'rem' contained within String 's'
- `utils.dCut(data,startString,endString[,index[,searchStart]]) returns String` Cuts text out of 'data' from first instance of 'startString' to next instance of 'endString'.
- `utils.dCutToLast(data,startString,endString[,index[,searchStart]]) returns String` Same as *utils.dCut* but using lastIndexOf for end search.
- `utils.dCutLast(data,startString,endString[,index[,searchStart]]) returns String` Same as *utils.dCut* but using lastIndexOf for start search.
- `utils.parseCSS(prop) returns Object` Given css property value 'prop', returns object with space-separated values from the property string.
- `utils.buildCSS(obj) returns String` Rebuilds css string from a *parseCSS* object.
- `utils.addClass(class,propList)` Create a css class and append it to the current document. Fill 'propList' object with key/value pairs repersenting the properties you want to add to the class.
- `utils.addId(id,propList)` Create a css selector and append it to the current document.
- `utils.addKeyframe(name,content)` Create a css keyframe and append it to the current document.
- `utils.removeSelector(name)` Remove a specific css selector (including the '.' or '#') from all stylesheets in the current document.
- `utils.getId(id[,parent]) returns Element` Shorthand way to get element by id. Parent defaults to document.
- `utils.getClassList(class[,parent]) returns Array` Shorthand way to get list of elements with class name. Parent defaults to document.
- `utils.getClassFirst(class[,parent]) returns Element` Get first element with class, otherwise return null. Parent defaults to document.
- `utils.getClassOnly(class[,parent]) returns Element` Get element with class if there's only one, otherwise return null. Parent defaults to document.
- `utils.hexToRgb(hex) returns Number` Converts HEX color to 24-bit RGB.
- `utils.rand(min,max[,res[,ease]]) returns Number` Generates random from min to max, optionally with a decimal resolution (10, 100, 1000, etc.) or custom ease, changing the probability of various numbers being generated.
- `utils.fromQuery(str) returns Object` Parses a url query string into an Object.
- `utils.toQuery(obj) returns String` Converts an object into a url query string.
- `utils.center(obj[,only[,type]])` Center objects with JavaScript, using a variety of methods. *See utils.js for details.*
- `utils.loadAjax(path,[callback[, meth[, body[, hdList]]]])` Loads a file and returns it's contents, using GET by default. *See utils.js for details.*
- `utils.loadJSONP(path,callback,timeout)` Loads a file at the address from a JSONP-enabled server. Callback is fired with either received data, or **false** if unsuccessful.
- `utils.loadFile(path,callback,timeout)` Good fallback for `utils.loadAjax`. Loads a file at the address via HTML object tag. Callback is fired with either received data, or **false** if unsuccessful.
- `utils.dlFile(filename,uri) returns Promise` Downloads a file from a link.
- `utils.dlData(filename,data)` Downloads a file generated from a Blob or ArrayBuffer.
- `utils.rad(deg)` / `utils.deg(rad)` Convert between radians and degrees.
- `utils.map(input,minIn,maxIn,minOut,maxOut,ease) returns Number` For unit translation and JS animation! See ease functions in *untils.js*.
- `utils.delay(ms) returns Promise` setTimeout but async.