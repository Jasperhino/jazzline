d3.csv("data/tracks_filtered_jazz.csv", (track) => {
  return d3.autoType({
    id: track.id,
    artists: track.artists,
    id_artists: track.id_artists,
    name: track.name,
    year: track.year,
    tempo: track.tempo,
    // duration: track.duration,
    // loudness: track.loudness,
    // energy: track.energy,
    // valance: track.valance,
    // acousticness: track.acousticness,
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
      .split(",   ")
      .map((a) => a.slice(1, -1)),
  }));

  console.log("data", data);

  const apiToken =
    "BQAhAKxt5ECql2razUCdiaDjxMRbTBSvoIP7Kv7gGyWQc84a1AH84bGICd-QyZfJzfUP578x2kSnM5gcFWDVOn1HVfDBs_Wx5tCcurnzFRTsmVg6rY3F5FHUBbbj9l5tU_sUEJSiNiCU15BzyoBQgVyaw6Y5Il0PtnVSYz5GNkqtpHb2L9e5Rk1xggiz7RY";

  const primaryColor = "#36312D";
  const highlightColor = "#FCA262";
  const selectedColor = "#4F9D69";


  let selectedCategory = "tempo";
  let selectedTrack = null;

  const width = scale($(window).scrollTop(), 0, 4000, window.innerHeight * 2, 4000);
  const height = window.innerHeight - 40;

  const timeScale = d3
    .scaleLinear()
    .domain(d3.extent(data, (d) => d.year))
    .range([0, width]);

  const yScale = d3
    .scaleLinear()
    .domain(d3.extent(data, (d) => d[selectedCategory]))
    .nice()
    .range([0, height]);

  console.log(
    "tempoextend",
    d3.extent(data, (d) => d.tempo)
  );

  console.log(
    "year extent",
    d3.extent(data, (d) => d.year)
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
  console.log("time_bins_sorted", time_bins_sorted);

  // var histogram = d3
  //   .histogram()
  //   .value((d) => d[selectedCategory])
  //   .domain(yScale.domain())
  //   .thresholds(70);

  // const histograms = time_bins.map((d) => histogram(d));

  // //max length of one bin in all the histograms
  // const max_length = d3.max(histograms, (d) => d3.max(d.map((d) => d.length)));

  // console.log("max_length", max_length);
  // console.log("histograms", histograms);



  // Checkboxes
  // Still no updating the y axis, only the label in the tooltip
  d3.selectAll("[name=features]").on("change", () => {
    selectedCategory = this.value;
    updateSelectedCategory(this.value);
  });

  const svg = d3
    .select("body")
    .select("#scrollable")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("id", "viz")
    .attr("viewBox", [0, 0, width, height])
    .attr("transform", "translate(20, -40)");

  const scrollcontainer = d3
  .select("body")
  .select("#scrollable")
  .on("scroll", console.log("scrolllll"));


  const tooltip = d3
    .select("body")
    .append("div")
    .style("position", "fixed")
    .style("display", "none")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "5px")
    .style("padding", "10px");
  // .on("mouseout", (e) => {
  //   d3.select(e.currentTarget)
  //     .style("z-index", 0)
  //     .transition()
  //     .duration(200)
  //     .style("opacity", 0)
  //     .style("visibility", "hidden");
  // });

  tooltip
    .append("img")
    .attr(
      "src",
      "https://github.com/holtzy/D3-graph-gallery/blob/master/img/section/ArcSmal.png?raw=true"
    )
    .attr("width", 100)
    .attr("height", 100);

  const tooltip_audio = tooltip
    .append("audio")
    .attr("controls", true)
    .attr("autoplay", true)
    .attr("id", "player");

  const distribution_plot = tooltip
    .append("svg")
    .attr("width", 200)
    .attr("height", 100)
    .style("background-color", selectedColor);

  tooltip.append("h3").attr("id", "tt-track").text("Title");
  tooltip.append("h4").attr("id", "tt-artist").text("Artist");
  tooltip.append("h4").attr("id", "tt-year").text("Year");
  tooltip.append("p").attr("id", "tt-activecat").text("Selected Category");
  // tooltip.append("p").attr("id", "tt-songpos").text("Song position"); // this can be deleted later

  const year_bins = svg
    .selectAll("year_bins")
    .data(time_bins_sorted)
    .join("g")
    .attr("transform", (d) => `translate(${timeScale(d.x0)}, ${height})`);

  const gap = 0.5;
  const columns_per_bin = 7;
  const dots = year_bins
    .selectAll("dot")
    .data((d) => {
      const radius =
        (timeScale(d.x1) - timeScale(d.x0)) / 2 / (columns_per_bin + gap);
      return d.map((p, i) => ({
        idx: i,
        id: p.id,
        name: p.name,
        value: p[selectedCategory],
        radius,
        artists: p.artists,
        year: p.year,
        id_artists: p.id_artists,
        y: -Math.floor(i / columns_per_bin) * 2 * radius - radius,
      }));
    })
    .join("circle")
    .attr("cx", (d, i) => (i % columns_per_bin) * 2 * d.radius + d.radius + gap)
    .attr("cy", (d) => d.y)
    .attr("r", (d) => d.radius)
    .attr("fill", primaryColor)
    .on("click", (e, d) => {
      selectedTrack = d;
      updateSelectedTrack(d, d3.select(e.currentTarget));

      // // fill distribution plot
      // distribution_plot.selectAll("*").remove();
      // const histogram = d3
      //   .histogram()
      //   .value((d) => d[selectedCategory])
      //   .domain(yScale.domain())
      //   .thresholds(70);
      // const histogram_data = histogram(data);
      // const xScale = d3
      //   .scaleLinear()
      //   .domain(d3.extent(histogram_data, (d) => d.x0))
      //   .range([0, 200]);
      // const yScale = d3
      //   .scaleLinear()
      //   .domain([0, d3.max(histogram_data, (d) => d.length)])
      //   .range([100, 0]);
      // const area = d3
      //   .area()
      //   .x((d) => xScale(d.x0))
      //   .y0(100)
      //   .y1((d) => yScale(d.length));
      // distribution_plot
      //   .append("path")
      //   .datum(histogram_data)
      //   .attr("fill", "#69b3a2")
      //   .attr("d", area);

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
          const preview = data.preview_url;
          console.log("preview", data.preview_url);
          tooltip_audio.attr("src", preview).attr("type", "audio/mpeg");
        });

      tooltip
        .style("right", "50")
        .style("top", "30")
        .style("width", 240) // tooltip max width
        .style("display", "none");

      tooltip.select("#tt-track").text(`${d.name}`);
      tooltip.select("#tt-artist").text(`${d.artists}`);
      tooltip.select("#tt-year").text(`${d.year}`);
      //tooltip.select("#tt-songpos").text(`${d.idx}`);

      tooltip
        .transition()
        .duration(200)
        .style("display", "block");
    })
    .on("mouseover", (e, d) => {
      d3.select(e.currentTarget)
        .transition()
        .duration("200")
        .attr("r", d.radius * 2.5);
    })

    .on("mouseout", (e, d) => {
      //console.log(e.currentTarget);

      d3.select(e.currentTarget)
        .transition()
        .duration("200")
        .attr(
          "r",
          selectedTrack && d.id === selectedTrack.id ? d.radius * 2 : d.radius
        );
    });

  // Timeline x Axis
  var svg_time = d3
    .select("#viz")
    .append("svg")
    .attr("width", width)
    .attr("height", 100);

  // Add scale to x axis
  let escala_x = d3
    .axisBottom()
    .scale(timeScale)
    .ticks(25)
    .tickFormat(d3.format("^20"));

  //Append group and insert axis
  var x_axis = svg_time
    .append("g")
    .call(escala_x)
    .attr("class", "tick")
    .attr("transform", "translate(0," + height - 40 + ")");

  function updateSelectedCategory(selectedCategory) {
    console.log("selectedCategory:", selectedCategory);
    tooltip
      .select("#tt-activecat")
      .text(`${selectedCategory}: ${d.value}`);
  }

  function updateSelectedTrack(selectedTrack, target) {
    console.log("selectedTrack", selectedTrack);

    dots
      .attr("fill", (d) => {
        if (
          selectedTrack &&
          selectedTrack.id_artists.some((s) => d.id_artists.includes(s))
        ) {
          return highlightColor;
        }
        return primaryColor;
      })
      .attr("r", (d) => d.radius);

    target
      .attr("r", (d) => d.radius * 2)
      .attr("fill", selectedColor);
  }

  function updateScaleWidth() {
    width = scale($(window).scrollTop(), 0, 4000, window.innerHeight * 2, 4000);
    return width;
  }
  

}