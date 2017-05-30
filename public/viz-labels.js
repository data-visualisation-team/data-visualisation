// ===================================
// set-up
// ===================================
  var nodes = []
  var links = []
  var labelAnchors = [];        // nodes for labels (will not display)
  var labelAnchorLinks = [];

  var min_zoom = 0.1;
  var max_zoom = 7;
  var baseScale = 0.4;
  var zoomScale = 1;
  var zoom = d3.behavior.zoom().scaleExtent([min_zoom,max_zoom]).scale(baseScale);
  var width = 1200;
  var height = 800;
  var scrollbarWidth = 15;
  var w = window.innerWidth - scrollbarWidth;
  var h = window.innerHeight;
  var textLvl1X = 22;
  var nodeLvl1R = 20;
  var textLvl2X = 12;
  var nodeLvl2R = 12;
  var textLvl3X = 8;
  var nodeLvl3R = 11;
  var paddingLeftRight = 12; // adjust the padding values depending on font and font size
  var paddingTopBottom = 5;
  var force, svg, rootg, path, node, nodeLvl1, nodeLvl2, nodeLvl3;
  // var nominal_stroke = 1.5;
  // var nominal_base_node_size = 8;
  // var nominal_text_size = 10;
  // var max_text_size = 24;
  // var max_stroke = 4.5;
  // var max_base_node_size = 36;


// ===================================
// adding dummy nodes
// ===================================
function generateRandomData(){
  var level1Count = 1;
  var level2Count = 20;
  var level3Count = 40;

  function addLevel1(){
    for(i=0;i<(level1Count);i++){
        nodes.push({"id": '' + i + '', "label": "Stream " + i, "level": "1", "summary": "Lorem ipsum dolor sit amet, ad eos consetetur incorrupte. Sit facilisis explicari ex, te has alia melius labitur. Volumus sententiae consequuntur an mei."})
        if(i == (level1Count -1)){
          addLevel2()
        }
    }
  }
  function addLevel2(){
    var l = nodes.length
    //console.log('level2 =================' + l);
    for(i=(l);i<(l + level2Count);i++){
        nodes.push({"id": '' + i + '', "label": "Programme " + i, "level": "2", "summary": "Accusam iudicabit theophrastus ei nam, nisl choro ius in, pri tollit scripserit appellantur id."})
        if(i == (l + (level2Count - 1))){
          addLevel3()
        }
    }
  }
  function addLevel3(){
    var l = nodes.length
    for(i=(l);i<(l + level3Count);i++){
        nodes.push({"id": '' + i + '', "label": "Milestone " + i, "level": "3", "summary": "Usu putent vocent appetere ut, at ullum pericula vix. Utinam eirmod in vix, invidunt oporteat ei vim, an habemus adipiscing eam."})
    }
    assignNodeLevels()

    nodeLvl3.forEach(function(node){
      var target = nodeLvl2[Math.floor(Math.random()*nodeLvl2.length)];
      links.push({"source": parseInt(target.id), "target": parseInt(node.id), "rel": getLinkType(node.id)})
    })
    nodeLvl2.forEach(function(node){
      var target = nodeLvl1[Math.floor(Math.random()*nodeLvl1.length)];
      links.push({"source": parseInt(target.id), "target": parseInt(node.id), "rel": getLinkType(node.id)})
    })
    startGraph()
  }
  addLevel1()

  // ===================================
  // add dummy links
  // ===================================



}
//generateRandomData()

