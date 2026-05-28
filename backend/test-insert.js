import { supabase } from './src/config/supabase.js';

async function testInsert() {
    console.log('🧪 Probando inserción con diferentes valores...\n');

    // Probar diferentes valores para estado_conservacion
    const valoresProbar = ['bueno', 'excelente', 'regular', 'malo', 'nuevo', 'remodelado'];
    
    for (const valor of valoresProbar) {
        console.log(`\n🧪 Probando estado_conservacion: "${valor}"`);
        
        const testData = {
            id_usuario: 1,
            valor: 100000,
            estrato: 3,
            descripcion: 'Test',
            numero_matricula: `TEST-${Date.now()}`,
            tipo_operacion: 'venta',
            tipo_inmueble: 'casa',
            estado_inmueble: 'nuevo',
            zona: 'urbano',
            estado_conservacion: valor
        };

        const { data, error } = await supabase
            .from('inmuebles')
            .insert([testData])
            .select();

        if (error) {
            console.log(`   ❌ "${valor}" NO es válido:`, error.message);
        } else {
            console.log(`   ✅ "${valor}" ES VÁLIDO`);
            // Eliminar el registro de prueba
            await supabase
                .from('inmuebles')
                .delete()
                .eq('id_inmueble', data[0].id_inmueble);
        }
    }
    
    return;


}

testInsert();
