// Parallel graph
var width = document.body.clientWidth,
    height = d3.max([document.body.clientHeight-540, 240]);

var m = [60, 0, 10, 0],
    w = width - m[1] - m[3],
    h = height - m[0] - m[2],
    xScale,
    yScale = {},
    dragging = {},
    axis = d3.axisLeft().ticks(1+height/50),
    data,
    selected,
    foreground,
    background,
    highlighted,
    legend,
    render_speed = 50,
    brush_count = 0,
    age_range,
    value_range,
    wage_range,
    reputation_range,
    nationality_filter = null,
    club_filter = null,
    position_filter = null,
    selected_player = null,
    his_pos = null;

// Subgraphs
var graph_margin = {top: 30, right: 20, bottom: 40, left: 40},
    graph_w = 350 - graph_margin.left - graph_margin.right,
    graph_h = 350 - graph_margin.top - graph_margin.bottom;

var wageScale,
    valueScale,
    ratingScale,
    wageAxis,
    valueAxis,
    ratingAxis,
    wageDynamic,
    valueDynamic,
    wageRatingDynamic,
    valueRatingDynamic;

// Tooltip for hovering
var tooltip = d3.select("body")
    .append("div")
    .style("position", "absolute")
    .style("z-index", "10")
    .style("visibility", "hidden")
    .style("background","#e2e2e2")
    .text("playername");

var colors = {
  "LS": [185,56,73],
  "ST": [37,50,75],
  "RS": [325,50,39], //
  "LW": [10,28,67],
  "LF": [271,39,57],
  "CF": [56,58,73],
  "RF": [28,100,52],
  "RW": [41,75,61], //
  "LAM": [60,86,61],
  "CAM": [30,100,73],
  "RAM": [318,65,67], //
  "LM": [274,30,76],
  "LCM": [20,49,49],
  "CM": [334,80,84],
  "RCM": [185,80,45],
  "RM": [10,30,42], //
  "LWB": [339,60,49],
  "LDM": [359,69,49],
  "CDM": [204,70,41],
  "RDM": [1,100,79],
  "RWB": [189,57,75], //
  "LB": [110,57,70],
  "LCB": [214,55,79],
  "CB": [339,60,75],
  "RCB": [120,56,40],
  "RB": [10,100,0],//
  "GK": [120,40,25]
};

var dimensions = [
  "Overall",
  "PAC",
  "SHO",
  "PAS",
  "DRI",
  "DEF",
  "PHY",
  "Potential"
];

// SVGs for sub graphs
d3.select("#wage-svg")
  .attr("width",graph_w + graph_margin.left + graph_margin.right)
  .attr("height",graph_h + graph_margin.top + graph_margin.bottom);

d3.select("#value-svg")
  .attr("width",graph_w + graph_margin.left + graph_margin.right)
  .attr("height",graph_h + graph_margin.top + graph_margin.bottom);


var svg_wage = d3.select("#wage-svg")
                 .append("g")
                 .attr("transform", "translate(" + graph_margin.left + "," + graph_margin.top + ")");

var svg_value = d3.select("#value-svg")
                   .append("g")
                   .attr("transform", "translate(" + graph_margin.left + "," + graph_margin.top + ")");

// Scale chart and canvas height
d3.select("#parallel")
    .style("height", (h + m[0] + m[2]) + "px");

d3.selectAll("canvas")
    .attr("width", w)
    .attr("height", h)
    .style("padding", m.join("px ") + "px");


// Foreground canvas for primary view
foreground = document.getElementById('foreground').getContext('2d');
foreground.globalCompositeOperation = "destination-over";
foreground.strokeStyle = "rgba(0,100,160,0.1)";
foreground.lineWidth = 1.7;
foreground.fillText("Loading...",w/2,h/2);

// Highlight canvas for temporary interactions
highlighted = document.getElementById('highlight').getContext('2d');
highlighted.strokeStyle = "rgba(0,100,160,1)";
highlighted.lineWidth = 4;

// Background canvas
background = document.getElementById('background').getContext('2d');
background.strokeStyle = "rgba(0,100,160,0.1)";
background.lineWidth = 1.7;

// SVG for ticks, labels, and interactions
var svg = d3.select("#svg-parallel")
    .attr("width", w + m[1] + m[3])
    .attr("height", h + m[0] + m[2])
  .append("svg:g")
    .attr("transform", "translate(" + m[3] + "," + m[0] + ")");

