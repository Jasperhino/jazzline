d3.csv("data/tracks_filtered_jazz.csv", (track) => {
  return d3.autoType({
    id: track.id,
    artists: track.artists,
    id_artists: track.id_artists,
    name: track.name,
    year: track.year,
    tempo: track.tempo,
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
    "BQCi9SnVGAQltjwJdEve_GTXC5TdyFKBdmwRot_tz2WM-UJPqoJSk4pLAQM9MFhV3yvrPKb3Uhj3eohGrx-9LbHUeoyckz6aIDin73ZrmUB-dsD1_b-lqEXmcW9muBomPTQHoQiaXSdlif_GlVk1SwhzgtvUU1edwDa1WDRm5T8";
  const categories = [
    "tempo",
    "duration",
    "loudness",
    "energy",
    "valence",
    "acousticness",
  ];
  const primaryColor = "black";
  const highlightColor = "#69b3a2";

  let selectedCategory = "tempo";
  let selectedTrack = null;

  const width = 1800;
  const height = 900;

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

  const n_timebins = 200;
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

  const histograms = time_bins.map((d) => histogram(d));

  //max length of one bin in all the histograms
  const max_length = d3.max(histograms, (d) => d3.max(d.map((d) => d.length)));

  var xNum = d3.scaleLinear().range([0, 5]).domain([-max_length, max_length]);

  console.log("max_length", max_length);
  console.log("histograms", histograms);

  console.log("bins", time_bins);

  console.log("bins_sorted", time_bins_sorted);

  console.log(data);
  const svg = d3
    .select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height]);

  const tooltip = d3
    .select("body")
    .append("div")
    .style("position", "absolute")
    .style("visibility", "visible")
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
  tooltip.append("h2").text("Title");
  tooltip.append("p").text("Description");
  const tooltip_audio = tooltip
    .append("audio")
    .attr("controls", true)
    .attr("autoplay", true)
    .attr("id", "player");

  const distribution_plot = tooltip
    .append("svg")
    .attr("width", 200)
    .attr("height", 100)
    .style("background-color", "red");

  const wilkinsons = svg
    .selectAll(null)
    .data(time_bins_sorted)
    .join("g")
    .attr("transform", (d) => `translate(${timeScale(d.x0)}, ${height})`);
  // .append("path")
  // .datum((d) => d.value)
  // .style("stroke", "none")
  // .style("fill", "#69b3a2")
  // .attr(
  //   "d",
  //   d3
  //     .area()
  //     .x0((d) => xNum(-d.length))
  //     .x1((d) => xNum(d.length))
  //     .y((d) => y(d.x0))
  //     .curve(d3.curveCatmullRom)
  // );
  const columns_per_bin = 4;
  const dots = wilkinsons
    .selectAll("dot")
    .data((d) => {
      const radius = (timeScale(d.x1) - timeScale(d.x0)) / columns_per_bin;
      return d.map((p, i) => ({
        idx: i,
        id: p.id,
        name: p.name,
        value: p[selectedCategory],
        radius,
        artists: p.artists,
        id_artists: p.id_artists,
        y: -Math.floor(i / columns_per_bin) * 2 * radius - radius,
      }));
    })
    .join("circle")
    .attr("cx", (d, i) => (i % columns_per_bin) * 2 * d.radius + d.radius)
    .attr("cy", (d) => d.y)
    .attr("r", (d) => d.radius)

    .on("click", (e, d) => {
      selectedTrack = d;
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
      console.log("selectedTrack", selectedTrack);
      d3.select(e.currentTarget).attr("r", (d) => d.radius * 2);

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

      //retrive cover image using spotify api
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
        .style("left", e.offsetX + 30 + "px")
        .style("top", e.offsetY + "px")
        .style("visibility", "visible");

      tooltip.select("h2").text(`${d.name} - ${d.artists}`);
      tooltip.select("p").text(`${selectedCategory}: ${d.value}`);

      tooltip
        .transition()
        .duration(200)
        .style("opacity", 1)
        .style("visibility", "visible");
    })
    .on("mouseover", (e, d) => {
      d3.select(e.currentTarget)
        .transition()
        .duration("200")
        .attr("r", d.radius * 2);
    })

    .on("mouseout", (e, d) => {
      d3.select(e.currentTarget)
        .transition()
        .duration("200")
        .attr(
          "r",
          selectedTrack && d.id === selectedTrack.id ? d.radius * 2 : d.radius
        );
    });

  const globalScale = width / 5000;
  const extent = [
    [0, 0],
    [width, 0],
  ];
  const scaleExtent = [width / 5000, 2]; // Infinity]
  const translateExtent = [
    [0, 0],
    [5000, 0],
  ];
  const zoom = d3
    .zoom()
    .extent(extent)
    .scaleExtent(scaleExtent)
    .translateExtent(translateExtent)
    .on("zoom", (e) => {
      console.log(e);
      const { k, x, y } = e.transform;
      console.log("zoom", k, x, y);
    });

  svg.call(zoom);
  svg.call(zoom.scaleBy, globalScale);
}
