// ===================================
// set-up
// ===================================
  var nodes = []                // will hold our node data from the spreadsheet via node
  var links = []                // will hold our link data from the spreadsheet via node
  var levels = []               // will hold our level mapping data from the server env file

  var min_zoom = 0.1;           // restrict how far the visualisation will zoom out
  var max_zoom = 7;             // restrict how far the visualisation will zoom in
  var baseScale = 0.4;          // where we want the default zoom to be set
  var zoomScale = 1;            // where we want the default zoomed in scale to be set (for auto-zoom to node)
  var zoom = d3.behavior.zoom().scaleExtent([min_zoom,max_zoom]).scale(baseScale);
  var width = 1200;             // initial width of svg
  var height = 800;             // initial height of svg
  var scrollbarWidth = 15;      // allowance when resizing svg
  var w = window.innerWidth - scrollbarWidth;
  var h = window.innerHeight;
  var currentLevel1 = 0;        // holds the current top level node, used for jumping between via controls

  var nodeLvl1R = 20;               // radius of level 1 node
  var textLvl1X = nodeLvl1R + 2;    // x pos offset from node circle for node label

  var nodeLvl2R = 12;
  var textLvl2X = nodeLvl2R + 2;

  var nodeLvl3R = 11;
  var textLvl3X = nodeLvl3R + 2;

  var force, svg, rootg, path, node, nodeLvl1, nodeLvl2, nodeLvl3, nodeErrors, linkTypeErrors;

  // check css variable support
  // used for visibility slider
  var supportsVariables = false;
  if(window.CSS && window.CSS.supports && window.CSS.supports('--fake-var', 0)){
    supportsVariables = true;
  }

  // fire off the calls to get the data
  getAPIdata();

// ======================================================================
// ======================================================================
// ======================================================================


// ===================================
// set variables so we can tell if the data has been received for all sources before proceeding
// ===================================
function getAPIdata(){
  var nodesData = false;
  var linksData = false;
  var levelData = false;

  // get our node data
  $.get('/nodes', function(data){
       nodes = data
       nodesData = true;
  })

  // get our link data
  $.get('/links', function(data){
      links = data
      linksData = true;
  })

  // get our level mapping data
  $.get('/levels', function(data){
    levels = data;
    levelData = true;
  })

  // wait to ensure we have everything
  waitForData()

  function waitForData(){
    // if we have everything we can proceed
     if(nodesData && linksData && levelData){
       // with the nodes we have to do a bit of mapping as d3 force assigns links based on index value
       // here we do the work ourselves to map the node to the source and target
       var nodeMap = {};
       nodes.forEach(function(x) { nodeMap[x.id] = x; });
       links = links.map(function(x) {
         return {
           source: nodeMap[x.source],
           target: nodeMap[x.target],
           rel: x.rel
         };
       });
       init();
     } else {
       // wait a bit longer for the data to arrive
       setTimeout(waitForData, 100)
     }
   }

 }



function init(){
  $('#search').focus();
  // set up some arrays to allow us to easily pick the nodes from each level
  assignNodeLevels()
  // kick it all off
  startGraph()
  // show error status
  checkForErrors()
  //active controls
  assignMoveAndZoomControls()
  //events
  assignEvents()
}

// ===================================
// display error notification
// ===================================
function checkForErrors(){
  if(nodeErrors.length > 0 || linkTypeErrors.length > 0){
    $('#controls').append('<button class="button--error" id="error">There are errors in the data</button>')
    $('#error').focus();
    $('#error').on('click', function(e){
      e.preventDefault();
      showErrors();
    })
  }
}

// ===================================
// assign nodes to levels and allocate errors for easy selection later
// ===================================
function assignNodeLevels(){
  nodeLvl1 = nodes.filter(function(node){
      return node.level == mapLevelNumberToName(1)
  })
  nodeLvl2 = nodes.filter(function(node){
      return node.level == mapLevelNumberToName(2)
  })
  nodeLvl3 = nodes.filter(function(node){
      return node.level == mapLevelNumberToName(3)
  })
  nodeErrors = nodes.filter(function(node){
    return mapLevelNameToNumeric(node.level) == null
  })
  linkTypeErrors = links.filter(function(link){
    var test = false
    if(link.rel.toLowerCase() != "critical" && link.rel.toLowerCase() != "contributes" && link.rel.toLowerCase() != "none"){
      test = true
    }
    return test;
  })
}



