const fs = require('fs');
const a = 100;

setImmediate(()=> console.log("setImmediate"));

Promise.resolve('Promise').then(()=> console.log("Promise"))

fs.readFile('./test.txt', (err, data)=> {
    console.log("File Reading cb");
})

setTimeout(()=>{
    console.log("setTimeout cb")
},0);

process.nextTick(()=> console.log("process.nextTick"))

function printA() {
    console.log("a", a);
}

printA();
console.log("Last line of the file.");


// a =100
// last line of the file
// process.nextTick
// Promise cb   
// setTimeout cb
// setImmediate
// File Reading CB

