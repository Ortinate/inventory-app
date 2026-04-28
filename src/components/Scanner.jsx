import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X } from 'lucide-react';

const Scanner = ({ onScan }) => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const scannerRef = useRef(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const startScanner = async () => {
    setScanning(true);
    setError('');
    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;

    try {
      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 100 } // Typical barcode ratio
        },
        (decodedText) => {
          // Play a slight beep or vibrate if possible
          if (navigator.vibrate) navigator.vibrate(100);
          
          stopScanner();
          onScan(decodedText);
        },
        (errorMessage) => {
          // Ignore general tracking errors as they just mean "not found yet"
        }
      );
    } catch (err) {
      setError('Could not start camera. Please check permissions.');
      setScanning(false);
    }
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().then(() => {
        setScanning(false);
      }).catch(console.error);
    } else {
      setScanning(false);
    }
  };

  return (
    <div className="scanner-container" style={{ marginBottom: '1rem' }}>
      {!scanning ? (
        <button className="btn-outline" onClick={startScanner}>
          <Camera size={20} />
          Scan Barcode
        </button>
      ) : (
        <div className="card" style={{ padding: '0', overflow: 'hidden', position: 'relative' }}>
          <div id="reader" style={{ width: '100%' }}></div>
          <button 
            onClick={stopScanner}
            style={{ 
              position: 'absolute', 
              top: '10px', 
              right: '10px', 
              background: 'rgba(255,255,255,0.8)', 
              border: 'none', 
              borderRadius: '50%', 
              padding: '8px',
              cursor: 'pointer'
            }}
          >
            <X size={20} color="#0f172a" />
          </button>
          {error && <p style={{ color: 'var(--brand-danger)', padding: '1rem', textAlign: 'center' }}>{error}</p>}
        </div>
      )}
    </div>
  );
};

export default Scanner;
