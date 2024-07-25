const includes = document.querySelectorAll(".chunk");
includes.forEach((chunk) => {
  const includes = chunk.querySelectorAll(".include");
  includes.forEach((include) =>
    include.addEventListener("click", () => {
      chunk.classList.toggle("folded");
    }),
  );
});

const toggleState = new Map();
function toggleAll(section) {
  const fold = !(toggleState.has(section) ? toggleState.get(section) : true);
  toggleState.set(section, fold);
  section.querySelector(".expand").classList.toggle("hide", !fold);
  section.querySelector(".collapse").classList.toggle("hide", fold);
  section.querySelector("h2").title = fold ? "Expand all" : "Collapse all";
  const includes = section.querySelectorAll(".chunk");
  includes.forEach((chunk) => {
    chunk.classList.toggle("folded", fold);
  });
}

const [vs, fs] = document.querySelectorAll(".shader");
vs.querySelector("h2").addEventListener("click", () => toggleAll(vs));
fs.querySelector("h2").addEventListener("click", () => toggleAll(fs));