// ===================================
// get a level name based on the number
// ===================================
function mapLevelNumberToName(lvlID){
  lvlID = parseInt(lvlID)
  var namedLevel = levels.filter(function(level){
    return level.level == lvlID
  })
  if(namedLevel.length > 0){
    return namedLevel[0].label
  } else {
    return null
  }
}


// ===================================
// get a level number based on the name
// we use level numbers in css classes
// ===================================
function mapLevelNameToNumeric(lvlName){
  var namedLevel = levels.filter(function(level){
    return level.label == lvlName
  })
  if(namedLevel.length > 0){
    return namedLevel[0].level
  } else {
    return null
  }
}



// ===================================
// filter data for the sidebar view
// ===================================
function showData(n){
    var r = [];
    // this node
    r.push({"n":n});
    // get immediate parents
    r[0].parents = getTarget(n)
    // get immediate children
    r[0].children = getSource(n)
    updateFilter(r[0]);
}


// ===================================
// get upstream nodes from given node
// compare id, not whole object so we can match in popstate when nodes may have moved
// ===================================
function getSource(n){
  var s = links.filter(function(link){
      return link.source.id == n.id
  })
  return s;
}


// ===================================
// get downstream nodes from given node
// compare id, not whole object so we can match in popstate when nodes may have moved
// ===================================
function getTarget(n){
  var t = links.filter(function(link){
      return link.target.id == n.id
  })
  return t;
}


// ===================================
// update the sidebar with new data
// ===================================
function updateFilter(r){
    $('#filter__inner').html("");
    $('#filter').removeClass("open");
    disableVisibility(false);

    if(r == undefined) return

    getBoundingBox(r);

    var t = "";
    if($('#' + r.n.id + ' .level--error').length > 0){
      t = t + '<a href="" id="backToErrorList">back to error list</a>';
    }
    $('body').on('click', '#backToErrorList', function(e){
      e.preventDefault();
      showErrors();
    })

    t = t + '<h1>' + r.n.label + '</h1>'
    t = t + '<p>' + r.n.summary + '</p>'
    t = t + '<button id="zoomToNode" data-node-x="' + r.n.x + '" data-node-y="' + r.n.y + '">show</button>'

    if(r.parents.length > 0){
        t = t + '<h2>Contributes to</h2>'
        t = t + '<ul>'
        r.parents.forEach(function(p){
            t = t + '<li class="filter__entry"><a class="filter__link" href="" data-node="' + p.source.index + '"><h3 class="filter__action">' + p.source.label + '</h3> <span class="filter__status filter__status--' + p.rel.toLowerCase() + '">' + p.rel + '</span></a></li>';
        })
        t = t + '</ul>'
    }
    if(r.children.length > 0){
        t = t + '<h2>Supported by</h2>'
        t = t + '<ul>'
        r.children.forEach(function(c){
            t = t + '<li class="filter__entry"><a class="filter__link" href="" data-node="' + c.target.index + '"><h3 class="filter__action">' + c.target.label + '</h3> <span class="filter__status filter__status--' + c.rel.toLowerCase() + '">' + c.rel + '</span></a></li>';
        })
        t = t + '</ul>'
    }
    $('#filter__inner').html(t);
    $('#filter').addClass("open");
    disableVisibility(true);
    $('#zoomToNode').focus();
}


