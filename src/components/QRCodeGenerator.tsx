import React from 'react'
import QRCode from 'react-qr-code'

interface QRCodeGeneratorProps {
  value: string
  size?: number
  className?: string
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ 
  value, 
  size = 120, 
  className = '' 
}) => {
  return (
    <div className={`flex justify-center p-2 bg-white rounded ${className}`}>
      <QRCode
        value={value}
        size={size}
        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
        bgColor="#FFFFFF"
        fgColor="#000000"
        viewBox={`0 0 ${size} ${size}`}
      />
    </div>
  )
}

export default QRCodeGenerator
