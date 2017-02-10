require('../css/styles.scss')
var $ = require('jquery')
var d3 = require('d3')
var _ = require('underscore')
var topojson = require('topojson')

// vr view

$("#all-spills-viz").append("<div class='tip'></div>");
$(".tip").hide();

var windowWidth = $(window).width(),
windowHeight = 160,
margin = {top: 30, bottom: 30, left: 40, right: 40}

var width = $(window).width();
var height = (windowWidth>450)?400:500

windowWidth = (windowWidth>1200)?1200:windowWidth
// scrolly for the kkhh nav
 $(window).scroll(function() {
        var windscroll = $(window).scrollTop();
        var buffer = 50
        var scrollbuffer = 150
        if ($('.copy-container').position().top <= windscroll + buffer ) {
            if (!$('.progress-nav').hasClass('fixed')){
                $('.progress-nav').addClass('fixed')
                $('.copy-container').addClass('gap')
            }

            $('.section-container').each(function(i) {
                if ($(this).position().top <= windscroll &&  $('.copy-container').hasClass('gap')) {
                    $('.s-dot.active').removeClass('active');
                    $('.s-dot').eq(i).addClass('active');
                    var progress = (windscroll + (buffer*3) - $(this).position().top)/($(this).height())
                   
                    if (progress<=100){
                        var comp = i*25 + (progress*25)+"%"
                        $('.progress').width(comp)
                    }
                }
            })

        } else {
            $('.progress-nav').removeClass('fixed')
            $('.copy-container').removeClass('gap')
            $('.progress').width('0%')
        }
}).scroll();


// d3 viz for all spills
d3.csv('data/all-oil-spills.csv',function(error,data){

    var yearlist = [];
    for (var i = 1982; i <= d3.max(data,function(e){return e.year}); i++) {
        yearlist.push(i);
    }

    var yearnest = d3.nest()
                    .key(function(d) { return d.year; })
                    .entries(data);

    var x = d3.scaleBand()
        .domain(yearlist)
        .range([0, (windowWidth-margin.left-margin.right)])
        .padding([0.4]);

    var y =  d3.scaleLinear() 
        .domain([d3.max(yearnest,function(e){return e.values.length}),0])
        .range([0, (windowHeight-margin.top-margin.bottom)]);

    var blockheight = 10

    var xAxis = d3.axisBottom()
    .scale(x)

        xAxis.tickValues([1982, 1990, 2000 ,2010, 2017])
        .tickFormat(function(e){
            if (e>1982 && e!=2000 && e!=2017){
                return "'"+(e).toString().slice(-2);
            }else {return e}
         
    })
     if (windowWidth<800){
        var box_width = Math.floor(0.85*windowWidth)
    }   else {
        var box_width = Math.floor(0.6*windowWidth)
    }

    var svg = d3.select('#all-spills-viz')
        .append('svg')
        .attr('class','chart-container')
        .attr('width',windowWidth)
        .attr('height',windowHeight)


    svg.append('g')
        .attr('class','chart-container-g')
        .attr('width',windowWidth - margin.left - margin.right)
        .attr('height',windowHeight - margin.top - margin.bottom)
        .attr('transform','translate('+margin.left+','+0+')')
        .append('g')
        .attr('class','chart')
        .selectAll('rect')
        .data(data)
        .enter()
        .append('rect')
        .attr('class',function(d,i){return 'spill s-'+i })
        .attr('x', function(d) { return x(+d['year']) })
        .attr('y', function(d) { 
            var obj = _.findWhere(yearnest, {key:d['year']})
            return y(obj.values.getIndexBy("spilled_by", d.spilled_by))
        })
        .attr('width', x.bandwidth())
        .attr('height', blockheight)
        .style('fill',function(d){return getColor(d.quantity)})
        .on("mouseover", tipOn)
        .on("mouseout", tipOff);
// x axis
d3.selectAll('.chart-container-g')
        .append('g')
        .attr("class", "x axis")
      .attr("transform", "translate(0,"+ (windowHeight-margin.top-(margin.bottom/2)) +")")
      .call(xAxis)

      // tooltips
svg.on("mouseout", function(){
  $(".tip").hide()
});

 function tipOn(d, i){

      var dat = d;
    var elem = ".spill.s-" + i;
      $(".tip").empty();

      // show
      $(".tip").show();
      $(".spill").removeClass("highlight");
      $(elem).addClass("highlight");
      // populate
      $(".tip").append("<div class='name'>" + dat.spilled_by + "</div>");
      $(".tip").append("<div class='date'>" + dat.date + "</div>");
      $(".tip").append("<div class='location'><b>Location:</b> " + dat.location + "</div>");
      $(".tip").append("<div class='quantity'><b>Quantity:</b> " + (dat.quantity.match(/[0123456789]/g)?dat.quantity+" tonnes":"Unknown") + "</div>");

      var blockheight = 10
      // position

      // calculate top
      function calcTop(d){
        var obj = _.findWhere(yearnest, {key:d['year']})
        var y2 =  y(obj.values.getIndexBy("spilled_by", d.spilled_by))
        var h = $(".tip").height();
        var ot = $("svg").offset().top;
        var st = $(window).scrollTop();
        var r = blockheight*3.5;
        var t = y2 - r - h + ot - st + 10 ;

        if (t < 40){
          t = y2 + (h/2.7) + ot - st + 10;
          $(".tip").addClass("bottom").removeClass("top");
        } else {
          $(".tip").addClass("top").removeClass("bottom");
        }
        return t;
      }

      function calcLeft(d){
        var x2 = x(d.year);
        var r = x.bandwidth()/2;
        var w = $(".tip").width();
        var l = x2 - w / 2 + r;
        var m = ($(window).width()>1200 ? 0 : margin.left-r)
        return x2-r-m;
      }

      $(".tip").css({
        top: calcTop(dat),
        left: calcLeft(dat)
      });

      $(window).resize(function(){
        $(".tip").css({
          top: calcTop(dat),
          left: calcLeft(dat)
        });
      });
    }

    function tipOff(d){
      $(".spill").removeClass("highlight");
    }

})