// ===================================
// get bounding box of selected nodes
// currently only uses nodes displayed in filter
// could be improved to include all nodes shown in graph view (up and down tree)
// and then work out scaling needed to show them all
// ===================================
function getBoundingBox(t){
  var bb = {};
  bb.yLeast = t.n.y;
  bb.yMost = t.n.y;
  bb.xLeast = t.n.x;
  bb.xMost = t.n.x;

  t.parents.forEach(function(p){
    if(p.y > bb.yMost){ bb.yMost = p.y; }
    if(p.y < bb.yLeast){ bb.yLeast = p.y; }
    if(p.x > bb.xMost){ bb.xMost = p.x; }
    if(p.x < bb.xLeast){ bb.xLeast = p.x; }
  })
  //console.log(bb);
  //return bb;

  var toY = bb.yLeast + ((bb.yMost - bb.yLeast) / 2);
  var toX = bb.xLeast + ((bb.xMost - bb.xLeast) / 2);
  var scale = 1;
  toX = (w/2-toX*scale)
  toY = (h/2-toY*scale)

  showLocation(toX, toY, scale)
}


// ===================================
// get links of particular type
// ===================================
function getLinks(rel){
  return links.filter(function(link){return link.rel.toLowerCase() == rel.toLowerCase()})
}



// ===================================
// reveal link
// ===================================
function showLink(link){
  $("#link-" + link.source.id + "-" + link.target.id).removeClass('dimmed');
}


// ===================================
// reveal the link and its nodes
// ===================================
function showBranch(relLink, boolDirDown){
  showNode(relLink.source.id)
  showNode(relLink.target.id)
  showLink(relLink)

  if(boolDirDown){
    // go down the tree
    var downstream = links.filter(function(link){return link.source.id == relLink.target.id});
    downstream.forEach(function(downs){
      showBranch(downs, boolDirDown)
    })
  } else {
    //if the source is not top level then go up until it is
    //find links which have relLink.source as the target
    var upstream = links.filter(function(link){return link.target.id == relLink.source.id});
    upstream.forEach(function(ups){
      showBranch(ups)
    })
  }
}


// ===================================
// remove inplay (node pulse)
// ===================================
function hideInPlay(){
  $('.node--inplay').removeClass('node--inplay')
}


// ===================================
// show all nodes upstream from a particular link type
// ===================================
function showLinks(rel){
  hideInPlay()
  if(rel == "all"){
    showNode();
    disableVisibility(false);
  }else{
    hideNodes();
    disableVisibility(true);
    // get all links of particular type
    var relLinks = getLinks(rel)
    //get all upstream nodes from this link
    relLinks.forEach(function(relLink){
      showBranch(relLink)
    })
  }
}



// ===================================
// reset filter and link displays
// ===================================
function reset(){
  //reset filter
  updateFilter()
  //reset refine
  $('#refine__all').click();
}



// ===================================
// disable/enable the visibility adjuster
// ===================================
function disableVisibility(boolOn){
  var el = document.querySelector('#visibility');
  if(boolOn){
    el.removeAttribute('disabled');
  } else {
    el.setAttribute("disabled", "disabled");
  }
}



// ===================================
// search nodes
// ===================================
function searchNodes(str, boolSingle){
  if(str > ""){
      hideNodes();
      var filtered = nodes.filter(function(n){
          return n.label.toLowerCase().indexOf(str) == 0
      })
      if(filtered.length == 1 || boolSingle){
          // show single result in sidebar if user hit enter in search
          // or if single result returned
          showData(filtered[0])
          showNodeGroup(filtered[0].id)
          $('.node--inplay').removeClass('node--inplay')
          $('#' + filtered[0].id).addClass('node--inplay');
      } else {
          // show all results
          filtered.forEach(function(n){
              showNodeGroup(n.id)
          })
      }
  } else {
      showNodeGroup()
      updateFilter()
  }
}


// ===================================
// click a node to display data
// ===================================
function clickNode(d, boolUpdateHistory){
    reset()
    var el = $('#' + d.id);
    if(el.hasClass('node--inplay')){
        // show everything, deselect this node
        el.removeClass('node--inplay');
        showNodeGroup()
        updateFilter()
    } else {
        // hide everything except this node and its relations
        hideNodes()
        $('.node--inplay').removeClass('node--inplay')
        el.addClass('node--inplay');
        if(boolUpdateHistory){
          history.pushState({ node: d }, "d.label", "/?" + d.id);
        }
        showNodeGroup(d.id)
        // update the sidebar
        showData(d)
    }
}



