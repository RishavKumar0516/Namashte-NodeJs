I’ve cleaned this up and corrected a few technically inaccurate points, especially around **single-threading, libuv, OS/kernel, DNS, epoll, and the thread pool**. I’ve kept the language simple so it works as a **revision document**, not just textbook notes.

# Node.js Event Loop, Libuv, Thread Pool & Asynchronous I/O

> These notes explain how Node.js handles asynchronous operations, the Event Loop, libuv, the OS kernel, the thread pool, and mechanisms such as `epoll`.

---

# 1. Event Loop Tick

A **tick** can be thought of as **one iteration/cycle of the Node.js Event Loop**.

During one iteration, Node.js goes through different phases and executes the callbacks that are ready in those phases.

A simplified view:

```text
        ┌───────────────────────┐
        │      Event Loop       │
        └───────────┬───────────┘
                    ↓
              Timers Phase
                    ↓
          Pending Callbacks
                    ↓
                Idle/Prepare
                    ↓
               Poll Phase
                    ↓
              Check Phase
                    ↓
             Close Callbacks
                    ↓
                 Next Tick
```

> **Important:** `process.nextTick()` is special. Its callbacks are processed between phases and before the Event Loop continues to the next phase. It is not simply "the next Event Loop phase."

---

# 2. Event Loop Phases

Node.js has several Event Loop phases.

The commonly discussed phases are:

1. **Timers**
2. **Pending Callbacks**
3. **Idle / Prepare**
4. **Poll**
5. **Check**
6. **Close Callbacks**

### 1. Timers

Handles callbacks scheduled by:

```javascript
setTimeout()
setInterval()
```

Example:

```javascript
setTimeout(() => {
    console.log("Timer executed");
}, 1000);
```

The callback becomes eligible after the specified delay.

> The delay is **not a guarantee that the callback will execute exactly at that time**. It means the callback becomes eligible to run after that delay.

---

### 2. Pending Callbacks

This phase handles certain callbacks for system-level operations that were deferred to the next iteration of the Event Loop.

You normally don't interact with this phase directly in application code.

---

### 3. Idle / Prepare

These are mainly internal phases used by **libuv**.

Application developers generally don't write code specifically for this phase.

---

### 4. Poll

This is one of the **most important phases**.

The Poll phase:

* Retrieves new I/O events.
* Executes appropriate I/O callbacks.
* Can wait for new I/O events when there is nothing immediately ready to execute.

Examples of I/O:

```text
Network request
Socket activity
File system activity
Database/network connection activity
```

---

### 5. Check

The Check phase executes callbacks scheduled using:

```javascript
setImmediate()
```

Example:

```javascript
setImmediate(() => {
    console.log("Executed in Check phase");
});
```

---

### 6. Close Callbacks

Handles callbacks related to closing resources.

Example:

```javascript
socket.on("close", () => {
    console.log("Socket closed");
});
```

---

# 3. Is Node.js Single-Threaded or Multi-Threaded?

This question can be confusing.

The correct answer is:

> **Node.js JavaScript execution is primarily single-threaded, but Node.js can use multiple threads internally for certain operations.**

It is **not correct** to say:

```text
Synchronous code → single-threaded
Asynchronous code → multi-threaded
```

Asynchronous does **not automatically mean multiple threads**.

For example:

```javascript
setTimeout(() => {
    console.log("Hello");
}, 1000);
```

This is asynchronous, but Node.js does not create a new JavaScript thread to execute the callback.

Instead, Node.js uses mechanisms such as:

* Event Loop
* OS asynchronous I/O
* libuv
* Thread Pool for specific operations

---

# 4. A Better Mental Model

Think of Node.js like this:

```text
                    Node.js
                       │
              ┌────────┴────────┐
              │                 │
        JavaScript          libuv
          Thread               │
              │          ┌──────┴──────┐
              │          │             │
         Event Loop   OS Networking  Thread Pool
                           │             │
                        epoll/        Worker
                        kqueue         Threads
```

The JavaScript code normally runs on **one main JavaScript thread**.

But Node.js can use other threads internally when required.

---

# 5. What is libuv?

**libuv** is a library written primarily in **C** that Node.js uses to provide:

* Event Loop
* Asynchronous I/O
* Thread Pool
* Timers
* File system operations
* Networking support
* Interaction with the operating system

You can think of libuv as the layer that helps Node.js communicate with the underlying operating system.

```text
JavaScript
    ↓
Node.js APIs
    ↓
libuv
    ↓
Operating System
    ↓
Hardware
```

---

# 6. Node.js Thread Pool

libuv maintains a **thread pool** for operations that cannot be efficiently handled directly through the Event Loop/OS asynchronous I/O mechanisms.

By default, the libuv thread pool has:

```text
4 worker threads
```

You can configure its size using:

```javascript
process.env.UV_THREADPOOL_SIZE = 10;
```

This should generally be configured **before the relevant work starts**, typically before requiring/using modules that initialize thread-pool-dependent operations.

Then libuv can have up to 10 worker threads available for thread-pool work.

### Important

