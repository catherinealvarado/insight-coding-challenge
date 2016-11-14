var fs = require('fs'), readline = require('readline'); //these libraries read files and write to files
var userTransactions = require('../paymo_input/transactionsGraph.json') //an object representing all the transactions from batch_payment.txt
extractUserData = require('../src/dataClean.js') //reuse function defined in dataClean.js

//pastTransaction, friendOfFriend, and breadthFirstSearch determine whether a transaction is non fraudulent
//checks to see if two users had a transaction
function pastTransaction(obj,pay1,receive2){
  var pay1Friends = obj[pay1]
  if (pay1Friends[receive2] !== undefined){
    return "trusted";
  }
  else {
    return "unverified";
  }
}

//determines if at most a second degree connection exists between two users
//if so, then the transaction is trusted
function friendOfFriend(obj,pay1,receive2){
  if (pastTransaction(obj,pay1,receive2) === "trusted"){
    return "trusted"
  }
  else{
    var pay1Transactions = obj[pay1]
    for (var id in pay1Transactions){
      if (pastTransaction(obj,id,receive2) === "trusted"){
        return "trusted"
      }
    }
    return "unverified"
  }
}

//outputs an array with unique ids in obj not found in objVis
//after finding the unique ids it adds those ids into objVisited
function findUnvisitedNodes(objVisited,obj){
  var unvisitedArr = []
  for (var id in obj){
    if (objVisited[id] === undefined){
      unvisitedArr.push(id)
      objVisited[id] = id;
    }
  }
  return unvisitedArr;
}

//Javascript does not have a queue data structure
//using an array as a queue can be costly when dealing with large arrays so I used this implementation of a queue
//that uses an array, but uses it more efficiently:
//http://code.stephenmorley.org/javascript/queues/
function Queue(){
	var a=[],b=0;
	this.getLength = function(){
		return a.length-b
	};
	this.enqueue = function(b){
		a.push(b)
	};
	this.dequeue = function(){
		if(0!=a.length){
			var c=a[b];
			2*++b>=a.length&&(a=a.slice(b),b=0);
			return c}
	};
};

//breadth first search function to determine whether a transaction is fraudulent
//The parameter depth tells the function to only find connections within and including level depth
function breadthFirstSearch(obj,id1,id2,depth){
  var visitedNodes = {}, queue = new Queue();
  queue.enqueue(id1)
  visitedNodes[id1] = id1; //keeps track of already visited nodes so that they are not visited again
  var currDepth = 0; leftTillIncreaseDep = 1; futureTillIncreaseDep = 0; //these counters determine the level being explored
  while (queue.getLength() > 0){
    var id = queue.dequeue();
    if(id === id2){
      return "trusted"
    }
    leftTillIncreaseDep -= 1; //every time something is dequeued this variable decreases by one
    var idChildren = obj[id];
    if (idChildren){
      var childrenNodes = findUnvisitedNodes(visitedNodes,idChildren) //prevents from looking at already visited nodes
      futureTillIncreaseDep += childrenNodes.length;
      if (leftTillIncreaseDep === 0){
        currDepth += 1
        if (currDepth > depth){
          return "unverified"
        }
        leftTillIncreaseDep = futureTillIncreaseDep;
        futureTillIncreaseDep = 0;
      }
      childrenNodes.forEach((key)=>{
          queue.enqueue(key)
      });
    }
    else{
      if (leftTillIncreaseDep === 0){
        currDepth += 1
        if (currDepth > depth){
          return "unverified"
        }
        leftTillIncreaseDep = futureTillIncreaseDep;
        futureTillIncreaseDep = 0;
      }
    }
  }
}

//here JavaScript promises are used to make this function synchronous
//reads the stream_payment.txt file line by line and determines whether
//a valid transaction is fradulent or nonfradulent and appends result to a string
//once the entire stream file is read, the string is included in resolve(...)
function verifyTransactions(fileName,functionName,obj,depth){
  var stringVerifications = ""
  var promise = new Promise(function(resolve,reject){
    var rd = readline.createInterface({
      input: fs.createReadStream('./paymo_input/stream_payment.txt'),
      output: process.stdout,
      terminal: false
    });
    rd.on('line', function(line) {
      var userData = extractUserData(line)
      if (userData !== undefined){
        var id1 = userData[0], id2 = userData[1];
        if (obj[id1]){
          var verify = functionName(obj,id1,id2,depth)
          stringVerifications += verify+"\n"
        }
        else{
          stringVerifications += "unverified"+"\n"
        }
      }
    });
    rd.on('close',function(){
      resolve(stringVerifications)
    })
  })
  return promise;
}

//here javascript promises are being used so that the function verifyTransactions can run to produce
//final results for output1.txt, output2.txt, and output3.txt one at a time
//verifyTransactions returns a resolve, which is accessed throught .then(function(..)..) the value is
//outputed to each respective file
verifyTransactions("output1",pastTransaction,userTransactions) // returns a Promise, which has a .then() method
  .then(function(result) { //the result of the earlier promise is outputted to output1.txt
    console.log("Finished with output1.txt")
    fs.appendFileSync('./paymo_output/output1.txt',result,"UTF-8",{'flags': 'a'});
    return verifyTransactions("output2",friendOfFriend,userTransactions); // return a new Promise from inside of the function passed to .then()
  })
  .then(function(result2) {
    console.log("Finished with output2.txt")
    fs.appendFileSync('./paymo_output/output2.txt',result2,"UTF-8",{'flags': 'a'});
    return verifyTransactions("output3",breadthFirstSearch,userTransactions,4);
  })
  .then(function(result3) {
    console.log("Finished with output3.txt")
    fs.appendFileSync('./paymo_output/output3.txt',result3,"UTF-8",{'flags': 'a'});
    console.log("Finshed outputting final results for all three files.")
  });