// Load the data and visualization
d3.csv("data/fifadata.csv").then(function(raw_data) {
  // Convert quantitative scales to floats
  raw_data.forEach(function(d) {
    d.Age = +d.Age;
    d.Overall	= +d.Overall;
    d.Potential = +d.Potential;
    d.Value_M = +d.Value_M;
    d.Wage_K = +d.Wage_K;
    d.Int_Reputation = +d.Int_Reputation;
    d.Jersey_Number = +d.Jersey_Number;
    d.PAC = +d.PAC;
    d.SHO = +d.SHO;
    d.PAS = +d.PAS;
    d.DRI = +d.DRI;
    d.DEF = +d.DEF;
    d.PHY = +d.PHY;
  });
  data = raw_data;

  // Create xScale
  xScale = d3.scalePoint()
         .range([0, w])
         .padding(1)
         .domain(dimensions);

  // Create yScale
  for (i in dimensions) {
    name = dimensions[i]
    yScale[name] = d3.scaleLinear()
                    .domain(d3.extent(data, function(d) {return +d[name];}))
                    .range([h, 0])
  }

  // Add a group element for each dimension.
  var g = svg.selectAll(".dimension")
      .data(dimensions)
      .enter().append("svg:g")
        .attr("class", "dimension")
        .attr("transform", function(d) { return "translate(" + xScale(d) + ")"; })

  // Add an axis and title.
  g.append("svg:g")
      .attr("class", "axis")
      .attr("transform", "translate(0,0)")
      .each(function(d) { d3.select(this).call(axis.scale(yScale[d])); })
    .append("svg:text")
      .attr("text-anchor", "middle")
      .attr("y", function(d,i) { return  -14} )
      .attr("x", 0)
      .attr("class", "label")
      .text(String)

  // Add and store a brush for each axis.
  g.append("svg:g")
      .attr("class", "brush")
      .attr("id",function(d) {return "brush-" + d;})
      .each(function(d) {
        d3.select(this).call(d3.brushY()
                            .extent([[-30, yScale[d].range()[1]], [+30, yScale[d].range()[0]]])
                            .on("end", brush));
      })
    .selectAll("rect")
      .style("visibility", null)
      .attr("x", -23)
      .attr("width", 36)
      .append("title")
        .text("Drag up or down to brush along this axis");

  g.selectAll(".extent")
      .append("title")
        .text("Drag or resize this filter");

  legend = create_legend(colors,brush);

  // Create Sliders
  age_range = d3.extent(data, function(d) {return +d["Age"];});
  value_range = d3.extent(data, function(d) {return +d["Value_M"];});
  wage_range = d3.extent(data, function(d) {return +d["Wage_K"];});
  reputation_range = d3.extent(data, function(d) {return +d["Int_Reputation"];});

  $( function() {
      $("#age-slider-range" ).slider({
          range: true,
          min: age_range[0],
          max: age_range[1],
          values: [ age_range[0], age_range[1]],
          slide: function( event, ui ) {
            $( "#age" ).val( ui.values[ 0 ] + " - " + ui.values[ 1 ] );
            age_range[0] = ui.values[0];
            age_range[1] = ui.values[1];
            brush();
          }
      });
      $( "#age" ).val( $( "#age-slider-range" ).slider( "values", 0 ) +
        " - " + $( "#age-slider-range" ).slider( "values", 1));
  });

  $( function() {
      $("#wage-slider-range" ).slider({
          range: true,
          min: wage_range[0],
          max: wage_range[1],
          values: [ wage_range[0], wage_range[1]],
          slide: function( event, ui ) {
            $( "#wage" ).val( "€" + ui.values[ 0 ] + "k - €" + ui.values[ 1 ] + "k" );
            wage_range[0] = ui.values[0];
            wage_range[1] = ui.values[1];
            wageScale.domain(wage_range);
            wageAxis.scale(wageScale);
            wageDynamic.call(wageAxis);
            brush();
          }
      });
      $( "#wage" ).val( "€" + $( "#wage-slider-range" ).slider( "values", 0 ) +
        "k - €" + $( "#wage-slider-range" ).slider( "values", 1) + "k");
  });


  $( function() {
      $("#value-slider-range" ).slider({
          range: true,
          min: value_range[0],
          max: value_range[1],
          values: [ value_range[0], value_range[1]],
          slide: function( event, ui ) {
            $( "#value" ).val( "€" + ui.values[ 0 ] + "M - €" + ui.values[ 1 ] + "M");
            value_range[0] = ui.values[0];
            value_range[1] = ui.values[1];
            valueScale.domain(value_range);
            valueAxis.scale(valueScale);
            valueDynamic.call(valueAxis);
            brush();
          }
      });
      $( "#value" ).val( "€" + $( "#value-slider-range" ).slider( "values", 0 ) +
        "M - €" + $( "#value-slider-range" ).slider( "values", 1) + "M");
  });

  $( function() {
      $("#reputation-slider-range" ).slider({
          range: true,
          min: reputation_range[0],
          max: reputation_range[1],
          values: [ reputation_range[0], reputation_range[1]],
          slide: function( event, ui ) {
            $( "#reputation" ).val( ui.values[ 0 ] + " - " + ui.values[ 1 ] );
            reputation_range[0] = ui.values[0];
            reputation_range[1] = ui.values[1];
            brush();
          }
      });
      $( "#reputation" ).val( $( "#reputation-slider-range" ).slider( "values", 0 ) +
        " - " + $( "#reputation-slider-range" ).slider( "values", 1));
  });

  // Create select filters
  nations = d3.map(data, function(d){return(d.Nationality)}).keys().sort();
  clubs = d3.map(data, function(d){return(d.Club)}).keys().sort();
  positions = Object.keys(colors);

  $.each(nations, function (i, nation) {
      $('#nationality').append($('<option>', {
          value: nation,
          text : nation
      }));
  });

  $.each(clubs, function (i, club) {
      $('#club').append($('<option>', {
          value: club,
          text : club
      }));
  });

  $.each(positions, function (i, position) {
      $('#position').append($('<option>', {
          value: position,
          text : position
      }));
  });

  $('#nationality').selectize({
            create: false,
            sortField: {
              field: 'text',
              direction: 'asc'
            },
            dropdownParent: 'body',
            onChange: function(value) {
              nationality_filter = value;
              brush();
            }
          });

  $('#club').selectize({
            create: false,
            sortField: {
              field: 'text',
              direction: 'asc'
            },
            dropdownParent: 'body',
            onChange: function(value) {
              club_filter = value;
              brush();
            }
          });

  $('#position').selectize({
            create: false,
            dropdownParent: 'body',
            onChange: function(value) {
              position_filter = value;
              brush();
            }
          });

  wageScale = d3.scaleLinear()
            .domain(wage_range)
            .range([0, graph_w]);

  valueScale = d3.scaleLinear()
            .domain(value_range)
            .range([0, graph_w]);

  ratingScale = d3.scaleLinear()
            .domain(d3.extent(data, function(d) {return +d["Overall"];}))
            .range([graph_h, 0]);

  // Add wage axis
  wageAxis = d3.axisBottom().scale(wageScale);
  wageDynamic = svg_wage.append("g").attr("transform","translate(" + 0 + "," + graph_h + ")").call(wageAxis);
  svg_wage.append("text")
      .attr("transform",
            "translate(" + (graph_w/2) + " ," +
                           (graph_h + graph_margin.top + 7) + ")")
      .style("text-anchor", "middle")
      .text("Wage € - k");

  // Add value axis
  valueAxis = d3.axisBottom().scale(valueScale);
  valueDynamic = svg_value.append("g").attr("transform","translate(" + 0 + "," + graph_h + ")").call(valueAxis);
  svg_value.append("text")
      .attr("transform",
            "translate(" + (graph_w/2) + " ," +
                           (graph_h + graph_margin.top + 7) + ")")
      .style("text-anchor", "middle")
      .text("Contract Value € - M");

  // Add y axis
  ratingAxis = d3.axisLeft().scale(ratingScale);
  wageRatingDynamic = svg_wage.append("g").call(ratingAxis);
  svg_wage.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - graph_margin.left)
    .attr("x",0 - (graph_h / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("Overall Rating");

  valueRatingDynamic = svg_value.append("g").call(ratingAxis);
  svg_value.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - graph_margin.left)
    .attr("x",0 - (graph_h / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("Overall Rating");

  // Render full foreground
  brush();

});


function create_legend(colors,brush) {
  // create legend
  var legend_data = d3.select("#legend")
    .html("")
    .selectAll(".legrow")
    .data( _.keys(colors))//.sort() )

  // filter by group
  var legend = legend_data
    .enter().append("div")
      .attr("title", "Hide group");

  legend
    .append("span")
    .style("background", function(d,i) { return color(d,0.85)})
    .attr("class", "color-bar");

  legend
    .append("span")
    .attr("class", "tally")
    .text(function(d,i) { return 0});

  legend
    .append("span")
    .text(function(d,i) { return " " + d});

  return legend;
}


function position(d) {
    var v = dragging[d];
    return v == null ? xScale(d) : v;
}


function brush() {
  brush_count++;
  var actives = dimensions.filter(function(p) { return d3.brushSelection(d3.select("#brush-"+p).node()) !== null; }),
      extents = actives.map(function(p) {
                            var arr = d3.brushSelection(d3.select("#brush-"+p).node());
                            return [yScale[p].invert(arr[0]),yScale[p].invert(arr[1])]
                            });

  // bold dimensions with label
  d3.selectAll('.label')
    .style("font-weight", function(dimension) {
      if (_.include(actives, dimension)) return "bold";
      return null;
    });

  if (selected_player !== null) {
    d3.selectAll("#"+"dot"+selected_player)
      .attr("fill",color(his_pos,0.75))
      .attr("r",2);
    selected_player = null;
    his_pos = null;
    removePlayer();
  }

  // Get lines within extents
  selected = [];
  data
    .filter(function(d) {
      return d.Age >= age_range[0] && d.Age <= age_range[1] &&
            d.Wage_K >= wage_range[0] && d.Wage_K <= wage_range[1] &&
            d.Value_M >= value_range[0] && d.Value_M <= value_range[1] &&
            d.Int_Reputation >= reputation_range[0] && d.Int_Reputation <= reputation_range[1];
    })
    .filter(function(d) {
      if (nationality_filter === null) {
        return true;
      } else {
        return _.contains(nationality_filter, d.Nationality);
      }
    })
    .filter(function(d) {
      if (club_filter === null) {
        return true;
      } else {
        return _.contains(club_filter, d.Club);
      }
    })
    .filter(function(d) {
      if (position_filter === null) {
        return true;
      } else {
        return _.contains(position_filter, d.Position);
      }
    })
    .map(function(d) {
      return actives.every(function(p, dimension) {
        return extents[dimension][1] <= d[p] && d[p] <= extents[dimension][0];
      }) ? selected.push(d) : null;
    });

  if (selected.length < data.length && selected.length > 0) {
    d3.select("#keep-data").attr("disabled", null);
    d3.select("#exclude-data").attr("disabled", null);
  } else {
    d3.select("#keep-data").attr("disabled", "disabled");
    d3.select("#exclude-data").attr("disabled", "disabled");
  };

  // total by field position
  var tallies = _(selected)
    .groupBy(function(d) { return d.Position; })

  // include empty field positions
  _(colors).each(function(v,k) { tallies[k] = tallies[k] || []; });

  legend
    .attr("class", function(d) {
      return (tallies[d].length > 0)
           ? "legrow"
           : "legrow off";
    });

  legend.selectAll(".color-bar")
    .style("width", function(d) {
      return Math.ceil(600*tallies[d].length/selected.length) + "px"
    });

  legend.selectAll(".tally")
    .text(function(d,i) { return tallies[d].length });

  // Render selected lines
  paths(selected, foreground, brush_count, true);

  //Render wage and value graphs
  ratingScale.domain(d3.extent(selected, function(d) {return +d["Overall"];}))
  ratingAxis.scale(ratingScale);
  wageRatingDynamic.call(ratingAxis);
  valueRatingDynamic.call(ratingAxis);


  wageScale.domain(d3.extent(selected, function(d) {return +d["Wage_K"];}));
  wageAxis.scale(wageScale);
  wageDynamic.call(wageAxis);

  valueScale.domain(d3.extent(selected, function(d) {return +d["Value_M"];}));
  valueAxis.scale(valueScale);
  valueDynamic.call(valueAxis);


  var wage_select = svg_wage.selectAll("circle").data(selected,function(d) {return d.ID;}) ;

  wage_select.enter()
      .append("circle")
        .attr("cx", function(d)  {return wageScale(d.Wage_K); }) 
        .attr("cy", function(d)  {return ratingScale(d.Overall); })
        .attr("r", function(d,i) {return  i===selected_player ? 5 : 2;})
        .attr("fill",function(d,i) {return i===selected_player ? color(d.Position,1.00) : color(d.Position,0.75)})
        .attr("id",function(d,i) {return "dot"+i;})
        .on("click",function(d,i) {clickHandler(d,i);})
        .on("mouseover", function(d,i){hoverOnHandler(d,i);})
        .on("mouseout", function(d,i){hoverOffHandler(d,i);});
  wage_select.attr("cx", function(d) { return wageScale(d.Wage_K); }) 
             .attr("cy", function(d) { return ratingScale(d.Overall); })
             .attr("r", function(d,i) {return  i===selected_player ? 5 : 2;})
             .attr("fill",function(d,i) {return i===selected_player ? color(d.Position,1.00) : color(d.Position,0.75)});
             //.on("click",function(d,i) {clickHandler(d,i);})
             //.on("mouseover", function(d,i){hoverOnHandler(d,i);})
             //.on("mouseout", function(d,i){hoverOffHandler(d,i);});
  wage_select.exit().remove();

  var value_select = svg_value.selectAll("circle").data(selected,function(d) {return d.ID;}) ;
  value_select.enter()
      .append("circle")
        .attr("cx", function(d) { return valueScale(d.Value_M); }) 
        .attr("cy", function(d) { return ratingScale(d.Overall); })
        .attr("r", function(d,i) {return  i===selected_player ? 5 : 2;})
        .attr("id",function(d,i) {return "dot"+i;})
        .attr("fill",function(d,i) {return i===selected_player ? color(d.Position,1.00) : color(d.Position,0.75)})
        .on("click",function(d,i) {clickHandler(d,i);})
        .on("mouseover", function(d,i){hoverOnHandler(d,i);})
        .on("mouseout", function(d,i){hoverOffHandler(d,i);});
  value_select.attr("cx", function(d) { return valueScale(d.Value_M); }) 
              .attr("cy", function(d) { return ratingScale(d.Overall); })
              .attr("r", function(d,i) {return  i===selected_player ? 5 : 2;})
              .attr("fill",function(d,i) {return i===selected_player ? color(d.Position,1.00) : color(d.Position,0.75)});
              //.on("click",function(d,i) {clickHandler(d,i);})
              //.on("mouseover", function(d,i){hoverOnHandler(d,i);})
              //.on("mouseout", function(d,i){hoverOffHandler(d,i);});
  value_select.exit().remove();
}


function clickHandler(d,i) {
  if (i === selected_player) {
    selected_player = null;
    his_pos = null;
    d3.selectAll("#"+"dot"+selected_player)
      .attr("fill",color(d.Position,0.75))
      .attr("r",2);
    removePlayer();
  } else {
    if (selected_player !== null) {
      d3.selectAll("#"+"dot"+selected_player)
        .attr("fill",color(his_pos,0.75))
        .attr("r",2);
    }
    selected_player = i;
    his_pos = d.Position;
    d3.selectAll("#"+"dot"+i)
      .attr("fill",color(d.Position,1.00))
      .attr("r",5);
    updatePlayer(d);
  }
}

function hoverOnHandler(d,i) {
  tooltip
    .style("visibility","visible")
    .style("top",(d3.event.pageY-10)+"px")
    .style("left",(d3.event.pageX+10)+"px")
    .text(d.Name + "; " + d.Nationality + "; " + d.Club);
  d3.selectAll("#"+"dot"+i)
    .attr("r",5);
}

function hoverOffHandler(d,i) {
  if (i !== selected_player) {
    d3.selectAll("#"+"dot"+i)
      .attr("r",2);
  }
  tooltip
    .style("visibility", "hidden");
}

// render lines on canvas
function paths(selected, ctx, count) {
  var n = selected.length,
      i = 0,
      opacity = d3.min([2/Math.pow(n,0.3),1]),
      timer = (new Date()).getTime();

  shuffled_data = _.shuffle(selected);

  //data_table(shuffled_data.slice(0,25));

  ctx.clearRect(0,0,w+1,h+1);

  // render all lines until finished or a new brush event
  function animloop(){
    if (i >= n || count < brush_count) return true;
    var max = d3.min([i+render_speed, n]);
    render_range(shuffled_data, i, max, opacity);
    //render_stats(max,n,render_speed);
    i = max;
    timer = optimize(timer);  // adjusts render_speed
  };

  d3.timer(animloop);
}

// render polylines i to i+render_speed
function render_range(selection, i, max, opacity) {
  selection.slice(i,max).forEach(function(d) {
    path(d, foreground, color(d.Position,opacity));
  });
};

function path(d, ctx, color) {
  if (color) ctx.strokeStyle = color;
  ctx.beginPath();
  var x0 = xScale(0)-15,
      y0 = yScale[dimensions[0]](d[dimensions[0]]);   // left edge
  ctx.moveTo(x0,y0);
  dimensions.map(function(p,i) {
    var x = xScale(p),
        y = yScale[p](d[p]);
    var cp1x = x - 0.88*(x-x0);
    var cp1y = y0;
    var cp2x = x - 0.12*(x-x0);
    var cp2y = y;
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
    x0 = x;
    y0 = y;
  });
  ctx.lineTo(x0+15, y0);
  ctx.stroke();
};

// Adjusts rendering speed
function optimize(timer) {
  var delta = (new Date()).getTime() - timer;
  render_speed = Math.max(Math.ceil(render_speed * 30 / delta), 8);
  render_speed = Math.min(render_speed, 300);
  return (new Date()).getTime();
}

function color(d,a) {
  var c = colors[d];
  return ["hsla(",c[0],",",c[1],"%,",c[2],"%,",a,")"].join("");
}

function updatePlayer(d) {
  photo = d.Photo.substring(0,d.Photo.length-4) + "@2x.png";
  d3.select("#player-img").attr("src",photo);
  d3.select("#player-name").text(d.Name);
  d3.select("#player-nat-flag").attr("src",d.Flag);
  d3.select("#player-nat").text(d.Nationality);
  d3.select("#player-club-flag").attr("src",d.Club_Logo);
  d3.select("#player-club").text(d.Club);
  d3.select("#player-position").text("Position: " + d.Position);
  d3.select("#player-jersey").text("Jersey Number: " + d.Jersey_Number);
  d3.select("#player-bio").text("Age " + d.Age + ", " + d.Height + ", " + d.Weight);
  d3.select("#player-overall").text(d.Overall).style("background",getScoreColor(d.Overall));
  d3.select("#player-potential").text(d.Potential).style("background",getScoreColor(d.Potential));
  d3.select("#player-value").text("Value: €" + d.Value_M + " M");
  d3.select("#player-wage").text("Wage: €" + d.Wage_K + " k");
  d3.select("#player-rep").text("International Reputation: " + d.Int_Reputation);
  d3.select("#player-foot").text("Preferred foot: " + d.Preferred_Foot);
  d3.select("#player-body").text("Body type: " + d.Body_Type);
  d3.select("#player-pace").text(d.PAC).style("background",getScoreColor(d.PAC));
  d3.select("#player-shoot").text(d.SHO).style("background",getScoreColor(d.SHO));
  d3.select("#player-pass").text(d.PAS).style("background",getScoreColor(d.PAS));
  d3.select("#player-physical").text(d.PHY).style("background",getScoreColor(d.PHY));
  d3.select("#player-dribble").text(d.DRI).style("background",getScoreColor(d.DRI));
  d3.select("#player-defence").text(d.DEF).style("background",getScoreColor(d.DEF));
}

function removePlayer() {
  d3.select("#player-img").attr("src","");
  d3.select("#player-name").text("Select a player to display stats");
  d3.select("#player-nat-flag").attr("src","");
  d3.select("#player-nat").text("");
  d3.select("#player-club-flag").attr("src","");
  d3.select("#player-club").text("");
  d3.select("#player-position").text("");
  d3.select("#player-jersey").text("");
  d3.select("#player-bio").text("");
  d3.select("#player-overall").text("0").style("background","transparent");
  d3.select("#player-potential").text("0").style("background","transparent");
  d3.select("#player-value").text("Value: €0 M");
  d3.select("#player-wage").text("Wage: €0 k");
  d3.select("#player-rep").text("International Reputation: ");
  d3.select("#player-foot").text("Preferred foot: ");
  d3.select("#player-body").text("Body type: ");
  d3.select("#player-pace").text("0").style("background","transparent");
  d3.select("#player-shoot").text("0").style("background","transparent");
  d3.select("#player-pass").text("0").style("background","transparent");
  d3.select("#player-physical").text("0").style("background","transparent");
  d3.select("#player-dribble").text("0").style("background","transparent");
  d3.select("#player-defence").text("0").style("background","transparent");
}

function getScoreColor(score){
  if (score > 85) {
    return "#31a84f";
  } else if (score > 70) {
    return "#9bbf30";
  } else if (score > 60) {
    return "#ffc940";
  } else if (score > 50) {
    return "#e77e23";
  } else {
    return "#d13913";
  }
}
