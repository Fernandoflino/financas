import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const supabaseUrl = 'https://vfglcvmcsiwvqtkpjchl.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sua-service-role-key-aqui'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigrations() {
  const migrationsDir = path.join(__dirname, 'supabase', 'migrations')
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort()

  for (const file of files) {
    const filePath = path.join(migrationsDir, file)
    const sql = fs.readFileSync(filePath, 'utf-8')

    try {
      const { error } = await supabase.rpc('_exec', { sql })

      if (error) {
        console.error(`✗ Erro ao aplicar ${file}:`, error.message)
      } else {
        console.log(`✓ Migration ${file} aplicada com sucesso`)
      }
    } catch (err) {
      console.error(`✗ Exceção ao aplicar ${file}:`, err.message)
    }
  }
}

applyMigrations().catch(console.error)
