// Script de prueba para actualizar un inmueble
// Ejecutar con: node test-update-inmueble.js

const axios = require('axios');

const testData = {
  valor: 1000000,
  estrato: 4,
  descripcion: "Casa bonita en punta cana",
  numero_matricula: "MAT-1764821111761",
  tipo_operacion: "venta",
  tipo_inmueble: "casa",
  estado_inmueble: "remodelado",
  zona: "urbano",
  estado_conservacion: "remodelado",
  ubicacion: {
    direccion: "zona centro-occidental, dentro de la Comuna 11",
    barrio_vereda: "Los Laureles",
    municipio: "Medellin",
    departamento: "Colombia",
    tipo_via: "Calle"
  },
  servicios: {
    acueducto: true,
    energia: true,
    alcantarillado: true,
    gas: true,
    internet: true
  },
  caracteristicas: {
    area_frente: 10,
    area_fondo: 10,
    metros_cuadrados: 1000,
    anos_construccion: 2,
    pisos: 2,
    habitaciones: 2,
    banos: 2,
    sala_comedor: "sala-comedor",
    cocina: "integral",
    zona_lavado: "interna",
    parqueadero: "cubierto",
    patio: true,
    jardin: true,
    balcon: true,
    descripcion_acabados: "excelente"
  }
};

async function testUpdate() {
  try {
    console.log('🧪 Probando actualización de inmueble...');
    console.log('📤 Datos a enviar:', JSON.stringify(testData, null, 2));
    
    // Nota: Necesitas reemplazar el token con uno válido
    const token = 'TU_TOKEN_AQUI';
    
    const response = await axios.put('http://localhost:5000/api/inmuebles/14', testData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Respuesta exitosa:', response.data);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testUpdate();
