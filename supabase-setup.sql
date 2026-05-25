-- Ejecuta este SQL en Supabase → SQL Editor

CREATE TABLE salas (
    codigo       TEXT PRIMARY KEY,
    j1_nombre    TEXT,
    j1_color     TEXT,
    j1_progreso  FLOAT DEFAULT 0,
    j2_nombre    TEXT,
    j2_color     TEXT,
    j2_progreso  FLOAT DEFAULT 0,
    ganador      TEXT DEFAULT NULL,
    creada_en    TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Realtime para que los cambios lleguen en tiempo real
ALTER TABLE salas REPLICA IDENTITY FULL;

-- (En Supabase Dashboard ve a: Database → Replication → supabase_realtime → agrega la tabla 'salas')
