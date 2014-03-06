# JSON Compressor


Sometimes we need to sqeeuze more JSON together.

But we need to keep it JSON compatible so we come up with nifty solutions.

JSON Compressor is one of them. it is a smart compressor, it only transforms object arrays with 3 of more items into a compressed array. 

JSON Compressor has 3 modes passive (default), aggresive and recursive

# NodeJS

for NodeJS use

`npm i https://github.com/EaterOfCode/JSON-Compressor/archive/master.tar.gz`

and 

`var JSONCompressor = require('json-compressor');`

I dont want to pollute NPM with this *rubbish*

## Passive

Passive will transform your beautiful objects into a table like object with one array columns and an array with alot of arrays with the values

## Aggresive

Aggresive will throw everything just in one big array.

## Recursive

is aggresive but will also compress a level deeper.

# API

`JSONCompressor`
*	`parse (str, mode) returns object`
*	`stringify (obj, mode, spacing) returns string` 

# Warning!

JSON Compressor is a lossy compressor! nulls will be assigned or ignored.
All code is written a year ago and is messy.