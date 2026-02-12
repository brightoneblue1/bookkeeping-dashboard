import { createClient } from 'npm:@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const TABLE_NAME = 'kv_store_412b6131';

// Initialize table if it doesn't exist
async function ensureTable() {
  try {
    // Try to query the table to see if it exists
    const { error } = await supabase.from(TABLE_NAME).select('key').limit(1);
    
    if (error && error.message.includes('does not exist')) {
      // Table doesn't exist, create it using raw SQL
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
            key TEXT PRIMARY KEY,
            value JSONB NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `
      });
      
      if (createError) {
        console.log('Note: Table creation via RPC not available, table may need manual creation');
      }
    }
  } catch (err) {
    console.log('Table check error (this is normal on first run):', err);
  }
}

// Call ensureTable on module load
await ensureTable();

export async function get(key: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('value')
      .eq('key', key)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      const errorMsg = error.message || JSON.stringify(error);
      console.error(`KV get error for key ${key}:`, errorMsg);
      throw new Error(errorMsg);
    }
    
    return data?.value;
  } catch (error) {
    if (error instanceof Error && error.message.includes('PGRST116')) return null;
    throw error;
  }
}

export async function set(key: string, value: any): Promise<void> {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .upsert({
        key,
        value
      });
    
    if (error) {
      const errorMsg = error.message || JSON.stringify(error);
      console.error(`KV set error for key ${key}:`, errorMsg);
      throw new Error(errorMsg);
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`KV set exception for key ${key}:`, errorMsg);
    throw new Error(errorMsg);
  }
}

export async function del(key: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('key', key);
  
  if (error) throw error;
}

export async function mget(keys: string[]): Promise<any[]> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('value')
    .in('key', keys);
  
  if (error) throw error;
  
  return data?.map(d => d.value) || [];
}

export async function mset(items: Array<{ key: string; value: any }>): Promise<void> {
  const records = items.map(item => ({
    key: item.key,
    value: item.value
  }));
  
  const { error } = await supabase
    .from(TABLE_NAME)
    .upsert(records);
  
  if (error) throw error;
}

export async function mdel(keys: string[]): Promise<void> {
  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .in('key', keys);
  
  if (error) throw error;
}

export async function getByPrefix(prefix: string): Promise<any[]> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('value')
    .like('key', `${prefix}%`);
  
  if (error) {
    // If table doesn't exist yet, return empty array
    if (error.code === '42P01' || error.message.includes('does not exist')) {
      return [];
    }
    throw error;
  }
  
  return data?.map(d => d.value) || [];
}