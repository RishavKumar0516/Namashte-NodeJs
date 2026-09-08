

// you cannot access the variable and function defined inside the outer function, outside of the outer function

function outer() {
    let x = 50;
    function inner() {
        console.log("inside inner function");
    }
}

outer();  //this is doable

inner() // this is not doable
console.log("x", x); // this is not doable


// the variable and function defined inside the function are in the local scope of that function, cannot be accessed outside of the function.

// whenever you create a module, all the code written inside the module get wrapped inside the functon and then get executed, so the only way to use the function and variable defined inside the module is to export it using module.exports object.

// when you do require('./calculateSum'), the node will wrap the whole module code inside the function and then execute it.

// this function is not a normal function it is a IIFE function. (Immediately Invoked Function Expression)

// using IIFE function because, it doesn't interfare the other code.

// How are variable and function are private in different module?
// its because IIFE and require function, it keeps function and variable safe.

// how you get access to module.exports?
// nodeJs passes the module object as parameter to the IIFE function.

// nodeJs is very famous because of libuv library.



