import humanizeDuration from "https://cdn.skypack.dev/humanize-duration";

const human = humanizeDuration.humanizer({
  language: "shortEn",
  languages: {
    shortEn: {
      y: () => "y",
      mo: () => "mo",
      w: () => "w",
      d: () => "d",
      h: () => "h",
      m: () => "m",
      s: () => "s",
      ms: () => "ms",
    },
  },
  conjunction: " ",
  round: true,
  serialCOMMA: false,
  spacer: "",
});

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
    valence: t.valence,
    acousticness: t.acousticness,
    danceability: t.danceability,
  });
}).then(useData);

const roundPercentage = (d) => Math.round(d * 100).toFixed(2);
const units = {
  tempo: {
    unit: "bpm",
    format: (d) => `${d.toFixed(1)} bpm`,
    tickFormat: (d) => `${d}`,
  },
  duration: {
    unit: "ms",
    format: (d) => `${humanizeDuration(d, { round: true })}`,
    tickFormat: (d) => `${human(d)}`,
  },
  loudness: {
    unit: "dB",
    format: (d) => `${d.toFixed(1)} dB`,
    tickFormat: (d) => `${d}`,
  },
  energy: {
    unit: "%",
    format: (d) => `${roundPercentage(d)} %`,
    tickFormat: (d) => `${d * 100}`,
  },
  valence: {
    unit: "%",
    format: (d) => `${roundPercentage(d)} %`,
    tickFormat: (d) => `${d * 100}`,
  },
  acousticness: {
    unit: "%",
    format: (d) => `${roundPercentage(d)} %`,
    tickFormat: (d) => `${d * 100}`,
  },
  danceability: {
    unit: "%",
    format: (d) => `${roundPercentage(d)} %`,
    tickFormat: (d) => `${d * 100}`,
  },
};

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
    "BQDMpqetwXNPM4UuKW4nDIURzTyxFpHdf5MF44QHUdvawMNPZn635uE9bi1RgdsD22GMYp5R5lB9MWWA1tL4PP8BVvswqQ-Gb18pta4dD0wXLso2wk4YJ4zsADiQLzR0HcMI3dcsW96PwQYECeQNzlMfoB23XMWBaGWsD01caNk";
  const backgroundColor = "#504943";
  const primaryColor = "#34ad5c";
  const secondaryColor = "#8ee6a4";

  let selectedCategory = "tempo";
  let selectedTrack = data.find((d) => d.id === "6YIp0sZ8Ykgt7bzHO62KTb");

  // Window size math
  const height = window.innerHeight;
  const gap = 0.5;
  const year_gap = 3;
  const radius = height / 350;
  const n_timebins = 100;

  const time_bin = d3
    .bin()
    .value((d) => d.year)
    .thresholds(n_timebins);
  const time_bins = time_bin(data);

  const max_bin_size = d3.max(time_bins, (d) => d.length);
  const columns_per_bin = Math.ceil(
    ((max_bin_size * radius * 2 + gap) / height) * 1.3
  );
  const width =
    time_bins.length * (columns_per_bin * (radius * 2 + gap) + year_gap);

  const extent = d3.extent(data, (d) => d.year);
  const timeScale = d3
    .scaleLinear()
    .domain([extent[0], extent[1] + 1])
    .range([0, width]);

  console.log(
    "extent",
    d3.extent(data, (d) => d.year)
  );

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
    .attr("width", 140)
    .attr("height", 140);

  const tooltip_audio = tooltip_g0
    .append("audio")
    .attr("controls", true)
    .attr("autoplay", true)
    .attr("id", "player");

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

  const tooltip_g = tooltip.append("div").attr("id", "col2");
  tooltip_g.append("h5").attr("id", "tt-year").text("Year");
  tooltip_g.append("h3").attr("id", "tt-track").text("Title");
  tooltip_g.append("h4").attr("id", "tt-artist").text("Artist");
  tooltip_g.append("p").attr("id", "tt-activecat").text("Selected Category");
  tooltip_g
    .append("p")
    .attr("id", "tt-activecatvalue")
    .text("Selected Category Value");

  //Density plot
  const margin = { top: 50, bottom: 20, left: 10, right: 10 };
  const density_width = 400 - margin.left - margin.right;
  const density_height = 220 - margin.top - margin.bottom;
  const cursor_width = 5;

  const density_plot = tooltip_g
    .append("svg")
    .attr("width", density_width + margin.left + margin.right)
    .attr("height", density_height + margin.top + margin.bottom);

  const density_graph = density_plot
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  density_graph
    .append("path")
    .attr("id", "density-back")
    .attr("class", "density")
    .attr("opacity", 1)
    .attr("fill", primaryColor)
    .attr("stroke-linejoin", "round")
    .style("clip-path", "url(#clipRect)");

  density_graph
    .append("path")
    .attr("id", "density-back")
    .attr("class", "density")
    .attr("opacity", 1)
    .attr("fill", backgroundColor)
    .attr("stroke", backgroundColor)
    .attr("stroke-width", 1)
    .attr("stroke-linejoin", "round");

  density_graph
    .append("path")
    .attr("id", "density-artist-front")
    .attr("class", "density-artist")
    .attr("opacity", 1)
    .attr("fill", primaryColor)
    .attr("stroke-linejoin", "round")
    .style("clip-path", "url(#clipRect)");

  density_graph
    .append("path")
    .attr("id", "density-artist-back")
    .attr("class", "density-artist")
    .attr("opacity", 0.8)
    .attr("fill", secondaryColor)
    .attr("stroke", secondaryColor)
    .attr("stroke-opacity", 1)
    .attr("stroke-width", 1)
    .attr("stroke-linejoin", "round");

  density_graph
    .append("clipPath")
    .attr("id", "clipRect")
    .append("rect")
    .attr("y", 0)
    .attr("width", cursor_width)
    .attr("height", density_height);

  const densityXAxis = density_graph.append("g");

  const labels = density_plot.append("g");
  const labels_circle_x = density_width - 80;
  const labels_text_x = density_width - 70;
  labels
    .append("circle")
    .attr("cx", labels_circle_x)
    .attr("cy", 10)
    .attr("r", 5)
    .style("fill", backgroundColor);
  labels
    .append("circle")
    .attr("cx", labels_circle_x)
    .attr("cy", 30)
    .attr("r", 5)
    .style("fill", primaryColor);
  labels
    .append("circle")
    .attr("cx", labels_circle_x)
    .attr("cy", 50)
    .attr("r", 5)
    .style("fill", secondaryColor);
  labels
    .append("text")
    .attr("x", labels_text_x)
    .attr("y", 10)
    .text("All Tracks")
    .style("font-size", "17px")
    .attr("alignment-baseline", "middle");
  labels
    .append("text")
    .attr("x", labels_text_x)
    .attr("y", 30)
    .text("This Artist")
    .style("font-size", "17px")
    .attr("alignment-baseline", "middle");
  labels
    .append("text")
    .attr("x", labels_text_x)
    .attr("y", 50)
    .text("This Track")
    .style("font-size", "17px")
    .attr("alignment-baseline", "middle");

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

  //Append group and insert X axis
  svg_time
    .append("g")
    .call(escala_x)
    .attr("class", "tick")
    .attr("transform", `translate(0, ${height - 46})`);

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
        const target = d3.select(e.currentTarget);
        target.raise();
        updateSelectedTrack(target);
      })
      .on("mouseover", (e, d) => {
        d3.select(e.currentTarget)
          .raise()
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
            selectedTrack && d.id === selectedTrack.id ? radius * 3 : radius
          );
      })
      .attr("class", "dots")
      .transition()
      .duration(2400)
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y);

    updateDots();
  }

  function updateDots() {
    d3.selectAll(".dots")
      .attr("r", (d) =>
        participates(d, selectedTrack) ? radius * 1.2 : radius
      )
      .style("stroke-width", (d) => (participates(d, selectedTrack) ? 0.4 : 0))
      .attr("fill", (d) =>
        participates(d, selectedTrack) ? secondaryColor : backgroundColor
      )
      .style("stroke", (d) => "white");
  }

  function updateDensityPlot() {
    const density_x = d3
      .scaleLinear()
      .domain(d3.extent(data, (d) => d[selectedCategory]))
      .nice()
      .range([0, density_width]);

    densityXAxis
      .attr("transform", `translate(0, ${density_height})`)
      .call(
        d3
          .axisBottom(density_x)
          .ticks(5)
          .tickFormat(units[selectedCategory].tickFormat)
      );

    const values = data.map((d) => d[selectedCategory]);
    const max = d3.max(values);
    const scale = d3.scaleLinear().domain([0, max]).range([0, 1]);
    const scaledValues = values.map((d) => scale(d));
    console.log("values", values);
    console.log("scaledValues", scaledValues);

    const kernel = Math.floor(values.length / 1000) * 2 + 1;
    const t = 50; //Math.floor(values.length / 1000);
    console.log("kernel", kernel);
    console.log("ticks", t);
    const kde = kernelDensityEstimator(
      kernelEpanechnikov(kernel),
      density_x.ticks(t)
    );
    const density = kde(scaledValues);

    const valuesArtist = data
      .filter((d) => participates(d, selectedTrack))
      .map((d) => scale(d[selectedCategory]));
    const kernel_artist = Math.floor(valuesArtist.length / 10) * 2 + 1;
    const t_artits = t; //Math.floor(valuesArtist.length / 1000);
    console.log("kernel_artist", kernel_artist);
    console.log("ticks_artist", t_artits);
    const kdeArtist = kernelDensityEstimator(
      kernelEpanechnikov(kernel_artist),
      density_x.ticks(t_artits)
    );

    const density_artist = kdeArtist(valuesArtist);

    console.log("selectedTracks", valuesArtist);
    console.log("artist density", density_artist);

    const density_min = d3.min(density, (d) => d[1]);
    const density_max = d3.max(density, (d) => d[1]);
    const margin = (density_max - density_min) * 0.1;

    const density_y = d3
      .scaleLinear()
      .range([density_height, 0])
      .domain([density_min, density_max + margin]);

    const density_artist_min = d3.min(density_artist, (d) => d[1]);
    const density_artist_max = d3.max(density_artist, (d) => d[1]);
    const margin_artist = (density_artist_max - density_artist_min) * 0.1;

    const density_artist_y = d3
      .scaleLinear()
      .range([density_height, 0])
      .domain([density_artist_min, density_artist_max + margin_artist]);

    density_plot
      .selectAll(".density")
      .datum(density)
      .attr(
        "d",
        d3
          .area()
          .curve(d3.curveBasis)
          .x((d) => density_x(d[0]))
          .y0(density_height)
          .y1((d) => density_y(d[1]))
      );

    density_plot
      .selectAll(".density-artist")
      .datum(density_artist)
      .attr(
        "d",
        d3
          .area()
          .curve(d3.curveBasis)
          .x((d) => density_x(d[0]))
          .y0(density_height)
          .y1((d) => density_artist_y(d[1]))
      );

    density_plot
      .select("rect")
      .attr("x", density_x(selectedTrack[selectedCategory]) - cursor_width / 2);
  }

  function updateSelectedTrack(target) {
    updateDots();
    updateDensityPlot();
    updateTooltip();
    target.attr("r", radius * 3).attr("fill", primaryColor);

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
        const player = document.getElementById("player");
        if (preview == null) {
          player.pause();
          player.style.display = "none";
        } else {
          tooltip_audio.attr("src", preview).attr("type", "audio/mpeg");
          player.style.display = "block";
        }
      });
  }

  function updateTooltip() {
    tooltip.transition().duration(200).style("display", "flex");
    tooltip.select("#tt-year").text(`${selectedTrack.year}`);
    tooltip.select("#tt-track").text(`${selectedTrack.name}`);
    tooltip.select("#tt-artist").text(`${selectedTrack.artists.join(", ")}`);
    tooltip.select("#tt-activecat").text(`${selectedCategory}`);
    tooltip
      .select("#tt-activecatvalue")
      .text(
        `${units[selectedCategory].format(selectedTrack[selectedCategory])}`
      );
  }

  updateSelectedCategory(selectedCategory);
}

function participates(trackA, trackB) {
  return (
    trackA &&
    trackB &&
    trackA.id_artists.some((s) => trackB.id_artists.includes(s))
  );
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
