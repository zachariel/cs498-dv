var Chart = function(container) {
  var $this = this;
  $this.initialized = false;

  $this.data = null;
  $this.height = null;
  $this.width  = null;
  $this.graphSize = null;
  $this.x_scale = null;
  $this.y_scale = null;
  $this.ticks = null;
  $this.title = null;
  $this.annotation = null;

  $this.svg  = container;

  timeBetweenSlides = 10000

  $this.setTitle = function(title) {
    $this.title = title;
  }

  $this.setAnnotation = function(annotation) {
    $this.annotation = annotation
  }

  $this.setData = function(data) {
    $this.data = data;
    $this.refresh();
    $this.draw();
  }

  initializeXscale = function() {
    let minDate = d3.min($this.data, function(d) { return d.date; });
    let maxDate = d3.max($this.data, function(d) { return d.date; });

    $this.x_scale = d3.scaleTime().domain([minDate, maxDate]).range([0, $this.graphSize.width])
  }

  initializeYscale = function() {
    let minTemp = d3.min($this.data, function(d) { return d.record_min_temp; });
    let maxTemp = d3.max($this.data, function(d) { return d.actual_max_temp; });

    $this.y_scale = d3.scaleLinear().domain([minTemp - 5, maxTemp + 20]).range([$this.graphSize.height, 0]);
    $this.ticks = d3.range(minTemp - 5, maxTemp + 20, 10)

  }

  $this.refresh = function() {
    initializeXscale();
    initializeYscale();
  }

  drawTitle = function() {
    $this.svg.select('#title').remove();
    let title = $this.svg.append('text')
             .attr('id', 'title')
             .text($this.title);

    title.attr('transform', 'translate(' + ($this.graphSize.x + ($this.graphSize.width / 2) - (title.node().getBBox().width / 2) ) + ',' + (20) + ')')
  }

  drawGrid = function(plotArea) {
    plotArea.append("g").attr("class", "grid")
                        .on('mouseenter', hidePopup)
                         .call(d3.axisLeft($this.y_scale).tickSize(-$this.graphSize.width).tickFormat(""))

    plotArea.append("g").attr("class", "grid")
                        .on('mouseenter', hidePopup)
                         .call(d3.axisTop($this.x_scale).tickSize(-$this.graphSize.height).tickFormat(""))
  }

  drawAxis = function() {
    let y_axis = d3.axisLeft().scale($this.y_scale).tickFormat(function(d) { return d + '\u00BA' });
    let y_axisRight = d3.axisRight().scale($this.y_scale).tickFormat(function(d) { return d + '\u00BA' });
    let x_axis = d3.axisBottom().scale($this.x_scale)
    let x_axisTop = d3.axisTop().scale($this.x_scale)

    $this.svg.append('g')
      .attr('transform', 'translate(' + ($this.graphSize.x - 40) + ',' + (50 + $this.graphSize.y + $this.graphSize.height / 2) + ')')
      .append('text')
        .attr('transform', 'rotate(-90)')
        .text('Temperature \u00BAF');

    $this.svg.append('g')
      .attr('transform', 'translate(' + (90 + $this.graphSize.width / 2) + ',' + (40 + $this.graphSize.y + $this.graphSize.height) + ')')
      .append('text')
        .text('Date');

    $this.svg.append('g')
      .attr('class', 'y-axis')
      .attr('transform', 'translate(' + ($this.graphSize.width + $this.graphSize.x) + ',' + $this.graphSize.y + ')')
      .call(y_axisRight.tickValues($this.ticks))

    $this.svg.append('g')
      .attr('class', 'y-axis')
      .attr('transform', 'translate(' + $this.graphSize.x + ',' + $this.graphSize.y + ')')
      .call(y_axis.tickValues($this.ticks))

    $this.svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', 'translate(' + $this.graphSize.x + ',' + ($this.graphSize.y + $this.graphSize.height) + ')')
      .call(x_axis)

    $this.svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', 'translate(' + $this.graphSize.x + ',' + $this.graphSize.y + ')')
      .call(x_axisTop)
  }

  popupDetails = function(datum) {
    let popup = $this.svg.select('#popup');

    if (popup.empty()) {
      popup = $this.svg.append('g')
                       .attr('id', 'popup')
                       .attr('class', 'annotation')
    }

    popup.html('');
    popup.attr('opacity', 1)

    let container = popup.append('rect')
                     .attr('fill', '#FFF')
                     .attr('stroke', '#000')

    let formatDate = d3.timeFormat("%m/%d/%Y")
    var dy = "1.1em"
    var content = []
    let margin = 20

    let text = popup.append('text')
                .attr('transform', 'translate(' + (margin / 2) + ',' + (margin / 2) + ')')

    content.push(text.append('tspan').text("Date: " + formatDate(datum.date)).attr('class', 'title'))
    content.push(text.append('tspan').text("Min Temp: " + datum.actual_min_temp + '\u00BAF'))
    content.push(text.append('tspan').text("Max Temp: " + datum.actual_max_temp + '\u00BAF'))
    content.push(text.append('tspan').text("Avg Temp: " + datum.actual_mean_temp + '\u00BAF'))
    content.push(text.append('tspan').text("Avg Min Temp: " + datum.average_min_temp + '\u00BAF'))
    content.push(text.append('tspan').text("Avg Max Temp: " + datum.average_max_temp + '\u00BAF'))
    content.push(text.append('tspan').text("Record Min Temp (" + datum.record_min_temp_year + "): " + datum.record_min_temp + '\u00BAF'))
    content.push(text.append('tspan').text("Record Max Temp (" + datum.record_max_temp_year + "): " + datum.record_max_temp + '\u00BAF'))

    content.forEach(function(el) {
      el.attr('x', 0).attr('dy', dy)
    })


    container.attr('width', text.node().getBBox().width + margin)
         .attr('height', text.node().getBBox().height + margin)

    return popup;
  }

  showPopup = function() {
    d3.event.preventDefault();
    let coordinates = d3.mouse(this);
    let rect = arguments[2][arguments[1]]
    let datum = arguments[0];

    popup = popupDetails(datum)
    var popupCoordinates = { x: ($this.graphSize.x + coordinates[0]), y: ($this.graphSize.y + coordinates[1]) }

    if(popupCoordinates.x > $this.graphSize.width) {
      popupCoordinates.x -= popup.node().getBBox().width
    }

    if(popupCoordinates.y > $this.graphSize.height) {
      popupCoordinates.y -= popup.node().getBBox().height
    }

    popup.attr('transform', 'translate(' + popupCoordinates.x + ',' + popupCoordinates.y + ')')

  }

  hidePopup = function() {
    $this.svg.select('#popup').attr('opacity', 0);
  }

  drawActualTemp = function(plotArea) {
    plotArea.selectAll('rect')
            .data($this.data)
            .enter()
              .append('rect')
              .on('mousemove', showPopup)
              //.on('mouseout', hidePopup)
              .attr('x', function(d, i){ return $this.x_scale(d.date)})
              .attr('y', function(d, i){ return $this.y_scale(d.actual_max_temp) } )
              .attr('height', function(d, i) {
                return Math.abs($this.y_scale(d.actual_max_temp) - $this.y_scale(d.actual_min_temp))
              })
              .transition()
                .duration(5000)
                //.delay(3000)
                .ease(d3.easeLinear)
                .attr("stroke-dashoffset", 0)
              .attr('width', 1)
              //.attr('transform', function(d, i){
              //  return "translate(" + $this.x_scale(d.date) + ',' + $this.y_scale(d.actual_max_temp) + ')'
              //})
  }

  drawAverageTemp = function(plotArea) {
    plotArea.selectAll('rect')
            .data($this.data)
            .enter()
              .append('rect')
              .on('mousemove', showPopup)
              //.on('mouseout', hidePopup)
              .attr('x', function(d, i){ return $this.x_scale(d.date)})
              .attr('height', function(d, i) {
                return Math.abs($this.y_scale(d.average_max_temp) - $this.y_scale(d.average_min_temp))
              })
              .attr('width', 1)
              .attr('y', function(d) { return $this.graphSize.height - $this.y_scale(d.average_max_temp) })
              .transition()
                .duration(3000)
                //.delay(1000)
                .ease(d3.easeSin)
                .attr("stroke-dashoffset", 0)
              .attr('y', function(d, i){ return $this.y_scale(d.average_max_temp) } )
  }

  drawRecordTemp = function(plotArea) {
    plotArea.selectAll('rect')
            .data($this.data)
            .enter()
              .append('rect')
              .on('mousemove', showPopup)
              //.on('mouseleave', hidePopup)
              .attr('x', function(d, i){ return $this.x_scale(d.date)})
              //.attr('width', function(d, i) {
              //  return $this.x_scale.rangeBand()
              //})
              .attr('height', function(d, i) {
                return Math.abs($this.y_scale(d.record_max_temp) - $this.y_scale(d.record_min_temp))
              })
              .attr('width', 1)
              .transition()
                .duration(3000)
                .ease(d3.easeSin)
                .attr("stroke-dashoffset", 0)
                .attr('y', function(d, i){ return $this.y_scale(d.record_max_temp) } )

    setTimeout(fireFinishEvent, timeBetweenSlides)
  }

  sleep = function(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
      if ((new Date().getTime() - start) > milliseconds){
        break;
      }
    }
  }

  $this.initialize = function() {
    $this.initialized = true;

    $this.height = svgHeight();
    $this.width  = svgWidth();
    $this.graphSize = graphSize();
  }

  plot1Id = 'record-temp';
  plot2Id = 'avg-temp';
  plot3Id = 'actual-temp';

  $this.draw = function() {
    $this.svg.html('');

    drawTitle();
    var line = d3.line()
                  .x(function(d, i) { return $this.x_scale(d.date); }) // set the x values for the line generator
                  .y(function(d) { return $this.y_scale(d.actual_mean_temp); }) // set the y values for the line generator


    $this.plotArea = $this.svg.append('g')
                  .attr('transform', 'translate(' + $this.graphSize.x + ',' + $this.graphSize.y + ')')

    drawAxis();
    drawGrid($this.plotArea);
    drawHelperAnnotation($this.plotArea, 12, 100);

    drawRecordTemp($this.plotArea.append('g').attr('id', plot1Id));
    drawAverageTemp($this.plotArea.append('g').attr('id', plot2Id));
    drawActualTemp($this.plotArea.append('g').attr('id', plot3Id));

    drawAnnotation($this.plotArea)
  }

  fireFinishEvent = function() {
    const evt = new CustomEvent('chart-finish-animation', {
      bubbles: true,
      detail: { text: () => $this.city }
    });
    document.dispatchEvent(evt);
  }

  drawAnnotation = function(plotArea) {
    box = plotArea.append('g')
            .attr('class', 'annotation')

    var dy = "1.1em"
    var content = []
    let margin = 20

    let text = box.append('text')
                .attr('transform', 'translate(' + (margin / 2) + ',' + (margin / 2) + ')')

    $this.annotation.forEach(function(line) {
      text.append('tspan').text(line)
          .attr('x', 0).attr('dy', dy)
    })

    box.attr('transform', 'translate(' + ($this.graphSize.width * 0.4) + ',' + 0 + ')')
  }

  drawHelperAnnotation = function(plotArea, width, height) {
    box = plotArea.append('g')
            .attr('class', 'annotation')

    rec_box = box.append('rect')
            .attr('class', 'record')
            .attr('height', height)
            .attr('width', width)

    bbox = rec_box.node().getBBox();

    record_high = box.append('text').text('Record high')
    record_high.attr('transform', 'translate(' + -(record_high.node().getBBox().width + 5) + ',' + 10 + ')')

    record_low = box.append('text').text('Record low')
    record_low.attr('transform', 'translate(' + -(record_low.node().getBBox().width + 5) + ',' + (bbox.height) + ')')

    normal_text = box.append('text').text('Normal range')
    normal_text.attr('transform', 'translate(' + -(10 + normal_text.node().getBBox().width + 5) + ',' + ((bbox.height / 2)) + ')')

    actual_text = box.append('text').text('Actual range')
    actual_text.attr('transform', 'translate(' + (bbox.width + 10) + ',' + ((bbox.height / 2)) + ')')

    normal_box = box.append('rect')
                    .attr('class', 'average')
                    .attr('width', bbox.width)
                    .attr('height', bbox.height / 2)
    normal_box.attr('transform', 'translate(' + (0) + ',' + ((bbox.height / 2) - (normal_box.node().getBBox().height / 2)) + ')')

    actual_box = box.append('rect')
                    .attr('class', 'actual')
                    .attr('width', bbox.width)
                    .attr('height', normal_box.node().getBBox().height * 0.7)
    actual_box.attr('transform', 'translate(' + (0) + ',' + ((bbox.height / 2) - (actual_box.node().getBBox().height / 2)) + ')')

    whisker_left = whisker(box, 6, normal_box.node().getBBox().height)
    whisker_left.attr('transform', 'translate(' + (-10) + ',' + ((bbox.height / 2) - (normal_box.node().getBBox().height / 2)) + ')')

    whisker_right = whisker(box, 6, actual_box.node().getBBox().height)
    whisker_right.attr('transform', 'translate(' + (bbox.width+3) + ',' + ((bbox.height / 2) - (actual_box.node().getBBox().height / 2)) + ')')

    box.attr('transform', 'translate(' + ( 5 + bbox.width + normal_text.node().getBBox().width + whisker_left.node().getBBox().width ) + ',' + ($this.graphSize.height * 0.75 ) + ')')
  }

  whisker = function(box, width, height) {
    _whisker = box.append('g')
    _whisker.append('polyline')
                .attr('points', "0,0 " + width + ",0 " + (width/2) + ",0 " + (width/2) + "," + height + " 0," + height + " " + width + "," + height)
                .attr('fill', 'none')
                .attr('stroke', 'black')
    return _whisker;
  }

  hidePlot = function(id) {
    d3.select('#' + id).attr('opacity', '0')
  }

  $this.hidePlot1 = function() {
    hidePlot(plot1Id);
  }

  $this.hidePlot2 = function() {
    hidePlot(plot2Id);
  }

  $this.hidePlot3 = function() {
    hidePlot(plot3Id);
  }

  function graphSize() {
    return {
      height: $this.height * 0.8,
      width: $this.width * 0.8,
      x: $this.width* 0.1,
      y: $this.height * 0.1
    }
  }

  function svgHeight() {
    return +$this.svg.style('height').replace('px', '');
  }

  function svgWidth() {
    return +$this.svg.style('width').replace('px', '');
  }
}