This does **not** mean:

```text
10 requests = 10 threads
```

It means the libuv thread pool has up to 10 worker threads available for operations that use the pool.

---

# 7. What Uses the Thread Pool?

Some important operations that can use the libuv thread pool include:

### File System

Some asynchronous `fs` operations:

```javascript
fs.readFile()
fs.writeFile()
```

### Crypto

Some expensive cryptographic operations:

```javascript
crypto.pbkdf2()
crypto.scrypt()
```

### Compression

Some operations involving:

```text
zlib
```

### DNS

Some DNS operations, particularly those based on the OS resolver such as:

```javascript
dns.lookup()
```

may use the thread pool.

However, not every DNS API works this way.

For example, `dns.resolve()` uses asynchronous DNS mechanisms rather than simply running the OS resolver in a libuv worker thread.

---

# 8. Does Every API Call Use the Thread Pool?

**No.**

This is a very important distinction.

For example, network I/O such as HTTP/TCP connections is generally handled using **operating-system networking facilities**, rather than consuming one libuv thread-pool worker per connection.

For example:

```text
Browser
   ↓
HTTP Request
   ↓
Node.js
   ↓
Socket
   ↓
Operating System
   ↓
Network
```

Node.js does **not** create one thread for every incoming HTTP request.

If 10,000 clients connect to a server, Node.js does not create:

```text
10,000 requests
       ↓
10,000 threads
```

That would be extremely expensive.

Instead, Node.js relies heavily on **event-driven, non-blocking I/O**.

---

# 9. How Can Node.js Handle Thousands of Connections?

This is where the **Operating System + sockets + epoll/kqueue + libuv** become important.

Suppose a server has many clients:

```text
Client A ── Socket ──┐
Client B ── Socket ──┤
Client C ── Socket ──┤
Client D ── Socket ──┤
Client E ── Socket ──┤
                     ↓
                Operating System
```

Each network connection is represented by a **socket**.

The OS can monitor many sockets and notify the application when something interesting happens.

For example:

```text
Socket A → data available
Socket B → nothing
Socket C → connection closed
Socket D → data available
```

Node.js doesn't need to continuously check every socket itself.

The OS can notify it about the sockets that are ready.

---

# 10. What is a File Descriptor?

On Unix-like operating systems, resources such as sockets are represented using **file descriptors (FDs)**.

A socket can therefore have a file descriptor:

```text
Socket
   ↓
File Descriptor
```

For example:

```text
Client A → FD 10
Client B → FD 11
Client C → FD 12
```

These descriptors allow the operating system and applications to refer to the corresponding resources.

---

# 11. What is `epoll`?

`epoll` is a Linux mechanism for **scalable I/O event notification**.

It allows a program to monitor many file descriptors and efficiently find out which ones are ready for I/O.

Instead of continuously doing:

```text
Is Socket A ready?
Is Socket B ready?
Is Socket C ready?
Is Socket D ready?
...
```

the application can ask the OS to monitor them.

Conceptually:

```text
          epoll
            │
     ┌──────┼──────┐
     ↓      ↓      ↓
    FD10   FD11   FD12
     │      │      │
  Socket  Socket  Socket
```

If something happens:

```text
FD12 has data available
        ↓
      epoll
        ↓
     libuv
        ↓
   Event Loop
        ↓
JavaScript callback
```

---

# 12. `epoll` vs `kqueue`

Different operating systems use different mechanisms.

### Linux

```text
epoll
```

### macOS / BSD

```text
kqueue
```

These mechanisms provide scalable ways for applications to receive notifications about I/O events.

Node.js/libuv abstracts many of these OS-specific details so application developers don't normally need to interact with `epoll` or `kqueue` directly.

---

# 13. How libuv Communicates With the OS

A simplified flow is:

```text
JavaScript
     ↓
Node.js
     ↓
   libuv
     ↓
Operating System
     ↓
Networking / Files / Other resources
```

For network I/O on Linux:

```text
Network Socket
      ↓
File Descriptor
      ↓
     epoll
      ↓
     libuv
      ↓
 Event Loop
      ↓
JavaScript callback
```

For example:

```javascript
server.on("request", (req, res) => {
    console.log("Request received");
});
```

When network activity occurs, the OS can notify the relevant I/O mechanism, which allows libuv to process the event and eventually invoke the JavaScript callback.

---

# 14. Why is Node.js Called Event-Driven?

Node.js is commonly described as **event-driven** because the application reacts to events instead of continuously blocking and waiting for each operation.

For example:

```javascript
server.on("request", () => {
    console.log("Request received");
});
```

The application essentially says:

> "When a request happens, execute this callback."

Another example:

```javascript
socket.on("data", (data) => {
    console.log(data);
});
```

The application says:

> "When data arrives, execute this callback."

The underlying OS and libuv help detect these events.

---

# 15. Event-Driven Architecture

A simplified flow:

```text
                Client Request
                     ↓
                 Socket
                     ↓
              Operating System
                     ↓
              epoll / kqueue
                     ↓
                   libuv
                     ↓
                Event Loop
                     ↓
             JavaScript Callback
                     ↓
               Your Code
```

