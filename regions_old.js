var circles = [];
var nodes = [];
var edges = [];
var multiplier = 3;
var c = 20;
var t = 200;
var k;
var rects;

var svg;
var times = [];

/** A labelled circle */
function Circle(label,r,x,y) {
	this.label = label;
	this.r = r;
	this.x = x;
	this.y = y;
}


function Rectangle(x,y,width,height) {
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
	this.label = "";
}

function Point(x,y) {
	this.x = x;
	this.y = y;
}


function Node(label,region){
	this.label = label;
	x = 0.0;
	y = 0.0;
	this.region = region;
	horizontal = 0;
	vertical = 0;
}

function Edge(source, target, size){
	this.source = source;
	this.target = target;
	this.size = size;
}


function Time(time){
	this.time = time;
	this.interactions = [];
}

function Interaction(start, end, size){
	this.start = start;
	this.end = end;
	this.size = size;
}



/** Find the circle with the given label */
function circleWithLabel(label, circles) {
	for (var i = 0; i <  circles.length; i++) {
		if(circles[i].label==label) {
			return circles[i];
		}
	}
	return null;
}


/**
  Adapted from http://jsfromhell.com/math/dot-line-length.
  x y is the point
  x0 yo x1 y2 is the line segment
  if o is true, just consider the line segment, if it is false consider an infinite line.
*/		
function pointLineLength(x, y, x0, y0, x1, y1, o){
	if(o && !(o = function(x, y, x0, y0, x1, y1){
		if(!(x1 - x0)) return {x: x0, y: y};
		else if(!(y1 - y0)) return {x: x, y: y0};
		var left, tg = -1 / ((y1 - y0) / (x1 - x0));
		return {x: left = (x1 * (x * tg - y + y0) + x0 * (x * - tg + y - y1)) / (tg * (x1 - x0) + y0 - y1), y: tg * left - tg * x + y};
	}(x, y, x0, y0, x1, y1), o.x >= Math.min(x0, x1) && o.x <= Math.max(x0, x1) && o.y >= Math.min(y0, y1) && o.y <= Math.max(y0, y1))){
		var l1 = distance(x, y, x0, y0), l2 = distance(x, y, x1, y1);
		return l1 > l2 ? l2 : l1;
	}
	else {
		var a = y0 - y1, b = x1 - x0, c = x0 * y1 - y0 * x1;
		return Math.abs(a * x + b * y + c) / Math.sqrt(a * a + b * b);
	}
};


/** Finds a rectangle that covers the given circle */
function circlesLimit(circles) {
	var minX = 0;
	var minY = 0;
	var maxX = 0;
	var maxX = 0;
	for (var i = 0; i < circles.length; i++) {
		if(i == 0) {
			minX = circles[i].x - circles[i].r;
			minY = circles[i].y - circles[i].r;
			maxX = circles[i].x + circles[i].r;
			maxY = circles[i].y + circles[i].r;
		} else {
			if(minX > circles[i].x - circles[i].r) {
				minX = circles[i].x - circles[i].r;
			}
			if(minY > circles[i].y - circles[i].r) {
				minY = circles[i].y - circles[i].r;
			}
			if(maxX < circles[i].x + circles[i].r) {
				maxX = circles[i].x + circles[i].r;
			}
			if(maxY < circles[i].y + circles[i].r) {
				maxY = circles[i].y + circles[i].r;
			}
		}
	}
	var rectangle = new Rectangle(minX,minY,maxX-minX,maxY-minY);
	return rectangle;
}



/** Tests to see if the point is in the circle */
function inCircle(circle,x,y) {
	if(distance(circle.x,circle.y,x,y) < circle.r) {
		return true;
	}
	return false;
}


/** Distance between two points - pythagoras */
function distance(x1,y1,x2,y2) {
	return Math.sqrt((x1-x2) * (x1-x2) + (y1-y2) * (y1-y2));
}


/**
  Find out if the point is in the zone. The zone is specified
  by the circles it is in and the circles it is out of. All
  the circles should be in one of the two sets.
*/
function inZone(inCircles,outCircles,x,y) {
	for (var i = 0; i < inCircles.length; i++) {
		if(!inCircle(inCircles[i],x,y)) {
			return false;
		}
	}
	for (var i = 0; i < outCircles.length; i++) {
		if(inCircle(outCircles[i],x,y)) {
			return false;
		}
	}
	return true;

}


/**
  Find out if the rectangle is completely in the zone. The zone is specified
  by the circles it is in and the circles it is out of. All
  the circles should be in one of the two sets. This tests the oorner
  points, so some oddly shaped zones may return an incorrect true.
*/
function rectangleInZone(circlesInZone,circlesOutZone, minX,maxX,minY,maxY) {

	// first test the corners
	if(!inZone(circlesInZone,circlesOutZone, minX,minY)) {
		return false;
	}
	if(!inZone(circlesInZone,circlesOutZone, minX,maxY)) {
		return false;
	}
	if(!inZone(circlesInZone,circlesOutZone, maxX,minY)) {
		return false;
	}
	if(!inZone(circlesInZone,circlesOutZone, maxX,maxY)) {
		return false;
	}
	
	// all the corners are in the zone. Do any of the rectangle
	// edges leave the zone? To test this, check each circle
	// that the rectangle is not supposed to be in for shortest
	// centre edge distance and compare this distance to the radius.
	var distanceToCentre;
	for (var i = 0; i < circlesOutZone.length; i++) {
		var circle = circlesOutZone[i];
		distanceToCentre = pointLineLength(circle.x, circle.y, minX, minY, maxX, minY, true)
		if(distanceToCentre < circle.r) {
			return false;
		}
		distanceToCentre = pointLineLength(circle.x, circle.y, minX, minY, minX, maxY, true)
		if(distanceToCentre < circle.r) {
			return false;
		}
		distanceToCentre = pointLineLength(circle.x, circle.y, maxX, maxY, maxX, minY, true)
		if(distanceToCentre < circle.r) {
			return false;
		}
		distanceToCentre = pointLineLength(circle.x, circle.y, maxX, maxY, minX, maxY, true)
		if(distanceToCentre < circle.r) {
			return false;
		}

	}
	
	return true;
}


