//------------------------------------------------------------
// Constants
//------------------------------------------------------------

var defaultZoom = 2; //The default zoom level. Zoom is given in pixels per graph unit. The graph is done in units of years and number of organisms.
var dragPanningConstant = 1/defaultZoom; //This constant slows down the rate that dragging pans the graph.
var zoomPowerConstant = 1.1; //This is the exponent that zooming in and out uses.
var mouseWheelCalibrationConstant = 53; //The e.deltaY value when you scroll my personal mouse one notch. Other mice may be different.
var axisColors = [["#000000", "#000000"], ["#000000", "#000000"]]; //The colors for the axes. [[x-, x+], [y-, y+]]
var graphTickLength = 10; //How tall the tick marks are on the graph.
var drawGridlines = true;
var gridlinesColor = "#eeeeee";
var units = ["years", ""];
var defaultTimeRate = 60*60*24*365; //1 year per second.
var minDT = 0.05; //At least 0.05 s (50 ms) per simulation step.
var oneYear = 60*60*24*365; //Seconds in a year.

//------------------------------------------------------------
// Global Variables
//------------------------------------------------------------

var page = {}; //An object containing the html elements for everything on the page you need to interact with.
var ctx; //The canvas' 2D context.
var mouseLocation = []; //Used for the mouseMoved function. This is the current mouse position.
var oldMouseLocation = []; //And this is the previous mouse position.
var mouseButtons = {}; //An object containing the states of mouse buttons.
var overCanvas; //Whether or not the cursor is over the canvas.
var pos = [0, 0]; //The position on the graph of the location of the center of the graph window.
var zoom = defaultZoom; //The zoom level of the graph display.
var paused; //The pause/resume state of the simulation.
var orgData = []; //List of organisms' data.
var t0; //Used in time difference calculations for animation speed.
var dt; //Used in time difference calculations for animation speed.
var timeRate = defaultTimeRate; //The amount of simulation time which passes per second.
var popRecord = []; //A list of population history values for each organism. Indexed by organism, then time.
var startTime; //The original time the simulation started.
var loopRunning = false; //Whether or not the simulation/animation loop is running.

//------------------------------------------------------------
// Classes
//------------------------------------------------------------

function Organism(name, id, pred, predC, prey, preyC, loneConst, startPop, carryingCapacity) {
	this.name = name;
	this.id = id;
	this.predList = parseArrayToNums(pred); //List of organisms that are predators to this organism.
	this.predConst = parseArrayToNums(predC);
	this.preyList = parseArrayToNums(prey); //List of organisms that are prey to this organism.
	this.preyConst = parseArrayToNums(preyC);
	this.loneConst = Number(loneConst); //The population rate of change in the complete absence of other organisms.
	                                    //For a producer, this is positive. For a consumer, this is negative.
	this.currentPop = Number(startPop);

	var rawColNum = Math.floor(Math.random() * parseInt("0xFFFFFF"));
	this.color = "#" + String(rawColNum.toString(16));
	console.log(this.color);
	page.orgDataArr[this.id].cont.style.backgroundColor = this.color;

	this.producer = (this.preyList.length == 0);
	if(this.producer) {
		this.carryingCapacity = carryingCapacity;
	}

	this.dPdt = function(orgList, dt) {
		var dP = 0;
		
		for(var i=0; i<this.preyList.length; ++i) {
			dP += this.preyConst[i] * orgList[this.preyList[i]].currentPop * this.currentPop;
		}
		for(var i=0; i<this.predList.length; ++i) {
			dP -= this.predConst[i] * orgList[this.predList[i]].currentPop * this.currentPop;
		}
		dP += this.loneConst * this.currentPop;
		if(this.producer) {
			dP -= this.loneConst * Math.pow(this.currentPop, 2) * (1/this.carryingCapacity);
		}

		return dP*dt;
	}
	this.addPop = function(num) {
		this.currentPop += num;
		return this.currentPop;
	}
	this.setPop = function(num) {
		this.currentPop = num;
	}
}