var Narrative = function() {
  var $this = this;

  $this.baseURL = './data/'

  $this.currentState = 'SLIDESHOW';
  $this.currentScene = 0;

  let cities = {
                "KMDW": {
                  name: "Chicago",
                  annotation: ["Chicago had an unexpectedly cold February,",
                               "when temperatures returned to single digits",
                               "and two days reached a record-setting low."]
                },
                "KHOU": {
                  name: "Houston",
                  annotation: ["Houston\u00B4s temperatures sat around the",
                               "average for the most part, except for an",
                               "odd cold spike in November."]
                },
                "KCLT": {
                  name: "Charlotte",
                  annotation: ["Charlotte, North Carolina, had a particularly",
                               "uncomfortable June this year, with five days",
                               "setting record highs in the upper 90s."]
                },
                "KCQT": {
                  name: "Los Angeles",
                  annotation: ["Los Angeles -- famous for its year-round",
                               "just-right temperatures -- experienced several",
                               "heat waves this year. March, in particular,",
                               "had four days with record highs when the",
                               "temperature soared into the 90s."]
                },
                "KSEA": {
                  name: "Seatle",
                  annotation: ["Seattle experienced a strangely warm",
                               "winter, with 12 days since the beginning",
                               "of December setting a record high."]
                }
              }
  let cityKeys = Object.keys(cities);

  $this.scenes = [];

  $this.svg = d3.select('svg')

  $this.chart = null;

  $this.runningSlideshow = false;

  selectElement = d3.select('select')

  selectListener = function() {
    var sceneIndex = eval(d3.select(this).property('value'));
    $this.currentScene = sceneIndex;
    $this.scenes[sceneIndex].show()
  }

  addSelectOption = function(scene) {
    selectElement.append('option')
                  .attr('value', $this.scenes.length - 1)
                  .text(scene.city.name)
  }

  initializeScene = function(data, city) {
    sceneIndex = $this.scenes.push(new Scene(data, city, $this.chart))
    sceneIndex--

    addSelectOption($this.scenes[sceneIndex]);
    selectElement.on('change', selectListener)

    if (!runningSlideshowAuto() && $this.currentScene == 0) {
      document.addEventListener("chart-finish-animation", sceneFinished, false);
      document.addEventListener("scene-displayed", onSceneDisplayed, false);
      slideshow();
    }
  }

  sceneFinished = function() {
    if (runningSlideshowAuto() && $this.currentScene < (cityKeys.length - 1)) {
      console.log('scene finished')
      $this.currentScene++;
      slideshow();
    }
  }

  downloadFile = function(url, city, callback) {
    d3.csv(url, function(datum) {
      datum.date = new Date(datum.date);
      keys = Object.keys(datum)
      keys.forEach(function(key) {
        if(key != 'date') {
          datum[key] = +datum[key];
        }
      });
      return datum
    }).then(function(data) {
      callback(data, city);
    });
  }

  cityKeys.forEach(function(key) {
    let url = $this.baseURL + key + '.csv';
    downloadFile(url, cities[key], initializeScene);
  });

  bindButtons = function() {
    d3.select('#buttons').select('.prev').on('click', $this.prev);
    d3.select('#buttons').select('.next').on('click', $this.next);
  }

  this.run = function() {
    bindButtons();
    $this.chart = new Chart($this.svg);
    $this.chart.initialize();
  }

  hideNextButton = function() {
    d3.select('#buttons .next')
      .style('display', 'none');
  }

  hidePrevButton = function() {
    d3.select('#buttons .prev')
      .style('display', 'none');
  }

  showNextButton = function() {
    d3.select('#buttons .next')
      .style('display', 'block');
  }

  showPrevButton = function() {
    d3.select('#buttons .prev')
      .style('display', 'block');
  }

  runningSlideshowAuto = function() {
    return $this.currentState == 'SLIDESHOW' && $this.runingSlideshow;
  }

  slideshow = function() {
    $this.runingSlideshow = true;
    hidePrevButton();
    hideNextButton();
    displayScene();

    if (runningSlideshowAuto() && $this.currentScene < (cityKeys.length - 1)) {
      console.log('running slideshow')
      //setTimeout(function(){
      //  $this.currentScene++;
      //  slideshow();
      //}, 1000)
    } else {
      if ($this.currentScene == (cityKeys.length - 1)) {
        console.log('running slideshow finished')
        $this.runingSlideshow = false;
        $this.currentState = 'OPEN';
        d3.select('#buttons').style('display', 'block')
        showPrevButton();
      }
    }
  }

  displayScene = function() {
    console.log('$this.showScene' + $this.currentScene + '()');
    $this.scenes[$this.currentScene].show()
  }

  firstScene = function() {
    return $this.currentScene == 0;
  }

  lastScene = function() {
    return ($this.currentScene + 1) == $this.scenes.length
  }

  onSceneDisplayed = function() {
    if (!runningSlideshowAuto()) {
      console.log('scene displayed')
      if(firstScene()) {
        hidePrevButton()
        showNextButton()
      } else if(lastScene()) {
        hideNextButton()
        showPrevButton()
      } else {
        showNextButton()
        showPrevButton()
      }
    }
    //selectElement.attr("selectedIndex", $this.currentScene)
    document.querySelector('select').selectedIndex = $this.currentScene
  }

  this.next = function() {
    console.log('next => ' + ($this.currentScene +1));
    if( $this.currentScene < $this.scenes.length ) {
      $this.currentScene++;
      displayScene();
    }

  }

  this.prev = function() {
    console.log('prev => ' + ($this.currentScene -1) );
    if( $this.currentScene >= 1 ) {
      $this.currentScene--;
      displayScene();
    }
  }
}

var Scene = function(data, city, chart) {
  var $this = this;
  $this.data = data;
  $this.city = city;
  $this.chart = chart;

  $this.show = function() {
    $this.chart.setAnnotation(city.annotation)
    $this.chart.setTitle(city.name + ' weather, July 2014 - June 2015');
    $this.chart.setData($this.data);
    document.dispatchEvent( new CustomEvent('scene-displayed', {
                              bubbles: true,
                              detail: { text: () => $this.currentScene }
                            })
                          )
  }

  $this.hide = function() {
  }

  $this.run = function() {
  }
}
