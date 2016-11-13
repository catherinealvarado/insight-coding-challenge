var fs = require('fs'), readline = require('readline');
var userTransactions = require('../paymo_input/transactionsGraph.json')
// extractUserData = require('./dataClean.js')

function extractUserData(str){
  var regex = /\d{4}?\-\d{2}?-\d{2}?\s\d{2}?\:\d{2}?\:\d{2}?\,\s\d+\,\s\d+\,\s\d+\.{0,}\d+\,/g;
  var numRegex = /\,\s((\d+\.{0,}\d+)|\d+)/g;
  if (str.match(regex) !== null){
    var trans = str.match(numRegex)
    trans.forEach(function(info,index){
      trans[index] = info.substring(2)
    });
    trans[2] = parseFloat(trans[2])
    return trans;
  }
  else{
    return;
  }
}

function pastTransaction(obj,pay1,receive2){
  var pay1Friends = obj[pay1]
  if (pay1Friends[receive2] !== undefined){
    return "trusted";
  }
  else {
    return "unverified";
  }
}

function findUnvisitedNodes(obj,arr){
  return (arr.filter((node)=>{
      return obj[node] === undefined
    }));
}


///MIGHT WANT TO WRITE A FASTER FUNCTION FOR FEATURE 2!

function breadthFirstSearch(obj,id1,id2,depth){
  var visitedNodes = {}, queue = [id1];
  visitedNodes[id1] = id1;
  var currDepth = 0; leftTillIncreaseDep = 1; futureTillIncreaseDep = 0;
  while (queue.length > 0){
    var id = queue.shift()
    if (id === id2){
      return "trusted"
    }
    leftTillIncreaseDep -= 1;
    if (obj[id]){
      var childrenNodes = findUnvisitedNodes(visitedNodes,Object.keys(obj[id])) //prevents from looking at already visited nodes
      futureTillIncreaseDep += childrenNodes.length; //if inside a children node is this ok?
      if (leftTillIncreaseDep === 0){
        currDepth += 1
        if (currDepth > depth){
          return "unverified"
        }
        leftTillIncreaseDep = futureTillIncreaseDep;
        futureTillIncreaseDep = 0;
      }
      childrenNodes.forEach((key)=>{
          queue.push(key)
          visitedNodes[key] = key});
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
      input: fs.createReadStream('../paymo_input/stream_payment.csv'),
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
    fs.appendFileSync('../paymo_output/output1.txt',result,"UTF-8",{'flags': 'a'});
    return verifyTransactions("output2",breadthFirstSearch,userTransactions,2); // return a new Promise from inside of the function passed to .then()
  }) // this new Promise has a .then() method of its own
  .then(function(result2) {
    console.log("Finished with output2.txt")
    fs.appendFileSync('../paymo_output/output2.txt',result2,"UTF-8",{'flags': 'a'});
    return verifyTransactions("output3",breadthFirstSearch,userTransactions,4);
  })
  .then(function(result3) {
    console.log("Finished with output3.txt")
    fs.appendFileSync('../paymo_output/output3.txt',result3,"UTF-8",{'flags': 'a'});
    console.log("Finshed outputting all three files.")
  });