//------------------------------------------------------------
// Functions
//------------------------------------------------------------

function setup() {
	console.log("FUNCTION CALL: setup()");

	page.numOrgs = document.getElementById("numOrgs");
	page.orgDataCont = document.getElementById("orgDataInputCont");
	page.speedMult = document.getElementById("speedMult"); page.speedMult.value = defaultTimeRate;
	page.startSim = document.getElementById("startSim");
	page.pause = document.getElementById("pause");
	page.resume = document.getElementById("resume");
	page.canvas = document.getElementById("graphArea");

	ctx = page.canvas.getContext("2d");

	userInputSetup();
}
function userInputSetup() {
	console.log("FUNCTION CALL: userInputSetup()");
	
	document.addEventListener("mousemove", function(event) { mouseMoved(event); });
	page.canvas.addEventListener("mousedown", function(event) { mousedown(event); });
	document.addEventListener("mouseup", function(event) { mouseup(event); });
	page.canvas.addEventListener("wheel", function(event) { wheel(event); });
	page.canvas.addEventListener("mouseenter", function(event) { mouseEnterCanvas(event); });
	page.canvas.addEventListener("mouseleave", function(event) { mouseLeaveCanvas(event); });
	page.startSim.addEventListener("click", startSimulation);
	page.pause.addEventListener("click", pause);
	page.resume.addEventListener("click", resume);
	page.numOrgs.addEventListener("change", updateNumOrgs);
	page.orgDataArr = [];
}
function mouseMoved(e) {
	oldMouseLocation[0] = mouseLocation[0];
	oldMouseLocation[1] = mouseLocation[1];
	mouseLocation[0] = event.clientX;
	mouseLocation[1] = event.clientY;

	if(mouseButtons["1"] && overCanvas) {
		var delta = [0, 0];
		delta[0] = mouseLocation[0]-oldMouseLocation[0];
		delta[1] = mouseLocation[1]-oldMouseLocation[1];

		pos[0] += -1 * delta[0] * dragPanningConstant * defaultZoom * (1/zoom);
		pos[1] += delta[1] * dragPanningConstant * defaultZoom * (1/zoom);
	}
}
function mousedown(e) {
	//
	mouseButtons[String(event.which)] = true;
}
function mouseup(e) {
	//
	mouseButtons[String(event.which)] = false;
}
function wheel(e) {
	e.preventDefault();
	e.returnValue = false;
	var wheelChange = e.deltaY;
	var zoomMultiplier = Math.pow(zoomPowerConstant, wheelChange*(1/mouseWheelCalibrationConstant)); //I may want to change how this zoom works later.
	zoom /= zoomMultiplier;
}
function mouseEnterCanvas(e) {
	//
	overCanvas = true;
}
function mouseLeaveCanvas(e) {
	//
	overCanvas = false;
}
function pause() {
	console.log("Paused");
	paused = true;
}
function resume() {
	console.log("Resumed");
	paused = false;
}
function updateNumOrgs() {
	console.log("FUNCTION CALL: updateNumOrgs()");
	
	var rawNum = page.numOrgs.value;
	var num = Number(rawNum);
	if(!isNaN(num)) {
		if(num > 0) {
			while(page.orgDataCont.firstChild) {
				page.orgDataCont.removeChild(page.orgDataCont.firstChild);
			}
			page.orgDataArr = [];
			for(var i=0; i<num; ++i) {
				var singleCont = document.createElement("div");
				singleCont.setAttribute("id", "orgData_" + i);
				singleCont.classList.add("orgDataCont")

				var leftCont = document.createElement("div");
				leftCont.style.textAlign = "right";
				var rightCont = document.createElement("div");
				
				var nameLabel = document.createElement("pre");
				nameLabel.appendChild(document.createTextNode("Name: "));
				var predListLabel = document.createElement("pre");
				predListLabel.appendChild(document.createTextNode("Predators: "));
				var predConstLabel = document.createElement("pre");
				predConstLabel.appendChild(document.createTextNode("Constants: "));
				var preyListLabel = document.createElement("pre");
				preyListLabel.appendChild(document.createTextNode(i + "\t\t" + "Prey: "));
				var preyConstLabel = document.createElement("pre");
				preyConstLabel.appendChild(document.createTextNode("Constants: "));
				var loneConstLabel = document.createElement("pre");
				loneConstLabel.appendChild(document.createTextNode("Lone Rate: "));
				var startPopLabel = document.createElement("pre");
				startPopLabel.appendChild(document.createTextNode("Starting Population: "));
				var carryCapLabel = document.createElement("pre");
				carryCapLabel.appendChild(document.createTextNode("Carrying Capacity: "));


				var nameInput = document.createElement("textarea");
				nameInput.setAttribute("id", "orgData_" + i + "_NAME");
				var predListInput = document.createElement("textarea");
				predListInput.setAttribute("id", "orgData_" + i + "_PREDLIST");
				var predConstInput = document.createElement("textarea");
				predConstInput.setAttribute("id", "orgData_" + i + "_PREDCONST");
				var preyListInput = document.createElement("textarea");
				preyListInput.setAttribute("id", "orgData_" + i + "_PREYLIST");
				var preyConstInput = document.createElement("textarea");
				preyConstInput.setAttribute("id", "orgData_" + i + "_PREYCONST");
				var loneConstInput = document.createElement("textarea");
				loneConstInput.setAttribute("id", "orgData_" + i + "_LONECONST");
				var startPopInput = document.createElement("textarea");
				startPopInput.setAttribute("id", "orgData_" + i + "_STARTPOP");
				var carryCapInput = document.createElement("textarea");
				carryCapInput.setAttribute("id", "orgData_" + i + "_CARRYCAP");

				var leftElementsList = [nameLabel, br(), predListLabel, br(), predConstLabel, br(), preyListLabel, br(), preyConstLabel, br(),
					loneConstLabel, br(), startPopLabel, br(), carryCapLabel, br()];
				var rightElementsList = [nameInput, br(), predListInput, br(), predConstInput, br(), preyListInput, br(), preyConstInput, br(),
					loneConstInput, br(), startPopInput, br(), carryCapInput, br()];

				for(var j=0; j<leftElementsList.length; ++j) {
					leftCont.appendChild(leftElementsList[j]);
				}
				for(var j=0; j<rightElementsList.length; ++j) {
					rightCont.appendChild(rightElementsList[j]);
				}
				singleCont.appendChild(leftCont);
				singleCont.appendChild(rightCont);
				page.orgDataCont.appendChild(singleCont);
				page.orgDataCont.appendChild(br());
				page.orgDataCont.appendChild(br());
				page.orgDataArr.push({});
				page.orgDataArr[i].cont = document.getElementById("orgData_" + i);
				page.orgDataArr[i].name = document.getElementById("orgData_" + i + "_NAME");
				page.orgDataArr[i].predList = document.getElementById("orgData_" + i + "_PREDLIST");
				page.orgDataArr[i].predConst = document.getElementById("orgData_" + i + "_PREDCONST");
				page.orgDataArr[i].preyList = document.getElementById("orgData_" + i + "_PREYLIST");
				page.orgDataArr[i].preyConst = document.getElementById("orgData_" + i + "_PREYCONST");
				page.orgDataArr[i].loneConst = document.getElementById("orgData_" + i + "_LONECONST");
				page.orgDataArr[i].startPop = document.getElementById("orgData_" + i + "_STARTPOP");
				page.orgDataArr[i].carryCap = document.getElementById("orgData_" + i + "_CARRYCAP");
			}
			page.orgDataCont.style.display = "inline-block";
			page.orgDataArr[0].name.focus();
		}
		else {
			hideOrgDataInput();
			page.numOrgs.focus();
		}
	}
	else {
		hideOrgDataInput();
		page.numOrgs.focus();
	}
}
function getOrgInput() {
	console.log("FUNCTION CALL: getOrgInput()");

	orgData = [];
	for(var i=0; i<page.orgDataArr.length; ++i) {
		var name = page.orgDataArr[i].name.value;
		var pred = page.orgDataArr[i].predList.value.split(",");
		var predConst = page.orgDataArr[i].predConst.value.split(",");
		var prey = page.orgDataArr[i].preyList.value.split(",");
		var preyConst = page.orgDataArr[i].preyConst.value.split(",");
		var loneConst = page.orgDataArr[i].loneConst.value;
		var startPop = page.orgDataArr[i].startPop.value;
		var carryCap = page.orgDataArr[i].carryCap.value;
		orgData.push(new Organism(name, i, pred, predConst, prey, preyConst, loneConst, startPop, carryCap));

		popRecord.push([]);
		popRecord[i].push([0, orgData[i].currentPop]);
	}
}
function parseArrayToNums(arr) {
	if(arr[0] == "") {
		return [];
	}
	for(var i=0; i<arr.length; ++i) {
		arr[i] = Number(arr[i]);
	}
	return arr;
}
function hideOrgDataInput() {
	console.log("FUNCTION CALL: hideOrgDataInput()");

	page.orgDataCont.style.display = "none";
}
function br() {
	//
	return document.createElement("br");
}
function startSimulation() {
	console.log("FUNCTION CALL: startSimulation()");
	
	popRecord = [];
	getOrgInput();
	timeRate = Number(page.speedMult.value);
	paused = false;
	t0 = window.performance.now();
	startTime = t0 / 1000; //In seconds
	if(!loopRunning) {
		loopRunning = true;
		animLoop();
	}
}
function drawAxes() {
	var w = page.canvas.width/zoom;
	var w0 = pos[0];
	var h = page.canvas.height/zoom;
	var h0 = pos[1];

	var bounds = [[(-w/2)+w0, (w/2)+w0], [(-h/2)+h0, (h/2)+h0]]; //[[xmin, xmax], [ymin, ymax]];

	ctx.strokeStyle = axisColors[0][0]; //x-
	ctx.moveTo(0, 0);
	ctx.lineTo(bounds[0][0], 0);
	ctx.stroke(); ctx.beginPath();
	ctx.strokeStyle = axisColors[0][1]; //x+
	ctx.moveTo(0, 0);
	ctx.lineTo(bounds[0][1], 0);
	ctx.stroke(); ctx.beginPath();
	ctx.strokeStyle = axisColors[1][0]; //y-
	ctx.moveTo(0, 0);
	ctx.lineTo(0, bounds[1][0]);
	ctx.stroke(); ctx.beginPath();
	ctx.strokeStyle = axisColors[1][1]; //y+
	ctx.moveTo(0, 0);
	ctx.lineTo(0, bounds[1][1]);
	ctx.stroke(); ctx.beginPath();

	ctx.strokeStyle = "#000000";

	var intervalMagnitude = Math.floor(Math.log10(w));
	var interval = Math.pow(10, intervalMagnitude-1);
	var tickLength = graphTickLength/zoom;
	var tickPos = [0, 0];
	var numChars;
	while(tickPos[0] > bounds[0][0]) {
		tickPos[0] -= interval;
		if(drawGridlines) {
			ctx.beginPath();
			ctx.strokeStyle = gridlinesColor;
			ctx.moveTo(tickPos[0], bounds[1][0]);
			ctx.lineTo(tickPos[0], bounds[1][1]);
			ctx.stroke();
			ctx.beginPath();
			ctx.strokeStyle = "#000000";
		}
		ctx.moveTo(tickPos[0], tickPos[1]+(tickLength/2));
		ctx.lineTo(tickPos[0], tickPos[1]-(tickLength/2));
		ctx.stroke();
		numChars = 2+Math.floor(Math.abs(Math.log10(interval)));
		if(tickPos[0] < 0) {
			++numChars;
		}
		drawVerticalText(makeGraphMarkers(String(tickPos[0]).slice(0, numChars), 0), tickPos[0], tickPos[1]+tickLength);
	}
	tickPos = [0, 0];
	while(tickPos[0] < bounds[0][1]) {
		tickPos[0] += interval;
		if(drawGridlines) {
			ctx.beginPath();
			ctx.strokeStyle = gridlinesColor;
			ctx.moveTo(tickPos[0], bounds[1][0]);
			ctx.lineTo(tickPos[0], bounds[1][1]);
			ctx.stroke();
			ctx.beginPath();
			ctx.strokeStyle = "#000000";
		}
		ctx.moveTo(tickPos[0], tickPos[1]+(tickLength/2));
		ctx.lineTo(tickPos[0], tickPos[1]-(tickLength/2));
		ctx.stroke();
		numChars = 2+Math.floor(Math.abs(Math.log10(interval)));
		if(tickPos[0] < 0) {
			++numChars;
		}
		drawVerticalText(makeGraphMarkers(String(tickPos[0]).slice(0, numChars), 0), tickPos[0], tickPos[1]+tickLength);
	}
	tickPos = [0, 0];
	while(tickPos[1] > bounds[1][0]) {
		tickPos[1] -= interval;
		if(drawGridlines) {
			ctx.beginPath();
			ctx.strokeStyle = gridlinesColor;
			ctx.moveTo(bounds[0][0], tickPos[1]);
			ctx.lineTo(bounds[0][1], tickPos[1]);
			ctx.stroke();
			ctx.beginPath();
			ctx.strokeStyle = "#000000";
		}
		ctx.moveTo(tickPos[0]+(tickLength/2), tickPos[1]);
		ctx.lineTo(tickPos[0]-(tickLength/2), tickPos[1]);
		ctx.stroke();
		numChars = 2+Math.floor(Math.abs(Math.log10(interval)));
		if(tickPos[1] < 0) {
			++numChars;
		}
		drawHorizontalText(makeGraphMarkers(String(tickPos[1]).slice(0, numChars), 1), tickPos[0]+tickLength, -tickPos[1]);
	}
	tickPos = [0, 0];
	while(tickPos[1] < bounds[1][1]) {
		tickPos[1] += interval;
		if(drawGridlines) {
			ctx.beginPath();
			ctx.strokeStyle = gridlinesColor;
			ctx.moveTo(bounds[0][0], tickPos[1]);
			ctx.lineTo(bounds[0][1], tickPos[1]);
			ctx.stroke();
			ctx.beginPath();
			ctx.strokeStyle = "#000000";
		}
		ctx.moveTo(tickPos[0]+(tickLength/2), tickPos[1]);
		ctx.lineTo(tickPos[0]-(tickLength/2), tickPos[1]);
		ctx.stroke();
		numChars = 2+Math.floor(Math.abs(Math.log10(interval)));
		if(tickPos[1] < 0) {
			++numChars;
		}
		drawHorizontalText(makeGraphMarkers(String(tickPos[1]).slice(0, numChars), 1), tickPos[0]+tickLength, -tickPos[1]);
	}
}
function makeGraphMarkers(text, axis) { //axis is 0 for x, 1 for y
	var arr = text.split("");
	var numCommas = 0;
	if(!(arr[1] == "." || arr[2] == ".")) {
		for(var i=arr.length-1; i>0; --i) {
			if(arr[i-1] == "-") {
				break;
			}
			else if(((arr.length-i)-numCommas) % 3 == 0) {
				arr.splice(i, 0, ",");
				++numCommas;
				--i;
			}
		}
	}
	if(units != "") {
		arr.push(" " + units[axis]);
	}
	return arr.join("");
}
function drawHorizontalText(text, x, y) {
	ctx.save();
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.transform(1, 0, 0, 1, page.canvas.width/2, page.canvas.height/2); //Put 0,0 in the center of the canvas
	ctx.transform(zoom, 0, 0, zoom, 0, 0); //Scale the canvas
	ctx.transform(1, 0, 0, 1, -pos[0], pos[1]);
	ctx.transform(1, 0, 0, 1, x, y);
	ctx.transform(1/zoom, 0, 0, 1/zoom, 0, 0);
	ctx.fillText(text, 0, 3);
	ctx.restore();
}
function drawVerticalText(text, x, y) {
	ctx.save();
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.transform(1, 0, 0, 1, page.canvas.width/2, page.canvas.height/2); //Put 0,0 in the center of the canvas
	ctx.transform(zoom, 0, 0, zoom, 0, 0); //Scale the canvas
	ctx.transform(1, 0, 0, 1, -pos[0], pos[1]);
	ctx.transform(1, 0, 0, 1, x, y);
	ctx.transform(1/zoom, 0, 0, 1/zoom, 0, 0);
	ctx.transform(0, 1, -1, 0, 0, 0);
	ctx.fillText(text, 0, 3);
	ctx.restore();
}
function clearAndResetCanvas() {
	//console.log("FUNCTION CALL: clearAndResetCanvas()");

	ctx.setTransform(1, 0, 0, 1, 0, 0); //Reset all context transforms
	ctx.clearRect(0, 0, page.canvas.width, page.canvas.height); //Clear the entire canvas
	ctx.beginPath(); //Start a new line path.
	ctx.transform(1, 0, 0, 1, page.canvas.width/2, page.canvas.height/2); //Put 0,0 in the center of the canvas
	ctx.transform(zoom, 0, 0, zoom, 0, 0); //Scale the canvas
	ctx.transform(1, 0, 0, -1, 0, 0); //Flip the canvas vertically.
	ctx.lineWidth = 1/zoom; //Keep the lines the same thickness.
	ctx.font = "10px";
	ctx.transform(1, 0, 0, 1, -pos[0], -pos[1]);
}
function updatePop(dt, t) {
	var timeElapsed = t - startTime;
	timeElapsed *= timeRate/oneYear;
	dt *= timeRate/oneYear;
	t *= timeRate/oneYear;
	var dPop = [];
	for(var i=0; i<orgData.length; ++i) {
		dPop[i] = orgData[i].dPdt(orgData, dt);
	}
	for(var i=0; i<orgData.length; ++i) {
		var pop = orgData[i].addPop(dPop[i]);
		if(pop < 0) {
			orgData[i].setPop(0);
		}
		popRecord[i].push([t-startTime, orgData[i].currentPop]);
	}
}
function drawPop() {
	for(var i=0; i<orgData.length; ++i) {
		if(popRecord[i].length < 2) {
			break;
		}

		ctx.strokeStyle = orgData[i].color;
		ctx.beginPath();
		ctx.moveTo(popRecord[i][0][0], popRecord[i][0][1]);

		for(var j=0; j<popRecord[i].length; ++j) {
			ctx.lineTo(popRecord[i][j][0], popRecord[i][j][1]);
			ctx.stroke();
		}
	}
	ctx.strokeStyle = "#000000";
}
function animLoop() {
	var t = window.performance.now();
	dt = t - t0;
	dt = dt / 1000; //Display us to display s

	if(dt > minDT) {
		t0 = t;
		t = t /1000; //t is now in s instead of ms

		updatePop(dt, t);
		clearAndResetCanvas();
		drawAxes();
		drawPop();
	}

	requestAnimationFrame(animLoop);
}

//------------------------------------------------------------
// Executed Code
//------------------------------------------------------------

setup();