function generateTestData(){
  nodes.push({"ref": "one", "label": "Stream one", "level": "1", "summary": "Usu putent vocent appetere ut, at ullum pericula vix. Utinam eirmod in vix, invidunt oporteat ei vim, an habemus adipiscing eam."})
  nodes.push({"ref": "two", "label": "Project two", "level": "2", "summary": "Usu putent vocent appetere ut, at ullum pericula vix. Utinam eirmod in vix, invidunt oporteat ei vim, an habemus adipiscing eam."})
  nodes.push({"ref": "three", "label": "Milestone three", "level": "3", "summary": "Usu putent vocent appetere ut, at ullum pericula vix. Utinam eirmod in vix, invidunt oporteat ei vim, an habemus adipiscing eam."})
  nodes.push({"ref": "four", "label": "Milestone four", "level": "3", "summary": "Usu putent vocent appetere ut, at ullum pericula vix. Utinam eirmod in vix, invidunt oporteat ei vim, an habemus adipiscing eam."})



  links.push({"source": "one", "target": "two", "rel": "depends"})
  links.push({"source": "two", "target": "three", "rel": "depends"})
  links.push({"source": "two", "target": "four", "rel": "depends"})

  var nodeMap = {};
  nodes.forEach(function(x) { nodeMap[x.ref] = x; });
  links = links.map(function(x) {
    return {
      source: nodeMap[x.source],
      target: nodeMap[x.target],
      rel: x.rel
    };
  });

  assignNodeLevels()
  startGraph()
}
//generateTestData()

function getAPIdata(){
  var nodesData = false;
  var linksData = false;
   $.get('/nodes', function(data){
       nodes = data
       nodesData = true;

       console.log(nodes)
  })

  $.get('/links', function(data){
      links = data
      linksData = true;
  })

  waitForData()

  function waitForData(){
     if(nodesData && linksData){
       console.log(nodes, links)

       var nodeMap = {};
       nodes.forEach(function(x) { nodeMap[x.id] = x; });
       links = links.map(function(x) {
         return {
           source: nodeMap[x.source],
           target: nodeMap[x.target],
           rel: x.rel
         };
       });

      //  console.log(JSON.stringify(nodes))
      //  console.log(JSON.stringify(links))
      console.log(nodes, links)

       assignNodeLevels()
       startGraph()
     } else {
       setTimeout(waitForData, 100)
     }
   }

 }

//api
getAPIdata();


function assignNodeLevels(){
  nodeLvl1 = nodes.filter(function(node){
      return node.level == "1"
  })
  nodeLvl2 = nodes.filter(function(node){
      return node.level == "2"
  })
  nodeLvl3 = nodes.filter(function(node){
      return node.level == "3"
  })
}


function getLinkType(n){
  n = parseInt(n)
  if(n % 5 == 0) {
    return "critical"
  }
  if(n % 7 == 0) {
    return "limited"
  }
  return "depends"
}





// ===================================
// construct labels
// ===================================
  // nodes.forEach(function(node){
  //     // add two nodes to link together for the force layout to work
  //     labelAnchors.push({node: node});
  //     labelAnchors.push({node: node});
  // })
  // for(var i = 0; i < nodes.length; i++) {
  // 	labelAnchorLinks.push({
  // 		source : i * 2,
  // 		target : i * 2 + 1,
  // 		weight : 1
  // 	});
  // };


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
    // console.table(r)
    // console.table(r.parents)
    // console.table(r.children)
}

// ===================================
// get upstream nodes from given node
// ===================================
function getSource(n){
  return links.filter(function(link){
      return link.source == n
  })
}

// ===================================
// get downstream nodes from given node
// ===================================
function getTarget(n){
  return links.filter(function(link){
      return link.target == n
  })
}

// ===================================
// update the sidebar with new data
// ===================================
function updateFilter(r){
    $('#filter__inner').html("");
    $('#filter').removeClass("open");


    if(r == undefined) return

    var t = '<h1>' + r.n.label + '</h1>'
    t = t + '<button id="zoomToNode" data-node-x="' + r.n.x + '" data-node-y="' + r.n.y + '">show</button>'
    t = t + '<p>' + r.n.summary + '</p>'
    if(r.parents.length > 0){
        t = t + '<h2>Contributes to</h2>'
        t = t + '<ul>'
        r.parents.forEach(function(p){
            t = t + '<li><a class="filter__link" href="" data-node="' + p.source.index + '">' + p.source.label + '</a> [' + p.rel + ']</li>';
        })
        t = t + '</ul>'
    }
    if(r.children.length > 0){
        t = t + '<h2>Supported by</h2>'
        t = t + '<ul>'
        r.children.forEach(function(c){
            t = t + '<li><a class="filter__link" href="" data-node="' + c.target.index + '">' + c.target.label + '</a> [' + c.rel + ']</li>';
        })
        t = t + '</ul>'
    }
    $('#filter__inner').html(t);
    $('#filter').addClass("open");
    $('#zoomToNode').focus();
}



