const fs = require('fs');
const a = 100;

setImmediate(()=> console.log("setImmediate"));

Promise.resolve('Promise').then(()=> console.log("Promise"))

fs.readFile('./test.txt', (err, data)=> {
    setTimeout(()=> console.log("second timer"), 0);

    process.nextTick(()=> console.log("2nd nextTick"));

    setImmediate(()=> console.log("2nd setImmediate"));
})

setTimeout(()=>{
    console.log("setTimeout cb")
},0);

process.nextTick(()=> console.log("process.nextTick"))

console.log("Last line of the file.");

// Last line of the file.
// process.nextTick
// Promise cb   
// setTimeout cb
// setImmediate
// File Reading CB
//2nd nextTick
// 2nd setImmediate
// second timer

// The actual representation of event loop is done by libuv.
// so learn the event loop from nodejs and libuv documentation.