// ===================================
// get location of a specific node
// ===================================
function zoomToNode(n){
  var dcx, dcy, scale;
  if(!n){
    dcx = (w/4)
    dcy = (h/4)
    scale = baseScale
  }else{
    scale = zoomScale
    dcx = (w/2-n.x*scale)
    dcy = (h/2-n.y*scale)
  }
  showLocation(dcx, dcy, scale)
}



// ===================================
// move the view to focus on a particular location
// ===================================
function showLocation(x, y, scale){
  //zoom.translate([x,y]);
  rootg.attr("transform", "translate("+ x + "," + y  + ") scale(" + scale + ")");
}


// ===================================
// move and zoom controls
// ===================================
function assignMoveAndZoomControls(){
    $('#zoomIn').on('click', function(){zoomIn()});
    function zoomIn(){
      var curr = d3.transform(rootg.attr("transform"))
      showLocation(curr.translate[0] , curr.translate[1], curr.scale[0] + 0.1)

      //rootg.attr("transform", "translate("+ curr.translate[0] + "," + curr.translate[1]  + ") scale(" + (curr.scale[0] + 0.1) + ")");
      //rootg.attr("transform", "matrix()";
    }
    $('#zoomOut').on('click', function(){zoomOut()});
    function zoomOut(){
      var curr = d3.transform(rootg.attr("transform"))
      showLocation(curr.translate[0], curr.translate[1], curr.scale[0] - 0.1)
    }

    $('#moveUp').on('click', function(){moveUp();});
    $('#moveUp').on('mousedown', function(){
      moveUpInt = setInterval(function() { moveUp(); }, 250);
    }).mouseup(function() {
        clearInterval(moveUpInt);
    });
    function moveUp(){
      var curr = d3.transform(rootg.attr("transform"))
      rootg.attr("transform", "translate("+ curr.translate[0] + "," + (curr.translate[1] + 50)  + ") scale(" + curr.scale[0] + ")");
    }

    $('#moveDown').on('click', function(){moveDown();});
    $('#moveDown').on('mousedown', function(){
      moveDownInt = setInterval(function() { moveDown(); }, 250);
    }).mouseup(function() {
        clearInterval(moveDownInt);
    });
    function moveDown(){
      var curr = d3.transform(rootg.attr("transform"))
      rootg.attr("transform", "translate("+ curr.translate[0] + "," + (curr.translate[1] - 50)  + ") scale(" + curr.scale[0] + ")");
    }

    $('#moveLeft').on('click', function(){moveLeft();});
    $('#moveLeft').on('mousedown', function(){
      moveLeftInt = setInterval(function() { moveLeft(); }, 250);
    }).mouseup(function() {
        clearInterval(moveLeftInt);
    });
    function moveLeft(){
      var curr = d3.transform(rootg.attr("transform"))
      rootg.attr("transform", "translate("+ (curr.translate[0] + 50) + "," + curr.translate[1]  + ") scale(" + curr.scale[0] + ")");
    }

    $('#moveRight').on('click', function(){moveRight();});
    $('#moveRight').on('mousedown', function(){
      moveRightInt = setInterval(function() { moveRight(); }, 250);
    }).mouseup(function() {
        clearInterval(moveRightInt);
    });
    function moveRight(){
      var curr = d3.transform(rootg.attr("transform"))
      rootg.attr("transform", "translate("+ (curr.translate[0] - 50) + "," + curr.translate[1]  + ") scale(" + curr.scale[0] + ")");
    }
}



// ===================================
// fade out elements
// ===================================
function hideNodes(){
    $('.link, .node, text').addClass('dimmed');
    hideInPlay();
}


// ===================================
// highlight one node
// ===================================
function showNode(nodeID){
    if(nodeID > ""){
        // treeNodes.push(nodes.filter(function(n){ return n.id == nodeID })[0]);
        $('#' + nodeID).each(function(){
            $(this).removeClass('dimmed');
            $(this).find('text').removeClass('dimmed');
        });
    } else {
        $('.link, .node, text').removeClass('dimmed');
    }
}


