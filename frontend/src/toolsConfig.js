import MergePanel from "./components/panels/MergePanel";
import SplitPanel from "./components/panels/SplitPanel";
import CompressPanel from "./components/panels/CompressPanel";
import ConvertPanel from "./components/panels/ConvertPanel";
import ImageToPdfPanel from "./components/panels/ImageToPdfPanel";
import ToWordPanel from "./components/panels/ToWordPanel";
import WordToPdfPanel from "./components/panels/WordToPdfPanel";
import WatermarkPanel from "./components/panels/WatermarkPanel";
import RotatePanel from "./components/panels/RotatePanel";
import EditPdfPanel from "./components/panels/EditPdfPanel";

// Single source of truth for every tool: the home grid, the in-tool
// sidebar, and the route table all read from this list. Each tool
// carries its own accent color, which is the one color-coding system
// that runs through the whole app (card badge on Home, active rail on
// the tool page).
export const TOOLS = [
  {
    key: "merge",
    label: "Merge PDF",
    short: "Combine files",
    description: "Combine two or more PDFs into a single document, in the order you add them.",
    icon: "merge",
    color: "#5B8CFF",
    category: "Organize",
    component: MergePanel,
  },
  {
    key: "split",
    label: "Split PDF",
    short: "Pull out pages",
    description: "Extract a page range into its own PDF file.",
    icon: "split",
    color: "#FF9142",
    category: "Organize",
    component: SplitPanel,
  },
  {
    key: "rotate",
    label: "Rotate PDF",
    short: "Fix orientation",
    description: "Rotate every page in a PDF by 90°, 180°, or 270°.",
    icon: "rotate",
    color: "#FF6FA0",
    category: "Organize",
    component: RotatePanel,
  },
  {
    key: "editpdf",
    label: "Edit PDF",
    short: "Reorder & retext",
    description: "Delete, reorder, and rotate pages, and edit text in place.",
    icon: "editpdf",
    color: "#33C77D",
    category: "Organize",
    component: EditPdfPanel,
  },
  {
    key: "convert",
    label: "PDF to Image",
    short: "Export as image",
    description: "Turn each page of a PDF into a PNG or JPG image.",
    icon: "convert",
    color: "#B084FF",
    category: "Convert",
    component: ConvertPanel,
  },
  {
    key: "imagetopdf",
    label: "Image to PDF",
    short: "Build a PDF",
    description: "Combine one or more images into a single PDF document.",
    icon: "imagetopdf",
    color: "#2FC4D6",
    category: "Convert",
    component: ImageToPdfPanel,
  },
  {
    key: "toword",
    label: "PDF to Word",
    short: "Make it editable",
    description: "Convert a PDF into an editable .docx Word document.",
    icon: "toword",
    color: "#5B8CFF",
    category: "Convert",
    component: ToWordPanel,
  },
  {
    key: "wordtopdf",
    label: "Word to PDF",
    short: "Lock it in",
    description: "Convert a .docx Word document into a standard PDF.",
    icon: "wordtopdf",
    color: "#6C7CFF",
    category: "Convert",
    component: WordToPdfPanel,
  },
  {
    key: "compress",
    label: "Compress PDF",
    short: "Shrink file size",
    description: "Reduce a PDF's file size while keeping it readable.",
    icon: "compress",
    color: "#3FCB86",
    category: "Optimize",
    component: CompressPanel,
  },
  {
    key: "watermark",
    label: "Watermark PDF",
    short: "Stamp every page",
    description: "Add a repeating text watermark across every page.",
    icon: "watermark",
    color: "#F2C245",
    category: "Optimize",
    component: WatermarkPanel,
  },
];

export const CATEGORIES = ["Organize", "Convert", "Optimize"];

export function getTool(key) {
  return TOOLS.find((t) => t.key === key);
}
