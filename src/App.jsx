import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { Home, Package, ShoppingCart, PlusSquare } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import PointOfSale from './pages/PointOfSale';
import AddProduct from './pages/AddProduct';

function App() {
  return (
    <Router>
      <div className="app-container">
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/add" element={<AddProduct />} />
            <Route path="/pos" element={<PointOfSale />} />
          </Routes>
        </div>

        <nav className="bottom-nav">
          <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Home size={24} />
            <span>Dash</span>
          </NavLink>
          <NavLink to="/inventory" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Package size={24} />
            <span>Stock</span>
          </NavLink>
          <NavLink to="/pos" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <ShoppingCart size={24} />
            <span>POS</span>
          </NavLink>
          <NavLink to="/add" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <PlusSquare size={24} />
            <span>Add</span>
          </NavLink>
        </nav>
      </div>
    </Router>
  );
}

export default App;
