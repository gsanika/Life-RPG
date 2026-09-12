import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <div className="navbar">
      <div className="brand">
        <span className="brand-mark" />
        Life RPG
      </div>
      <div className="nav-links">
        <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          Quest Board
        </NavLink>
        <NavLink to="/shop" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          Shop
        </NavLink>
        <NavLink to="/history" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          History
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          Profile
        </NavLink>
        <span className="nav-gold">🪙 {user?.gold ?? 0}</span>
        <button className="btn" onClick={logout}>
          Log out
        </button>
      </div>
    </div>
  );
}