// ===================================
// highlight one node and all parent/children
// ===================================
function showNodeGroup(nodeID){
  if(nodeID > ""){

      $('[data-to="' + nodeID + '"]').each(function(){
          var toHereList = links.filter(function(link){return link.target.id == nodeID})
          toHereList.forEach(function(toHere){
              //console.log(toHere);
              showBranch(toHere)
          })
      })
      $('[data-from="' + nodeID + '"]').each(function(){
          var fromHereList = links.filter(function(link){return link.source.id == nodeID})
          fromHereList.forEach(function(fromHere){
              //console.log(fromHere);
              showBranch(fromHere, true)
          })

      })

  } else {
      $('.link, .node, text').removeClass('dimmed');
  }
}







// ===================================
// ===================================
// start node/link force layout
// ===================================
// ===================================
function startGraph(){
  var sortedNodes = nodes.sort(function(a, b) {
      var textA = a.label.toUpperCase();
      var textB = b.label.toUpperCase();
      return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
  });
  sortedNodes.forEach(function(n){
    $('#nodesList').append('<option value="' + n.label + '"></option>')
  })

  force = d3.layout.force()
    .nodes(nodes)
    .links(links)
    .size([w, h])
    .linkDistance(100)
    .linkStrength(function(l, i) {return 1; })  // could make this dependent on type of link
    .gravity(1)
    .charge(-10000)
    .friction(0.75)
    .on('start', start)
    //.on("tick", tick)
    .start();

  // ===================================
  // construct the svg
  // ===================================
  svg = d3.select("body").append("svg")
      .attr("width", w)
      .attr("height", h)
      .attr("class", "hide-labels--level1 hide-labels--level2 hide-labels--level3");
  rootg = svg.append("g").attr('id', 'root').attr("transform", "translate(" + w/4 + "," + h/4 + ") scale(" + baseScale + ")");


  svg.append('svg:defs').selectAll("filter").data(["end"]).enter().append("svg:filter")
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 1)
      .attr('height', 1)
      .attr('id', 'highlight')
      .append('svg:feFlood')
      .attr('flood-color', 'hsl(0, 0%, 0%)')
      svg.selectAll('filter')
      .append('svg:feComposite')
      .attr('in','SourceGraphic');
  svg.append('svg:defs').selectAll("filter").data(["end"]).enter().append("svg:filter")
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 1)
      .attr('height', 1)
      .attr('id', 'error')
      .append('svg:feFlood')
      .attr('flood-color', 'red')
      svg.selectAll('filter')
      .append('svg:feComposite')
      .attr('in','SourceGraphic');

  // ===================================
  // add the links
  // ===================================
  path = rootg.append("svg:g").selectAll("path")
      .data(force.links())
    .enter().append("svg:path")
      .attr("class", function(d) { return "link link--" + d.rel.toLowerCase(); })
      .attr("id", function(d){ return "link-" + d.source.id + "-" + d.target.id})
      .attr("data-from", function(d) {return d.source.id})
      .attr("data-to", function(d) {return d.target.id})

  // ===================================
  // add the nodes
  // ===================================
  node = rootg.selectAll(".node")
      .data(force.nodes())
    .enter().append("g")
      .attr("class", "node")
      .attr("id", function(d){ return d.id })
      .attr("data-label", function(d){ return d.label; })
      //.call(force.drag);
      node.append("circle")
          .attr("r", function(d) {
            var radius = 10;
            var radiusLevel = mapLevelNameToNumeric(d.level)
            if(radiusLevel){
                radius = (20 / radiusLevel)
            }
            return radius;
          })
          .attr("class", function(d) {
            var nodeClass = "level--error"
            var nodeClassLevel = mapLevelNameToNumeric(d.level)
            if(nodeClassLevel){
              nodeClass = "level--" + mapLevelNameToNumeric(d.level)
            }
            return nodeClass
          });
      node.append("text")
      .attr('id', function(d) { return "text--" + (d.index);})
      //.attr('filter', function(d) { return 'url(#lvl' + d.level + ')'})
      .attr("x", function(d) {
          var xPos;
          switch (mapLevelNameToNumeric(d.level)){
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
          return xPos;
      })
      .attr("dy", 5)
      .attr("class", function(d){ return "text text--lvl" + d.level})
      .text(function(d) { return d.label; });


  // ===================================
  // handle mousewheel/doubleclick zoom
  // ===================================
  // zoom.on("zoom", function() {
  //     // console.log(d3.event.scale)
  //     rootg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
  // });
  // svg.call(zoom);


  // ===================================
  // resize the svg element based on viewport size
  // ===================================
  d3.select(window).on("resize", resize);
  function resize() {
      var width = window.innerWidth - scrollbarWidth, height = window.innerHeight;
      svg.attr("width", width).attr("height", height);

      force.size([force.size()[0]+(width-w)/zoom.scale(),force.size()[1]+(height-h)/zoom.scale()]).resume();
      w = width;
      h = height;
  }
  resize();


  // ===================================
  // highlight node on click
  // ===================================
  node.on('click', function(d){
      d3.event.stopPropagation();
      clickNode(d, true)
  })
  node.on("dblclick.zoom", function(d) { d3.event.stopPropagation();
  //     zoomToNode(d)
  });

}