/**
  Given that the zone in in the inZone circles, this finds
  the circles that do not contain the zone.
*/
function getOutZones(circles,inZone) {
	var outZone = [];
	for (var i = 0; i < circles.length; i++) {
		var circleInZone = false;
		for (var j = 0; j < inZone.length; j++) {
			if(circles[i] == inZone[j]) {
				circleInZone = true;
				outCircle = circles[i];
			}
		}
		if(!circleInZone) {
			outZone.push(circles[i]);
		}
	}
	return outZone;
}


/**
	Find the points in the given zone in a grid based on the parameters.
*/
function findPointsInZone(displayLimit,xStep,yStep,circlesInZone,circlesOutZone) {

	var points = [];
	for(var x = displayLimit.x+xStep/2; x <= displayLimit.x + displayLimit.width; x = x + xStep) {
		for(var y = displayLimit.y+yStep/2; y <= displayLimit.y + displayLimit.height; y = y + yStep) {
			var pointInZone = inZone(circlesInZone, circlesOutZone,x,y);
			if(pointInZone) {
				points.push(new Point(x,y));
			}
		}
	}
	return points;
}


/** Finds a minimum number of points in a zone, or return empty list*/
function findSufficientPointsInZone(circlesInZone,circlesOutZone) {
	var displayLimit = circlesLimit(circlesInZone);
	var gridSide = 3;
	var xStep = displayLimit.width/gridSide;
	var yStep = displayLimit.height/gridSide;
	
	var zonePointsX = [];
	var zonePointsY = [];
	
	var pointsInZone = [];
	while(pointsInZone.length < 10) {
		if(xStep < 1 && yStep < 1) {
			console.log("zone not found");
				return [];
			}
		pointsInZone = findPointsInZone(displayLimit,xStep,yStep,circlesInZone,circlesOutZone)
		xStep = xStep/2;
		yStep = yStep/2;
	}
	return pointsInZone;
}



/** For each zone, finds circles that the zones are in. Returns a list of lists */
function zoneFinder(zoneStrings,circles) {
	var ret = [];
	for (var i = 0; i <  zoneStrings.length; i++) {
		var zoneString = zoneStrings[i];
		var nextZone = [];
		for (var j = 0; j < zoneString.length; j++) {
			var circleLabel = zoneString[j];
			var circle = circleWithLabel(circleLabel,circles);
			nextZone.push(circle);
		}
		ret.push(nextZone);
	}
	return ret;
}


/**
  Expand a rectangle until it fills the zone as much as possible
*/
function findRectangle(point,circlesInZone,circlesOutZone) {

	var minX = point.x;
	var maxX = point.x+1;
	var minY = point.y;
	var maxY = point.y+1;
	var moveDistance = circlesInZone[0].r/4;

	while (moveDistance > 0.5) {

		var noMove = true;
		
		if(rectangleInZone(circlesInZone,circlesOutZone, minX-moveDistance,maxX,minY,maxY)) {
			noMove = false;
			minX = minX-moveDistance
		}
		if(rectangleInZone(circlesInZone,circlesOutZone, minX,maxX+moveDistance,minY,maxY)) {
			noMove = false;
			maxX = maxX+moveDistance
		}
		if(rectangleInZone(circlesInZone,circlesOutZone, minX,maxX,minY-moveDistance,maxY)) {
			noMove = false;
			minY = minY-moveDistance
		}
		if(rectangleInZone(circlesInZone,circlesOutZone, minX,maxX,minY,maxY+moveDistance)) {
			noMove = false;
			maxY = maxY+moveDistance
		}
		
		if(noMove) {
			moveDistance = moveDistance/2
		}
	}

	var ret = new Rectangle(minX, minY, maxX-minX, maxY-minY);
	return ret;
}



/**
  This finds a biggest contained rectangle for a zone, specified by
  the circles containing the zone and the circles that are outside the
  zone.
*/
function findZoneRectangle(circlesInZone,circlesOutZone) {

	var pointsInZone = findSufficientPointsInZone(circlesInZone,circlesOutZone);
	
	if(pointsInZone.length == 0) {
		return new Rectangle(0,0,0,0);
	}
	var biggestRectangle;
	var biggestArea = 0;
	for (var i = 0; i < pointsInZone.length; i++) {
		var rectangle = findRectangle(pointsInZone[i],circlesInZone,circlesOutZone);
		if(rectangle.width*rectangle.height > biggestArea) {
			biggestRectangle = rectangle;
			biggestArea = rectangle.width*rectangle.height;
		}
	}
	return biggestRectangle;
}


