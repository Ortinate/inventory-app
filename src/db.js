import { openDB } from 'idb';
import { supabase } from './supabaseClient';

const DB_NAME = 'inventory_pos_db';
const DB_VERSION = 2; // version bump to add sync_queue

export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      if (!db.objectStoreNames.contains('products')) {
        const productStore = db.createObjectStore('products', { keyPath: 'barcode' });
        productStore.createIndex('name', 'name');
      }
      if (!db.objectStoreNames.contains('sales')) {
        const salesStore = db.createObjectStore('sales', { keyPath: 'id', autoIncrement: true });
        salesStore.createIndex('timestamp', 'timestamp');
        salesStore.createIndex('barcode', 'barcode');
      }
      if (!db.objectStoreNames.contains('sync_queue')) {
        // queue logic: id, action (upsert_product, add_sale), payload
        db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
      }
    },
  });
};

/* ===== Sync Queue Mechanics ===== */

// Internal function to add tasks to offline queue
const enqueueSyncTask = async (action, payload) => {
  const db = await initDB();
  await db.add('sync_queue', { action, payload });
  
  // Attempt sync immediately, if online
  processSyncQueue();
};

export const processSyncQueue = async () => {
  if (!navigator.onLine) return;

  const db = await initDB();
  const tx = db.transaction('sync_queue', 'readwrite');
  const queueStore = tx.objectStore('sync_queue');
  const allTasks = await queueStore.getAll();

  if (allTasks.length === 0) return;

  for (const task of allTasks) {
    let success = false;
    try {
      if (task.action === 'upsert_product') {
        const { error } = await supabase.from('products').upsert(task.payload);
        if (!error) success = true;
      } else if (task.action === 'add_sale') {
        const { error } = await supabase.from('sales').insert(task.payload);
        if (!error) success = true;
      } else if (task.action === 'delete_product') {
        const { error } = await supabase.from('products').delete().eq('barcode', task.payload.barcode);
        if (!error) success = true;
      }
    } catch (err) {
      console.error('Supabase sync error', err);
    }

    if (success) {
      // Create a fresh transaction because await loses the old one in some idb contexts
      const innerDb = await initDB();
      await innerDb.delete('sync_queue', task.id);
    }
  }
};

// Global listener for internet resumption
window.addEventListener('online', processSyncQueue);

/* ===== Operations for Products ===== */
export const addOrUpdateProduct = async (product) => {
  const db = await initDB();
  await db.put('products', product);
  await enqueueSyncTask('upsert_product', product);
  return true;
};

export const getProduct = async (barcode) => {
  const db = await initDB();
  return db.get('products', barcode);
};

export const getAllProducts = async () => {
  const db = await initDB();
  return db.getAll('products');
};

export const deleteProduct = async (barcode) => {
  const db = await initDB();
  await db.delete('products', barcode);
  await enqueueSyncTask('delete_product', { barcode });
  return true;
};

/* ===== Operations for Sales ===== */
export const recordSale = async (sale) => {
  const db = await initDB();
  // sale needs: barcode, productName, costPrice, sellPrice, profit, timestamp
  // Also we must reduce stock from product locally
  const tx = db.transaction(['products', 'sales'], 'readwrite');
  const productsStore = tx.objectStore('products');
  const salesStore = tx.objectStore('sales');

  const product = await productsStore.get(sale.barcode);
  if (product && product.stock > 0) {
    product.stock -= 1;
    await productsStore.put(product);
    
    const profit = sale.sellPrice - product.buyPrice;
    
    // Auto increment id generation is tricky via idb and supabase syncing at the same time
    // We will let Supabase generate its own ID or we use a timestamp. 
    // We omit ID for the sale payload so Supabase uses its auto-increment.
    const salePayload = {
      barcode: sale.barcode,
      productName: sale.productName,
      costPrice: product.buyPrice,
      sellPrice: sale.sellPrice,
      profit: profit,
      timestamp: Date.now()
    };
    
    await salesStore.add(salePayload);
    await tx.done;

    // Queue syncs
    await enqueueSyncTask('upsert_product', product);
    await enqueueSyncTask('add_sale', salePayload);
    
    return true; // Success
  }
  
  await tx.done;
  throw new Error("Product out of stock or not found.");
};

export const getRecentSales = async () => {
    const db = await initDB();
    const sales = await db.getAllFromIndex('sales', 'timestamp');
    return sales.reverse(); // Newest first
}

// Total profit and revenue
export const getDashboardMetrics = async () => {
  const db = await initDB();
  const sales = await db.getAll('sales');
  
  let totalRevenue = 0;
  let totalProfit = 0;

  sales.forEach(s => {
    totalRevenue += Number(s.sellPrice);
    totalProfit += Number(s.profit);
  });

  return { totalRevenue, totalProfit, salesCount: sales.length };
};
