require('../css/styles.scss')
var $ = require('jquery')
var d3 = require('d3')
var _ = require('underscore')

var windowWidth = $(window).width(),
windowHeight = 160,
margin = {top: 30, bottom: 30, left: 40, right: 40}

// scrolly for the kkhh nav
 $(window).scroll(function() {
        var windscroll = $(window).scrollTop();
        var buffer = 50
        if ($('.copy-container').position().top <= windscroll + buffer ) {
            if (!$('.progress-nav').hasClass('fixed')){
                $('.progress-nav').addClass('fixed')
                $('.copy-container').addClass('gap')
            }

            $('.section-container').each(function(i) {
                if ($(this).position().top <= windscroll + buffer   ) {
                    $('.s-dot.active').removeClass('active');
                    $('.s-dot').eq(i).addClass('active');
                    var progress = (windscroll - $(this).position().top)/($(this).height())
                   
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

    d3.select('#all-spills-viz')
        .append('svg')
        .attr('class','chart-container')
        .attr('width',windowWidth)
        .attr('height',windowHeight)
        .append('g')
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
        .attr('class','spill')
        .attr('x', function(d) { return x(+d['year']) })
        .attr('y', function(d) { 
            var obj = _.findWhere(yearnest, {key:d['year']})
            return y(obj.values.getIndexBy("spilled_by", d.spilled_by))
        })
        .attr('width', x.bandwidth())
        .attr('height', blockheight)
        .style('fill',function(d){return getColor(d.quantity)})
        .on('click',function(e,i){console.log(e,i)})
// x axis
    d3.selectAll('.chart-container-g')
            .append('g')
            .attr("class", "x axis")
          .attr("transform", "translate(0,"+ (windowHeight-margin.top-(margin.bottom/2)) +")")
          .call(xAxis)

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
        return "#ccc"
    } else if (+e < 700){
        return "#fee0d2"
    } else if (+e < 10000){
        return "#fc9272"
    } else {
        return "#de2d26"
    }
}

function getSection(){
    $('section')
}