/**
  This finds a biggest contained rectangle for each zone. The rectangles
  are returned in array, in the same order as the zones. The zones are
  specified by an array of strings. The circles should be an array
  of all the circles in the diagram
*/
function findZoneRectangles(zoneStrings, circles) {

	var zones = zoneFinder(zoneStrings,circles);

	var rectangles = [];
	
	// iterate through the zones, finding the best rectangle for each zone
	for (var i = 0; i <  zones.length; i++) {
		var circlesInZone = zones[i];
		
		var circlesOutZone = getOutZones(circles, circlesInZone);
		var rectangle = findZoneRectangle(circlesInZone,circlesOutZone);

		for (var j = 0; j < circlesInZone.length; j++){
			rectangle.label = rectangle.label + "" + circlesInZone[j].label;
		}

		console.log(circlesInZone, circlesOutZone, rectangle);
		rectangles.push(rectangle);
	}
	return rectangles;
}


function parseFile(input, zones){
/*
	var txtFile = new XMLHttpRequest();

	txtFile.open("GET", "inter_node_data/data/inter_node_sum.txt", true);

	txtFile.onreadystatechange = function() {
		if (txtFile.readyState != 4) {
			window.status="Loading";
		} else {
			if (txtFile.status === 200) {

				var input = txtFile.responseText.split(".");
					
				console.log(input[0], times);	
				//for (var i = 0; i < input.length; i++){
				for (var i = 0; i < 5; i++){
					var timeInstance = input[i];

					var interactions = timeInstance.split(",\n");
					
					var timeInt = "";
					if (i == 0) {
						timeInt = parseInt(interactions[0].substring(1));
					} else {
						timeInt = parseInt(interactions[0].substring(2));
					}

					var time = new Time(timeInt);
					times.push(time);

					for (var j = 1; j < interactions.length; j++){
						var interactionDetails = interactions[j].split(",");

						var start = parseInt(interactionDetails[0].substring(8));
						var finish = parseInt(interactionDetails[1].substring(4));
						var count = parseInt(interactionDetails[2]);

						//console.log(time);

						time.interactions.push( new Interaction (start, finish, count));

						//console.log(start, finish, count);
					}

				}

				console.log(times);

			}
		}
	};
	txtFile.send(null);

	console.log(times);
*/
	
	//var url = "http://www.cs.kent.ac.uk/people/rpg/rb440/Release/runJava.php?input="+input;
	var url = "runJava.php?input="+input;
	
//var txtFile = ["label, cx, cy, radius,","c, 68.33333333333333, 72.59103641456582, 63.29113497213361,","b, 131.62446830546693, 72.59103641456582, 63.29113497213361,","a, 99.97890081940014, 127.40276713478325, 63.29113497213361,",""];
	
	//
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url, true);
	//txtFile.setRequestHeader("Access-Control-Allow-Origin","*");

	xhr.onload = function() {
				
		//decodeCsv(xhr.responseText.split("\n"));
		console.log(xhr.responseText);
		//console.log(circles,zones);
		//testRegion(zones);
	};
	xhr.send();
}


function decodeCsv(csv){
	//console.log(csv);
	//use 1 as first row of input are label
	for (var i = 1; i < csv.length-1; i++){
		var result = csv[i].split(",");
		var c = new Circle(result[0], parseInt(result[3]), parseInt(result[1]), parseInt(result[2]));
		circles.push(c);
		//console.log(circles);
	}
	
}

			
function testRegion(zones) {

	svg.append("g");
	for (var i = 0; i < circles.length; i++) {
		circle = circles[i];


		svg.select("g")
			.append("circle")
			.attr("r", function(){
				circle.r = circle.r * multiplier;
				return circle.r
			})
			.attr("cx",function(){
				circle.x = circle.x * multiplier;
				return circle.x
			})
			.attr("cy",function(){
				circle.y = circle.y * multiplier;
				return circle.y
			})
			.attr("class","euler")
			.attr("style","fill: none; stroke:blue;");



		svg.select("g")
			.append("text")
			.text(function(){
				return circle.label;
			})
			.attr("x", function(){
				return circle.x;
			})
			.attr("y", function(){
				return (circle.y - circle.r)+25 ;
			})
			.attr("width", 20)
			.attr("height", 20)
			.attr("style", "font-weight:bold; font-size:1.5em; font-family:sans-serif;");
		
		//console.log(circle);
	}
					
			
	var rectangles = findZoneRectangles(zones, circles);
					
	//context.fillStyle = "rgba(0, 255, 0, 0.5)";
	for (var i = 0; i < rectangles.length; i++) {
		//context.fillRect(rectangles[i].x * multiplier, rectangles[i].y * multiplier, rectangles[i].width * multiplier, rectangles[i].height * multiplier);

		svg.select("g")
			.append("rect")
			.attr("x", rectangles[i].x)
		    .attr("y", rectangles[i].y)
		    .attr("width", rectangles[i].width)
		    .attr("height", rectangles[i].height)
		    .attr("style", "fill: rgba(0, 255, 0, 0.5)");
	}

	rects = rectangles;
	//place nodes in random positions
	buildGraph(rectangles);

	console.log(nodes, edges);

	drawGraph(nodes, edges);

}

