# 🧪 GUÍA COMPLETA DE TESTING - FASE 5

## Estado Actual del Proyecto
- ✅ Backend: Express.js + SQLite (Puerto 3001)
- ✅ Frontend: React + Vite (Puerto 5173) 
- ✅ Autenticación: JWT
- ✅ Roles: ADMIN, SUPERVISOR, OPERARIO
- ✅ Funcionalidades: Usuarios, Nómina, Servicios, Tareas, Dashboards

---

## 📋 CHECKLIST DE PRUEBA

### 1️⃣ VERIFICACIÓN DE SERVIDORES
```
Backend: http://localhost:3001
Frontend: http://localhost:5173
```

- [ ] Backend corriendo sin errores
- [ ] Frontend compilado y cargando

---

### 2️⃣ TEST DE AUTENTICACIÓN

**Admin (Usuario por defecto):**
- Username: `admin`
- Password: `admin123`

**Pasos:**
1. Abre http://localhost:5173
2. Login con admin/admin123
3. Verifica que redirija a `/admin/dashboard`
4. Verifica que aparezca en el navbar "Panel Admin"

✅ Si funciona → Login correcto

---

### 3️⃣ TEST COMPLETO: SUPERVISOR CREA TAREA → OPERARIO LA COMPLETA

#### **Parte A: Admin crea Supervisor y Operario**

1. **Login como Admin**
   - Usuario: `admin`
   - Contraseña: `admin123`

2. **Ir a: Usuarios → Crear nuevo usuario**
   - Nombre: `Juan Pérez`
   - Username: `juan_supervisor`
   - Contraseña: `pass123`
   - Rol: `SUPERVISOR`
   - ➜ Crear
2. **(Opcional) Eliminar un usuario de prueba**
   - Haz clic en el botón **Eliminar** junto a un usuario
   - Confirma en el modal
   - ✅ El usuario desaparece de la lista (si tenía tareas asociadas también serán borradas)
3. **Crear otro usuario (Operario)**
   - Nombre: `Carlos López`
   - Username: `carlos_op`
   - Contraseña: `pass123`
   - Rol: `OPERARIO`
   - ➜ Crear

✅ Ambos creados correctamente

---

#### **Parte B: Admin asigna Operario a Supervisor**

1. **Ir a: Nómina**
2. **Buscar Supervisor:** `Juan Pérez`
3. **Asignar Operario:** `Carlos López`
4. **Guardar**

✅ Relación creada

---

#### **Parte C: Admin asigna Servicios**

1. **Ir a: Servicios** (si no existen, crearlos)
   - Ejemplo: "Limpiar" (activo)
   - Ejemplo: "Pintar" (activo)

2. **Ir a: Servicios Admin**
3. **Asignar Servicio a Supervisor:** `Juan Pérez`
   - Seleccionar: "Limpiar" y "Pintar"
   - Guardar

✅ Servicios asignados

---

#### **Parte D: Supervisor crea Tarea**

1. **Logout Admin**
2. **Login como Supervisor**
   - Username: `juan_supervisor`
   - Contraseña: `pass123`

3. **Ir a: Mis Tareas → + Nueva tarea**
4. **Llenar formulario:**
   - Operario: `Carlos López`
   - Servicio: `Limpiar`
   - Título: `Limpiar oficina`
   - Descripción: `Barrer y trapear`
   - Fecha vencimiento: `2026-02-28`
   - Crear

✅ Tarea creada

5. **Verifica en Dashboard Supervisor:**
   - Debe mostrar: 1 Operario, 1 Tarea Total, 0 Completadas, 1 Pendiente

---

#### **Parte E: Operario ve y completa Tarea**

1. **Logout Supervisor**
2. **Login como Operario**
   - Username: `carlos_op`
   - Contraseña: `pass123`

3. **Al ingresar deberías ver un toast** con el texto de la nueva tarea asignada. Si hay varias notificaciones se concatenan.

4. Continúa a "Mis tareas" para confirmar la presencia de la tarea.

3. **Ir a: Mis tareas**
   - Debe aparecer la tarea: "Limpiar oficina"
   - Estado: PENDIENTE