// get links of particular type
function getLinks(rel){
  return links.filter(function(link){return link.rel == rel})
}

function showLink(link){
  $("#link-" + link.source.id + "-" + link.target.id).removeClass('dimmed');
}

function showBranch(relLink, boolDirDown){
  //show the link and its endpoints
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
function hideInPlay(){
  //remove inplay
  $('.node--inplay').removeClass('node--inplay')
}

// show all nodes upstream from a particular link type
function showLinks(rel){
  hideInPlay()
  if(rel == "all"){
    showNode();
  }else{
    hideNodes();
    // get all links of particular type
    var relLinks = getLinks(rel)
    //get all upstream nodes from this link
    relLinks.forEach(function(relLink){
      showBranch(relLink)
    })
  }
}

// handle refining
$('[name="refine"]').on('change', function(){
  updateFilter();
  showLinks($('[name="refine"]:checked')[0].value)
});

// handle label toggle
$('[name="labels"]').on('change', function(){
  if($(this).is(':checked')){
    $('svg').removeClass('hide-labels--level' + $(this).val());
  } else {
    $('svg').addClass('hide-labels--level' + $(this).val());
  }
})

function reset(){
  //reset filter
  updateFilter()
  //reset refine
  $('#refine__all').click();
}

// ===================================
// start node/link force layout
// ===================================


function startGraph(){


  nodes.forEach(function(n){
    $('#nodesList').append('<option value="' + n.label + '"></option>')
  })

  // var edges = [];
  // links.forEach(function(e) {
  //     var sourceNode = nodes.filter(function(n) {
  //         return n.Id === e.Source;
  //     })[0],
  //         targetNode = nodes.filter(function(n) {
  //             return n.Id === e.Target;
  //         })[0];
  //
  //     edges.push({
  //         source: sourceNode,
  //         target: targetNode,
  //         value: e.Value
  //     });
  // });
  // console.log(edges)
  // links = edges

  force = d3.layout.force()
    .nodes(nodes)
    .links(links)
    .size([w, h])
    .linkDistance(50)
    .linkStrength(function(l, i) {return 1; })  // could make this dependent on type of link
    .gravity(1)
    .charge(-3000)
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

  // add the links
  path = rootg.append("svg:g").selectAll("path")
      .data(force.links())
    .enter().append("svg:path")
      .attr("class", function(d) { return "link link--" + d.rel; })
      .attr("id", function(d){ return "link-" + d.source.id + "-" + d.target.id})
      .attr("data-from", function(d) {return d.source.id})
      .attr("data-to", function(d) {return d.target.id})
  // add the nodes
  node = rootg.selectAll(".node")
      .data(force.nodes())
    .enter().append("g")
      .attr("class", "node")
      .attr("id", function(d){ return d.id })
      .attr("data-label", function(d){ return d.label; })
      .call(force.drag);
      node.append("circle")
          .attr("r", function(d) { return (20 / d.level) })
          .attr("class", function(d) { return "level--" + d.level });
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
      .attr("class", function(d){ return "text text--lvl" + d.level})
      .text(function(d) { return d.label; });


  // ===================================
  // handle mousewheel/doubleclick zoom
  // ===================================
  zoom.on("zoom", function() {
      console.log(d3.event.scale)
      rootg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
  });
  svg.call(zoom);


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
      clickNode(d)
  })

  node.on("dblclick.zoom", function(d) { d3.event.stopPropagation();
  //     zoomToNode(d)
  });

}
// ===================================
// control rendering
// ===================================
function start() {
  var ticksPerRender = 1;
  requestAnimationFrame(function render() {
    for (var i = 0; i < ticksPerRender; i++) {
      force.tick();
    }

    // links
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

    // nodes
    node.call(updateNode);

    if (force.alpha() > 0) {
      requestAnimationFrame(render);
    } else {
      document.querySelectorAll('.text').forEach(function(t){
        t.classList.remove('hidden')
      })

    }

  })
}