function buildGraph(rectangles){

	//############# ORIGINAL DATA SET ############# 
	var a = new Node("a",rectangles[0]);
	var b = new Node("b",rectangles[0]);
	var c = new Node("c",rectangles[0]);
	var d = new Node("d",rectangles[1]);
	var e = new Node("e",rectangles[1]);
	var f = new Node("f",rectangles[1]);
	var g = new Node("g",rectangles[1]);
	var h = new Node("h",rectangles[2]);
	var i = new Node("i",rectangles[2]);
	var j = new Node("j",rectangles[2]);
	var k = new Node("k",rectangles[3]);
	var l = new Node("l",rectangles[0]);

	nodes.push(a);
	nodes.push(b);
	nodes.push(c);
	nodes.push(d);
	nodes.push(e);
	nodes.push(f);
	nodes.push(g);
	nodes.push(h);
	nodes.push(i);
	nodes.push(j);
	nodes.push(k);
	nodes.push(l);

	//console.log(times[0]);

	edges.push(new Edge(a,b,1));
	edges.push(new Edge(b,c,12));
	edges.push(new Edge(a,c,3));
	edges.push(new Edge(a,d,14));
	edges.push(new Edge(d,b,5));
	edges.push(new Edge(d,e,16));
	edges.push(new Edge(d,f,8));
	edges.push(new Edge(e,f,9));
	edges.push(new Edge(g,d,25));
	edges.push(new Edge(g,e,3));
	edges.push(new Edge(g,f,17));
	edges.push(new Edge(h,i,11));
	edges.push(new Edge(a,h,22));
	edges.push(new Edge(i,j,24));
	edges.push(new Edge(k,e,2));
	edges.push(new Edge(j,k,12));
	edges.push(new Edge(i,d,10));
	edges.push(new Edge(a,k,23));
	edges.push(new Edge(a,l,4));

/*				

	var a = new Node("a",rectangles[1]);
	var b = new Node("b",rectangles[0]);
	var c = new Node("c",rectangles[0]);
	var d = new Node("d",rectangles[4]);
	var e = new Node("e",rectangles[4]);
	var f = new Node("f",rectangles[3]);
	var g = new Node("g",rectangles[4]);
	var h = new Node("h",rectangles[2]);
	var i = new Node("i",rectangles[3]);
	var j = new Node("j",rectangles[4]);
	var k = new Node("k",rectangles[3]);
	var l = new Node("l",rectangles[0]);

	nodes.push(a);
	nodes.push(b);
	nodes.push(c);
	nodes.push(d);
	nodes.push(e);
	nodes.push(f);
	nodes.push(g);
	nodes.push(h);
	nodes.push(i);
	nodes.push(j);
	nodes.push(k);
	nodes.push(l);

	edges.push(new Edge(a,b,10));
	edges.push(new Edge(a,c,8));
	edges.push(new Edge(a,d,8));
	edges.push(new Edge(a,e,9));
	edges.push(new Edge(a,f,8));
	edges.push(new Edge(a,g,8));
	edges.push(new Edge(a,h,8));
	edges.push(new Edge(a,i,8));
	edges.push(new Edge(a,j,8));
	edges.push(new Edge(a,k,24));
	edges.push(new Edge(a,l,14));

	edges.push(new Edge(b,c,1));
	edges.push(new Edge(b,l,1));
	edges.push(new Edge(b,d,1));
	edges.push(new Edge(b,g,1));

	edges.push(new Edge(d,e,1));

	edges.push(new Edge(e,f,1));
	edges.push(new Edge(e,g,1));

	edges.push(new Edge(f,g,1));
	edges.push(new Edge(f,i,2));
	edges.push(new Edge(f,j,1));

	edges.push(new Edge(g,j,1));

	edges.push(new Edge(j,k,1));
	*/

}

