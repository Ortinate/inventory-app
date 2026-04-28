import { useState, useEffect } from 'react';
import { getProduct, recordSale, getAllProducts } from '../db';
import Scanner from '../components/Scanner';
import { ShoppingCart, Search, PlusCircle } from 'lucide-react';

const PointOfSale = () => {
  const [cart, setCart] = useState([]);
  const [showScanner, setShowScanner] = useState(true);
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });
  
  // Manual Search State
  const [allProducts, setAllProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = async () => {
    const products = await getAllProducts();
    setAllProducts(products);
  };

  const handleScan = async (barcode) => {
    try {
      const product = await getProduct(barcode);
      if (!product) {
        setStatusMsg({ text: 'Product not found!', type: 'error' });
        return;
      }
      addToCart(product);
      setShowScanner(false);
    } catch(err) {
      console.error(err);
    }
  };

  const addToCart = (product) => {
    if (product.stock <= 0) {
      setStatusMsg({ text: 'Out of stock!', type: 'error' });
      return;
    }
    setCart(prev => [...prev, product]);
    setStatusMsg({ text: `Added ${product.name}`, type: 'success' });
    setSearchQuery(''); // clear search if used
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    let successCount = 0;
    for (const item of cart) {
      try {
        await recordSale({
          barcode: item.barcode,
          productName: item.name,
          sellPrice: item.sellPrice
        });
        successCount++;
      } catch (err) {
        alert(`Failed to sell ${item.name}: ${err.message}`);
      }
    }
    
    setCart([]);
    setStatusMsg({ text: `Checkout successful! Sold ${successCount} items.`, type: 'success' });
    loadCatalog(); // Refresh stock
  };

  const total = cart.reduce((sum, item) => sum + item.sellPrice, 0);

  const filteredProducts = searchQuery.trim() === '' ? [] : allProducts.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.barcode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <h2>Point of Sale</h2>

      {statusMsg.text && (
        <div style={{
          padding: '0.75rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1rem',
          backgroundColor: statusMsg.type === 'error' ? '#fee2e2' : '#d1fae5',
          color: statusMsg.type === 'error' ? 'var(--brand-danger)' : 'var(--brand-success)',
          fontWeight: '500',
          textAlign: 'center'
        }}>
          {statusMsg.text}
        </div>
      )}

      {showScanner ? (
        <Scanner onScan={handleScan} />
      ) : (
        <button 
          className="btn-outline" 
          style={{ marginBottom: '1rem' }} 
          onClick={() => {
            setShowScanner(true);
            setStatusMsg({text: '', type: ''});
          }}
        >
          Scan Next Item
        </button>
      )}

      {/* Manual Search Section */}
      <div className="card" style={{ padding: '1rem' }}>
        <div className="input-group" style={{ marginBottom: 0 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Search size={14} /> Manually Search & Add Item
          </label>
          <input 
            type="text" 
            placeholder="Search by name or custom id..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {filteredProducts.length > 0 && (
          <div style={{ 
            marginTop: '0.5rem', 
            maxHeight: '150px', 
            overflowY: 'auto', 
            border: '1px solid var(--border-color)', 
            borderRadius: 'var(--radius-md)'
          }}>
            {filteredProducts.map(p => (
              <div 
                key={p.barcode} 
                onClick={() => addToCart(p)}
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '0.75rem',
                  borderBottom: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  backgroundColor: p.stock > 0 ? 'var(--bg-surface)' : '#f1f5f9'
                }}
              >
                <div>
                  <div style={{ fontWeight: '500' }}>{p.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Stock: {p.stock}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: '600' }}>${p.sellPrice.toFixed(2)}</span>
                  <PlusCircle size={18} color="var(--brand-primary)" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShoppingCart size={20} /> Current Cart
        </h3>
        
        {cart.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', margin: '1rem 0' }}>Cart is empty.</p>
        ) : (
          <div style={{ marginTop: '1rem' }}>
            {cart.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                <span>{item.name}</span>
                <span style={{ fontWeight: '600' }}>${item.sellPrice.toFixed(2)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0 0 0', fontWeight: '700', fontSize: '1.25rem' }}>
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={handleCheckout}>
              Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PointOfSale;
