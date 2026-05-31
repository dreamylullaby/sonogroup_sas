import bcrypt from 'bcryptjs';
import { supabase } from './src/config/supabase.js';
import dotenv from 'dotenv';

dotenv.config();

const crearAdmin = async () => {
    try {
        console.log('🔧 Creando usuario administrador...\n');

        const adminData = {
            nombre: 'Administrador',
            email: 'admin@inmuebles.com',
            telefono: '1234567890',
            password: 'admin123',
            rol: 'admin',
            tipo_identificacion: 'CC',
            numero_identificacion: '1000000000'
        };

        // Verificar si ya existe
        const { data: existente } = await supabase
            .from('usuarios')
            .select('email')
            .eq('email', adminData.email)
            .single();

        if (existente) {
            console.log('⚠️  El usuario administrador ya existe');
            console.log('📧 Email:', adminData.email);
            console.log('🔑 Password: admin123\n');
            return;
        }

        // Hash del password
        const password_hash = await bcrypt.hash(adminData.password, 10);

        // Insertar usuario
        const { data, error } = await supabase
            .from('usuarios')
            .insert([{
                nombre_completo: adminData.nombre,
                email: adminData.email,
                telefono: adminData.telefono,
                password_hash,
                rol: adminData.rol,
                tipo_identificacion: adminData.tipo_identificacion,
                numero_identificacion: adminData.numero_identificacion,
                mayor_de_edad: true
            }])
            .select()
            .single();

        if (error) throw error;

        console.log('✅ Usuario administrador creado exitosamente!\n');
        console.log('📧 Email:', adminData.email);
        console.log('🔑 Password:', adminData.password);
        console.log('👤 Rol:', data.rol);
        console.log('\n🌐 Puedes iniciar sesión en: http://localhost:5173/login\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
};

crearAdmin();
