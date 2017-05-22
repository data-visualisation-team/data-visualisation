var nodes = [
    {"id": "1", "label": "Section 1", "level": "1"},    
    {"id": "2", "label": "Section 2", "level": "1"},
    
    {"id": "3", "label": "Department 2", "level": "2"},
    {"id": "4", "label": "Department 3", "level": "2"},
    {"id": "5", "label": "Department 4", "level": "2"},
    {"id": "6", "label": "Department 6", "level": "2"},
    {"id": "7", "label": "Department 5", "level": "2"},
    {"id": "8", "label": "Department 1", "level": "2"},
   
]

for(i=9;i<150;i++){
    nodes.push({"id": '' + i + '', "label": "Project " + (i - 8), "level": "3"})  
}


var links = [
    {"source": 0, "target": 2, "rel": "depends"},
    {"source": 0, "target": 3, "rel": "depends"},
    {"source": 0, "target": 4, "rel": "depends"},
    {"source": 0, "target": 5, "rel": "depends"},
    
    {"source": 1, "target": 6, "rel": "depends"},
    {"source": 1, "target": 7, "rel": "depends"},

    {"source": 3, "target": 8, "rel": "depends"},
    {"source": 6, "target": 8, "rel": "depends"},
    
]

for(n=8;n<149;n++){
   links.push({"source": (getRand(2,7)), "target": n, "rel": "depends"})
}

links = links.filter((link, index, self) => self.findIndex((t) => {return t.source === link.source && t.target === link.target; }) === index)


// console.table(nodes)
// console.table(links)


// =========================================================
// =========================================================


var min_zoom = 0.1;
var max_zoom = 7;
var zoom = d3.behavior.zoom().scaleExtent([min_zoom,max_zoom])
var nominal_stroke = 1.5;
var nominal_base_node_size = 8;
var nominal_text_size = 10;
var max_text_size = 24;
var max_stroke = 4.5;
var max_base_node_size = 36;








function showData(n){
    var r = [];
    
    // this node
    r.push({n});
    
    // get immediate parents
    r[0].parents = links.filter(function(link){
        return link.target == n
    })            

    // get immediate children
    r[0].children = links.filter(function(link){
        return link.source == n
    })
    updateFilter(r[0]);
    console.table(r)
    console.table(r.parents)
    console.table(r.children)
}


function updateFilter(r){
    
    
    $('#filter').html("").removeClass("open");
    
    if(r == undefined) return
    
    //console.log(r)
    
    var t = '<h1>' + r.n.label + '</h1>'
    if(r.parents.length > 0){
        t = t + '<h2>Supported by</h2>'
        t = t + '<ul>' 
        r.parents.forEach(function(p){            
            t = t + '<li><a class="filter__link" href="" data-node="' + p.source.index + '">' + p.source.label + '</a></li>';
        })
        t = t + '</ul>'
    }
    if(r.children.length > 0){
        t = t + '<h2>Supports</h2>'
        t = t + '<ul>' 
        r.children.forEach(function(c){
            console.log(c);
            t = t + '<li><a class="filter__link" href="" data-node="' + c.target.index + '">' + c.target.label + '</a></li>';
        })
        t = t + '</ul>'
    }
    
    $('#filter').html(t).addClass("open");
}


var textLvl1X = 22;
var nodeLvl1R = 20;
var textLvl2X = 12;
var nodeLvl2R = 12;
var textLvl3X = 8;
var nodeLvl3R = 11;


var width = 1200,
    height = 800;
var w = window.innerWidth;
var h = window.innerHeight;    
var size = d3.scale.pow().exponent(1)
  .domain([1,100])
  .range([8,24]);
var force = d3.layout.force()
    .nodes(nodes)
    .links(links)
    .size([width, height])
    .linkDistance(100)
    .linkStrength(function(l, i) {return 1; })
    .gravity(0.05)
    //.charge(function(node) {
    //   return node.graph === 0 ? -30 : -300;
    //})
    .charge(-300)
    .friction(0.75)
    .on("tick", tick)
    .start();