This is one of the important reasons Node.js can efficiently handle a large number of I/O-bound connections without creating one JavaScript thread per connection.

---

# 16. Don't Block the Main JavaScript Thread

The JavaScript thread is very important.

If you perform a CPU-heavy operation on it, the Event Loop cannot process other JavaScript callbacks while that operation is running.

For example:

```javascript
while (true) {
    // heavy work
}
```

The Event Loop becomes blocked.

During that time:

```text
Request 1 → waiting
Request 2 → waiting
Request 3 → waiting
Request 4 → waiting
```

Therefore:

> **Don't block the main JavaScript thread with expensive synchronous work.**

---

# 17. Things That Can Block the Event Loop

## 17.1 Synchronous APIs

Avoid unnecessary use of synchronous APIs in server request handling.

For example:

```javascript
fs.readFileSync()
```

Instead, prefer asynchronous APIs when appropriate:

```javascript
fs.readFile()
```

---

## 17.2 Heavy JSON Operations

Large objects can make these operations expensive:

```javascript
JSON.stringify()
JSON.parse()
```

For example:

```javascript
const hugeObject = ...;

JSON.stringify(hugeObject);
```

If the object is extremely large, this CPU work happens on the JavaScript thread and can delay other requests.

---

## 17.3 Complex Regular Expressions

Some regular expressions can require significant CPU time.

For example, poorly designed patterns can cause excessive backtracking.

Therefore:

> Avoid unnecessarily complex or unsafe regular expressions on request paths.

---

## 17.4 Complex Calculations

CPU-heavy calculations can block the Event Loop.

Example:

```javascript
function calculate() {
    for (let i = 0; i < 10_000_000_000; i++) {
        // heavy calculation
    }
}
```

During this calculation, the JavaScript thread cannot process other callbacks.

For CPU-heavy workloads, possible solutions include:

* `worker_threads`
* Child processes
* Moving computation to another service
* Using specialized infrastructure

---

# 18. Data Structures Matter

Data structures are not only theoretical concepts.

They are used internally by systems such as:

* Event loops
* Timers
* Schedulers
* Operating systems
* Databases
* Caches
* Networking systems

Understanding data structures helps explain **why systems can operate efficiently**.

---

# 19. How Are Timers Managed?

When you write:

```javascript
setTimeout(() => {
    console.log("Hello");
}, 5000);
```

Node.js needs a way to keep track of timers and determine which timers have become eligible to run.

Timer implementations use efficient data structures for managing timer expiration. In libuv, timers are maintained using a **min-heap**.

---

# 20. What is a Min-Heap?

A **min-heap** is a tree-based data structure where the smallest value is kept at the top.

For timers, you can think of the value as:

```text
expiration time
```

Suppose we have:

```text
Timer A → 10 sec
Timer B → 3 sec
Timer C → 7 sec
Timer D → 15 sec
```

A min-heap helps keep the timer with the earliest expiration readily accessible.

Conceptually:

```text
          3 sec
         /     \
      10 sec   7 sec
      /
   15 sec
```

The earliest timer is at the top.

This allows the timer system to efficiently determine which timer needs attention next.

---

# 21. `process.nextTick()` vs `setImmediate()`

These two APIs are commonly confused.

### `process.nextTick()`

Despite its name, it does **not** mean:

> "Execute during the next Event Loop phase."

It schedules a callback in the **next-tick queue**, which Node.js processes before continuing with the Event Loop.

Example:

```javascript
process.nextTick(() => {
    console.log("nextTick");
});
```

---

### `setImmediate()`

`setImmediate()` schedules a callback for the **Check phase** of the Event Loop.

```javascript
setImmediate(() => {
    console.log("setImmediate");
});
```

Conceptually:

```text
Current JavaScript execution
          ↓
process.nextTick queue
          ↓
Event Loop continues
          ↓
Check phase
          ↓
setImmediate callback
```

---

# 22. Why the Names Can Be Confusing

The names don't perfectly describe when they execute.

```text
process.nextTick()
```

sounds like:

> "Run on the next Event Loop tick."

But it has special priority and is processed before the Event Loop continues.

Similarly:

```text
setImmediate()
```

sounds like:

> "Run immediately."

But it actually runs during the **Check phase**.

So remember the behavior rather than relying only on the names.

---

# 23. Important Correction: Asynchronous ≠ Multithreaded

This is one of the most important things to remember.

### Wrong mental model

```text
Synchronous → one thread
Asynchronous → multiple threads
```

### Better mental model

```text
JavaScript execution
        ↓
   Main JS Thread
        ↓
    Event Loop
        ↓
 ┌──────┴──────────────┐
 ↓                     ↓
OS async I/O       libuv Thread Pool
                       ↓
                 Worker Threads
```

Some asynchronous operations use the OS's asynchronous I/O mechanisms.

Some use libuv's thread pool.

Therefore, **asynchronous does not automatically mean multithreaded**.

---

# 24. Thread Pool vs OS Async I/O

This distinction is extremely important.

