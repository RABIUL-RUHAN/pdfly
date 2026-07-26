import { Link } from "react-router-dom";

export default function SiteHeader() {
  return (
    <header className="site-header">
      <Link to="/" className="wordmark">
        PDFly<span className="dot">.</span>
      </Link>
      <p className="header-tagline">no accounts · nothing stored · runs entirely on this server</p>
    </header>
  );
}
