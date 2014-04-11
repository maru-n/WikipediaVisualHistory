var wikipediaUrl = "http://ja.wikipedia.org/wiki/";
var wikipediaExportUrl = "http://ja.wikipedia.org/wiki/%E7%89%B9%E5%88%A5:%E3%83%87%E3%83%BC%E3%82%BF%E6%9B%B8%E3%81%8D%E5%87%BA%E3%81%97/";

var statusMessageId = "status_message";

var testData = false;

function drawGraph(divID, data) {
    if(testData){

    //testdata
    var testNodeData = [];
    for(var i; i<20; i++ ) {
        testNodeData.push({title:"title",key:i});
    }
    var testLinkData = [
    {source: 0, target: 1},
    {source: 2, target: 3},
    {source: 18, target: 19}
    ];
    data.nodes = testNodeData;
    data.links = testLinkData;
    }
    //documentGraph(divID,data);
    //bundleLayoutGraph(divID,data);
    forceLayoutGraph(divID,data);
}

function documentGraph(divName, data) {
    var div = document.getElementById(divName);

    var ul = document.createElement('ul');
    div.appendChild(ul);

    for (var i = 0, ie = data.nodes.length; i < ie; ++i) {
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.appendChild(document.createTextNode(data.nodes[i].title));
        a.href = data.nodes[i].url;
        a.target="_blank";
        li.appendChild(a);

        var inul = document.createElement('ul');
        for( var j=0; j<data.nodes[i].innerLinks.length; j++ ) {
            var inli = document.createElement('li');
            inli.appendChild(document.createTextNode(data.nodes[i].innerLinks[j]));
            inul.appendChild(inli);
        }
        li.appendChild(inul);

        ul.appendChild(li);
    }
}

