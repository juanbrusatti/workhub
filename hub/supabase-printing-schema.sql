-- Tabla para configuración de impresión
CREATE TABLE IF NOT EXISTS printing_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  price_per_sheet DECIMAL(10, 2) NOT NULL DEFAULT 5.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para registros de impresión
CREATE TABLE IF NOT EXISTS printing_records (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  sheets INTEGER NOT NULL CHECK (sheets > 0 AND sheets <= 100),
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  price_per_sheet DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL GENERATED ALWAYS AS (sheets * price_per_sheet) STORED,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  paid_at TIMESTAMP WITH TIME ZONE,
  paid_by TEXT,
  paid_by_name TEXT
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_printing_records_client_id ON printing_records(client_id);
CREATE INDEX IF NOT EXISTS idx_printing_records_date ON printing_records(date);
CREATE INDEX IF NOT EXISTS idx_printing_records_status ON printing_records(status);
CREATE INDEX IF NOT EXISTS idx_printing_records_created_at ON printing_records(created_at DESC);

-- Insertar configuración por defecto si no existe
INSERT INTO printing_settings (id, price_per_sheet, created_at, updated_at)
VALUES ('default', 5.00, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
