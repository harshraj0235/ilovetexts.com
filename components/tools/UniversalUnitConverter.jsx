'use client';
// ═══════════════════════════════════════════════════════
// UniversalUnitConverter.jsx — One component for 12 tools
// Handles Length, Weight, Temp, Area, Volume, Speed, etc.
// 100% offline math conversions.
//
// Usage: <UniversalUnitConverter type="length" />
// ═══════════════════════════════════════════════════════
import { useState, useEffect } from 'react';

const UNITS = {
  length: {
    label: 'Length',
    base: 'meter', // everything converts to/from meter
    units: {
      millimeter: { name: 'Millimeter (mm)', mul: 0.001 },
      centimeter: { name: 'Centimeter (cm)', mul: 0.01 },
      meter: { name: 'Meter (m)', mul: 1 },
      kilometer: { name: 'Kilometer (km)', mul: 1000 },
      inch: { name: 'Inch (in)', mul: 0.0254 },
      foot: { name: 'Foot (ft)', mul: 0.3048 },
      yard: { name: 'Yard (yd)', mul: 0.9144 },
      mile: { name: 'Mile (mi)', mul: 1609.34 },
      nautical_mile: { name: 'Nautical Mile (NM)', mul: 1852 },
    },
    defaultFrom: 'meter', defaultTo: 'foot'
  },
  weight: {
    label: 'Weight & Mass',
    base: 'kilogram',
    units: {
      milligram: { name: 'Milligram (mg)', mul: 0.000001 },
      gram: { name: 'Gram (g)', mul: 0.001 },
      kilogram: { name: 'Kilogram (kg)', mul: 1 },
      metric_ton: { name: 'Metric Ton (t)', mul: 1000 },
      ounce: { name: 'Ounce (oz)', mul: 0.0283495 },
      pound: { name: 'Pound (lb)', mul: 0.453592 },
      stone: { name: 'Stone (st)', mul: 6.35029 },
      us_ton: { name: 'US Ton', mul: 907.185 },
    },
    defaultFrom: 'kilogram', defaultTo: 'pound'
  },
  temperature: {
    label: 'Temperature',
    base: 'celsius', // Uses custom math instead of multiplier
    units: {
      celsius: { name: 'Celsius (°C)' },
      fahrenheit: { name: 'Fahrenheit (°F)' },
      kelvin: { name: 'Kelvin (K)' },
    },
    defaultFrom: 'celsius', defaultTo: 'fahrenheit'
  },
  area: {
    label: 'Area',
    base: 'sq_meter',
    units: {
      sq_meter: { name: 'Square Meter (m²)', mul: 1 },
      sq_kilometer: { name: 'Square Kilometer (km²)', mul: 1000000 },
      sq_mile: { name: 'Square Mile (mi²)', mul: 2589988.11 },
      sq_yard: { name: 'Square Yard (yd²)', mul: 0.836127 },
      sq_foot: { name: 'Square Foot (ft²)', mul: 0.092903 },
      sq_inch: { name: 'Square Inch (in²)', mul: 0.00064516 },
      hectare: { name: 'Hectare (ha)', mul: 10000 },
      acre: { name: 'Acre (ac)', mul: 4046.86 },
    },
    defaultFrom: 'sq_meter', defaultTo: 'sq_foot'
  },
  volume: {
    label: 'Volume',
    base: 'liter',
    units: {
      milliliter: { name: 'Milliliter (ml)', mul: 0.001 },
      liter: { name: 'Liter (l)', mul: 1 },
      cubic_meter: { name: 'Cubic Meter (m³)', mul: 1000 },
      teaspoon: { name: 'US Teaspoon', mul: 0.00492892 },
      tablespoon: { name: 'US Tablespoon', mul: 0.0147868 },
      fluid_ounce: { name: 'US Fluid Ounce', mul: 0.0295735 },
      cup: { name: 'US Cup', mul: 0.24 },
      pint: { name: 'US Pint', mul: 0.473176 },
      quart: { name: 'US Quart', mul: 0.946353 },
      gallon: { name: 'US Gallon', mul: 3.78541 },
      imperial_gallon: { name: 'Imperial Gallon', mul: 4.54609 },
    },
    defaultFrom: 'liter', defaultTo: 'gallon'
  },
  speed: {
    label: 'Speed',
    base: 'mps',
    units: {
      mps: { name: 'Meters per second (m/s)', mul: 1 },
      kph: { name: 'Kilometers per hour (km/h)', mul: 0.277778 },
      mph: { name: 'Miles per hour (mph)', mul: 0.44704 },
      knot: { name: 'Knot (kn)', mul: 0.514444 },
      mach: { name: 'Mach (speed of sound)', mul: 343 },
    },
    defaultFrom: 'kph', defaultTo: 'mph'
  },
  time: {
    label: 'Time',
    base: 'second',
    units: {
      millisecond: { name: 'Millisecond (ms)', mul: 0.001 },
      second: { name: 'Second (s)', mul: 1 },
      minute: { name: 'Minute (min)', mul: 60 },
      hour: { name: 'Hour (h)', mul: 3600 },
      day: { name: 'Day (d)', mul: 86400 },
      week: { name: 'Week (wk)', mul: 604800 },
      month: { name: 'Month (30 days)', mul: 2592000 },
      year: { name: 'Year (365 days)', mul: 31536000 },
    },
    defaultFrom: 'hour', defaultTo: 'minute'
  },
  data: {
    label: 'Data Storage',
    base: 'byte',
    units: {
      bit: { name: 'Bit (b)', mul: 0.125 },
      byte: { name: 'Byte (B)', mul: 1 },
      kb: { name: 'Kilobyte (KB)', mul: 1024 },
      mb: { name: 'Megabyte (MB)', mul: 1048576 },
      gb: { name: 'Gigabyte (GB)', mul: 1073741824 },
      tb: { name: 'Terabyte (TB)', mul: 1099511627776 },
      pb: { name: 'Petabyte (PB)', mul: 1125899906842624 },
    },
    defaultFrom: 'gb', defaultTo: 'mb'
  },
  pressure: {
    label: 'Pressure',
    base: 'pascal',
    units: {
      pascal: { name: 'Pascal (Pa)', mul: 1 },
      kpa: { name: 'Kilopascal (kPa)', mul: 1000 },
      bar: { name: 'Bar', mul: 100000 },
      psi: { name: 'Pound per sq inch (psi)', mul: 6894.76 },
      atm: { name: 'Standard Atmosphere (atm)', mul: 101325 },
      torr: { name: 'Torr', mul: 133.322 },
    },
    defaultFrom: 'bar', defaultTo: 'psi'
  },
  energy: {
    label: 'Energy',
    base: 'joule',
    units: {
      joule: { name: 'Joule (J)', mul: 1 },
      kj: { name: 'Kilojoule (kJ)', mul: 1000 },
      cal: { name: 'Gram calorie', mul: 4.184 },
      kcal: { name: 'Kilocalorie (kcal)', mul: 4184 },
      wh: { name: 'Watt-hour (Wh)', mul: 3600 },
      kwh: { name: 'Kilowatt-hour (kWh)', mul: 3600000 },
      btu: { name: 'British Thermal Unit (BTU)', mul: 1055.06 },
    },
    defaultFrom: 'joule', defaultTo: 'kcal'
  },
  power: {
    label: 'Power',
    base: 'watt',
    units: {
      watt: { name: 'Watt (W)', mul: 1 },
      kw: { name: 'Kilowatt (kW)', mul: 1000 },
      mw: { name: 'Megawatt (MW)', mul: 1000000 },
      hp: { name: 'Horsepower (hp)', mul: 745.7 },
    },
    defaultFrom: 'kw', defaultTo: 'hp'
  },
  angle: {
    label: 'Angle',
    base: 'degree',
    units: {
      degree: { name: 'Degree (°)', mul: 1 },
      radian: { name: 'Radian (rad)', mul: 57.2957795 },
      gradian: { name: 'Gradian (grad)', mul: 0.9 },
      arcmin: { name: 'Minute of arc', mul: 0.0166667 },
      arcsec: { name: 'Second of arc', mul: 0.000277778 },
    },
    defaultFrom: 'degree', defaultTo: 'radian'
  }
};

