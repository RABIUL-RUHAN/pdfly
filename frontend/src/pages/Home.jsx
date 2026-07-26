import { Link } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import Icon from "../components/Icon";
import { TOOLS, CATEGORIES } from "../toolsConfig";

const CATEGORY_COPY = {
  Organize: "Rearrange what's already in the file.",
  Convert: "Move content between PDF and other formats.",
  Optimize: "Shrink it or mark it before you send it.",
};

export default function Home() {
  return (
    <div className="page">
      <SiteHeader />

      <section className="hero">
        <h1>
          Every PDF tool.
          <br />
          One black canvas.
        </h1>
        <p>
          Merge, split, convert, compress, and edit PDFs directly in your browser. Pick a tool
          below — every other tool stays one click away once you're inside.
        </p>
      </section>

      {CATEGORIES.map((category) => (
        <section className="tool-section" key={category}>
          <div className="tool-section-heading">
            <h2>{category}</h2>
            <p>{CATEGORY_COPY[category]}</p>
          </div>
          <div className="tool-grid">
            {TOOLS.filter((t) => t.category === category).map((tool) => (
              <Link to={`/tool/${tool.key}`} className="tool-card" key={tool.key}>
                <span className="tool-card-icon" style={{ "--tool-color": tool.color }}>
                  <Icon name={tool.icon} size={26} />
                </span>
                <span className="tool-card-body">
                  <span className="tool-card-title">{tool.label}</span>
                  <span className="tool-card-desc">{tool.description}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <footer className="site-footer">
        Files are deleted from the server immediately after processing.
      </footer>
    </div>
  );
}
