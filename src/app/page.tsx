import Experience3D from "@/components/World/Experience3D";
import { worldContent as C } from "@/data/world";
import { MODEL_PACK_URL } from "@/world/modelPack";

// Start downloading the world's assets with the HTML, in parallel with the
// three.js chunk, instead of after it has loaded and parsed.
const PRELOAD = [MODEL_PACK_URL, "/fonts/space-grotesk-bold.typeface.json", "/fonts/inter-medium.typeface.json"];

// The homepage is a drivable 3D world; this block carries the same content
// for search engines and screen readers.
function SeoContent() {
  return (
    <div className="sr-only">
      <h1>{C.fullName}</h1>
      <section>
        <h2>About</h2>
        <p>{C.about.title.en}</p>
        <p>{C.about.body.en}</p>
        <p>{C.about.meta.en}</p>
        <a href={C.resumeUrl}>Resume</a>
      </section>
      <section>
        <h2>Projects</h2>
        <ul>
          {C.projects.map((p) => (
            <li key={p.id}>
              <a href={p.url}>{p.title.en}</a>: {p.description.en} ({p.tech.join(", ")})
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2>Skills</h2>
        <p>{C.skills.join(", ")}</p>
      </section>
      <section>
        <h2>Contact</h2>
        <ul>
          {C.links.map((l) => (
            <li key={l.id}>
              <a href={l.url}>{l.label}</a>
            </li>
          ))}
          <li>
            <a href={C.blogUrl}>Blog</a>
          </li>
        </ul>
      </section>
    </div>
  );
}

export default function Home() {
  return (
    <main>
      {PRELOAD.map((href) => (
        <link key={href} rel="preload" href={href} as="fetch" crossOrigin="anonymous" />
      ))}
      <SeoContent />
      <Experience3D />
    </main>
  );
}