## Thread Pool

Used by certain operations that need worker threads.

Examples include some:

```text
File system operations
Crypto operations
Compression
DNS operations such as dns.lookup()
```

---

## OS Async I/O

Network operations can use OS facilities such as:

```text
Linux → epoll
macOS/BSD → kqueue
```

The OS monitors sockets and notifies Node.js when they are ready.

This means Node.js doesn't need:

```text
1 request → 1 thread
```

Instead, many connections can be monitored efficiently.

---

# 25. Overall Picture

A simplified Node.js architecture looks like this:

```text
                         Node.js
                            │
                  ┌─────────┴─────────┐
                  │                   │
             JavaScript              libuv
               Thread                 │
                  │           ┌───────┴────────┐
                  │           │                │
             Event Loop   OS Async I/O    Thread Pool
                              │                │
                         epoll/kqueue      Worker Threads
                              │
                           Sockets
                              │
                           Network
```

When something becomes ready:

```text
OS
 ↓
epoll / kqueue
 ↓
libuv
 ↓
Event Loop
 ↓
JavaScript callback
```

For an operation using the thread pool:

```text
JavaScript
    ↓
Node.js
    ↓
libuv
    ↓
Thread Pool
    ↓
Worker Thread
    ↓
Completion
    ↓
Event Loop
    ↓
JavaScript callback
```

---

# 26. Why This Architecture Is Powerful

The important idea is:

> Node.js does not create one JavaScript thread for every request.

Instead, it uses:

* One main JavaScript thread
* Event Loop
* libuv
* OS-level asynchronous I/O
* Thread Pool for specific operations
* Efficient operating-system mechanisms such as `epoll`

This allows Node.js to efficiently handle many **I/O-bound** operations.

---

# 27. But Node.js Is Not Ideal for Every Workload

Node.js works particularly well for I/O-heavy applications such as:

* REST APIs
* Real-time applications
* Chat applications
* Web servers
* Streaming applications
* Proxy services
* Applications with many concurrent network connections

However, CPU-heavy operations can block the main JavaScript thread.

For CPU-heavy work, consider:

```text
Worker Threads
Child Processes
Separate Services
```

---

# 28. Important Things to Learn Next

The concepts above connect to several deeper topics.

### Node.js

* Event Emitters
* Streams
* Buffers
* Pipes
* `process.nextTick()`
* `setImmediate()`
* Worker Threads
* Cluster
* Child Processes

### Networking

* TCP
* UDP
* HTTP
* Sockets
* File Descriptors
* Connection lifecycle

### Operating System

* Kernel
* System calls
* File descriptors
* `epoll`
* `kqueue`
* I/O multiplexing
* Blocking vs non-blocking I/O

### Data Structures

* Min Heap
* Red-Black Tree
* Linked List
* Queues
* Priority Queues

---

# 29. `epoll` and Red-Black Tree — Important Clarification

You may come across the statement:

> "epoll uses a Red-Black Tree and therefore epoll works in O(1)."

This statement is **too simplified and can be misleading**.

Linux `epoll` internally maintains data structures including an **interest list** and a **ready list**. The interest list has historically been implemented using a red-black tree.

The red-black tree provides efficient operations such as:

```text
Search
Insert
Delete
```

typically in:

```text
O(log n)
```

The ready list allows ready events to be retrieved efficiently.

Therefore, don't memorize:

```text
epoll = O(1)
```

as a universal rule.

Instead remember:

> `epoll` is designed as a scalable mechanism for monitoring a large number of file descriptors, avoiding the need to repeatedly scan every connection.

The exact performance depends on the operation and workload.

---

# 30. Quick Revision

## Node.js

```text
JavaScript execution → primarily one main thread
```

## Asynchronous

```text
Does NOT automatically mean multiple threads
```

## libuv

```text
C-based library used by Node.js
```

It provides/helps coordinate:

```text
Event Loop
Thread Pool
Timers
Async I/O
OS interaction
```

## Thread Pool

Default:

```text
4 threads
```

Can be configured using:

```javascript
process.env.UV_THREADPOOL_SIZE
```

Used by certain operations such as:

```text
Some fs operations
Some crypto operations
zlib
Some DNS operations
```

## Network I/O

Generally handled through OS networking facilities rather than one thread per connection.

```text
Linux → epoll
macOS/BSD → kqueue
```

## File Descriptor

A handle used by the OS to represent resources such as sockets.

## Event Loop

Coordinates execution of callbacks and asynchronous work.

## Tick

One iteration/cycle of the Event Loop.

## `process.nextTick()`

Special next-tick queue processed before the Event Loop continues.

## `setImmediate()`

Runs during the Check phase.

## Main Rule

> **Don't block the main JavaScript thread.**

Avoid unnecessary:

```text
Synchronous I/O
Huge JSON parsing/stringifying
Complex regular expressions
CPU-heavy calculations
Large synchronous loops
```

---

# 31. One-Line Mental Model

If you remember only one thing, remember this:

