import React from 'react'
import QRCode from 'react-qr-code'

interface QRCodeGeneratorProps {
  value: string
  size?: number
  className?: string
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ 
  value, 
  size = 200, 
  className = '' 
}) => {
  return (
    <div className={`flex justify-center ${className}`}>
      <QRCode
        value={value}
        size={size}
        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
        viewBox={`0 0 ${size} ${size}`}
      />
    </div>
  )
}

export default QRCodeGenerator
