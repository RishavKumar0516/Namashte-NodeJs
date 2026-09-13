const fs = require('fs');
const https = require('https');
const crypto = require('node:crypto');
// both way are used

console.log("hello world");

var a = 1287345;
var b = 23909;

// Password based key derivation function
crypto.pbkdf2('password', 'salt', 500000, 64, 'sha512', ()=> {
    console.log("Password Hashed");
})

// it takes password, salt for encryption, 50000 is iteration, how much more complex, you want to make your password more the interation, harder to decrypt, last one is digest we are using 'shall12' algorithm, 50 is the generated key length.
https.get('https://dummyjson.com/products/1', (res)=> {
    console.log("fetched data successfully.");
})

setTimeout(() => {
    console.log("settimeout called after 5 seconds");
}, 5000);

// fs.readFileSync('./file.txt', 'utf8');
// console.log("This will execute only after reading file.");


// async function
fs.readFile('./file.txt', 'utf8', (err, data)=> {
    console.log("file data", data);
})

function multiplyFn(x, y) {
    const result = x*y;
    return result;
}

var c = multiplyFn(a, b);
console.log("multiplication result", c);