```text
Node.js
   ↓
JavaScript runs mainly on one thread
   ↓
Event Loop coordinates work
   ↓
libuv connects Node.js with the OS
   ↓
OS handles many network connections efficiently
   ↓
Thread Pool handles certain expensive/blocking operations
   ↓
Completed work eventually triggers JavaScript callbacks
```

This is the basic foundation for understanding **how Node.js can handle many concurrent requests without creating one thread for every request**.

A few of your original points were especially worth correcting: **“async = multithreaded” is not correct**, the **OS kernel is not single-threaded**, and **`epoll` should not simply be described as an O(1) algorithm**. These distinctions are useful for both real backend work and 3-YOE Node.js interviews.





# Related Concepts

This section covers the important concepts that are connected to the Node.js Event Loop, libuv, asynchronous I/O, networking, and the operating system.

---

# 1. Node.js Concepts

## 1.1 Event Emitter

An **EventEmitter** is a Node.js mechanism that allows one part of the application to **emit an event** and another part to **listen and respond to that event**.

Node.js uses EventEmitters heavily internally.

### Simple Example

```javascript
const EventEmitter = require("events");

const emitter = new EventEmitter();

emitter.on("userCreated", (user) => {
    console.log("User created:", user);
});

emitter.emit("userCreated", {
    id: 1,
    name: "Rishav"
});
```

Output:

```text
User created: { id: 1, name: 'Rishav' }
```

### Important Methods

```javascript
emitter.on()
emitter.once()
emitter.emit()
emitter.off()
```

### `on()`

Listen for an event.

```javascript
emitter.on("login", () => {
    console.log("User logged in");
});
```

### `once()`

Listen only once.

```javascript
emitter.once("login", () => {
    console.log("This runs only once");
});
```

### `emit()`

Trigger an event.

```javascript
emitter.emit("login");
```

### Why is it useful?

EventEmitter is useful when different parts of an application need to communicate without being tightly coupled.

Common examples:

```text
User registered
    ↓
emit("userRegistered")
    ↓
Send email
Create notification
Create analytics event
```

### Remember

> **EventEmitter = emit an event + listen for that event.**

---

# 1.2 Streams

A **Stream** allows data to be processed **piece by piece instead of loading everything into memory at once**.

This is very important when working with large amounts of data.

For example, suppose you have a:

```text
2 GB video
```

You don't want to load the entire 2 GB into RAM before sending it to the user.

Instead:

```text
2 GB File
   ↓
Small chunks
   ↓
Client
```

### Types of Streams

Node.js has four major stream types:

```text
Readable
Writable
Duplex
Transform
```

### Readable

Used to read data.

```javascript
const fs = require("fs");

const stream = fs.createReadStream("large-file.txt");

stream.on("data", (chunk) => {
    console.log(chunk);
});
```

### Writable

Used to write data.

```javascript
const stream = fs.createWriteStream("output.txt");

stream.write("Hello");
stream.end();
```

### Duplex

Can both read and write.

Example:

```text
TCP Socket
```

### Transform

Can read data, transform it, and produce output.

Examples:

```text
Compression
Encryption
Data transformation
```

---

# 1.3 Buffers

A **Buffer** is a Node.js data structure used to work with **raw binary data**.

JavaScript traditionally works mainly with strings and objects, but backend applications often need to work with binary data such as:

```text
Images
Videos
Audio
PDFs
Network packets
Files
```

Example:

```javascript
const buffer = Buffer.from("Hello");

console.log(buffer);
```

You may see something like:

```text
<Buffer 48 65 6c 6c 6f>
```

These are the bytes representing `"Hello"`.

You can convert it back:

```javascript
console.log(buffer.toString());
```

Output:

```text
Hello
```

### Remember

> **Buffer = raw binary data in memory.**

Streams often work with data in the form of Buffers.

---

# 1.4 Pipes

A **pipe** connects the output of one stream directly to the input of another stream.

Example:

```javascript
const fs = require("fs");

const readable = fs.createReadStream("input.txt");
const writable = fs.createWriteStream("output.txt");

readable.pipe(writable);
```

Conceptually:

```text
input.txt
   ↓
Readable Stream
   ↓
   pipe()
   ↓
Writable Stream
   ↓
output.txt
```

Pipes are useful because data can flow continuously without manually handling every chunk.

### Real-world example

```text
Large File
    ↓
Read Stream
    ↓
Transform Stream
    ↓
Write Stream
```

---

# 1.5 `process.nextTick()`

`process.nextTick()` schedules a callback to run after the current JavaScript operation completes, before the Event Loop continues to its next phase.

```javascript
console.log("A");

process.nextTick(() => {
    console.log("B");
});

console.log("C");
```

Output:

```text
A
C
B
```

The important point is:

> `process.nextTick()` has special priority in Node.js and is processed before the Event Loop continues.

### Important Warning

Using `process.nextTick()` recursively can starve the Event Loop.

```javascript
function recursive() {
    process.nextTick(recursive);
}

recursive();
```

If abused, other Event Loop phases may get little or no opportunity to run.

---

# 1.6 `setImmediate()`

`setImmediate()` schedules a callback to execute during the **Check phase** of the Event Loop.

