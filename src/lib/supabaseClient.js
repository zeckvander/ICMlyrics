import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mxvtqwemycjoxqqoogar.supabase.co'; 
const supabaseKey = 'sb_publishable_tVW_TGxLC7NWcCObRySNeA_nq34h8Yq'; 

export const supabase = createClient(supabaseUrl, supabaseKey);