function bundleLayoutGraph(divID, data) {

    var div = d3.select("#"+divID);
    var width  = $("#"+divID).width();
    var height = $("#"+divID).height();
    var rx = width / 2;
    var ry = height / 2;
    var m0;
    var rotate = 0;

    var cluster = d3.layout.cluster()
    .size([360, ry - 120]);
            //.sort(function(a, b) { return d3.ascending(a.key, b.key); });

            var bundle = d3.layout.bundle();

            var line = d3.svg.line.radial()
            .interpolate("bundle")
            .tension(0.5)
            .radius(function(d) { return d.y; })
            .angle(function(d) { return d.x / 180 * Math.PI; });

            var svg = div.append("svg:svg")
            //.attr("width", width)
            //.attr("height", height)
            .append("svg:g")
            .attr("transform", "translate(" + rx + "," + ry + ")");
        //.attr("transform", "translate(" + radius + "," + radius + ")");

        svg.append("svg:path")
        .attr("class", "arc")
        .attr("d", d3.svg.arc().outerRadius(ry - 120).innerRadius(0).startAngle(0).endAngle(2 * Math.PI))
        .on("mousedown", mousedown);

        var nodes = cluster.nodes({children:data.nodes});
        var links = map(nodes, data.links);
        var splines = bundle(links);

        var path = svg.selectAll("path.link")
        .data(links)
        .enter().append("svg:path")
        .attr("class", function(d) { return "link source-" + d.source.key + " target-" + d.target.key; })
        .attr("d", function(d, i) { return line(splines[i]); });

        svg.selectAll("g.node")
        .data(nodes.filter(function(n) { return !n.children; }))
        .enter().append("svg:g")
        .attr("class", "node")
        .attr("id", function(d) { return "node-" + d.key; })
        .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; })
        .append("svg:text")
        .attr("dx", function(d) { return d.x < 180 ? 8 : -8; })
        .attr("dy", ".31em")
        .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
        .attr("transform", function(d) { return d.x < 180 ? null : "rotate(180)"; })
        .text(function(d) { return d.title; })
        .on("mouseover", mouseover)
        .on("mouseout", mouseout);

        d3.select("input[type=range]").on("change", function() {
            line.tension(this.value / 100);
            path.attr("d", function(d, i) { return line(splines[i]); });
        });

        d3.select(window)
        .on("mousemove", mousemove)
        .on("mouseup", mouseup);

        function mouse(e) {
            return [e.pageX - rx, e.pageY - ry];
        }

        function mousedown() {
            m0 = mouse(d3.event);
            d3.event.preventDefault();
        }

        function mousemove() {
            if (m0) {
                var m1 = mouse(d3.event),
                dm = Math.atan2(cross(m0, m1), dot(m0, m1)) * 180 / Math.PI;
                div.style("-webkit-transform", "rotate3d(0,0,0," + dm + "deg)");
            }
        }

        function mouseup() {
            if (m0) {
                var m1 = mouse(d3.event),
                dm = Math.atan2(cross(m0, m1), dot(m0, m1)) * 180 / Math.PI;

                rotate += dm;
                if (rotate > 360) rotate -= 360;
                else if (rotate < 0) rotate += 360;
                m0 = null;

                div.style("-webkit-transform", "rotate3d(0,0,0,0deg)");

                svg.attr("transform", "translate(" + rx + "," + ry + ")rotate(" + rotate + ")")
                .selectAll("g.node text")
                .attr("dx", function(d) { return (d.x + rotate) % 360 < 180 ? 8 : -8; })
                .attr("text-anchor", function(d) { return (d.x + rotate) % 360 < 180 ? "start" : "end"; })
                .attr("transform", function(d) { return (d.x + rotate) % 360 < 180 ? null : "rotate(180)"; });
            }
        }

        function mouseover(d) {
            svg.selectAll("path.link.target-" + d.key)
            .classed("target", true)
            .each(updateNodes("source", true));

            svg.selectAll("path.link.source-" + d.key)
            .classed("source", true)
            .each(updateNodes("target", true));
        }

        function mouseout(d) {
            svg.selectAll("path.link.source-" + d.key)
            .classed("source", false)
            .each(updateNodes("target", false));

            svg.selectAll("path.link.target-" + d.key)
            .classed("target", false)
            .each(updateNodes("source", false));
        }

        function updateNodes(name, value) {
            return function(d) {
                if (value) this.parentNode.appendChild(this);
                svg.select("#node-" + d[name].key).classed(name, value);
            };
        }

        function cross(a, b) {
            return a[0] * b[1] - a[1] * b[0];
        }

        function dot(a, b) {
            return a[0] * b[0] + a[1] * b[1];
        }

        function map(nodes, linkData){
          var hash = {};
          var i,len;
          for(i = 0, len = nodes.length; i<len; i++){
           if(nodes[i].parent === null){continue;}
           hash[nodes[i].key] = nodes[i];
       }

       var links = [];
       for(i = 0; i<linkData.length; i++){
           links.push({source:hash[linkData[i].source], target:hash[linkData[i].target]});
       }
       return links;
   }
}


function forceLayoutGraph(divID, data) {
    var nodes = data.nodes;
    var links = data.links;

    var width  = $("#"+divID).width();
    var height = $("#"+divID).height();

    var color = d3.scale.category20();

    var force = d3.layout.force()
    .charge(-120)
    .linkDistance(30)
    .size([width, height]);

    var svg = d3.select("#"+divID).append("svg")
    .attr("width", width)
    .attr("height", height);

    force.nodes(nodes)
    .links(links)
    .start();

    var link = svg.selectAll("line.link")
    .data(links)
    .enter().append("line")
    .attr("class", "link")
    .style("stroke-width", 1);
            //.style("stroke-width", function(d) { return Math.sqrt(d.value); });

            var node = svg.selectAll("circle.node")
            .data(nodes)
            .enter().append("circle")
            .attr("class", "node")
            .attr("r", 5)
            .style("fill", function(d) { return color(d.group); })
            .call(force.drag);

            node.append("title")
            .text(function(d) { return d.title; });

            force.on("tick", function() {
                link.attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });

                node.attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; });
            });
        }

        function splitWikipediaTitle(uri) {
            return uri.split("/wiki/")[1].split("#")[0];
        }

        function decodeWikipediaTitle(uri) {
            var title = splitWikipediaTitle(uri);
            return decodeURI(title);
        }



