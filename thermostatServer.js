/*
Simple server to serve a related peer client
*/

/*
Use browser to view pages at http://localhost:3000/index.html.

*/

//Cntl+C to stop server (in Windows CMD console)



var https = require('https'); //need to http
var url = require('url');
var fs = require('fs');


// Thermostat.js/////////////////////////////////////////////
var Thermostat1 = require("./Thermostat1.js");
var therm = new Thermostat1(); //new instance of thermostat
/////////////////////////////////////////////////////////////


var roomTemp = 20;  //degrees celsius
var desiredT = 18;
therm.setThermostat(desiredT); //set desired room temperature
var onceON = false;
var onceOFF = false;

var furnaceIsOn = false; //temporary boolean to represent
                         //furnace for now which we will use to send to the furnace
var desiredFurnaceState = false;

  therm.on("run", function() {
    desiredFurnaceState = true;
  });
  therm.on("stop", function() {
    desiredFurnaceState = false;

  });

  //Keep updating the temperature and tell thermostat
  //what the temperature is

  //start a timeout timer and recursively restart it each time.
  setTimeout(function again(){
     if(furnaceIsOn ) roomTemp++;
     else roomTemp--;
     therm.temp(roomTemp); //tell thermostat the room temp
     console.log('TEMP: ' + roomTemp);
     setTimeout(again, 1000); //recursively restart timeout
     }, 1000);

function sendResponse(weatherData, res){
  var page =  '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"' +
				  '"http://www.w3.org/TR/xhtml11/DTD/xhtml1-strict.dtd">' +

				'<html xmlns = "http://www.w3.org/1999/xhtml">'+
				'<head>'+
				'<meta http-equiv="refresh" content="5 url=https://localhost:3000"/>'+
					'<link rel="stylesheet" type="text/css" href="switch.css">'+
					'<title>Problem3.html</title>'+
				'</head>' +
				'<body>' +
				'<form name="actionForm" action="" method="get">' +
				'<center>' +
					'<h1>Thermostat</h1>' +
					'<br><br>Desired Temperature' +
					'<p id="desTemp">'+therm.desiredTemperature+'&deg C</p>' +
					'<input type="submit" name="incr" value="+" onClick="this.form.action=\'/increase\';" style="height: 25px; width: 25px"><br>' +
					'<input type="submit" name="decr" value="-" onClick="this.form.action=\'/decrease\';" style="height: 25px; width: 25px">' +
					'<br><br>Current Temperature:' +
					'<p id="temp">' + roomTemp + '&deg C</p>' +
					'<progress id="therm" value="'+(roomTemp+40)+'" max="80"></progress><br><br>';
  if(weatherData){
    var weather = JSON.parse(weatherData);
    page += '<h4>Ottawa Weather Info</h4><p>' + weather.name + '<pre>' + weather.main.temp + '&degC'+'</p>';
  }
  page += '</center></form></body></html>';
  res.end(page);
}
  function increaseTemp()
  {
    console.log('increased');
    desiredT++;
	therm.setThermostat(desiredT);

  }
  function decreaseTemp()
  {
    console.log('decreased');
    desiredT--;
	therm.setThermostat(desiredT);
  }

  function parseWeather(weatherResponse, res) {
  var weatherData = '';
  weatherResponse.on('data', function (chunk) {
    weatherData += chunk;
  });
  weatherResponse.on('end', function () {
    sendResponse(weatherData, res);
  });
}

function getWeather(city, res, key){
  var options = {
    host: 'api.openweathermap.org',
    path: '/data/2.5/weather?id=' + city +'&APPID='+key+'&units=metric'
  };
  require('http').request(options, function(weatherResponse){
    parseWeather(weatherResponse, res);
  }).end();
}

//Private SSL key and signed certificate
var options = {
key: fs.readFileSync('serverkey.pem'),
cert: fs.readFileSync('servercert.crt')
};

https.createServer(options, function (request,response){
     var urlObj = url.parse(request.url, true, false);
     var query = urlObj.query;
      //web client

      // when the broweser make the request to the server, handles teh websites
     if (request.method ==='GET') {
		 response.writeHead(200, {'Content-Type': 'text/html'});
		 getWeather(4905006, response,'f6b6aed7d912676167029255a9e0444c');
     }
	 if(urlObj.pathname === '/increase')
	 {
	   increaseTemp();
	 }
	 if(urlObj.pathname === '/decrease')
	 {
	   decreaseTemp();
	 }
   //anything that is not a GET request which at the moment is the POST request coming from the client
   //I need to handle the web client and also the  furnace client with else if. else if( request.method == 'POST')
   else if(urlObj.pathname === '/furnace') {
      var jsonData = '';

     request.on('data', function(chunk) {
        jsonData += chunk;
     });
     request.on('end', function(){
       //what the furnace sent us is within the reqObj
        var reqObj = JSON.parse(jsonData);
		    if(reqObj.stateOfFurnace == true && onceON == false)
			{
			  onceOFF = false;
              console.log('Furnace is: ON');
			  onceON = true;
			}
		    if(reqObj.stateOfFurnace == false && onceOFF == false)
			{
			  onceON = false;
              console.log('Furnace is: OFF');
			  onceOFF = true;
			}
            //update furnace state once received by furnace furnace.
            furnaceIsOn = reqObj.stateOfFurnace;

        var resObj = {
            'desiredFurnaceState' : desiredFurnaceState };
        response.writeHead(200);
        response.end(JSON.stringify(resObj));
     });
   }
 }).listen(3000);

console.log('Server Running at http://127.0.0.1:3000  CNTL-C to quit');
