import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeProps {
  value: string;
  height?: number;
  width?: number;
  fontSize?: number;
  displayValue?: boolean;
  className?: string;
  margin?: number;
}

export default function Barcode({ 
  value, 
  height = 25, 
  width = 1.2, 
  fontSize = 9, 
  displayValue = true,
  className = "",
  margin = 2
}: BarcodeProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current) {
      try {
        // Clean value to contain ONLY digits for scanning reliability as requested
        const cleanValue = value.replace(/[^0-9]/g, '');
        
        // EAN-128 is functionally Code 128 with standard FNC1/application identifiers.
        // For general scanners to output directly the phone number, standard CODE128 encoding is used.
        JsBarcode(svgRef.current, cleanValue, {
          format: "CODE128",
          width: width,
          height: height,
          displayValue: displayValue,
          text: value, // display the user's phone number as the text underneath
          fontSize: fontSize,
          margin: margin,
          background: "transparent",
          lineColor: "#000000"
        });
      } catch (err) {
        console.error("Barcode generation failed in component:", err);
      }
    }
  }, [value, height, width, fontSize, displayValue, margin]);

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <svg ref={svgRef} className="max-w-full h-auto select-none" />
    </div>
  );
}
