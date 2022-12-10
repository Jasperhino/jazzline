d3.csv("data/tracks_filtered_jazz.csv", (t) => {
  return d3.autoType({
    id: t.id,
    artists: t.artists,
    id_artists: t.id_artists,
    name: t.name,
    year: t.year,
    tempo: t.tempo,
    duration: t.duration_ms,
    loudness: t.loudness,
    energy: t.energy,
    //valance: t.valance,
    acousticness: t.acousticness,
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
      .split(",  ")
      .map((a) => a.slice(1, -1)),
  }));

  console.log("data", data);

  const apiToken =
    "BQCy05lRXshl9VpyPH9BFEgcspBHG2E0dj__OsoqYKTGiG297IwM7ajVmb7Gbgw4s2_htgmd02LenOS9fcmloBT9u";

  const primaryColor = "#36312D";
  const highlightColor = "#8ace9b";
  const selectedColor = "#4F9D69";

  let selectedCategory = "tempo";

  const gap = 0.5;
  const columns_per_bin = 8;
  const radius = (columns_per_bin + gap) / 2 - 0.1;

  //const width = scale($(window).scrollTop(0), 0, 4000, window.innerWidth - 60, 4000);
  const width = 4000;
  const height = window.innerHeight;

  const timeScale = d3
    .scaleLinear()
    .domain(d3.extent(data, (d) => d.year))
    .range([0, width]);

  const n_timebins = 100;
  const time_bin = d3
    .bin()
    .value((d) => d.year)
    .thresholds(n_timebins)
    .domain(timeScale.domain());
  const time_bins = time_bin(data);

  let tracks_by_year = time_bins.map((d) => {
    return {
      year: d.x0.toString(),
      tracks: Array.from(d),
    };
  });
  console.log("tracks_by_year", tracks_by_year);

  d3.selectAll("[name=features]").on("change", (e) => {
    selectedCategory = e.target.value;
    updateSelectedCategory(selectedCategory);
  });

  const svg = d3
    .select("body")
    .select("#scrollable")
    .append("svg")
    .attr("width", width + 50)
    .attr("height", height)
    .attr("id", "viz")
    .attr("viewBox", [0, 0, width, height])
    .attr("transform", `translate(20, 0)`);

  // const scrollcontainer = d3
  // .select("#scrollable")
  // .on("scroll", console.log("scrolllll"));

  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "track-info")
    .style("position", "fixed")
    .style("display", "none");

  const tooltip_g0 = tooltip.append("div").attr("id", "col1");

  tooltip_g0
    .append("img")
    .attr("src", "https://thisartworkdoesnotexist.com/")
    .attr("id", "track-information")
    .attr("width", 160)
    .attr("height", 160);

  const tooltip_audio = tooltip_g0
    .append("audio")
    .attr("controls", true)
    .attr("autoplay", true)
    .attr("id", "player");

  const tooltip_g = tooltip.append("div").attr("id", "2col");
  tooltip_g.append("h5").attr("id", "tt-year").text("Year");
  tooltip_g.append("h3").attr("id", "tt-track").text("Title");
  tooltip_g.append("h4").attr("id", "tt-artist").text("Artist");
  tooltip_g.append("p").attr("id", "tt-activecat").text("Selected Category");
  // tooltip_g.append("p").attr("id", "tt-value").text("Value");
  // tooltip_g.append("p").attr("id", "tt-songpos").text("Song position"); // this can be deleted later

  const distribution_plot = tooltip_g
    .append("svg")
    .attr("width", 200)
    .attr("height", 100)
    .style("background-color", selectedColor);

  // Timeline x Axis
  var svg_time = d3
    .select("#viz")
    .append("g")
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
    .attr("transform", `translate(0, ${height - 50})`);

  //Group all bins so they can be reordered
  var data_g = d3.select("#viz").append("g").attr("id", "data_group");

  let dots;

  function updateSelectedCategory(selectedCategory) {
    tracks_by_year.forEach((d) => {
      d.tracks.sort((a, b) =>
        d3.ascending(+a[selectedCategory], +b[selectedCategory])
      );
    });

    console.log(`resorted by ${selectedCategory}`, tracks_by_year);

    const year_bins = data_g
      .selectAll(".year_bins")
      .data(tracks_by_year, (d) => d.year)
      .join("g")
      .attr(
        "transform",
        (d) => `translate(${timeScale(d.year)}, ${height - 51})`
      )
      .attr("class", "year_bins");

    dots = year_bins
      .selectAll(".dots")
      .data(
        (d) => d.tracks,
        (t) => t.id
      )
      .join(
        (enter) => {
          let e = enter.append("circle").attr("fill", "red");
          console.log("e", e);
          return e;
        },
        (update) => {
          let u = update.attr("fill", "purple");
          console.log("u", u);
          return u;
        }
      )
      .attr("class", "dots")
      .attr("r", (d) => radius)

      .attr("cx", (d, i) => (i % columns_per_bin) * (radius * 2 + gap) + radius)
      .attr(
        "cy",
        (d, i) => -Math.floor(i / columns_per_bin) * (radius * 2 + gap) + radius
      );
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
      .attr("r", (d) => radius);

    target.attr("r", (d) => radius * 2).attr("fill", selectedColor);

    tooltip.transition().duration(200).style("display", "block");

    const url = `https://api.spotify.com/v1/tracks/${selectedTrack.id}`;
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
  }

  updateSelectedCategory("tempo");
}
