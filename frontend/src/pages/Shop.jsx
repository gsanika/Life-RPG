import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Shop() {
  const { setUser } = useAuth();
  const [items, setItems] = useState([]);
  const [gold, setGold] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/shop').then(({ data }) => {
      setItems(data.items);
      setGold(data.gold);
      setLoading(false);
    });
  }, []);

  async function handleBuy(itemId) {
    setMessage('');
    try {
      const { data } = await api.post(`/shop/${itemId}/purchase`);
      setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, owned: true } : i)));
      setGold(data.character.gold);
      setUser((prev) => ({ ...prev, gold: data.character.gold, inventory: data.character.inventory }));
      setMessage(data.message);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Purchase failed.');
    }
  }

  if (loading) return <div className="loading-screen">Opening the shop…</div>;

  return (
    <div className="page">
      <div className="quest-list-head">
        <h2>Shop</h2>
        <span className="nav-gold" style={{ fontSize: '1.1rem' }}>🪙 {gold}</span>
      </div>

      {message && <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>{message}</p>}

      <div className="shop-grid">
        {items.map((item) => (
          <motion.div key={item.id} className="shop-item" whileHover={{ y: -3 }}>
            <div className="emoji">{item.emoji}</div>
            <div className="name">{item.name}</div>
            <div className="cost">{item.cost} 🪙</div>
            <button className="btn btn-gold" disabled={item.owned || gold < item.cost} onClick={() => handleBuy(item.id)}>
              {item.owned ? 'Owned' : 'Unlock'}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