// ===================================
// control rendering
// this allows us to speed up the move to the final resting position when the graph starts up
// adjust ticksPerRender to increase the speed
// ===================================
function start() {
  var ticksPerRender = 1;
  if(window.location.search.length > 0){
    ticksPerRender = 20
  }
  requestAnimationFrame(function render() {
    for (var i = 0; i < ticksPerRender; i++) {
      force.tick();
    }

    // links
    path.attr("d", function(d) {
        var dx = d.target.x - d.source.x,
            dy = d.target.y - d.source.y,
            dr = 0;//Math.sqrt(dx * dx + dy * dy); // curvy lines
        return "M" +
            d.source.x + "," +
            d.source.y + "A" +
            dr + "," + dr + " 0 0,1 " +
            d.target.x + "," +
            d.target.y;
    });

    // nodes
    node.call(updateNode);

    if (force.alpha() > 0) {
      requestAnimationFrame(render);
    } else {
      renderDone()
    }

  })
}


var updateNode = function() {
    this.attr("transform", function(d) {
      return "translate(" + d.x + "," + d.y + ")";
    });
}

// ===================================
// done calculating chart
// ===================================
function renderDone(){
  // show text if set to visible
  // document.querySelectorAll('.text').forEach(function(t){
  //   t.classList.remove('hidden')
  // })

  if(window.location.search.length > 0){
    var nodeID = window.location.search.split('?')[1];
    var thisNode = nodes.filter(function(n){
      return n.id == nodeID
    })
    if(thisNode.length == 1){
      clickNode(thisNode[0])
    }
  }
}


// ===================================
// display errors when chart loads
// ===================================
function showErrors(){
  var showErrorList = false;
  var d = "";

  if(nodeErrors.length > 0){
      showErrorList = true;
      d = d + '<h2>The following nodes have incorrect level assigned:</h2>'
      d = d + '<ul class="filterlist filterlist--withheaders">'
      nodeErrors.forEach(function(nodeError){
        d = d + '<li class="filter__entry"><a class="filter__link" href="" data-node="' + nodeError.index + '"><span class="filter__action">' + nodeError.label + '</span> <span class="filter__id">' + nodeError.id + '</span> <span class="filter__level">' + nodeError.level + '</span></a></li>';
      })
      d = d + '</ul>'
  }

  if(linkTypeErrors.length > 0){
    showErrorList = true;
    d = d + '<h2>The following links have incorrect relationship assigned:</h2>'
    d = d + '<ul class="filterlist filterlist--withheaders">'
    linkTypeErrors.forEach(function(linkError){
      d = d + '<li class="filter__entry"><span class="filter__rel">' + linkError.rel + '</span> <a class="filter__link filter__link--small filter__link--source" href="" data-node="' + linkError.source.index + '">' + linkError.source.id + '</a> <a class="filter__link filter__link--small filter__link--target" href="" data-node="' + linkError.target.index + '">' + linkError.target.id + '</a></li>'
    })
    d = d + '</ul>'
  }

  if(showErrorList){
    $('#filter__inner').html("");
    $('#filter').removeClass("open");
    d = '<h1>There are some anomalies</h1>' + d
    $('#filter__inner').append(d);
    $('#filter').addClass("open");
  }
}