const convertTemperature = (val, from, to) => {
  if (from === to) return val;
  let c = 0;
  // Convert to Celsius first
  if (from === 'celsius') c = val;
  else if (from === 'fahrenheit') c = (val - 32) * 5/9;
  else if (from === 'kelvin') c = val - 273.15;
  
  // Convert from Celsius to Target
  if (to === 'celsius') return c;
  if (to === 'fahrenheit') return (c * 9/5) + 32;
  if (to === 'kelvin') return c + 273.15;
  return val;
};

export default function UniversalUnitConverter({ type = 'length' }) {
  const config = UNITS[type] || UNITS.length;
  
  const [val1, setVal1] = useState('1');
  const [unit1, setUnit1] = useState(config.defaultFrom);
  const [val2, setVal2] = useState('');
  const [unit2, setUnit2] = useState(config.defaultTo);
  const [lastEdited, setLastEdited] = useState(1); // 1 or 2

  // Perform calculation when inputs or units change
  useEffect(() => {
    const calc = () => {
      const v = lastEdited === 1 ? parseFloat(val1) : parseFloat(val2);
      if (isNaN(v)) {
        if (lastEdited === 1) setVal2(''); else setVal1('');
        return;
      }

      if (type === 'temperature') {
        if (lastEdited === 1) {
          setVal2(convertTemperature(v, unit1, unit2).toPrecision(7).replace(/\.?0+$/, ''));
        } else {
          setVal1(convertTemperature(v, unit2, unit1).toPrecision(7).replace(/\.?0+$/, ''));
        }
        return;
      }

      // Standard multiplier conversion
      const m1 = config.units[unit1].mul;
      const m2 = config.units[unit2].mul;
      
      if (lastEdited === 1) {
        // v * m1 converts to base unit, then / m2 converts to target unit
        const result = (v * m1) / m2;
        setVal2(result.toPrecision(8).replace(/\.?0+$/, '').replace(/e\+0/i, 'e'));
      } else {
        const result = (v * m2) / m1;
        setVal1(result.toPrecision(8).replace(/\.?0+$/, '').replace(/e\+0/i, 'e'));
      }
    };
    calc();
  }, [val1, val2, unit1, unit2, lastEdited, type, config.units]);

  const handleSwap = () => {
    const tempU = unit1; setUnit1(unit2); setUnit2(tempU);
    const tempV = val1; setVal1(val2); setVal2(tempV);
    setLastEdited(lastEdited === 1 ? 2 : 1);
  };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', width: '100%' }}>
      <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: 30, boxShadow: 'var(--shadow-sm)' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 24, textAlign: 'center' }}>
          {config.label} Converter
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Input 1 */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <input 
              type="number" 
              value={val1} 
              onChange={e => { setVal1(e.target.value); setLastEdited(1); }}
              style={{ flex: 2, padding: '14px', fontSize: '1.2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', minWidth: 200 }}
              placeholder="Value"
            />
            <select 
              value={unit1} 
              onChange={e => setUnit1(e.target.value)}
              style={{ flex: 1, padding: '14px', fontSize: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', minWidth: 150 }}
            >
              {Object.entries(config.units).map(([key, u]) => (
                <option key={key} value={key}>{u.name}</option>
              ))}
            </select>
          </div>

          {/* Swap Button */}
          <div style={{ display: 'flex', justifyContent: 'center', margin: '-10px 0' }}>
            <button 
              onClick={handleSwap}
              style={{ width: 44, height: 44, borderRadius: '50%', background: '#0ea5e9', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', zIndex: 2, boxShadow: '0 4px 10px rgba(14, 165, 233, 0.3)' }}
              title="Swap units"
            >
              ⇅
            </button>
          </div>

          {/* Input 2 */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <input 
              type="number" 
              value={val2} 
              onChange={e => { setVal2(e.target.value); setLastEdited(2); }}
              style={{ flex: 2, padding: '14px', fontSize: '1.2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', minWidth: 200 }}
              placeholder="Result"
            />
            <select 
              value={unit2} 
              onChange={e => setUnit2(e.target.value)}
              style={{ flex: 1, padding: '14px', fontSize: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', minWidth: 150 }}
            >
              {Object.entries(config.units).map(([key, u]) => (
                <option key={key} value={key}>{u.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginTop: 24, fontSize: '0.85rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
          💡 Tip: You can type into either box to convert in both directions.
        </div>
      </div>
    </div>
  );
}
