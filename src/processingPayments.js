var fs = require('fs'), readline = require('readline');
var userTransactions = require('../paymo_input/transactionsGraph.json')
extractUserData = require('../src/dataClean.js')

function pastTransaction(obj,pay1,receive2){
  var pay1Friends = obj[pay1]
  if (pay1Friends[receive2] !== undefined){
    return "trusted";
  }
  else {
    return "unverified";
  }
}

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

function findUnvisitedNodes(objVis,obj){
  var unvisitedArr = []
  for (var id in obj){
    if (objVis[id] === undefined){
      unvisitedArr.push(id)
      objVis[id] = id;
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
	this.isEmpty = function(){
		return 0===a.length
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

function breadthFirstSearch(obj,id1,id2,depth){
  var visitedNodes = {}, queue = new Queue();
  queue.enqueue(id1)
  visitedNodes[id1] = id1;
  var currDepth = 0; leftTillIncreaseDep = 1; futureTillIncreaseDep = 0;
  while (queue.getLength() > 0){
    var id = queue.dequeue();
    if(id === id2){
      return "trusted"
    }
    leftTillIncreaseDep -= 1;
    var idChildren = obj[id];
    if (idChildren){
      var childrenNodes = findUnvisitedNodes(visitedNodes,idChildren) //prevents from looking at already visited nodes
      futureTillIncreaseDep += childrenNodes.length; //if inside a children node is this ok?
      if (leftTillIncreaseDep === 0){
        currDepth += 1
        if (currDepth > depth){
          return "unverified"
        }
        leftTillIncreaseDep = futureTillIncreaseDep;
        futureTillIncreaseDep = 0; //might be able to add another line here saying to directly check instead of queue waiting
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

function verifyTransactions(fileName,functionName,obj,depth){
  var countRow = 0;
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
          // console.log(id1)
          countRow += 1;
          console.log(countRow)
          var verify = functionName(obj,id1,id2,depth)
          stringVerifications += verify+"\n"
        }
        else{
          countRow += 1;
          console.log(countRow)
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

verifyTransactions("output1",pastTransaction,userTransactions) // returns a Promise, which has a .then() method
  .then(function(result) {
    console.log("Finished with output1.txt")
    fs.appendFileSync('./paymo_output/output1.txt',result,"UTF-8",{'flags': 'a'});
    return verifyTransactions("output2",friendOfFriend,userTransactions); // return a new Promise from inside of the function passed to .then()
  }) // this new Promise has a .then() method of its own
  .then(function(result2) {
    console.log("Finished with output2.txt")
    fs.appendFileSync('./paymo_output/output2.txt',result2,"UTF-8",{'flags': 'a'});
    return verifyTransactions("output3",breadthFirstSearch,userTransactions,4);
  })
  .then(function(result3) {
    console.log("Finished with output3.txt")
    fs.appendFileSync('./paymo_output/output3.txt',result3,"UTF-8",{'flags': 'a'});
    console.log("Finshed outputting all three files.")
  });