```javascript
setImmediate(() => {
    console.log("Hello");
});
```

The important distinction is:

```text
process.nextTick()
    ↓
next-tick queue

setImmediate()
    ↓
Check phase
```

### Remember

```text
process.nextTick()
→ special next-tick queue

setImmediate()
→ Check phase
```

---

# 1.7 Worker Threads

Node.js normally executes JavaScript on one main thread.

But Node.js provides **Worker Threads** for CPU-intensive JavaScript work.

Example:

```text
Main Thread
     │
     ├── Request handling
     ├── Event Loop
     │
     └── Worker Thread
            ↓
       Heavy calculation
```

Example:

```javascript
const { Worker } = require("worker_threads");

const worker = new Worker("./worker.js");
```

### When are Worker Threads useful?

For CPU-heavy work such as:

```text
Image processing
Large calculations
Data processing
Encryption/computation
CPU-intensive algorithms
```

### Important

Worker Threads are different from the **libuv thread pool**.

```text
Worker Threads
→ execute JavaScript in separate threads

libuv Thread Pool
→ used internally by libuv for certain operations
```

---

# 1.8 Child Processes

A **child process** allows Node.js to start another operating-system process.

For example:

```text
Node.js Application
       │
       ↓
Child Process
       │
       ↓
Another program
```

Node.js provides APIs such as:

```javascript
child_process.exec()
child_process.spawn()
child_process.fork()
```

### Example

```javascript
const { exec } = require("child_process");

exec("node --version", (error, stdout) => {
    console.log(stdout);
});
```

### When are child processes useful?

For:

```text
Running external programs
Running CLI tools
Isolating workloads
Running separate Node.js processes
```

---

# 1.9 Cluster

The Node.js **Cluster** module allows multiple Node.js processes to run and share server-side traffic.

Instead of:

```text
CPU
 │
 └── Node.js Process
```

you can have:

```text
CPU
 │
 ├── Node.js Process
 ├── Node.js Process
 ├── Node.js Process
 └── Node.js Process
```

Each process has its own:

```text
JavaScript heap
Event Loop
V8 instance
```

This allows Node.js applications to use multiple CPU cores by running multiple processes.

### Cluster vs Worker Threads

```text
Cluster
→ multiple processes

Worker Threads
→ multiple threads inside a process
```

Modern production applications also commonly use external process managers or container orchestration rather than relying entirely on the Cluster module.

---

# 2. Networking Concepts

# 2.1 TCP

**TCP = Transmission Control Protocol**

TCP provides a reliable, ordered communication channel between two endpoints.

Important characteristics:

```text
Connection-oriented
Reliable
Ordered
Error detection
Retransmission
Flow control
Congestion control
```

For example:

```text
Client
  │
  │ TCP Connection
  │
  ↓
Server
```

HTTP/1.1 and HTTP/2 commonly run over TCP.

---

# 2.2 UDP

**UDP = User Datagram Protocol**

UDP is connectionless and does not provide TCP's reliability guarantees.

It sends independent datagrams.

```text
Client ── Packet 1 ──→ Server
Client ── Packet 2 ──→ Server
Client ── Packet 3 ──→ Server
```

Packets can potentially:

```text
Arrive out of order
Be lost
Be duplicated
```

### Why use UDP?

When low latency is more important than guaranteed delivery.

Examples include:

```text
DNS
Online gaming
Real-time media
Voice/video applications
```

---

# 2.3 HTTP

**HTTP = Hypertext Transfer Protocol**

HTTP is an application-layer protocol used for communication between clients and servers.

Example:

```text
Browser
   ↓
HTTP Request
   ↓
Node.js Server
   ↓
HTTP Response
   ↓
Browser
```

Example request:

```http
GET /users
```

Example response:

```http
HTTP/1.1 200 OK
Content-Type: application/json
```

### HTTP versions

```text
HTTP/1.1
HTTP/2
HTTP/3
```

A major difference is that HTTP/3 uses **QUIC over UDP**, while HTTP/1.1 and HTTP/2 commonly use TCP.

---

# 2.4 Sockets

A **socket** is an endpoint used for network communication.

Conceptually:

```text
Application
    ↓
Socket
    ↓
Transport Layer
    ↓
Network
```

A TCP connection can be identified by information such as:

```text
Source IP
Source Port
Destination IP
Destination Port
Protocol
```

For example:

```text
192.168.1.10:50000
        ↓
93.184.216.34:443
```

Node.js exposes networking functionality through modules such as:

```javascript
net
http
https
dgram
```

---

# 2.5 File Descriptors

A **file descriptor (FD)** is an operating-system handle used to represent an open resource.

On Unix-like systems, examples include:

```text
Files
Sockets
Pipes
Other I/O resources
```

For example:

```text
Socket
  ↓
File Descriptor
  ↓
OS can refer to that socket using the descriptor
```

This is why `epoll` can monitor many network connections: it works with file descriptors.

---

# 2.6 Connection Lifecycle

A simplified TCP connection lifecycle looks like:

