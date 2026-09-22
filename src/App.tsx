import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import { MemberHome } from "@/pages/member/MemberHome";
import { Profile } from "@/pages/member/Profile";
import { TrainingPackages } from "@/pages/member/TrainingPackages";

// Component con tạo Menu để lấy được logic active route
const NavBar = () => {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard" },
    { path: "/profile", label: "Profile" },
    { path: "/packages", label: "Packages" },
  ];

  return (
    <header className="bg-card shadow-sm sticky top-0 z-10 border-b">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Logo giả lập tông xanh Mint */}
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
            SC
          </div>
          <span className="font-semibold text-lg tracking-tight text-primary">
            Sports Center Wellness
          </span>
        </div>

        <nav className="flex gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground" // Active: Nền Mint, chữ trắng
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground" // Inactive: Hover xám/mint nhạt
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

function App() {
  return (
    <BrowserRouter>
      {/* Nền của bg-background giờ sẽ tự lấy màu Mint Cream theo cấu hình CSS */}
      <div className="min-h-screen bg-background text-foreground font-sans pb-12">
        <NavBar />

        {/* Bọc nội dung bằng container có margin để tách biệt với header */}
        <main className="pt-6">
          <Routes>
            <Route path="/" element={<MemberHome />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/packages" element={<TrainingPackages />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
