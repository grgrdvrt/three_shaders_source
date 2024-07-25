const { readdirSync, readFileSync, writeFileSync } = require("fs");

const threeDirectory = process.argv[2];
const chunksPath = threeDirectory + "/src/renderers/shaders/ShaderChunk";
const shadersPath = threeDirectory + "/src/renderers/shaders/ShaderLib";

//from https://stackoverflow.com/questions/6234773/can-i-escape-html-special-chars-in-javascript
const escapeHtml = (unsafe) => {
  return unsafe
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

const chunks = readdirSync(chunksPath);

const chunksMap = new Map();
chunks.forEach((filePath) => {
  const chunkSrc = readFileSync(chunksPath + "/" + filePath, "utf8");
  chunksMap.set(
    filePath.replace(".glsl.js", ""),
    escapeHtml(chunkSrc.split("\n").slice(1, -2).join("\n")),
  );
});

const unusedChunksNames = new Set(chunksMap.keys());

const shaderPageTemplate = readFileSync(
  __dirname + "/templates/shader_template.html",
  "utf8",
);

function injectChunks(shaderSrc) {
  return shaderSrc
    .replace(/#include &lt;(.*)&gt;/g, (match, p1) => {
      unusedChunksNames.delete(p1);
      return `</code></pre><div class="chunk folded">
    <pre class="include include-folded"><code class="language-glsl">${match}</code></pre>
    <pre class="include include-opened"><code class="language-glsl">// &lt;${p1}&gt;</code></pre>
    <pre class="src"><code class="language-glsl">${chunksMap.get(p1)}</code></pre>
    </div><pre><code class="language-glsl">`;
    })
    .replaceAll(/<pre><code class="language-glsl">\s+<\/code><\/pre>/g, "");
}

function getShaderName(fileName) {
  return fileName.replace(".glsl.js", "");
}

const shaders = readdirSync(shadersPath);
function makeNav(pageName) {
  const navShaders = shaders
    .map((s) => {
      const shaderName = getShaderName(s);
      return `<li
      ${pageName === shaderName ? 'class="selected"' : ""}
      ><a href="./${shaderName}.html">${shaderName}</a></li>`;
    })
    .join("");
  return `
    <a class="indexLink"
    href="./index.html"
        ><svg
            xmlns="http://www.w3.org/2000/svg"
            height="24px"
            viewBox="0 -960 960 960"
            width="24px"
            fill="currentColor"
        >
            <path
                d="M240-200h120v-240h240v240h120v-360L480-740 240-560v360Zm-80 80v-480l320-240 320 240v480H520v-240h-80v240H160Zm320-350Z"
            /></svg
    ></a>
    <ul>
    ${navShaders}
    </ul>
    <a
    class="otherChunksLink"
    href="./otherChunks.html">Other Chunks</a>
  </nav>`;
}
shaders.forEach((filePath) => {
  const shaderName = getShaderName(filePath);

  const shaderSrc = escapeHtml(
    readFileSync(shadersPath + "/" + filePath, "utf8"),
  );
  const [a, vertex, b, fragment] = shaderSrc.split("`");

  const vertexContent = injectChunks(vertex);
  const fragmentContent = injectChunks(fragment);

  const fileContent = shaderPageTemplate
    .replace("{{nav}}", makeNav(shaderName))
    .replace("{{title}}", shaderName)
    .replace("{{file}}", filePath)
    .replace("{{vertexContent}}", vertexContent)
    .replace("{{fragmentContent}}", fragmentContent);

  writeFileSync(`${__dirname}/docs/${shaderName}.html`, fileContent);
});

/*index*/
const indexTemplate = readFileSync(
  __dirname + "/templates/index_template.html",
  "utf8",
);
const indexContent = indexTemplate.replace("{{nav}}", makeNav("index"));
writeFileSync(`${__dirname}/docs/index.html`, indexContent);

/*other chunks */
const otherChunksTemplate = readFileSync(
  __dirname + "/templates/other_chunks_template.html",
  "utf8",
);
const otherChunks = Array.from(unusedChunksNames)
  .map((chunkName) => {
    return `
  <section class="shader">
      <h2>${chunkName}</h2>
      <div class="code">
          <pre><code class="language-glsl">${chunksMap.get(chunkName)}</code></pre>
      </div>
  </section>
  `;
  })
  .join("");
const otherChunksContent = otherChunksTemplate
  .replace("{{nav}}", makeNav("other"))
  .replace("{{otherChunksContent}}", otherChunks);
writeFileSync(`${__dirname}/docs/otherChunks.html`, otherChunksContent);

console.log("generated");
