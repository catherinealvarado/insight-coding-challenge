#Additional Information

In order to run my code node.js is needed. I call node in my run.sh file so it is necessary to have it installed.

When I wrote my code, I assumed that the graph will fit into memory. I cleaned and processed the data from batch_payment.txt and represented the payment data as a graph. The graph I am using is made up of a set of two sets-an object with two objects inside. The first object is called "transactions" and the second object is called "totalPayments".  

This is an example of what my graph looks like:
graph = {
  "transactions":{...},
  "totalPayments":{...}
}

I decided to build up my graph the way described above because finding users, their relationships, and additional information about the user takes constant time.

graph["transactions"] contains all of the transaction relationships that were made in batch_payment.txt. The JavaScript file called dataClean.js reads every line in batch_payment.txt, processes each each line and if the line contains valid information, then it adds information to "transaction". For example, if the first line we read from the payment file is "2016-11-01 17:38:25, 49466, 6989, 23.74, 🦄 ", then we add two new objects into transactions. The first object added is "49466":{"6989": 23.74} and the second object added is "6989":{"49466":0}. If the second line of the payment text file is "2016-11-01 17:38:25, 6989, 10, 5, 🦄 ", then we modify the object with the key "6989" to "6989":{"49466":0,"10":5} and add "10":{"6989":0} to transactions because it does not yet exist in transactions.

graph["totalPayments"] contains the total amount of money that was paid to friends for each object in graph["transactions"]. For example, if user 1232 paid out a total of $300 to ten friends, then we add "1232": 300 to graph["totalPayments"].

It is important to note that I use graph["transactions"] in processingPayments.js to determine what transactions are fraudulent, but I do not use graph["totalPayments"]. I kept totalPayments in my graph because it is useful information for PayMo to know.

Here are some ways this totalPayments could be useful:

1. PayMo could keep track of how much each user is spending in total and partner with a credit card company to advertise a credit card to users who spend over a certain amount. In order to convince users to take on the credit card, PayMo could provide incentives for these users. PayMo would make a substantial profit off successfully advertising credit cards to users who spend a lot of money and borrow from friends.

2. Users who signed up to PayMo with a debit card could get a warning when they are about to run out of money to make payments.  
