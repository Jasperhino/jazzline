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
      .split(", ")
      .map((a) => a.slice(1, -1)),
  }));

  const apiToken =
    "BQCazgoKwCyjrT2lwkWhIokbQGfmKaItnhqPtj8L_-s0Rgp1g6ZS6pLqyNX9rSQ7FPcSiDLe-hY3lhCY3dTFAaQ_LUS6DBAicoTw0qiERFU301ep5Ivc1edz2dBlH1TzPNfPHMI38S_A6n4SmG44cpLcfoD_gy7Ics5xU4gtb4QQPZ8IMOI3yRe5J2n3Y2A";

  const primaryColor = "#504943";
  const highlightColor = "#8ee6a4";
  const selectedColor = "#34ad5c";

  let selectedTrack = data.find((d) => d.id === "4rojclsbFVQvwhxIR0onYr");
  let selectedCategory = "energy";

  // Window size math
  const height = window.innerHeight;
  const gap = 0.5;
  const year_gap = 3;
  const radius = height / 400;
  const n_timebins = 100;

  const time_bin = d3
    .bin()
    .value((d) => d.year)
    .thresholds(n_timebins);
  const time_bins = time_bin(data);

  const max_bin_size = d3.max(time_bins, (d) => d.length);
  const columns_per_bin = Math.ceil(
    ((max_bin_size * radius * 2 + gap) / height) * 1.5
  );
  const width =
    time_bins.length * (columns_per_bin * (radius * 2 + gap) + year_gap);

  const timeScale = d3
    .scaleLinear()
    .domain(d3.extent(data, (d) => d.year))
    .range([0, width]);

  console.log("time_bins", time_bins);
  console.log("radius", radius);
  console.log("width", width);
  console.log("height", height);
  console.log("max_bin_size", max_bin_size);
  console.log("columns_per_bin", columns_per_bin);

  let tracks_by_year = time_bins.map((d) => {
    return {
      year: d.x0.toString(),
      tracks: Array.from(d),
    };
  });
  console.log("tracks_by_year", tracks_by_year);

  d3.selectAll("[name=features]").on("change", (e) => {
    selectedCategory = e.target.value;
    updateSelectedCategory();
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

  //Density plot
  const density_width = 400;
  const density_height = 200;
  const cursor_width = 5;

  const density_plot = tooltip_g
    .append("svg")
    .attr("width", density_width)
    .attr("height", density_height)
    .attr("viewBox", [0, 0, density_width, density_height]);

  density_plot
    .append("path")
    .attr("id", "desnity-font")
    .attr("fill", "#000")
    .attr("stroke", "#000")
    .attr("opacity", ".8")
    .attr("stroke-linejoin", "round")
    .style("clip-path", "url(#clipRect)");

  density_plot
    .append("path")
    .attr("id", "desnity-back")
    .attr("fill", "#69b3a2")
    .attr("opacity", ".8")
    .attr("stroke", "#000")
    .attr("stroke-width", 1)
    .attr("stroke-linejoin", "round");

  density_plot
    .append("clipPath")
    .attr("id", "clipRect")
    .append("rect")
    .attr("y", 0)
    .attr("width", cursor_width)
    .attr("height", density_height);

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

  function updateSelectedCategory() {
    updateDensityPlot();
    updateTooltip();

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
        (d) =>
          d.tracks.map((t, i) => ({
            ...t,
            x: (i % columns_per_bin) * (radius * 2 + gap) + radius,
            y: -Math.floor(i / columns_per_bin) * (radius * 2 + gap) + radius,
          })),
        (t) => t.id
      )
      .join("circle")
      .on("click", (e, d) => {
        selectedTrack = d;
        updateSelectedTrack(d, d3.select(e.currentTarget));
      })
      .on("mouseover", (e, d) => {
        d3.select(e.currentTarget)
          .transition()
          .duration("200")
          .attr("r", radius * 2.5);
      })
      .on("mouseout", (e, d) => {
        d3.select(e.currentTarget)
          .transition()
          .duration("200")
          .attr(
            "r",
            selectedTrack && d.id === selectedTrack.id ? radius * 2 : radius
          );
      })
      .attr("class", "dots")
      .attr("r", radius)
      .attr("fill", (d) =>
        applyIfSelected(selectedTrack, d, highlightColor, primaryColor)
      )
      .transition()
      .duration(2000)
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y);
  }

  function updateDensityPlot() {
    const density_x = d3
      .scaleLinear()
      .domain(d3.extent(data, (d) => d[selectedCategory]))
      .range([0, density_width]);

    const kde = kernelDensityEstimator(
      kernelEpanechnikov(7),
      density_x.ticks(40)
    );

    const density = kde(data.map((d) => d[selectedCategory]));
    console.log(`density for ${selectedCategory}`, density);

    const density_y = d3
      .scaleLinear()
      .range([density_height, 0])
      .domain([0, d3.max(density, (d) => d[1])]);

    console.log("density_y", density_y.domain());

    console.log(density_x(0), density_x(0.1), density_x(0.2), density_x(0.3));

    console.log(density_y(0), density_y(0.1), density_y(0.2), density_y(0.3));

    density_plot
      .selectAll("path")
      .data([density, density])
      .attr(
        "d",
        d3
          .area()
          .curve(d3.curveCardinal)
          .x((d) => density_x(d[0]))
          .y0(density_height)
          .y1((d) => density_y(d[1]))
      );

    density_plot
      .select("rect")
      .attr("x", density_x(selectedTrack[selectedCategory]) - cursor_width / 2);
  }

  function updateSelectedTrack() {
    updateDensityPlot();
    updateTooltip();

    d3.selectAll(".dots")
      .attr("fill", (d) =>
        applyIfSelected(selectedTrack, d, highlightColor, primaryColor)
      )
      .attr("r", (d) => applyIfSelected(selectedTrack, d, radius * 1.2, radius))
      .style("stroke-width", (d) =>
        applyIfSelected(selectedTrack, d, "0.4", "0")
      )
      .style("stroke", (d) =>
        applyIfSelected(selectedTrack, d, "#278a48", "red")
      );

    target.attr("r", radius * 2).attr("fill", selectedColor);

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
  }

  function updateTooltip() {
    tooltip.select("#tt-value").text(`${selectedTrack[selectedCategory]}`);
    tooltip.transition().duration(200).style("display", "block");
    tooltip.select("#tt-year").text(`${selectedTrack.year}`);
    tooltip.select("#tt-track").text(`${selectedTrack.name}`);
    tooltip.select("#tt-artist").text(`${selectedTrack.artists.join(", ")}`);
    tooltip
      .select("#tt-activecat")
      .text(`${selectedCategory}: ${selectedTrack[selectedCategory]}`);
  }

  updateSelectedCategory(selectedCategory);
}

function applyIfSelected(
  selectedTrack,
  currentTrack,
  selectedValue,
  defaultValue
) {
  if (
    selectedTrack &&
    selectedTrack.id_artists.some((s) => currentTrack.id_artists.includes(s))
  ) {
    return selectedValue;
  }
  return defaultValue;
}

function kernelDensityEstimator(kernel, X) {
  return function (V) {
    return X.map(function (x) {
      return [
        x,
        d3.mean(V, function (v) {
          return kernel(x - v);
        }),
      ];
    });
  };
}
function kernelEpanechnikov(k) {
  return function (v) {
    return Math.abs((v /= k)) <= 1 ? (0.75 * (1 - v * v)) / k : 0;
  };
}