// Search history
function buildWikipediaHistoryList(divName) {
    var microsecondsPerWeek = 1000 * 60 * 60 * 24 * 7;
    var oneWeekAgo = (new Date).getTime() - microsecondsPerWeek;
    var oneMonthAgo = (new Date).getTime() - microsecondsPerWeek*5;

    var numRequestsOutstanding = 0;

    var data;
    var nodes = [];
    var links = [];

    var resultsNum = 100;
    var startTime = (new Date).getTime() - microsecondsPerWeek*10;
    //var resultsNum = 10000;
    if(testData){
        resultsNum = 1;
    }

    chrome.history.search(
    {
        'text': '',
        'startTime': startTime,
        'maxResults': resultsNum
    },
    function(historyItems) {

        var wikipediaHistoryUrls = [];

        for (var i = 0; i < historyItems.length; ++i) {
            var url = historyItems[i].url;
            if ( url.indexOf(wikipediaUrl) != -1 ) {
                if( decodeWikipediaTitle(url).indexOf(":") == -1 ) {
                    wikipediaHistoryUrls.push(historyItems[i].url);
                }
            }
        }

        var n = 0;

        var getWikipediaDataFunc = function(){


            if( !(n<wikipediaHistoryUrls.length) ){
                writeStatusMessage("making graph...");
                setTimeout( analyzeGraph,0);
                return;
            }


            var url = wikipediaHistoryUrls[n];
            var title = decodeWikipediaTitle(url);
            var innerLinks = [];

            if(true){
                var text;
                $.ajax({
                    type: "GET",
                    url: wikipediaExportUrl+splitWikipediaTitle(url),
                    dataType: "xml",
                    ifModified:true,
                    async: false,
                    success: function(xml) {
                        text = eval($(xml).find("text")).text();
                    }
                });

                var tmpLinks = text.match(/\[\[[^:]+?\]\]/g);
                for( var i = 0; i < tmpLinks.length; i++ ) {
                    innerLinks.push( tmpLinks[i].split("[[")[1].split("]]")[0].split("|")[0] );
                }

            }else{
                var alllinks;
                $.ajax({
                    type: "GET",
                    url: url,
                    dataType: "html",
                    ifModified:true,
                    async: false,
                    success: function(data) {
                        alllinks = $("#mw-content-text a", data);
                    }
                });
                for( var j = 0; j < alllinks.length; j++ ) {
                    var href = alllinks.eq(j).attr("href");
                    if(href.indexOf("/wiki/") != -1) {
                        innerLinks.push(decodeWikipediaTitle(href));
                    }
                }
            }

            nodes.push( {key:nodes.length, title:title, group:1,  url:url, innerLinks: innerLinks} );

            n++;
            writeStatusMessage("getting data... (" + (n+1)  + "/" + wikipediaHistoryUrls.length + ")");
            setTimeout(getWikipediaDataFunc,0);
        };

        var analyzeGraph = function(){
            for( var i=0; i<nodes.length; i++ ) {
                for( var j=0; j<nodes[i].innerLinks.length; j++ ) {
                    for( var k=0; k<nodes.length; k++ ) {
                        if( nodes[i].innerLinks[j] == nodes[k].title ) {
                            links.push( {source:nodes[i].key, target:nodes[k].key} );
                                //links.push( {source:i, target:k );
                                }
                            }
                        }
                    }

                    chrome.storage.local.get('data', function(olddata){
                    //alert(data.nodes[0].title);
                    var newdata = {nodes:nodes,links:links};
                    var data;
                    if(olddata){
                        //data = olddata.merge(newdata);
                    }else{
                        //data = newdata;
                    }
                    data = newdata;
                    alert(data.nodes[0].title);
                    writeStatusMessage("saving data...");
                    chrome.storage.local.set({'data':'data','lastCheckTime': (new Date).getTime()},function(){
                        writeStatusMessage("");
                    });
                    drawGraph(divName,data);
                    writeStatusMessage("");
                });
                /*
                var newdata = {nodes:nodes,links:links};
                data.merge(newdata);
                chrome.storage.local.set({'data':data,'lastCheckTime': (new Date).getTime()},function(){
                    writeStatusMessage("saving data...");
                });
                drawGraph(divName,data);
                writeStatusMessage("");
                */
            };

            writeStatusMessage("getting data... (" + (n+1)  + "/" + wikipediaHistoryUrls.length + ")");
            setTimeout(getWikipediaDataFunc,0);

        }
        );
}

function writeStatusMessage(msg) {
    $("#"+statusMessageId).html(msg);
}


$(document).ready(function() {
    buildWikipediaHistoryList("maincontent");
});

