/*
Simple examples of a node.js application acting as a client.

Start the peer server first then each time this app is run it should get some data from the server
*/

/*
Use browser to view pages at http://localhost:3000/index.html.

*/

//Cntl+C to stop server (in Windows CMD console)

var https = require('https'); //need to http
var url = require('url');
var onceON = false;
var onceOFF = false;

var options = {
  hostname: 'localhost',
  port: '3000',
  path: '/furnace',
  method: 'POST',
  rejectUnauthorized: false

}

var stateOfFurnace = false;



setInterval(function(){

  var reqObj = {
      'stateOfFurnace' : stateOfFurnace };

   //response is the object the server send to
   //option is the info we are sending to the server
   https.request(options, function(response){
      handleResponse(response);
   }).end(JSON.stringify(reqObj));
}, 1000);


function handleResponse(response){
  //our boolean to hold our object
  var serverData = '';
  response.on('data', function(chunk){serverData += chunk});



  response.on('end', function(){
     var dataObj = JSON.parse(serverData);
	 if(dataObj.desiredFurnaceState == true && onceON == false)
	 {
	    onceOFF = false;
		console.log('Status: ON');
		onceON = true;
     }
	 if(dataObj.desiredFurnaceState == false && onceOFF == false)
	 {
	    onceON = false;
		console.log('Status: OFF');
		onceOFF = true;
     }
     stateOfFurnace = dataObj.desiredFurnaceState;


   });
}


console.log('Client Running at http://127.0.0.1:3000  CNTL-C to quit');
