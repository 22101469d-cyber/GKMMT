import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import Disclaimer from "./pages/Disclaimer";
import Home from "./pages/Home";
import Pay from "./pages/Pay";
import Chat from "./pages/Chat";
import Report from "./pages/Report";
import Result from "./pages/Result";
import Score from "./pages/Score";
import Start from "./pages/Start";
import Steps from "./pages/Steps";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/start" element={<Start />} />
        <Route path="/steps" element={<Steps />} />
        <Route path="/score" element={<Score />} />
        <Route path="/result" element={<Result />} />
        <Route path="/pay" element={<Pay />} />
        <Route path="/report" element={<Report />} />
        <Route path="/chat/:chatSessionId" element={<Chat />} />
        <Route path="/disclaimer" element={<Disclaimer />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
