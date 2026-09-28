

![alt text](image-1.png)


![alt text](image.png)


- Create a repository
- Initialize the repository
- node_modules, package.json, package-lock.json
- Install Express
- Create a server
- Listen to port 7777
- Write request handlers for /test, /hello
- install nodemon and update scripts inside package.json
- difference b/w caret(^) and tilde(~) 
- What are dependecies?


Routing and request handlers
- when you use app.use() it will match all the HTTP menthod API calls to /test

![alt text](image-2.png)

playing with the routes

when you use app.use() it will match all the HTTP menthod API calls to /test
app.use('/test', (req, res) => {
    res.send("Hello Rishav")
})

app.use('/hello', (req,res)=> {
    res.send("hello")
})


app.use('/', (req,res)=> {
    res.send("Abra ka dabra")
})

app.use('/user', (req,res, next)=> {
    res.send("Hello there")
})

app.get("/user", (req, res)=> {
    res.send("User page hit")
})

app.post("/user", (req, res)=> {
    res.send("User page hit")
})

to read query params

app.get("/users", (req,res)=> {
    console.log(req.query);
    
    res.send("Query page hit")
})

dynamic route param

app.get("/users/:id/:name/:password", (req,res)=> {
    console.log(req.params.id);
    
    res.send("Query page hit")
})

on adding ? mark here, it means b can appear 0 or 1 time 
app.get("/abc", (req,res)=> {
    res.send("ab?c")
})

app.get(/.*fly$/, (req, res) => {
    res.send({ firstName: "Akshay", lastName: "Saini" });
});

 This is a regular-expression route.

 What does /.*fly$/ mean?
 .* → any number of any characters
 fly → must contain fly at the end
 $ → end of the URL/path

 So it can match:

 /fly
 /butterfly
 /dragonfly
 /hello-fly
 /anythingfly

 But not:

 /fly/test
 /butterfly/abc
 /flight



 if you don't return any thing from the route handler then it will go in to the infinite loop.
 ex -
 app.use("/users", (req, res)=> {

 })


 One route can have multiple route handler

 ![alt text](image-3.png)



 //  One route can have multiple route handler
//  as soon as you hit to the /user, it will go to the first route handler and execute the code line by line. because at the end its a js code that going to run by v8 engine, and v8 execute the code line by line. because Js is synchronous single threaded language.
// as soon as it will send the response from first route handler, it will not go to the next route handler. 

// lets consider if there is no res.send is present inside the first handler, then what happen, will it automatically gets inside the second handler and execute the line there?
// Ans: No it will not goes automatically inside the second handler, so express doesn't do this automatically. so express says that you havce one more parameter in the request handler known as next, and you can call this next() after excuting your lines inside the first handler, and then it will goes to the second handler and execute the lines inside the second handler. and so on.


// if you do both thing from the handler like
/**
 * res.send("response");
 * next();
 * 
 * then it will send the response and then goes to the next handler and run the code there as well, but when it finds the second res.send() function it will give the error,as it will try to sensd the another respose via same connection or url.
 * as we  know that when client send the request the TCP connection is made and when the response is send then the connection is losed.
 */

// EX: 1
// app.use("/user", 
//     (req, res, next)=> {
//         console.log("hello");
//         // res.send("Response 1!!"); // if doesn't send any response then your request will hang, unless you call next() so that the next handler can execute and send response
//         next();
//     },
//     (req, res, next)=> {
//         console.log("hello");
//         res.send("Response 2!!")
//     }
// )

// EX:2

// in this example, it will run the route handler code line by line, once it finds the next() function call inside the first handler, it will goes to the second handler and execute the lines inside the second handler, in the second handler, there res.send() is present, so it will send the response and then get back to the same first handler and will continue to execute the remaining lines inside that first handler, i.e. res.send("Response 1!!") and which will throw an error as it will try to send another response via same connection.

// you can attach as many request handler as you can

// app.use("/user", 
//     (req, res, next)=> {
//         console.log("hello");
//         next();
//         res.send("Response 1!!");
//     },
//     (req, res, next)=> {
//         console.log("hello");
//         res.send("Response 2!!")
//     }
// )

// EX:3
// It will give the error, because here express is expecting of another route handler as we are calling the next () inside the last handler.
// app.use("/user", 
//     (req, res, next)=> {
//         console.log("hello");
//         next();
//     },
//     (req, res, next)=> {
//         console.log("hello");
//         next();
//     }
// )

// you can also pass the array of handers and it will work same
// app.use("/user", 
//     [(req, res, next)=> {
//         console.log("hello1");
//         next();
//     },
//     (req, res, next)=> {
//         console.log("hello2");
//         next();
//     },
//     (req, res, next)=> {
//         console.log("hello3");
//         res.send("Response 3!!")
//     }]
// )

// this is also possible

// app.use("/user", 
//     [(req, res, next)=> {
//         console.log("hello1");
//         next();
//     },
//     (req, res, next)=> {
//         console.log("hello2");
//         next();
//     }],
//     (req, res, next)=> {
//         console.log("hello3");
//         res.send("Response 3!!")
//     }
// )

EX:4
app.get("/user", (req, res, next)=> {
   console.log("1st handler");
   next();
})

app.get("/user", (req, res, next)=> {
   console.log("2nd handler");
   res.send("Response from 2nd handler")
})

// this function that is being used in the middle of the request handler is known as middleware
// or the route handler which is calling to the next handler is known as middleware

// GET /users => middleware chain => request handler
