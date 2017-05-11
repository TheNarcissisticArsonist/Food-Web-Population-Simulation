//------------------------------------------------------------
// Constants
//------------------------------------------------------------

//------------------------------------------------------------
// Global Variables
//------------------------------------------------------------

var page = {}; //An object containing the html elements for everything on the page you need to interact with.
var ctx; //The canvas' 2D context.

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
	//
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