const fs = require("fs");
const crypto = require("crypto");

process.env.UV_THREADPOOL_SIZE = 4;


crypto.pbkdf2("password", "salt", 5000000, 64, "sha512", ()=>{
    console.log("1 - cryptoPBKDF2 done");
});

// fs.readFile("./text.txt", ()=> {
//     console.log("File Reading CB");
// });

crypto.pbkdf2("password", "salt", 5000000, 64, "sha512", ()=>{
    console.log("2 - cryptoPBKDF2 done");
});
crypto.pbkdf2("password", "salt", 5000000, 64, "sha512", ()=>{
    console.log("3 - cryptoPBKDF2 done");
});
crypto.pbkdf2("password", "salt", 5000000, 64, "sha512", ()=>{
    console.log("4 - cryptoPBKDF2 done");
});

// if you comment this fs code, and execute it, you will see that both the crypto code resolve at same time. because as soon as JS Engine finds the code, it sees this is asynchronous code. so it offloads this to libuv. libuv asign the threadpool to first pbkdf2 and the second pbkdf2.

//  suppose if there are for crypto call then it libuv will assign each thread poll to each crypto.pbkdf2, but there oder can differ. because each crypto will get assigned the thread poll, and whatever callback will get resolved and added in the queue, will execte first. that's why the order is not guarenteed.

// if add the one more crypto call then first 4 will give the result at same time, then next 5th one get called, because 4 threads are alloted to 4 different crypto calls.

// you can change the size of the thread poll, by using the variable mentioned above, whose default value is 4

// process.env.UV_THREADPOOL_SIZE = 10;
// now 10 threads will be alloted to 10 different crypto calls.

// so if your server needs to do lot of work that depends on the thread pool then you should increase the thread pool size.


// Does API call uses thread poll?

// No, it does not.

// API calls does not use thread poll because it is handled by the OS kernel. And OS kernel is single threaded.



/** 
 * how does libuv communicates with operating system?
 * 
 * All the networking happens in the sockets. Each socket has the socket descriptor/file descriptor..
 * suppose the connection is made now you want to do write operation, you cannot do anything on the thread, suppose you   get thausand request will you going to make the thausand thread?
 * 
 * No we doesn't going to create the thausand thread. The nodejs doesn't do that.
 * 
 * 
 */


