require('./calculateSum');
const { calculateSum, multiplyNum } = require('./calculate');
const util = require("node:util");

// getting JSON files
const data = require("./data.json");
console.log(data);

var name = 'Namashte React';

var a = 10;

var b = 20;

console.log(name);

var result = a+b;
console.log("result", result);

// to run this above code of this file, open the terminal with the file location and run node app.js

console.log("global", global);

console.log(this);

// reference the video to know about globalThis
console.log(globalThis === global);
//  now instead of importing each of the function individually we can import them all at once from the index.js file
console.log(calculateSum(10, 20));
console.log(multiplyNum(10, 20));

// so when you have lot of files and each files have 100 of functions, so you try to group together this files and create a seperate module.

// inside app.js, it doesn't need to know, how calculateSum.js wrtie its modules, so app.js has the abstraction.


// There are some other module that present in the core of nodeJs
// const util = require("node:util");
