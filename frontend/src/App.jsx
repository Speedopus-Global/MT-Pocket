import { BrowserRouter, Routes, Route } from "react-router-dom";
import  StyleGuide from "./pages/StyleGuide";
import Layout from "./components/layout/layout.jsx";
import Home from "./pages/Home.jsx";
import WhyTrust from "./pages/TrustStripe.jsx";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route index element={<WhyTrust />} />
        </Route>
        <Route path="/style-guide" element={<StyleGuide />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
