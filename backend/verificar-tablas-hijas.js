import { supabase } from './src/config/supabase.js';

async function verificarTablasHijas() {
    console.log('🔍 Verificando estructura de tablas hijas...\n');

    const tablas = ['casas', 'apartamentos', 'locales', 'bodegas', 'fincas', 'apartaestudios'];

    for (const tabla of tablas) {
        try {
            console.log(`\n📋 Tabla: ${tabla.toUpperCase()}`);
            console.log('─'.repeat(70));

            const { data, error } = await supabase
                .from(tabla)
                .select('*')
                .limit(1);

            if (error) {
                console.log(`   ⚠️  Error: ${error.message}`);
                continue;
            }

            if (data && data.length > 0) {
                console.log('   ✅ Campos disponibles:');
                Object.keys(data[0]).forEach(campo => {
                    const valor = data[0][campo];
                    const tipo = typeof valor;
                    console.log(`      - ${campo}: ${tipo}`);
                });
            } else {
                console.log('   ⚠️  No hay registros. Intentando obtener estructura...');
                
                // Intentar con una consulta de información del esquema
                const { data: columns, error: schemaError } = await supabase
                    .rpc('get_table_columns', { table_name: tabla })
                    .select();

                if (!schemaError && columns) {
                    console.log('   📊 Estructura de la tabla:');
                    columns.forEach(col => {
                        console.log(`      - ${col.column_name}: ${col.data_type}`);
                    });
                }
            }
        } catch (error) {
            console.log(`   ❌ Error al consultar ${tabla}: ${error.message}`);
        }
    }

    console.log('\n\n📊 RESUMEN DE ARQUITECTURA');
    console.log('═'.repeat(70));
    console.log(`
La base de datos usa una arquitectura de herencia:

inmuebles (tabla padre)
├── Campos comunes: id_inmueble, id_usuario, valor, tipo_inmueble, etc.
│
├── casas (tabla hija)
│   └── Campos específicos: pisos, patio, jardin, parqueadero, etc.
│
├── apartamentos (tabla hija)
│   └── Campos específicos: piso_ubicacion, ascensor, balcon, etc.
│
├── locales (tabla hija)
│   └── Campos específicos: zona_local, tipo_local, etc.
│
├── bodegas (tabla hija)
│   └── Campos específicos: altura_bodega, tipo_bodega, etc.
│
├── fincas (tabla hija)
│   └── Campos específicos: hectareas, tipo_finca, etc.
│
└── apartaestudios (tabla hija)
    └── Campos específicos: amoblado, cocina_integral, etc.

Cada tipo de propiedad tiene características únicas en su tabla hija.
    `);
}

verificarTablasHijas();
