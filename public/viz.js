// get the data
//d3.csv("data.csv", function(error, links) {
d3.json("data.json", function(error, links) {
if (error) return console.warn(error);
var nodes = {};

// Compute the distinct nodes from the links.
links = links.relationships
links.forEach(function(link) {
    link.source = nodes[link.source] || (nodes[link.source] = {name: link.source});
    link.target = nodes[link.target] || (nodes[link.target] = {name: link.target});
    link.value = link.value;
    link.rel = link.rel;
    
});


//console.table(nodes)
var width = 1200,
    height = 800;

var force = d3.layout.force()
    .nodes(d3.values(nodes))
    .links(links)
    .size([width, height])
    .linkDistance(100)
    .linkStrength(function(l, i) {return 1; })
    .gravity(0.05)
    .charge(-500)
    .friction(0.75)
    .on("tick", tick)
    .start();

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

// build the arrow.
svg.append("svg:defs").selectAll("marker")
    .data(["end"])      // Different link/path types can be defined here
  .enter()
  .append("svg:marker")    // This section adds in the arrows
    .attr("id", "marker-end--depends")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 17)
    .attr("refY", 0)
    .attr("markerWidth", 8)
    .attr("markerHeight", 8)
    .attr("orient", "auto")
    .append("svg:path")
    .attr("class", "marker-end--depends")
    .attr("d", "M0,-5L10,0L0,5");

  svg.append("svg:defs").selectAll("marker")
    .data(["end"])      // Different link/path types can be defined here
  .enter().append("svg:marker")    // This section adds in the arrows
    .attr("id", "marker-end--critical")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 17)
    .attr("refY", 0)
    .attr("markerWidth", 8)
    .attr("markerHeight", 8)
    .attr("orient", "auto")  
  .append("svg:path")
    .attr("class", "marker-end--critical")
    .attr("d", "M0,-5L10,0L0,5");

// add the links and the arrows
var path = svg.append("svg:g").selectAll("path")
    .data(force.links())
  .enter().append("svg:path")
    .attr("class", function(d) { return "link link--" + d.rel; })
    //.attr("class", "link")
    .attr("marker-end", function(d) { return "url(#marker-end--" + d.rel; });

// define the nodes
var node = svg.selectAll(".node")
    .data(force.nodes())
  .enter().append("g")
    .attr("class", "node")
    .call(force.drag);

// add the nodes
node.append("circle")
    .attr("r", function(d) { return 10 });

// add the text 
node.append("text")
    .attr("x", 20)
    .attr("dy", ".35em")
    .text(function(d) { return d.name; });



// add the curvy lines
function tick() {
    path.attr("d", function(d) {
        var dx = d.target.x - d.source.x,
            dy = d.target.y - d.source.y,
            dr = 0;//Math.sqrt(dx * dx + dy * dy);
        return "M" + 
            d.source.x + "," + 
            d.source.y + "A" + 
            dr + "," + dr + " 0 0,1 " + 
            d.target.x + "," + 
            d.target.y;
    });

    node
        .attr("transform", function(d) { 
  	    return "translate(" + d.x + "," + d.y + ")"; });
    }
    // soft-center the root node
        var k = 1;
        var nodes = force.nodes();
        nodes[0].y += (height/2 - nodes[0].y) * k;
        nodes[0].x += (width/2 - nodes[0].x) * k;
});