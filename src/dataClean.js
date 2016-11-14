//fs and readline are libraries that read and write to files.
var fs = require('fs'),readline = require('readline');
//extractUserData is a function defined in this file and is exported to be used again in processingPayments.js
module.exports = extractUserData;

//sets up a graph that is a set of sets
//transactions - an object that shows all the transactions each user has made with others
//total Payments - the sum of all the payments each user has made to friends
//ex) if A paid B $30, then we get
//{transactions: {"A":{"B":30},"B":{"A":0}},totalPayments:{"A":30,"B":0}}
function relationshipGraph(){
  this.transactions = {};
  this.totalPayments = {}
}

//adds a new object to the set of transactions
//the key of the object is the userid and the value is an empty set
relationshipGraph.prototype.addNode = function(node){
  this.transactions[node] = {}
}

//creates a relationship between two people in the graph
//adds an object with key pay1 into the transactions of receive2
//and add an object with key receive2 into the transactions for pay1
relationshipGraph.prototype.addEdge = function(pay1,receive2,amount){
  var friendsSet = this.transactions[pay1]
  if (friendsSet[receive2]){
    friendsSet[receive2] = parseFloat((friendsSet[receive2] + amount).toFixed(2))
  }
  else{
    friendsSet[receive2] = amount
  }
  var receiverFriends = this.transactions[receive2]
  if (receiverFriends[pay1] === undefined){
    receiverFriends[pay1] = 0
  }
}

//checks if a userid is in the transactions object
relationshipGraph.prototype.checkIfNodeExists = function(node){
  if (this.transactions[node]){
    return true
  }
  else{
    return false
  }
}

//checks to see if nodes pay1 and pay2 exist
//adds an object to transactions if the object is not already in transactions
//then adds an edge between pay1 and receive2
relationshipGraph.prototype.processRelationship = function(pay1,receive2,total){
  if (this.checkIfNodeExists(pay1) === false ){
    this.addNode(pay1)
  }
  if (this.checkIfNodeExists(receive2) === false){
    this.addNode(receive2)
  }
  this.addEdge(pay1,receive2,total)
}

//this function checks to see that str is correctly formatted as transaction
//meaning that str contains a time stamp, id1, id2, and amount paid
//it outputs an array with id1,id2, and total amount paid
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

//adds all the values in an object
function sumPayments(obj){
  var total = 0;
  for (var id in obj){
    total = parseFloat((total + obj[id]).toFixed(2))
  }
  return total;
}

//processes batch_payment.txt line by line
//creates a graph with all the transactions made and saves the graph into a JSON file
function createGraph(){
  var graph = new relationshipGraph()
  var rd = readline.createInterface({
    input: fs.createReadStream('./paymo_input/batch_payment.txt'),
    output: process.stdout,
    terminal: false
  });
  rd.on('line', function(line) {
    var userData = extractUserData(line)
    if (userData !== undefined){ //if the line is valid, meaning the payment information is correctly formatted
      graph.processRelationship(userData[0],userData[1],userData[2]);
    }
  });
  rd.on('close',function(){
    var transactions = graph["transactions"];
    var totalPaidOut = graph["totalPayments"]
    //adding up all the transactions for each user and inserting into totalPaidOut
    for(var id in transactions){
      totalPaidOut[id] = sumPayments(transactions[id])
    }
    fs.writeFile('./paymo_input/transactionsGraph.json', JSON.stringify(graph["transactions"], null, 2));
  })
}
createGraph()
