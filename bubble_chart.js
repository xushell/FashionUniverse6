

/* bubbleChart creation function. Returns a function that will
 * instantiate a new bubble chart given a DOM element to display
 * it in and a dataset to visualize.
 *
 * Organization and style inspired by:
 * https://bost.ocks.org/mike/chart/
 *
 */

function bubbleChart() {
  // Constants for sizing
  var width = 960;
  var height = 600;

// tooltip for mouseover functionality
  var tooltip = floatingTooltip('fashion_tooltip', 240);

  // Locations to move bubbles towards, depending
  // on which view mode is selected.
  var center = { x: width / 2, y: height / 2 };

  var stylesCenters = {
    "Luxury": { x: width / 7, y: height / 2 },
    "Modern": { x: 2 * width / 7, y: height / 2 },
    "Sportswear": { x: 3 * width / 7, y: height / 2 },
    "Classic": { x: 4 * width / 7, y: height / 2 },
    "Casual": { x: 5 * width / 7, y: height / 2 },
    "Fast Fashion": { x: 6 * width / 7, y: height / 2 }
  };

  var genderCenters = {
    "Female": { x: width / 3, y: height / 2 },
    "Male, Female": { x: width / 2, y: height / 2 },
    "Male": { x: 2 * width / 3, y: height / 2 }
  };

   var politicalCenters = {
    "Liberal": { x: width / 3, y: height / 2 },
    "Conservative, Liberal": { x: width / 2, y: height / 2 },
    "Conservative": { x: 2 * width / 3, y: height / 2 }
  };

  // X locations of the titles.
  var stylesTitleX = {
    "Luxury": 70,
    "Modern": 230,
    "Sportswear": 390,
    "Classic": width - 390,
    "Casual": width - 230,
    "Fast Fashion": width - 70
  };

 var genderTitleX = {
    "Female": 220,
    "Male, Female": width / 2,
    "Male": width - 220
  };

 var politicalTitleX = {
    "Liberal": 220,
    "Conservative, Liberal": width / 2,
    "Conservative": width - 220
  };

  // Used when setting up force and
  // moving around nodes
  var damper = 0.102;

  // The below will be set in create_nodes and create_vis
  
  //overall svg
  var svg = null;

  //bubbles
  var bubbles = null;
  var nodes = [];

  //background image
  var background_image = null;

  //map related variables
  var projection = d3.geo.mercator()
      .scale((width - 5) / (3 * Math.PI))
      .translate([width / 2, height / 2]);

  var path = d3.geo.path()
      .projection(projection);

  var graticule = d3.geo.graticule();  
  var map_path = null;
  var map_stroke = null;
  var map_fill = null;

  //Array for brand names for search
  var brands = [];

  // Charge function that is called for each node.
  // Charge is proportional to the diameter of their
  // circle (which is stored in the radius attribute
  // of the circle's associated data.
  // This is done to allow for accurate collision
  // detection with nodes of different sizes.
  // Charge is negative because we want nodes to repel.
  // Dividing by 8 scales down the charge to be
  // appropriate for the visualization dimensions.
  function charge(d) {
	return -Math.pow(d.radius, 2.0) / 8;
  }

  // Here we create a force layout and
  // configure it to use the charge function
  // from above. This also sets some contants
  // to specify how the force layout should behave.
  // More configuration is done below.
  var force = d3.layout.force()
    .size([width, height])
    .charge(charge)
    .gravity(-0.01)
    .friction(0.9);


  // Colors for bubbles
  var fillColor = d3.scale.ordinal()
    .domain(['Low', 'Medium', 'High', 'NA'])
    .range(['#cc0066', '#99cc99', '#117744', '#f9f4ed']);

  // Sizes bubbles based on their area instead of raw radius
  var radiusScale = d3.scale.pow()
    .exponent(0.5)
    .range([2, 40]);


  //a scale for year founded - domain will be set later within chart function
  var xYearScale = d3.scale.linear()
      .range([10, width]);

  //xAxis for year founded
  var xYearAxis = d3.svg.axis()
      .scale(xYearScale)
      .orient("bottom")
      .ticks(10)
      .tickFormat(d3.format("d"));

  //x scale for employee number - domain will be set later within chart function
  var xEmpScale = d3.scale.linear()
      .range([10, width]);


  //xAxis for employee number
  var xEmpAxis = d3.svg.axis()
      .scale(xEmpScale)
      .orient("bottom")
      .ticks(10);

  //x and y scales for price - domains will be set later within chart function
  var xPriceScale = d3.scale.linear();
  //var xPriceScale = d3.scale.log()
      //.range([10, width]);
     // .base(10);


  var yPriceScale = d3.scale.linear()
      .range([height-580, height-60]);


  //xAxis for price
  var xPriceAxis = d3.svg.axis()
      .scale(xPriceScale)
      .orient("bottom")
      .tickFormat(function(d) { return "$" + d; });


  //x and y scales for age - domains will be set later within chart function
  var xAgeScale = d3.scale.linear()
      .range([10, width]);

  var yAgeScale = d3.scale.linear()
      .range([height-580, height-60]);

  //xAxis for age 
  var xAgeAxis = d3.svg.axis()
      .scale(xAgeScale)
      .orient("bottom")
      .ticks(10);


  //x and y scales for women's sizing - domains will be set later within chart function
  var xWSScale = d3.scale.linear()
      .range([10, width]);

  var yWSScale = d3.scale.linear()
      .range([height-580, height-60]);


  //xAxis for women's sizing
  var xWSAxis = d3.svg.axis()
      .scale(xWSScale)
      .orient("bottom")
      .ticks(10)
      .tickFormat(function(d) { return d +" (US)"; });


  //x and y scales for men's sizing - domains will be set later within chart function
  var xMSScale = d3.scale.linear()
      .range([10, width]);

  var yMSScale = d3.scale.linear()
      .range([height-580, height-60]);


  //xAxis for men's sizing
  var xMSAxis = d3.svg.axis()
      .scale(xMSScale)
      .orient("bottom")
      .ticks(10)
      .tickFormat(function(d) { return d +' (" chest)'; });


  /*
   * This data manipulation function takes the raw data from
   * the CSV file and converts it into an array of node objects.
   * Each node will store data and visualization values to visualize
   * a bubble.
   *
   * rawData is expected to be an array of data objects, read in from
   * one of d3's loading functions like d3.csv.
   *
   * This function returns the new node array, with a node in that
   * array for each element in the rawData input.
   */
  function createNodes(rawData) {
    // Use map() to convert raw data into node data.
    // Checkout http://learnjsdata.com/ for more on
    // working with data.
    var myNodes = rawData.map(function (d) {
      return {
        id: d.id,
        radius: radiusScale(+d.Revenue_2015_MDollar.replace(",", "")),
        value: d.Revenue_2015_MDollar,
        name: d.Company_Name,
        year: d.Year_Founded,
        headquarter: d.Headquarter,
        lon: d.HQ_LON,
        lat: d.HQ_LAT,
        employee: d.Employee_Number_Est,
        styles: d.Style_Category,
        gen: d.Gender_Target,
        poli: d.Political_Target,
        price_low: d.Low_Price_Range_Dollar,
        price_high: d.High_Price_Range_Dollar,
        age_low: d.Low_Age_Target,
        age_high: d.High_Age_Target,
        WS_low: d.Low_Women_Size,
        WS_high: d.High_Women_Size,
        MS_low: d.Low_Men_Size,
        MS_high: d.High_Men_Size,
        income: d.Net_Income_2015_Dollar,
        group: d.Ratio_Category,
        x: Math.random() * 900,
        y: Math.random() * 800
      };
    });

    // sort them to prevent occlusion of smaller nodes.
    myNodes.sort(function (a, b) { return b.value - a.value; });


    return myNodes;

  }




  /*
   * Main entry point to the bubble chart. This function is returned
   * by the parent closure. It prepares the rawData for visualization
   * and adds an svg element to the provided selector and starts the
   * visualization creation process.
   *
   * selector is expected to be a DOM element or CSS selector that
   * points to the parent element of the bubble chart. Inside this
   * element, the code will add the SVG continer for the visualization.
   *
   * rawData is expected to be an array of data objects as provided by
   * a d3 loading function like d3.csv.
   */
  var chart = function chart(selector, rawData) {

    // Use the max total_amount in the data as the max in the scale's domain
    // note we have to ensure the total_amount is a number by converting it
    // with `+`.
    var maxAmount = d3.max(rawData, function (d) { return +d.Revenue_2015_MDollar; });
    radiusScale.domain([0, maxAmount]);


    // Use the max and min Year_Founded in the data as the boundaries for xYearscale's domain
    var maxYear = d3.max(rawData, function (d) { return +d.Year_Founded; });
    var minYear = d3.min(rawData, function (d) { return +d.Year_Founded; });
    xYearScale.domain([minYear-5, maxYear+5]);


    // Use the max and min Employee_Number in the data as the boundaries for xEmpScale's domain
    var maxEmp = d3.max(rawData, function (d) { return +d.Employee_Number_Est; });
    var minEmp = d3.min(rawData, function (d) { return +d.Employee_Number_Est; });
    xEmpScale.domain([minEmp-100, maxEmp+10000]);


    //Use the max and min of id to help set up the bar chart for price, age and sizes below.
    var maxID = d3.max(rawData, function (d) { return +d.id; });
    var minID = d3.min(rawData, function (d) { return +d.id; });


    // Use max High_Price_Range_Dollar and min Low_Price_Range_Dollar in the data as the boundaries for xPriceScale's domain
    var maxPrice = d3.max(rawData, function (d) { return +d.High_Price_Range_Dollar; });
    var minPrice = d3.min(rawData, function (d) { return +d.Low_Price_Range_Dollar; });
    xPriceScale.domain([minPrice, minPrice*10, minPrice*100, minPrice*1000, maxPrice])
    		       .range([10, (1*width)/19, (3*width)/19, (6*width)/19, width-20]);
    yPriceScale.domain([minID, maxID]);

    //Polylinear Scale for price
	  xPriceAxis.tickValues([minPrice, minPrice*10, minPrice*100, minPrice*1000, maxPrice]);
    // Use max High_Age_Target and min Low_Age_Target in the data as the boundaries for xAgeScale's domain
    var maxAge = d3.max(rawData, function (d) { return +d.High_Age_Target; });
    var minAge = d3.min(rawData, function (d) { return +d.Low_Age_Target; });
    xAgeScale.domain([minAge, maxAge+5]);
    yAgeScale.domain([minID, maxID]);

    // Use min Low_Women_Size and max High_Women_Size in the data as the boundaries for xWSScale's domain
    var maxWS = d3.max(rawData, function (d) { return +d.High_Women_Size; });
    var minWS = d3.min(rawData, function (d) { if(d.Low_Women_Size){return +d.Low_Women_Size; }});
    xWSScale.domain([minWS-2, maxWS+5]);
    yWSScale.domain([minID, maxID]);

    // Use the max High_Men_Size and min Low_Men_Size in the data as the boundaries for xMSScale's domain
    var maxMS = d3.max(rawData, function (d) { return +d.High_Men_Size; });
    var minMS = d3.min(rawData, function (d) { if(d.Low_Men_Size){return +d.Low_Men_Size; }});
    xMSScale.domain([minMS-5, maxMS+10]);
    yMSScale.domain([minID, maxID]);

  // use Jquery autocomplete
   $( "#search_box" ).autocomplete({
    source: brands
	  });

    nodes = createNodes(rawData);
    // Set the force's nodes to our newly created nodes array.
    force.nodes(nodes);

    // Create a SVG element inside the provided selector
    // with desired size.
    svg = d3.select(selector)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

   
   //create space for background image 
   background_image = svg.append("image")
         .attr("width", 960)
         .attr("height", 600)
         .attr("x", 0);

   //create space for map
    map_path = svg.append("defs").append("path")
        .datum({type: "Sphere"})
        .attr("id", "sphere")
        .attr("d", path);

     map_stroke = svg.append("use")
        .attr("class", "stroke")
        .attr("xlink:href", "#sphere");

     map_fill = svg.append("use")
        .attr("class", "fill")
        .attr("xlink:href", "#sphere");

   //create array for search autocomplete
    for(var i=0; i<nodes.length; i++){
      brands.push(nodes[i].name);
    };

    // Bind nodes data to what will become DOM elements to represent them.
    bubbles = svg.selectAll('.bubble')
      .data(nodes, function (d) { return d.id; });

    // Create new circle elements each with class `bubble`.
    // There will be one circle.bubble for each object in the nodes array.
    // Initially, their radius (r attribute) will be 0.
    bubbles.enter().append('ellipse')
      .classed('bubble', true)
      .attr('rx', 0)
      .attr('ry', 0)
      .attr('fill', function (d) { return fillColor(d.group); })
      .attr('stroke', function (d) { return d3.rgb(fillColor(d.group)).darker(); })
      .attr('stroke-width', 2)
      .on('mouseover', showDetail)
      .on('mouseout', hideDetail);

    // Fancy transition to make bubbles appear, ending with the
    // correct radius
    bubbles.transition()
      .duration(5000)
      .attr('fill-opacity', 0.6)
      .attr('rx', function (d) { return d.radius; })
      .attr('ry', function (d) { return d.radius; });

    // Set initial layout to single group.
    groupBubbles();
  };

  /*
   * Sets visualization in "single group mode".
   * The other title labels are hidden and the force layout
   * tick function is set to move all nodes to the
   * center of the visualization.
   */
  function groupBubbles() {
    hideStyles();
    hideGen();
    hidePoli();
    hideYear();
    hideEmp();
    hidePrice();
    hideAge();
    hideWS();
    hideMS();
    hideGeo();
    hideSearch();

    background_image.attr("xlink:href", "images/All.png");

    force.on('tick', function (e) {

      bubbles.each(moveToCenter(e.alpha))
        .attr('cx', function (d) { return d.x; })
        .attr('cy', function (d) { return d.y; })
        .attr('rx', function (d) { return d.radius; })
        .attr('ry', function (d) { return d.radius; });
    });

    force.start();
  }

  /*
   * Helper function for "single group mode".
   * Returns a function that takes the data for a
   * single node and adjusts the position values
   * of that node to move it toward the center of
   * the visualization.
   *
   * Positioning is adjusted by the force layout's
   * alpha parameter which gets smaller and smaller as
   * the force layout runs. This makes the impact of
   * this moving get reduced as each node gets closer to
   * its destination, and so allows other forces like the
   * node's charge force to also impact final location.
   */
  function moveToCenter(alpha) {
    return function (d) {
      d.x = d.x + (center.x - d.x) * damper * alpha;
      d.y = d.y + (center.y - d.y) * damper * alpha;
    };
  }

  /*
   * Sets visualization in "split by year mode".
   * The styles labels are shown and the force layout
   * tick function is set to move nodes to the
   * stylesCenter of their data's style.
   */
  function splitBubbles(displayName) {
    if (displayName === 'styles'){
       showStyles();
       force.on('tick', function (e) {

       background_image.attr("xlink:href", "images/Style.png");

       bubbles.each(moveToStyles(e.alpha))
        .attr('cx', function (d) { return d.x; })
        .attr('cy', function (d) { return d.y; })
        .attr('rx', function (d) { return d.radius; })
        .attr('ry', function (d) { return d.radius; });
      });
    }
    else if (displayName === 'gender'){
       showGen();
       force.on('tick', function (e) {

       background_image.attr("xlink:href", "images/Gender.png");

       bubbles.each(moveToGen(e.alpha))
        .attr('cx', function (d) { return d.x; })
        .attr('cy', function (d) { return d.y; })
        .attr('rx', function (d) { return d.radius; })
        .attr('ry', function (d) { return d.radius; });
      });
    }
    else if (displayName === 'political'){
       showPoli();
       force.on('tick', function (e) {

       background_image.attr("xlink:href", "images/Poli.png");

       bubbles.each(moveToPoli(e.alpha))
        .attr('cx', function (d) { return d.x; })
        .attr('cy', function (d) { return d.y; })
        .attr('rx', function (d) { return d.radius; })
        .attr('ry', function (d) { return d.radius; });
      });
    }
    force.start();
  }


  /*
   * Sets visualization in arrange by year or arrange by employee number mode.
   */
  function lineBubbles(displayName) {
    if (displayName === 'year'){
       hideStyles();
       hideGen();
       hidePoli();
       hideEmp();
       hidePrice();
       hideAge();
       hideWS();
       hideMS();
       hideGeo();
       hideSearch();
       hideStart();
       force.on('tick', function (e) {

       background_image.attr("xlink:href", "images/Year.png");

       bubbles.transition()
        .duration(200)
        .attr('cx', function (d) { return xYearScale(d.year); })
        .attr('cy', function (d) { return height/2; })
        .attr('rx', function (d) { return d.radius; })
        .attr('ry', function (d) { return d.radius; });
        });

    svg.append('g').transition()
        .duration(1000)
        .attr('class', 'year')
        .attr("transform", "translate(0," + (height-200) + ")")
        .call(xYearAxis)
        .attr('stroke','#6d6c6a')
        .attr('stroke-dasharray', '2,2');
    }

    else if (displayName === 'employee'){
       hideStyles();
       hideGen();
       hidePoli();
       hideYear();
       hidePrice();
       hideAge();
       hideWS();
       hideMS();
       hideGeo();
       hideSearch();
       hideStart();
       force.on('tick', function (e) {

       background_image.attr("xlink:href", "images/Emp.png");

       bubbles.transition()
        .duration(200)
        .attr('cx', function (d) { return xEmpScale(d.employee); })
        .attr('cy', function (d) { return height/2; })
        .attr('rx', function (d) { return d.radius; })
        .attr('ry', function (d) { return d.radius; });
      });

    svg.append('g').transition()
        .duration(1000)
        .attr('class', 'employee')
        .attr("transform", "translate(0," + (height-200) + ")")
        .call(xEmpAxis)        
        .attr('stroke','#6d6c6a')
        .attr('stroke-dasharray', '2,2');
    }
    force.start();
  }


    /*
   * Sets visualization in arrange by price, age or sizes.
   */
  function barBubbles(displayName) {
    if (displayName === 'price'){
       hideStyles();
       hideGen();
       hidePoli();
       hideYear();
       hideEmp();
       hideAge();
       hideWS();
       hideMS();
       hideGeo();
       hideSearch();
       hideStart();
       bubbles.sort(function(a, b){return (a.price_high-b.price_high);});
       force.on('tick', function (e) {

       background_image.attr("xlink:href", "images/Price.png");

       bubbles.transition()
        .duration(200)
        .attr('cx', function(d){return xPriceScale(((+d.price_low)+(+d.price_high))/2); })
        .attr('cy', function(d, i){return yPriceScale(i); })
        .attr('rx', function(d){return 0.5*(xPriceScale(+d.price_high)-(xPriceScale(+d.price_low))); })
        .attr('ry', 0.2);
        });

    svg.append('g').transition()
        .duration(1000)
        .attr('class', 'price')
        .attr("transform", "translate(0," + (height-50) + ")")
        .call(xPriceAxis)
        .attr('stroke','#6d6c6a')
        .attr('stroke-dasharray', '2,2');
    }

    else if (displayName === 'age'){
       hideStyles();
       hideGen();
       hidePoli();
       hideYear();
       hideEmp();
       hidePrice();
       hideWS();
       hideMS();
       hideGeo();
       hideSearch();
       hideStart();
       bubbles.sort(function(a, b){return (a.age_high-b.age_high);});
       force.on('tick', function (e) {

       background_image.attr("xlink:href", "images/Age.png");

       bubbles.transition()
        .duration(200)
        .attr('cx', function(d){return xAgeScale(((+d.age_low)+(+d.age_high))/2); })
        .attr('cy', function(d,i){return yAgeScale(i); })
        .attr('rx', function(d){return (xAgeScale(d.age_high)-(xAgeScale(d.age_low)))/2; })
        .attr('ry', 0.2);
        });

    svg.append('g').transition()
        .duration(1000)
        .attr('class', 'age')
        .attr("transform", "translate(0," + (height-50) + ")")
        .call(xAgeAxis)
        .attr('stroke','#6d6c6a')
        .attr('stroke-dasharray', '2,2');
    }

  else if (displayName === 'wsize'){
       hideStyles();
       hideGen();
       hidePoli();
       hideYear();
       hideEmp();
       hidePrice();
       hideAge();
       hideMS();
       hideGeo();
       hideSearch();
       hideStart();
       bubbles.sort(function(a, b){return (a.WS_high-b.WS_high);});
       force.on('tick', function (e) {

       background_image.attr("xlink:href", "images/WS.png");
               
       bubbles.transition()
        .duration(200)
        .attr('cx', function(d) {if(d.WS_low){return xWSScale(((+d.WS_low)+(+d.WS_high))/2);}; })
        .attr('cy', function(d,i) {if(d.WS_low){return yWSScale(i);}; })
        .attr('rx', function(d) {if(d.WS_low){return (xWSScale(d.WS_high)-(xWSScale(d.WS_low)))/2; };})
        .attr('ry', function(d) {if(d.WS_low){return 0.2;};});
        });

    svg.append('g').transition()
        .duration(1000)
        .attr('class', 'WS')
        .attr("transform", "translate(0," + (height-50) + ")")
        .call(xWSAxis)
        .attr('stroke','#6d6c6a')
        .attr('stroke-dasharray', '2,2');
    }

  else if (displayName === 'msize'){
       hideStyles();
       hideGen();
       hidePoli();
       hideYear();
       hideEmp();
       hidePrice();
       hideAge();
       hideWS();
       hideGeo();
       hideSearch();
       hideStart();
       bubbles.sort(function(a, b){return (a.MS_high-b.MS_high);});
       force.on('tick', function (e) {

       background_image.attr("xlink:href", "images/MS.png");

       bubbles.transition()
        .duration(200)
        .attr('cx', function(d) {if(d.MS_low){return xMSScale(((+d.MS_low)+(+d.MS_high))/2);}; })
        .attr('cy', function(d,i) {if(d.MS_low){return yMSScale(i);}; })
        .attr('rx', function(d) {if(d.MS_low){return (xMSScale(d.MS_high)-(xMSScale(d.MS_low)))/2; };})
        .attr('ry', function(d) {if(d.MS_low){return 0.2;};});
        });

    svg.append('g').transition()
        .duration(1000)
        .attr('class', 'MS')
        .attr("transform", "translate(0," + (height-50) + ")")
        .call(xMSAxis)
        .attr('stroke','#6d6c6a')
        .attr('stroke-dasharray', '2,2');

    }
    force.start();
  }



  /*
   * Sets visualization for arrangement by headquarter geography
   */
  function hqBubbles(displayName) {

       hideStyles();
       hideYear();
       hideGen();
       hidePoli();
       hideEmp();
       hidePrice();
       hideAge();
       hideWS();
       hideMS();
       hideGeo();
       hideSearch();
       hideStart();

    


	   // load and display the World
	   d3.json('data/50m_World.json', function(error, world) {
  		
  		if (error) throw error;


       force.on('tick', function (e) {
      
       background_image.attr("xlink:href", "images/Geo.png");

       bubbles.transition()
        .duration(300)
        .attr('cx', function (d) { return projection([d.lon, d.lat])[0]; })
        .attr('cy', function (d) { return projection([d.lon, d.lat])[1]; })
        .attr('rx', function (d) { return d.radius*0.3; })
        .attr('ry', function (d) { return d.radius*0.3; });

      });

      svg.insert("path", ".graticule")
          .datum(topojson.feature(world, world.objects.land))
          .attr("class", "land")
          .attr("d", path);

      svg.insert("path", ".graticule")
          .datum(topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; }))
          .attr("class", "boundary")
          .attr("d", path);


	});
    force.start();
  }

  /*
   * Sets visualization for search by bubbles
   */
  function searchBubbles(displayName) {
    if (displayName === 'search'){
       hideStyles();
       hideYear();
       hideGen();
       hidePoli();
       hideEmp();
       hidePrice();
       hideAge();
       hideWS();
       hideMS();
       hideGeo();
       hideSearch();
       hideStart();

       var input = document.getElementById("search_box").value;

       background_image.attr("xlink:href", "images/Search.png");

       force.on('tick', function (e) {
       bubbles.transition()
        .duration(100)
        .attr('fill', function (d) { if (d.name==document.getElementById("search_box").value){ 
      									return "#FF8C00";
      								}
      								else { return fillColor(d.group); }})
        .attr('stroke', function (d) { if (d.name==document.getElementById("search_box").value){ 
      									return "#FF8C00";
      								}
      								else {return d3.rgb(fillColor(d.group)).darker(); }})
        .attr('fill-opacity', function (d) { if (d.name==document.getElementById("search_box").value){ 
      									return 1;
      								}
      								else {return 0.6;}})
        .attr('cx', function (d) { return width/2; })
        .attr('cy', function (d) { return height/2; })
        .attr('rx', function (d) { if(input===String(d.name)){
                                       return d.radius; 
                                     }
                                     else{
                                      return 0;
                                     }
                                   })
        .attr('ry', function (d) { if(input===String(d.name)){ 
                                       return d.radius; 
                                     }
                                    else{
                                      return 0;
                                    }
                                  });
        });

    }
    force.start();
  }


  /*
   * Helper function for "split by Styles mode".
   * Returns a function that takes the data for a
   * single node and adjusts the position values
   * of that node to move it to the styles center for that
   * node.
   *
   * Positioning is adjusted by the force layout's
   * alpha parameter which gets smaller and smaller as
   * the force layout runs. This makes the impact of
   * this moving get reduced as each node gets closer to
   * its destination, and so allows other forces like the
   * node's charge force to also impact final location.
   */
  function moveToStyles(alpha) {
    return function (d) {
      var target = stylesCenters[d.styles];
      d.x = d.x + (target.x - d.x) * damper * alpha * 1.1;
      d.y = d.y + (target.y - d.y) * damper * alpha * 1.1;
    };
  }

  function moveToGen(alpha) {
    return function (d) {
      var target = genderCenters[d.gen];
      d.x = d.x + (target.x - d.x) * damper * alpha * 1.1;
      d.y = d.y + (target.y - d.y) * damper * alpha * 1.1;
    };
  }

  function moveToPoli(alpha) {
    return function (d) {
      var target = politicalCenters[d.poli];
      d.x = d.x + (target.x - d.x) * damper * alpha * 1.1;
      d.y = d.y + (target.y - d.y) * damper * alpha * 1.1;
    };
  }


  /*
   * Hides Style title displays.
   */
  function hideStyles() {
    svg.selectAll('.styles').remove();
  }

  function hideGen() {
    svg.selectAll('.gender').remove();
  }

  function hidePoli() {
    svg.selectAll('.political').remove();
  }

  function hideYear() {
    svg.selectAll('.year').remove();
  }

  function hideEmp() {
    svg.selectAll('.employee').remove();
  }

  function hidePrice() {
    svg.selectAll('.price').remove();
  }

  function hideAge() {
    svg.selectAll('.age').remove();
  }

  function hideWS() {
    svg.selectAll('.WS').remove();
  }

  function hideMS() {
    svg.selectAll('.MS').remove();
  }

  function hideGeo() {
    svg.selectAll('path').remove();
    svg.selectAll('use').remove();  
  }

  function hideSearch() {
    svg.selectAll('.search').remove();
  }

  function hideStart() {
    svg.selectAll('.start').remove();
  }




  /*
   * Shows Styles title displays.
   */

  function showStyles() {
    // Another way to do this would be to create
    // the texts once and then just hide them.
    hideGen();
    hidePoli();
    hideYear();
    hideEmp();
    hideGeo();
    hideSearch();
    hideStart();
    hideWS();
    hideMS();
    hideAge();
    hidePrice();
    var stylesData = d3.keys(stylesTitleX);
    var styles = svg.selectAll('.styles')
      .data(stylesData);

    styles.enter().append('text')
      .attr('class', 'styles')
      .attr('x', function (d) { return stylesTitleX[d]; })
      .attr('y', 200)
      .attr('text-anchor', 'middle')
      .text(function (d) { return d; });
  }

    function showGen() {
    hideStyles();
    hidePoli();
    hideYear();
    hideEmp();
    hidePrice();
    hideAge();
    hideWS();
    hideMS();
    hideGeo();
    hideSearch();
    hideStart();
    var genData = d3.keys(genderTitleX);
    var gen = svg.selectAll('.gender')
      .data(genData);

    gen.enter().append('text')
      .attr('class', 'gender')
      .attr('x', function (d) { return genderTitleX[d]; })
      .attr('y', 100)
      .attr('text-anchor', 'middle')
      .text(function (d) { return d; });
  }

    function showPoli() {
    hideStyles();
    hideGen();
    hideYear();
    hideEmp();
    hidePrice();
    hideAge();
    hideWS();
    hideMS();
    hideGeo();
    hideSearch();
    hideStart();
    var poliData = d3.keys(politicalTitleX);
    var poli = svg.selectAll('.political')
      .data(poliData);

    poli.enter().append('text')
      .attr('class', 'political')
      .attr('x', function (d) { return politicalTitleX[d]; })
      .attr('y', 100)
      .attr('text-anchor', 'middle')
      .text(function (d) { return d; });
  }


  /*
   * Function called on mouseover to display the
   * details of a bubble in the tooltip.
   */
  function showDetail(d) {
    // change outline to indicate hover state.
    d3.select(this).attr('stroke', 'black');

    var content = '<span class="name">Brand: </span><span class="value">' +
                  d.name +
                  '</span><br/>' +
                  '<span class="name">Year Founded: </span><span class="value">' +
                  d.year +
                  '</span><br/>' +
                  '<span class="name">Headquarter: </span><span class="value">' +
                  d.headquarter +
                  '</span><br/>' +
                  '<span class="name">Revenue: </span><span class="value">$' +
                  addCommas(d.value) +
                  'M</span><br/>' +
                  '<span class="name">Employee Number: </span><span class="value">' +
                  addCommas(d.employee) +
                  '</span>';
    tooltip.showTooltip(content, d3.event);
  }

  /*
   * Hides tooltip
   */
  function hideDetail(d) {
    // reset outline
    d3.select(this)
      .attr('stroke', function (d) { if (d.name==document.getElementById("search_box").value){ 
      				                 return "#FF8C00";
      								}
      								 else {return d3.rgb(fillColor(d.group)).darker(); }});

    tooltip.hideTooltip();
  }

  /*
   * Externally accessible function (this is attached to the
   * returned chart function). Allows the visualization to toggle
   * between "single group" and "split by year" modes.
   *
   * displayName is expected to be a string and either 'year' or 'all'.
   */
  chart.toggleDisplay = function (displayName) {
    if ((displayName === 'styles')||(displayName === 'gender')||(displayName === 'political')) {
      splitBubbles(displayName);
    } 

    else if ((displayName === 'year')||(displayName === 'employee')){
      lineBubbles(displayName);
    }
      
    else if ((displayName === 'price')||(displayName === 'age')||(displayName === 'wsize')||(displayName === 'msize')){
      barBubbles(displayName);
    }

    else if ((displayName == 'headquarter')){
      hqBubbles(displayName);
    }

    else if ((displayName == 'search')){
      searchBubbles(displayName);
    }

    else {
      groupBubbles();
    }
  };


  // return the chart function from closure.
  return chart;
}