```text
Client
   │
   │ SYN
   ↓
Server
   │
   │ SYN-ACK
   ↓
Client
   │
   │ ACK
   ↓
Connection Established
```

This is called the **TCP three-way handshake**.

After the connection is established:

```text
Client ←→ Server
```

Data can be exchanged.

When the connection is finished, TCP performs connection termination.

A simplified view:

```text
Connection
    ↓
Data Transfer
    ↓
Connection Close
```

Understanding the connection lifecycle helps explain:

* Sockets
* Ports
* TCP
* HTTP keep-alive
* Connection pooling
* WebSockets
* Load balancers

---

# 3. Operating System Concepts

# 3.1 Kernel

The **kernel** is the core part of an operating system.

It manages resources such as:

```text
CPU
Memory
Processes
Threads
Networking
Files
Devices
```

Applications normally don't directly control hardware.

Instead:

```text
Application
    ↓
System Call
    ↓
Kernel
    ↓
Hardware / OS resources
```

---

# 3.2 System Calls

A **system call** is a mechanism through which an application requests a service from the operating system kernel.

Examples include operations related to:

```text
Reading files
Writing files
Creating processes
Networking
Memory management
```

Conceptually:

```text
Node.js
   ↓
libuv
   ↓
System Call
   ↓
Kernel
   ↓
Hardware / OS resource
```

This is one of the reasons libuv is important: it provides a cross-platform abstraction over operating-system facilities.

---

# 3.3 File Descriptors

At the OS level, a file descriptor is essentially a number/handle associated with an open resource.

For example:

```text
FD 0 → stdin
FD 1 → stdout
FD 2 → stderr
FD 10 → some socket
FD 11 → another socket
```

The exact numbers depend on the process and operating system state.

For networking:

```text
Network Connection
        ↓
      Socket
        ↓
File Descriptor
```

---

# 3.4 `epoll`

`epoll` is a Linux API for **I/O event notification**.

It allows a process to monitor many file descriptors.

Conceptually:

```text
                epoll
                  │
        ┌─────────┼─────────┐
        ↓         ↓         ↓
       FD10      FD11      FD12
        │         │         │
     Socket A  Socket B  Socket C
```

Suppose:

```text
FD10 → no data
FD11 → no data
FD12 → data available
```

`epoll` can report:

```text
FD12 is ready
```

The application can then process FD12 rather than repeatedly scanning every connection.

---

# 3.5 `kqueue`

`kqueue` is a similar event notification mechanism available on systems such as:

```text
macOS
FreeBSD
Other BSD systems
```

Conceptually:

```text
Linux
  ↓
epoll

macOS / BSD
  ↓
kqueue
```

libuv abstracts these platform-specific mechanisms so Node.js developers can use a common API.

---

# 3.6 I/O Multiplexing

**I/O multiplexing** means being able to monitor multiple I/O resources and determine which ones are ready for work.

Without an efficient mechanism, an application might repeatedly check:

```text
Socket A → ready?
Socket B → ready?
Socket C → ready?
Socket D → ready?
...
```

With an I/O multiplexing mechanism:

```text
              I/O Multiplexing
                     ↓
        ┌────────────┼────────────┐
        ↓            ↓            ↓
     Socket A     Socket B     Socket C
                     ↓
                Ready event
```

This is a fundamental idea behind scalable network servers.

Examples:

```text
Linux → epoll
macOS/BSD → kqueue
```

---

# 3.7 Blocking I/O

In **blocking I/O**, the thread waits until the operation can continue or complete.

Conceptually:

```text
Thread
  ↓
Read data
  ↓
WAIT
  ↓
Data available
  ↓
Continue
```

While waiting, that thread cannot perform other work.

If a server creates one thread per blocking connection, a large number of connections can require a large number of threads.

---

# 3.8 Non-Blocking I/O

In **non-blocking I/O**, the application does not have to wait in the same way for an I/O operation to complete.

Conceptually:

```text
JavaScript
    ↓
Start I/O
    ↓
Continue doing other work
    ↓
       ...
    ↓
I/O becomes ready
    ↓
Callback/Event
```

This is a key concept behind Node.js's event-driven architecture.

---

# 4. Putting Everything Together

Now we can connect all the concepts.

Suppose 10,000 users connect to a Node.js HTTP server.

A simplified architecture looks like:

```text
                    10,000 Clients
                          │
                          ↓
                       Network
                          │
                          ↓
                       Sockets
                          │
                          ↓
                  File Descriptors
                          │
                          ↓
                 Operating System
                          │
                    epoll/kqueue
                          │
                          ↓
                        libuv
                          │
                          ↓
                    Event Loop
                          │
                          ↓
                  JavaScript Code
                          │
                    ┌─────┴─────┐
                    ↓           ↓
                 Streams      APIs
                    │
                    ↓
                 Buffers
```

For operations that need the libuv thread pool:

```text
JavaScript
    ↓
Node.js
    ↓
libuv
    ↓
Thread Pool
    ↓
Worker Thread
    ↓
Operation Complete
    ↓
Event Loop
    ↓
JavaScript Callback
```

