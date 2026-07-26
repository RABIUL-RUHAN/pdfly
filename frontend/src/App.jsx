import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import ToolPage from "./pages/ToolPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/tool/:toolKey" element={<ToolPage />} />
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