Array.prototype.getIndexBy = function (name, value) {
    for (var i = 0; i < this.length; i++) {
        if (this[i][name] == value) {
            return i;
        }
    }
    return -1;
}

function getColor(e){
    if (!e.match(/[0-9]/)){
        return "#bbb"
    } else if (+e < 700){
        return "#EBD1D0"
    } else if (+e < 10000){
        return "#D5A1A0"
    } else {
        return "#AD4746"
    }
}

d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};
d3.selection.prototype.moveToBack = function() {
    return this.each(function() {
        var firstChild = this.parentNode.firstChild;
        if (firstChild) {
            this.parentNode.insertBefore(this, firstChild);
        }
    });
};

// maps
// var zoom = d3.zoom()
//     .scaleExtent([1, 30])
//     .on("zoom", move);

// var projection = d3.geoMercator();

// function zoomTo(location, scale) {
//     var point = projection(location);
//     console.log(zoom.translate.x)
//     return [zoom.translate.x(width / 2 - point[0] * scale), zoom.translate.y(height / 2 - point[1] * scale)].scaleBy(scale);
// }

// function move() {
// var t = d3.event.translate,
//         s = d3.event.scale;
// t[0] = Math.min(width / 2 * (s - 1), Math.max(width / 2 * (1 - s), t[0]));
// t[1] = Math.min(height / 2 * (s - 1) + 230 * s, Math.max(height / 2 * (1 - s) - 230 * s, t[1]));
// zoom.translate(t);
// g.style("stroke-width", 1 / s).attr("transform", "translate(" + t + ")scale(" + s + ")");
// }



// var path = d3.geoPath()
//     .projection(projection)
//     .pointRadius(2);
// var map_g = d3.select("#big-map")
//         .append('svg')
//         .attr('height',height)
//         .attr('width',width)
//         .append('g')

//  map_g.transition().call(zoomTo([13.0827, 80.2707], 4).event);
// d3.json("data/new-map.json", function(error, data){
    
//         var boundary = centerZoom(data);
//         drawSubUnits(data);
//         drawOuterBoundary(data, boundary);
//       function centerZoom(data){

//   var o = topojson.mesh(data, data.objects['Admin2'], function(a, b) { return a === b; });

//   projection
//       .scale(1)
//       .translate([0, 0]);

//   var b = path.bounds(o),
//       s = 1 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height),
//       t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];

//   projection
//       .scale(s)
//       .translate(t);

//   return o;
// }



// function drawOuterBoundary(data, boundary){
//   map_g.append("path")
//       .datum(boundary)
//       .attr("d", path)
//       .attr("class", "subunit-boundary");
// }

// function drawSubUnits(data){
//   map_g.selectAll(".subunit")
//       .data(topojson.feature(data, data.objects['Admin2']).features)
//     .enter().append("path")
//       .attr("class", function(d){ return "subunit " })
//       .attr("d", path);
// }


            // g.append('g')
            //     .attr('class','marker-layer')
            //     .selectAll('#'+id+' .marker')
            //     .data(function(d){
                    
            //     })
            //     .enter()
            //     .append('circle')
            //     .attr("r", 6)
            //     .style('fill',function(d){return color[d.year]})
            //     .attr('transform',function(d){return 'translate('+projection([d.lng,d.lat])+")"})
            //     .attr('class','marker')

        // g.append("path")
        // .datum(topojson.feature(data, data.objects['p'+id.split('id')[1]]))
        // .attr("d", pathf);

                // g.selectAll(".place-label-bg")
                //     .data(topojson.feature(data, data.objects['p'+id.split('id')[1]]).features)
                //   .enter()
                //     .append("text")
                //     .text('')
                //     .attr("class", function(d){if (d.properties.description=="optional"){return "place-label optional"}else{return "place-label"}})
                //     .attr("transform", function(d) { return "translate(" + projection(d.geometry.coordinates) + ")"; })
                //     .attr("dy", "0.1em")
                //     .attr("x", 5)
                //     .style("text-anchor", "start")
                //     .tspans( function(d){return d3.wordwrap(d.properties['Name'], 10)},"1em") //wrap after 20 char
// })

// function transition(id,path) {
//         d3.selectAll('#'+id+' .marker')
//             .transition()
//             .duration(function(d){return d.time*60*1000*timefactor})
//             .attrTween("transform", translateAlong(path.node()))
// }
  
// function translateAlong(path) {
// var l = path.getTotalLength();
// return function(i) {
//   return function(t) {
//     var p = path.getPointAtLength(t * l);
//     return "translate(" + p.x + "," + p.y + ")";//Move marker
//   }
// }