// ===================================
// ===================================
// EVENTS
// ===================================
// ===================================
function assignEvents(){
  // ===================================
  // handle popstate
  // ===================================
  window.onpopstate = function(event) {
    if(event.state){
      clickNode(event.state.node, false)
    }
  };


  // ===================================
  // handle refining
  // ===================================
  $('[name="refine"]').on('change', function(){
    updateFilter();
    showLinks($('[name="refine"]:checked')[0].value)
  });


  // ===================================
  // handle label toggle
  // ===================================
  $('[name="labels"]').on('change', function(){
    if($(this).is(':checked')){
      $('svg').removeClass('hide-labels--level' + $(this).val());
    } else {
      $('svg').addClass('hide-labels--level' + $(this).val());
    }
  })


  // ===================================
  // handle search field
  // ===================================
  $('#controls__search').on('submit', function(e){
    e.preventDefault();
    var s = $('#search').val().toLowerCase();
    searchNodes(s, true)
  })



  // ===================================
  // highlight node and update UI when using links in sidebar
  // ===================================
  $('body').on('click', '.filter__link', function(e){
      e.preventDefault();
      var n = $(this).attr('data-node');
      var fn = nodes.filter(function(node){
          return n == node.index
      })
      clickNode(fn[0], true)
  })


  // ===================================
  // centre view on node
  // this sits on a cta in the sidebar
  // ===================================
  $('body').on('click', '#zoomToNode', function(e){
    e.preventDefault();
    var n = [];
    n.x = $(this).attr('data-node-x')
    n.y = $(this).attr('data-node-y')
    zoomToNode(n)
  })


  // ===================================
  // reset the zoom
  // cta in the controls section
  // ===================================
  $('#resetZoom').on('click', function(e){
    e.preventDefault();
    zoomToNode();
  })


  // ===================================
  // close the sidebar and display all the nodes and links again
  // ===================================
  $('#close').on('click', function(e){
    e.preventDefault();
    hideInPlay();
    reset();
    showNode();
    $('#search').focus();
  })


  // ===================================
  // key codes
  // ===================================
  $('body').on('keyup', function(e){
    switch (e.keyCode){
      case 27:
      // close sidebar on ESC key
      if($('#filter').is('.open')){
          e.preventDefault();
          $('#close').trigger('click')
      }
      break;
    }
  })


  // ===================================
  // handle prev next controls for navigating between top level nodes
  // ===================================
  $('#prev').on('click', function(e){
    e.preventDefault();
    currentLevel1 --
    if(currentLevel1 < 0){
      currentLevel1 = nodeLvl1.length -1
    }
    zoomToNode(nodeLvl1[currentLevel1]);
  })
  $('#next').on('click', function(e){
    e.preventDefault();
    currentLevel1 ++
    if(currentLevel1 > nodeLvl1.length -1){
      currentLevel1 = 0
    }
    zoomToNode(nodeLvl1[currentLevel1]);
  })
}


// ===================================
// handle control of css variables via slider
// ===================================
if(supportsVariables){
  var bgVisibilityWrap = document.querySelector('#controls__visibility');
  var bgVisibility = bgVisibilityWrap.querySelector('#visibility');

  bgVisibilityWrap.classList.remove('hidden');

  var styles = getComputedStyle(document.documentElement);
  var getVariable = function(styles, propertyName) {
    return String(parseInt(styles.getPropertyValue(propertyName))).trim();
  };
  var setDocumentVariable = function(propertyName, value) {
    document.documentElement.style.setProperty(propertyName, value);
  };

  bgVisibility.value = getVariable(styles, '--lightness');
  bgVisibility.addEventListener('input', function() {
    setDocumentVariable('--lightness', bgVisibility.value + '%');
    setDocumentVariable('--op', ((100 - bgVisibility.value) * 0.02));
  });
}
