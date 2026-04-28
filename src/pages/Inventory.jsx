import { useState, useEffect } from 'react';
import { getAllProducts, deleteProduct } from '../db';
import { Package, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const Inventory = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const data = await getAllProducts();
    setProducts(data);
  };

  const handleDelete = async (barcode) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      await deleteProduct(barcode);
      loadProducts();
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>Inventory</h2>
        <Link to="/add" className="btn-primary" style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
          Add New
        </Link>
      </div>

      {products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>
          <Package size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
          <p>No products in inventory.</p>
          <p>Scan a barcode to add one!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
          {products.map(product => (
            <div key={product.barcode} className="card" style={{ marginBottom: '0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: '600' }}>{product.name}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                  {product.barcode}
                </p>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.875rem' }}>
                  <span>Stock: <strong>{product.stock}</strong></span>
                  <span>Price: <strong>${product.sellPrice.toFixed(2)}</strong></span>
                </div>
              </div>
              <button 
                onClick={() => handleDelete(product.barcode)}
                style={{ background: 'none', border: 'none', color: 'var(--brand-danger)', padding: '0.5rem', cursor: 'pointer' }}
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Inventory;
