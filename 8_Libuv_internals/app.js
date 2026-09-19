const fs = require('fs');
const a = 100;

setImmediate(()=> console.log("setImmediate"));

fs.readFile('./test.txt', (err, data)=> {
    console.log("File Reading cb");
})

setTimeout(()=>{
    console.log("setTimeout cb")
},0);

function printA() {
    console.log("a", a);
}

printA();
console.log("Last line of the file.");


// a =100
// last line of the file
// setTimeout cb
// setImmediate
// File Reading CB


