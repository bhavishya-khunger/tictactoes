import React, { useRef, useEffect } from 'react';
import jsQR from 'jsqr';

function QRScanner({ onScan }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => {
        video.srcObject = stream;
        video.play();
      })
      .catch(err => console.error('Camera error:', err));

    const scan = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code) {
          onScan(code.data);
        }
      }
      requestAnimationFrame(scan);
    };

    scan();

    return () => {
      video.srcObject?.getTracks().forEach(track => track.stop());
    };
  }, [onScan]);

  return (
    <div className="relative w-full h-64 rounded-xl overflow-hidden border">
      <video ref={videoRef} className="w-full h-full object-cover" />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

export default QRScanner;