function rebuildGraph(){

	edges = [];

	edges.push(new Edge(nodes[10],nodes[1],1));
	edges.push(new Edge(nodes[11],nodes[1],8));
	edges.push(new Edge(nodes[9],nodes[9],2));
	edges.push(new Edge(nodes[9],nodes[10],2));
	edges.push(new Edge(nodes[10],nodes[3],3));
	edges.push(new Edge(nodes[11],nodes[3],2));
	edges.push(new Edge(nodes[9],nodes[3],4));
	edges.push(new Edge(nodes[1],nodes[3],1));
	edges.push(new Edge(nodes[2],nodes[3],8));
	edges.push(new Edge(nodes[4],nodes[4],2));
	edges.push(new Edge(nodes[11],nodes[2],4));
	edges.push(new Edge(nodes[9],nodes[11],4));
	edges.push(new Edge(nodes[3],nodes[3],3));
	edges.push(new Edge(nodes[1],nodes[2],7));
	edges.push(new Edge(nodes[9],nodes[1],10));
	//edges.push(new Edge(nodes[10],nodes[2],4));
	edges.push(new Edge(nodes[2],nodes[2],8));
	edges.push(new Edge(nodes[0],nodes[9],4));
	edges.push(new Edge(nodes[0],nodes[2],8));
	edges.push(new Edge(nodes[0],nodes[11],3));
	//edges.push(new Edge(nodes[10],nodes[11],2));
	edges.push(new Edge(nodes[11],nodes[11],1));
	edges.push(new Edge(nodes[10],nodes[8],1));
	edges.push(new Edge(nodes[0],nodes[8],7));
	edges.push(new Edge(nodes[3],nodes[8],5));
	edges.push(new Edge(nodes[11],nodes[8],2));
	edges.push(new Edge(nodes[9],nodes[6],5));
	edges.push(new Edge(nodes[9],nodes[5],7));
	edges.push(new Edge(nodes[3],nodes[5],5));
	edges.push(new Edge(nodes[5],nodes[6],10));
	//edges.push(new Edge(nodes[10],nodes[5],5));
	edges.push(new Edge(nodes[9],nodes[4],2));
	edges.push(new Edge(nodes[8],nodes[8],5));
	edges.push(new Edge(nodes[1],nodes[5],3));
	edges.push(new Edge(nodes[5],nodes[5],3));
	//edges.push(new Edge(nodes[10],nodes[4],1));
	edges.push(new Edge(nodes[3],nodes[4],6));
	edges.push(new Edge(nodes[4],nodes[5],6));
	edges.push(new Edge(nodes[2],nodes[4],4));
	edges.push(new Edge(nodes[0],nodes[10],2));
	edges.push(new Edge(nodes[2],nodes[8],8));
	edges.push(new Edge(nodes[9],nodes[8],4));
	edges.push(new Edge(nodes[1],nodes[6],10));
	edges.push(new Edge(nodes[2],nodes[5],7));
	edges.push(new Edge(nodes[7],nodes[7],3));
	edges.push(new Edge(nodes[0],nodes[4],6));
	edges.push(new Edge(nodes[0],nodes[5],5));/*
	edges.push(new Edge(nodes[0],nodes[0],3));
	edges.push(new Edge(nodes[0],nodes[7],5));
	edges.push(new Edge(nodes[0],nodes[3],7));
	edges.push(new Edge(nodes[3],nodes[6],4));
	edges.push(new Edge(nodes[11],nodes[6],5));
	edges.push(new Edge(nodes[10],nodes[6],1));
	edges.push(new Edge(nodes[6],nodes[6],1));
	edges.push(new Edge(nodes[4],nodes[6],7));
	edges.push(new Edge(nodes[5],nodes[8],5));
	edges.push(new Edge(nodes[6],nodes[8],9));
	edges.push(new Edge(nodes[1],nodes[8],1));
	edges.push(new Edge(nodes[0],nodes[6],1));
	edges.push(new Edge(nodes[1],nodes[4],9));
	edges.push(new Edge(nodes[1],nodes[1],9));
	edges.push(new Edge(nodes[0],nodes[1],2));
	edges.push(new Edge(nodes[11],nodes[4],1));
	edges.push(new Edge(nodes[4],nodes[8],2));
	edges.push(new Edge(nodes[2],nodes[6],3));
	edges.push(new Edge(nodes[9],nodes[2],5));*/

	d3.selectAll("line").remove();

	svg.selectAll("line")
		.data(edges)
		.enter()
		.append("line")
		.attr("x1", function(d){
			console.log(d);
			return d3.select("#node"+d.source.label).attr("cx");
		})
		.attr("y1", function(d){
			return d3.select("#node"+d.source.label).attr("cy");
		})
		.attr("x2", function(d){
			return d3.select("#node"+d.target.label).attr("cx");
		})
		.attr("y2", function(d){
			return d3.select("#node"+d.target.label).attr("cy");
		})
		.style("stroke", function (d){
			console.log(d.size);
			var size = Math.max(200-(d.size * 10),0);
			return "rgb(" + size + "," + size + "," + size + ")";
		})
		.style("stroke-width", 2)
		.attr("id", function(d){
			return "edge" + d.source.label + d.target.label;
		});

}

function circleForceHorizontal(node){
	//console.log(node);
	var force = 0;
	var k = 1000; //multiplier

	//this node's co-ordinates
	var px = node.x;
	var py = node.y;

	for(i = 0; i < circles.length; i++){
		var circle = circles[i];
		var cx = circle.x;
		var cy = circle.y;
		var r = circle.r;

		var v = Math.sqrt(  Math.pow((px - cx),2) +  Math.pow((py - cy),2) );

		var inside = v < (r * multiplier);


		//var distance = inside ? px - (cx + r) : px + (cx - r);



		var distance = Math.abs(px - (px / (v * r) ));

		//console.log(circle,distance,circle.label,node.label);
		var localForce = k / distance;
		force += localForce;
		//console.log("node"+node.label,circle.label,distance, localForce, inside, "v", v, "r", r);
		//console.log(circle,"force",force,"cx",cx,"cy",cy,"r",r,"px",px,"py",py,"v",v,"d",distance);

	}
	//console.log(force);
	return force;

}

function getAngle(n1, n2){
	//console.log(n1,n2);
	var x = n1.x - n2.x;
	var y = n1.y - n1.y;
	var angle;
	//to avoid the ambiguities with the arctan at 0 & 180 deg and the undefined result at 90 & 270
	if ((x == 0) && (y != 0)) {
		if (n1.y > n2.y){
			angle = Math.PI / 2; //90deg
		} else {
			angle = ((-1) * Math.PI) / 2; //-90deg
		}
	} else if((x != 0) && (y == 0)){
		if (n1.x > n2.x){
			angle = Math.PI; //180deg
		} else {
			angle = 0; //0deg
		}
	} else {
		angle = Math.atan(y/x);
	}
	return angle;
}

function cool(t){
	return t/2;
}

function forceAttract(x, k){
	return (x * x)/k;
}

function forceRepel(x, k){
	//console.log(x, k);
	return (k * k)/x;
}