// var hasCachedLayout = false;
// var optionsChanged = true;
// var minorOptionsChanged = true;
// var iters = 600; // You can get decent results from 300 if you are pressed for time
// var thresh = 0.001;
// //if(!hasCachedLayout || optionsChanged || minorOptionsChanged) {
//     force.start(); // Defaults to alpha = 0.1
//     if(hasCachedLayout) {
//         force.alpha(optionsChanged ? 0.1 : 0.01);
//     }
//     for (var i = iters; i > 0; --i) {
//         force.tick();
//         if(force.alpha() < thresh) {
//             console.log("Reached " + force.alpha() + " for " + nodes.length + " node chart after " + (iters - i) + " ticks.");
//             break;
//         }
//     }
//     force.stop();
// //}



d3.select(window).on("resize", resize);



var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);
var rootg = svg.append("g").attr('id', 'root').attr("transform", "translate(0,0) scale(1)");

// build the arrow.
svg.append("svg:defs").selectAll("marker")
    .data(["end"]) 
    .enter()
    .append("svg:marker")
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
    .data(["end"]) 
    .enter()
    .append("svg:marker")
    .attr("id", "marker-end--depends--dimmed")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 17)
    .attr("refY", 0)
    .attr("markerWidth", 8)
    .attr("markerHeight", 8)
    .attr("orient", "auto")
    .append("svg:path")
    .attr("class", "marker-end--depends--dimmed")
    .attr("d", "M0,-5L10,0L0,5");    

svg.append("svg:defs").selectAll("marker")
    .data(["end"])      
    .enter().append("svg:marker")
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

svg.append("svg:defs").selectAll("marker")
    .data(["end"])      
    .enter().append("svg:marker")
    .attr("id", "marker-end--critical--dimmed")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 17)
    .attr("refY", 0)
    .attr("markerWidth", 8)
    .attr("markerHeight", 8)
    .attr("orient", "auto")  
    .append("svg:path")
    .attr("class", "marker-end--critical--dimmed")
    .attr("d", "M0,-5L10,0L0,5");    

svg.append('svg:defs').selectAll("filter").data(["end"]).enter().append("svg:filter")
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', 1)
    .attr('height', 1)
    .attr('id', 'lvl1')
    .append('svg:feFlood')
    .attr('flood-color', 'hsl(39, 100%, 50%)')
    svg.selectAll('filter')
    .append('svg:feComposite')
    .attr('in','SourceGraphic');

svg.append('svg:defs').selectAll("filter").data(["end"]).enter().append("svg:filter")
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', 1)
    .attr('height', 1)
    .attr('id', 'lvl2')
    .append('svg:feFlood')
    .attr('flood-color', 'hsl(240, 100%, 50%)')
    svg.selectAll('filter')
    .append('svg:feComposite')
    .attr('in','SourceGraphic');    

svg.append('svg:defs').selectAll("filter").data(["end"]).enter().append("svg:filter")
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', 1)
    .attr('height', 1)
    .attr('id', 'lvl3')
    .append('svg:feFlood')
    .attr('flood-color', 'hsl(350, 100%, 88%)')
    svg.selectAll('filter')
    .append('svg:feComposite')
    .attr('in','SourceGraphic');  

// add the links and the arrows
var path = rootg.append("svg:g").selectAll("path")
    .data(force.links())
  .enter().append("svg:path")
    .attr("class", function(d) { return "link link--" + d.rel; })
    .attr("data-from", function(d) {return d.source.id})
    .attr("data-to", function(d) {return d.target.id})
    .attr("marker-end", function(d) { return "url(#marker-end--" + d.rel + ")"; });

// define the nodes
var node = rootg.selectAll(".node")
    .data(force.nodes())
  .enter().append("g")
    .attr("class", "node")
    .attr("id", function(d){ return d.id })
    .attr("data-label", function(d){ return d.label; })
    .call(force.drag);

// add the nodes
node.append("circle")
    .attr("r", function(d) { return (20 / d.level) })
    //.attr("r", function(d) { return (5) })
    .attr("class", function(d) { return "level--" + d.level });
