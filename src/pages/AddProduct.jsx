import { useState } from 'react';
import { addOrUpdateProduct, getProduct } from '../db';
import Scanner from '../components/Scanner';
import { useNavigate } from 'react-router-dom';
import { Camera, Shuffle } from 'lucide-react';

const AddProduct = () => {
  const [product, setProduct] = useState({
    barcode: '',
    name: '',
    buyPrice: '',
    sellPrice: '',
    stock: ''
  });
  const [showScanner, setShowScanner] = useState(false);
  const navigate = useNavigate();

  const handleScan = async (decodedText) => {
    // Check if product already exists to populate fields for editing
    const existing = await getProduct(decodedText);
    if (existing) {
      setProduct(existing);
    } else {
      setProduct({ ...product, barcode: decodedText });
    }
    setShowScanner(false);
  };

  const handleChange = (e) => {
    setProduct({ ...product, [e.target.name]: e.target.value });
  };

  const handleGenerateId = () => {
    const randomId = 'ITEM-' + Math.floor(100000 + Math.random() * 900000);
    setProduct({ ...product, barcode: randomId });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!product.barcode || !product.name) {
      alert("Barcode/ID and Name are required.");
      return;
    }

    await addOrUpdateProduct({
      ...product,
      buyPrice: parseFloat(product.buyPrice) || 0,
      sellPrice: parseFloat(product.sellPrice) || 0,
      stock: parseInt(product.stock, 10) || 0
    });
    
    navigate('/inventory');
  };

  return (
    <div>
      <h2>Add Product</h2>
      
      {showScanner ? (
        <Scanner onScan={handleScan} />
      ) : (
        <button 
          className="btn-outline" 
          style={{ marginBottom: '1rem' }} 
          onClick={() => setShowScanner(true)}
        >
          <Camera size={20} /> Use Camera Scanner
        </button>
      )}

      <form className="card" onSubmit={handleSubmit}>
        <div className="input-group">
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Barcode or ID</span>
            <button 
              type="button" 
              onClick={handleGenerateId}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'var(--brand-primary)', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.25rem',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              <Shuffle size={14} /> Generate Custom ID
            </button>
          </label>
          <input 
            type="text" 
            name="barcode" 
            value={product.barcode} 
            onChange={handleChange} 
            placeholder="Scan, type custom ID, or generate"
            required 
          />
        </div>
        <div className="input-group">
          <label>Product Name</label>
          <input 
            type="text" 
            name="name" 
            value={product.name} 
            onChange={handleChange} 
            placeholder="e.g. Loose Apples"
            required 
          />
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="input-group" style={{ flex: 1 }}>
            <label>Cost Price ($)</label>
            <input 
              type="number" 
              step="0.01" 
              name="buyPrice" 
              value={product.buyPrice} 
              onChange={handleChange} 
            />
          </div>
          <div className="input-group" style={{ flex: 1 }}>
            <label>Sell Price ($)</label>
            <input 
              type="number" 
              step="0.01" 
              name="sellPrice" 
              value={product.sellPrice} 
              onChange={handleChange} 
            />
          </div>
        </div>
        <div className="input-group">
          <label>Initial Stock</label>
          <input 
            type="number" 
            name="stock" 
            value={product.stock} 
            onChange={handleChange} 
          />
        </div>

        <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
          Save Product
        </button>
      </form>
    </div>
  );
};

export default AddProduct;
