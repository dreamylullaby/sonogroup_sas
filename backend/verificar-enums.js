import { supabase } from './src/config/supabase.js';

async function verificarEnums() {
    console.log('🔍 Verificando valores ENUM de la base de datos...\n');

    try {
        // Intentar insertar con diferentes valores para ver cuáles son válidos
        console.log('📋 Valores comunes para estado_inmueble:');
        console.log('   - nuevo');
        console.log('   - usado');
        console.log('   - remodelado');
        console.log('   - en construcción');
        console.log('   - disponible');
        console.log('   - vendido');
        console.log('   - reservado\n');

        // Obtener un registro existente para ver qué valores tiene
        const { data, error } = await supabase
            .from('inmuebles')
            .select('estado_inmueble, tipo_operacion, tipo_inmueble, zona')
            .limit(5);

        if (error) {
            console.error('❌ Error:', error.message);
            return;
        }

        if (data && data.length > 0) {
            console.log('✅ Valores actuales en la base de datos:');
            console.log('─'.repeat(70));
            
            const estados = new Set();
            const operaciones = new Set();
            const tipos = new Set();
            const zonas = new Set();

            data.forEach(item => {
                if (item.estado_inmueble) estados.add(item.estado_inmueble);
                if (item.tipo_operacion) operaciones.add(item.tipo_operacion);
                if (item.tipo_inmueble) tipos.add(item.tipo_inmueble);
                if (item.zona) zonas.add(item.zona);
            });

            console.log('\n📌 estado_inmueble:');
            estados.forEach(e => console.log(`   - ${e}`));

            console.log('\n📌 tipo_operacion:');
            operaciones.forEach(e => console.log(`   - ${e}`));

            console.log('\n📌 tipo_inmueble:');
            tipos.forEach(e => console.log(`   - ${e}`));

            console.log('\n📌 zona:');
            zonas.forEach(e => console.log(`   - ${e}`));
        } else {
            console.log('⚠️  No hay registros en la tabla inmuebles');
        }

        console.log('\n💡 Recomendación:');
        console.log('   Usa los valores que aparecen arriba en tu formulario');
        console.log('   para evitar errores de ENUM.\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

verificarEnums();
