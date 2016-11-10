//lets create a graph as a set of sets!! :)
//business plan ideas -- > think about speading growth of business if node no exists then recommend what kind of people have the best connected network?
var fs = require('fs');
var readline = require('readline');

function relationshipGraph(){
  this.transactions = {};
  this.totalPayments = {}
}

relationshipGraph.prototype.addNode = function(node){
  this.transactions[node] = {}
}

relationshipGraph.prototype.addEdge = function(pay1,receive2,amount){
  var friendsSet = this.transactions[pay1]
  if (friendsSet[receive2]){
    friendsSet[receive2] = parseFloat((friendsSet[receive2] + amount).toFixed(2))
  }
  else{
    friendsSet[receive2] = amount
  }
  var addreceiver = this.transactions[receive2]
  if (addreceiver[pay1] === undefined){
    addreceiver[pay1] = 0
  }
}

relationshipGraph.prototype.checkIfNodeExists = function(node){
  if (this.transactions[node]){
    return true
  }
  else{
    return false
  }
}

relationshipGraph.prototype.processRelationship = function(pay1,receive2,total){
  if (this.checkIfNodeExists(pay1) === false ){
    this.addNode(pay1)
  }
  if (this.checkIfNodeExists(receive2) === false){
    this.addNode(receive2)
  }
  this.addEdge(pay1,receive2,total)
}

function createGraph(){
  var graph = new relationshipGraph()

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

  function sumPayments(obj){
    var total = 0;
    for (var id in obj){
      total = parseFloat((total + obj[id]).toFixed(2))
    }
    return total;
  }

  var rd = readline.createInterface({
    input: fs.createReadStream('../paymo_input/batch_payment.csv'),
    output: process.stdout,
    terminal: false
  });
  rd.on('line', function(line) {
    var userData = extractUserData(line)
    if (userData !== undefined){
      graph.processRelationship(userData[0],userData[1],userData[2]);
    }
  });
  rd.on('close',function(){
    // graph["totalPayments"] = {};
    var payments = graph["totalPayments"]
    var transactions = graph["transactions"];
    for(var id in transactions){
      payments[id] = sumPayments(transactions[id])
    }
    fs.writeFile('../paymo_input/transactionsData.json', JSON.stringify(graph["transactions"], null, 2));
  })
}
createGraph()