4. **Click en: Marcar completada**
   - Debe cambiar a COMPLETADA

5. **Cambia el filtro a "Realizadas"**
   - Debe aparecer la tarea

✅ Tarea completada correctamente

6. **Verifica en Dashboard Operario:**
   - Debe mostrar: 1 Tarea Total, 1 Completada, 0 Pendientes
   - Progreso: 100%

---

#### **Parte F: Supervisor ve Tarea Completada**

1. **Logout Operario**
2. **Login como Supervisor**

3. **Ir a: Mis Tareas → Filtro: Hechas**
   - Debe aparecer: "Limpiar oficina" con estado COMPLETADA

4. **Dashboard Supervisor debe mostrar:**
   - 1 Tarea Total
   - 1 Completada
   - 0 Pendientes
   - Progreso: 100%

✅ Flujo completo funciona

---

### 4️⃣ TEST DE DASHBOARDS

**Admin Dashboard:**
- [ ] Muestra total de usuarios (3: tu admin + supervisor + operario)
- [ ] Muestra supervisores (1)
- [ ] Muestra operarios (1)
- [ ] Muestra servicios (2: Limpiar, Pintar)
- [ ] Muestra tareas (total, completadas, pendientes)
- [ ] Muestra % de completación (100% en este caso)

**Supervisor Dashboard:**
- [ ] Muestra operarios asignados (1)
- [ ] Muestra tareas totales (1)
- [ ] Muestra completadas (1)
- [ ] Muestra pendientes (0)
- [ ] Muestra % de completación (100%)
- [ ] Última tarea en listado

**Operario Dashboard:**
- [ ] Muestra tareas (1)
- [ ] Muestra completadas (1)
- [ ] Muestra pendientes (0)
- [ ] Muestra % de progreso (100%)
- [ ] Tarea aparece en listado

---

### 5️⃣ TEST DE EDGE CASES

**Escenario 1: Supervisor intenta asignar operario que no está en nómina**
- [ ] Debe mostrar error: "Operario no está en tu nómina"

**Escenario 2: Supervisor intenta crear tarea sin completar campos**
- [ ] Debe mostrar error: "Todos los campos son requeridos"

**Escenario 3: Operario intenta acceder a tarea de otro operario**
- [ ] No debe poder verla / accederla

**Escenario 4: Operario intenta marcar tarea de otro como completada**
- [ ] Backend debe rechazar (403 Forbidden)

**Escenario 5: Supervisor intenta editar tarea completada**
- [ ] No debe mostrar botón Editar
- [ ] No debe permitir modificación

---

## 📊 MÉTRICAS ESPERADAS

| Componente | Estado Esperado |
|-----------|-----------------|
| Login | ✅ Funciona |
| Crear Usuarios | ✅ Funciona |
| Asignar Nómina | ✅ Funciona |
| Asignar Servicios | ✅ Funciona |
| Crear Tareas | ✅ Funciona |
| Completar Tareas | ✅ Funciona |
| Ver Dashboards | ✅ Funciona |
| Validaciones | ✅ Funciona |
| Manejo de Errores | ✅ Funciona |

---

## 🚀 PRÓXIMOS PASOS (POST MVP)

1. **Mejoras UI/UX:**
   - Animaciones en transiciones
   - Tooltips informativos
   - Responsive design mejorado

2. **Funcionalidades Adicionales:**
   - Exportar reportes (CSV/PDF)
   - Notificaciones
   - Historial de cambios
   - Edición de tareas completadas (solo para auditoría)

3. **Seguridad:**
   - Rate limiting
   - CSRF protection
   - Validación de entrada más estricta

4. **Performance:**
   - Caché en Frontend
   - Paginación de tareas
   - Índices en DB

---

## ⚠️ NOTAS IMPORTANTES

- Todos los usuarios nuevos heredan los settings del admin
- Las tareas no se pueden editar una vez completadas
- Un operario solo ve sus tareas asignadas
- Un supervisor solo puede asignar operarios de su nómina

---

**Estado Final del Proyecto:** ✅ LISTO PARA PRODUCCIÓN (MVP)