function nodesConnect(n1,n2) {
	for (var i = 0; i < edges.length; i++){
		e = edges[i];
		
		if(n1 == e.source && n2 == e.target) {
			return true;
		}
		if(n1 == e.target && n2 == e.source) {
			return true;
		}
	}
	return false;
}

function nodesInRegion(region){
	var result = [];
	for (var i = 0; i < nodes.length; i++){
		if (nodes[i].region == region){
			result.push(nodes[i]);
		}
	}
	return result;
}


function drawGraph(nodes, edges){
	//console.log(edges);

	k = c * Math.sqrt(800 / nodes.length);
	//console.log(k,c, nodes.length);

	

	svg.selectAll("circle")
		.data(nodes, function(d){
			return d;
		})
		.enter()
		.append("circle")
		.attr("r",5)
		.attr("cx",function (d,i){
			
			var cols = Math.round(Math.sqrt(nodesInRegion(d.region).length));

			console.log(cols, d.label);
			//console.log((i % cols)+1, i, cols, nodes.length, d.region.width, (d.region.width / (cols + 1)));
			var cx = ( ((i % cols)+1) * (d.region.width / (cols + 1)) ) + d.region.x;
			 //var cx = (Math.random() * d.region.width) + d.region.x;
			d.x = cx;
			//console.log("x", d);
			return parseInt(cx);

			//return d.region.width * multiplier;
			//return 10;
		})
		.attr("cy",function (d){
			//console.log("y", d.region.y * multiplier);
			//d.y = d.region.y;

			var cols = Math.round(Math.sqrt(nodesInRegion(d.region).length));

			//var cy = d.region.y + ((Math.floor(i / cols)+1) * (d.region.height / (cols + 1)));
			//console.log(cy, d.region.height, d.region.y, Math.floor(i / cols)+1 , (d.region.height / (cols + 1)));

			var i = nodesInRegion(d.region).indexOf(d);

			/*
			console.log(
				d.region.y,
				"i", i,
				"cols", cols,
				i % cols,
				(Math.floor(i / cols)+1),
				(d.region.height / (cols + 1)),
				((Math.floor(i % cols)+1) * (d.region.height / (cols + 1)))
			);
*/
			var cy = ((Math.floor(i / cols)+1) * (d.region.height / (cols + 1))) + d.region.y

			//var cy = (Math.random() * d.region.height) + d.region.y;
			//var cy = d.region.y + 50;
			d.y = cy;
			return parseInt(cy);
			//return 10;
		})
		.attr("id", function(d){
			return "node" + d.label;
		})
		.attr("class","node")
		.style("fill", "blue");

	svg.selectAll("line")
		.data(edges)
		.enter()
		.append("line")
		.attr("x1", function(d){
			console.log(d);
			return d3.select("#node"+d.source.label).attr("cx");
		})
		.attr("y1", function(d){
			return d3.select("#node"+d.source.label).attr("cy");
		})
		.attr("x2", function(d){
			return d3.select("#node"+d.target.label).attr("cx");
		})
		.attr("y2", function(d){
			return d3.select("#node"+d.target.label).attr("cy");
		})
		.style("stroke", function (d){
			//console.log(d.size);
			var size = Math.max(200-(d.size * 10),0);
			return "rgb(" + size + "," + size + "," + size + ")";
		})
		.style("stroke-width", 2)
		.attr("id", function(d){
			return "edge" + d.source.label + d.target.label;
		});

	var m = 0;
//nodes[0].x = 340;
//nodes[0].y = 500;

//nodes[0].x = 230;
//nodes[0].y = 395;

//nodes[0].x = 380;
//nodes[0].y = 200;

//nodes[0].x = 420;
//nodes[0].y = 400;

//nodes[0].x = 220;
//nodes[0].y = 420;


/*
nodes[1].x = 200;
nodes[1].y = 100;

nodes[0].x = 100;
nodes[0].y = 100;
nodes[1].x = 300;
nodes[1].y = 200;

nodes[0].x = 300;
nodes[0].y = 100;
nodes[1].x = 100;
nodes[1].y = 200;

nodes[0].x = 100;
nodes[0].y = 100;
nodes[1].x = 200;
nodes[1].y = 100;
*/
/*
	var interval = setInterval(function() {
				m++;
				if (m > 500){
					window.clearInterval(interval);
				}
				//console.log(m);
				iterateGraph(nodes,edges);
			}
		,10);*/

}

/*
function video(){
	d3.selectAll("rect").remove()
	var m = 0;
	var interval = setInterval(function() {
				m++;
				if (m > 200){
					window.clearInterval(interval);
				}
				//console.log(m);
				iterateGraph(nodes,edges);
			}
		,10);
	console.log("done");

}*/

function animate(steps){
	for (var i = 0; i < steps; i++){
		next();
	}
}

function next(){
	//console.log(nodes, edges);
	iterateGraph(nodes,edges);
} 