var updateNode = function() {
    this.attr("transform", function(d) {
      return "translate(" + d.x + "," + d.y + ")";
    });
}




// ===================================
// events
// ===================================



function clickNode(d){
    reset()
    var el = $('#' + d.id);
    if(el.hasClass('node--inplay')){
        el.removeClass('node--inplay');
        showNodeGroup()
        updateFilter()
    } else {
        hideNodes()
        $('.node--inplay').removeClass('node--inplay')
        el.addClass('node--inplay');

        showNodeGroup(d.id)
        showData(d)
    }
}


    // ===================================
    // handle search field actions
    // ===================================
    // $('#search').on('keyup', function(e){
    //     if(e.keyCode != 13){
    //       var s = $(this).val().toLowerCase();
    //       searchNodes(s, false)
    //     }
    // });
    $('#controls__search').on('submit', function(e){
      e.preventDefault();
      var s = $('#search').val().toLowerCase();
      searchNodes(s, true)
    })

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
    // highlight node and update UI when using links in sidebar
    // ===================================
    $('body').on('click', '.filter__link', function(e){
        e.preventDefault();
        var n = $(this).attr('data-node');
        var fn = nodes.filter(function(node){
            return n == node.index
        })
        //console.log(fn[0]);
        clickNode(fn[0])
    })


    // ===================================
    // centre view on node when double-clicked
    // ===================================

    $('body').on('click', '#zoomToNode', function(e){
      e.preventDefault();
      var n = [];
      n.x = $(this).attr('data-node-x')
      n.y = $(this).attr('data-node-y')
      zoomToNode(n)
    })

    $('#resetZoom').on('click', function(e){
      e.preventDefault();
      zoomToNode();
    })

    $('#close').on('click', function(e){
      e.preventDefault();
      hideInPlay();
      reset();
      showNode();
    })

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
      zoom.translate([dcx,dcy]);
      rootg.attr("transform", "translate("+ dcx + "," + dcy  + ") scale(" + scale + ")");
    }

    var currentLevel1 = 0;
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


// ===================================
// fade out nodes
// ===================================
function hideNodes(){
    $('.link, .node, text').addClass('dimmed');
    hideInPlay();
}


// ===================================
// highlight one node and immediate parent/children
// ===================================
function showNode(nodeID){
    if(nodeID > ""){
        $('#' + nodeID).each(function(){
            $(this).removeClass('dimmed');
            $(this).find('text').removeClass('dimmed');
        });
    } else {
        $('.link, .node, text').removeClass('dimmed');
    }
}

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

      // $('#' + nodeID + ', [data-from="' + nodeID + '"], [data-to="' + nodeID + '"]').each(function(){
      //     $(this).removeClass('dimmed');
      //     $(this).find('text').removeClass('dimmed');
      //     if($(this).is('[data-from="' + nodeID + '"]')){
      //         $('#' + $(this).attr('data-to')).removeClass('dimmed');
      //         $('#' + $(this).attr('data-to')).find('text').removeClass('dimmed');
      //     }
      //     if($(this).is('[data-to="' + nodeID + '"]')){
      //       var upStreamNodeID = $(this).attr('data-from');
      //       $('#' + upStreamNodeID).removeClass('dimmed');
      //     }
      //
      // });
  } else {
      $('.link, .node, text').removeClass('dimmed');
  }
}

// ===================================
// random
// ===================================
function getRand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


var styles = getComputedStyle(document.documentElement);
var getVariable = function(styles, propertyName) {
  return String(parseInt(styles.getPropertyValue(propertyName))).trim();
};
var setDocumentVariable = function(propertyName, value) {
  document.documentElement.style.setProperty(propertyName, value);
};
var bgVisibility = document.querySelector('#visibility');
bgVisibility.value = getVariable(styles, '--lightness');
bgVisibility.addEventListener('input', function() {
  setDocumentVariable('--lightness', bgVisibility.value + '%');
  setDocumentVariable('--op', ((100 - bgVisibility.value) * 0.02));
});
