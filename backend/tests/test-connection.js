import { supabase } from './src/config/supabase.js';

async function testConnection() {
    console.log('🔍 Testing Supabase connection...\n');

    // Test 1: Check usuarios table
    console.log('1️⃣ Testing usuarios table...');
    const { data: usuarios, error: errorUsuarios } = await supabase
        .from('usuarios')
        .select('*')
        .limit(5);
    
    if (errorUsuarios) {
        console.error('❌ Error usuarios:', errorUsuarios.message);
    } else {
        console.log('✅ Usuarios found:', usuarios?.length || 0);
        if (usuarios?.length > 0) {
            console.log('   Sample:', usuarios[0].email);
        }
    }

    // Test 2: Check inmuebles table
    console.log('\n2️⃣ Testing inmuebles table...');
    const { data: inmuebles, error: errorInmuebles } = await supabase
        .from('inmuebles')
        .select('*')
        .limit(5);
    
    if (errorInmuebles) {
        console.error('❌ Error inmuebles:', errorInmuebles.message);
        console.error('   Details:', errorInmuebles);
    } else {
        console.log('✅ Inmuebles found:', inmuebles?.length || 0);
    }

    // Test 3: Check with joins (like the API does)
    console.log('\n3️⃣ Testing inmuebles with joins...');
    const { data: inmueblesJoin, error: errorJoin } = await supabase
        .from('inmuebles')
        .select(`
            *,
            usuarios (nombre, email, telefono),
            ubicaciones (*),
            servicios_publicos (*),
            fotografias (*)
        `)
        .limit(5);
    
    if (errorJoin) {
        console.error('❌ Error with joins:', errorJoin.message);
        console.error('   Code:', errorJoin.code);
        console.error('   Details:', errorJoin.details);
        console.error('   Hint:', errorJoin.hint);
    } else {
        console.log('✅ Inmuebles with joins found:', inmueblesJoin?.length || 0);
    }

    console.log('\n✅ Connection test complete!');
}

testConnection();