function iterateGraph(nodes, edges){

	var K = 0.01; // attractive force multiplier
	var R = 500.0; // repulsive force mutiplier
	var C = 500.0; // circle force multiplier
	var F = 1.0; // final movement multiplier
	var maxForce = 10 // force limit in horizontal or vertical

	for(var i = 0; i < nodes.length; i++){
		var n1 = nodes[i];
	
		var xAttractive = 0;
		var yAttractive = 0;
		var xRepulsive = 0;
		var yRepulsive = 0;
		var xCircleForce = 0;
		var yCircleForce = 0;

		for(var j = 0; j < nodes.length; j++){
			if(i != j) {
				var n2 = nodes[j];

				var distance = Math.sqrt( Math.pow(n1.x - n2.x, 2) + Math.pow(n1.y - n2.y, 2) );
				var xDistance = n1.x - n2.x;
				var yDistance = n1.y - n2.y;
				
				var absDistance = distance;
				var absXDistance = xDistance;
				if(absXDistance < 0) {
					absXDistance = -xDistance;
				}
				var absYDistance = yDistance;
				if(absYDistance < 0) {
					absYDistance = -yDistance;
				}

				var xForceShare = absXDistance/(absXDistance+absYDistance);
				var yForceShare = absYDistance/(absXDistance+absYDistance);

				// attractive force
				if (nodesConnect(n1,n2)) {

					if(xDistance > 0) {
						xAttractive -= K*xForceShare*absDistance;
					} else {
						xAttractive += K*xForceShare*absDistance;
					}

					if(yDistance > 0) {
						yAttractive -= K*yForceShare*absDistance;
					} else {
						yAttractive += K*yForceShare*absDistance;
					}
				}


				// repulsive force
				var repulsiveForce = R / (distance * distance);

				if(xDistance > 0) {
					xRepulsive += repulsiveForce*xForceShare;
				} else {
					xRepulsive -= repulsiveForce*xForceShare;
				}

				if(yDistance > 0) {
					yRepulsive += repulsiveForce*yForceShare;
				} else {
					yRepulsive -= repulsiveForce*yForceShare;
				}
			}
			
			// circle - node force
			for (var k = 0; k < circles.length; k++){
//var k = 0;
				var circle = circles[k];
				var distanceToCentre = Math.sqrt( Math.pow(n1.x - circle.x, 2) + Math.pow(n1.y - circle.y, 2) );
				
				var xDistance = n1.x - circle.x;
				var yDistance = n1.y - circle.y;
				
				var absXDistance = xDistance;
				if(absXDistance < 0) {
					absXDistance = -xDistance;
				}
				var absYDistance = yDistance;
				if(absYDistance < 0) {
					absYDistance = -yDistance;
				}
				
				var distanceToCircleBorder = distanceToCentre;
				if(distanceToCircleBorder < circle.r) {
					distanceToCircleBorder = circle.r - distanceToCircleBorder;
				} else {
					distanceToCircleBorder = distanceToCircleBorder - circle.r;
				}



				var xForceShare = absXDistance/(absXDistance+absYDistance);
				var yForceShare = absYDistance/(absXDistance+absYDistance);


				var circleForce = C / (distanceToCircleBorder * distanceToCircleBorder);

				var	thisAbsXCircleForce = circleForce*xForceShare;
				if(thisAbsXCircleForce < 0) {
					thisAbsXCircleForce = -thisAbsXCircleForce;
				}
				
				var	thisAbsYCircleForce = circleForce*yForceShare;
				if(thisAbsYCircleForce < 0) {
					thisAbsYCircleForce = -thisAbsYCircleForce;
				}
				
				// sort out movement direction
				var inside = true;
				if(distanceToCentre > circle.r) {
					inside = false;
				}
				var above = true;
				if(n1.y > circle.y) {
					above = false;
				}
				var left = true;
				if(n1.x > circle.x) {
					left = false;
				}
				
		
				var thisXCircleForce = 0;
				var thisYCircleForce = 0;
				
				// assume inside in these tests
				if(left) {
					thisXCircleForce = thisAbsXCircleForce
				} else {
					thisXCircleForce = -thisAbsXCircleForce
				}
				if(above) {
					thisYCircleForce = thisAbsYCircleForce
				} else {
					thisYCircleForce = -thisAbsYCircleForce
				}
				// reverse the direction if outside
				if(!inside) {
					thisXCircleForce = -thisXCircleForce;
					thisYCircleForce = -thisYCircleForce;
				}							
				
				xCircleForce += thisXCircleForce;
				yCircleForce += thisYCircleForce;

			}
		}
		
		var totalXForce = F*(xRepulsive + xAttractive + xCircleForce);
		var totalYForce = F*(yRepulsive + yAttractive + yCircleForce);

		// chop the force if it is too large
		if(totalXForce > 0) {
			if(totalXForce > maxForce) {
				totalXForce = maxForce;
			}
		} else {
			if(-totalXForce > maxForce) {
				totalXForce = -maxForce;
			}
		}
		if(totalYForce > 0) {
			if(totalYForce > maxForce) {
				totalYForce = maxForce;
			}
		} else {
			if(-totalYForce > maxForce) {
				totalYForce = -maxForce;
			}
		}

		n1.horizontal = totalXForce;
		n1.vertical = totalYForce;
		
	}

					//move nodes around
	for (var i = 0; i < nodes.length; i++){
		var n = nodes[i];

		//console.log(n.label, n.x, n.horizontal, n.y, n.vertical, t);
		var ox, oy;

		d3.select("#node"+n.label)
			.attr("cx", function(){
				
				//if node has moved to a different circle
//							if (insideCircles(n).length == 0){
					n.x = n.x + n.horizontal;
//							}

				ox = parseInt(n.x);
			
				return ox;
			})
			.attr("cy", function(){

				//if node has moved to a different circle
				if (insideCircles(n).length == 0){
					n.y = n.y + n.vertical;
				}							
				
				oy = parseInt(n.y);
				
				return oy;
			})

	}

	
	//move edges around
	for (var i = 0; i < edges.length; i++){
		e = edges[i];
		d3.select("#edge"+e.source.label+e.target.label)
			.attr("x1", function(){
				return d3.select("#node"+e.source.label).attr("cx");
			})
			.attr("y1", function(){
				return d3.select("#node"+e.source.label).attr("cy");
			})
			.attr("x2", function(){
				return d3.select("#node"+e.target.label).attr("cx");
			})
			.attr("y2", function(){
				return d3.select("#node"+e.target.label).attr("cy");
			});
	}

}

	
/**
	var force = d3.layout.force()
		.nodes(nodes)
		.links(edges)
		.size([800,500])
		.start();

	var nodes = svg.selectAll("circle")
		.data(nodes, function(d){
			return d;
		})
		.enter()
		.append("circle")
		.attr("r", 5)
		.attr("cx",function (d,i){
			//console.log("x", d);

			return ((Math.random() * d.region.width) + d.region.x) * multiplier;

			//return d.region.width * multiplier;
			//return 10;
		})
		.attr("cy",function (d,i){
			//console.log("y", d.region.y * multiplier);
			//d.y = d.region.y;
			return ((Math.random() * d.region.height) + d.region.y) * multiplier;
			//return 10;
		})
		.attr("id", function(d){
			return "node" + d.label;
		})
		.style("fill", "blue")
		.call(force.drag);

	

	force.linkDistance(20);

	force.on("tick", function(){
		edges.attr("x1", function(d) { return d.source.x; })
			.attr("y1", function(d) { return d.source.y; })
			.attr("x2", function(d) { return d.target.x; })
			.attr("y2", function(d) { return d.target.y; });
		nodes.attr("cx", function(d) {
				//console.log(d);
				
				//force.alpha(0);
				return d.x + circleForceHorizontal(d); 
			})
			.attr("cy", function(d) { return d.y; });
		force.alpha(0);
	});
*/