// add the text 
    var paddingLeftRight = 18; // adjust the padding values depending on font and font size
    var paddingTopBottom = 5;
    node.append("rect")
    node.append("text")
    .attr('id', function(d) { return "text--" + (d.index);})
    //.attr('filter', function(d) { return 'url(#lvl' + d.level + ')'})
    .attr("x", function(d) { 
        var xPos;
        switch (parseInt(d.level)){
            case 1:
             xPos = textLvl1X;
            break;
            case 2:
             xPos = textLvl2X;
            break;
            case 3:
             xPos = textLvl3X;
            break;
            default:
             xPos = 10;            
            break;
        }
        return xPos + (paddingLeftRight/2);
    })
    .attr("dy", 5 + (paddingTopBottom/2))
    .attr("class", function(d){ return "text--lvl" + d.level})
    .text(function(d) { return d.label; });
    svg.selectAll("text").each(function(d, i) {
        d.bb = this.getBBox(); // get bounding box of text field and store it in texts array        
    }); 
    node.selectAll("text")
        .attr("dy", function(d){return (d.bb.y/2) + (paddingTopBottom/2)})

    svg.selectAll("text").each(function(d, i) {
        d.bb = this.getBBox(); // get bounding box of text field and store it in texts array        
    }); 
    node.selectAll("rect")
        .attr("x", function(d) { return d.bb.x - (paddingLeftRight/2);})
        .attr("y", function(d) { return (d.bb.y) - (paddingTopBottom/2); })
        .attr("width", function(d) { return d.bb.width + paddingLeftRight; })
        .attr("height", function(d) { return d.bb.height + paddingTopBottom; });

function tick() {
    //add line data and move lines
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
    //move nodes
    node.attr("transform", function(d) { 
  	    return "translate(" + d.x + "," + d.y + ")"; });

        // // soft-center the root node
        var k = 1;
        nodes[0].y += ((height * 0.4) - nodes[0].y) * k;
        nodes[0].x += ((width*0.8) - nodes[0].x) * k;
        // nodes[1].y += ((height*0.8) - nodes[1].y) * k;
        // nodes[1].x += ((width*0.4) - nodes[1].x) * k;
}
    





 


    // handle mousewheel/doubleclick zoom
    zoom.on("zoom", function() {
        var stroke = nominal_stroke;
        if (nominal_stroke*zoom.scale()>max_stroke) stroke = max_stroke/zoom.scale();
        svg.selectAll(".link").style("stroke-width",stroke);
        svg.selectAll(".node").style("stroke-width",stroke);
        
        var base_radius = nominal_base_node_size;
        if (nominal_base_node_size*zoom.scale()>max_base_node_size) base_radius = max_base_node_size/zoom.scale();
            svg.selectAll(".node").attr("d", d3.svg.symbol()
            .size(function(d) { return Math.PI*Math.pow(size(d.size)*base_radius/nominal_base_node_size||base_radius,2); })
            .type(function(d) { return d.type; }))
            
        //svg.selectAll("text").attr("x", function(d) { return (size(d.size)*base_radius/nominal_base_node_size||base_radius); });
        
        var text_size = nominal_text_size;
        if (nominal_text_size*zoom.scale()>max_text_size) text_size = max_text_size/zoom.scale();
        svg.selectAll("text").style("font-size",text_size + "px");

        svg.selectAll("text").each(function(d, i) {
            d.bb = this.getBBox(); // get bounding box of text field and store it in texts array        
        }); 
        node.selectAll("rect")
            .attr("x", function(d) { return d.bb.x - (paddingLeftRight/2);})
            .attr("y", function(d) { return (d.bb.y) - (paddingTopBottom/2); })
            .attr("width", function(d) { return d.bb.width + paddingLeftRight; })
            .attr("height", function(d) { return d.bb.height + paddingTopBottom; });

        rootg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    });
    svg.call(zoom);	 


    // resize the svg element based on viewport size
    function resize() {
        var width = window.innerWidth, height = window.innerHeight;
        svg.attr("width", width).attr("height", height);
        
        force.size([force.size()[0]+(width-w)/zoom.scale(),force.size()[1]+(height-h)/zoom.scale()]).resume();
        w = width;
        h = height;
    }
    resize();


    // handle search field actions
    $('#search').on('keyup', function(){
        var s = $(this).val().toLowerCase();
        if(s > ""){
            hideNodes();
            // nodes.forEach(function(n){
            //     if(n.label.toLowerCase().indexOf(s) == 0){
            //         showNode(n.id)                    
            //     }
            // })
            var filtered = nodes.filter(function(n){
                return n.label.toLowerCase().indexOf(s) == 0
            })
            filtered.forEach(function(n){
                showNode(n.id)   
            })
            if(filtered.length == 1){
                showData(filtered[0])
            }            
        } else {
            showNode()
            updateFilter()
        }
    });


    // highlight node on click
    node.on('click', function(d){
        d3.event.stopPropagation();
        clickNode(d)
    })

    function clickNode(d){        
        console.log(d);
        var el = $('#' + d.id);
        if(el.hasClass('node--inplay')){
            el.removeClass('node--inplay');
            showNode()
            updateFilter()
        } else {
            $('.node--inplay').removeClass('node--inplay')
            el.addClass('node--inplay');
            hideNodes()
            showNode(d.id)
            showData(d)
        }  
    }

    $('body').on('click', '.filter__link', function(e){
        e.preventDefault();
        var n = $(this).attr('data-node');
        var fn = nodes.filter(function(node){
            return n == node.index
        })
        //console.log(fn[0]);
        clickNode(fn[0])
    })


    // centre view on node when double-clicked
    node.on("dblclick.zoom", function(d) { d3.event.stopPropagation();
        var dcx = (window.innerWidth/2-d.x*zoom.scale());
        var dcy = (window.innerHeight/2-d.y*zoom.scale());
        zoom.translate([dcx,dcy]);
        rootg.attr("transform", "translate("+ dcx + "," + dcy  + ")scale(" + zoom.scale() + ")"); 
    });






