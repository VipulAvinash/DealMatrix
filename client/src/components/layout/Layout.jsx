import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import CompareBar from "../search/CompareBar";
import { useSearchStore } from "../../store/searchStore";

export default function Layout() {
  const { compareList } = useSearchStore();

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      {compareList.length > 0 && <CompareBar />}
      <Footer />
    </div>
  );
}