/*
 * Below is the initialization code as well as some helper functions
 * to create a new bubble chart instance, load the data, and display it.
 */

var myBubbleChart = bubbleChart();

/*
 * Function called once data is loaded from CSV.
 * Calls bubble chart function to display inside #vis div.
 */
function display(error, data) {
  if (error) {
    console.log(error);
  }

  myBubbleChart('#vis', data);
}



/*
 * Sets up the layout buttons to allow for toggling between view modes.
 */
function setupButtons() {
  d3.select('#toolbar')
    .selectAll('.button')
    .on('click', function () {
      // Remove active class from all buttons
      d3.selectAll('.button').classed('active', false);
      // Find the button just clicked
      var button = d3.select(this);

      // Set it as the active button
      button.classed('active', true);

      // Get the id of the button
      var buttonId = button.attr('id');

      // Toggle the bubble chart based on
      // the currently clicked button.
      myBubbleChart.toggleDisplay(buttonId);
    });
}

/*
 * Helper function to convert a number into a string
 * and add commas to it to improve presentation.
 */
function addCommas(nStr) {
  nStr += '';
  var x = nStr.split('.');
  var x1 = x[0];
  var x2 = x.length > 1 ? '.' + x[1] : '';
  var rgx = /(\d+)(\d{3})/;
  while (rgx.test(x1)) {
    x1 = x1.replace(rgx, '$1' + ',' + '$2');
  }

  return x1 + x2;
}

// Load the data.
d3.csv('data/Fashion_Companies3.csv', display);

// setup the buttons.
setupButtons();
