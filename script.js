//------------------------------------------------------------
// Constants
//------------------------------------------------------------

var defaultZoom = 1; //The default zoom level. Zoom is given in pixels per graph unit. The graph is done in units of years and number of organisms.
var dragPanningConstant = 1/defaultZoom; //This constant slows down the rate that dragging pans the graph.

//------------------------------------------------------------
// Global Variables
//------------------------------------------------------------

var page = {}; //An object containing the html elements for everything on the page you need to interact with.
var ctx; //The canvas' 2D context.
var mouseLocation = []; //Used for the mouseMoved function. This is the current mouse position.
var oldMouseLocation = []; //And this is the previous mouse position.
var mouseButtons = {}; //An object containing the states of mouse buttons.
var overCanvas; //Whether or not the cursor is over the canvas.
var pos = []; //The position on the graph of the location of the center of the graph window.
var zoom; //The zoom level of the graph display.

//------------------------------------------------------------
// Classes
//------------------------------------------------------------

//------------------------------------------------------------
// Functions
//------------------------------------------------------------

function setup() {
	console.log("FUNCTION CALL: setup()");

	page.numOrgs = document.getElementById("numOrgs");
	page.orgDataCont = document.getElementById("orgDataInputCont");
	page.speedMult = document.getElementById("speedMult");
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
function mouseDown(e) {
	//
}
function mouseup(e) {
	//
}
function mouseEnterCanvas(e) {
	//
}
function mouseLeaveCanvas(e) {
	//
}
function startSimulation() {
	console.log("FUNCTION CALL: startSimulation()");
	//
}
function pause() {
	console.log("Paused");
	//
}
function resume() {
	console.log("Resumed");
	//
}
function updateNumOrgs() {
	console.log("FUNCTION CALL: updateNumOrgs()");
	//
}

//------------------------------------------------------------
// Executed Code
//------------------------------------------------------------

setup();