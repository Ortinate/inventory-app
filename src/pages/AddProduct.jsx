import { useState } from 'react';
import { addOrUpdateProduct, getProduct } from '../db';
import Scanner from '../components/Scanner';
import { useNavigate } from 'react-router-dom';
import { Camera, Shuffle, Search, Loader2 } from 'lucide-react';

const AddProduct = () => {
  const [product, setProduct] = useState({
    barcode: '',
    name: '',
    buyPrice: '',
    sellPrice: '',
    stock: ''
  });
  const [showScanner, setShowScanner] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const navigate = useNavigate();

  const lookupBarcode = async (barcodeToLookup) => {
    if (!navigator.onLine || !barcodeToLookup) return null;
    setIsLookingUp(true);
    let fetchedName = '';
    
    try {
      // API 1: OpenFoodFacts (Great for groceries)
      const res1 = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcodeToLookup}.json`);
      const data1 = await res1.json();
      if (data1.status === 1 && data1.product && data1.product.product_name) {
        fetchedName = data1.product.product_name;
      }
    } catch (e) {
      console.error("OpenFoodFacts lookup failed", e);
    }

    if (!fetchedName) {
      try {
        // API 2: UPCitemdb Trial (Great for general retail, electronics, etc.)
        const res2 = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcodeToLookup}`);
        const data2 = await res2.json();
        if (data2.code === 'OK' && data2.items && data2.items.length > 0) {
          fetchedName = data2.items[0].title;
        }
      } catch (e) {
        console.error("UPCitemdb lookup failed", e);
      }
    }

    if (fetchedName) {
      setProduct(p => ({ ...p, name: fetchedName }));
    } else if (barcodeToLookup) {
      alert(`Could not find a product name for barcode ${barcodeToLookup} in public databases. You will need to type it manually.`);
    }

    setIsLookingUp(false);
    return fetchedName;
  };

  const handleScan = async (decodedText) => {
    // Check if product already exists locally
    const existing = await getProduct(decodedText);
    if (existing) {
      setProduct(existing);
    } else {
      // If new, update state with barcode immediately
      setProduct(p => ({ ...p, barcode: decodedText }));
      // Attempt to look it up online automatically
      await lookupBarcode(decodedText);
    }
    setShowScanner(false);
  };

  const handleChange = (e) => {
    setProduct({ ...product, [e.target.name]: e.target.value });
  };

  const handleGenerateId = () => {
    const randomId = 'ITEM-' + Math.floor(100000 + Math.random() * 900000);
    setProduct({ ...product, barcode: randomId, name: '' });
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
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              name="barcode" 
              value={product.barcode} 
              onChange={handleChange} 
              placeholder="Scan, type custom ID, or generate"
              required 
              style={{ flex: 1 }}
            />
            <button 
              type="button" 
              onClick={() => lookupBarcode(product.barcode)}
              className="btn-outline"
              title="Look up barcode online"
              style={{ width: 'auto', padding: '0 1rem' }}
              disabled={isLookingUp || !product.barcode}
            >
              {isLookingUp ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
            </button>
          </div>
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
            <label>Cost Price (₵)</label>
            <input 
              type="number" 
              step="0.01" 
              name="buyPrice" 
              value={product.buyPrice} 
              onChange={handleChange} 
            />
          </div>
          <div className="input-group" style={{ flex: 1 }}>
            <label>Sell Price (₵)</label>
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

      <style>{`
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AddProduct;
