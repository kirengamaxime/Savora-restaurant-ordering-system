import { Routes, Route, Navigate } from "react-router-dom";
import Welcome from "./pages/Welcome.jsx";
import Menu from "./pages/Menu.jsx";
import DishDetail from "./pages/DishDetail.jsx";
import Cart from "./pages/Cart.jsx";
import Checkout from "./pages/Checkout.jsx";
import Confirmation from "./pages/Confirmation.jsx";
import Orders from "./pages/Orders.jsx";
import TrackOrder from "./pages/TrackOrder.jsx";
import ManagerHome from "./pages/admin/ManagerHome.jsx";
import KitchenHome from "./pages/admin/KitchenHome.jsx";

export default function App() {
  return (
    <Routes>
      {/* Customer-facing kiosk flow */}
      <Route path="/" element={<Welcome />} />
      <Route path="/menu" element={<Menu />} />
      <Route path="/dish/:dishId" element={<DishDetail />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/confirmation/:orderId" element={<Confirmation />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="/track/:token" element={<TrackOrder />} />

      {/* Staff — separate URLs per role, each with its own login gate */}
      <Route path="/manager" element={<ManagerHome />} />
      <Route path="/kitchen" element={<KitchenHome />} />

      {/* Old bookmarked links still work — funneled to the manager view,
          which has the broadest access (closest match to the old /admin). */}
      <Route path="/admin" element={<Navigate to="/manager" replace />} />
      <Route path="/admin/login" element={<Navigate to="/manager" replace />} />
      <Route path="/admin/dashboard" element={<Navigate to="/manager" replace />} />
      <Route path="/admin/menu" element={<Navigate to="/manager" replace />} />
    </Routes>
  );
}
