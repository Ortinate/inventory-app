import { useState, useEffect } from 'react';
import { getDashboardMetrics, getRecentSales } from '../db';
import { Wifi, WifiOff } from 'lucide-react';

const Dashboard = () => {
  const [metrics, setMetrics] = useState({ totalRevenue: 0, totalProfit: 0, salesCount: 0 });
  const [recentSales, setRecentSales] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    loadData();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadData = async () => {
    const data = await getDashboardMetrics();
    setMetrics(data);
    const sales = await getRecentSales();
    setRecentSales(sales.slice(0, 5)); // Last 5 sales
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>Dashboard</h2>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.75rem',
          fontWeight: '600',
          color: isOnline ? 'var(--brand-success)' : 'var(--text-secondary)',
          background: 'var(--bg-surface)',
          padding: '0.25rem 0.5rem',
          borderRadius: 'var(--radius-full)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          {isOnline ? <><Wifi size={14} /> Online Sync Active</> : <><WifiOff size={14} /> Offline Mode</>}
        </div>
      </div>
      
      <div className="stat-grid">
        <div className="stat-card">
          <span className="label">Total Revenue</span>
          <span className="value" style={{ color: 'var(--brand-primary)' }}>₵{metrics.totalRevenue.toFixed(2)}</span>
        </div>
        <div className="stat-card">
          <span className="label">Total Profit</span>
          <span className="value" style={{ color: 'var(--brand-success)' }}>₵{metrics.totalProfit.toFixed(2)}</span>
        </div>
        <div className="stat-card" style={{ gridColumn: 'span 2' }}>
          <span className="label">Items Sold</span>
          <span className="value">{metrics.salesCount}</span>
        </div>
      </div>

      <h3>Recent Sales</h3>
      {recentSales.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)' }}>No sales yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
          {recentSales.map(sale => (
            <div key={sale.id} className="card" style={{ marginBottom: '0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: '600' }}>{sale.productName || 'Unknown Item'}</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {new Date(sale.timestamp).toLocaleTimeString()}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontWeight: '700', color: 'var(--brand-success)' }}>+₵{sale.sellPrice.toFixed(2)}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Profit: ₵{sale.profit.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
