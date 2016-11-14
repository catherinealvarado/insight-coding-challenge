#!/usr/bin/env bash
# chmod +x ./run.sh  this allows user to run run.sh from its corresponding directory

node ./src/dataClean.js
node ./src/processingPayments.js
