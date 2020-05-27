# Word Cloud Layout

Not same as Wordle [https://github.com/jasondavies/d3-cloud], this library uses the scanning line algorithm to ensure a compact layout, and also it applies the Fisheye Distortion mentioned in this paper [Understanding Text Corpora with Multiple Facets].

## Usage

See the samples in `examples/`.

```

const len = 100
const text = 'The layout algorithm for positioning words without overlap is available on GitHub under an open source license as d3-cloud. Note that this is the only the layout algorithm and any code for converting text into words and rendering the final output requires additional development'.toLowerCase()
const segs = text.split(' ')
const words = segs.map(d => ({ text: d, size: Math.random() * 20 + 10 }))

let cloud = d3.wordcloud()
cloud.words(words)
.size([500, 500])
.fontSize((d) => d.size)
.font('Microsoft Yahei')
.on('end', function(words){
    let svg = d3.select("#wordcloud")
    svg.selectAll('.word').data(words).enter()
        .append('text')
        .text(d => d.text)
        .attr('class', 'word')
        .attr('x', d => d.x)
        .attr('y', d => d.y)
        .attr('font-size', d => `${d.size}px`)
        .attr('font-family', d => d.font)
})
.start()

```

## API Reference

<a name="cloud" href="#cloud">#</a> d3.<b>wordcloud</b>()

Constructs a new cloud layout instance.

<a name="on" href="#on">#</a> <b>on</b>(<i>type</i>, <i>listener</i>)

Registers the specified *listener* to receive events of the specified *type*
from the layout. Currently, only "word" and "end" events are supported.

A "word" event is dispatched every time a word is successfully placed.
Registered listeners are called with a single argument: the word object that
has been placed.

An "end" event is dispatched when the layout has finished attempting to place
all words.  Registered listeners are called with two arguments: an array of the
word objects that were successfully placed, and a *bounds* object of the form
`[{x0, y0}, {x1, y1}]` representing the extent of the placed objects.

<a name="start" href="#start">#</a> <b>start</b>()

Starts the layout algorithm.  This initialises various attributes on the word
objects, and attempts to place each word, starting with the largest word.
Starting with the centre of the rectangular area, each word is tested for
collisions with all previously-placed words.  If a collision is found, it tries
to place the word in a new position along the spiral.

**Note:** if a word cannot be placed in any of the positions attempted along
the spiral, it is **not included** in the final word layout.  This may be
addressed in a future release.

<a name="stop" href="#stop">#</a> <b>stop</b>()

Stops the layout algorithm.

<a name="timeInterval" href="#timeInterval">#</a> <b>timeInterval</b>([<i>time</i>])

Internally, the layout uses `setInterval` to avoid locking up the browser’s
event loop.  If specified, **time** is the maximum amount of time that can be
spent during the current timestep.  If not specified, returns the current
maximum time interval, which defaults to `Infinity`.

<a name="words" href="#words">#</a> <b>words</b>([<i>words</i>])

If specified, sets the **words** array.  If not specified, returns the current
words array, which defaults to `[]`.

<a name="size" href="#size">#</a> <b>size</b>([<i>size</i>])

If specified, sets the rectangular `[width, height]` of the layout.  If not
specified, returns the current size, which defaults to `[1, 1]`.

<a name="polygon" href="#polygon">#</a> <b>polygon</b>([<i>polygon</i>])

If specified, sets the sequence of vertices of a convex polygon, representing the outer border of the cloud;  If not
specified, the default is `[[0, 0], [0, height], [width, height], [width, 0]]`

<a name="font" href="#font">#</a> <b>font</b>([<i>font</i>])

If specified, sets the **font** accessor function, which indicates the font
face for each word.  If not specified, returns the current font accessor
function, which defaults to `"serif"`.
A constant may be specified instead of a function.

<a name="fontStyle" href="#fontStyle">#</a> <b>fontStyle</b>([<i>fontStyle</i>])

If specified, sets the **fontStyle** accessor function, which indicates the
font style for each word.  If not specified, returns the current fontStyle
accessor function, which defaults to `"normal"`.
A constant may be specified instead of a function.

<a name="fontWeight" href="#fontWeight">#</a> <b>fontWeight</b>([<i>fontWeight</i>])

If specified, sets the **fontWeight** accessor function, which indicates the
font weight for each word.  If not specified, returns the current fontWeight
accessor function, which defaults to `"normal"`.
A constant may be specified instead of a function.

<a name="fontSize" href="#fontSize">#</a> <b>fontSize</b>([<i>fontSize</i>])

If specified, sets the **fontSize** accessor function, which indicates the
numerical font size for each word.  If not specified, returns the current
fontSize accessor function, which defaults to:

```js
function(d) { return Math.sqrt(d.value); }
```

A constant may be specified instead of a function.

<a name="text" href="#text">#</a> <b>text</b>([<i>text</i>])

If specified, sets the **text** accessor function, which indicates the text for
each word.  If not specified, returns the current text accessor function, which
defaults to:

```js
function(d) { return d.text; }
```

A constant may be specified instead of a function.

<a name="padding" href="#padding">#</a> <b>padding</b>([<i>padding</i>])

If specified, sets the **padding** accessor function, which indicates the
numerical padding for each word.  If not specified, returns the current
padding, which defaults to 1.