// move view (needs work)
function transition(svg, start, end) {
  var center = [width / 2, height / 2];
  var i = d3.interpolateZoom(start, end);

  svg
      .attr("transform", transform(start))
      .transition()
      .delay(250)
      .duration(i.duration * 2)
      .attrTween("transform", function() { return function(t) { return transform(i(t)); }; })
      //.each("end", function() { d3.select(this).call(transition, end, start); });

  function transform(p) {
    var k = height / p[2];
    return "translate(" + (center[0] - p[0] * k) + "," + (center[1] - p[1] * k) + ")scale(" + k + ")";
  }
}


// fade out nodes
function hideNodes(){
    $('.link, .node, text').addClass('dimmed');
    $('.link[marker-end]').each(function(){
        switch ($(this).attr('marker-end')){
        case "url(#marker-end--critical)":
            $(this).attr('marker-end', 'url(#marker-end--critical--dimmed)')
        break;        
        case "url(#marker-end--depends)":
            $(this).attr('marker-end', 'url(#marker-end--depends--dimmed)')
        break;        
        }
    });
}


// highlight one node and immediate children
function showNode(nodeID){
    if(nodeID > ""){        
        $('#' + nodeID + ', [data-from="' + nodeID + '"]').each(function(){
            $(this).removeClass('dimmed');
            $(this).find('text').removeClass('dimmed');
            if($(this).is('[data-from="' + nodeID + '"]')){
                switch ($(this).attr('marker-end')){
                case "url(#marker-end--critical--dimmed)":
                    $(this).attr('marker-end', 'url(#marker-end--critical)')
                break;        
                case "url(#marker-end--depends--dimmed)":
                    $(this).attr('marker-end', 'url(#marker-end--depends)')
                break;        
                }

                $('#' + $(this).attr('data-to')).removeClass('dimmed');                
                $('#' + $(this).attr('data-to')).find('text').removeClass('dimmed');
            }
            
        });
    } else {
        $('.link, .node, text').removeClass('dimmed');
        $('.link[marker-end]').each(function(){
            switch ($(this).attr('marker-end')){
            case "url(#marker-end--critical--dimmed)":
                $(this).attr('marker-end', 'url(#marker-end--critical)')
            break;        
            case "url(#marker-end--depends--dimmed)":
                $(this).attr('marker-end', 'url(#marker-end--depends)')
            break;        
            }
        });
    }
}


// random
function getRand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}