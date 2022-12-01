d3.csv("data/tracks_filtered_jazz.csv", (track) => {
  return d3.autoType({
    id: track.id,
    artists: track.artists,
    id_artists: track.id_artists,
    name: track.name,
    year: track.year,
    tempo: track.tempo,
    //duration: track.duration,
    //loudness: track.loudness,
    //energy: track.energy,
    //valance: track.valance,
    //acousticness: track.acousticness
  });
}).then(useData);

function useData(data) {
  data = data.map((d) => ({
    ...d,
    id_artists: d.id_artists
      .slice(1, -1)
      .split(" ")
      .map((id) => id.slice(1, -1)),
    artists: d.artists
      .slice(1, -1)
      .split(", ")
      .map((a) => a.slice(1, -1)),
  }));

  console.log("data", data);

  const apiToken =
    "BQAw3EPkOOXfmC_1aw7KdEmo1LoDIKeQrkgrATgsICQBsjgyX5HJ-QFjQrxbSAUfc2KSZujnnYjLBlUvUmnjVsJNM-EsOIM0ANT4hH9-XWNlNIYC28DprptpalHLvSxjAitmcbd8Sv59UiFDl5uCfR9yNhw7RmKi660FCkhbfmI";

  const categories = [
    "tempo",
    "duration",
    "loudness",
    "energy",
    "valence",
    "acousticness",
  ];

  const primaryColor = "#69b3a2";
  const highlightColor = "red";

  let selectedCategory = "tempo";
  let selectedTrack = null;

  const width = 1600;
  const height = 1000;

  console.log(
    "extent:",
    d3.extent(data, (d) => d.year)
  );

  const timeScale = d3
    .scaleLinear()
    .domain(d3.extent(data, (d) => d.year))
    .range([0, width]);
  console.log("time scale:" + timeScale(1920));

  const yScale = d3
    .scaleLinear()
    .domain(d3.extent(data, (d) => d[selectedCategory]))
    .nice()
    .range([0, height]);

  console.log(
    "tempoextend",
    d3.extent(data, (d) => d.tempo)
  );

  const n_timebins = 100;
  const time_bin = d3
    .bin()
    .value((d) => d.year)
    .thresholds(n_timebins)
    .domain(timeScale.domain());
  const time_bins = time_bin(data);

  const time_bins_sorted = time_bins.map((d) => {
    d.sort((a, b) => a[selectedCategory] - b[selectedCategory]);
    return d;
  });

  var histogram = d3
    .histogram()
    .value((d) => d[selectedCategory])
    .domain(yScale.domain())
    .thresholds(70);

  console.log(
    "histograms",
    time_bins.map((d) => histogram(d))
  );

  // Checkboxes
  // Still no updating the y axis, only the label in the tooltip 
  //////
  d3.selectAll("[value=tempo]").on("change", function () {
    selectedCategory = "tempo";
    console.log("selectedCategory: " + selectedCategory)
  });

  d3.selectAll("[value=valance]").on("change", function () {
    selectedCategory = "valance";
    console.log("selectedCategory: " + selectedCategory)
  });

  d3.selectAll("[value=energy]").on("change", function () {
    selectedCategory = "energy";
    console.log("selectedCategory: " + selectedCategory)

  });

  d3.selectAll("[value=acousticness]").on("change", function () {
    selectedCategory = "acousticness";
    console.log("selectedCategory: " + selectedCategory)
  });
  ////////


  //// console.log("bins", time_bins);

  //// console.log("bins_sorted", time_bins_sorted);

  //// console.log(data);

  const svg = d3
    .select("div#main-x-axis")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height]);

  const tooltip = d3
    .select("div#main-x-axis")
    .append("div")
    .style("position", "absolute")
    .style("display", "none")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "5px")
    .style("padding", "10px")
    .on("mouseout", (e) => {
      d3.select(e.currentTarget)
        .style("z-index", 0)
        .transition()
        .duration(200)
      //.style("opacity", 0)
      //.style("visibility", "hidden");
    });

  tooltip
    .append("img")
    .attr(
      "src",
      "https://github.com/holtzy/D3-graph-gallery/blob/master/img/section/ArcSmal.png?raw=true"
    )
    .attr("width", 100)
    .attr("height", 100);
  tooltip.append("h3").attr("id", "tt-track").text("Title");
  tooltip.append("h4").attr("id", "tt-artist").text("Artist");
  tooltip.append("h4").attr("id", "tt-year").text("Year");
  tooltip.append("p").attr("id", "tt-activecat").text("Selected Category");
  tooltip.append("p").attr("id", "tt-songpos").text("Song position"); // this can be deleted later

  const wilkinsons = svg
    .selectAll(null)
    .data(time_bins_sorted)
    .join("g")
    .attr("transform", (d) => `translate(${timeScale(d.x0)}, ${height})`);

  const dots = wilkinsons
    .selectAll("dot")
    .data((d) => {
      const radius = (timeScale(d.x1) - timeScale(d.x0)) / 2;
      return d.map((p, i) => ({
        idx: i,
        id: p.id,
        name: p.name,
        value: p.tempo,
        radius,
        artists: p.artists,
        year: p.year,
        id_artists: p.id_artists,
        y: -i * 2 * radius - radius,
      }));
    })
    .join("circle")
    .attr("cx", (d, i) => 0)
    .attr("cy", (d) => d.y)
    .attr("r", (d) => d.radius)
    .attr("fill", (d) => {
      if (
        d.selectedTrack &&
        selectedTrack.id_artists.some((s) => d.id_artists.includes(s))
      ) {
        console.log("found match");
        return highlightColor;
      }
      return primaryColor;
    })
    .on("click", (e, d) => {
      selectedTrack = d;
      dots.attr("fill", (d) => {
        if (
          selectedTrack &&
          selectedTrack.id_artists.some((s) => d.id_artists.includes(s))
        ) {
          console.log("found match");
          return highlightColor;
        }
        return primaryColor;
      });
      console.log("selectedTrack", selectedTrack);
      d3.select(e.currentTarget)
        .transition()
        .duration("200")
        .attr("r", d.radius * 2)
        .attr("fill", "black");

      //retrive cover image using Spotify API
      const url = `https://api.spotify.com/v1/tracks/${d.id}`;
      fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${apiToken}`,
          },
        })
        .then((response) => response.json())
        .then((data) => {
          const cover = data.album.images[0].url;
          tooltip.select("img").attr("src", cover);
        });

      tooltip
        .style("left", e.offsetX + 30 + "px")
        .style("top", e.offsetY + "px")
        .style("max-width", 240) // tooltip max width
        .style("display", "none");

      tooltip.select("#tt-track").text(`${d.name}`);
      tooltip.select("#tt-artist").text(`${d.artists}`);
      tooltip.select("#tt-year").text(`${d.year}`);
      tooltip.select("#tt-activecat").text(`${selectedCategory}: ${d.value}`);
      tooltip.select("#tt-songpos").text(`${d.idx}`);

      tooltip
        .transition()
        .duration(200)
        //.style("opacity", 1)
        .style("display", "block");
    })
    .on("mouseover", (e, d) => {
      d3.select(e.currentTarget)
        .transition()
        .duration("200")
        .attr("r", d.radius * 1.5)
        .attr("fill", "black");
    })

    .on("mouseout", (e, d) => {
      d3.select(e.currentTarget)
        .transition()
        .duration("200")
        .attr("r", d.radius);
    });


  // Code for zooming in no longer necessary?


  // const globalScale = width / 5000;
  // const extent = [
  //   [0, 0],
  //   [width, 0],
  // ];
  // const scaleExtent = [width / 5000, 2]; // Infinity]
  // const translateExtent = [
  //   [0, 0],
  //   [5000, 0],
  // ];

  // const zoom = d3
  //   .zoom()
  //   .extent(extent)
  //   .scaleExtent(scaleExtent)
  //   .translateExtent(translateExtent)
  //   .on("zoom", (e) => {
  //     console.log(e);
  //     const { k, x, y } = e.transform;
  //     console.log("zoom", k, x, y);
  //   });

  // svg.call(zoom);
  // svg.call(zoom.scaleBy, globalScale);



  // Timeline x Axis
  var svg_time = d3.select("div#main-x-axis")
    .append("svg")
    .attr("width", width)
    .attr("height", 50);

  // Add scale to x axis
  let escala_x = d3.axisBottom()
    .scale(timeScale)
    .ticks(10)
    .tickFormat(d3.format('^20'));

  //Append group and insert axis
  var x_axis = svg_time.append("g")
    .call(escala_x)
    .attr('transform', 'translate(0,20)');


  // Timeline Range Slider
  // adapted from: https://bl.ocks.org/johnwalley/e1d256b81e51da68f7feb632a53c3518
  var sliderRange = d3
    .sliderBottom()
    .min(d3.min(data))
    .max(d3.max(data))
    .width(width - 30)
    .tickFormat(d3.format('^20')) // https://observablehq.com/@d3/d3-format
    .ticks(10)
    .step(1.0)
    .default([1950, 2000])
    .fill('red')
    .handle(d3.symbol().type(d3.symbolCircle).size(200)())
    .on('onchange', val => {
      d3.select('p#value-range').text(val.map(d3.format('^20')).join('-'));
      timeScale.domain(val.map(d3.format('^20')))
      let newscale = d3.axisBottom(timeScale).tickFormat(d3.format('^20'))
      x_axis.transition().duration(1000).call(newscale);
      //wilkinsons.attr("transform", (d) => `translate(${newscale(d.x0)}, ${height})`);
    })

  var gRange = d3
    .select('div#slider-range')
    .append('svg')
    .attr('width', width)
    .attr('height', 100)
    .append('g')
    .attr('transform', 'translate(10,20)');

  gRange.call(sliderRange);

  d3.select('p#value-range').text(
    sliderRange
    .value()
    .map(d3.format('^20'))
    .join('-')
  );

}