function main(input, zones){

	 // #### ORIGINAL DATASET
	//var zones = "a ab ac bc".split(" ");
	//var input = "a b c ab ac bc abc";
	

	//var zones = "a ab bc bd d".split(" ");
	//var input = "a b c ab ac bc abc d da db dab";

	svg = d3.select("#main").append("svg")
	    .attr("width", 800)
	    .attr("height", 600)
	    .attr("version", 1.1)
	    .attr("xmlns", "http://www.w3.org/2000/svg");

	parseFile(input, zones);
}

var sGroups;
var sGroupsRead = false;
function readSGroup(){
	//console.log("reading s group");
	readFile("sGroup");
}

var nodesRead = false;
function readNodes(){
	//console.log("reading s group");
	readFile("nodes");
}


function readFile(fileType){
	var uploadName = "#"+fileType+"Upload";
	var feedbackName = "#"+fileType+"Feedback";

	var file = $(uploadName)[0].files[0];
	//var output;

	var read=new FileReader();
	read.readAsText(file);

	read.onerror=function(){
		$(feedbackName).html("An error has occurred");
	}

	read.onprogress=function(evt){
		//console.log(evt.loaded, evt.total);
		var percent = parseInt((evt.loaded / evt.total)*100);

		$(feedbackName).html("Loading: "+percent+"% complete");
	}

	read.onloadend=function(){

		$(feedbackName).html("Upload Complete");
		//console.log(output);
		var output = read.result;
		console.log(output);

		if (fileType == "sGroup"){
			sGroupsRead = true;
			sGroups = output;
		} else if (fileType == "nodes"){
			nodesRead = true;
			parseNodes(output);
		}
		
	}
}

function parseNodes(nodesFile) {
	var nodesArr = nodesFile.split("\n");
	for (var i = 0; i < nodesArr.length; i++){
		var thisLine = nodesArr[i].split(" ");
		var nodeLabel = thisLine[0];
	}

}

/*
Finds a circle given a label
 */
function findCircle(label){
	for (var i = 0; i < circles.length; i++){
		if (label == circles[i].label){
			return circles[i];
		}
	}
}

/*
	Returns an array of circles this node is outside of that it shouldn't be
 */
function insideCircles(node){
	var strCircles = node.region.label;
	var result = [];
	//console.log(circles);

	for (var i = 0; i < circles.length; i++){
		var circle = circles[i];
		var distance = Math.sqrt( Math.pow(node.x - circle.x, 2) + Math.pow(node.y - circle.y, 2) );
		//does this node's region contain this circle
		if (strCircles.indexOf(circle.label) != -1) {
			//check node is inside
			
			//console.log(strCircles, label, circle, node, distance);
			if (distance >= circle.r){
				result.push(circle);
			}
		} else {
			//check if node is outside
			if (distance <= circle.r){
				result.push(circle);
			}

		}
	}

/*
	for (var i  = 0; i < strCircles.length; i++){
		var label = strCircles[i];
		var circle = findCircle(label);

		var distance = Math.sqrt( Math.pow(node.x - circle.x, 2) + Math.pow(node.y - circle.y, 2) );

		//console.log(strCircles, label, circle, node, distance);
		if (distance > circle.r){
			result.push(circle);
		}
	}
*/				return result;
}
	