For CPU-heavy JavaScript work:

```text
Main Node.js Process
        │
        ├── Main Thread
        │      ↓
        │   Event Loop
        │
        └── Worker Thread
               ↓
          CPU-intensive work
```

For an external program:

```text
Node.js
   ↓
Child Process
   ↓
Operating System
   ↓
External Program
```

---

# 5. Quick Comparison

| Concept              | Simple Meaning                             |
| -------------------- | ------------------------------------------ |
| EventEmitter         | Emit and listen for events                 |
| Stream               | Process data piece by piece                |
| Buffer               | Work with raw binary data                  |
| Pipe                 | Connect one stream to another              |
| `process.nextTick()` | Run callback from the next-tick queue      |
| `setImmediate()`     | Run callback in Check phase                |
| Worker Thread        | Run JavaScript on another thread           |
| Child Process        | Start another OS process                   |
| Cluster              | Run multiple Node.js processes             |
| TCP                  | Reliable, ordered network communication    |
| UDP                  | Connectionless, low-overhead datagrams     |
| HTTP                 | Application protocol for web communication |
| Socket               | Network communication endpoint             |
| File Descriptor      | OS handle for resources such as sockets    |
| Kernel               | Core part of the operating system          |
| System Call          | Application's request to the kernel        |
| `epoll`              | Linux I/O event notification mechanism     |
| `kqueue`             | macOS/BSD I/O event notification mechanism |
| I/O Multiplexing     | Monitor many I/O resources efficiently     |
| Blocking I/O         | Wait for I/O before continuing             |
| Non-blocking I/O     | Continue while I/O is being handled        |

---

# 6. Important Relationships to Remember

### Event Loop + libuv

```text
Event Loop
    ↓
Managed/implemented through libuv
```

### Node.js + libuv

```text
Node.js
    ↓
libuv
    ↓
Operating System
```

### Network I/O

```text
Socket
   ↓
File Descriptor
   ↓
epoll / kqueue
   ↓
libuv
   ↓
Event Loop
   ↓
Callback
```

### Thread Pool

```text
Node.js
   ↓
libuv
   ↓
Thread Pool
   ↓
Worker Thread
   ↓
Result
   ↓
Event Loop
```

### CPU-heavy JavaScript

```text
Main Thread
     ↓
Worker Thread
```

### Large data

```text
Stream
  ↓
Chunks
  ↓
Buffers
```

---

# 7. Interview Revision Points

### Q: Is Node.js single-threaded?

**Answer:**

> JavaScript execution in Node.js primarily happens on a single main thread, but Node.js can use multiple threads internally through mechanisms such as the libuv thread pool and Worker Threads.

---

### Q: Does asynchronous code mean multithreading?

**Answer:**

> No. Asynchronous operations can be handled using OS-level asynchronous I/O without creating a new thread. Some operations, however, may use the libuv thread pool.

---

### Q: What is libuv?

**Answer:**

> libuv is a cross-platform C-based library used by Node.js for the Event Loop, asynchronous I/O, timers, and a worker thread pool, while providing an abstraction over operating-system facilities.

---

### Q: Why doesn't Node.js create one thread per request?

**Answer:**

> Node.js uses an event-driven, non-blocking I/O model. Network connections can be monitored efficiently using OS mechanisms such as `epoll` on Linux and `kqueue` on macOS/BSD.

---

### Q: What is `epoll`?

**Answer:**

> `epoll` is a Linux I/O event notification mechanism that allows an application to efficiently monitor many file descriptors and identify which ones are ready for I/O.

---

### Q: What is the difference between Worker Threads and the libuv Thread Pool?

**Answer:**

> Worker Threads allow us to explicitly run JavaScript in separate threads, mainly for CPU-intensive work. The libuv thread pool is an internal pool used by libuv for certain operations such as some file system, crypto, compression, and DNS operations.

---

### Q: What is the difference between a process and a thread?

**Answer:**

> A process is an independent running program with its own memory space, while threads are execution units within a process that can share the process's memory.

---

### Q: What is the difference between blocking and non-blocking I/O?

**Answer:**

> Blocking I/O makes the current execution context wait for the operation, while non-blocking I/O allows the application to continue doing other work and handle the I/O result when it becomes available.

---

# 8. Final Mental Model

The complete picture can be remembered like this:

```text
                       NODE.JS
                          │
              ┌───────────┴───────────┐
              │                       │
        JavaScript                 libuv
          Thread                     │
              │              ┌───────┴────────┐
              │              │                │
         Event Loop      OS Async I/O    Thread Pool
              │              │                │
              │        epoll / kqueue    Worker Threads
              │              │
              │           Sockets
              │              │
              │        File Descriptors
              │              │
              └────── Operating System ──────┘
                              │
                           Kernel
                              │
                           Hardware
```

### The core idea

> **Node.js keeps JavaScript execution lightweight by using the Event Loop and delegates I/O-related work to libuv and the operating system. Certain operations use the libuv thread pool, while CPU-heavy JavaScript can be moved to Worker Threads or separate processes.**
